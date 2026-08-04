import { prisma } from '../../../lib/prisma';
import { getUserFromRequest } from '../../../lib/auth';
import { CART_COOKIE } from '../../../lib/session';
import { getCartSummary } from '../../../lib/cart';
import { ok, fail } from '../../../lib/respond';

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return fail(401, 'Please log in to check out.');
  }

  const sessionId = request.cookies.get(CART_COOKIE)?.value;
  if (!sessionId) {
    return fail(400, 'Missing cart session.');
  }

  const cart = await getCartSummary(prisma, sessionId);
  if (cart.items.length === 0) {
    return fail(400, 'Your cart is empty.');
  }

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          user_id: user.id,
          subtotal: cart.subtotal,
          shipping_fee: cart.shippingFee,
          tax: cart.tax,
          total: cart.total,
          status: 'paid',
        },
        select: { id: true },
      });

      for (const item of cart.items) {
        const unitPrice = item.sale_price != null ? item.sale_price : item.price;
        await tx.order_items.create({
          data: {
            order_id: order.id,
            product_id: item.product_id,
            name: item.name,
            unit_price: unitPrice,
            quantity: item.quantity,
          },
        });
        await tx.$executeRaw`UPDATE products SET stock = GREATEST(stock - ${item.quantity}, 0) WHERE id = ${item.product_id}`;
      }

      await tx.cart_items.deleteMany({ where: { session_id: sessionId } });

      return order.id;
    });

    return ok({ message: 'Order placed successfully!', orderId });
  } catch (err) {
    return fail(500, 'Checkout failed. Please try again.', err);
  }
}

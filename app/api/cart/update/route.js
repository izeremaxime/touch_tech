import { prisma } from '../../../../lib/prisma';
import { CART_COOKIE } from '../../../../lib/session';
import { getCartSummary } from '../../../../lib/cart';
import { ok, fail } from '../../../../lib/respond';

export async function POST(request) {
  const sessionId = request.cookies.get(CART_COOKIE)?.value;
  if (!sessionId) return fail(400, 'Missing cart session.');

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const productId = Number(body.productId);
  const quantity = Number(body.quantity);
  if (!productId || productId <= 0 || Number.isNaN(quantity)) {
    return fail(400, 'Invalid parameters.');
  }

  try {
    if (quantity < 1) {
      await prisma.cart_items.deleteMany({ where: { session_id: sessionId, product_id: productId } });
    } else {
      const product = await prisma.products.findUnique({ where: { id: productId }, select: { stock: true } });
      const stock = product?.stock ?? 0;
      const clamped = Math.min(quantity, stock);
      await prisma.cart_items.updateMany({
        where: { session_id: sessionId, product_id: productId },
        data: { quantity: clamped },
      });
    }

    const cart = await getCartSummary(prisma, sessionId);
    return ok({ message: 'Cart updated.', cart });
  } catch (err) {
    return fail(500, 'Could not update cart.', err);
  }
}

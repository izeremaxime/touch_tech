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
  const quantity = Number(body.quantity) || 1;
  if (!productId || productId <= 0) {
    return fail(400, 'Invalid product ID.');
  }

  try {
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true },
    });
    if (!product) return fail(404, 'Product not found.');

    const existing = await prisma.cart_items.findFirst({
      where: { session_id: sessionId, product_id: productId },
      select: { id: true, quantity: true },
    });

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      await prisma.cart_items.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      const newQty = Math.min(quantity, Math.max(product.stock, 0));
      await prisma.cart_items.create({
        data: { session_id: sessionId, product_id: productId, quantity: newQty || 1 },
      });
    }

    const cart = await getCartSummary(prisma, sessionId);
    return ok({ message: 'Product added to cart!', cart });
  } catch (err) {
    return fail(500, 'Could not add product to cart.', err);
  }
}

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
  if (!productId || productId <= 0) {
    return fail(400, 'Invalid product ID.');
  }

  try {
    await prisma.cart_items.deleteMany({ where: { session_id: sessionId, product_id: productId } });
    const cart = await getCartSummary(prisma, sessionId);
    return ok({ message: 'Product removed from cart.', cart });
  } catch (err) {
    return fail(500, 'Could not remove product from cart.', err);
  }
}

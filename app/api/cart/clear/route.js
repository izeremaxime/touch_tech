import { prisma } from '../../../../lib/prisma';
import { CART_COOKIE } from '../../../../lib/session';
import { ok, fail } from '../../../../lib/respond';

export async function POST(request) {
  const sessionId = request.cookies.get(CART_COOKIE)?.value;
  if (!sessionId) return fail(400, 'Missing cart session.');

  try {
    await prisma.cart_items.deleteMany({ where: { session_id: sessionId } });
    return ok({
      message: 'Shopping cart cleared.',
      cart: { items: [], count: 0, subtotal: 0, shippingFee: 0, tax: 0, total: 0 },
    });
  } catch (err) {
    return fail(500, 'Could not clear cart.', err);
  }
}

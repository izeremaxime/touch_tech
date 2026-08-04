import { prisma } from '../../../lib/prisma';
import { CART_COOKIE } from '../../../lib/session';
import { getCartSummary } from '../../../lib/cart';
import { ok, fail } from '../../../lib/respond';

export async function GET(request) {
  const sessionId = request.cookies.get(CART_COOKIE)?.value;
  if (!sessionId) {
    return ok({ cart: { items: [], count: 0, subtotal: 0, shippingFee: 0, tax: 0, total: 0 } });
  }

  try {
    const cart = await getCartSummary(prisma, sessionId);
    return ok({ cart });
  } catch (err) {
    return fail(500, 'Could not load cart.', err);
  }
}

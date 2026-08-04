import { prisma } from '../../../lib/prisma';
import { getUserFromRequest } from '../../../lib/auth';
import { ok, fail } from '../../../lib/respond';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return fail(401, 'Please log in to view your orders.');
  }

  try {
    const orders = await prisma.orders.findMany({
      where: { user_id: user.id },
      select: { id: true, subtotal: true, shipping_fee: true, tax: true, total: true, status: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return ok({ orders });
  } catch (err) {
    return fail(500, 'Could not load orders.', err);
  }
}

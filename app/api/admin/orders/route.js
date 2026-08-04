import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';
import { ok, fail } from '../../../../lib/respond';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const orders = await prisma.orders.findMany({
      where: status ? { status } : undefined,
      include: { users: { select: { username: true } } },
      orderBy: { created_at: 'desc' },
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      subtotal: o.subtotal,
      shipping_fee: o.shipping_fee,
      tax: o.tax,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
      username: o.users.username,
    }));

    return ok({ orders: mapped });
  } catch (err) {
    return fail(500, 'Could not load orders.', err);
  }
}

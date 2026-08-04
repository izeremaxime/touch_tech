import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';
import { ok, fail } from '../../../../lib/respond';

export async function GET(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) {
    return fail(401, 'Please log in to view this order.');
  }

  const orderId = Number(params.id);
  if (!orderId) return fail(400, 'Invalid order id.');

  try {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { id: true, user_id: true, subtotal: true, shipping_fee: true, tax: true, total: true, status: true, created_at: true },
    });
    if (!order || (order.user_id !== user.id && user.role !== 'admin')) {
      return fail(404, 'Order not found.');
    }

    const items = await prisma.order_items.findMany({
      where: { order_id: orderId },
      select: { product_id: true, name: true, unit_price: true, quantity: true },
    });

    return ok({ order: { ...order, items } });
  } catch (err) {
    return fail(500, 'Could not load order.', err);
  }
}

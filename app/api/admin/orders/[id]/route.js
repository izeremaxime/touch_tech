import { prisma } from '../../../../../lib/prisma';
import { getUserFromRequest } from '../../../../../lib/auth';
import { ok, fail } from '../../../../../lib/respond';

const ALLOWED_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];

class OrderNotFoundError extends Error {}

export async function PUT(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  const orderId = Number(params.id);
  if (!orderId) return fail(400, 'Invalid order id.');

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const status = body.status;
  if (!ALLOWED_STATUSES.includes(status)) {
    return fail(400, `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { id: orderId }, select: { id: true, status: true } });
      if (!order) {
        throw new OrderNotFoundError();
      }

      // Restock items if the order is being cancelled for the first time.
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const items = await tx.order_items.findMany({
          where: { order_id: orderId },
          select: { product_id: true, quantity: true },
        });
        for (const item of items) {
          await tx.products.update({ where: { id: item.product_id }, data: { stock: { increment: item.quantity } } });
        }
      }

      await tx.orders.update({ where: { id: orderId }, data: { status } });
    });

    return ok({ message: 'Order status updated.', status });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return fail(404, 'Order not found.');
    }
    return fail(500, 'Could not update order status.', err);
  }
}

import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';
import { getSettings, updateSettings } from '../../../../lib/settings';
import { ok, fail } from '../../../../lib/respond';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  try {
    const settings = await getSettings(prisma);
    return ok({ settings });
  } catch (err) {
    return fail(500, 'Could not load settings.', err);
  }
}

export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request body.');
  }

  const taxRate = Number(body.taxRate);
  const freeShippingThreshold = Number(body.freeShippingThreshold);
  const shippingFee = Number(body.shippingFee);
  const lowStockThreshold = Number(body.lowStockThreshold);

  if (!(taxRate >= 0 && taxRate <= 1)) {
    return fail(400, 'Tax rate must be between 0 and 1 (e.g. 0.08 for 8%).');
  }
  if (!(freeShippingThreshold >= 0)) {
    return fail(400, 'Free shipping threshold must be a positive number.');
  }
  if (!(shippingFee >= 0)) {
    return fail(400, 'Shipping fee must be a positive number.');
  }
  if (!(Number.isInteger(lowStockThreshold) && lowStockThreshold >= 0)) {
    return fail(400, 'Low stock threshold must be a positive whole number.');
  }

  try {
    await updateSettings(prisma, {
      tax_rate: taxRate,
      free_shipping_threshold: freeShippingThreshold,
      shipping_fee: shippingFee,
      low_stock_threshold: lowStockThreshold,
    });
    const settings = await getSettings(prisma);
    return ok({ message: 'Settings updated successfully.', settings });
  } catch (err) {
    return fail(500, 'Could not update settings.', err);
  }
}

import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';
import { getSettings } from '../../../../lib/settings';
import { ok, fail } from '../../../../lib/respond';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  try {
    const rows = await prisma.products.findMany({ select: { stock: true, category: true } });
    const { lowStockThreshold } = await getSettings(prisma);

    const totalProducts = rows.length;
    const lowStockCount = rows.filter((r) => r.stock <= lowStockThreshold).length;
    const activeListings = rows.filter((r) => r.stock > 0).length;
    const totalCategories = new Set(rows.map((r) => r.category)).size;

    return ok({ stats: { totalProducts, lowStockCount, activeListings, totalCategories, lowStockThreshold } });
  } catch (err) {
    return fail(500, 'Could not load dashboard stats.', err);
  }
}

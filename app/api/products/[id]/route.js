import { prisma } from '../../../../lib/prisma';
import { ok, fail } from '../../../../lib/respond';

function serialize(row) {
  let specs = {};
  try {
    specs = JSON.parse(row.specs || '{}');
  } catch {
    specs = {};
  }
  return { ...row, specs };
}

export async function GET(_request, { params }) {
  const id = Number(params.id);
  if (!id) {
    return fail(400, 'Invalid product id.');
  }

  try {
    const product = await prisma.products.findUnique({ where: { id } });
    if (!product) {
      return fail(404, 'Product not found.');
    }

    // Prefer same-category picks (by rating), then fill any remaining slots with the best-rated others.
    const sameCategory = await prisma.products.findMany({
      where: { id: { not: product.id }, category: product.category },
      orderBy: { rating: 'desc' },
      take: 4,
    });
    let related = sameCategory;
    if (related.length < 4) {
      const excludeIds = [product.id, ...related.map((r) => r.id)];
      const fillers = await prisma.products.findMany({
        where: { id: { notIn: excludeIds } },
        orderBy: { rating: 'desc' },
        take: 4 - related.length,
      });
      related = [...related, ...fillers];
    }

    return ok({ product: serialize(product), related: related.map(serialize) });
  } catch (err) {
    return fail(500, 'Could not load product.', err);
  }
}

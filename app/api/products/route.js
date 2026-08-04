import { prisma } from '../../../lib/prisma';
import { ok, fail } from '../../../lib/respond';

function serialize(row) {
  let specs = {};
  try {
    specs = JSON.parse(row.specs || '{}');
  } catch {
    specs = {};
  }
  return { ...row, specs };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  try {
    const products = q
      ? await prisma.products.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
            ],
          },
          orderBy: { id: 'desc' },
        })
      : await prisma.products.findMany({ orderBy: { id: 'desc' } });

    return ok({ products: products.map(serialize) });
  } catch (err) {
    return fail(500, 'Could not load products.', err);
  }
}

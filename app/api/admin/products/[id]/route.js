import { prisma } from '../../../../../lib/prisma';
import { getUserFromRequest } from '../../../../../lib/auth';
import { saveUploadedImage, deleteUploadedImage } from '../../../../../lib/upload';
import { ok, fail } from '../../../../../lib/respond';

function buildSpecs(formData) {
  const specs = {};
  for (const key of ['Material', 'Compatibility', 'Weight']) {
    const val = (formData.get(`specs[${key}]`) || '').toString().trim();
    if (val) specs[key] = val;
  }
  const customKey = (formData.get('custom_spec_key') || '').toString().trim();
  const customVal = (formData.get('custom_spec_val') || '').toString().trim();
  if (customKey && customVal) specs[customKey] = customVal;
  return specs;
}

export async function PUT(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  const id = Number(params.id);
  if (!id) return fail(400, 'Invalid product id.');

  const existing = await prisma.products.findUnique({ where: { id }, select: { image: true } });
  if (!existing) return fail(404, 'Product not found.');

  const formData = await request.formData();

  const name = (formData.get('name') || '').toString().trim();
  const sku = (formData.get('sku') || '').toString().trim();
  const category = (formData.get('category') || '').toString().trim();
  const price = parseFloat(formData.get('price'));
  const salePriceRaw = formData.get('sale_price');
  const salePrice = salePriceRaw && salePriceRaw !== '' ? parseFloat(salePriceRaw) : null;
  const stock = parseInt(formData.get('stock'), 10);
  const description = (formData.get('description') || '').toString().trim();

  if (!name || !sku || !category || !(price > 0) || !(stock >= 0) || !description) {
    return fail(400, 'Please fill in all required fields with valid values.');
  }
  if (salePrice !== null && salePrice >= price) {
    return fail(400, 'Sale price must be strictly less than the regular price.');
  }

  try {
    const dupeCount = await prisma.products.count({ where: { sku, NOT: { id } } });
    if (dupeCount > 0) {
      return fail(409, 'A product with this SKU code already exists.');
    }

    let imagePath = existing.image;
    const file = formData.get('image');
    if (file && typeof file === 'object' && file.size > 0) {
      try {
        imagePath = await saveUploadedImage(file);
      } catch (err) {
        return fail(400, err.message);
      }
      await deleteUploadedImage(existing.image);
    }

    const specsJson = JSON.stringify(buildSpecs(formData));

    await prisma.products.update({
      where: { id },
      data: { name, sku, category, price, sale_price: salePrice, stock, description, image: imagePath, specs: specsJson },
    });

    return ok({ message: 'Product updated successfully.' });
  } catch (err) {
    return fail(500, 'Could not update product.', err);
  }
}

export async function DELETE(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

  const id = Number(params.id);
  if (!id) return fail(400, 'Invalid product id.');

  try {
    const existing = await prisma.products.findUnique({ where: { id }, select: { image: true } });
    const image = existing?.image;

    await prisma.products.delete({ where: { id } });
    await deleteUploadedImage(image);

    return ok({ message: 'Product deleted successfully.' });
  } catch (err) {
    return fail(500, 'Failed to delete product.', err);
  }
}

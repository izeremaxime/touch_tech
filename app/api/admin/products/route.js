import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/auth';
import { saveUploadedImage } from '../../../../lib/upload';
import { sendNewProductAnnouncement } from '../../../../lib/mailer';
import { ok, fail } from '../../../../lib/respond';

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

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return fail(403, 'Admin access required.');
  }

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
    const dupeCount = await prisma.products.count({ where: { sku } });
    if (dupeCount > 0) {
      return fail(409, 'A product with this SKU code already exists.');
    }

    let imagePath = '/assets/images/product-case.svg';
    const file = formData.get('image');
    if (file && typeof file === 'object' && file.size > 0) {
      try {
        imagePath = await saveUploadedImage(file);
      } catch (err) {
        return fail(400, err.message);
      }
    }

    const specsJson = JSON.stringify(buildSpecs(formData));

    const created = await prisma.products.create({
      data: { name, sku, category, price, sale_price: salePrice, stock, description, image: imagePath, specs: specsJson },
      select: { id: true },
    });
    const newProductId = created.id;

    // Notify registered members about the new product. Best-effort — a mail outage shouldn't block publishing.
    try {
      const members = await prisma.users.findMany({
        where: { role: { not: 'admin' }, email: { not: null } },
        select: { email: true },
      });
      await sendNewProductAnnouncement(members.map((m) => m.email), { id: newProductId, name });
    } catch (err) {
      console.error('[admin/products] Failed to send new product announcement:', err);
    }

    return ok({ message: 'Product published successfully.', id: newProductId });
  } catch (err) {
    return fail(500, 'Could not create product.', err);
  }
}

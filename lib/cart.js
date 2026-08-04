import { getSettings } from './settings';

export async function getCartSummary(prisma, sessionId) {
  const rows = await prisma.cart_items.findMany({
    where: { session_id: sessionId },
    orderBy: { created_at: 'desc' },
    include: { products: true },
  });

  const { taxRate, freeShippingThreshold, shippingFee: flatShippingFee } = await getSettings(prisma);

  let subtotal = 0;
  let count = 0;
  const items = rows.map((row) => {
    const p = row.products;
    const price = p.sale_price != null ? Number(p.sale_price) : Number(p.price);
    subtotal += price * row.quantity;
    count += row.quantity;
    return {
      product_id: row.product_id,
      quantity: row.quantity,
      name: p.name,
      price: p.price,
      sale_price: p.sale_price,
      image: p.image,
      stock: p.stock,
      category: p.category,
    };
  });

  const shippingFee = subtotal === 0 || subtotal > freeShippingThreshold ? 0 : flatShippingFee;
  const tax = subtotal * taxRate;
  const total = subtotal + shippingFee + tax;

  return {
    items,
    count,
    subtotal: round2(subtotal),
    shippingFee: round2(shippingFee),
    tax: round2(tax),
    total: round2(total),
    freeShippingThreshold,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

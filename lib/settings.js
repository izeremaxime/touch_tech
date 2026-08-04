const DEFAULTS = {
  tax_rate: '0.08',
  free_shipping_threshold: '150',
  shipping_fee: '15',
  low_stock_threshold: '10',
};

export async function getSettings(prisma) {
  const rows = await prisma.settings.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    taxRate: parseFloat(map.tax_rate ?? DEFAULTS.tax_rate),
    freeShippingThreshold: parseFloat(map.free_shipping_threshold ?? DEFAULTS.free_shipping_threshold),
    shippingFee: parseFloat(map.shipping_fee ?? DEFAULTS.shipping_fee),
    lowStockThreshold: parseInt(map.low_stock_threshold ?? DEFAULTS.low_stock_threshold, 10),
  };
}

const ALLOWED_KEYS = ['tax_rate', 'free_shipping_threshold', 'shipping_fee', 'low_stock_threshold'];

export async function updateSettings(prisma, updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED_KEYS.includes(key)) continue;
    await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
}

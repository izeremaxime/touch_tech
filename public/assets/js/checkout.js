document.addEventListener('tt:layout-ready', init);

async function init() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order');
  const container = document.getElementById('confirmation-content');

  if (!orderId) {
    container.innerHTML = '<p class="shop-empty">No order specified.</p>';
    return;
  }

  try {
    const { order } = await TT.get(`/api/orders/${orderId}`);
    const itemsHtml = order.items.map((item) => `
      <tr class="catalog-table__row">
        <td class="catalog-table__td">${TT.escapeHtml(item.name)}</td>
        <td class="catalog-table__td text-right">${item.quantity}</td>
        <td class="catalog-table__td text-right">${TT.formatPrice(item.unit_price)}</td>
        <td class="catalog-table__td text-right">${TT.formatPrice(item.unit_price * item.quantity)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="cart-empty-box" style="text-align: left; max-width: 720px;">
        <h2 style="text-align: center; margin-bottom: 8px;">Thank you for your order!</h2>
        <p style="text-align: center; margin-bottom: 24px;">Order <strong>#${order.id}</strong> was placed on ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
        <div class="table-wrap">
          <table class="catalog-table">
            <thead>
              <tr>
                <th class="catalog-table__th">Item</th>
                <th class="catalog-table__th text-right">Qty</th>
                <th class="catalog-table__th text-right">Unit Price</th>
                <th class="catalog-table__th text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px; max-width: 320px; margin-left: auto;">
          <div class="summary-row"><span>Subtotal</span><strong>${TT.formatPrice(order.subtotal)}</strong></div>
          <div class="summary-row"><span>Shipping</span><strong>${order.shipping_fee > 0 ? TT.formatPrice(order.shipping_fee) : 'FREE'}</strong></div>
          <div class="summary-row"><span>Tax</span><strong>${TT.formatPrice(order.tax)}</strong></div>
          <div class="summary-total"><span>Total</span><strong>${TT.formatPrice(order.total)}</strong></div>
        </div>
        <div style="text-align: center; margin-top: 28px;">
          <a href="/shop.html" class="btn btn--primary">Continue Shopping</a>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="shop-empty">${TT.escapeHtml(err.message)}</p>`;
  }
}

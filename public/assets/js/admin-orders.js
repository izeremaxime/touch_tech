document.addEventListener('tt:layout-ready', init);

const STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];

function statusBadgeClass(status) {
  if (status === 'delivered' || status === 'shipped') return 'badge--success';
  if (status === 'cancelled') return 'badge--danger';
  return 'badge--warning';
}

function orderRowHtml(order) {
  const options = STATUSES.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('');
  return `
    <tr class="catalog-table__row" data-order-id="${order.id}">
      <td class="catalog-table__td font-mono">ORD-${String(order.id).padStart(5, '0')}</td>
      <td class="catalog-table__td">${TT.escapeHtml(order.username)}</td>
      <td class="catalog-table__td">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
      <td class="catalog-table__td text-right font-weight-semibold">${TT.formatPrice(order.total)}</td>
      <td class="catalog-table__td">
        <select class="form-input form-select" style="padding: 6px 10px; font-size: 12.5px;" data-status-select>${options}</select>
      </td>
      <td class="catalog-table__td text-right">
        <button type="button" class="btn btn--outline" style="padding: 6px 14px; font-size: 12.5px;" data-toggle-items>View Items</button>
      </td>
    </tr>
    <tr class="catalog-table__row" data-items-row hidden>
      <td class="catalog-table__td" colspan="6" style="background-color: var(--color-cream);">
        <div data-items-content style="font-size: 13px; color: var(--color-text-light);">Loading…</div>
      </td>
    </tr>
  `;
}

function itemsTableHtml(order) {
  const rows = order.items.map((item) => `
    <tr class="catalog-table__row">
      <td class="catalog-table__td">${TT.escapeHtml(item.name)}</td>
      <td class="catalog-table__td text-right">${item.quantity}</td>
      <td class="catalog-table__td text-right">${TT.formatPrice(item.unit_price)}</td>
      <td class="catalog-table__td text-right">${TT.formatPrice(item.unit_price * item.quantity)}</td>
    </tr>
  `).join('');
  return `
    <table class="catalog-table">
      <thead><tr>
        <th class="catalog-table__th">Item</th><th class="catalog-table__th text-right">Qty</th>
        <th class="catalog-table__th text-right">Unit Price</th><th class="catalog-table__th text-right">Line Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function loadOrders() {
  const { orders } = await TT.get('/api/admin/orders');
  document.getElementById('orders-body').innerHTML = orders.length
    ? orders.map(orderRowHtml).join('')
    : '<tr><td colspan="6" style="text-align:center; padding:32px; color: var(--color-text-light);">No orders yet.</td></tr>';
  document.getElementById('orders-count').textContent = `Showing ${orders.length} orders`;
}

function wireEvents() {
  const alertBox = document.getElementById('orders-alert');
  const tbody = document.getElementById('orders-body');

  tbody.addEventListener('change', async (e) => {
    const select = e.target.closest('[data-status-select]');
    if (!select) return;
    const row = select.closest('tr');
    const orderId = row.getAttribute('data-order-id');
    try {
      await TT.put(`/api/admin/orders/${orderId}`, { status: select.value });
      TT.showAlert(alertBox, `Order ORD-${String(orderId).padStart(5, '0')} marked as ${select.value}.`, 'success');
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
      await loadOrders();
    }
  });

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-toggle-items]');
    if (!btn) return;
    const row = btn.closest('tr');
    const orderId = row.getAttribute('data-order-id');
    const itemsRow = row.nextElementSibling;
    const content = itemsRow.querySelector('[data-items-content]');

    const isHidden = itemsRow.hasAttribute('hidden');
    if (isHidden) {
      itemsRow.removeAttribute('hidden');
      btn.textContent = 'Hide Items';
      try {
        const { order } = await TT.get(`/api/orders/${orderId}`);
        content.innerHTML = itemsTableHtml(order);
      } catch (err) {
        content.textContent = err.message;
      }
    } else {
      itemsRow.setAttribute('hidden', '');
      btn.textContent = 'View Items';
    }
  });
}

async function init() {
  const user = await TT.refreshAuthState();
  if (!user || user.role !== 'admin') {
    window.location.href = '/account.html';
    return;
  }

  wireEvents();
  try {
    await loadOrders();
  } catch (err) {
    TT.showAlert(document.getElementById('orders-alert'), err.message, 'error');
  }
}

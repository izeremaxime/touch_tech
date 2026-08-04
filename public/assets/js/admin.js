document.addEventListener('tt:layout-ready', init);

function statusBadge(stock, lowStockThreshold) {
  if (stock === 0) return { cls: 'badge--danger', label: 'Out of Stock' };
  if (stock <= lowStockThreshold) return { cls: 'badge--warning', label: 'Low Stock' };
  return { cls: 'badge--success', label: 'In Stock' };
}

function productRowHtml(p, lowStockThreshold) {
  const status = statusBadge(p.stock, lowStockThreshold);
  const priceDisplay = p.sale_price != null ? p.sale_price : p.price;
  return `
    <tr class="catalog-table__row">
      <td class="catalog-table__td">
        <div class="catalog-product">
          <div class="catalog-product__image"><img src="${TT.escapeHtml(p.image)}" alt=""></div>
          <div>
            <p class="catalog-product__name">${TT.escapeHtml(p.name)}</p>
            <p class="catalog-product__id">ID: #${p.id}</p>
          </div>
        </div>
      </td>
      <td class="catalog-table__td">${TT.escapeHtml(TT.categoryLabel(p.category))}</td>
      <td class="catalog-table__td font-mono">${TT.escapeHtml(p.sku)}</td>
      <td class="catalog-table__td">
        <div class="catalog-price">
          <span class="catalog-price__active">${TT.formatPrice(priceDisplay)}</span>
          ${p.sale_price != null ? `<span class="catalog-price__old">${TT.formatPrice(p.price)}</span>` : ''}
        </div>
      </td>
      <td class="catalog-table__td">${p.stock} units</td>
      <td class="catalog-table__td"><span class="badge ${status.cls}">${status.label}</span></td>
      <td class="catalog-table__td text-right">
        <div class="catalog-actions">
          <a href="/admin-product.html?action=edit&id=${p.id}" class="catalog-btn catalog-btn--edit" aria-label="Edit product">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </a>
          <button type="button" class="catalog-btn catalog-btn--delete" data-delete="${p.id}" aria-label="Delete product">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

async function loadDashboard() {
  const [{ stats }, { products }] = await Promise.all([
    TT.get('/api/admin/stats'),
    TT.get('/api/products'),
  ]);

  document.getElementById('stat-total').textContent = stats.totalProducts;
  document.getElementById('stat-low-stock').textContent = stats.lowStockCount;
  document.getElementById('stat-active').textContent = stats.activeListings;
  document.getElementById('stat-categories').textContent = stats.totalCategories;

  const tbody = document.getElementById('catalog-body');
  tbody.innerHTML = products.length
    ? products.map((p) => productRowHtml(p, stats.lowStockThreshold)).join('')
    : '<tr><td colspan="7" style="text-align:center; padding:32px; color: var(--color-text-light);">No products found. Click "Add Product" to create one.</td></tr>';

  document.getElementById('catalog-count').textContent = `Showing ${products.length} entries`;
}

function wireDelete() {
  document.getElementById('catalog-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    const id = btn.getAttribute('data-delete');
    try {
      await TT.del(`/api/admin/products/${id}`);
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function init() {
  const user = await TT.refreshAuthState();
  if (!user || user.role !== 'admin') {
    window.location.href = '/account.html';
    return;
  }

  wireDelete();
  try {
    await loadDashboard();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('tt:layout-ready', init);

let allProducts = [];

function productCardHtml(product) {
  const badge = TT.computeBadge(product);
  const hasSale = product.sale_price != null && Number(product.sale_price) > 0;
  return `
    <article class="product-card product-card--shop" data-id="${product.id}">
      <div class="product-card__image-wrap">
        ${badge ? `<span class="product-card__badge product-card__badge--${badge.type}">${badge.badge}</span>` : ''}
        <button type="button" class="product-card__wishlist" aria-label="Add to wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <a href="/product.html?id=${product.id}">
          <img src="${TT.escapeHtml(product.image)}" alt="${TT.escapeHtml(product.name)}" class="product-card__image" loading="lazy">
        </a>
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${TT.escapeHtml(TT.categoryLabel(product.category))}</span>
        <h3 class="product-card__name"><a href="/product.html?id=${product.id}">${TT.escapeHtml(product.name)}</a></h3>
        <div class="product-card__price-row">
          ${hasSale
            ? `<span class="product-card__price product-card__price--sale">${TT.formatPrice(product.sale_price)}</span><span class="product-card__price product-card__price--original">${TT.formatPrice(product.price)}</span>`
            : `<span class="product-card__price">${TT.formatPrice(product.price)}</span>`}
        </div>
        <p class="product-card__desc">${TT.escapeHtml(product.description)}</p>
        ${TT.whatsAppButtonHtml(product)}
      </div>
    </article>
  `;
}

function getFilters() {
  const categories = [...document.querySelectorAll('input[name="category"]:checked')].map((el) => el.value);
  const priceMin = parseFloat(document.getElementById('price-min').value) || 0;
  const priceMax = parseFloat(document.getElementById('price-max').value) || Infinity;
  const ratingEl = document.querySelector('input[name="rating"]:checked');
  const rating = ratingEl ? Number(ratingEl.value) : 0;
  const sort = document.getElementById('shop-sort').value;
  return { categories, priceMin, priceMax, rating, sort };
}

function applyFilters() {
  const { categories, priceMin, priceMax, rating, sort } = getFilters();

  let filtered = allProducts.filter((p) => {
    const price = p.sale_price != null ? Number(p.sale_price) : Number(p.price);
    if (categories.length && !categories.includes(p.category)) return false;
    if (price < priceMin || price > priceMax) return false;
    if (rating && p.rating < rating) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const priceA = a.sale_price != null ? Number(a.sale_price) : Number(a.price);
    const priceB = b.sale_price != null ? Number(b.sale_price) : Number(b.price);
    switch (sort) {
      case 'price-asc': return priceA - priceB;
      case 'price-desc': return priceB - priceA;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'rating-desc': return b.rating - a.rating;
      default: return b.id - a.id;
    }
  });

  const grid = document.getElementById('product-grid');
  const empty = document.getElementById('shop-empty');
  const count = document.getElementById('shop-count');

  grid.innerHTML = filtered.map(productCardHtml).join('');
  empty.hidden = filtered.length > 0;
  count.textContent = `Showing ${filtered.length} items`;
}

function wireFilters() {
  document.querySelectorAll('input[name="category"], input[name="rating"], #price-min, #price-max, #shop-sort')
    .forEach((el) => el.addEventListener('input', applyFilters));

  document.getElementById('filter-clear').addEventListener('click', () => {
    document.querySelectorAll('input[name="category"]').forEach((el) => (el.checked = false));
    document.querySelectorAll('input[name="rating"]').forEach((el) => (el.checked = false));
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('shop-sort').value = 'featured';
    applyFilters();
  });

  const filtersBtn = document.getElementById('filters-mobile-btn');
  filtersBtn?.addEventListener('click', () => {
    const filters = document.getElementById('shop-filters');
    const isOpen = filters.classList.toggle('shop-filters--open');
    filtersBtn.setAttribute('aria-expanded', String(isOpen));
    filtersBtn.textContent = isOpen ? 'Hide Filters' : 'Filters';
    if (isOpen) filters.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function preselectFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  if (category) {
    const box = document.querySelector(`input[name="category"][value="${category}"]`);
    if (box) box.checked = true;
  }
}

async function init() {
  wireFilters();
  preselectFromQuery();

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';

  const grid = document.getElementById('product-grid');
  grid.innerHTML = '<p class="shop-empty">Loading products…</p>';

  try {
    const url = q ? `/api/products?q=${encodeURIComponent(q)}` : '/api/products';
    const { products } = await TT.get(url);
    allProducts = products;
    applyFilters();
  } catch (err) {
    grid.innerHTML = `<p class="shop-empty">${TT.escapeHtml(err.message)}</p>`;
  }
}

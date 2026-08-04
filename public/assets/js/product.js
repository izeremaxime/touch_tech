document.addEventListener('tt:layout-ready', init);

let currentProduct = null;

const REVIEWS = [
  { name: 'Alex Rivera', verified: true, rating: 5, date: 'July 08, 2026', title: 'Best protection I have purchased', text: 'This product exceeded my expectations. The quality feels premium, it fits perfectly, and the design accents are exactly what I was looking for. Worth every penny.', avatar: 'AR' },
  { name: 'Sarah Chen', verified: true, rating: 5, date: 'June 29, 2026', title: 'Perfect fit & sleek look', text: 'Extremely lightweight but still feels very robust. The color swatch matches my phone perfectly. Fast shipping as well. Highly recommend!', avatar: 'SC' },
  { name: 'Marcus Vance', verified: false, rating: 4, date: 'June 15, 2026', title: 'Excellent quality, slight markup', text: 'The product functions beautifully and specs are spot on. It is a bit premium-priced, but you get what you pay for in terms of durability and style.', avatar: 'MV' },
];

function starsHtml(rating, size = 18) {
  let out = '';
  for (let i = 1; i <= 5; i++) {
    out += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${i <= rating ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  return out;
}

function badgeInfo(product) {
  if (product.stock === 0) return { badge: 'OUT OF STOCK', type: 'sale' };
  if (product.sale_price != null && Number(product.sale_price) > 0) {
    const discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
    return { badge: `-${discount}%`, type: 'sale' };
  }
  if (product.rating === 5) return { badge: 'NEW RELEASE', type: 'new' };
  return null;
}

function renderProduct(product) {
  document.title = `${product.name} — Touch Techhub`;
  const badge = badgeInfo(product);
  const hasSale = product.sale_price != null && Number(product.sale_price) > 0;
  const catLabel = TT.categoryLabel(product.category);

  document.getElementById('breadcrumb-category').textContent = catLabel;
  document.getElementById('breadcrumb-category').href = `/shop.html?category=${product.category}`;
  document.getElementById('breadcrumb-name').textContent = product.name;

  document.getElementById('gallery-badge').outerHTML = badge
    ? `<span id="gallery-badge" class="product-gallery__badge product-gallery__badge--${badge.type}">${badge.badge}</span>`
    : '<span id="gallery-badge"></span>';
  document.getElementById('main-product-image').src = product.image;
  document.getElementById('main-product-image').alt = product.name;
  document.querySelectorAll('.product-gallery__thumb img').forEach((img) => (img.src = product.image));

  document.getElementById('product-cat').textContent = catLabel;
  document.getElementById('product-title').textContent = product.name;
  document.getElementById('product-stars').innerHTML = starsHtml(product.rating);
  document.getElementById('product-review-count').textContent = `(${product.review_count} reviews)`;

  document.getElementById('product-price-row').innerHTML = hasSale
    ? `<span class="product-info__price product-info__price--sale">${TT.formatPrice(product.sale_price)}</span><span class="product-info__price product-info__price--original">${TT.formatPrice(product.price)}</span>`
    : `<span class="product-info__price">${TT.formatPrice(product.price)}</span>`;

  document.getElementById('product-description').textContent = product.description;

  const specsBody = document.getElementById('specs-body');
  const specKeys = Object.keys(product.specs || {});
  specsBody.innerHTML = specKeys.length
    ? specKeys.map((k) => `<tr class="specs-table__row"><th class="specs-table__header">${TT.escapeHtml(k)}</th><td class="specs-table__data">${TT.escapeHtml(product.specs[k])}</td></tr>`).join('')
    : '<tr class="specs-table__row"><td class="specs-table__data" colspan="2">No specifications listed.</td></tr>';

  currentProduct = product;
  updateAddToCartLink();
}

function updateAddToCartLink() {
  if (!currentProduct) return;
  const addBtn = document.getElementById('add-to-cart-btn');
  const quantity = Number(document.getElementById('qty-input').value) || 1;

  if (currentProduct.stock === 0) {
    addBtn.classList.add('btn--disabled');
    addBtn.setAttribute('aria-disabled', 'true');
    addBtn.removeAttribute('href');
    addBtn.textContent = 'Out of Stock';
    return;
  }

  addBtn.classList.remove('btn--disabled');
  addBtn.removeAttribute('aria-disabled');
  addBtn.href = TT.buildWhatsAppLink(currentProduct, quantity);
  addBtn.innerHTML = TT.whatsAppButtonInner('Order via WhatsApp');
}

function renderReviews() {
  document.getElementById('reviews-grid').innerHTML = REVIEWS.map((rev) => `
    <article class="review-card">
      <div class="review-card__header">
        <div class="review-card__user">
          <span class="review-card__avatar">${TT.escapeHtml(rev.avatar)}</span>
          <div>
            <span class="review-card__name">${TT.escapeHtml(rev.name)}</span>
            ${rev.verified ? '<span class="review-card__verified">Verified Buyer</span>' : ''}
          </div>
        </div>
        <span class="review-card__date">${TT.escapeHtml(rev.date)}</span>
      </div>
      <div class="review-card__rating">${starsHtml(rev.rating, 14)}</div>
      <h3 class="review-card__title">${TT.escapeHtml(rev.title)}</h3>
      <p class="review-card__text">${TT.escapeHtml(rev.text)}</p>
    </article>
  `).join('');
}

function relatedCardHtml(p) {
  const badge = badgeInfo(p);
  const hasSale = p.sale_price != null && Number(p.sale_price) > 0;
  return `
    <article class="product-card">
      <a href="/product.html?id=${p.id}" class="product-card__image-link">
        <div class="product-card__image-wrap">
          ${badge ? `<span class="product-card__badge product-card__badge--${badge.type}">${badge.badge}</span>` : ''}
          <img src="${TT.escapeHtml(p.image)}" alt="${TT.escapeHtml(p.name)}" class="product-card__image" loading="lazy">
        </div>
      </a>
      <div class="product-card__body">
        <span class="product-card__category">${TT.escapeHtml(TT.categoryLabel(p.category))}</span>
        <h3 class="product-card__name"><a href="/product.html?id=${p.id}">${TT.escapeHtml(p.name)}</a></h3>
        <div class="product-card__price-row">
          ${hasSale
            ? `<span class="product-card__price product-card__price--sale">${TT.formatPrice(p.sale_price)}</span><span class="product-card__price product-card__price--original">${TT.formatPrice(p.price)}</span>`
            : `<span class="product-card__price">${TT.formatPrice(p.price)}</span>`}
        </div>
        ${TT.whatsAppButtonHtml(p)}
      </div>
    </article>
  `;
}

function wireQuantityStepper() {
  const input = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => {
    input.value = Math.max(1, Number(input.value) - 1);
    updateAddToCartLink();
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    input.value = Math.min(99, Number(input.value) + 1);
    updateAddToCartLink();
  });
}

function wireColorSwatches() {
  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('color-swatch--active'));
      swatch.classList.add('color-swatch--active');
      document.getElementById('selected-color-label').textContent = swatch.getAttribute('data-color');
    });
  });
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '1';

  wireQuantityStepper();
  wireColorSwatches();
  renderReviews();

  try {
    const { product, related } = await TT.get(`/api/products/${id}`);
    renderProduct(product);
    document.getElementById('related-grid').innerHTML = related.map(relatedCardHtml).join('');
  } catch (err) {
    document.querySelector('.product-detail').innerHTML = `<p class="shop-empty">${TT.escapeHtml(err.message)}</p>`;
  }
}

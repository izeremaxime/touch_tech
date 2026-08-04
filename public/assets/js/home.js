document.addEventListener('tt:layout-ready', init);

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  laptop: '<rect x="4" y="4" width="16" height="11" rx="1"/><path d="M2 19h20l-1.5-3h-17z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  cable: '<path d="M4 7h3a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2h3"/><rect x="2" y="5" width="4" height="4" rx="1"/><rect x="16" y="15" width="4" height="4" rx="1"/>',
  screen: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="12" rx="0.5"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  speaker: '<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="14" r="1.5"/><line x1="8" y1="6" x2="12" y2="6"/>',
};

const CATEGORIES = [
  { title: 'Phones', slug: 'phones', tagline: 'The latest flagships.', image: '/assets/images/category-phones.svg', icon: ICONS.phone },
  { title: 'Laptops', slug: 'laptops', tagline: 'Power for work and play.', image: '/assets/images/category-laptops.svg', icon: ICONS.laptop },
  { title: 'Phone Cases', slug: 'cases', tagline: 'Engineered for daily impact.', image: '/assets/images/category-cases.svg', icon: ICONS.shield },
  { title: 'Chargers', slug: 'chargers', tagline: 'Power without compromise.', image: '/assets/images/category-chargers.svg', icon: ICONS.zap },
  { title: 'Cables', slug: 'cables', tagline: 'Connect everything.', image: '/assets/images/category-cables.svg', icon: ICONS.cable },
  { title: 'Screen Protectors', slug: 'screen-protectors', tagline: 'Crystal clear defense.', image: '/assets/images/category-screen-protectors.svg', icon: ICONS.screen },
  { title: 'Headsets', slug: 'headsets', tagline: 'Immersive sound, silenced world.', image: '/assets/images/category-headsets.svg', icon: ICONS.headphones },
  { title: 'Speakers', slug: 'speakers', tagline: 'Fill the room.', image: '/assets/images/category-speakers.svg', icon: ICONS.speaker },
];

function svgIcon(pathContent, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathContent}</svg>`;
}

function renderSidebar() {
  const nav = document.getElementById('storefront-sidebar-nav');
  const allLink = `
    <a href="/shop.html" class="storefront-sidebar__link storefront-sidebar__link--all">
      <span class="storefront-sidebar__icon">${svgIcon(ICONS.grid)}</span>
      <span>All Products</span>
    </a>
  `;
  const categoryLinks = CATEGORIES.map((cat) => `
    <a href="/shop.html?category=${cat.slug}" class="storefront-sidebar__link">
      <span class="storefront-sidebar__icon">${svgIcon(cat.icon)}</span>
      <span>${TT.escapeHtml(cat.title)}</span>
    </a>
  `).join('');
  nav.innerHTML = allLink + categoryLinks;
}

function renderCategoryStrip() {
  const track = document.getElementById('category-strip-track');
  track.innerHTML = CATEGORIES.map((cat) => `
    <a href="/shop.html?category=${cat.slug}" class="category-tile">
      <span class="category-tile__icon">${svgIcon(cat.icon, 26)}</span>
      <span class="category-tile__title">${TT.escapeHtml(cat.title)}</span>
      <span class="category-tile__tagline">${TT.escapeHtml(cat.tagline)}</span>
    </a>
  `).join('');
}

function wireCategoryStripScroll() {
  const track = document.getElementById('category-strip-track');
  const prevBtn = document.getElementById('category-strip-prev');
  const nextBtn = document.getElementById('category-strip-next');
  const scrollAmount = () => track.clientWidth * 0.8;

  prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));
}

function productCardHtml(product) {
  const badge = TT.computeBadge(product);
  const hasSale = product.sale_price != null && Number(product.sale_price) > 0;
  return `
    <article class="product-card">
      <a href="/product.html?id=${product.id}" class="product-card__image-link">
        <div class="product-card__image-wrap">
          ${badge ? `<span class="product-card__badge product-card__badge--${badge.type}">${badge.badge}</span>` : ''}
          <img src="${TT.escapeHtml(product.image)}" alt="${TT.escapeHtml(product.name)}" class="product-card__image" loading="lazy">
        </div>
      </a>
      <div class="product-card__body">
        <h3 class="product-card__name"><a href="/product.html?id=${product.id}">${TT.escapeHtml(product.name)}</a></h3>
        <p class="product-card__subtitle">${TT.escapeHtml(TT.categoryLabel(product.category))}</p>
        <div class="product-card__price-row">
          ${hasSale
            ? `<span class="product-card__price product-card__price--sale">${TT.formatPrice(product.sale_price)}</span><span class="product-card__price product-card__price--original">${TT.formatPrice(product.price)}</span>`
            : `<span class="product-card__price">${TT.formatPrice(product.price)}</span>`}
        </div>
        ${TT.whatsAppButtonHtml(product)}
      </div>
    </article>
  `;
}

function renderGrid(elementId, items) {
  const grid = document.getElementById(elementId);
  if (!grid) return;
  grid.innerHTML = items.length
    ? items.map(productCardHtml).join('')
    : '<p class="shop-empty">Check back soon.</p>';
}

async function renderProductSections() {
  try {
    const { products } = await TT.get('/api/products');

    const topSellers = [...products].sort((a, b) => b.rating - a.rating || b.id - a.id).slice(0, 4);
    renderGrid('top-sellers-grid', topSellers);

    const onSale = products
      .filter((p) => p.sale_price != null && Number(p.sale_price) > 0)
      .sort((a, b) => b.id - a.id)
      .slice(0, 4);
    renderGrid('on-sale-grid', onSale);

    const lowStock = products
      .filter((p) => p.stock > 0 && p.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
    renderGrid('low-stock-grid', lowStock);
  } catch (err) {
    renderGrid('top-sellers-grid', []);
    document.getElementById('top-sellers-grid').innerHTML = `<p class="shop-empty">${TT.escapeHtml(err.message)}</p>`;
  }
}

function wireNewsletter() {
  const form = document.getElementById('newsletter-form');
  const feedback = document.getElementById('newsletter-feedback');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.textContent = 'Thanks for subscribing! Check your inbox for a confirmation email.';
    form.reset();
  });
}

async function init() {
  renderSidebar();
  renderCategoryStrip();
  wireCategoryStripScroll();
  await renderProductSections();
  wireNewsletter();
}

/* Shared fetch helpers + navbar state (auth + cart badge). Loaded on every page. */

const TT = (() => {
  async function request(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : undefined,
      ...options,
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data;
  }

  const get = (url) => request(url);
  const post = (url, body) => request(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  const put = (url, body) => request(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  const postForm = (url, formData) => request(url, { method: 'POST', body: formData });
  const putForm = (url, formData) => request(url, { method: 'PUT', body: formData });
  const del = (url) => request(url, { method: 'DELETE' });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function formatPrice(n) {
    return '$' + Number(n).toFixed(2);
  }

  const CATEGORY_LABELS = {
    cases: 'Phone Cases',
    chargers: 'Chargers',
    'screen-protectors': 'Screen Protectors',
    cables: 'Cables',
    phones: 'Phones',
    laptops: 'Laptops',
    headsets: 'Headsets',
    speakers: 'Speakers',
  };

  function categoryLabel(slug) {
    if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
    if (!slug) return '';
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  /** Mirrors the badge logic that used to live in each PHP page. */
  function computeBadge(product) {
    if (product.stock === 0) return { badge: 'OUT OF STOCK', type: 'sale' };
    if (product.sale_price != null && Number(product.sale_price) > 0) return { badge: 'SALE', type: 'sale' };
    if (product.rating === 5) return { badge: 'NEW', type: 'new' };
    return null;
  }

  const WHATSAPP_NUMBER = '250785466028';

  /** Builds a wa.me link pre-filled with an order inquiry for a specific product. */
  function buildWhatsAppLink(product, quantity = 1) {
    const price = product.sale_price != null ? product.sale_price : product.price;
    const productUrl = `${window.location.origin}/product.html?id=${product.id}`;
    const lines = [
      "Hi! I'd like to order:",
      '',
      `*${product.name}*`,
      `Qty: ${quantity}`,
      `Price: ${formatPrice(price)} each`,
      `Link: ${productUrl}`,
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  const WHATSAPP_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="vertical-align: -3px; margin-right: 5px;"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2.05 22l5.4-1.42a9.87 9.87 0 0 0 4.59 1.17h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.76 14.16c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.03.24-3.45-.72-2.92-1.16-4.8-4.11-4.94-4.3-.15-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36l.55.01c.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.61.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.29.15.47.12.64-.07.17-.2.72-.85.92-1.14.19-.29.38-.24.65-.15.27.1 1.68.79 1.97.94.29.15.48.22.55.34.07.13.07.72-.17 1.4z"/></svg>';

  function whatsAppButtonInner(label = 'Order via WhatsApp') {
    return `${WHATSAPP_ICON}${escapeHtml(label)}`;
  }

  function whatsAppButtonHtml(product, options = {}) {
    const { className = 'btn btn--primary btn--full product-card__cart-btn', quantity = 1, label = 'Order via WhatsApp' } = options;
    return `<a href="${buildWhatsAppLink(product, quantity)}" target="_blank" rel="noopener noreferrer" class="${className}">${whatsAppButtonInner(label)}</a>`;
  }

  function showAlert(containerEl, message, type = 'success') {
    if (!containerEl) return;
    containerEl.innerHTML = `<div class="alert alert--${type === 'success' ? 'success' : 'error'}">${escapeHtml(message)}</div>`;
  }

  function setCartBadge(count) {
    document.querySelectorAll('#cart-badge').forEach((el) => {
      el.textContent = count > 0 ? String(count) : '';
      el.setAttribute('data-count', String(count));
    });
  }

  async function refreshCartBadge() {
    try {
      const { cart } = await get('/api/cart');
      setCartBadge(cart.count || 0);
    } catch {
      setCartBadge(0);
    }
  }

  async function refreshAuthState() {
    try {
      const { user } = await get('/api/auth/me');
      const adminLink = document.getElementById('nav-admin-link');
      if (adminLink) adminLink.style.display = user && user.role === 'admin' ? '' : 'none';

      const avatar = document.getElementById('admin-profile-avatar');
      const name = document.getElementById('admin-profile-name');
      const email = document.getElementById('admin-profile-email');
      if (user && avatar && name && email) {
        avatar.textContent = user.username.slice(0, 2).toUpperCase();
        name.textContent = user.username;
        email.textContent = `${user.role} account`;
      }

      return user;
    } catch {
      return null;
    }
  }

  function highlightActiveNav() {
    const active = document.body.getAttribute('data-active-page');
    if (active) {
      document.querySelectorAll('[data-page]').forEach((el) => {
        if (el.getAttribute('data-page') === active) el.classList.add('navbar__link--active');
      });
    }

    const activeAdmin = document.body.getAttribute('data-active-admin-page');
    if (activeAdmin) {
      document.querySelectorAll('[data-admin-page]').forEach((el) => {
        if (el.getAttribute('data-admin-page') === activeAdmin) el.classList.add('admin-sidebar__link--active');
      });
    }
  }

  async function loadPartial(placeholderId, url) {
    const el = document.getElementById(placeholderId);
    if (!el) return;
    const res = await fetch(url);
    el.outerHTML = await res.text();
  }

  async function initLayout() {
    await Promise.all([
      loadPartial('site-navbar', '/partials/navbar.html'),
      loadPartial('site-footer', '/partials/footer.html'),
      loadPartial('admin-sidebar-placeholder', '/partials/admin-sidebar.html'),
    ]);

    highlightActiveNav();
    refreshCartBadge();
    refreshAuthState();

    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('navbar__nav--open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    const searchForm = document.getElementById('navbar-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', () => {}); // native GET submit to shop.html?q=
    }

    document.dispatchEvent(new CustomEvent('tt:layout-ready'));
  }

  document.addEventListener('DOMContentLoaded', initLayout);

  return {
    get, post, put, postForm, putForm, del,
    escapeHtml, formatPrice, categoryLabel, computeBadge,
    showAlert, setCartBadge, refreshCartBadge, refreshAuthState,
    buildWhatsAppLink, whatsAppButtonHtml, whatsAppButtonInner,
  };
})();

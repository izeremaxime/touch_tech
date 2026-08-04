document.addEventListener('tt:layout-ready', init);

function cartItemHtml(item) {
  const price = item.sale_price != null ? Number(item.sale_price) : Number(item.price);
  const rowTotal = price * item.quantity;
  return `
    <article class="cart-item" data-product-id="${item.product_id}">
      <div class="cart-item__image">
        <img src="${TT.escapeHtml(item.image)}" alt="${TT.escapeHtml(item.name)}">
      </div>
      <div class="cart-item__details">
        <span class="cart-item__category">${TT.escapeHtml(TT.categoryLabel(item.category))}</span>
        <h3 class="cart-item__name"><a href="/product.html?id=${item.product_id}">${TT.escapeHtml(item.name)}</a></h3>
        <div class="cart-item__price-unit">${TT.formatPrice(price)} each</div>
      </div>
      <div class="cart-item__quantity">
        <div class="quantity-stepper" style="height: 38px;">
          <button type="button" class="quantity-stepper__btn" data-qty-minus>-</button>
          <input type="number" class="quantity-stepper__input" value="${item.quantity}" readonly>
          <button type="button" class="quantity-stepper__btn" data-qty-plus>+</button>
        </div>
      </div>
      <div class="cart-item__total">${TT.formatPrice(rowTotal)}</div>
      <button type="button" class="cart-item__remove" data-remove aria-label="Remove item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </article>
  `;
}

function renderCart(cart) {
  const main = document.getElementById('cart-main');

  if (cart.items.length === 0) {
    main.innerHTML = `
      <div class="cart-empty-box">
        <div class="cart-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h2>Your cart is currently empty</h2>
        <p>Before you can check out, you must add some premium accessories to your shopping cart.</p>
        <a href="/shop.html" class="btn btn--primary">Continue Shopping</a>
      </div>
    `;
    return;
  }

  main.innerHTML = `
    <div class="cart-grid">
      <div class="cart-items-wrap" id="cart-items-wrap">
        ${cart.items.map(cartItemHtml).join('')}
        <div class="cart-items-footer">
          <a href="/shop.html" class="btn btn--outline">Back to Shop</a>
          <button type="button" class="cart-clear-link" id="cart-clear-btn">Clear Shopping Cart</button>
        </div>
      </div>

      <div class="cart-summary">
        <h2>Order Summary</h2>
        <div class="summary-row"><span>Subtotal</span><strong>${TT.formatPrice(cart.subtotal)}</strong></div>
        <div class="summary-row"><span>Shipping Fee</span><strong>${cart.shippingFee > 0 ? TT.formatPrice(cart.shippingFee) : 'FREE'}</strong></div>
        <div class="summary-row"><span>Estimated Tax (8%)</span><strong>${TT.formatPrice(cart.tax)}</strong></div>
        <div class="summary-total"><span>Grand Total</span><strong>${TT.formatPrice(cart.total)}</strong></div>
        ${cart.shippingFee > 0 ? `<div class="summary-shipping-alert">Add another ${TT.formatPrice(150 - cart.subtotal)} to get FREE shipping!</div>` : ''}
        <button type="button" class="btn btn--primary btn--full" id="checkout-btn" style="height: 48px;">Proceed to Checkout</button>
        <span style="font-size: 11.5px; color: var(--color-text-light); text-align: center;">Taxes and shipping are calculated based on flat local rates.</span>
      </div>
    </div>
  `;
}

async function loadCart() {
  const { cart } = await TT.get('/api/cart');
  renderCart(cart);
  TT.setCartBadge(cart.count);
  return cart;
}

function wireCartEvents() {
  const main = document.getElementById('cart-main');

  main.addEventListener('click', async (e) => {
    const itemEl = e.target.closest('.cart-item');

    if (e.target.closest('#cart-clear-btn')) {
      if (!confirm('Are you sure you want to clear your entire cart?')) return;
      await TT.post('/api/cart/clear');
      await loadCart();
      return;
    }

    if (e.target.closest('#checkout-btn')) {
      const btn = document.getElementById('checkout-btn');
      btn.disabled = true;
      btn.textContent = 'Placing order…';
      try {
        const { orderId } = await TT.post('/api/checkout');
        await TT.refreshCartBadge();
        window.location.href = `/checkout-confirmation.html?order=${orderId}`;
      } catch (err) {
        if (err.message.toLowerCase().includes('log in')) {
          alert('Please log in to check out.');
          window.location.href = '/account.html';
        } else {
          alert(err.message);
          btn.disabled = false;
          btn.textContent = 'Proceed to Checkout';
        }
      }
      return;
    }

    if (!itemEl) return;
    const productId = Number(itemEl.getAttribute('data-product-id'));

    if (e.target.closest('[data-remove]')) {
      if (!confirm('Remove this item from your cart?')) return;
      await TT.post('/api/cart/remove', { productId });
      await loadCart();
      return;
    }

    if (e.target.closest('[data-qty-minus]') || e.target.closest('[data-qty-plus]')) {
      const input = itemEl.querySelector('.quantity-stepper__input');
      const delta = e.target.closest('[data-qty-minus]') ? -1 : 1;
      const newQty = Number(input.value) + delta;
      await TT.post('/api/cart/update', { productId, quantity: newQty });
      await loadCart();
    }
  });
}

async function init() {
  wireCartEvents();
  try {
    await loadCart();
  } catch (err) {
    document.getElementById('cart-main').innerHTML = `<p class="shop-empty">${TT.escapeHtml(err.message)}</p>`;
  }
}

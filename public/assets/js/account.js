document.addEventListener('tt:layout-ready', init);

function wireTabs() {
  const tabLogin = document.getElementById('tab-login-btn');
  const tabRegister = document.getElementById('tab-register-btn');
  const formLogin = document.getElementById('auth-login-form');
  const formRegister = document.getElementById('auth-register-form');
  if (!tabLogin) return;

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('auth-tab-btn--active');
    tabRegister.classList.remove('auth-tab-btn--active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('auth-tab-btn--active');
    tabLogin.classList.remove('auth-tab-btn--active');
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
  });
}

function wireRoleToggle() {
  const roleBtnUser = document.getElementById('role-btn-user');
  const roleBtnAdmin = document.getElementById('role-btn-admin');
  const roleInput = document.getElementById('login-role-input');
  if (!roleBtnUser) return;

  roleBtnUser.addEventListener('click', () => {
    roleInput.value = 'user';
    roleBtnUser.classList.add('login-role-btn--active');
    roleBtnAdmin.classList.remove('login-role-btn--active');
  });
  roleBtnAdmin.addEventListener('click', () => {
    roleInput.value = 'admin';
    roleBtnAdmin.classList.add('login-role-btn--active');
    roleBtnUser.classList.remove('login-role-btn--active');
  });
}

function wireForms() {
  const alertBox = document.getElementById('account-alert');

  document.getElementById('auth-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const { user } = await TT.post('/api/auth/login', {
        username: form.username.value.trim(),
        password: form.password.value,
        role: form.querySelector('#login-role-input').value,
      });
      window.location.href = user.role === 'admin' ? '/admin.html' : '/account.html';
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
    }
  });

  document.getElementById('auth-register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await TT.post('/api/auth/register', {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        confirmPassword: form.confirm_password.value,
      });
      window.location.href = '/account.html';
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await TT.post('/api/auth/logout');
    window.location.href = '/account.html';
  });

  document.getElementById('change-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const { message } = await TT.put('/api/account/password', {
        currentPassword: form.currentPassword.value,
        newPassword: form.newPassword.value,
        confirmNewPassword: form.confirmNewPassword.value,
      });
      form.reset();
      TT.showAlert(alertBox, message, 'success');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function orderStatusBadgeClass(status) {
  if (status === 'delivered' || status === 'shipped') return 'badge--success';
  if (status === 'cancelled') return 'badge--danger';
  return 'badge--warning';
}

function renderOrderRow(order) {
  return `
    <tr class="catalog-table__row">
      <td class="catalog-table__td font-mono">ORD-${String(order.id).padStart(5, '0')}</td>
      <td class="catalog-table__td">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      <td class="catalog-table__td"><span class="badge ${orderStatusBadgeClass(order.status)}" style="text-transform: capitalize;">${TT.escapeHtml(order.status)}</span></td>
      <td class="catalog-table__td text-right">${TT.formatPrice(order.total)}</td>
    </tr>
  `;
}

async function renderProfile(user) {
  document.getElementById('auth-view').style.display = 'none';
  const profileView = document.getElementById('profile-view');
  profileView.style.display = '';

  document.getElementById('profile-initials').textContent = user.username.slice(0, 2).toUpperCase();
  document.getElementById('profile-username').textContent = user.username;
  const roleBadge = document.getElementById('profile-role');
  roleBadge.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  roleBadge.className = 'badge ' + (user.role === 'admin' ? 'badge--danger' : 'badge--success');
  document.getElementById('profile-member-since').textContent = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('profile-id').textContent = '#' + user.id;

  document.getElementById('admin-portal-alert').style.display = user.role === 'admin' ? 'flex' : 'none';

  const ordersSection = document.getElementById('orders-body');
  if (user.role === 'admin') {
    ordersSection.innerHTML = '<p style="color: var(--color-text-light); font-style: italic;">Admin accounts do not have customer purchase history. View products listing in the panel.</p>';
    return;
  }

  try {
    const { orders } = await TT.get('/api/orders');
    ordersSection.innerHTML = orders.length
      ? `<div class="table-wrap"><table class="catalog-table"><thead><tr>
          <th class="catalog-table__th">Order ID</th><th class="catalog-table__th">Date</th>
          <th class="catalog-table__th">Status</th><th class="catalog-table__th text-right">Total</th>
        </tr></thead><tbody>${orders.map(renderOrderRow).join('')}</tbody></table></div>`
      : '<p style="color: var(--color-text-light);">You haven\'t placed any orders yet.</p>';
  } catch {
    ordersSection.innerHTML = '<p style="color: var(--color-text-light);">Could not load order history.</p>';
  }
}

async function init() {
  wireTabs();
  wireRoleToggle();
  wireForms();

  const user = await TT.refreshAuthState();
  if (user) {
    await renderProfile(user);
  }
}

document.addEventListener('tt:layout-ready', init);

async function loadSettings() {
  const { settings } = await TT.get('/api/admin/settings');
  document.getElementById('setting-tax-rate').value = settings.taxRate;
  document.getElementById('setting-shipping-fee').value = settings.shippingFee;
  document.getElementById('setting-free-shipping').value = settings.freeShippingThreshold;
  document.getElementById('setting-low-stock').value = settings.lowStockThreshold;
}

function wireStoreSettingsForm() {
  const form = document.getElementById('store-settings-form');
  const alertBox = document.getElementById('store-settings-alert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await TT.put('/api/admin/settings', {
        taxRate: Number(document.getElementById('setting-tax-rate').value),
        shippingFee: Number(document.getElementById('setting-shipping-fee').value),
        freeShippingThreshold: Number(document.getElementById('setting-free-shipping').value),
        lowStockThreshold: Number(document.getElementById('setting-low-stock').value),
      });
      TT.showAlert(alertBox, 'Store settings saved.', 'success');
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
    }
  });
}

function wirePasswordForm() {
  const form = document.getElementById('password-form');
  const alertBox = document.getElementById('password-alert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await TT.put('/api/account/password', {
        currentPassword: document.getElementById('current-password').value,
        newPassword: document.getElementById('new-password').value,
        confirmNewPassword: document.getElementById('confirm-new-password').value,
      });
      TT.showAlert(alertBox, 'Password updated successfully.', 'success');
      form.reset();
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
    }
  });
}

async function init() {
  const user = await TT.refreshAuthState();
  if (!user || user.role !== 'admin') {
    window.location.href = '/account.html';
    return;
  }

  wireStoreSettingsForm();
  wirePasswordForm();
  try {
    await loadSettings();
  } catch (err) {
    TT.showAlert(document.getElementById('store-settings-alert'), err.message, 'error');
  }
}

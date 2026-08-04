document.addEventListener('tt:layout-ready', init);

function init() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const form = document.getElementById('reset-form');
  const alertBox = document.getElementById('reset-alert');

  if (!token) {
    TT.showAlert(alertBox, 'This reset link is missing its token. Please request a new one from the Forgot Password page.', 'error');
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const { message } = await TT.post('/api/auth/reset-password', {
        token,
        newPassword: document.getElementById('reset-new-password').value,
        confirmNewPassword: document.getElementById('reset-confirm-password').value,
      });
      TT.showAlert(alertBox, `${message} Redirecting to login…`, 'success');
      setTimeout(() => { window.location.href = '/account.html'; }, 1800);
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
      submitBtn.disabled = false;
    }
  });
}

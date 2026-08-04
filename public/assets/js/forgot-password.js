document.addEventListener('tt:layout-ready', init);

function init() {
  const form = document.getElementById('forgot-form');
  const alertBox = document.getElementById('forgot-alert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const { message } = await TT.post('/api/auth/forgot-password', {
        email: document.getElementById('forgot-email').value.trim(),
      });
      TT.showAlert(alertBox, message, 'success');
      form.reset();
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('tt:layout-ready', init);

const STANDARD_SPEC_KEYS = ['Material', 'Compatibility', 'Weight'];

function wireImagePreview() {
  const fileInput = document.getElementById('file-uploader');
  const filenameLabel = document.getElementById('upload-filename');
  const previewBox = document.getElementById('image-preview-box');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    filenameLabel.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    const reader = new FileReader();
    reader.onload = (evt) => {
      previewBox.innerHTML = `<img src="${evt.target.result}" class="form-image-upload__img" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  });
}

function prefillForm(product) {
  const form = document.getElementById('product-form');
  form.name.value = product.name;
  form.sku.value = product.sku;
  form.category.value = product.category;
  form.price.value = product.price;
  form.sale_price.value = product.sale_price ?? '';
  form.stock.value = product.stock;
  form.description.value = product.description;

  const specs = product.specs || {};
  form.querySelector('[name="specs[Material]"]').value = specs.Material || '';
  form.querySelector('[name="specs[Compatibility]"]').value = specs.Compatibility || '';
  form.querySelector('[name="specs[Weight]"]').value = specs.Weight || '';

  const customEntry = Object.entries(specs).find(([key]) => !STANDARD_SPEC_KEYS.includes(key));
  if (customEntry) {
    form.custom_spec_key.value = customEntry[0];
    form.custom_spec_val.value = customEntry[1];
  }

  if (product.image) {
    document.getElementById('image-preview-box').innerHTML =
      `<img src="${TT.escapeHtml(product.image)}" class="form-image-upload__img" alt="Preview">`;
  }
}

function wireSubmit(mode, id) {
  const form = document.getElementById('product-form');
  const alertBox = document.getElementById('form-alert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (mode === 'edit') {
        await TT.putForm(`/api/admin/products/${id}`, formData);
      } else {
        await TT.postForm('/api/admin/products', formData);
      }
      window.location.href = '/admin.html';
    } catch (err) {
      TT.showAlert(alertBox, err.message, 'error');
      submitBtn.disabled = false;
    }
  });
}

async function init() {
  const user = await TT.refreshAuthState();
  if (!user || user.role !== 'admin') {
    window.location.href = '/account.html';
    return;
  }

  wireImagePreview();

  const params = new URLSearchParams(window.location.search);
  const mode = params.get('action') === 'edit' ? 'edit' : 'add';
  const id = params.get('id');

  document.getElementById('form-title').textContent = mode === 'edit' ? 'Edit Product' : 'Add New Product';
  document.getElementById('submit-btn').textContent = mode === 'edit' ? 'Update Product' : 'Publish Product';

  if (mode === 'edit' && id) {
    try {
      const { product } = await TT.get(`/api/products/${id}`);
      prefillForm(product);
    } catch (err) {
      alert(err.message);
      window.location.href = '/admin.html';
      return;
    }
  }

  wireSubmit(mode, id);
}

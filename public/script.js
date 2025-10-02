const form = document.getElementById('upload-form');
const errorBox = document.getElementById('error-box');
const successBox = document.getElementById('success-box');

const MAX_MB = 10;
const ALLOWED = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  successBox.style.display = 'none';
}

function showSuccess(msg) {
  successBox.textContent = msg;
  successBox.style.display = 'block';
  errorBox.style.display = 'none';
}

function validateFile(file) {
  if (!file) return 'Missing file.';
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED.includes(ext)) return `Invalid file type: ${file.name}`;
  if (file.size > MAX_MB * 1024 * 1024)
    return `File too large (${(file.size / 1024 / 1024).toFixed(2)} MB): ${file.name}`;
  return null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');

  const fullName = form.full_name.value.trim();
  const email = form.email.value.trim();
  const businessDocType = form.business_doc_type.value;
  const idDocType = form.id_doc_type.value;
  const businessDoc = form.business_docs.files[0];
  const idFile = form.id_file.files[0];

  if (!fullName || !email) return showError('Full name and email are required.');
  if (!businessDocType) return showError('Select a business document type.');
  if (!idDocType) return showError('Select a valid ID type.');
  if (!businessDoc) return showError('Please upload a business document.');
  if (!idFile) return showError('Please upload a valid ID.');
  if (!form.consent.checked) return showError('You must consent to data processing.');

  const err1 = validateFile(businessDoc);
  if (err1) return showError(err1);
  const err2 = validateFile(idFile);
  if (err2) return showError(err2);

  const fd = new FormData();
  fd.append('full_name', fullName);
  fd.append('email', email);
  fd.append('business_name', form.business_name.value);
  fd.append('business_doc_type', businessDocType);
  fd.append('id_doc_type', idDocType);
  fd.append('business_docs', businessDoc);
  fd.append('id_file', idFile);
  fd.append('consent', 'true');

  try {
    const res = await fetch('/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed.');
    showSuccess('✅ Thank you! Your documents have been securely submitted.');
    form.reset();
  } catch (err) {
    showError(err.message);
  }
});

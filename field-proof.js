(() => {
  const fileInput = document.querySelector('#field-proof-file');
  const result = document.querySelector('#field-proof-result');
  if (!fileInput || !result) return;
  let selection = 0;
  fileInput.addEventListener('change', async () => {
    const request = ++selection;
    const file = fileInput.files[0];
    if (!file) {
      result.textContent = '';
      return;
    }
    if (file.size > 20 * 1024 * 1024 || !file.type.startsWith('image/')) {
      result.textContent = 'Choose an image up to 20 MB.';
      return;
    }
    result.textContent = 'Computing SHA-256…';
    try {
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      if (request !== selection) return;
      result.textContent = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      if (request === selection) result.textContent = 'Could not read or hash this file.';
    }
  });
})();

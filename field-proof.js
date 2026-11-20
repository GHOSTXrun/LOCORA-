(() => {
  const input = document.querySelector('#field-proof-file');
  const sample = document.querySelector('#field-proof-sample');
  const output = document.querySelector('#field-proof-result');
  if (!input || !sample || !output) return;
  let selection = 0;

  async function calculate(readBytes) {
    const request = ++selection;
    output.textContent = 'Computing SHA-256…';
    try {
      const bytes = await readBytes();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      if (request !== selection) return;
      output.textContent = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      if (request === selection) output.textContent = 'Could not read or hash the photo.';
    }
  }

  const sampleUrl = new URL('./samples/ts-tkts.jpg', document.currentScript.src);
  sample.addEventListener('click', () => calculate(async () => {
    const response = await fetch(sampleUrl);
    if (!response.ok) throw new Error('Sample photo unavailable');
    return response.arrayBuffer();
  }));
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file || file.size > 20 * 1024 * 1024 || !file.type.startsWith('image/')) {
      selection++;
      output.textContent = file ? 'Choose an image up to 20 MB.' : '';
      return;
    }
    return calculate(() => file.arrayBuffer());
  });
})();

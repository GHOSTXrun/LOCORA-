(() => {
  const file = new URL('./locora-contract.json', document.currentScript.src);
  let address;
  let feedback;
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function validSolanaAddress(value) {
    if (typeof value !== 'string' || value.length < 32 || value.length > 44) return false;
    let encoded = 0n;
    for (const character of value) {
      const digit = BASE58.indexOf(character);
      if (digit === -1) return false;
      encoded = encoded * 58n + BigInt(digit);
    }
    let bytes = 0;
    for (let number = encoded; number > 0n; number >>= 8n) bytes++;
    return bytes + (value.match(/^1+/)?.[0].length || 0) === 32;
  }
  function draw() {
    if (!address) return;
    for (const button of document.querySelectorAll('.locora-ca')) {
      button.disabled = false;
      button.title = address;
      button.setAttribute('aria-label', `Copy contract address ${address}`);
      const status = button.querySelector('strong');
      if (status && status.textContent !== feedback) status.textContent = feedback;
    }
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('.locora-ca');
    if (!button || !address) return;
    try {
      await navigator.clipboard.writeText(address);
      feedback = 'Copied';
      draw();
      setTimeout(() => {
        feedback = `${address.slice(0, 6)}…${address.slice(-5)}`;
        draw();
      }, 1600);
    } catch {
      window.prompt('Copy the LOCORA contract address', address);
    }
  });
  const embedded = document.querySelector('.locora-ca')?.dataset.contractAddress;
  if (validSolanaAddress(embedded)) {
    address = embedded;
    feedback = `${address.slice(0, 6)}…${address.slice(-5)}`;
    draw();
  }
  fetch(file, {cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(config => {
      if (!validSolanaAddress(config?.address)) return;
      address = config.address;
      feedback = `${address.slice(0, 6)}…${address.slice(-5)}`;
      draw();
      new MutationObserver(draw).observe(document.body, {subtree:true,childList:true});
    })
    .catch(() => {});
})();

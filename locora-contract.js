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
    for (const button of document.querySelectorAll('.locora-ca')) {
      button.disabled = !address;
      button.title = address || 'Contract address to be announced';
      button.setAttribute('aria-label', address ? 'Copy contract address ' + address : button.title);
      const status = button.querySelector('strong');
      const text = feedback || 'TBA';
      if (status && status.textContent !== text) status.textContent = text;
    }
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('.locora-ca');
    if (!button || !address) return;
    try {
      const copied = address;
      await navigator.clipboard.writeText(copied);
      if (address !== copied) return;
      feedback = 'Copied';
      draw();
      setTimeout(() => {
        if (address !== copied) return;
        feedback = `${address.slice(0, 6)}…${address.slice(-5)}`;
        draw();
      }, 1600);
    } catch {
      window.prompt('Copy the LOCORA contract address', address);
    }
  });
  async function refresh() {
    try {
      file.searchParams.set('v', String(Math.floor(Date.now() / 10000)));
      const response = await fetch(file, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
      if (response.ok) {
        const config = await response.json();
        if (config?.address === null || validSolanaAddress(config?.address)) {
          const next = config.address || undefined;
          if (next !== address) {
            address = next;
            feedback = address ? address.slice(0, 6) + '…' + address.slice(-5) : undefined;
          }
          draw();
        }
      }
    } catch {
      // Retain the current state and try again after a transient error.
    } finally {
      setTimeout(refresh, 10000);
    }
  }

  new MutationObserver(draw).observe(document.body, { subtree: true, childList: true });
  draw();
  refresh();
})();

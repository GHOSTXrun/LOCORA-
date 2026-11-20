(() => {
  const root = new URL('./', document.currentScript.src);
  const wallets = {
    backpack: { label: 'Backpack', icon: 'backpack.png', download: 'https://backpack.app/download' },
    phantom: { label: 'Phantom', icon: 'phantom.svg', download: 'https://phantom.com/download' }
  };
  const registry = new Set();
  const registration = Object.freeze({
    register(...entries) {
      entries.forEach(wallet => registry.add(wallet));
      return () => entries.forEach(wallet => registry.delete(wallet));
    }
  });
  window.addEventListener('wallet-standard:register-wallet', event => {
    if (typeof event.detail === 'function') event.detail(registration);
  });
  window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', {detail:registration}));

  const dialog = document.createElement('dialog');
  dialog.className = 'locora-wallet';
  dialog.setAttribute('aria-labelledby','locora-wallet-title');
  dialog.innerHTML = `
    <div class="locora-wallet__titlebar">
      <h2 id="locora-wallet-title">Connect a Solana wallet</h2>
      <button type="button" class="btn btn-small locora-wallet__close" data-wallet-close aria-label="Close wallet dialog">×</button>
    </div>
    <div class="locora-wallet__choices"></div>
    <p class="locora-wallet__status" role="status"></p>
    <p class="locora-wallet__install" hidden><a target="_blank" rel="noopener noreferrer"></a></p>
    <button type="button" class="btn btn-quiet locora-wallet__disconnect" data-wallet-disconnect hidden>Disconnect wallet</button>`;
  const choices = dialog.querySelector('.locora-wallet__choices');
  const status = dialog.querySelector('.locora-wallet__status');
  const install = dialog.querySelector('.locora-wallet__install');
  const installLink = install.querySelector('a');
  const disconnect = dialog.querySelector('[data-wallet-disconnect]');
  for (const [id, wallet] of Object.entries(wallets)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'locora-wallet__choice';
    button.dataset.walletOption = id;
    const icon = document.createElement('img');
    icon.alt = '';
    icon.width = 25;
    icon.height = 25;
    icon.src = new URL(`wallets/${wallet.icon}`, root).href;
    button.append(icon, wallet.label);
    choices.append(button);
  }
  document.body.append(dialog);

  let current;
  let busy = false;
  let trigger;
  const solana = value => typeof value === 'string' && value.startsWith('solana:');
  const address = key => {
    const value = typeof key === 'string' ? key : key?.toBase58?.();
    return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) ? value : null;
  };
  const account = accounts => accounts?.find(entry => entry.chains?.some(solana));
  const abbreviated = value => `${value.slice(0,4)}…${value.slice(-4)}`;

  function getConnector(id) {
    const wallet = [...registry].find(entry => entry.name.toLowerCase() === id &&
      entry.chains?.some(solana) && entry.features?.['standard:connect']?.connect);
    if (wallet) {
      return {
        async connect() {
          const result = await wallet.features['standard:connect'].connect();
          return address(account(result.accounts)?.address);
        },
        disconnect: () => wallet.features['standard:disconnect']?.disconnect?.(),
        watch: callback => wallet.features['standard:events']?.on?.('change', ({accounts}) => {
          if (accounts) callback(address(account(accounts)?.address));
        })
      };
    }
    const injected = id === 'phantom' ?
      (window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null)) :
      (window.backpack?.solana || window.backpack || (window.solana?.isBackpack ? window.solana : null));
    if (typeof injected?.connect !== 'function') return null;
    return {
      async connect() {
        const result = await injected.connect();
        return address(result?.publicKey ?? injected.publicKey);
      },
      disconnect: () => injected.disconnect?.(),
      watch(callback) {
        const changed = key => callback(address(key));
        const closed = () => callback(null);
        injected.on?.('accountChanged', changed);
        injected.on?.('disconnect', closed);
        return () => {
          injected.removeListener?.('accountChanged', changed);
          injected.removeListener?.('disconnect', closed);
        };
      }
    };
  }

  function syncButtons() {
    const label = current ? abbreviated(current.address) : 'Connect wallet';
    const aria = current ? `${wallets[current.id].label} connected: ${current.address}. Manage wallet` : 'Connect wallet';
    for (const button of document.querySelectorAll('[data-wallet-connect]')) {
      const child = button.querySelector('.wallet-trigger__label');
      if (child && child.textContent !== label) child.textContent = label;
      button.dataset.connected = String(Boolean(current));
      button.setAttribute('aria-label', aria);
    }
  }
  function syncDialog() {
    syncButtons();
    disconnect.hidden = !current;
    status.textContent = current ? `${wallets[current.id].label} connected: ${current.address}` : 'Choose a wallet.';
  }
  function setBusy(value) {
    busy = value;
    for (const button of choices.querySelectorAll('button')) button.disabled = value;
    disconnect.disabled = value;
  }
  function clear() {
    current?.unwatch?.();
    current = undefined;
    syncDialog();
  }
  async function connect(id) {
    if (busy || !Object.hasOwn(wallets, id)) return;
    install.hidden = true;
    const connector = getConnector(id);
    if (!connector) {
      status.textContent = `${wallets[id].label} was not detected in this browser.`;
      installLink.href = wallets[id].download;
      installLink.textContent = `Get ${wallets[id].label}`;
      install.hidden = false;
      return;
    }
    setBusy(true);
    status.textContent = `Approve the connection in ${wallets[id].label}.`;
    try {
      const key = await connector.connect();
      if (!key) throw new Error('missing account');
      current?.unwatch?.();
      const session = {id, address:key, connector};
      current = session;
      session.unwatch = connector.watch(next => {
        if (current !== session) return;
        if (!next) {
          clear();
          return;
        }
        session.address = next;
        syncDialog();
      });
      syncDialog();
    } catch (error) {
      status.textContent = Number(error?.code) === 4001 ? 'Connection declined.' : 'Could not connect. Unlock the wallet and try again.';
    } finally {
      setBusy(false);
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-wallet-connect]');
    if (!button) return;
    trigger = button;
    install.hidden = true;
    if (!busy) syncDialog();
    if (!dialog.isConnected) document.body.append(dialog);
    if (!dialog.open) dialog.showModal();
  });
  dialog.addEventListener('click', async event => {
    const option = event.target.closest?.('[data-wallet-option]');
    if (option) {
      await connect(option.dataset.walletOption);
    } else if (event.target === dialog || event.target.closest?.('[data-wallet-close]')) {
      dialog.close();
    } else if (!busy && current && event.target.closest?.('[data-wallet-disconnect]')) {
      setBusy(true);
      try {
        await current.connector.disconnect();
        clear();
      } catch {
        status.textContent = 'Could not disconnect. You can disconnect from your wallet extension.';
      } finally {
        setBusy(false);
      }
    }
  });
  dialog.addEventListener('close', () => trigger?.focus());
  syncButtons();
  new MutationObserver(syncButtons).observe(document.body, {childList:true,subtree:true});
})();

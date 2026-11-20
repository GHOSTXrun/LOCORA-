(() => {
  const script = document.currentScript;
  const path = new URL('./hero-globe.html?v=disc1', script.src).href;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let sticky;
  let world;
  let globe;
  let ready = false;
  let queued = false;
  let sent = -1;

  function update() {
    queued = false;
    if (!ready || !globe?.isConnected) return;
    const height = Math.max(1, world.offsetHeight - sticky.offsetHeight);
    const offset = sticky.getBoundingClientRect().top - world.getBoundingClientRect().top;
    const progress = motion.matches ? 0 : Math.max(0, Math.min(1, offset / height));
    if (progress === sent) return;
    sent = progress;
    globe.contentWindow.postMessage({type: 'locora-globe-scroll', progress}, location.origin);
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }
  function mount() {
    if (globe?.isConnected) return;
    sticky = document.querySelector('.world__sticky');
    world = sticky?.closest('.world');
    if (!sticky || !world) return;
    ready = false;
    sticky.classList.remove('is-local-globe');
    globe = document.createElement('iframe');
    globe.className = 'hero-globe-frame';
    globe.title = 'Interactive globe with example photo requests';
    globe.src = path;
    globe.tabIndex = -1;
    sticky.append(globe);
  }
  addEventListener('message', event => {
    if (event.source !== globe?.contentWindow || event.origin !== location.origin || event.data !== 'locora-globe-ready') return;
    ready = true;
    sent = -1;
    globe.tabIndex = 0;
    sticky.classList.add('is-local-globe');
    update();
  });
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  motion.addEventListener('change', schedule);
  mount();
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
})();

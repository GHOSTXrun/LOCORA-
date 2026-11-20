(() => {
  const sticky = document.querySelector('.world__sticky');
  const world = sticky?.closest('.world');
  if (!sticky || !world) return;

  const globe = document.createElement('iframe');
  globe.className = 'hero-globe-frame';
  globe.title = 'Interactive globe with example photo requests';
  globe.src = new URL('./hero-globe.html?v=scroll1', document.currentScript.src).href;
  globe.tabIndex = -1;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let queued = false;
  let sent = -1;

  function update() {
    queued = false;
    if (!ready) return;
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
  function onGlobe(event) {
    if (event.source !== globe.contentWindow || event.origin !== location.origin || event.data !== 'locora-globe-ready') return;
    ready = true;
    sent = -1;
    globe.tabIndex = 0;
    sticky.classList.add('is-local-globe');
    update();
  }
  addEventListener('message', onGlobe);
  sticky.append(globe);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  motion.addEventListener('change', schedule);
})();

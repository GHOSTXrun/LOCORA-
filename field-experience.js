(() => {
  const sticky = document.querySelector('.world__sticky');
  const intro = document.querySelector('.dive');
  if (!sticky || !intro) return;

  const globe = document.createElement('iframe');
  globe.className = 'hero-globe-frame';
  globe.title = 'Interactive globe with example photo requests';
  globe.src = new URL('./hero-globe.html', document.currentScript.src).href;
  globe.tabIndex = -1;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let queued = false;
  let hidden = false;
  function update() {
    queued = false;
    if (!ready) return;
    const distance = Math.max(intro.offsetHeight - innerHeight, 1);
    const fraction = document.querySelector('.times-square-canvas') ? 0 : Math.max(0, Math.min(1, -intro.getBoundingClientRect().top / distance));
    const blend = Math.max(0, Math.min(1, (fraction - .35) / .53));
    const smooth = blend * blend * (3 - 2 * blend);
    const city = motion.matches ? Number(blend >= .5) : smooth;
    sticky.style.setProperty('--city-opacity', city);
    sticky.style.setProperty('--globe-opacity', 1 - city);
    sticky.style.setProperty('--globe-zoom', motion.matches ? 1 : (1 + smooth * .6));
    sticky.classList.toggle('is-local-city', city === 1);
    if (hidden !== (city === 1)) {
      hidden = city === 1;
      globe.tabIndex = hidden ? -1 : 0;
      globe.setAttribute('aria-hidden', String(hidden));
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }
  function onGlobe(event) {
    if (event.source !== globe.contentWindow || event.origin !== location.origin || event.data !== 'locora-globe-ready') return;
    removeEventListener('message', onGlobe);
    ready = true;
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

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  function paint() {
    pending = false;
    const globe = document.querySelector('.world__sticky');
    const section = globe?.closest('.world');
    if (!section) return;
    const distance = Math.max(section.offsetHeight - globe.offsetHeight, 1);
    const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / distance));
    globe.style.setProperty('--locora-globe-roll', reduced.matches ? '0deg' : `${progress * -16}deg`);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(paint);
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  schedule();
})();

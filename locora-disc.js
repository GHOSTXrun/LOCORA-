(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const angles = new WeakMap();
  let active;
  let suppress;
  function setPaused(button, paused) {
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Play LOCORA disc rotation' : 'Pause LOCORA disc rotation');
  }
  function pauseIfReduced() {
    if (!reduced.matches) return;
    const button = document.querySelector('.locora-disc');
    if (button && button.dataset.motion !== 'on') setPaused(button, true);
  }
  pauseIfReduced();
  reduced.addEventListener('change', pauseIfReduced);

  document.addEventListener('pointerdown', event => {
    const button = event.target.closest('.locora-disc');
    if (!button || !event.isPrimary || event.button !== 0) return;
    active = {button, id: event.pointerId, start: event.clientX, angle: angles.get(button) || 0, moved: false};
  });
  document.addEventListener('pointermove', event => {
    if (active?.id !== event.pointerId) return;
    const delta = event.clientX - active.start;
    if (!active.moved && Math.abs(delta) < 5) return;
    if (!active.moved) {
      active.button.setPointerCapture(event.pointerId);
      setPaused(active.button, true);
      active.moved = true;
    }
    const angle = active.angle + delta * 3.1;
    angles.set(active.button, angle);
    active.button.style.setProperty('--locora-disc-angle', `${angle}deg`);
  });
  function finish(event) {
    if (active?.id !== event.pointerId) return;
    if (active.moved) {
      const button = active.button;
      suppress = button;
      setTimeout(() => { if (suppress === button) suppress = undefined; }, 0);
    }
    active = undefined;
  }
  document.addEventListener('pointerup', finish);
  document.addEventListener('pointercancel', finish);
  document.addEventListener('click', event => {
    const button = event.target.closest('.locora-disc');
    if (!button || suppress === button) return;
    const paused = button.getAttribute('aria-pressed') === 'true' || (reduced.matches && button.dataset.motion !== 'on');
    if (paused) button.dataset.motion = 'on';
    setPaused(button, !paused);
  });
})();

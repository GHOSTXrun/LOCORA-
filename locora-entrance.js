(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sessions = new WeakMap();
  function replay(panel) {
    const lines = [...panel.querySelectorAll('.session__lines .line')];
    sessions.get(panel)?.forEach(animation => animation.cancel());
    if (!lines.length || reduced.matches || !lines[0].animate) return;
    const animations = lines.map((line, i) => line.animate(
      [{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'none'}],
      {duration:380,delay:i*210,easing:'ease-out',fill:'backwards'}));
    sessions.set(panel, animations);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-session-replay]');
    const panel = button?.closest('.session');
    if (panel) replay(panel);
  });
  if (!('IntersectionObserver' in window)) return;
  const seen = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      if (reduced.matches) continue;
      if (element.matches('.session')) {
        replay(element);
      } else {
        element.animate?.([{opacity:.55,transform:'translateY(16px)'},{opacity:1,transform:'none'}],
          {duration:550,easing:'cubic-bezier(.22,.7,.3,1)'});
      }
    }
  },{threshold:.12});
  function scan() {
    for (const element of document.querySelectorAll('main .reveal > .wrap, main .locora-proof-flow > .wrap, #agents .session')) {
      if (!seen.has(element)) {
        seen.add(element);
        observer.observe(element);
      }
    }
  }
  scan();
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();

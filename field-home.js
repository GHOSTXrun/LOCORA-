(() => {
  const stage = document.querySelector('#hero-art');
  if (!stage) return;
  const iframe = document.createElement('iframe');
  iframe.title = 'Interactive world globe with sample photo requests';
  iframe.src = new URL('./hero-globe.html', document.currentScript.src).href;
  iframe.tabIndex = -1;

  function ready(event) {
    if (event.origin !== location.origin || event.source !== iframe.contentWindow || event.data !== 'locora-globe-ready') return;
    removeEventListener('message', ready);
    iframe.tabIndex = 0;
    stage.classList.add('is-ready');
  }
  addEventListener('message', ready);
  stage.append(iframe);
})();

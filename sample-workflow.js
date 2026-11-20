(() => {
  const examples = {
    qtkts: ['ts-tkts.jpg','Jim.henderson · Public domain','TKTS_red_stairs_jeh.JPG'],
    qcrowd: ['ts-crowd.jpg','MartinThoma · CC0','Times-Square-2.jpg'],
    qshed: ['ts-shed.jpg','Jim.henderson · CC BY-SA 4.0','47_St_sidewalk_shed_work_2020_jeh.jpg'],
    qscreen: ['ts-screen.jpg','Javier Losa · CC BY 2.0','NYC_43_1_(6629462385).jpg']
  };
  const scriptUrl = document.currentScript.src;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultSummary = 'How crowded is Times Square right now? Here’s what happens from the request to a 1.50 USDC reward in the example.';
  function show(id) {
    const section = document.getElementById('how');
    const panel = document.getElementById('workflow-task');
    const summary = section?.querySelector('[data-workflow-summary]');
    if (!panel || !summary) return;
    if (!Object.hasOwn(examples, id)) {
      if (!panel.hidden) {
        panel.hidden = true;
        delete panel.dataset.task;
        summary.textContent = defaultSummary;
      }
      return;
    }
    if (!panel.hidden && panel.dataset.task === id) return;
    const link = document.querySelector(`[data-example-task="${id}"]`);
    const question = link?.querySelector('.ask-row__q')?.textContent;
    const reward = link?.querySelector('.ask-row__usd')?.textContent;
    const details = link?.querySelector('.ask-row__meta')?.textContent;
    if (!question || !reward || !details) return;
    const [photo, credit, source] = examples[id];
    panel.querySelector('[data-task-question]').textContent = question;
    panel.querySelector('[data-task-reward]').textContent = reward;
    panel.querySelector('[data-task-location]').textContent = details.split(' · ').slice(0, 3).join(' · ');
    const image = panel.querySelector('[data-task-image]');
    image.src = new URL(`./samples/${photo}`, scriptUrl).href;
    image.alt = `Example photo for ${details.split(' · ')[0]}`;
    const attribution = panel.querySelector('[data-task-credit]');
    attribution.textContent = credit;
    attribution.href = `https://commons.wikimedia.org/wiki/File:${source}`;
    summary.textContent = 'Follow your selected request through the six steps below.';
    panel.dataset.task = id;
    panel.hidden = false;
  }
  function fromUrl() {
    show(new URLSearchParams(location.search).get('task'));
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('[data-example-task]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = document.getElementById('how');
    if (!section || !document.getElementById('workflow-task')) return;
    const url = new URL(link.href);
    if (url.href !== location.href) history.pushState(null, '', url.href);
    event.preventDefault();
    show(link.dataset.exampleTask);
    const heading = section.querySelector('#story-title');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
    }
    section.scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth',block:'start'});
  });
  addEventListener('popstate', fromUrl);
  fromUrl();
  new MutationObserver(fromUrl).observe(document.body, {childList:true,subtree:true});
})();

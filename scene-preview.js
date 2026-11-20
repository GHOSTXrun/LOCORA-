(() => {
  const canvas = document.querySelector('.world__canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#d68c50', '#f4b877', '#fff0b9', '#8aabc4', '#afc4cb'];
  let seed = 7123;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const blocks = [];
  function building(x, z, width, depth, height, trim = false) {
    const windowRows = [width, depth, width, depth].map(length => {
      const lights = [];
      for (let y = 3; y < height - 2; y += 2.85) {
        const floorLight = random();
        for (let x = 1.8; x < length - 1.2; x += 2.35) {
          if (random() < .36 + floorLight * .39) {
            lights.push([x / length, y, colors[Math.floor(random() * colors.length)], .30 + random() * .63]);
          }
        }
      }
      return lights;
    });
    blocks.push({x, z, width, depth, height, trim, windowRows});
  }

  const rows = [-138, -90, -42, 6, 54, 102, 150];
  const columns = [-165, -110, -55, 0, 55, 110, 165];
  for (let row = 0; row < rows.length - 1; row++) {
    for (let column = 0; column < columns.length - 1; column++) {
      const x = columns[column] + 7;
      const z = rows[row] + 7;
      if ([2, 3].includes(column) && [2, 3].includes(row)) continue;
      if ((row === 1 && column === 1) || (row === 4 && column === 4) || (row === 1 && column === 4)) continue;
      building(x, z, 14 + random() * 9, 25 + random() * 5, 10 + random() * 39);
      building(x + 26, z + 2, 13 + random() * 8, 23 + random() * 7, 11 + random() * 29);
    }
  }
  building(-98, -85, 33, 34, 158, true);
  building(62, -85, 32, 33, 115, true);
  building(66, 59, 30, 33, 130, true);
  building(-46, -33, 22, 28, 74, true);
  building(28, -29, 18, 24, 59, true);
  building(-43, 20, 25, 26, 31);
  building(20, 18, 22, 27, 83, true);
  building(-97, 59, 37, 34, 64);
  building(112, 60, 36, 31, 46);
  building(113, 110, 35, 31, 55);

  const traffic = Array.from({length: 115}, (_, i) => ({
    x: i % 2 ? -172 + random() * 350 : columns[Math.floor(random() * columns.length)] + 1.9,
    z: i % 2 ? rows[Math.floor(random() * rows.length)] + 1.7 : -150 + random() * 306,
    warm: random() > .33,
    length: .9 + random() * 1.8
  }));

  const steps = [
    [
      "An agent asks for a street photo.",
      "The sample request asks how crowded Times Square is and sets a 1.50 USDC reward."
    ],
    [
      "Someone nearby sees the request.",
      "A contributor reads the question, reward and required location before reserving the task."
    ],
    [
      "The contributor walks to the location.",
      "The distance to the requested spot matters. An answer from outside the allowed radius would be rejected."
    ],
    [
      "They capture a fresh photo.",
      "The contributor frames the public plaza so the agent can see how busy it is."
    ],
    [
      "The evidence is checked.",
      "The production flow checks the recorded location and time, the photo fingerprint and the proof signature."
    ],
    [
      "The payout step concludes the demo.",
      "In production, an accepted answer releases the bounty from escrow. This replay makes no payment."
    ]
  ];
  const story = document.querySelector('.story');
  const stepItems = [...(story?.querySelectorAll('.story__steps li') || [])];
  const storyTitle = story?.querySelector('.story__text h2');
  const storyDescription = story?.querySelector('.story__text p');
  const storyRail = story?.querySelector('.story__fill');
  const originalStory = [storyTitle?.textContent, storyDescription?.textContent];
  let progress = 0;
  let current = -2;
  let angle = -.60;
  let drag;
  let frame;
  let width;
  let height;
  let pixelRatio;
  canvas.tabIndex = 0;
  canvas.removeAttribute('aria-hidden');
  canvas.setAttribute('aria-label', 'Illustrated city at night. Drag or use the left and right arrow keys to rotate.');

  function draw() {
    const compact = width < 760;
    const scale = Math.min(width * (compact ? 1.16 : .66) / 400, height / (compact ? 495 : 385));
    const centerX = width * (compact ? .55 : .765);
    const centerY = height * (compact ? .42 : .64);
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    function project(x, z, y = 0) {
      const depth = x * sin + z * cos;
      const perspective = 1 / (1 - depth / 1050);
      return [centerX + (x * cos - z * sin) * scale * perspective, centerY + (depth * .59 - y) * scale * perspective, depth];
    }
    function polygon(points, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = .65;
        ctx.stroke();
      }
    }
    function ground(x1, z1, x2, z2, color) {
      polygon([project(x1, z1), project(x2, z1), project(x2, z2), project(x1, z2)], color);
    }

    const atmosphere = ctx.createRadialGradient(centerX, centerY - 35 * scale, 0, centerX, centerY, scale * 236);
    atmosphere.addColorStop(0, '#69412850');
    atmosphere.addColorStop(.45, '#44301e35');
    atmosphere.addColorStop(1, '#24120b00');
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, width, height);
    const shadow = ctx.createRadialGradient(centerX, centerY + 26 * scale, 0, centerX, centerY + 26 * scale, scale * 228);
    shadow.addColorStop(0, '#000000df');
    shadow.addColorStop(1, '#00000000');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, width, height);

    ground(-176, -150, 178, 157, '#101010');
    for (const z of rows) {
      ground(-173, z - 2.5, 175, z + 3.5, '#211c18');
      ground(-173, z + 3.5, 175, z + 4, '#5a3b22');
    }
    for (const x of columns) {
      ground(x - 2.5, -149, x + 3.5, 155, '#27201a');
      ground(x + 3.5, -149, x + 4, 155, '#4d3420');
    }
    polygon([project(-41, 13), project(-8, -29), project(12, -22), project(-9, 19)], '#402a1b', '#795037');
    for (const lamp of traffic) {
      const [x, y] = project(lamp.x, lamp.z, .35);
      ctx.fillStyle = lamp.warm ? '#ffc470' : '#e56f54';
      ctx.globalAlpha = .60;
      ctx.fillRect(x, y, lamp.length * scale, Math.max(1, .7 * scale));
    }
    ctx.globalAlpha = 1;

    const order = blocks.map(block => {
      const {x, z, width: w, depth: d, height: h} = block;
      const corners = [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
      return {block, corners, roof: corners.map(([x, z]) => project(x, z, h)), distance: project(x + w / 2, z + d / 2)[2]};
    }).sort((a, b) => a.distance - b.distance);

    for (const {block, corners, roof} of order) {
      for (let side = 0; side < 4; side++) {
        const next = (side + 1) % 4;
        const start = corners[side];
        const end = corners[next];
        const lower = project(...start);
        const other = project(...end);
        if (other[0] >= lower[0]) continue;
        const facade = ctx.createLinearGradient(lower[0], lower[1], roof[next][0], roof[next][1]);
        facade.addColorStop(0, side % 2 ? '#29211c' : '#3a2e24');
        facade.addColorStop(1, side % 2 ? '#11141a' : '#1d1e22');
        polygon([lower, other, roof[next], roof[side]], facade, '#3b2f24');
        for (const [fraction, level, color, opacity] of block.windowRows[side]) {
          const x = start[0] + (end[0] - start[0]) * fraction;
          const z = start[1] + (end[1] - start[1]) * fraction;
          const [px, py] = project(x, z, level);
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.fillRect(px, py, Math.max(.75, .99 * scale), Math.max(.8, 1.16 * scale));
        }
        ctx.globalAlpha = 1;
      }
      polygon(roof, '#1c1917', block.trim ? '#664936' : '#342a22');
      if (block.trim) {
        const {x, z, width: w, depth: d, height: h} = block;
        polygon([project(x + 3, z + 4, h), project(x + w - 4, z + 4, h), project(x + w - 4, z + d - 3, h), project(x + 3, z + d - 3, h)], '#141313', '#46382d');
      }
    }

    const pin = project(-13, -8, 9);
    const contributor = project(-58 + Math.min(progress * 2.6, 1) * 45, 34 - Math.min(progress * 2.6, 1) * 42, 2);
    if (progress > 0 && progress < .8) {
      ctx.fillStyle = '#fff0be';
      ctx.beginPath();
      ctx.arc(contributor[0], contributor[1], 2.8 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    if (progress >= .8) ctx.fillStyle = '#ffd49a';
    else ctx.fillStyle = '#ff642f';
    ctx.shadowColor = '#ff6d27';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(pin[0], pin[1], 3.9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fc733977';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pin[0], pin[1], 7.5 * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  function render() {
    frame = undefined;
    if (width && height) draw();
  }
  function invalidate() {
    if (frame === undefined) frame = requestAnimationFrame(render);
  }
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    invalidate();
  }
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    drag = {id: event.pointerId, x: event.clientX, angle};
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    angle = drag.angle + (event.clientX - drag.x) * .009;
    invalidate();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => {
      if (drag?.id === event.pointerId) drag = undefined;
    });
  }
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    angle += event.key === 'ArrowRight' ? .18 : -.18;
    invalidate();
  });

  let previous = 0;
  function rotate(time) {
    if (!motion.matches && !drag && previous && width && height && document.visibilityState === 'visible') {
      angle += Math.min(time - previous, 45) * .00012;
      draw();
    }
    previous = time;
    if (!motion.matches) setTimeout(() => requestAnimationFrame(rotate), 76);
  }
  function updateStory() {
    if (!story || !storyTitle || !storyDescription || !storyRail) return;
    const top = story.getBoundingClientRect().top;
    const travel = Math.max(story.offsetHeight - window.innerHeight, 1);
    progress = Math.max(0, Math.min(-top / travel, 1));
    const next = top > 1 ? -1 : Math.min(Math.floor(progress * steps.length), steps.length - 1);
    if (next !== current) {
      [storyTitle.textContent, storyDescription.textContent] = steps[next] || originalStory;
      stepItems.forEach((item, index) => {
        item.classList.toggle('is-on', index === next);
        item.classList.toggle('is-done', index < next);
        if (index === next) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
      current = next;
    }
    storyRail.style.transform = `scaleY(${progress})`;
    invalidate();
  }
  window.addEventListener('scroll', updateStory, {passive: true});
  window.addEventListener('resize', updateStory);
  updateStory();
  resize();
  if (!motion.matches) requestAnimationFrame(rotate);
  motion.addEventListener('change', () => {
    previous = 0;
    if (!motion.matches) requestAnimationFrame(rotate);
  });
})();

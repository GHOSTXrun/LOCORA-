(() => {
  const canvas = document.querySelector('.world__canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#c88549', '#f4bf79', '#fff0ba', '#81a5c0'];
  const blocks = [];
  let seed = 7123;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let row = -3; row <= 3; row++) {
    for (let column = -3; column <= 3; column++) {
      if (column === 0 && Math.abs(row) < 2) continue;
      for (let lot = 0; lot < 2; lot++) {
        const width = 10 + random() * 12;
        const depth = 13 + random() * 18;
        const tower = random() > 0.83;
        const height = tower ? 62 + random() * 78 : 10 + random() * 38;
        const windows = [width, depth, width, depth].map(length => {
          const lights = [];
          for (let y = 4; y < height - 2; y += 3.45) {
            for (let x = 2; x < length - 1; x += 2.65) {
              if (random() < .58) lights.push([x / length, y, colors[Math.floor(random() * colors.length)]]);
            }
          }
          return lights;
        });
        blocks.push({x: column * 64 + lot * 23 - 14, z: row * 45, width, depth, height, windows});
      }
    }
  }

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
  let angle = -.68;
  let drag;
  let frame;
  let width;
  let height;
  let pixelRatio;
  canvas.tabIndex = 0;
  canvas.removeAttribute('aria-hidden');
  canvas.setAttribute('aria-label', 'Illustrative city at night. Drag or use the left and right arrow keys to rotate.');

  function draw() {
    const compact = width < 720;
    const scale = Math.min(width * (compact ? 1.14 : .63) / 580, height / (compact ? 620 : 480));
    const centerX = width * (compact ? .59 : .73);
    const centerY = height * (compact ? .34 : .62);
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    function project(x, z, y = 0) {
      const depth = x * sin + z * cos;
      return [centerX + (x * cos - z * sin) * scale, centerY + (depth * .47 - y) * scale, depth];
    }
    function polygon(points, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = .65;
        ctx.stroke();
      }
    }

    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 285);
    glow.addColorStop(0, '#48302255');
    glow.addColorStop(1, '#18100b00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    polygon([project(-235, -165), project(243, -165), project(243, 165), project(-235, 165)], '#151412', '#3a2b1f');
    for (let row = -3; row <= 3; row++) {
      const z = row * 45 + 22;
      polygon([project(-234, z), project(242, z), project(242, z + 4), project(-234, z + 4)], '#29231b');
    }
    for (let column = -3; column <= 3; column++) {
      const x = column * 64 + 38;
      polygon([project(x, -165), project(x + 4, -165), project(x + 4, 165), project(x, 165)], '#29231b');
    }

    const order = blocks.map(building => {
      const {x, z, width: w, depth: d, height: h} = building;
      const corners = [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
      return {building, corners, roof: corners.map(([x, z]) => project(x, z, h)), distance: project(x + w / 2, z + d / 2)[2]};
    }).sort((a, b) => a.distance - b.distance);

    for (const {building, corners, roof} of order) {
      for (let side = 0; side < 4; side++) {
        const next = (side + 1) % 4;
        const start = corners[side];
        const end = corners[next];
        if (roof[next][0] >= roof[side][0]) continue;
        polygon([project(...start), project(...end), roof[next], roof[side]], side % 2 ? '#1c1a19' : '#26221f', '#33291e');
        for (const [fraction, level, color] of building.windows[side]) {
          const x = start[0] + (end[0] - start[0]) * fraction;
          const z = start[1] + (end[1] - start[1]) * fraction;
          const point = project(x, z, level);
          ctx.fillStyle = color;
          ctx.globalAlpha = color === colors[2] ? .92 : .61;
          ctx.fillRect(point[0], point[1], Math.max(.65, 1.25 * scale), Math.max(.8, 1.7 * scale));
        }
        ctx.globalAlpha = 1;
      }
      polygon(roof, '#211e1a', '#3a3028');
    }

    if (progress > 0) {
      const traveler = project(-58 + 53 * Math.min(progress * 2.5, 1), 28 - 26 * Math.min(progress * 2.5, 1), 2);
      ctx.fillStyle = '#f9dbad';
      ctx.beginPath();
      ctx.arc(traveler[0], traveler[1], 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    const marker = project(-5, 2, 1);
    ctx.strokeStyle = '#ff6937';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(marker[0], marker[1], 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ff7b43';
    ctx.beginPath();
    ctx.arc(marker[0], marker[1] - 10 * scale, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();
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

/* Vanilla ports of React Bits ideas (MIT + Commons Clause, davidhdev/react-bits).
   SplitText, ScrollReveal, CountUp, TextType, RotatingText, DecryptedText,
   SpotlightCard, Magnet, TiltedCard, DotGrid. No dependencies. Reduced motion respected. */
(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const onView = (el, cb, th = 0.25) => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } }), { threshold: th });
    io.observe(el);
  };

  /* SplitText: wraps words/chars in spans with --i; CSS animates .is-in */
  function split(el, by) {
    const text = el.textContent; el.setAttribute('aria-label', text); el.textContent = '';
    let i = 0;
    text.split(/(\s+)/).forEach(w => {
      if (/^\s+$/.test(w)) { el.append(' '); return; }
      const ws = document.createElement('span'); ws.className = 'fx-w'; ws.setAttribute('aria-hidden', 'true');
      if (by === 'chars') [...w].forEach(c => { const s = document.createElement('span'); s.className = 'fx-c'; s.textContent = c; s.style.setProperty('--i', i++); ws.append(s); });
      else { ws.textContent = w; ws.style.setProperty('--i', i++); }
      el.append(ws);
    });
  }
  $$('[data-split]').forEach(el => {
    // keep <br>/<em> structure: split each text node's parent chunk
    const parts = el.querySelectorAll('[data-split-part]');
    (parts.length ? [...parts] : [el]).forEach(p => split(p, el.dataset.split));
    if (RM) { el.classList.add('is-in'); return; }
    onView(el, e => requestAnimationFrame(() => e.classList.add('is-in')), 0.1);
  });

  /* ScrollReveal: word opacity scrubbed by scroll position */
  const scrubs = $$('[data-scrub]');
  scrubs.forEach(el => split(el, 'words'));
  function scrubTick() {
    const vh = innerHeight;
    scrubs.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const ws = el.querySelectorAll('.fx-w');
      ws.forEach((w, i) => { const t = Math.min(1, Math.max(0, p * ws.length * 1.15 - i)); w.style.opacity = (0.38 + 0.62 * t).toFixed(3); });
    });
  }
  if (scrubs.length) { if (RM) scrubs.forEach(el => el.querySelectorAll('.fx-w').forEach(w => w.style.opacity = 1)); else { addEventListener('scroll', scrubTick, { passive: true }); scrubTick(); } }

  /* CountUp */
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, pre = el.dataset.pre || '', fmt = n => pre + Math.round(n).toLocaleString('en-US');
    if (RM) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    onView(el, () => { const t0 = performance.now(), d = 1400; const f = t => { const k = Math.min(1, (t - t0) / d); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  });

  /* RotatingText */
  $$('[data-rotate]').forEach(el => {
    const words = JSON.parse(el.dataset.rotate); let i = 0;
    if (RM) return;
    setInterval(() => {
      i = (i + 1) % words.length;
      el.classList.add('fx-out');
      setTimeout(() => {
        el.textContent = ''; [...words[i]].forEach((c, k) => { const s = document.createElement('span'); s.className = 'fx-rc'; s.style.setProperty('--i', k); s.textContent = c === ' ' ? ' ' : c; el.append(s); });
        el.classList.remove('fx-out');
      }, 320);
    }, 2400);
  });

  /* DecryptedText */
  const GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&';
  $$('[data-decrypt]').forEach(el => {
    const final = el.textContent; if (RM) return;
    onView(el, () => {
      let f = 0; const total = final.length + 14;
      const id = setInterval(() => {
        el.textContent = [...final].map((c, k) => c === ' ' ? ' ' : k < f - 14 ? c : GLY[(Math.random() * GLY.length) | 0]).join('');
        if (++f > total) { clearInterval(id); el.textContent = final; }
      }, 34);
    });
  });

  /* TextType: types child [data-line] elements in sequence */
  window.fxType = function (el, speed = 22) {
    const lines = $$('[data-line]', el); const texts = lines.map(l => l.textContent);
    if (RM) return Promise.resolve();
    lines.forEach(l => { l.textContent = ''; l.classList.add('fx-typing'); });
    return lines.reduce((p, l, k) => p.then(() => new Promise(res => {
      let n = 0; const id = setInterval(() => { l.textContent = texts[k].slice(0, ++n); if (n >= texts[k].length) { clearInterval(id); l.classList.remove('fx-typing'); setTimeout(res, 90); } }, speed);
    })), Promise.resolve());
  };

  /* SpotlightCard */
  $$('[data-spot]').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* Magnet */
  if (!RM && matchMedia('(hover:hover)').matches) $$('[data-magnet]').forEach(el => {
    const s = +el.dataset.magnet || 0.3;
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px,${(e.clientY - r.top - r.height / 2) * s}px)`; });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });

  /* TiltedCard */
  if (!RM && matchMedia('(hover:hover)').matches) $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) scale(1.03)`; });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });

  /* Reveal-on-view utility */
  $$('[data-in]').forEach(el => RM ? el.classList.add('is-in') : onView(el, e => e.classList.add('is-in'), 0.15));

  /* DotGrid: canvas dots pushed by pointer, tinted near it */
  window.fxDotGrid = function (cv, o = {}) {
    const g = o.gap || 28, rad = o.size || 2, prox = o.prox || 140, base = o.base || '#333', act = o.active || '#c6ff3d';
    const ctx = cv.getContext('2d'); let W, H, dots = [], px = -999, py = -999, dpr = Math.min(2, devicePixelRatio || 1);
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = hex(base), B = hex(act);
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dots = []; for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) dots.push({ x, y, ox: 0, oy: 0 }); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        const dx = d.x - px, dy = d.y - py, dist = Math.hypot(dx, dy); let t = 0;
        if (dist < prox) { t = 1 - dist / prox; const f = t * t * 18; d.ox += ((dx / (dist || 1)) * f - d.ox) * .2; d.oy += ((dy / (dist || 1)) * f - d.oy) * .2; }
        else { d.ox *= .9; d.oy *= .9; }
        const c = A.map((a, i) => Math.round(a + (B[i] - a) * t));
        ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); ctx.arc(d.x + d.ox, d.y + d.oy, rad + t * 1.6, 0, 7); ctx.fill();
      }
      if (!RM) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', size);
    cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
    cv.parentElement.addEventListener('pointerleave', () => { px = py = -999; });
    draw();
  };
  window.fxOnView = onView; window.fxRM = RM;
})();

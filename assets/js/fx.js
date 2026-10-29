/* =========================================================================
   Ninja Rebirth VN — fx.js
   Hiệu ứng hạt trên canvas: đòn đánh, kỹ năng, chưởng lực, chớp, hồi máu.
   Tự tắt khi người dùng bật "giảm chuyển động", giới hạn số hạt để chạy mượt
   trên điện thoại.
   ========================================================================= */
'use strict';

const FX = (function () {
  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let w = 0, h = 0;
  let running = false;
  let reduced = false;
  const MAX_PARTICLES = 220;

  const particles = [];
  const rings = [];
  const shots = [];
  const flashes = [];

  const rnd = (a, b) => a + Math.random() * (b - a);

  function init() {
    canvas = document.getElementById('fx-layer');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ensureLoop() {
    if (running || !ctx) return;
    running = true;
    requestAnimationFrame(tick);
  }

  function centerOf(node) {
    if (!node) return { x: w / 2, y: h / 2 };
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function addParticle(p) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(p);
    ensureLoop();
  }

  function burst(x, y, color, opts) {
    if (reduced) return;
    const o = opts || {};
    const count = Math.round((o.count || 16) * (w < 640 ? 0.7 : 1));
    const speed = o.speed || 3.2;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rnd(0.4, 1) * speed;
      addParticle({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - (o.up || 0.6),
        life: 0, max: rnd(0.35, 0.8),
        size: rnd(1.4, o.size || 3.4),
        color,
        gravity: o.gravity === undefined ? 0.05 : o.gravity,
        type: o.type || 'dot',
        rot: Math.random() * 6.28,
        vr: rnd(-0.2, 0.2)
      });
    }
  }

  function ring(x, y, color, opts) {
    if (reduced) return;
    const o = opts || {};
    rings.push({ x, y, r: o.from || 6, max: o.to || 90, life: 0, dur: o.dur || 0.5, color, width: o.width || 3 });
    ensureLoop();
  }

  function flash(color, alpha) {
    if (reduced) return;
    flashes.push({ life: 0, dur: 0.32, color, alpha: alpha === undefined ? 0.22 : alpha });
    ensureLoop();
  }

  function shoot(fromNode, toNode, color, opts) {
    if (!ctx || reduced) { return Promise.resolve(); }
    const o = opts || {};
    const a = centerOf(fromNode);
    const b = centerOf(toNode);
    const dur = o.dur || 0.22;
    return new Promise((resolve) => {
      let settled = false;
      const done = () => { if (settled) return; settled = true; burst(b.x, b.y, color, { count: o.count || 18, speed: 3.4 }); resolve(); };
      // lưới an toàn: nếu vòng lặp vẽ không chạy (tab ẩn, thiết bị yếu) vẫn phải kết thúc
      setTimeout(done, dur * 1000 + 320);
      shots.push({
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        x: a.x, y: a.y, life: 0, dur, color,
        arc: o.arc === undefined ? -40 : o.arc,
        trail: [],
        done
      });
      ensureLoop();
    });
  }

  function slash(fromNode, toNode, color) {
    if (reduced) return;
    const a = centerOf(fromNode);
    const b = centerOf(toNode);
    rings.push({ x: b.x, y: b.y, r: 4, max: 44, life: 0, dur: 0.34, color, width: 4 });
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      addParticle({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * -18,
        vx: rnd(-0.4, 0.4), vy: rnd(-0.6, 0.2),
        life: 0, max: 0.22 + t * 0.1, size: rnd(1.6, 3),
        color, gravity: 0, type: 'spark', rot: 0, vr: 0
      });
    }
    ensureLoop();
  }

  function hit(node, color, opts) {
    const o = opts || {};
    const c = centerOf(node);
    burst(c.x, c.y + rnd(-10, 10), color, {
      count: o.crit ? 30 : 18,
      speed: o.crit ? 5 : 3.6,
      size: o.crit ? 4.6 : 3.4
    });
    ring(c.x, c.y, color, { to: o.crit ? 78 : 54, width: o.crit ? 4 : 2.6 });
    if (o.crit) flash(color, 0.16);
    if (node) {
      node.classList.remove('is-hit');
      void node.offsetWidth;
      node.classList.add('is-hit');
      setTimeout(() => node.classList.remove('is-hit'), 340);
    }
  }

  function healFx(node) {
    const c = centerOf(node);
    for (let i = 0; i < 14; i++) {
      addParticle({
        x: c.x + rnd(-34, 34),
        y: c.y + rnd(-6, 30),
        vx: rnd(-0.35, 0.35),
        vy: rnd(-1.9, -0.9),
        life: 0, max: rnd(0.5, 0.9),
        size: rnd(1.6, 3.2),
        color: '#7ef0b0',
        gravity: -0.01,
        type: 'dot',
        rot: 0, vr: 0
      });
    }
    ensureLoop();
  }

  function cast(node, color) {
    const c = centerOf(node);
    ring(c.x, c.y, color, { from: 10, to: 64, dur: 0.42, width: 2 });
    burst(c.x, c.y + 8, color, { count: 8, speed: 1.6, up: 1.2, gravity: -0.02 });
  }

  function ultimate(node, color) {
    const c = centerOf(node);
    flash(color, 0.3);
    ring(c.x, c.y, color, { from: 12, to: 220, dur: 0.75, width: 5 });
    ring(c.x, c.y, '#ffffff', { from: 6, to: 140, dur: 0.55, width: 2 });
    burst(c.x, c.y, color, { count: 46, speed: 6, size: 4.8 });
    burst(c.x, c.y, '#ffffff', { count: 16, speed: 3.2, size: 2.6 });
  }

  function shake(node, strong) {
    if (reduced || !node) return;
    node.classList.remove('fx-shake', 'fx-shake-strong');
    void node.offsetWidth;
    node.classList.add(strong ? 'fx-shake-strong' : 'fx-shake');
    setTimeout(() => node.classList.remove('fx-shake', 'fx-shake-strong'), strong ? 520 : 360);
  }

  function lunge(node, dir) {
    if (reduced || !node) return;
    node.classList.remove('fx-lunge-up', 'fx-lunge-down');
    void node.offsetWidth;
    node.classList.add(dir === 'down' ? 'fx-lunge-down' : 'fx-lunge-up');
    setTimeout(() => node.classList.remove('fx-lunge-up', 'fx-lunge-down'), 400);
  }

  /* ---------------- vòng lặp vẽ ---------------- */
  let last = 0;
  function tick(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    ctx.clearRect(0, 0, w, h);

    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.life += dt;
      const t = Math.min(1, s.life / s.dur);
      const ease = t * t * (3 - 2 * t);
      s.x = s.x1 + (s.x2 - s.x1) * ease;
      s.y = s.y1 + (s.y2 - s.y1) * ease + Math.sin(ease * Math.PI) * s.arc;
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 7) s.trail.shift();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      s.trail.forEach((p, idx) => {
        const a = (idx + 1) / s.trail.length;
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1 + a * 3.4, 0, 6.283);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4.2, 0, 6.283);
      ctx.fill();
      ctx.restore();

      if (t >= 1) { s.done(); shots.splice(i, 1); }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.rot += p.vr;
      const a = 1 - p.life / p.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color;
      if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a + 0.4, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life += dt;
      const t = r.life / r.dur;
      if (t >= 1) { rings.splice(i, 1); continue; }
      const rad = r.r + (r.max - r.r) * t;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, 6.283);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life += dt;
      const t = f.life / f.dur;
      if (t >= 1) { flashes.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = f.alpha * (1 - t);
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    if (particles.length || rings.length || shots.length || flashes.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }

  function clear() {
    particles.length = 0;
    rings.length = 0;
    shots.length = 0;
    flashes.length = 0;
    if (ctx) ctx.clearRect(0, 0, w, h);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { burst, ring, flash, shoot, slash, hit, healFx, cast, ultimate, shake, lunge, centerOf, clear, resize };
})();

/* ============================================================
   NAKWON SHOWCASE — 연출(FX) 모듈
   안개 텍스처 생성 · 불씨/먼지 파티클 · 필름 그레인
   ============================================================ */
(function () {
  /* ---------- 가로로 이어붙여도 끊김 없는 안개 텍스처 ---------- */
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const smooth = (t) => t * t * (3 - 2 * t);

  function makeFog(opts) {
    const W = opts.w || 1024, H = opts.h || 256;
    const rnd = mulberry(opts.seed || 1);
    const [R, G, B] = opts.rgb;
    const octs = [
      { fx: 3, fy: 3, a: 1.0 }, { fx: 6, fy: 5, a: 0.6 },
      { fx: 12, fy: 8, a: 0.34 }, { fx: 24, fy: 14, a: 0.18 }
    ].map((o) => {
      const g = new Float32Array(o.fx * (o.fy + 1));
      for (let i = 0; i < g.length; i++) g[i] = rnd();
      return Object.assign(o, { g });
    });
    let norm = 0; octs.forEach((o) => (norm += o.a));

    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    const d = img.data;
    const lo = opts.lo != null ? opts.lo : 0.40, hi = opts.hi != null ? opts.hi : 0.86;
    const gain = opts.gain != null ? opts.gain : 1;

    for (let y = 0; y < H; y++) {
      const vy = y / H;
      let vmask = 1;
      if (opts.ground) vmask = Math.pow(vy, opts.ground);           // 아래로 갈수록 짙게
      else if (opts.band) vmask = Math.sin(Math.PI * vy);            // 가운데 띠
      for (let x = 0; x < W; x++) {
        let n = 0;
        for (const o of octs) {
          const gx = (x / W) * o.fx, gy = vy * o.fy;
          const x0 = Math.floor(gx), y0 = Math.floor(gy);
          const tx = smooth(gx - x0), ty = smooth(gy - y0);
          const xa = x0 % o.fx, xb = (x0 + 1) % o.fx;               // 가로 방향 wrap
          const a = o.g[y0 * o.fx + xa], b = o.g[y0 * o.fx + xb];
          const c2 = o.g[(y0 + 1) * o.fx + xa], d2 = o.g[(y0 + 1) * o.fx + xb];
          n += o.a * ((a + (b - a) * tx) * (1 - ty) + (c2 + (d2 - c2) * tx) * ty);
        }
        n /= norm;
        let t = (n - lo) / (hi - lo); t = t < 0 ? 0 : t > 1 ? 1 : t;
        const al = smooth(t) * vmask * gain;
        const i = (y * W + x) * 4;
        d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = Math.min(255, al * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }


  /* ---------- 불꽃 텍스처 (불타는 전환 / 타이틀 화염) ---------- */
  function makeFire(o) {
    const W = o.w, H = o.h, rnd = mulberry(o.seed || 5);
    const OC = o.mode === 'burn' ? [{ fx: 8, fy: 4, a: 1 }, { fx: 16, fy: 8, a: .55 }, { fx: 32, fy: 15, a: .3 }, { fx: 64, fy: 28, a: .16 }] : [{ fx: 16, fy: 3, a: 1 }, { fx: 32, fy: 6, a: .55 }, { fx: 64, fy: 11, a: .28 }, { fx: 110, fy: 20, a: .14 }];
    const octs = OC.map((q) => {
      const g = new Float32Array(q.fx * (q.fy + 1)); for (let i = 0; i < g.length; i++) g[i] = rnd(); return Object.assign(q, { g });
    });
    let norm = 0; octs.forEach((q) => (norm += q.a));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      const ya = y / H; let h;
      if (o.mode === 'burn') { const t = .28; h = ya < t ? ya / t : ya > 1 - t ? (1 - ya) / t : 1.4; }
      else { h = (ya - .22) / .78; h = h < 0 ? 0 : h; }
      for (let x = 0; x < W; x++) {
        let n = 0;
        for (const q of octs) {
          const gx = (x / W) * q.fx, gy = ya * q.fy, x0 = Math.floor(gx), y0 = Math.floor(gy), tx = smooth(gx - x0), ty = smooth(gy - y0);
          const xa = x0 % q.fx, xb = (x0 + 1) % q.fx;
          const a = q.g[y0 * q.fx + xa], b = q.g[y0 * q.fx + xb], c2 = q.g[(y0 + 1) * q.fx + xa], d2 = q.g[(y0 + 1) * q.fx + xb];
          n += q.a * ((a + (b - a) * tx) * (1 - ty) + (c2 + (d2 - c2) * tx) * ty);
        }
        n /= norm;
        const v = h * 1.25 - n * 0.95;
        let al = v <= 0 ? 0 : Math.min(1, v / 0.07);
        let R, G, B;
        if (v < (o.mode === 'burn' ? .12 : .06)) { R = 255; G = 220; B = 130; } else if (v < (o.mode === 'burn' ? .3 : .16)) { R = 255; G = 120; B = 34; } else if (v < (o.mode === 'burn' ? .55 : .4)) { R = 214; G = 40; B = 24; }
        else if (o.mode === 'burn' && v > .8) { R = 20; G = 7; B = 6; } else { R = 112; G = 18; B = 14; }
        if (o.mode === 'burn' && v > .8 && rnd() < .0016) { R = 255; G = 140; B = 40; }
        if (o.mode !== 'burn') al *= 0.72 - Math.min(.5, v * .75);
        const i = (y * W + x) * 4; d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = al * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }

  function installFogTextures(lite) {
    const root = document.documentElement.style;
    const s = lite ? 0.5 : 1;
    const W = Math.round(1024 * s), H = Math.round(256 * s);
    root.setProperty('--fog-cold', 'url(' + makeFog({ w: W, h: H, seed: 11, rgb: [62, 72, 80] }) + ')');
    root.setProperty('--fog-ground', 'url(' + makeFog({ w: W, h: H, seed: 23, rgb: [48, 74, 80], ground: 1.4, lo: 0.34, hi: 0.78 }) + ')');
    root.setProperty('--fog-red', 'url(' + makeFog({ w: W, h: H, seed: 37, rgb: [150, 26, 24], lo: 0.46, hi: 0.9, band: true }) + ')');
    root.setProperty('--fog-dense', 'url(' + makeFog({ w: W, h: H, seed: 53, rgb: [40, 44, 50], lo: 0.22, hi: 0.62, gain: 1.15 }) + ')');
  }

  /* ---------- 불씨 / 먼지 파티클 ---------- */
  function startEmbers(canvas, opt) {
    opt = opt || {};
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const N = opt.count || 170;
    const P = [];
    const rnd = Math.random;
    function spawn(p, init) {
      const red = rnd() < 0.68;
      p.red = red;
      p.x = rnd() * W;
      p.y = init ? rnd() * H : H + 10;
      p.r = red ? 0.8 + rnd() * 2.2 : 0.6 + rnd() * 1.6;
      p.vy = -(red ? 0.18 + rnd() * 0.55 : 0.04 + rnd() * 0.16);
      p.vx = (rnd() - 0.5) * (red ? 0.25 : 0.12);
      p.ph = rnd() * 6.28;
      p.sp = 0.6 + rnd() * 1.6;
      p.life = 0.4 + rnd() * 0.6;
    }
    for (let i = 0; i < N; i++) { const p = {}; spawn(p, true); P.push(p); }

    let last = 0, t = 0, boost = 0, wind = 0;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (ts - last < 33) return;      // 30fps 제한
      const dt = (ts - last) / 16.7; last = ts; t += 0.016 * dt;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of P) {
        p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 0.18 + wind * (0.5 + 0.25 * p.sp)) * dt * (1 + boost);
        p.y += p.vy * dt * (1 + boost * 2);
        if (p.y < -12 || p.x < -12 || p.x > W + 12) spawn(p, false);
        const tw = 0.55 + 0.45 * Math.sin(t * 3 * p.sp + p.ph);
        const hf = 1 - Math.max(0, (p.y / H) - 0.55) * 0.4;
        const a = (p.red ? 0.85 : 0.5) * tw * p.life * hf;
        const rr = p.r * (p.red ? 4.2 : 3.4);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        if (p.red) { g.addColorStop(0, 'rgba(255,150,110,' + a + ')'); g.addColorStop(0.35, 'rgba(230,50,35,' + a * 0.55 + ')'); g.addColorStop(1, 'rgba(200,30,20,0)'); }
        else { g.addColorStop(0, 'rgba(190,245,248,' + a + ')'); g.addColorStop(0.4, 'rgba(76,194,202,' + a * 0.4 + ')'); g.addColorStop(1, 'rgba(76,194,202,0)'); }
        ctx.fillStyle = g;
        ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
      }
      boost *= 0.96;
    }
    requestAnimationFrame(frame);
    return { burst() { boost = 3.5; }, setWind(v) { wind = v; } };
  }

  /* ---------- 필름 그레인 ---------- */
  function grainURL() {
    const s = 220, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d'), im = x.createImageData(s, s);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return 'url(' + c.toDataURL('image/png') + ')';
  }

  window.NakwonFX = { installFogTextures, startEmbers, grainURL };
})();

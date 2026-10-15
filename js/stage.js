/* ============================================================
   NAKWON SHOWCASE — LED 스테이지 렌더러
   state(section, step …) → 화면. 같은 뷰 안의 스텝 이동은 부드럽게,
   뷰가 바뀌면 안개 분출(surge)과 함께 장면을 교체합니다.
   ============================================================ */
(function () {
  const S = window.SHOWCASE;
  const params = new URLSearchParams(location.search);
  const PREVIEW = params.get('preview') === '1';
  const LITE = PREVIEW || params.get('lite') === '1';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nl = (s) => esc(s);

  const stage = $('#stage'), scenesEl = $('#scenes'), bgEl = $('#bg');
  document.body.classList.toggle('lite', LITE);

  /* ---------- 스케일 (13920×2160 → 창 크기에 맞춤) ---------- */
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    const k = Math.min(vw / S.stage.w, vh / S.stage.h);
    const x = (vw - S.stage.w * k) / 2, y = (vh - S.stage.h * k) / 2;
    stage.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + k + ')';
  }
  addEventListener('resize', fit); fit();

  /* ---------- 연출 초기화 ---------- */
  NakwonFX.installFogTextures(LITE);
  $('#grain').style.backgroundImage = NakwonFX.grainURL();
  let embers = null;
  if (!LITE) {
    const cv = $('#embers'); cv.width = 3480; cv.height = 540;
    embers = NakwonFX.startEmbers(cv, { count: 190 });
  }

  /* ---------- 배경 ---------- */
  let curBgKey = '';
  function setBg(spec) {
    const key = JSON.stringify(spec || {});
    if (key === curBgKey) return;
    curBgKey = key;
    const old = Array.from(bgEl.children);
    const set = el('div', 'bgset');
    const plate = (cls, p) => {
      if (!p) return;
      const d = el('div', 'plate ' + cls);
      const i = el('i'); i.style.backgroundImage = 'url("' + p.img + '")'; i.style.backgroundPosition = p.pos || '50% 50%';
      if (p.o != null) i.style.setProperty('--o', p.o);
      d.appendChild(i); set.appendChild(d);
    };
    if (spec && spec.j) plate('J', spec.j);
    if (spec && spec.l) plate('L', spec.l);
    if (spec && spec.r) plate('R', spec.r);
    bgEl.appendChild(set);
    void set.offsetWidth; set.classList.add('in');
    old.forEach((o) => { o.classList.remove('in'); o.classList.add('out'); setTimeout(() => o.remove(), 1800); });
  }

  /* ---------- 뷰 정의 ---------- */
  const faceHTML = (cls, inner) => '<div class="face ' + cls + '"><div class="inner">' + inner + '</div></div>';

  const VIEWS = {};

  VIEWS.black = {
    joint: true,
    bg: () => ({}),
    build() { return { root: el('div', 'scene black'), update() { } }; }
  };

  VIEWS.title = {
    joint: true,
    bg: () => ({}),
    build() {
      const t = S.title;
      const root = el('div', 'scene title');
      root.innerHTML =
        '<div class="t-art rv" style="--d:2.4s;animation-duration:4.5s"></div>' +
        '<div class="t-block">' +
        '<div class="t-logowrap rv" style="--d:3.2s;animation-duration:2.8s"><img class="t-logo" src="assets/logo.png" alt="NAKWON"><img class="t-shine" src="assets/logo.png" alt=""></div>' +
        '<div class="t-sub rv" style="--d:4.4s;animation-duration:2s">' + esc(t.sub) + '</div>' +
        '<div class="t-meta rv" style="--d:5s;animation-duration:2s">' + esc(t.meta) + '</div></div>' +
        '<div class="t-clear"><i class="c1"></i><i class="c2"></i></div>';
      return { root, update() { } };
    }
  };

  VIEWS.card = {
    joint: true,
    bg: (st) => { const c = S.cards[st.card]; return { j: { img: c.bg.img, pos: c.bg.pos, o: .5 } }; },
    build(st) {
      const c = S.cards[st.card];
      const root = el('div', 'scene card');
      const gs = Math.min(1900, Math.floor(12600 / Math.max(2.4, c.title.length * 0.95)));
      root.innerHTML =
        '<div class="c-ghost rv" style="--gs:' + gs + 'px;--d:.1s">' + esc(c.title) + '</div>' +
        '<div class="c-kicker rv" style="--d:.3s">' + esc(c.kicker) + '</div>' +
        '<div class="c-title rv" style="--d:.5s">' + esc(c.title) + '</div>' +
        '<div class="c-stroke rv" style="--d:.8s"></div>' +
        (c.sub ? '<div class="c-sub rv" style="--d:1.0s">' + esc(c.sub) + '</div>' : '');
      return { root, update() { } };
    }
  };

  VIEWS.agenda = {
    joint: true,
    bg: () => ({ j: { img: 'assets/key.webp', pos: '50% 30%', o: .2 } }),
    build() {
      const A = S.agenda;
      const root = el('div', 'scene ag');
      const tile = (it, i, d) => '<div class="tl ag rv" style="--d:' + d + 's"><div class="im" style="background-image:url(\'' + esc(it.img) + '\');background-position:' + (it.pos || '50% 50%') + '"></div>' +
        '<div class="tx"><div class="no">' + (i + 1) + '</div><div class="nm">' + esc(it.name) + '</div><div class="ds">' + esc(it.desc) + '</div></div><i class="glint"></i></div>';
      const grp = (list, off, x, d0) => '<div class="bx ag-bx" style="left:' + x + 'px"><div class="bento" style="grid-template-columns:repeat(' + list.length + ',1fr);grid-template-rows:1fr">' + list.map((it, i) => tile(it, off + i, d0 + i * 0.2)).join('') + '</div></div>';
      const items = A.items, half = Math.ceil(items.length / 2);
      root.innerHTML = headerHTML(A.title, esc(A.sub)) + grp(items.slice(0, half), 0, GL, 0.9) + grp(items.slice(half), half, GR, 1.2) +
        '<div class="bn rv" style="--d:1.8s"><span class="dm"></span><b>' + esc(A.banner || '') + '</b><span class="dm"></span></div>';
      let started = false;
      return {
        root,
        update() {          // 등장이 끝나면 반짝이는 빛이 1→5번 타일 위를 하나씩 지나감 (다른 타일은 그대로)
          if (started) return; started = true;
          const gl = Array.from(root.querySelectorAll('.glint'));
          gl.forEach((g, i) => setTimeout(() => {
            if (!root.isConnected) return;
            g.style.setProperty('--sx', (12 + Math.random() * 60) + '%'); g.style.setProperty('--sy', (10 + Math.random() * 45) + '%');
            g.classList.remove('go'); void g.offsetWidth; g.classList.add('go');
          }, 3400 + i * 900));
        }
      };
    }
  };

  /* ============================================================
     전체 화면(좌우 연결) 뷰 — 로드맵 / 업데이트 소개 / 설명
     좌면 0~6960, 우면 6960~13920, 모서리 x=6960 (가운데 간격에 둠)
     ============================================================ */
  const MEDIA_RE = /\.(mp4|webm|mov)$/i;
  const mediaHTML = (src, pos) => MEDIA_RE.test(src)
    ? '<video src="' + esc(src) + '" autoplay muted loop playsinline></video>'
    : '<div class="im" style="background-image:url(\'' + esc(src) + '\');background-position:' + (pos || '50% 50%') + '"></div>';

  // 상단 타이틀 배너 (양옆 라인 + 마름모 장식 + 로고)
  function headerHTML(title, capHTML, capId) {
    return '<div class="hd rv" style="--d:.2s"><i class="hl"></i><div class="hm"><span class="dm"></span><h2>' + esc(title) + '</h2><span class="dm"></span></div><i class="hl r"></i></div>' +
      '<img class="hd-logo rv" style="--d:.5s" src="assets/logo.png" alt="">' +
      '<div class="cap rv" ' + (capId ? 'id="' + capId + '"' : '') + ' style="--d:.8s">' + capHTML + '</div>';
  }

  const GL = 240, GR = 7060, CW = 932, CG = 16;   // 좌 묶음 / 우 묶음 시작 x, 열 너비, 간격

  const CAT_IMG = { map: 'map-island.webp', weather: 'shot-hanok.webp', trait: 'ui-traits.webp', mode: 'key.webp', system: 'shot-store.webp', season: 'shot-housing.webp' };

  VIEWS.roadmap = {
    joint: true,
    bg: () => ({ j: { img: 'assets/map-island.webp', pos: '50% 45%', o: .2 } }),
    build() {
      const R = S.roadmap;
      const root = el('div', 'scene rm');
      const groups = [{ k: 'L', x: GL, from: 0, to: 6 }, { k: 'R', x: GR, from: 7, to: 12 }];
      let html = headerHTML(R.title + ' ' + R.sub, esc(R.kicker), 'rmCap');
      const bar = (x, w, label, d) => '<div class="yb rv" style="left:' + x + 'px;width:' + w + 'px;--d:' + d + 's">' + esc(label) + '</div>';
      html += bar(GL, 7 * CW + 6 * CG, '2027', .9) + bar(GR, 6 * CW + 5 * CG, '2028', 1.0) + bar(GR + 6 * (CW + CG), CW, '구분', 1.1);
      groups.forEach((g) => {
        const n = g.to - g.from + 1;
        let cells = '';
        for (let c = g.from; c <= g.to; c++) {
          cells += '<div class="mh rv" data-col="' + c + '" style="grid-column:' + (c - g.from + 1) + ';grid-row:1;--d:' + (0.9 + (c - g.from) * 0.05) + 's">' + R.months[c].m + '월</div>';
        }
        R.items.filter((it) => it.col >= g.from && it.col <= g.to).forEach((it) => {
          const gc = it.col - g.from + 1;
          const img = CAT_IMG[it.cat];
          const st = 'grid-column:' + gc + ';grid-row:' + (it.r1 + 1) + '/' + (it.r2 + 2) + ';--d:' + (1.0 + (it.col - g.from) * 0.08 + it.r1 * 0.04) + 's' +
            (img ? ';--img:url(\'assets/' + img + '\');--ip:' + ((it.col * 37) % 100) + '% ' + ((it.col * 53) % 100) + '%' : '');
          cells += '<div class="cell cat-' + it.cat + ' sz-' + it.size + ' rv" data-col="' + it.col + '" style="' + st + '">' +
            (it.kicker ? '<div class="k">' + esc(it.kicker) + '</div>' : '') + '<div class="t">' + esc(it.text) + '</div></div>';
        });
        let legend = '';
        if (g.k === 'R') {
          legend = '<div class="legend rv" style="grid-column:7;grid-row:1/9;--d:1.4s">' + R.legend.map((l) => '<div class="lg"><i class="cat-' + l[0] + '"></i><span>' + esc(l[1]) + '</span></div>').join('') + '</div>';
        }
        html += '<div class="beamcol" data-g="' + g.k + '"></div><div class="grid g' + g.k + '" style="left:' + g.x + 'px"><div class="gi">' + cells + legend + '</div></div>';
      });
      html += '<div class="foot rv" style="--d:1.8s">' + esc(R.footnote) + '</div>';
      root.innerHTML = html;
      const beams = {}; root.querySelectorAll('.beamcol').forEach((b) => (beams[b.dataset.g] = b));
      const cap = root.querySelector('#rmCap');
      return {
        root,
        update(st) {
          const hl = st.hl, on = hl != null;
          root.classList.toggle('hl', on);
          root.querySelectorAll('[data-col]').forEach((n) => n.classList.toggle('on', on && +n.dataset.col === hl));
          Object.values(beams).forEach((b) => (b.style.opacity = 0));
          if (on) {
            const g = hl <= 6 ? 'L' : 'R', from = hl <= 6 ? 0 : 7, x0 = hl <= 6 ? GL : GR;
            const b = beams[g];
            b.style.left = (x0 - 20 + (hl - from) * (CW + CG)) + 'px'; b.style.opacity = 1;
            const stp = R.steps.find((s) => s.col === hl);
            const parts = (stp ? stp.label : '').split(' ');
            cap.classList.add('on');
            cap.innerHTML = '<b>' + esc(parts.shift()) + '</b>' + esc(parts.join(' '));
          } else { cap.classList.remove('on'); cap.textContent = R.kicker; }
        }
      };
    }
  };

  // 묶음 안 타일 배치 (벤토) — 항목 수에 따라 자동
  const BENTO = {
    1: { cols: 1, areas: ['1/1/3/2'] , rows: 2 },
    2: { cols: 5, areas: ['1/1/3/4', '1/4/3/6'], rows: 2 },
    3: { cols: 5, areas: ['1/1/3/4', '1/4/2/6', '2/4/3/6'], rows: 2 },
    4: { cols: 7, areas: ['1/1/2/5', '1/5/2/8', '2/1/3/4', '2/4/3/8'], rows: 2 }
  };
  function bentoHTML(items, base, dStart) {
    const n = Math.min(4, Math.max(1, items.length)), B = BENTO[n];
    return '<div class="bento" style="grid-template-columns:repeat(' + B.cols + ',1fr)">' + items.slice(0, 4).map((it, i) =>
      '<div class="tl rv" data-idx="' + it._i + '" style="grid-area:' + B.areas[i] + ';--d:' + (dStart + i * 0.18) + 's"><div class="im" style="background-image:url(\'' + esc(it.imgs[0]) + '\');background-position:' + (it.pos || '50% 50%') + '"></div>' +
      '<div class="tx"><div class="tg">' + esc(it.tag) + '</div><div class="nm">' + esc(it.name) + '</div></div></div>').join('') + '</div>';
  }

  function overviewView(dataKey, bgSpec) {
    return {
      joint: true,
      bg: () => bgSpec,
      build() {
        const D = S[dataKey];
        const root = el('div', 'scene ov');
        const bars = D.bars || ['', ''];
        const g = [0, 1].map((gi) => D.items.map((it, i) => Object.assign({ _i: i }, it)).filter((it) => (it.group || 0) === gi));
        let html = headerHTML(D.title, esc(D.sub));
        html += '<div class="yb rv" style="left:' + GL + 'px;width:6620px;--d:.9s">' + esc(bars[0]) + '</div><div class="yb rv" style="left:' + GR + 'px;width:6620px;--d:1s">' + esc(bars[1]) + '</div>';
        html += '<div class="bx" style="left:' + GL + 'px">' + bentoHTML(g[0], 0, 1.0) + '</div><div class="bx" style="left:' + GR + 'px">' + bentoHTML(g[1], 1, 1.3) + '</div>';
        html += '<div class="bn rv" style="--d:1.9s"><span class="dm"></span><b>' + esc(D.banner || '') + '</b><span class="dm"></span></div>';
        root.innerHTML = html;
        return { root, update() { } };
      }
    };
  }
  VIEWS['updates-overview'] = overviewView('updates', { j: { img: 'assets/shot-hanok.webp', pos: '50% 50%', o: .18 } });
  VIEWS['upcoming-overview'] = overviewView('upcoming', { j: { img: 'assets/map-island.webp', pos: '50% 50%', o: .2 } });

  /* ---------- 개발 일정 (전체 화면 타임라인 — 모서리 틈 없이 이어짐) ---------- */
  VIEWS.schedule = {
    joint: true,
    bg: () => ({ j: { img: 'assets/shot-hanok.webp', pos: '50% 50%', o: .16 } }),
    build() {
      const D = S.schedule;
      const root = el('div', 'scene sd');
      const X0 = 240, W = 13440;
      let html = headerHTML(D.title, esc(D.sub));
      let panels = '', points = '';
      const total = D.phases.reduce((a, p) => a + p.points.filter((q) => !q.current).length, 0) || 1;
      let x = X0;
      D.phases.forEach((ph, pi) => {
        const real = ph.points.filter((q) => !q.current);
        const w = Math.round(W * real.length / total);
        panels += '<div class="ph ph-' + ph.id + ' e rv" data-ph="' + ph.id + '" style="left:' + x + 'px;width:' + w + 'px;--d:' + (0.8 + pi * 0.15) + 's"><div class="pn">' + esc(ph.name) + '</div></div>';
        const hasU = ph.points.some((q) => q.u != null), maxU = Math.max(1, ...ph.points.map((q) => q.u || 0)), pad = 500;
        let k = 0;
        ph.points.forEach((q, i) => {
          let cx;
          if (hasU) cx = x + pad + q.u * ((w - 2 * pad) / maxU);
          else cx = x + w * (k + 0.5) / real.length;
          if (!q.current) k++;
          const d = 1.0 + pi * 0.35 + i * 0.12;
          const left = Math.round(cx - 300);
          if (q.current) points += '<div class="pt cur e rv" data-ph="' + ph.id + '" style="left:' + left + 'px;--d:' + d + 's"><div class="now">현재</div><i class="dotline"></i><i class="dot cur"></i></div>';
          else points += '<div class="pt e rv" data-ph="' + ph.id + '" style="left:' + left + 'px;--d:' + d + 's">' +
            (q.top ? '<div class="ptop">' + esc(q.top) + '</div>' : '') +
            (q.chip ? '<div class="chip ' + (q.kind === 'launch' ? 'launch' : (q.chip.indexOf('외부') === 0 ? 'ext' : 'int')) + '">' + esc(q.chip) + '</div>' : '') +
            '<i class="dot ' + (q.kind || '') + '"></i><div class="pdate">' + esc(q.date) + '</div></div>';
        });
        x += w;
      });
      const line = '<i class="tline rv" style="left:300px;width:12880px;--d:1s"></i><i class="tarrow rv" style="left:13180px;--d:1.5s"></i>';
      let bars = '';
      D.bars.forEach((b, i) => {
        bars += '<div class="sbar b' + Math.min(i, 3) + ' e rv" data-ph="' + b.ph + '" style="left:' + b.x[0] + 'px;width:' + (b.x[1] - b.x[0]) + 'px;--d:' + (1.9 + i * 0.15) + 's">' + esc(b.label) + '</div>';
      });
      root.innerHTML = html + panels + line + points + bars;
      return {
        root,
        update(st) {
          const hl = st.hl, on = hl != null;
          root.classList.toggle('hl', on);
          root.querySelectorAll('.e').forEach((n) => n.classList.toggle('on', on && n.dataset.ph === hl));
        }
      };
    }
  };

  /* ---------- Q&A 문의 페이지 (전체 화면, 중앙 배치) ---------- */
  VIEWS['qna-page'] = {
    joint: true,
    bg: () => ({}),
    build(st) {
      const Q = S.qna, it = Q.items[st.idx], total = Q.items.length;
      const root = el('div', 'scene qp');
      const dots = Array.from({ length: total }, (_, i) => '<i class="' + (i === st.idx ? 'on' : '') + '" style="left:' + Math.round(300 + (i + 0.5) * (13320 / total)) + 'px"></i>').join('');
      root.innerHTML =
        '<div class="qp-bg"><div class="im" style="background-image:url(\'' + esc(it.img || 'assets/shot-store.webp') + '\')"></div></div>' +
        '<div class="qp-c">' +
        '<div class="qp-q rv" style="--d:.4s">Q<span class="qn">' + (st.idx + 1) + '</span></div>' +
        '<div class="qp-main rv" style="--d:.8s">' + esc(it.q) + '</div>' +
        (it.detail ? '<div class="qp-detail rv" style="--d:1.2s">' + esc(it.detail) + '</div>' : '') + '</div>' +
        '<div class="dt-rail rv" style="--d:1s"><b></b>' + dots + '</div>';
      return { root, update() { } };
    }
  };

  // 설명 화면 = 전체 화면 팝업(시트)
  //  · 좌면: 배경 이미지가 바깥쪽에서 선명 → 안쪽(모서리 쪽)으로 어두워지고, 텍스트는 우측 정렬로 모서리 가까이
  //  · 우면: 16:9 액자(이미지/영상 1~9개)가 모서리 쪽으로 붙어서 배치, 바깥쪽은 배경이 다시 선명
  function layoutFrames(n) {
    const X0 = 7350, X1 = 13650, Y0 = 100, Y1 = 2000, G = 36;
    const W = X1 - X0, H = Y1 - Y0;
    const out = [];
    if (n === 1) {
      const w = Math.min(W, H * 16 / 9);
      return [{ x: X0, y: Y0 + (H - w * 9 / 16) / 2, w }];
    }
    if (n === 3) {                                   // 큰 1 + 작은 2
      const wa = Math.min(H * 16 / 9, W * 0.56), ha = wa * 9 / 16;
      const hb = (H - G) / 2, wb = Math.min(hb * 16 / 9, W - wa - G);
      const hb2 = wb * 9 / 16, top = Y0 + (H - (2 * hb2 + G)) / 2;
      return [{ x: X0, y: Y0 + (H - ha) / 2, w: wa }, { x: X0 + wa + G, y: top, w: wb }, { x: X0 + wa + G, y: top + hb2 + G, w: wb }];
    }
    let best = null;
    for (let r = 1; r <= 3; r++) {
      const c = Math.ceil(n / r);
      const w = Math.min((W - (c - 1) * G) / c, ((H - (r - 1) * G) / r) * 16 / 9);
      if (!best || w > best.w) best = { r, c, w };
    }
    const h = best.w * 9 / 16, gridH = best.r * h + (best.r - 1) * G, top = Y0 + (H - gridH) / 2;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / best.c), inRow = Math.min(best.c, n - row * best.c), col = i - row * best.c;
      const rowW = inRow * best.w + (inRow - 1) * G;
      out.push({ x: X0 + (W - rowW) / 2 + col * (best.w + G), y: top + row * (h + G), w: best.w });
    }
    return out;
  }

  function detailView(dataKey) {
    return {
      joint: true, popup: true,
      build(st) {
        const D = S[dataKey], it = D.items[st.idx], total = D.items.length;
        const imgs = it.imgs.slice(0, 9), n = imgs.length, one = n === 1;
        const root = el('div', 'scene dt' + (one ? ' one' : ' multi'));
        const PAD = 14;
        const frames = layoutFrames(n).map((f, i) => {
          const w = Math.round(f.w), ih = Math.round((w - PAD * 2) * 9 / 16), h = ih + PAD * 2;
          return '<div class="fr rv' + (n > 3 ? ' sm' : '') + '" style="left:' + Math.round(f.x) + 'px;top:' + Math.round(f.y) + 'px;width:' + w + 'px;height:' + h + 'px;--d:' + (0.9 + i * 0.2) + 's"><div class="fr-in">' + mediaHTML(imgs[i], it.pos) + '</div></div>';
        }).join('');
        const dots = Array.from({ length: total }, (_, i) => '<i class="' + (i === st.idx ? 'on' : '') + '" style="left:' + Math.round(300 + (i + 0.5) * (13320 / total)) + 'px"></i>').join('');
        const bgSrc = imgs.find((s) => !MEDIA_RE.test(s));
        const bgImg = bgSrc ? '<div class="im" style="background-image:url(\'' + esc(bgSrc) + '\');background-position:' + (it.pos || '50% 50%') + '"></div>' : '';
        root.innerHTML = '<div class="dt-sheet"><div class="dt-bg">' + bgImg + '</div>' +
          '<div class="dt-text">' +
          '<div class="dt-no rv" style="--d:.5s">' + (st.idx + 1) + '<span> / ' + total + '</span></div>' +
          '<div class="dt-tag rv" style="--d:.7s">' + esc(it.tag) + '</div>' +
          '<div class="dt-title rv" style="--d:.9s">' + esc(it.name) + '</div>' +
          '<ul class="dt-lines">' + it.lines.map((l, i) => '<li class="rv" style="--d:' + (1.2 + i * 0.25) + 's">' + esc(l) + '</li>').join('') + '</ul></div>' +
          frames + '<div class="dt-rail rv" style="--d:1.3s"><b></b>' + dots + '</div></div>';
        return { root, update() { } };
      }
    };
  }
  VIEWS['updates-detail'] = detailView('updates');
  VIEWS['upcoming-detail'] = detailView('upcoming');



  /* ---------- 장면 전환 ----------
     · 섹션이 바뀔 때     : 철문 (좌우로 닫힘/열림 ↔ 위에서 내려옴/올라감 — 번갈아 사용)
     · 같은 섹션 안(제목→전체 보기): 화면이 불타며 넘어감
     · 전체 보기 → 설명    : 설명이 전체 화면 팝업으로 올라옴
       다른 항목: 현재 팝업이 내려감 → 전체 보기가 1초 보임 → 다음 팝업이 올라옴            */
  let cur = null;                 // 바닥 장면 { key, view, sec, inst }
  let pop = null;                 // 팝업 { key, inst }
  let busyUntil = 0, pending = null, pendTimer = 0, popSeq = 0, doorToggle = 0;
  const surgeEl = $('#surge'), doorsEl = $('#doors'), popupsEl = $('#popups'), sweepEl = $('#sweep'), beaconEl = $('#beacon');
  const SETTLE = 2800;            // 전환이 끝나 화면이 자리잡기까지(ms) — 제목 카드 자동 이동 타이머 기준
  const POP_GAP = 250;            // 팝업이 내려간 뒤 전체 보기를 보여주는 시간(ms)
  const POP_DOWN = 800;           // 설명이 줄어들어 박스로 돌아가는 시간(ms)

  const isDetail = (v) => /detail$/.test(v);
  const secOf = (st) => st.view === 'card' ? st.card : st.view === 'title' ? 'title' : st.view.split('-')[0];
  const baseOf = (st) => isDetail(st.view) ? { view: st.view.replace('detail', 'overview') } : st;
  const viewKey = (st) => st.view === 'card' ? 'card:' + st.card : st.view === 'qna-page' ? 'qna-page:' + st.idx : st.view;

  function doSurge() {        // 연출 버튼(안개 분출)용
    surgeEl.classList.remove('go'); void surgeEl.offsetWidth; surgeEl.classList.add('go');
    clearTimeout(doSurge.t); doSurge.t = setTimeout(() => surgeEl.classList.remove('go'), 2600);
    if (embers) embers.burst();
  }
  function doSweep() {         // 붉은 디졸브가 좌→우로 훑고 지나감
    sweepEl.classList.remove('go'); void sweepEl.offsetWidth; sweepEl.classList.add('go');
    clearTimeout(doSweep.t); doSweep.t = setTimeout(() => sweepEl.classList.remove('go'), 1800);
  }
  function doAlarm() {         // 경보등(경광등)이 좌우로 번갈아 번쩍이는 전환 — Q&A 전용
    beaconEl.classList.remove('go'); void beaconEl.offsetWidth; beaconEl.classList.add('go');
    clearTimeout(doAlarm.t); doAlarm.t = setTimeout(() => beaconEl.classList.remove('go'), 2000);
    if (embers) { embers.burst(); setTimeout(() => embers.burst(), 600); }
  }
  function doDoors() {
    const mode = (doorToggle++ % 2) ? 'down' : 'lr';
    doorsEl.classList.remove('go', 'lr', 'down'); void doorsEl.offsetWidth; doorsEl.classList.add('go', mode);
    clearTimeout(doDoors.t); doDoors.t = setTimeout(() => doorsEl.classList.remove('go'), 2800);
    setTimeout(() => { scenesEl.classList.add('shake'); popupsEl.classList.add('shake'); setTimeout(() => { scenesEl.classList.remove('shake'); popupsEl.classList.remove('shake'); }, 520); }, 980);
    if (embers) setTimeout(() => embers.burst(), 1000);
  }

  function swapTo(st, type) {
    const V = VIEWS[st.view];
    const inst = V.build(st);
    const key = viewKey(st), sec = secOf(st);
    const mount = () => {
      const old = cur;
      inst.root.classList.add('in');
      scenesEl.appendChild(inst.root);
      if (inst.update) inst.update(st);
      cur = { key, view: st.view, sec, inst };
      document.body.classList.toggle('split', !V.joint);
      setBg(V.bg(st));
      if (embers) embers.setWind(st.view === 'title' ? 1.4 : 0);
      if (old) { old.inst.root.classList.add('out'); setTimeout(() => old.inst.root.remove(), 900); }
    };
    if (type === 'door') { doDoors(); setTimeout(mount, 1100); return 1500; }
    if (type === 'sweep') { doSweep(); setTimeout(mount, 800); return 1100; }
    if (type === 'alarm') { doAlarm(); setTimeout(mount, 800); return 1100; }
    mount(); return 0;
  }

  const GROW_EASE = 'cubic-bezier(.22,.8,.22,1)';
  const FULL_CSS = 'left:0;top:0;width:13920px;height:2160px;border-radius:0px';
  const rectCSS = (r) => 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;border-radius:26px';
  const kf = (cssText) => { const o = {}; cssText.split(';').forEach((kv) => { const [k, v] = kv.split(':'); if (k) o[k.replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = v; }); return o; };

  // 전체 보기에 깔려 있는 해당 타일을 복제해서 '커지는 박스'로 사용
  function tileGrower(idx) {
    if (!cur || !cur.inst || !cur.inst.root) return null;
    const t = cur.inst.root.querySelector('.tl[data-idx="' + idx + '"]');
    const bx = t && t.closest('.bx');
    if (!t || !bx) return null;
    const r = { x: bx.offsetLeft + t.offsetLeft, y: bx.offsetTop + t.offsetTop, w: t.offsetWidth, h: t.offsetHeight };
    const g = t.cloneNode(true);
    g.className = 'tl grow'; g.removeAttribute('style'); g.removeAttribute('data-idx');
    g._r = r; return g;
  }

  const flashEl = $('#flash');
  function popFlash() { flashEl.classList.remove('go', 'fast'); void flashEl.offsetWidth; flashEl.classList.add('go', 'fast'); }

  function lowerOne(p) {       // 설명이 사라지고, 화면 가득했던 박스가 원래 자리로 줄어듦
    const root = p.inst.root;
    root.classList.remove('pop-fade'); root.classList.add('pop-out');
    setTimeout(() => root.remove(), 330);
    const g = tileGrower(p.idx);
    if (!g) return;
    g.style.cssText = FULL_CSS;
    popupsEl.insertBefore(g, root);
    const tx = g.querySelector('.tx'); if (tx) tx.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 350, duration: 250, fill: 'both' });
    setTimeout(() => {
      const a = g.animate([kf(FULL_CSS), kf(rectCSS(g._r))], { duration: 500, easing: GROW_EASE, fill: 'forwards' });
      a.onfinish = () => g.remove();
    }, 200);
  }
  function lowerPopup() { popSeq++; if (pop) { lowerOne(pop); pop = null; } }
  function raisePopup(st, delay) {
    const key = st.view + ':' + st.idx;
    if (pop && pop.key === key) return;
    const my = ++popSeq;
    const inst = VIEWS[st.view].build(st);
    const old = pop; pop = null;
    if (old) lowerOne(old);
    const show = (g) => {
      if (my !== popSeq) { if (g) g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }).onfinish = () => g.remove(); return; }
      inst.root.classList.add('in', 'pop-fade');
      popupsEl.appendChild(inst.root);
      pop = { key, idx: st.idx, inst };
      if (g) setTimeout(() => g.remove(), 700);
    };
    setTimeout(() => {
      if (my !== popSeq) return;
      const g = tileGrower(st.idx);
      if (!g) { show(null); return; }
      g.style.cssText = rectCSS(g._r);
      popupsEl.appendChild(g);
      const tx = g.querySelector('.tx'); if (tx) tx.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      g.animate([kf(rectCSS(g._r)), kf(FULL_CSS)], { duration: 450, easing: GROW_EASE, fill: 'forwards' });
      setTimeout(() => { if (my === popSeq) popFlash(); show(g); }, 440);   // 다 커진 순간: 플래시가 터지며 바로 설명으로 교체
    }, old ? POP_DOWN + POP_GAP : delay);
  }

  function pickType(base, immediate) {
    if (immediate || !cur) return 'none';
    if (cur.view === 'black' || base.view === 'black') return 'none';     // 블랙아웃 ↔ 타이틀은 전환 없이 (타이틀이 자체 연출로 시작)
    if (secOf(base) === 'qna') return 'alarm';                              // Q&A는 경보등
    return cur.sec !== secOf(base) ? 'door' : 'sweep';
  }

  function showStep(st, immediate) {
    const now = Date.now();
    if (!immediate && now < busyUntil) {               // 전환 중이면 마지막 요청만 기억했다가 끝나고 처리
      pending = st; clearTimeout(pendTimer);
      pendTimer = setTimeout(() => { const p = pending; pending = null; if (p) showStep(p, false); }, busyUntil - now + 40);
      return;
    }
    pending = null;
    const base = baseOf(st), key = viewKey(base), detail = isDetail(st.view);
    let popDelay = 0;
    if (!cur || cur.key !== key) {
      lowerPopup();
      const type = pickType(base, immediate);
      popDelay = swapTo(base, type);
      busyUntil = Date.now() + (type === 'door' ? 2600 : type === 'sweep' ? 1700 : type === 'alarm' ? 1800 : 0);
    } else if (!detail && cur.inst.update) cur.inst.update(st);
    if (detail) {
      const fresh = !(pop && pop.key !== st.view + ':' + st.idx);
      const ready = Date.now() + (fresh ? popDelay + 800 : POP_DOWN + POP_GAP + 800);   // 박스가 다 커질 때까지 입력을 모아둠
      if (!(pop && pop.key === st.view + ':' + st.idx)) busyUntil = Math.max(busyUntil, ready);
      raisePopup(st, popDelay);
    } else lowerPopup();
  }

  /* ---------- 상태 적용 ---------- */
  function resolveStep(state) {
    const sec = S.sections[Math.min(Math.max(state.section | 0, 0), S.sections.length - 1)];
    const st = sec.steps[Math.min(Math.max(state.step | 0, 0), sec.steps.length - 1)];
    return st;
  }

  let lastFx = null, firstApply = true;
  function apply(state) {
    const st = resolveStep(state);
    document.documentElement.style.setProperty('--fog', String(Math.max(0, Math.min(100, state.fog == null ? 70 : state.fog)) / 100));
    document.body.classList.toggle('guide', !!state.guide);
    $('#blackout').classList.toggle('on', !!state.blackout || st.view === 'black');
    showStep(st, firstApply);
    // 즉석 연출 (처음 로드 시에는 재생하지 않음)
    const fxn = state.fx ? state.fx.n : 0;
    if (lastFx !== null && fxn !== lastFx) trigger(state.fx.type);
    lastFx = fxn; firstApply = false;
  }

  function trigger(type) {
    if (type === 'surge') doSurge();
    else if (type === 'alarm') { const a = $('#alarm'); a.classList.remove('go'); void a.offsetWidth; a.classList.add('go'); if (embers) embers.burst(); }
    else if (type === 'flash') { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  }

  window.NakwonStage = { apply, PREVIEW, resolveStep, SETTLE };
})();

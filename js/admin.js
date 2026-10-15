/* ============================================================
   NAKWON SHOWCASE — 관리자(디렉터 리모컨)
   - 즉시 송출: 누르는 즉시 LED 반영
   - 큐 → 송출: 선택만 해두고 LIVE 버튼으로 송출
   - 모든 기기의 버튼 상태는 서버(원격 state)를 기준으로 표시됨
   ============================================================ */
(function () {
  const S = window.SHOWCASE;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 평탄화된 진행 순서
  const FLAT = [];
  S.sections.forEach((sec, si) => sec.steps.forEach((st, ti) => FLAT.push({ section: si, step: ti })));
  const flatIndex = (p) => FLAT.findIndex((f) => f.section === p.section && f.step === p.step);

  let sync = null, state = null;
  let mode = localStorage.getItem('nakwon:mode') || 'instant';
  let cue = null;                    // null = 라이브를 따라감
  let locked = false;
  let presence = [];
  let lastSent = 0;

  const live = () => ({ section: state.section | 0, step: state.step | 0 });
  const target = () => cue || live();
  const stepOf = (p) => S.sections[p.section].steps[p.step];

  /* ---------- 미리보기(iframe) ---------- */
  const pv = $('#pv');
  let pvReady = false;
  addEventListener('message', (e) => { if (e.data && e.data.t === 'ready') { pvReady = true; pushPreview(); } });
  function pushPreview() { if (pvReady && state && pv.contentWindow) pv.contentWindow.postMessage({ t: 'state', s: state }, '*'); }

  /* ---------- 송출 ---------- */
  function send(patch, label) {
    lastSent = Date.now();
    toast(label || '송출');
    return sync.update(patch).catch((e) => { console.error(e); banner('전송에 실패했어요. 네트워크 연결을 확인하세요.', true); });
  }
  function goLive(p) { cue = null; return send({ section: p.section, step: p.step }, '송출 ▶ ' + stepOf(p).label); }
  function pick(p) {
    if (mode === 'instant') goLive(p);
    else { cue = (p.section === live().section && p.step === live().step) ? null : p; render(); }
  }
  function move(d) {
    const cur = flatIndex(target());
    const n = Math.max(0, Math.min(FLAT.length - 1, cur + d));
    if (n === cur) { toast(d > 0 ? '마지막 장면이에요' : '첫 장면이에요'); return; }
    pick(FLAT[n]);
  }
  function take() { if (cue) goLive(cue); }

  /* ---------- 렌더 ---------- */
  function render() {
    if (!state) return;
    const L = live(), T = target();
    // 섹션
    $('#secs').innerHTML = S.sections.map((sec, i) =>
      '<button class="sec' + (i === L.section ? ' live' : '') + (cue && i === cue.section && i !== L.section ? ' cued' : '') + '" data-s="' + i + '"><span class="no">' + i + '</span><span class="nm">' + esc(sec.label) + '<span class="ct">' + sec.steps.length + '개 장면</span></span></button>').join('');
    // 스텝 (큐 중이면 큐의 섹션, 아니면 라이브 섹션)
    const viewSec = T.section;
    $('#steps').innerHTML = S.sections[viewSec].steps.map((st, i) => {
      const isLive = viewSec === L.section && i === L.step;
      const isCue = cue && cue.section === viewSec && cue.step === i;
      const done = viewSec === L.section && i < L.step;
      return '<button class="step' + (isLive ? ' live' : '') + (isCue ? ' cued' : '') + (done ? ' done' : '') + '" data-t="' + i + '"><span class="i">' + (i + 1) + '</span><span>' + esc(st.label) + '</span></button>';
    }).join('');
    // 현재 정보
    const ls = stepOf(L), nextP = FLAT[Math.min(FLAT.length - 1, flatIndex(L) + 1)];
    $('#now').innerHTML = '<div class="t">지금 송출 중 · ' + esc(S.sections[L.section].label) + '</div><div class="h">' + esc(ls.label) + '</div>' +
      (ls.note ? '<div class="n"><b>메모</b>' + esc(ls.note) + '</div>' : '') +
      (cue ? '<div class="n"><b style="color:var(--teal-hi)">큐</b>' + esc(S.sections[cue.section].label + ' · ' + stepOf(cue).label) + '</div>' : '');
    // 하단 버튼
    const ci = flatIndex(T);
    const prevP = FLAT[Math.max(0, ci - 1)], nextT = FLAT[Math.min(FLAT.length - 1, ci + 1)];
    $('#lPrev').textContent = ci > 0 ? stepOf(prevP).label : '—';
    $('#lNext').textContent = ci < FLAT.length - 1 ? stepOf(nextT).label : '— (마지막)';
    $('#bLive').hidden = mode !== 'cue';
    $('#bLive').classList.toggle('armed', !!cue);
    // 효과 영역
    $('#bBlack').classList.toggle('on', !!state.blackout);
    $('#bGuide').classList.toggle('on', !!state.guide);
    $('#bLock').classList.toggle('on', locked);
    document.body.classList.toggle('locked', locked);
    const fog = $('#fog'); if (document.activeElement !== fog) fog.value = state.fog == null ? 70 : state.fog;
    $('#fogv').textContent = fog.value;
    // 배지
    $('#pvBadge').textContent = state.blackout ? 'BLACKOUT' : 'ON AIR';
    $('#pvBadge').classList.toggle('black', !!state.blackout);
    document.querySelector('.pv-wrap').classList.toggle('air', !state.blackout);
    $('#modeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === mode));
    renderStats();
  }

  function renderStats() {
    const c = $('#pConn');
    c.className = 'pill ' + (sync.connected ? 'ok' : 'bad');
    c.querySelector('span').textContent = sync.connected ? (sync.mode === 'firebase' ? '서버 연결됨' : '로컬 테스트') : '연결 끊김 — 재연결 중';
    const p = $('#pLed');
    if (!presence.length) { p.className = 'pill bad'; p.querySelector('span').textContent = 'LED 연결 없음'; }
    else {
      const behind = presence.filter((x) => (x.rev || 0) < (state.rev || 0)).length;
      const waiting = behind && Date.now() - (state.at || 0) > 1500;
      p.className = 'pill ' + (behind ? (waiting ? 'warn' : 'ok') : 'ok');
      p.querySelector('span').textContent = 'LED ' + presence.length + '대 · ' + (behind ? '반영 대기' : '반영 완료');
    }
    $('#pRoom span').textContent = '방: ' + sync.room;
    $('#pAt span').textContent = state.at ? '마지막 송출 ' + new Date(state.at).toTimeString().slice(0, 8) + (state.by && state.by !== sync.clientId ? ' (다른 기기)' : '') : '아직 송출 없음';
  }

  function banner(msg, bad) { const b = $('#banner'); b.hidden = !msg; b.className = bad ? 'bad' : ''; b.innerHTML = msg || ''; }
  function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1500); }

  /* ---------- 이벤트 ---------- */
  $('#secs').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) pick({ section: +b.dataset.s, step: 0 }); });
  $('#steps').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) pick({ section: target().section, step: +b.dataset.t }); });
  $('#bNext').onclick = () => move(1);
  $('#bPrev').onclick = () => move(-1);
  $('#bLive').onclick = take;
  $('#modeSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m; localStorage.setItem('nakwon:mode', mode); if (mode === 'instant') cue = null; render(); });
  $('#bBlack').onclick = () => send({ blackout: !state.blackout }, state.blackout ? '블랙아웃 해제' : '블랙아웃');
  $('#bGuide').onclick = () => send({ guide: !state.guide }, '정렬 가이드 ' + (state.guide ? '끔' : '켬'));
  $('#bLock').onclick = () => { locked = !locked; render(); toast(locked ? '잠금 — 조작이 비활성화됐어요' : '잠금 해제'); };
  let fogT = 0;
  $('#fog').addEventListener('input', (e) => {
    $('#fogv').textContent = e.target.value;
    const now = Date.now(); if (now - fogT < 200) return; fogT = now;
    sync.update({ fog: +e.target.value });
  });
  $('#fog').addEventListener('change', (e) => sync.update({ fog: +e.target.value }));
  addEventListener('keydown', (e) => {
    if (locked || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') take();
    else if (e.key === 'b' || e.key === 'B') $('#bBlack').click();
  });

  /* ---------- 시작 ---------- */
  Sync.connect('admin').then((s) => {
    sync = s; window.__sync = s;
    if (s.mode === 'local') banner('<b>로컬 테스트 모드</b> — Firebase 설정(js/config.js)이 비어 있어요. 같은 브라우저의 LED 탭과만 연결됩니다. 원격 송출은 Firebase 설정 후 사용하세요.');
    s.onState((st) => {
      const prev = state; state = st;
      if (cue && prev && (prev.section !== st.section || prev.step !== st.step)) cue = null;   // 라이브가 바뀌면 큐 초기화
      render(); pushPreview();
    });
    s.onConn(() => { if (state) renderStats(); if (!s.connected && s.mode === 'firebase') banner('서버와 연결이 끊겼어요. 재연결되면 자동으로 이어집니다. 그동안 누른 버튼은 연결 후 반영돼요.', true); else if (s.connected && $('#banner').className === 'bad') banner(''); });
    s.onPresence((l) => { presence = l; if (state) renderStats(); });
    setInterval(() => state && renderStats(), 1500);
  });
})();

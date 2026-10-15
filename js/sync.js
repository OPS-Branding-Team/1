/* ============================================================
   NAKWON SHOWCASE — 동기화 모듈
   - Firebase Realtime Database  (원격 송출)
   - 로컬 테스트 모드            (같은 브라우저 탭끼리, 설정 불필요)
   ============================================================ */
(function () {
  const CFG = (window.NAKWON_CONFIG && window.NAKWON_CONFIG.firebase) || {};
  const params = new URLSearchParams(location.search);
  const room = (params.get('room') || (window.NAKWON_CONFIG && window.NAKWON_CONFIG.defaultRoom) || 'main').replace(/[^\w-]/g, '');
  const useFirebase = !!(CFG.apiKey && CFG.databaseURL);
  const FB_VER = '10.12.2';

  const DEFAULT_STATE = {
    rev: 0, section: 0, step: 0,
    blackout: false, fog: 70, guide: false,
    fx: { n: 0, type: '' },
    at: 0, by: ''
  };

  const clientId = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).slice(0, 8);

  function makeEmitter() {
    const subs = new Set();
    return { on: (f) => { subs.add(f); return () => subs.delete(f); }, emit: (v) => subs.forEach((f) => { try { f(v); } catch (e) { console.error(e); } }) };
  }

  /* ---------------- 공통 베이스 ---------------- */
  function base(role) {
    const st = makeEmitter(), cn = makeEmitter(), pr = makeEmitter();
    const o = {
      role, room, clientId, mode: useFirebase ? 'firebase' : 'local',
      state: Object.assign({}, DEFAULT_STATE),
      connected: false,
      onState: (f) => { const u = st.on(f); f(o.state); return u; },
      onConn: (f) => { const u = cn.on(f); f(o.connected); return u; },
      onPresence: (f) => pr.on(f),
      _setState(v) { o.state = Object.assign({}, DEFAULT_STATE, v || {}); o.state.fx = Object.assign({ n: 0, type: '' }, o.state.fx || {}); st.emit(o.state); },
      _setConn(v) { if (o.connected !== v) { o.connected = v; cn.emit(v); } },
      _setPresence(list) { pr.emit(list); }
    };
    return o;
  }

  /* ---------------- 로컬 테스트 ---------------- */
  function connectLocal(role) {
    const o = base(role);
    const KEY = 'nakwon:' + room + ':state';
    const ch = ('BroadcastChannel' in window) ? new BroadcastChannel('nakwon:' + room) : null;
    const peers = new Map();

    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
    o._setState(load());
    o._setConn(true);

    o.update = (patch) => {
      const cur = Object.assign({}, DEFAULT_STATE, load() || {});
      const next = Object.assign({}, cur, patch, { rev: (cur.rev || 0) + 1, at: Date.now(), by: clientId });
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { }
      o._setState(next);
      if (ch) ch.postMessage({ t: 'state', s: next });
      return Promise.resolve(next);
    };

    window.addEventListener('storage', (e) => { if (e.key === KEY) o._setState(load()); });
    if (ch) {
      ch.onmessage = (e) => {
        const m = e.data || {};
        if (m.t === 'state') o._setState(m.s);
        if (m.t === 'ack') { peers.set(m.id, Object.assign({ seen: Date.now() }, m.v)); flush(); }
        if (m.t === 'bye') { peers.delete(m.id); flush(); }
      };
    }
    function flush() {
      const now = Date.now();
      peers.forEach((v, k) => { if (now - v.seen > 6000) peers.delete(k); });
      o._setPresence(Array.from(peers.entries()).map(([id, v]) => Object.assign({ id }, v)));
    }
    o.ack = (v) => { if (ch) ch.postMessage({ t: 'ack', id: clientId, v }); };
    if (role === 'led') {
      window.addEventListener('beforeunload', () => ch && ch.postMessage({ t: 'bye', id: clientId }));
    } else {
      setInterval(flush, 2000);
    }
    return Promise.resolve(o);
  }

  /* ---------------- Firebase ---------------- */
  async function connectFirebase(role) {
    const o = base(role);
    const [appM, dbM] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-database.js')
    ]);
    const app = appM.initializeApp(CFG);
    const db = dbM.getDatabase(app);
    const stateRef = dbM.ref(db, 'rooms/' + room + '/state');
    const presRoot = dbM.ref(db, 'rooms/' + room + '/presence');
    const myPres = dbM.ref(db, 'rooms/' + room + '/presence/' + clientId);

    dbM.onValue(dbM.ref(db, '.info/connected'), (s) => {
      const ok = s.val() === true;
      o._setConn(ok);
      if (ok && role === 'led') {
        dbM.set(myPres, { rev: o.state.rev || 0, at: Date.now(), section: o.state.section, step: o.state.step });
        dbM.onDisconnect(myPres).remove();
      }
    });

    dbM.onValue(stateRef, (s) => o._setState(s.val()));

    o.update = (patch) => {
      const next = Object.assign({}, patch, { rev: (o.state.rev || 0) + 1, at: Date.now(), by: clientId });
      // 낙관적 반영 — 내 화면의 버튼은 즉시 눌린 상태로 보이게
      o._setState(Object.assign({}, o.state, next));
      return dbM.update(stateRef, next);
    };

    o.ack = (v) => { if (role === 'led') dbM.update(myPres, Object.assign({ at: Date.now() }, v)); };

    if (role !== 'led') {
      dbM.onValue(presRoot, (s) => {
        const v = s.val() || {};
        o._setPresence(Object.keys(v).map((id) => Object.assign({ id }, v[id])));
      });
    }
    return o;
  }

  window.Sync = {
    room, mode: useFirebase ? 'firebase' : 'local', clientId, DEFAULT_STATE,
    connect(role) {
      return useFirebase ? connectFirebase(role) : connectLocal(role);
    }
  };
})();

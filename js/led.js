/* LED 화면 부트스트랩 — 상태 수신 → 렌더, 반영 확인(ack) 전송 */
(function () {
  const P = new URLSearchParams(location.search);

  // 커서 숨김 (현장 송출용)
  if (!NakwonStage.PREVIEW) document.documentElement.style.cursor = 'none';

  if (NakwonStage.PREVIEW) {
    // 관리자 화면 안의 미리보기: 부모 창이 보내주는 상태만 그린다 (별도 연결 없음)
    addEventListener('message', (e) => { if (e.data && e.data.t === 'state') NakwonStage.apply(e.data.s); });
    parent.postMessage({ t: 'ready' }, '*');
    return;
  }

  Sync.connect('led').then((sync) => {
    let lastRev = -1, autoT = 0;
    sync.onState((s) => {
      NakwonStage.apply(s);
      // 제목 카드 → 일정 시간 뒤 자동으로 다음 화면 (그 사이 누군가 조작하면 취소)
      clearTimeout(autoT);
      const cs = NakwonStage.resolveStep(s);
      if (cs.auto) {
        const rev = s.rev;
        autoT = setTimeout(() => { if (sync.state.rev === rev) sync.update({ section: s.section, step: s.step + 1 }); }, NakwonStage.SETTLE + cs.auto);
      }
      if (s.rev !== lastRev) { lastRev = s.rev; sync.ack({ rev: s.rev, section: s.section, step: s.step }); }
    });
    // 하트비트 (로컬 모드 존재 확인용 / Firebase는 onDisconnect 사용)
    setInterval(() => sync.ack({ rev: sync.state.rev, section: sync.state.section, step: sync.state.step }), 2500);
    window.__sync = sync;
  });
})();

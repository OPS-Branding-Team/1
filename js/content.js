/* ============================================================
   NAKWON SHOWCASE — 콘텐츠 데이터
   이 파일만 수정하면 LED 화면과 관리자 화면이 함께 바뀝니다.
   ※ 로드맵을 제외한 모든 문구는 샘플입니다.
   ============================================================ */
(function () {
  const IMG = (f) => 'assets/' + f;

  /* ---------- 1. 타이틀 ---------- */
  const TITLE = {
    sub: '낙원 쇼케이스',
    meta: 'LIVE SHOWCASE'
  };

  /* ---------- 2. 목차 ---------- */
  const AGENDA = {
    kicker: 'NAKWON SHOWCASE',
    title: '오늘의 순서',
    sub: '다섯 가지 주제로 진행합니다',
    banner: "TODAY'S ORDER",
    items: [
      { name: '개발 일정', desc: '출시 때까지 전체적인 일정', img: IMG('shot-hanok.webp'), pos: '50% 55%' },
      { name: '로드맵', desc: '글로벌 런칭부터 2028년 6월까지', img: IMG('map-island.webp'), pos: '50% 50%' },
      { name: '업데이트 된 내용', desc: '그동안 달라진 것들', img: IMG('shot-housing.webp'), pos: '50% 55%' },
      { name: '이후 추가될 내용', desc: '앞으로 만나게 될 콘텐츠', img: IMG('key.webp'), pos: '50% 35%' },
      { name: 'Q&A', desc: '궁금한 점을 직접 답해드립니다', img: IMG('shot-store.webp'), pos: '50% 50%' }
    ]
  };

  /* ---------- 개발 일정 (로드맵 앞 페이지) ----------
     phases : 단계(프로덕션 A1 / 포스트 프로덕션 B1 / 라이브). side = L(좌면) / R(우면)
              points : date(날짜) · chip(테스트 종류 칩) · top(칩 위 라벨) · current(현재 표시) · kind:'launch'(출시)
              u      : 좌면처럼 간격이 불규칙할 때 점의 상대 위치(없으면 균등 배치)
     bars   : 아래 띠. x = [시작, 끝] 스테이지 좌표(좌면 0~6960, 우면 6960~13920) — 모서리를 가로지르면 자동으로 둘로 나뉨
     ph     : 하이라이트 단계와 연결 */
  const SCHEDULE = {
    kicker: '출시까지',
    title: '개발 일정',
    sub: '출시 때까지 전체적인 일정',
    phases: [
      {
        id: 'A1', name: '프로덕션 A1', side: 'L', points: [
          { date: '26년 5월', u: 0 },
          { date: '26년 6월', chip: '내부 테스트', u: 1 },
          { current: true, u: 1.5 },
          { date: '26년 8월', chip: '내부 테스트', u: 2 },
          { date: '26년 10월', chip: '내부 테스트', u: 3 }
        ]
      },
      {
        id: 'B1', name: '포스트 프로덕션 B1', side: 'R', points: [
          { date: '26년 12월', top: 'FGT', chip: '외부 테스트' },
          { date: '27년 3월', top: 'CBT', chip: '외부 테스트' },
          { date: '27년 5월', top: '서버슬램', chip: '외부 테스트' }
        ]
      },
      { id: 'LIVE', name: '라이브', side: 'R', points: [{ date: '27년 6월', top: '스팀, PS5', chip: '출시', kind: 'launch' }] }
    ],
    bars: [
      { label: '퀄리티업 체크', ph: 'A1', x: [2000, 5500] },
      { label: '온보딩 개선 체크', ph: 'B1', x: [5700, 8700] },
      { label: '최종 체크 & 마케팅', ph: 'B1', x: [8850, 11950] },
      { label: '글로벌 출시', ph: 'LIVE', x: [12120, 13680] }
    ],
    steps: [
      { ph: 'A1', label: '프로덕션 A1', note: '현재 위치와 내부 테스트 일정' },
      { ph: 'B1', label: '포스트 프로덕션 B1', note: 'FGT · CBT · 서버슬램 (외부 테스트)' },
      { ph: 'LIVE', label: '라이브', note: '2027년 6월 스팀, PS5 글로벌 출시' }
    ]
  };

  /* ---------- 3. 로드맵 (이미지 기준) ---------- */
  // col: 0 = 2027.6 … 12 = 2028.6   /  rows: 1~4 상단, 6~7 하단(5는 간격)
  const MONTHS = [
    { y: 2027, m: 6 }, { y: 2027, m: 7 }, { y: 2027, m: 8 }, { y: 2027, m: 9 },
    { y: 2027, m: 10 }, { y: 2027, m: 11 }, { y: 2027, m: 12 },
    { y: 2028, m: 1 }, { y: 2028, m: 2 }, { y: 2028, m: 3 }, { y: 2028, m: 4 },
    { y: 2028, m: 5 }, { y: 2028, m: 6 }
  ];

  // cat: launch | map | weather | item | quest | trait | mode | system | season
  const RM = [];
  const add = (col, r1, r2, cat, kicker, text, size) =>
    RM.push({ id: 'c' + col + '-' + RM.length, col, r1, r2, cat, kicker, text, size: size || 'xl' });

  add(0, 1, 7, 'launch', '', '글로벌\n런칭', 'l');

  add(1, 1, 2, 'map', '신규맵 5번', '맵');
  add(1, 3, 3, 'item', '', '장비,설계도', 's');
  add(1, 4, 4, 'quest', '', '퀘스트', 's');
  add(1, 6, 7, 'mode', '신규 모드', '하드\n코어\n탐사', 'l');

  add(2, 1, 1, 'weather', '신규 날씨', '폭염', 'w');
  add(2, 2, 2, 'item', '', '가구', 's');
  add(2, 3, 3, 'item', '', '소모품', 's');
  add(2, 4, 4, 'quest', '', '퀘스트', 's');
  add(2, 6, 7, 'season', '시즌 시스템', '체온', 'l');

  add(3, 1, 3, 'trait', '신규 특성', '특성\n스킬', 'l');
  add(3, 4, 4, 'quest', '', '퀘스트', 's');

  add(4, 1, 2, 'map', '신규맵 6번', '맵');
  add(4, 3, 3, 'item', '', '장비,설계도', 's');
  add(4, 4, 4, 'quest', '', '퀘스트', 's');

  add(5, 1, 1, 'weather', '신규 날씨', '폭설', 'w');
  add(5, 2, 2, 'item', '', '가구', 's');
  add(5, 3, 3, 'item', '', '소모품', 's');
  add(5, 4, 4, 'quest', '', '퀘스트', 's');
  add(5, 6, 7, 'season', '시즌 시스템', '체온', 'l');

  add(6, 1, 2, 'mode', '신규 목표', '다중\n캐릭', 'l');
  add(6, 3, 3, 'item', '', '가구', 's');
  add(6, 4, 4, 'quest', '', '퀘스트', 's');
  add(6, 6, 6, 'system', '신규 시스템', '난입', 'w');
  add(6, 7, 7, 'system', '신규 시스템', '숙소\n생활', 'm');

  add(7, 1, 3, 'mode', '신규 콘텐츠', '시민\n등급\n1~3', 'l3');
  add(7, 4, 4, 'quest', '', '퀘스트', 's');
  add(7, 6, 7, 'system', '신규 시스템', '랭킹', 'l');

  add(8, 1, 2, 'map', '신규맵 7번', '맵');
  add(8, 3, 3, 'item', '', '장비,설계도', 's');
  add(8, 4, 4, 'quest', '', '퀘스트', 's');

  add(9, 1, 3, 'trait', '신규 특성', '특성\n스킬', 'l');
  add(9, 4, 4, 'quest', '', '퀘스트', 's');

  add(10, 1, 1, 'weather', '신규 날씨', '봄', 'w');
  add(10, 2, 2, 'item', '', '가구', 's');
  add(10, 3, 3, 'item', '', '소모품', 's');
  add(10, 4, 4, 'quest', '', '퀘스트', 's');
  add(10, 6, 7, 'season', '시즌 시스템', '체온', 'l');

  add(11, 4, 4, 'quest', '', '퀘스트', 's');
  add(11, 6, 7, 'mode', '신규 모드', '로그\n라이크', 'l');

  add(12, 1, 2, 'map', '신규맵 8번', '맵');
  add(12, 3, 3, 'item', '', '장비,설계도', 's');
  add(12, 4, 4, 'quest', '', '퀘스트', 's');

  const ROADMAP = {
    kicker: '2027.06 — 2028.06',
    title: '향후 개발',
    sub: '로드맵',
    months: MONTHS,
    items: RM,
    legend: [
      ['launch', '글로벌 런칭'],
      ['map', '신규 맵'],
      ['weather', '신규 날씨'],
      ['trait', '신규 특성'],
      ['mode', '신규 모드 · 콘텐츠 · 목표'],
      ['system', '신규 시스템'],
      ['season', '시즌 시스템'],
      ['item', '장비 · 설계도 · 가구 · 소모품'],
      ['quest', '퀘스트']
    ],
    footnote: '※ 개발 일정과 내용은 변경될 수 있습니다.',
    // 하이라이트 순서 (월별) — 라벨/멘트 메모는 자유롭게 수정하세요
    steps: [
      { col: 0, label: '2027.6 글로벌 런칭', note: '글로벌 런칭 시점 안내' },
      { col: 1, label: '2027.7 신규맵 5 · 하드코어', note: '첫 신규 맵과 하드코어 탐사 모드' },
      { col: 2, label: '2027.8 폭염 · 체온', note: '신규 날씨 폭염, 시즌 시스템 체온' },
      { col: 3, label: '2027.9 특성 스킬', note: '신규 특성 스킬' },
      { col: 4, label: '2027.10 신규맵 6', note: '두 번째 신규 맵' },
      { col: 5, label: '2027.11 폭설 · 체온', note: '신규 날씨 폭설' },
      { col: 6, label: '2027.12 다중 캐릭 · 난입 · 숙소', note: '다중 캐릭 목표, 난입, 숙소 생활' },
      { col: 7, label: '2028.1 시민 등급 · 랭킹', note: '시민 등급 1~3, 랭킹 시스템' },
      { col: 8, label: '2028.2 신규맵 7', note: '세 번째 신규 맵' },
      { col: 9, label: '2028.3 특성 스킬', note: '두 번째 특성 스킬 업데이트' },
      { col: 10, label: '2028.4 봄 · 체온', note: '신규 날씨 봄' },
      { col: 11, label: '2028.5 로그라이크', note: '신규 모드 로그라이크' },
      { col: 12, label: '2028.6 신규맵 8', note: '네 번째 신규 맵 — 로드맵 마무리' }
    ]
  };

  /* ---------- 4. 업데이트 된 내용 (샘플) ----------
     bars  : 전체 화면 소개에서 좌/우 묶음의 제목 (2개)
     group : 각 항목이 어느 묶음(0=좌, 1=우)에 들어가는지
     imgs  : 설명 화면의 액자(16:9). 1~3개. 이미지(.webp/.jpg/.png) 또는 영상(.mp4/.webm) 경로
     pos   : 배경/타일에 쓸 때 이미지의 초점 위치 */
  const UPDATES = {
    kicker: '이번 업데이트',
    title: '업데이트 된 내용',
    sub: '그동안 달라진 점을 소개합니다',
    bars: ['신규', '개선'],
    banner: 'NEW UPDATE',
    items: [
      {
        name: '특성 시스템', tag: '신규', group: 0, imgs: [IMG('ui-traits.webp')], pos: '50% 34%',
        lines: ['신체단련 · 근접격투 · 특수공작 · 야전생존', '근접격투에 액티브 스킬 ‘프런트킥’ 추가', '포인트를 나눠 나만의 생존 방식을 완성'],
        note: '(샘플) 특성 화면 시연 — 프런트킥 설명'
      },
      {
        name: '하우징 시스템', tag: '신규', group: 0, imgs: [IMG('shot-housing.webp'), IMG('shot-store.webp'), IMG('shot-hanok.webp')], pos: '50% 58%',
        lines: ['컨테이너 은신처를 나만의 공간으로', '작업대와 수납장, 가구를 자유롭게 배치', '탐사에서 얻은 재료로 은신처 확장'],
        note: '(샘플) 은신처 꾸미기 — 액자 3개 예시'
      },
      {
        name: '협동 탐사', tag: '개선', group: 1, imgs: [IMG('shot-store.webp'), IMG('shot-hanok.webp')], pos: '50% 52%',
        lines: ['동료와 함께 폐허가 된 상점가를 탐색', '어둠 속에서 서로의 불빛에 의지하는 긴장감', '건물 내부 탐색 동선 개선'],
        note: '(샘플) 협동 플레이 장면 — 액자 2개 예시'
      },
      {
        name: '감염자 전투', tag: '개선', group: 1, imgs: [IMG('shot-hanok.webp'), IMG('shot-store.webp'), IMG('shot-housing.webp'), IMG('ui-traits.webp'), IMG('key.webp')], pos: '50% 50%',
        lines: ['몰려드는 감염자와의 근접전 연출 강화', '타격감과 사운드 전면 개선', '한옥 골목 등 신규 전투 구역'],
        note: '(샘플) 전투 장면 — 액자 5개 예시'
      }
    ]
  };

  /* ---------- 5. 이후 추가될 내용 (샘플, 로드맵 기반) ---------- */
  const UPCOMING = {
    kicker: '다음 업데이트',
    title: '이후 추가될 내용',
    sub: '앞으로 만나게 될 콘텐츠',
    bars: ['콘텐츠', '시스템'],
    banner: 'COMING SOON',
    items: [
      {
        name: '신규 맵 5 ~ 8번', tag: '2027.7 — 2028.6', group: 0, imgs: [IMG('map-island.webp'), IMG('map-seoul.webp')], pos: '45% 50%',
        lines: ['5번 맵 2027.7  ·  6번 맵 2027.10', '7번 맵 2028.2  ·  8번 맵 2028.6', '맵마다 장비와 설계도가 함께 추가'],
        note: '(샘플) 맵 추가 일정 안내 — 액자 2개 예시'
      },
      {
        name: '신규 모드', tag: '2027.7 · 2028.5', group: 0, imgs: [IMG('key.webp')], pos: '50% 35%',
        lines: ['하드코어 탐사  2027.7', '로그라이크  2028.5', '더 가혹하고 더 자유로운 생존'],
        note: '(샘플) 신규 모드 소개'
      },
      {
        name: '날씨와 체온', tag: '2027.8 — 2028.4', group: 1, imgs: [IMG('shot-hanok.webp')], pos: '50% 62%',
        lines: ['폭염 2027.8  ·  폭설 2027.11  ·  봄 2028.4', '시즌 시스템 ‘체온’ 연동', '날씨에 맞춘 가구와 소모품 추가'],
        note: '(샘플) 날씨/체온 설명'
      },
      {
        name: '다중 캐릭 · 난입 · 시민 등급', tag: '2027.12 — 2028.1', group: 1, imgs: [IMG('shot-store.webp')], pos: '50% 40%',
        lines: ['다중 캐릭 목표와 난입 시스템', '숙소 생활, 시민 등급 1~3, 랭킹', '함께 살아남는 낙원의 일상'],
        note: '(샘플) 시스템 콘텐츠 소개'
      }
    ]
  };

  /* ---------- 6. Q&A ---------- */
  const QNA = {
    kicker: 'Q & A', title: 'Q&A', sub: '궁금한 점을 들려주세요',
    items: [
      {
        img: IMG('key.webp'),
        q: '컨텐츠 볼륨이 정체된 느낌이 듭니다.',
        detail: '아직 컨텐츠 양산 단계가 아니라서 그런걸까요?',
        label: '문의 1 · 컨텐츠 볼륨', note: '답변 포인트를 여기에 적어두세요'
      },
      {
        img: IMG('shot-store.webp'),
        q: '쇼핑몰 맵은 언제 테스트 할 수 있는지 궁금합니다.',
        detail: '이전에 12월쯔음 스팀으로 CBT를 다시 할것이라는 이야기를 들은것 같은데, 일정상에 보이질 않아 취소된건지 공개 테스트는 이후 없는 건지 궁금합니다.',
        label: '문의 2 · 쇼핑몰 맵 테스트', note: '답변 포인트를 여기에 적어두세요'
      }
    ]
  };

  /* ---------- 섹션 카드(제목 화면) ---------- */
  const CARDS = {
    agenda: { kicker: AGENDA.kicker, title: AGENDA.title, sub: AGENDA.sub, bg: { img: IMG('key.webp'), pos: '50% 28%' } },
    schedule: { kicker: SCHEDULE.kicker, title: SCHEDULE.title, sub: SCHEDULE.sub, bg: { img: IMG('shot-hanok.webp'), pos: '50% 50%' } },
    roadmap: { kicker: ROADMAP.kicker, title: ROADMAP.title, sub: ROADMAP.sub, bg: { img: IMG('map-island.webp'), pos: '50% 45%' } },
    updates: { kicker: UPDATES.kicker, title: UPDATES.title, sub: UPDATES.sub, bg: { img: IMG('shot-hanok.webp'), pos: '50% 50%' } },
    upcoming: { kicker: UPCOMING.kicker, title: UPCOMING.title, sub: UPCOMING.sub, bg: { img: IMG('map-seoul.webp'), pos: '50% 50%' } },
    qna: { kicker: QNA.kicker, title: QNA.title, sub: QNA.sub, bg: { img: IMG('shot-store.webp'), pos: '50% 45%' } }
  };

  /* ---------- 진행 순서(섹션 → 스텝) 자동 구성 ---------- */
  // auto: 제목 카드가 뜬 뒤 N ms 후 자동으로 다음 화면으로 이동 (Q&A처럼 다음 화면이 없으면 생략)
  const card = (id, auto) => ({ label: '제목', view: 'card', card: id, auto: auto === false ? 0 : 1000, note: '섹션 제목 화면 — 1초 후 자동으로 다음 화면' });

  const SECTIONS = [
    {
      id: 'black', label: '블랙아웃 (대기)', steps: [
        { label: '검은 화면', view: 'black', note: '방송 시작 전 대기 — 다음을 누르면 타이틀이 재생됩니다' }
      ]
    },
    {
      id: 'title', label: '타이틀', steps: [
        { label: 'NAKWON 쇼케이스', view: 'title', note: '오프닝 — 로고 등장' }
      ]
    },
    {
      id: 'agenda', label: '목차 / 순서', steps: [
        { label: '순서 보기', view: 'agenda', note: '오늘 진행 순서 — 1~5번이 차례로 깜빡이며 강조됩니다' }
      ]
    },
    {
      id: 'schedule', label: '개발 일정', steps: [
        card('schedule'),
        { label: '전체 보기', view: 'schedule', hl: null, note: '출시까지 전체 일정' }
      ].concat(SCHEDULE.steps.map((x) => ({ label: x.label, view: 'schedule', hl: x.ph, note: x.note })))
    },
    {
      id: 'roadmap', label: '로드맵', steps: [
        card('roadmap'),
        { label: '전체 보기', view: 'roadmap', hl: null, note: '2027.6 ~ 2028.6 전체 일정' }
      ].concat(ROADMAP.steps.map((s) => ({ label: s.label, view: 'roadmap', hl: s.col, note: s.note })))
    },
    {
      id: 'updates', label: '업데이트 된 내용', steps: [
        card('updates'),
        { label: '전체 보기', view: 'updates-overview', note: '업데이트 항목 한눈에' }
      ].concat(UPDATES.items.map((it, i) => ({ label: it.name, view: 'updates-detail', idx: i, note: it.note })))
    },
    {
      id: 'upcoming', label: '이후 추가될 내용', steps: [
        card('upcoming'),
        { label: '전체 보기', view: 'upcoming-overview', note: '추가 예정 콘텐츠 한눈에' }
      ].concat(UPCOMING.items.map((it, i) => ({ label: it.name, view: 'upcoming-detail', idx: i, note: it.note })))
    },
    {
      id: 'qna', label: 'Q&A', steps: [
        card('qna')
      ].concat(QNA.items.map((it, i) => ({ label: it.label, view: 'qna-page', idx: i, note: it.note })))
    }
  ];

  window.SHOWCASE = {
    title: TITLE, agenda: AGENDA, schedule: SCHEDULE, roadmap: ROADMAP, updates: UPDATES, upcoming: UPCOMING,
    qna: QNA, cards: CARDS, sections: SECTIONS,
    stage: { w: 13920, h: 2160, seam: 6960 }
  };
})();

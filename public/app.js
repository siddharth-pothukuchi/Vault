import { EXAMS as BANK_NAMES, QVERSION, fetchActive, fetchList, fetchQuestion } from './qbank.js';

/* ================= constants ================= */
const DESMOS_URL = 'https://www.desmos.com/api/v1.12/calculator.js?apiKey=1b76be0135fc4871965355a8517415ea';
const EXAMS = { 99: 'SAT', 100: 'PSAT/NMSQT', 102: 'PSAT 8/9' };
const SEC_NAME = { rw: 'Reading and Writing', math: 'Math' };
const PACE = { rw: 71, math: 95 }; // seconds per question on the real test
const DOMAINS = {
  rw: [
    { cd: 'INI', name: 'Information and Ideas', order: ['CID', 'INF', 'COE'] },
    { cd: 'CAS', name: 'Craft and Structure', order: ['WIC', 'TSP', 'CTC'] },
    { cd: 'EOI', name: 'Expression of Ideas', order: ['SYN', 'TRA'] },
    { cd: 'SEC', name: 'Standard English Conventions', order: ['BOU', 'FSS'] },
  ],
  math: [
    { cd: 'H', name: 'Algebra' },
    { cd: 'P', name: 'Advanced Math' },
    { cd: 'Q', name: 'Problem-Solving and Data Analysis' },
    { cd: 'S', name: 'Geometry and Trigonometry' },
  ],
};
const SKILL_NAMES = {
  CID: 'Central Ideas and Details', INF: 'Inferences', COE: 'Command of Evidence',
  WIC: 'Words in Context', TSP: 'Text Structure and Purpose', CTC: 'Cross-Text Connections',
  SYN: 'Rhetorical Synthesis', TRA: 'Transitions', BOU: 'Boundaries', FSS: 'Form, Structure, and Sense',
};
const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' };
const DIFF_RANK = { E: 0, M: 1, H: 2 };

const ICONS = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  next: '<path d="M9 18l6-6-6-6"/>',
  graph: '<path d="M3 3v18h18"/><path d="M7 15c2-6 4-8 6-4s4 2 6-4"/>',
  ref: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  highlight: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevUp: '<path d="m18 15-6-6-6 6"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  retry: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  today: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
};
const icon = (name, size) =>
  `<svg class="i" viewBox="0 0 24 24"${size ? ` style="width:${size}px;height:${size}px"` : ''} aria-hidden="true">${ICONS[name]}</svg>`;

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (x) => `${Math.round(x * 100)}%`;
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const skillName = (q) => SKILL_NAMES[q.s] || q.sd || q.s;
const app = document.getElementById('app');

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

// College Board content is trusted-ish, but strip anything executable before injecting it.
function clean(html) {
  const t = document.createElement('template');
  t.innerHTML = html || '';
  t.content.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach((n) => n.remove());
  t.content.querySelectorAll('style').forEach((n) => { if (!n.closest('svg')) n.remove(); });
  t.content.querySelectorAll('*').forEach((n) => {
    for (const a of [...n.attributes]) {
      if (/^on/i.test(a.name) || (/^(href|src|xlink:href|action)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
    }
  });
  // A centered paragraph holding only an equation should render as display math (full-size fractions).
  t.content.querySelectorAll('p').forEach((p) => {
    const m = p.querySelectorAll('math');
    if (m.length === 1 && /center/.test(p.getAttribute('style') || '') && !p.textContent.replace(m[0].textContent, '').trim()) m[0].setAttribute('display', 'block');
  });
  return t.innerHTML;
}
// College Board explanations often end with empty paragraphs (<p>&nbsp;</p>), stray <br>s and
// editor comments. Drop blank blocks anywhere, then trim blank leftovers from both ends.
const MEDIA = 'img,svg,math,table,figure,mjx-container';
const isBlank = (n) =>
  n.nodeType === Node.COMMENT_NODE ||
  (n.nodeType === Node.TEXT_NODE && !n.textContent.replace(/[\s ]+/g, '')) ||
  (n.nodeType === Node.ELEMENT_NODE && (n.tagName === 'BR' || (!n.matches(MEDIA) && !n.querySelector(MEDIA) && !n.textContent.replace(/[\s ]+/g, ''))));
function stripBlank(root) {
  root.querySelectorAll('p,div').forEach((el) => { if (el.parentNode && isBlank(el)) el.remove(); });
  for (const end of ['lastChild', 'firstChild']) {
    let node = root;
    while (node && node[end]) {
      const c = node[end];
      if (isBlank(c)) { c.remove(); continue; }
      if (c.nodeType === Node.TEXT_NODE) {
        c.textContent = end === 'lastChild' ? c.textContent.replace(/[\s ]+$/, '') : c.textContent.replace(/^[\s ]+/, '');
        break;
      }
      if (c.nodeType !== Node.ELEMENT_NODE || c.matches(MEDIA)) break;
      node = c; // descend into the last/first block and keep trimming there
    }
  }
}

const hasContent = (html) => !!html && (html.replace(/<[^>]+>/g, '').trim() || /<(img|svg|math|table)/i.test(html));

function typeset(el) {
  let n = 0;
  const go = () => {
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.startup.promise.then(() => MathJax.typesetPromise([el])).catch(() => {});
    } else if (n++ < 150) setTimeout(go, 100);
  };
  go();
}

/* ================= persistence ================= */
const KEY = 'apex.v1';
const store = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
  s.answers ||= {};
  s.flags ||= {};
  s.days ||= {};
  s.session ||= null;
  s.settings = Object.assign(
    { theme: document.documentElement.dataset.theme, exam: '99', diff: ['E', 'M', 'H'], status: 'all', size: 'all', active: 'include', calcW: 460, timerHidden: false },
    s.settings || {}
  );
  return s;
})();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

/* ================= state ================= */
const S = {
  bank: null,
  bankErr: null,
  qcache: new Map(),
  view: null,
  cur: null,
  ui: {},
  navOpen: false,
  hl: false,
  calcOpen: false,
  calc: null,
  calcHost: null,
  calcInit: null,
  token: 0,
};

/* ================= data ================= */
/* ---------- browser cache ----------
   Questions come straight from College Board (their API allows any website to call it), and are kept
   in the browser's Cache Storage so repeat visits are instant. The cache name carries QVERSION, so a
   change to how questions are normalized starts a fresh cache. */
const CACHE_NAME = `vault-q${QVERSION}`;
const LIST_TTL = 3 * 24 * 3600 * 1000;
const cacheP = (async () => {
  try {
    if (!window.caches) return null;
    for (const k of await caches.keys()) if (k.startsWith('vault-q') && k !== CACHE_NAME) caches.delete(k);
    return await caches.open(CACHE_NAME);
  } catch { return null; } // e.g. plain http or private mode: just skip caching
})();

async function cached(key, maxAge, load) {
  const c = await cacheP;
  const url = `https://cache.vault/${key}`; // synthetic key, never fetched
  const hit = c && (await c.match(url).catch(() => null));
  if (hit && (!maxAge || Date.now() - Number(hit.headers.get('x-ts')) < maxAge)) return hit.json();
  try {
    const data = await load();
    c?.put(url, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'x-ts': String(Date.now()) } })).catch(() => {});
    return data;
  } catch (e) {
    if (hit) return hit.json(); // offline: fall back to a stale copy
    throw e;
  }
}

async function loadBank(exam) {
  S.bank = null;
  S.bankErr = null;
  if (S.view === 'home') renderHome();
  try {
    const [rw, math, active] = await Promise.all([
      ...[1, 2].map((sec) => cached(`list-${exam}-${sec}`, LIST_TTL, () => fetchList(exam, sec))),
      cached('active', LIST_TTL, fetchActive).catch(() => []), // optional: without it nothing is marked active
    ]);
    if (store.settings.exam !== exam) return;
    const live = new Set(active);
    rw.forEach((q) => { q.sec = 'rw'; q.active = !!q.ext && live.has(q.ext); });
    math.forEach((q) => { q.sec = 'math'; q.active = !!q.ext && live.has(q.ext); });
    S.raw = { exam, rw, math };
    applyBank();
  } catch (e) {
    S.bankErr = e.message;
  }
  if (S.view === 'home') renderHome();
}

// The visible bank honors the "Active questions" filter, so counts, skill sets, mixed sets and reviews all agree.
function applyBank() {
  const { exam, rw, math } = S.raw;
  const keep = (q) => store.settings.active !== 'exclude' || !q.active;
  const r = rw.filter(keep), m = math.filter(keep);
  S.bank = { exam, name: BANK_NAMES[exam], rw: r, math: m, tree: buildTree(r, m), activeCount: rw.concat(math).filter((q) => q.active).length };
}

function buildTree(rw, math) {
  const tree = {};
  for (const [sec, list] of [['rw', rw], ['math', math]]) {
    tree[sec] = DOMAINS[sec].map((dom) => {
      const qs = list.filter((q) => q.d === dom.cd);
      const skills = new Map();
      for (const q of qs) {
        if (!skills.has(q.s)) skills.set(q.s, { cd: q.s, name: skillName(q), qs: [] });
        skills.get(q.s).qs.push(q);
      }
      const arr = [...skills.values()];
      arr.sort((a, b) => (dom.order ? dom.order.indexOf(a.cd) - dom.order.indexOf(b.cd) : a.cd.localeCompare(b.cd)));
      return { ...dom, qs, skills: arr };
    });
  }
  return tree;
}

function getQ(meta) {
  if (!S.qcache.has(meta.id)) {
    const pr = cached(`q-${meta.id}`, 0, () => fetchQuestion(meta.id, meta.ext, meta.ibn));
    pr.catch(() => S.qcache.delete(meta.id));
    S.qcache.set(meta.id, pr);
  }
  return S.qcache.get(meta.id);
}

function statFor(qs) {
  let done = 0, ok = 0;
  for (const q of qs) {
    const a = store.answers[q.id];
    if (a) { done++; if (a.ok) ok++; }
  }
  return { total: qs.length, done, ok, acc: done ? ok / done : null };
}

function streak() {
  let n = 0;
  const d = new Date();
  if (!store.days[todayKey(d)]) d.setDate(d.getDate() - 1);
  while (store.days[todayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ================= routing ================= */
function route() {
  if (location.hash.startsWith('#/practice') && store.session) renderPractice();
  else renderHome();
}
window.addEventListener('hashchange', route);

/* ================= home ================= */
function renderHome() {
  if (S.view === 'practice') teardownPractice();
  S.view = 'home';
  document.title = 'vault';
  const st = store.settings;
  const scrollY = window.scrollY;
  app.innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="brand-mark" aria-hidden="true">v</span><span class="brand-name">vault<small>SAT · PSAT</small></span></div>
      <div class="seg" role="tablist" aria-label="Exam">
        ${Object.entries(EXAMS).map(([id, n]) => `<button data-exam="${id}" class="${st.exam === id ? 'on' : ''}">${n}</button>`).join('')}
      </div>
      <div class="spacer"></div>
      <button class="icon-btn" data-act="theme" title="Toggle light / dark">${icon(themeIcon())}</button>
    </header>
    <main class="home">${S.bank ? homeBody() : S.bankErr ? homeError() : homeSkeleton()}</main>`;
  window.scrollTo(0, scrollY);
}

function homeError() {
  return `<div class="card" style="padding:28px">
    <h2 style="margin:0 0 6px">Couldn't reach the question bank</h2>
    <p style="color:var(--muted);margin:0 0 16px">${esc(S.bankErr)}. Check your internet connection and try again.</p>
    <button class="btn primary" data-act="reload">${icon('retry', 16)} Try again</button></div>`;
}

function homeSkeleton() {
  const blk = (h, w = '100%') => `<div class="skeleton" style="height:${h}px;width:${w}"></div>`;
  return `<div class="hero"><div style="display:grid;gap:12px">${blk(14, '30%')}${blk(40, '80%')}${blk(18, '60%')}</div>
    <div class="stats">${blk(92)}${blk(92)}${blk(92)}${blk(92)}</div></div>
    <div class="sections"><div style="display:grid;gap:10px">${Array(8).fill(blk(44)).join('')}</div><div style="display:grid;gap:10px">${Array(8).fill(blk(44)).join('')}</div></div>
    <p class="foot-note">Loading the official College Board question bank…</p>`;
}

function homeBody() {
  const b = S.bank;
  const st = store.settings;
  const all = [...b.rw, ...b.math];
  const ov = statFor(all);
  const mistakes = all.filter((q) => store.answers[q.id] && !store.answers[q.id].ok).length;
  const flagged = all.filter((q) => store.flags[q.id]).length;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
  const ss = store.session;
  const cont = ss && ss.i < ss.qs.length
    ? `<button class="btn primary" data-act="continue">${icon('play', 15)} Continue · ${esc(ss.title)} <span style="opacity:.75;font-weight:500">${ss.i + 1}/${ss.qs.length}</span></button>`
    : '';

  const weak = [];
  for (const sec of ['rw', 'math']) for (const d of b.tree[sec]) for (const s of d.skills) {
    const x = statFor(s.qs);
    if (x.done >= 3 && x.acc < 0.85) weak.push({ sec, d, s, x });
  }
  weak.sort((a, c) => a.x.acc - c.x.acc);

  return `
    <section class="hero">
      <div>
        <div class="eyebrow">${esc(b.name)} · Official question bank</div>
        <h1>${greet}<br /><span class="grad">Let's raise that score.</span></h1>
        <p>${all.length.toLocaleString()} real College Board questions, organized by the exact skills the test measures — with full explanations and the built-in Desmos calculator.</p>
        <div class="quick">
          ${cont}
          <button class="btn" data-start="mixed:rw">${icon('shuffle', 15)} Mixed R&amp;W</button>
          <button class="btn" data-start="mixed:math">${icon('shuffle', 15)} Mixed Math</button>
          <button class="btn" data-start="mistakes" ${mistakes ? '' : 'disabled'}>${icon('retry', 15)} Review mistakes${mistakes ? ` · ${mistakes}` : ''}</button>
          <button class="btn" data-start="flagged" ${flagged ? '' : 'disabled'}>${icon('flag', 15)} Flagged${flagged ? ` · ${flagged}` : ''}</button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><div class="label">Answered</div><div class="value">${ov.done.toLocaleString()}<small>/ ${ov.total.toLocaleString()}</small></div><span class="spark">${icon('chart')}</span></div>
        <div class="stat"><div class="label">Accuracy</div><div class="value">${ov.acc == null ? '—' : pct(ov.acc)}</div><span class="spark">${icon('target')}</span></div>
        <div class="stat"><div class="label">Day streak</div><div class="value">${streak()}<small>days</small></div><span class="spark" style="color:var(--warn)">${icon('flame')}</span></div>
        <div class="stat"><div class="label">Today</div><div class="value">${store.days[todayKey()] || 0}<small>questions</small></div><span class="spark" style="color:var(--cyan)">${icon('today')}</span></div>
      </div>
    </section>

    <section class="card filters">
      <div class="group"><span>Difficulty</span>
        <div class="seg">${['E', 'M', 'H'].map((d) => `<button class="${st.diff.includes(d) ? 'on' : ''}" data-set="diff:${d}"><span class="dot" style="background:var(--${d === 'E' ? 'ok' : d === 'M' ? 'warn' : 'bad'})"></span>${DIFF[d]}</button>`).join('')}</div>
      </div>
      <div class="group"><span>Show</span>
        <div class="seg">${[['all', 'All'], ['new', 'Unanswered'], ['missed', 'Missed'], ['flagged', 'Flagged']].map(([v, l]) => `<button class="${st.status === v ? 'on' : ''}" data-set="status:${v}">${l}</button>`).join('')}</div>
      </div>
      <div class="group"><span title="College Board marks some questions as active (currently in use). Its own question bank lets you leave them out.">Active questions</span>
        <div class="seg">${[['include', 'Include'], ['exclude', 'Exclude']].map(([v, l]) => `<button class="${st.active === v ? 'on' : ''}" data-set="active:${v}" title="${v === 'exclude' ? `Hide the ${b.activeCount.toLocaleString()} active questions in this exam` : 'Show every question'}">${l}</button>`).join('')}</div>
      </div>
      <div class="group"><span>Set size</span>
        <div class="seg">${['10', '20', '40', 'all'].map((v) => `<button class="${st.size === v ? 'on' : ''}" data-set="size:${v}">${v === 'all' ? 'All' : v}</button>`).join('')}</div>
      </div>
    </section>

    ${weak.length ? `<section class="card focus">
      <div class="focus-head"><h3>Focus areas</h3><span class="eyebrow">Lowest accuracy</span></div>
      <div class="focus-list">${weak.slice(0, 3).map(({ sec, d, s, x }) => `
        <button class="focus-item" data-start="skill:${sec}:${s.cd}">
          <div class="n">${esc(s.name)}</div>
          <div class="m"><span class="acc">${pct(x.acc)}</span> · ${x.done} answered · ${esc(d.name)}</div>
        </button>`).join('')}</div>
    </section>` : ''}

    <div class="sections">${sectionHTML('rw')}${sectionHTML('math')}</div>
    <p class="foot-note">Questions, answers, and explanations come live from the College Board Educator Question Bank. Progress is saved in this browser.</p>`;
}

function sectionHTML(sec) {
  const doms = S.bank.tree[sec];
  const qs = S.bank[sec];
  const st = statFor(qs);
  return `<section class="card section">
    <div class="section-head">
      <div class="section-icon ${sec}">${icon(sec === 'rw' ? 'book' : 'sigma')}</div>
      <div><h2>${SEC_NAME[sec]}</h2><div class="sub">${qs.length.toLocaleString()} questions · ${st.done} done${st.acc != null ? ` · ${pct(st.acc)} accuracy` : ''}</div></div>
      <div class="spacer"></div>
      <button class="btn sm" data-start="section:${sec}">${icon('play', 13)} Practice all</button>
    </div>
    ${doms.map((d) => domainHTML(sec, d)).join('')}
  </section>`;
}

function domainHTML(sec, d) {
  const st = statFor(d.qs);
  return `<div class="domain">
    <button class="domain-head" data-start="domain:${sec}:${d.cd}" title="Practice all of ${esc(d.name)}">
      <span class="ring" style="--p:${st.total ? Math.round((st.done / st.total) * 100) : 0}"></span>
      <span class="name">${esc(d.name)}</span>
      <span class="count">${st.done}/${st.total}</span>
      <span class="go">${icon('next', 16)}</span>
    </button>
    ${d.skills.map((s) => {
      const x = statFor(s.qs);
      const cls = x.acc == null ? '' : x.acc >= 0.8 ? 'good' : x.acc >= 0.6 ? 'mid' : 'low';
      return `<button class="skill" data-start="skill:${sec}:${s.cd}">
        <span class="n">${esc(s.name)}</span>
        <span class="meta">${x.acc != null ? `<span class="acc ${cls}">${pct(x.acc)}</span>` : ''}<span>${x.done}/${x.total}</span></span>
        <span class="bar"><i class="ok" style="width:${(x.ok / x.total) * 100}%"></i><i class="bad" style="width:${((x.done - x.ok) / x.total) * 100}%"></i></span>
      </button>`;
    }).join('')}
  </div>`;
}

/* ================= building a practice set ================= */
function sortKey(q) {
  const doms = DOMAINS[q.sec];
  const di = doms.findIndex((d) => d.cd === q.d);
  const order = doms[di]?.order;
  const si = order ? order.indexOf(q.s) : 0;
  return [q.sec === 'rw' ? 0 : 1, di, si, q.s, DIFF_RANK[q.diff] ?? 1, q.band ?? 0, q.id];
}
function cmpKeys(a, b) {
  const ka = sortKey(a), kb = sortKey(b);
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] < kb[i]) return -1;
    if (ka[i] > kb[i]) return 1;
  }
  return 0;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const slim = (q) => ({ id: q.id, ext: q.ext, ibn: q.ibn, d: q.d, s: q.s, sd: skillName(q), diff: q.diff, sec: q.sec });

function startSet(key) {
  const b = S.bank;
  const [kind, sec, cd] = key.split(':');
  const st = store.settings;
  const all = [...b.rw, ...b.math];
  let pool, title, crumb, mixed = false, ignoreStatus = false;
  if (kind === 'skill') {
    const d = b.tree[sec].find((x) => x.skills.some((s) => s.cd === cd));
    const s = d.skills.find((x) => x.cd === cd);
    [pool, title, crumb] = [s.qs, s.name, `${SEC_NAME[sec]} · ${d.name}`];
  } else if (kind === 'domain') {
    const d = b.tree[sec].find((x) => x.cd === cd);
    [pool, title, crumb] = [d.qs, d.name, SEC_NAME[sec]];
  } else if (kind === 'section') {
    [pool, title, crumb] = [b[sec], `All ${SEC_NAME[sec]}`, b.name];
  } else if (kind === 'mixed') {
    [pool, title, crumb, mixed] = [b[sec], `Mixed ${SEC_NAME[sec]}`, b.name, true];
  } else if (kind === 'mistakes') {
    [pool, title, crumb, ignoreStatus] = [all.filter((q) => store.answers[q.id] && !store.answers[q.id].ok), 'Review mistakes', b.name, true];
  } else if (kind === 'flagged') {
    [pool, title, crumb, ignoreStatus] = [all.filter((q) => store.flags[q.id]), 'Flagged questions', b.name, true];
  }

  let list = pool.filter((q) => st.diff.includes(q.diff));
  if (!ignoreStatus) {
    if (st.status === 'new') list = list.filter((q) => !store.answers[q.id]);
    if (st.status === 'missed') list = list.filter((q) => store.answers[q.id] && !store.answers[q.id].ok);
    if (st.status === 'flagged') list = list.filter((q) => store.flags[q.id]);
  }
  if (!list.length) return toast('No questions match those filters — try loosening them.');

  const size = st.size === 'all' ? (mixed ? 20 : Infinity) : Number(st.size);
  // Mixed sets are shuffled; everything else runs easy → hard.
  if (list.length > size) list = shuffle(list).slice(0, size);
  if (mixed) shuffle(list);
  else list.sort(cmpKeys);

  store.session = { key, title, crumb, qs: list.map(slim), i: 0, started: Date.now(), results: {} };
  save();
  location.hash = '#/practice';
}

/* ================= practice ================= */
function themeIcon() {
  return document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon';
}

function renderPractice() {
  const ss = store.session;
  S.view = 'practice';
  S.navOpen = false;
  S.hl = false;
  document.title = 'vault';
  app.innerHTML = `
  <div class="practice" id="practice">
    <header class="pbar">
      <div class="pbar-left">
        <button class="icon-btn" data-act="home" title="Back to dashboard">${icon('back')}</button>
        <div class="ptitle"><span class="crumb">${esc(ss.crumb)}</span><strong>${esc(ss.title)}</strong></div>
      </div>
      <div class="center">
        <div class="timer ${store.settings.timerHidden ? 'hidden' : ''}" id="timer" title="Time on this question">
          ${icon('clock', 16)}<span class="t" id="timerT">0:00</span><button data-act="timer">${store.settings.timerHidden ? 'Show' : 'Hide'}</button>
        </div>
      </div>
      <div class="tools">
        <button class="tool" data-act="calc" id="tCalc" title="Desmos graphing calculator (G)">${icon('graph')}<span class="lbl">Calculator</span></button>
        <button class="tool" data-act="ref" id="tRef" title="Math reference sheet">${icon('ref')}<span class="lbl">Reference</span></button>
        <button class="tool" data-act="hl" id="tHl" title="Highlight text in the passage">${icon('highlight')}<span class="lbl">Highlight</span></button>
        <span class="sep"></span>
        <button class="icon-btn" data-act="theme" title="Toggle light / dark">${icon(themeIcon())}</button>
      </div>
    </header>
    <div class="pbody">
      <section class="calc-pane" id="calcPane" style="width:${store.settings.calcW}px">
        <div class="calc-head">${icon('graph', 16)} Desmos Graphing Calculator<span class="spacer"></span>
          <button class="icon-btn" data-act="calc-expand" title="Expand / shrink">${icon('expand', 16)}</button>
          <button class="icon-btn" data-act="calc" title="Close calculator">${icon('x', 16)}</button>
        </div>
        <div class="calc-slot" id="calcSlot"></div>
      </section>
      <div class="resizer" id="resizer" title="Drag to resize"></div>
      <div class="qwrap" id="qwrap"></div>
    </div>
    <footer class="pfoot">
      <div class="progress-line" id="pline"></div>
      <div class="left"><span><kbd>A</kbd>–<kbd>D</kbd> choose</span><span><kbd>Enter</kbd> check / next</span><span><kbd>←</kbd> <kbd>→</kbd> move</span><span><kbd>F</kbd> flag</span></div>
      <button class="nav-toggle" id="navToggle" data-act="nav"></button>
      <div class="right">
        <button class="btn" data-act="prev" id="bPrev">Back</button>
        <button class="btn primary" data-act="next" id="bNext">Next</button>
      </div>
      <div id="navpop"></div>
    </footer>
  </div>`;
  setupResizer();
  clearInterval(S.timer);
  S.timer = setInterval(tickTimer, 500);
  if (ss.i >= ss.qs.length) renderSummary();
  else showQuestion(ss.i);
}

function teardownPractice() {
  clearInterval(S.timer);
  if (S.calcHost) S.calcHost.remove();
}

function tickTimer() {
  const el = $('#timerT');
  if (!el || !S.cur || !S.ui.qStart) return;
  const secs = ((S.ui.stoppedAt || Date.now()) - S.ui.qStart) / 1000;
  el.textContent = fmtTime(secs);
  const t = $('#timer');
  t.style.color = !S.ui.stoppedAt && secs > PACE[S.cur.meta.sec] ? 'var(--warn)' : '';
  t.title = `Time on this question · target pace ≈ ${PACE[S.cur.meta.sec]}s`;
}

function syncTools(meta) {
  const math = meta.sec === 'math';
  $('#tCalc').style.display = math ? '' : 'none';
  $('#tRef').style.display = math ? '' : 'none';
  $('#practice').classList.toggle('calc-open', math && S.calcOpen);
  $('#tCalc').classList.toggle('on', S.calcOpen);
  if (math && S.calcOpen) mountCalc();
}

function updateFooter() {
  const ss = store.session;
  if (!$('#navToggle')) return;
  const n = ss.qs.length;
  const i = Math.min(ss.i, n - 1);
  $('#navToggle').innerHTML = `Question ${i + 1} of ${n} <span class="chev">${icon('chevUp', 16)}</span>`;
  $('#navToggle').classList.toggle('open', S.navOpen);
  const answered = Object.values(ss.results).length;
  $('#pline').style.width = `${(answered / n) * 100}%`;
  $('#bPrev').disabled = ss.i === 0;
  // On the end-of-set summary, the primary button leads back to the dashboard.
  const done = ss.i >= n;
  $('#bNext').textContent = done ? 'Dashboard' : ss.i >= n - 1 ? 'Finish' : 'Next';
  $('#bNext').dataset.act = done ? 'home' : 'next';
  renderNav();
}

async function showQuestion(i) {
  const ss = store.session;
  ss.i = i;
  save();
  const meta = ss.qs[i];
  const token = ++S.token;
  S.ui = { selected: null, struck: new Set(), checked: false, qStart: 0, spr: '' };
  S.cur = null;
  S.navOpen = false;
  syncTools(meta);
  updateFooter();
  const qwrap = $('#qwrap');
  qwrap.className = 'qwrap';
  qwrap.innerHTML = `<div class="qpane pane-scroll"><div class="inner"><div class="loading-q">
    <div class="skeleton" style="height:32px;width:45%"></div><div class="skeleton" style="height:18px"></div>
    <div class="skeleton" style="height:18px;width:85%"></div><div class="skeleton" style="height:18px;width:70%"></div>
    <div style="height:10px"></div>${'<div class="skeleton" style="height:58px"></div>'.repeat(4)}</div></div></div>`;
  let q;
  try {
    q = await getQ(meta);
  } catch (e) {
    if (token !== S.token) return;
    qwrap.innerHTML = `<div class="qpane pane-scroll"><div class="inner"><div class="error-box">
      <strong>Couldn't load this question.</strong><br />${esc(e.message)}
      <div style="margin-top:14px"><button class="btn" data-act="retry">${icon('retry', 15)} Retry</button> <button class="btn ghost" data-act="next">Skip</button></div></div></div></div>`;
    return;
  }
  if (token !== S.token || S.view !== 'practice') return;
  S.cur = { meta, q };
  S.ui.qStart = Date.now();
  renderQuestion();
  const nx = ss.qs[i + 1];
  if (nx) getQ(nx).catch(() => {});
}

function renderQuestion() {
  const { meta, q } = S.cur;
  const ss = store.session;
  const split = hasContent(q.stimulus);
  const flagged = !!store.flags[meta.id];
  const qwrap = $('#qwrap');
  qwrap.className = `qwrap${split ? ' split' : ''}`;
  qwrap.innerHTML = `
    ${split ? `<article class="passage pane-scroll"><div class="inner"><div class="rich hl-zone" id="stim">${clean(q.stimulus)}</div></div></article>` : ''}
    <article class="qpane pane-scroll" id="qpane"><div class="inner">
      <div class="qmeta">
        <span class="qnum">${ss.i + 1}</span>
        <button class="flag-btn ${flagged ? 'on' : ''}" data-act="flag" id="flagBtn">${icon('flag', 16)}<span>${flagged ? 'Flagged' : 'Flag for review'}</span></button>
        <span class="spacer"></span>
        <span class="diff ${meta.diff}" title="Difficulty"><span class="bars"><i></i><i></i><i></i></span>${DIFF[meta.diff] || ''}</span>
        <span class="tag" title="${esc(meta.sd)}">${esc(meta.sd)}</span>
      </div>
      <div class="stem rich hl-zone" id="stem">${clean(q.stem)}</div>
      ${q.type === 'mcq' ? choicesHTML(q) : sprHTML()}
      <div class="actions" id="actions"></div>
      <div class="explain" id="explain"></div>
      <div class="qid" style="margin-top:28px">Question ID ${esc(meta.id)}</div>
    </div></article>`;
  qwrap.classList.toggle('hl-mode', S.hl);
  typeset(qwrap);

  if (q.type === 'spr') {
    const inp = $('#sprIn');
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/[^0-9./-]/g, '');
      S.ui.spr = inp.value;
      renderSprPreview();
      renderActions();
    });
    if (!(ss.results[meta.id])) setTimeout(() => inp.focus({ preventScroll: true }), 50);
  }

  const prev = ss.results[meta.id];
  if (prev) {
    S.ui.checked = true;
    S.ui.stoppedAt = S.ui.qStart + (prev.t || 0) * 1000;
    if (q.type === 'mcq') S.ui.selected = prev.a || null;
    else { S.ui.spr = prev.a || ''; $('#sprIn').value = S.ui.spr; renderSprPreview(); }
    refreshChoices();
    applyResultUI(prev.revealed ? null : prev.ok);
    showExplanation(prev.revealed ? null : prev.ok, false);
  } else renderActions();
}

function choicesHTML(q) {
  return `<div class="choices" id="choices">${q.choices.map((c) => `
    <div class="choice" data-l="${c.letter}">
      <button class="choice-main" data-choose="${c.letter}" aria-label="Choice ${c.letter}">
        <span class="letter">${c.letter}</span><span class="choice-body rich">${clean(c.html)}</span>
      </button>
      <button class="strike" data-strike="${c.letter}" title="Eliminate choice ${c.letter}"><span>${c.letter}</span></button>
    </div>`).join('')}</div>`;
}

function sprHTML() {
  return `<div class="spr">
    <label class="spr-field"><span class="spr-label">Your answer</span>
      <input class="spr-input" id="sprIn" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="6" placeholder="Type here" /></label>
    <div class="spr-field"><span class="spr-label">Answer preview</span><div class="spr-preview" id="sprPrev"></div></div>
    <div class="spr-hint"><b>Student-produced response.</b> Up to 5 characters for a positive answer, 6 for a negative one. Fractions (<b>3/4</b>) and decimals (<b>.75</b>) both work — no %, $, commas, or mixed numbers.</div>
  </div>`;
}

function renderSprPreview() {
  const v = S.ui.spr.trim();
  const el = $('#sprPrev');
  if (!el) return;
  const m = v.match(/^(-?)([^/]*)\/(.*)$/);
  el.innerHTML = m ? `${m[1] ? '−' : ''}<span class="frac"><span>${esc(m[2] || ' ')}</span><span>${esc(m[3] || ' ')}</span></span>` : esc(v.replace(/^-/, '−'));
}

function renderActions() {
  const el = $('#actions');
  if (!el || !S.cur) return;
  const { q } = S.cur;
  const ss = store.session;
  if (S.ui.checked) {
    const last = ss.i >= ss.qs.length - 1;
    el.innerHTML = `<button class="btn primary" data-act="next">${last ? 'Finish set' : 'Next question'} ${icon('arrowRight', 16)}</button><span class="hint"><kbd>Enter</kbd></span>`;
    return;
  }
  const can = q.type === 'mcq' ? !!S.ui.selected : S.ui.spr.trim() !== '';
  el.innerHTML = `<button class="btn primary" data-act="check" ${can ? '' : 'disabled'}>${icon('check', 16)} Check answer</button>
    <button class="btn ghost" data-act="reveal">Show answer</button>`;
}

function refreshChoices() {
  $$('.choice').forEach((c) => {
    const l = c.dataset.l;
    c.classList.toggle('selected', S.ui.selected === l);
    c.classList.toggle('struck', S.ui.struck.has(l));
  });
}

function choose(l) {
  if (S.ui.checked || !S.cur || S.cur.q.type !== 'mcq') return;
  S.ui.struck.delete(l);
  S.ui.selected = S.ui.selected === l ? null : l;
  refreshChoices();
  renderActions();
}

function strike(l) {
  if (S.ui.checked) return;
  if (S.ui.struck.has(l)) S.ui.struck.delete(l);
  else { S.ui.struck.add(l); if (S.ui.selected === l) S.ui.selected = null; }
  refreshChoices();
  renderActions();
}

function sprValue(s) {
  s = String(s).replace(/\s+/g, '').replace(/[−–]/g, '-');
  const f = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (f) return Number(f[1]) / Number(f[2]);
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : NaN;
}
function sprMatch(v, keys) {
  const u = v.replace(/\s+/g, '');
  const uv = sprValue(u);
  return keys.some((k) => {
    const kk = String(k).replace(/\s+/g, '');
    if (kk === u) return true;
    const kv = sprValue(kk);
    return Number.isFinite(kv) && Number.isFinite(uv) && Math.abs(kv - uv) < 1e-9;
  });
}

function record(ok, a) {
  const { meta } = S.cur;
  const ss = store.session;
  const t = Math.round((Date.now() - S.ui.qStart) / 1000);
  const prev = store.answers[meta.id];
  store.answers[meta.id] = { ok, a, t, ts: Date.now(), n: (prev?.n || 0) + 1 };
  ss.results[meta.id] = { ok, a, t };
  const d = todayKey();
  store.days[d] = (store.days[d] || 0) + 1;
  save();
  updateFooter();
}

function check() {
  if (!S.cur || S.ui.checked) return;
  const { q } = S.cur;
  if (q.type === 'mcq' ? !S.ui.selected : !S.ui.spr.trim()) return;
  S.ui.stoppedAt = Date.now();
  if (!q.correct.filter(Boolean).length) {
    // Older items without a machine-readable key: let the student grade themselves.
    S.ui.checked = true;
    applyResultUI(null);
    showExplanation(undefined, true);
    return;
  }
  if (q.type === 'mcq') {
    const ok = q.correct.includes(S.ui.selected);
    S.ui.checked = true;
    record(ok, S.ui.selected);
    applyResultUI(ok);
    showExplanation(ok, true);
  } else {
    const v = S.ui.spr.trim();
    S.ui.checked = true;
    const ok = sprMatch(v, q.correct);
    record(ok, v);
    applyResultUI(ok);
    showExplanation(ok, true);
  }
}

function reveal() {
  if (!S.cur || S.ui.checked) return;
  S.ui.checked = true;
  S.ui.stoppedAt = Date.now();
  store.session.results[S.cur.meta.id] = { ok: null, revealed: true, a: S.ui.selected || S.ui.spr || null, t: Math.round((Date.now() - S.ui.qStart) / 1000) };
  save();
  updateFooter();
  applyResultUI(null);
  showExplanation(null, true);
}

function selfGrade(ok) {
  record(ok, S.cur.q.type === 'mcq' ? S.ui.selected : S.ui.spr.trim());
  applyResultUI(ok);
  showExplanation(ok, false);
}

function applyResultUI(ok) {
  const { q } = S.cur;
  if (q.type === 'mcq') {
    const box = $('#choices');
    box.classList.add('locked');
    $$('.choice', box).forEach((c) => {
      const l = c.dataset.l;
      const isRight = q.correct.includes(l);
      const isWrong = !isRight && S.ui.selected === l && ok === false;
      c.classList.toggle('is-correct', isRight);
      c.classList.toggle('is-wrong', isWrong);
      c.classList.remove('struck');
      const main = $('.choice-main', c);
      $('.verdict-ic', main)?.remove();
      if (isRight || isWrong) main.insertAdjacentHTML('beforeend', `<span class="verdict-ic">${icon(isRight ? 'check' : 'x', 20)}</span>`);
    });
  } else {
    const inp = $('#sprIn');
    inp.disabled = true;
    inp.classList.toggle('ok', ok === true);
    inp.classList.toggle('bad', ok === false);
  }
  renderActions();
}

// Bold every "Choice X is correct / incorrect" verdict so the full explanation is easy to scan.
const VERDICT_RE = /(Choices?\s+[A-D](?:(?:,\s*|\s+and\s+|,\s*and\s+)[A-D])*\s+(?:is|are)\s+(?:all\s+)?(?:the\s+best\s+answer|correct|incorrect|not\s+the\s+best\s+answer))/gi;
function formatRationale(html) {
  const t = document.createElement('template');
  t.innerHTML = clean(html);
  stripBlank(t.content);
  const walker = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) if (!walker.currentNode.parentElement?.closest('math')) texts.push(walker.currentNode);
  for (const tn of texts) {
    const parts = tn.textContent.split(VERDICT_RE);
    if (parts.length < 2) continue;
    const frag = document.createDocumentFragment();
    parts.forEach((p, i) => {
      if (i % 2 === 0) { if (p) frag.appendChild(document.createTextNode(p)); return; }
      const s = document.createElement('strong');
      s.className = /incorrect|not\s+the/i.test(p) ? 'lead-x' : 'lead';
      s.textContent = p;
      frag.appendChild(s);
    });
    tn.replaceWith(frag);
  }
  return t.innerHTML;
}

function showExplanation(ok, scroll) {
  const { q, meta } = S.cur;
  const ex = $('#explain');
  const res = store.session.results[meta.id];
  const selfGrade = ok === undefined;
  const cls = ok === true ? 'ok' : ok === false ? 'bad' : 'neutral';
  const verdict = ok === true ? 'Correct!' : ok === false ? 'Not quite' : selfGrade ? 'Check your work' : 'Answer';
  const badge = ok === true ? 'check' : ok === false ? 'x' : 'book';
  const keys = q.correct.filter(Boolean);
  const keyHTML = keys.length
    ? `<span class="key">Correct answer${keys.length > 1 && q.type === 'spr' ? 's' : ''} <span class="vals">${keys.map((k) => `<span class="v">${esc(k)}</span>`).join('')}</span></span>`
    : '';

  ex.innerHTML = `<div class="ex-card ${cls}">
    <div class="ex-top">
      <div class="ex-verdict"><span class="badge">${icon(badge, 16)}</span>${verdict}</div>
      <span class="spacer"></span>
      ${keyHTML}
      ${res && res.t != null ? `<span class="ex-time">${icon('clock', 14)} ${fmtTime(res.t)}</span>` : ''}
    </div>
    <div class="ex-body">
      ${selfGrade ? `<div class="selfgrade">This question doesn't include an answer key we can auto-check — compare with the explanation:
        <button class="btn sm" data-act="self-ok">${icon('check', 14)} I got it right</button>
        <button class="btn sm" data-act="self-bad">${icon('x', 14)} I missed it</button></div>` : ''}
      <div class="ex-sec-title">Explanation</div>
      <div class="rich ex-text">${formatRationale(q.rationale)}</div>
    </div>
  </div>`;
  typeset(ex);
  if (scroll) setTimeout(() => ex.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

function go(i) {
  const ss = store.session;
  if (i < 0) return;
  if (i >= ss.qs.length) {
    ss.i = ss.qs.length;
    save();
    return renderSummary();
  }
  showQuestion(i);
}
const next = () => {
  if (store.session.i >= store.session.qs.length) location.hash = '#/'; // already on the summary
  else go(store.session.i + 1);
};
const prev = () => go(Math.min(store.session.i, store.session.qs.length) - 1);

function renderSummary() {
  const ss = store.session;
  S.cur = null;
  S.token++;
  S.navOpen = false;
  $('#practice').classList.remove('calc-open');
  const res = Object.values(ss.results).filter((r) => r.ok != null);
  const right = res.filter((r) => r.ok).length;
  const missed = ss.qs.filter((q) => ss.results[q.id]?.ok === false);
  const avg = res.length ? res.reduce((s, r) => s + (r.t || 0), 0) / res.length : 0;
  $('#qwrap').className = 'qwrap';
  $('#qwrap').innerHTML = `<div class="pane-scroll" style="flex:1"><div class="summary">
    <div class="eyebrow" style="margin-top:20px">Set complete · ${esc(ss.title)}</div>
    <div class="big">${right}/${res.length}</div>
    <div style="color:var(--muted)">${res.length ? `${pct(right / res.length)} accuracy` : 'No questions answered'}</div>
    <div class="row">
      <div class="stat"><div class="label">Answered</div><div class="value">${res.length}<small>/ ${ss.qs.length}</small></div></div>
      <div class="stat"><div class="label">Missed</div><div class="value">${missed.length}</div></div>
      <div class="stat"><div class="label">Avg time</div><div class="value">${fmtTime(avg)}</div></div>
    </div>
    <div class="actions">
      ${missed.length ? `<button class="btn primary" data-act="review-missed">${icon('retry', 15)} Retry ${missed.length} missed</button>` : ''}
      <button class="btn" data-act="restart">${icon('shuffle', 15)} Practice again</button>
      <button class="btn ghost" data-act="home">${icon('home', 15)} Dashboard</button>
    </div>
  </div></div>`;
  updateFooter();
  $('#navToggle').innerHTML = `Summary <span class="chev">${icon('chevUp', 16)}</span>`;
}

/* ---------- navigator ---------- */
function renderNav() {
  const pop = $('#navpop');
  if (!pop) return;
  if (!S.navOpen) { pop.innerHTML = ''; return; }
  const ss = store.session;
  pop.innerHTML = `<div class="navpop" id="navpopInner">
    <h4>${esc(ss.title)}</h4>
    <div class="legend"><span><i class="cur"></i>Current</span><span><i></i>Unanswered</span><span><i class="ok"></i>Correct</span><span><i class="bad"></i>Incorrect</span><span><i style="background:var(--warn);border:0;border-radius:50%"></i>Flagged</span></div>
    <div class="navgrid">${ss.qs.map((q, i) => {
      const r = ss.results[q.id];
      const c = [r?.ok === true ? 'ok' : r?.ok === false ? 'bad' : '', i === ss.i ? 'cur' : '', store.flags[q.id] ? 'flag' : ''].join(' ');
      return `<button class="${c}" data-go="${i}">${i + 1}</button>`;
    }).join('')}</div>
  </div>`;
}

/* ---------- flag / highlight ---------- */
function toggleFlag() {
  if (!S.cur) return;
  const id = S.cur.meta.id;
  if (store.flags[id]) delete store.flags[id];
  else store.flags[id] = Date.now();
  save();
  const b = $('#flagBtn');
  const on = !!store.flags[id];
  b.classList.toggle('on', on);
  b.querySelector('span').textContent = on ? 'Flagged' : 'Flag for review';
  renderNav();
}

function toggleHL() {
  S.hl = !S.hl;
  $('#tHl').classList.toggle('on', S.hl);
  $('#qwrap')?.classList.toggle('hl-mode', S.hl);
  toast(S.hl ? 'Highlighter on — select text in the passage or question. Click a highlight to remove it.' : 'Highlighter off');
}

document.addEventListener('mouseup', (e) => {
  if (!S.hl || S.view !== 'practice') return;
  const zone = e.target.closest('.hl-zone');
  if (!zone) return;
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const r = sel.getRangeAt(0);
  if (!zone.contains(r.commonAncestorContainer)) return;
  try {
    const m = document.createElement('mark');
    m.className = 'hl';
    m.appendChild(r.extractContents());
    r.insertNode(m);
  } catch {}
  sel.removeAllRanges();
});

/* ---------- Desmos ---------- */
let desmosP = null;
function loadDesmos() {
  return (desmosP ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = DESMOS_URL;
    s.onload = () => res(window.Desmos);
    s.onerror = () => { desmosP = null; s.remove(); rej(new Error('Could not load Desmos — check your connection.')); };
    document.head.appendChild(s);
  }));
}

function mountCalc() {
  if (!S.calcHost) {
    S.calcHost = document.createElement('div');
    S.calcHost.id = 'calc-host';
    S.calcHost.innerHTML = '<div class="calc-loading">Loading Desmos…</div>';
  }
  const slot = $('#calcSlot');
  if (slot && S.calcHost.parentNode !== slot) slot.appendChild(S.calcHost);
  if (!S.calcInit) {
    S.calcInit = loadDesmos().then((D) => {
      S.calcHost.innerHTML = '';
      S.calc = D.GraphingCalculator(S.calcHost, {
        keypad: true, expressions: true, settingsMenu: true, zoomButtons: true, expressionsTopbar: true,
        border: false, images: false, folders: false, notes: false, links: false, sliders: true,
        pointsOfInterest: true, trace: true, qwertyKeyboard: true, autosize: true,
      });
    }).catch((e) => {
      S.calcInit = null;
      S.calcHost.innerHTML = `<div class="calc-loading">${esc(e.message)}</div>`;
    });
  } else if (S.calc) requestAnimationFrame(() => S.calc.resize());
}

function toggleCalc(force) {
  if (!S.cur || S.cur.meta.sec !== 'math') { if (!force) return; }
  S.calcOpen = force ?? !S.calcOpen;
  $('#practice').classList.toggle('calc-open', S.calcOpen);
  $('#tCalc').classList.toggle('on', S.calcOpen);
  if (S.calcOpen) mountCalc();
}

function setupResizer() {
  const rz = $('#resizer');
  const pane = $('#calcPane');
  rz.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    rz.setPointerCapture(e.pointerId);
    rz.classList.add('drag');
    document.body.classList.add('dragging');
    const x0 = e.clientX, w0 = pane.offsetWidth;
    const move = (ev) => {
      const w = Math.max(300, Math.min(window.innerWidth * 0.75, w0 + ev.clientX - x0));
      pane.style.width = `${w}px`;
      S.calc?.resize();
    };
    const up = () => {
      rz.classList.remove('drag');
      document.body.classList.remove('dragging');
      rz.removeEventListener('pointermove', move);
      rz.removeEventListener('pointerup', up);
      store.settings.calcW = pane.offsetWidth;
      save();
    };
    rz.addEventListener('pointermove', move);
    rz.addEventListener('pointerup', up);
  });
}

function expandCalc() {
  const pane = $('#calcPane');
  const big = Math.round(window.innerWidth * 0.62);
  pane.style.width = `${pane.offsetWidth >= big - 4 ? store.settings.calcW : big}px`;
  $('[data-act="calc-expand"]').innerHTML = icon(pane.offsetWidth >= big - 4 ? 'shrink' : 'expand', 16);
  S.calc?.resize();
}

/* ---------- reference sheet ---------- */
const mm = (s) => `<math>${s}</math>`;
const REF = [
  { svg: '<circle cx="80" cy="46" r="36"/><line x1="80" y1="46" x2="116" y2="46"/><circle cx="80" cy="46" r="2" fill="currentColor"/><text x="95" y="41">r</text>',
    f: mm('<mi>A</mi><mo>=</mo><mi>π</mi><msup><mi>r</mi><mn>2</mn></msup>') + '<br/>' + mm('<mi>C</mi><mo>=</mo><mn>2</mn><mi>π</mi><mi>r</mi>'), t: 'Circle' },
  { svg: '<rect x="30" y="18" width="100" height="56"/><text x="77" y="88">ℓ</text><text x="136" y="50">w</text>',
    f: mm('<mi>A</mi><mo>=</mo><mi>ℓ</mi><mi>w</mi>'), t: 'Rectangle' },
  { svg: '<path d="M20 74 L140 74 L98 12 Z"/><path d="M98 12 V74" stroke-dasharray="4 3"/><path d="M98 66 h8 v8"/><text x="85" y="48">h</text><text x="76" y="89">b</text>',
    f: mm('<mi>A</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>b</mi><mi>h</mi>'), t: 'Triangle' },
  { svg: '<path d="M30 74 H130 V14 Z"/><path d="M120 74 V64 H130"/><text x="76" y="89">b</text><text x="136" y="48">a</text><text x="70" y="38">c</text>',
    f: mm('<msup><mi>c</mi><mn>2</mn></msup><mo>=</mo><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup>'), t: 'Pythagorean theorem' },
  { svg: '<path d="M30 74 H120 V22 Z"/><path d="M111 74 V65 H120"/><text x="64" y="40">2x</text><text x="125" y="52">x</text><text x="62" y="89">x√3</text><text x="40" y="70" style="font-size:10px">30°</text><text x="100" y="36" style="font-size:10px">60°</text>',
    f: '<span style="font-size:14px">Special right triangle</span>', t: '30°-60°-90°' },
  { svg: '<path d="M38 74 H112 V14 Z"/><path d="M103 74 V65 H112"/><text x="60" y="38">s√2</text><text x="117" y="48">s</text><text x="72" y="89">s</text><text x="54" y="70" style="font-size:10px">45°</text><text x="98" y="32" style="font-size:10px">45°</text>',
    f: '<span style="font-size:14px">Special right triangle</span>', t: '45°-45°-90°' },
  { svg: '<path d="M30 34 H106 V78 H30 Z M30 34 L54 14 H130 L106 34 M130 14 V58 L106 78"/><path d="M30 78 L54 58 H130 M54 58 V14" stroke-dasharray="3 3"/><text x="64" y="90">ℓ</text><text x="122" y="76">w</text><text x="18" y="60">h</text>',
    f: mm('<mi>V</mi><mo>=</mo><mi>ℓ</mi><mi>w</mi><mi>h</mi>'), t: 'Rectangular prism' },
  { svg: '<ellipse cx="80" cy="18" rx="36" ry="9"/><path d="M44 18 V72 M116 18 V72"/><path d="M44 72 A36 9 0 0 0 116 72"/><path d="M44 72 A36 9 0 0 1 116 72" stroke-dasharray="3 3"/><line x1="80" y1="18" x2="116" y2="18"/><text x="94" y="14">r</text><text x="122" y="48">h</text>',
    f: mm('<mi>V</mi><mo>=</mo><mi>π</mi><msup><mi>r</mi><mn>2</mn></msup><mi>h</mi>'), t: 'Cylinder' },
  { svg: '<circle cx="80" cy="46" r="36"/><ellipse cx="80" cy="46" rx="36" ry="9" stroke-dasharray="3 3"/><line x1="80" y1="46" x2="116" y2="46"/><text x="95" y="41">r</text>',
    f: mm('<mi>V</mi><mo>=</mo><mfrac><mn>4</mn><mn>3</mn></mfrac><mi>π</mi><msup><mi>r</mi><mn>3</mn></msup>'), t: 'Sphere' },
  { svg: '<path d="M80 10 L44 72 M80 10 L116 72"/><path d="M44 72 A36 9 0 0 0 116 72"/><path d="M44 72 A36 9 0 0 1 116 72" stroke-dasharray="3 3"/><path d="M80 10 V72 H116" stroke-dasharray="3 3"/><text x="84" y="46">h</text><text x="96" y="68">r</text>',
    f: mm('<mi>V</mi><mo>=</mo><mfrac><mn>1</mn><mn>3</mn></mfrac><mi>π</mi><msup><mi>r</mi><mn>2</mn></msup><mi>h</mi>'), t: 'Cone' },
  { svg: '<path d="M80 8 L36 66 L100 80 L130 58 Z M80 8 L100 80"/><path d="M36 66 L66 46 L130 58 M80 8 L66 46" stroke-dasharray="3 3"/><path d="M80 8 V62" stroke-dasharray="3 3"/><text x="84" y="40">h</text><text x="62" y="88">ℓ</text><text x="120" y="78">w</text>',
    f: mm('<mi>V</mi><mo>=</mo><mfrac><mn>1</mn><mn>3</mn></mfrac><mi>ℓ</mi><mi>w</mi><mi>h</mi>'), t: 'Rectangular pyramid' },
];
function openRef() {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.id = 'refModal';
  back.innerHTML = `<div class="modal" role="dialog" aria-label="Reference sheet">
    <div class="modal-head"><h3>Reference</h3><button class="icon-btn" data-act="close-modal" title="Close">${icon('x')}</button></div>
    <div class="modal-body">
      <div class="ref-grid">${REF.map((r) => `<div class="ref-item"><svg viewBox="0 0 160 92">${r.svg}</svg><div class="f">${r.f}</div><div class="t">${r.t}</div></div>`).join('')}</div>
      <div class="ref-notes">
        <p>The number of degrees of arc in a circle is 360.</p>
        <p>The number of radians of arc in a circle is ${mm('<mn>2</mn><mi>π</mi>')}.</p>
        <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
      </div>
    </div></div>`;
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  document.body.appendChild(back);
  typeset(back);
}

/* ---------- theme ---------- */
function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  store.settings.theme = t;
  save();
  $$('[data-act="theme"]').forEach((b) => (b.innerHTML = icon(themeIcon())));
}

/* ================= events ================= */
app.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act],[data-start],[data-exam],[data-choose],[data-strike],[data-go],[data-set]');
  if (S.navOpen && !e.target.closest('#navpop') && !e.target.closest('#navToggle')) { S.navOpen = false; updateFooter(); }
  if (!t) return;
  const d = t.dataset;
  if (d.choose) return choose(d.choose);
  if (d.strike) return strike(d.strike);
  if (d.go) { S.navOpen = false; return go(Number(d.go)); }
  if (d.start) return startSet(d.start);
  if (d.exam) {
    if (store.settings.exam === d.exam) return;
    store.settings.exam = d.exam;
    save();
    return loadBank(d.exam);
  }
  if (d.set) {
    const [k, v] = d.set.split(':');
    const st = store.settings;
    if (k === 'diff') {
      st.diff = st.diff.includes(v) ? st.diff.filter((x) => x !== v) : [...st.diff, v];
      if (!st.diff.length) st.diff = [v];
    } else st[k] = v;
    save();
    if (k === 'active' && S.raw) applyBank();
    return renderHome();
  }
  switch (d.act) {
    case 'theme': return toggleTheme();
    case 'reload': return loadBank(store.settings.exam);
    case 'continue': location.hash = '#/practice'; return;
    case 'home': location.hash = '#/'; return;
    case 'calc': return toggleCalc();
    case 'calc-expand': return expandCalc();
    case 'ref': return openRef();
    case 'hl': return toggleHL();
    case 'flag': return toggleFlag();
    case 'check': return check();
    case 'reveal': return reveal();
    case 'self-ok': return selfGrade(true);
    case 'self-bad': return selfGrade(false);
    case 'next': return next();
    case 'prev': return prev();
    case 'retry': S.qcache.delete(store.session.qs[store.session.i].id); return showQuestion(store.session.i);
    case 'nav': S.navOpen = !S.navOpen; return updateFooter();
    case 'timer':
      store.settings.timerHidden = !store.settings.timerHidden;
      save();
      $('#timer').classList.toggle('hidden', store.settings.timerHidden);
      t.textContent = store.settings.timerHidden ? 'Show' : 'Hide';
      return;
    case 'review-missed': {
      const ss = store.session;
      const qs = ss.qs.filter((q) => ss.results[q.id]?.ok === false);
      store.session = { ...ss, title: `${ss.title} · missed`, qs, i: 0, started: Date.now(), results: {} };
      save();
      return renderPractice();
    }
    case 'restart': {
      const ss = store.session;
      store.session = { ...ss, qs: shuffle([...ss.qs]), i: 0, started: Date.now(), results: {} };
      save();
      return renderPractice();
    }
  }
});

app.addEventListener('mousedown', (e) => {
  // Clicking a highlight while the highlighter is on removes it.
  const m = e.target.closest('mark.hl');
  if (!m || !S.hl) return;
  e.preventDefault();
  m.replaceWith(...m.childNodes);
});

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-act="close-modal"]')) $('#refModal')?.remove();
});

document.addEventListener('keydown', (e) => {
  if (S.view !== 'practice') return;
  if (e.key === 'Escape') {
    if ($('#refModal')) return $('#refModal').remove();
    if (S.navOpen) { S.navOpen = false; return updateFooter(); }
    return;
  }
  if ($('#refModal')) return;
  if (S.calcHost && S.calcHost.contains(e.target)) return; // typing in Desmos
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target.tagName;
  const k = e.key.toLowerCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    if (k === 'enter') { e.preventDefault(); S.ui.checked ? next() : check(); }
    return;
  }
  if ((k === 'enter' || k === ' ') && e.target.closest('button,summary')) return;
  if (!S.cur && k !== 'arrowleft' && k !== 'arrowright') return;
  if (['a', 'b', 'c', 'd'].includes(k) && S.cur?.q.type === 'mcq') { e.preventDefault(); choose(k.toUpperCase()); }
  else if (k === 'enter') { e.preventDefault(); S.ui.checked ? next() : check(); }
  else if (k === 'arrowright') next();
  else if (k === 'arrowleft') prev();
  else if (k === 'f') toggleFlag();
  else if (k === 'g' && S.cur?.meta.sec === 'math') toggleCalc();
});

window.addEventListener('resize', () => S.calc?.resize());

/* ================= boot ================= */
loadBank(store.settings.exam);
route();

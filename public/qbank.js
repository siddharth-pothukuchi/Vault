// College Board Educator Question Bank: fetch + normalize.
// Runs in the browser: College Board allows cross-origin requests, so no backend is needed.

const API = 'https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank';
const DISCLOSED = 'https://saic.collegeboard.org/disclosed';
const SECTIONS = { 1: 'INI,CAS,EOI,SEC', 2: 'H,P,Q,S' };
const LETTERS = 'ABCDEFGH';

export const EXAMS = { 99: 'SAT', 100: 'PSAT/NMSQT & PSAT 10', 102: 'PSAT 8/9' };
export const QVERSION = 4; // bump to start a fresh browser cache after normalization changes

async function postJSON(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`College Board API ${r.status}`);
  return r.json();
}

// ---------- question lists ----------
export async function fetchList(exam, section) {
  const raw = await postJSON(`${API}/digital/get-questions`, {
    asmtEventId: Number(exam), test: Number(section), domain: SECTIONS[section],
  });
  return raw.map((q) => ({
    id: q.questionId,
    ext: q.external_id || null,
    ibn: q.ibn || null,
    d: q.primary_class_cd,
    s: q.skill_cd,
    sd: (q.skill_desc || '').trim(),
    diff: q.difficulty,
    band: q.score_band_range_cd,
    upd: q.updateDate,
  }));
}

// ---------- single questions ----------
function htmlToText(html) {
  return html
    .replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, ' $1 ')
    .replace(/<math[^>]*\balttext="([^"]*)"[\s\S]*?<\/math>/gi, ' $1 ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&minus;|&#8722;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// Older "disclosed" items don't ship SPR keys, so pull them out of the rationale text.
function sprKeysFromRationale(html) {
  const text = htmlToText(html)
    .replace(/\bnegative\s+/gi, '-')
    .replace(/(\d)\s*over\s*(\d)/gi, '$1/$2');
  const m = text.match(/correct answers? (?:is|are)\s*(?:either\s*)?(.+?)(?:\.\s+[A-Z]|\.$|$)/i);
  if (!m) return [];
  return m[1]
    .split(/\s*(?:,\s*|\bor\b|\band\b)\s*/i)
    .map((s) => s.replace(/^either\s+/i, '').replace(/\s+/g, '').replace(/^(\.\d+|\d+\.?\d*|\d*\/\d+|-\S+)\.$/, '$1'))
    .filter((s) => /^-?(\d+(\.\d*)?|\.\d+)(\/\d+)?$/.test(s));
}

// "Choice B is correct" / "Choice B is the best answer" → ["B"]
function mcqKeyFromRationale(html) {
  const m = htmlToText(html).match(/Choice\s+([A-D])\s+is\s+(?:the\s+best\s+answer|correct)/i);
  return m ? [m[1].toUpperCase()] : [];
}

function normalizeExternal(j) {
  const choices = (j.answerOptions || []).map((o, i) => ({ letter: LETTERS[i], html: o.content || '', id: o.id }));
  let correct;
  if (j.type === 'mcq') {
    correct = choices.filter((c) => (j.keys || []).includes(c.id)).map((c) => c.letter);
    if (!correct.length) correct = (j.keys || []).filter((k) => /^[A-D]$/i.test(k)).map((k) => k.toUpperCase());
    if (!correct.length) correct = mcqKeyFromRationale(j.rationale || '');
  } else {
    correct = (j.keys || []).flatMap((k) => String(k).split(/\s*,\s+/)).map((k) => k.trim()).filter(Boolean);
  }
  return {
    type: j.type === 'mcq' ? 'mcq' : 'spr',
    stimulus: j.stimulus || '',
    stem: j.stem || '',
    choices: choices.map(({ letter, html }) => ({ letter, html })),
    correct,
    rationale: j.rationale || '',
  };
}

function normalizeDisclosed(j) {
  const a = j.answer || {};
  // Older items keep the figure / table that goes "above" the question in a separate body field.
  const stem = (j.body || '') + (j.prompt || '');
  if (a.style === 'Multiple Choice') {
    const choices = Object.keys(a.choices || {}).sort().map((k, i) => ({ letter: LETTERS[i], html: a.choices[k].body || '' }));
    return {
      type: 'mcq', stimulus: '', stem, choices,
      correct: a.correct_choice ? [String(a.correct_choice).toUpperCase()] : mcqKeyFromRationale(a.rationale || ''),
      rationale: a.rationale || '',
    };
  }
  return { type: 'spr', stimulus: '', stem, choices: [], correct: sprKeysFromRationale(a.rationale || ''), rationale: a.rationale || '' };
}

export async function fetchQuestion(id, ext, ibn) {
  let q;
  if (ext) {
    q = normalizeExternal(await postJSON(`${API}/digital/get-question`, { external_id: ext }));
  } else if (ibn) {
    const r = await fetch(`${DISCLOSED}/${encodeURIComponent(ibn)}.json`);
    if (!r.ok) throw new Error(`College Board disclosed item ${r.status}`);
    const arr = await r.json();
    q = normalizeDisclosed(Array.isArray(arr) ? arr[0] : arr);
  } else {
    throw new Error('Question has no external id or ibn');
  }
  q.id = id;
  q.v = QVERSION;
  return q;
}

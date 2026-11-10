'use strict';
// Shared state and helpers for every screen

const S = { settings: {}, me: null, page: 'report', cache: {}, nowOffset: 0, menuOpen: false, unread: 0 };
const ACT = {};        // click actions:  data-act="name"
const HANDLERS = {};   // messages from the game
const PAGES = {};      // page renderers: PAGES.name = { title, sub, render(el) }
const INPUT = {}, CHANGE = {};

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const nowSec = () => Math.floor(Date.now() / 1000) + S.nowOffset;
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');

function resource() { return typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'blackbox_reports'; }
async function post(name, data) {
  try {
    const r = await fetch(`https://${resource()}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });
    return await r.json();
  } catch (e) { return { ok: false, payload: 'Could not reach the game.' }; }
}
async function req(action, data) { return post('req', { action, data: data || {} }); }

function hexRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 122, 26];
}
const rgbStr = hex => hexRgb(hex).join(',');
const safeUrl = u => /^https:\/\/[^\s"'<>()]+$/i.test(u || '') ? u : '';

// ------------------------------------------------------------------ icons
const ICONS = {
  record: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  inbox: '<path d="M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5"/>',
  users: '<path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 005.4 5.4L21 17l-4 4-5.3-.9a4 4 0 00-5.4-5.4L3 9l4-4 5.3.9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  pause: '<path d="M8 4v16M16 4v16" stroke-width="3.2"/>',
  step: '<path d="M6 5v14M10 5l9 7-9 7z"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  siren: '<path d="M7 18v-6a5 5 0 0110 0v6M5 18h14v3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4"/>',
  scale: '<path d="M12 3v18M6 21h12M5 7h14M5 7l-3 7a3.5 3.5 0 006 0L5 7zM19 7l-3 7a3.5 3.5 0 006 0l-3-7z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  tag: '<path d="M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c7 0 11 7 11 7a18 18 0 01-3.2 4M6.6 6.6A18 18 0 001 12s4 7 11 7a10 10 0 004.4-1"/>',
  door: '<path d="M5 21V4a1 1 0 011-1h12a1 1 0 011 1v17M3 21h18M15 12h.01"/>',
  swap: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
  undo: '<path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3"/>',
  crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
};
function ico(name, size) {
  const s = size || 18;
  return `<span class="ico"><svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg></span>`;
}

// ------------------------------------------------------------------ small components
function pill(text, cls) { return `<span class="pill ${cls || ''}">${esc(text)}</span>`; }
function toggle(on, act, arg) { return `<button class="toggle ${on ? 'on' : ''}" data-act="${act}" data-arg="${esc(arg || '')}" aria-pressed="${!!on}"></button>`; }
function bar(value, max, cls) { const p = max > 0 ? clamp(value / max * 100, 0, 100) : 0; return `<div class="bar ${cls || ''}"><i style="width:${p}%"></i></div>`; }
function empty(title, text) { return `<div class="empty"><b>${esc(title)}</b>${esc(text || '')}</div>`; }
const catOf = id => (S.settings.categories || []).find(c => c.id === id) || { id, label: id, color: '#94a3b8' };
const verdictOf = id => (S.settings.verdicts || []).find(v => v.id === id);
function catChip(id) { const c = catOf(id); return `<span class="cat" style="--c:${rgbStr(c.color)}">${esc(c.label)}</span>`; }
function bandBadge(b) { return `<span class="band b${b}">P${b}</span>`; }
function fmtLong(sec) { sec = Math.max(0, Math.floor(sec)); if (sec >= 86400) return `${Math.floor(sec / 86400)}d ${Math.floor(sec % 86400 / 3600)}h`; if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor(sec % 3600 / 60)}m`; if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`; return `${sec}s`; }
function fmtMin(sec) { return sec == null ? 'not available' : (sec < 90 ? 'about a minute' : `about ${Math.round(sec / 60)} min`); }
function ago(ts) { const d = nowSec() - ts; if (d < 45) return 'just now'; if (d < 3600) return Math.max(1, Math.floor(d / 60)) + 'm ago'; if (d < 86400) return Math.floor(d / 3600) + 'h ago'; return Math.floor(d / 86400) + 'd ago'; }
function clock(ts) { const d = new Date(ts * 1000); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function stars(n) { return Array.from({ length: 5 }, (_, i) => `<span class="star ${i < n ? 'on' : ''}">${ico('star', 14)}</span>`).join(''); }

// ------------------------------------------------------------------ toast / modal / lightbox
function toast(message, kind) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || 'info');
  el.textContent = message;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 3800);
  setTimeout(() => el.remove(), 4300);
}
async function run(action, data, okMsg) {
  const r = await req(action, data);
  if (!r.ok) { toast(typeof r.payload === 'string' ? r.payload : 'That did not work.', 'error'); return r; }
  if (okMsg) toast(okMsg, 'success');
  return r;
}

let modalOnClose = null;
function modal(html, opts) {
  opts = opts || {};
  const m = $('#modal');
  m.innerHTML = `<div class="modal-card ${opts.wide ? 'wide' : ''}">${html}</div>`;
  m.classList.remove('hidden');
  modalOnClose = opts.onClose || null;
  const first = $('input,textarea,select', m);
  if (first && !opts.noFocus) setTimeout(() => first.focus(), 30);
}
function closeModal() {
  const m = $('#modal');
  if (m.classList.contains('hidden')) return false;
  m.classList.add('hidden'); m.innerHTML = '';
  if (modalOnClose) { const f = modalOnClose; modalOnClose = null; f(); }
  return true;
}
function confirmBox(title, text, yesLabel, onYes, danger) {
  modal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="confirm-yes">${esc(yesLabel)}</button></div>`, { noFocus: true });
  $('#confirm-yes').onclick = () => { closeModal(); onYes(); };
}
ACT.closeModal = () => closeModal();
function lightbox(url) {
  const u = safeUrl(url); if (!u) return;
  const l = $('#lightbox'); l.innerHTML = `<img src="${esc(u)}" alt="">`; l.classList.remove('hidden');
  l.onclick = () => { l.classList.add('hidden'); l.innerHTML = ''; };
}

// ------------------------------------------------------------------ theme
function applyTheme() {
  const root = document.documentElement;
  let mode = S.settings.defaultMode || 'dark';
  try { mode = localStorage.getItem('bb_mode') || mode; } catch (e) { /* storage can be unavailable */ }
  const color = S.settings.themeColor || '#ff7a1a';
  root.dataset.mode = mode === 'light' ? 'light' : 'dark';
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-rgb', rgbStr(color));
}
ACT.toggleMode = () => {
  const next = document.documentElement.dataset.mode === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('bb_mode', next); } catch (e) { /* ignore */ }
  applyTheme();
};

// ------------------------------------------------------------------ events
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.stopPropagation(); fn(el, e); }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (el && INPUT[el.dataset.input]) INPUT[el.dataset.input](el, e); });
window.addEventListener('message', e => {
  const d = e.data;
  if (!d || !d.a) return;
  const fn = HANDLERS[d.a];
  if (fn) { try { fn(d); } catch (err) { console.error('[blackbox]', d.a, err); } }
});

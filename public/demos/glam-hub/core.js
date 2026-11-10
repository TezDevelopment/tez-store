'use strict';
// Shared state and helpers for every screen

const S = {
  settings: {}, me: null, ui: {}, page: 'home', tab: {}, cache: {}, nowOffset: 0, menuOpen: false, unread: 0,
};
const ACT = {};        // click actions:  data-act="name"
const HANDLERS = {};   // messages from the game
const PAGES = {};      // page renderers: PAGES.name = { title, sub, render(el), after() }

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = s => (S.ui && S.ui[s]) || s;
const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const nowSec = () => Math.floor(Date.now() / 1000) + S.nowOffset;

function resource() { return typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'glam_hub'; }
async function post(name, data) {
  try {
    const r = await fetch(`https://${resource()}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });
    return await r.json();
  } catch (e) { return { ok: false, payload: 'Could not reach the game.' }; }
}
// ask the server, get { ok, payload }
async function req(action, data) { return post('req', { action, data: data || {} }); }

function hexRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [236, 72, 153];
}
const rgbStr = hex => hexRgb(hex).join(',');
const initials = s => (String(s || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase();
function safeUrl(u) { return /^https:\/\/[^\s"'<>()]+$/i.test(u || '') ? u : ''; }

// ------------------------------------------------------------------ icons
const ICONS = {
  logo: '<path d="M4 6h16M12 6v13" stroke-width="3"/>',
  users: '<path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  swords: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  chat: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2.5 0 00-2.5-1.5c-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.7 2.7 0 01-2.7-1.6M12 6v1.5M12 16.5V18"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
  badge: '<path d="M12 2l2.4 2 3.1-.2.9 3 2.6 1.7-1 2.9 1 2.9-2.6 1.7-.9 3-3.1-.2L12 22l-2.4-2-3.1.2-.9-3-2.6-1.7 1-2.9-1-2.9 2.6-1.7.9-3 3.1.2L12 2z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 005.4 5.4L21 17l-4 4-5.3-.9a4 4 0 00-5.4-5.4L3 9l4-4 5.3.9z"/>',
};
function ico(name, size) {
  const s = size || 18;
  return `<span class="ico"><svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg></span>`;
}

// ------------------------------------------------------------------ small components
function avatar(url, name, color, size, status) {
  const c = rgbStr(color || '#ec4899');
  const img = safeUrl(url);
  return `<div class="avatar ${size || ''}" style="border-color:rgba(${c},.7);color:rgb(${c});${img ? `background-image:url('${esc(img)}');color:transparent;` : `background:rgba(${c},.18);`}">${img ? '' : esc(initials(name))}${status ? `<i class="st ${esc(status)}"></i>` : ''}</div>`;
}
function pill(text, cls) { return `<span class="pill ${cls || ''}">${esc(text)}</span>`; }
function toggle(on, act, arg) { return `<button class="toggle ${on ? 'on' : ''}" data-act="${act}" data-arg="${esc(arg || '')}" aria-pressed="${!!on}"></button>`; }
function bar(value, max, cls) { const p = max > 0 ? clamp(value / max * 100, 0, 100) : 0; return `<div class="bar ${cls || ''}"><i style="width:${p}%"></i></div>`; }
function empty(title, text) { return `<div class="empty"><b>${esc(title)}</b>${esc(text || '')}</div>`; }
function fmtTime(sec) { sec = Math.max(0, Math.floor(sec)); const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }
function fmtLong(sec) { sec = Math.max(0, Math.floor(sec)); if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor(sec % 3600 / 60)}m`; if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`; return `${sec}s`; }
function ago(ts) { const d = nowSec() - ts; if (d < 60) return 'just now'; if (d < 3600) return Math.floor(d / 60) + 'm ago'; if (d < 86400) return Math.floor(d / 3600) + 'h ago'; return Math.floor(d / 86400) + 'd ago'; }

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
// run a request, show the error if it fails
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
ACT.zoom = el => lightbox(el.dataset.arg);

// ------------------------------------------------------------------ theme
function myPref(k, fallback) {
  const p = S.me && S.me.prefs;
  return p && p[k] !== undefined && p[k] !== null && p[k] !== '' ? p[k] : fallback;
}
function applyTheme() {
  const root = document.documentElement;
  const mode = myPref('mode', S.settings.defaultMode || 'dark');
  const color = myPref('menuColor', S.settings.themeColor || '#ec4899');
  root.dataset.mode = mode === 'light' ? 'light' : 'dark';
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-rgb', rgbStr(color));
}
// save a player setting: updates local state, the game and the server
let prefTimer = null, prefQueue = {};
function savePref(k, v) {
  if (!S.me) return;
  S.me.prefs = S.me.prefs || {};
  S.me.prefs[k] = v;
  prefQueue[k] = v;
  post('prefs', { [k]: v });
  clearTimeout(prefTimer);
  prefTimer = setTimeout(() => { const q = prefQueue; prefQueue = {}; req('settingsSave', q); }, 400);
  applyTheme();
}

// ------------------------------------------------------------------ events
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.stopPropagation(); fn(el, e); }
});
window.addEventListener('message', e => {
  const d = e.data;
  if (!d || !d.a) return;
  const fn = HANDLERS[d.a];
  if (fn) { try { fn(d); } catch (err) { console.error('[glam]', d.a, err); } }
});

// ------------------------------------------------------------------ Glam Hub additions
Object.assign(ICONS, {
  home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 002 1.6h8.6a2 2 0 002-1.5L22 7H6"/>',
  hammer: '<path d="M14 7l3-3 4 4-3 3M12 9l-9 9 3 3 9-9M10 7l7 7"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-4-2-7-5-9 0 4-3 6-3 11 0 5 3 9 7 9z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="4"/>',
  heart: '<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/>',
  message: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
  bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v8a1 1 0 001 1h12a1 1 0 001-1v-8M7.5 8a2.5 2.5 0 010-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 010 5"/>',
  tag: '<path d="M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8zM9 8a3 3 0 016 0"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/>',
  mapPin: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  userplus: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6"/>',
  lockc: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  download: '<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>',
  grip: '<path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"/>',
});
const cash = n => {
  const c = (S.settings && S.settings.currency) || '$';
  const s = Math.round(Number(n) || 0).toLocaleString('en-US');
  return S.settings && S.settings.currencyAfter ? s + c : c + s;
};
const itemIcon = name => `<img class="item-icon" src="items/${esc(name)}.png" alt="" onerror="this.style.visibility='hidden'">`;

'use strict';
// The window: rail, page router, header and the messages from the game

const RAIL = [
  { id: 'report', icon: 'record', label: 'Report a problem', show: () => true },
  { id: 'mine', icon: 'inbox', label: 'My reports', show: () => true },
  { id: 'desk', icon: 'list', label: 'Staff desk', show: () => !!(S.me && S.me.isStaff) },
  { id: 'players', icon: 'users', label: 'Players', show: () => !!(S.me && S.me.isStaff) },
  { id: 'insight', icon: 'chart', label: 'Insights', show: () => !!(S.me && S.me.isStaff) },
  { id: 'admin', icon: 'wrench', label: 'Admin panel', show: () => !!(S.me && S.me.isAdmin) },
];

HANDLERS.init = d => { S.settings = d.settings; S.me = d.me; if (d.now) S.nowOffset = d.now - Math.floor(Date.now() / 1000); applyTheme(); };
HANDLERS.settings = d => { S.settings = d.settings; applyTheme(); if (S.menuOpen) { renderRail(); renderHeader(); } };
HANDLERS.duty = d => { if (S.me) S.me.duty = d.on; if (S.menuOpen) renderHeader(); };
HANDLERS.open = d => {
  if (d.settings) S.settings = d.settings;
  if (d.me) S.me = d.me;
  applyTheme();
  openMenu(d.page, d.extra);
};
HANDLERS.page = d => goPage(d.page, d.extra);
HANDLERS.close = () => hideMenuSilently();

let pageExtra = null;
function openMenu(page, extra) {
  S.menuOpen = true;
  $('#app').classList.remove('hidden');
  $('#app').classList.toggle('solo', page === 'witness');
  goPage(page, extra);
}
function goPage(page, extra) {
  pageExtra = extra || null;
  S.page = pageAllowed(page) ? page : 'report';
  renderRail();
  refreshPage();
}
function takeExtra() { const e = pageExtra; pageExtra = null; return e; }
function hideMenuSilently() {
  if (typeof AD !== 'undefined') { if (AD.data) req('admin.close'); AD.data = null; AD.dirty = {}; AD.clear = {}; }
  if (S.page === 'desk') req('deskState', { open: false });
  if (typeof Replay !== 'undefined') Replay.stop();
  S.menuOpen = false;
  $('#app').classList.add('hidden');
  closeModal();
}
function closeMenu() { hideMenuSilently(); post('close', {}); }
$('#btn-close').addEventListener('click', () => closeMenu());
ACT.closeMenu = () => closeMenu();

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.menuOpen) { if (!closeModal()) closeMenu(); }
});

function pageAllowed(id) {
  if (id === 'witness') return true;
  const r = RAIL.find(x => x.id === id);
  return !!(r && r.show() && PAGES[id]);
}

function renderRail() {
  const bn = $('#brand-name'); if (bn) bn.textContent = S.settings.brand || 'Blackbox';
  const SHORT = { report: 'Report', mine: 'My reports', desk: 'Desk', players: 'Players', insight: 'Insights', admin: 'Admin' };
  $('#rail').innerHTML = RAIL.filter(r => r.show()).map(r =>
    `<button class="nav ${S.page === r.id ? 'active' : ''}" data-act="goto" data-arg="${r.id}" title="${esc(r.label)}">${ico(r.icon, 16)}<span>${SHORT[r.id] || r.label}</span>${r.id === 'mine' && S.unread ? '<i class="dot"></i>' : ''}${r.id === 'desk' && S.deskCount ? `<i class="count">${S.deskCount}</i>` : ''}</button>`).join('')
    + `<button class="nav mode" data-act="toggleMode" title="Light or dark">${ico('eye', 16)}<span>Mode</span></button>`;
}
ACT.goto = el => { if (typeof Replay !== 'undefined') Replay.stop(); goPage(el.dataset.arg); };

function renderHeader() {
  const p = PAGES[S.page]; if (!p) return;
  $('#page-title').textContent = typeof p.title === 'function' ? p.title() : p.title;
  $('#page-sub').textContent = typeof p.sub === 'function' ? p.sub() : (p.sub || S.settings.brand || '');
  const chips = [];
  if (S.me && S.me.isStaff) chips.push(`<button class="chip duty ${S.me.duty ? 'on' : ''}" data-act="toggleDuty"><i></i>${S.me.duty ? 'On duty' : 'Off duty'}</button>`);
  $('#head-chips').innerHTML = chips.join('');
}
ACT.toggleDuty = async () => {
  const r = await run('duty', { on: !S.me.duty });
  if (r.ok) { S.me.duty = !S.me.duty; renderHeader(); }
};

async function refreshPage() {
  const p = PAGES[S.page];
  const el = $('#page');
  if (!p) return;
  renderHeader();
  el.scrollTop = 0;
  await p.render(el);
}

// notices from the server: someone answered, the case moved, the case closed
HANDLERS.notice = d => {
  toast(d.n.text, 'info');
  if (d.n.case) S.unread = (S.unread || 0) + 1;
  if (S.menuOpen) { renderRail(); if (S.page === 'mine' && typeof mineReload === 'function') mineReload(); }
};
HANDLERS.mineEvent = d => { if (S.menuOpen && S.page === 'mine' && typeof mineReload === 'function') mineReload(d.id); };
HANDLERS.chat = d => { if (typeof chatIncoming === 'function') chatIncoming(d.m); };
HANDLERS.deskEvent = d => { if (typeof deskIncoming === 'function') deskIncoming(d); };

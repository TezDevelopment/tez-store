'use strict';
// The hub window: rail, page router, header and the welcome tour

const RAIL = [
  { id: 'home', icon: 'home', label: 'Home', show: () => true },
  { id: 'jobs', icon: 'briefcase', label: 'Jobs', show: () => true },
  { id: 'shop', icon: 'cart', label: 'Beauty Shop', show: () => true },
  { id: 'craft', icon: 'sparkles', label: 'Crafting', show: () => true },
  { id: 'career', icon: 'trend', label: 'Career', show: () => S.settings.xpEnabled !== false },
  { id: 'tasks', icon: 'check', label: 'Daily tasks', show: () => S.settings.tasksEnabled !== false },
  { id: 'boards', icon: 'trophy', label: 'Leaderboards', show: () => true },
  { id: 'chat', icon: 'chat', label: 'Global Chat', show: () => S.settings.chatEnabled !== false },
  { id: 'friends', icon: 'users', label: 'Friends & Discover', show: () => S.settings.friendsEnabled !== false },
  { id: 'messages', icon: 'message', label: 'Messages', show: () => S.settings.friendsEnabled !== false },
  { id: 'gallery', icon: 'camera', label: 'Gallery', show: () => S.settings.galleryEnabled !== false },
  { id: 'profile', icon: 'user', label: 'My profile', show: () => true },
  { id: 'settings', icon: 'gear', label: 'Settings', show: () => true },
  { id: 'admin', icon: 'wrench', label: 'Admin panel', show: () => !!(S.me && S.me.isAdmin) },
];

HANDLERS.open = d => {
  if (d.init) { S.settings = d.init.settings; S.me = d.init.me; S.ui = d.init.ui || S.ui; S.unread = d.init.me.unread || 0; applyTheme(); renderBell(); }
  openMenu(d.page);
};
HANDLERS.close = () => { hideMenuSilently(); };

function openMenu(page) {
  S.menuOpen = true;
  $('#app').classList.remove('hidden');
  S.page = page && pageAllowed(page) ? page : 'home';
  renderRail();
  refreshPage();
  if (S.me && !S.me.prefs.tourDone && S.settings.tourEnabled !== false && !S.tourShown) { S.tourShown = true; startTour(); }
}
function hideMenuSilently() {
  if (typeof AD !== 'undefined') { AD.data = null; AD.dirty = {}; AD.clear = {}; }
  S.menuOpen = false;
  $('#app').classList.add('hidden');
  $('#notif-panel').classList.add('hidden');
  closeModal();
}
function closeMenu() { hideMenuSilently(); post('close', {}); }
ACT.closeMenu = () => closeMenu();
$('#btn-close').addEventListener('click', () => closeMenu());

function pageAllowed(id) { const r = RAIL.find(x => x.id === id); return !!(r && r.show() && PAGES[id]); }

function renderRail() {
  if (!pageAllowed(S.page)) S.page = 'home';
  $('#rail').innerHTML = `<div class="logo">${ico('sparkles', 22)}</div>` + RAIL.filter(r => r.show()).map(r =>
    `<button class="nav ${S.page === r.id ? 'active' : ''}" data-act="goto" data-arg="${r.id}" title="${esc(r.label)}">${ico(r.icon, 20)}${r.id === 'messages' && S.dmUnread ? '<i class="dot"></i>' : ''}</button>`).join('');
}
ACT.goto = el => { S.page = el.dataset.arg; $('#notif-panel').classList.add('hidden'); renderRail(); refreshPage(); };

function renderHeader() {
  const p = PAGES[S.page]; if (!p) return;
  $('#page-title').textContent = typeof p.title === 'function' ? p.title() : p.title;
  $('#page-sub').textContent = typeof p.sub === 'function' ? p.sub() : (p.sub || S.settings.hubName || '');
  const chips = [];
  if (S.me && S.settings.xpEnabled !== false && S.cache.level) chips.push(`<span class="chip accent">${ico('star', 14)} Level ${S.cache.level}</span>`);
  $('#head-chips').innerHTML = chips.join('');
  renderBell();
}

let renderToken = 0;
async function refreshPage() {
  const page = PAGES[S.page]; if (!page) return;
  const token = ++renderToken;
  renderHeader();
  const el = $('#page');
  const keep = el.scrollTop;
  try { await page.render(el, token); } catch (e) { console.error('[glam] page', S.page, e); el.innerHTML = empty('Something went wrong', 'Close the hub and open it again.'); }
  if (token === renderToken) el.scrollTop = keep;
}

// a message arrived while the hub is open
function onLiveMessage(m) {
  if (S.page === 'messages' && typeof liveMessage === 'function') { liveMessage(m); return; }
  S.dmUnread = true; renderRail();
  toast(`${m.name}: ${m.image && !m.text ? 'sent a picture' : m.text}`, 'info');
}

// ------------------------------------------------------------------ welcome tour
const TOUR = [
  { icon: 'sparkles', title: 'Welcome to the hub', text: 'Run your own beauty business. Take a salon job, craft products, and sell them to customers around the city.' },
  { icon: 'cart', title: 'Shop, craft, sell', text: 'Buy ingredients in the Beauty Shop, place your beauty table, craft products, then type the sell command to find customers.' },
  { icon: 'trend', title: 'Level up', text: 'Every craft and sale earns XP. Higher career levels raise the price you get for everything. Finish daily tasks and keep your streak going.' },
  { icon: 'trophy', title: 'Climb the boards', text: 'Top sellers, crafters, earners and streaks are paid cash prizes every day, week and month.' },
  { icon: 'users', title: 'Meet people', text: 'Chat with everyone, add friends, start group chats and share photos in the gallery.' },
  { icon: 'gear', title: 'Pick your look', text: 'Choose light or dark mode and your own colour. You can change it any time in Settings.', theme: true },
];
let tourStep = 0;
function startTour() { tourStep = 0; renderTour(); $('#tour').classList.remove('hidden'); }
function renderTour() {
  const s = TOUR[tourStep], last = tourStep === TOUR.length - 1;
  $('#tour').innerHTML = `<div class="tour-card"><div style="color:var(--accent)">${ico(s.icon, 44)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
    ${s.theme ? `<div class="row-flex" style="justify-content:center;margin-bottom:14px"><button class="btn ${myPref('mode', 'dark') === 'dark' ? 'primary' : ''}" data-act="tourMode" data-arg="dark">Dark</button><button class="btn ${myPref('mode', 'dark') === 'light' ? 'primary' : ''}" data-act="tourMode" data-arg="light">Light</button></div>` : ''}
    <div class="dots">${TOUR.map((_, i) => `<i class="${i === tourStep ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row-flex" style="justify-content:center"><button class="btn ghost" data-act="tourSkip">Skip</button><button class="btn primary" data-act="tourNext">${last ? 'Get started' : 'Next'}</button></div></div>`;
}
ACT.tourMode = el => { savePref('mode', el.dataset.arg); renderTour(); };
ACT.tourNext = () => { if (tourStep >= TOUR.length - 1) ACT.tourSkip(); else { tourStep++; renderTour(); } };
ACT.tourSkip = () => { $('#tour').classList.add('hidden'); savePref('tourDone', true); };

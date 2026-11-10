'use strict';
// Always-on pieces: selling display, customer prompt, thief chase, progress bar, message pop-ups, level-up banner

HANDLERS.init = d => {
  S.settings = d.settings || {}; S.me = d.me; S.ui = d.ui || {};
  S.unread = (d.me && d.me.unread) || 0;
  applyTheme(); renderBell();
};
HANDLERS.settings = d => { S.settings = d.settings || {}; applyTheme(); if (S.menuOpen) { renderRail(); refreshPage(); } };
HANDLERS.toast = d => toast(d.message, d.kind);
HANDLERS.prefs = d => { if (S.me) S.me.prefs = d.prefs; applyTheme(); };

// ---------------------------------------------------------------- notifications bell
function renderBell() {
  const b = $('#btn-notif'); if (!b) return;
  b.innerHTML = `${ico('bell', 16)}${S.unread > 0 ? `<i class="dot">${S.unread > 9 ? '9+' : S.unread}</i>` : ''}`;
}
HANDLERS.notif = d => {
  S.unread++; renderBell();
  if (S.cache.notifs) S.cache.notifs.unshift(d.n);
  if (!S.menuOpen) toast(d.n.text, 'info');
  if (!$('#notif-panel').classList.contains('hidden')) renderNotifPanel();
};
async function toggleNotifs() {
  const p = $('#notif-panel');
  if (!p.classList.contains('hidden')) { p.classList.add('hidden'); return; }
  const r = await req('notifs');
  S.cache.notifs = r.ok ? r.payload : [];
  renderNotifPanel(); p.classList.remove('hidden');
  if (S.unread > 0) { S.unread = 0; renderBell(); req('notifsSeen'); }
}
const NOTIF_ICON = { like: 'heart', comment: 'message', friend: 'userplus', group: 'users', prize: 'trophy', level: 'star', task: 'check', streak: 'flame' };
function renderNotifPanel() {
  const p = $('#notif-panel'), list = S.cache.notifs || [];
  p.innerHTML = `<div class="np-head"><b>Notifications</b></div>` + (list.length ? list.map(n =>
    `<div class="np-row ${n.seen ? '' : 'new'}" ${n.kind === 'friend' && n.data && n.data.pub ? `data-act="profileOpen" data-arg="${esc(n.data.pub)}"` : ''}><span class="np-ico">${ico(NOTIF_ICON[n.kind] || 'bell', 16)}</span><div class="grow"><div>${esc(n.text)}</div><small class="muted">${ago(n.created)}</small></div></div>`).join('') : '<div class="empty">Nothing yet.</div>');
}
$('#btn-notif').addEventListener('click', e => { e.stopPropagation(); toggleNotifs(); });
document.addEventListener('click', e => { if (!e.target.closest('#notif-panel') && !e.target.closest('#btn-notif')) $('#notif-panel').classList.add('hidden'); });

// ---------------------------------------------------------------- message pop-ups
let popupTimer = null;
HANDLERS.popup = d => {
  const m = d.m;
  if (S.menuOpen) { if (typeof onLiveMessage === 'function') onLiveMessage(m); return; }
  if (S.me && S.me.prefs && S.me.prefs.dnd) return;
  const box = $('#popup');
  box.className = 'popup pos' + ((S.me && S.me.prefs && S.me.prefs.popupPos) || 3);
  box.innerHTML = `${avatar(m.picture, m.name, S.settings.themeColor, '')}<div class="grow"><b>${esc(m.name)}${m.group ? ` <small class="muted">in ${esc(m.group)}</small>` : ''}</b><div class="pt">${m.image && !m.text ? 'Sent a picture' : esc(m.text)}</div></div>`;
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => box.classList.add('hidden'), (S.settings.popupTime || 6) * 1000);
};

// ---------------------------------------------------------------- level up
HANDLERS.level = d => {
  const b = $('#levelup');
  b.innerHTML = `<div class="lu-star">${ico('star', 34)}</div><div><small>CAREER LEVEL UP</small><h2>Level ${d.level}: ${esc(d.name)}</h2></div>`;
  b.classList.remove('hidden');
  setTimeout(() => b.classList.add('hidden'), 4500);
};

// ---------------------------------------------------------------- selling display, customer, chase, progress
HANDLERS.sellDisplay = d => {
  const b = $('#selldisplay');
  if (!d.on) { b.classList.add('hidden'); return; }
  b.classList.remove('hidden');
  b.innerHTML = `<div class="sd-title">${ico('sparkles', 14)} ${d.paused ? 'Selling paused' : 'Selling'}</div>
    <div class="sd-row"><span>Sold</span><b>${d.sold}</b></div><div class="sd-row"><span>Earned</span><b>${cash(d.earned)}</b></div>
    <div class="sd-keys"><span class="key">G</span> ${d.paused ? 'resume' : 'pause'} <span class="key">X</span> stop</div>`;
};
let customerTimer = null;
HANDLERS.customer = d => {
  const b = $('#customer');
  clearInterval(customerTimer);
  if (!d.on) { b.classList.add('hidden'); return; }
  const end = Date.now() + d.expire * 1000;
  b.innerHTML = `<div class="cu-ask">A customer is interested</div><div class="cu-row">${itemIcon(d.product || '')}<div><b>${esc(d.label)}</b><div class="cu-price">${cash(d.price)}${d.zone ? ` <small class="boost">+${Math.round(d.zone)}% zone</small>` : ''}</div></div></div>
    <div class="cu-keys"><span class="key">E</span> sell <span class="key">X</span> send away</div><div class="timer"><i id="cu-t" style="width:100%"></i></div>`;
  b.classList.remove('hidden');
  customerTimer = setInterval(() => { const t = $('#cu-t'); if (t) t.style.width = clamp((end - Date.now()) / (d.expire * 10), 0, 100) + '%'; }, 100);
};
HANDLERS.chase = d => {
  const b = $('#chase');
  if (!d.on) { b.classList.add('hidden'); return; }
  b.classList.remove('hidden');
  b.innerHTML = `<div class="ch-t">${ico('flame', 16)} Catch the thief!</div><div class="ch-row"><b>${d.left}s</b><span>${d.dist} m away</span></div>`;
};
let progressTimer = null;
HANDLERS.progress = d => {
  const b = $('#progress');
  clearTimeout(progressTimer);
  if (!d.on) { b.classList.add('hidden'); return; }
  b.innerHTML = `<div class="pg-label">${esc(d.label || 'Crafting')}</div><div class="timer big"><i id="pg-i" style="width:0%;transition:width ${d.time}s linear"></i></div><div class="pg-hint"><span class="key">X</span> cancel</div>`;
  b.classList.remove('hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => { const i = $('#pg-i'); if (i) i.style.width = '100%'; }));
};
HANDLERS.craftDone = () => { if (S.menuOpen && S.page === 'craft') refreshPage(); };

// ---------------------------------------------------------------- admin: another admin saved
HANDLERS.adminSaved = d => {
  toast(`${d.by} saved changes. Your unsaved edits are kept.`, 'warn');
  if (typeof onAdminExternalSave === 'function') onAdminExternalSave(d);
};
// admin "Pick": the window hides while the admin walks to the spot
HANDLERS.pickState = d => {
  $('#app').style.visibility = d.hidden ? 'hidden' : '';
  if (!d.hidden && typeof onPicked === 'function') onPicked(d.result);
};

// ---------------------------------------------------------------- Escape
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#lightbox').classList.contains('hidden')) { $('#lightbox').click(); return; }
  if (closeModal()) return;
  if (!$('#notif-panel').classList.contains('hidden')) { $('#notif-panel').classList.add('hidden'); return; }
  if (!$('#tour').classList.contains('hidden')) return;
  if (S.menuOpen) closeMenu();
});

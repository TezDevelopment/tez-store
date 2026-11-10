'use strict';
// Staff desk: queue on the left, the open case on the right.

const DK = { tab: 'queue', q: '', cat: '', band: 0, list: [], meta: null, sel: null, c: null, view: 'overview', chan: 'staff', page: 1, timer: 0, busy: false, ver: 0 };
const DK_TABS = [['queue', 'Queue'], ['mine', 'Mine'], ['active', 'Active'], ['closed', 'Closed']];

PAGES.desk = {
  title: 'Staff desk',
  sub: () => DK.meta ? `${DK.meta.duty} on duty${DK.meta.eta != null ? ' · wait ' + fmtMin(DK.meta.eta) : ''}` : '',
  async render(el) {
    const ex = takeExtra();
    el.innerHTML = '<div class="desk"><div class="desk-list" id="dk-list"></div><div class="desk-case" id="dk-case"></div></div>';
    req('deskState', { open: true });
    await dkLoad();
    if (ex && ex.case) await dkOpen(ex.case); else if (DK.sel) await dkOpen(DK.sel, true); else dkCaseDraw();
    clearInterval(DK.timer); DK.timer = setInterval(dkTick, 1000);
  },
};

async function dkLoad() {
  const r = await req('deskList', { tab: DK.tab, q: DK.q, category: DK.cat, band: DK.band || undefined, page: DK.page });
  if (!r.ok) { toast(r.payload, 'error'); return; }
  DK.list = r.payload.list; DK.meta = r.payload.meta;
  S.deskCount = DK.meta.counts.queue; renderRail(); renderHeader();
  dkListDraw();
}

function dkListDraw() {
  const el = $('#dk-list'); if (!el) return;
  const m = DK.meta || { counts: {} };
  el.innerHTML = `<div class="tabs">${DK_TABS.map(([id, l]) => `<button class="${DK.tab === id ? 'on' : ''}" data-act="dkTab" data-arg="${id}">${l}${m.counts[id] != null ? `<i>${m.counts[id]}</i>` : ''}</button>`).join('')}</div>
    <div class="dk-filters"><div class="search-box">${ico('search', 14)}<input type="text" placeholder="#id, name or title" value="${esc(DK.q)}" data-input="dkSearch"></div>
    <select data-change="dkCat"><option value="">All categories</option>${(S.settings.categories || []).map(c => `<option value="${esc(c.id)}" ${DK.cat === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
    <select data-change="dkBand"><option value="0">All priorities</option>${[1, 2, 3, 4].map(b => `<option value="${b}" ${DK.band === b ? 'selected' : ''}>P${b}</option>`).join('')}</select></div>
    <div class="dk-rows">${DK.list.length ? DK.list.map(dkRow).join('') : empty(DK.tab === 'queue' ? 'Queue is clear' : 'Nothing here', 'New cases show up by themselves.')}</div>
    ${DK.list.length >= (m.per || 40) || DK.page > 1 ? `<div class="pager"><button class="btn small" data-act="dkPage" data-arg="-1" ${DK.page <= 1 ? 'disabled' : ''}>Prev</button><span class="muted xs">Page ${DK.page}</span><button class="btn small" data-act="dkPage" data-arg="1" ${DK.list.length < (m.per || 40) ? 'disabled' : ''}>Next</button></div>` : ''}`;
}

function dkRow(c) {
  const v = c.verdict && verdictOf(c.verdict);
  return `<button class="dk-row ${DK.sel === c.id ? 'sel' : ''}" data-act="dkOpen" data-arg="${c.id}" data-created="${c.created}">
    <div class="r1">${bandBadge(c.band)}<b>#${c.id}</b>${catChip(c.category)}${c.panic ? '<span class="pill red">Urgent</span>' : ''}${c.escalated ? '<span class="pill amber">Late</span>' : ''}<span class="grow"></span><span class="age" data-age>${fmtLong(nowSec() - c.created)}</span></div>
    <div class="r2">${esc(c.title || '')}</div>
    <div class="r3">${c.source === 'auto' ? 'Anti-cheat' : esc(c.anon ? 'Anonymous' : c.reporter)}${c.target ? ` about <b>${esc(c.target)}</b>` : ''}${c.claimed ? ` · ${esc(c.claimed)}` : ''}${v ? ` · ${esc(v.label)}` : ''}</div></button>`;
}

function dkTick() {
  if (S.page !== 'desk') { clearInterval(DK.timer); return; }
  $$('.dk-row').forEach(r => { const a = $('[data-age]', r); if (a) a.textContent = fmtLong(nowSec() - (+r.dataset.created)); });
  const e = $('#dk-age'); if (e && DK.c) e.textContent = fmtLong(nowSec() - DK.c.created);
}

ACT.dkTab = el => { DK.tab = el.dataset.arg; DK.page = 1; dkLoad(); };
ACT.dkPage = el => { DK.page = Math.max(1, DK.page + +el.dataset.arg); dkLoad(); };
let dkSearchT = 0;
INPUT.dkSearch = el => { clearTimeout(dkSearchT); dkSearchT = setTimeout(async () => { DK.q = el.value; DK.page = 1; await dkLoad(); const i = $('#dk-list input'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); };
CHANGE.dkCat = el => { DK.cat = el.value; DK.page = 1; dkLoad(); };
CHANGE.dkBand = el => { DK.band = +el.value; DK.page = 1; dkLoad(); };

// ---------------------------------------------------------------- case
async function dkOpen(id, keepView) {
  if (typeof Replay !== 'undefined') Replay.stop();
  DK.sel = id;
  const r = await req('deskCase', { id });
  if (!r.ok) { toast(r.payload, 'error'); DK.sel = null; DK.c = null; dkListDraw(); dkCaseDraw(); return; }
  DK.c = r.payload;
  if (!keepView) { DK.view = 'overview'; }
  DK.chan = DK.c.msgs.reporter.length ? 'reporter' : 'staff';
  dkListDraw(); dkCaseDraw();
}
ACT.dkOpen = el => dkOpen(+el.dataset.arg);

async function dkReload() { if (DK.sel) { const r = await req('deskCase', { id: DK.sel }); if (r.ok) { DK.c = r.payload; dkCaseDraw(); } } await dkLoad(); }

function dkCaseDraw() {
  const el = $('#dk-case'); if (!el) return;
  const c = DK.c;
  if (!c) { el.innerHTML = `<div class="dk-none">${ico('record', 40)}<b>Pick a case</b><span class="muted">Every case has a replay of the minute before it was filed.</span></div>`; return; }
  const open = c.status === 'open', mine = c.status === 'claimed' || c.status === 'waiting', closed = c.status === 'resolved' || c.status === 'dismissed';
  const v = c.verdict && verdictOf(c.verdict);
  const tabs = [['overview', 'Overview'], ['replay', 'Replay'], ['chat', 'Chat'], ['people', 'People'], ['timeline', 'Timeline']];
  el.innerHTML = `<div class="dk-head"><h2>#${c.id} ${esc(c.title || '')}</h2>
      <div class="r2">${bandBadge(c.band)}${catChip(c.category)}<span class="pill ${open ? 'amber' : closed ? 'green' : 'blue'}">${esc(c.status)}</span>${c.panic ? `<span class="pill red">${ico('siren', 11)} panic</span>` : ''}${v ? `<span class="pill" style="--c:${v.color}">${esc(v.label)}</span>` : ''}<span class="muted xs mono">${closed ? 'closed ' + ago(c.closedAt) : 'open for <span id="dk-age">' + fmtLong(nowSec() - c.created) + '</span>'}</span>${c.claimed ? `<span class="muted xs">· ${esc(c.claimed)}</span>` : ''}</div>
      <div class="dk-actions">${dkActions(c, open, mine, closed)}</div></div>
    <div class="tabs sub">${tabs.map(([id, l]) => `<button class="${DK.view === id ? 'on' : ''}" data-act="dkView" data-arg="${id}">${l}${id === 'chat' && (c.msgs.reporter.length + c.msgs.accused.length) ? `<i>${c.msgs.reporter.length + c.msgs.accused.length}</i>` : ''}</button>`).join('')}</div>
    <div class="dk-body" id="dk-body"></div>`;
  dkBody();
}

function dkActions(c, open, mine, closed) {
  const s = S.settings, b = [];
  if (open) b.push(`<button class="btn primary" data-act="dkClaim">${ico('check', 15)} Claim</button>`);
  if (mine && c.canAct) {
    b.push(`<button class="btn primary" data-act="dkVerdict">${ico('scale', 15)} Verdict</button>`);
    if (!c.mine && !c.isAdmin) { /* only an admin can act on someone else's claim */ }
    b.push(`<button class="btn" data-act="dkWaiting">${c.status === 'waiting' ? 'Resume' : 'Wait on reporter'}</button>`);
    b.push(`<button class="btn" data-act="dkStatement">${ico('send', 14)} Ask statement</button>`);
    b.push(`<button class="btn" data-act="dkHandoff">${ico('swap', 14)} Hand off</button>`);
    b.push(`<button class="btn ghost" data-act="dkRelease">Release</button>`);
  }
  if (closed && c.canAct) b.push(`<button class="btn" data-act="dkReopen">${ico('undo', 14)} Reopen</button>`);
  if (!closed && c.canAct) {
    const tools = [];
    if (s.toolGoto) tools.push(['jump', 'scene', 'Go to scene', 'pin'], ['jump', 'reporter', 'Go to reporter', 'user'], ['jump', 'accused', 'Go to accused', 'user']);
    if (s.toolBring) tools.push(['bring', 'accused', 'Bring accused', 'down'], ['bring', 'reporter', 'Bring reporter', 'down']);
    if (s.toolSpectate) tools.push(['spectate', 'accused', 'Spectate accused', 'eye']);
    if (tools.length) b.push(`<div class="menu"><button class="btn" data-act="dkTools">${ico('wrench', 14)} Tools</button><div class="menu-pop hidden" id="dk-tools">${tools.map(t => `<button data-act="dkTool" data-a="${t[0]}" data-w="${t[1]}">${ico(t[3], 14)}${t[2]}</button>`).join('')}<button data-act="dkTool" data-a="sendBack" data-w="accused">${ico('undo', 14)} Send accused back</button><button data-act="dkTool" data-a="sendBack" data-w="reporter">${ico('undo', 14)} Send reporter back</button></div></div>`);
  }
  return b.join('');
}
ACT.dkView = el => { if (DK.view === 'replay' && typeof Replay !== 'undefined') Replay.stop(); DK.view = el.dataset.arg; $$('.tabs.sub button').forEach(b => b.classList.toggle('on', b === el)); dkBody(); };
ACT.dkTools = () => $('#dk-tools').classList.toggle('hidden');
document.addEventListener('click', e => { const p = $('#dk-tools'); if (p && !e.target.closest('.menu')) p.classList.add('hidden'); });

function dkBody() {
  const el = $('#dk-body'); if (!el || !DK.c) return;
  ({ overview: dkOverview, replay: dkReplay, chat: dkChat, people: dkPeople, timeline: dkTimeline })[DK.view](el, DK.c);
}

function dkOverview(el, c) {
  const maxw = Math.max(1, ...(c.why || []).map(w => Math.abs(w.p || 0)));
  el.innerHTML = `<div class="dk-grid"><div class="card"><h4>Report</h4><p class="prewrap">${esc(c.body || '(no text)')}</p>
      ${(c.answers || []).length ? `<dl class="qa">${c.answers.map(a => `<dt>${esc(a.q)}</dt><dd>${esc(a.a || '-')}</dd>`).join('')}</dl>` : ''}
      ${(c.links || []).length ? `<div class="links">${c.links.map(l => `<a href="#" data-act="dkLink" data-url="${esc(l)}">${ico('link', 13)} ${esc(l.replace(/^https:\/\//, '').slice(0, 44))}</a>`).join('')}</div>` : ''}
      ${c.street ? `<p class="muted xs">${ico('pin', 12)} ${esc(c.street)}</p>` : ''}
      ${c.others && c.others.length ? `<h4 class="mt">Also reported by ${c.others.length}</h4>${c.others.map(o => `<div class="other"><b>${esc(o.anon ? 'Anonymous' : o.name)}</b> <small class="muted">trust ${o.trust} · ${ago(o.at)}</small><p>${esc(o.body)}</p></div>`).join('')}` : ''}</div>
    <div class="card"><h4>Why this priority</h4><div class="whylist">${(c.why || []).length ? c.why.map(w => { const val = w.p || 0; return `<div class="why ${val < 0 ? 'neg' : ''}"><span>${esc(w.l || w.k)}</span><b class="mono">${val > 0 ? '+' : ''}${val}</b>${bar(Math.abs(val), maxw, val < 0 ? 'good' : '')}</div>`; }).join('') : '<p class="muted xs">No factors recorded.</p>'}</div>
      <div class="total">Score <b class="mono">${c.priority}</b> ${bandBadge(c.band)}</div>
      ${c.witnesses && c.witnesses.length ? `<h4 class="mt">Witness statements</h4>${c.witnesses.map(w => `<div class="other"><b>${esc(w.name)}</b> <small class="muted">${esc(w.state || '')}</small><p>${esc(w.text || 'No answer yet.')}</p></div>`).join('')}` : ''}
      ${c.verdict ? `<h4 class="mt">Outcome</h4><p><b>${esc((verdictOf(c.verdict) || {}).label || c.verdict)}</b> by ${esc(c.closedName || '')}${c.verdictNote ? `<br><span class="muted">${esc(c.verdictNote)}</span>` : ''}</p>${c.rating ? `<div class="stars">${stars(c.rating)}</div>${c.ratingNote ? `<p class="muted xs">${esc(c.ratingNote)}</p>` : ''}` : ''}` : ''}</div></div>`;
}
ACT.dkLink = el => { /* links are shown for staff to copy, not opened inside the game */ navigator.clipboard && navigator.clipboard.writeText(el.dataset.url); toast('Link copied. Paste it in your browser.', 'info'); };

function dkReplay(el, c) { Replay.mount(el, c); }

// ---- chat
function dkChat(el, c) {
  const chans = [['reporter', 'Reporter'], ['accused', 'Accused'], ['staff', 'Staff only']];
  el.innerHTML = `<div class="seg wide">${chans.map(([id, l]) => `<button class="${DK.chan === id ? 'on' : ''}" data-act="dkChan" data-arg="${id}">${l}${c.msgs[id].length ? ` (${c.msgs[id].length})` : ''}</button>`).join('')}</div>
    <div class="chat-box" id="dk-chat">${chatHtml(c.msgs[DK.chan], 'staff', m => m.role === 'staff' ? m.name : (DK.chan === 'accused' ? 'Accused' : 'Reporter'))}</div>
    ${c.status !== 'resolved' && c.status !== 'dismissed' ? `<div class="macros">${(S.settings.macros || []).map((m, i) => `<button class="chipbtn" data-act="dkMacro" data-i="${i}">${esc(m.label)}</button>`).join('')}</div>
    <div class="composer"><input type="text" id="dk-input" maxlength="500" placeholder="${DK.chan === 'staff' ? 'Note for other staff' : 'Message to the ' + DK.chan}" ${c.canAct ? '' : 'disabled'}><button class="btn primary" data-act="dkSend" ${c.canAct ? '' : 'disabled'}>${ico('send', 15)}</button></div>` : ''}`;
  scrollChat();
  const i = $('#dk-input'); if (i) i.onkeydown = e => { if (e.key === 'Enter') ACT.dkSend(); };
}
ACT.dkChan = el => { DK.chan = el.dataset.arg; dkChat($('#dk-body'), DK.c); };
ACT.dkMacro = el => { const m = S.settings.macros[+el.dataset.i]; const i = $('#dk-input'); if (m && i) { i.value = m.text; i.focus(); } };
ACT.dkSend = async () => {
  const i = $('#dk-input'); if (!i || !i.value.trim()) return;
  const text = i.value; i.value = '';
  const r = await run('send', { id: DK.sel, channel: DK.chan, text });
  if (r.ok) { DK.c.msgs[DK.chan].push({ role: 'staff', name: (S.me && S.me.name) || 'You', text, at: nowSec() }); if (DK.view === 'chat') { const b = $('#dk-chat'); if (b) { b.innerHTML = chatHtml(DK.c.msgs[DK.chan], 'staff', m => m.role === 'staff' ? m.name : DK.chan); scrollChat(); } } }
  else i.value = text;
};
function deskChat(m) {
  if (S.page !== 'desk' || !DK.c || m.case !== DK.c.id || !DK.c.msgs[m.channel]) return;
  DK.c.msgs[m.channel].push({ role: m.role, name: m.name, text: m.text, at: m.at });
  if (DK.view === 'chat' && DK.chan === m.channel) { const b = $('#dk-chat'); if (b) { b.innerHTML = chatHtml(DK.c.msgs[m.channel], 'staff', x => x.role === 'staff' ? x.name : (m.channel === 'accused' ? 'Accused' : 'Reporter')); scrollChat(); } }
  else if (DK.view === 'chat') dkChat($('#dk-body'), DK.c);
}

// ---- people
function dkPeople(el, c) {
  const prof = (p, role) => !p ? '' : `<div class="card profile"><div class="ph"><div class="avatar">${esc((p.name || '?')[0])}</div><div class="grow"><h4>${esc(p.name || 'Unknown')} ${p.online ? '<span class="pill green">online</span>' : '<span class="pill">offline</span>'}</h4><span class="muted xs">${role}${p.id ? ' · id ' + p.id : ''}</span></div>${p.watch ? `<span class="pill amber">${ico('eye', 11)} watched</span>` : ''}</div>
      ${p.trust != null ? `<div class="meters"><div><small>Trust</small><b class="mono">${p.trust}</b>${bar(p.trust, 100, p.trust < 40 ? 'bad' : 'good')}</div><div><small>Risk</small><b class="mono">${p.risk != null ? Math.round(p.risk) : 0}</b>${bar(p.risk || 0, 100, (p.risk || 0) > 50 ? 'bad' : '')}</div></div>
      <p class="muted xs">Filed ${p.filed || 0} · valid ${p.valid || 0} · false ${p.falsed || 0} · reported ${p.against || 0}×${p.step && p.step.label ? ` · next step: <b>${esc(p.step.label)}</b>` : ''}</p>
      ${p.blocked ? `<div class="banner warnb">Report block until ${clock(p.blocked)}</div>` : ''}
      ${(p.strikes || []).length ? `<h5>Strikes</h5>${p.strikes.map(s => `<div class="strike"><b class="mono">+${s.points}</b><span>${esc(s.label)}${s.note ? ' · ' + esc(s.note) : ''}</span><small class="muted">${ago(s.created)}</small></div>`).join('')}` : ''}
      ${(p.cases || []).length ? `<h5>Recent reports against</h5>${p.cases.map(x => `<button class="strike link" data-act="dkOpen" data-arg="${x.id}"><b>#${x.id}</b><span>${catOf(x.category).label}</span><small class="muted">${esc(x.verdict || x.status)}</small></button>`).join('')}` : ''}` : '<p class="muted xs">No history.</p>'}</div>`;
  el.innerHTML = `<div class="dk-grid">${prof(c.targetProfile, 'Accused')}${c.source === 'player' ? prof(c.reporterProfile, 'Reporter') : `<div class="card"><h4>Anti-cheat report</h4><p class="muted">Filed by a script, so there is no reporter.</p></div>`}</div>`;
}

function dkTimeline(el, c) {
  const kinds = { open: 'record', claim: 'check', release: 'undo', close: 'scale', msg: 'send', note: 'tag', witness: 'eye', panic: 'siren', escalate: 'bolt', reopen: 'undo', handoff: 'swap', tool: 'wrench' };
  el.innerHTML = `<div class="timeline">${(c.events || []).map(e => `<div class="tl"><i>${ico(kinds[e.kind] || 'step', 13)}</i><div class="grow"><span>${esc(e.text)}</span><small class="muted">${e.actor ? esc(e.actor) + ' · ' : ''}${clock(e.at)} (${ago(e.at)})</small></div></div>`).join('') || empty('No events')}</div>`;
}

// ---------------------------------------------------------------- actions
ACT.dkClaim = async () => { const r = await run('claim', { id: DK.sel }, 'Claimed.'); if (r.ok) { dkReload(); } };
ACT.dkRelease = () => confirmBox('Release this case?', 'It goes back to the queue for someone else.', 'Release', async () => { const r = await run('release', { id: DK.sel }); if (r.ok) dkReload(); });
ACT.dkWaiting = async () => { const r = await run('waiting', { id: DK.sel, on: DK.c.status !== 'waiting' }); if (r.ok) dkReload(); };
ACT.dkStatement = async () => { const r = await run('statement', { id: DK.sel }, 'Statement requested.'); if (r.ok) dkReload(); };
ACT.dkReopen = async () => { const r = await run('reopen', { id: DK.sel }, 'Reopened.'); if (r.ok) dkReload(); };
ACT.dkTool = async el => { $('#dk-tools').classList.add('hidden'); const r = await run(el.dataset.a, { id: DK.sel, who: el.dataset.w }); if (r.ok) { toast('Done.', 'success'); if (el.dataset.a === 'spectate' || el.dataset.a === 'jump') { /* the client closes the menu itself */ } } };
ACT.dkHandoff = async () => {
  const r = await req('dutyList');
  const list = (r.ok ? r.payload : []).filter(x => !S.me || x.pub !== S.me.pub);
  modal(`<h3>Hand off #${DK.sel}</h3><p class="muted">Pick someone on duty.</p><div class="pick">${list.length ? list.map(x => `<button class="btn block" data-act="dkHandoffTo" data-arg="${esc(x.pub)}">${esc(x.name)}</button>`).join('') : '<p class="muted">Nobody else is on duty.</p>'}</div><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button></div>`, { noFocus: true });
};
ACT.dkHandoffTo = async el => { const r = await run('handoff', { id: DK.sel, pub: el.dataset.arg }, 'Handed off.'); if (r.ok) { closeModal(); dkReload(); } };

let dkV = null;
ACT.dkVerdict = () => {
  const vs = S.settings.verdicts || [];
  dkV = vs[0] ? vs[0].id : null;
  modal(`<h3>Verdict for #${DK.sel}</h3><div class="verdicts">${vs.map(v => `<button class="vbtn ${v.id === dkV ? 'on' : ''}" style="--c:${rgbStr(v.color)}" data-act="dkPickV" data-arg="${esc(v.id)}"><b>${esc(v.label)}</b><small>${v.action === 'none' ? 'no action' : v.action}${v.points ? ' · +' + v.points + ' pts' : ''}</small></button>`).join('')}</div>
    <div class="field"><label id="dk-nlabel">Note</label><textarea id="dk-vnote" rows="3" maxlength="300" placeholder="Visible to staff. The reporter only sees the message set for this verdict."></textarea></div>
    <div class="vsum muted xs" id="dk-vsum"></div>
    <div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="dkSubmitV">Confirm</button></div>`, { wide: true, noFocus: true });
  dkVSum();
};
function dkVSum() {
  const v = verdictOf(dkV), s = $('#dk-vsum'); if (!v || !s) return;
  const t = DK.c.targetProfile, risk = t && t.risk != null ? t.risk : 0;
  s.innerHTML = `${v.action !== 'none' ? `Runs <b>${v.action}</b>${v.duration ? ' for ' + v.duration + ' min' : ''}. ` : ''}${v.points ? `Adds ${v.points} strike points (risk ${Math.round(risk)} → ${Math.round(risk + v.points)}). ` : ''}Reporter counts as <b>${v.reporter}</b>.${v.noteRequired ? ' <b>A note is required.</b>' : ''}`;
  const l = $('#dk-nlabel'); if (l) l.textContent = v.noteRequired ? 'Note (required)' : 'Note';
}
ACT.dkPickV = el => { dkV = el.dataset.arg; $$('.vbtn').forEach(b => b.classList.toggle('on', b === el)); dkVSum(); };
ACT.dkSubmitV = async () => {
  const v = verdictOf(dkV); if (!v) return;
  const note = $('#dk-vnote').value.trim();
  if (v.noteRequired && !note) { toast('This verdict needs a note.', 'error'); return; }
  const go = async () => { const r = await run('close', { id: DK.sel, verdict: dkV, note }, 'Case closed.'); if (r.ok) { closeModal(); DK.c = null; DK.sel = null; await dkLoad(); dkCaseDraw(); } };
  if (v.action === 'ban' || v.action === 'jail') confirmBox('Run ' + v.action + '?', `${DK.c.targetProfile ? DK.c.targetProfile.name : 'The accused'} will be punished right away.`, 'Confirm', go, true);
  else go();
};

// ---------------------------------------------------------------- live updates
function deskIncoming(d) {
  if (!d || !d.case) return;
  if (S.menuOpen && S.page === 'desk') {
    dkLoad();
    if (DK.sel === d.case.id && d.what === 'update' && DK.view !== 'replay') dkReload();
  } else if (d.what === 'new') { S.deskCount = (S.deskCount || 0) + 1; if (S.menuOpen) renderRail(); }
}

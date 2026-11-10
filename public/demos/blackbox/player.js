'use strict';
// What every player sees: the report form, the live tracker with the chat, and the witness statement

// ------------------------------------------------------------------ chat helpers
function chatHtml(msgs, mineRole, nameOf) {
  if (!msgs || !msgs.length) return '<div class="chat-empty">No messages yet.</div>';
  return msgs.map(m => {
    const mine = m.role === mineRole;
    return `<div class="bub ${mine ? 'mine' : ''} ${m.role}"><div class="who">${esc(nameOf ? nameOf(m) : m.name)}<small>${clock(m.at)}</small></div><div class="tx">${esc(m.text)}</div></div>`;
  }).join('');
}
function scrollChat() { const c = $('.chat-box'); if (c) c.scrollTop = c.scrollHeight; }

// ====================================================================== report form
const RP = { cat: null, target: null, text: '', answers: [], links: '', anon: false, form: null, done: null, suggest: null, search: [], busy: false };

function rpReset() { Object.assign(RP, { cat: null, target: null, text: '', answers: [], links: '', anon: false, done: null, suggest: null, search: [], busy: false }); }

PAGES.report = {
  title: 'Report a problem',
  sub: 'Staff see a replay of the last minute around you. You do not need to record anything.',
  async render(el) {
    const extra = takeExtra();
    if (extra && extra.prefill) {
      rpReset();
      const f = extra.prefill;
      RP.cat = f.category; RP.target = f.target ? { pub: f.target, name: f.targetName || 'Player' } : null;
    }
    el.innerHTML = '<div class="empty"><b>Loading</b></div>';
    const r = await req('form');
    RP.form = r.ok ? r.payload : { nearby: [], left: [], duty: 0, open: 0, trust: 50 };
    rpDraw();
  },
};

function rpCats() { return (S.settings.categories || []).filter(c => c.enabled); }
function rpCat() { return rpCats().find(c => c.id === RP.cat) || null; }
function rpMax() { return S.settings.maxChars || 800; }
function rpMin() { return S.settings.minChars || 10; }
function rpValid() {
  const c = rpCat();
  if (!c || RP.busy) return false;
  if (c.needsTarget && !RP.target) return false;
  return RP.text.trim().length >= rpMin();
}

function rpTargetPicker(c) {
  if (RP.target) return `<div class="picked"><span class="avatar-dot">${esc((RP.target.name || '?')[0])}</span><b>${esc(RP.target.name)}</b><button class="btn tiny" data-act="rpClearTarget">Change</button></div>`;
  const f = RP.form;
  const near = f.nearby.map(p => `<button class="chipbtn" data-act="rpPick" data-pub="${esc(p.pub)}" data-name="${esc(p.name)}"><b>${esc(p.name)}</b><small>#${p.id} · ${p.dist} m</small></button>`).join('');
  const left = f.left.map(p => `<button class="chipbtn gone" data-act="rpPick" data-pub="${esc(p.pub)}" data-name="${esc(p.name)}"><b>${esc(p.name)}</b><small>left ${p.ago < 90 ? p.ago + 's' : Math.round(p.ago / 60) + ' min'} ago</small></button>`).join('');
  return `${near ? `<div class="mini">Near you</div><div class="chipwrap">${near}</div>` : ''}
    ${left ? `<div class="mini">Left the server recently <span class="tipbadge">combat log?</span></div><div class="chipwrap">${left}</div>` : ''}
    <div class="mini">Somebody else</div>
    <div class="search-box">${ico('search', 15)}<input type="text" placeholder="Type a name or an ID" data-input="rpSearch" value=""></div>
    <div id="rp-results" class="chipwrap">${RP.search.map(p => `<button class="chipbtn" data-act="rpPick" data-pub="${esc(p.pub)}" data-name="${esc(p.name)}"><b>${esc(p.name)}</b><small>#${p.id}</small></button>`).join('')}</div>`;
}

function rpDraw() {
  const el = $('#page');
  if (RP.done) return rpDoneView(el);
  const f = RP.form, c = rpCat();
  const fixes = (S.settings.fixesOn ? (S.settings.fixes || []).filter(x => x.enabled) : []);
  const eta = f.eta;
  el.innerHTML = `<div class="rp">
    <div class="rp-main">
      ${f.killer && !RP.target ? `<div class="banner killer">${ico('crosshair', 20)}<div class="grow"><b>${esc(f.killer.name)}</b> killed you ${f.killer.ago} seconds ago${f.killer.weapon ? ` (${esc(f.killer.weapon)})` : ''}.</div><button class="btn small primary" data-act="rpKiller">Report them</button></div>` : ''}
      ${fixes.length ? `<div class="fixbar"><span>${ico('bolt', 15)} Instant fixes</span>${fixes.map(x => `<button class="btn small" data-act="rpFix" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>` : ''}
      <div class="section">1 · What is it about?</div>
      <div class="catgrid">${rpCats().map(x => `<button class="catcard ${RP.cat === x.id ? 'on' : ''}" style="--c:${rgbStr(x.color)}" data-act="rpCat" data-id="${esc(x.id)}"><i></i>${esc(x.label)}</button>`).join('')}</div>
      ${c ? `${c.fix && (S.settings.fixes || []).find(x => x.id === c.fix && x.enabled) ? `<div class="banner fix">${ico('bolt', 18)}<div class="grow">This can usually be solved right away without staff.</div><button class="btn small primary" data-act="rpFix" data-id="${esc(c.fix)}">${esc((S.settings.fixes.find(x => x.id === c.fix) || {}).label)}</button></div>` : ''}
        <div class="section">2 · ${c.needsTarget ? 'Who is it about?' : 'Is a player involved? (optional)'}</div>
        <div class="card">${rpTargetPicker(c)}</div>
        <div class="section">3 · Tell us what happened</div>
        <div class="card">
          <div class="field"><textarea id="rp-text" rows="4" maxlength="${rpMax()}" placeholder="What happened, where, and who was there? The more detail the faster staff can decide." data-input="rpText">${esc(RP.text)}</textarea>
            <div class="counter"><span id="rp-count" class="${RP.text.trim().length >= rpMin() ? '' : 'low'}">${RP.text.length} / ${rpMax()}</span><span id="rp-suggest"></span></div></div>
          ${(c.questions || []).map((q, i) => `<div class="field"><label>${esc(q)}</label><input type="text" maxlength="200" value="${esc(RP.answers[i] || '')}" data-input="rpAnswer" data-i="${i}"></div>`).join('')}
          ${S.settings.allowLinks && S.settings.maxLinks > 0 ? `<div class="field"><label>Proof links (optional, up to ${S.settings.maxLinks}, one per line)</label><textarea rows="2" placeholder="https://..." data-input="rpLinks">${esc(RP.links)}</textarea></div>` : ''}
          ${S.settings.allowAnonymous && RP.target ? `<div class="toggle-row"><div><div class="t">Hide my name from the accused</div><div class="d">Staff can always see who filed.</div></div>${toggle(RP.anon, 'rpAnon')}</div>` : ''}
          <div class="row-flex" style="margin-top:14px;justify-content:flex-end"><button class="btn primary" id="rp-send" data-act="rpSend" ${rpValid() ? '' : 'disabled'}>${ico('send', 15)} Send report</button></div>
        </div>` : '<div class="card muted">Pick what it is about and the form opens.</div>'}
    </div>
    <aside class="rp-side">
      <div class="card"><h3>What happens next</h3>
        <ol class="next"><li><b>Recorded</b><span>${c && c.evidence ? `The server saves the last ${S.settings.recSeconds || 60} seconds of everyone around the scene.` : 'Staff get your text.'}</span></li>
          <li><b>Picked up</b><span>${f.duty ? `${f.duty} staff on duty. ${eta ? 'Usually ' + fmtMin(eta) + '.' : ''}` : 'Nobody is on duty right now. Your report waits in the queue.'}</span></li>
          <li><b>Decided</b><span>You hear back here and can chat with staff.</span></li></ol></div>
      <div class="card"><h3>Your reporter trust</h3>${bar(f.trust, 100)}<div class="row-flex" style="justify-content:space-between;margin-top:6px"><small class="muted">${f.trust} / 100</small><small class="muted">${f.open} open</small></div>
        <p class="muted xs">Accurate reports raise it. Trusted reports are looked at sooner. False reports lower it.</p></div>
    </aside>
  </div>`;
}

ACT.rpCat = el => { RP.cat = el.dataset.id; RP.answers = []; rpDraw(); };
ACT.rpPick = el => { RP.target = { pub: el.dataset.pub, name: el.dataset.name }; RP.search = []; rpDraw(); };
ACT.rpClearTarget = () => { RP.target = null; rpDraw(); };
ACT.rpKiller = () => { const k = RP.form.killer; RP.target = { pub: k.pub, name: k.name }; if (!RP.cat) RP.cat = 'rdm'; rpDraw(); };
ACT.rpAnon = () => { RP.anon = !RP.anon; rpDraw(); };
ACT.rpFix = async el => { await run('fix', { id: el.dataset.id }, 'Fixing it.'); };
INPUT.rpText = el => {
  RP.text = el.value;
  const n = $('#rp-count'); if (n) { n.textContent = `${el.value.length} / ${rpMax()}`; n.className = el.value.trim().length >= rpMin() ? '' : 'low'; }
  const b = $('#rp-send'); if (b) b.disabled = !rpValid();
  clearTimeout(RP.t);
  RP.t = setTimeout(async () => {
    if (!S.settings.autoCategory || el.value.length < 12) return;
    const r = await req('suggest', { text: el.value });
    const box = $('#rp-suggest'); if (!box) return;
    if (r.ok && r.payload && r.payload !== RP.cat) { const c = catOf(r.payload); box.innerHTML = `Looks like <b style="color:${esc(c.color)}">${esc(c.label)}</b> <button class="btn tiny" data-act="rpSwitch" data-id="${esc(r.payload)}">Switch</button>`; } else box.innerHTML = '';
  }, 700);
};
ACT.rpSwitch = el => { RP.cat = el.dataset.id; rpDraw(); };
INPUT.rpAnswer = el => { RP.answers[+el.dataset.i] = el.value; };
INPUT.rpLinks = el => { RP.links = el.value; };
INPUT.rpSearch = el => {
  clearTimeout(RP.st);
  RP.st = setTimeout(async () => {
    const q = el.value.trim(); const box = $('#rp-results'); if (!box) return;
    if (!q) { RP.search = []; box.innerHTML = ''; return; }
    const r = await req('search', { q });
    RP.search = r.ok ? r.payload : [];
    box.innerHTML = RP.search.length ? RP.search.map(p => `<button class="chipbtn" data-act="rpPick" data-pub="${esc(p.pub)}" data-name="${esc(p.name)}"><b>${esc(p.name)}</b><small>#${p.id}</small></button>`).join('') : '<span class="muted xs">Nobody found.</span>';
  }, 300);
};
ACT.rpSend = async () => {
  if (!rpValid()) return;
  RP.busy = true; rpDraw();
  const links = RP.links.split(/\s*\n\s*/).map(s => s.trim()).filter(Boolean);
  const r = await req('file', { category: RP.cat, text: RP.text, target: RP.target ? RP.target.pub : '', answers: RP.answers, links, anon: RP.anon });
  RP.busy = false;
  if (!r.ok) { toast(typeof r.payload === 'string' ? r.payload : 'Could not send.', 'error'); rpDraw(); return; }
  RP.done = r.payload; rpDraw();
};
function rpDoneView(el) {
  const d = RP.done;
  el.innerHTML = `<div class="done"><div class="done-ring">${ico('check', 38)}</div><h2>Report #${d.id} sent</h2>
    <p>${d.merged ? 'Another player already reported this person. Yours was added to the same case, so it moves up the queue.' : (d.duty === 0 ? 'Nobody is on duty right now, but it is in the queue.' : `Staff are on it. ${d.eta ? 'Usually ' + fmtMin(d.eta) + '.' : ''}`)}</p>
    <div class="row-flex" style="justify-content:center;margin-top:18px"><button class="btn primary" data-act="rpTrack">Track it</button><button class="btn" data-act="rpAgain">File another</button></div></div>`;
}
ACT.rpTrack = () => { const id = RP.done && RP.done.id; rpReset(); goPage('mine', { open: id }); };
ACT.rpAgain = () => { rpReset(); PAGES.report.render($('#page')); };

// ====================================================================== my reports
const MP = { data: null, sel: null, thread: null, rating: 0 };

PAGES.mine = {
  title: 'My reports',
  sub: 'Everything you filed, and what happened with it',
  async render(el) {
    const extra = takeExtra();
    S.unread = 0; renderRail();
    el.innerHTML = '<div class="empty"><b>Loading</b></div>';
    await mineLoad();
    if (extra && (extra.open || extra.rate)) { const id = extra.open || extra.rate; if (MP.data.mine.some(c => c.id === id)) MP.sel = { id, channel: 'reporter' }; }
    if (!MP.sel && MP.data.about.length && !MP.data.mine.length) MP.sel = { id: MP.data.about[0].id, channel: 'accused' };
    else if (!MP.sel && MP.data.mine.length) MP.sel = { id: MP.data.mine[0].id, channel: 'reporter' };
    await mineThread();
    mineDraw();
  },
};
async function mineLoad() { const r = await req('mine'); MP.data = r.ok ? r.payload : { mine: [], about: [] }; }
async function mineThread() {
  MP.thread = null;
  if (!MP.sel) return;
  const r = await req('thread', { id: MP.sel.id, channel: MP.sel.channel });
  MP.thread = r.ok ? r.payload : null;
}
let mineTimer = null;
function mineReload() { clearTimeout(mineTimer); mineTimer = setTimeout(async () => { if (S.page !== 'mine') return; await mineLoad(); await mineThread(); mineDraw(); }, 250); }

function stepper(c) {
  const labels = ['Sent', 'Picked up', 'Decided'];
  return `<div class="steps">${labels.map((l, i) => { const n = i + 1; const cls = c.stage > n || (c.stage === 3 && n === 3) ? 'done' : (c.stage === n ? 'cur' : ''); return `<div class="step ${cls}"><i>${cls === 'done' ? ico('check', 12) : n}</i><span>${l}${n === 2 && c.status === 'waiting' ? ' (waiting on you)' : ''}</span></div>`; }).join('<b class="sep"></b>')}</div>`;
}
function mineDraw() {
  const el = $('#page');
  const d = MP.data;
  if (!d.mine.length && !d.about.length) { el.innerHTML = empty('Nothing here yet', 'Reports you file show up here so you can follow them.'); return; }
  const card = (c, ch) => `<button class="mcase ${MP.sel && MP.sel.id === c.id && MP.sel.channel === ch ? 'on' : ''}" data-act="mineSel" data-id="${c.id}" data-ch="${ch}">
    <div class="top">${ch === 'accused' ? pill('About you', 'war') : catChip(c.category)}<b>#${c.id}</b><small class="muted">${ago(c.created)}</small></div>
    <div class="ti">${ch === 'accused' ? esc(c.label) : esc(c.title)}</div>
    ${ch === 'reporter' ? `<div class="mini-steps">${stepper(c)}</div>${c.stage === 1 && c.pos ? `<small class="muted">Place ${c.pos} in the queue${c.eta ? ' · ' + fmtMin(c.eta) : ''}</small>` : ''}` : '<small class="muted">Staff asked for your side</small>'}</button>`;
  el.innerHTML = `<div class="mine"><div class="mine-list">
    ${d.about.length ? `<div class="mini">Staff asked for your side</div>${d.about.map(c => card(c, 'accused')).join('')}<div class="mini">Reports I filed</div>` : ''}
    ${d.mine.map(c => card(c, 'reporter')).join('') || '<p class="muted xs">You have not filed anything.</p>'}</div>
    <div class="mine-thread" id="mine-thread"></div></div>`;
  mineThreadDraw();
}
ACT.mineSel = async el => { MP.sel = { id: +el.dataset.id, channel: el.dataset.ch }; MP.rating = 0; await mineThread(); mineDraw(); };
function mineThreadDraw() {
  const box = $('#mine-thread'); if (!box) return;
  const t = MP.thread;
  if (!t) { box.innerHTML = empty('Pick a report', ''); return; }
  const c = t.case, accused = t.channel === 'accused';
  box.innerHTML = `<div class="th-head"><div>${accused ? pill('About you', 'war') : catChip(c.category)} <b>#${c.id}</b> ${c.panic ? pill('Urgent', 'war') : ''}</div>${accused ? '' : stepper(c)}</div>
    ${accused ? `<div class="banner fix">${ico('scale', 18)}<div class="grow">Staff asked for your side of a <b>${esc(c.label)}</b> report. Answer honestly. What you write is added to the case.</div></div>` : `
      <div class="card tight"><div class="mini">What you wrote${c.target ? ` · about ${esc(c.target)}` : ''}</div><p class="body">${esc(c.body)}</p>${c.merged ? `<small class="muted">${c.merged} other player${c.merged > 1 ? 's' : ''} reported the same person, so it was merged into one case.</small>` : ''}</div>
      ${c.stage === 1 ? `<div class="card tight eta"><div>${ico('clock', 18)}</div><div><b>${c.pos ? `Place ${c.pos} in the queue` : 'In the queue'}</b><br><small class="muted">${S.settings && MP.data.duty ? `${MP.data.duty} staff on duty. ` : 'Nobody on duty right now. '}${c.eta ? 'Usually ' + fmtMin(c.eta) : ''}</small></div></div>` : ''}
      ${c.outcome ? `<div class="outcome" style="--c:${rgbStr(c.outcome.color)}"><b>${esc(c.outcome.label)}</b><p>${esc(c.outcome.message)}</p></div>` : ''}`}
    <div class="chat-box" id="mine-chat">${chatHtml(t.msgs, 'player', m => m.role === 'staff' ? 'Staff' : 'You')}</div>
    ${t.open ? `<div class="composer"><input type="text" id="mine-input" maxlength="500" placeholder="${accused ? 'Your side of the story' : 'Write to staff'}" data-input="mineInput"><button class="btn primary" data-act="mineSend">${ico('send', 15)}</button></div>` : ''}
    ${c.canRate ? `<div class="card tight rate"><b>How was it handled?</b><div class="stars" id="mine-stars">${[1, 2, 3, 4, 5].map(n => `<button data-act="mineStar" data-n="${n}" class="star ${MP.rating >= n ? 'on' : ''}">${ico('star', 22)}</button>`).join('')}</div>
      <input type="text" id="mine-rnote" maxlength="300" placeholder="Anything to add? (optional)"><button class="btn small primary" data-act="mineRate" ${MP.rating ? '' : 'disabled'}>Send rating</button></div>` : (c.rating ? `<div class="rated"><span>${stars(c.rating)}</span> Thanks for rating.</div>` : '')}`;
  scrollChat();
  const inp = $('#mine-input'); if (inp) inp.onkeydown = e => { if (e.key === 'Enter') ACT.mineSend(); };
}
ACT.mineStar = el => { MP.rating = +el.dataset.n; mineThreadDraw(); };
ACT.mineRate = async () => {
  const r = await run('rate', { id: MP.sel.id, stars: MP.rating, note: ($('#mine-rnote') || {}).value }, 'Thank you.');
  if (r.ok) { MP.rating = 0; await mineLoad(); await mineThread(); mineDraw(); }
};
ACT.mineSend = async () => {
  const inp = $('#mine-input'); if (!inp || !inp.value.trim()) return;
  const text = inp.value; inp.value = '';
  const r = await run('send', { id: MP.sel.id, channel: MP.sel.channel, text });
  if (r.ok && MP.thread) { MP.thread.msgs.push({ role: 'player', name: 'You', text, at: nowSec() }); const c = $('#mine-chat'); if (c) { c.innerHTML = chatHtml(MP.thread.msgs, 'player', m => m.role === 'staff' ? 'Staff' : 'You'); scrollChat(); } }
  else inp.value = text;
};
function mineChat(m) {
  if (S.page !== 'mine' || !MP.sel || !MP.thread || m.case !== MP.sel.id || m.channel !== MP.sel.channel) return;
  MP.thread.msgs.push({ role: m.role, name: m.name, text: m.text, at: m.at });
  const c = $('#mine-chat'); if (c) { c.innerHTML = chatHtml(MP.thread.msgs, 'player', x => x.role === 'staff' ? 'Staff' : 'You'); scrollChat(); }
}
function chatIncoming(m) { mineChat(m); if (typeof deskChat === 'function') deskChat(m); }

// ====================================================================== witness
PAGES.witness = {
  title: 'Witness statement', sub: '',
  render(el) {
    const p = takeExtra() || {};
    el.innerHTML = `<div class="witness"><div class="done-ring small">${ico('eye', 28)}</div><h2>${p.accused ? 'A report mentions you' : 'Were you a witness?'}</h2>
      <p class="muted">${p.accused ? `Staff would like your side of a <b>${esc(p.label || '')}</b> report.` : `A report was filed near you: <b>${esc(p.label || '')}</b>. Tell staff what you saw, in your own words.`}${p.reward ? ` You get ${esc(S.settings.currency || '$')}${p.reward} for a statement.` : ''}</p>
      <textarea id="w-text" rows="5" maxlength="${p.chars || 300}" placeholder="What did you see?"></textarea>
      <div class="row-flex" style="justify-content:center;margin-top:14px"><button class="btn" data-act="witNo" data-case="${p.case}">I did not see it</button><button class="btn primary" data-act="witYes" data-case="${p.case}">Send statement</button></div></div>`;
    setTimeout(() => { const t = $('#w-text'); if (t) t.focus(); }, 50);
  },
};
ACT.witYes = el => { const t = $('#w-text').value.trim(); if (t.length < 5) return toast('Write a little more.', 'error'); post('witness', { case: +el.dataset.case, said: true, text: t }); };
ACT.witNo = el => post('witness', { case: +el.dataset.case, said: false, text: '' });

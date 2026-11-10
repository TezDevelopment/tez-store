'use strict';
// Insights (charts and heatmap) and the Players page.

const IN = { days: 14, data: null, tab: 'overview' };

PAGES.insight = {
  title: 'Insights', sub: 'How the report desk is doing',
  async render(el) {
    el.innerHTML = '<div class="muted pad">Loading...</div>';
    const r = await req('insight', { days: IN.days });
    if (!r.ok) { el.innerHTML = empty('No access', r.payload); return; }
    IN.data = r.payload; inDraw(el);
  },
};
ACT.inDays = async el => { IN.days = +el.dataset.arg; PAGES.insight.render($('#page')); };
ACT.inTab = el => { IN.tab = el.dataset.arg; inDraw($('#page')); };

function stat(label, value, sub) { return `<div class="stat"><small>${esc(label)}</small><b class="mono">${value}</b>${sub ? `<span class="muted xs">${sub}</span>` : ''}</div>`; }

function inDraw(el) {
  const d = IN.data;
  el.innerHTML = `<div class="ins"><div class="ins-top"><div class="seg">${[7, 14, 30, 90].map(n => `<button class="${IN.days === n ? 'on' : ''}" data-act="inDays" data-arg="${n}">${n} days</button>`).join('')}</div>
    <div class="seg">${[['overview', 'Overview'], ['heat', 'Where it happens'], ['staff', 'Staff']].map(([id, l]) => `<button class="${IN.tab === id ? 'on' : ''}" data-act="inTab" data-arg="${id}">${l}</button>`).join('')}</div></div>
    <div class="stats">${stat('Reports', num(d.total), `${num(d.closed)} closed`)}${stat('Time to claim', d.avgClaim ? fmtLong(d.avgClaim) : '-', 'average')}${stat('Time to close', d.avgResolve ? fmtLong(d.avgResolve) : '-', 'average')}${stat('Rating', d.avgRating ? d.avgRating + ' / 5' : '-', 'from reporters')}${stat('Escalated', num(d.escalated), 'went past the SLA')}</div>
    ${IN.tab === 'overview' ? inOverview(d) : IN.tab === 'heat' ? inHeat(d) : inStaff(d)}</div>`;
  if (IN.tab === 'heat') drawHeat(d);
}

function inOverview(d) {
  const maxDay = Math.max(1, ...d.perDay.map(x => x.n));
  const maxCat = Math.max(1, ...d.byCategory.map(x => x.n));
  const maxVer = Math.max(1, ...d.byVerdict.map(x => x.n));
  const maxHr = Math.max(1, ...d.hours.map(x => x.n));
  return `<div class="ins-grid">
    <div class="card wide"><h4>Reports per day</h4><div class="cols">${d.perDay.length ? d.perDay.map(x => `<div class="col" title="${esc(x.d)}: ${x.n}"><i style="height:${Math.max(3, x.n / maxDay * 100)}%"></i><small>${esc(x.d.slice(5))}</small></div>`).join('') : '<p class="muted xs">No reports in this period.</p>'}</div></div>
    <div class="card wide"><h4>Busiest hours <span class="muted xs">bars are volume, dots are average claim time</span></h4><div class="cols hours">${d.hours.map(x => `<div class="col" title="${x.h}:00 · ${x.n} reports${x.claim ? ' · claimed in ' + fmtLong(x.claim) : ''}"><i style="height:${Math.max(2, x.n / maxHr * 100)}%"></i>${x.claim ? `<em style="bottom:${Math.min(95, x.claim / 600 * 100)}%"></em>` : ''}<small>${x.h % 3 === 0 ? x.h : ''}</small></div>`).join('')}</div></div>
    <div class="card"><h4>By category</h4>${d.byCategory.map(x => `<div class="hbar"><span>${esc(x.label)}</span><div class="track"><i style="width:${x.n / maxCat * 100}%;background:${esc(x.color)}"></i></div><b class="mono">${x.n}</b></div>`).join('') || '<p class="muted xs">Nothing yet.</p>'}</div>
    <div class="card"><h4>Verdicts</h4>${d.byVerdict.map(x => `<div class="hbar"><span>${esc(x.label)}</span><div class="track"><i style="width:${x.n / maxVer * 100}%;background:${esc(x.color)}"></i></div><b class="mono">${x.n}</b></div>`).join('') || '<p class="muted xs">Nothing yet.</p>'}</div>
    <div class="card wide"><h4>Most reported players</h4>${d.repeaters.length ? `<table class="tbl"><tr><th>Player</th><th>Reports</th><th>Risk</th><th></th></tr>${d.repeaters.map(r => `<tr><td>${esc(r.name)}</td><td class="mono">${r.n}</td><td>${bar(r.risk || 0, 100, (r.risk || 0) > 50 ? 'bad' : '')}</td><td>${r.pub ? `<button class="btn small" data-act="plOpen" data-arg="${esc(r.pub)}">File</button>` : ''}</td></tr>`).join('')}</table>` : '<p class="muted xs">Nobody stands out.</p>'}</div></div>`;
}

function inHeat() {
  return `<div class="card"><h4>Where reports are filed</h4><div class="heatwrap"><canvas id="heat-cv"></canvas></div><p class="muted xs">Each glow is a place where players filed reports. Drop a <code>map.jpg</code> in the html folder and set its bounds on the Recorder page to see the real map behind it.</p></div>`;
}
function drawHeat(d) {
  const cv = $('#heat-cv'); if (!cv) return;
  const W = cv.clientWidth || 700, H = Math.round(W * 0.6), dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, W, H);
  const pts = d.heat || [];
  if (!pts.length) { g.fillStyle = '#64748b'; g.font = '13px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('No located reports yet.', W / 2, H / 2); return; }
  const m = S.settings.mapImage ? { x0: S.settings.mapMinX, x1: S.settings.mapMaxX, y0: S.settings.mapMinY, y1: S.settings.mapMaxY } :
    { x0: Math.min(...pts.map(p => p[0])) - 50, x1: Math.max(...pts.map(p => p[0])) + 50, y0: Math.min(...pts.map(p => p[1])) - 50, y1: Math.max(...pts.map(p => p[1])) + 50 };
  const draw = () => {
    g.globalCompositeOperation = 'lighter';
    pts.forEach(p => {
      const X = (p[0] - m.x0) / (m.x1 - m.x0) * W, Y = H - (p[1] - m.y0) / (m.y1 - m.y0) * H;
      const gr = g.createRadialGradient(X, Y, 0, X, Y, 26); gr.addColorStop(0, 'rgba(255,122,26,.55)'); gr.addColorStop(1, 'rgba(255,122,26,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(X, Y, 26, 0, 6.283); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
  };
  if (S.settings.mapImage) { const i = new Image(); i.onload = () => { g.globalAlpha = .5; g.drawImage(i, 0, 0, W, H); g.globalAlpha = 1; draw(); }; i.onerror = draw; i.src = 'map.jpg'; } else draw();
}

function inStaff(d) {
  const s = d.staff || [];
  return `<div class="card"><h4>Staff, this ${IN.days <= 1 ? 'day' : IN.days <= 7 ? 'week' : IN.days <= 30 ? 'month' : 'period'}</h4>${s.length ? `<table class="tbl"><tr><th>Staff</th><th>Closed</th><th>Avg claim</th><th>Avg close</th><th>Rating</th></tr>${s.map(r => `<tr><td>${esc(r.name)}</td><td class="mono">${r.n}</td><td class="mono">${r.claim ? fmtLong(r.claim) : '-'}</td><td class="mono">${r.resolve ? fmtLong(r.resolve) : '-'}</td><td>${r.rating ? `<span class="stars">${stars(Math.round(r.rating))}</span> <small class="mono">${r.rating}</small>` : '<span class="muted">-</span>'}</td></tr>`).join('')}</table>` : '<p class="muted xs">Nobody has closed a case yet.</p>'}</div>`;
}

// ====================================================================== players
const PL = { q: '', list: [], sel: null, file: null };

PAGES.players = {
  title: 'Players', sub: 'Trust, risk and history',
  async render(el) {
    const ex = takeExtra();
    el.innerHTML = '<div class="players"><div class="pl-list"><div class="search-box">' + ico('search', 14) + '<input type="text" placeholder="Name or id" data-input="plSearch"></div><div id="pl-rows"></div></div><div class="pl-file" id="pl-file"></div></div>';
    await plLoad();
    if (ex && ex.pub) await plOpen(ex.pub); else plFileDraw();
  },
};
async function plLoad() {
  const r = await req('staffPlayers', { q: PL.q });
  PL.list = r.ok ? r.payload : [];
  const rows = $('#pl-rows'); if (!rows) return;
  rows.innerHTML = PL.list.length ? PL.list.map(p => `<button class="pl-row ${PL.sel === p.pub ? 'sel' : ''}" data-act="plOpen" data-arg="${esc(p.pub)}"><div class="avatar">${esc((p.name || '?')[0])}</div><div class="grow"><b>${esc(p.name)}</b><small class="muted">id ${p.id}${p.staff ? ' · staff' : ''}</small></div>${p.watch ? `<span class="pill amber">${ico('eye', 11)}</span>` : ''}<div class="mini-m"><span class="${p.trust < 40 ? 'bad' : ''}">T ${p.trust}</span><span class="${p.risk > 50 ? 'bad' : ''}">R ${Math.round(p.risk)}</span></div></button>`).join('') : '<p class="muted xs pad">Nobody online matches.</p>';
}
let plT = 0;
INPUT.plSearch = el => { clearTimeout(plT); plT = setTimeout(() => { PL.q = el.value; plLoad(); }, 250); };
async function plOpen(pub) {
  PL.sel = pub;
  const r = await req('playerFile', { pub });
  if (!r.ok) { toast(r.payload, 'error'); return; }
  PL.file = r.payload; plLoad(); plFileDraw();
}
ACT.plOpen = async el => { if (S.page !== 'players') { goPage('players', { pub: el.dataset.arg }); return; } plOpen(el.dataset.arg); };

function plFileDraw() {
  const el = $('#pl-file'); if (!el) return;
  const p = PL.file;
  if (!p) { el.innerHTML = `<div class="dk-none">${ico('users', 40)}<b>Pick a player</b><span class="muted">Trust follows the person, not the character.</span></div>`; return; }
  const admin = S.me && S.me.isAdmin;
  el.innerHTML = `<div class="card profile"><div class="ph"><div class="avatar big">${esc((p.name || '?')[0])}</div><div class="grow"><h3>${esc(p.name)}</h3><span class="muted xs">${p.online ? 'online · id ' + p.id : 'offline'}${p.openAgainst ? ` · ${p.openAgainst} open case${p.openAgainst > 1 ? 's' : ''} against` : ''}</span></div>
    <button class="btn ${p.watch ? 'primary' : ''}" data-act="plWatch">${ico('eye', 14)} ${p.watch ? 'Watching' : 'Watch'}</button></div>
    ${p.watch && p.watchNote ? `<p class="muted xs">Note: ${esc(p.watchNote)}</p>` : ''}
    <div class="meters"><div><small>Trust</small><b class="mono">${p.trust}</b>${bar(p.trust, 100, p.trust < 40 ? 'bad' : 'good')}</div><div><small>Risk</small><b class="mono">${Math.round(p.risk || 0)}</b>${bar(p.risk || 0, 100, (p.risk || 0) > 50 ? 'bad' : '')}</div></div>
    <p class="muted xs">Filed ${p.filed} · valid ${p.valid} · false ${p.falsed} · reported ${p.against}×${p.step && p.step.label ? ` · next step: <b>${esc(p.step.label)}</b>` : ''}</p>
    ${p.blocked ? `<div class="banner warnb">${ico('shield', 16)}<div class="grow">Blocked from reporting until ${clock(p.blocked)}</div></div>` : ''}
    ${admin ? `<div class="pl-tools"><button class="btn small" data-act="plStrike">Add strike</button><button class="btn small" data-act="plTrust">Set trust</button><button class="btn small danger" data-act="plClear">Clear strikes</button></div>` : ''}
    <h5>Strikes</h5>${(p.strikes || []).length ? p.strikes.map(s => `<div class="strike"><b class="mono">+${s.points}</b><span>${esc(s.label)}${s.note ? ' · ' + esc(s.note) : ''}</span><small class="muted">${ago(s.created)}</small></div>`).join('') : '<p class="muted xs">None.</p>'}
    <h5>Reports against them</h5>${(p.cases || []).length ? p.cases.map(x => `<button class="strike link" data-act="plCase" data-arg="${x.id}"><b>#${x.id}</b><span>${esc(catOf(x.category).label)}</span><small class="muted">${esc(x.verdict || x.status)}</small></button>`).join('') : '<p class="muted xs">None.</p>'}</div>`;
}
ACT.plCase = el => goPage('desk', { case: +el.dataset.arg });
ACT.plWatch = () => {
  const p = PL.file;
  if (p.watch) { run('watch', { pub: p.pub, on: false }).then(r => r.ok && plOpen(p.pub)); return; }
  modal(`<h3>Watch ${esc(p.name)}</h3><p class="muted">Their next reports get a priority bump and a mark in the queue.</p><div class="field"><label>Note for staff</label><input type="text" id="pl-note" maxlength="120"></div><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="plWatchGo">Watch</button></div>`);
};
ACT.plWatchGo = async () => { const r = await run('watch', { pub: PL.file.pub, on: true, note: $('#pl-note').value }); if (r.ok) { closeModal(); plOpen(PL.file.pub); } };
ACT.plStrike = () => modal(`<h3>Add strike</h3><div class="field"><label>Points (1 to 500)</label><input type="number" id="pl-pts" min="1" max="500" value="10"></div><div class="field"><label>Reason</label><input type="text" id="pl-snote" maxlength="120"></div><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="plStrikeGo">Add</button></div>`);
ACT.plStrikeGo = async () => { const r = await run('strike', { pub: PL.file.pub, points: +$('#pl-pts').value, note: $('#pl-snote').value }, 'Strike added.'); if (r.ok) { closeModal(); plOpen(PL.file.pub); } };
ACT.plTrust = () => modal(`<h3>Set trust</h3><div class="field"><label>0 to 100</label><input type="number" id="pl-tv" min="0" max="100" value="${PL.file.trust}"></div><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="plTrustGo">Save</button></div>`);
ACT.plTrustGo = async () => { const r = await run('trust', { pub: PL.file.pub, value: +$('#pl-tv').value }, 'Saved.'); if (r.ok) { closeModal(); plOpen(PL.file.pub); } };
ACT.plClear = () => confirmBox('Clear all strikes?', 'Their risk score goes back to zero.', 'Clear', async () => { const r = await run('clearStrikes', { pub: PL.file.pub }, 'Cleared.'); if (r.ok) plOpen(PL.file.pub); }, true);

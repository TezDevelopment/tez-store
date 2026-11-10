// Mock of the game side: answers every NUI request with believable data.
(function () {
  const now = Math.floor(Date.now() / 1000);
  const SCHEMA = window.__SCHEMA__;
  const settings = Object.assign({}, SCHEMA.values, { brand: 'Blackbox Reports', themeColor: '#2f6df6', currency: '$', recSeconds: 60, recInterval: 1, fixesOn: true, toolGoto: true, toolBring: true, toolSpectate: true });
  const me = { isStaff: true, isAdmin: true, duty: true, name: 'Admin Amy', pub: 'p_amy' };
  const cats = settings.categories;
  // a 60 second chase: accused ramming the reporter
  function trail(x0, y0, dx, dy, sp, veh, hp) { const out = []; for (let i = 0; i <= 60; i += 1) { const t = -60 + i; out.push([t, x0 + dx * i + Math.sin(i / 7) * 3, y0 + dy * i + Math.cos(i / 9) * 2, 30, (90 + i * 2) % 360, hp(i), sp, veh]); } return out; }
  const take = { by: 'Rita Reporter', span: 60, closest: { t: -9, d: 1.8 }, left: null,
    actors: {
      p_rita: { name: 'Rita Reporter', role: 'reporter', trail: trail(-120, 40, 3.4, 0.5, 45, 0, i => i > 52 ? 140 : 200) },
      p_alex: { name: 'Alex Accused', role: 'accused', trail: trail(-300, 60, 5.6, 0.2, 80, 1, i => 200) },
      p_wendy: { name: 'Wendy Witness', role: 'nearby', trail: trail(-60, 90, 0.5, -0.1, 3, 0, i => 200) } },
    events: [{ t: -9, k: 'veh', who: 'p_alex', x: -80, y: 55, z: 30, w: 'Sultan' }, { t: -8.4, k: 'hurt', who: 'p_rita', other: 'p_alex', x: -78, y: 56, z: 30 }, { t: -3, k: 'shot', who: 'p_rita', x: -30, y: 62, z: 30, w: 'Pistol' }, { t: -2.4, k: 'hit', who: 'p_rita', other: 'p_alex', x: -28, y: 62, z: 30 }],
    flags: [{ t: -31, who: 'p_alex', k: 'fastfoot', v: 71 }] };
  const row = (id, o) => Object.assign({ id, status: 'open', category: 'vdm', title: 'Vehicle rammed me on the highway', priority: 62, band: 2, escalated: false, panic: false, reporter: 'Rita Reporter', anon: false, target: 'Alex Accused', source: 'player', merged: 1, created: now - 190, claimed: '', street: 'Great Ocean Hwy', verdict: null, rating: 0 }, o || {});
  const list = [row(14, { priority: 91, band: 1, panic: true, category: 'rdm', title: 'Shot me twice with no roleplay', created: now - 420, merged: 2 }), row(15), row(16, { category: 'cheating', title: 'Flying and teleporting around Legion', priority: 74, created: now - 640, escalated: true, target: 'Zed Hacker', merged: 0 }), row(17, { category: 'harass', band: 3, priority: 38, title: 'Slurs in voice chat', created: now - 75, target: 'Loud Larry', merged: 0 }), row(18, { category: 'failrp', band: 4, priority: 18, title: 'Used phone while cuffed', created: now - 30, merged: 0, target: 'Ned Newbie' })];
  const detail = Object.assign(row(15, { status: 'claimed', claimed: 'Admin Amy' }), {
    body: 'He came out of nowhere in a Sultan and hit me twice at the intersection by the pier, then drove off. My friend Wendy saw it.', answers: [{ q: 'Where did it happen?', a: 'Pier intersection' }, { q: 'Did you roleplay beforehand?', a: 'No' }], links: ['https://streamable.com/abc123'],
    why: [{ k: 'cat', l: 'VDM / Vehicle ramming', p: 24 }, { k: 'trust', l: 'Trusted reporter', p: 8 }, { k: 'pile', l: '2 people reported this player', p: 10 }, { k: 'risk', l: 'Repeat offender', p: 14 }, { k: 'evidence', l: 'Recorder shows combat', p: 6 }, { k: 'age', l: 'Waiting 3 min', p: 3 }, { k: 'x', l: 'Low-risk area', p: -3 }],
    x: -80, y: 55, z: 30, mine: true, canAct: true, isAdmin: true, claimedAt: now - 60,
    others: [{ name: 'Wendy Witness', anon: false, body: 'Saw him ram Rita near the pier.', trust: 72, at: now - 120 }],
    reporterProfile: { name: 'Rita Reporter', online: true, id: 2, trust: 78, risk: 0, filed: 12, valid: 9, falsed: 1, against: 0, strikes: [], cases: [] },
    targetProfile: { name: 'Alex Accused', online: true, id: 3, trust: 61, risk: 54, filed: 1, valid: 0, falsed: 0, against: 6, watch: true, step: { label: 'Kick' }, strikes: [{ points: 12, label: 'Kick', note: 'RDM', created: now - 86400 * 3 }, { points: 8, label: 'Warning', note: '', created: now - 86400 * 9 }], cases: [{ id: 9, category: 'rdm', status: 'resolved', verdict: 'kick' }, { id: 11, category: 'vdm', status: 'resolved', verdict: 'warn' }] },
    msgs: { reporter: [{ role: 'player', name: 'Rita Reporter', text: 'He is still driving around near the pier.', at: now - 90 }, { role: 'staff', name: 'Admin Amy', text: 'Hi! I am looking into your report now.', at: now - 50 }], accused: [], staff: [{ role: 'staff', name: 'Mod Max', text: 'Same guy as case #11.', at: now - 40 }] },
    events: [{ kind: 'open', text: 'Report filed', actor: 'Rita Reporter', at: now - 190 }, { kind: 'witness', text: 'Wendy Witness gave a statement', actor: '', at: now - 150 }, { kind: 'claim', text: 'Claimed', actor: 'Admin Amy', at: now - 60 }],
    witnesses: [{ name: 'Wendy Witness', role: 'witness', text: 'Yes, he drove straight at her.', at: now - 150 }], evidence: { takes: [Object.assign({}, take, { hasGhost: true })] } });
  const days = []; for (let i = 13; i >= 0; i--) days.push({ d: new Date((now - i * 86400) * 1000).toISOString().slice(0, 10), n: 4 + Math.round(Math.abs(Math.sin(i)) * 11) });
  const insight = { days: 14, total: 118, closed: 104, avgClaim: 142, avgResolve: 780, avgRating: 4.4, escalated: 7, perDay: days,
    byCategory: cats.slice(0, 6).map((c, i) => ({ id: c.id, label: c.label, color: c.color, n: 40 - i * 6 })), byVerdict: settings.verdicts.slice(0, 6).map((v, i) => ({ id: v.id, label: v.label, color: v.color, n: 30 - i * 4 })),
    hours: Array.from({ length: 24 }, (_, h) => ({ h, n: Math.round(2 + 14 * Math.exp(-Math.pow((h - 21) / 4, 2))), claim: h > 10 ? 60 + h * 6 : 0 })),
    heat: Array.from({ length: 70 }, (_, i) => [-300 + Math.sin(i) * 120 + (i % 7) * 40, 100 + Math.cos(i * 1.3) * 90 + (i % 5) * 30]),
    repeaters: [{ name: 'Alex Accused', n: 6, pub: 'p_alex', risk: 54 }, { name: 'Zed Hacker', n: 4, pub: 'p_zed', risk: 72 }], staff: [{ name: 'Admin Amy', n: 41, claim: 90, resolve: 600, rating: 4.7, rated: 20 }, { name: 'Mod Max', n: 33, claim: 160, resolve: 900, rating: 4.1, rated: 12 }] };
  const players = [{ pub: 'p_alex', name: 'Alex Accused', id: 3, trust: 61, risk: 54, watch: true, staff: false }, { pub: 'p_rita', name: 'Rita Reporter', id: 2, trust: 78, risk: 0, watch: false, staff: false }, { pub: 'p_max', name: 'Mod Max', id: 4, trust: 90, risk: 0, watch: false, staff: true }];
  const R = {
    form: { nearby: [{ pub: 'p_alex', name: 'Alex Accused', id: 3, dist: 12 }, { pub: 'p_wendy', name: 'Wendy Witness', id: 4, dist: 31 }], left: [{ pub: 'p_ned', name: 'Ned Newbie', ago: 22 }], duty: 2, open: 1, trust: 78, eta: 140, killer: { pub: 'p_alex', name: 'Alex Accused', ago: 14, weapon: 'Pistol' } },
    search: [], suggest: { category: 'vdm' }, file: { id: 21, merged: false, duty: 2, eta: 140 },
    mine: { mine: [{ id: 15, status: 'claimed', stage: 2, category: 'vdm', title: 'Vehicle rammed me', created: now - 190, pos: 0, eta: 0 }, { id: 12, status: 'open', stage: 1, category: 'rdm', title: 'Shot me with no RP', created: now - 50, pos: 3, eta: 200 }, { id: 8, status: 'resolved', stage: 3, category: 'harass', title: 'Harassment', created: now - 86400 }], about: [], duty: 2 },
    thread: { channel: 'reporter', open: true, case: { id: 15, category: 'vdm', status: 'claimed', stage: 2, panic: false, body: detail.body, target: 'Alex Accused', merged: 1, canRate: false, rating: 0 }, msgs: detail.msgs.reporter },
    deskList: { list, meta: { counts: { queue: 4, mine: 1, active: 2 }, duty: 2, eta: 140, page: 1, per: 40, onDuty: true } }, deskCase: detail, dutyList: [{ pub: 'p_max', name: 'Mod Max' }],
    insight, staffPlayers: players, playerFile: detail.targetProfile && Object.assign({}, detail.targetProfile, { pub: 'p_alex', openAgainst: 2 }),
    'admin.open': { pages: SCHEMA.pages, fields: SCHEMA.fields, values: SCHEMA.values, secretSet: {}, last: { themeColor: { by: 'Admin Amy', at: now - 3600 } }, status: { version: '1.0.0', online: 14, duty: 2, framework: 'qbcore', warnings: ['No ban command is set. Ban verdicts will only kick the player.', 'Nobody is on duty right now.'] } },
    'admin.history': [{ k: 'themeColor', old_v: '#3b82f6', new_v: '#ff7a1a', admin: 'Admin Amy', created: now - 3600 }], 'admin.logs': { rows: [{ category: 'case', message: 'Admin Amy claimed #15', created: now - 60 }, { category: 'settings', message: 'Admin Amy changed themeColor', created: now - 3600 }], page: 1, per: 20, total: 2 }, 'admin.players': players };
  window.MOCK = { settings, me, detail };
  window.fetch = async (url, opts) => {
    const name = String(url).split('/').pop(); const body = JSON.parse((opts && opts.body) || '{}'); let out = {};
    if (name === 'req') { const a = body.action; const v = R[a]; out = v !== undefined ? { ok: true, payload: v } : { ok: true, payload: {} }; window.__reqs = (window.__reqs || []).concat(a); }
    return { json: async () => out };
  };
})();

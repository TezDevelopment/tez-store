'use strict';
// The replay theatre: scrub through the last minute around a report on a 2D map.
// Trails come from the server's own recorder, so nobody can edit them. Events come from the reporter's game.

const Replay = (() => {
  const COLORS = { reporter: '#38bdf8', accused: '#ef4444' };
  const OTHER = ['#a3e635', '#c084fc', '#fbbf24', '#2dd4bf', '#f472b6', '#94a3b8', '#fb923c', '#60a5fa'];
  const EVCOL = { shot: '#fde047', hit: '#4ade80', hurt: '#f87171', dead: '#ef4444', veh: '#60a5fa', kill: '#ef4444' };
  const EVTXT = { shot: 'fired', hit: 'hit', hurt: 'was hurt', dead: 'died', veh: 'vehicle', kill: 'killed' };

  let st = null, raf = 0, img = null;

  function stop() { cancelAnimationFrame(raf); raf = 0; if (st) st.alive = false; document.removeEventListener('keydown', onKey); }

  function onKey(e) {
    if (!st || !st.alive || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft') { seek(st.t - (e.shiftKey ? 5 : 1)); }
    else if (e.key === 'ArrowRight') { seek(st.t + (e.shiftKey ? 5 : 1)); }
  }

  // ------------------------------------------------------------ data
  function prep(take) {
    const actors = [];
    let oc = 0;
    Object.keys(take.actors || {}).forEach(pub => {
      const a = take.actors[pub];
      const color = COLORS[a.role] || OTHER[oc++ % OTHER.length];
      actors.push({ pub, name: a.name, role: a.role, left: a.left, color, show: true, tr: a.trail.map(p => ({ t: p[0], x: p[1], y: p[2], z: p[3], h: p[4], hp: p[5], sp: p[6], v: p[7] })) });
    });
    actors.sort((a, b) => ({ reporter: 0, accused: 1, nearby: 2 }[a.role] - { reporter: 0, accused: 1, nearby: 2 }[b.role]));
    let minT = 0;
    actors.forEach(a => { if (a.tr.length) minT = Math.min(minT, a.tr[0].t); });
    return { actors, minT: Math.min(minT, -5), events: take.events || [], flags: take.flags || [], closest: take.closest, left: take.left, span: take.span };
  }
  const nameOf = pub => { const a = st.data.actors.find(x => x.pub === pub); return a ? a.name : 'someone'; };

  function at(a, t) {
    const tr = a.tr;
    if (!tr.length || t < tr[0].t - 0.01) return null;
    const last = tr[tr.length - 1];
    if (t >= last.t) return Object.assign({ gone: a.left && t > last.t + 1 }, last);
    let i = 1; while (i < tr.length && tr[i].t < t) i++;
    const p = tr[i - 1], q = tr[i], f = q.t === p.t ? 0 : (t - p.t) / (q.t - p.t);
    let dh = ((q.h - p.h + 540) % 360) - 180;
    return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, z: p.z + (q.z - p.z) * f, h: (p.h + dh * f + 360) % 360, hp: f < .5 ? p.hp : q.hp, sp: p.sp + (q.sp - p.sp) * f, v: f < .5 ? p.v : q.v };
  }

  // ------------------------------------------------------------ view
  function bounds() {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    st.data.actors.forEach(a => { if (!a.show) return; a.tr.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }); });
    if (x0 > x1) { x0 = st.c.x - 40; x1 = st.c.x + 40; y0 = st.c.y - 40; y1 = st.c.y + 40; }
    return { x0, x1, y0, y1 };
  }
  function fit() {
    const b = bounds(), W = st.cv.clientWidth, H = st.cv.clientHeight;
    const w = Math.max(80, (b.x1 - b.x0) * 1.35), h = Math.max(60, (b.y1 - b.y0) * 1.35);
    st.view = { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, s: Math.min(W / w, H / h) };
  }
  const sx = x => st.cv.clientWidth / 2 + (x - st.view.cx) * st.view.s;
  const sy = y => st.cv.clientHeight / 2 - (y - st.view.cy) * st.view.s;

  // ------------------------------------------------------------ draw
  function draw(now) {
    if (!st || !st.alive) return;
    const cv = st.cv, W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) { raf = requestAnimationFrame(draw); return; }
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); if (!st.fitted) { fit(); st.fitted = true; } }
    const g = st.g; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = st.last ? Math.min(0.1, (now - st.last) / 1000) : 0; st.last = now;
    if (st.playing) { st.t += dt * st.speed; if (st.t >= 0) { st.t = 0; st.playing = false; syncPlay(); } syncScrub(); }

    // follow
    if (st.follow !== 'free' && st.follow !== 'fit') {
      const a = st.data.actors.find(x => x.role === st.follow); const p = a && at(a, st.t);
      if (p) { st.view.cx += (p.x - st.view.cx) * .15; st.view.cy += (p.y - st.view.cy) * .15; }
    }

    g.clearRect(0, 0, W, H);
    // background
    if (st.mapImg && st.mapImg.complete && st.mapImg.naturalWidth) {
      const m = st.map; g.globalAlpha = .55;
      g.drawImage(st.mapImg, sx(m.minX), sy(m.maxY), (m.maxX - m.minX) * st.view.s, (m.maxY - m.minY) * st.view.s); g.globalAlpha = 1;
    }
    drawGrid(g, W, H);

    // trails
    st.data.actors.forEach(a => {
      if (!a.show || a.tr.length < 2) return;
      g.lineWidth = 2; g.lineJoin = 'round';
      const cur = at(a, st.t);
      g.strokeStyle = a.color; g.globalAlpha = .9; g.beginPath();
      let started = false;
      for (const p of a.tr) { if (p.t > st.t) break; const X = sx(p.x), Y = sy(p.y); if (!started) { g.moveTo(X, Y); started = true; } else g.lineTo(X, Y); }
      if (cur && started) g.lineTo(sx(cur.x), sy(cur.y));
      g.stroke();
      g.globalAlpha = .22; g.setLineDash([4, 5]); g.beginPath(); started = false;
      if (cur) { g.moveTo(sx(cur.x), sy(cur.y)); started = true; }
      for (const p of a.tr) { if (p.t <= st.t) continue; const X = sx(p.x), Y = sy(p.y); if (!started) { g.moveTo(X, Y); started = true; } else g.lineTo(X, Y); }
      g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    });

    // distance line reporter <-> accused
    const rep = st.data.actors.find(a => a.role === 'reporter'), acc = st.data.actors.find(a => a.role === 'accused');
    const pr = rep && at(rep, st.t), pa = acc && at(acc, st.t);
    if (pr && pa && rep.show && acc.show) {
      const d = Math.hypot(pr.x - pa.x, pr.y - pa.y, pr.z - pa.z);
      g.strokeStyle = d < 6 ? '#fbbf24' : 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(sx(pr.x), sy(pr.y)); g.lineTo(sx(pa.x), sy(pa.y)); g.stroke(); g.setLineDash([]);
      label(g, (sx(pr.x) + sx(pa.x)) / 2, (sy(pr.y) + sy(pa.y)) / 2 - 8, `${d.toFixed(1)} m`, d < 6 ? '#fbbf24' : '#e2e8f0');
    }

    // events and flags near the current time
    st.data.events.forEach(e => {
      const age = st.t - e.t; if (age < -0.4 || age > 2.4 || !e.x) return;
      const k = Math.max(0, age) / 2.4, X = sx(e.x), Y = sy(e.y), col = EVCOL[e.k] || '#fff';
      g.globalAlpha = 1 - k * .85; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
      g.beginPath(); g.arc(X, Y, 6 + k * 22, 0, 6.283); g.stroke();
      if (e.k === 'dead') { g.beginPath(); g.moveTo(X - 7, Y - 7); g.lineTo(X + 7, Y + 7); g.moveTo(X + 7, Y - 7); g.lineTo(X - 7, Y + 7); g.stroke(); }
      else { g.beginPath(); g.arc(X, Y, 3, 0, 6.283); g.fill(); }
      g.globalAlpha = 1;
      label(g, X, Y - 14 - k * 10, `${EVTXT[e.k] || e.k}${e.w ? ' · ' + e.w : ''}`, col);
    });
    st.data.flags.forEach(f => {
      const a = st.data.actors.find(x => x.pub === f.who); if (!a || !a.show) return;
      if (Math.abs(st.t - f.t) > 2) return;
      const p = at(a, f.t); if (!p) return;
      const X = sx(p.x), Y = sy(p.y);
      g.fillStyle = '#fb923c'; g.beginPath(); g.moveTo(X, Y - 22); g.lineTo(X - 8, Y - 8); g.lineTo(X + 8, Y - 8); g.closePath(); g.fill();
      label(g, X, Y - 28, f.k === 'jump' ? `jumped ${f.v} m` : `${f.v} km/h on foot`, '#fb923c');
    });

    // actors
    st.data.actors.forEach(a => {
      if (!a.show) return;
      const p = at(a, st.t); if (!p) return;
      const X = sx(p.x), Y = sy(p.y), dead = p.hp <= 101;
      g.globalAlpha = p.gone ? .35 : 1;
      g.fillStyle = dead ? '#111' : a.color; g.strokeStyle = dead ? '#ef4444' : '#0b0d12'; g.lineWidth = 2;
      g.beginPath();
      if (p.v) g.roundRect(X - 7, Y - 7, 14, 14, 3); else g.arc(X, Y, 7, 0, 6.283);
      g.fill(); g.stroke();
      const rad = p.h * Math.PI / 180;
      g.strokeStyle = a.color; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y); g.lineTo(X - Math.sin(rad) * 17, Y - Math.cos(rad) * 17); g.stroke();
      g.globalAlpha = 1;
      if (a.role !== 'nearby' || a.sel) label(g, X, Y + 21, `${a.name}${p.gone ? ' (left)' : ''}${dead ? ' (down)' : ''}`, a.color);
    });

    // scale bar
    const step = niceStep(80 / st.view.s), bw = step * st.view.s;
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(16, H - 16); g.lineTo(16 + bw, H - 16); g.moveTo(16, H - 20); g.lineTo(16, H - 12); g.moveTo(16 + bw, H - 20); g.lineTo(16 + bw, H - 12); g.stroke();
    label(g, 16 + bw / 2, H - 26, `${step} m`, '#cbd5e1');

    if (now - st.hudAt > 140) { st.hudAt = now; updateSide(); }
    raf = requestAnimationFrame(draw);
  }
  function niceStep(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; }
  function label(g, x, y, text, col) {
    g.font = '600 11px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(8,10,14,.9)'; g.strokeText(text, x, y); g.fillStyle = col; g.fillText(text, x, y);
  }
  function drawGrid(g, W, H) {
    const step = niceStep(60 / st.view.s), v = st.view;
    const x0 = v.cx - W / 2 / v.s, x1 = v.cx + W / 2 / v.s, y0 = v.cy - H / 2 / v.s, y1 = v.cy + H / 2 / v.s;
    g.lineWidth = 1; g.strokeStyle = 'rgba(148,163,184,.10)'; g.fillStyle = 'rgba(148,163,184,.45)'; g.font = '10px ui-monospace, Menlo, monospace'; g.textAlign = 'left';
    g.beginPath();
    for (let x = Math.ceil(x0 / step) * step; x < x1; x += step) { g.moveTo(Math.round(sx(x)) + .5, 0); g.lineTo(Math.round(sx(x)) + .5, H); }
    for (let y = Math.ceil(y0 / step) * step; y < y1; y += step) { g.moveTo(0, Math.round(sy(y)) + .5); g.lineTo(W, Math.round(sy(y)) + .5); }
    g.stroke();
    for (let x = Math.ceil(x0 / step) * step; x < x1; x += step) g.fillText(Math.round(x), sx(x) + 3, 11);
    for (let y = Math.ceil(y0 / step) * step; y < y1; y += step) g.fillText(Math.round(y), 3, sy(y) - 3);
  }

  // ------------------------------------------------------------ controls
  function seek(t) { st.t = clamp(t, st.data.minT, 0); syncScrub(); }
  function toggle() { if (st.t >= 0) st.t = st.data.minT; st.playing = !st.playing; st.last = 0; syncPlay(); }
  function syncPlay() { const b = $('#rep-play'); if (b) b.innerHTML = ico(st.playing ? 'pause' : 'play', 16); }
  function syncScrub() { const s = $('#rep-scrub'); if (s) s.value = Math.round(st.t * 10); const r = $('#rep-time'); if (r) r.textContent = (st.t >= 0 ? 'report sent' : `${Math.abs(st.t).toFixed(1)} s before`); }
  function updateSide() {
    const rep = st.data.actors.find(a => a.role === 'reporter'), pr = rep && at(rep, st.t);
    st.data.actors.forEach((a, i) => {
      const el = document.getElementById('rep-live-' + i); if (!el) return;
      const p = at(a, st.t);
      if (!p) { el.textContent = 'not recorded yet'; return; }
      const d = pr && a !== rep ? Math.hypot(p.x - pr.x, p.y - pr.y, p.z - pr.z) : null;
      el.textContent = `${Math.round(p.sp)} km/h · hp ${Math.max(0, p.hp - 100)}${p.v ? ' · vehicle' : ''}${d != null ? ` · ${d.toFixed(0)} m away` : ''}`;
    });
  }

  // ------------------------------------------------------------ mount
  function sideHtml() {
    const d = st.data;
    const ev = d.events.slice().sort((a, b) => a.t - b.t);
    return `${st.takes.length > 1 ? `<div class="mini">Angle</div><div class="seg">${st.takes.map((t, i) => `<button class="${i === st.take ? 'on' : ''}" data-act="repTake" data-i="${i}">${esc(t.by || 'Take ' + (i + 1))}</button>`).join('')}</div>` : ''}
      ${d.left ? `<div class="banner warnb">${ico('door', 18)}<div class="grow"><b>${esc(d.left.name)}</b> left the server ${d.left.ago} s before the report${d.left.reason ? ` (${esc(d.left.reason)})` : ''}.</div></div>` : ''}
      ${d.closest ? `<button class="banner info" data-act="repSeek" data-t="${d.closest.t}">${ico('crosshair', 18)}<div class="grow">Closest approach <b>${d.closest.d} m</b> at ${Math.abs(d.closest.t)} s before. Jump there.</div></button>` : ''}
      <div class="mini">Players in the scene</div>
      ${d.actors.map((a, i) => `<div class="actor"><button class="eye ${a.show ? 'on' : ''}" data-act="repShow" data-i="${i}" style="--c:${a.color}"></button><div class="grow"><b style="color:${a.color}">${esc(a.name)}</b> <small class="muted">${a.role}</small><div class="live" id="rep-live-${i}"></div></div></div>`).join('')}
      ${d.flags.length ? `<div class="mini">Hints <span class="tipbadge">may be doors or respawns</span></div>${d.flags.map(f => `<button class="evrow" data-act="repSeek" data-t="${f.t}"><i style="background:#fb923c"></i><span><b>${esc(nameOf(f.who))}</b> ${f.k === 'jump' ? `moved ${f.v} m in one step` : `ran ${f.v} km/h on foot`}</span><small>${Math.abs(f.t).toFixed(0)} s</small></button>`).join('')}` : ''}
      <div class="mini">Events from the reporter's game</div>
      ${ev.length ? ev.map(e => `<button class="evrow" data-act="repSeek" data-t="${e.t}"><i style="background:${EVCOL[e.k] || '#fff'}"></i><span><b>${esc(nameOf(e.who))}</b> ${EVTXT[e.k] || e.k}${e.w ? ` (${esc(e.w)})` : ''}${e.other ? ` · ${esc(nameOf(e.other))}` : ''}</span><small>${Math.abs(e.t).toFixed(1)} s</small></button>`).join('') : '<p class="muted xs">No shots, hits or deaths were recorded.</p>'}`;
  }

  function ghostBtn() {
    if (!S.settings.ghostEnabled) return '';
    const t = st.takes[st.take];
    return t && t.hasGhost
      ? `<button class="btn small accent" data-act="repGhost" title="Replays this scene inside the game world with a free camera">${ico('eye', 14)} Watch in game</button>`
      : `<button class="btn small" disabled title="This take has no in-game data (recorded before ghost replay, or the recorder had no samples)">${ico('eye', 14)} Watch in game</button>`;
  }

  function mount(root, c) {
    stop();
    const takes = (c.evidence && c.evidence.takes) || [];
    if (!takes.length) { root.innerHTML = empty('No replay', 'This case has no recorder data. The category may not record, or the evidence expired.'); return; }
    st = { alive: true, takes, take: 0, c: { x: c.x, y: c.y }, t: 0, playing: false, speed: 1, follow: 'fit', hudAt: 0, last: 0, fitted: false };
    st.data = prep(takes[0]);
    st.t = st.data.minT;
    if (S.settings.mapImage) {
      st.map = { minX: S.settings.mapMinX, maxX: S.settings.mapMaxX, minY: S.settings.mapMinY, maxY: S.settings.mapMaxY };
      st.mapImg = new Image(); st.mapImg.src = 'map.jpg';
    }
    root.innerHTML = `<div class="rep"><div class="rep-main"><div class="rep-stage"><canvas id="rep-cv"></canvas>
        <div class="rep-hud"><div class="seg"><button class="on" data-act="repFollow" data-f="fit">Fit</button><button data-act="repFollow" data-f="accused">Follow accused</button><button data-act="repFollow" data-f="reporter">Follow reporter</button></div>
        <div class="seg"><button data-act="repZoom" data-z="1.3">+</button><button data-act="repZoom" data-z="0.77">-</button></div></div></div>
      <div class="rep-bar"><button class="btn primary round" id="rep-play" data-act="repPlay">${ico('play', 16)}</button><button class="btn small" data-act="repBack">-5 s</button><button class="btn small" data-act="repFwd">+5 s</button>${ghostBtn()}
        <div class="seg"><button data-act="repSpeed" data-s="0.5">0.5x</button><button class="on" data-act="repSpeed" data-s="1">1x</button><button data-act="repSpeed" data-s="2">2x</button><button data-act="repSpeed" data-s="4">4x</button></div>
        <div class="scrub"><input type="range" id="rep-scrub" min="${Math.round(st.data.minT * 10)}" max="0" step="1" value="${Math.round(st.t * 10)}" data-input="repScrub"><div class="ticks" id="rep-ticks"></div></div><span class="mono" id="rep-time"></span></div></div>
      <div class="rep-side" id="rep-side"></div></div>`;
    st.cv = $('#rep-cv'); st.g = st.cv.getContext('2d');
    drawSide(); drawTicks(); syncScrub();
    const cv = st.cv;
    cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.18 : 0.85); }, { passive: false });
    let drag = null;
    cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY }; setFollow('free'); });
    window.addEventListener('mouseup', () => { drag = null; });
    cv.addEventListener('mousemove', e => { if (!drag) return; st.view.cx -= (e.clientX - drag.x) / st.view.s; st.view.cy += (e.clientY - drag.y) / st.view.s; drag = { x: e.clientX, y: e.clientY }; });
    document.addEventListener('keydown', onKey);
    raf = requestAnimationFrame(draw);
  }
  function drawSide() { $('#rep-side').innerHTML = sideHtml(); }
  function drawTicks() {
    const d = st.data, span = -d.minT || 1;
    $('#rep-ticks').innerHTML = d.events.map(e => `<i style="left:${((e.t - d.minT) / span * 100).toFixed(2)}%;background:${EVCOL[e.k] || '#fff'}" title="${esc(EVTXT[e.k] || e.k)}"></i>`).join('')
      + (d.closest ? `<b style="left:${((d.closest.t - d.minT) / span * 100).toFixed(2)}%" title="Closest approach"></b>` : '');
  }
  function zoomAt(px, py, k) {
    const wx = st.view.cx + (px - st.cv.clientWidth / 2) / st.view.s, wy = st.view.cy - (py - st.cv.clientHeight / 2) / st.view.s;
    st.view.s = clamp(st.view.s * k, 0.02, 40);
    st.view.cx = wx - (px - st.cv.clientWidth / 2) / st.view.s; st.view.cy = wy + (py - st.cv.clientHeight / 2) / st.view.s;
  }
  function setFollow(f) {
    st.follow = f;
    $$('.rep-hud .seg:first-child button').forEach(b => b.classList.toggle('on', b.dataset.f === f));
    if (f === 'fit') fit();
  }

  ACT.repGhost = async () => { const r = await run('ghost', { id: DK.sel, take: st.take }); if (r.ok) toast('Opening the in-game replay...', 'success'); };
  ACT.repPlay = () => toggle();
  ACT.repBack = () => seek(st.t - 5);
  ACT.repFwd = () => seek(st.t + 5);
  ACT.repSpeed = el => { st.speed = +el.dataset.s; $$('.rep-bar .seg button').forEach(b => b.classList.toggle('on', b === el)); };
  ACT.repFollow = el => setFollow(el.dataset.f);
  ACT.repZoom = el => zoomAt(st.cv.clientWidth / 2, st.cv.clientHeight / 2, +el.dataset.z);
  ACT.repSeek = el => { st.playing = false; syncPlay(); seek(+el.dataset.t - 1.2); };
  ACT.repShow = el => { const a = st.data.actors[+el.dataset.i]; a.show = !a.show; el.classList.toggle('on', a.show); };
  ACT.repTake = el => { const keep = st.speed; st.take = +el.dataset.i; st.data = prep(st.takes[st.take]); st.t = st.data.minT; st.fitted = false; fit(); drawSide(); drawTicks(); $('#rep-scrub').min = Math.round(st.data.minT * 10); syncScrub(); st.speed = keep; };
  INPUT.repScrub = el => { st.playing = false; syncPlay(); st.t = +el.value / 10; const r = $('#rep-time'); if (r) r.textContent = st.t >= 0 ? 'report sent' : `${Math.abs(st.t).toFixed(1)} s before`; };

  return { mount, stop };
})();

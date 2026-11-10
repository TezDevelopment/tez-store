'use strict';
// Admin panel (/bbadmin): every setting on its own page, search, live save, change history

const AD = { data: null, dirty: {}, clear: {}, tab: 'status', search: '', logPage: 1 };
const dirtyCount = () => Object.keys(AD.dirty).length + Object.keys(AD.clear).length;
const clone = v => JSON.parse(JSON.stringify(v));
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const adField = k => AD.data.fields.find(f => f.k === k);
const curVal = f => has(AD.dirty, f.k) ? AD.dirty[f.k] : AD.data.values[f.k];

PAGES.admin = {
  title: 'Admin panel', sub: 'Changes go live for every player when you save. No restart needed.',
  async render(el) {
    if (!AD.data) {
      const r = await req('admin.open');
      if (!r.ok) { el.innerHTML = empty('No access', typeof r.payload === 'string' ? r.payload : ''); return; }
      AD.data = r.payload;
    }
    const tabs = [{ id: 'status', label: 'Status' }].concat(AD.data.pages.map(p => ({ id: p.id, label: p.label })), [{ id: '_players', label: 'Players' }, { id: '_history', label: 'Change history' }, { id: '_logs', label: 'Log history' }]);
    el.innerHTML = `<div class="admin-wrap"><div class="admin-side" style="position:sticky;top:0;align-self:flex-start;max-height:100%">${tabs.map(t => `<button class="tab ${AD.tab === t.id ? 'active' : ''}" data-act="adTab" data-arg="${t.id}">${esc(t.label)}</button>`).join('')}</div>
      <div class="admin-main"><div id="ad-body" class="admin-body"></div><div id="ad-bar"></div></div></div>`;
    await renderAdminBody(); renderBar();
  },
};
ACT.adTab = el => { AD.tab = el.dataset.arg; AD.search = ''; refreshPage(); };
async function renderAdminBody() {
  const box = $('#ad-body'); if (!box) return;
  const t = AD.tab;
  if (t === 'status') return adStatus(box);
  if (t === '_players') return adPlayers(box);
  if (t === '_history') return adHistory(box);
  if (t === '_logs') return adLogs(box);
  adSettings(box, t);
}

// ---- status
function adStatus(box) {
  const s = AD.data.status;
  box.innerHTML = `<div class="status-grid"><div class="stat"><b>${esc(s.version)}</b><span>Version</span></div><div class="stat"><b>${s.online}</b><span>Players</span></div><div class="stat"><b>${s.duty}</b><span>Staff on duty</span></div><div class="stat"><b>${esc(s.framework)}</b><span>Framework</span></div></div>
    <div class="section">Things to check</div>${s.warnings.length ? s.warnings.map(w => `<div class="warn-box">${esc(w)}</div>`).join('') : '<div class="card" style="color:#4ade80">Everything looks good.</div>'}`;
}

// ---- settings pages
function scalarControl(def, value, attrs) {
  if (def.t === 'bool') return `<button class="toggle ${value ? 'on' : ''}" ${attrs} data-act="adBool"></button>`;
  if (def.t === 'select') return `<select ${attrs} data-change="adField">${def.opts.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  if (def.t === 'color') return `<input type="color" value="${esc(value || '#ec4899')}" ${attrs} data-change="adField">`;
  if (def.t === 'int' || def.t === 'float') return `<input type="number" step="${def.t === 'int' ? 1 : 'any'}" ${def.min != null ? `min="${def.min}"` : ''} ${def.max != null ? `max="${def.max}"` : ''} value="${esc(value)}" ${attrs} data-input="adField">`;
  if (def.t === 'list') return `<textarea rows="3" placeholder="One per line" ${attrs} data-input="adField">${esc((value || []).join('\n'))}</textarea>`;
  return `<input type="text" value="${esc(value)}" ${def.max ? `maxlength="${def.max}"` : ''} ${attrs} data-input="adField">`;
}
function objectsEditor(f) {
  const list = curVal(f) || [], max = f.max || 100;
  return `<div class="objs">${list.map((rec, i) => `<div class="obj-card"><div class="obj-head"><b>${esc(rec.label || rec.id || rec.name || 'Item ' + (i + 1))}</b><div class="grow"></div>
      <button class="btn tiny" data-act="adUp" data-k="${f.k}" data-i="${i}" ${i === 0 ? 'disabled' : ''}>${ico('up', 11)}</button><button class="btn tiny" data-act="adDown" data-k="${f.k}" data-i="${i}" ${i === list.length - 1 ? 'disabled' : ''}>${ico('down', 11)}</button>
      <button class="btn tiny" data-act="adDup" data-k="${f.k}" data-i="${i}" ${list.length >= max ? 'disabled' : ''}>${ico('copy', 11)}</button><button class="btn tiny danger" data-act="adDel" data-k="${f.k}" data-i="${i}">${ico('trash', 11)}</button></div>
      <div class="obj-grid">${f.sub.map(s => `<div class="field ${s.t === 'list' ? 'wide' : ''}"><label>${esc(s.l)}</label>${scalarControl(s, rec[s.k], `data-k="${f.k}" data-i="${i}" data-s="${s.k}"`)}</div>`).join('')}</div></div>`).join('')}
    <button class="btn" data-act="adAdd" data-k="${f.k}" ${list.length >= max ? 'disabled' : ''}>${ico('plus', 14)} Add ${esc((f.l || '').replace(/s$/, '').toLowerCase())}</button></div>`;
}
function settingRow(f) {
  const changed = has(AD.dirty, f.k) || AD.clear[f.k], last = AD.data.last[f.k];
  const def = f.secret ? '' : (f.t === 'objects' ? `${(f.d || []).length} items` : (f.t === 'list' ? (f.d || []).join(', ') || 'empty' : String(f.d)));
  const meta = `<div class="d">${f.h ? esc(f.h) + ' ' : ''}${f.restart ? '<b>Applies after a restart.</b> ' : ''}${f.secret ? '' : `<span class="muted">Default: ${esc(def.slice(0, 60))}</span>`}${last ? ` · <span class="muted">Last changed by ${esc(last.by)}, ${ago(last.at)}</span>` : ''}</div>`;
  if (f.t === 'objects') return `<div class="setting wide ${changed ? 'changed' : ''}" data-key="${esc(f.k)}"><div class="row-flex"><div class="grow"><div class="t">${esc(f.l)}</div>${meta}</div><button class="btn tiny ghost" data-act="adResetOne" data-k="${f.k}">Reset</button></div>${objectsEditor(f)}</div>`;
  let ctl;
  if (f.t === 'secret') {
    const set = AD.data.secretSet[f.k] && !AD.clear[f.k];
    ctl = `<input type="password" autocomplete="off" placeholder="${set ? 'Saved (type to replace)' : 'Not set'}" value="${esc(AD.dirty[f.k] || '')}" data-k="${esc(f.k)}" data-input="adField">${AD.data.secretSet[f.k] ? `<button class="btn tiny danger" data-act="adSecretClear" data-arg="${esc(f.k)}">${AD.clear[f.k] ? 'Undo' : 'Remove'}</button>` : ''}`;
  } else ctl = scalarControl(f, curVal(f), `data-k="${esc(f.k)}"`);
  return `<div class="setting ${changed ? 'changed' : ''}" data-key="${esc(f.k)}"><div><div class="t">${esc(f.l)}</div>${meta}</div><div class="ctl">${ctl}${f.secret ? '' : `<button class="btn tiny ghost" data-act="adResetOne" data-k="${f.k}" title="Reset to default">${ico('undo', 11)}</button>`}</div></div>`;
}
function adSettings(box, page) {
  const q = AD.search.toLowerCase();
  const fields = AD.data.fields.filter(f => q ? (f.l + ' ' + (f.h || '') + ' ' + f.k).toLowerCase().includes(q) : f.p === page);
  const pg = AD.data.pages.find(p => p.id === page);
  box.innerHTML = `<div class="toolbar"><div class="search-box">${ico('search', 16)}<input id="ad-search" type="text" placeholder="Search every setting on every page" value="${esc(AD.search)}" data-input="adSearch"></div>${!q ? '<button class="btn small ghost" data-act="adDefaults">Reset page to defaults</button>' : ''}</div>
    <div class="card"><h3>${q ? 'Search results' : esc(pg ? pg.label : '')}</h3>${fields.length ? fields.map(settingRow).join('') : '<p class="muted">No settings match.</p>'}
    ${page === 'logs' && !q ? `<div class="row-flex wrap" style="margin-top:14px"><button class="btn small" data-act="adTest" data-arg="webhook">Test Discord</button><button class="btn small" data-act="adTest" data-arg="digest">Send digest now</button><span class="muted xs">Save first. Tests use the saved webhook.</span></div>` : ''}</div>`;
}
INPUT.adSearch = el => { AD.search = el.value; adSettings($('#ad-body'), AD.tab); const i = $('#ad-search'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };

function adSet(k, v) {
  const f = adField(k);
  const same = f.secret ? v === '' : JSON.stringify(v) === JSON.stringify(AD.data.values[k]);
  if (same) delete AD.dirty[k]; else AD.dirty[k] = v;
  if (f.secret && v !== '') delete AD.clear[k];
  const row = document.querySelector(`.setting[data-key="${k}"]`);
  if (row) row.classList.toggle('changed', has(AD.dirty, k) || !!AD.clear[k]);
  renderBar();
}
function convert(def, el) {
  if (def.t === 'int') return el.value === '' ? NaN : Math.round(Number(el.value));
  if (def.t === 'float') return el.value === '' ? NaN : Number(el.value);
  if (def.t === 'list') return el.value.split('\n').map(s => s.trim()).filter(Boolean);
  return el.value;
}
// edits to a top-level setting or to one field of one record
function onField(el) {
  const f = adField(el.dataset.k); if (!f) return;
  if (el.dataset.i !== undefined) {
    const arr = clone(curVal(f)), def = f.sub.find(s => s.k === el.dataset.s), v = convert(def, el);
    if (typeof v === 'number' && isNaN(v)) return;
    arr[+el.dataset.i][def.k] = v; adSet(f.k, arr); return;
  }
  const v = convert(f, el); if (typeof v === 'number' && isNaN(v)) return;
  adSet(f.k, v);
}
INPUT.adField = el => onField(el);
CHANGE.adField = el => onField(el);
ACT.adBool = el => {
  const f = adField(el.dataset.k);
  if (el.dataset.i !== undefined) { const arr = clone(curVal(f)); arr[+el.dataset.i][el.dataset.s] = !arr[+el.dataset.i][el.dataset.s]; adSet(f.k, arr); el.classList.toggle('on'); }
  else { adSet(f.k, !curVal(f)); el.classList.toggle('on'); }
};
ACT.adSecretClear = el => { const k = el.dataset.arg; if (AD.clear[k]) delete AD.clear[k]; else { AD.clear[k] = true; delete AD.dirty[k]; } adSettings($('#ad-body'), AD.tab); renderBar(); };

// records: add, duplicate, move, remove
function recordEdit(k, fn) { const f = adField(k), arr = clone(curVal(f)); fn(arr, f); adSet(k, arr); adSettings($('#ad-body'), AD.tab); }
ACT.adAdd = el => recordEdit(el.dataset.k, (arr, f) => { const rec = {}; f.sub.forEach(s => { rec[s.k] = clone(s.d); }); arr.push(rec); });
ACT.adDup = el => recordEdit(el.dataset.k, arr => { const i = +el.dataset.i; arr.splice(i + 1, 0, clone(arr[i])); });
ACT.adDel = el => recordEdit(el.dataset.k, arr => { arr.splice(+el.dataset.i, 1); });
ACT.adUp = el => recordEdit(el.dataset.k, arr => { const i = +el.dataset.i; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; });
ACT.adDown = el => recordEdit(el.dataset.k, arr => { const i = +el.dataset.i; [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; });
ACT.adResetOne = el => { const f = adField(el.dataset.k); adSet(f.k, clone(f.d)); adSettings($('#ad-body'), AD.tab); };
ACT.adDefaults = () => confirmBox('Reset this page?', 'Every setting on this page goes back to its default. Nothing is saved until you press Save.', 'Reset', () => {
  AD.data.fields.filter(f => f.p === AD.tab && !f.secret).forEach(f => adSet(f.k, clone(f.d)));
  adSettings($('#ad-body'), AD.tab);
});

// ---- unsaved bar, save, discard
function renderBar() {
  const bar = $('#ad-bar'); if (!bar) return;
  const n = dirtyCount();
  bar.innerHTML = n ? `<div class="admin-bar"><b>${n} unsaved change${n === 1 ? '' : 's'}</b><div class="grow"></div><button class="btn small ghost" data-act="adDiscard">Discard</button><button class="btn small primary" data-act="adSave">Save (Ctrl+S)</button></div>` : '';
}
ACT.adDiscard = () => { AD.dirty = {}; AD.clear = {}; refreshPage(); };
ACT.adSave = async () => {
  if (!dirtyCount()) return;
  const r = await run('admin.save', { values: AD.dirty, clear: Object.keys(AD.clear) }, 'Saved. It is live now.');
  if (!r.ok) return;
  AD.data = r.payload; AD.dirty = {}; AD.clear = {}; refreshPage();
};
window.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && S.menuOpen && S.page === 'admin') { e.preventDefault(); ACT.adSave(); } });
ACT.adTest = async el => {
  if (dirtyCount()) return toast('Save your changes first.', 'error');
  const r = await run('admin.test', { kind: el.dataset.arg });
  if (r.ok) toast(r.payload && r.payload.text || 'Test sent.', 'success');
};
// another admin saved: take their values, keep my unsaved edits
function onAdminExternalSave(d) {
  if (!AD.data) return;
  toast(`${d.by} saved settings.`, 'info');
  AD.data = d.payload;
  Object.keys(AD.dirty).forEach(k => { if (!adField(k).secret && JSON.stringify(AD.dirty[k]) === JSON.stringify(AD.data.values[k])) delete AD.dirty[k]; });
  if (S.menuOpen && S.page === 'admin') { const a = document.activeElement; if (!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) refreshPage(); else renderBar(); }
}
// closing with unsaved changes asks first
const _closeMenu = closeMenu;
closeMenu = function () {
  if (S.page === 'admin' && dirtyCount() > 0 && S.menuOpen) { confirmBox('Discard unsaved changes?', `You have ${dirtyCount()} unsaved change(s).`, 'Discard and close', () => _closeMenu(), true); return; }
  _closeMenu();
};

// ---- players
async function adPlayers(box) {
  const r = await req('admin.players'); if (!r.ok) { box.innerHTML = empty('Could not load', r.payload); return; }
  box.innerHTML = r.payload.length ? r.payload.map(p => `<div class="row"><div class="grow"><div class="name">${esc(p.name)} <span class="muted">#${p.id}</span> ${p.staff ? pill('staff') : ''} ${p.watch ? pill('watched', 'war') : ''}</div><div class="meta">Trust ${p.trust} · Risk ${Math.round(p.risk)}</div></div><button class="btn tiny" data-act="plOpen" data-arg="${esc(p.pub)}">File</button></div>`).join('') : empty('Nobody online', '');
}

// ---- change history and logs
async function adHistory(box) {
  const r = await req('admin.history', {}); if (!r.ok) { box.innerHTML = empty('Could not load', r.payload); return; }
  box.innerHTML = r.payload.length ? `<div class="card" style="padding:8px 14px">${r.payload.map(h => `<div class="hist-row"><div><b>${esc((adField(h.k) || {}).l || h.k)}</b> <span class="muted xs">by ${esc(h.admin)}, ${ago(h.created)}</span></div><div class="hist-diff"><span class="old">${esc(String(h.old_v || '').slice(0, 160))}</span><span class="new">${esc(String(h.new_v || '').slice(0, 160))}</span></div></div>`).join('')}</div>` : empty('No changes yet', '');
}
async function adLogs(box) {
  const page = AD.logPage || 1;
  const r = await req('admin.logs', { page }); if (!r.ok) { box.innerHTML = empty('Could not load', r.payload); return; }
  const d = r.payload, pages = Math.max(1, Math.ceil(d.total / d.per));
  box.innerHTML = (d.rows.length ? `<div class="card" style="padding:8px 14px">${d.rows.map(l => `<div class="log-row"><span class="muted">${ago(l.created)}</span><span>${pill(l.category)}</span><span style="user-select:text">${esc(l.message)}</span></div>`).join('')}</div>` : empty('No logs yet', ''))
    + `<div class="row-flex" style="justify-content:center"><button class="btn small" data-act="adLogPage" data-arg="-1" ${page <= 1 ? 'disabled' : ''}>Newer</button><span class="muted">Page ${page} of ${pages}</span><button class="btn small" data-act="adLogPage" data-arg="1" ${page >= pages ? 'disabled' : ''}>Older</button></div>`;
}
ACT.adLogPage = el => { AD.logPage = Math.max(1, (AD.logPage || 1) + parseInt(el.dataset.arg, 10)); renderAdminBody(); };

HANDLERS.adminSaved = d => onAdminExternalSave(d);

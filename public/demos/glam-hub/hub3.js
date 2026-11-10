'use strict';
// Gallery, profiles and player settings

const PALETTE = ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#94a3b8'];
function swatches(current, act) {
  return `<div class="swatches">${PALETTE.map(c => `<button class="swatch ${c === current ? 'active' : ''}" style="--c:${c}" data-act="${act}" data-arg="${c}" aria-label="${c}"></button>`).join('')}<input type="color" value="${esc(current)}" data-change="${act}Pick"></div>`;
}

// ================================================================== GALLERY
PAGES.gallery = {
  title: 'Gallery', sub: 'Photos from around the city',
  async render(el) {
    const tab = S.tab.gal || 'latest';
    el.innerHTML = `<div class="toolbar"><div class="tabs" style="margin:0">${[['latest', 'Latest'], ['popular', 'Popular'], ['saved', 'Saved'], ['mine', 'My Photos']].map(([k, v]) => `<button class="tab ${tab === k ? 'active' : ''}" data-act="galTab" data-arg="${k}">${v}</button>`).join('')}</div><div class="grow"></div><button class="btn primary" data-act="photoNew">${ico('camera', 16)} Post a photo</button></div><div id="gal-body"></div><div id="gal-more"></div>`;
    S.cache.galPage = 1; S.cache.galList = [];
    await galLoad();
  },
};
async function galLoad() {
  const r = await req('gallery', { tab: S.tab.gal || 'latest', page: S.cache.galPage }); const body = $('#gal-body'); if (!body) return;
  if (!r.ok) { body.innerHTML = empty('Not available', r.payload); return; }
  S.cache.galList = S.cache.galList.concat(r.payload.list);
  body.innerHTML = S.cache.galList.length ? `<div class="gal-grid">${S.cache.galList.map(photoCard).join('')}</div>` : empty('No photos yet', 'Be the first to post one.');
  $('#gal-more').innerHTML = r.payload.more ? '<div class="row-flex" style="justify-content:center;margin-top:12px"><button class="btn" data-act="galMore">Load more</button></div>' : '';
}
const photoCard = p => `<div class="photo" data-act="photoOpen" data-arg="${p.id}"><div class="ph-img" style="background-image:url('${esc(p.url)}')"></div><div class="ph-info"><div class="row-flex"><b class="grow">${esc(p.name)}</b><span class="muted xs">${ico('heart', 12)} ${p.likes}</span><span class="muted xs">${ico('message', 12)} ${p.comments}</span></div></div></div>`;
ACT.galTab = el => { S.tab.gal = el.dataset.arg; refreshPage(); };
ACT.galMore = () => { S.cache.galPage++; galLoad(); };
ACT.photoNew = () => {
  modal(`<h3>Post a photo</h3><div class="field"><label>Picture link (https)</label><input id="ph-url" type="url" placeholder="https://" data-input="phPrev"></div><div id="ph-prev" class="preview"></div>
    <div class="field"><label>Description</label><textarea id="ph-desc" maxlength="300"></textarea></div><div class="field"><label>Location</label><div class="row-flex"><input id="ph-loc" type="text" maxlength="100" placeholder="Where was it taken?"><button class="btn small" data-act="phLoc">${ico('mapPin', 14)} Use my location</button></div></div>
    <p class="muted xs">Approved sites: ${esc((S.settings.imageSites || []).join(', '))}</p><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="ph-go">Post</button></div>`);
  $('#ph-go').onclick = async () => { const r = await run('photoPost', { url: val('ph-url'), description: val('ph-desc'), location: val('ph-loc') }, 'Photo posted.'); if (r.ok) { closeModal(); S.tab.gal = 'mine'; refreshPage(); } };
};
INPUT.phPrev = el => { const u = el.value.trim(); $('#ph-prev').innerHTML = /^https:\/\//i.test(u) ? `<img class="chat-img" src="${esc(u)}" alt="" onerror="this.style.display='none'">` : ''; };
ACT.phLoc = async () => { const r = await post('streetName', {}); if (r && r.name) $('#ph-loc').value = r.name; };
ACT.photoOpen = async el => {
  const id = parseInt(el.dataset.arg, 10), p = S.cache.galList.find(x => x.id === id); if (!p) return;
  S.cache.photo = p;
  modal(`<div id="photo-view"></div>`, { wide: true, noFocus: true });
  await photoRender();
};
async function photoRender() {
  const p = S.cache.photo, box = $('#photo-view'); if (!box) return;
  const r = await req('photoComments', { id: p.id }); const comments = r.ok ? r.payload : [];
  box.innerHTML = `<div class="photo-detail"><div class="pd-img" style="background-image:url('${esc(p.url)}')" data-act="zoom" data-arg="${esc(p.url)}"></div><div class="pd-side">
    <div class="row-flex"><div data-act="profileOpen" data-arg="${esc(p.pub)}" style="cursor:pointer">${avatar(p.picture, p.name, S.settings.themeColor, '')}</div><div class="grow"><b>${esc(p.name)}</b>${p.verified ? ` <span style="color:#7dd3fc">${ico('badge', 13)}</span>` : ''}<div class="muted xs">${ago(p.created)}${p.location ? ' · ' + esc(p.location) : ''}</div></div></div>
    ${p.description ? `<p style="user-select:text">${esc(p.description)}</p>` : ''}
    <div class="row-flex" style="margin:8px 0"><button class="btn small ${p.liked ? 'primary' : ''}" data-act="photoLike">${ico('heart', 14)} ${p.likes}</button><button class="btn small ${p.saved ? 'primary' : ''}" data-act="photoSaveBtn">${ico('star', 14)} ${p.saved ? 'Saved' : 'Save'}</button>
      ${p.mine || (S.me && S.me.isStaff) ? `<button class="btn small danger" data-act="photoDel">${ico('trash', 14)}</button>` : ''}</div>
    <div class="chat-list" style="height:200px">${comments.length ? comments.map(c => `<div class="msg"><b>${esc(c.name)}</b>${esc(c.text)}${bubbleImg(c.image)} <small>${ago(c.created)}</small>${c.mine || (S.me && S.me.isStaff) ? `<button class="tiny-x" data-act="cmtDel" data-arg="${c.id}">${ico('x', 10)}</button>` : ''}</div>`).join('') : '<div class="muted xs">No comments yet.</div>'}</div>
    ${composer('cmt', 'Add a comment')}</div></div><div class="modal-actions"><button class="btn" data-act="closeModal">Close</button></div>`;
  wireComposer('cmt', async (text, image) => { const x = await run('commentAdd', { id: p.id, text, image }); if (x.ok) { p.comments++; photoRender(); } return x.ok; });
}
ACT.photoLike = async () => { const p = S.cache.photo, r = await run('photoLike', { id: p.id }); if (r.ok) { p.liked = r.payload.liked; p.likes += p.liked ? 1 : -1; photoRender(); } };
ACT.photoSaveBtn = async () => { const p = S.cache.photo, r = await run('photoSave', { id: p.id }); if (r.ok) { p.saved = r.payload.saved; photoRender(); } };
ACT.photoDel = () => confirmBox('Delete this photo?', 'This cannot be undone.', 'Delete', async () => { const r = await run('photoDelete', { id: S.cache.photo.id }, 'Photo deleted.'); if (r.ok) { closeModal(); refreshPage(); } }, true);
ACT.cmtDel = async el => { const r = await run('commentDelete', { id: parseInt(el.dataset.arg, 10) }); if (r.ok) { S.cache.photo.comments--; photoRender(); } };

// ================================================================== PROFILE (card used everywhere)
function profileCard(p) {
  const c = rgbStr(S.settings.themeColor), banner = safeUrl(p.banner);
  const st = { online: 'online', idle: 'idle', dnd: 'dnd' }[p.status] || '';
  const label = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline', invisible: 'Appear offline' }[p.status] || p.status;
  return `<div class="squad" style="--c:${rgbStr(S.me ? (S.me.prefs.menuColor || S.settings.themeColor) : S.settings.themeColor)}"><div class="cover" style="height:96px;${banner ? `background-image:url('${esc(banner)}')` : ''}"></div>
    <div class="body"><div class="top">${avatar(p.picture, p.name, S.settings.themeColor, 'xl', st)}<div class="grow" style="padding-top:40px"><div class="nm" style="font-size:20px">${esc(p.name)}${p.verified ? ` <span style="color:#7dd3fc" title="Verified">${ico('badge', 18)}</span>` : ''}</div>
      <div class="row-flex wrap" style="margin-top:4px">${p.job ? pill(p.job, 'accent') : ''}${pill('Level ' + p.level + ' · ' + p.levelName)}${pill(label)}</div></div></div>
      ${p.bio ? `<p style="margin:12px 0;user-select:text">${esc(p.bio)}</p>` : ''}
      ${p.stats ? `<div class="stats" style="margin-top:12px"><div class="stat"><b>${num(p.stats.crafted)}</b><span>Made</span></div><div class="stat"><b>${num(p.stats.sold)}</b><span>Sold</span></div><div class="stat"><b>${cash(p.stats.earned)}</b><span>Earned</span></div><div class="stat"><b>${p.stats.best}</b><span>Best streak</span></div></div>` : '<p class="muted xs">Stats are private.</p>'}
      ${(p.photos || []).length ? `<div class="gallery">${p.photos.map(u => `<div style="background-image:url('${esc(safeUrl(u))}')" data-act="zoom" data-arg="${esc(safeUrl(u))}"></div>`).join('')}</div>` : ''}</div></div>`;
}
ACT.profileOpen = async el => {
  const r = await run('profile', { pub: el.dataset.arg }); if (!r.ok) return;
  const p = r.payload; S.cache.viewing = p;
  let actions = '';
  if (p.isMe) actions = `<button class="btn primary" data-act="profEditGo">Edit my profile</button>`;
  else {
    if (S.settings.friendsEnabled !== false) {
      actions += `<button class="btn primary" data-act="dmOpen" data-arg="${esc(p.pub)}">Message</button>`;
      if (p.relation === 'none') actions += `<button class="btn" data-act="profAdd" data-arg="${esc(p.pub)}">${ico('userplus', 14)} Add friend</button>`;
      if (p.relation === 'pending_in') actions += `<button class="btn" data-act="friendYes" data-arg="${esc(p.pub)}">Accept request</button>`;
      if (p.relation === 'pending_out') actions += pill('Request sent');
      if (p.relation === 'friends') actions += pill('Friends', 'open');
      actions += p.relation === 'blocked' ? `<button class="btn" data-act="blockOff" data-arg="${esc(p.pub)}">Unblock</button>` : `<button class="btn danger" data-act="blockOn" data-arg="${esc(p.pub)}">Block</button>`;
    }
    if (S.me.isStaff) actions += `<button class="btn" data-act="muteOpen" data-arg="${esc(p.pub)}" data-name="${esc(p.name)}">Mute</button>`;
    if (S.me.isVerifier) actions += `<button class="btn" data-act="verifyToggle" data-arg="${esc(p.pub)}">${p.verified ? 'Remove badge' : 'Give badge'}</button>`;
  }
  modal(profileCard(p) + `<div class="modal-actions" style="justify-content:space-between"><div class="row-flex wrap">${actions}</div><button class="btn" data-act="closeModal">Close</button></div>`, { wide: true, noFocus: true });
};
ACT.profEditGo = () => { closeModal(); S.page = 'profile'; renderRail(); refreshPage(); };
ACT.profAdd = async el => { const r = await run('friendRequest', { pub: el.dataset.arg }, 'Friend request sent.'); if (r.ok) closeModal(); };
ACT.verifyToggle = async el => { const p = S.cache.viewing; const r = await run('verify', { pub: el.dataset.arg, value: !p.verified }, p.verified ? 'Badge removed.' : 'Badge given.'); if (r.ok) closeModal(); };

// ================================================================== MY PROFILE
let profDraft = null;
PAGES.profile = {
  title: 'My profile', sub: 'How other players see you',
  async render(el) {
    const r = await req('profile', { pub: S.me.pub }); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const p = S.cache.me = r.payload;
    if (!profDraft) profDraft = { bio: p.bio, picture: p.picture, banner: p.banner, status: p.ownStatus || p.status, photos: (p.photos || []).slice(), privMsg: p.privMsg, privStats: p.privStats };
    const d = profDraft;
    el.innerHTML = `<div id="prof-preview" class="preview"></div><div class="card"><div class="grid"><div class="field"><label>Status</label><select data-change="pfField" data-k="status">${[['online', 'Online'], ['idle', 'Idle'], ['dnd', 'Do not disturb'], ['invisible', 'Appear offline']].map(([k, v]) => `<option value="${k}" ${d.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Profile picture link</label><input type="url" value="${esc(d.picture)}" placeholder="https://" data-input="pfField" data-k="picture"></div></div>
      <div class="field"><label>Banner link</label><input type="url" value="${esc(d.banner)}" placeholder="https://" data-input="pfField" data-k="banner"></div>
      <div class="field"><label>About you (${S.settings.bioMax || 200} characters)</label><textarea maxlength="${S.settings.bioMax || 200}" data-input="pfField" data-k="bio">${esc(d.bio)}</textarea></div>
      <div class="field"><label>Photos (up to 9 picture links, one per line)</label><textarea data-input="pfPhotos" placeholder="https://">${esc(d.photos.join('\n'))}</textarea></div>
      <div class="grid"><div class="field"><label>Who can message you</label><select data-change="pfField" data-k="privMsg">${[['everyone', 'Everyone'], ['friends', 'Friends only'], ['nobody', 'Nobody']].map(([k, v]) => `<option value="${k}" ${d.privMsg === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Who can see your stats</label><select data-change="pfField" data-k="privStats">${[['everyone', 'Everyone'], ['friends', 'Friends only'], ['me', 'Only me']].map(([k, v]) => `<option value="${k}" ${d.privStats === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
      <div class="modal-actions"><button class="btn ghost" data-act="profReset">Undo changes</button><button class="btn primary" data-act="profSave">Save profile</button></div></div>`;
    previewProfile();
  },
};
function previewProfile() {
  const box = $('#prof-preview'), p = S.cache.me, d = profDraft; if (!box || !p) return;
  box.innerHTML = profileCard(Object.assign({}, p, { bio: d.bio, picture: d.picture, banner: d.banner, status: d.status === 'invisible' ? 'offline' : d.status, photos: d.photos }));
}
INPUT.pfField = el => { profDraft[el.dataset.k] = el.value; previewProfile(); };
CHANGE.pfField = el => { profDraft[el.dataset.k] = el.value; previewProfile(); };
INPUT.pfPhotos = el => { profDraft.photos = el.value.split(/\s*\n\s*/).map(s => s.trim()).filter(Boolean).slice(0, 9); previewProfile(); };
ACT.profReset = () => { profDraft = null; refreshPage(); };
ACT.profSave = async () => {
  const d = profDraft, r = await run('profileSave', { bio: d.bio, picture: d.picture, banner: d.banner, status: d.status, photos: d.photos, privMsg: d.privMsg, privStats: d.privStats }, 'Profile saved.');
  if (r.ok) { profDraft = null; refreshPage(); }
};

// ================================================================== SETTINGS
const POPUP_POS = [[1, 'Top left'], [2, 'Top centre'], [3, 'Top right'], [8, 'Left'], [0, ''], [4, 'Right'], [7, 'Bottom left'], [6, 'Bottom centre'], [5, 'Bottom right']];
PAGES.settings = {
  title: 'Settings', sub: 'Only you see these changes',
  render(el) {
    const p = S.me.prefs;
    el.innerHTML = `<div class="grid"><div>
      <div class="card"><h3>Appearance</h3><div class="toggle-row"><div><div class="t">Light mode</div></div>${toggle(p.mode === 'light', 'prefMode')}</div>
        <div class="field" style="margin-top:10px"><label>Colour</label>${swatches(p.menuColor || S.settings.themeColor, 'prefColor')}</div></div>
      <button class="btn" data-act="tourAgain">Show the welcome tour again</button></div>
      <div><div class="card"><h3>Message pop-ups</h3><div class="toggle-row"><div><div class="t">Do not disturb</div><div class="d">No pop-ups or sounds for new messages.</div></div>${toggle(!!p.dnd, 'prefDnd')}</div>
        <div class="field" style="margin-top:10px"><label>Where pop-ups appear</label><div class="pos-grid">${POPUP_POS.map(([n, l]) => n ? `<button class="pos ${p.popupPos === n ? 'active' : ''}" data-act="prefPos" data-arg="${n}">${l}</button>` : '<div class="pos-mid">screen</div>').join('')}</div></div></div></div></div>`;
  },
};
ACT.prefMode = () => { savePref('mode', S.me.prefs.mode === 'light' ? 'dark' : 'light'); refreshPage(); };
ACT.prefColor = el => { savePref('menuColor', el.dataset.arg); refreshPage(); };
CHANGE.prefColorPick = el => { savePref('menuColor', el.value); refreshPage(); };
ACT.prefDnd = () => { savePref('dnd', !S.me.prefs.dnd); refreshPage(); };
ACT.prefPos = el => { savePref('popupPos', parseInt(el.dataset.arg, 10)); refreshPage(); };
ACT.tourAgain = () => startTour();

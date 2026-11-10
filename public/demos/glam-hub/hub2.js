'use strict';
// Social pages: composer, Global Chat, friends and discover, private and group messages

const CHANGE = {}, INPUT = {};
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (el && INPUT[el.dataset.input]) INPUT[el.dataset.input](el, e); });
const val = id => { const e = document.getElementById(id); return e ? e.value : ''; };
const checked = id => { const e = document.getElementById(id); return !!(e && e.checked); };

const EMOJIS = '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😜 🤪 😎 🤩 🥳 😏 😒 😔 😢 😭 😤 😡 🥺 😱 🤔 🤭 🙄 😴 🤗 🤫 👍 👎 👏 🙌 🙏 💪 👀 💅 💄 ✨ 🌸 🌹 💖 💕 💜 🖤 ❤️ 🔥 💯 🎉 🎀 👑 💎 🛍️ 💰 🚗 🌴 ☀️ 🌙 ⭐ 💋 👠 👗 🧴 🪞'.split(' ');

// ------------------------------------------------------------------ composer
S.pend = {};
function composer(id, placeholder) {
  const st = S.settings;
  return `<div class="composer" id="cmp-${id}"><div class="cmp-pend" id="pend-${id}"></div><div class="row-flex">
    ${st.emojisEnabled !== false ? `<button class="icon-btn sm" data-act="emojiOpen" data-arg="${id}" title="Emoji">${ico('smile', 16)}</button>` : ''}
    ${st.gifsEnabled !== false ? `<button class="icon-btn sm gifb" data-act="gifOpen" data-arg="${id}" title="GIF">GIF</button>` : ''}
    ${st.imagesEnabled !== false ? `<button class="icon-btn sm" data-act="imgOpen" data-arg="${id}" title="Picture">${ico('image', 16)}</button>` : ''}
    <input type="text" id="in-${id}" placeholder="${esc(placeholder)}" maxlength="${st.chatMaxLength || 200}" autocomplete="off" data-enter="${id}">
    <button class="btn primary small" data-act="cmpSend" data-arg="${id}">${ico('send', 14)}</button></div><div id="emoji-${id}" class="emoji-pop hidden"></div></div>`;
}
function renderPend(id) {
  const box = document.getElementById('pend-' + id); if (!box) return;
  const url = S.pend[id];
  box.innerHTML = url ? `<div class="pend"><img src="${esc(url)}" alt=""><button class="icon-btn sm" data-act="pendClear" data-arg="${id}">${ico('x', 12)}</button></div>` : '';
}
ACT.pendClear = el => { delete S.pend[el.dataset.arg]; renderPend(el.dataset.arg); };
const SENDERS = {};
function wireComposer(id, send) {
  SENDERS[id] = send;
  const inp = document.getElementById('in-' + id);
  if (inp) inp.onkeydown = e => { if (e.key === 'Enter') ACT.cmpSend({ dataset: { arg: id } }); e.stopPropagation(); };
  renderPend(id);
}
ACT.cmpSend = async el => {
  const id = el.dataset.arg, inp = document.getElementById('in-' + id); if (!inp) return;
  const text = inp.value.trim(), image = S.pend[id] || '';
  if (!text && !image) return;
  inp.value = ''; delete S.pend[id]; renderPend(id);
  const ok = await SENDERS[id](text, image);
  if (ok === false) { inp.value = text; if (image) { S.pend[id] = image; renderPend(id); } }
};
ACT.emojiOpen = el => {
  const id = el.dataset.arg, pop = document.getElementById('emoji-' + id);
  if (!pop.classList.contains('hidden')) { pop.classList.add('hidden'); return; }
  pop.innerHTML = EMOJIS.map(e => `<button data-act="emojiPick" data-arg="${id}" data-e="${e}">${e}</button>`).join('');
  pop.classList.remove('hidden');
};
ACT.emojiPick = el => { const i = document.getElementById('in-' + el.dataset.arg); i.value += el.dataset.e; i.focus(); };
ACT.imgOpen = el => {
  const id = el.dataset.arg;
  modal(`<h3>Add a picture</h3><div class="field"><label>Picture link (https)</label><input id="img-url" type="url" placeholder="https://"></div><p class="muted xs">Only links from approved sites work: ${esc((S.settings.imageSites || []).join(', '))}</p>
    <div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="img-go">Add</button></div>`);
  $('#img-go').onclick = () => { const u = val('img-url').trim(); if (!/^https:\/\//i.test(u)) return toast('Use an https link.', 'error'); S.pend[id] = u; closeModal(); renderPend(id); };
};
// GIF picker
let gifTarget = null;
ACT.gifOpen = el => { gifTarget = el.dataset.arg; S.tab.gif = S.tab.gif || 'trending'; gifRender(); };
async function gifRender(q) {
  const tab = S.tab.gif;
  modal(`<h3>GIFs</h3><div class="tabs">${['trending', 'search', 'favorites', 'recent'].map(t => `<button class="tab ${tab === t ? 'active' : ''}" data-act="gifTab" data-arg="${t}">${{ trending: 'Trending', search: 'Search', favorites: 'Favorites', recent: 'Recent' }[t]}</button>`).join('')}</div>
    ${tab === 'search' ? `<div class="row-flex" style="margin-bottom:10px"><input id="gif-q" type="text" placeholder="Search GIFs" value="${esc(q || '')}"><button class="btn primary small" data-act="gifSearch">Search</button></div>` : ''}
    <div id="gif-grid" class="gif-grid"><div class="empty">Loading...</div></div><div class="modal-actions"><button class="btn" data-act="closeModal">Close</button></div>`, { wide: true, noFocus: tab !== 'search' });
  const qi = $('#gif-q'); if (qi) qi.onkeydown = e => { if (e.key === 'Enter') ACT.gifSearch(); e.stopPropagation(); };
  if (tab === 'search' && !q) { $('#gif-grid').innerHTML = '<div class="empty">Type something to search.</div>'; return; }
  const r = await req('gifSearch', { tab, q }); const g = $('#gif-grid'); if (!g) return;
  if (!r.ok) { g.innerHTML = empty('GIFs are not available', r.payload); return; }
  const list = r.payload.list || [];
  g.innerHTML = list.length ? list.map(x => `<div class="gif" style="background-image:url('${esc(x.preview || x.url)}')" data-act="gifPick" data-arg="${esc(x.url)}"><button class="fav" data-act="gifFav" data-arg="${esc(x.url)}" title="Favorite">${ico('star', 12)}</button></div>`).join('') : '<div class="empty">Nothing here yet.</div>';
}
ACT.gifTab = el => { S.tab.gif = el.dataset.arg; gifRender(); };
ACT.gifSearch = () => gifRender(val('gif-q').trim());
ACT.gifPick = el => { S.pend[gifTarget] = el.dataset.arg; req('gifMark', { url: el.dataset.arg, kind: 'recent' }); closeModal(); renderPend(gifTarget); };
ACT.gifFav = async el => { await run('gifMark', { url: el.dataset.arg, kind: S.tab.gif === 'favorites' ? 'unfav' : 'fav' }, S.tab.gif === 'favorites' ? 'Removed.' : 'Added to favorites.'); if (S.tab.gif === 'favorites') gifRender(); };

// shared bits
const bubbleImg = u => u ? `<img class="chat-img" src="${esc(u)}" alt="" data-act="zoom" data-arg="${esc(u)}">` : '';
function person(p, extra) {
  return `<div class="row">${`<div data-act="profileOpen" data-arg="${esc(p.pub)}" style="cursor:pointer">${avatar(p.picture, p.name, S.settings.themeColor, '', p.status)}</div>`}<div class="grow"><div class="name">${esc(p.name)}${p.verified ? ` <span style="color:#7dd3fc">${ico('badge', 14)}</span>` : ''}</div>${p.job ? `<div class="meta">${esc(p.job)}</div>` : ''}</div><div class="actions">${extra || ''}</div></div>`;
}

// ================================================================== GLOBAL CHAT
PAGES.chat = {
  title: 'Global Chat', sub: () => S.cache.chatOnline ? `${S.cache.chatOnline} online` : '',
  async render(el) {
    const r = await req('chatList'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    S.cache.chat = r.payload.list; S.cache.chatOnline = r.payload.online; renderHeader();
    el.innerHTML = `<div class="card chatcard"><div id="chat-list" class="chat-list tall"></div>${r.payload.muted ? '<div class="warn-box">You are muted.</div>' : composer('gc', 'Say something to everyone')}</div>`;
    const list = $('#chat-list');
    list.innerHTML = S.cache.chat.length ? '' : '<div class="empty">No messages yet. Say hi!</div>';
    S.cache.chat.forEach(m => list.insertAdjacentHTML('beforeend', chatRow(m)));
    list.scrollTop = list.scrollHeight;
    if (!r.payload.muted) wireComposer('gc', async (text, image) => { const x = await run('chatSend', { text, image }); return x.ok; });
  },
};
function chatRow(m) {
  const mine = S.me && m.pub === S.me.pub, canDel = mine || (S.me && S.me.isStaff);
  return `<div class="cm-row" id="cm-${m.id}"><div data-act="profileOpen" data-arg="${esc(m.pub)}" style="cursor:pointer">${avatar(m.picture, m.name, S.settings.themeColor, '')}</div><div class="grow"><div class="cm-head"><b>${esc(m.name)}</b>${m.verified ? `<span style="color:#7dd3fc">${ico('badge', 12)}</span>` : ''}<small class="muted">${ago(m.created)}</small>
    ${canDel ? `<button class="tiny-x" data-act="chatDel" data-arg="${m.id}" title="Delete">${ico('trash', 12)}</button>` : ''}${S.me && S.me.isStaff && !mine ? `<button class="tiny-x" data-act="muteOpen" data-arg="${esc(m.pub)}" data-name="${esc(m.name)}" title="Mute">${ico('ban', 12)}</button>` : ''}</div>
    ${m.text ? `<div class="cm-text">${esc(m.text)}</div>` : ''}${bubbleImg(m.image)}</div></div>`;
}
HANDLERS.chat = d => {
  if (!S.cache.chat) return;
  S.cache.chat.push(d.m);
  if (S.menuOpen && S.page === 'chat') { const l = $('#chat-list'); if (l) { const e = l.querySelector('.empty'); if (e) e.remove(); l.insertAdjacentHTML('beforeend', chatRow(d.m)); l.scrollTop = l.scrollHeight; } }
};
HANDLERS.chatDeleted = d => { const e = document.getElementById('cm-' + d.id); if (e) e.remove(); };
ACT.chatDel = async el => { const r = await run('chatDelete', { id: parseInt(el.dataset.arg, 10) }); if (r.ok) { const e = document.getElementById('cm-' + el.dataset.arg); if (e) e.remove(); } };
ACT.muteOpen = el => {
  modal(`<h3>Mute ${esc(el.dataset.name)}</h3><div class="field"><label>Minutes</label><input id="mute-min" type="number" min="1" value="60"></div><div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" id="mute-go">Mute</button></div>`);
  $('#mute-go').onclick = async () => { const r = await run('mute', { pub: el.dataset.arg, minutes: parseInt(val('mute-min'), 10) || 60 }, 'Player muted.'); if (r.ok) closeModal(); };
};

// ============================================================ FRIENDS & DISCOVER
PAGES.friends = {
  title: 'Friends & Discover', sub: 'Find people, add friends and block anyone you do not want to hear from',
  async render(el) {
    const tab = S.tab.friends || 'friends';
    const r = await req('friends'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const d = r.payload;
    el.innerHTML = `<div class="tabs">${[['friends', 'Friends (' + d.friends.length + ')'], ['requests', 'Requests' + (d.incoming.length ? ' (' + d.incoming.length + ')' : '')], ['discover', 'Discover'], ['blocked', 'Blocked']].map(([k, v]) => `<button class="tab ${tab === k ? 'active' : ''}" data-act="friendsTab" data-arg="${k}">${v}</button>`).join('')}</div><div id="fr-body"></div>`;
    const body = $('#fr-body');
    if (tab === 'friends') body.innerHTML = d.friends.length ? d.friends.map(p => person(p, `<button class="btn tiny primary" data-act="dmOpen" data-arg="${esc(p.pub)}">Message</button><button class="btn tiny" data-act="friendRemove" data-arg="${esc(p.pub)}">Remove</button><button class="btn tiny danger" data-act="blockOn" data-arg="${esc(p.pub)}">Block</button>`)).join('') : empty('No friends yet', 'Use Discover to find people.');
    if (tab === 'requests') body.innerHTML = (d.incoming.length ? `<div class="section">Incoming</div>` + d.incoming.map(p => person(p, `<button class="btn tiny primary" data-act="friendYes" data-arg="${esc(p.pub)}">Accept</button><button class="btn tiny" data-act="friendNo" data-arg="${esc(p.pub)}">Decline</button>`)).join('') : '')
      + (d.outgoing.length ? `<div class="section">Sent</div>` + d.outgoing.map(p => person(p, `<button class="btn tiny" data-act="friendRemove" data-arg="${esc(p.pub)}">Cancel</button>`)).join('') : '') || empty('No requests', '');
    if (tab === 'blocked') body.innerHTML = d.blocked.length ? d.blocked.map(p => person(p, `<button class="btn tiny" data-act="blockOff" data-arg="${esc(p.pub)}">Unblock</button>`)).join('') : empty('Nobody is blocked', '');
    if (tab === 'discover') {
      body.innerHTML = `<div class="toolbar"><div class="search-box">${ico('search', 16)}<input id="fr-q" type="text" placeholder="Search by name or server ID" data-input="frSearch"></div><button class="btn small" data-act="frNearby">${ico('mapPin', 14)} Nearby</button></div><div id="fr-results"><p class="muted">Search for a player, or tap Nearby.</p></div>`;
    }
  },
};
ACT.friendsTab = el => { S.tab.friends = el.dataset.arg; refreshPage(); };
function discoverRow(p) {
  const rel = p.relation;
  const btn = rel === 'none' ? `<button class="btn tiny primary" data-act="friendAdd" data-arg="${esc(p.pub)}">${ico('userplus', 12)} Add</button>` : rel === 'friends' ? pill('Friends', 'open') : rel === 'pending_out' ? pill('Sent') : rel === 'pending_in' ? `<button class="btn tiny primary" data-act="friendYes" data-arg="${esc(p.pub)}">Accept</button>` : '';
  return person(p, btn);
}
let frTimer = null;
INPUT.frSearch = el => { clearTimeout(frTimer); frTimer = setTimeout(async () => { const q = el.value.trim(); if (!q) { $('#fr-results').innerHTML = ''; return; } const r = await req('friendSearch', { q }); $('#fr-results').innerHTML = r.ok && r.payload.length ? r.payload.map(discoverRow).join('') : '<p class="muted">Nobody found.</p>'; }, 350); };
ACT.frNearby = async () => { const r = await run('friendNearby'); if (r.ok) $('#fr-results').innerHTML = r.payload.length ? r.payload.map(discoverRow).join('') : '<p class="muted">Nobody nearby.</p>'; };
ACT.friendAdd = async el => { const r = await run('friendRequest', { pub: el.dataset.arg }, 'Friend request sent.'); if (r.ok) { el.outerHTML = pill('Sent'); } };
ACT.friendYes = async el => { const r = await run('friendAnswer', { pub: el.dataset.arg, accept: true }, 'You are now friends.'); if (r.ok) refreshPage(); };
ACT.friendNo = async el => { const r = await run('friendAnswer', { pub: el.dataset.arg, accept: false }); if (r.ok) refreshPage(); };
ACT.friendRemove = el => confirmBox('Remove this friend?', 'You can add them again later.', 'Remove', async () => { const r = await run('friendRemove', { pub: el.dataset.arg }); if (r.ok) refreshPage(); }, true);
ACT.blockOn = el => confirmBox('Block this player?', 'They cannot message you, add you or see your posts, and you will not see theirs.', 'Block', async () => { const r = await run('block', { pub: el.dataset.arg, on: true }, 'Blocked.'); if (r.ok) { closeModal(); refreshPage(); } }, true);
ACT.blockOff = async el => { const r = await run('block', { pub: el.dataset.arg, on: false }, 'Unblocked.'); if (r.ok) refreshPage(); };

// ================================================================== MESSAGES
let thread = null;   // { type: 'dm'|'group', key }
PAGES.messages = {
  title: 'Messages', sub: 'Private messages and group chats',
  async render(el) {
    const [dm, gr] = await Promise.all([req('dmList'), S.settings.groupsEnabled !== false ? req('groupList') : Promise.resolve({ ok: true, payload: [] })]);
    const dms = dm.ok ? dm.payload : [], groups = gr.ok ? gr.payload : [];
    S.dmUnread = dms.some(d => d.unread) || groups.some(g => g.unread); renderRail();
    if (!thread && S.tab.openDm) { thread = { type: 'dm', key: S.tab.openDm }; S.tab.openDm = null; }
    el.innerHTML = `<div class="msgs-wrap"><div class="msgs-side"><div class="row-flex" style="margin-bottom:8px"><b class="grow">Chats</b>${S.settings.groupsEnabled !== false ? `<button class="btn tiny" data-act="groupNew">${ico('plus', 12)} Group</button>` : ''}</div>
      <div class="aside-list">${groups.map(g => `<div class="row click ${thread && thread.type === 'group' && thread.key === g.id ? 'sel' : ''}" data-act="threadOpen" data-type="group" data-arg="${g.id}"><div class="avatar" style="border-color:rgba(var(--accent-rgb),.6)">${ico('users', 16)}</div><div class="grow"><div class="name">${esc(g.name)}</div><div class="meta">${g.members} people${g.last ? ' · ' + esc(g.last.slice(0, 24)) : ''}</div></div>${g.unread ? `<span class="badge">${g.unread}</span>` : ''}</div>`).join('')}
      ${dms.map(p => `<div class="row click ${thread && thread.type === 'dm' && thread.key === p.pub ? 'sel' : ''}" data-act="threadOpen" data-type="dm" data-arg="${esc(p.pub)}">${avatar(p.picture, p.name, S.settings.themeColor, '', p.status)}<div class="grow"><div class="name">${esc(p.name)}</div><div class="meta">${p.last ? (p.last.image && !p.last.text ? 'Picture' : esc((p.last.text || '').slice(0, 26))) : ''}</div></div>${p.unread ? `<span class="badge">${p.unread}</span>` : ''}</div>`).join('')}
      ${!dms.length && !groups.length ? '<p class="muted xs">Start a chat from a friend or a profile.</p>' : ''}</div></div>
      <div class="msgs-main" id="thread-box">${thread ? '' : '<div class="empty"><b>Pick a chat</b>or message a friend.</div>'}</div></div>`;
    if (thread) await loadThread();
  },
};
async function loadThread() {
  const box = $('#thread-box'); if (!box || !thread) return;
  const r = await req(thread.type === 'dm' ? 'dmThread' : 'groupThread', thread.type === 'dm' ? { pub: thread.key } : { id: thread.key });
  if (!r.ok) { box.innerHTML = empty('Not available', r.payload); thread = null; return; }
  const d = r.payload; S.cache.thread = d;
  const head = thread.type === 'dm' ? `<div class="th-head">${avatar(d.person.picture, d.person.name, S.settings.themeColor, '', d.person.status)}<div class="grow"><b>${esc(d.person.name)}</b><div class="muted xs">${esc(d.person.status)}</div></div><button class="btn tiny" data-act="profileOpen" data-arg="${esc(d.person.pub)}">Profile</button></div>`
    : `<div class="th-head"><div class="avatar"> ${ico('users', 16)}</div><div class="grow"><b>${esc(d.name)}</b><div class="muted xs">${d.members.map(m => esc(m.name)).join(', ')}</div></div><button class="btn tiny" data-act="groupAdd">${ico('userplus', 12)} Add</button><button class="btn tiny danger" data-act="groupLeave">Leave</button></div>`;
  box.innerHTML = `${head}<div id="th-list" class="chat-list tall"></div>${composer('th', 'Write a message')}`;
  const list = $('#th-list');
  d.messages.forEach(m => list.insertAdjacentHTML('beforeend', threadMsg(m)));
  list.scrollTop = list.scrollHeight;
  wireComposer('th', async (text, image) => {
    const x = await run(thread.type === 'dm' ? 'dmSend' : 'groupSend', thread.type === 'dm' ? { pub: thread.key, text, image } : { id: thread.key, text, image });
    if (x.ok) { list.insertAdjacentHTML('beforeend', threadMsg(x.payload)); list.scrollTop = list.scrollHeight; }
    return x.ok;
  });
}
const threadMsg = m => `<div class="bub ${m.mine ? 'mine' : ''}">${!m.mine && m.name ? `<b>${esc(m.name)}</b>` : ''}${m.text ? `<div>${esc(m.text)}</div>` : ''}${bubbleImg(m.image)}<small>${ago(m.created)}</small></div>`;
ACT.threadOpen = el => { thread = { type: el.dataset.type, key: el.dataset.type === 'group' ? parseInt(el.dataset.arg, 10) : el.dataset.arg }; refreshPage(); };
ACT.dmOpen = el => { thread = { type: 'dm', key: el.dataset.arg }; S.page = 'messages'; renderRail(); closeModal(); refreshPage(); };
// live message while this page is open
function liveMessage(m) {
  const here = thread && ((m.kind === 'dm' && thread.type === 'dm' && thread.key === m.pub) || (m.kind === 'group' && thread.type === 'group' && thread.key === m.gid));
  if (here) {
    const list = $('#th-list'); if (list) { list.insertAdjacentHTML('beforeend', threadMsg({ mine: false, name: m.kind === 'group' ? m.name : '', text: m.text, image: '', created: m.created })); list.scrollTop = list.scrollHeight; }
    req(thread.type === 'dm' ? 'dmThread' : 'groupThread', thread.type === 'dm' ? { pub: thread.key } : { id: thread.key });
  } else refreshPage();
}
ACT.groupNew = async () => {
  const r = await run('friends'); if (!r.ok) return;
  const friends = r.payload.friends;
  modal(`<h3>New group chat</h3><div class="field"><label>Group name</label><input id="gn" type="text" maxlength="30"></div><div class="section">Add friends (up to ${(S.settings.groupMax || 10) - 1})</div>
    ${friends.length ? friends.map(f => `<label class="row click" style="cursor:pointer"><input type="checkbox" class="gm" value="${esc(f.pub)}"><div class="grow"><div class="name">${esc(f.name)}</div></div></label>`).join('') : '<p class="muted">Add some friends first.</p>'}
    <div class="modal-actions"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" id="gn-go">Create</button></div>`, { wide: true });
  $('#gn-go').onclick = async () => {
    const members = $$('.gm').filter(c => c.checked).map(c => c.value);
    const x = await run('groupCreate', { name: val('gn'), members }, 'Group created.');
    if (x.ok) { closeModal(); thread = { type: 'group', key: x.payload }; refreshPage(); }
  };
};
ACT.groupAdd = async () => {
  const r = await run('friends'); if (!r.ok) return;
  const inGroup = new Set(S.cache.thread.members.map(m => m.pub)), list = r.payload.friends.filter(f => !inGroup.has(f.pub));
  modal(`<h3>Add to the group</h3>${list.length ? list.map(f => `<div class="row"><div class="grow"><div class="name">${esc(f.name)}</div></div><button class="btn tiny primary" data-act="groupAddDo" data-arg="${esc(f.pub)}">Add</button></div>`).join('') : '<p class="muted">All your friends are already here.</p>'}<div class="modal-actions"><button class="btn" data-act="closeModal">Close</button></div>`, { noFocus: true });
};
ACT.groupAddDo = async el => { const r = await run('groupAdd', { id: thread.key, pub: el.dataset.arg }, 'Added.'); if (r.ok) { el.outerHTML = pill('Added', 'open'); } };
ACT.groupLeave = () => confirmBox('Leave this group?', 'You will stop receiving its messages.', 'Leave', async () => { const r = await run('groupLeave', { id: thread.key }, 'You left the group.'); if (r.ok) { thread = null; refreshPage(); } }, true);

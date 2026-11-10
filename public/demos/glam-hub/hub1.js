'use strict';
// Hub pages: home, jobs, shop, crafting, career, tasks, leaderboards, starter pack

const TASK_TEXT = {
  craft: t => `Make ${num(t.goal)} products`, sell: t => `Sell ${num(t.goal)} products`, earn: t => `Earn ${cash(t.goal)}`,
  post: t => `Post ${num(t.goal)} photo${t.goal > 1 ? 's' : ''}`, chat: t => `Send ${num(t.goal)} Global Chat message${t.goal > 1 ? 's' : ''}`,
};
const TASK_ICON = { craft: 'sparkles', sell: 'bag', earn: 'coin', post: 'camera', chat: 'chat' };

function xpBar(d) {
  if (!d.nextXp) return `<div class="bar done"><i style="width:100%"></i></div><div class="muted xs">Max level reached</div>`;
  return `${bar(d.xp - d.thisXp, d.nextXp - d.thisXp)}<div class="muted xs">${num(d.xp)} / ${num(d.nextXp)} XP</div>`;
}
function countdown(finishAt, now) {
  const left = Math.max(0, finishAt - (now || nowSec()) - Math.floor((Date.now() - (S.cache.fetchedAt || Date.now())) / 1000));
  return fmtTime(left);
}

// ================================================================== HOME
PAGES.home = {
  title: () => S.cache.home ? `Hi, ${S.cache.home.name.split(' ')[0]}` : 'Home', sub: () => S.settings.hubName,
  async render(el) {
    const r = await req('home'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const d = S.cache.home = r.payload; S.cache.level = d.level; S.dmUnread = (d.messages || []).some(m => m.unread > 0); S.cache.fetchedAt = Date.now(); renderHeader();
    el.innerHTML = `
      ${d.starter ? `<div class="banner"><div>${ico('gift', 26)}</div><div class="grow"><b>Your free starter pack is waiting</b><div class="muted">Ingredients for your first products and a free ride.</div></div><button class="btn primary" data-act="starterOpen">Claim it</button></div>` : ''}
      <div class="grid">
        <div class="card"><div class="row-flex" style="justify-content:space-between"><h3 style="margin:0">${ico('trend', 16)} ${esc(d.levelName)}</h3>${pill('Level ' + d.level, 'accent')}</div>
          <div style="margin:12px 0 4px">${xpBar(d)}</div>
          <div class="row-flex wrap" style="margin-top:12px">${d.job ? pill(d.job.label, 'accent') : '<button class="btn small" data-act="goto" data-arg="jobs">Take a job</button>'}${pill('+' + (+d.boost).toFixed(1) + '% sales boost', 'gold')}${d.streak ? pill(d.streak + ' day streak', 'war') : ''}${pill(d.online + ' online')}</div></div>
        <div class="card"><h3>${ico('bag', 16)} Ready to sell</h3>${d.products.length ? `<div class="chip-wrap">${d.products.map(p => `<div class="prod-chip">${itemIcon(p.id)}<span>${esc(p.label)}</span><b>${p.count}</b></div>`).join('')}</div><p class="muted xs" style="margin:10px 0 0">Type /${esc(S.settings.sellCommand)} to start selling.</p>` : '<p class="muted">No products yet. Buy ingredients, then craft some.</p>'}
          ${d.crafting ? `<div class="mini-queue">${ico('sparkles', 14)} Crafting ${esc(d.crafting.label)}: <b>${countdown(d.crafting.finishAt, d.crafting.now)}</b></div>` : ''}</div>
      </div>
      <div class="grid">
        <div class="card"><div class="row-flex" style="justify-content:space-between"><h3 style="margin:0">${ico('chat', 16)} Global Chat</h3><button class="btn tiny" data-act="goto" data-arg="chat">Open</button></div>
          ${d.chat.length ? d.chat.map(m => `<div class="msg"><b>${esc(m.name)}</b>${m.image && !m.text ? '[picture]' : esc(m.text)}</div>`).join('') : '<p class="muted">Quiet right now.</p>'}</div>
        <div class="card"><div class="row-flex" style="justify-content:space-between"><h3 style="margin:0">${ico('message', 16)} Messages</h3><button class="btn tiny" data-act="goto" data-arg="messages">Open</button></div>
          ${d.messages.length ? d.messages.slice(0, 3).map(m => `<div class="row click" data-act="dmOpen" data-arg="${esc(m.pub)}">${avatar(m.picture, m.name, S.settings.themeColor, '', m.status)}<div class="grow"><div class="name">${esc(m.name)}</div><div class="meta">${m.last ? (m.last.image && !m.last.text ? 'Picture' : esc((m.last.text || '').slice(0, 40))) : ''}</div></div>${m.unread ? `<span class="badge">${m.unread}</span>` : ''}</div>`).join('') : '<p class="muted">No conversations yet.</p>'}</div>
      </div>`;
  },
};

// ================================================================== JOBS
PAGES.jobs = {
  title: 'Jobs', sub: () => S.cache.jobs ? `Salary is paid every ${S.cache.jobs.salaryMinutes} minutes while you hold a job` : '',
  async render(el) {
    const r = await req('jobs'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    S.cache.jobs = r.payload; renderHeader();
    el.innerHTML = `<div class="grid">${r.payload.jobs.map(j => `<div class="card job ${j.current ? 'current' : ''}">
      <div class="row-flex" style="justify-content:space-between"><h3 style="margin:0">${esc(j.label)}</h3>${j.current ? pill('Your job', 'open') : ''}</div>
      <div class="row-flex wrap" style="margin:10px 0">${pill(cash(j.salary) + ' salary', 'gold')}${pill('+' + j.bonus + '% on sales', 'accent')}${pill('Level ' + j.level, j.canTake ? '' : 'war')}</div>
      <div class="muted xs">Makes: ${j.products.length ? esc(j.products.join(', ')) : 'nothing yet'}</div>
      <div style="margin-top:12px">${j.current ? '<button class="btn danger small" data-act="jobQuit">Quit job</button>' : `<button class="btn small ${j.canTake ? 'primary' : ''}" ${j.canTake ? '' : 'disabled'} data-act="jobTake" data-arg="${esc(j.id)}">${j.canTake ? 'Take this job' : 'Reach level ' + j.level}</button>`}</div></div>`).join('')}</div>`;
  },
};
ACT.jobTake = async el => { const r = await run('jobSet', { id: el.dataset.arg }); if (r.ok) refreshPage(); };
ACT.jobQuit = () => confirmBox('Quit your job?', 'You can take it again any time.', 'Quit', async () => { const r = await run('jobSet', { id: '' }, 'You quit your job.'); if (r.ok) refreshPage(); }, true);

// ================================================================== SHOP
S.cart = {};
PAGES.shop = {
  title: 'Beauty Shop', sub: 'Ingredients and your beauty table',
  async render(el) {
    const r = await req('shop'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const d = S.cache.shop = r.payload;
    const tab = S.tab.shop === 'quick' && d.quickEnabled ? 'quick' : 'buy';
    el.innerHTML = `<div class="tabs"><button class="tab ${tab === 'buy' ? 'active' : ''}" data-act="shopTab" data-arg="buy">Buy</button>${d.quickEnabled ? `<button class="tab ${tab === 'quick' ? 'active' : ''}" data-act="shopTab" data-arg="quick">Quick Sell</button>` : ''}
      <div class="grow"></div>${S.me.money ? `<span class="chip">${ico('coin', 14)} ${cash(d.money)}</span>` : ''}</div><div id="shop-body"></div><div id="cart-bar"></div>`;
    tab === 'buy' ? shopBuy(d) : shopQuick(d);
  },
};
ACT.shopTab = el => { S.tab.shop = el.dataset.arg; refreshPage(); };
function shopBuy(d) {
  const lines = d.items.concat([{ item: d.table.item, label: 'Beauty Table', price: d.table.price, owned: d.table.owned, table: true }]);
  $('#shop-body').innerHTML = `<div class="grid three">${lines.map(i => `<div class="card shop-card">${itemIcon(i.item)}<div class="grow"><div class="name">${esc(i.label)}</div><div class="muted xs">${cash(i.price)} · You have ${i.owned}${i.table && d.table.placed ? ' (placed)' : ''}</div></div>
    <div class="qty"><button class="btn tiny" data-act="cartDelta" data-arg="${esc(i.item)}" data-d="-1">-</button><b id="q-${esc(i.item)}">${S.cart[i.item] || 0}</b><button class="btn tiny" data-act="cartDelta" data-arg="${esc(i.item)}" data-d="1">+</button></div></div>`).join('')}</div>`;
  renderCart();
}
function cartTotal() {
  const d = S.cache.shop; let total = 0;
  const lines = d.items.concat([{ item: d.table.item, price: d.table.price }]);
  lines.forEach(i => { total += (S.cart[i.item] || 0) * i.price; });
  return total;
}
function renderCart() {
  const n = Object.values(S.cart).reduce((a, b) => a + b, 0), box = $('#cart-bar'); if (!box) return;
  box.innerHTML = n ? `<div class="cartbar">${ico('cart', 18)}<b>${n} item${n > 1 ? 's' : ''}</b><span class="muted">Total</span><b class="total">${cash(cartTotal())}</b><div class="grow"></div><button class="btn ghost small" data-act="cartClear">Clear</button><button class="btn primary" data-act="cartPay">Pay</button></div>` : '';
}
ACT.cartDelta = el => {
  const k = el.dataset.arg, max = S.settings.maxCartItems || 99;
  S.cart[k] = clamp((S.cart[k] || 0) + parseInt(el.dataset.d, 10), 0, max); if (!S.cart[k]) delete S.cart[k];
  const q = document.getElementById('q-' + k); if (q) q.textContent = S.cart[k] || 0; renderCart();
};
ACT.cartClear = () => { S.cart = {}; refreshPage(); };
ACT.cartPay = async () => { const r = await run('shopBuy', { cart: S.cart }, 'Purchase complete.'); if (r.ok) { S.cart = {}; refreshPage(); } };
function shopQuick(d) {
  $('#shop-body').innerHTML = d.quick.length ? d.quick.map(p => `<div class="row">${itemIcon(p.item)}<div class="grow"><div class="name">${esc(p.label)}</div><div class="meta">${cash(p.price)} each · You have ${p.owned}</div></div>
    <input type="number" id="qs-${esc(p.item)}" min="1" max="${p.owned}" value="${p.owned}" style="width:90px"><button class="btn small primary" data-act="quickSell" data-arg="${esc(p.item)}">Sell</button></div>`).join('') + `<p class="muted xs">Quick Sell pays less than selling to customers on the street.</p>` : empty('Nothing to sell', 'Craft some products first.');
}
ACT.quickSell = async el => { const r = await run('quickSell', { product: el.dataset.arg, qty: parseInt(val('qs-' + el.dataset.arg), 10) || 1 }); if (r.ok) refreshPage(); };

// ================================================================== CRAFTING
let craftQty = {}, craftBg = true;
PAGES.craft = {
  title: 'Crafting', sub: 'Use your beauty table to make products',
  async render(el) {
    const r = await req('recipes'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const d = S.cache.recipes = r.payload; S.cache.fetchedAt = Date.now();
    S.cache.recipeNames = Object.fromEntries(d.list.map(p => [p.id, p.label]));
    let html = '';
    if (!d.hasTable) html += `<div class="banner warn"><div>${ico('hammer', 24)}</div><div class="grow"><b>You have no beauty table placed</b><div class="muted">Buy one in the Beauty Shop, then use the item to place it anywhere you like.</div></div><button class="btn small" data-act="goto" data-arg="shop">Open shop</button></div>`;
    else html += `<div class="row-flex" style="margin-bottom:10px"><span class="muted xs">Stand next to your table to craft.</span><div class="grow"></div><button class="btn tiny" data-act="tablePickup">Pick up table</button></div>`;
    if (d.queue) html += `<div class="card queue"><div class="row-flex" style="justify-content:space-between"><b>${ico('sparkles', 16)} Making ${d.queue.qty}x ${esc(d.queue.label)}</b><b id="q-left"></b></div><div id="q-bar" style="margin-top:8px"></div><div class="row-flex" style="margin-top:10px"><div class="grow muted xs">You can keep playing. It will be waiting when it is done.</div><button class="btn small danger" data-act="craftCancel">Cancel</button></div></div>`;
    if (d.held.length) html += `<div class="card"><h3>Waiting at your table</h3>${d.held.map(h => `<div class="row-flex" style="margin-bottom:6px">${itemIcon(h.id)}<div class="grow">${h.count}x ${esc(h.label)}</div><button class="btn small primary" data-act="claimHeld" data-arg="${esc(h.id)}">Take</button></div>`).join('')}</div>`;
    html += d.background ? `<div class="toggle-row"><div><div class="t">Craft in the background</div><div class="d">Skip the animation and keep moving while it is made.</div></div>${toggle(craftBg, 'craftBgToggle')}</div>` : '';
    html += `<div class="grid three" style="margin-top:12px">${d.list.map(p => {
      const q = clamp(craftQty[p.id] || 1, 1, Math.max(1, p.canMake));
      return `<div class="card recipe ${p.unlocked ? '' : 'locked'}"><div class="row-flex">${itemIcon(p.id)}<div class="grow"><div class="name">${esc(p.label)}</div><div class="muted xs">${cash(p.price)} · ${p.time}s each · Lv ${p.level}</div></div></div>
        <div class="ingr">${p.ingredients.map(i => `<div class="${i.have >= i.need ? '' : 'short'}">${esc(i.label)} <b>${i.have}/${i.need}</b></div>`).join('')}</div>
        ${p.unlocked ? `<div class="row-flex" style="margin-top:10px"><div class="qty"><button class="btn tiny" data-act="craftQty" data-arg="${esc(p.id)}" data-d="-1">-</button><b id="cq-${esc(p.id)}">${q}</b><button class="btn tiny" data-act="craftQty" data-arg="${esc(p.id)}" data-d="1">+</button></div><div class="grow"></div>
          <button class="btn small primary" ${p.canMake < 1 || !d.hasTable || d.queue ? 'disabled' : ''} data-act="craftGo" data-arg="${esc(p.id)}">Craft</button></div><div class="muted xs" style="margin-top:6px">You can make ${p.canMake}</div>` : `<div class="lockmsg">${ico('lockc', 14)} ${esc(p.reason || 'Locked')}</div>`}</div>`;
    }).join('')}</div>`;
    el.innerHTML = html;
    if (d.queue) tickQueue();
  },
};
let queueTimer = null;
function tickQueue() {
  clearInterval(queueTimer);
  const rec = S.cache.recipes, q = rec && rec.queue; if (!q) return;
  const upd = () => {
    const el = $('#q-left'); if (!el || S.page !== 'craft') { clearInterval(queueTimer); return; }
    const nowS = rec.now + (Date.now() - S.cache.fetchedAt) / 1000;
    const total = Math.max(1, q.finishAt - q.startAt), left = Math.max(0, q.finishAt - nowS), done = total - left;
    el.textContent = fmtTime(Math.ceil(left));
    $('#q-bar').innerHTML = bar(done, total);
    if (left <= 0) { clearInterval(queueTimer); setTimeout(refreshPage, 1500); }
  };
  upd(); queueTimer = setInterval(upd, 500);
}
ACT.craftBgToggle = el => { craftBg = !craftBg; el.classList.toggle('on', craftBg); };
ACT.craftQty = el => {
  const p = S.cache.recipes.list.find(x => x.id === el.dataset.arg);
  craftQty[p.id] = clamp((craftQty[p.id] || 1) + parseInt(el.dataset.d, 10), 1, Math.max(1, p.canMake));
  $('#cq-' + p.id).textContent = craftQty[p.id];
};
ACT.craftGo = async el => {
  const p = S.cache.recipes.list.find(x => x.id === el.dataset.arg), qty = clamp(craftQty[p.id] || 1, 1, p.canMake);
  const r = await run('craft', { product: p.id, qty, bg: craftBg });
  if (!r.ok) return;
  if (!r.payload.bg) post('craftAnim', { time: r.payload.time, label: `Making ${qty}x ${p.label}`, dict: p.animDict, clip: p.animClip, prop: p.prop });
  else { toast('Crafting in the background.', 'success'); refreshPage(); }
};
ACT.craftCancel = async () => { const r = await run('craftCancel', {}, 'Cancelled. Ingredients returned.'); if (r.ok) refreshPage(); };
ACT.claimHeld = async el => { const r = await run('claimHeld', { product: el.dataset.arg }, 'Taken.'); if (r.ok) refreshPage(); };
ACT.tablePickup = async () => { const r = await run('tablePickup', {}, 'Table picked up.'); if (r.ok) refreshPage(); };

// ================================================================== CAREER
function barChart(points, key, color) {
  const w = 600, h = 120, pad = 6, max = Math.max(1, ...points.map(p => p[key])), bw = (w - pad * 2) / points.length;
  return `<svg class="chart" viewBox="0 0 ${w} ${h + 16}" preserveAspectRatio="none">${points.map((p, i) => {
    const bh = Math.max(2, p[key] / max * (h - 8)); return `<rect x="${pad + i * bw + 3}" y="${h - bh}" width="${bw - 6}" height="${bh}" rx="3" fill="${color}" opacity=".85"><title>${p.day}: ${num(p[key])}</title></rect>`;
  }).join('')}${points.map((p, i) => i % 3 === 0 ? `<text x="${pad + i * bw + bw / 2}" y="${h + 13}" font-size="9" fill="var(--muted)" text-anchor="middle">${p.day}</text>` : '').join('')}</svg>`;
}
PAGES.career = {
  title: 'Career', sub: 'Every craft and sale earns XP',
  async render(el) {
    const r = await req('career'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const d = S.cache.careerData = r.payload; S.cache.level = d.level; renderHeader();
    el.innerHTML = `<div class="card"><div class="row-flex" style="justify-content:space-between"><div><div class="muted xs">Level ${d.level}</div><h2 style="margin:0">${esc(d.name)}</h2></div>${pill('+' + (+d.boost).toFixed(1) + '% on every sale', 'gold')}</div><div style="margin-top:14px">${xpBar(d)}</div></div>
      <div class="stats"><div class="stat"><b>${num(d.crafted)}</b><span>Made</span></div><div class="stat"><b>${num(d.sold)}</b><span>Sold</span></div><div class="stat"><b>${cash(d.earned)}</b><span>Earned</span></div><div class="stat"><b>${num(d.weekXp)}</b><span>XP this week</span></div></div>
      <div class="grid"><div class="card"><h3>XP, last 14 days</h3>${barChart(d.chart, 'xp', 'var(--accent)')}</div><div class="card"><h3>Money, last 14 days</h3>${barChart(d.chart, 'earned', '#22c55e')}</div></div>
      <div class="section">Levels</div>${d.levels.map(l => `<div class="row ${l.n === d.level ? 'current-row' : ''}"><div class="rank-num ${l.reached ? 'r1' : ''}">${l.n}</div><div class="grow"><div class="name">${esc(l.name)} ${l.n === d.level ? pill('You', 'open') : ''}</div><div class="meta"><span>${num(l.xp)} XP</span><span>+${l.boost}% sales</span>${l.cash ? `<span>${cash(l.cash)}</span>` : ''}${l.item && l.count ? `<span>${l.count}x ${esc(l.item.replace('glam_', ''))}</span>` : ''}</div></div>
      ${l.claimable ? `<button class="btn small primary" data-act="levelClaim" data-arg="${l.n}">${ico('gift', 14)} Claim</button>` : (l.claimed ? pill('Claimed', 'open') : (l.reached ? '' : pill('Locked')))}</div>`).join('')}`;
  },
};
ACT.levelClaim = async el => { const r = await run('levelClaim', { n: parseInt(el.dataset.arg, 10) }); if (r.ok) refreshPage(); };

// ================================================================== TASKS
PAGES.tasks = {
  title: 'Daily tasks', sub: () => S.cache.tasks ? `New tasks in ${fmtLong(S.cache.tasks.resetIn)}` : '',
  async render(el) {
    const r = await req('tasks'); if (!r.ok) { el.innerHTML = empty('Not available', r.payload); return; }
    const d = S.cache.tasks = r.payload; renderHeader();
    if (d.enabled === false) { el.innerHTML = empty('Daily tasks are off', ''); return; }
    el.innerHTML = `<div class="grid">${d.tasks.map(t => `<div class="card"><div class="row-flex" style="justify-content:space-between"><div class="row-flex"><span class="np-ico">${ico(TASK_ICON[t.type] || 'check', 16)}</span><b>${TASK_TEXT[t.type](t)}</b></div>${t.done ? pill('Done', 'open') : pill(cash(t.cash) + ' + ' + t.xp + ' XP', 'gold')}</div>
      <div class="row-flex" style="margin:12px 0 6px;justify-content:space-between"><span class="muted">${num(t.progress)} / ${num(t.goal)}</span></div>${bar(t.progress, t.goal, t.done ? 'done' : '')}</div>`).join('')}</div>
      <div class="card"><div class="row-flex" style="justify-content:space-between"><b>${ico('gift', 16)} Finish all tasks</b>${d.bonus.done ? pill('Bonus paid', 'open') : pill(cash(d.bonus.cash) + ' + ' + d.bonus.xp + ' XP', 'gold')}</div></div>
      <div class="section">Streak</div><div class="card"><div class="row-flex" style="justify-content:space-between"><div class="row-flex"><span style="color:#fb923c">${ico('flame', 28)}</span><div><b style="font-size:22px">${d.streak} day${d.streak === 1 ? '' : 's'}</b><div class="muted xs">Best: ${d.best} days. Finish every task each day to keep it going.</div></div></div></div>
      <div class="streak-ladder">${d.rewards.map(r => `<div class="step ${r.reached ? 'on' : ''}"><b>${r.days}</b><span>days</span><small>${cash(r.cash)}</small></div>`).join('')}</div></div>`;
  },
};

// ================================================================== LEADERBOARDS
PAGES.boards = {
  title: 'Leaderboards', sub: 'Top three on every board win cash when the day, week and month end',
  async render(el) {
    const board = S.tab.board || 'sold', period = S.tab.period || 'day';
    const names = { sold: 'Top Sellers', crafted: 'Top Crafters', earned: 'Top Earners', streak: 'Top Streaks' };
    el.innerHTML = `<div class="tabs">${Object.entries(names).map(([k, v]) => `<button class="tab ${board === k ? 'active' : ''}" data-act="boardTab" data-arg="${k}">${v}</button>`).join('')}</div>
      <div class="tabs">${['day', 'week', 'month', 'all'].map(p => `<button class="tab ${period === p ? 'active' : ''}" data-act="periodTab" data-arg="${p}">${{ day: 'Today', week: 'This week', month: 'This month', all: 'All time' }[p]}</button>`).join('')}</div><div id="board-body"></div>`;
    const r = await req('boards', { board, period }); if (!r.ok) { $('#board-body').innerHTML = empty('Not available', r.payload); return; }
    const d = r.payload, fmt = v => board === 'earned' ? cash(v) : (board === 'streak' ? v + ' days' : num(v));
    $('#board-body').innerHTML = (d.me ? `<div class="card me-rank"><div class="row-flex" style="justify-content:space-between"><div><div class="muted xs">Your rank</div><b style="font-size:22px">${d.me.rank ? '#' + d.me.rank : 'Not ranked yet'}</b></div><div style="text-align:right"><div class="muted xs">Your score</div><b style="font-size:22px">${fmt(d.me.value)}</b></div></div></div>` : '')
      + (d.prizes.length ? `<div class="row-flex wrap" style="margin-bottom:10px"><span class="muted xs">Prizes:</span>${d.prizes.sort((a, b) => a.rank - b.rank).map(p => pill('#' + p.rank + ' ' + cash(p.cash), 'gold')).join('')}</div>` : '')
      + (d.rows.length ? d.rows.map((p, i) => `<div class="row click" data-act="profileOpen" data-arg="${esc(p.pub)}"><div class="rank-num r${i + 1}">${i + 1}</div>${avatar(p.picture, p.name, S.settings.themeColor, '')}<div class="grow"><div class="name">${esc(p.name)}${p.verified ? ` <span style="color:#7dd3fc">${ico('badge', 14)}</span>` : ''}</div></div><b>${fmt(p.value)}</b></div>`).join('') : empty('Nobody on the board yet', 'Be the first.'));
  },
};
ACT.boardTab = el => { S.tab.board = el.dataset.arg; refreshPage(); };
ACT.periodTab = el => { S.tab.period = el.dataset.arg; refreshPage(); };

// ================================================================== STARTER PACK
ACT.starterOpen = async () => {
  const r = await run('starter'); if (!r.ok) return;
  const d = r.payload; S.cache.starter = d; S.cache.starterPicks = [];
  const carHtml = d.picks > 0 && d.cars.length ? `<div class="section">Pick ${d.picks === 1 ? 'a ride' : 'up to ' + d.picks + ' rides'}</div>${d.cars.map((c, i) => `<div class="row click" data-act="starterCar" data-arg="${i + 1}"><div class="check" id="car-${i + 1}"></div><div class="grow"><div class="name">${esc(c.label)}</div></div></div>`).join('')}` : '';
  modal(`<h3>${ico('gift', 20)} Starter pack</h3>${d.claimed ? '<p class="muted">You already claimed your starter pack.</p>' : `<div class="chip-wrap">${d.items.map(i => `<div class="prod-chip">${itemIcon(i.item)}<span>${esc(i.label)}</span><b>${i.count}</b></div>`).join('')}</div>${carHtml}`}
    <div class="section">First steps</div>${d.steps.map(s => `<div class="row-flex" style="margin-bottom:6px"><div class="check ${s.done ? 'on' : ''}">${s.done ? ico('check', 12) : ''}</div><span class="${s.done ? 'muted' : ''}">${esc(s.label)}</span></div>`).join('')}
    <div class="modal-actions"><button class="btn" data-act="closeModal">Close</button>${d.claimed ? '' : '<button class="btn primary" data-act="starterClaim">Claim starter pack</button>'}</div>`, { noFocus: true });
};
ACT.starterCar = el => {
  const i = parseInt(el.dataset.arg, 10), picks = S.cache.starter.picks, list = S.cache.starterPicks, at = list.indexOf(i);
  if (at >= 0) list.splice(at, 1); else { if (list.length >= picks) list.shift(); list.push(i); }
  $$('[id^=car-]').forEach(c => c.classList.toggle('on', list.includes(parseInt(c.id.slice(4), 10))));
};
ACT.starterClaim = async () => { const r = await run('starterClaim', { cars: S.cache.starterPicks || [] }); if (r.ok) { closeModal(); refreshPage(); } };

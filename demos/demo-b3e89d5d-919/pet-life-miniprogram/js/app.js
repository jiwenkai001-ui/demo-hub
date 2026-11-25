/* ============================================================
 * 森田宠物生活馆 · 业务逻辑
 * 纯原生 JS：状态管理 / 路由 / 渲染 / 事件
 * ============================================================ */

/* ---------------- 状态 ---------------- */
const STORE_KEY = 'pet_life_store_v1';

let S = null; // 全局状态

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

function initStore(force) {
  let saved = null;
  if (!force) {
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { saved = null; }
  }
  if (saved) { S = saved; return; }

  S = {
    shop: deepClone(SEED.shop),
    services: deepClone(SEED.services),
    goods: deepClone(SEED.goods),
    levels: deepClone(SEED.levels),
    categories: deepClone(SEED.categories),
    goodsCats: deepClone(SEED.goodsCats),
    staffs: deepClone(SEED.staffs),
    timeSlots: deepClone(SEED.timeSlots),
    rechargePlans: deepClone(SEED.rechargePlans),
    member: deepClone(SEED.member),
    pets: deepClone(SEED.pets),
    addresses: deepClone(SEED.addresses),
    orders: deepClone(SEED.orders),
    pointLogs: deepClone(SEED.pointLogs),
    cart: [],           // {id, qty, checked}
    bookings: [],       // {id, serviceId, staffId, petId, date, time, days, amount, payAmount, status, createTime, remark}
    seq: 100
  };
  save();
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { }
}

/* ---------------- 工具 ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function money(n) {
  const v = Math.round(n * 100) / 100;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

function todayStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function nowStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${todayStr(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function dateAdd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function uid(prefix) {
  S.seq++;
  return prefix + Date.now().toString().slice(-6) + String(S.seq);
}

/* ---------------- 会员等级 ---------------- */
function currentLevel() {
  const spend = S.member.totalSpend || 0;
  let lv = S.levels[0];
  S.levels.forEach(l => { if (spend >= l.minSpend) lv = l; });
  return lv;
}
function nextLevel() {
  const cur = currentLevel();
  const i = S.levels.findIndex(l => l.id === cur.id);
  return S.levels[i + 1] || null;
}

/* ---------------- Toast / 弹层 ---------------- */
let toastTimer = null;
function toast(msg, icon) {
  const el = $('#toast');
  el.innerHTML = (icon ? `<span>${icon}</span>` : '') + `<span>${msg}</span>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

function openSheet(html) {
  $('#sheet-content').innerHTML = html;
  $('#mask-sheet').classList.add('show');
}
function closeSheet() { $('#mask-sheet').classList.remove('show'); }

let dialogOkCb = null;
function confirmDialog({ icon = '❓', title = '提示', desc = '', okText = '确定', cancelText = '取消', onOk }) {
  $('#dg-icon').textContent = icon;
  $('#dg-title').textContent = title;
  $('#dg-desc').textContent = desc;
  const btns = $$('#mask-dialog .dg-btns .btn');
  btns[0].textContent = cancelText;
  btns[1].textContent = okText;
  dialogOkCb = onOk;
  $('#mask-dialog').classList.add('show');
}
function closeDialog() { $('#mask-dialog').classList.remove('show'); dialogOkCb = null; }

/* ---------------- 路由 ---------------- */
let currentPage = 'login';
let pageStack = [];   // 记录从 tab 页进入子页面的路径
let subParams = {};   // 当前子页面参数

const RENDERERS = {
  'page-home': renderHome,
  'page-book': renderBook,
  'page-mall': renderMall,
  'page-me': renderMe,
  'page-member': renderMember,
  'page-pets': renderPets,
  'page-my-book': renderMyBook,
  'page-orders': renderOrders,
  'page-coupons': renderCoupons,
  'page-points': renderPoints,
  'page-balance': renderBalance,
  'page-address': renderAddress,
  'page-service-detail': renderServiceDetail,
  'page-booking-confirm': renderBookingConfirm,
  'page-goods-detail': renderGoodsDetail,
  'page-cart': renderCart,
  'page-checkout': renderCheckout,
  'page-order-detail': renderOrderDetail,
  'page-success': renderSuccess
};

const TAB_PAGES = ['page-home', 'page-book', 'page-mall', 'page-me'];
const TAB_OF_PAGE = { 'page-home': 'home', 'page-book': 'book', 'page-mall': 'mall', 'page-me': 'me' };

function go(id, params) {
  if (params) subParams = params;
  if (id === 'page-login') { pageStack = []; }

  // 记录子页面来源（用于返回）
  if (!TAB_PAGES.includes(id) && id !== 'page-login') {
    const from = currentPage;
    if (TAB_PAGES.includes(from)) pageStack = [TAB_OF_PAGE[from]];
    else if (pageStack.length === 0) pageStack = ['home'];
  }

  $$('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  currentPage = id;

  if (RENDERERS[id]) RENDERERS[id]();

  const topLevel = TAB_PAGES.includes(id);
  $('#tabbar').style.display = topLevel ? 'flex' : 'none';
  $$('.tab-item').forEach(t => t.classList.toggle('on', t.dataset.tab === TAB_OF_PAGE[id]));

  $('#viewport').scrollTop = 0;
  syncCartBadge();
}

function back() {
  if (pageStack.length) {
    const t = pageStack.pop();
    go('page-' + (t === 'home' ? 'home' : t));
  } else {
    go('page-home');
  }
}

/* ---------------- 页面标题辅助 ---------------- */
function navBar(title, opts = {}) {
  return `<div class="navbar solid">
    <div class="nav-back" data-act="back">‹</div>
    <div class="nav-title">${title}</div>
    ${opts.right ? `<div class="nav-action" data-act="${opts.rightAct || ''}">${opts.right}</div>` : ''}
  </div>`;
}

/* ============================================================
 * 渲染：首页
 * ============================================================ */
function renderHome() {
  const sp = S.shop;
  $('#shop-name').textContent = sp.name;
  $('#shop-slogan').textContent = sp.slogan;
  $('#shop-status').textContent = sp.status;
  $('#shop-rating').textContent = sp.rating;
  $('#shop-reviews').textContent = `${sp.reviews} 条评价`;
  $('#shop-hours').textContent = sp.hours;
  $('#shop-addr').textContent = sp.address;
  $('#shop-distance').textContent = sp.distance;

  // 会员横幅
  const lv = currentLevel();
  const mb = $('#mb-badge'), ml = $('#mb-level'), md = $('#mb-desc'), mbtn = $('#mb-btn');
  if (S.member.logged) {
    mb.textContent = lv.icon;
    ml.textContent = lv.name;
    md.textContent = `享全单 ${(lv.discount * 10).toFixed(1).replace('.0', '')} 折 · 积分 ${lv.pointRate} 倍 · 余 ${S.member.points} 分`;
    mbtn.textContent = '查看权益';
  } else {
    mb.textContent = '🎁';
    ml.textContent = '开通会员享专属折扣';
    md.textContent = '登录后最高可享 8.5 折 + 积分抵现';
    mbtn.textContent = '立即登录';
  }

  // 分类
  $('#home-cats').innerHTML = S.categories.map(c => `
    <div class="cat-item" data-act="go-cat" data-cat="${c.id}">
      <div class="ci-icon" style="background:${c.color}1F;color:${c.color}">${catIcon(c.icon)}</div>
      <div class="ci-name">${c.name}</div>
      <div class="ci-desc">${c.desc}</div>
    </div>`).join('');

  // 热门服务
  const hotSvc = S.services.filter(s => s.hot).slice(0, 6);
  $('#home-services').innerHTML = hotSvc.map(s => svcMiniCard(s)).join('');

  // 精选商品
  $('#home-goods').innerHTML = S.goods.filter(g => ['G001', 'G004', 'G007', 'G010'].includes(g.id))
    .map(g => goodsCard(g)).join('');
}

function catIcon(name) {
  const m = { scissors: '✂️', bath: '🛁', home: '🏠', bag: '🛍️' };
  return m[name] || '🐾';
}

function svcMiniCard(s) {
  const meta = s.cat === 'boarding' ? '1 天起 · 独立房间' : `${s.duration} 分钟`;
  const bg = { grooming: '#FFF1E9', bath: '#E8F7F1', boarding: '#EDF2FC' }[s.cat] || '#FFF1E9';
  const emoji = { grooming: '✂️', bath: '🛁', boarding: '🏠' }[s.cat] || '🐾';
  return `<div class="svc-mini" data-act="svc-detail" data-id="${s.id}">
    <div class="sm-cover" style="background:${bg}">
      <span>${emoji}</span>
      ${s.tag ? `<div class="sm-tag">${s.tag}</div>` : ''}
    </div>
    <div class="sm-body">
      <div class="sm-name">${s.name}</div>
      <div class="sm-meta">${meta} · 已售 ${s.sales}</div>
      <div class="sm-price"><span class="p">${s.price}</span><span class="u">/${s.unit}</span></div>
      <button class="sm-btn" data-act="svc-detail" data-id="${s.id}">立即预约</button>
    </div>
  </div>`;
}

function goodsCard(g) {
  const bg = { food: '#FFF1E9', snack: '#FDF4E1', toy: '#EDF2FC', care: '#E8F7F1', clean: '#F0FAF5' }[g.cat] || '#FFF1E9';
  return `<div class="goods-card" data-act="goods-detail" data-id="${g.id}">
    <div class="gc-cover" style="background:${bg}">
      <span>${g.emoji}</span>
      ${g.tag ? `<div class="gc-tag">${g.tag}</div>` : ''}
    </div>
    <div class="gc-body">
      <div class="gc-name">${g.name}</div>
      <div class="gc-rate"><b>★ ${g.rate}</b> · 已售 ${g.sales}</div>
      <div class="gc-foot">
        <div><span class="gc-price">${g.price}</span><span class="gc-orig">¥${g.origPrice}</span></div>
        <button class="gc-add" data-act="add-cart" data-id="${g.id}">+</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
 * 渲染：预约
 * ============================================================ */
let bookFilter = 'all';

function renderBook() {
  const tabs = [
    { id: 'all', name: '全部' },
    { id: 'grooming', name: '美容' },
    { id: 'bath', name: '洗澡' },
    { id: 'boarding', name: '寄养' }
  ];
  $('#book-filters').innerHTML = tabs.map(t =>
    `<div class="filter-chip ${bookFilter === t.id ? 'on' : ''}" data-act="book-filter" data-v="${t.id}">${t.name}</div>`
  ).join('');

  const list = S.services.filter(s => bookFilter === 'all' || s.cat === bookFilter);
  const bg = { grooming: '#FFF1E9', bath: '#E8F7F1', boarding: '#EDF2FC' };
  const emoji = { grooming: '✂️', bath: '🛁', boarding: '🏠' };
  const catName = { grooming: '宠物美容', bath: '宠物洗澡', boarding: '宠物寄养' };

  $('#book-list').innerHTML = list.map(s => `
    <div class="card" style="display:flex;gap:13px;padding:14px;margin-bottom:12px" data-act="svc-detail" data-id="${s.id}">
      <div style="width:74px;height:74px;border-radius:16px;flex:none;background:${bg[s.cat]};display:flex;align-items:center;justify-content:center;font-size:34px">${emoji[s.cat]}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:14.5px;font-weight:700">${s.name}</span>
          ${s.tag ? `<span class="chip">${s.tag}</span>` : ''}
        </div>
        <div style="font-size:11.5px;color:var(--text-3);margin-top:5px">${catName[s.cat]} · ${s.cat === 'boarding' ? '按天计费' : s.duration + ' 分钟'} · 已售 ${s.sales}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:9px">
          <div><span style="color:var(--primary);font-size:18px;font-weight:800">¥${s.price}</span><span style="font-size:11px;color:var(--text-3)">/${s.unit}</span></div>
          <button class="btn btn-ghost btn-sm" data-act="svc-detail" data-id="${s.id}">去预约</button>
        </div>
      </div>
    </div>`).join('');
}

/* --------- 服务详情 --------- */
function renderServiceDetail() {
  const s = S.services.find(x => x.id === subParams.id);
  if (!s) { go('page-book'); return; }
  const bg = { grooming: 'linear-gradient(160deg,#FFF1E9,#FFE0CC)', bath: 'linear-gradient(160deg,#E8F7F1,#D3F0E5)', boarding: 'linear-gradient(160deg,#EDF2FC,#DCE7FA)' }[s.cat];
  const emoji = { grooming: '✂️', bath: '🛁', boarding: '🏠' }[s.cat];
  const lv = currentLevel();
  const vipPrice = money(s.price * lv.discount);

  $('#page-service-detail').innerHTML = `
    ${navBar('服务详情')}
    <div class="detail-cover" style="background:${bg}"><span>${emoji}</span></div>
    <div class="detail-body">
      <div class="detail-price">
        <span class="p">${s.price}</span><span style="font-size:13px;color:var(--text-3)">元 / ${s.unit}</span>
        ${lv.discount < 1 ? `<span class="chip chip-gold" style="margin-left:6px">会员价 ¥${vipPrice}</span>` : ''}
      </div>
      <div class="detail-title">${s.name}</div>
      <div class="detail-tags">
        ${s.tag ? `<span class="chip">${s.tag}</span>` : ''}
        <span class="chip chip-mint">已售 ${s.sales}</span>
        <span class="chip chip-blue">${s.cat === 'boarding' ? '按天计费' : s.duration + ' 分钟'}</span>
      </div>
      <div class="detail-meta">
        <span>适用对象：<b>${s.suitable}</b></span>
      </div>

      <div class="info-block">
        <h4>服务介绍</h4>
        <p>${s.desc}</p>
      </div>

      <div class="info-block">
        <h4>服务包含</h4>
        <div class="inc-list">${s.includes.map(i => `<span>✓ ${i}</span>`).join('')}</div>
      </div>

      <div class="info-block">
        <h4>预约须知</h4>
        <p>· 请提前 1 天预约，到店前 2 小时可免费取消<br>
           · 服务前请确认宠物健康状况良好、已完成基础免疫<br>
           · 首次到店需出示宠物疫苗接种证明<br>
           · 如宠物有应激史或特殊状况，请提前告知美容师</p>
      </div>
    </div>
    <div class="bottom-bar no-tab">
      <div class="bb-info">
        <div class="bb-price">${s.price}</div>
        <div class="bb-note">${lv.discount < 1 ? `${lv.name}价 ¥${vipPrice}` : '会员可享折扣'}</div>
      </div>
      <button class="btn btn-primary btn-lg" data-act="to-booking" data-id="${s.id}">立即预约</button>
    </div>`;
}

/* --------- 预约下单 --------- */
let bookingDraft = null;

function renderBookingConfirm() {
  const s = S.services.find(x => x.id === subParams.id);
  if (!s) { go('page-book'); return; }

  const isBoard = s.cat === 'boarding';
  const dates = Array.from({ length: 7 }, (_, i) => dateAdd(i));

  // 仅在首次进入（或切换服务）时初始化草稿，避免重渲染清空用户已选内容
  if (!bookingDraft || bookingDraft.serviceId !== s.id) {
    bookingDraft = {
      serviceId: s.id,
      petId: S.pets[0] ? S.pets[0].id : '',
      date: todayStr(dates[0]),
      time: '',
      staffId: 'T04',
      days: 1,
      remark: ''
    };
  }
  const d = bookingDraft;

  const dateHtml = dates.map(dt => {
    const val = todayStr(dt);
    const i = dates.indexOf(dt);
    return `
    <div class="date-item ${d.date === val ? 'on' : ''}" data-act="pick-date" data-v="${val}">
      <div class="d-week">${i === 0 ? '今天' : WEEK[dt.getDay()]}</div>
      <div class="d-day">${dt.getDate()}</div>
    </div>`;
  }).join('');

  const slotHtml = S.timeSlots.map((t, i) => {
    const full = (i === 3) || (i === 8); // 模拟部分时段已满
    return `<div class="slot ${full ? 'disabled' : ''} ${d.time === t ? 'on' : ''}" data-act="pick-slot" data-v="${t}">
      ${t}<small>${full ? '已约满' : '可约'}</small>
    </div>`;
  }).join('');

  const petHtml = S.pets.map(p => `
    <div class="pet-pick-item ${p.id === d.petId ? 'on' : ''}" data-act="pick-pet" data-v="${p.id}">
      <div class="pp-avatar">${p.avatar}</div>
      <div class="pp-name">${p.name}</div>
      <div class="pp-breed">${p.breed}</div>
    </div>`).join('') + `
    <div class="pet-pick-item add-pet" data-act="go-pets">
      <div class="pp-avatar">＋</div>
      <div class="pp-name">添加宠物</div>
    </div>`;

  const staffHtml = S.staffs.map(t => `
    <div class="staff-item ${t.id === d.staffId ? 'on' : ''}" data-act="pick-staff" data-v="${t.id}">
      <div class="st-avatar">${t.avatar}</div>
      <div class="st-name">${t.name}</div>
      <div class="st-tag">${t.tag}</div>
    </div>`).join('');

  $('#page-booking-confirm').innerHTML = `
    ${navBar('确认预约')}
    <div class="wrap">
      <div class="card" style="display:flex;gap:12px;padding:14px">
        <div style="width:52px;height:52px;border-radius:14px;flex:none;background:#FFF1E9;display:flex;align-items:center;justify-content:center;font-size:26px">
          ${{ grooming: '✂️', bath: '🛁', boarding: '🏠' }[s.cat]}
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700">${s.name}</div>
          <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">${isBoard ? '按天计费 · 每日护理' : s.duration + ' 分钟 · 一对一服务'}</div>
          <div style="color:var(--primary);font-size:16px;font-weight:800;margin-top:5px">¥${s.price}<span style="font-size:11px;color:var(--text-3);font-weight:400">/${s.unit}</span></div>
        </div>
      </div>

      <div class="sec-head" style="padding-left:2px"><h3>选择宠物</h3></div>
      <div class="pet-pick">${petHtml}</div>

      <div class="sec-head" style="padding-left:2px"><h3>选择日期</h3></div>
      <div class="date-scroll" id="book-dates">${dateHtml}</div>

      ${isBoard ? `
      <div class="sec-head" style="padding-left:2px"><h3>寄养天数</h3></div>
      <div class="form-card" style="padding:0 16px">
        <div class="form-row">
          <label>寄养天数</label>
          <div class="fi-right" style="margin-left:auto;display:flex;align-items:center;gap:10px">
            <div class="stepper">
              <button data-act="days-minus">−</button>
              <span class="sv" id="board-days">${d.days}</span>
              <button data-act="days-plus">+</button>
            </div>
            <span style="font-size:11.5px;color:var(--text-3)">天</span>
          </div>
        </div>
      </div>` : ''}

      <div class="sec-head" style="padding-left:2px"><h3>选择时段</h3></div>
      <div class="slot-grid" id="book-slots">${slotHtml}</div>

      <div class="sec-head" style="padding-left:2px"><h3>指定美容师</h3></div>
      <div class="staff-pick">${staffHtml}</div>

      <div class="sec-head" style="padding-left:2px"><h3>备注</h3></div>
      <div class="form-card">
        <div class="form-row" style="align-items:flex-start">
          <label style="padding-top:2px">备注</label>
          <textarea id="book-remark" rows="2" placeholder="宠物的特殊习惯、过敏史等（选填）">${d.remark || ''}</textarea>
        </div>
      </div>

      <div style="height:14px"></div>
    </div>

    <div class="bottom-bar no-tab">
      <div class="bb-info">
        <div class="bb-price" id="book-total">${s.price}</div>
        <div class="bb-note" id="book-note">${currentLevel().discount < 1 ? currentLevel().name + ' 9 折优惠将在结算时计算' : '请选择预约时间'}</div>
      </div>
      <button class="btn btn-primary btn-lg" data-act="submit-booking" data-id="${s.id}">提交预约</button>
    </div>`;

  updateBookTotal();
}

function updateBookTotal() {
  if (!bookingDraft) return;
  const s = S.services.find(x => x.id === bookingDraft.serviceId);
  if (!s) return;
  const lv = currentLevel();
  const days = s.cat === 'boarding' ? bookingDraft.days : 1;
  const raw = s.price * days;
  const pay = raw * lv.discount;
  const el = $('#book-total');
  if (el) el.textContent = money(pay);
  const note = $('#book-note');
  if (note) {
    if (lv.discount < 1) {
      note.textContent = `${lv.name} ${(lv.discount * 10).toFixed(1).replace('.0', '')} 折 · 已省 ¥${money(raw - pay)}`;
    } else {
      note.textContent = days > 1 ? `${days} 天 × ¥${s.price}` : '会员可享折扣';
    }
  }
}

/* ============================================================
 * 渲染：商城
 * ============================================================ */
let mallCat = 'all';
let mallKw = '';

function renderMall() {
  $('#mall-filters').innerHTML = S.goodsCats.map(c =>
    `<div class="filter-chip ${mallCat === c.id ? 'on' : ''}" data-act="mall-filter" data-v="${c.id}">${c.name}</div>`
  ).join('');

  const kw = mallKw.trim();
  let list = S.goods.filter(g => mallCat === 'all' || g.cat === mallCat);
  if (kw) list = list.filter(g => g.name.includes(kw));

  $('#mall-list').innerHTML = list.length
    ? list.map(g => goodsCard(g)).join('')
    : `<div style="grid-column:1/-1"><div class="empty">
         <div class="e-icon">🔍</div>
         <div class="e-title">没有找到相关商品</div>
         <div class="e-desc">换个关键词试试吧</div>
       </div></div>`;
}

/* --------- 商品详情 --------- */
function renderGoodsDetail() {
  const g = S.goods.find(x => x.id === subParams.id);
  if (!g) { go('page-mall'); return; }
  const bg = { food: 'linear-gradient(160deg,#FFF1E9,#FFE0CC)', snack: 'linear-gradient(160deg,#FDF4E1,#FBECD2)', toy: 'linear-gradient(160deg,#EDF2FC,#DCE7FA)', care: 'linear-gradient(160deg,#E8F7F1,#D3F0E5)', clean: 'linear-gradient(160deg,#F0FAF5,#DFF3EA)' }[g.cat];
  const lv = currentLevel();
  const vip = money(g.price * lv.discount);
  const catName = { food: '主粮', snack: '零食', toy: '玩具', care: '护理', clean: '清洁' }[g.cat];

  $('#page-goods-detail').innerHTML = `
    ${navBar('商品详情')}
    <div class="detail-cover" style="background:${bg}"><span>${g.emoji}</span></div>
    <div class="detail-body">
      <div class="detail-price">
        <span class="p">${g.price}</span>
        <span class="o">¥${g.origPrice}</span>
        <span class="chip" style="background:#FBEAE7;color:var(--danger)">省 ¥${g.origPrice - g.price}</span>
      </div>
      <div class="detail-title">${g.name}</div>
      <div class="detail-tags">
        <span class="chip">${catName}</span>
        ${g.tag ? `<span class="chip chip-gold">${g.tag}</span>` : ''}
        <span class="chip chip-mint">好评 ${g.rate}</span>
        <span class="chip chip-gray">${g.spec}</span>
      </div>
      <div class="detail-meta">
        <span>库存 <b>${g.stock}</b></span>
        <span>累计销量 <b>${g.sales}</b></span>
        ${lv.discount < 1 ? `<span>会员价 <b style="color:var(--primary)">¥${vip}</b></span>` : ''}
      </div>

      <div class="info-block">
        <h4>商品详情</h4>
        <p>${g.desc}</p>
      </div>
      <div class="info-block">
        <h4>服务保障</h4>
        <p>· 门店直发，正品保证 · 七天无理由退换<br>· 满 99 元包邮 · 支持门店自提</p>
      </div>
      <div style="height:14px"></div>
    </div>
    <div class="bottom-bar no-tab">
      <button class="btn btn-plain" style="flex:none;padding:12px 16px" data-act="go-cart">🛒<span id="detail-cart-num" style="font-size:11px;margin-left:3px"></span></button>
      <button class="btn btn-ghost" style="flex:1" data-act="add-cart" data-id="${g.id}">加入购物车</button>
      <button class="btn btn-primary" style="flex:1" data-act="buy-now" data-id="${g.id}">立即购买</button>
    </div>`;
  syncCartBadge();
}

/* --------- 购物车 --------- */
function renderCart() {
  const lv = currentLevel();
  if (!S.cart.length) {
    $('#page-cart').innerHTML = `${navBar('购物车')}
      <div class="empty">
        <div class="e-icon">🛒</div>
        <div class="e-title">购物车还是空的</div>
        <div class="e-desc">去挑几件毛孩子喜欢的吧</div>
        <button class="btn btn-primary" data-act="go-tab" data-tab="mall">去逛逛</button>
      </div>`;
    return;
  }

  const items = S.cart.map(ci => {
    const g = S.goods.find(x => x.id === ci.id);
    if (!g) return '';
    const bg = { food: '#FFF1E9', snack: '#FDF4E1', toy: '#EDF2FC', care: '#E8F7F1', clean: '#F0FAF5' }[g.cat];
    return `<div class="cart-item">
      <div class="checkbox ${ci.checked ? 'on' : ''}" data-act="cart-check" data-id="${g.id}">✓</div>
      <div class="ci-thumb" style="background:${bg}">${g.emoji}</div>
      <div class="ci-info">
        <div class="ci-name">${g.name}</div>
        <div class="ci-spec">${g.spec}</div>
        <div class="ci-row">
          <div class="ci-price">${money(g.price * lv.discount)}${lv.discount < 1 ? `<span style="font-size:10px;color:var(--text-3);text-decoration:line-through;font-weight:400;margin-left:4px">¥${g.price}</span>` : ''}</div>
          <div class="stepper">
            <button data-act="cart-minus" data-id="${g.id}">−</button>
            <span class="sv">${ci.qty}</span>
            <button data-act="cart-plus" data-id="${g.id}">＋</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  const checked = S.cart.filter(c => c.checked);
  const total = checked.reduce((sum, c) => {
    const g = S.goods.find(x => x.id === c.id);
    return sum + (g ? g.price * lv.discount * c.qty : 0);
  }, 0);

  $('#page-cart').innerHTML = `${navBar('购物车', { right: '清空', rightAct: 'cart-clear' })}
    <div class="wrap" style="padding-top:6px">${items}</div>
    <div class="bottom-bar no-tab" style="bottom:0">
      <div class="checkbox ${checked.length === S.cart.length && S.cart.length ? 'on' : ''}" data-act="cart-check-all">✓</div>
      <div class="bb-info" style="margin-left:2px">
        <div class="bb-price">${money(total)}</div>
        <div class="bb-note">已选 ${checked.length} 件${lv.discount < 1 ? ` · 会员 ${(lv.discount * 10).toFixed(1).replace('.0', '')} 折已生效` : ''}</div>
      </div>
      <button class="btn btn-primary btn-lg" data-act="to-checkout">去结算</button>
    </div>`;
  syncCartBadge();
}

/* --------- 结算 --------- */
let checkoutDraft = null;

function toCheckout(items) {
  checkoutDraft = {
    items,                              // [{id, qty}]
    addressId: (S.addresses.find(a => a.isDefault) || S.addresses[0] || {}).id || '',
    couponId: '',
    usePoints: false,
    remark: ''
  };
  go('page-checkout');
}

function renderCheckout() {
  if (!checkoutDraft || !checkoutDraft.items.length) { go('page-mall'); return; }
  const lv = currentLevel();

  let goodsTotal = 0, itemCount = 0;
  const rows = checkoutDraft.items.map(it => {
    const g = S.goods.find(x => x.id === it.id);
    if (!g) return '';
    goodsTotal += g.price * it.qty;
    itemCount += it.qty;
    const bg = { food: '#FFF1E9', snack: '#FDF4E1', toy: '#EDF2FC', care: '#E8F7F1', clean: '#F0FAF5' }[g.cat];
    return `<div style="display:flex;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)">
      <div style="width:54px;height:54px;border-radius:13px;flex:none;background:${bg};display:flex;align-items:center;justify-content:center;font-size:26px">${g.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;line-height:1.35">${g.name}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:3px">${g.spec}</div>
      </div>
      <div style="text-align:right;flex:none">
        <div style="color:var(--primary);font-size:14px;font-weight:700">¥${money(g.price * lv.discount)}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:3px">×${it.qty}</div>
      </div>
    </div>`;
  }).join('');

  const addr = S.addresses.find(a => a.id === checkoutDraft.addressId);

  // 可用优惠券
  const coupons = S.member.coupons.filter(c =>
    c.status === 'unused' && (c.type === 'goods' || c.type === 'all') && goodsTotal >= c.threshold);
  const coupon = S.member.coupons.find(c => c.id === checkoutDraft.couponId);

  const discountAmt = goodsTotal * (1 - lv.discount);
  const afterDiscount = goodsTotal - discountAmt;
  const couponAmt = coupon ? Math.min(coupon.amount, afterDiscount) : 0;
  const maxPoints = Math.min(S.member.points, Math.floor((afterDiscount - couponAmt) * 100)); // 100 积分 = 1 元
  const pointsAmt = checkoutDraft.usePoints ? Math.min(maxPoints / 100, afterDiscount - couponAmt) : 0;
  const finalPay = Math.max(0.01, afterDiscount - couponAmt - pointsAmt);
  const earnPoints = Math.floor(finalPay * lv.pointRate);

  $('#page-checkout').innerHTML = `
    ${navBar('确认订单')}
    <div class="wrap">
      ${addr ? `
      <div class="card" style="padding:15px;display:flex;gap:12px;align-items:flex-start" data-act="pick-address">
        <span style="font-size:18px">📍</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;font-weight:700">${addr.name} <span style="font-weight:500;color:var(--text-2);margin-left:8px">${addr.phone}</span>${addr.isDefault ? '<span class="chip" style="margin-left:7px">默认</span>' : ''}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:5px;line-height:1.5">${addr.region} ${addr.detail}</div>
        </div>
        <div class="arrow">›</div>
      </div>` : `
      <div class="card" style="padding:16px;text-align:center;color:var(--text-3);font-size:13px" data-act="pick-address">＋ 添加收货地址</div>`}

      <div class="sec-head" style="padding-left:2px"><h3>商品清单</h3><span style="font-size:11.5px;color:var(--text-3)">共 ${itemCount} 件</span></div>
      <div class="card" style="padding:0 14px">${rows}</div>

      <div class="sec-head" style="padding-left:2px"><h3>优惠与抵扣</h3></div>
      <div class="card">
        <div class="pick-row" data-act="pick-coupon">
          <div class="pr-left"><span style="font-size:16px">🎫</span>优惠券</div>
          <div class="pr-val ${coupon ? 'active' : ''}">${coupon ? `-¥${money(coupon.amount)}` : (coupons.length ? `${coupons.length} 张可用` : '暂无可用')} <span style="color:#CFC8C1">›</span></div>
        </div>
        <div class="pick-row">
          <div class="pr-left"><span style="font-size:16px">⭐</span>积分抵扣 <span style="font-size:11px;color:var(--text-3);font-weight:400">(可用 ${maxPoints} 积分 ≈ ¥${money(maxPoints / 100)})</span></div>
          <div class="toggle-switch ${checkoutDraft.usePoints ? 'on' : ''}" data-act="toggle-points"></div>
        </div>
        <div class="pick-row" style="align-items:flex-start">
          <div class="pr-left" style="padding-top:1px"><span style="font-size:16px">📝</span>订单备注</div>
          <input id="co-remark" placeholder="选填，如配送时间要求" value="${checkoutDraft.remark}" style="text-align:right;font-size:12.5px;flex:1;min-width:0">
        </div>
      </div>

      <div class="sec-head" style="padding-left:2px"><h3>费用明细</h3></div>
      <div class="card" style="padding:6px 16px 14px">
        <div class="amount-row"><span class="ar-label">商品总额</span><span class="ar-val">¥${money(goodsTotal)}</span></div>
        ${lv.discount < 1 ? `<div class="amount-row"><span class="ar-label">${lv.name}折扣（${(lv.discount * 10).toFixed(1).replace('.0', '')} 折）</span><span class="ar-val minus">-¥${money(discountAmt)}</span></div>` : ''}
        ${couponAmt ? `<div class="amount-row"><span class="ar-label">优惠券</span><span class="ar-val minus">-¥${money(couponAmt)}</span></div>` : ''}
        ${pointsAmt ? `<div class="amount-row"><span class="ar-label">积分抵扣</span><span class="ar-val minus">-¥${money(pointsAmt)}</span></div>` : ''}
        <div class="amount-row"><span class="ar-label">运费</span><span class="ar-val">满 99 包邮</span></div>
        <div class="amount-row total"><span class="ar-label">实付款</span><span class="ar-val">${money(finalPay)}</span></div>
        <div style="font-size:11px;color:var(--text-3);text-align:right;margin-top:6px">下单后可得 <b style="color:var(--amber)">${earnPoints}</b> 积分</div>
      </div>
      <div style="height:14px"></div>
    </div>

    <div class="bottom-bar no-tab">
      <div class="bb-info">
        <div class="bb-price">${money(finalPay)}</div>
        <div class="bb-note">已优惠 ¥${money(discountAmt + couponAmt + pointsAmt)}</div>
      </div>
      <button class="btn btn-primary btn-lg" data-act="submit-order">提交订单</button>
    </div>`;

  // 缓存计算结果供提交使用
  checkoutDraft._calc = { goodsTotal, discountAmt, couponAmt, pointsAmt, finalPay, earnPoints, pointsUsed: Math.round(pointsAmt * 100) };
}

/* ============================================================
 * 渲染：我的
 * ============================================================ */
function renderMe() {
  const lv = currentLevel();
  $('#me-avatar').textContent = S.member.avatar;
  $('#me-name').textContent = S.member.logged ? S.member.nickname : '未登录';
  $('#me-phone').textContent = S.member.logged ? `手机号 ${S.member.phone} · 入会 ${S.member.joinDate}` : '点击登录，享会员专属权益';
  $('#me-level').innerHTML = `${lv.icon} ${lv.name}`;

  $('#me-points').textContent = S.member.points;
  $('#me-coupons').textContent = S.member.coupons.filter(c => c.status === 'unused').length;
  $('#me-balance').textContent = money(S.member.balance);

  // 订单导航
  const waitPay = S.orders.filter(o => o.status === 'waitpay').length;
  const waitSend = S.orders.filter(o => o.status === 'waitsend').length;
  const doneCount = S.orders.filter(o => o.status === 'done').length;
  $('#me-order-nav').innerHTML = `
    <div class="on-item" data-act="go-orders">
      <div class="oi-icon">💰</div><div class="oi-label">待付款</div>
      ${waitPay ? `<span class="oi-badge">${waitPay}</span>` : ''}
    </div>
    <div class="on-item" data-act="go-orders">
      <div class="oi-icon">📦</div><div class="oi-label">待发货</div>
      ${waitSend ? `<span class="oi-badge">${waitSend}</span>` : ''}
    </div>
    <div class="on-item" data-act="go-orders">
      <div class="oi-icon">🚚</div><div class="oi-label">待收货</div>
    </div>
    <div class="on-item" data-act="go-orders">
      <div class="oi-icon">✅</div><div class="oi-label">已完成</div>
    </div>`;

  $('#me-pet-count').textContent = `共 ${S.pets.length} 只`;
  const bookCount = S.bookings.filter(b => b.status === 'wait').length;
  $('#me-book-count').textContent = bookCount ? `${bookCount} 条待服务` : `共 ${S.bookings.length} 条`;
  $('#me-addr-count').textContent = `${S.addresses.length} 个地址`;
  $('#me-shop-phone').textContent = S.shop.phone;
}

/* --------- 会员中心 --------- */
function renderMember() {
  const lv = currentLevel();
  const nx = nextLevel();
  const gap = nx ? Math.max(0, nx.minSpend - S.member.totalSpend) : 0;
  const progress = nx ? Math.min(100, (S.member.totalSpend - lv.minSpend) / (nx.minSpend - lv.minSpend) * 100) : 100;

  $('#page-member').innerHTML = `
    ${navBar('会员中心')}
    <div class="vip-card">
      <div class="vc-head">
        <div class="vc-avatar">${S.member.avatar}</div>
        <div>
          <div class="vc-name">${S.member.nickname}</div>
          <div class="vc-level">${lv.icon} ${lv.name}</div>
        </div>
      </div>
      <div class="vc-stats">
        <div class="vc-stat"><div class="n">${S.member.points}</div><div class="l">可用积分</div></div>
        <div class="vc-stat"><div class="n">${money(S.member.balance)}<small>元</small></div><div class="l">储值余额</div></div>
        <div class="vc-stat"><div class="n">${S.member.coupons.filter(c => c.status === 'unused').length}<small>张</small></div><div class="l">优惠券</div></div>
      </div>
      <div class="vc-progress">
        <div class="vp-bar"><div class="vp-fill" style="width:${progress}%"></div></div>
        <div class="vp-text">
          <span>累计消费 ¥${money(S.member.totalSpend)}</span>
          <span>${nx ? `再消费 ¥${money(gap)} 升级${nx.name}` : '已是最高等级'}</span>
        </div>
      </div>
    </div>

    <div class="wrap mt16">
      <div class="btn btn-primary btn-block" data-act="go-balance">💳 立即充值 · 最高赠 25%</div>
    </div>

    <div class="sec-head"><h3>当前等级权益</h3></div>
    <div class="wrap">
      <div class="card card-pad">
        ${lv.perks.map(p => `
          <div style="display:flex;align-items:center;gap:9px;padding:8px 0">
            <span style="color:var(--mint);font-size:14px">✓</span>
            <span style="font-size:13px">${p}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="sec-head"><h3>会员等级体系</h3></div>
    <div class="wrap">
      ${S.levels.map(l => {
    const on = l.id === lv.id;
    return `<div class="card card-pad" style="margin-bottom:10px;${on ? 'border:1.5px solid var(--primary)' : ''}">
          <div style="display:flex;align-items:center;gap:11px">
            <div style="width:42px;height:42px;border-radius:13px;flex:none;background:${l.color}22;display:flex;align-items:center;justify-content:center;font-size:21px">${l.icon}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;display:flex;align-items:center;gap:7px">
                ${l.name}
                ${on ? '<span class="chip">当前等级</span>' : ''}
              </div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">累计消费满 ¥${l.minSpend} 可升级</div>
            </div>
            <div style="text-align:right;flex:none">
              <div style="color:var(--primary);font-size:16px;font-weight:800">${(l.discount * 10).toFixed(1).replace('.0', '')}折</div>
              <div style="font-size:10.5px;color:var(--text-3)">积分${l.pointRate}倍</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
            ${l.perks.map(p => `<span class="chip chip-gray" style="font-weight:500">${p}</span>`).join('')}
          </div>
        </div>`;
  }).join('')}
    </div>
    <div style="height:20px"></div>`;
}

/* --------- 宠物档案 --------- */
function renderPets() {
  const cards = S.pets.map(p => `
    <div class="pet-card">
      <div class="pc-avatar">${p.avatar}</div>
      <div class="pc-info">
        <div class="pc-name">${p.name}
          <span class="chip ${p.gender === '公' ? 'chip-blue' : ''}" style="${p.gender === '母' ? 'background:#FBEAE7;color:#D0685A' : ''}">${p.gender}</span>
          ${p.sterilized ? '<span class="chip chip-mint">已绝育</span>' : ''}
        </div>
        <div class="pc-meta">${p.type} · ${p.breed} · ${p.weight}kg · 生日 ${p.birthday}</div>
        ${p.note ? `<div class="pc-note">⚠ ${p.note}</div>` : ''}
      </div>
      <div class="pc-edit" data-act="edit-pet" data-id="${p.id}">编辑</div>
    </div>`).join('');

  $('#page-pets').innerHTML = `
    ${navBar('我的宠物', { right: '＋ 添加', rightAct: 'add-pet' })}
    <div class="wrap" style="padding-top:6px">
      ${S.pets.length ? cards : `<div class="empty">
        <div class="e-icon">🐾</div>
        <div class="e-title">还没有宠物档案</div>
        <div class="e-desc">添加后预约服务更方便</div>
        <button class="btn btn-primary" data-act="add-pet">添加宠物</button>
      </div>`}
      <div class="card card-pad mt16" style="background:var(--primary-soft);box-shadow:none">
        <div style="font-size:12.5px;font-weight:700;color:var(--primary-dark);margin-bottom:6px">💡 为什么要填写宠物档案？</div>
        <div style="font-size:12px;color:var(--text-2);line-height:1.7">
          美容师可提前了解宠物的品种、体重与性格特点，准备合适的工具与产品；标注特殊习惯（如怕吹风机、易应激）能让服务更安全舒适。
        </div>
      </div>
    </div>`;
}

function openPetForm(petId) {
  const p = petId ? S.pets.find(x => x.id === petId) : null;
  const emojis = ['🐱', '🐶', '🐰', '🐹', '🐦', '🐢'];
  openSheet(`
    <div class="sheet-head"><h3>${p ? '编辑宠物' : '添加宠物'}</h3><div class="sh-close" data-act="close-sheet">×</div></div>
    <div class="form-card" style="box-shadow:none;padding:0">
      <div class="form-row"><label>头像</label>
        <div class="fi-right" style="margin-left:auto;display:flex;gap:8px" id="pet-emoji-pick">
          ${emojis.map(e => `<span data-act="pick-emoji" data-v="${e}" style="font-size:20px;padding:3px 6px;border-radius:9px;${(p ? p.avatar : '🐱') === e ? 'background:var(--primary-soft)' : ''}">${e}</span>`).join('')}
        </div>
      </div>
      <div class="form-row"><label>名字</label><input id="pet-name" value="${p ? p.name : ''}" placeholder="如 布丁"></div>
      <div class="form-row"><label>类型</label>
        <div class="fi-right" style="margin-left:auto;display:flex;gap:8px" id="pet-type-pick">
          <span class="chip ${!p || p.type === '猫' ? '' : 'chip-gray'}" data-act="pick-type" data-v="猫">猫</span>
          <span class="chip ${p && p.type === '狗' ? '' : 'chip-gray'}" data-act="pick-type" data-v="狗">狗</span>
        </div>
      </div>
      <div class="form-row"><label>品种</label><input id="pet-breed" value="${p ? p.breed : ''}" placeholder="如 英国短毛猫"></div>
      <div class="form-row"><label>性别</label>
        <div class="fi-right" style="margin-left:auto;display:flex;gap:8px" id="pet-gender-pick">
          <span class="chip ${!p || p.gender === '公' ? '' : 'chip-gray'}" data-act="pick-gender" data-v="公">公</span>
          <span class="chip ${p && p.gender === '母' ? '' : 'chip-gray'}" data-act="pick-gender" data-v="母">母</span>
        </div>
      </div>
      <div class="form-row"><label>生日</label><input id="pet-birthday" type="date" value="${p ? p.birthday : ''}"></div>
      <div class="form-row"><label>体重(kg)</label><input id="pet-weight" type="number" step="0.1" value="${p ? p.weight : ''}" placeholder="如 5.2"></div>
      <div class="form-row"><label>备注</label><input id="pet-note" value="${p ? p.note : ''}" placeholder="特殊习惯、过敏史等"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:18px">
      ${p ? `<button class="btn btn-plain" style="flex:1;color:var(--danger)" data-act="del-pet" data-id="${p.id}">删除</button>` : ''}
      <button class="btn btn-primary" style="flex:2" data-act="save-pet" data-id="${p ? p.id : ''}">保存</button>
    </div>
    <input type="hidden" id="pet-avatar-val" value="${p ? p.avatar : '🐱'}">
    <input type="hidden" id="pet-type-val" value="${p ? p.type : '猫'}">
    <input type="hidden" id="pet-gender-val" value="${p ? p.gender : '公'}">
  `);
}

/* --------- 我的预约 --------- */
let bookTab = 'all';
function renderMyBook() {
  const tabs = [
    { id: 'all', name: '全部' },
    { id: 'wait', name: '待服务' },
    { id: 'done', name: '已完成' },
    { id: 'cancel', name: '已取消' }
  ];

  let list = S.bookings.slice().reverse();
  if (bookTab !== 'all') list = list.filter(b => b.status === bookTab);

  const stName = { wait: '待服务', done: '已完成', cancel: '已取消' };
  const stCls = { wait: 'st-wait', done: 'st-done', cancel: 'st-cancel' };
  const catEmoji = { grooming: '✂️', bath: '🛁', boarding: '🏠' };

  const cards = list.map(b => {
    const s = S.services.find(x => x.id === b.serviceId) || {};
    const pet = S.pets.find(x => x.id === b.petId);
    return `<div class="order-card">
      <div class="oc-head">
        <span>预约单号 ${b.id}</span>
        <span class="st ${stCls[b.status]}">${stName[b.status]}</span>
      </div>
      <div class="oc-body" data-act="book-detail" data-id="${b.id}">
        <div class="oc-thumb" style="background:#FFF1E9">${catEmoji[s.cat] || '🐾'}</div>
        <div class="oc-info">
          <div class="oc-title">${s.name || '服务项目'}</div>
          <div class="oc-sub">${b.date} ${b.time} · ${pet ? pet.name : '宠物'}${b.days > 1 ? ` · ${b.days} 天` : ''}</div>
          <div class="oc-sub">美容师：${(S.staffs.find(t => t.id === b.staffId) || {}).name || '不指定'}</div>
        </div>
        <div class="oc-price"><div class="p">${money(b.payAmount)}</div><div class="q">实付</div></div>
      </div>
      <div class="oc-foot">
        ${b.status === 'wait' ? `
          <button class="btn btn-plain btn-sm" data-act="cancel-book" data-id="${b.id}">取消预约</button>
          <button class="btn btn-primary btn-sm" data-act="book-code" data-id="${b.id}">查看核销码</button>` : ''}
        ${b.status === 'done' ? `<button class="btn btn-plain btn-sm" data-act="rebook" data-id="${b.id}">再来一单</button>` : ''}
        ${b.status === 'cancel' ? `<button class="btn btn-plain btn-sm" data-act="rebook" data-id="${b.id}">重新预约</button>` : ''}
      </div>
    </div>`;
  }).join('');

  $('#page-my-book').innerHTML = `
    ${navBar('我的预约')}
    <div class="filter-bar" style="top:0">
      ${tabs.map(t => `<div class="filter-chip ${bookTab === t.id ? 'on' : ''}" data-act="mybook-tab" data-v="${t.id}">${t.name}</div>`).join('')}
    </div>
    <div class="wrap">
      ${list.length ? cards : `<div class="empty">
        <div class="e-icon">📅</div>
        <div class="e-title">暂无预约记录</div>
        <div class="e-desc">去挑选一项服务吧</div>
        <button class="btn btn-primary" data-act="go-tab" data-tab="book">去预约</button>
      </div>`}
    </div>`;
}

/* --------- 订单 --------- */
let orderTab = 'all';
function renderOrders() {
  const tabs = [
    { id: 'all', name: '全部' },
    { id: 'reservation', name: '服务预约' },
    { id: 'goods', name: '用品订单' }
  ];
  let list = S.orders.slice().reverse();
  if (orderTab !== 'all') list = list.filter(o => o.type === orderTab);
  const stName = { waitpay: '待付款', waitsend: '待发货', done: '已完成', cancel: '已取消' };
  const stCls = { waitpay: 'st-wait', waitsend: 'st-wait', done: 'st-done', cancel: 'st-cancel' };

  const cards = list.map(o => {
    const isRes = o.type === 'reservation';
    const s = isRes ? (S.services.find(x => x.id === o.service) || {}) : null;
    const first = isRes ? null : o.items[0];
    const bg = isRes ? '#FFF1E9' : '#FDF4E1';
    const emoji = isRes ? ({ grooming: '✂️', bath: '🛁', boarding: '🏠' }[s.cat] || '🐾') : first.emoji;
    const title = isRes ? o.title : first.name;
    const sub = isRes
      ? `${o.date} ${o.time}`
      : `${o.items.length} 件商品 · ${o.createTime}`;
    const qty = isRes ? '服务' : `共 ${o.items.reduce((a, b) => a + b.qty, 0)} 件`;

    return `<div class="order-card">
      <div class="oc-head">
        <span>${isRes ? '预约单' : '商城订单'} ${o.id}</span>
        <span class="st ${stCls[o.status]}">${stName[o.status]}</span>
      </div>
      <div class="oc-body" data-act="order-detail" data-id="${o.id}">
        <div class="oc-thumb" style="background:${bg}">${emoji}</div>
        <div class="oc-info">
          <div class="oc-title">${title}</div>
          <div class="oc-sub">${sub}</div>
          ${o.discountName ? `<div class="oc-sub" style="color:var(--amber)">🎫 ${o.discountName}</div>` : ''}
        </div>
        <div class="oc-price"><div class="p">${money(o.payAmount)}</div><div class="q">${qty}</div></div>
      </div>
      <div class="oc-foot">
        ${o.status === 'waitpay' ? `<button class="btn btn-plain btn-sm" data-act="cancel-order" data-id="${o.id}">取消订单</button>
          <button class="btn btn-primary btn-sm" data-act="pay-order" data-id="${o.id}">立即支付</button>` : ''}
        ${o.status === 'waitsend' ? `<button class="btn btn-plain btn-sm" data-act="order-detail" data-id="${o.id}">查看详情</button>` : ''}
        ${o.status === 'done' ? `<button class="btn btn-plain btn-sm" data-act="order-detail" data-id="${o.id}">查看详情</button>
          <button class="btn btn-ghost btn-sm" data-act="buy-again" data-id="${o.id}">再次购买</button>` : ''}
      </div>
    </div>`;
  }).join('');

  $('#page-orders').innerHTML = `
    ${navBar('我的订单')}
    <div class="filter-bar" style="top:0">
      ${tabs.map(t => `<div class="filter-chip ${orderTab === t.id ? 'on' : ''}" data-act="order-tab" data-v="${t.id}">${t.name}</div>`).join('')}
    </div>
    <div class="wrap">
      ${list.length ? cards : `<div class="empty">
        <div class="e-icon">📦</div>
        <div class="e-title">暂无订单</div>
        <div class="e-desc">快去挑选喜欢的商品或服务</div>
        <button class="btn btn-primary" data-act="go-tab" data-tab="mall">去逛逛</button>
      </div>`}
    </div>`;
}

/* --------- 积分 --------- */
function renderPoints() {
  $('#page-points').innerHTML = `
    ${navBar('我的积分')}
    <div class="wrap" style="padding-top:6px">
      <div class="card card-pad" style="background:linear-gradient(135deg,#FF9F70,#F2703D);color:#fff;border:none">
        <div style="font-size:12px;opacity:.9">当前可用积分</div>
        <div style="font-size:36px;font-weight:800;line-height:1.2;margin-top:4px">${S.member.points}</div>
        <div style="font-size:11.5px;opacity:.9;margin-top:4px">100 积分 = 1 元，下单可直接抵扣</div>
        <button class="btn btn-plain btn-sm mt12" style="background:#fff;color:var(--primary-dark)" data-act="exchange-coupon">积分兑换优惠券</button>
      </div>

      <div class="sec-head" style="padding-left:2px"><h3>积分明细</h3></div>
      <div class="list">
        ${S.pointLogs.map(l => `
          <div class="list-item">
            <div class="li-icon" style="background:${l.type === 'in' ? '#E8F7F1' : '#FBEAE7'}">${l.type === 'in' ? '＋' : '−'}</div>
            <div class="li-main">
              <div class="li-title">${l.title}</div>
              <div class="li-sub">${l.time}</div>
            </div>
            <div class="li-right" style="font-weight:700;color:${l.type === 'in' ? 'var(--success)' : 'var(--danger)'}">
              ${l.type === 'in' ? '+' : ''}${l.value}
            </div>
          </div>`).join('')}
      </div>
      <div class="card card-pad mt16" style="background:var(--cream-soft);box-shadow:none">
        <div style="font-size:12.5px;font-weight:700;margin-bottom:6px">📌 积分规则</div>
        <div style="font-size:12px;color:var(--text-2);line-height:1.75">
          · 消费 1 元累计积分 = 等级倍率 × 1<br>
          · 普通 1 倍 / 银卡 1.5 倍 / 金卡 2 倍 / 钻石 3 倍<br>
          · 100 积分可抵扣 1 元，单笔最高抵扣订单金额（不含运费）<br>
          · 积分自获得起 12 个月内有效
        </div>
      </div>
    </div>`;
}

/* --------- 储值 --------- */
function renderBalance() {
  $('#page-balance').innerHTML = `
    ${navBar('储值余额')}
    <div class="wrap" style="padding-top:6px">
      <div class="card card-pad" style="background:linear-gradient(135deg,#4A403A,#2F2A25);color:#F2E7D8;border:none">
        <div style="font-size:12px;opacity:.75">当前储值余额（元）</div>
        <div style="font-size:36px;font-weight:800;line-height:1.2;margin-top:4px;color:#FFDFAE">${money(S.member.balance)}</div>
        <div style="font-size:11.5px;opacity:.7;margin-top:5px">储值消费可与会员折扣叠加使用</div>
      </div>

      <div class="sec-head" style="padding-left:2px"><h3>选择充值档位</h3></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px">
        ${S.rechargePlans.map(p => `
          <div class="card card-pad" style="position:relative;text-align:center;cursor:pointer" data-act="recharge" data-v="${p.amount}">
            ${p.tag ? `<div style="position:absolute;top:0;right:0;background:linear-gradient(135deg,#FF8A5B,#F2703D);color:#fff;font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:0 16px 0 12px">${p.tag}</div>` : ''}
            <div style="padding-top:6px">
              <div style="font-size:22px;font-weight:800;color:var(--text)">¥${p.amount}</div>
              <div style="font-size:11.5px;color:var(--mint);font-weight:700;margin-top:5px">赠 ¥${p.give}</div>
              <div style="font-size:10.5px;color:var(--text-3);margin-top:4px">到账 ¥${p.amount + p.give}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card card-pad mt16" style="background:var(--primary-soft);box-shadow:none">
        <div style="font-size:12.5px;font-weight:700;color:var(--primary-dark);margin-bottom:6px">💡 储值说明</div>
        <div style="font-size:12px;color:var(--text-2);line-height:1.75">
          · 储值金额仅限本店消费使用，不可提现<br>
          · 赠送金额随消费按比例使用<br>
          · 储值余额永久有效，可与会员折扣、优惠券叠加
        </div>
      </div>
    </div>`;
}

/* --------- 优惠券 --------- */
let couponTab = 'unused';
function renderCoupons() {
  const tabs = [
    { id: 'unused', name: '可用' },
    { id: 'used', name: '已使用' },
    { id: 'expired', name: '已过期' }
  ];
  const list = S.member.coupons.filter(c => c.status === couponTab);

  $('#page-coupons').innerHTML = `
    ${navBar('我的优惠券')}
    <div class="filter-bar" style="top:0">
      ${tabs.map(t => `<div class="filter-chip ${couponTab === t.id ? 'on' : ''}" data-act="coupon-tab" data-v="${t.id}">${t.name}</div>`).join('')}
    </div>
    <div class="wrap">
      ${list.length ? list.map(c => `
        <div class="coupon ${c.status}">
          <div class="cp-left">
            <div class="cp-amt"><small>¥</small>${c.amount}</div>
            <div class="cp-cond">${c.threshold ? `满 ${c.threshold} 可用` : '无门槛'}</div>
          </div>
          <div class="cp-right">
            <div class="cp-name">${c.name}</div>
            <div class="cp-exp">有效期至 ${c.expire}</div>
          </div>
          ${c.status === 'unused' ? `<div class="cp-use" data-act="use-coupon" data-id="${c.id}">去使用</div>` : ''}
        </div>`).join('') : `<div class="empty">
          <div class="e-icon">🎫</div>
          <div class="e-title">暂无优惠券</div>
          <div class="e-desc">可用积分兑换，或关注会员日活动</div>
          <button class="btn btn-primary" data-act="exchange-coupon">积分兑换</button>
        </div>`}
    </div>`;
}

/* --------- 地址 --------- */
function renderAddress() {
  $('#page-address').innerHTML = `
    ${navBar('收货地址', { right: '＋ 新增', rightAct: 'add-address' })}
    <div class="wrap" style="padding-top:6px">
      ${S.addresses.map(a => `
        <div class="card" style="padding:15px;margin-bottom:11px;display:flex;gap:12px;align-items:flex-start">
          <span style="font-size:18px">📍</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:700">
              ${a.name}<span style="font-weight:500;color:var(--text-2);margin-left:8px">${a.phone}</span>
              ${a.isDefault ? '<span class="chip" style="margin-left:7px">默认</span>' : ''}
            </div>
            <div style="font-size:12px;color:var(--text-2);margin-top:5px;line-height:1.5">${a.region} ${a.detail}</div>
            <div style="display:flex;gap:14px;margin-top:10px;font-size:12px">
              ${a.isDefault ? '' : `<span style="color:var(--primary);font-weight:600" data-act="set-default-addr" data-id="${a.id}">设为默认</span>`}
              <span style="color:var(--text-3)" data-act="del-addr" data-id="${a.id}">删除</span>
            </div>
          </div>
        </div>`).join('')}
      <button class="btn btn-ghost btn-block mt12" data-act="add-address">＋ 新增收货地址</button>
    </div>`;
}

/* --------- 订单详情 --------- */
function renderOrderDetail() {
  const o = S.orders.find(x => x.id === subParams.id);
  if (!o) { go('page-orders'); return; }
  const isRes = o.type === 'reservation';
  const stName = { waitpay: '待付款', waitsend: '待发货', done: '已完成', cancel: '已取消' };

  let bodyHtml = '';
  if (isRes) {
    const s = S.services.find(x => x.id === o.service) || {};
    const pet = S.pets.find(x => x.id === o.pet);
    bodyHtml = `
      <div class="card card-pad">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="width:52px;height:52px;border-radius:14px;background:#FFF1E9;display:flex;align-items:center;justify-content:center;font-size:26px">${{ grooming: '✂️', bath: '🛁', boarding: '🏠' }[s.cat] || '🐾'}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">${s.name}</div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">${s.desc ? s.desc.slice(0, 30) + '…' : ''}</div>
          </div>
          <div style="color:var(--primary);font-size:15px;font-weight:800;flex:none">¥${money(o.payAmount)}</div>
        </div>
      </div>`;
  } else {
    bodyHtml = `<div class="card" style="padding:0 14px">
      ${o.items.map(it => `
        <div style="display:flex;gap:11px;align-items:center;padding:13px 0;border-bottom:1px solid var(--line)">
          <div style="width:50px;height:50px;border-radius:12px;background:#FDF4E1;display:flex;align-items:center;justify-content:center;font-size:24px">${it.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${it.name}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">¥${it.price} × ${it.qty}</div>
          </div>
          <div style="color:var(--primary);font-size:14px;font-weight:700;flex:none">¥${money(it.price * it.qty)}</div>
        </div>`).join('')}
    </div>`;
  }

  $('#page-order-detail').innerHTML = `
    ${navBar('订单详情')}
    <div class="wrap" style="padding-top:6px">
      <div class="card card-pad" style="text-align:center;padding:22px 14px">
        <div style="font-size:30px">${o.status === 'done' ? '✅' : o.status === 'cancel' ? '❌' : '⏳'}</div>
        <div style="font-size:15.5px;font-weight:700;margin-top:8px">${stName[o.status]}</div>
        <div style="font-size:11.5px;color:var(--text-3);margin-top:5px">
          ${o.status === 'done' ? '感谢您的信任，期待再次服务' : o.status === 'cancel' ? '订单已取消' : '请尽快完成支付'}
        </div>
      </div>

      <div class="sec-head" style="padding-left:2px"><h3>${isRes ? '服务信息' : '商品信息'}</h3></div>
      ${bodyHtml}

      <div class="sec-head" style="padding-left:2px"><h3>订单信息</h3></div>
      <div class="card" style="padding:6px 14px 14px">
        <div class="amount-row"><span class="ar-label">订单编号</span><span class="ar-val" style="font-size:12px">${o.id}</span></div>
        <div class="amount-row"><span class="ar-label">下单时间</span><span class="ar-val" style="font-size:12px">${o.createTime}</span></div>
        ${isRes ? `<div class="amount-row"><span class="ar-label">预约时间</span><span class="ar-val" style="font-size:12px">${o.date} ${o.time}</span></div>
          <div class="amount-row"><span class="ar-label">服务人员</span><span class="ar-val" style="font-size:12px">${(S.staffs.find(t => t.id === o.staff) || {}).name || '不指定'}</span></div>` : `
          <div class="amount-row"><span class="ar-label">收货地址</span><span class="ar-val" style="font-size:12px;max-width:60%">${o.address || '—'}</span></div>`}
        ${o.discountName ? `<div class="amount-row"><span class="ar-label">优惠</span><span class="ar-val minus" style="font-size:12px">${o.discountName}</span></div>` : ''}
        <div class="amount-row total"><span class="ar-label">实付款</span><span class="ar-val">${money(o.payAmount)}</span></div>
      </div>
      <div style="height:20px"></div>
    </div>`;
}

/* --------- 下单成功页 --------- */
function renderSuccess() {
  const d = subParams || {};
  $('#page-success').innerHTML = `
    ${navBar(d.title || '操作成功')}
    <div class="success-wrap">
      <div class="success-icon">✓</div>
      <h2>${d.heading || '提交成功'}</h2>
      <p class="sw-desc">${d.desc || ''}</p>
      <div class="success-card">
        ${(d.rows || []).map(r => `<div class="sc-row"><span class="k">${r.k}</span><span class="v">${r.v}</span></div>`).join('')}
      </div>
      <div class="success-btns">
        <button class="btn btn-plain" data-act="${d.primaryAct || 'go-tab'}" data-tab="${d.primaryTab || 'home'}">${d.primaryText || '返回首页'}</button>
        <button class="btn btn-primary" data-act="${d.secondAct || 'go-orders'}">${d.secondText || '查看订单'}</button>
      </div>
    </div>`;
}

/* ============================================================
 * 购物车角标
 * ============================================================ */
function syncCartBadge() {
  const n = S.cart.reduce((a, c) => a + c.qty, 0);
  const badge = $('#tab-cart-badge');
  if (badge) {
    badge.textContent = n;
    badge.classList.toggle('hidden', n === 0);
  }
  const navNum = $('#nav-cart-num');
  if (navNum) navNum.textContent = n ? `(${n})` : '';
  const dNum = $('#detail-cart-num');
  if (dNum) dNum.textContent = n ? n : '';
}

function addToCart(id, qty = 1) {
  const g = S.goods.find(x => x.id === id);
  if (!g) return;
  const exist = S.cart.find(c => c.id === id);
  if (exist) exist.qty = Math.min(exist.qty + qty, g.stock);
  else S.cart.push({ id, qty, checked: true });
  save();
  syncCartBadge();
  const badge = $('#tab-cart-badge');
  if (badge) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  toast('已加入购物车', '🛒');
}

/* ============================================================
 * 业务动作
 * ============================================================ */
function submitBooking(serviceId) {
  const s = S.services.find(x => x.id === serviceId);
  if (!s) return;
  if (!S.member.logged) { toast('请先登录后再预约', '🔒'); go('page-login'); return; }
  if (!bookingDraft.petId) { toast('请选择服务宠物', '🐾'); return; }
  if (!bookingDraft.time) { toast('请选择预约时段', '⏰'); return; }

  const lv = currentLevel();
  const days = s.cat === 'boarding' ? bookingDraft.days : 1;
  const raw = s.price * days;
  const pay = raw * lv.discount;

  const booking = {
    id: uid('B'),
    serviceId: s.id,
    staffId: bookingDraft.staffId,
    petId: bookingDraft.petId,
    date: bookingDraft.date,
    time: bookingDraft.time,
    days,
    amount: raw,
    payAmount: pay,
    discountName: lv.discount < 1 ? `${lv.name} ${(lv.discount * 10).toFixed(1).replace('.0', '')} 折` : '',
    status: 'wait',
    remark: bookingDraft.remark,
    createTime: nowStr()
  };
  S.bookings.push(booking);

  // 生成预约订单记录
  S.orders.push({
    id: uid('O'),
    type: 'reservation',
    title: `${s.name} · ${(S.pets.find(p => p.id === booking.petId) || {}).name || '宠物'}`,
    service: s.id, staff: booking.staffId, pet: booking.petId,
    date: booking.date, time: booking.time, days,
    amount: raw, payAmount: pay,
    discountName: booking.discountName,
    status: 'waitsend',
    createTime: nowStr()
  });

  // 消费累计 + 积分
  S.member.totalSpend += pay;
  const earn = Math.floor(pay * lv.pointRate);
  S.member.points += earn;
  S.pointLogs.unshift({ time: nowStr(), title: `${s.name} 预约消费获得积分`, value: earn, type: 'in' });

  save();

  go('page-success', {
    title: '预约成功',
    heading: '预约提交成功',
    desc: '请按预约时间到店，出示核销码即可',
    rows: [
      { k: '预约项目', v: s.name },
      { k: '预约时间', v: `${booking.date} ${booking.time}` },
      { k: '服务宠物', v: (S.pets.find(p => p.id === booking.petId) || {}).name || '—' },
      { k: '美容师', v: (S.staffs.find(t => t.id === booking.staffId) || {}).name || '不指定' },
      { k: '实付金额', v: `¥${money(pay)}` },
      { k: '获得积分', v: `+${earn}` }
    ],
    primaryText: '返回首页', primaryTab: 'home', primaryAct: 'go-tab',
    secondText: '查看我的预约', secondAct: 'go-my-book'
  });
}

function submitGoodsOrder() {
  if (!checkoutDraft || !checkoutDraft.items.length) return;
  const addr = S.addresses.find(a => a.id === checkoutDraft.addressId);
  if (!addr) { toast('请先选择收货地址', '📍'); return; }

  const c = checkoutDraft._calc;
  const lv = currentLevel();
  const items = checkoutDraft.items.map(it => {
    const g = S.goods.find(x => x.id === it.id);
    return { id: g.id, name: g.name, price: g.price, qty: it.qty, emoji: g.emoji };
  });

  const coupon = S.member.coupons.find(x => x.id === checkoutDraft.couponId);
  const discounts = [];
  if (lv.discount < 1) discounts.push(`${lv.name} ${(lv.discount * 10).toFixed(1).replace('.0', '')} 折`);
  if (coupon) discounts.push(coupon.name);
  if (c.pointsAmt > 0) discounts.push(`积分抵扣 ¥${money(c.pointsAmt)}`);

  const order = {
    id: uid('O'),
    type: 'goods',
    items,
    amount: c.goodsTotal,
    payAmount: c.finalPay,
    discountName: discounts.join(' + '),
    address: `${addr.region} ${addr.detail}`,
    status: 'waitsend',
    createTime: nowStr(),
    payTime: nowStr()
  };
  S.orders.push(order);

  // 核销购物车
  checkoutDraft.items.forEach(it => {
    const i = S.cart.findIndex(ci => ci.id === it.id);
    if (i > -1) S.cart.splice(i, 1);
  });

  // 优惠券置为已用
  if (coupon) coupon.status = 'used';

  // 积分
  if (c.pointsUsed > 0) {
    S.member.points -= c.pointsUsed;
    S.pointLogs.unshift({ time: nowStr(), title: '下单积分抵扣', value: -c.pointsUsed, type: 'out' });
  }
  S.member.points += c.earnPoints;
  S.pointLogs.unshift({ time: nowStr(), title: '商城购物获得积分', value: c.earnPoints, type: 'in' });

  S.member.totalSpend += c.finalPay;
  save();

  go('page-success', {
    title: '下单成功',
    heading: '订单提交成功',
    desc: '门店将在 24 小时内为你安排发货',
    rows: [
      { k: '订单编号', v: order.id },
      { k: '商品件数', v: `${items.reduce((a, b) => a + b.qty, 0)} 件` },
      { k: '商品总额', v: `¥${money(c.goodsTotal)}` },
      { k: '优惠合计', v: `-¥${money(c.discountAmt + c.couponAmt + c.pointsAmt)}` },
      { k: '实付金额', v: `¥${money(c.finalPay)}` },
      { k: '获得积分', v: `+${c.earnPoints}` }
    ],
    primaryText: '继续购物', primaryTab: 'mall', primaryAct: 'go-tab',
    secondText: '查看订单', secondAct: 'go-orders'
  });
  checkoutDraft = null;
}

/* ============================================================
 * 事件委托
 * ============================================================ */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  const id = t.dataset.id;
  const v = t.dataset.v;

  switch (act) {
    /* ---- 登录 ---- */
    case 'login':
      S.member.logged = true;
      save();
      toast('登录成功，欢迎回来', '🎉');
      go('page-home');
      break;
    case 'login-guest':
      go('page-home');
      break;
    case 'logout':
      confirmDialog({
        icon: '🚪', title: '退出登录', desc: '退出后将无法享受会员权益，确定退出吗？',
        onOk: () => {
          S.member.logged = false; save();
          toast('已退出登录');
          go('page-login');
        }
      });
      break;

    /* ---- 导航 ---- */
    case 'back': back(); break;
    case 'go-tab': go('page-' + (t.dataset.tab === 'home' ? 'home' : t.dataset.tab)); break;
    case 'go-me': S.member.logged ? go('page-member') : go('page-login'); break;
    case 'go-member': go('page-member'); break;
    case 'go-pets': closeSheet(); go('page-pets'); break;
    case 'go-my-book': go('page-my-book'); break;
    case 'go-orders': go('page-orders'); break;
    case 'go-coupons': go('page-coupons'); break;
    case 'go-points': go('page-points'); break;
    case 'go-balance': go('page-balance'); break;
    case 'go-address': go('page-address'); break;
    case 'go-cart': go('page-cart'); break;

    case 'go-cat':
      bookFilter = t.dataset.cat === 'goods' ? 'all' : t.dataset.cat;
      if (t.dataset.cat === 'goods') { go('page-mall'); }
      else { go('page-book'); }
      break;

    /* ---- 服务 ---- */
    case 'svc-detail': go('page-service-detail', { id }); break;
    case 'to-booking': go('page-booking-confirm', { id }); break;
    case 'book-filter': bookFilter = v; renderBook(); break;

    case 'pick-pet': if (bookingDraft) { bookingDraft.petId = v; renderBookingConfirm(); } break;
    case 'pick-staff': if (bookingDraft) { bookingDraft.staffId = v; renderBookingConfirm(); } break;
    case 'pick-slot': if (bookingDraft) { bookingDraft.time = v; renderBookingConfirm(); } break;
    case 'pick-date': if (bookingDraft) { bookingDraft.date = v; renderBookingConfirm(); } break;
    case 'days-plus': if (bookingDraft) { bookingDraft.days = Math.min(30, bookingDraft.days + 1); renderBookingConfirm(); } break;
    case 'days-minus': if (bookingDraft) { bookingDraft.days = Math.max(1, bookingDraft.days - 1); renderBookingConfirm(); } break;
    case 'submit-booking': {
      const r = $('#book-remark');
      if (r && bookingDraft) bookingDraft.remark = r.value;
      submitBooking(id);
      break;
    }

    /* ---- 预约管理 ---- */
    case 'mybook-tab': bookTab = v; renderMyBook(); break;
    case 'cancel-book':
      confirmDialog({
        icon: '⚠️', title: '取消预约', desc: '确定要取消这条预约吗？取消后需重新预约。',
        onOk: () => {
          const b = S.bookings.find(x => x.id === id);
          if (b) b.status = 'cancel';
          save(); renderMyBook(); toast('预约已取消');
        }
      });
      break;
    case 'book-code': {
      const b = S.bookings.find(x => x.id === id);
      if (!b) break;
      const s = S.services.find(x => x.id === b.serviceId) || {};
      openSheet(`
        <div class="sheet-head"><h3>预约核销码</h3><div class="sh-close" data-act="close-sheet">×</div></div>
        <div style="text-align:center;padding:10px 0 6px">
          <div style="width:150px;height:150px;margin:0 auto;border-radius:18px;background:#fff;border:2px dashed var(--line);display:flex;align-items:center;justify-content:center;font-size:64px">🎫</div>
          <div style="font-size:22px;font-weight:800;letter-spacing:3px;margin-top:14px;color:var(--primary)">${b.id.slice(-6).toUpperCase()}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:6px">到店出示此码，由店员扫码核销</div>
          <div class="success-card" style="margin-top:18px">
            <div class="sc-row"><span class="k">服务项目</span><span class="v">${s.name}</span></div>
            <div class="sc-row"><span class="k">预约时间</span><span class="v">${b.date} ${b.time}</span></div>
            <div class="sc-row"><span class="k">服务宠物</span><span class="v">${(S.pets.find(p => p.id === b.petId) || {}).name || '—'}</span></div>
            <div class="sc-row"><span class="k">实付金额</span><span class="v">¥${money(b.payAmount)}</span></div>
          </div>
        </div>`);
      break;
    }
    case 'rebook': {
      const b = S.bookings.find(x => x.id === id);
      if (b) go('page-booking-confirm', { id: b.serviceId });
      break;
    }

    /* ---- 商城 ---- */
    case 'mall-filter': mallCat = v; renderMall(); break;
    case 'add-cart': e.stopPropagation(); addToCart(id); break;
    case 'goods-detail': go('page-goods-detail', { id }); break;
    case 'buy-now':
      addToCartSilent(id);
      toCheckout([{ id, qty: 1 }]);
      break;

    /* ---- 购物车 ---- */
    case 'cart-plus': {
      const c = S.cart.find(x => x.id === id);
      const g = S.goods.find(x => x.id === id);
      if (c && g) c.qty = Math.min(c.qty + 1, g.stock);
      save(); renderCart();
      break;
    }
    case 'cart-minus': {
      const i = S.cart.findIndex(x => x.id === id);
      if (i > -1) {
        if (S.cart[i].qty > 1) S.cart[i].qty--;
        else S.cart.splice(i, 1);
      }
      save(); renderCart();
      break;
    }
    case 'cart-check': {
      const c = S.cart.find(x => x.id === id);
      if (c) c.checked = !c.checked;
      save(); renderCart();
      break;
    }
    case 'cart-check-all': {
      const all = S.cart.every(c => c.checked);
      S.cart.forEach(c => c.checked = !all);
      save(); renderCart();
      break;
    }
    case 'cart-clear':
      confirmDialog({
        icon: '🗑️', title: '清空购物车', desc: '确定要清空购物车中的全部商品吗？',
        onOk: () => { S.cart = []; save(); renderCart(); toast('购物车已清空'); }
      });
      break;
    case 'to-checkout': {
      const checked = S.cart.filter(c => c.checked);
      if (!checked.length) { toast('请先选择商品', '🛒'); break; }
      toCheckout(checked.map(c => ({ id: c.id, qty: c.qty })));
      break;
    }

    /* ---- 结算 ---- */
    case 'toggle-points': {
      checkoutDraft.usePoints = !checkoutDraft.usePoints;
      saveRemark();
      renderCheckout();
      break;
    }
    case 'pick-coupon': {
      saveRemark();
      const lv = currentLevel();
      let total = 0;
      checkoutDraft.items.forEach(it => {
        const g = S.goods.find(x => x.id === it.id);
        if (g) total += g.price * it.qty;
      });
      const usable = S.member.coupons.filter(c =>
        c.status === 'unused' && (c.type === 'goods' || c.type === 'all') && total >= c.threshold);
      openSheet(`
        <div class="sheet-head"><h3>选择优惠券</h3><div class="sh-close" data-act="close-sheet">×</div></div>
        ${usable.length ? usable.map(c => `
          <div class="coupon" data-act="choose-coupon" data-id="${c.id}" style="${checkoutDraft.couponId === c.id ? 'border:1.5px solid var(--primary)' : ''}">
            <div class="cp-left"><div class="cp-amt"><small>¥</small>${c.amount}</div><div class="cp-cond">${c.threshold ? '满 ' + c.threshold + ' 可用' : '无门槛'}</div></div>
            <div class="cp-right"><div class="cp-name">${c.name}</div><div class="cp-exp">有效期至 ${c.expire}</div></div>
            ${checkoutDraft.couponId === c.id ? `<div class="cp-use">已选</div>` : ''}
          </div>`).join('') : `<div class="empty" style="padding:30px 0"><div class="e-icon">🎫</div><div class="e-title">暂无可用优惠券</div></div>`}
        ${checkoutDraft.couponId ? `<button class="btn btn-ghost btn-block mt12" data-act="choose-coupon" data-id="">不使用优惠券</button>` : ''}
        <div style="height:10px"></div>`);
      break;
    }
    case 'choose-coupon': {
      checkoutDraft.couponId = id;
      closeSheet();
      renderCheckout();
      toast(id ? '已使用优惠券' : '已取消使用优惠券');
      break;
    }
    case 'pick-address': {
      saveRemark();
      openSheet(`
        <div class="sheet-head"><h3>选择收货地址</h3><div class="sh-close" data-act="close-sheet">×</div></div>
        ${S.addresses.map(a => `
          <div class="card" style="padding:14px;margin-bottom:10px;display:flex;gap:11px;align-items:flex-start;${checkoutDraft.addressId === a.id ? 'border:1.5px solid var(--primary)' : ''}" data-act="choose-address" data-id="${a.id}">
            <span style="font-size:17px">📍</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700">${a.name}<span style="font-weight:500;color:var(--text-2);margin-left:8px">${a.phone}</span></div>
              <div style="font-size:11.5px;color:var(--text-2);margin-top:4px">${a.region} ${a.detail}</div>
            </div>
            ${checkoutDraft.addressId === a.id ? '<span class="chip">已选</span>' : ''}
          </div>`).join('')}
        <button class="btn btn-ghost btn-block" data-act="close-sheet">关闭</button>`);
      break;
    }
    case 'choose-address':
      checkoutDraft.addressId = id;
      closeSheet();
      renderCheckout();
      break;
    case 'submit-order': submitGoodsOrder(); break;

    /* ---- 宠物 ---- */
    case 'add-pet': closeSheet(); openPetForm(''); break;
    case 'edit-pet': openPetForm(id); break;
    case 'pick-emoji': {
      const val = $('#pet-avatar-val');
      if (val) val.value = v;
      $$('#pet-emoji-pick span').forEach(s => s.style.background = 'transparent');
      t.style.background = 'var(--primary-soft)';
      break;
    }
    case 'pick-type': {
      const val = $('#pet-type-val');
      if (val) val.value = v;
      $$('#pet-type-pick span').forEach(s => { s.className = s.dataset.v === v ? 'chip' : 'chip chip-gray'; });
      break;
    }
    case 'pick-gender': {
      const val = $('#pet-gender-val');
      if (val) val.value = v;
      $$('#pet-gender-pick span').forEach(s => { s.className = s.dataset.v === v ? 'chip' : 'chip chip-gray'; });
      break;
    }
    case 'save-pet': {
      const name = ($('#pet-name') || {}).value || '';
      if (!name.trim()) { toast('请填写宠物名字', '🐾'); break; }
      const data = {
        name: name.trim(),
        avatar: ($('#pet-avatar-val') || {}).value || '🐱',
        type: ($('#pet-type-val') || {}).value || '猫',
        breed: ($('#pet-breed') || {}).value || '未填写',
        gender: ($('#pet-gender-val') || {}).value || '公',
        birthday: ($('#pet-birthday') || {}).value || '2023-01-01',
        weight: Number(($('#pet-weight') || {}).value || 0) || '—',
        note: ($('#pet-note') || {}).value || '',
        sterilized: true
      };
      if (id) {
        const p = S.pets.find(x => x.id === id);
        if (p) Object.assign(p, data);
      } else {
        S.pets.push(Object.assign({ id: uid('P') }, data));
      }
      save(); closeSheet(); renderPets(); toast('宠物档案已保存', '✅');
      break;
    }
    case 'del-pet':
      confirmDialog({
        icon: '⚠️', title: '删除宠物', desc: '删除后该宠物的档案信息将无法恢复，确定删除吗？',
        onOk: () => {
          S.pets = S.pets.filter(x => x.id !== id);
          save(); closeSheet(); renderPets(); toast('已删除');
        }
      });
      break;

    /* ---- 优惠券 / 积分 / 储值 ---- */
    case 'coupon-tab': couponTab = v; renderCoupons(); break;
    case 'use-coupon': toast('可在下单时选择使用', '🎫'); break;
    case 'exchange-coupon': {
      if (S.member.points < 500) { toast('积分不足，需 500 积分', '⭐'); break; }
      confirmDialog({
        icon: '🎫', title: '积分兑换', desc: '消耗 500 积分兑换「商品满 100 减 20」优惠券一张，确定兑换吗？',
        onOk: () => {
          S.member.points -= 500;
          S.member.coupons.unshift({ id: uid('C'), name: '商品满 100 减 20', type: 'goods', amount: 20, threshold: 100, expire: '2027-12-31', status: 'unused' });
          S.pointLogs.unshift({ time: nowStr(), title: '积分兑换优惠券', value: -500, type: 'out' });
          save();
          if (currentPage === 'page-points') renderPoints();
          if (currentPage === 'page-coupons') renderCoupons();
          toast('兑换成功，已放入我的优惠券', '🎉');
        }
      });
      break;
    }
    case 'recharge': {
      const plan = S.rechargePlans.find(p => String(p.amount) === String(v));
      if (!plan) break;
      confirmDialog({
        icon: '💳', title: '确认充值',
        desc: `充值 ¥${plan.amount}，赠送 ¥${plan.give}，实际到账 ¥${plan.amount + plan.give}。确定充值吗？`,
        onOk: () => {
          S.member.balance += plan.amount + plan.give;
          save(); renderBalance(); toast(`充值成功，到账 ¥${plan.amount + plan.give}`, '🎉');
        }
      });
      break;
    }

    /* ---- 地址 ---- */
    case 'add-address': {
      openSheet(`
        <div class="sheet-head"><h3>新增收货地址</h3><div class="sh-close" data-act="close-sheet">×</div></div>
        <div class="form-card" style="box-shadow:none;padding:0">
          <div class="form-row"><label>收货人</label><input id="addr-name" placeholder="请输入姓名"></div>
          <div class="form-row"><label>手机号</label><input id="addr-phone" placeholder="请输入手机号"></div>
          <div class="form-row"><label>所在地区</label><input id="addr-region" placeholder="如 浙江省 杭州市 西湖区"></div>
          <div class="form-row"><label>详细地址</label><input id="addr-detail" placeholder="街道、门牌号"></div>
        </div>
        <button class="btn btn-primary btn-block mt16" data-act="save-address">保存地址</button>
        <div style="height:6px"></div>`);
      break;
    }
    case 'save-address': {
      const name = ($('#addr-name') || {}).value || '';
      const phone = ($('#addr-phone') || {}).value || '';
      const region = ($('#addr-region') || {}).value || '';
      const detail = ($('#addr-detail') || {}).value || '';
      if (!name || !phone || !detail) { toast('请填写完整的地址信息', '📍'); break; }
      S.addresses.push({ id: uid('A'), name, phone, region, detail, isDefault: S.addresses.length === 0 });
      save(); closeSheet(); renderAddress(); toast('地址已添加', '✅');
      break;
    }
    case 'set-default-addr':
      S.addresses.forEach(a => a.isDefault = a.id === id);
      save(); renderAddress(); toast('已设为默认地址');
      break;
    case 'del-addr':
      confirmDialog({
        icon: '⚠️', title: '删除地址', desc: '确定要删除这个收货地址吗？',
        onOk: () => {
          S.addresses = S.addresses.filter(a => a.id !== id);
          if (!S.addresses.some(a => a.isDefault) && S.addresses[0]) S.addresses[0].isDefault = true;
          save(); renderAddress(); toast('已删除');
        }
      });
      break;

    /* ---- 订单 ---- */
    case 'order-tab': orderTab = v; renderOrders(); break;
    case 'order-detail': go('page-order-detail', { id }); break;
    case 'pay-order': {
      const o = S.orders.find(x => x.id === id);
      if (o) { o.status = 'waitsend'; o.payTime = nowStr(); }
      save(); renderOrders(); toast('支付成功', '✅');
      break;
    }
    case 'cancel-order':
      confirmDialog({
        icon: '⚠️', title: '取消订单', desc: '确定要取消这笔订单吗？',
        onOk: () => {
          const o = S.orders.find(x => x.id === id);
          if (o) o.status = 'cancel';
          save(); renderOrders(); toast('订单已取消');
        }
      });
      break;
    case 'buy-again': {
      const o = S.orders.find(x => x.id === id);
      if (o && o.items) o.items.forEach(it => addToCartSilent(it.id, it.qty));
      save(); syncCartBadge();
      go('page-cart');
      toast('已加入购物车', '🛒');
      break;
    }

    /* ---- 弹层 ---- */
    case 'close-sheet': closeSheet(); break;
    case 'dialog-cancel': closeDialog(); break;
    case 'dialog-ok': {
      const cb = dialogOkCb;
      closeDialog();
      if (cb) cb();
      break;
    }

    /* ---- 其他 ---- */
    case 'call-shop':
      confirmDialog({ icon: '📞', title: '联系门店', desc: `门店电话：${S.shop.phone}\n营业时间：${S.shop.hours}`, okText: '知道了', cancelText: '关闭' });
      break;
    case 'reset-data':
      confirmDialog({
        icon: '🔄', title: '重置演示数据', desc: '将清空购物车、预约与订单记录，并恢复初始演示数据，确定继续吗？',
        onOk: () => {
          initStore(true);
          toast('已重置为初始数据', '✅');
          go('page-home');
        }
      });
      break;
  }
});

function addToCartSilent(id, qty = 1) {
  const g = S.goods.find(x => x.id === id);
  if (!g) return;
  const exist = S.cart.find(c => c.id === id);
  if (exist) exist.qty = Math.min(exist.qty + qty, g.stock);
  else S.cart.push({ id, qty, checked: true });
}

function saveRemark() {
  const r = $('#co-remark');
  if (r && checkoutDraft) checkoutDraft.remark = r.value;
}

/* 搜索输入 */
document.addEventListener('input', e => {
  if (e.target.id === 'mall-search') {
    mallKeyFilterDebounced(e.target.value);
  }
});

let mallSearchTimer = null;
function mallKeyFilterDebounced(val) {
  mallKw = val;
  clearTimeout(mallSearchTimer);
  mallSearchTimer = setTimeout(() => {
    if (currentPage === 'page-mall') renderMall();
  }, 200);
}

/* TabBar 点击 */
$$('#tabbar .tab-item').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    pageStack = [];
    go('page-' + tab);
  });
});

/* 遮罩点击关闭 */
$('#mask-sheet').addEventListener('click', e => {
  if (e.target.id === 'mask-sheet') closeSheet();
});

/* ============================================================
 * 启动
 * ============================================================ */
function updateClock() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const el = $('#sb-time');
  if (el) el.textContent = `${d.getHours()}:${p(d.getMinutes())}`;
}

(function boot() {
  initStore(false);
  updateClock();
  setInterval(updateClock, 20000);

  if (S.member.logged) go('page-home');
  else go('page-login');
})();

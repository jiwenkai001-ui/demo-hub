/* 宠物医院客户端小程序（H5）：预约就诊 / 在线问诊 / 诊疗信息 / 诊疗费用 */
(function () {
  'use strict';

  var S = {
    owner: null,
    page: 'home',
    param: null,
    appt: { pet_id: null, doctor_id: null, type: '普通门诊', date: null, slot: null },
    cache: {}
  };

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(v) { return Number(v || 0).toFixed(2); }
  function date(v) { return v ? String(v).slice(0, 10) : '-'; }
  function dt(v) { return v ? String(v).slice(5, 16) : '-'; }
  function dtime(v) { return v ? String(v).slice(0, 16) : '-'; }
  function petEmoji(sp) { return sp === '猫' ? '🐱' : (sp === '犬' ? '🐶' : '🐹'); }
  function statusTag(s) {
    var m = {
      '已完成': 'o', '已结清': 'o', '正常': 'o', '已到店': 'p', '诊疗中': 'w', '待缴费': 'w',
      '部分缴费': 'w', '待到店': 'b', '待处理': 'w', '未使用': 'b', '已使用': 'o',
      '已取消': '', '已过期': '', '待接诊': 'b', '进行中': 'p', '待回复': 'w', '已关闭': ''
    };
    return '<span class="tag ' + (m[s] || '') + '">' + esc(s || '-') + '</span>';
  }

  async function api(path, method, body) {
    return window.Demo.request(method || 'GET', '/api' + path, body);
  }

  function oid() { return S.owner.id; }

  /* ------------------------------------------------------------ 登录 */
  function loginHtml() {
    return `
      <div class="hero" style="padding-bottom:30px">
        <div style="text-align:center;padding:26px 0 18px">
          <div style="font-size:52px">🐾</div>
          <div style="font-size:19px;font-weight:700;margin-top:6px">宠爱动物医院</div>
          <div style="font-size:12px;opacity:.85;margin-top:4px">预约就诊 · 在线问诊 · 诊疗查询</div>
        </div>
      </div>
      <div class="card">
        <div class="fl"><label>手机号登录</label>
          <input id="login-phone" placeholder="请输入建档手机号" inputmode="numeric"></div>
        <div class="hint" style="margin-bottom:10px">演示账号（点击直接填入）：</div>
        <div id="demos" style="display:flex;flex-direction:column;gap:6px"></div>
        <button class="btn" id="login" style="margin-top:14px">登 录</button>
      </div>
      <div class="hint" style="text-align:center;padding:14px">首次到院请先在前台建档</div>`;
  }

  async function bindLogin() {
    var demos = await api('/portal/demo-accounts');
    var box = document.querySelector('#demos');
    box.innerHTML = demos.items.map(function (o) {
      return '<div class="li" data-phone="' + esc(o.phone) + '" style="border:1px solid var(--line);border-radius:9px;padding:9px 12px;cursor:pointer">' +
        '<div class="grow"><div class="t">' + esc(o.name) + '</div>' +
        '<div class="s">' + esc(o.phone) + ' · ' + esc(o.member_level) + ' · ' + o.pet_count + ' 只宠物</div></div>' +
        '<span class="tag p">选用</span></div>';
    }).join('');
    box.querySelectorAll('[data-phone]').forEach(function (el) {
      el.addEventListener('click', function () {
        document.querySelector('#login-phone').value = el.dataset.phone;
      });
    });
    document.querySelector('#login').addEventListener('click', doLogin);
  }

  async function doLogin() {
    var phone = (document.querySelector('#login-phone').value || '').trim();
    if (!phone) return toast('请输入手机号');
    try {
      var r = await api('/portal/login', 'POST', { phone: phone });
      S.owner = r.owner;
      try { localStorage.setItem('mp_owner', JSON.stringify(r.owner)); } catch (e) { }
      toast('欢迎回来，' + r.owner.name);
      await render();
    } catch (e) { toast(e.message); }
  }

  /* ------------------------------------------------------------ 底部导航 */
  function renderTabbar() {
    var tabs = [
      { k: 'home', e: '🏠', t: '首页' },
      { k: 'appt', e: '📅', t: '预约' },
      { k: 'consult', e: '💬', t: '问诊' },
      { k: 'mine', e: '👤', t: '我的' }
    ];
    var cur = ['home'].indexOf(S.page) >= 0 ? 'home' :
      (S.page === 'appt' ? 'appt' : (S.page.indexOf('consult') === 0 ? 'consult' : 'mine'));
    document.querySelector('#tabbar').innerHTML = tabs.map(function (t) {
      return '<div class="tb ' + (cur === t.k ? 'on' : '') + '" data-tab="' + t.k + '">' +
        '<span class="em">' + t.e + '</span>' + t.t + '</div>';
    }).join('');
    document.querySelectorAll('#tabbar .tb').forEach(function (el) {
      el.addEventListener('click', function () { go(el.dataset.tab); });
    });
  }

  /* ------------------------------------------------------------ 页面定义 */
  var PAGES = {};

  PAGES.home = {
    async render() {
      var d = await api('/portal/' + oid() + '/overview');
      S.cache.home = d;
      var o = d.owner, card = d.card;
      var grid = [
        { p: 'appt', e: '📅', t: '预约就诊', c: '#0d9488' },
        { p: 'consult', e: '💬', t: '在线问诊', c: '#2563eb' },
        { p: 'records', e: '📋', t: '诊疗记录', c: '#7c3aed' },
        { p: 'labs', e: '🧪', t: '检验报告', c: '#d97706' },
        { p: 'imgs', e: '🖼️', t: '影像资料', c: '#0891b2' },
        { p: 'bills', e: '💰', t: '费用账单', c: '#dc2626' },
        { p: 'pets', e: '🐾', t: '我的宠物', c: '#65a30d' },
        { p: 'reminders', e: '🔔', t: '健康提醒', c: '#db2777' }
      ];
      return `
        <div class="hero">
          <div class="row">
            <div class="av">${esc(o.name.slice(0, 1))}</div>
            <div>
              <div class="nm">${esc(o.name)}</div>
              <div class="sub">${esc(o.member_level)} · ${esc(o.life_stage)} · ${d.pet_count} 只宠物</div>
            </div>
          </div>
          <div class="stat">
            <div>会员卡余额<b>¥${money(card ? card.balance : 0)}</b></div>
            <div>积分<b>${o.points}</b></div>
            <div>优惠券<b>${d.coupon_count}</b></div>
            <div>累计消费<b>¥${money(o.total_spend)}</b></div>
          </div>
        </div>

        <div class="card float-card">
          <div class="grid4">
            ${grid.map(function (g) {
              return `<div class="it" data-go="${g.p}">
                <div class="ic" style="background:${g.c}">${g.e}</div>
                <div class="tx">${g.t}</div></div>`;
            }).join('')}
          </div>
        </div>

        ${d.pets.length ? `<div class="card">
          <div class="card-h"><h3>🐾 我的宠物</h3><span class="more" data-go="pets">全部 ›</span></div>
          <div class="pets">
            ${d.pets.map(function (p) {
              return `<div class="pet" data-pet="${p.id}">
                <div class="em">${petEmoji(p.species)}</div>
                <div class="n">${esc(p.name)}</div>
                <div class="i">${esc(p.breed || p.species)} · ${p.weight || '-'}kg</div></div>`;
            }).join('')}
          </div>
        </div>` : ''}

        ${(d.reminders || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="grow"><div class="t">🔔 健康提醒</div>
            <div class="s">${d.reminder_count} 项待处理</div></div><span class="more" data-go="reminders">查看 ›</span></div>
          ${d.reminders.slice(0, 3).map(function (r) {
            return `<div class="li"><div class="grow"><div class="t">${esc(r.title)}</div>
              <div class="s">${esc(r.pet_name || '')} · 到期 ${date(r.due_at)}</div></div>
              ${statusTag(r.status)}</div>`;
          }).join('')}
        </div>` : ''}

        ${(d.upcoming || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="grow"><div class="t">📅 即将到院</div></div></div>
          ${d.upcoming.map(function (a) {
            return `<div class="li"><div class="grow"><div class="t">${esc(a.pet_name)} · ${esc(a.appt_type)}</div>
              <div class="s">${dtime(a.scheduled_at)} · ${esc(a.doctor_name || '待分配')}</div></div>
              ${statusTag(a.status)}</div>`;
          }).join('')}
        </div>` : ''}

        ${(d.unpaid || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="grow">
            <div class="t">💰 待缴费账单</div></div><span class="more" data-go="bills">全部 ›</span></div>
          ${d.unpaid.slice(0, 3).map(function (i) {
            return `<div class="li" data-bill="${i.id}"><div class="grow"><div class="t">${esc(i.invoice_no)}</div>
              <div class="s">${dtime(i.created_at)}</div></div>
              <div class="r"><div class="money">¥${money(i.payable)}</div>${statusTag(i.status)}</div></div>`;
          }).join('')}
        </div>` : ''}`;
    },
    bind() {
      document.querySelectorAll('[data-go]').forEach(function (el) {
        el.addEventListener('click', function () { go(el.dataset.go); });
      });
      document.querySelectorAll('[data-bill]').forEach(function (el) {
        el.addEventListener('click', function () { go('billDetail', el.dataset.bill); });
      });
    }
  };

  /* ---------------------------------------------------------- 预约 */
  PAGES.appt = {
    async render() {
      var [pets, doctors, slots] = await Promise.all([
        api('/portal/' + oid() + '/pets'),
        api('/portal/doctors'),
        api('/portal/slots')
      ]);
      var mine = await api('/portal/' + oid() + '/appointments');
      S.cache.pets = pets.items;
      S.cache.doctors = doctors.items;
      S.cache.slots = slots.items;
      S.cache.myAppt = mine.items;
      var a = S.appt;
      if (!a.pet_id && pets.items.length) a.pet_id = pets.items[0].id;
      if (!a.date && slots.items.length) a.date = slots.items[0].date;
      var day = slots.items.find(function (x) { return x.date === a.date; }) || slots.items[0] || { slots: [] };
      var TYPES = ['普通门诊', '疫苗', '驱虫', '体检', '绝育', '复诊', '急诊', '洗牙'];

      return `
        <div class="navbar"><div class="title">预约就诊</div></div>
        <div class="card">
          <div class="card-h"><h3>1. 选择宠物</h3></div>
          <div class="pets">
            ${pets.items.map(function (p) {
              return `<div class="pet ${a.pet_id === p.id ? 'on' : ''}" data-ap="${p.id}">
                <div class="em">${petEmoji(p.species)}</div><div class="n">${esc(p.name)}</div>
                <div class="i">${esc(p.breed || p.species)}</div></div>`;
            }).join('') || '<div class="hint">请先建档宠物</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>2. 选择医生</h3></div>
          <div class="pets">
            ${doctors.items.map(function (d) {
              return `<div class="pet ${a.doctor_id === d.id ? 'on' : ''}" data-ad="${d.id}">
                <div class="em">👨‍⚕️</div><div class="n">${esc(d.name)}</div>
                <div class="i">${esc(d.title || '')} ${esc(d.dept || '')}</div></div>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>3. 就诊类型</h3></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${TYPES.map(function (t) {
              return `<span class="tag ${a.type === t ? 'p' : ''}" data-at="${t}" style="padding:6px 12px;font-size:12.5px">${t}</span>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>4. 选择时间</h3></div>
          <div class="days">
            ${slots.items.map(function (d) {
              return `<div class="day ${a.date === d.date ? 'on' : ''}" data-aday="${d.date}">
                <div class="d">${d.date.slice(5)}</div><div class="w">${d.weekday}</div></div>`;
            }).join('')}
          </div>
          <div class="slots">
            ${day.slots.length ? day.slots.map(function (s) {
              return `<div class="slot ${a.slot === s.datetime ? 'on' : ''} ${s.available ? '' : 'off'}"
                data-asl="${s.datetime}" data-av="${s.available}">${s.time}</div>`;
            }).join('') : '<div class="hint">该日期已约满</div>'}
          </div>
        </div>

        <div style="padding:0 12px 8px"><button class="btn" id="submit">提交预约</button></div>

        <div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="grow"><div class="t">我的预约</div></div></div>
          ${mine.items.length ? mine.items.slice(0, 10).map(function (x) {
            return `<div class="li"><div class="grow"><div class="t">${esc(x.pet_name)} · ${esc(x.appt_type)}</div>
              <div class="s">${dtime(x.scheduled_at)} · ${esc(x.doctor_name || '待分配')} · ${esc(x.source)}</div></div>
              <div class="r">${statusTag(x.status)}
                ${x.status === '待到店' ? `<div class="hint" data-cancel="${x.id}" style="color:var(--red);margin-top:4px">取消</div>` : ''}
              </div></div>`;
          }).join('') : '<div class="empty"><span class="em">📅</span>暂无预约</div>'}
        </div>`;
    },
    bind() {
      var a = S.appt;
      document.querySelectorAll('[data-ap]').forEach(function (el) {
        el.addEventListener('click', function () { a.pet_id = Number(el.dataset.ap); render(); });
      });
      document.querySelectorAll('[data-ad]').forEach(function (el) {
        el.addEventListener('click', function () {
          var v = Number(el.dataset.ad);
          a.doctor_id = a.doctor_id === v ? null : v;
          render();
        });
      });
      document.querySelectorAll('[data-at]').forEach(function (el) {
        el.addEventListener('click', function () { a.type = el.dataset.at; render(); });
      });
      document.querySelectorAll('[data-aday]').forEach(function (el) {
        el.addEventListener('click', function () { a.date = el.dataset.aday; a.slot = null; render(); });
      });
      document.querySelectorAll('[data-asl]').forEach(function (el) {
        el.addEventListener('click', function () {
          if (el.dataset.av !== 'true') return toast('该时段已约满');
          a.slot = el.dataset.asl; render();
        });
      });
      document.querySelectorAll('[data-cancel]').forEach(function (el) {
        el.addEventListener('click', async function (e) {
          e.stopPropagation();
          await api('/portal/appointments/' + el.dataset.cancel + '/cancel', 'PATCH');
          toast('预约已取消'); render();
        });
      });
      var sub = document.querySelector('#submit');
      if (sub) sub.addEventListener('click', async function () {
        if (!a.pet_id) return toast('请选择宠物');
        if (!a.slot) return toast('请选择就诊时间');
        try {
          await api('/portal/' + oid() + '/appointments', 'POST', {
            pet_id: a.pet_id, doctor_id: a.doctor_id, appt_type: a.type, scheduled_at: a.slot
          });
          toast('预约成功，请按时到院');
          a.slot = null;
          render();
        } catch (e) { toast(e.message); }
      });
    }
  };

  /* ---------------------------------------------------------- 在线问诊 */
  PAGES.consult = {
    async render() {
      var d = await api('/portal/' + oid() + '/consultations');
      return `
        <div class="navbar"><div class="title">在线问诊</div></div>
        <div style="padding:12px"><button class="btn" id="new">＋ 发起新的问诊</button></div>
        <div class="card tight">
          ${d.items.length ? d.items.map(function (c) {
            return `<div class="li" data-c="${c.id}">
              <div style="font-size:22px">💬</div>
              <div class="grow"><div class="t">${esc(c.title || '在线问诊')}</div>
                <div class="s">${esc(c.pet_name || '')} · ${esc(c.doctor_name || '')} ${esc(c.doctor_title || '')}</div>
                <div class="s">${esc((c.last_message || '').slice(0, 30))}${c.last_message && c.last_message.length > 30 ? '…' : ''}</div></div>
              <div class="r">${statusTag(c.status)}<div class="hint">${c.msg_count} 条</div></div></div>`;
          }).join('') : '<div class="empty"><span class="em">💬</span>暂无问诊，点击上方发起</div>'}
        </div>`;
    },
    bind() {
      document.querySelectorAll('[data-c]').forEach(function (el) {
        el.addEventListener('click', function () { go('consultChat', el.dataset.c); });
      });
      document.querySelector('#new').addEventListener('click', async function () {
        var pets = await api('/portal/' + oid() + '/pets');
        if (!pets.items.length) return toast('请先建档宠物');
        var opts = pets.items.map(function (p) {
          return '<option value="' + p.id + '">' + esc(p.name) + '</option>';
        }).join('');
        openSheet('发起在线问诊',
          '<div class="fl"><label>选择宠物</label><select id="sp">' + opts + '</select></div>' +
          '<div class="fl"><label>咨询主题</label><input id="st" placeholder="如：狗狗今天吐了两次"></div>' +
          '<div class="fl"><label>详细描述</label><textarea id="sc" placeholder="描述症状出现的时间、频次、精神食欲等…"></textarea></div>',
          async function () {
            var body = {
              pet_id: Number(document.querySelector('#sp').value),
              title: document.querySelector('#st').value || '在线问诊咨询',
              content: document.querySelector('#sc').value
            };
            var c = await api('/portal/' + oid() + '/consultations', 'POST', body);
            toast('已提交，医生将尽快回复');
            go('consultChat', c.id);
          });
      });
    }
  };

  PAGES.consultChat = {
    async render(id) {
      var d = await api('/portal/consultations/' + id + '/messages');
      var c = d.consultation;
      return `
        <div class="navbar"><div class="title">${esc(c.doctor_name || '在线医生')}</div>
          <div class="back" data-back>‹</div></div>
        <div class="li" style="background:#fff;border-bottom:1px solid var(--line)">
          <div class="grow"><div class="t">${esc(c.title)}</div>
            <div class="s">${esc(c.doctor_name || '')} ${esc(c.doctor_title || '')} · ${esc(c.specialty || '')}</div></div>
          ${statusTag(c.status)}</div>
        <div class="chat">
          ${d.items.map(function (m) {
            var me = m.sender_role !== 'doctor';
            return `<div class="msg ${me ? 'me' : ''}">
              <div class="av">${me ? esc(S.owner.name.slice(0, 1)) : '👨‍⚕️'}</div>
              <div><div class="wn">${esc(m.sender_name || '')} ${dt(m.created_at)}</div>
                <div class="bb">${esc(m.content)}</div></div></div>`;
          }).join('')}
        </div>
        <div class="btn-row" style="display:flex;gap:8px;align-items:center">
          <input id="txt" placeholder="描述症状，医生会及时回复…" style="flex:1">
          <button class="btn sm" id="send" style="padding:11px 16px">发送</button>
        </div>`;
    },
    bind(id) {
      var back = document.querySelector('[data-back]');
      if (back) back.addEventListener('click', function () { go('consult'); });
      var send = document.querySelector('#send');
      if (send) send.addEventListener('click', async function () {
        var v = (document.querySelector('#txt').value || '').trim();
        if (!v) return toast('请输入内容');
        document.querySelector('#txt').value = '';
        await api('/portal/consultations/' + id + '/messages', 'POST', { sender_role: 'client', content: v });
        render();
      });
      var txt = document.querySelector('#txt');
      if (txt) txt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.querySelector('#send').click();
      });
      var chat = document.querySelector('.chat');
      if (chat) chat.scrollIntoView(false);
      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  /* ---------------------------------------------------------- 我的 */
  PAGES.mine = {
    async render() {
      var o = S.owner;
      var d = S.cache.home || await api('/portal/' + oid() + '/overview');
      var menus = [
        { p: 'pets', e: '🐾', t: '我的宠物', s: d.pet_count + ' 只' },
        { p: 'records', e: '📋', t: '诊疗记录', s: '病历 · 处方 · 医嘱' },
        { p: 'labs', e: '🧪', t: '检验报告', s: '血常规 · 生化 · 血气' },
        { p: 'imgs', e: '🖼️', t: '影像资料', s: 'DR · B超 · 超声' },
        { p: 'bills', e: '💰', t: '费用账单', s: '明细 · 在线支付' },
        { p: 'coupons', e: '🎫', t: '我的优惠券', s: d.coupon_count + ' 张可用' },
        { p: 'reminders', e: '🔔', t: '健康提醒', s: d.reminder_count + ' 项待处理' }
      ];
      return `
        <div class="hero">
          <div class="row">
            <div class="av">${esc(o.name.slice(0, 1))}</div>
            <div><div class="nm">${esc(o.name)}</div>
              <div class="sub">${esc(o.phone)} · ${esc(o.member_level)}</div></div>
          </div>
          <div class="stat">
            <div>余额<b>¥${money(d.card ? d.card.balance : 0)}</b></div>
            <div>积分<b>${o.points}</b></div>
            <div>到店<b>${o.visit_count} 次</b></div>
            <div>消费<b>¥${money(o.total_spend)}</b></div>
          </div>
        </div>
        <div class="card tight" style="margin-top:12px">
          ${menus.map(function (m) {
            return `<div class="li" data-go="${m.p}"><span style="font-size:19px">${m.e}</span>
              <div class="grow"><div class="t">${m.t}</div><div class="s">${esc(m.s)}</div></div>
              <span style="color:#c4ccd8">›</span></div>`;
          }).join('')}
        </div>
        <div style="padding:16px 12px"><button class="btn gray" id="logout">退出登录</button></div>`;
    },
    bind() {
      document.querySelectorAll('[data-go]').forEach(function (el) {
        el.addEventListener('click', function () { go(el.dataset.go); });
      });
      document.querySelector('#logout').addEventListener('click', function () {
        S.owner = null;
        try { localStorage.removeItem('mp_owner'); } catch (e) { }
        render();
      });
    }
  };

  /* ---------------------------------------------------------- 宠物 */
  PAGES.pets = {
    async render() {
      var d = await api('/portal/' + oid() + '/pets');
      var vac = await api('/portal/' + oid() + '/vaccinations');
      return `
        <div class="navbar"><div class="title">我的宠物</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (p) {
          var vs = vac.items.filter(function (v) { return v.pet_id === p.id; });
          return `<div class="card">
            <div class="li" style="padding:0 0 10px;border:none">
              <div style="font-size:34px">${petEmoji(p.species)}</div>
              <div class="grow"><div class="t" style="font-size:15px;font-weight:650">${esc(p.name)}</div>
                <div class="s">${esc(p.species)} · ${esc(p.breed || '')} · ${esc(p.gender || '')}</div></div>
              <span class="tag p">${esc(p.species)}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px">
              <div><span class="hint">生日</span> ${date(p.birth_date)}</div>
              <div><span class="hint">体重</span> ${p.weight ? p.weight + ' kg' : '-'}</div>
              <div><span class="hint">毛色</span> ${esc(p.color || '-')}</div>
              <div><span class="hint">血型</span> ${esc(p.blood_type || '-')}</div>
              <div><span class="hint">芯片</span> ${esc(p.chip_no || '未植入')}</div>
              <div><span class="hint">过敏史</span> ${p.allergies ? esc(p.allergies) : '无'}</div>
            </div>
            ${vs.length ? `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:9px">
              <div class="hint" style="margin-bottom:5px">免疫记录</div>
              ${vs.slice(0, 3).map(function (v) {
                return `<div style="font-size:12.5px;display:flex;justify-content:space-between">
                  <span>${esc(v.name)}</span><span class="hint">${date(v.injected_at)}${v.next_due_at ? ' · 下次 ' + date(v.next_due_at) : ''}</span></div>`;
              }).join('')}</div>` : ''}
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🐾</span>还没有宠物档案</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
    }
  };

  /* ---------------------------------------------------------- 诊疗记录 */
  PAGES.records = {
    async render() {
      var d = await api('/portal/' + oid() + '/records');
      return `
        <div class="navbar"><div class="title">诊疗记录</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (v) {
          return `<div class="card" data-rec="${v.id}" style="margin:10px 12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="tag p">${esc(v.visit_type || '门诊')}</span>
              <span class="hint">${dtime(v.visited_at)}</span>
              <span style="margin-left:auto">${statusTag(v.status)}</span>
            </div>
            <div style="font-size:14.5px;font-weight:600;margin-top:7px">${esc(v.pet_name)} · ${esc(v.diagnosis || v.chief_complaint || '待完善病历')}</div>
            <div class="hint" style="margin-top:3px">${esc(v.dept || '')} · ${esc(v.doctor_name || '')}</div>
            <div class="hint" style="margin-top:6px">主诉：${esc(v.chief_complaint || '-')}</div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">📋</span>暂无诊疗记录</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-rec]').forEach(function (el) {
        el.addEventListener('click', function () { go('recordDetail', el.dataset.rec); });
      });
    }
  };

  PAGES.recordDetail = {
    async render(id) {
      var v = await api('/portal/' + oid() + '/records/' + id);
      var vit = v.vitals;
      return `
        <div class="navbar"><div class="title">病历详情</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:24px">${petEmoji(v.pet ? v.pet.species : '')}</span>
            <div class="grow"><div style="font-size:15px;font-weight:650">${esc(v.pet ? v.pet.name : '')}</div>
              <div class="hint">${esc(v.visit_no)} · ${dtime(v.visited_at)}</div></div>
            ${statusTag(v.status)}
          </div>
          <div class="hint" style="margin-top:8px">接诊医生：${esc(v.doctor ? v.doctor.name + ' ' + (v.doctor.title || '') : '-')} · ${esc(v.dept || '')}</div>
        </div>

        ${vit ? `<div class="card">
          <div class="card-h"><h3>生命体征</h3></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
            ${[['体温', vit.temperature + '℃'], ['心率', vit.heart_rate], ['呼吸', vit.resp_rate],
               ['体重', vit.weight + 'kg'], ['CRT', vit.crt + 's'], ['黏膜', vit.mm || '-'],
               ['疼痛', vit.pain_score], ['BCS', vit.bcs]].map(function (x) {
              return `<div style="background:var(--bg);border-radius:8px;padding:7px 2px">
                <div class="hint" style="font-size:10.5px">${x[0]}</div>
                <div style="font-weight:650;font-size:13px">${esc(x[1])}</div></div>`;
            }).join('')}
          </div></div>` : ''}

        <div class="card">
          <div class="card-h"><h3>诊疗内容</h3></div>
          <div style="font-size:13.5px;line-height:1.9">
            <div><span class="hint">主诉：</span>${esc(v.chief_complaint || '-')}</div>
            <div><span class="hint">现病史：</span>${esc(v.present_illness || '-')}</div>
            <div><span class="hint">诊断：</span><b>${esc(v.diagnosis || '-')}</b></div>
            <div><span class="hint">处置：</span>${esc(v.treatment || '-')}</div>
            <div><span class="hint">医嘱：</span>${esc(v.advice || '-')}</div>
          </div>
        </div>

        ${(v.soap || []).length ? `<div class="card">
          <div class="card-h"><h3>病程记录</h3></div>
          ${v.soap.map(function (n) {
            return `<div style="border-left:2px solid var(--p);padding-left:10px;margin-bottom:9px;font-size:13px">
              <div class="hint">${dtime(n.created_at)} ${esc(n.author || '')}</div>
              <div>${esc(n.assessment || n.subjective || '')}</div>
              <div class="hint">${esc(n.plan || '')}</div></div>`;
          }).join('')}</div>` : ''}

        ${(v.prescriptions || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">用药处方</div></div>
          ${v.prescriptions.map(function (p) {
            return `<div class="li"><div class="grow"><div class="t">${esc(p.drug_name)}</div>
              <div class="s">${esc(p.dosage || '')} · ${esc(p.frequency || '')} · ${esc(p.route || '')} · ${p.days} 天</div></div>
              <div class="r"><div>${p.qty} ${esc(p.unit)}</div></div></div>`;
          }).join('')}</div>` : ''}

        ${(v.lab_orders || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">化验检查</div></div>
          ${v.lab_orders.map(function (l) {
            return `<div class="li" data-lab="${l.id}"><div class="grow"><div class="t">${esc(l.panel)}</div>
              <div class="s">${esc(l.order_no)} · ${esc(l.device_name || '')}</div></div>
              <div class="r">${statusTag(l.status)}<div class="hint">查看 ›</div></div></div>`;
          }).join('')}</div>` : ''}

        ${(v.imaging || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">影像检查</div></div>
          ${v.imaging.map(function (s) {
            return `<div class="li" data-img="${s.id}"><div class="grow"><div class="t">${esc(s.modality)} · ${esc(s.body_part)}</div>
              <div class="s">${s.image_count} 幅 · ${esc(s.impression || '待出报告')}</div></div>
              <div class="r"><div class="hint">查看 ›</div></div></div>`;
          }).join('')}</div>` : ''}

        ${v.invoice ? `<div class="card">
          <div class="card-h"><h3>本次费用</h3><span class="more" data-bill="${v.invoice.id}">明细 ›</span></div>
          <div style="display:flex;align-items:baseline;gap:10px">
            <span class="money" style="font-size:22px">¥${money(v.invoice.payable)}</span>
            ${statusTag(v.invoice.status)}
          </div></div>` : ''}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('records'); });
      document.querySelectorAll('[data-lab]').forEach(function (el) {
        el.addEventListener('click', function () { go('labDetail', el.dataset.lab); });
      });
      document.querySelectorAll('[data-img]').forEach(function (el) {
        el.addEventListener('click', function () { go('imgDetail', el.dataset.img); });
      });
      document.querySelectorAll('[data-bill]').forEach(function (el) {
        el.addEventListener('click', function () { go('billDetail', el.dataset.bill); });
      });
    }
  };

  /* ---------------------------------------------------------- 检验报告 */
  PAGES.labs = {
    async render() {
      var d = await api('/portal/' + oid() + '/labs');
      return `
        <div class="navbar"><div class="title">检验报告</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (l) {
          return `<div class="card" data-lab="${l.id}" style="margin:10px 12px">
            <div style="display:flex;align-items:center">
              <div class="grow"><div style="font-size:14.5px;font-weight:600">${esc(l.panel)}检查</div>
                <div class="hint">${esc(l.pet_name || '')} · ${dtime(l.ordered_at)}</div></div>
              ${statusTag(l.status)}</div>
            <div class="hint" style="margin-top:6px">${esc(l.order_no)} · ${esc(l.device_name || '')} · ${esc(l.sample_type || '')}</div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🧪</span>暂无检验报告</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-lab]').forEach(function (el) {
        el.addEventListener('click', function () { go('labDetail', el.dataset.lab); });
      });
    }
  };

  PAGES.labDetail = {
    async render(id) {
      var o = await api('/portal/' + oid() + '/labs/' + id);
      return `
        <div class="navbar"><div class="title">${esc(o.panel)}检查报告</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="font-size:14.5px;font-weight:600">${esc(o.pet ? o.pet.name : '')} · ${esc(o.panel)}</div>
          <div class="hint">${esc(o.order_no)} · 报告时间 ${dtime(o.reported_at)}</div>
          <div class="hint">检验设备：${esc(o.device_name || '-')} · 样本：${esc(o.sample_type || '-')}</div>
        </div>
        ${(o.abnormal || []).length ? `<div class="card">
          <div class="card-h"><h3 style="color:var(--red)">⚠️ 异常提示 ${o.abnormal.length} 项</h3></div>
          ${o.abnormal.map(function (r) {
            return `<div class="res ab"><div><div class="n">${esc(r.item_name)}</div>
              <div class="hint">参考 ${esc(r.ref_text || '-')}</div></div>
              <div style="text-align:right"><div class="v" style="color:var(--red)">${esc(r.value)} ${esc(r.unit || '')}</div>
              <span class="tag d">${esc(r.flag)}</span></div></div>`;
          }).join('')}</div>` : ''}
        <div class="card">
          <div class="card-h"><h3>检验结果（${o.results.length} 项）</h3></div>
          ${o.results.map(function (r) {
            return `<div class="res ${r.flag !== '正常' ? 'ab' : ''}">
              <div><div class="n">${esc(r.item_name)}</div><div class="hint">参考 ${esc(r.ref_text || '-')}</div></div>
              <div style="text-align:right"><div class="v">${esc(r.value)} <span class="hint">${esc(r.unit || '')}</span></div>
                ${r.flag === '正常' ? '<span class="tag o">正常</span>' : '<span class="tag d">' + esc(r.flag) + '</span>'}</div></div>`;
          }).join('') || '<div class="empty">暂无结果</div>'}
        </div>
        <div class="hint" style="padding:12px;text-align:center">结果仅供临床参考，具体请咨询接诊医生</div>`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('labs'); });
    }
  };

  /* ---------------------------------------------------------- 影像 */
  PAGES.imgs = {
    async render() {
      var d = await api('/portal/' + oid() + '/imaging');
      return `
        <div class="navbar"><div class="title">影像资料</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (s) {
          return `<div class="card" data-img="${s.id}" style="margin:10px 12px">
            ${s.cover_url ? `<img src="${s.cover_url}" style="width:100%;height:150px;object-fit:cover;border-radius:9px;background:#000">` : ''}
            <div style="display:flex;align-items:center;margin-top:8px">
              <div class="grow"><div style="font-size:14.5px;font-weight:600">${esc(s.modality)} · ${esc(s.body_part)}</div>
                <div class="hint">${esc(s.pet_name || '')} · ${s.image_count} 幅 · ${dtime(s.performed_at)}</div></div>
              ${statusTag(s.status)}</div>
            <div class="hint" style="margin-top:5px">${esc(s.impression || '待出报告')}</div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🖼️</span>暂无影像资料</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-img]').forEach(function (el) {
        el.addEventListener('click', function () { go('imgDetail', el.dataset.img); });
      });
    }
  };

  PAGES.imgDetail = {
    async render(id) {
      var s = await api('/portal/' + oid() + '/imaging/' + id);
      return `
        <div class="navbar"><div class="title">${esc(s.modality)} · ${esc(s.body_part)}</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="font-size:14.5px;font-weight:600">${esc(s.pet ? s.pet.name : '')} · ${esc(s.modality)}检查</div>
          <div class="hint">检查时间 ${dtime(s.performed_at)} · 技师 ${esc(s.performed_by || '-')}</div>
        </div>
        ${s.instances.map(function (i) {
          return `<div style="margin:0 12px 10px;background:#000;border-radius:10px;overflow:hidden">
            <img src="${i.url}" style="width:100%;display:block">
            <div style="color:#fff;font-size:11.5px;padding:6px 10px;background:rgba(0,0,0,.6)">
              #${i.instance_no} ${esc(i.note || '')} · ${i.width}×${i.height}</div></div>`;
        }).join('')}
        <div class="card">
          <div class="card-h"><h3>影像报告</h3></div>
          <div style="font-size:13.5px;line-height:1.8">
            <div><span class="hint">影像所见：</span>${esc(s.findings || '待填写')}</div>
            <div><span class="hint">影像诊断：</span><b>${esc(s.impression || '待填写')}</b></div>
          </div>
        </div>`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('imgs'); });
    }
  };

  /* ---------------------------------------------------------- 费用 */
  PAGES.bills = {
    async render() {
      var d = await api('/portal/' + oid() + '/invoices');
      return `
        <div class="navbar"><div class="title">费用账单</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (i) {
          return `<div class="card" data-bill="${i.id}" style="margin:10px 12px">
            <div style="display:flex;align-items:center">
              <div class="grow"><div style="font-size:14.5px;font-weight:600">${esc(i.pet_name || '')} · ${dtime(i.created_at)}</div>
                <div class="hint">${esc(i.invoice_no)} · ${esc(i.pay_method || '未支付')}</div></div>
              <div style="text-align:right"><div class="money" style="font-size:17px">¥${money(i.payable)}</div>
                ${statusTag(i.status)}</div>
            </div>
            ${i.status !== '已结清' ? `<button class="btn sm" data-pay="${i.id}" style="margin-top:9px;width:100%">立即支付 ¥${money(Number(i.payable) - Number(i.paid_amount))}</button>` : ''}
          </div>`;
        }).join('') : '<div class="empty"><span class="em">💰</span>暂无账单</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-bill]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.dataset.pay) return;
          go('billDetail', el.dataset.bill);
        });
      });
      document.querySelectorAll('[data-pay]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          payBill(el.dataset.pay);
        });
      });
    }
  };

  PAGES.billDetail = {
    async render(id) {
      var i = await api('/portal/' + oid() + '/invoices/' + id);
      return `
        <div class="navbar"><div class="title">账单明细</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="text-align:center;padding:6px 0">
            <div class="hint">应付金额</div>
            <div class="money" style="font-size:30px">¥${money(i.payable)}</div>
            <div style="margin-top:5px">${statusTag(i.status)}</div>
          </div>
          <div class="hint" style="text-align:center;margin-top:6px">
            ${esc(i.invoice_no)} · ${esc(i.pet ? i.pet.name : '')} · ${dtime(i.created_at)}</div>
        </div>
        <div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">费用明细</div></div>
          ${i.items.map(function (t) {
            return `<div class="li"><span class="tag ${t.item_type === '药品' ? 'p' : (t.item_type === '检验' ? 'b' : '')}">${esc(t.item_type)}</span>
              <div class="grow"><div class="t">${esc(t.name)}</div><div class="s">${t.qty} × ¥${money(t.unit_price)}</div></div>
              <div>¥${money(t.amount)}</div></div>`;
          }).join('')}
          <div class="li">
            <div class="grow"><div class="s">合计 ¥${money(i.total_amount)}</div>
              <div class="s">优惠 -¥${money(i.discount)}</div></div>
            <div class="money">应付 ¥${money(i.payable)}</div></div>
        </div>
        ${i.status !== '已结清' ? `<div style="padding:0 12px">
          <button class="btn" data-pay="${i.id}">微信支付 ¥${money(Number(i.payable) - Number(i.paid_amount))}</button>
          <button class="btn ghost" data-pay2="${i.id}" style="margin-top:9px">会员卡支付</button></div>` : ''}`;
    },
    bind(id) {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('bills'); });
      document.querySelectorAll('[data-pay]').forEach(function (el) {
        el.addEventListener('click', function () { payBill(el.dataset.pay, '微信'); });
      });
      document.querySelectorAll('[data-pay2]').forEach(function (el) {
        el.addEventListener('click', function () { payBill(el.dataset.pay2, '会员卡'); });
      });
    }
  };

  async function payBill(id, method) {
    method = method || '微信';
    if (!confirm('确认使用「' + method + '」支付该账单？')) return;
    try {
      var r = await api('/portal/' + oid() + '/invoices/' + id + '/pay', 'POST', { pay_method: method });
      toast('支付成功：' + r.status);
      render();
    } catch (e) { toast(e.message); }
  }

  /* ---------------------------------------------------------- 优惠券 / 提醒 */
  PAGES.coupons = {
    async render() {
      var d = await api('/portal/' + oid() + '/coupons');
      return `
        <div class="navbar"><div class="title">我的优惠券</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (c) {
          return `<div class="card" style="margin:10px 12px;display:flex;align-items:center;gap:12px;${c.status !== '未使用' ? 'opacity:.55' : ''}">
            <div style="width:78px;text-align:center;color:var(--red)">
              <div style="font-size:22px;font-weight:700">${c.coupon_type === '折扣' ? (Math.round(c.value * 100) / 10) + '折' : '¥' + c.value}</div>
              <div class="hint">${c.min_spend > 0 ? '满' + c.min_spend : '无门槛'}</div>
            </div>
            <div class="grow"><div style="font-size:14px;font-weight:600">${esc(c.name)}</div>
              <div class="hint">${esc(c.campaign_name || '')} · 至 ${date(c.expire_at)}</div></div>
            ${statusTag(c.status)}</div>`;
        }).join('') : '<div class="empty"><span class="em">🎫</span>暂无优惠券</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
    }
  };

  PAGES.reminders = {
    async render() {
      var d = await api('/portal/' + oid() + '/reminders');
      return `
        <div class="navbar"><div class="title">健康提醒</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (r) {
          return `<div class="card" style="margin:10px 12px">
            <div style="display:flex;align-items:center">
              <div class="grow"><div style="font-size:14px;font-weight:600">${esc(r.title)}</div>
                <div class="hint">${esc(r.pet_name || '')} · ${esc(r.type)} · 到期 ${date(r.due_at)}</div>
                <div style="font-size:13px;margin-top:4px">${esc(r.content || '')}</div></div>
              ${statusTag(r.status)}</div>
            ${r.status === '待处理' ? `<button class="btn sm" data-done="${r.id}" style="margin-top:9px;width:100%">标记已完成</button>` : ''}
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🔔</span>暂无提醒</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-done]').forEach(function (el) {
        el.addEventListener('click', async function () {
          await api('/portal/reminders/' + el.dataset.done + '/done', 'PATCH');
          toast('已标记完成');
          render();
        });
      });
    }
  };

  /* ---------------------------------------------------------- 通用 */
  function openSheet(title, body, onOk) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:60;display:flex;' +
      'align-items:flex-end;justify-content:center';
    wrap.innerHTML = '<div style="background:#fff;width:100%;max-width:420px;border-radius:14px 14px 0 0;' +
      'padding:16px;max-height:82vh;overflow:auto">' +
      '<div style="font-size:16px;font-weight:650;margin-bottom:12px">' + esc(title) + '</div>' +
      body +
      '<div style="display:flex;gap:9px;margin-top:8px">' +
      '<button class="btn gray" data-c style="flex:1">取消</button>' +
      '<button class="btn" data-k style="flex:1">确定</button></div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('[data-c]').onclick = function () { wrap.remove(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector('[data-k]').onclick = async function () {
      try { await onOk(); wrap.remove(); } catch (e) { toast(e.message); }
    };
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);' +
        'color:#fff;padding:10px 18px;border-radius:8px;font-size:13.5px;z-index:200;max-width:78vw;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.display = 'none'; }, 2000);
  }

  async function go(page, param) {
    S.page = page;
    S.param = param;
    await render();
    window.scrollTo(0, 0);
  }

  async function render() {
    var c = document.querySelector('#content');
    var bar = document.querySelector('#tabbar');
    if (!S.owner) {
      c.innerHTML = loginHtml();
      bar.innerHTML = '';
      await bindLogin();
      return;
    }
    var p = PAGES[S.page] || PAGES.home;
    c.innerHTML = '<div class="empty">加载中…</div>';
    try {
      var html = await p.render(S.param);
      c.innerHTML = html;
      if (p.bind) p.bind(S.param);
    } catch (e) {
      c.innerHTML = '<div class="empty"><span class="em">⚠️</span>' + esc(e.message || '加载失败') + '</div>';
    }
    renderTabbar();
    // 聊天页为全屏页面：隐藏底部导航，避免与固定输入行相互遮挡
    document.querySelector('#tabbar').style.display =
      ['consultChat'].indexOf(S.page) >= 0 ? 'none' : '';
  }

  /* ---------------------------------------------------------- 启动 */
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var saved = localStorage.getItem('mp_owner');
      if (saved) S.owner = JSON.parse(saved);
    } catch (e) { }
    render();
  });

  window.__MP = { go: go, S: S };
})();

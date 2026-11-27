/* ============================================================
 * 装修公司管理系统 - 业主客户端小程序逻辑
 * ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = Store.escape, S = Store;

  var TABS = [
    { id: 'home', name: '首页', icon: 'home', title: '臻品装饰', sub: '匠心筑家 · 让家更美好' },
    { id: 'progress', name: '进度', icon: 'hammer', title: '装修进度', sub: '实时了解施工进展' },
    { id: 'plans', name: '方案', icon: 'blueprint', title: '设计方案', sub: '查看方案并反馈意见' },
    { id: 'chat', name: '沟通', icon: 'message', title: '在线沟通', sub: '随时联系设计与施工团队' },
    { id: 'me', name: '我的', icon: 'user', title: '个人中心', sub: '项目与服务' }
  ];
  var state = { tab: 'home', planFilter: '' };

  function project() {
    var id = S.get('currentProject');
    var p = S.find('projects', id);
    if (!p) { p = S.get('projects')[0]; if (p) S.set('currentProject', p.id); }
    return p;
  }
  function customerOf(p) { return p ? S.find('customers', p.customerId) : null; }
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || 'ok'); el.textContent = msg;
    $('#toastBox').appendChild(el); setTimeout(function () { el.remove(); }, 2200);
  }
  function badge(s) {
    var map = { '施工中': 'warning', '设计中': 'orange', '待开工': 'info', '已完工': 'success', '已暂停': 'gray',
      '待确认': 'warning', '已确认': 'success', '需修改': 'danger' };
    return '<span class="badge ' + (map[s] || 'gray') + '">' + esc(s) + '</span>';
  }
  function sheet(title, body, foot) {
    var root = $('#sheetRoot');
    root.innerHTML = '<div class="m-sheet-mask" id="curSheetMask"><div class="m-sheet"><div class="spread" style="margin-bottom:14px"><h3>' + esc(title) + '</h3>' +
      '<button class="modal-close" id="sheetClose">×</button></div>' + body + (foot || '') + '</div></div>';
    function close() { root.innerHTML = ''; }
    $('#sheetClose').onclick = close;
    $('#curSheetMask').onclick = function (e) { if (e.target.id === 'curSheetMask') close(); };
    return { close: close, root: root };
  }
  function go(tab) {
    state.tab = tab;
    $$('.mini-page').forEach(function (p) { p.classList.toggle('active', p.id === 'page-' + tab); });
    $$('.mini-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    var t = TABS.filter(function (x) { return x.id === tab; })[0];
    $('#miniTitle').textContent = t.title; $('#miniSub').textContent = t.sub;
    $('#miniScroll').scrollTop = 0; render();
  }
  function render() {
    var f = { home: renderHome, progress: renderProgress, plans: renderPlans, chat: renderChat, me: renderMe }[state.tab];
    if (f) { $('#page-' + state.tab).innerHTML = f(); bind(); }
  }
  function projectPicker() {
    return '<div class="m-picker">' + S.get('projects').map(function (p) {
      return '<button class="chip' + (project() && project().id === p.id ? ' active' : '') + '" data-pick="' + p.id + '">' + esc(p.name.replace(/ · .*$/, '')) + '</button>';
    }).join('') + '</div>';
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var p = project(), c = customerOf(p);
    var myProjects = c ? S.listBy('projects', 'customerId', c.id) : (p ? [p] : []);
    var plans = p ? S.listBy('plans', 'projectId', p.id) : [];
    var wait = plans.filter(function (f) { return f.status === '待确认' || f.status === '需修改'; });
    var quick = [
      { id: 'progress', name: '装修进度', icon: 'hammer', bg: '#d8f5ee', color: '#0b7c71' },
      { id: 'plans', name: '设计方案', icon: 'blueprint', bg: '#efe9fb', color: '#7451bd' },
      { id: 'chat', name: '在线沟通', icon: 'message', bg: '#e3f1fb', color: '#2b6cb0' },
      { id: 'me', name: '个人中心', icon: 'user', bg: '#d1fae5', color: '#047857' }
    ];
    return '<div class="m-hero"><div style="font-size:12px;color:#c8f3e9">您好，' + esc(c ? c.name : '业主') + ' 👋</div>' +
        '<h3>' + esc(S.get('settings').notice || '匠心筑家') + '</h3>' +
        '<div class="hero-stats"><div class="hero-stat"><b>' + myProjects.length + '</b><span>我的项目</span></div>' +
        '<div class="hero-stat"><b>' + (p ? p.progress : 0) + '%</b><span>当前进度</span></div>' +
        '<div class="hero-stat"><b>' + wait.length + '</b><span>待确认方案</span></div></div></div>' +
      '<div class="m-section"><div class="m-quick">' + quick.map(function (q) {
        return '<button class="q-item" data-go="' + q.id + '"><div class="q-icon" style="background:' + q.bg + ';color:' + q.color + '">' + Icon[q.icon] + '</div><div class="q-name">' + q.name + '</div></button>';
      }).join('') + '</div></div>' +
      (wait.length ? '<div class="m-banner" data-go="plans"><div class="ic">' + Icon.bell + '</div><div class="grow"><div class="t">您有 ' + wait.length + ' 套方案待确认</div><div class="d">点击查看并反馈意见 →</div></div></div>' : '') +
      '<div class="m-section"><div class="m-section-title"><h4>我的装修项目</h4><span data-go="progress">查看详情 →</span></div>' +
        (p ? '<div class="m-project-card" data-go="progress"><div class="row spread"><div class="t">' + esc(p.name) + '</div>' + badge(p.status) + '</div>' +
          '<div class="d">' + esc(p.style) + ' · ' + p.area + '㎡ · 预算 ' + S.money(p.budget) + '</div>' +
          '<div class="pr"><div class="progress-line"><i style="width:' + p.progress + '%"></i></div><b>' + p.progress + '%</b></div>' +
          '<div class="tiny muted" style="margin-top:8px">当前阶段：' + esc(p.phase) + '</div></div>' : '<div class="m-card tiny muted">暂无项目</div>') +
      '</div>' +
      '<div class="m-section"><div class="m-section-title"><h4>最新公告</h4><span>公司动态</span></div>' +
        S.get('notices').slice(0, 3).map(function (n) {
          return '<div class="m-notice" data-notice="' + n.id + '"><div class="nt">' + esc(n.title) + '</div><div class="nd">' + esc(n.date) + ' · 点击查看</div></div>';
        }).join('') + '</div>';
  }

  /* ---------- 装修进度 ---------- */
  function renderProgress() {
    var p = project(); if (!p) return '<div class="empty">暂无项目</div>';
    var ups = S.listBy('progress', 'projectId', p.id).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var idx = S.phases.indexOf(p.phase);
    return '<div style="padding-top:12px">' + projectPicker() + '</div>' +
      '<div class="m-section"><div class="m-card">' +
        '<div class="spread"><div><div style="font-size:14px;font-weight:800">' + esc(p.name) + '</div>' +
        '<div class="tiny muted">' + esc(p.style) + ' · ' + p.area + '㎡</div></div>' + badge(p.status) + '</div>' +
        '<div class="pr" style="margin-top:14px"><div class="progress-line"><i style="width:' + p.progress + '%"></i></div><b>' + p.progress + '%</b></div>' +
        '<div class="m-phase-list">' + S.phases.map(function (ph, i) {
          return '<span class="m-phase ' + (i < idx ? 'done' : i === idx ? 'current' : '') + '">' + ph + '</span>';
        }).join('') + '</div></div></div>' +
      '<div class="m-section"><div class="m-stat-row">' +
        '<div class="m-stat-cell"><b>' + p.progress + '%</b><span>总体进度</span></div>' +
        '<div class="m-stat-cell"><b>' + esc(p.phase) + '</b><span>当前阶段</span></div>' +
        '<div class="m-stat-cell"><b>' + ups.length + '</b><span>进度更新</span></div></div></div>' +
      '<div class="m-section"><div class="m-section-title"><h4>施工日志</h4><span>共 ' + ups.length + ' 条</span></div>' +
        (ups.length ? '<div class="m-card"><div class="timeline">' + ups.map(function (u, i) {
          var pc = ['photo-1','photo-2','photo-3','photo-4','photo-5','photo-6'][i % 6];
          return '<div class="tl-item ' + (i === 0 ? 'current' : 'done') + '"><span class="tl-dot"></span>' +
            '<div class="tl-head"><span class="tl-title">' + esc(u.phase) + '</span><span class="tl-date">' + esc(u.date) + '</span></div>' +
            '<div class="tl-content">' + esc(u.content) + '</div>' +
            '<div class="photo-tile ' + pc + '" style="margin-top:10px;max-width:130px">' + Icon.camera + esc(u.photo || '现场照片') + '</div>' +
            '<div class="tiny muted" style="margin-top:5px">记录人：' + esc(u.author) + '</div></div>';
        }).join('') + '</div></div>' : '<div class="m-card empty">暂无施工记录</div>') + '</div>';
  }

  /* ---------- 设计方案 ---------- */
  function renderPlans() {
    var p = project(); if (!p) return '<div class="empty">暂无项目</div>';
    var list = S.listBy('plans', 'projectId', p.id).filter(function (f) { return !state.planFilter || f.status === state.planFilter; });
    return '<div style="padding-top:12px">' + projectPicker() + '</div>' +
      '<div style="padding:10px 14px 0"><div class="m-filter-tabs">' + ['', '待确认', '已确认', '需修改'].map(function (s) {
        return '<button data-pfilter="' + s + '" class="' + (state.planFilter === s ? 'active' : '') + '">' + (s || '全部') + '</button>';
      }).join('') + '</div></div>' +
      '<div class="m-section"><div class="m-section-title"><h4>方案列表</h4><span>共 ' + list.length + ' 套</span></div>' +
      (list.length ? list.map(function (f) {
        var vis = ['vis-1', 'vis-2', 'vis-3', 'vis-4'][f.type.length % 4];
        return '<div class="m-plan-card"><div class="m-plan-top"><div><div class="t">' + esc(f.name) + '</div>' +
          '<div class="d">' + esc(f.type) + ' · ' + esc(f.version) + ' · ' + esc(f.date) + '</div></div>' + badge(f.status) + '</div>' +
          '<div class="m-plan-visual ' + vis + '" data-plan="' + f.id + '">' + Icon.blueprint + ' 点击查看方案详情</div>' +
          '<div class="m-plan-desc">' + esc(f.description || '暂无方案说明') + '</div>' +
          (f.feedback ? '<div class="m-feedback"><b>我的反馈：</b>' + esc(f.feedback) + '</div>' : '') +
          (f.status !== '已确认' ? '<div class="m-plan-actions">' +
            '<button class="btn btn-sm btn-primary grow" data-confirm="' + f.id + '">' + Icon.check + ' 确认方案</button>' +
            '<button class="btn btn-sm grow" data-feedback="' + f.id + '">填写反馈</button></div>' : '') +
          '</div>';
      }).join('') : '<div class="m-card empty"><div class="big">📐</div>暂无方案</div>') + '</div>';
  }
  function planDetail(id) {
    var f = S.find('plans', id); if (!f) return;
    var vis = ['vis-1', 'vis-2', 'vis-3', 'vis-4'][f.type.length % 4];
    var body = '<div class="m-plan-visual ' + vis + '" style="margin-top:0">' + Icon.blueprint + ' ' + esc(f.type) + ' · ' + esc(f.version) + '</div>' +
      '<div class="detail-grid" style="grid-template-columns:1fr">' +
      [['方案名称', f.name], ['所属项目', projectName(f.projectId)], ['上传日期', f.date], ['状态', f.status], ['设计师', staffName(f.designerId)]]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="section-title">方案说明</div><div style="font-size:13px;line-height:1.8">' + esc(f.description || '暂无说明') + '</div>' +
      (f.feedback ? '<div class="section-title">我的反馈</div><div class="m-diag">' + esc(f.feedback) + '</div>' : '');
    sheet('方案详情', body, '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
    $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
  }
  function projectName(id) { var p = S.find('projects', id); return p ? p.name : '-'; }
  function staffName(id) { var p = S.find('staff', id); return p ? p.name : '-'; }

  /* ---------- 在线沟通 ---------- */
  function renderChat() {
    var p = project(); if (!p) return '<div class="empty">暂无项目</div>';
    var list = S.listBy('messages', 'projectId', p.id).sort(function (a, b) { return a.date.localeCompare(b.date); });
    return '<div style="padding-top:12px">' + projectPicker() + '</div>' +
      '<div class="m-section" style="margin-bottom:8px"><div class="m-card"><div class="m-chat-head">' +
        '<div class="avatar" style="background:#0e9f8e">家</div><div class="grow"><div class="t">家装服务群 · ' + esc(p.name.replace(/ · .*$/, '')) + '</div>' +
        '<div class="d">设计师 · 项目经理 · 监理</div></div><span class="badge success"><i class="dot"></i>在线</span></div></div></div>' +
      '<div class="m-chat-area"><div class="chat-list">' +
        (list.length ? list.map(function (m) {
          var mine = m.from === '客户';
          return '<div class="chat-row' + (mine ? ' mine' : '') + '"><div class="avatar" style="background:' + (mine ? '#78716c' : '#0e9f8e') + '">' + esc(m.fromName.charAt(0)) + '</div>' +
            '<div class="chat-meta"><div class="chat-name">' + esc(m.fromName) + ' · ' + esc(m.from) + '</div>' +
            '<div class="chat-bubble">' + esc(m.content) + '</div><div class="chat-time">' + esc(m.date) + '</div></div></div>';
        }).join('') : '<div class="empty"><div class="big">💬</div>暂无消息，打个招呼吧</div>') + '</div></div>' +
      '<div class="m-quick-reply">' + ['工期进度怎么样了？', '想修改一下方案', '材料什么时候到场？', '谢谢，辛苦了'].map(function (t) {
        return '<button data-quick="' + t + '">' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="m-input-bar" style="margin-top:10px"><input class="input" id="chatInput" placeholder="发送消息...">' +
        '<button class="send" id="chatSend">' + Icon.send + '</button></div>';
  }
  function sendMsg(text) {
    var content = (text || $('#chatInput').value || '').trim();
    if (!content) { toast('请输入消息内容', 'err'); return; }
    var p = project(); var c = customerOf(p);
    S.add('messages', { id: S.nextId('M'), projectId: p.id, from: '客户', fromName: c ? c.name : '业主',
      date: S.today() + ' ' + new Date().toTimeString().slice(0, 5), content: content, read: false });
    render();
    var sc = $('#miniScroll'); if (sc) sc.scrollTop = sc.scrollHeight;
  }

  /* ---------- 我的 ---------- */
  function renderMe() {
    var p = project(), c = customerOf(p);
    var menus = [
      { act: 'my-progress', name: '我的装修进度', icon: 'hammer', bg: '#d8f5ee', color: '#0b7c71' },
      { act: 'my-plans', name: '设计方案', icon: 'blueprint', bg: '#efe9fb', color: '#7451bd' },
      { act: 'my-chat', name: '在线沟通', icon: 'message', bg: '#e3f1fb', color: '#2b6cb0' },
      { act: 'switch', name: '切换项目', icon: 'folder', bg: '#fff2d6', color: '#a56a1d' },
      { act: 'about', name: '关于我们', icon: 'info', bg: '#eef4f2', color: '#52706c' },
      { act: 'reset', name: '重置演示数据', icon: 'refresh', bg: '#ffe4e4', color: '#c94545' }
    ];
    return '<div class="m-profile-hero"><div class="avatar">' + esc(c ? c.name.charAt(0) : '业') + '</div>' +
      '<div><div class="nm">' + esc(c ? c.name : '业主') + '</div><div class="sub">' + (p ? esc(p.name) + ' · ' + p.area + '㎡' : '暂无项目') + '</div></div></div>' +
      '<div class="m-profile-card">' + menus.map(function (m) {
        return '<button class="m-menu-item" data-menu="' + m.act + '"><span class="ic" style="background:' + m.bg + ';color:' + m.color + '">' + Icon[m.icon] + '</span>' +
          '<span class="t">' + m.name + '</span><span class="arrow">' + Icon.chevron + '</span></button>';
      }).join('') + '</div>' +
      '<div style="text-align:center;padding:24px 0;color:#9bb2ae;font-size:11px">' + esc(S.get('settings').companyName) + ' · v' + S.get('settings').version +
      '<br>纯前端演示版 · 数据保存在本机</div>';
  }
  function switchSheet() {
    sheet('切换项目', S.get('projects').map(function (p) {
      return '<button class="m-menu-item" data-pick="' + p.id + '"><span class="ic" style="background:#d8f5ee;color:#0b7c71">' + Icon.folder + '</span>' +
        '<span class="t">' + esc(p.name) + '<span class="tiny muted" style="display:block;font-weight:400">' + esc(customerOf(p) ? customerOf(p).name : '') + ' · ' + esc(p.status) + '</span></span>' +
        (project() && project().id === p.id ? '<span class="badge success">当前</span>' : '') + '</button>';
    }).join(''));
    $$('[data-pick]').forEach(function (b) {
      b.onclick = function () { S.set('currentProject', b.dataset.pick); $('#sheetRoot').innerHTML = ''; toast('已切换项目'); render(); };
    });
  }

  /* ---------- 事件 ---------- */
  function bind() {
    $$('[data-go]').forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
    $$('[data-pick]').forEach(function (b) { b.onclick = function () { S.set('currentProject', b.dataset.pick); toast('已切换项目'); render(); }; });
    $$('[data-notice]').forEach(function (b) { b.onclick = function () {
      var n = S.find('notices', b.dataset.notice);
      sheet(n.title, '<div style="font-size:13px;line-height:1.9;color:#52706c">' + esc(n.content) + '</div><div class="tiny muted" style="margin-top:14px">' + esc(n.date) + '</div>',
        '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
      $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
    }; });

    if (state.tab === 'plans') {
      $$('[data-pfilter]').forEach(function (b) { b.onclick = function () { state.planFilter = b.dataset.pfilter; render(); }; });
      $$('[data-plan]').forEach(function (b) { b.onclick = function () { planDetail(b.dataset.plan); }; });
      $$('[data-confirm]').forEach(function (b) { b.onclick = function () {
        S.update('plans', b.dataset.confirm, { status: '已确认', feedback: '方案已确认，同意按此方案执行。' }); toast('方案已确认'); render();
      }; });
      $$('[data-feedback]').forEach(function (b) { b.onclick = function () {
        sheet('填写方案反馈', '<div class="field"><label>反馈内容</label><textarea class="textarea" id="fbText" placeholder="请填写您对方案的意见"></textarea></div>',
          '<button class="btn btn-primary btn-block" id="fbOk" style="margin-top:16px">提交反馈</button>');
        $('#fbOk').onclick = function () {
          var v = $('#fbText').value.trim(); if (!v) { toast('请填写反馈内容', 'err'); return; }
          S.update('plans', b.dataset.feedback, { status: '需修改', feedback: v });
          $('#sheetRoot').innerHTML = ''; toast('反馈已提交'); render();
        };
      }; });
    }

    if (state.tab === 'chat') {
      $('#chatSend').onclick = function () { sendMsg(); };
      $('#chatInput').onkeydown = function (e) { if (e.key === 'Enter') sendMsg(); };
      $$('[data-quick]').forEach(function (b) { b.onclick = function () { sendMsg(b.dataset.quick); }; });
      var area = $('.m-chat-area'); if (area) area.scrollTop = area.scrollHeight;
    }

    if (state.tab === 'me') {
      $$('[data-menu]').forEach(function (b) { b.onclick = function () {
        var act = b.dataset.menu;
        if (act === 'my-progress') go('progress');
        else if (act === 'my-plans') go('plans');
        else if (act === 'my-chat') go('chat');
        else if (act === 'switch') switchSheet();
        else if (act === 'about') {
          var s = S.get('settings');
          sheet('关于我们', '<div style="font-size:13px;line-height:2;color:#52706c"><b style="color:#0b7c71;font-size:15px">' + esc(s.companyName) + '</b><br>' +
            '<div>' + Icon.pin + ' 地址：' + esc(s.address) + '</div><div>' + Icon.phone + ' 电话：' + esc(s.phone) + '</div>' +
            '<div>' + Icon.clock + ' 时间：' + esc(s.hours) + '</div></div>',
            '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
          $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
        } else if (act === 'reset') {
          sheet('重置数据', '<div style="font-size:13px;color:#52706c">确定重置全部演示数据吗？此操作不可恢复。</div>',
            '<div class="row" style="margin-top:18px"><button class="btn grow" id="noReset">再想想</button><button class="btn btn-danger grow" id="yesReset">确认重置</button></div>');
          $('#noReset').onclick = function () { $('#sheetRoot').innerHTML = ''; };
          $('#yesReset').onclick = function () { S.reset(); S.set('currentProject', 'J001'); $('#sheetRoot').innerHTML = ''; toast('数据已重置'); render(); };
        }
      }; });
    }
  }

  function init() {
    $('#miniTabs').innerHTML = TABS.map(function (t) {
      return '<button class="mini-tab' + (t.id === state.tab ? ' active' : '') + '" data-tab="' + t.id + '">' + Icon[t.icon] + '<span>' + t.name + '</span></button>';
    }).join('');
    $$('.mini-tab').forEach(function (b) { b.onclick = function () { go(b.dataset.tab); }; });
    $('#noticeBtn').innerHTML = Icon.bell;
    $('#helpBtn').innerHTML = Icon.info;
    $('#noticeBtn').onclick = function () {
      sheet('公司公告', S.get('notices').map(function (n) {
        return '<div style="padding:10px 0;border-bottom:1px solid #eef4f2"><div style="font-size:13px;font-weight:800">' + esc(n.title) + '</div><div class="tiny muted">' + esc(n.date) + '</div></div>';
      }).join(''), '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
      $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
    };
    $('#helpBtn').onclick = function () {
      sheet('使用说明', '<div style="font-size:13px;line-height:2;color:#52706c">1. 在「进度」页查看施工日志与现场记录。<br>2. 在「方案」页确认方案或填写反馈意见。<br>3. 在「沟通」页联系设计师与项目经理。<br>4. 在「我的」页切换项目与查看公司信息。<br>5. 数据保存在本机浏览器，与 PC 管理端共享。</div>',
        '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
      $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
    };
    function tick() { var d = new Date(); $('#clockTime').textContent = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
    tick(); setInterval(tick, 30000);
    render();
  }
  init();
})();

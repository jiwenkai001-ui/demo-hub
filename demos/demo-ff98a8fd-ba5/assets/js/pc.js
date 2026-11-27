/* ============================================================
 * 装修公司管理系统 - PC 管理端逻辑
 * ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = Store.escape, S = Store;

  var NAV = [
    { id: 'dashboard', name: '工作台', icon: 'grid', sub: '经营数据概览' },
    { group: '客户与项目' },
    { id: 'customers', name: '客户管理', icon: 'users', sub: '客户档案与跟进' },
    { id: 'projects', name: '项目管理', icon: 'folder', sub: '装修项目全流程管理' },
    { id: 'progress', name: '施工进度', icon: 'hammer', sub: '节点进度与现场记录' },
    { id: 'plans', name: '方案管理', icon: 'blueprint', sub: '设计方案与确认沟通' },
    { id: 'messages', name: '沟通消息', icon: 'message', sub: '客户消息与回复' },
    { group: '经营管理' },
    { id: 'quotes', name: '报价款项', icon: 'wallet', sub: '报价单与收款节点' },
    { id: 'materials', name: '材料管理', icon: 'box', sub: '材料采购与到场跟踪' },
    { id: 'staff', name: '团队管理', icon: 'team', sub: '设计师与施工人员' },
    { id: 'reports', name: '报表统计', icon: 'chart', sub: '经营数据统计分析' },
    { group: '系统' },
    { id: 'settings', name: '系统设置', icon: 'settings', sub: '公司信息与数据维护' }
  ];
  var state = { page: 'dashboard', custQ: '', projQ: '', planQ: '', msgProject: 'J001', projFilter: '', planFilter: '', matFilter: '' };

  /* ---------- 通用 ---------- */
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || 'ok'); el.textContent = msg;
    $('#toastBox').appendChild(el); setTimeout(function () { el.remove(); }, 2200);
  }
  function openModal(opt) {
    var root = $('#modalRoot');
    root.innerHTML = '<div class="modal-mask" id="curMask"><div class="modal" style="max-width:' + (opt.width || 560) + 'px">' +
      '<div class="modal-head"><h3>' + esc(opt.title) + '</h3><button class="modal-close" data-close>&times;</button></div>' +
      '<div class="modal-body">' + opt.body + '</div>' +
      (opt.noFoot ? '' : '<div class="modal-foot"><button class="btn" data-close>' + (opt.cancelText || '取消') + '</button>' +
        '<button class="btn btn-primary" data-ok>' + (opt.okText || '保存') + '</button></div>') + '</div></div>';
    function close() { root.innerHTML = ''; }
    $$('[data-close]', root).forEach(function (b) { b.onclick = close; });
    $('#curMask').onclick = function (e) { if (e.target.id === 'curMask') close(); };
    var ok = $('[data-ok]', root);
    if (ok) ok.onclick = function () { if (opt.onOk && opt.onOk(root) === false) return; close(); };
    if (opt.onOpen) opt.onOpen(root);
    return { close: close, root: root };
  }
  function confirmBox(msg, cb) {
    openModal({ title: '操作确认', width: 420, okText: '确认',
      body: '<div class="row" style="align-items:flex-start;gap:14px"><div style="width:40px;height:40px;border-radius:50%;background:#fff2d6;color:#a56a1d;display:flex;align-items:center;justify-content:center;flex:none">' + Icon.info + '</div><div style="padding-top:6px">' + esc(msg) + '</div></div>',
      onOk: function () { cb(); } });
  }
  function badge(s) {
    var map = { '施工中': 'warning', '设计中': 'orange', '待开工': 'info', '已完工': 'success', '已暂停': 'gray',
      '待确认': 'warning', '已确认': 'success', '需修改': 'danger', '待支付': 'warning', '已支付': 'success',
      '待采购': 'warning', '已到场': 'success', 'A类意向': 'danger', 'B类意向': 'warning', 'C类跟进': 'gray' };
    return '<span class="badge ' + (map[s] || 'gray') + '"><i class="dot"></i>' + esc(s) + '</span>';
  }
  function customerName(id) { var c = S.find('customers', id); return c ? c.name : '-'; }
  function projectName(id) { var p = S.find('projects', id); return p ? p.name : '-'; }
  function staffName(id) { var p = S.find('staff', id); return p ? p.name : '-'; }
  function money(n) { return S.money(n); }
  function phaseFlow(phase) {
    var idx = S.phases.indexOf(phase);
    return '<div class="phase-flow">' + S.phases.map(function (p, i) {
      return (i ? '<span class="phase-arrow">›</span>' : '') + '<span class="phase-step ' + (i < idx ? 'done' : i === idx ? 'current' : '') + '">' + p + '</span>';
    }).join('') + '</div>';
  }
  function barChart(data, unit) {
    var max = Math.max.apply(null, data.map(function (x) { return x.value; }).concat([1]));
    return '<div class="bar-chart">' + data.map(function (x) {
      var h = Math.round(x.value / max * 100);
      return '<div class="bar-item"><div class="bar-value">' + x.value + (unit || '') + '</div><div class="bar-track"><div class="bar-fill" style="height:' + h + '%"></div></div><div class="bar-label">' + esc(x.label) + '</div></div>';
    }).join('') + '</div>';
  }
  function statCard(label, value, icon, color, bg, trend) {
    return '<div class="stat-card"><div><div class="label">' + label + '</div><div class="value">' + value + '</div>' +
      (trend ? '<div class="trend">' + esc(trend) + '</div>' : '') + '</div><div class="stat-icon" style="color:' + color + ';background:' + bg + '">' + Icon[icon] + '</div></div>';
  }
  function pageHead(title, desc, action) {
    return '<div class="page-head"><div><h2>' + esc(title) + '</h2><p>' + esc(desc) + '</p></div>' + (action || '') + '</div>';
  }
  function photoClass(str) { return 'photo-' + ((str || '').length % 6 + 1); }

  /* ---------- 导航 ---------- */
  function renderNav() {
    $('#sideNav').innerHTML = NAV.map(function (n) {
      if (n.group) return '<div class="side-group-title">' + n.group + '</div>';
      return '<button class="side-item' + (n.id === state.page ? ' active' : '') + '" data-nav="' + n.id + '">' + Icon[n.icon] + '<span>' + n.name + '</span></button>';
    }).join('');
    $$('[data-nav]').forEach(function (b) { b.onclick = function () { go(b.dataset.nav); }; });
    var cur = NAV.filter(function (n) { return n.id === state.page; })[0];
    $('#crumbTitle').textContent = cur ? cur.name : '工作台';
    $('#crumbSub').textContent = cur ? cur.sub : '';
  }
  function go(id) { state.page = id; renderNav(); renderPage(); $('#pageArea').scrollTop = 0; }
  function renderPage() {
    var f = { dashboard: viewDashboard, customers: viewCustomers, projects: viewProjects, progress: viewProgress,
      plans: viewPlans, messages: viewMessages, quotes: viewQuotes, materials: viewMaterials, staff: viewStaff,
      reports: viewReports, settings: viewSettings }[state.page];
    $('#pageArea').innerHTML = f ? f() : '';
    bindPage();
  }

  /* ---------- 工作台 ---------- */
  function viewDashboard() {
    var projects = S.get('projects'), building = projects.filter(function (p) { return p.status === '施工中'; });
    var waitPlans = S.get('plans').filter(function (p) { return p.status === '待确认' || p.status === '需修改'; });
    var unread = S.get('messages').filter(function (m) { return !m.read && m.from === '客户'; });
    var month = S.today().slice(0, 7);
    var income = S.get('payments').filter(function (p) { return p.status === '已支付' && p.date.slice(0, 7) === month; })
      .reduce(function (s, p) { return s + p.amount; }, 0);
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var dt = new Date(); dt.setMonth(dt.getMonth() - i);
      var key = dt.getFullYear() + '-' + (dt.getMonth() + 1 < 10 ? '0' : '') + (dt.getMonth() + 1);
      months.push({ label: (dt.getMonth() + 1) + '月', value: S.get('payments').filter(function (p) { return p.status === '已支付' && p.date.slice(0, 7) === key; }).reduce(function (s, p) { return s + p.amount / 10000; }, 0) });
    }
    return pageHead('工作台', '欢迎回来，今天是 ' + S.today() + '，祝您工作愉快。',
      '<button class="btn btn-primary" data-act="new-project">' + Icon.plus + ' 新建项目</button>') +
      '<div class="stat-grid">' +
        statCard('在建项目', building.length, 'hammer', '#0e9f8e', '#d8f5ee', '施工中项目数量') +
        statCard('待确认方案', waitPlans.length, 'blueprint', '#8b6ad6', '#efe9fb', '需要客户确认或修订') +
        statCard('未读客户消息', unread.length, 'message', '#3b82c4', '#e3f1fb', '请及时回复客户') +
        statCard('本月收款', money(income), 'wallet', '#059669', '#d1fae5', '单位：元') +
      '</div>' +
      '<div class="dash-grid">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>近 6 个月收款趋势</div><span class="tiny muted">单位：万元</span></div><div class="panel-body">' + barChart(months) + '</div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>项目进度概览</div></div><div class="panel-body">' +
          (building.slice(0, 5).map(function (p) {
            return '<div style="margin-bottom:14px"><div class="spread" style="font-size:12px;margin-bottom:5px"><span class="ellipsis">' + esc(p.name) + '</span><b class="strong">' + p.progress + '%</b></div>' +
              '<div class="progress-line"><i style="width:' + p.progress + '%"></i></div></div>';
          }).join('') || '<div class="empty">暂无在建项目</div>') +
        '</div></div></div>' +
      '<div class="dash-grid-2">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>近期项目</div><button class="link-btn" data-nav-mini="projects">查看全部 →</button></div>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>项目</th><th>客户</th><th>状态</th><th>阶段</th><th>进度</th></tr></thead><tbody>' +
          projects.slice(0, 6).map(function (p) {
            return '<tr><td class="strong">' + esc(p.name) + '</td><td>' + esc(customerName(p.customerId)) + '</td><td>' + badge(p.status) + '</td>' +
              '<td class="tiny">' + esc(p.phase) + '</td><td><div class="progress-line" style="min-width:70px"><i style="width:' + p.progress + '%"></i></div></td></tr>';
          }).join('') + '</tbody></table></div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>待办事项 / 公告</div></div><div class="panel-body">' +
          '<div class="tiny muted" style="font-weight:700;margin-bottom:8px">待确认方案</div>' +
          (waitPlans.length ? waitPlans.slice(0, 3).map(function (f) {
            return '<div class="spread" style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:12px"><span class="ellipsis">' + esc(f.name) + ' · ' + esc(projectName(f.projectId)) + '</span>' + badge(f.status) + '</div>';
          }).join('') : '<div class="tiny muted">暂无待办</div>') +
          '<div class="section-title" style="margin:16px 0 8px">最新公告</div>' +
          S.get('notices').slice(0, 2).map(function (n) {
            return '<div style="padding:8px 10px;background:#f4faf8;border-radius:8px;margin-bottom:7px"><div class="strong" style="font-size:12px">' + esc(n.title) + '</div><div class="tiny muted">' + esc(n.date) + '</div></div>';
          }).join('') +
        '</div></div></div>';
  }

  /* ---------- 客户管理 ---------- */
  function viewCustomers() {
    var q = state.custQ.trim().toLowerCase();
    var list = S.get('customers').filter(function (c) {
      return !q || c.name.toLowerCase().indexOf(q) >= 0 || String(c.phone).indexOf(q) >= 0 || c.community.toLowerCase().indexOf(q) >= 0;
    });
    return pageHead('客户管理', '客户档案、意向等级与装修需求。',
      '<button class="btn btn-primary" data-act="new-customer">' + Icon.plus + ' 新建客户</button>') +
      '<div class="panel"><div class="filter-bar"><div class="search-box">' + Icon.search +
        '<input class="input" id="custSearch" placeholder="搜索客户 / 电话 / 小区" value="' + esc(state.custQ) + '"></div>' +
        '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 位客户</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>编号</th><th>客户</th><th>联系电话</th><th>小区 / 面积</th><th>预算</th><th>意向</th><th>来源</th><th>操作</th></tr></thead><tbody>' +
        (list.length ? list.map(function (c) {
          return '<tr><td class="tiny muted">' + esc(c.id) + '</td><td class="strong">' + esc(c.name) + '</td><td>' + esc(c.phone) + '</td>' +
            '<td>' + esc(c.community) + ' · ' + c.area + '㎡</td><td class="strong">' + money(c.budget) + '</td><td>' + badge(c.level) + '</td>' +
            '<td class="tiny muted">' + esc(c.source) + '</td><td><div class="table-actions">' +
            '<button class="link-btn" data-act="view-customer" data-id="' + c.id + '">详情</button>' +
            '<button class="link-btn" data-act="edit-customer" data-id="' + c.id + '">编辑</button>' +
            '<button class="link-btn red" data-act="del-customer" data-id="' + c.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="8"><div class="empty"><div class="big">👥</div>暂无客户</div></td></tr>') +
        '</tbody></table></div></div>';
  }
  function customerForm(c) {
    c = c || {};
    return '<div class="form-grid">' +
      '<div class="field"><label>客户姓名 *</label><input class="input" id="cName" value="' + esc(c.name || '') + '"></div>' +
      '<div class="field"><label>联系电话 *</label><input class="input" id="cPhone" value="' + esc(c.phone || '') + '"></div>' +
      '<div class="field"><label>小区名称</label><input class="input" id="cCommunity" value="' + esc(c.community || '') + '"></div>' +
      '<div class="field"><label>房屋面积（㎡）</label><input class="input" type="number" id="cArea" value="' + (c.area || 0) + '"></div>' +
      '<div class="field"><label>装修预算（元）</label><input class="input" type="number" id="cBudget" value="' + (c.budget || 0) + '"></div>' +
      '<div class="field"><label>意向等级</label><select class="select" id="cLevel">' + ['A类意向', 'B类意向', 'C类跟进'].map(function (x) { return '<option' + (c.level === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>客户来源</label><select class="select" id="cSource">' + ['老客户推荐', '线上咨询', '小区推广', '门店到访', '其他'].map(function (x) { return '<option' + (c.source === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>建档日期</label><input class="input" type="date" id="cDate" value="' + esc(c.date || S.today()) + '"></div>' +
      '<div class="field full"><label>联系地址</label><input class="input" id="cAddress" value="' + esc(c.address || '') + '"></div>' +
      '<div class="field full"><label>需求备注</label><textarea class="textarea" id="cNote">' + esc(c.note || '') + '</textarea></div></div>';
  }
  function readCustomerForm(r) {
    var g = function (id) { return $(id, r).value.trim(); };
    return { name: g('#cName'), phone: g('#cPhone'), community: g('#cCommunity'), area: Number(g('#cArea')) || 0,
      budget: Number(g('#cBudget')) || 0, level: g('#cLevel'), source: g('#cSource'), date: g('#cDate') || S.today(),
      address: g('#cAddress'), note: g('#cNote') };
  }
  function viewCustomerDetail(id) {
    var c = S.find('customers', id); if (!c) return;
    var projects = S.listBy('projects', 'customerId', id);
    var body = '<div class="detail-grid">' +
      [['编号', c.id], ['姓名', c.name], ['电话', c.phone], ['意向等级', c.level], ['小区', c.community], ['面积', c.area + ' ㎡'],
        ['预算', money(c.budget)], ['来源', c.source], ['建档日期', c.date], ['地址', c.address || '-']]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="section-title">需求备注</div><div class="m-diag" style="font-size:13px">' + esc(c.note || '暂无备注') + '</div>' +
      '<div class="section-title">关联项目（' + projects.length + '）</div>' +
      (projects.length ? projects.map(function (p) {
        return '<div class="spread" style="padding:10px 0;border-bottom:1px dashed var(--border)"><span class="strong">' + esc(p.name) + '</span><span>' + badge(p.status) + '</span></div>';
      }).join('') : '<div class="tiny muted">暂无关联项目</div>');
    openModal({ title: '客户详情 · ' + c.name, width: 620, body: body, okText: '关闭', onOk: function () {} });
  }

  /* ---------- 项目管理 ---------- */
  function viewProjects() {
    var q = state.projQ.trim().toLowerCase();
    var list = S.get('projects').filter(function (p) {
      return (!state.projFilter || p.status === state.projFilter) &&
        (!q || p.name.toLowerCase().indexOf(q) >= 0 || customerName(p.customerId).toLowerCase().indexOf(q) >= 0);
    });
    return pageHead('项目管理', '装修项目全流程跟踪，从设计到竣工交付。',
      '<button class="btn btn-primary" data-act="new-project">' + Icon.plus + ' 新建项目</button>') +
      '<div class="panel"><div class="filter-bar">' +
        '<div class="search-box">' + Icon.search + '<input class="input" id="projSearch" placeholder="搜索项目 / 客户" value="' + esc(state.projQ) + '"></div>' +
        ['', '设计中', '待开工', '施工中', '已完工'].map(function (s) {
          return '<button class="btn btn-sm' + (state.projFilter === s ? ' btn-primary' : '') + '" data-pfilter="' + s + '">' + (s || '全部') + '</button>';
        }).join('') + '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 个项目</span></div></div>' +
      '<div style="margin-top:16px" class="project-grid">' +
      (list.length ? list.map(function (p) {
        var pay = S.listBy('payments', 'projectId', p.id).filter(function (x) { return x.status === '已支付'; }).reduce(function (s, x) { return s + x.amount; }, 0);
        return '<div class="project-card"><div class="pc-head"><div><div class="pc-title">' + esc(p.name) + '</div>' +
          '<div class="pc-sub">' + esc(p.style) + ' · ' + p.area + '㎡ · 预算 ' + money(p.budget) + '</div></div>' + badge(p.status) + '</div>' +
          phaseFlow(p.phase) +
          '<div class="pc-meta"><span>' + Icon.user + ' ' + esc(customerName(p.customerId)) + '</span><span>' + Icon.calendar + ' ' + esc(p.endDate) + ' 交付</span></div>' +
          '<div class="spread tiny muted" style="margin-bottom:5px"><span>项目进度</span><b style="color:var(--primary)">' + p.progress + '%</b></div>' +
          '<div class="progress-line"><i style="width:' + p.progress + '%"></i></div>' +
          '<div class="pc-actions"><button class="btn btn-sm" data-act="view-project" data-id="' + p.id + '">详情</button>' +
          '<button class="btn btn-sm" data-act="edit-project" data-id="' + p.id + '">编辑</button>' +
          '<button class="btn btn-sm" data-act="add-progress" data-id="' + p.id + '">更新进度</button>' +
          '<button class="btn btn-sm btn-danger" data-act="del-project" data-id="' + p.id + '">删除</button></div></div>';
      }).join('') : '<div class="empty" style="grid-column:1/-1"><div class="big">📁</div>暂无项目</div>') + '</div>';
  }
  function projectForm(p) {
    p = p || {};
    return '<div class="form-grid">' +
      '<div class="field full"><label>项目名称 *</label><input class="input" id="jName" value="' + esc(p.name || '') + '"></div>' +
      '<div class="field"><label>客户 *</label><select class="select" id="jCustomer">' + S.get('customers').map(function (c) {
        return '<option value="' + c.id + '"' + (p.customerId === c.id ? ' selected' : '') + '>' + esc(c.name) + ' · ' + esc(c.community) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>设计风格</label><select class="select" id="jStyle">' + ['现代简约', '新中式', '北欧风', '奶油风', '现代轻奢', '美式复古'].map(function (x) { return '<option' + (p.style === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>面积（㎡）</label><input class="input" type="number" id="jArea" value="' + (p.area || 0) + '"></div>' +
      '<div class="field"><label>预算（元）</label><input class="input" type="number" id="jBudget" value="' + (p.budget || 0) + '"></div>' +
      '<div class="field"><label>状态</label><select class="select" id="jStatus">' + ['设计中', '待开工', '施工中', '已完工', '已暂停'].map(function (x) { return '<option' + (p.status === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>当前阶段</label><select class="select" id="jPhase">' + ['待开工', '方案设计'].concat(S.phases).map(function (x) { return '<option' + (p.phase === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>进度（%）</label><input class="input" type="number" id="jProgress" min="0" max="100" value="' + (p.progress || 0) + '"></div>' +
      '<div class="field"><label>设计师</label><select class="select" id="jDesigner">' + S.get('staff').filter(function (s) { return s.role === '设计师'; }).map(function (s) { return '<option value="' + s.id + '"' + (p.designerId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>项目经理</label><select class="select" id="jManager">' + S.get('staff').filter(function (s) { return s.role === '项目经理'; }).map(function (s) { return '<option value="' + s.id + '"' + (p.managerId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>开工日期</label><input class="input" type="date" id="jStart" value="' + esc(p.startDate || S.today()) + '"></div>' +
      '<div class="field"><label>预计交付</label><input class="input" type="date" id="jEnd" value="' + esc(p.endDate || S.today()) + '"></div>' +
      '<div class="field full"><label>项目地址</label><input class="input" id="jAddress" value="' + esc(p.address || '') + '"></div>' +
      '<div class="field full"><label>备注</label><textarea class="textarea" id="jNote">' + esc(p.note || '') + '</textarea></div></div>';
  }
  function readProjectForm(r) {
    var g = function (id) { return $(id, r).value.trim(); };
    return { name: g('#jName'), customerId: $('#jCustomer', r).value, style: g('#jStyle'), area: Number(g('#jArea')) || 0,
      budget: Number(g('#jBudget')) || 0, status: g('#jStatus'), phase: g('#jPhase'), progress: Number(g('#jProgress')) || 0,
      designerId: $('#jDesigner', r).value, managerId: $('#jManager', r).value, startDate: g('#jStart'), endDate: g('#jEnd'),
      address: g('#jAddress'), note: g('#jNote') };
  }
  function viewProjectDetail(id) {
    var p = S.find('projects', id); if (!p) return;
    var ups = S.listBy('progress', 'projectId', id).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var plans = S.listBy('plans', 'projectId', id);
    var pays = S.listBy('payments', 'projectId', id);
    var paid = pays.filter(function (x) { return x.status === '已支付'; }).reduce(function (s, x) { return s + x.amount; }, 0);
    var body = '<div class="detail-grid">' +
      [['项目编号', p.id], ['客户', customerName(p.customerId)], ['风格', p.style], ['面积', p.area + ' ㎡'],
        ['预算', money(p.budget)], ['已收款', money(paid)], ['设计师', staffName(p.designerId)], ['项目经理', staffName(p.managerId)],
        ['开工日期', p.startDate], ['预计交付', p.endDate], ['当前阶段', p.phase], ['施工进度', p.progress + '%']]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="section-title">施工阶段</div>' + phaseFlow(p.phase) +
      '<div class="section-title">进度记录（' + ups.length + '）</div>' + (ups.length ?
        '<div class="timeline">' + ups.map(function (u) {
          return '<div class="tl-item done"><span class="tl-dot"></span><div class="tl-head"><span class="tl-title">' + esc(u.phase) + '</span><span class="tiny muted">' + esc(u.date) + ' · ' + esc(u.author) + '</span></div>' +
            '<div class="tl-content">' + esc(u.content) + '</div></div>';
        }).join('') + '</div>' : '<div class="tiny muted">暂无进度记录</div>') +
      '<div class="section-title">方案（' + plans.length + '）</div>' + (plans.length ? plans.map(function (f) {
        return '<div class="spread" style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:12px"><span>' + esc(f.name) + ' · ' + esc(f.version) + '</span>' + badge(f.status) + '</div>';
      }).join('') : '<div class="tiny muted">暂无方案</div>');
    openModal({ title: '项目详情 · ' + p.name, width: 660, body: body, okText: '关闭', onOk: function () {} });
  }

  /* ---------- 施工进度 ---------- */
  function viewProgress() {
    var projects = S.get('projects');
    var ups = S.get('progress').slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    return pageHead('施工进度', '各项目施工节点记录与现场照片。',
      '<button class="btn btn-primary" data-act="add-progress">' + Icon.plus + ' 记录进度</button>') +
      '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>项目进度总览</div></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>项目</th><th>客户</th><th>当前阶段</th><th>进度</th><th>最近更新</th><th>操作</th></tr></thead><tbody>' +
        projects.map(function (p) {
          var last = ups.filter(function (u) { return u.projectId === p.id; })[0];
          return '<tr><td class="strong">' + esc(p.name) + '</td><td>' + esc(customerName(p.customerId)) + '</td><td>' + esc(p.phase) + '</td>' +
            '<td style="min-width:110px"><div class="row"><div class="progress-line grow"><i style="width:' + p.progress + '%"></i></div><b class="tiny">' + p.progress + '%</b></div></td>' +
            '<td class="tiny muted">' + (last ? esc(last.date) : '-') + '</td><td><button class="link-btn" data-act="add-progress" data-id="' + p.id + '">+ 记录</button></td></tr>';
        }).join('') + '</tbody></table></div></div>' +
      '<div class="panel" style="margin-top:18px"><div class="panel-head"><div class="panel-title"><i class="bar"></i>最新施工记录</div></div>' +
        '<div class="panel-body"><div class="timeline">' + (ups.length ? ups.slice(0, 8).map(function (u) {
          return '<div class="tl-item done"><span class="tl-dot"></span><div class="tl-head"><span class="tl-title">' + esc(u.phase) + ' · ' + esc(projectName(u.projectId)) + '</span>' +
            '<span class="tiny muted">' + esc(u.date) + ' · ' + esc(u.author) + '</span></div><div class="tl-content">' + esc(u.content) + '</div></div>';
        }).join('') : '<div class="empty">暂无施工记录</div>') + '</div></div></div>';
  }
  function progressForm(projectId) {
    return '<div class="form-grid">' +
      '<div class="field full"><label>项目 *</label><select class="select" id="uProject">' + S.get('projects').map(function (p) {
        return '<option value="' + p.id + '"' + (p.id === projectId ? ' selected' : '') + '>' + esc(p.name) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>施工阶段</label><select class="select" id="uPhase">' + S.phases.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>更新至进度（%）</label><input class="input" type="number" id="uProgress" min="0" max="100" value="50"></div>' +
      '<div class="field"><label>现场照片类型</label><select class="select" id="uPhoto">' + ['拆改现场', '水电布线', '水路验收', '瓷砖铺贴', '墙面施工', '木工吊顶', '竣工实景', '材料进场'].map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>记录人</label><input class="input" id="uAuthor" value="王海涛"></div>' +
      '<div class="field full"><label>施工说明 *</label><textarea class="textarea" id="uContent" placeholder="描述本阶段施工情况与验收结果"></textarea></div></div>';
  }

  /* ---------- 方案管理 ---------- */
  function viewPlans() {
    var q = state.planQ.trim().toLowerCase();
    var list = S.get('plans').filter(function (f) {
      return (!state.planFilter || f.status === state.planFilter) &&
        (!q || f.name.toLowerCase().indexOf(q) >= 0 || projectName(f.projectId).toLowerCase().indexOf(q) >= 0);
    });
    return pageHead('方案管理', '设计方案、效果图与施工图版本管理。',
      '<button class="btn btn-primary" data-act="new-plan">' + Icon.plus + ' 上传方案</button>') +
      '<div class="panel"><div class="filter-bar"><div class="search-box">' + Icon.search +
        '<input class="input" id="planSearch" placeholder="搜索方案 / 项目" value="' + esc(state.planQ) + '"></div>' +
        ['', '待确认', '已确认', '需修改'].map(function (s) {
          return '<button class="btn btn-sm' + (state.planFilter === s ? ' btn-primary' : '') + '" data-pf="' + s + '">' + (s || '全部') + '</button>';
        }).join('') + '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 套方案</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>方案名称</th><th>所属项目</th><th>类型</th><th>版本</th><th>上传日期</th><th>设计师</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        (list.length ? list.map(function (f) {
          return '<tr><td class="strong">' + esc(f.name) + '</td><td class="tiny">' + esc(projectName(f.projectId)) + '</td>' +
            '<td><span class="badge gray">' + esc(f.type) + '</span></td><td>' + esc(f.version) + '</td><td class="tiny">' + esc(f.date) + '</td>' +
            '<td>' + esc(staffName(f.designerId)) + '</td><td>' + badge(f.status) + '</td><td><div class="table-actions">' +
            '<button class="link-btn" data-act="view-plan" data-id="' + f.id + '">详情</button>' +
            (f.status !== '已确认' ? '<button class="link-btn" data-act="confirm-plan" data-id="' + f.id + '">确认</button>' : '') +
            '<button class="link-btn" data-act="edit-plan" data-id="' + f.id + '">编辑</button>' +
            '<button class="link-btn red" data-act="del-plan" data-id="' + f.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="8"><div class="empty"><div class="big">📐</div>暂无方案</div></td></tr>') +
        '</tbody></table></div></div>';
  }
  function planForm(f) {
    f = f || {};
    return '<div class="form-grid">' +
      '<div class="field full"><label>方案名称 *</label><input class="input" id="fName" value="' + esc(f.name || '') + '"></div>' +
      '<div class="field"><label>所属项目 *</label><select class="select" id="fProject">' + S.get('projects').map(function (p) {
        return '<option value="' + p.id + '"' + (f.projectId === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>方案类型</label><select class="select" id="fType">' + ['平面方案', '效果图', '施工图', '概念方案', '预算方案'].map(function (x) { return '<option' + (f.type === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>版本号</label><input class="input" id="fVersion" value="' + esc(f.version || 'V1.0') + '"></div>' +
      '<div class="field"><label>上传日期</label><input class="input" type="date" id="fDate" value="' + esc(f.date || S.today()) + '"></div>' +
      '<div class="field"><label>设计师</label><select class="select" id="fDesigner">' + S.get('staff').filter(function (s) { return s.role === '设计师'; }).map(function (s) { return '<option value="' + s.id + '"' + (f.designerId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>确认状态</label><select class="select" id="fStatus">' + ['待确认', '已确认', '需修改'].map(function (x) { return '<option' + (f.status === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field full"><label>方案说明</label><textarea class="textarea" id="fDesc">' + esc(f.description || '') + '</textarea></div>' +
      '<div class="field full"><label>客户反馈</label><textarea class="textarea" id="fFeedback">' + esc(f.feedback || '') + '</textarea></div></div>';
  }
  function readPlanForm(r) {
    var g = function (id) { return $(id, r).value.trim(); };
    return { name: g('#fName'), projectId: $('#fProject', r).value, type: g('#fType'), version: g('#fVersion'), date: g('#fDate'),
      designerId: $('#fDesigner', r).value, status: g('#fStatus'), description: g('#fDesc'), feedback: g('#fFeedback') };
  }
  function viewPlanDetail(f) {
    var vis = ['vis-1', 'vis-2', 'vis-3', 'vis-4'][f.type.length % 4];
    var body = '<div class="m-plan-visual ' + vis + '" style="margin-top:0">' + Icon.blueprint + ' ' + esc(f.type) + ' · ' + esc(f.version) + '</div>' +
      '<div class="detail-grid">' +
      [['方案名称', f.name], ['所属项目', projectName(f.projectId)], ['类型', f.type], ['版本', f.version],
        ['上传日期', f.date], ['设计师', staffName(f.designerId)], ['状态', f.status]]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="section-title">方案说明</div><div style="font-size:13px;line-height:1.8">' + esc(f.description || '暂无说明') + '</div>' +
      '<div class="section-title">客户反馈</div><div class="m-diag">' + esc(f.feedback || '暂无反馈') + '</div>';
    openModal({ title: '方案详情', width: 600, body: body, okText: '关闭', onOk: function () {} });
  }

  /* ---------- 沟通消息 ---------- */
  function viewMessages() {
    var projects = S.get('projects');
    if (!projects.some(function (p) { return p.id === state.msgProject; })) state.msgProject = projects[0] ? projects[0].id : '';
    var list = S.listBy('messages', 'projectId', state.msgProject).sort(function (a, b) { return a.date.localeCompare(b.date); });
    var unread = S.get('messages').filter(function (m) { return !m.read && m.from === '客户'; }).length;
    return pageHead('沟通消息', '与客户、设计师、项目经理的实时沟通记录。' + (unread ? ' 有 ' + unread + ' 条客户消息待回复。' : '')) +
      '<div class="panel"><div class="filter-bar"><span class="tiny muted" style="font-weight:700">选择项目：</span>' +
        projects.map(function (p) {
          var n = S.listBy('messages', 'projectId', p.id).filter(function (m) { return !m.read && m.from === '客户'; }).length;
          return '<button class="btn btn-sm' + (state.msgProject === p.id ? ' btn-primary' : '') + '" data-msgproj="' + p.id + '">' + esc(p.name) + (n ? ' (' + n + ')' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="panel-body"><div class="chat-list" style="max-height:420px;overflow-y:auto">' +
        (list.length ? list.map(function (m) {
          var mine = m.from !== '客户';
          return '<div class="chat-row' + (mine ? ' mine' : '') + '"><div class="avatar" style="background:' + (mine ? '#0e9f8e' : '#6b8582') + '">' + esc(m.fromName.charAt(0)) + '</div>' +
            '<div class="chat-meta"><div class="chat-name">' + esc(m.fromName) + ' · ' + esc(m.from) + '</div><div class="chat-bubble">' + esc(m.content) + '</div>' +
            '<div class="chat-time">' + esc(m.date) + '</div></div></div>';
        }).join('') : '<div class="empty"><div class="big">💬</div>暂无沟通记录</div>') + '</div>' +
        '<div class="row" style="margin-top:18px;border-top:1px solid var(--border);padding-top:16px">' +
          '<select class="select" id="msgFrom" style="width:130px"><option>设计师</option><option>项目经理</option><option>监理</option></select>' +
          '<input class="input grow" id="msgInput" placeholder="输入回复内容，按 Enter 发送">' +
          '<button class="btn btn-primary" data-act="send-msg">' + Icon.send + ' 发送</button></div>' +
        '</div></div>';
  }

  /* ---------- 报价款项 ---------- */
  function viewQuotes() {
    var quotes = S.get('quotes'), pays = S.get('payments');
    var paid = pays.filter(function (p) { return p.status === '已支付'; }).reduce(function (s, p) { return s + p.amount; }, 0);
    var wait = pays.filter(function (p) { return p.status === '待支付'; });
    return pageHead('报价款项', '项目报价单与收款节点管理。',
      '<button class="btn btn-primary" data-act="new-quote">' + Icon.plus + ' 新建报价单</button>' +
      '<button class="btn" data-act="new-payment" style="margin-left:8px">' + Icon.plus + ' 新增款项</button>') +
      '<div class="stat-grid">' +
        statCard('累计收款', money(paid), 'money', '#0e9f8e', '#d8f5ee', '已支付款项合计') +
        statCard('待收款', money(wait.reduce(function (s, p) { return s + p.amount; }, 0)), 'clock', '#d98324', '#fff2d6', wait.length + ' 笔待支付') +
        statCard('报价单数', quotes.length, 'file', '#3b82c4', '#e3f1fb', '累计报价') +
        statCard('合同总额', money(quotes.filter(function (q) { return q.status === '已确认'; }).reduce(function (s, q) { return s + q.items.reduce(function (a, i) { return a + i.price * i.qty; }, 0); }, 0)), 'receipt', '#059669', '#d1fae5', '已确认报价') +
      '</div>' +
      '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>报价单</div></div><div class="table-wrap">' +
        '<table class="data-table"><thead><tr><th>单号</th><th>项目</th><th>日期</th><th>项目数</th><th>报价金额</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        (quotes.length ? quotes.map(function (q) {
          var total = q.items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
          return '<tr><td class="tiny muted">' + esc(q.id) + '</td><td class="strong">' + esc(projectName(q.projectId)) + '</td>' +
            '<td class="tiny">' + esc(q.date) + '</td><td>' + q.items.length + '</td><td class="strong">' + money(total) + '</td><td>' + badge(q.status) + '</td>' +
            '<td><div class="table-actions"><button class="link-btn" data-act="view-quote" data-id="' + q.id + '">详情</button>' +
            (q.status !== '已确认' ? '<button class="link-btn" data-act="confirm-quote" data-id="' + q.id + '">确认</button>' : '') +
            '<button class="link-btn red" data-act="del-quote" data-id="' + q.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="7"><div class="empty">暂无报价单</div></td></tr>') + '</tbody></table></div></div>' +
      '<div class="panel" style="margin-top:18px"><div class="panel-head"><div class="panel-title"><i class="bar"></i>款项记录</div></div><div class="table-wrap">' +
        '<table class="data-table"><thead><tr><th>单号</th><th>项目</th><th>款项名称</th><th>日期</th><th>金额</th><th>支付方式</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        (pays.length ? pays.map(function (p) {
          return '<tr><td class="tiny muted">' + esc(p.id) + '</td><td class="tiny">' + esc(projectName(p.projectId)) + '</td>' +
            '<td class="strong">' + esc(p.name) + '</td><td class="tiny">' + esc(p.date) + '</td><td class="strong">' + money(p.amount) + '</td>' +
            '<td>' + esc(p.method || '-') + '</td><td>' + badge(p.status) + '</td><td><div class="table-actions">' +
            (p.status === '待支付' ? '<button class="link-btn" data-act="pay-payment" data-id="' + p.id + '">确认收款</button>' : '') +
            '<button class="link-btn red" data-act="del-payment" data-id="' + p.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="8"><div class="empty">暂无款项</div></td></tr>') + '</tbody></table></div></div>';
  }
  function quoteForm() {
    var products = ['设计费', '基础施工', '水电改造', '泥木工程', '油漆工程', '主材代购', '管理费', '其他费用'];
    return '<div class="form-grid">' +
      '<div class="field"><label>项目 *</label><select class="select" id="qProject">' + S.get('projects').map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>报价日期</label><input class="input" type="date" id="qDate" value="' + S.today() + '"></div>' +
      '<div class="field"><label>状态</label><select class="select" id="qStatus"><option>待确认</option><option>已确认</option></select></div>' +
      '<div class="field full"><label>备注</label><input class="input" id="qNote" placeholder="补充说明"></div></div>' +
      '<div class="section-title">报价明细</div><div id="quoteItems">' + quoteRow(products) + '</div>' +
      '<button class="btn btn-sm" id="addQuoteItem" style="margin-top:10px">' + Icon.plus + ' 添加项目</button>' +
      '<div style="margin-top:16px;text-align:right;font-size:15px">合计：<b id="quoteTotal" style="color:#0e9f8e;font-size:22px">¥0</b></div>';
  }
  function quoteRow(products) {
    return '<div class="q-row" style="display:grid;grid-template-columns:1fr 90px 70px 30px;gap:8px;margin-bottom:8px">' +
      '<input class="input q-name" list="qNames" placeholder="费用项目名称"><datalist id="qNames">' + products.map(function (p) { return '<option value="' + p + '">'; }).join('') + '</datalist>' +
      '<input class="input q-price" type="number" value="0" min="0"><input class="input q-qty" type="number" value="1" min="1">' +
      '<button class="btn btn-sm btn-danger q-del">×</button></div>';
  }
  function updateQuoteTotal(r) {
    var t = $$('.q-row', r).reduce(function (s, row) { return s + (Number($('.q-price', row).value) || 0) * (Number($('.q-qty', row).value) || 0); }, 0);
    $('#quoteTotal', r).textContent = money(t);
  }
  function viewQuoteDetail(id) {
    var q = S.find('quotes', id); if (!q) return;
    var total = q.items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var body = '<div class="detail-grid" style="margin-bottom:16px">' +
      [['单号', q.id], ['项目', projectName(q.projectId)], ['日期', q.date], ['状态', q.status], ['备注', q.note || '-'], ['合计', money(total)]]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<table class="data-table"><thead><tr><th>项目</th><th>单价</th><th>数量</th><th>小计</th></tr></thead><tbody>' +
      q.items.map(function (i) { return '<tr><td>' + esc(i.name) + '</td><td>' + money(i.price) + '</td><td>' + i.qty + '</td><td class="strong">' + money(i.price * i.qty) + '</td></tr>'; }).join('') + '</tbody></table>';
    openModal({ title: '报价单详情', width: 600, body: body, okText: '关闭', onOk: function () {} });
  }
  function paymentForm() {
    return '<div class="form-grid">' +
      '<div class="field full"><label>项目 *</label><select class="select" id="pProject">' + S.get('projects').map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>款项名称 *</label><input class="input" id="pName" placeholder="如 首期款（30%）"></div>' +
      '<div class="field"><label>金额（元）*</label><input class="input" type="number" id="pAmount" value="0"></div>' +
      '<div class="field"><label>日期</label><input class="input" type="date" id="pDate" value="' + S.today() + '"></div>' +
      '<div class="field"><label>状态</label><select class="select" id="pStatus"><option>待支付</option><option>已支付</option></select></div>' +
      '<div class="field full"><label>支付方式</label><select class="select" id="pMethod"><option>微信</option><option>支付宝</option><option>银行转账</option><option>现金</option></select></div></div>';
  }

  /* ---------- 材料管理 ---------- */
  function viewMaterials() {
    var list = S.get('materials').filter(function (m) { return !state.matFilter || m.status === state.matFilter; });
    return pageHead('材料管理', '材料采购计划、供应商与到场验收跟踪。',
      '<button class="btn btn-primary" data-act="new-material">' + Icon.plus + ' 新增材料</button>') +
      '<div class="panel"><div class="filter-bar">' + ['', '待采购', '已到场'].map(function (s) {
        return '<button class="btn btn-sm' + (state.matFilter === s ? ' btn-primary' : '') + '" data-matfilter="' + s + '">' + (s || '全部') + '</button>';
      }).join('') + '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 项材料</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>编号</th><th>材料名称</th><th>项目</th><th>品牌 / 规格</th><th>数量</th><th>单价</th><th>供应商</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        (list.length ? list.map(function (m) {
          return '<tr><td class="tiny muted">' + esc(m.id) + '</td><td class="strong">' + esc(m.name) + '</td><td class="tiny">' + esc(projectName(m.projectId)) + '</td>' +
            '<td>' + esc(m.brand) + ' · ' + esc(m.spec) + '</td><td>' + m.qty + ' ' + esc(m.unit) + '</td><td>' + money(m.price) + '</td>' +
            '<td class="tiny">' + esc(m.supplier) + '</td><td>' + badge(m.status) + '</td><td><div class="table-actions">' +
            (m.status === '待采购' ? '<button class="link-btn" data-act="arrive-material" data-id="' + m.id + '">到场</button>' : '') +
            '<button class="link-btn" data-act="edit-material" data-id="' + m.id + '">编辑</button>' +
            '<button class="link-btn red" data-act="del-material" data-id="' + m.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="9"><div class="empty"><div class="big">📦</div>暂无材料</div></td></tr>') + '</tbody></table></div></div>';
  }
  function materialForm(m) {
    m = m || {};
    return '<div class="form-grid">' +
      '<div class="field full"><label>材料名称 *</label><input class="input" id="mName" value="' + esc(m.name || '') + '"></div>' +
      '<div class="field"><label>所属项目</label><select class="select" id="mProject">' + S.get('projects').map(function (p) { return '<option value="' + p.id + '"' + (m.projectId === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>品牌</label><input class="input" id="mBrand" value="' + esc(m.brand || '') + '"></div>' +
      '<div class="field"><label>规格型号</label><input class="input" id="mSpec" value="' + esc(m.spec || '') + '"></div>' +
      '<div class="field"><label>数量</label><input class="input" type="number" id="mQty" value="' + (m.qty || 1) + '"></div>' +
      '<div class="field"><label>单位</label><input class="input" id="mUnit" value="' + esc(m.unit || '件') + '"></div>' +
      '<div class="field"><label>单价（元）</label><input class="input" type="number" id="mPrice" value="' + (m.price || 0) + '"></div>' +
      '<div class="field"><label>供应商</label><input class="input" id="mSupplier" value="' + esc(m.supplier || '') + '"></div>' +
      '<div class="field"><label>状态</label><select class="select" id="mStatus">' + ['待采购', '已到场'].map(function (x) { return '<option' + (m.status === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div>';
  }
  function readMaterialForm(r) {
    var g = function (id) { return $(id, r).value.trim(); };
    return { name: g('#mName'), projectId: $('#mProject', r).value, brand: g('#mBrand'), spec: g('#mSpec'),
      qty: Number(g('#mQty')) || 1, unit: g('#mUnit'), price: Number(g('#mPrice')) || 0, supplier: g('#mSupplier'), status: g('#mStatus') };
  }

  /* ---------- 团队管理 ---------- */
  function viewStaff() {
    return pageHead('团队管理', '设计师、项目经理、工长与监理信息。',
      '<button class="btn btn-primary" data-act="new-staff">' + Icon.plus + ' 新增成员</button>') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' +
      S.get('staff').map(function (s) {
        var n = S.get('projects').filter(function (p) { return p.designerId === s.id || p.managerId === s.id; }).length;
        return '<div class="card" style="padding:20px"><div class="row" style="margin-bottom:14px">' +
          '<div class="avatar" style="width:52px;height:52px;background:' + s.color + ';font-size:18px">' + esc(s.name.charAt(0)) + '</div>' +
          '<div class="grow"><div style="font-size:16px;font-weight:800">' + esc(s.name) + '</div><div class="tiny muted">' + esc(s.role) + ' · 从业 ' + s.years + ' 年</div></div>' +
          '<span class="badge orange">' + esc(s.role) + '</span></div>' +
          '<div class="tiny muted">' + esc(s.specialty) + '</div>' +
          '<div class="spread" style="border-top:1px dashed var(--border);padding-top:12px;margin-top:12px">' +
          '<span class="tiny muted">' + Icon.phone + ' ' + esc(s.phone) + '</span><span class="tiny muted">负责项目 <b style="color:var(--text)">' + n + '</b></span></div>' +
          '<div class="row" style="margin-top:12px"><button class="btn btn-sm grow" data-act="edit-staff" data-id="' + s.id + '">编辑信息</button>' +
          '<button class="btn btn-sm btn-danger" data-act="del-staff" data-id="' + s.id + '">删除</button></div></div>';
      }).join('') + '</div>';
  }
  function staffForm(s) {
    s = s || {};
    return '<div class="form-grid">' +
      '<div class="field"><label>姓名 *</label><input class="input" id="sName" value="' + esc(s.name || '') + '"></div>' +
      '<div class="field"><label>岗位</label><select class="select" id="sRole">' + ['设计师', '项目经理', '施工工长', '监理', '其他'].map(function (x) { return '<option' + (s.role === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>联系电话</label><input class="input" id="sPhone" value="' + esc(s.phone || '') + '"></div>' +
      '<div class="field"><label>从业年限</label><input class="input" type="number" id="sYears" value="' + (s.years || 0) + '"></div>' +
      '<div class="field full"><label>专业特长</label><input class="input" id="sSpecialty" value="' + esc(s.specialty || '') + '"></div></div>';
  }
  function readStaffForm(r) {
    var g = function (id) { return $(id, r).value.trim(); };
    return { name: g('#sName'), role: g('#sRole'), phone: g('#sPhone'), years: Number(g('#sYears')) || 0,
      specialty: g('#sSpecialty'), color: '#0e9f8e' };
  }

  /* ---------- 报表统计 ---------- */
  function viewReports() {
    var projects = S.get('projects'), pays = S.get('payments').filter(function (p) { return p.status === '已支付'; });
    var statusData = ['设计中', '待开工', '施工中', '已完工'].map(function (s) {
      return { label: s, value: projects.filter(function (p) { return p.status === s; }).length };
    });
    var staffData = S.get('staff').filter(function (s) { return s.role === '设计师' || s.role === '项目经理'; }).map(function (s) {
      return { label: s.name, value: projects.filter(function (p) { return p.designerId === s.id || p.managerId === s.id; }).length };
    });
    var sourceMap = {}; S.get('customers').forEach(function (c) { sourceMap[c.source] = (sourceMap[c.source] || 0) + 1; });
    var sourceData = Object.keys(sourceMap).map(function (k) { return { label: k, value: sourceMap[k] }; });
    return pageHead('报表统计', '项目状态、团队接单与客户来源分析。') +
      '<div class="dash-grid">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>项目状态分布</div></div><div class="panel-body">' + barChart(statusData, ' 个') + '</div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>团队负责项目数</div></div><div class="panel-body">' + barChart(staffData, ' 个') + '</div></div>' +
      '</div>' +
      '<div class="dash-grid-2">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>客户来源</div></div><div class="panel-body">' + barChart(sourceData, ' 人') + '</div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>收款构成</div></div><div class="panel-body">' +
          projects.slice(0, 6).map(function (p) {
            var sum = pays.filter(function (x) { return x.projectId === p.id; }).reduce(function (s, x) { return s + x.amount; }, 0);
            return '<div class="spread" style="padding:9px 0;border-bottom:1px dashed var(--border);font-size:12px"><span class="ellipsis">' + esc(p.name) + '</span><b>' + money(sum) + '</b></div>';
          }).join('') + '</div></div></div>';
  }

  /* ---------- 系统设置 ---------- */
  function viewSettings() {
    var s = S.get('settings');
    return pageHead('系统设置', '公司信息维护与本地数据管理。') +
      '<div class="dash-grid-2">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>公司信息</div></div><div class="panel-body"><div class="col">' +
          fld('公司名称', 'setName', s.companyName) + fld('联系电话', 'setPhone', s.phone) + fld('公司地址', 'setAddress', s.address) +
          fld('营业时间', 'setHours', s.hours) + fld('宣传标语', 'setNotice', s.notice) +
          '<button class="btn btn-primary" data-act="save-settings" style="align-self:flex-start">' + Icon.check + ' 保存信息</button>' +
        '</div></div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>数据管理</div></div><div class="panel-body">' +
          '<div class="m-diag" style="margin-bottom:14px"><b>存储方式：</b>浏览器本地存储（localStorage），无需服务器，刷新数据不丢失。</div><div class="col">' +
          '<button class="btn" data-act="export-data">' + Icon.download + ' 导出全部数据（JSON）</button>' +
          '<button class="btn" data-act="reset-data">' + Icon.refresh + ' 重置为演示数据</button></div>' +
          '<div class="section-title">系统信息</div><div class="detail-grid">' +
          [['版本', 'v' + s.version], ['客户档案', S.get('customers').length + ' 条'], ['装修项目', S.get('projects').length + ' 个'],
            ['设计方案', S.get('plans').length + ' 套'], ['施工记录', S.get('progress').length + ' 条'], ['团队成员', S.get('staff').length + ' 人']]
            .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') +
          '</div></div></div></div>';
  }
  function fld(label, id, val) { return '<div class="field"><label>' + label + '</label><input class="input" id="' + id + '" value="' + esc(val || '') + '"></div>'; }

  /* ---------- 事件 ---------- */
  function bindPage() {
    $$('[data-nav-mini]').forEach(function (b) { b.onclick = function () { go(b.dataset.navMini); }; });
    var map = { custSearch: 'custQ', projSearch: 'projQ', planSearch: 'planQ' };
    Object.keys(map).forEach(function (id) {
      var el = $('#' + id); if (!el) return;
      el.oninput = function () { state[map[id]] = this.value; renderPage(); var n = $('#' + id); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
    });
    $$('[data-pfilter]').forEach(function (b) { b.onclick = function () { state.projFilter = b.dataset.pfilter; renderPage(); }; });
    $$('[data-pf]').forEach(function (b) { b.onclick = function () { state.planFilter = b.dataset.pf; renderPage(); }; });
    $$('[data-matfilter]').forEach(function (b) { b.onclick = function () { state.matFilter = b.dataset.matfilter; renderPage(); }; });
    $$('[data-msgproj]').forEach(function (b) { b.onclick = function () { state.msgProject = b.dataset.msgproj; renderPage(); }; });
    var mi = $('#msgInput'); if (mi) mi.onkeydown = function (e) { if (e.key === 'Enter') handleAct('send-msg'); };
    $$('[data-act]').forEach(function (b) { b.onclick = function () { handleAct(b.dataset.act, b.dataset.id); }; });
  }

  function handleAct(act, id) {
    switch (act) {
      case 'new-customer': editCustomer(null); break;
      case 'edit-customer': editCustomer(S.find('customers', id)); break;
      case 'view-customer': viewCustomerDetail(id); break;
      case 'del-customer': confirmBox('确定删除该客户档案吗？', function () { S.remove('customers', id); toast('客户已删除'); renderPage(); }); break;

      case 'new-project': editProject(null); break;
      case 'edit-project': editProject(S.find('projects', id)); break;
      case 'view-project': viewProjectDetail(id); break;
      case 'del-project': confirmBox('确定删除该项目吗？关联记录不会自动删除。', function () { S.remove('projects', id); toast('项目已删除'); renderPage(); }); break;
      case 'add-progress': addProgress(id); break;

      case 'new-plan': editPlan(null); break;
      case 'edit-plan': editPlan(S.find('plans', id)); break;
      case 'view-plan': viewPlanDetail(S.find('plans', id)); break;
      case 'confirm-plan': S.update('plans', id, { status: '已确认' }); toast('方案已确认'); renderPage(); break;
      case 'del-plan': confirmBox('确定删除该方案吗？', function () { S.remove('plans', id); toast('方案已删除'); renderPage(); }); break;

      case 'send-msg': {
        var input = $('#msgInput'); var content = input ? input.value.trim() : '';
        if (!content) { toast('请输入回复内容', 'err'); break; }
        var from = $('#msgFrom') ? $('#msgFrom').value : '设计师';
        S.add('messages', { id: S.nextId('M'), projectId: state.msgProject, from: from, fromName: staffName(S.get('staff').filter(function (s) { return s.role === from; })[0] ? S.get('staff').filter(function (s) { return s.role === from; })[0].id : 'S01') || from,
          date: S.today() + ' ' + new Date().toTimeString().slice(0, 5), content: content, read: true });
        toast('消息已发送'); renderPage(); break;
      }

      case 'new-quote': newQuote(); break;
      case 'view-quote': viewQuoteDetail(id); break;
      case 'confirm-quote': S.update('quotes', id, { status: '已确认' }); toast('报价单已确认'); renderPage(); break;
      case 'del-quote': confirmBox('确定删除该报价单吗？', function () { S.remove('quotes', id); toast('报价单已删除'); renderPage(); }); break;
      case 'new-payment': editPayment(null); break;
      case 'pay-payment': S.update('payments', id, { status: '已支付', method: $('#pMethod') ? $('#pMethod').value : '微信' }); toast('已确认收款'); renderPage(); break;
      case 'del-payment': confirmBox('确定删除该款项记录吗？', function () { S.remove('payments', id); toast('款项已删除'); renderPage(); }); break;

      case 'new-material': editMaterial(null); break;
      case 'edit-material': editMaterial(S.find('materials', id)); break;
      case 'arrive-material': S.update('materials', id, { status: '已到场' }); toast('已标记到场'); renderPage(); break;
      case 'del-material': confirmBox('确定删除该材料吗？', function () { S.remove('materials', id); toast('材料已删除'); renderPage(); }); break;

      case 'new-staff': editStaff(null); break;
      case 'edit-staff': editStaff(S.find('staff', id)); break;
      case 'del-staff': confirmBox('确定删除该团队成员吗？', function () { S.remove('staff', id); toast('成员已删除'); renderPage(); }); break;

      case 'save-settings':
        S.set('settings', { companyName: $('#setName').value.trim(), phone: $('#setPhone').value.trim(), address: $('#setAddress').value.trim(),
          hours: $('#setHours').value.trim(), notice: $('#setNotice').value.trim(), version: '1.0.0' });
        toast('公司信息已保存'); renderPage(); break;
      case 'export-data': exportData(); break;
      case 'reset-data': confirmBox('确定重置所有演示数据吗？', function () { S.reset(); toast('数据已重置'); renderPage(); }); break;
    }
  }

  function editCustomer(c) {
    openModal({ title: c ? '编辑客户' : '新建客户', body: customerForm(c), width: 640, onOk: function (r) {
      var data = readCustomerForm(r);
      if (!data.name) { toast('请输入客户姓名', 'err'); return false; }
      if (c) { S.update('customers', c.id, data); toast('客户已更新'); }
      else { S.add('customers', Object.assign({ id: S.nextId('C') }, data)); toast('客户已创建'); }
      renderPage();
    } });
  }
  function editProject(p) {
    openModal({ title: p ? '编辑项目' : '新建项目', body: projectForm(p), width: 720, onOk: function (r) {
      var data = readProjectForm(r);
      if (!data.name) { toast('请输入项目名称', 'err'); return false; }
      if (p) { S.update('projects', p.id, data); toast('项目已更新'); }
      else { S.add('projects', Object.assign({ id: S.nextId('J') }, data)); toast('项目已创建'); }
      renderPage();
    } });
  }
  function addProgress(projectId) {
    openModal({ title: '记录施工进度', body: progressForm(projectId), onOk: function (r) {
      var g = function (id) { return $(id, r).value.trim(); };
      var content = g('#uContent');
      if (!content) { toast('请填写施工说明', 'err'); return false; }
      var data = { projectId: $('#uProject', r).value, phase: g('#uPhase'), progress: Number(g('#uProgress')) || 0,
        content: content, author: g('#uAuthor') || '管理员', photo: g('#uPhoto'), date: S.today() };
      S.add('progress', data);
      S.update('projects', data.projectId, { phase: data.phase, progress: data.progress, status: data.progress >= 100 ? '已完工' : '施工中' });
      toast('进度已更新'); renderPage();
    } });
  }
  function editPlan(f) {
    openModal({ title: f ? '编辑方案' : '上传方案', body: planForm(f), width: 680, onOk: function (r) {
      var data = readPlanForm(r);
      if (!data.name) { toast('请输入方案名称', 'err'); return false; }
      if (f) { S.update('plans', f.id, data); toast('方案已更新'); }
      else { S.add('plans', Object.assign({ id: S.nextId('F') }, data)); toast('方案已上传'); }
      renderPage();
    } });
  }
  function newQuote() {
    var products = ['设计费', '基础施工', '水电改造', '泥木工程', '油漆工程', '主材代购', '管理费', '其他费用'];
    openModal({ title: '新建报价单', body: quoteForm(), width: 680,
      onOpen: function (r) {
        function bindRow(row) {
          $('.q-price', row).oninput = function () { updateQuoteTotal(r); };
          $('.q-qty', row).oninput = function () { updateQuoteTotal(r); };
          $('.q-del', row).onclick = function () { row.remove(); updateQuoteTotal(r); };
        }
        $$('.q-row', r).forEach(bindRow);
        $('#addQuoteItem', r).onclick = function () {
          var div = document.createElement('div'); div.innerHTML = quoteRow(products);
          var row = div.firstChild; $('#quoteItems', r).appendChild(row); bindRow(row); updateQuoteTotal(r);
        };
        updateQuoteTotal(r);
      },
      onOk: function (r) {
        var items = $$('.q-row', r).map(function (row) {
          return { name: $('.q-name', row).value.trim(), price: Number($('.q-price', row).value) || 0, qty: Number($('.q-qty', row).value) || 1 };
        }).filter(function (i) { return i.name && i.price > 0; });
        if (!items.length) { toast('请填写有效的报价项目', 'err'); return false; }
        S.add('quotes', { id: S.nextId('Q'), projectId: $('#qProject', r).value, date: $('#qDate', r).value,
          status: $('#qStatus', r).value, note: $('#qNote', r).value.trim(), items: items });
        toast('报价单已创建'); renderPage();
      } });
  }
  function editPayment(p) {
    openModal({ title: p ? '编辑款项' : '新增款项', body: paymentForm(p), width: 560, onOk: function (r) {
      var g = function (id) { return $(id, r).value.trim(); };
      if (!g('#pName')) { toast('请输入款项名称', 'err'); return false; }
      S.add('payments', { id: S.nextId('K'), projectId: $('#pProject', r).value, name: g('#pName'),
        amount: Number(g('#pAmount')) || 0, date: g('#pDate'), status: g('#pStatus'), method: $('#pMethod', r).value });
      toast('款项已添加'); renderPage();
    } });
  }
  function editMaterial(m) {
    openModal({ title: m ? '编辑材料' : '新增材料', body: materialForm(m), onOk: function (r) {
      var data = readMaterialForm(r);
      if (!data.name) { toast('请输入材料名称', 'err'); return false; }
      if (m) { S.update('materials', m.id, data); toast('材料已更新'); }
      else { S.add('materials', Object.assign({ id: S.nextId('W') }, data)); toast('材料已添加'); }
      renderPage();
    } });
  }
  function editStaff(s) {
    openModal({ title: s ? '编辑成员' : '新增成员', body: staffForm(s), onOk: function (r) {
      var data = readStaffForm(r);
      if (!data.name) { toast('请输入姓名', 'err'); return false; }
      if (s) { S.update('staff', s.id, data); toast('成员已更新'); }
      else { S.add('staff', Object.assign({ id: S.nextId('S') }, data)); toast('成员已添加'); }
      renderPage();
    } });
  }
  function exportData() {
    var keys = ['staff', 'customers', 'projects', 'progress', 'plans', 'messages', 'quotes', 'payments', 'materials', 'notices', 'settings'];
    var data = {}; keys.forEach(function (k) { data[k] = S.get(k); });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }));
    a.download = '装修公司数据_' + S.today() + '.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast('数据已导出');
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $('#loginLogo').innerHTML = Icon.home;
    $('#brandMark').innerHTML = Icon.home;
    $('#topSearchIcon').innerHTML = Icon.search;
    $('#bellIcon').innerHTML = Icon.bell;
    $('#resetIcon').innerHTML = Icon.refresh;
    $('#loginBtn').onclick = function () {
      if (!$('#loginUser').value.trim() || !$('#loginPwd').value.trim()) { toast('请输入账号和密码', 'err'); return; }
      $('#loginPage').classList.add('hide'); $('#app').classList.remove('hide'); renderPage();
    };
    $('#loginPwd').onkeydown = function (e) { if (e.key === 'Enter') $('#loginBtn').click(); };
    $('#bellBtn').onclick = function () {
      var unread = S.get('messages').filter(function (m) { return !m.read && m.from === '客户'; });
      var wait = S.get('plans').filter(function (f) { return f.status === '待确认'; });
      openModal({ title: '消息通知', width: 480, okText: '知道了',
        body: '<div class="m-diag" style="margin-bottom:12px"><b>未读客户消息：</b>' + unread.length + ' 条</div>' +
          '<div class="m-diag" style="background:#fff2d6;color:#a56a1d"><b>待确认方案：</b>' + wait.length + ' 套' + (wait.length ? '（' + wait.map(function (f) { return esc(f.name); }).join('、') + '）' : '') + '</div>',
        onOk: function () {} });
    };
    $('#resetBtn').onclick = function () {
      confirmBox('确定重置所有演示数据吗？您新增的数据将被清除。', function () { S.reset(); toast('数据已重置'); renderPage(); });
    };
    $('#globalSearch').oninput = function () {
      var v = this.value.trim(); if (!v) return;
      state.custQ = v; go('customers'); var el = $('#custSearch'); if (el) { el.value = v; el.focus(); }
    };
    renderNav();
  }
  init();
})();

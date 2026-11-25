/* ============================================================
 * 视力门诊管理系统 - PC 管理端逻辑
 * ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = Store.escape;

  var NAV = [
    { id: 'dashboard', name: '工作台', icon: 'grid', sub: '门诊运营概览' },
    { group: '业务管理' },
    { id: 'appointments', name: '预约管理', icon: 'calendar', sub: '挂号与就诊安排' },
    { id: 'patients', name: '患者档案', icon: 'users', sub: '患者信息建档与查询' },
    { id: 'records', name: '诊疗记录', icon: 'file', sub: '视力检查与验光处方' },
    { group: '运营管理' },
    { id: 'products', name: '验光配镜', icon: 'bag', sub: '商品与库存管理' },
    { id: 'bills', name: '收费管理', icon: 'receipt', sub: '开单与收款记录' },
    { id: 'doctors', name: '医生管理', icon: 'doctor', sub: '出诊医师与排班' },
    { id: 'reports', name: '报表统计', icon: 'chart', sub: '经营数据统计分析' },
    { group: '系统' },
    { id: 'settings', name: '系统设置', icon: 'settings', sub: '门诊信息与数据维护' }
  ];

  var state = { page: 'dashboard', pQuery: '', aQuery: '', rQuery: '', gQuery: '' };
  var S = Store;

  /* ---------- 通用 UI ---------- */
  function toast(msg, type) {
    var box = $('#toastBox');
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.remove(); }, 2300);
  }

  function openModal(opt) {
    var root = $('#modalRoot');
    root.innerHTML =
      '<div class="modal-mask" id="curMask">' +
        '<div class="modal" style="max-width:' + (opt.width || 560) + 'px">' +
          '<div class="modal-head"><h3>' + esc(opt.title) + '</h3><button class="modal-close" data-close>&times;</button></div>' +
          '<div class="modal-body">' + opt.body + '</div>' +
          (opt.noFoot ? '' : '<div class="modal-foot">' +
            '<button class="btn" data-close>' + (opt.cancelText || '取消') + '</button>' +
            '<button class="btn btn-primary" data-ok>' + (opt.okText || '保存') + '</button></div>') +
        '</div></div>';
    function close() { root.innerHTML = ''; }
    $$('[data-close]', root).forEach(function (b) { b.onclick = close; });
    $('#curMask').onclick = function (e) { if (e.target.id === 'curMask') close(); };
    var okBtn = $('[data-ok]', root);
    if (okBtn) okBtn.onclick = function () { if (opt.onOk && opt.onOk(root) === false) return; close(); };
    if (opt.onOpen) opt.onOpen(root);
    return { close: close, root: root };
  }

  function confirmBox(msg, cb) {
    openModal({
      title: '操作确认', width: 420,
      body: '<div style="display:flex;gap:14px;align-items:flex-start"><div style="width:40px;height:40px;border-radius:50%;background:#fef3c7;color:#b45309;display:flex;align-items:center;justify-content:center;flex:none">' + Icon.info + '</div><div style="padding-top:6px">' + esc(msg) + '</div></div>',
      okText: '确认', onOk: function () { cb(); }
    });
  }

  function statusBadge(s) {
    var map = { '待就诊': 'warning', '已预约': 'info', '已就诊': 'success', '已完成': 'success', '已取消': 'gray', '待支付': 'warning', '已支付': 'success', '在售': 'success', '停售': 'gray' };
    return '<span class="badge ' + (map[s] || 'gray') + '"><i class="dot"></i>' + esc(s) + '</span>';
  }
  function patientName(id) { var p = S.find('patients', id); return p ? p.name : '-'; }
  function doctorName(id) { var d = S.find('doctors', id); return d ? d.name : '-'; }
  function money(n) { return S.money(n); }

  function barChart(data, unit) {
    var max = Math.max.apply(null, data.map(function (x) { return x.value; }).concat([1]));
    return '<div class="bar-chart">' + data.map(function (x) {
      var h = Math.round(x.value / max * 100);
      return '<div class="bar-item"><div class="bar-value">' + x.value + (unit || '') + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="height:' + h + '%"></div></div>' +
        '<div class="bar-label">' + esc(x.label) + '</div></div>';
    }).join('') + '</div>';
  }

  function ringChart(percent, label, value) {
    var r = 36, c = 2 * Math.PI * r, off = c * (1 - percent / 100);
    return '<div class="ring"><svg width="92" height="92">' +
      '<circle cx="46" cy="46" r="' + r + '" stroke="#e2e8f0" stroke-width="9" fill="none"/>' +
      '<circle cx="46" cy="46" r="' + r + '" stroke="#0d9488" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/>' +
      '</svg><div class="ring-text"><div class="ring-num">' + value + '</div><div class="ring-label">' + esc(label) + '</div></div></div>';
  }

  function statCard(label, value, icon, color, bg, trend) {
    return '<div class="stat-card"><div><div class="label">' + esc(label) + '</div><div class="value">' + value + '</div>' +
      '<div class="trend ' + (trend && trend.up ? 'up' : '') + '">' + (trend ? esc(trend.text) : '') + '</div></div>' +
      '<div class="stat-icon" style="color:' + color + ';background:' + bg + '">' + Icon[icon] + '</div></div>';
  }

  /* ---------- 导航 ---------- */
  function renderNav() {
    var html = NAV.map(function (n) {
      if (n.group) return '<div class="side-group-title">' + n.group + '</div>';
      return '<button class="side-item' + (n.id === state.page ? ' active' : '') + '" data-nav="' + n.id + '">' + Icon[n.icon] + '<span>' + n.name + '</span></button>';
    }).join('');
    $('#sideNav').innerHTML = html;
    $$('[data-nav]').forEach(function (b) { b.onclick = function () { go(b.dataset.nav); }; });
    var cur = NAV.filter(function (n) { return n.id === state.page; })[0];
    $('#crumbTitle').textContent = cur ? cur.name : '工作台';
    $('#crumbSub').textContent = cur ? cur.sub : '';
  }

  function go(id) { state.page = id; renderNav(); renderPage(); $('#pageArea').scrollTop = 0; }

  function pageHead(title, desc, action) {
    return '<div class="page-head"><div><h2>' + esc(title) + '</h2><p>' + esc(desc) + '</p></div>' + (action || '') + '</div>';
  }

  /* ---------- 页面渲染 ---------- */
  function renderPage() {
    var f = { dashboard: viewDashboard, appointments: viewAppointments, patients: viewPatients, records: viewRecords,
      products: viewProducts, bills: viewBills, doctors: viewDoctors, reports: viewReports, settings: viewSettings }[state.page];
    $('#pageArea').innerHTML = f ? f() : '';
    bindPage();
  }

  /* 工作台 */
  function viewDashboard() {
    var today = S.today();
    var appts = S.get('appointments');
    var todayAppts = appts.filter(function (a) { return a.date === today; });
    var bills = S.get('bills');
    var todayIncome = bills.filter(function (b) { return b.date === today && b.status === '已支付'; })
      .reduce(function (s, b) { return s + b.total; }, 0);
    var lowStock = S.get('products').filter(function (p) { return p.stock < 15 && p.status === '在售'; });
    var waiting = todayAppts.filter(function (a) { return a.status === '待就诊'; }).length;

    var week = [];
    for (var i = 6; i >= 0; i--) {
      var d = S.dateOffset(-i);
      week.push({ label: d.slice(5).replace('-', '/'), value: appts.filter(function (a) { return a.date === d; }).length });
    }
    var typeCount = {};
    appts.forEach(function (a) { typeCount[a.type] = (typeCount[a.type] || 0) + 1; });
    var topTypes = Object.keys(typeCount).map(function (k) { return { name: k, n: typeCount[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);

    return pageHead('工作台', '欢迎回来，今天是 ' + today + '，祝您工作愉快。',
      '<button class="btn btn-primary" data-act="new-appt">' + Icon.plus + ' 新建预约</button>') +
      '<div class="stat-grid">' +
        statCard('今日预约', todayAppts.length, 'calendar', '#0d9488', '#ccfbf1', { text: '待就诊 ' + waiting + ' 人', up: true }) +
        statCard('在册患者', S.get('patients').length, 'users', '#2563eb', '#dbeafe', { text: '累计建档人数' }) +
        statCard('今日营收', money(todayIncome), 'money', '#d97706', '#fef3c7', { text: '已收款金额' }) +
        statCard('库存预警', lowStock.length, 'bag', '#dc2626', '#fee2e2', { text: '低于安全库存' }) +
      '</div>' +
      '<div class="dash-grid">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>近 7 日预约趋势</div><span class="tiny muted">单位：人次</span></div>' +
          '<div class="panel-body">' + barChart(week) + '</div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>今日接诊进度</div></div>' +
          '<div class="panel-body" style="display:flex;align-items:center;justify-content:space-around;gap:16px">' +
            ringChart(todayAppts.length ? Math.round(todayAppts.filter(function (a) { return a.status === '已就诊' || a.status === '已完成'; }).length / todayAppts.length * 100) : 0, '完成率', todayAppts.length + ' 人') +
            '<div style="font-size:12px;color:var(--text-2);line-height:2">' +
              '<div><i class="dot" style="color:#f59e0b"></i> 待就诊 <b style="color:var(--text)">' + waiting + '</b></div>' +
              '<div><i class="dot" style="color:#10b981"></i> 已完成 <b style="color:var(--text)">' + todayAppts.filter(function (a) { return a.status === '已就诊' || a.status === '已完成'; }).length + '</b></div>' +
              '<div><i class="dot" style="color:#3b82f6"></i> 总预约 <b style="color:var(--text)">' + todayAppts.length + '</b></div>' +
            '</div></div></div></div>' +
      '</div>' +
      '<div class="dash-grid-2">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>今日预约安排</div><button class="link-btn" data-nav-mini="appointments">查看全部 →</button></div>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>时间</th><th>患者</th><th>医生</th><th>项目</th><th>状态</th></tr></thead><tbody>' +
          (todayAppts.length ? todayAppts.slice(0, 6).map(function (a) {
            return '<tr><td class="strong">' + esc(a.time) + '</td><td>' + esc(patientName(a.patientId)) + '</td><td>' + esc(doctorName(a.doctorId)) + '</td><td>' + esc(a.type) + '</td><td>' + statusBadge(a.status) + '</td></tr>';
          }).join('') : '<tr><td colspan="5" class="empty">今日暂无预约</td></tr>') +
          '</tbody></table></div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>热门项目 / 公告</div></div><div class="panel-body">' +
          '<div class="tiny muted" style="margin-bottom:8px;font-weight:700">预约项目 TOP 5</div>' +
          topTypes.map(function (t, i) {
            return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><span style="width:19px;height:19px;border-radius:6px;background:' + (i < 3 ? '#ccfbf1' : '#f1f5f9') + ';color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">' + (i + 1) + '</span><span class="grow">' + esc(t.name) + '</span><span class="tiny muted">' + t.n + ' 次</span></div>';
          }).join('') +
          '<div class="section-title" style="margin:16px 0 8px">最新公告</div>' +
          S.get('notices').slice(0, 2).map(function (n) {
            return '<div style="padding:9px 11px;background:#f8fafc;border-radius:8px;margin-bottom:7px"><div class="strong" style="font-size:12px">' + esc(n.title) + '</div><div class="tiny muted">' + esc(n.date) + '</div></div>';
          }).join('') +
        '</div></div>' +
      '</div>';
  }

  /* 预约管理 */
  function viewAppointments() {
    var list = S.get('appointments');
    var q = state.aQuery.trim().toLowerCase();
    var filtered = list.filter(function (a) {
      var p = S.find('patients', a.patientId);
      return !q || (p && p.name.toLowerCase().indexOf(q) >= 0) || (p && String(p.phone).indexOf(q) >= 0) || String(a.id).toLowerCase().indexOf(q) >= 0;
    });
    return pageHead('预约管理', '管理患者预约、安排就诊时间与状态。',
      '<button class="btn btn-primary" data-act="new-appt">' + Icon.plus + ' 新建预约</button>') +
      '<div class="panel"><div class="filter-bar">' +
        '<div class="search-box">' + Icon.search + '<input class="input" id="apptSearch" placeholder="搜索患者 / 预约号" value="' + esc(state.aQuery) + '"></div>' +
        '<select class="select" id="apptStatus"><option value="">全部状态</option>' + ['待就诊', '已预约', '已就诊', '已完成', '已取消'].map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' +
        '<span class="grow"></span><span class="tiny muted">共 ' + filtered.length + ' 条记录</span>' +
      '</div><div class="table-wrap"><table class="data-table"><thead><tr><th>预约号</th><th>患者</th><th>医生</th><th>日期 / 时间</th><th>项目</th><th>状态</th><th>备注</th><th>操作</th></tr></thead><tbody>' +
      (filtered.length ? filtered.map(function (a) {
        return '<tr><td class="tiny muted">' + esc(a.id) + '</td><td class="strong">' + esc(patientName(a.patientId)) + '</td><td>' + esc(doctorName(a.doctorId)) + '</td>' +
          '<td>' + esc(a.date) + ' <span class="strong">' + esc(a.time) + '</span></td><td>' + esc(a.type) + '</td><td>' + statusBadge(a.status) + '</td>' +
          '<td class="tiny muted">' + esc(a.note || '-') + '</td><td><div class="table-actions">' +
          (a.status !== '已完成' && a.status !== '已就诊' ? '<button class="link-btn" data-act="finish-appt" data-id="' + a.id + '">完成</button>' : '') +
          '<button class="link-btn" data-act="edit-appt" data-id="' + a.id + '">编辑</button>' +
          '<button class="link-btn red" data-act="del-appt" data-id="' + a.id + '">删除</button></div></td></tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty"><div class="big">📅</div>暂无预约记录</div></td></tr>') +
      '</tbody></table></div></div>';
  }

  function apptForm(a) {
    var patients = S.get('patients'), doctors = S.get('doctors');
    a = a || {};
    return '<div class="form-grid">' +
      '<div class="field"><label>患者 *</label><select class="select" id="fPatient">' + patients.map(function (p) {
        return '<option value="' + p.id + '"' + (a.patientId === p.id ? ' selected' : '') + '>' + esc(p.name) + '（' + p.age + '岁）</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>接诊医生 *</label><select class="select" id="fDoctor">' + doctors.map(function (d) {
        return '<option value="' + d.id + '"' + (a.doctorId === d.id ? ' selected' : '') + '>' + esc(d.name) + ' · ' + esc(d.title) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>就诊日期 *</label><input class="input" type="date" id="fDate" value="' + esc(a.date || S.today()) + '"></div>' +
      '<div class="field"><label>就诊时间 *</label><select class="select" id="fTime">' + ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(function (t) {
        return '<option' + (a.time === t ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>预约项目 *</label><select class="select" id="fType">' + ['近视复查', '医学验光', '视力筛查', '儿童眼科', '干眼诊疗', '配镜咨询', '眼表检查'].map(function (t) {
        return '<option' + (a.type === t ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>状态</label><select class="select" id="fStatus">' + ['待就诊', '已预约', '已就诊', '已完成', '已取消'].map(function (s) {
        return '<option' + ((a.status || '已预约') === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field full"><label>备注</label><textarea class="textarea" id="fNote" placeholder="填写患者症状或特殊要求">' + esc(a.note || '') + '</textarea></div>' +
      '</div>';
  }
  function readApptForm(root) {
    return {
      patientId: $('#fPatient', root).value, doctorId: $('#fDoctor', root).value,
      date: $('#fDate', root).value, time: $('#fTime', root).value, type: $('#fType', root).value,
      status: $('#fStatus', root).value, note: $('#fNote', root).value.trim()
    };
  }

  /* 患者档案 */
  function viewPatients() {
    var q = state.pQuery.trim().toLowerCase();
    var list = S.get('patients').filter(function (p) {
      return !q || p.name.toLowerCase().indexOf(q) >= 0 || String(p.phone).indexOf(q) >= 0 || String(p.id).toLowerCase().indexOf(q) >= 0;
    });
    return pageHead('患者档案', '患者基础信息、就诊记录与消费记录一览。',
      '<button class="btn btn-primary" data-act="new-patient">' + Icon.plus + ' 新建档案</button>') +
      '<div class="panel"><div class="filter-bar">' +
        '<div class="search-box">' + Icon.search + '<input class="input" id="patientSearch" placeholder="搜索姓名 / 手机号 / 档案号" value="' + esc(state.pQuery) + '"></div>' +
        '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 位患者</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>档案号</th><th>姓名</th><th>性别 / 年龄</th><th>联系电话</th><th>标签</th><th>登记日期</th><th>操作</th></tr></thead><tbody>' +
        (list.length ? list.map(function (p) {
          return '<tr><td class="tiny muted">' + esc(p.id) + '</td><td class="strong">' + esc(p.name) + '</td>' +
            '<td>' + esc(p.gender) + ' / ' + p.age + ' 岁</td><td>' + esc(p.phone) + '</td>' +
            '<td><span class="badge ' + (p.tag === '学生' ? 'info' : p.tag === '中老年' ? 'purple' : 'gray') + '">' + esc(p.tag) + '</span></td>' +
            '<td class="tiny muted">' + esc(p.registerDate) + '</td><td><div class="table-actions">' +
            '<button class="link-btn" data-act="view-patient" data-id="' + p.id + '">详情</button>' +
            '<button class="link-btn" data-act="edit-patient" data-id="' + p.id + '">编辑</button>' +
            '<button class="link-btn red" data-act="del-patient" data-id="' + p.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="7"><div class="empty"><div class="big">👥</div>暂无患者档案</div></td></tr>') +
        '</tbody></table></div></div>';
  }

  function patientForm(p) {
    p = p || {};
    return '<div class="form-grid">' +
      '<div class="field"><label>姓名 *</label><input class="input" id="pName" value="' + esc(p.name || '') + '" placeholder="请输入患者姓名"></div>' +
      '<div class="field"><label>性别</label><select class="select" id="pGender">' + ['男', '女'].map(function (g) { return '<option' + (p.gender === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>年龄 *</label><input class="input" type="number" id="pAge" value="' + (p.age || 0) + '" min="0" max="120"></div>' +
      '<div class="field"><label>联系电话 *</label><input class="input" id="pPhone" value="' + esc(p.phone || '') + '" placeholder="手机号"></div>' +
      '<div class="field"><label>身份证号</label><input class="input" id="pIdcard" value="' + esc(p.idcard || '') + '"></div>' +
      '<div class="field"><label>患者标签</label><select class="select" id="pTag">' + ['学生', '上班族', '中老年', '儿童', '其他'].map(function (t) { return '<option' + (p.tag === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="field full"><label>联系地址</label><input class="input" id="pAddress" value="' + esc(p.address || '') + '"></div>' +
      '</div>';
  }
  function readPatientForm(root) {
    return { name: $('#pName', root).value.trim(), gender: $('#pGender', root).value, age: Number($('#pAge', root).value) || 0,
      phone: $('#pPhone', root).value.trim(), idcard: $('#pIdcard', root).value.trim(), tag: $('#pTag', root).value,
      address: $('#pAddress', root).value.trim(), registerDate: S.today() };
  }

  function viewPatientDetail(id) {
    var p = S.find('patients', id);
    if (!p) return;
    var recs = S.get('records').filter(function (r) { return r.patientId === id; });
    var bills = S.get('bills').filter(function (b) { return b.patientId === id; });
    var appts = S.get('appointments').filter(function (a) { return a.patientId === id; });
    var body = '<div class="detail-grid">' +
      [['档案号', p.id], ['姓名', p.name], ['性别 / 年龄', p.gender + ' / ' + p.age + ' 岁'], ['联系电话', p.phone],
        ['身份证号', p.idcard || '-'], ['患者标签', p.tag], ['联系地址', p.address || '-'], ['登记日期', p.registerDate]]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') +
      '</div>' +
      '<div class="section-title">视力检查记录（' + recs.length + '）</div>' +
      (recs.length ? recs.map(function (r) {
        return '<div style="padding:10px 12px;background:#f8fafc;border-radius:9px;margin-bottom:8px">' +
          '<div class="spread"><b>' + esc(r.date) + ' · ' + esc(doctorName(r.doctorId)) + '</b>' + statusBadge('已完成') + '</div>' +
          '<div class="tiny muted" style="margin-top:6px">裸眼 L ' + esc(r.nakedL) + ' / R ' + esc(r.nakedR) + '　矫正 L ' + esc(r.correctedL) + ' / R ' + esc(r.correctedR) + '</div>' +
          '<div class="tiny muted">' + esc(r.diagnosis) + '</div></div>';
      }).join('') : '<div class="tiny muted">暂无检查记录</div>') +
      '<div class="section-title">消费记录（' + bills.length + '）</div>' +
      (bills.length ? bills.map(function (b) {
        return '<div class="spread" style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:12px"><span>' + esc(b.date) + ' · ' + esc(b.items.map(function (i) { return i.name; }).join('、')) + '</span><b>' + money(b.total) + '</b></div>';
      }).join('') : '<div class="tiny muted">暂无消费记录</div>') +
      '<div class="section-title">预约记录（' + appts.length + '）</div>' +
      (appts.length ? appts.map(function (a) {
        return '<div class="spread" style="padding:7px 0;border-bottom:1px dashed var(--border);font-size:12px"><span>' + esc(a.date) + ' ' + esc(a.time) + ' · ' + esc(a.type) + '</span>' + statusBadge(a.status) + '</div>';
      }).join('') : '<div class="tiny muted">暂无预约记录</div>');
    openModal({ title: '患者档案详情 · ' + p.name, width: 620, body: body, okText: '关闭', cancelText: '', onOk: function () {} });
  }

  /* 诊疗记录 */
  function viewRecords() {
    var q = state.rQuery.trim().toLowerCase();
    var list = S.get('records').filter(function (r) {
      return !q || patientName(r.patientId).toLowerCase().indexOf(q) >= 0 || String(r.diagnosis).toLowerCase().indexOf(q) >= 0 || String(r.id).toLowerCase().indexOf(q) >= 0;
    });
    return pageHead('诊疗记录', '视力检查数据、验光处方与诊疗建议。',
      '<button class="btn btn-primary" data-act="new-record">' + Icon.plus + ' 新增记录</button>') +
      '<div class="panel"><div class="filter-bar">' +
        '<div class="search-box">' + Icon.search + '<input class="input" id="recordSearch" placeholder="搜索患者 / 诊断 / 记录号" value="' + esc(state.rQuery) + '"></div>' +
        '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 条记录</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>记录号</th><th>患者</th><th>检查日期</th><th>医生</th><th>裸眼 L / R</th><th>矫正 L / R</th><th>诊断</th><th>操作</th></tr></thead><tbody>' +
        (list.length ? list.map(function (r) {
          return '<tr><td class="tiny muted">' + esc(r.id) + '</td><td class="strong">' + esc(patientName(r.patientId)) + '</td>' +
            '<td>' + esc(r.date) + '</td><td>' + esc(doctorName(r.doctorId)) + '</td>' +
            '<td>' + esc(r.nakedL) + ' / ' + esc(r.nakedR) + '</td><td>' + esc(r.correctedL) + ' / ' + esc(r.correctedR) + '</td>' +
            '<td>' + esc(r.diagnosis) + '</td><td><div class="table-actions">' +
            '<button class="link-btn" data-act="view-record" data-id="' + r.id + '">详情</button>' +
            '<button class="link-btn" data-act="edit-record" data-id="' + r.id + '">编辑</button>' +
            '<button class="link-btn red" data-act="del-record" data-id="' + r.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="8"><div class="empty"><div class="big">📋</div>暂无诊疗记录</div></td></tr>') +
        '</tbody></table></div></div>';
  }

  function recordForm(r) {
    r = r || {};
    var pOpts = S.get('patients').map(function (p) { return '<option value="' + p.id + '"' + (r.patientId === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');
    var dOpts = S.get('doctors').map(function (d) { return '<option value="' + d.id + '"' + (r.doctorId === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('');
    function f(id, label, val, ph) { return '<div class="field"><label>' + label + '</label><input class="input" id="' + id + '" value="' + esc(val || '') + '" placeholder="' + (ph || '') + '"></div>'; }
    return '<div class="form-grid">' +
      '<div class="field"><label>患者 *</label><select class="select" id="rPatient">' + pOpts + '</select></div>' +
      '<div class="field"><label>检查医生</label><select class="select" id="rDoctor">' + dOpts + '</select></div>' +
      '<div class="field"><label>检查日期</label><input class="input" type="date" id="rDate" value="' + esc(r.date || S.today()) + '"></div>' +
      f('rNakedL', '裸眼视力 · 左', r.nakedL, '如 4.6') + f('rNakedR', '裸眼视力 · 右', r.nakedR, '如 4.5') +
      f('rCorrectedL', '矫正视力 · 左', r.correctedL, '如 5.0') + f('rCorrectedR', '矫正视力 · 右', r.correctedR, '如 5.0') +
      f('rSphereL', '球镜 SPH · 左', r.sphereL, '如 -2.00') + f('rSphereR', '球镜 SPH · 右', r.sphereR, '如 -2.25') +
      f('rCylinderL', '柱镜 CYL · 左', r.cylinderL, '如 -0.50') + f('rCylinderR', '柱镜 CYL · 右', r.cylinderR, '如 -0.75') +
      f('rAxisL', '轴位 AXIS · 左', r.axisL, '如 180') + f('rAxisR', '轴位 AXIS · 右', r.axisR, '如 175') +
      '<div class="field full"><label>诊断结果 *</label><input class="input" id="rDiagnosis" value="' + esc(r.diagnosis || '') + '" placeholder="如 双眼复合近视散光"></div>' +
      '<div class="field full"><label>处置 / 处方</label><input class="input" id="rPrescription" value="' + esc(r.prescription || '') + '" placeholder="如 框架眼镜 / 非球面"></div>' +
      '<div class="field full"><label>医嘱建议</label><textarea class="textarea" id="rAdvice" placeholder="填写用眼建议与复查计划">' + esc(r.advice || '') + '</textarea></div>' +
      '</div>';
  }
  function readRecordForm(root) {
    var g = function (id) { return $(id, root).value.trim(); };
    return { patientId: $('#rPatient', root).value, doctorId: $('#rDoctor', root).value, date: $('#rDate', root).value,
      nakedL: g('#rNakedL'), nakedR: g('#rNakedR'), correctedL: g('#rCorrectedL'), correctedR: g('#rCorrectedR'),
      sphereL: g('#rSphereL'), sphereR: g('#rSphereR'), cylinderL: g('#rCylinderL'), cylinderR: g('#rCylinderR'),
      axisL: g('#rAxisL'), axisR: g('#rAxisR'), diagnosis: g('#rDiagnosis'), prescription: g('#rPrescription'), advice: g('#rAdvice') };
  }
  function viewRecordDetail(id) {
    var r = S.find('records', id);
    if (!r) return;
    var cell = function (k, v) { return '<div class="vision-cell"><div class="k">' + k + '</div><div class="v">' + esc(v || '-') + '</div></div>'; };
    var body = '<div class="spread" style="margin-bottom:14px"><div><b style="font-size:16px">' + esc(patientName(r.patientId)) + '</b><div class="tiny muted">' + esc(r.date) + ' · ' + esc(doctorName(r.doctorId)) + ' 医师</div></div>' + statusBadge('已完成') + '</div>' +
      '<div class="section-title" style="margin-top:0">视力检查</div><div class="vision-grid">' +
      cell('裸眼视力 左', r.nakedL) + cell('裸眼视力 右', r.nakedR) + cell('矫正视力 左', r.correctedL) + cell('矫正视力 右', r.correctedR) + '</div>' +
      '<div class="section-title">验光数据</div><div class="vision-grid">' +
      cell('球镜 SPH 左', r.sphereL) + cell('球镜 SPH 右', r.sphereR) + cell('柱镜 CYL 左', r.cylinderL) + cell('柱镜 CYL 右', r.cylinderR) +
      cell('轴位 AXIS 左', r.axisL) + cell('轴位 AXIS 右', r.axisR) + '</div>' +
      '<div class="section-title">诊断与医嘱</div>' +
      '<div class="m-diag"><b>诊断：</b>' + esc(r.diagnosis) + '</div>' +
      '<div style="margin-top:10px;font-size:13px"><b>处置 / 处方：</b>' + esc(r.prescription || '-') + '</div>' +
      '<div style="margin-top:8px;font-size:13px;color:var(--text-2)"><b>医嘱建议：</b>' + esc(r.advice || '-') + '</div>';
    openModal({ title: '诊疗记录详情 · ' + r.id, width: 640, body: body, okText: '关闭', onOk: function () {} });
  }

  /* 验光配镜 */
  function viewProducts() {
    var q = state.gQuery.trim().toLowerCase();
    var list = S.get('products').filter(function (p) {
      return !q || p.name.toLowerCase().indexOf(q) >= 0 || p.brand.toLowerCase().indexOf(q) >= 0 || p.category.indexOf(q) >= 0;
    });
    return pageHead('验光配镜', '镜片、镜架、护理产品与服务项目的库存管理。',
      '<button class="btn btn-primary" data-act="new-product">' + Icon.plus + ' 新增商品</button>') +
      '<div class="panel"><div class="filter-bar">' +
        '<div class="search-box">' + Icon.search + '<input class="input" id="productSearch" placeholder="搜索商品名称 / 品牌 / 分类" value="' + esc(state.gQuery) + '"></div>' +
        '<span class="grow"></span><span class="tiny muted">共 ' + list.length + ' 个商品</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>编号</th><th>商品名称</th><th>分类</th><th>品牌</th><th>单价</th><th>库存</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        (list.length ? list.map(function (p) {
          return '<tr><td class="tiny muted">' + esc(p.id) + '</td><td class="strong">' + esc(p.name) + '</td>' +
            '<td><span class="badge gray">' + esc(p.category) + '</span></td><td>' + esc(p.brand) + '</td>' +
            '<td class="strong">' + money(p.price) + '</td>' +
            '<td><span style="color:' + (p.stock < 15 ? '#dc2626' : 'inherit') + ';font-weight:700">' + p.stock + ' ' + esc(p.unit) + '</span></td>' +
            '<td>' + statusBadge(p.status) + '</td><td><div class="table-actions">' +
            '<button class="link-btn" data-act="edit-product" data-id="' + p.id + '">编辑</button>' +
            '<button class="link-btn red" data-act="del-product" data-id="' + p.id + '">删除</button></div></td></tr>';
        }).join('') : '<tr><td colspan="8"><div class="empty"><div class="big">🛍️</div>暂无商品</div></td></tr>') +
        '</tbody></table></div></div>';
  }
  function productForm(p) {
    p = p || {};
    return '<div class="form-grid">' +
      '<div class="field full"><label>商品名称 *</label><input class="input" id="gName" value="' + esc(p.name || '') + '" placeholder="请输入商品名称"></div>' +
      '<div class="field"><label>分类</label><select class="select" id="gCategory">' + ['镜片', '镜架', '护理品', '药品', '服务', '其他'].map(function (c) { return '<option' + (p.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>品牌</label><input class="input" id="gBrand" value="' + esc(p.brand || '') + '"></div>' +
      '<div class="field"><label>单价（元）</label><input class="input" type="number" id="gPrice" value="' + (p.price || 0) + '" min="0"></div>' +
      '<div class="field"><label>库存数量</label><input class="input" type="number" id="gStock" value="' + (p.stock == null ? 0 : p.stock) + '" min="0"></div>' +
      '<div class="field"><label>单位</label><input class="input" id="gUnit" value="' + esc(p.unit || '件') + '"></div>' +
      '<div class="field"><label>状态</label><select class="select" id="gStatus">' + ['在售', '停售'].map(function (s) { return '<option' + (p.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
      '</div>';
  }
  function readProductForm(root) {
    var g = function (id) { return $(id, root).value.trim(); };
    return { name: g('#gName'), category: g('#gCategory'), brand: g('#gBrand'), price: Number(g('#gPrice')) || 0,
      stock: Number(g('#gStock')) || 0, unit: g('#gUnit'), status: g('#gStatus') };
  }

  /* 收费管理 */
  function viewBills() {
    var list = S.get('bills');
    var total = list.filter(function (b) { return b.status === '已支付'; }).reduce(function (s, b) { return s + b.total; }, 0);
    var unpaid = list.filter(function (b) { return b.status === '待支付'; }).reduce(function (s, b) { return s + b.total; }, 0);
    return pageHead('收费管理', '开单收费、支付状态跟踪与营收统计。',
      '<button class="btn btn-primary" data-act="new-bill">' + Icon.plus + ' 新建收费单</button>') +
      '<div class="stat-grid">' +
        statCard('累计营收', money(total), 'money', '#0d9488', '#ccfbf1', { text: '已支付金额合计' }) +
        statCard('待收款', money(unpaid), 'clock', '#d97706', '#fef3c7', { text: '待支付订单金额' }) +
        statCard('收费单量', list.length, 'receipt', '#2563eb', '#dbeafe', { text: '累计开单数量' }) +
        statCard('平均客单价', money(list.length ? Math.round(total / list.length) : 0), 'chart', '#7c3aed', '#ede9fe', { text: '按已支付订单计算' }) +
      '</div>' +
      '<div class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>单号</th><th>患者</th><th>开单日期</th><th>收费项目</th><th>金额</th><th>支付方式</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      (list.length ? list.map(function (b) {
        return '<tr><td class="tiny muted">' + esc(b.id) + '</td><td class="strong">' + esc(patientName(b.patientId)) + '</td>' +
          '<td>' + esc(b.date) + '</td><td class="tiny">' + esc(b.items.map(function (i) { return i.name + '×' + i.qty; }).join('、')) + '</td>' +
          '<td class="strong">' + money(b.total) + '</td><td>' + esc(b.payMethod || '-') + '</td><td>' + statusBadge(b.status) + '</td>' +
          '<td><div class="table-actions">' +
          (b.status === '待支付' ? '<button class="link-btn" data-act="pay-bill" data-id="' + b.id + '">标记收款</button>' : '') +
          '<button class="link-btn" data-act="view-bill" data-id="' + b.id + '">详情</button>' +
          '<button class="link-btn red" data-act="del-bill" data-id="' + b.id + '">删除</button></div></td></tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty"><div class="big">🧾</div>暂无收费单</div></td></tr>') +
      '</tbody></table></div></div>';
  }

  function billForm() {
    var products = S.get('products').filter(function (p) { return p.status === '在售'; });
    return '<div class="form-grid">' +
      '<div class="field"><label>患者 *</label><select class="select" id="bPatient">' + S.get('patients').map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>开单日期</label><input class="input" type="date" id="bDate" value="' + S.today() + '"></div>' +
      '<div class="field"><label>支付方式</label><select class="select" id="bPay"><option>微信</option><option>支付宝</option><option>现金</option><option>银行卡</option></select></div>' +
      '<div class="field"><label>收费状态</label><select class="select" id="bStatus"><option>已支付</option><option>待支付</option></select></div>' +
      '</div><div class="section-title">收费项目</div>' +
      '<div id="billItems">' + billItemRow(products) + '</div>' +
      '<button class="btn btn-sm" id="addBillItem" style="margin-top:10px">' + Icon.plus + ' 添加项目</button>' +
      '<div style="margin-top:16px;text-align:right;font-size:15px">合计：<b id="billTotal" style="color:#0d9488;font-size:22px">¥0</b></div>';
  }
  function billItemRow(products) {
    return '<div class="bill-row" style="display:grid;grid-template-columns:1fr 80px 70px 30px;gap:8px;margin-bottom:8px">' +
      '<select class="select bill-product">' + products.map(function (p) { return '<option value="' + esc(p.name) + '" data-price="' + p.price + '">' + esc(p.name) + '（' + money(p.price) + '）</option>'; }).join('') + '</select>' +
      '<input class="input bill-qty" type="number" value="1" min="1">' +
      '<input class="input bill-price" type="number" value="' + (products[0] ? products[0].price : 0) + '" min="0">' +
      '<button class="btn btn-sm btn-danger bill-del">×</button></div>';
  }
  function readBillForm(root) {
    var items = $$('.bill-row', root).map(function (r) {
      return { name: $('.bill-product', r).value, qty: Number($('.bill-qty', r).value) || 1, price: Number($('.bill-price', r).value) || 0 };
    });
    return { patientId: $('#bPatient', root).value, date: $('#bDate', root).value, payMethod: $('#bPay', root).value,
      status: $('#bStatus', root).value, items: items, total: items.reduce(function (s, i) { return s + i.price * i.qty; }, 0) };
  }
  function updateBillTotal(root) {
    var total = $$('.bill-row', root).reduce(function (s, r) {
      return s + (Number($('.bill-qty', r).value) || 0) * (Number($('.bill-price', r).value) || 0);
    }, 0);
    $('#billTotal', root).textContent = money(total);
  }
  function viewBillDetail(id) {
    var b = S.find('bills', id);
    if (!b) return;
    var body = '<div class="detail-grid" style="margin-bottom:16px">' +
      [['单号', b.id], ['患者', patientName(b.patientId)], ['日期', b.date], ['状态', b.status], ['支付方式', b.payMethod || '-'], ['合计', money(b.total)]]
        .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="section-title" style="margin-top:0">收费明细</div>' +
      '<table class="data-table"><thead><tr><th>项目</th><th>单价</th><th>数量</th><th>小计</th></tr></thead><tbody>' +
      b.items.map(function (i) { return '<tr><td>' + esc(i.name) + '</td><td>' + money(i.price) + '</td><td>' + i.qty + '</td><td class="strong">' + money(i.price * i.qty) + '</td></tr>'; }).join('') +
      '</tbody></table>';
    openModal({ title: '收费单详情', body: body, okText: '关闭', onOk: function () {} });
  }

  /* 医生管理 */
  function viewDoctors() {
    var list = S.get('doctors');
    return pageHead('医生管理', '出诊医师信息、专长与挂号费用维护。',
      '<button class="btn btn-primary" data-act="new-doctor">' + Icon.plus + ' 新增医生</button>') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' +
      list.map(function (d) {
        var count = S.get('appointments').filter(function (a) { return a.doctorId === d.id; }).length;
        return '<div class="card" style="padding:20px">' +
          '<div class="row" style="margin-bottom:14px"><div class="avatar" style="width:52px;height:52px;background:' + d.color + ';font-size:18px">' + esc(d.name.charAt(0)) + '</div>' +
          '<div class="grow"><div style="font-size:16px;font-weight:800">' + esc(d.name) + '</div><div class="tiny muted">' + esc(d.title) + ' · ' + esc(d.dept) + '</div></div>' + '<span class="badge success"><i class="dot"></i>在诊</span>' + '</div>' +
          '<div class="tiny muted" style="min-height:20px">' + esc(d.specialty) + '</div>' +
          '<div class="row wrap" style="margin:10px 0">' + d.tags.map(function (t) { return '<span class="badge info">' + esc(t) + '</span>'; }).join('') + '</div>' +
          '<div class="spread" style="border-top:1px dashed var(--border);padding-top:12px">' +
          '<span class="tiny muted">挂号费 <b style="color:var(--text);font-size:14px">' + money(d.fee) + '</b></span>' +
          '<span class="tiny muted">累计预约 <b style="color:var(--text);font-size:14px">' + count + '</b></span></div>' +
          '<div class="row" style="margin-top:12px"><button class="btn btn-sm grow" data-act="edit-doctor" data-id="' + d.id + '">编辑信息</button>' +
          '<button class="btn btn-sm btn-danger" data-act="del-doctor" data-id="' + d.id + '">删除</button></div>' +
          '</div>';
      }).join('') + '</div>';
  }
  function doctorForm(d) {
    d = d || {};
    return '<div class="form-grid">' +
      '<div class="field"><label>姓名 *</label><input class="input" id="dName" value="' + esc(d.name || '') + '"></div>' +
      '<div class="field"><label>职称</label><select class="select" id="dTitle">' + ['主任医师', '副主任医师', '主治医师', '住院医师', '验光师'].map(function (t) { return '<option' + (d.title === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>科室</label><select class="select" id="dDept">' + ['眼科门诊', '验光中心', '儿童眼科', '视光中心'].map(function (t) { return '<option' + (d.dept === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>从业年限</label><input class="input" type="number" id="dYears" value="' + (d.years || 0) + '"></div>' +
      '<div class="field"><label>挂号费（元）</label><input class="input" type="number" id="dFee" value="' + (d.fee || 0) + '"></div>' +
      '<div class="field"><label>性别</label><select class="select" id="dWomen"><option value="false"' + (!d.women ? ' selected' : '') + '>男</option><option value="true"' + (d.women ? ' selected' : '') + '>女</option></select></div>' +
      '<div class="field full"><label>专业特长</label><input class="input" id="dSpecialty" value="' + esc(d.specialty || '') + '"></div>' +
      '<div class="field full"><label>标签（用逗号分隔）</label><input class="input" id="dTags" value="' + esc((d.tags || []).join(',')) + '"></div>' +
      '</div>';
  }
  function readDoctorForm(root) {
    var g = function (id) { return $(id, root).value.trim(); };
    return { name: g('#dName'), title: g('#dTitle'), dept: g('#dDept'), years: Number(g('#dYears')) || 0, fee: Number(g('#dFee')) || 0,
      women: $('#dWomen', root).value === 'true', specialty: g('#dSpecialty'),
      tags: g('#dTags').split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean), color: '#0d9488' };
  }

  /* 报表统计 */
  function viewReports() {
    var bills = S.get('bills').filter(function (b) { return b.status === '已支付'; });
    var appts = S.get('appointments');
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var dt = new Date(); dt.setMonth(dt.getMonth() - i);
      var key = dt.getFullYear() + '-' + (dt.getMonth() + 1 < 10 ? '0' : '') + (dt.getMonth() + 1);
      var sum = bills.filter(function (b) { return b.date.slice(0, 7) === key; }).reduce(function (s, b) { return s + b.total; }, 0);
      months.push({ label: (dt.getMonth() + 1) + '月', value: sum });
    }
    var typeMap = {};
    appts.forEach(function (a) { typeMap[a.type] = (typeMap[a.type] || 0) + 1; });
    var typeData = Object.keys(typeMap).map(function (k) { return { label: k, value: typeMap[k] }; }).sort(function (a, b) { return b.value - a.value; });
    var doctorStats = S.get('doctors').map(function (d) {
      var mine = appts.filter(function (a) { return a.doctorId === d.id; });
      return { d: d, total: mine.length, done: mine.filter(function (a) { return a.status === '已完成' || a.status === '已就诊'; }).length };
    });
    var patients = S.get('patients');
    var ageGroups = [{ label: '0-12岁', n: 0 }, { label: '13-18岁', n: 0 }, { label: '19-40岁', n: 0 }, { label: '41-60岁', n: 0 }, { label: '60岁以上', n: 0 }];
    patients.forEach(function (p) {
      var a = p.age;
      if (a <= 12) ageGroups[0].n++; else if (a <= 18) ageGroups[1].n++; else if (a <= 40) ageGroups[2].n++; else if (a <= 60) ageGroups[3].n++; else ageGroups[4].n++;
    });
    return pageHead('报表统计', '营收趋势、预约分布与患者结构的经营分析。') +
      '<div class="dash-grid">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>近 6 个月营收趋势</div><span class="tiny muted">单位：元</span></div><div class="panel-body">' + barChart(months) + '</div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>预约项目分布</div></div><div class="panel-body">' + barChart(typeData) + '</div></div>' +
      '</div>' +
      '<div class="dash-grid-2">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>医生接诊量</div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>医生</th><th>职称</th><th>预约总数</th><th>已完成</th><th>完成率</th></tr></thead><tbody>' +
        doctorStats.map(function (x) {
          return '<tr><td class="strong">' + esc(x.d.name) + '</td><td>' + esc(x.d.title) + '</td><td>' + x.total + '</td><td>' + x.done + '</td>' +
            '<td><span class="badge ' + (x.total && x.done / x.total > .6 ? 'success' : 'warning') + '">' + (x.total ? Math.round(x.done / x.total * 100) : 0) + '%</span></td></tr>';
        }).join('') + '</tbody></table></div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>患者年龄结构</div></div><div class="panel-body">' + barChart(ageGroups.map(function (g) { return { label: g.label, value: g.n }; })) + '</div></div>' +
      '</div>';
  }

  /* 系统设置 */
  function viewSettings() {
    var s = S.get('settings');
    return pageHead('系统设置', '门诊基础信息维护与本地数据管理。') +
      '<div class="dash-grid-2">' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>门诊基础信息</div></div><div class="panel-body">' +
          '<div class="col">' +
            fld('门诊名称', 'sName', s.clinicName) +
            fld('联系电话', 'sPhone', s.phone) +
            fld('门诊地址', 'sAddress', s.address) +
            fld('营业时间', 'sHours', s.hours) +
            fld('宣传标语', 'sNotice', s.notice) +
            '<button class="btn btn-primary" data-act="save-settings" style="align-self:flex-start">' + Icon.check + ' 保存信息</button>' +
          '</div></div></div>' +
        '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bar"></i>数据管理</div></div><div class="panel-body">' +
          '<div class="m-diag" style="margin-bottom:14px"><b>存储方式：</b>浏览器本地存储（localStorage），无需服务器，刷新页面数据不丢失。</div>' +
          '<div class="col">' +
            '<button class="btn" data-act="export-data">' + Icon.download + ' 导出全部数据（JSON）</button>' +
            '<button class="btn" data-act="reset-data">' + Icon.refresh + ' 重置为演示数据</button>' +
            '<div class="tiny muted">提示：小程序客户端与 PC 管理端在同源浏览器中共享数据。若使用 file:// 直接打开，两端数据可能各自独立。</div>' +
          '</div>' +
          '<div class="section-title">系统信息</div>' +
          '<div class="detail-grid">' +
            [['系统版本', 'v' + s.version], ['患者档案', S.get('patients').length + ' 条'], ['预约记录', S.get('appointments').length + ' 条'],
              ['诊疗记录', S.get('records').length + ' 条'], ['收费单据', S.get('bills').length + ' 条'], ['商品数量', S.get('products').length + ' 条']]
              .map(function (x) { return '<div class="detail-item"><span class="k">' + x[0] + '</span><span class="v">' + esc(x[1]) + '</span></div>'; }).join('') +
          '</div>' +
        '</div></div>' +
      '</div>';
  }
  function fld(label, id, val) {
    return '<div class="field"><label>' + label + '</label><input class="input" id="' + id + '" value="' + esc(val || '') + '"></div>';
  }

  /* ---------- 事件绑定 ---------- */
  function bindPage() {
    $$('[data-nav-mini]').forEach(function (b) { b.onclick = function () { go(b.dataset.navMini); }; });
    var apptSearch = $('#apptSearch'); if (apptSearch) apptSearch.oninput = function () { state.aQuery = this.value; renderPage(); $('#apptSearch').focus(); };
    var pSearch = $('#patientSearch'); if (pSearch) pSearch.oninput = function () { state.pQuery = this.value; renderPage(); $('#patientSearch').focus(); };
    var rSearch = $('#recordSearch'); if (rSearch) rSearch.oninput = function () { state.rQuery = this.value; renderPage(); $('#recordSearch').focus(); };
    var gSearch = $('#productSearch'); if (gSearch) gSearch.oninput = function () { state.gQuery = this.value; renderPage(); $('#productSearch').focus(); };
    var statusFilter = $('#apptStatus'); if (statusFilter) {
      statusFilter.value = state.aStatus || '';
      statusFilter.onchange = function () { state.aStatus = this.value; var q = state.aQuery; var self = this;
        var rows = $$('#pageArea table tbody tr');
        rows.forEach(function (tr) { var txt = tr.children[5] ? tr.children[5].textContent : ''; tr.style.display = (!self.value || txt.indexOf(self.value) >= 0) ? '' : 'none'; });
      };
    }

    $$('[data-act]').forEach(function (btn) { btn.onclick = function () { handleAct(btn.dataset.act, btn.dataset.id); }; });
  }

  function handleAct(act, id) {
    switch (act) {
      case 'new-appt': editAppt(null); break;
      case 'edit-appt': editAppt(S.find('appointments', id)); break;
      case 'finish-appt': S.update('appointments', id, { status: '已完成' }); toast('已标记为完成'); renderPage(); break;
      case 'del-appt': confirmBox('确定删除该预约记录吗？此操作不可恢复。', function () { S.remove('appointments', id); toast('预约已删除'); renderPage(); }); break;

      case 'new-patient': editPatient(null); break;
      case 'edit-patient': editPatient(S.find('patients', id)); break;
      case 'view-patient': viewPatientDetail(id); break;
      case 'del-patient': confirmBox('确定删除该患者档案吗？相关就诊记录仍会保留。', function () { S.remove('patients', id); toast('档案已删除'); renderPage(); }); break;

      case 'new-record': editRecord(null); break;
      case 'edit-record': editRecord(S.find('records', id)); break;
      case 'view-record': viewRecordDetail(id); break;
      case 'del-record': confirmBox('确定删除该诊疗记录吗？', function () { S.remove('records', id); toast('记录已删除'); renderPage(); }); break;

      case 'new-product': editProduct(null); break;
      case 'edit-product': editProduct(S.find('products', id)); break;
      case 'del-product': confirmBox('确定删除该商品吗？', function () { S.remove('products', id); toast('商品已删除'); renderPage(); }); break;

      case 'new-bill': newBill(); break;
      case 'pay-bill': S.update('bills', id, { status: '已支付', payMethod: '微信' }); toast('已确认收款'); renderPage(); break;
      case 'view-bill': viewBillDetail(id); break;
      case 'del-bill': confirmBox('确定删除该收费单吗？', function () { S.remove('bills', id); toast('收费单已删除'); renderPage(); }); break;

      case 'new-doctor': editDoctor(null); break;
      case 'edit-doctor': editDoctor(S.find('doctors', id)); break;
      case 'del-doctor': confirmBox('确定删除该医生信息吗？', function () { S.remove('doctors', id); toast('医生已删除'); renderPage(); }); break;

      case 'save-settings':
        S.set('settings', {
          clinicName: $('#sName').value.trim(), phone: $('#sPhone').value.trim(), address: $('#sAddress').value.trim(),
          hours: $('#sHours').value.trim(), notice: $('#sNotice').value.trim(), version: '1.0.0'
        });
        toast('门诊信息已保存'); renderPage(); break;
      case 'export-data': exportData(); break;
      case 'reset-data':
        confirmBox('确定重置所有演示数据吗？您新增的数据将被清除。', function () {
          S.reset(); toast('演示数据已重置'); renderPage();
        }); break;
    }
  }

  function exportData() {
    var keys = ['doctors', 'patients', 'appointments', 'records', 'products', 'bills', 'notices', 'settings'];
    var data = {}; keys.forEach(function (k) { data[k] = S.get(k); });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '视力门诊数据_' + S.today() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('数据已导出');
  }

  function editAppt(a) {
    openModal({ title: a ? '编辑预约' : '新建预约', body: apptForm(a), width: 620,
      onOk: function (root) {
        var data = readApptForm(root);
        if (!data.date || !data.time) { toast('请填写完整的日期与时间', 'err'); return false; }
        if (a) { S.update('appointments', a.id, data); toast('预约已更新'); }
        else { S.add('appointments', Object.assign({ id: S.nextId('A'), createdAt: S.today() }, data)); toast('预约创建成功'); }
        renderPage();
      } });
  }
  function editPatient(p) {
    openModal({ title: p ? '编辑患者档案' : '新建患者档案', body: patientForm(p), width: 620,
      onOk: function (root) {
        var data = readPatientForm(root);
        if (!data.name) { toast('请输入患者姓名', 'err'); return false; }
        if (p) { S.update('patients', p.id, data); toast('档案已更新'); }
        else { S.add('patients', Object.assign({ id: S.nextId('P') }, data)); toast('档案创建成功'); }
        renderPage();
      } });
  }
  function editRecord(r) {
    openModal({ title: r ? '编辑诊疗记录' : '新增诊疗记录', body: recordForm(r), width: 720,
      onOk: function (root) {
        var data = readRecordForm(root);
        if (!data.diagnosis) { toast('请填写诊断结果', 'err'); return false; }
        if (r) { S.update('records', r.id, data); toast('记录已更新'); }
        else { S.add('records', Object.assign({ id: S.nextId('R') }, data)); toast('记录已保存'); }
        renderPage();
      } });
  }
  function editProduct(p) {
    openModal({ title: p ? '编辑商品' : '新增商品', body: productForm(p),
      onOk: function (root) {
        var data = readProductForm(root);
        if (!data.name) { toast('请输入商品名称', 'err'); return false; }
        if (p) { S.update('products', p.id, data); toast('商品已更新'); }
        else { S.add('products', Object.assign({ id: S.nextId('G') }, data)); toast('商品已添加'); }
        renderPage();
      } });
  }
  function editDoctor(d) {
    openModal({ title: d ? '编辑医生信息' : '新增医生', body: doctorForm(d),
      onOk: function (root) {
        var data = readDoctorForm(root);
        if (!data.name) { toast('请输入医生姓名', 'err'); return false; }
        if (d) { S.update('doctors', d.id, data); toast('医生信息已更新'); }
        else { S.add('doctors', Object.assign({ id: S.nextId('D') }, data)); toast('医生已添加'); }
        renderPage();
      } });
  }
  function newBill() {
    openModal({ title: '新建收费单', body: billForm(), width: 680,
      onOpen: function (root) {
        var products = S.get('products');
        $$('.bill-row', root).forEach(bindBillRow);
        function bindBillRow(row) {
          $('.bill-product', row).onchange = function () {
            var opt = this.options[this.selectedIndex]; $('.bill-price', row).value = opt.dataset.price || 0; updateBillTotal(root); };
          $('.bill-qty', row).oninput = updateBillTotal.bind(null, root);
          $('.bill-price', row).oninput = updateBillTotal.bind(null, root);
          $('.bill-del', row).onclick = function () { row.remove(); updateBillTotal(root); };
        }
        $('#addBillItem', root).onclick = function () {
          var div = document.createElement('div'); div.innerHTML = billItemRow(products);
          var row = div.firstChild; $('#billItems', root).appendChild(row); bindBillRow(row); updateBillTotal(root);
        };
        updateBillTotal(root);
      },
      onOk: function (root) {
        var data = readBillForm(root);
        if (!data.items.length || data.total <= 0) { toast('请添加有效的收费项目', 'err'); return false; }
        S.add('bills', Object.assign({ id: S.nextId('B') }, data)); toast('收费单创建成功'); renderPage();
      } });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $('#loginLogo').innerHTML = Icon.eye;
    $('#brandMark').innerHTML = Icon.eye;
    $('#topSearchIcon').innerHTML = Icon.search;
    $('#bellIcon').innerHTML = Icon.bell;
    $('#resetIcon').innerHTML = Icon.refresh;

    $('#loginBtn').onclick = function () {
      if (!$('#loginUser').value.trim() || !$('#loginPwd').value.trim()) { toast('请输入账号和密码', 'err'); return; }
      $('#loginPage').classList.add('hide'); $('#app').classList.remove('hide'); renderPage();
    };
    $('#loginPwd').onkeydown = function (e) { if (e.key === 'Enter') $('#loginBtn').click(); };
    $('#bellBtn').onclick = function () {
      var today = S.today();
      var wait = S.get('appointments').filter(function (a) { return a.date === today && a.status === '待就诊'; });
      var low = S.get('products').filter(function (p) { return p.stock < 15; });
      openModal({ title: '消息通知', width: 480, okText: '知道了',
        body: '<div class="m-diag" style="margin-bottom:12px"><b>今日待就诊：</b>' + wait.length + ' 人</div>' +
          '<div class="m-diag" style="background:#fef3c7;color:#92400e"><b>库存预警：</b>' + low.length + ' 个商品库存低于 15' + (low.length ? '（' + low.map(function (p) { return esc(p.name); }).join('、') + '）' : '') + '</div>',
        onOk: function () {} });
    };
    $('#resetBtn').onclick = function () {
      confirmBox('确定重置所有演示数据吗？您新增的数据将被清除。', function () {
        S.reset(); state.aQuery = state.pQuery = state.rQuery = state.gQuery = ''; toast('演示数据已重置'); renderPage();
      });
    };
    $('#globalSearch').oninput = function () {
      var v = this.value.trim(); if (!v) return;
      state.pQuery = v; go('patients'); $('#patientSearch').value = v; $('#patientSearch').focus();
    };
    renderNav();
  }
  init();
})();

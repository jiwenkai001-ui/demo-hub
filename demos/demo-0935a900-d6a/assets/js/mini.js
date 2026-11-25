/* ============================================================
 * 视力门诊管理系统 - 客户端小程序逻辑
 * ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = Store.escape;
  var S = Store;

  var TABS = [
    { id: 'home', name: '首页', icon: 'home', title: '明眸视力门诊', sub: '守护每一双明亮的眼睛' },
    { id: 'book', name: '预约', icon: 'calendar', title: '预约挂号', sub: '选择医生与时间，快速就诊' },
    { id: 'test', name: '自测', icon: 'activity', title: '视力自测', sub: '简单五题，初步了解视力状况' },
    { id: 'report', name: '报告', icon: 'file', title: '检查报告', sub: '查看历史检查与验光数据' },
    { id: 'me', name: '我的', icon: 'user', title: '个人中心', sub: '就诊人与系统设置' }
  ];
  var state = { tab: 'home', date: S.today(), doctor: '', time: '09:00', type: '医学验光',
    eye: 'L', round: 0, correct: 0, dir: 0, result: null };
  var DIRS = ['右', '下', '左', '上'];
  var ROT = { '右': 0, '下': 90, '左': 180, '上': 270 };
  var ARROWS = [{ key: '上', glyph: '↑', rot: 270 }, { key: '下', glyph: '↓', rot: 90 },
    { key: '左', glyph: '←', rot: 180 }, { key: '右', glyph: '→', rot: 0 }];

  function me() {
    var id = S.get('currentPatient');
    var p = S.find('patients', id);
    if (!p) { p = S.get('patients')[0]; if (p) S.set('currentPatient', p.id); }
    return p;
  }
  function toast(msg, type) {
    var box = $('#toastBox'); var el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok'); el.textContent = msg; box.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }
  function statusBadge(s) {
    var map = { '待就诊': 'warning', '已预约': 'info', '已完成': 'success', '已就诊': 'success', '已取消': 'gray' };
    return '<span class="badge ' + (map[s] || 'gray') + '">' + esc(s) + '</span>';
  }
  function sheet(title, body, foot) {
    var root = $('#sheetRoot');
    root.innerHTML = '<div class="m-sheet-mask" id="curSheetMask"><div class="m-sheet">' +
      '<div class="spread" style="margin-bottom:14px"><h3>' + esc(title) + '</h3><button class="modal-close" id="sheetClose">×</button></div>' +
      body + (foot || '') + '</div></div>';
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
    $('#miniScroll').scrollTop = 0;
    render();
  }

  function render() {
    var f = { home: renderHome, book: renderBook, test: renderTest, report: renderReport, me: renderMe }[state.tab];
    if (f) { $('#page-' + state.tab).innerHTML = f(); bind(); }
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var p = me();
    var appts = S.get('appointments').filter(function (a) { return p && a.patientId === p.id; });
    var recs = S.get('records').filter(function (r) { return p && r.patientId === p.id; });
    var quick = [
      { id: 'book', name: '预约挂号', icon: 'calendar', bg: '#ccfbf1', color: '#0f766e' },
      { id: 'test', name: '视力自测', icon: 'activity', bg: '#dbeafe', color: '#1d4ed8' },
      { id: 'report', name: '检查报告', icon: 'file', bg: '#ede9fe', color: '#6d28d9' },
      { id: 'me', name: '我的档案', icon: 'user', bg: '#fef3c7', color: '#b45309' }
    ];
    return '<div class="m-hero">' +
        '<div style="font-size:12px;color:#ccfbf1">您好，' + esc(p ? p.name : '访客') + ' 👋</div>' +
        '<h3>' + esc(S.get('settings').notice || '爱护眼睛，从我做起') + '</h3>' +
        '<div class="hero-stats">' +
          '<div class="hero-stat"><b>' + appts.length + '</b><span>我的预约</span></div>' +
          '<div class="hero-stat"><b>' + recs.length + '</b><span>检查报告</span></div>' +
          '<div class="hero-stat"><b>' + S.get('doctors').length + '</b><span>在诊医生</span></div>' +
        '</div></div>' +
      '<div class="m-section"><div class="m-quick">' + quick.map(function (q) {
        return '<button class="q-item" data-go="' + q.id + '"><div class="q-icon" style="background:' + q.bg + ';color:' + q.color + '">' + Icon[q.icon] + '</div><div class="q-name">' + q.name + '</div></button>';
      }).join('') + '</div></div>' +
      '<div class="m-section"><div class="m-section-title"><h4>推荐医生</h4><span data-go="book">去预约 →</span></div>' +
        S.get('doctors').slice(0, 3).map(function (d) {
          return '<div class="m-doctor" data-doc="' + d.id + '"><div class="avatar" style="background:' + d.color + '">' + esc(d.name.charAt(0)) + '</div>' +
            '<div class="grow"><div style="font-size:14px;font-weight:800">' + esc(d.name) + ' <span style="font-size:11px;color:#64748b;font-weight:600">' + esc(d.title) + '</span></div>' +
            '<div class="tiny muted">' + esc(d.specialty) + '</div></div>' +
            '<div style="text-align:right"><div style="color:#0d9488;font-weight:800;font-size:13px">' + S.money(d.fee) + '</div><div class="tiny muted">挂号费</div></div></div>';
        }).join('') + '</div>' +
      '<div class="m-section"><div class="m-section-title"><h4>门诊公告</h4><span>最新消息</span></div>' +
        S.get('notices').slice(0, 3).map(function (n) {
          return '<div class="m-notice" data-notice="' + n.id + '"><div class="nt">' + esc(n.title) + '</div>' +
            '<div class="nd">' + esc(n.date) + ' · 点击查看详细内容</div></div>';
        }).join('') + '</div>';
  }

  /* ---------- 预约 ---------- */
  function renderBook() {
    var p = me();
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var dt = new Date(); dt.setDate(dt.getDate() + i);
      var w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];
      var val = dt.getFullYear() + '-' + (dt.getMonth() + 1 < 10 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
      dates.push({ val: val, d: (dt.getDate() < 10 ? '0' : '') + dt.getDate(), w: i === 0 ? '今天' : i === 1 ? '明天' : '周' + w });
    }
    var docs = S.get('doctors');
    if (!state.doctor) state.doctor = docs[0] ? docs[0].id : '';
    var times = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    var mine = S.get('appointments').filter(function (a) { return p && a.patientId === p.id; });
    var types = ['医学验光', '近视复查', '视力筛查', '儿童眼科', '干眼诊疗', '配镜咨询'];
    return '<div class="m-form-card">' +
        '<div class="m-field"><label>就诊日期</label><div class="m-date-row">' + dates.map(function (x) {
          return '<button class="m-date-chip' + (state.date === x.val ? ' active' : '') + '" data-date="' + x.val + '"><div class="w">' + x.w + '</div><div class="d">' + x.d + '</div></button>';
        }).join('') + '</div></div>' +
        '<div class="m-field"><label>选择医生</label><select class="select" id="bookDoctor">' + docs.map(function (d) {
          return '<option value="' + d.id + '"' + (state.doctor === d.id ? ' selected' : '') + '>' + esc(d.name) + ' · ' + esc(d.title) + '（' + esc(d.dept) + '）</option>';
        }).join('') + '</select></div>' +
        '<div class="m-field"><label>就诊时段</label><div class="m-slot-grid">' + times.map(function (t) {
          return '<button class="m-slot' + (state.time === t ? ' active' : '') + '" data-time="' + t + '">' + t + '</button>';
        }).join('') + '</div></div>' +
        '<div class="m-field"><label>预约项目</label><select class="select" id="bookType">' + types.map(function (t) {
          return '<option' + (state.type === t ? ' selected' : '') + '>' + t + '</option>';
        }).join('') + '</select></div>' +
        '<div class="m-field" style="margin-bottom:0"><label>就诊人：<b style="color:#0d9488">' + esc(p ? p.name : '请先建档') + '</b></label></div>' +
        '<button class="btn btn-primary btn-block btn-lg" id="submitBook" style="margin-top:6px">提交预约</button>' +
      '</div>' +
      '<div class="m-section"><div class="m-section-title"><h4>我的预约</h4><span>共 ' + mine.length + ' 条</span></div>' +
        (mine.length ? mine.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (a) {
          var d = S.find('doctors', a.doctorId);
          return '<div class="m-appt-card"><div class="m-appt-top"><span class="doc">' + esc(d ? d.name : '-') + ' 医生</span>' + statusBadge(a.status) + '</div>' +
            '<div class="m-appt-info">' +
              '<div><div class="k">就诊时间</div><div class="v">' + esc(a.date) + ' ' + esc(a.time) + '</div></div>' +
              '<div><div class="k">预约项目</div><div class="v">' + esc(a.type) + '</div></div>' +
            '</div>' +
            (a.status === '已预约' || a.status === '待就诊' ? '<button class="btn btn-sm btn-danger btn-block" style="margin-top:10px" data-cancel="' + a.id + '">取消预约</button>' : '') +
            '</div>';
        }).join('') : '<div class="m-card" style="text-align:center;color:#94a3b8;padding:26px;font-size:13px">暂无预约记录，快去预约吧</div>') +
      '</div>';
  }

  /* ---------- 视力自测 ---------- */
  function renderTest() {
    if (state.result) {
      var r = state.result;
      var title = r.acc >= 4 ? '视力表现良好' : r.acc >= 3 ? '视力略有下降' : '建议到院检查';
      var color = r.acc >= 4 ? '#059669' : r.acc >= 3 ? '#d97706' : '#dc2626';
      return '<div class="m-test-result">' +
        '<div style="font-size:44px">' + (r.acc >= 4 ? '👏' : r.acc >= 3 ? '👀' : '⚠️') + '</div>' +
        '<h3 style="font-size:19px;margin:8px 0;color:' + color + '">' + title + '</h3>' +
        '<div style="font-size:13px;color:#64748b">答对 ' + r.acc + ' / 5 题 · 正确率 ' + Math.round(r.acc / 5 * 100) + '%</div>' +
        '<div class="m-diag" style="margin-top:16px;text-align:left"><b>自测建议：</b>' + esc(r.advice) + '</div>' +
        '<div class="tiny muted" style="margin-top:10px">* 本测试仅供初步参考，不作为医学诊断依据。</div>' +
        '<div class="row" style="margin-top:16px"><button class="btn grow" id="retest">再测一次</button>' +
        '<button class="btn btn-primary grow" id="goBook">预约检查</button></div></div>';
    }
    var rotation = ROT[DIRS[state.dir]];
    var eyeName = state.eye === 'L' ? '左眼' : '右眼';
    return '<div class="m-test-hero"><h3>请辨认 E 字开口方向</h3><p>请遮挡另一只眼睛，选择你看到的方向</p></div>' +
      '<div class="eye-row"><button class="eye-toggle' + (state.eye === 'L' ? ' active' : '') + '" data-eye="L">左眼</button>' +
      '<button class="eye-toggle' + (state.eye === 'R' ? ' active' : '') + '" data-eye="R">右眼</button></div>' +
      '<div style="text-align:center;font-size:12px;color:#64748b;margin-bottom:10px">第 ' + (state.round + 1) + ' / 5 题 · ' + eyeName + '</div>' +
      '<div class="optotype-stage"><div class="glyph" style="transform:rotate(' + rotation + 'deg)">E</div></div>' +
      '<div class="answer-grid">' + ARROWS.map(function (a) {
        return '<button class="answer-btn" data-answer="' + a.key + '" style="transform:rotate(' + a.rot + 'deg)">' + a.glyph + '</button>';
      }).join('') + '</div>' +
      '<div style="text-align:center;font-size:11px;color:#94a3b8;padding:0 20px">保持 33cm 距离，光线充足环境下测试更准确</div>';
  }

  /* ---------- 检查报告 ---------- */
  function renderReport() {
    var recs = S.get('records').filter(function (r) { return me() && r.patientId === me().id; });
    return '<div style="padding:14px 14px 0"><div class="m-card" style="display:flex;align-items:center;gap:12px">' +
      '<div class="avatar" style="background:#0d9488">' + esc(me() ? me().name.charAt(0) : '?') + '</div>' +
      '<div class="grow"><div style="font-weight:800">' + esc(me() ? me().name : '未选择就诊人') + '</div>' +
      '<div class="tiny muted">' + (me() ? me().gender + ' · ' + me().age + ' 岁 · ' + me().phone : '') + '</div></div>' +
      '<button class="btn btn-sm" id="switchPatient">切换</button></div></div>' +
      '<div class="m-section"><div class="m-section-title"><h4>检查报告</h4><span>共 ' + recs.length + ' 份</span></div>' +
      (recs.length ? recs.map(function (r) {
        var d = S.find('doctors', r.doctorId);
        return '<div class="m-report-card" data-record="' + r.id + '">' +
          '<div class="m-report-head"><div><b style="font-size:13px">' + esc(r.date) + ' 检查报告</b>' +
          '<div class="tiny muted">' + esc(d ? d.name + ' · ' + d.title : '医师') + '</div></div>' + statusBadge('已完成') + '</div>' +
          '<div class="m-vision-row">' +
            '<div class="m-vision-cell"><div class="k">裸眼左</div><div class="v">' + esc(r.nakedL || '-') + '</div></div>' +
            '<div class="m-vision-cell"><div class="k">裸眼右</div><div class="v">' + esc(r.nakedR || '-') + '</div></div>' +
            '<div class="m-vision-cell"><div class="k">矫正左</div><div class="v">' + esc(r.correctedL || '-') + '</div></div>' +
            '<div class="m-vision-cell"><div class="k">矫正右</div><div class="v">' + esc(r.correctedR || '-') + '</div></div>' +
          '</div><div class="m-diag"><b>诊断：</b>' + esc(r.diagnosis) + '</div></div>';
      }).join('') : '<div class="m-card" style="text-align:center;color:#94a3b8;padding:32px;font-size:13px">暂无检查报告<br><button class="btn btn-sm btn-primary" style="margin-top:12px" id="emptyBook">去预约检查</button></div>') +
      '</div>';
  }

  function recordDetail(id) {
    var r = S.find('records', id); if (!r) return;
    var cell = function (k, v) { return '<div class="m-vision-cell"><div class="k">' + k + '</div><div class="v">' + esc(v || '-') + '</div></div>'; };
    var d = S.find('doctors', r.doctorId);
    sheet('检查报告详情', '<div class="tiny muted" style="margin-bottom:12px">' + esc(r.date) + ' · ' + esc(d ? d.name + ' ' + d.title : '') + '</div>' +
      '<div class="section-title" style="margin-top:0">视力检查</div><div class="m-vision-row">' +
      cell('裸眼左', r.nakedL) + cell('裸眼右', r.nakedR) + cell('矫正左', r.correctedL) + cell('矫正右', r.correctedR) + '</div>' +
      '<div class="section-title">验光数据（左 / 右）</div><div class="m-vision-row">' +
      cell('球镜', r.sphereL + ' / ' + r.sphereR) + cell('柱镜', r.cylinderL + ' / ' + r.cylinderR) + cell('轴位', r.axisL + ' / ' + r.axisR) + '</div>' +
      '<div class="section-title">诊断与医嘱</div>' +
      '<div class="m-diag"><b>诊断：</b>' + esc(r.diagnosis) + '</div>' +
      '<div style="font-size:13px;margin-top:10px"><b>处方：</b>' + esc(r.prescription || '-') + '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-top:8px"><b>医嘱：</b>' + esc(r.advice || '-') + '</div>',
      '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
    $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
  }

  /* ---------- 我的 ---------- */
  function renderMe() {
    var p = me();
    var menus = [
      { act: 'my-appt', name: '我的预约', icon: 'calendar', bg: '#ccfbf1', color: '#0f766e' },
      { act: 'my-report', name: '检查报告', icon: 'file', bg: '#dbeafe', color: '#1d4ed8' },
      { act: 'my-test', name: '视力自测', icon: 'activity', bg: '#ede9fe', color: '#6d28d9' },
      { act: 'switch', name: '切换就诊人', icon: 'users', bg: '#fef3c7', color: '#b45309' },
      { act: 'about', name: '关于门诊', icon: 'info', bg: '#f1f5f9', color: '#475569' },
      { act: 'reset', name: '重置演示数据', icon: 'refresh', bg: '#fee2e2', color: '#b91c1c' }
    ];
    var s = S.get('settings');
    return '<div class="m-profile-hero"><div class="avatar">' + esc(p ? p.name.charAt(0) : '?') + '</div>' +
      '<div><div class="nm">' + esc(p ? p.name : '未选择就诊人') + '</div>' +
      '<div class="sub">' + (p ? p.gender + ' · ' + p.age + ' 岁 · 档案号 ' + p.id : '请先在 PC 端建立档案') + '</div></div></div>' +
      '<div class="m-profile-card">' + menus.map(function (m) {
        return '<button class="m-menu-item" data-menu="' + m.act + '"><span class="ic" style="background:' + m.bg + ';color:' + m.color + '">' + Icon[m.icon] + '</span>' +
          '<span class="t">' + m.name + '</span><span class="arrow">' + Icon.chevron + '</span></button>';
      }).join('') + '</div>' +
      '<div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:11px">' + esc(s.clinicName) + ' · v' + s.version + '<br>纯前端演示版 · 数据保存在本机</div>';
  }

  function switchPatientSheet() {
    var list = S.get('patients');
    sheet('切换就诊人', list.length ? list.map(function (p) {
      return '<button class="m-menu-item" data-pick="' + p.id + '"><span class="ic" style="background:#ccfbf1;color:#0f766e">' + esc(p.name.charAt(0)) + '</span>' +
        '<span class="t">' + esc(p.name) + '<span class="tiny muted" style="display:block;font-weight:400">' + p.gender + ' · ' + p.age + ' 岁 · ' + esc(p.phone) + '</span></span>' +
        (me() && me().id === p.id ? '<span class="badge success">当前</span>' : '') + '</button>';
    }).join('') : '<div class="empty">暂无患者档案，请先在 PC 端建立</div>');
    $$('[data-pick]').forEach(function (b) { b.onclick = function () { S.set('currentPatient', b.dataset.pick); $('#sheetRoot').innerHTML = ''; toast('已切换就诊人'); render(); }; });
  }

  /* ---------- 事件 ---------- */
  function bind() {
    $$('[data-go]').forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
    $$('[data-doc]').forEach(function (b) { b.onclick = function () { state.doctor = b.dataset.doc; go('book'); }; });
    $$('[data-notice]').forEach(function (b) { b.onclick = function () {
      var n = S.find('notices', b.dataset.notice);
      sheet(n.title, '<div style="font-size:13px;line-height:1.9;color:#475569">' + esc(n.content) + '</div>' +
        '<div class="tiny muted" style="margin-top:14px">' + esc(n.date) + '</div>',
        '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
      $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
    }; });

    if (state.tab === 'book') {
      $$('[data-date]').forEach(function (b) { b.onclick = function () { state.date = b.dataset.date; render(); }; });
      $$('[data-time]').forEach(function (b) { b.onclick = function () { state.time = b.dataset.time; render(); }; });
      $('#bookDoctor').onchange = function () { state.doctor = this.value; };
      $('#bookType').onchange = function () { state.type = this.value; };
      $('#submitBook').onclick = function () {
        var p = me(); if (!p) { toast('请先在 PC 端建立患者档案', 'err'); return; }
        var exist = S.get('appointments').filter(function (a) {
          return a.patientId === p.id && a.date === state.date && a.time === state.time && a.status !== '已取消';
        });
        if (exist.length) { toast('该时段已有预约，请选择其他时间', 'err'); return; }
        S.add('appointments', { id: S.nextId('A'), patientId: p.id, doctorId: state.doctor, date: state.date,
          time: state.time, type: state.type, status: '待就诊', note: '小程序预约', createdAt: S.today() });
        toast('预约成功，请按时到院'); render();
      };
      $$('[data-cancel]').forEach(function (b) { b.onclick = function () {
        sheet('取消预约', '<div style="font-size:13px;color:#475569">确定要取消这条预约吗？取消后不可恢复。</div>',
          '<div class="row" style="margin-top:18px"><button class="btn grow" id="noCancel">再想想</button><button class="btn btn-danger grow" id="yesCancel">确认取消</button></div>');
        $('#noCancel').onclick = function () { $('#sheetRoot').innerHTML = ''; };
        $('#yesCancel').onclick = function () {
          S.update('appointments', b.dataset.cancel, { status: '已取消' }); $('#sheetRoot').innerHTML = ''; toast('预约已取消'); render();
        };
      }; });
    }

    if (state.tab === 'test') {
      if (state.result) {
        $('#retest').onclick = function () { state.result = null; state.round = 0; state.correct = 0; nextDir(); render(); };
        $('#goBook').onclick = function () { go('book'); };
      } else {
        $$('[data-eye]').forEach(function (b) { b.onclick = function () { state.eye = b.dataset.eye; state.round = 0; state.correct = 0; nextDir(); render(); }; });
        $$('[data-answer]').forEach(function (b) { b.onclick = function () {
          if (b.dataset.answer === DIRS[state.dir]) state.correct++;
          state.round++;
          if (state.round >= 5) {
            var a = state.correct;
            state.result = { acc: a, advice: a >= 4 ? '视力表现良好，建议继续保持良好用眼习惯，每半年复查一次。'
              : a >= 3 ? '视力可能有轻度下降，建议减少近距离用眼，安排到院进行医学验光。'
                : '自测结果提示视力可能受影响，建议尽快到院进行专业视力检查。' };
          } else nextDir();
          render();
        }; });
      }
    }

    if (state.tab === 'report') {
      $$('[data-record]').forEach(function (b) { b.onclick = function () { recordDetail(b.dataset.record); }; });
      var sw = $('#switchPatient'); if (sw) sw.onclick = switchPatientSheet;
      var eb = $('#emptyBook'); if (eb) eb.onclick = function () { go('book'); };
    }

    if (state.tab === 'me') {
      $$('[data-menu]').forEach(function (b) { b.onclick = function () {
        var act = b.dataset.menu;
        if (act === 'my-appt') go('book');
        else if (act === 'my-report') go('report');
        else if (act === 'my-test') go('test');
        else if (act === 'switch') switchPatientSheet();
        else if (act === 'about') {
          var s = S.get('settings');
          sheet('关于门诊', '<div style="font-size:13px;line-height:2;color:#475569">' +
            '<b style="color:#0f766e;font-size:15px">' + esc(s.clinicName) + '</b><br>' +
            '<div>' + Icon.pin + ' 地址：' + esc(s.address) + '</div>' +
            '<div>' + Icon.phone + ' 电话：' + esc(s.phone) + '</div>' +
            '<div>' + Icon.clock + ' 时间：' + esc(s.hours) + '</div></div>',
            '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
          $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
        } else if (act === 'reset') {
          sheet('重置数据', '<div style="font-size:13px;color:#475569">确定重置全部演示数据吗？此操作不可恢复。</div>',
            '<div class="row" style="margin-top:18px"><button class="btn grow" id="noReset">再想想</button><button class="btn btn-danger grow" id="yesReset">确认重置</button></div>');
          $('#noReset').onclick = function () { $('#sheetRoot').innerHTML = ''; };
          $('#yesReset').onclick = function () { S.reset(); S.set('currentPatient', 'P001'); $('#sheetRoot').innerHTML = ''; toast('数据已重置'); render(); };
        }
      }; });
    }
  }

  function nextDir() { state.dir = Math.floor(Math.random() * 4); }

  function init() {
    $('#miniTabs').innerHTML = TABS.map(function (t) {
      return '<button class="mini-tab' + (t.id === state.tab ? ' active' : '') + '" data-tab="' + t.id + '">' + Icon[t.icon] + '<span>' + t.name + '</span></button>';
    }).join('');
    $$('.mini-tab').forEach(function (b) { b.onclick = function () { go(b.dataset.tab); }; });
    $('#noticeBtn').innerHTML = Icon.bell;
    $('#helpBtn').innerHTML = Icon.info;
    $('#noticeBtn').onclick = function () {
      sheet('门诊公告', S.get('notices').map(function (n) {
        return '<div style="padding:10px 0;border-bottom:1px solid #f1f5f9"><div style="font-size:13px;font-weight:800">' + esc(n.title) + '</div>' +
          '<div class="tiny muted">' + esc(n.date) + '</div></div>';
      }).join(''), '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
      $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
    };
    $('#helpBtn').onclick = function () {
      sheet('使用说明', '<div style="font-size:13px;line-height:2;color:#475569">' +
        '1. 在「预约」页选择日期、医生与时段，提交预约。<br>' +
        '2. 在「自测」页进行 E 字表方向辨认测试。<br>' +
        '3. 在「报告」页查看历史检查与验光数据。<br>' +
        '4. 在「我的」页切换就诊人、查看门诊信息。<br>' +
        '5. 数据保存在本机浏览器，与 PC 管理端共享。</div>',
        '<button class="btn btn-primary btn-block" id="sheetOk" style="margin-top:18px">知道了</button>');
      $('#sheetOk').onclick = function () { $('#sheetRoot').innerHTML = ''; };
    };
    function tick() {
      var d = new Date();
      $('#clockTime').textContent = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }
    tick(); setInterval(tick, 30000);
    nextDir(); render();
  }
  init();
})();

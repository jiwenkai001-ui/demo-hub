(function () {
  'use strict';

  var STORE_KEY = 'xa_usedcar_reports_v1';

  var CHECK_GROUPS = [
    {
      key: 'accident', title: '事故结构排查', icon: 'i-shield', desc: '重点结构件',
      items: [
        { key: 'front_bumper', name: '前保险杠' },
        { key: 'radiator', name: '水箱框架' },
        { key: 'front_rail', name: '前纵梁' },
        { key: 'left_fender', name: '左前翼子板' },
        { key: 'right_fender', name: '右前翼子板' },
        { key: 'a_pillar', name: 'A 柱' },
        { key: 'b_pillar', name: 'B 柱' },
        { key: 'c_pillar', name: 'C 柱' },
        { key: 'door_frame', name: '车门框架' },
        { key: 'rear_panel', name: '后备箱及后围板' },
        { key: 'rear_rail', name: '后纵梁' },
        { key: 'airbag', name: '安全气囊' }
      ]
    },
    {
      key: 'waterfire', title: '泡水火烧排查', icon: 'i-warn', desc: '隐蔽风险',
      items: [
        { key: 'carpet', name: '地毯 / 脚垫' },
        { key: 'seat_inner', name: '座椅内部' },
        { key: 'seat_belt', name: '安全带' },
        { key: 'wiring', name: '线束及插头' },
        { key: 'steering_column', name: '方向盘管柱' },
        { key: 'lighter', name: '点烟器' },
        { key: 'engine_bay_wf', name: '发动机舱' },
        { key: 'console', name: '中控台内部' }
      ]
    },
    {
      key: 'appearance', title: '外观内饰检查', icon: 'i-camera', desc: '漆面与磨损',
      items: [
        { key: 'paint', name: '车身漆面' },
        { key: 'glass', name: '前后挡风玻璃' },
        { key: 'tire', name: '轮胎' },
        { key: 'wheel', name: '轮毂' },
        { key: 'light', name: '灯具' },
        { key: 'mirror', name: '后视镜' },
        { key: 'seat_wear', name: '座椅磨损' },
        { key: 'console_btn', name: '中控按键' },
        { key: 'ac', name: '空调系统' },
        { key: 'sunroof', name: '天窗' }
      ]
    },
    {
      key: 'power', title: '动力底盘检查', icon: 'i-data', desc: '机械状况',
      items: [
        { key: 'engine', name: '发动机' },
        { key: 'gearbox', name: '变速箱' },
        { key: 'brake', name: '制动系统' },
        { key: 'suspension', name: '悬挂系统' },
        { key: 'steering', name: '转向系统' },
        { key: 'chassis', name: '底盘' },
        { key: 'exhaust', name: '排气系统' },
        { key: 'battery', name: '电瓶' },
        { key: 'cooling', name: '冷却系统' },
        { key: 'drive', name: '驱动系统' }
      ]
    }
  ];

  var WMI_MAP = {
    LFV: ['一汽大众', '迈腾'], LSG: ['上汽通用', '英朗'], LHG: ['广汽本田', '雅阁'],
    LTV: ['一汽丰田', '卡罗拉'], LGB: ['上汽大众', '朗逸'], LZW: ['上汽通用五菱', '宏光'],
    LS5: ['长安汽车', 'CS75'], LJU: ['吉利汽车', '博越'],
    LGX: ['比亚迪', '秦'], LSA: ['上汽乘用车', '荣威'], LFP: ['东风标致', '408'],
    WVW: ['大众', '帕萨特'], WDB: ['奔驰', 'E 级'], WBA: ['宝马', '3 系'],
    WAU: ['奥迪', 'A4L'], JTM: ['丰田', '凯美瑞'], JHM: ['本田', '雅阁'],
    '1HG': ['本田', '思域'], '1N4': ['日产', '天籁']
  };

  var MAINT_ITEMS = [
    '常规保养 · 更换机油机滤', '更换空气滤芯与空调滤芯', '四轮定位',
    '更换刹车片', '更换变速箱油', '发动机积碳清洗', '更换火花塞', '年检与全车检查'
  ];

  var ACCIDENT_ITEMS = [
    { type: '轻微剐蹭', amount: 1800, desc: '车身右侧剐蹭，车门局部喷漆修复' },
    { type: '追尾事故', amount: 6200, desc: '后部追尾，后保险杠更换及后围板修复' },
    { type: '停放被剐蹭', amount: 1200, desc: '停放期间被剐蹭，左前翼子板钣金喷漆' },
    { type: '水淹事故', amount: 18500, desc: '涉水行驶导致内饰进水，已更换线束与地毯' }
  ];

  var STORES = ['西安高新汽车服务有限公司', '西安未央德众汽修', '陕西碑林汽车贸易有限公司', '西安浐灞品牌授权服务中心'];

  var state = {
    vehicle: null,
    thirdParty: null,
    checks: {},
    currentReport: null,
    reports: []
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function fmtDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function fmtDateTime(d) { return fmtDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function seedFrom(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }

  function makeRand(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  var VIEW_META = {
    home: { title: '西安二手车鉴定', tab: 'home', back: null },
    input: { title: '车辆信息录入', tab: 'input', back: 'home' },
    data: { title: '历史数据核查', tab: 'input', back: 'input' },
    inspect: { title: '车况标准检测', tab: 'input', back: 'data' },
    report: { title: '车辆鉴定报告', tab: 'input', back: 'my' },
    query: { title: '查询鉴定报告', tab: 'query', back: 'home' },
    my: { title: '我的鉴定记录', tab: 'my', back: 'home' }
  };

  function go(view) {
    $$('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + view); });
    var meta = VIEW_META[view] || VIEW_META.home;
    $('#headerTitle').textContent = meta.title;
    $('#headerBack').classList.toggle('show', !!meta.back);
    $('#headerBack').dataset.back = meta.back || '';
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === meta.tab); });
    window.scrollTo(0, 0);
  }

  function loadReports() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      state.reports = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(state.reports)) state.reports = [];
    } catch (e) { state.reports = []; }
  }

  function saveReports() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.reports)); }
    catch (e) { toast('本机存储不可用，报告仅在当前页面有效'); }
  }

  function findReport(id) {
    for (var i = 0; i < state.reports.length; i++) {
      if (state.reports[i].id === id) return state.reports[i];
    }
    return null;
  }

  /* ---------- VIN 解析 ---------- */
  function parseVin() {
    var vin = $('#vin').value.trim().toUpperCase();
    $('#vin').value = vin;
    var hint = $('#vinHint');
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      hint.className = 'field-hint bad';
      hint.textContent = 'VIN 需为 17 位字母或数字，且不含 I、O、Q';
      return false;
    }
    hint.className = 'field-hint ok';
    var wmi = vin.slice(0, 3);
    var info = WMI_MAP[wmi] || WMI_MAP[vin.slice(0, 2)] || ['未知品牌', '未知车型'];
    $('#brand').value = $('#brand').value.trim() || info[0];
    $('#model').value = $('#model').value.trim() || info[1];
    hint.textContent = '识别成功：' + info[0] + ' ' + info[1] + '（可手动修改）';
    return true;
  }

  /* ---------- 第三方数据模拟 ---------- */
  function buildThirdParty(vin, mileage) {
    var rand = makeRand(seedFrom(vin + '|' + mileage));
    var now = new Date();

    var maintCount = 2 + Math.floor(rand() * 4);
    var maint = [];
    var km = Math.max(8000, mileage - 9000);
    for (var i = 0; i < maintCount; i++) {
      var d = new Date(now);
      d.setMonth(d.getMonth() - (maintCount - i) * 9 - Math.floor(rand() * 3));
      km = Math.min(mileage, km + Math.floor(rand() * 9000) + 3000);
      maint.push({
        date: fmtDate(d),
        mileage: km.toLocaleString('zh-CN') + ' km',
        item: MAINT_ITEMS[Math.floor(rand() * MAINT_ITEMS.length)],
        store: STORES[Math.floor(rand() * STORES.length)]
      });
    }
    maint.reverse();

    var accidentCount = rand() > 0.45 ? 1 + Math.floor(rand() * 2) : 0;
    var accidents = [];
    for (var j = 0; j < accidentCount; j++) {
      var ad = new Date(now);
      ad.setMonth(ad.getMonth() - 6 - Math.floor(rand() * 40));
      var a = ACCIDENT_ITEMS[Math.floor(rand() * ACCIDENT_ITEMS.length)];
      accidents.push({
        date: fmtDate(ad),
        type: a.type,
        amount: '¥' + a.amount.toLocaleString('zh-CN'),
        desc: a.desc
      });
    }
    accidents.sort(function (x, y) { return x.date < y.date ? 1 : -1; });

    var recalls = [];
    if (rand() > 0.78) {
      var rd = new Date(now);
      rd.setMonth(rd.getMonth() - 14);
      recalls.push({
        date: fmtDate(rd),
        type: '厂家召回',
        amount: '—',
        desc: '因部分批次零部件存在隐患，厂家发布召回公告，建议到授权服务点免费检查'
      });
    }

    return { maint: maint, accidents: accidents, recalls: recalls, queriedAt: fmtDateTime(now) };
  }

  function renderRecordList(el, list, type) {
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<div class="record-empty">暂无相关记录</div>';
      return;
    }
    list.forEach(function (r) {
      var div = document.createElement('div');
      div.className = 'record-item';
      var head = '';
      if (type === 'maint') {
        head = '<div class="record-head"><strong>' + esc(r.item) + '</strong><span>' + esc(r.date) + '</span></div>' +
          '<div class="record-desc">' + esc(r.store) + ' · ' + esc(r.mileage) + '</div>';
      } else {
        head = '<div class="record-head"><strong>' + esc(r.type) + ' · ' + esc(r.amount) + '</strong><span>' + esc(r.date) + '</span></div>' +
          '<div class="record-desc">' + esc(r.desc) + '</div>';
      }
      div.innerHTML = head;
      el.appendChild(div);
    });
  }

  function renderThirdParty(data) {
    var v = state.vehicle;
    $('#carBadge').textContent = (v.plate || '陕A').split('·')[0];
    $('#carTitle').textContent = (v.brand || '未知品牌') + ' ' + (v.model || '未知车型');
    $('#carSub').textContent = v.regDate + ' 上牌 · ' + (v.color || '未填写颜色') + ' · ' + v.useType;
    $('#sumVin').textContent = v.vin;
    $('#sumReg').textContent = v.regDate;
    $('#sumMile').textContent = Number(v.mileage).toLocaleString('zh-CN') + ' km';
    $('#sumUse').textContent = v.useType;
    renderRecordList($('#maintList'), data.maint, 'maint');
    renderRecordList($('#accidentList'), data.accidents, 'accident');
    renderRecordList($('#recallList'), data.recalls, 'accident');
    $('#maintCount').textContent = '共 ' + data.maint.length + ' 条记录';
    $('#accidentCount').textContent = '共 ' + data.accidents.length + ' 条记录';
    $('#recallCount').textContent = '共 ' + data.recalls.length + ' 条记录';
  }

  function runDataQuery() {
    var v = state.vehicle;
    $('#dataResult').classList.add('hidden');
    $('#dataLoading').classList.remove('hidden');
    var steps = ['正在解析 VIN 码…', '正在查询维保记录…', '正在查询出险记录…', '正在汇总召回信息…'];
    var i = 0;
    $('#loadingStep').textContent = steps[0];
    var timer = setInterval(function () {
      i++;
      if (i < steps.length) $('#loadingStep').textContent = steps[i];
    }, 420);
    setTimeout(function () {
      clearInterval(timer);
      state.thirdParty = buildThirdParty(v.vin, v.mileage);
      renderThirdParty(state.thirdParty);
      $('#dataLoading').classList.add('hidden');
      $('#dataResult').classList.remove('hidden');
    }, 1750);
  }

  /* ---------- 检测项 ---------- */
  function allItems() {
    var out = [];
    CHECK_GROUPS.forEach(function (g) {
      g.items.forEach(function (it) { out.push({ key: it.key, name: it.name, group: g.title }); });
    });
    return out;
  }

  function renderInspect() {
    var wrap = $('#inspectGroups');
    wrap.innerHTML = '';
    CHECK_GROUPS.forEach(function (g) {
      var section = document.createElement('div');
      section.className = 'inspect-group';
      var rows = g.items.map(function (it) {
        var saved = state.checks[it.key] || { state: '', note: '', photo: false };
        var btn = function (st, label) {
          return '<button type="button" class="state-btn' + (saved.state === st ? ' selected' : '') +
            '" data-state="' + st + '" data-key="' + it.key + '">' + label + '</button>';
        };
        return '<div class="check-row">' +
          '<div class="check-name"><span class="dot"></span>' + esc(it.name) + '</div>' +
          '<div class="state-btns">' + btn('normal', '正常') + btn('abnormal', '异常') + btn('unchecked', '未检') + '</div>' +
          '<div class="check-extra">' +
          '<input class="check-note" type="text" data-key="' + it.key + '" placeholder="备注说明（选填）" value="' + esc(saved.note) + '">' +
          '<button type="button" class="photo-btn' + (saved.photo ? ' has-photo' : '') + '" data-key="' + it.key + '">' +
          '<svg class="icon"><use href="#i-camera"></use></svg>' + (saved.photo ? '已标记' : '拍照') + '</button>' +
          '</div></div>';
      }).join('');
      section.innerHTML = '<div class="group-head"><svg class="icon"><use href="#' + g.icon + '"></use></svg>' +
        '<strong>' + esc(g.title) + '</strong><small>' + g.items.length + ' 项 · ' + esc(g.desc) + '</small></div>' + rows;
      wrap.appendChild(section);
    });
    updateProgress();
  }

  function updateProgress() {
    var done = 0;
    allItems().forEach(function (it) { if (state.checks[it.key] && state.checks[it.key].state) done++; });
    var total = allItems().length;
    $('#inspectProgress').textContent = done + ' / ' + total + ' 项';
    $('#progressFill').style.width = (done / total * 100) + '%';
  }

  /* ---------- 报告生成 ---------- */
  function gradeOf(score) {
    if (score >= 90) return { label: '车况优秀', desc: '结构完好，无明显异常，可放心购买', color: '#2ec98a' };
    if (score >= 80) return { label: '车况良好', desc: '整体车况良好，存在少量正常磨损', color: '#57c7e8' };
    if (score >= 70) return { label: '车况一般', desc: '存在部分异常项，建议结合实际车况评估', color: '#f0b64b' };
    if (score >= 60) return { label: '车况较差', desc: '异常项较多，建议谨慎购买并复检', color: '#f0804b' };
    return { label: '车况不合格', desc: '存在重大风险项，不建议购买', color: '#ef5b5b' };
  }

  function reportId(vin) {
    var d = new Date();
    var suffix = seedFrom(vin + d.getTime()).toString(36).slice(-4).toUpperCase();
    return 'XA' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + suffix;
  }

  function buildReport() {
    var items = allItems();
    var normal = 0, abnormal = 0, unchecked = 0;
    var issues = [];
    items.forEach(function (it) {
      var c = state.checks[it.key];
      var st = c && c.state;
      if (st === 'abnormal') {
        abnormal++;
        issues.push({ group: it.group, name: it.name, note: (c && c.note) || '检测发现异常，建议进一步复检' });
      } else if (st === 'unchecked') { unchecked++; }
      else if (st === 'normal') { normal++; }
      else { unchecked++; }
    });

    var severe = (state.thirdParty.accidents || []).some(function (a) { return /水淹|火烧|重大/.test(a.type + a.desc); });
    var score = 100 - abnormal * 6 - unchecked * 2 - (severe ? 8 : 0);
    score = Math.max(40, Math.min(100, score));
    var grade = gradeOf(score);

    var conclusion = '经检测，该车辆综合评分 ' + score + ' 分，评定为「' + grade.label + '」。' + grade.desc + '。' +
      (issues.length ? '共发现 ' + issues.length + ' 项异常，详见检测结果。' : '未发现明显异常项。') +
      (severe ? ' 历史出险记录中存在严重事故，请重点关注。' : '');

    return {
      id: reportId(state.vehicle.vin),
      createdAt: fmtDateTime(new Date()),
      vehicle: JSON.parse(JSON.stringify(state.vehicle)),
      thirdParty: JSON.parse(JSON.stringify(state.thirdParty)),
      checks: JSON.parse(JSON.stringify(state.checks)),
      score: score,
      grade: grade.label,
      gradeDesc: grade.desc,
      gradeColor: grade.color,
      conclusion: conclusion,
      counts: { normal: normal, abnormal: abnormal, unchecked: unchecked, total: items.length },
      issues: issues
    };
  }

  function qrCells(seed) {
    var cells = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var on = ((r * 13 + c * 7 + seed) % 3 === 0) || ((r + c + seed) % 5 === 0);
        if ((r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)) {
          on = (r === 0 || r === 2 || c === 0 || c === 2 || (r === 1 && c === 1));
        }
        cells.push(on);
      }
    }
    return cells;
  }

  function renderReport(r) {
    var v = r.vehicle;
    var seed = seedFrom(r.id);
    var qr = qrCells(seed).map(function (on) { return '<i class="qr-cell ' + (on ? 'on' : 'off') + '"></i>'; }).join('');

    var statHtml = '<div class="stat-row">' +
      '<div class="stat-box good"><b>' + r.counts.normal + '</b><small>正常项</small></div>' +
      '<div class="stat-box bad"><b>' + r.counts.abnormal + '</b><small>异常项</small></div>' +
      '<div class="stat-box"><b>' + r.counts.unchecked + '</b><small>未检项</small></div>' +
      '</div>';

    var issueHtml = '';
    if (r.issues.length) {
      issueHtml = r.issues.map(function (it) {
        return '<div class="report-issue"><strong>' + esc(it.name) + '</strong>（' + esc(it.group) + '）<br>' + esc(it.note) + '</div>';
      }).join('');
    } else {
      issueHtml = '<div class="report-ok">本次检测未发现异常项</div>';
    }

    var acc = r.thirdParty.accidents || [];
    var maint = r.thirdParty.maint || [];
    var recalls = r.thirdParty.recalls || [];

    var html = '' +
      '<div class="report-hero">' +
        '<div class="report-hero-top"><span>报告编号 ' + esc(r.id) + '</span><span class="report-status">已出具</span></div>' +
        '<div class="report-car">' + esc(v.brand) + ' ' + esc(v.model) + '</div>' +
        '<div class="report-sub">' + esc(v.plate || '未填写车牌') + ' · ' + esc(v.regDate) + ' 上牌 · ' + Number(v.mileage).toLocaleString('zh-CN') + ' km</div>' +
        '<div class="score-block">' +
          '<div class="score-ring" style="--score-deg:' + (r.score * 3.6) + 'deg;--score-color:' + r.gradeColor + '"><span><b>' + r.score + '</b><small>综合评分</small></span></div>' +
          '<div class="score-info"><strong>' + esc(r.grade) + '</strong><p>' + esc(r.gradeDesc) + '</p><p>出具时间：' + esc(r.createdAt) + '</p></div>' +
        '</div>' +
      '</div>' +
      '<div class="report-body">' +
        '<div class="report-card"><h3>车辆基本信息</h3><div class="report-info-grid">' +
          '<div><small>车架号 VIN</small><span>' + esc(v.vin) + '</span></div>' +
          '<div><small>车辆用途</small><span>' + esc(v.useType) + '</span></div>' +
          '<div><small>车身颜色</small><span>' + esc(v.color || '未填写') + '</span></div>' +
          '<div><small>车主</small><span>' + esc(v.owner || '未填写') + '</span></div>' +
        '</div></div>' +

        '<div class="report-card"><h3>检测结果概览</h3>' + statHtml +
          '<div style="font-size:12px;color:var(--text-3);margin-bottom:8px">共 ' + r.counts.total + ' 项标准检测</div>' + issueHtml + '</div>' +

        '<div class="report-card"><h3>历史数据核查</h3><div class="report-info-grid">' +
          '<div><small>维保记录</small><span>' + maint.length + ' 条</span></div>' +
          '<div><small>出险记录</small><span>' + acc.length + ' 条</span></div>' +
          '<div><small>召回信息</small><span>' + recalls.length + ' 条</span></div>' +
          '<div><small>查询时间</small><span>' + esc(r.thirdParty.queriedAt) + '</span></div>' +
        '</div>' +
        (acc.length ? '<div style="margin-top:12px">' + acc.map(function (a) {
          return '<div class="report-issue">' + esc(a.date) + ' · ' + esc(a.type) + ' · ' + esc(a.amount) + '<br>' + esc(a.desc) + '</div>';
        }).join('') + '</div>' : '') + '</div>' +

        '<div class="report-card"><h3>鉴定结论</h3><div class="conclusion-box">' + esc(r.conclusion) + '</div></div>' +

        '<div class="report-card"><h3>鉴定师信息</h3><div class="appraiser-row">' +
          '<div class="appraiser-avatar">西</div><div><strong>西安二手车鉴定中心</strong><small>持证鉴定师 · 报告编号 ' + esc(r.id) + '</small></div>' +
        '</div></div>' +

        '<div class="report-card"><h3>报告查验</h3><div class="qr-block">' +
          '<div class="qr-code">' + qr + '</div>' +
          '<div class="qr-text"><small>扫描或输入编号查验报告</small><code>' + esc(r.id) + '</code><small>演示二维码为装饰用途</small></div>' +
        '</div></div>' +

        '<div class="report-actions">' +
          '<button type="button" data-action="share"><svg class="icon"><use href="#i-share"></use></svg>复制报告链接</button>' +
          '<button type="button" class="main" data-go="home">返回首页</button>' +
        '</div>' +
      '</div>';

    $('#reportContent').innerHTML = html;
  }

  /* ---------- 查询与记录 ---------- */
  function reportCardHtml(r) {
    return '<div class="record-card" data-report="' + esc(r.id) + '">' +
      '<div class="record-card-main"><strong>' + esc(r.vehicle.brand) + ' ' + esc(r.vehicle.model) + '</strong>' +
      '<small>' + esc(r.id) + ' · ' + esc(r.createdAt) + '</small>' +
      '<small>' + esc(r.vehicle.plate || r.vehicle.vin) + '</small></div>' +
      '<span class="record-score">' + r.score + '</span>' +
      '<svg class="icon"><use href="#i-arrow"></use></svg></div>';
  }

  function renderMyList() {
    var box = $('#myList');
    if (!state.reports.length) {
      box.innerHTML = '<div class="my-empty">暂无鉴定记录<br>完成一次鉴定后，报告会自动保存在这里</div>';
      return;
    }
    box.innerHTML = state.reports.slice().reverse().map(reportCardHtml).join('') +
      '<button type="button" class="clear-btn" data-action="clear">清空本机记录</button>';
  }

  function doQuery() {
    var key = $('#queryKey').value.trim().toUpperCase();
    var box = $('#queryResult');
    if (!key) { toast('请输入报告编号或 VIN 码'); return; }
    var found = state.reports.filter(function (r) {
      return r.id.toUpperCase().indexOf(key) >= 0 || r.vehicle.vin.toUpperCase().indexOf(key) >= 0;
    });
    if (!found.length) {
      box.innerHTML = '<div class="query-empty">未找到匹配的鉴定报告<br>请确认编号或 VIN 输入是否正确</div>';
      return;
    }
    box.innerHTML = '<div style="padding:12px 14px 0;font-size:12px;color:var(--text-2)">找到 ' + found.length + ' 份报告</div>' +
      found.map(reportCardHtml).join('');
  }

  /* ---------- 交互 ---------- */
  var confirmCallback = null;
  function confirmBox(title, text, cb) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    confirmCallback = cb;
    $('#confirmMask').classList.remove('hidden');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('报告链接已复制'); }, function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('报告链接已复制'); }
    catch (e) { toast('复制失败，请手动复制地址栏链接'); }
    document.body.removeChild(ta);
  }

  function openReport(r) {
    state.currentReport = r;
    renderReport(r);
    go('report');
  }

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var goBtn = e.target.closest('[data-go]');
      if (goBtn) { go(goBtn.dataset.go); return; }

      var tab = e.target.closest('.tab');
      if (tab) { go(tab.dataset.tab); return; }

      if (e.target.closest('#headerBack')) {
        var back = $('#headerBack').dataset.back;
        if (back) go(back);
        return;
      }

      if (e.target.closest('#parseVin')) { parseVin(); return; }

      if (e.target.closest('#toDataBtn')) {
        var vin = $('#vin').value.trim().toUpperCase();
        if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) { toast('请先填写正确的 17 位 VIN 码'); $('#vin').focus(); return; }
        if (!$('#regDate').value) { toast('请选择上牌日期'); return; }
        if (!$('#mileage').value || Number($('#mileage').value) < 0) { toast('请填写表显里程'); return; }
        state.vehicle = {
          vin: vin,
          plate: $('#plate').value.trim(),
          brand: $('#brand').value.trim() || '未知品牌',
          model: $('#model').value.trim() || '未知车型',
          regDate: $('#regDate').value,
          mileage: Number($('#mileage').value),
          color: $('#color').value.trim(),
          useType: $('#useType').value,
          owner: $('#owner').value.trim(),
          phone: $('#phone').value.trim()
        };
        state.checks = {};
        go('data');
        runDataQuery();
        return;
      }

      if (e.target.closest('#toInspectBtn')) {
        if (!state.thirdParty) { toast('数据查询尚未完成'); return; }
        renderInspect();
        go('inspect');
        return;
      }

      var stateBtn = e.target.closest('.state-btn');
      if (stateBtn) {
        var key = stateBtn.dataset.key;
        var st = stateBtn.dataset.state;
        if (!state.checks[key]) state.checks[key] = { state: '', note: '', photo: false };
        state.checks[key].state = st;
        stateBtn.parentNode.querySelectorAll('.state-btn').forEach(function (b) { b.classList.remove('selected'); });
        stateBtn.classList.add('selected');
        updateProgress();
        return;
      }

      var photoBtn = e.target.closest('.photo-btn');
      if (photoBtn) {
        var pk = photoBtn.dataset.key;
        if (!state.checks[pk]) state.checks[pk] = { state: '', note: '', photo: false };
        state.checks[pk].photo = !state.checks[pk].photo;
        photoBtn.classList.toggle('has-photo', state.checks[pk].photo);
        photoBtn.innerHTML = '<svg class="icon"><use href="#i-camera"></use></svg>' + (state.checks[pk].photo ? '已标记' : '拍照');
        toast(state.checks[pk].photo ? '已标记该项有现场照片（演示版不上传图片）' : '已取消照片标记');
        return;
      }

      if (e.target.closest('#generateBtn')) {
        var done = 0;
        Object.keys(state.checks).forEach(function (k) { if (state.checks[k].state) done++; });
        if (done === 0) { toast('请至少完成一项检测再生成报告'); return; }
        var report = buildReport();
        state.reports.push(report);
        saveReports();
        openReport(report);
        toast('鉴定报告已生成并保存到本机');
        return;
      }

      if (e.target.closest('#queryBtn')) { doQuery(); return; }

      var rc = e.target.closest('[data-report]');
      if (rc) {
        var r = findReport(rc.dataset.report);
        if (r) openReport(r);
        return;
      }

      var share = e.target.closest('[data-action="share"]');
      if (share) {
        if (!state.currentReport) return;
        var id = state.currentReport.id;
        copyText(location.href.split('#')[0] + '#report/' + encodeURIComponent(id));
        return;
      }

      var clear = e.target.closest('[data-action="clear"]');
      if (clear) {
        confirmBox('清空鉴定记录', '将删除本机保存的全部鉴定报告，此操作不可恢复。', function () {
          state.reports = [];
          saveReports();
          renderMyList();
          toast('本机记录已清空');
        });
        return;
      }

      if (e.target.closest('#confirmCancel')) { $('#confirmMask').classList.add('hidden'); confirmCallback = null; return; }
      if (e.target.closest('#confirmOk')) {
        $('#confirmMask').classList.add('hidden');
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
        return;
      }
    });

    document.addEventListener('change', function (e) {
      var note = e.target.closest('.check-note');
      if (!note) return;
      var k = note.dataset.key;
      if (!state.checks[k]) state.checks[k] = { state: '', note: '', photo: false };
      state.checks[k].note = note.value.trim();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'queryKey') doQuery();
    });

    $('#queryKey').setAttribute('autocomplete', 'off');
  }

  function loadFromHash() {
    var m = location.hash.match(/^#report\/(.+)$/);
    if (!m) return false;
    var r = findReport(decodeURIComponent(m[1]));
    if (!r) { toast('链接中的报告不存在或已被清除'); return false; }
    openReport(r);
    return true;
  }

  function init() {
    loadReports();
    bindEvents();
    renderMyList();
    if (!loadFromHash()) go('home');
  }

  init();
})();

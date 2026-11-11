/* 宠物医院管理系统 - 前端核心框架（原生 JS，零依赖） */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------- 图标 */
  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    lab: '<path d="M9 3h6"/><path d="M10 3v6.5L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.2 14h9.6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="m12 13 9-5M12 13v8"/>',
    receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2Z"/><path d="M8 8h8M8 12h8"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
    paw: '<circle cx="6" cy="9" r="2.2"/><circle cx="10" cy="5.5" r="2.2"/><circle cx="14.5" cy="5.5" r="2.2"/><circle cx="18.5" cy="9" r="2.2"/><path d="M12.3 10c-3 0-5.3 2.4-5.3 5.2 0 2 1.5 3.4 3.2 3.4 1.3 0 1.7-.6 2.1-.6s.8.6 2.1.6c1.7 0 3.2-1.4 3.2-3.4 0-2.8-2.3-5.2-5.3-5.2Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    stethoscope: '<path d="M4.8 3v5a4.2 4.2 0 0 0 8.4 0V3"/><path d="M9 12v2a5 5 0 0 0 10 0v-1.2"/><circle cx="19" cy="10" r="2"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7Z"/><path d="m7.5 10.5 7 7"/>',
    truck: '<path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------------------------------------------------- 接口 */
  async function request(method, url, body) {
    return global.Demo.request(method, url, body);
  }
  var api = {
    get: function (u) { return request('GET', u); },
    post: function (u, b) { return request('POST', u, b || {}); },
    put: function (u, b) { return request('PUT', u, b || {}); },
    patch: function (u, b) { return request('PATCH', u, b || {}); },
    del: function (u) { return request('DELETE', u); },
    delete: function (u) { return request('DELETE', u); }
  };

  /* ---------------------------------------------------------- 格式化 */
  var fmt = {
    money: function (v) {
      var n = Number(v || 0);
      return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    int: function (v) { return Number(v || 0).toLocaleString('zh-CN'); },
    date: function (v) { return v ? String(v).slice(0, 10) : '-'; },
    dt: function (v) { return v ? String(v).slice(5, 16) : '-'; },
    time: function (v) { return v ? String(v).slice(11, 16) : '-'; },
    dtime: function (v) { return v ? String(v).slice(0, 16) : '-'; },
    pct: function (v) { return (Number(v || 0) * 100).toFixed(1) + '%'; }
  };

  var STATUS_MAP = {
    '待到店': 'info', '已到店': 'primary', '诊疗中': 'warn', '已完成': 'ok', '已取消': 'gray',
    '爽约': 'danger', '待接诊': 'info', '待缴费': 'warn', '已结清': 'ok', '部分缴费': 'warn',
    '已退费': 'gray', '已开单': 'gray', '已采样': 'info', '检测中': 'warn', '已审核': 'ok',
    '在线': 'ok', '离线': 'gray', '维护中': 'warn', '正常': 'ok', '预警': 'warn', '缺货': 'danger',
    '待执行': 'warn', '已忽略': 'gray', '未使用': 'info', '已使用': 'ok', '已过期': 'gray',
    '进行中': 'primary', '未开始': 'gray', '已结束': 'ok', '待回复': 'warn', '已关闭': 'gray',
    '待处理': 'warn', '已登记': 'info', '检查中': 'warn', '已报告': 'ok', '危急': 'danger',
    '偏高': 'warn', '偏低': 'warn', '已作废': 'gray', '草稿': 'gray', '待收货': 'warn',
    '部分收货': 'info', '挂失': 'danger', '过期': 'gray', '停售': 'gray'
  };
  function badge(text, type) {
    if (!text) return '<span class="muted">-</span>';
    var t = type || STATUS_MAP[text] || 'gray';
    return '<span class="badge ' + t + '">' + esc(text) + '</span>';
  }
  function flagBadge(f) {
    if (!f || f === '正常') return '<span class="badge ok">正常</span>';
    return badge(f, f === '危急' ? 'danger' : 'warn');
  }

  /* ---------------------------------------------------------- 提示 */
  var toastRoot = null;
  var componentId = 0;
  function toast(msg, type) {
    if (!toastRoot) toastRoot = document.getElementById('toast-root');
    if (!toastRoot) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(function () { el.remove(); }, 260);
    }, 2400);
  }

  /* ---------------------------------------------------------- 模态框 */
  function openModal(opts) {
    var root = document.getElementById('modal-root');
    var previouslyFocused = document.activeElement;
    var headingId = 'modal-heading-' + (++componentId);
    var wrap = document.createElement('div');
    wrap.className = 'mask';
    wrap.innerHTML =
      '<div class="modal ' + (opts.width || '') + '" role="dialog" aria-modal="true" aria-labelledby="' + headingId + '">' +
        '<div class="modal-head"><h3 id="' + headingId + '">' + esc(opts.title || '') + '</h3>' +
        '<button type="button" class="x" data-close aria-label="关闭弹窗">' + icon('x') + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer === null ? '' :
          '<div class="modal-foot">' + (opts.footer || '<button class="btn" data-close>关闭</button>') + '</div>') +
      '</div>';
    root.appendChild(wrap);
    document.body.classList.add('modal-open');
    function close() {
      if (!wrap.isConnected) return;
      if (opts.canClose && !opts.canClose()) return;
      wrap.remove();
      document.removeEventListener('keydown', onEsc);
      if (!root.querySelector('.mask')) document.body.classList.remove('modal-open');
      if (opts.onClose) opts.onClose();
      if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus({ preventScroll: true });
      global.dispatchEvent(new Event('app:modal-closed'));
    }
    wrap.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    function onEsc(e) {
      if (e.key === 'Escape' && root.lastElementChild === wrap) close();
      if (e.key === 'Tab' && root.lastElementChild === wrap) {
        var focusable = Array.from(wrap.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')).filter(function (el) { return el.getClientRects().length; });
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (!first) return;
        if (!wrap.contains(document.activeElement) || e.shiftKey && document.activeElement === first) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onEsc);
    requestAnimationFrame(function () {
      if (!wrap.isConnected || root.lastElementChild !== wrap) return;
      var target = wrap.querySelector('.modal-body input:not([type="hidden"]):not([disabled]), .modal-body select:not([disabled]), .modal-body textarea:not([disabled])') || wrap.querySelector('.modal-foot button') || wrap.querySelector('[data-close]');
      if (target) target.focus({ preventScroll: true });
    });
    return { root: wrap, body: wrap.querySelector('.modal-body'), close: close };
  }

  function confirmBox(msg, title) {
    return new Promise(function (resolve) {
      var m = openModal({
        title: title || '确认操作',
        onClose: function () { resolve(false); },
        width: '',
        body: '<div style="font-size:13.5px;line-height:1.7">' + esc(msg) + '</div>',
        footer: '<button class="btn" data-no>取消</button><button class="btn btn-primary" data-yes>确定</button>'
      });
      m.body.parentElement.querySelector('[data-yes]').addEventListener('click', function () {
        resolve(true); m.close();
      });
      m.body.parentElement.querySelector('[data-no]').addEventListener('click', function () {
        m.close(); resolve(false);
      });
    });
  }

  /* ---------------------------------------------------------- 表单弹窗 */
  function buildField(f) {
    var v = f.value === undefined || f.value === null ? '' : f.value;
    var req = f.required ? ' required' : '';
    var ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '';
    var html = '';
    if (f.type === 'textarea') {
      html = '<textarea name="' + f.name + '"' + ph + req + '>' + esc(v) + '</textarea>';
    } else if (f.type === 'select') {
      html = '<select name="' + f.name + '"' + req + '>';
      (f.options || []).forEach(function (o) {
        var val = typeof o === 'object' ? o.value : o;
        var lab = typeof o === 'object' ? o.label : o;
        html += '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' +
          esc(lab) + '</option>';
      });
      html += '</select>';
    } else if (f.type === 'static') {
      html = '<div style="padding:7px 0;font-size:13.5px">' + esc(v) + '</div>';
    } else {
      var t = f.type || 'text';
      if (t === 'datetime') { t = 'datetime-local'; v = String(v).replace(' ', 'T').slice(0, 16); }
      html = '<input type="' + t + '" name="' + f.name + '" value="' + esc(v) + '"' + ph + req +
        (t === 'checkbox' && v ? ' checked' : '') +
        (f.step ? ' step="' + esc(f.step) + '"' : '') + (f.min !== undefined ? ' min="' + esc(f.min) + '"' : '') +
        (f.max !== undefined ? ' max="' + esc(f.max) + '"' : '') + '>';
    }
    var hint = f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '';
    var fieldId = 'form-field-' + (++componentId);
    if (f.type !== 'static') html = html.replace(/^(<\w+)/, '$1 id="' + fieldId + '"');
    return '<div class="field"' + (f.span ? ' style="grid-column:span ' + f.span + '"' : '') + '>' +
      (f.label !== undefined ? '<label for="' + fieldId + '">' + esc(f.label) + (f.required ? ' *' : '') + '</label>' : '') +
      html + hint + '</div>';
  }

  function form(opts) {
    return new Promise(function (resolve) {
      var saving = false;
      var isRow = opts.columns === 2 || opts.columns === 3;
      var body = '';
      if (opts.tip) {
        body += '<div style="background:var(--blue-soft);border:1px solid #bfdbfe;color:#1e40af;' +
          'padding:9px 12px;border-radius:8px;font-size:12.5px;margin-bottom:14px">' + esc(opts.tip) + '</div>';
      }
      body += '<div class="' + (opts.columns === 3 ? 'form-row-3' : (isRow ? 'form-row' : '')) + '">' +
        (opts.fields || []).map(buildField).join('') + '</div>';
      var m = openModal({
        title: opts.title || '填写信息',
        canClose: function () { return !saving; },
        onClose: function () { resolve(null); },
        width: opts.width || '',
        body: body,
        footer: '<button class="btn" data-cancel>取消</button>' +
          '<button class="btn btn-primary" data-save>' + esc(opts.submitText || '保存') + '</button>'
      });
      var foot = m.body.parentElement.querySelector('.modal-foot');
      if (opts.onOpen) opts.onOpen(m);
      foot.querySelector('[data-cancel]').addEventListener('click', function () { if (!saving) { m.close(); resolve(null); } });
      foot.querySelector('[data-save]').addEventListener('click', async function () {
        var saveButton = foot.querySelector('[data-save]');
        if (saveButton.disabled) return;
        var values = {};
        var ok = true;
        var firstInvalid = null;
        Array.prototype.forEach.call(m.body.querySelectorAll('[name]'), function (el) {
          values[el.name] = el.type === 'checkbox' ? el.checked : el.value;
          var valid = !(el.required && (el.type === 'checkbox' ? !el.checked : !String(el.value).trim())) && (!el.checkValidity || el.checkValidity());
          el.setAttribute('aria-invalid', valid ? 'false' : 'true');
          if (!valid) { ok = false; if (!firstInvalid) firstInvalid = el; }
          if (el.type === 'datetime-local') values[el.name] = el.value.replace('T', ' ');
        });
        if (!ok) { firstInvalid.focus(); if (firstInvalid.reportValidity) firstInvalid.reportValidity(); toast(firstInvalid.validationMessage || '请填写必填项', 'err'); return; }
        saveButton.disabled = true;
        saving = true;
        foot.querySelector('[data-cancel]').disabled = true;
        try {
          var r = await opts.onSubmit(values);
          saving = false;
          resolve(r === undefined ? values : r);
          m.close();
        } catch (e) {
          toast(e.message || '保存失败', 'err');
        } finally {
          saving = false;
          saveButton.disabled = false;
          foot.querySelector('[data-cancel]').disabled = false;
        }
      });
      m.body.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.isComposing && event.target.matches('input:not([type="checkbox"]):not([type="file"])')) {
          event.preventDefault(); foot.querySelector('[data-save]').click();
        }
      });
    });
  }

  /* ---------------------------------------------------------- 表格 */
  function table(opts) {
    var cols = opts.columns || [];
    var rows = opts.rows || [];
    if (!rows.length) {
      return '<div class="empty">' + icon('inbox') + (opts.empty || '暂无数据') + '</div>';
    }
    var head = '<tr>' + cols.map(function (c) {
      var st = c.width ? ' style="width:' + c.width + '"' : '';
      return '<th' + st + '>' + esc(c.label) + '</th>';
    }).join('') + '</tr>';
    var bodyRows = rows.map(function (r, i) {
      return '<tr data-idx="' + i + '"' + (opts.onRow ? ' class="clickable"' : '') + '>' +
        cols.map(function (c) {
          var val = c.render ? c.render(r, i) : esc(r[c.key]);
          if (val === null || val === undefined || val === '') val = '<span class="muted">-</span>';
          return '<td data-label="' + esc(c.label || '') + '"' +
            (c.align === 'right' ? ' class="num"' : '') + '><div class="cell-value">' + val + '</div></td>';
        }).join('') + '</tr>';
    }).join('');
    var html = '<div class="table-wrap"><table class="tbl responsive-table"><thead>' + head + '</thead><tbody>' +
      bodyRows + '</tbody></table></div>';
    return html;
  }

  function bindTable(container, opts) {
    if (!opts.onRow) return;
    container.querySelectorAll('tbody tr[data-idx]').forEach(function (tr) {
      tr.classList.add('clickable');
      tr.tabIndex = 0;
      function activate() { Promise.resolve().then(function () { return opts.onRow(opts.rows[Number(tr.dataset.idx)], Number(tr.dataset.idx)); }).catch(function (e) { toast(e.message || '操作失败，请重试', 'err'); }); }
      tr.addEventListener('click', function (event) {
        if (event.target.closest('button,a,input,select,textarea,[data-no-row]')) return;
        activate();
      });
      tr.addEventListener('keydown', function (event) { if (event.target === tr && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); activate(); } });
    });
  }

  function pager(meta, onChange) {
    if (!meta) return '';
    return '<div class="pager"><span>共 ' + meta.total + ' 条 / ' + meta.pages + ' 页</span>' +
      '<span class="grow"></span>' +
      '<button class="btn btn-sm" data-p="' + Math.max(1, meta.page - 1) + '"' +
      (meta.page <= 1 ? ' disabled' : '') + '>上一页</button>' +
      '<span>第 ' + meta.page + ' 页</span>' +
      '<button class="btn btn-sm" data-p="' + Math.min(meta.pages, meta.page + 1) + '"' +
      (meta.page >= meta.pages ? ' disabled' : '') + '>下一页</button></div>';
  }

  function bindPager(container, onChange) {
    container.querySelectorAll('.pager [data-p]').forEach(function (b) {
      b.addEventListener('click', function () { onChange(Number(b.dataset.p)); });
    });
  }

  /* ---------------------------------------------------------- 简易图表 */
  function bars(items, opts) {
    opts = opts || {};
    if (!items || !items.length) return '<div class="empty">暂无数据</div>';
    if (items.some(function (i) { return Number(i.value) < 0; })) {
      var positive = Math.max(0, ...items.map(function (i) { return Number(i.value) || 0; }));
      var negative = Math.abs(Math.min(0, ...items.map(function (i) { return Number(i.value) || 0; })));
      var range = positive + negative || 1, zero = positive / range * 100;
      return '<div class="bars signed-bars" aria-label="净收款趋势，红色为负值">' + items.map(function (i) {
        var value = Number(i.value) || 0, height = Math.abs(value) / range * 100;
        return '<div class="bar-item" title="' + esc(i.label) + '：' + esc(value) + '"><div class="bar-value' + (value < 0 ? ' negative-value' : '') + '">' + esc(opts.fmt ? opts.fmt(value) : value) + '</div>' +
          '<div class="signed-plot"><div class="signed-zero" style="top:' + zero + '%"></div><div class="signed-bar ' + (value < 0 ? 'negative' : '') + '" style="top:' + (value >= 0 ? zero - height : zero) + '%;height:' + height + '%"></div></div>' +
          '<div class="bar-label">' + esc(i.label) + '</div></div>';
      }).join('') + '</div>';
    }
    var max = Math.max.apply(null, items.map(function (i) { return Math.abs(Number(i.value) || 0); })) || 1;
    return '<div class="bars">' + items.map(function (i) {
      var value = Number(i.value) || 0;
      var h = value === 0 ? 0 : Math.max(3, Math.round(value / max * 118));
      return '<div class="bar-item" title="' + esc(i.label) + ' ' + esc(i.value) + '">' +
        '<div class="bar-value">' + esc(opts.fmt ? opts.fmt(i.value) : i.value) + '</div>' +
        '<div class="bar ' + (opts.color || '') + '" style="height:' + h + 'px"></div>' +
        '<div class="bar-label">' + esc(i.label) + '</div></div>';
    }).join('') + '</div>';
  }

  function hbars(items, opts) {
    opts = opts || {};
    if (!items || !items.length) return '<div class="empty">暂无数据</div>';
    var max = Math.max.apply(null, items.map(function (i) { return Math.abs(Number(i.value) || 0); })) || 1;
    var colors = ['', 'blue', 'violet', 'warn', ''];
    return items.map(function (i, idx) {
      var w = Math.round(Math.abs(Number(i.value) || 0) / max * 100);
      return '<div class="hbar"><div class="hbar-top"><span>' + esc(i.name) + '</span>' +
        '<strong>' + esc(opts.fmt ? opts.fmt(i.value) : i.value) + '</strong></div>' +
        '<div class="hbar-track"><div class="hbar-fill ' + (Number(i.value) < 0 ? 'negative' : colors[idx % colors.length]) +
        '" style="width:' + w + '%"></div></div></div>';
    }).join('');
  }

  var PIE_COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#65a30d', '#db2777'];
  function donut(items, opts) {
    opts = opts || {};
    var total = (items || []).reduce(function (s, i) { return s + Math.max(0, Number(i.value) || 0); }, 0);
    var size = 128, r = 52, cx = 64, cy = 64, c = 2 * Math.PI * r, acc = 0;
    var segs = (items || []).map(function (i, idx) {
      var frac = Math.max(0, Number(i.value) || 0) / (total || 1);
      var len = frac * c;
      var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' +
        PIE_COLORS[idx % PIE_COLORS.length] + '" stroke-width="20" ' +
        'stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" ' +
        'stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      acc += len;
      return s;
    }).join('');
    var legend = (items || []).map(function (i, idx) {
      return '<div class="legend-item"><span class="swatch" style="background:' +
        PIE_COLORS[idx % PIE_COLORS.length] + '"></span>' + esc(i.name) +
        '<span class="val">' + esc(i.value) + '</span></div>';
    }).join('');
    return '<div class="donut-row"><svg width="' + size + '" height="' + size + '" viewBox="0 0 128 128">' +
      '<circle cx="64" cy="64" r="52" fill="none" stroke="#eef2f7" stroke-width="20"/>' + segs +
      '<text x="64" y="61" text-anchor="middle" font-size="19" font-weight="700" fill="#16202f">' +
      esc(opts.center !== undefined && opts.center !== '' ? opts.center : total) + '</text>' +
      '<text x="64" y="77" text-anchor="middle" font-size="10" fill="#8493a8">' +
      esc(opts.centerLabel === undefined ? '合计' : opts.centerLabel) + '</text></svg>' +
      '<div class="legend">' + legend + '</div></div>';
  }

  /* ---------------------------------------------------------- 路由与视图 */
  var views = {};
  var order = [];
  var current = null;
  var renderVersion = 0;

  var App = {
    icon: icon, esc: esc, api: api, fmt: fmt, badge: badge, flagBadge: flagBadge,
    toast: toast, modal: openModal, confirm: confirmBox, form: form,
    table: table, bindTable: bindTable, pager: pager, bindPager: bindPager,
    bars: bars, hbars: hbars, donut: donut, STATUS_MAP: STATUS_MAP,

    register: function (key, view) {
      views[key] = view;
      order.push(key);
      return view;
    },

    go: function (key, arg) {
      var target = '#/' + key + (arg !== undefined && arg !== null && arg !== '' ? '/' + arg : '');
      if (location.hash === target) return render();
      location.hash = target;
    },

    refresh: function () { return render(); },

    access: null,
    canRead: function (key) { return !App.access || App.access.modules.includes(key); },
    canWrite: function (key) { return !App.access || App.access.enabled && App.access.write_modules.includes(key); },
    refreshAccess: async function () {
      var data = await Promise.all([api.get('/api/system/session'), api.get('/api/system/settings')]);
      App.access = data[0]; App.settings = data[1];
      document.querySelectorAll('.nav-item').forEach(function (el) {
        el.dataset.accessHidden = String(!App.access.modules.includes(el.dataset.key));
      });
      document.querySelectorAll('.nav-group').forEach(function (el) {
        el.dataset.accessHidden = String(!el.querySelector('.nav-item[data-access-hidden="false"]'));
      });
      var who = document.querySelector('.who');
      if (who) { who.innerHTML = '<span class="avatar">' + esc(App.access.name.slice(0, 1)) + '</span><span>' + esc(App.access.name + ' · ' + App.access.role) + '</span>'; who.title = '当前本地演示身份；在接待与系统切换'; }
      var logo = document.querySelector('.brand-logo');
      if (logo) { logo.textContent = data[1].logo_text; logo.style.fontSize = data[1].logo_text.length > 2 ? '11px' : '16px'; }
      var brand = document.querySelector('.brand-sub');
      if (brand) brand.textContent = data[1].hospital_name + ' · 管理工作台';
      document.title = data[1].hospital_name + ' · 管理工作台';
      if (App.applyRoleAccess) App.applyRoleAccess();
      return App.access;
    },

    start: async function () {
      buildSidebar();
      setupNavigation();
      setupDataUpdates();
      try { await App.refreshAccess(); } catch (e) { toast('身份加载失败：' + e.message, 'err'); }
      window.addEventListener('hashchange', render);
      if (!location.hash) location.hash = '#/' + (order[0] || 'dashboard');
      else await render();
    }
  };

  function setupDataUpdates() {
    var main = document.querySelector('main'), pending = false, timer = null, updating = false;
    var notice = document.createElement('div');
    notice.id = 'data-update-notice'; notice.hidden = true;
    notice.innerHTML = '<span>' + icon('refresh') + '其他窗口有新数据，当前输入已保留。</span><button class="btn btn-sm" type="button">更新页面</button>';
    main.insertBefore(notice, document.getElementById('view'));
    var refreshButton = document.createElement('button');
    refreshButton.className = 'btn btn-sm topbar-refresh'; refreshButton.type = 'button';
    refreshButton.title = '刷新当前页面数据'; refreshButton.setAttribute('aria-label', '刷新当前页面数据');
    refreshButton.innerHTML = icon('refresh');
    document.querySelector('.topbar-right').prepend(refreshButton);
    function dirty() { return Array.from(document.querySelectorAll('#view input, #view textarea, #view select')).some(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked !== el.defaultChecked;
      if (el.tagName === 'SELECT') return Array.from(el.options).some(function (o) { return o.selected !== o.defaultSelected; }) && el.value !== (Array.from(el.options).find(function (o) { return o.defaultSelected; }) || el.options[0] || {}).value;
      return el.value !== el.defaultValue;
    }); }
    function editing() { return !!document.querySelector('#modal-root .mask') || dirty() || !!(document.activeElement && document.activeElement.matches('input,textarea,select,[contenteditable="true"]')); }
    async function apply(force) {
      if (!pending && !force || updating) return;
      if (document.hidden || editing()) { notice.hidden = false; return; }
      pending = false; notice.hidden = true; updating = true; refreshButton.disabled = true;
      var scroll = global.scrollY;
      try { await App.refreshAccess(); await render(); global.scrollTo(0, scroll); }
      finally { updating = false; refreshButton.disabled = false; if (pending) schedule(); }
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(function () { apply(false); }, 250); }
    function changed(event) { if (!event.detail || !event.detail.external) return; pending = true; schedule(); }
    global.addEventListener('demo:data-change', changed);
    global.addEventListener('focus', function () { pending = true; schedule(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && pending) schedule(); });
    global.addEventListener('app:modal-closed', function () { if (pending) schedule(); });
    async function manualRefresh() {
      if (document.querySelector('#modal-root .mask')) { toast('请先保存或关闭当前弹窗，再更新页面'); return; }
      if (dirty() && !await confirmBox('当前有尚未提交的输入，更新页面会重新载入数据。确认更新？', '更新页面')) return;
      pending = false; notice.hidden = true; refreshButton.disabled = true;
      try { await App.refreshAccess(); await render(); } finally { refreshButton.disabled = false; }
    }
    notice.querySelector('button').addEventListener('click', manualRefresh);
    refreshButton.addEventListener('click', manualRefresh);
  }

  function setSidebarGroup(name, remember) {
    document.querySelectorAll('#sidebar .nav-group').forEach(function (group) {
      var expanded = group.dataset.group === name && group.dataset.accessHidden !== 'true';
      group.querySelector('.nav-group-toggle').setAttribute('aria-expanded', String(expanded));
      group.querySelector('.nav-group-items').hidden = !expanded;
    });
    if (remember) {
      try { localStorage.setItem('pet-hospital-sidebar-v1', JSON.stringify({ open: name })); } catch (_) { /* Menu remains usable without storage. */ }
    }
  }

  function buildSidebar() {
    var groups = {};
    order.forEach(function (k) {
      var g = views[k].group || '其他';
      (groups[g] = groups[g] || []).push(k);
    });
    var html = '<div class="brand"><div class="brand-logo">' + icon('paw') + '</div>' +
      '<div><div class="brand-name">宠物医院管理系统</div>' +
      '<div class="brand-sub">宠爱动物医院 · 管理工作台</div></div></div>' +
      '<div class="nav-tools"><span>功能导航</span><button type="button" id="nav-collapse-all" title="收起所有菜单分组">全部收起</button></div>';
    Object.keys(groups).forEach(function (g, index) {
      var id = 'nav-group-items-' + index;
      html += '<div class="nav-group" data-group="' + esc(g) + '">' +
        '<button type="button" class="nav-group-title nav-group-toggle" aria-expanded="false" aria-controls="' + id + '">' +
        '<span>' + esc(g) + '</span><svg class="nav-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg></button>' +
        '<div class="nav-group-items" id="' + id + '" hidden>';
      groups[g].forEach(function (k) {
        html += '<button type="button" class="nav-item" data-key="' + k + '">' + icon(views[k].icon || 'dashboard') +
          '<span>' + esc(views[k].title) + '</span>' +
          (views[k].badgeKey ? '<span class="nav-badge" data-badge="' + k + '" hidden></span>' : '') +
          '</button>';
      });
      html += '</div></div>';
    });
    document.getElementById('sidebar').innerHTML = html;
    document.getElementById('sidebar').querySelectorAll('.nav-item').forEach(function (el) {
      el.addEventListener('click', function () { App.go(el.dataset.key); });
    });
    document.querySelectorAll('#sidebar .nav-group-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        setSidebarGroup(button.getAttribute('aria-expanded') === 'true' ? null : button.closest('.nav-group').dataset.group, true);
      });
    });
    document.getElementById('nav-collapse-all').addEventListener('click', function () { setSidebarGroup(null, true); });
    var key = location.hash.replace(/^#\/?/, '').split('/')[0] || order[0];
    var openGroup = (views[key] || views[order[0]]).group || '其他';
    try {
      var saved = JSON.parse(localStorage.getItem('pet-hospital-sidebar-v1'));
      if (saved && (saved.open === null || Object.prototype.hasOwnProperty.call(groups, saved.open))) openGroup = saved.open;
    } catch (_) { /* Use current page on first visit. */ }
    setSidebarGroup(openGroup, false);
  }

  function setupNavigation() {
    var sidebar = document.getElementById('sidebar');
    var topbar = document.getElementById('topbar');
    var main = document.querySelector('main');
    var mobile = window.matchMedia('(max-width: 960px)');
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn menu-toggle';
    toggle.setAttribute('aria-label', '打开导航菜单');
    toggle.setAttribute('aria-controls', 'sidebar');
    toggle.innerHTML = '<span aria-hidden="true">☰</span>';
    topbar.insertBefore(toggle, topbar.firstChild);
    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-label', '关闭导航菜单');
    backdrop.tabIndex = -1;
    document.body.appendChild(backdrop);
    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn nav-close';
    closeButton.textContent = '关闭 ×';
    sidebar.querySelector('.brand').appendChild(closeButton);
    function setOpen(open, restoreFocus) {
      open = mobile.matches && open;
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      sidebar.inert = mobile.matches && !open;
      main.inert = open;
      backdrop.hidden = !open;
      if (open) closeButton.focus();
      else if (restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () { setOpen(true); });
    closeButton.addEventListener('click', function () { setOpen(false, true); });
    backdrop.addEventListener('click', function () { setOpen(false, true); });
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('.nav-item')) setOpen(false, mobile.matches);
    });
    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('nav-open')) return;
      if (e.key === 'Escape') setOpen(false, true);
      if (e.key === 'Tab') {
        var buttons = Array.from(sidebar.querySelectorAll('button:not([hidden])')).filter(function (b) { return b.getClientRects().length; });
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('hashchange', function () { setOpen(false); });
    mobile.addEventListener('change', function () { setOpen(false); });
    setOpen(false);
  }

  function setBadge(key, n) {
    var el = document.querySelector('[data-badge="' + key + '"]');
    if (!el) return;
    if (n) { el.hidden = false; el.textContent = n; } else { el.hidden = true; }
  }

  async function render() {
    var hash = location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/');
    var key = parts[0] || order[0];
    var arg = parts[1];
    var view = views[key];
    if (!view) { key = order[0]; view = views[key]; }
    if (current && current.key !== key && views[current.key].dispose) views[current.key].dispose();
    if (current && current.key !== key && (!App.access || App.access.modules.includes(key))) setSidebarGroup(view.group || '其他', true);
    current = { key: key, arg: arg };

    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.key === key);
      if (el.dataset.key === key) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    document.querySelectorAll('#sidebar .nav-group').forEach(function (group) {
      group.classList.toggle('current-group', group.dataset.group === (view.group || '其他'));
    });

    var topTitle = document.getElementById('topbar');
    if (topTitle) {
      var t = topTitle.querySelector('h1');
      if (t) t.textContent = view.title;
      var c = topTitle.querySelector('.crumb');
      if (c) c.textContent = (view.group || '') + (view.subtitle ? ' · ' + view.subtitle : '') +
        (arg ? ' · ' + (view.argLabels && view.argLabels[arg] || '#' + arg) : '');
    }

    var root = document.getElementById('view');
    var version = ++renderVersion;
    root.dataset.view = key;
    root.dataset.loading = 'true';
    root.innerHTML = '<div class="skeleton">加载中…</div>';
    var content = document.createElement('div');
    content.className = 'view-content';
    content.dataset.view = key;
    root.replaceChildren(content);
    try {
      if (App.access && !App.access.modules.includes(key)) {
        content.innerHTML = '<div class="card access-note"><h3>当前角色未开放此模块</h3><p>在接待与系统中切换演示身份，即可查看对应工作台。</p><button class="btn btn-primary" id="access-switch">切换演示身份</button></div>';
        content.querySelector('#access-switch').onclick = function () { App.go('system'); };
      } else {
        await view.render(content, arg);
        if (App.access) content.querySelectorAll('[data-go],[data-kpi],[data-work],[data-reimbursement],[data-record],[data-oa]').forEach(function (el) {
          var target = el.dataset.go || el.dataset.kpi || el.dataset.work || el.dataset.reimbursement || el.dataset.record || 'oa';
          if (views[target] && !App.access.modules.includes(target)) el.dataset.accessHidden = 'true';
        });
      }
    } catch (e) {
      if (version !== renderVersion) return;
      root.innerHTML = '<div class="card"><div class="card-body"><div class="empty">' +
        icon('alert') + '页面加载失败：' + esc(e.message || e) + '</div></div></div>';
    }
    if (version !== renderVersion) return;
    root.dataset.loading = 'false';
    if (view.badgeKey) {
      try {
        var d = await api.get(view.badgeApi);
        setBadge(key, Number(d.count || d.total || 0));
      } catch (e) { /* ignore */ }
    }
  }

  global.App = App;
  global.icon = icon;
  global.esc = esc;
  global.fmt = fmt;
  global.badge = badge;
  global.flagBadge = flagBadge;
  global.toast = toast;
})(window);

/* Local demo data layer. SQL.js runs entirely in the browser, including file://. */
(function (global) {
  'use strict';
  var base = new URL('../', document.currentScript.src);
  var SQL, db, storage, memory, queue = Promise.resolve();
  var routes = [], storageName = 'pet-hospital-static-demo-v1';
  var changeChannel, tabToken = Math.random().toString(36).slice(2), sequence = 0, lastRevision = '';
  try {
    if (global.BroadcastChannel) {
      changeChannel = new BroadcastChannel(storageName + '-changes');
      changeChannel.onmessage = function (event) {
        var message = event.data;
        if (message && message.source !== tabToken) {
          if (message.revision) lastRevision = message.revision;
          global.dispatchEvent(new CustomEvent('demo:data-change', { detail: Object.assign({}, message, { external: true }) }));
        }
      };
    }
  } catch (_) { /* The next read or window focus still retrieves the shared state. */ }
  function notifyChange(method, url) {
    if (method === 'GET') return;
    var message = { source: tabToken, sequence: ++sequence, method: method, url: url, revision: tabToken + ':' + sequence };
    lastRevision = message.revision;
    if (global.dispatchEvent && global.CustomEvent) global.dispatchEvent(new CustomEvent('demo:data-change', { detail: Object.assign({}, message, { external: false }) }));
    if (changeChannel) changeChannel.postMessage(message);
  }
  var ready = initSqlJs().then(function (engine) {
    SQL = engine;
    return new Promise(function (resolve) {
      if (!global.indexedDB) return resolve();
      var open;
      try { open = indexedDB.open(storageName, 1); } catch (_) { return resolve(); }
      open.onupgradeneeded = function () { open.result.createObjectStore('state'); };
      open.onsuccess = function () { storage = open.result; startRevisionChecks(); resolve(); };
      open.onerror = function () { resolve(); };
      open.onblocked = function () { resolve(); };
    });
  });
  // Some browsers isolate BroadcastChannel for file URLs. A lightweight revision
  // read observes the same IndexedDB used by both clients without reloading SQL.
  function startRevisionChecks() {
    if (!global.setInterval || !global.document) return;
    function check() {
      if (!storage || document.hidden) return;
      try {
        var tx = storage.transaction('state', 'readonly'), read = tx.objectStore('state').get('revision');
        read.onsuccess = function () {
          var message = read.result;
          if (!message || message.revision === lastRevision) return;
          lastRevision = message.revision;
          if (message.source !== tabToken) global.dispatchEvent(new CustomEvent('demo:data-change', { detail: Object.assign({}, message, { external: true }) }));
        };
      } catch (_) { /* Window focus and the next data read provide another retry. */ }
    }
    global.setInterval(check, 1200);
    global.addEventListener('focus', check);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  }
  function bytes(b64) { return Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); }); }
  function openDB(snapshot) {
    if (db) db.close();
    db = new SQL.Database(snapshot || bytes(global.PET_HOSPITAL_SEED));
    db.run('PRAGMA foreign_keys=ON');
  }
  function q(sql, args) {
    // Business dates follow the browser's local day, including the morning in China.
    sql = sql.replace(/\b(date|datetime)\('now'/g, function (_, fn) { return fn + "('" + now() + "'"; });
    var s = db.prepare(sql), rows = [];
    try { s.bind((args || []).map(function (v) { return v === undefined ? null : v; }));
      while (s.step()) rows.push(s.getAsObject());
    } finally { s.free(); }
    return rows;
  }
  function q1(sql, args) { return q(sql, args)[0] || null; }
  function val(sql, args) { var r = q1(sql, args); return r ? r[Object.keys(r)[0]] : null; }
  function run(sql, args) { db.run(sql, (args || []).map(function (v) { return v === undefined ? null : v; })); return val('SELECT last_insert_rowid()'); }
  function fail(message) { throw new Error(message); }
  function get(table, id, label) { return q1('SELECT * FROM ' + table + ' WHERE id=?', [id]) || fail((label || '记录') + '不存在'); }
  function insert(table, data) {
    var fields = Object.keys(data);
    return run('INSERT INTO ' + table + ' (' + fields.join(',') + ') VALUES (' + fields.map(function () { return '?'; }).join(',') + ')', fields.map(function (k) { return data[k]; }));
  }
  function update(table, id, data, fields) {
    get(table, id);
    fields = (fields || Object.keys(data)).filter(function (f) { return Object.prototype.hasOwnProperty.call(data, f); });
    if (fields.length) run('UPDATE ' + table + ' SET ' + fields.map(function (f) { return f + '=?'; }).join(',') + ' WHERE id=?', fields.map(function (f) { return data[f]; }).concat([id]));
    return get(table, id);
  }
  function n(v, fallback) { return v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? (fallback || 0) : Number(v); }
  function int(v, fallback) { return Math.trunc(n(v, fallback)); }
  function money(v) { return Math.round((n(v) + Number.EPSILON) * 100) / 100; }
  function pad(v) { return String(v).padStart(2, '0'); }
  function date(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function now() { var d = new Date(); return date(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function later(days) { var d = new Date(); d.setDate(d.getDate() + days); return date(d); }
  function next(prefix, table, column, timeOnly) {
    var day = timeOnly ? now().slice(11).replace(/:/g, '') : date().replace(/-/g, '');
    return prefix + day + String(n(val('SELECT COUNT(*) FROM ' + table + ' WHERE ' + column + ' LIKE ?', [prefix + day + '%'])) + 1).padStart(4, '0');
  }
  function ref(low, high) { return low == null && high == null ? '-' : high == null ? '>' + low : low == null ? '<' + high : low + ' ~ ' + high; }
  function flag(value, low, high) {
    var v = Number(value);
    if (value === '' || !Number.isFinite(v)) return ['阳性', '+', '++', '+++', '弱阳性'].includes(value) ? '偏高' : '正常';
    var f = low != null && v < low ? '偏低' : high != null && v > high ? '偏高' : '正常';
    if (f !== '正常' && low != null && high != null && high > low && (v > high + (high - low) * 0.5 || v < low - (high - low) * 0.5)) f = '危急';
    return f;
  }
  function filters(conditions, keyword, fuzzy, extra) {
    var parts = [], args = [];
    Object.keys(conditions || {}).forEach(function (k) {
      var v = conditions[k];
      if (v !== null && v !== undefined && v !== '' && v !== 'all') { parts.push(k + '=?'); args.push(v); }
    });
    if (keyword) { parts.push('(' + fuzzy.map(function (f) { return f + ' LIKE ?'; }).join(' OR ') + ')'); fuzzy.forEach(function () { args.push('%' + keyword + '%'); }); }
    (extra || []).forEach(function (x) { parts.push(x[0]); args = args.concat(x.slice(1)); });
    return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', args: args };
  }
  function paged(sql, f, order, params, defaultSize) {
    var page = Math.max(int(params.page, 1), 1), size = Math.min(200, Math.max(int(params.page_size, defaultSize || 20), 1));
    var total = n(val('SELECT COUNT(*) FROM (' + sql + f.sql + ')', f.args));
    return { items: q(sql + f.sql + ' ORDER BY ' + order + ' LIMIT ? OFFSET ?', f.args.concat([size, (page - 1) * size])), meta: { total: total, page: page, page_size: size, pages: Math.max(Math.ceil(total / size), 1) } };
  }
  function items(sql, args) { return { items: q(sql, args) }; }
  function add(method, path, handler) {
    var keys = [];
    var pattern = path.replace(/\{(\w+)\}/g, function (_, key) { keys.push(key); return '(\\d+)'; });
    routes.push({ method: method, regex: new RegExp('^/api' + pattern + '$'), keys: keys, handler: handler, path: '/api' + path });
  }
  function dispatch(method, url, body) {
    var u = new URL(url, 'https://demo.local'), params = Object.fromEntries(u.searchParams), match;
    if (global.Demo.systemAuthorize) global.Demo.systemAuthorize(method, u.pathname, body || {});
    for (var route of routes) {
      if (route.method === method && (match = u.pathname.match(route.regex))) {
        route.keys.forEach(function (key, i) { params[key] = Number(match[i + 1]); });
        var result = route.handler(params, body || {});
        if (global.Demo.roleResponse) result = global.Demo.roleResponse(method, u.pathname, result);
        if (global.Demo.systemAudit && method !== 'GET') global.Demo.systemAudit(method, u.pathname);
        return result;
      }
    }
    fail('未找到演示操作：' + method + ' ' + u.pathname);
  }
  function asset(path) {
    if (!path) return '';
    return /^(data:|blob:)/.test(path) ? path : new URL(path.replace(/^\//, ''), base).href;
  }
  function execute(method, url, body) {
    var changed = false, result;
    db.run('BEGIN');
    try {
      if (global.Demo.oaInit) changed = global.Demo.oaInit() === true || changed;
      if (global.Demo.enhanceInit) changed = global.Demo.enhanceInit() === true || changed;
      if (global.Demo.financeInit) changed = global.Demo.financeInit() === true || changed;
      if (global.Demo.claimsInit) changed = global.Demo.claimsInit() === true || changed;
      if (global.Demo.expensesInit) changed = global.Demo.expensesInit() === true || changed;
      if (global.Demo.careInit) changed = global.Demo.careInit() === true || changed;
      if (global.Demo.servicesInit) changed = global.Demo.servicesInit() === true || changed;
      if (global.Demo.operationsInit) changed = global.Demo.operationsInit() === true || changed;
      if (global.Demo.systemInit) changed = global.Demo.systemInit() === true || changed;
      if (global.Demo.clinicalPlusInit) changed = global.Demo.clinicalPlusInit() === true || changed;
      if (global.Demo.businessPlusInit) changed = global.Demo.businessPlusInit() === true || changed;
      if (global.Demo.systemPlusInit) changed = global.Demo.systemPlusInit() === true || changed;
      if (global.Demo.mobilePlusInit) changed = global.Demo.mobilePlusInit() === true || changed;
      if (global.Demo.dataCycleInit) changed = global.Demo.dataCycleInit() === true || changed;
      result = dispatch(method, url, body);
      if (global.Demo.dataCycleSync && (method !== 'GET' || changed)) global.Demo.dataCycleSync();
      db.run('COMMIT');
      if (result && result._exportSnapshot) {
        var raw = db.export(), binary = '';
        for (var at = 0; at < raw.length; at += 16384) binary += String.fromCharCode.apply(null, raw.subarray(at, at + 16384));
        result = { format: 'pet-hospital-backup', version: 1, created_at: now(), bytes: raw.length, database: btoa(binary), summary: result.summary };
      }
      if (result && result._restoreSnapshot) {
        var original = db.export();
        try { openDB(bytes(result._restoreSnapshot)); execute('GET', '/api/health', {}); if (global.Demo.systemAudit) global.Demo.systemAudit('POST', '/api/system/backup/restore'); result = { ok: true, restored_at: now() }; changed = true; }
        catch (restoreError) { openDB(original); throw restoreError; }
      }
      return { result: result, changed: changed };
    } catch (e) {
      try { db.run('ROLLBACK'); } catch (_) { /* Export/restore runs after commit. */ }
      throw e;
    }
  }
  function request(method, url, body) {
    var task = queue.then(async function () {
      await ready;
      // Decode uploaded files before opening an IndexedDB transaction.
      if (/\/studies\/\d+\/instances$/.test(url) && method === 'POST') {
        body = Object.assign({}, body);
        var ext = (body.ext || 'jpg').toLowerCase().replace(/^\./, '');
        if (!['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'].includes(ext)) ext = 'jpg';
        var content = body.content || '';
        if (!content) fail('缺少影像数据');
        body.dataURL = content.startsWith('data:') ? content : 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + content;
        try { atob(body.dataURL.split(',')[1]); } catch (_) { fail('影像数据解码失败'); }
        body.ext = ext;
        await new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () { body.width = img.naturalWidth; body.height = img.naturalHeight; resolve(); };
          img.onerror = function () { reject(new Error('影像文件无法读取，请选择有效的图片')); };
          img.src = body.dataURL;
        });
      }
      if (!storage) {
        openDB(memory);
        var operation = execute(method, url, body);
        if (method !== 'GET' || operation.changed) memory = db.export();
        notifyChange(method, url);
        return operation.result;
      }
      return new Promise(function (resolve, reject) {
        // Migrations may run on the first read. Serialize both clients and persist them once.
        var tx = storage.transaction('state', 'readwrite');
        var store = tx.objectStore('state'), read = store.get('database'), result, failure;
        read.onsuccess = function () {
          try {
            openDB(read.result);
            var operation = execute(method, url, body);
            result = operation.result;
            if (method !== 'GET' || operation.changed) store.put(db.export(), 'database');
            if (method !== 'GET') store.put({ source: tabToken, sequence: sequence + 1, method: method, url: url, revision: tabToken + ':' + (sequence + 1) }, 'revision');
          } catch (e) { failure = e; tx.abort(); }
        };
        tx.oncomplete = function () { notifyChange(method, url); resolve(result); };
        tx.onabort = tx.onerror = function () { reject(failure || tx.error || new Error('无法保存演示数据，请检查浏览器存储空间')); };
      });
    });
    queue = task.catch(function () {});
    return task;
  }
  function inspectSnapshot(payload) {
    if (!payload || payload.format !== 'pet-hospital-backup' || payload.version !== 1 || typeof payload.database !== 'string' || payload.database.length > 140000000) fail('不是有效的本系统备份文件，或文件超过100MB');
    var candidate, raw;
    try {
      raw = bytes(payload.database);
      if (raw.length !== payload.bytes || String.fromCharCode.apply(null,raw.subarray(0,15)) !== 'SQLite format 3') fail('备份数据长度或文件头校验失败');
      candidate = new SQL.Database(raw);
      var integrity = candidate.exec('PRAGMA integrity_check');
      if (!integrity.length || integrity[0].values[0][0] !== 'ok') fail('备份数据库完整性检查失败');
      if (candidate.exec('PRAGMA foreign_key_check').length) fail('备份存在关联数据错误');
      if (candidate.exec("SELECT name FROM sqlite_master WHERE type IN ('trigger','view')").length) fail('不支持含自定义视图或触发器的备份');
      var required = ['owners','pets','visits','invoices','invoice_items','products','staff','medical_claims','expense_requests'];
      var tables = candidate.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values.map(function(r){return r[0];});
      if (required.some(function(t){return !tables.includes(t);})) fail('备份缺少必要业务表');
      // Exact base schemas protect the importer from unrelated SQLite files.
      required.forEach(function(t){var expected=q('PRAGMA table_info('+t+')').map(function(r){return r.name;}), found=candidate.exec('PRAGMA table_info('+t+')')[0].values.map(function(r){return r[1];});if(expected.some(function(c){return !found.includes(c);})) fail('备份表结构不兼容：'+t);});
      var counts = {};
      required.forEach(function(t){counts[t]=candidate.exec('SELECT COUNT(*) FROM '+t)[0].values[0][0];});
      return { created_at: payload.created_at || '', bytes: raw.length, tables: tables.length, counts: counts };
    } catch(e) { fail('无法使用此备份：'+e.message); }
    finally { if(candidate) candidate.close(); }
  }
  function seedRows(table) {
    if (!/^[a-z_]+$/.test(table)) fail('参考表名称无效');
    var reference = new SQL.Database(bytes(global.PET_HOSPITAL_SEED));
    try { var result = reference.exec('SELECT * FROM ' + table)[0]; return result ? result.values.map(function(row) { var item = {}; result.columns.forEach(function(key, index) { item[key] = row[index]; }); return item; }) : []; }
    finally { reference.close(); }
  }
  global.Demo = { seedRows: seedRows, ready: ready, request: request, asset: asset, routes: routes, inspectSnapshot: inspectSnapshot,
    q: q, q1: q1, val: val, run: run, get: get, insert: insert, update: update, fail: fail,
    n: n, int: int, money: money, date: date, now: now, later: later, next: next, ref: ref, flag: flag,
    filters: filters, paged: paged, items: items, add: add };
})(window);

/* Local demo data layer. SQL.js runs entirely in the browser, including file://. */
(function (global) {
  'use strict';
  var base = new URL('../', document.currentScript.src);
  var SQL, db, storage, memory, queue = Promise.resolve();
  var routes = [], storageName = 'pet-hospital-static-demo-v1';
  var ready = initSqlJs().then(function (engine) {
    SQL = engine;
    return new Promise(function (resolve) {
      if (!global.indexedDB) return resolve();
      var open;
      try { open = indexedDB.open(storageName, 1); } catch (_) { return resolve(); }
      open.onupgradeneeded = function () { open.result.createObjectStore('state'); };
      open.onsuccess = function () { storage = open.result; resolve(); };
      open.onerror = function () { resolve(); };
      open.onblocked = function () { resolve(); };
    });
  });
  function bytes(b64) { return Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); }); }
  function openDB(snapshot) {
    if (db) db.close();
    db = new SQL.Database(snapshot || bytes(global.PET_HOSPITAL_SEED));
    db.run('PRAGMA foreign_keys=ON');
  }
  function q(sql, args) {
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
    for (var route of routes) {
      if (route.method === method && (match = u.pathname.match(route.regex))) {
        route.keys.forEach(function (key, i) { params[key] = Number(match[i + 1]); });
        return route.handler(params, body || {});
      }
    }
    fail('未找到演示操作：' + method + ' ' + u.pathname);
  }
  function asset(path) {
    if (!path) return '';
    return /^(data:|blob:)/.test(path) ? path : new URL(path.replace(/^\//, ''), base).href;
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
        var result = dispatch(method, url, body);
        if (method !== 'GET') memory = db.export();
        return result;
      }
      return new Promise(function (resolve, reject) {
        var tx = storage.transaction('state', method === 'GET' ? 'readonly' : 'readwrite');
        var store = tx.objectStore('state'), read = store.get('database'), result, failure;
        read.onsuccess = function () {
          try {
            openDB(read.result);
            result = dispatch(method, url, body);
            if (method !== 'GET') store.put(db.export(), 'database');
          } catch (e) { failure = e; tx.abort(); }
        };
        tx.oncomplete = function () { resolve(result); };
        tx.onabort = tx.onerror = function () { reject(failure || tx.error || new Error('无法保存演示数据，请检查浏览器存储空间')); };
      });
    });
    queue = task.catch(function () {});
    return task;
  }
  global.Demo = { ready: ready, request: request, asset: asset, routes: routes,
    q: q, q1: q1, val: val, run: run, get: get, insert: insert, update: update, fail: fail,
    n: n, int: int, money: money, date: date, now: now, later: later, next: next, ref: ref, flag: flag,
    filters: filters, paged: paged, items: items, add: add };
})(window);

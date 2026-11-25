/**
 * 地铁商业防火巡更 - 本地后台服务
 * 纯 Node.js 内置模块实现，无需 npm install
 * 启动：node server.js   （默认端口 3000，可用 PORT 环境变量覆盖）
 *
 * 能力：
 *  - 巡更点管理（内置 5 站点 × 6 点位，扫码编号如 S1-P03）
 *  - POST /api/checkin     真实扫码打卡（支持 base64 现场照片，存入 uploads/）
 *  - GET  /api/records     打卡记录查询
 *  - POST /api/hazards     隐患上报（支持照片）
 *  - POST /api/hazards/status  隐患状态流转（后台整改）
 *  - GET  /api/stats       后台仪表盘统计
 *  - 静态托管巡更端(/) 与 管理后台(/admin.html)、照片(/uploads/*)
 *  - 数据持久化：data/db.json（自动创建）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const UP_DIR = path.join(ROOT, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UP_DIR, { recursive: true });

/* ---------------- 内置基础数据 ---------------- */
const STATIONS = [
  { id: 'S1', name: '鱼化寨地铁站', short: '鱼化寨', line: '3号线' },
  { id: 'S2', name: '余家寨地铁站', short: '余家寨', line: '2号线' },
  { id: 'S3', name: '行政中心地铁站', short: '行政中心', line: '2号线' },
];
const STAFF = ['王建国', '李晓峰', '张伟民', '刘 洋', '陈 志', '赵 磊'];
const POINT_NAMES = ['A区商业街东口', 'A区商业街中段', 'B区餐饮区', '中庭扶梯区', '设备夹层入口', '出入口连通道'];

function seedDB() {
  const points = [];
  STATIONS.forEach(s => {
    POINT_NAMES.forEach((n, i) => {
      points.push({ code: s.id + '-P' + String(i + 1).padStart(2, '0'), stationId: s.id, name: n });
    });
  });
  return { stations: STATIONS, staff: STAFF, points, records: [], hazards: [] };
}

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch (e) { const db = seedDB(); saveDB(db); return db; }
}
function saveDB(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
let db = loadDB();

/* ---------------- 工具 ---------------- */
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
/** 校验并保存 base64 图片，返回 /uploads/xxx.jpg */
function savePhoto(dataURL) {
  if (typeof dataURL !== 'string') throw new Error('invalid photo');
  const m = dataURL.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error('invalid photo format');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length < 64) throw new Error('photo empty');
  if (buf.length > 8 * 1024 * 1024) throw new Error('photo too large (max 8MB)');
  const name = crypto.randomUUID().replace(/-/g, '') + '.jpg';
  fs.writeFileSync(path.join(UP_DIR, name), buf);
  return '/uploads/' + name;
}
function savePhotos(arr, max) {
  const out = [];
  (Array.isArray(arr) ? arr : []).slice(0, max).forEach(p => { try { out.push(savePhoto(p)); } catch (e) { /* 单张失败跳过 */ } });
  return out;
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const findPoint = code => db.points.find(p => p.code === code);
const stationName = id => (db.stations.find(s => s.id === id) || {}).name || id;

/* ---------------- API 路由 ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    /* ---- API ---- */
    if (p === '/api/points') return json(res, 200, { points: db.points, stations: db.stations, staff: db.staff });

    if (p === '/api/checkin' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req, 30 * 1024 * 1024)).toString('utf8') || '{}');
      const point = findPoint(body.code);
      if (!point) return json(res, 400, { error: '巡更点编号不存在：' + body.code });
      if (!body.staff) return json(res, 400, { error: '缺少打卡人' });
      if (body.result !== 'ok' && body.result !== 'bad') return json(res, 400, { error: '缺少检查结果' });
      const photos = savePhotos(body.photos, 6);
      const rec = {
        id: crypto.randomUUID(), code: point.code, pointName: point.name,
        stationId: point.stationId, stationName: stationName(point.stationId),
        staff: String(body.staff).slice(0, 20), result: body.result,
        note: String(body.note || '').slice(0, 500), photos, ts: Date.now(),
      };
      db.records.unshift(rec);
      // 异常打卡自动生成隐患
      let hazardId = null;
      if (body.result === 'bad') {
        const hz = {
          id: crypto.randomUUID(), stationId: point.stationId, stationName: rec.stationName,
          source: '打卡异常', type: '巡查异常', level: '较大',
          desc: point.name + '：' + (rec.note || '巡查发现异常'),
          photos, reporter: rec.staff, ts: Date.now(), status: 'open',
        };
        db.hazards.unshift(hz); hazardId = hz.id;
      }
      saveDB(db);
      return json(res, 200, { ok: true, record: rec, hazardId });
    }

    if (p === '/api/records') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500);
      const station = url.searchParams.get('station');
      const date = url.searchParams.get('date'); // yyyy-mm-dd
      const start = date ? new Date(date + 'T00:00:00').getTime() : null;
      const end = date ? start + 86400000 : null;
      let list = db.records;
      if (station && station !== 'ALL') list = list.filter(r => r.stationId === station);
      if (start) list = list.filter(r => r.ts >= start && r.ts < end);
      return json(res, 200, { records: list.slice(0, limit) });
    }

    if (p === '/api/hazards' && req.method === 'GET') {
      let list = db.hazards;
      const st = url.searchParams.get('status');
      if (st && st !== 'ALL') list = list.filter(h => h.status === st);
      return json(res, 200, { hazards: list.slice(0, 300) });
    }

    if (p === '/api/hazards' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req, 30 * 1024 * 1024)).toString('utf8') || '{}');
      if (!body.stationId || !body.type) return json(res, 400, { error: '缺少站点或隐患类型' });
      const photos = savePhotos(body.photos, 6);
      const hz = {
        id: crypto.randomUUID(), stationId: body.stationId, stationName: stationName(body.stationId),
        source: '人工上报', type: String(body.type).slice(0, 30), level: ['一般', '较大', '重大'].includes(body.level) ? body.level : '一般',
        desc: String(body.desc || '').slice(0, 500), photos,
        reporter: String(body.reporter || '匿名').slice(0, 20), ts: Date.now(), status: 'open',
      };
      db.hazards.unshift(hz); saveDB(db);
      return json(res, 200, { ok: true, hazard: hz });
    }

    if (p === '/api/hazards/status' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req, 10240)).toString('utf8') || '{}');
      const hz = db.hazards.find(h => h.id === body.id);
      if (!hz) return json(res, 404, { error: '隐患不存在' });
      if (!['open', 'processing', 'closed'].includes(body.status)) return json(res, 400, { error: '非法状态' });
      hz.status = body.status; hz.updatedAt = Date.now(); saveDB(db);
      return json(res, 200, { ok: true });
    }

    if (p === '/api/stats') {
      const t0 = new Date(todayStr() + 'T00:00:00').getTime();
      const recs = db.records, hzs = db.hazards;
      const todayRecs = recs.filter(r => r.ts >= t0);
      const trend7 = [], byStation = [];
      for (let i = 6; i >= 0; i--) {
        const s0 = t0 - i * 86400000, s1 = s0 + 86400000;
        trend7.push({ date: new Date(s0).toISOString().slice(5, 10), count: recs.filter(r => r.ts >= s0 && r.ts < s1).length });
      }
      db.stations.forEach(s => byStation.push({ name: s.short, count: recs.filter(r => r.stationId === s.id).length }));
      return json(res, 200, {
        today: todayRecs.length,
        todayAbnormal: todayRecs.filter(r => r.result === 'bad').length,
        normalRate: todayRecs.length ? Math.round(todayRecs.filter(r => r.result === 'ok').length / todayRecs.length * 100) : 0,
        hazardsOpen: hzs.filter(h => h.status !== 'closed').length,
        total: recs.length, trend7, byStation,
        recent: recs.slice(0, 8),
      });
    }

    /* ---- 照片 ---- */
    if (p.startsWith('/uploads/')) {
      const f = path.join(UP_DIR, path.basename(p));
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      return res.end(fs.readFileSync(f));
    }

    /* ---- 静态页面 ---- */
    let file = p === '/' ? '/index.html' : p;
    if (file === '/admin' || file === '/admin/') file = '/admin.html';
    const full = path.join(PUB, path.normalize(file).replace(/^([.][.][\\/])+/, ''));
    if (!full.startsWith(PUB) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    return res.end(fs.readFileSync(full));
  } catch (e) {
    return json(res, e.message === 'body too large' ? 413 : (e.message || '').startsWith('photo') || (e.message || '').includes('缺少') || (e.message || '').includes('不存在') || (e.message || '').includes('非法') ? 400 : 500, { error: e.message || 'server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================');
  console.log('  地铁商业防火巡更后台已启动');
  console.log('  巡更端(打卡):  http://localhost:' + PORT + '/');
  console.log('  管理后台:      http://localhost:' + PORT + '/admin.html');
  console.log('  数据文件:      data/db.json   照片目录: uploads/');
  console.log('==============================================');
});

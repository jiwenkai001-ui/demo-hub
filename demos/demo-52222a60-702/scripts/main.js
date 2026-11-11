/* ============================================================
 * 零星工具采购比价系统 - 主逻辑
 * 数据保存在 localStorage，首次加载使用内置种子价格库
 * ============================================================ */

const DB_KEY = "procureCompareDB_v1";
const SEED_VERSION = 3;  // 种子库版本：3 = 含工程物料实际采购数据，旧缓存自动合并升级
const CATS = ["五金工具", "电动工具", "电工电料", "灯具照明", "水暖管件", "门窗五金", "油漆涂刷", "劳保防护", "清洁保洁", "办公及其他", "安防监控", "空调制冷", "仓储搬运", "绿化园艺", "工程物料"];
const PAGE_SIZE = 12;

let DB = [];               // 价格库
let RESULTS = [];          // 比价结果
let pricePageNum = 1;
let editingId = null;      // 当前编辑的商品 id
let pickLineIdx = -1;      // 当前"改选"的行号

/* ---------------- 数据层 ---------------- */
function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) { DB = seedFromData(); saveDB(); return; }
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { DB = seedFromData(); saveDB(); return; }
  DB = parsed.items || [];
  // 种子库升级：旧版本缓存自动补入新增商品（保留用户已修改/新增的数据）
  if (parsed.version !== SEED_VERSION) {
    const have = new Set(DB.map(it => normalize(it.name)));
    let added = 0;
    SEED_ITEMS.forEach(it => {
      if (!have.has(normalize(it.name))) {
        DB.push({
          id: nextId(), name: it.name, alias: it.alias || [], cat: it.cat,
          spec: it.spec || "", unit: it.unit || "个", jd: it.jd, mkt: it.mkt || it.jd,
          updatedAt: "内置预置"
        });
        added++;
      }
    });
    saveDB();
    if (added) console.log("价格库已升级：自动补入 " + added + " 件新商品");
  }
}
function seedFromData() {
  return SEED_ITEMS.map((it, i) => ({
    id: "S" + String(i + 1).padStart(3, "0"),
    name: it.name, alias: it.alias || [], cat: it.cat, spec: it.spec || "",
    unit: it.unit || "个", jd: it.jd, mkt: it.mkt || it.jd,
    updatedAt: "内置预置"
  }));
}
function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify({ items: DB, version: SEED_VERSION, savedAt: new Date().toISOString() }));
  refreshDBStats();
}
function nextId() {
  let max = 0;
  DB.forEach(it => { const n = parseInt(String(it.id).replace(/\D/g, ""), 10); if (n > max) max = n; });
  return "U" + String(max + 1).padStart(3, "0");
}

/* ---------------- 通用 ---------------- */
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.style.display = "block";
  clearTimeout(t._tm); t._tm = setTimeout(() => t.style.display = "none", 2200);
}
function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
function openModal(id) { document.getElementById(id).classList.add("show"); }

function switchPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === name));
}
function normalize(s) {
  return (s || "").toLowerCase().replace(/[\s\-—–_,，。、·×xX*＊()（）/"'“”]/g, "").trim();
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ---------------- 数量解析 ---------------- */
function parseLine(raw) {
  let line = raw.trim().replace(/\t/g, ",");
  let name = line, qty = 1;

  // CSV / Excel 粘贴：名称,数量,...（第二列为纯数字时）
  const cols = line.split(/[,，]/).map(c => c.trim()).filter(c => c !== "");
  if (cols.length >= 2 && /^\d+(\.\d+)?$/.test(cols[1])) {
    name = cols[0]; qty = parseFloat(cols[1]);
    return { name, qty };
  }

  // 名称×数量 / 名称 x2 / 名称*2
  let m = name.match(/[x×*＊]\s*(\d+(?:\.\d+)?)\s*(个|只|套|卷|包|盒|根|支|片|瓶|桶|袋|副|双|顶|件|箱|台|对|条|块|米|张|罐|组|把|盏|枚|颗|盘|节)?\s*$/i);
  if (m) { qty = parseFloat(m[1]); name = name.slice(0, m.index).trim(); return { name, qty }; }

  // 名称 + 数字 + 单位（2把 / 20卷）
  m = name.match(/(\d+(?:\.\d+)?)\s*(个|只|套|卷|包|盒|根|支|片|瓶|桶|袋|副|双|顶|件|箱|台|对|条|块|米|张|罐|组|把|盏|枚|颗|盘|节)\s*$/);
  if (m) { qty = parseFloat(m[1]); name = name.slice(0, m.index).trim(); return { name, qty }; }

  // 尾部独立数字
  m = name.match(/\s(\d+(?:\.\d+)?)\s*$/);
  if (m && name.slice(0, m.index).trim().length >= 2) {
    qty = parseFloat(m[1]); name = name.slice(0, m.index).trim(); return { name, qty };
  }
  return { name: name.trim(), qty };
}

/* ---------------- 匹配引擎 ---------------- */
function scoreCandidate(q, c) {
  const cn = normalize(c);
  if (!cn || !q) return 0;
  if (q === cn) return 100;
  if (q.includes(cn) && cn.length >= 2) return 88;          // 清单含关键词（如"活动扳手12寸"）
  if (cn.includes(q) && q.length >= 2) return 80;           // 关键词含清单（如"生料带"）
  // 字符重合度（模糊相似）
  let hit = 0;
  for (const ch of new Set([...cn])) if (q.includes(ch)) hit++;
  const ratio = hit / new Set([...cn]).size;
  if (ratio >= 0.85) return 58;
  if (ratio >= 0.65) return 45;
  return 0;
}
function matchItem(text) {
  const q = normalize(text);
  const scored = [];
  for (const it of DB) {
    let s = 0, via = "";
    for (const c of [it.name, ...(it.alias || [])]) {
      const sc = scoreCandidate(q, c);
      if (sc > s) { s = sc; via = (c === it.name ? "名称" : "别名"); }
    }
    if (s > 0) scored.push({ item: it, score: s, via });
  }
  scored.sort((a, b) => b.score - a.score || b.item.name.length - a.item.name.length);
  if (!scored.length || scored[0].score < 45) return { best: null, cands: scored.slice(0, 8) };
  return { best: scored[0], cands: scored.slice(0, 8) };
}

/* ---------------- 清单比价 ---------------- */
function runCompare() {
  const text = document.getElementById("list-input").value.trim();
  if (!text) { toast("请先输入或粘贴采购清单"); return; }
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    .filter(l => !(l.includes("名称") && l.includes("数量")));  // 跳过表头
  if (!lines.length) { toast("清单为空"); return; }

  RESULTS = lines.map((raw, idx) => {
    const { name, qty } = parseLine(raw);
    const { best, cands } = matchItem(name);
    return {
      idx, raw, name, qty: qty > 0 ? qty : 1,
      itemId: best ? best.item.id : null,
      score: best ? best.score : 0,
      via: best ? best.via : "",
      cands
    };
  });
  renderResults();
  toast("比价完成：共 " + RESULTS.length + " 条");
}
function getItem(id) { return DB.find(it => it.id === id) || null; }
function statusTag(r) {
  if (!r.itemId) return '<span class="tag tag-danger">未匹配</span>';
  if (r.score >= 80) return '<span class="tag tag-success">精确匹配</span>';
  return '<span class="tag tag-warn">相似匹配</span>';
}
function renderResults() {
  const card = document.getElementById("result-card");
  const empty = document.getElementById("result-empty");
  const matched = RESULTS.filter(r => r.itemId).length;
  const unmatched = RESULTS.length - matched;
  let totalJD = 0, totalMkt = 0;

  const html = RESULTS.map(r => {
    const it = getItem(r.itemId);
    const jd = it ? it.jd : 0, mkt = it ? it.mkt : 0;
    if (it) { totalJD += jd * r.qty; totalMkt += mkt * r.qty; }
    return `<tr>
      <td class="num">${r.idx + 1}</td>
      <td style="max-width:200px;word-break:break-all;">${esc(r.raw)}</td>
      <td>${it ? `<b>${esc(it.name)}</b><div class="match-detail">${esc(it.cat)} · ${esc(it.spec || "—")}${r.via ? " · 按" + r.via + "匹配" : ""}</div>` : '<span style="color:var(--danger)">价格库中未找到，请改选或补充</span>'}</td>
      <td>${statusTag(r)}</td>
      <td>${it ? esc(it.unit) : "—"}</td>
      <td><input type="number" min="0" step="1" value="${r.qty}" class="row-select" style="width:64px;padding:4px 6px;" onchange="changeQty(${r.idx}, this.value)"></td>
      <td class="td-right num">${it ? "¥" + fmt(jd) : "—"}</td>
      <td class="td-right num" style="color:var(--text-sub)">${it ? "¥" + fmt(mkt) : "—"}</td>
      <td class="td-right num">${it ? "¥" + fmt(jd * r.qty) : "—"}</td>
      <td><button class="link-btn" onclick="openPickModal(${r.idx})">改选</button></td>
    </tr>`;
  }).join("");

  document.getElementById("result-body").innerHTML = html;
  document.getElementById("sum-cell").textContent = "京东 ¥" + fmt(totalJD) + " / 市场 ¥" + fmt(totalMkt);
  document.getElementById("st-lines").textContent = RESULTS.length;
  document.getElementById("st-matched").textContent = matched;
  document.getElementById("st-unmatched").textContent = unmatched;
  document.getElementById("st-total").textContent = fmt(totalJD);
  document.getElementById("st-save").textContent = "较市场价节省 " + fmt(totalMkt - totalJD) + " 元";
  card.style.display = RESULTS.length ? "block" : "none";
  empty.style.display = RESULTS.length ? "none" : "block";
}
function changeQty(idx, v) {
  const q = parseFloat(v);
  RESULTS[idx].qty = q > 0 ? q : 1;
  renderResults();
}
function openPickModal(idx) {
  pickLineIdx = idx;
  const r = RESULTS[idx];
  document.getElementById("pick-search").value = r.name;
  renderPickList(r.name);
  openModal("modal-pick");
}
function renderPickList(kw) {
  const box = document.getElementById("pick-list");
  const r = RESULTS[pickLineIdx];
  const q = normalize(kw || "");
  let list;
  if (!q) list = DB.slice(0, 15).map(it => ({ item: it, score: 0 }));
  else {
    const scored = [];
    for (const it of DB) {
      let s = 0;
      for (const c of [it.name, ...(it.alias || [])]) s = Math.max(s, scoreCandidate(q, c));
      if (s > 0) scored.push({ item: it, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    list = scored.slice(0, 15);
  }
  if (!list.length) { box.innerHTML = '<div class="empty"><p>没有找到相关商品，请先到"价格库管理"中新增。</p></div>'; return; }
  box.innerHTML = list.map(({ item }) => `
    <div onclick="pickItem('${item.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;" onmouseover="this.style.background='#F5F5FF'" onmouseout="this.style.background='#fff'">
      <div>
        <b>${esc(item.name)}</b> <span style="font-size:12px;color:var(--text-sub)">${esc(item.spec || "")} · ${esc(item.unit)}</span>
        <div style="font-size:12px;color:var(--text-sub);margin-top:2px;">${esc(item.cat)} · 别名：${esc((item.alias || []).join("、") || "无")}</div>
      </div>
      <div style="text-align:right;"><b style="color:var(--success)">¥${fmt(item.jd)}</b><div style="font-size:11px;color:var(--text-sub)">京东自营参考</div></div>
    </div>`).join("");
}
function pickItem(id) {
  if (pickLineIdx >= 0 && RESULTS[pickLineIdx]) {
    RESULTS[pickLineIdx].itemId = id;
    RESULTS[pickLineIdx].score = 100; RESULTS[pickLineIdx].via = "手动指定";
  }
  closeModal("modal-pick");
  renderResults();
  toast("已改选商品");
}
function clearCompare() {
  document.getElementById("list-input").value = "";
  RESULTS = []; renderResults();
}
function loadExample() {
  document.getElementById("list-input").value =
    "螺丝刀套装 ×3\n活动扳手 12寸 2把\n钢卷尺 5\n生料带，20卷\nLED灯泡 9W 50个\n角阀 10个\n玻璃胶 5支\n安全帽 10\n劳保手套 5包\n灭火器 4个\n未在库的特殊商品测试 2个";
  switchPage("compare");
}
function handleFile(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById("list-input").value = e.target.result; toast("文件已导入，点击开始比价"); };
  reader.readAsText(f, "utf-8");
  ev.target.value = "";
}

/* ---------------- 导出 CSV ---------------- */
function toCSV(rows) {
  return "\uFEFF" + rows.map(r => r.map(c => {
    c = String(c == null ? "" : c);
    return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
  }).join(",")).join("\r\n");
}
function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename;
  a.click(); URL.revokeObjectURL(a.href);
}
function exportResults() {
  if (!RESULTS.length) { toast("暂无比价结果可导出"); return; }
  const rows = [["序号", "清单原文", "匹配商品", "类目", "规格", "单位", "数量", "京东自营参考价", "市场参考价", "小计(京东)", "匹配状态"]];
  let tj = 0;
  RESULTS.forEach(r => {
    const it = getItem(r.itemId);
    if (it) tj += it.jd * r.qty;
    rows.push([r.idx + 1, r.raw, it ? it.name : "未匹配", it ? it.cat : "", it ? it.spec : "", it ? it.unit : "",
      r.qty, it ? it.jd : "", it ? it.mkt : "", it ? fmt(it.jd * r.qty) : "",
      it ? (r.score >= 80 ? "精确匹配" : "相似匹配") : "未匹配"]);
  });
  rows.push(["", "", "", "", "", "", "", "", "合计", fmt(tj), ""]);
  downloadCSV("比价结果_" + todayStr() + ".csv", toCSV(rows));
  toast("已导出比价结果");
}

/* ---------------- 价格库管理 ---------------- */
function fillCatSelect() {
  const sel = document.getElementById("f-cat");
  const cur = sel.value;
  sel.innerHTML = '<option value="">全部类目</option>' + CATS.map(c => `<option ${c === cur ? "selected" : ""}>${c}</option>`).join("");
  const ed = document.getElementById("ed-cat");
  ed.innerHTML = CATS.map(c => `<option>${c}</option>`).join("");
}
function filteredItems() {
  const kw = normalize(document.getElementById("f-keyword").value);
  const cat = document.getElementById("f-cat").value;
  return DB.filter(it => {
    if (cat && it.cat !== cat) return false;
    if (!kw) return true;
    return normalize(it.name).includes(kw) || (it.alias || []).some(a => normalize(a).includes(kw)) || normalize(it.spec).includes(kw);
  });
}
function renderPriceTable() {
  const list = filteredItems();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (pricePageNum > pages) pricePageNum = pages;
  const start = (pricePageNum - 1) * PAGE_SIZE;
  const slice = list.slice(start, start + PAGE_SIZE);
  document.getElementById("price-body").innerHTML = slice.length ? slice.map((it, i) => `
    <tr>
      <td class="num">${start + i + 1}</td>
      <td><b>${esc(it.name)}</b></td>
      <td style="color:var(--text-sub);font-size:12.5px;">${esc((it.alias || []).join("、") || "—")}</td>
      <td><span class="tag tag-primary">${esc(it.cat)}</span></td>
      <td>${esc(it.spec || "—")}</td>
      <td>${esc(it.unit)}</td>
      <td class="td-right num" style="color:var(--success);font-weight:600;">¥${fmt(it.jd)}</td>
      <td class="td-right num" style="color:var(--text-sub)">¥${fmt(it.mkt)}</td>
      <td style="font-size:12px;color:var(--text-sub)">${esc(it.updatedAt)}</td>
      <td>
        <button class="link-btn" onclick="openEditModal('${it.id}')">编辑</button>
        <button class="link-btn danger" onclick="deleteItem('${it.id}')">删除</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="10"><div class="empty"><p>没有匹配的商品</p></div></td></tr>`;
  document.getElementById("price-page-info").textContent = `共 ${list.length} 条 · 第 ${pricePageNum}/${pages} 页`;
}
function pricePage(d) {
  const pages = Math.max(1, Math.ceil(filteredItems().length / PAGE_SIZE));
  pricePageNum = Math.min(pages, Math.max(1, pricePageNum + d));
  renderPriceTable();
}
function resetPriceFilters() {
  document.getElementById("f-keyword").value = "";
  document.getElementById("f-cat").value = "";
  pricePageNum = 1; renderPriceTable();
}
function refreshDBStats() {
  document.getElementById("st-db-total").textContent = DB.length;
  document.getElementById("st-db-cats").textContent = new Set(DB.map(i => i.cat)).size;
  const updated = DB.map(i => i.updatedAt).filter(t => t && t !== "内置预置").sort().pop();
  document.getElementById("st-db-updated").textContent = updated || "尚未修改";
  const inline = document.getElementById("db-count-inline");
  if (inline) inline.textContent = DB.length;
}

/* 新增 / 编辑 */
function openEditModal(id) {
  editingId = id || null;
  fillCatSelect();
  if (id) {
    const it = getItem(id);
    document.getElementById("edit-title").textContent = "编辑商品";
    document.getElementById("ed-name").value = it.name;
    document.getElementById("ed-cat").value = it.cat;
    document.getElementById("ed-spec").value = it.spec || "";
    document.getElementById("ed-unit").value = it.unit || "";
    document.getElementById("ed-jd").value = it.jd;
    document.getElementById("ed-mkt").value = it.mkt;
    document.getElementById("ed-alias").value = (it.alias || []).join("、");
  } else {
    document.getElementById("edit-title").textContent = "新增商品";
    ["ed-name", "ed-spec", "ed-unit", "ed-jd", "ed-mkt", "ed-alias"].forEach(i => document.getElementById(i).value = "");
  }
  openModal("modal-edit");
}
function saveEdit() {
  const name = document.getElementById("ed-name").value.trim();
  const jd = parseFloat(document.getElementById("ed-jd").value);
  if (!name) { toast("请填写商品名称"); return; }
  if (!(jd > 0)) { toast("请填写有效的京东自营参考价"); return; }
  const data = {
    name,
    cat: document.getElementById("ed-cat").value,
    spec: document.getElementById("ed-spec").value.trim(),
    unit: document.getElementById("ed-unit").value.trim() || "个",
    jd,
    mkt: parseFloat(document.getElementById("ed-mkt").value) || jd,
    alias: document.getElementById("ed-alias").value.split(/[、,，;；\s]+/).map(s => s.trim()).filter(Boolean)
  };
  if (editingId) {
    Object.assign(getItem(editingId), data, { updatedAt: todayStr() });
    toast("已保存修改");
  } else {
    DB.push(Object.assign({ id: nextId(), updatedAt: todayStr() }, data));
    toast("已新增商品");
  }
  saveDB();
  closeModal("modal-edit");
  renderPriceTable();
}
function deleteItem(id) {
  const it = getItem(id);
  if (!confirm("确定删除商品【" + it.name + "】吗？")) return;
  DB = DB.filter(i => i.id !== id);
  saveDB(); renderPriceTable();
  toast("已删除");
}
function confirmResetDB() {
  if (!confirm("恢复默认价格库将覆盖您当前的修改（含新增商品），确定继续吗？")) return;
  DB = seedFromData(); saveDB(); renderPriceTable();
  toast("已恢复内置默认价格库");
}

/* 批量导入价格 */
function openImportPriceModal() { document.getElementById("import-price-text").value = ""; openModal("modal-import-price"); }
function handlePriceFile(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById("import-price-text").value = e.target.result; toast("文件已读入，点击导入并保存"); };
  reader.readAsText(f, "utf-8");
  ev.target.value = "";
}
function doImportPrices() {
  const text = document.getElementById("import-price-text").value.trim();
  if (!text) { toast("请粘贴数据或上传 CSV"); return; }
  let added = 0, updated = 0, skipped = 0;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    .filter(l => !(l.includes("名称") && l.includes("京东")));
  for (const line of lines) {
    const c = line.split(/[,，\t]/).map(s => s.trim());
    const [name, jdStr, mktStr, spec, unit, aliasStr] = c;
    const jd = parseFloat(jdStr);
    if (!name || !(jd > 0)) { skipped++; continue; }
    const exist = DB.find(it => normalize(it.name) === normalize(name) || (it.alias || []).some(a => normalize(a) === normalize(name)));
    if (exist) {
      exist.jd = jd;
      if (mktStr && parseFloat(mktStr) > 0) exist.mkt = parseFloat(mktStr);
      if (spec) exist.spec = spec;
      if (unit) exist.unit = unit;
      if (aliasStr) {
        const na = aliasStr.split(/[、,，;；\s]+/).filter(Boolean);
        exist.alias = [...new Set([...(exist.alias || []), ...na])];
      }
      exist.updatedAt = todayStr();
      updated++;
    } else {
      DB.push({
        id: nextId(), name, jd, mkt: parseFloat(mktStr) || jd,
        spec: spec || "", unit: unit || "个",
        alias: (aliasStr || "").split(/[、,，;；\s]+/).filter(Boolean),
        cat: "办公及其他", updatedAt: todayStr()
      });
      added++;
    }
  }
  saveDB(); renderPriceTable(); closeModal("modal-import-price");
  toast(`导入完成：更新 ${updated} 条，新增 ${added} 条${skipped ? "，跳过 " + skipped + " 条无效行" : ""}`);
}
function exportPriceDB() {
  const rows = [["名称", "京东自营参考价", "市场参考价", "规格", "单位", "别名", "类目"]];
  DB.forEach(it => rows.push([it.name, it.jd, it.mkt, it.spec, it.unit, (it.alias || []).join("、"), it.cat]));
  downloadCSV("价格库_" + todayStr() + ".csv", toCSV(rows));
  toast("已导出价格库（" + DB.length + " 条）");
}

/* ---------------- 初始化 ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadDB();
  fillCatSelect();
  refreshDBStats();
  renderPriceTable();
  // 关键词输入回车即查询
  document.getElementById("f-keyword").addEventListener("keydown", e => { if (e.key === "Enter") { pricePageNum = 1; renderPriceTable(); } });
  document.getElementById("f-cat").addEventListener("change", () => { pricePageNum = 1; renderPriceTable(); });
  // 弹窗点击遮罩关闭
  document.querySelectorAll(".modal-mask").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) m.classList.remove("show"); });
  });
});

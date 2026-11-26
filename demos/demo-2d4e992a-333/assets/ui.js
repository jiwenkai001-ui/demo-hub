/* 公共界面组件：可访问图标、表格、弹窗、导出与应用壳。 */
(function (g) {
  "use strict";
  const Y = g.JIAHE;
  const paths = {
    leaf: "M20 4c-7-1-14 2-14 9a6 6 0 0 0 6 6c7 0 9-8 8-15ZM4 21l11-11",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    orders: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 7h6M9 11h6M9 15h3",
    spark:
      "m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 3v4M18 5h4",
    box: "m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M8 5l9 4",
    warehouse: "m3 10 9-7 9 7v11H3V10Zm4 11V11h10v10M7 15h10M7 18h10",
    sort: "M4 5h16M4 12h10M4 19h5m7-3 3 3 3-3M19 8v11",
    truck:
      "M3 6h12v12H3zM15 10h4l3 4v4h-7M6 18a2 2 0 1 0 4 0M16 18a2 2 0 1 0 4 0",
    shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
    tag: "M3 3h8l10 10-8 8L3 11V3Zm4 4h.01",
    wallet: "M3 6h17v14H3V6Zm0 0V4h14v2M15 11h6v5h-6z",
    chart: "M4 3v18h17M8 16v-5M13 16V6M18 16V9",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 7M22 21v-2a4 4 0 0 0-3-3.9",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z",
    search: "M20 20l-5-5M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    down: "m6 9 6 6 6-6",
    right: "m9 5 7 7-7 7",
    left: "m15 5-7 7 7 7",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    upload: "M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5",
    close: "m6 6 12 12M6 18 18 6",
    check: "m4 12 5 5L20 6",
    clock: "M12 8v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
    calendar: "M4 5h16v16H4V5Zm4-3v6M16 2v6M4 10h16",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    cart: "M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01",
    home: "m3 10 9-7 9 7v11H3V10Zm6 11v-8h6v8",
    print: "M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6v-7M17 12h.01",
    file: "M4 3h11l5 5v13H4V3Zm11 0v6h5M8 13h8M8 17h6",
    refresh: "M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-6M4 12a8 8 0 0 0 14 6",
    alert: "m12 3 10 18H2L12 3Zm0 6v5M12 17h.01",
    menu: "M4 6h16M4 12h16M4 18h16",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    edit: "m16 3 5 5-12 12H4v-5L16 3Zm-3 3 5 5",
    money: "M3 5h18v14H3V5Zm9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    external: "M14 3h7v7M10 14 21 3M10 3H3v18h18v-7",
    building: "M4 21V3h12v18M16 9h5v12M8 7h4M8 11h4M8 15h4M8 19h4",
  };
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
  const money = (n) =>
    "￥" +
    (Number(n || 0) / 100).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const number = (n) =>
    Number(n || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  const btn = (label, action, id = "", variant = "", ico = "") =>
    `<button type="button" class="btn ${variant}" data-action="${esc(action)}" data-id="${esc(id)}">${ico ? icon(ico) : ""}${esc(label)}</button>`;
  const status = (s) => {
    const c = [
      "已签收",
      "已生成订单",
      "记忆命中",
      "匹配完成",
      "推送成功",
      "价格正常",
      "已入库",
      "已通过",
      "已结清",
      "已分配",
      "在售",
      "已启用",
    ].includes(s)
      ? "green"
      : ["配送中", "采购中", "打印队列", "已确认", "标准商品", "客户报价", "商品匹配", "待送货"].includes(s)
        ? "blue"
        : ["已取消", "已退回", "推送失败", "负毛利", "已过期", "已停用", "已下架"].includes(
              s,
            )
          ? "red"
          : "amber";
    return `<span class="tag ${c}"><i class="dot"></i>${esc(s)}</span>`;
  };
  const opts = (arr, val, empty = "") =>
    (empty ? `<option value="">${esc(empty)}</option>` : "") +
    arr
      .map((x) => {
        const v = typeof x === "string" ? x : x.id,
          t = typeof x === "string" ? x : x.name;
        return `<option value="${esc(v)}" ${v === val ? "selected" : ""}>${esc(t)}</option>`;
      })
      .join("");
  const field = (label, name, value = "", type = "text", extra = "") =>
    `<div class="field"><label for="f-${name}">${esc(label)}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
  const select = (label, name, options, value = "", extra = "") =>
    `<div class="field"><label for="f-${name}">${esc(label)}</label><select id="f-${name}" name="${name}" ${extra}>${opts(options, value)}</select></div>`;
  const nav = [
    [
      "经营工作台",
      [
        ["index", "经营总览", "grid"],
        ["ai-entry", "AI 智慧录单", "spark"],
        ["orders", "销售订单", "orders"],
      ],
    ],
    [
      "供应链履约",
      [
        ["procurement", "采购管理", "box"],
        ["inventory", "入库库存", "warehouse"],
        ["sorting", "分拣管理", "sort"],
        ["dispatch", "配送管理", "truck"],
        ["food-safety", "食安资料", "shield"],
      ],
    ],
    [
      "经营与财务",
      [
        ["pricing", "协议价与预警", "tag"],
        ["reconciliation", "对账结算", "wallet"],
        ["reports", "经营报表", "chart"],
      ],
    ],
    [
      "基础资料",
      [
        ["customers", "客户管理", "users"],
        ["products", "商品库", "box"],
        ["suppliers", "供应商", "building"],
        ["settings", "系统设置", "settings"],
      ],
    ],
  ];
  const titleMap = Object.fromEntries(
    nav.flatMap((x) => x[1].map((x) => [x[0], x[1]])),
  );
  Y.UI = {
    esc,
    icon,
    money,
    number,
    btn,
    status,
    opts,
    field,
    select,
    titleMap,
    /** 显示结果提示。text 为已确认的操作结果，error 为布尔值；不写入业务数据。 */
    toast(text, error = false) {
      let box = document.querySelector(".toast-container");
      if (!box) {
        box = document.createElement("div");
        box.className = "toast-container";
        box.setAttribute("role", "status");
        document.body.append(box);
      }
      const t = document.createElement("div");
      t.className = "toast" + (error ? " error" : "");
      t.innerHTML =
        icon(error ? "alert" : "check") + `<span>${esc(text)}</span>`;
      box.append(t);
      setTimeout(() => t.remove(), 4200);
    },
    /** 打开可访问弹窗。config 含 title/body/submit/onSubmit；onSubmit 返回 false 时保留窗口，异常在表单内显示。 */
    modal(config) {
      document.querySelector("#ym-modal")?.remove();
      const el = document.createElement("dialog");
      el.className = "modal" + (config.wide ? " wide" : "");
      el.id = "ym-modal";
      el.innerHTML = `<form method="dialog"><header class="modal-head"><h2>${esc(config.title)}</h2><button type="button" class="btn icon-only ghost" aria-label="关闭弹窗" data-modal-close>${icon("close")}</button></header><div class="modal-content">${config.body}<div class="form-error" role="alert"></div></div><footer class="modal-footer"><button type="button" class="btn" data-modal-close>${config.submit ? "取消" : "关闭"}</button>${config.submit ? `<button type="submit" class="btn primary">${esc(config.submit)}</button>` : ""}</footer></form>`;
      document.body.append(el);
      el.querySelectorAll("[data-modal-close]").forEach(
        (b) => (b.onclick = () => el.close()),
      );
      el.addEventListener("click", (e) => {
        if (e.target === el) el.close();
      });
      el.querySelector("form").onsubmit = async (e) => {
        e.preventDefault();
        const b = el.querySelector("[type=submit]");
        if (b) b.disabled = true;
        try {
          const result = await config.onSubmit?.(new FormData(e.target), el);
          if (result !== false) el.close();
        } catch (error) {
          el.querySelector(".form-error").textContent = error.message;
        } finally {
          if (b) b.disabled = false;
        }
      };
      el.showModal();
      config.onOpen?.(el);
      return el;
    },
    /** 用户确认。title/body 均为显示文本，fn 仅在明确确认后调用；返回弹窗元素。 */
    confirm(title, body, fn) {
      return this.modal({
        title,
        body: `<p style="line-height:1.9">${esc(body)}</p>`,
        submit: "确认",
        onSubmit: fn,
      });
    },
    /** CSV 导出。rows 为列值数组，filename 为不含路径的名称；转义引号和公式前缀，生成 UTF-8 BOM 文件。 */
    csv(rows, filename) {
      const clean = (x) => {
        let s = String(x ?? "");
        if (/^[=+@\-]/.test(s)) s = "'" + s;
        return '"' + s.replaceAll('"', '""') + '"';
      };
      const blob = new Blob(
        ["\uFEFF" + rows.map((r) => r.map(clean).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = filename + ".csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast("已导出当前筛选结果");
    },
    /** 分页表格。items 已经过滤，columns 含 label/render/key，page 是从1开始的页码；返回完整 HTML，空列表展示空状态。 */
    table(items, columns, page = 1, size = 12) {
      const pages = Math.max(1, Math.ceil(items.length / size)),
        p = Math.min(Math.max(1, page), pages),
        visible = items.slice((p - 1) * size, p * size);
      return `<div class="table-wrap"><table><thead><tr>${columns.map((c) => `<th class="${c.right ? "right" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${visible.map((r) => `<tr>${columns.map((c) => `<td class="${c.right ? "right" : ""}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join("")}</tr>`).join("")}</tbody></table>${!items.length ? `<div class="empty">${icon("search")}<div>没有符合条件的数据</div><p class="small">试试其他关键词，或清空筛选条件</p></div>` : ""}</div><div class="table-footer"><span>共 ${number(items.length)} 条 · 每页 ${size} 条</span><div class="pagination">${btn("上一页", "page", String(p - 1), "sm" + (p === 1 ? " disabled" : ""), "left").replace(p === 1 ? "data-action" : "not-present", p === 1 ? "disabled data-action" : "not-present")}<span class="btn current">${p}</span><span> / ${pages}</span>${btn("下一页", "page", String(p + 1), "sm", "right").replace(p === pages ? "data-action" : "not-present", p === pages ? "disabled data-action" : "not-present")}</div></div>`;
    },
    /** 渲染后台壳。page 为已注册页面键；未知键回退总览，动态标题已转义。 */
    shell(page) {
      const d = Y.store.data,
        name = d.settings.name;
      document.title = (titleMap[page] || "经营总览") + " · " + name;
      document.body.innerHTML = `<aside class="sidebar"><a class="brand" href="index.html"><span class="brand-mark">${icon("leaf")}</span><span><span class="brand-name">${esc(name)}</span><span class="brand-sub" style="display:block">生鲜供应链</span></span></a><nav class="nav-scroll">${nav.map(([label, items]) => `<div class="nav-label">${label}</div>${items.map(([key, t, i]) => `<a class="nav-item ${key === page ? "active" : ""}" href="${key}.html">${icon(i)}<span>${t}</span></a>`).join("")}`).join("")}</nav><div class="sidebar-foot"><div class="inline"><span class="dot positive"></span>团膳食材配送 · 西安</div><div>业务日期 ${d.settings.date}</div></div></aside><div class="workspace"><header class="topbar"><div class="inline"><button class="btn icon-only ghost mobile-menu" aria-label="展开菜单" data-action="menu">${icon("menu")}</button><div class="breadcrumbs">工作台 ${icon("right")}<strong>${titleMap[page] || "经营总览"}</strong></div></div><div class="top-actions"><span class="date-label">${icon("calendar")} <span style="margin-left:5px">${d.settings.date.replaceAll("-", " / ")}</span></span><a class="btn" href="customer.html" target="_blank" rel="noopener">${icon("external")}客户下单端</a><a class="btn vendor-link" href="vendor.html">${icon("building")}供应商端</a><div class="inline"><span class="avatar">管</span><span class="avatar-label">管理员</span></div></div></header><main class="main" id="main"></main></div><div class="toast-container" role="status"></div>`;
    },
    /** 日期范围折线图。series 为日收入/毛利数组，返回带数据 title 的原生 SVG，不请求第三方图表资源。 */
    chart(series) {
      const max = Math.max(100, ...series.map((x) => x.value)),
        w = 640,
        h = 180,
        x = (i) => 44 + (i * (w - 62)) / Math.max(1, series.length - 1),
        y = (v) => h - 15 - (v / max) * (h - 35);
      const line = (key) =>
        series.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ");
      return `<div class="chart"><svg viewBox="0 0 660 230" role="img" aria-label="销售与毛利趋势"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#159a72" stop-opacity=".12"/><stop offset="100%" stop-color="#159a72" stop-opacity="0"/></linearGradient></defs>${[0, 0.25, 0.5, 0.75, 1].map((n) => `<path d="M44 ${y(n * max)}H640" stroke="#edf2ef" stroke-dasharray="3 5"/><text x="30" y="${y(n * max) + 4}" fill="#93a198" text-anchor="end" font-size="10">${((n * max) / 1000000).toFixed(1)}万</text>`).join("")}<path d="${line("value")}L${x(series.length - 1)},${h - 15}L44,${h - 15}Z" fill="url(#area)"/><path d="${line("gross")}" stroke="#bdcfc3" stroke-width="2" fill="none" stroke-dasharray="4 4"/><path d="${line("value")}" stroke="#159a72" stroke-width="2.5" fill="none" stroke-linejoin="round"/>${series.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.5" fill="white" stroke="#159a72" stroke-width="2"><title>${p.date} 销售 ${money(p.value)} 毛利 ${money(p.gross)}</title></circle><text x="${x(i)}" y="207" text-anchor="middle" font-size="10" fill="#8c9b91">${esc(p.date.slice(5).replace("-", "/"))}</text>`).join("")}</svg></div>`;
    },
  };
  try {
    Y.store = new Y.DataStore(g.localStorage);
  } catch (error) {
    document.body.innerHTML = `<div class="main"><h1>演示数据暂时无法读取</h1><p class="notice amber" style="margin-top:20px">${esc(error.message)}</p><button id="recover" class="btn primary">恢复初始演示数据</button></div>`;
    document.querySelector("#recover").onclick = () => {
      if (confirm("确认恢复初始数据？此操作会覆盖当前浏览器内的演示操作。")) {
        try {
          localStorage.setItem(Y.KEY, JSON.stringify(Y.makeSeed()));
          location.reload();
        } catch (e) {
          alert("浏览器存储不可用，请使用允许本地存储的浏览器打开。");
        }
      }
    };
    Y.bootError = true;
  }
})(window);

/* 后台页面视图。共享表格、筛选与状态组件，业务变更由 admin.js 调用 store 完成。 */
(function (g) {
  "use strict";
  const Y = g.YMM,
    U = Y.UI,
    { esc: e, icon: i, money: m, number: n, btn: b, status: tag } = U;
  const params = new URLSearchParams(location.search),
    V = (Y.view = {
      q: "",
      filter: params.get("status") || "",
      page: 1,
      tab: "",
      route: "",
      start: "2026-11-01",
      end: "2026-11-17",
      school: params.get("school") || "",
      kind: "客户应收",
      month: "2026-11",
      sort: "",
    });
  const d = () => Y.store.data,
    p = (id) => Y.find(d(), "products", id),
    s = (id) => Y.find(d(), "schools", id),
    sup = (id) => Y.find(d(), "suppliers", id),
    route = (id) => Y.find(d(), "routes", id);
  const search = (r, keys) =>
    !V.q ||
    keys.some((k) =>
      String(typeof k === "function" ? k(r) : (r[k] ?? ""))
        .toLowerCase()
        .includes(V.q.toLowerCase()),
    );
  const head = (title, desc, actions = "") =>
    `<div class="page-heading"><div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div>`;
  const stats = (arr) =>
    `<div class="metrics">${arr.map((x) => `<div class="metric"><div class="metric-top"><span>${x[0]}</span>${i(x[3] || "chart")}</div><div class="metric-value num">${x[1]}</div><div class="metric-note">${x[2]}</div></div>`).join("")}</div>`;
  const notice = (text, type = "") =>
    `<div class="notice ${type}">${i(type === "amber" ? "alert" : "shield")}<span>${text}</span></div>`;
  const tabs = (arr, active) =>
    `<div class="tabs">${arr.map((x) => `<button class="tab ${x === active ? "active" : ""}" data-action="tab" data-id="${e(x)}">${e(x)}</button>`).join("")}</div>`;
  const toolbar = (hint, filters = [], extra = "", label = "全部状态") =>
    `<div class="toolbar"><div class="toolbar-start"><label class="search">${i("search")}<input aria-label="搜索" data-filter="q" value="${e(V.q)}" placeholder="${e(hint)}"></label>${filters.length ? `<select aria-label="筛选" data-filter="filter">${U.opts(filters, V.filter, label)}</select>` : ""}${extra}</div><div class="actions">${b("重置", "reset-filters", "", "sm", "refresh")}${b("导出", "export", "", "sm", "download")}</div></div>`;
  const clean = (html) => {
    const node = document.createElement("span");
    node.innerHTML = String(html);
    return node.textContent.trim();
  };
  function table(items, cols, page = V.page) {
    let rows = items;
    if (V.sort === "名称")
      rows = [...items].sort((a, b) =>
        String(a.name || a.schoolName || a.id).localeCompare(
          String(b.name || b.schoolName || b.id),
          "zh-CN",
        ),
      );
    if (V.sort === "金额从高到低")
      rows = [...items].sort(
        (a, b) =>
          (b.amount ?? (b.lines ? Y.amount(b) : 0)) -
          (a.amount ?? (a.lines ? Y.amount(a) : 0)),
      );
    Y.currentExport = [
      cols.filter((c) => c.label !== "操作").map((c) => c.label),
      ...rows.map((r) =>
        cols
          .filter((c) => c.label !== "操作")
          .map((c) =>
            c.export ? c.export(r) : c.render ? clean(c.render(r)) : r[c.key],
          ),
      ),
    ];
    return U.table(rows, cols, page);
  }
  const small = (name, sub) =>
    `<div class="cell-name">${e(name)}</div>${sub ? `<div class="muted small">${e(sub)}</div>` : ""}`;
  const productCell = (x) =>
    `<div class="product-cell"><img class="product-thumb" src="assets/images/${e(x.image || "greens")}.jpg" alt=""><div>${small(x.name, x.code + " · " + x.spec)}</div></div>`;
  const colOrder = [
    {
      label: "订单编号",
      render: (o) =>
        `<button class="btn ghost sm link" data-action="order-detail" data-id="${o.id}">${o.id}</button><div class="muted small">${e(o.source)}</div>`,
    },
    {
      label: "学校客户",
      render: (o) => small(s(o.schoolId).name, s(o.schoolId).type),
    },
    { label: "配送日期", key: "deliveryDate" },
    {
      label: "订单金额",
      right: true,
      render: (o) => `<span class="strong num">${m(Y.amount(o))}</span>`,
    },
    { label: "履约状态", render: (o) => tag(o.status) },
    {
      label: "操作",
      render: (o) =>
        `<div class="actions">${b("详情", "order-detail", o.id, "sm ghost")}${o.status === "待确认" ? b("接单", "order-confirm", o.id, "sm primary") : o.status === "待采购" ? b("采购", "order-purchase", o.id, "sm") : o.status === "待分拣" ? b("分拣", "order-sort", o.id, "sm") : o.status === "待装车" ? b("发车", "order-ship", o.id, "sm") : o.status === "配送中" ? b("签收", "order-sign", o.id, "sm") : ""}</div>`,
    },
  ];
  const margin = (x) =>
    ((x.prices["中小学"] - x.cost) / x.prices["中小学"]) * 100;
  const views = {
    index() {
      const a = d(),
        today = a.orders.filter(
          (o) => o.date === a.settings.date && o.status !== "已取消",
        ),
        total = Y.sum(today, Y.amount),
        signed = today.filter((o) => o.status === "已签收").length;
      const valid = a.certs.filter((c) =>
        ["已通过", "已分配", "打印队列"].includes(c.status),
      ).length;
      const series = Array.from({ length: 7 }, (_, k) => {
        const date = new Date(Date.UTC(2026, 10, 11 + k))
            .toISOString()
            .slice(0, 10),
          os = a.orders.filter((o) => o.date === date && o.status !== "已取消");
        return {
          date,
          value: Y.sum(os, Y.amount),
          gross: Y.sum(os, (o) => Y.amount(o) - Y.cost(o)),
        };
      });
      const ranks = Y.report(a, V.start, V.end).slice(0, 5);
      const todos = [
        [
          "待分拣订单",
          a.orders.filter((o) => o.status === "待分拣").length,
          "sort",
          "green",
          "sorting.html",
          "核对实称，完成分拣出库",
        ],
        [
          "待审核资料",
          a.certs.filter((c) => c.status === "待审核").length,
          "shield",
          "blue",
          "food-safety.html?status=待审核",
          "审核供应商最新食安文件",
        ],
        [
          "价格异常",
          a.products.filter((p) =>
            Object.values(p.prices).some(
              (v) => ((v - p.cost) / v) * 100 < a.settings.lowMargin,
            ),
          ).length,
          "alert",
          "amber",
          "pricing.html",
          "关注负毛利与低毛利商品",
        ],
        [
          "待核对账单",
          a.bills.filter((b) => b.status === "待核对").length,
          "wallet",
          "blue",
          "reconciliation.html",
          "核对客户与供应商月结单",
        ],
      ];
      return (
        head(
          "经营总览",
          "每一份新鲜，都有据可循。",
          b("导出报表", "dashboard-export", "", "", "download") +
            b("新建订单", "new-order", "", "primary", "plus"),
        ) +
        stats([
          ["今日销售额", m(total), "今日有效订单金额", "money"],
          [
            "今日订单",
            n(today.length),
            "覆盖 " + new Set(today.map((o) => o.schoolId)).size + " 家学校",
            "orders",
          ],
          [
            "履约完成率",
            Math.round((signed / Math.max(1, today.length)) * 100) + "%",
            signed + " 单已完成签收",
            "truck",
          ],
          [
            "食安资料",
            valid + " / " + a.certs.length,
            "已审核及分配的有效资料",
            "shield",
          ],
        ]) +
        `<div class="two-col"><section class="panel"><div class="panel-head"><div><h2>销售与毛利趋势</h2><p>最近 7 天 · 按有效订单金额</p></div><div class="legend"><span><i></i>销售额</span><span><i class="light"></i>毛利</span></div></div><div class="panel-body">${U.chart(series)}<div class="chart-foot"><span>累计销售<strong>${m(Y.sum(series, (x) => x.value))}</strong></span><span>累计毛利<strong>${m(Y.sum(series, (x) => x.gross))}</strong></span></div></div></section><section class="panel"><div class="panel-head"><h2>今日待办</h2><span class="tag">${a.settings.date.slice(5).replace("-", "月")}日</span></div><div class="panel-body">${todos.map((t) => `<a class="todo-row" href="${t[4]}"><span class="inline"><span class="todo-icon ${t[3]}">${i(t[2])}</span><span>${t[0]}<small>${t[5]}</small></span></span><span class="inline"><strong class="todo-num">${t[1]}</strong>${i("right")}</span></a>`).join("")}</div></section></div><section class="panel"><div class="panel-head"><h2>今日订单</h2><a href="orders.html" class="link small">查看全部 ${i("right")}</a></div>${table(today, colOrder, 1)}</section><div class="two-equal" style="margin-top:22px"><section class="panel"><div class="panel-head"><h2>学校经营排行</h2><a href="reports.html" class="link small">本月报表</a></div><div class="panel-body">${ranks.map((r, k) => `<div class="school-rank-row"><span class="rank-number">0${k + 1}</span><span>${e(r.school.name)}</span><span class="num right">${m(r.revenue)}</span><span class="positive right">${r.revenue ? ((r.gross / r.revenue) * 100).toFixed(1) : 0}%</span></div>`).join("")}</div></section><section class="panel"><div class="panel-head"><h2>最近业务动态</h2><span class="small muted">操作留痕</span></div><div class="panel-body"><div class="timeline">${a.logs
          .slice(0, 4)
          .map(
            (l) =>
              `<div class="timeline-item">${e(l.text)}<small>${e(l.date)}</small></div>`,
          )
          .join("")}</div></div></section></div>`
      );
    },
    customers() {
      let items = d().schools.filter(
        (x) =>
          search(x, ["name", "area", "contact"]) &&
          (!V.filter || x.type === V.filter),
      );
      return (
        head(
          "客户管理",
          "服务西安学校食堂，统一管理客户资料与协议价。",
          b("新增客户", "new-entity", "schools", "primary", "plus"),
        ) +
        stats([
          ["学校客户", d().schools.length, "中小学与幼儿园", "users"],
          [
            "中小学",
            d().schools.filter((s) => s.type === "中小学").length,
            "采用中小学协议价",
            "building",
          ],
          [
            "幼儿园",
            d().schools.filter((s) => s.type === "幼儿园").length,
            "采用幼儿园协议价",
            "building",
          ],
          ["结算方式", "月结", "账期按客户档案设置", "wallet"],
        ]) +
        `<section class="panel">${toolbar("搜索学校、区域或联系人", ["中小学", "幼儿园"], "", "全部类型")}${table(
          items,
          [
            {
              label: "学校名称",
              render: (x) =>
                `<div class="product-cell"><span class="school-letter">${e(x.name[0])}</span>${small(x.name, x.address)}</div>`,
            },
            {
              label: "客户类型",
              render: (x) =>
                `<span class="tag ${x.type === "幼儿园" ? "amber" : "blue"}">${x.type}</span>`,
            },
            { label: "所在区域", key: "area" },
            { label: "联系人", render: (x) => small(x.contact, x.phone) },
            { label: "默认线路", render: (x) => e(route(x.routeId).name) },
            { label: "账期", render: (x) => x.term + " 天" },
            {
              label: "状态",
              render: (x) => tag(x.active ? "已启用" : "已停用"),
            },
            {
              label: "操作",
              render: (x) =>
                b("详情", "entity-detail", "schools|" + x.id, "sm ghost") +
                b("编辑", "edit-entity", "schools|" + x.id, "sm ghost"),
            },
          ],
        )}</section>`
      );
    },
    suppliers() {
      const a = d(),
        items = a.suppliers.filter(
          (x) =>
            search(x, ["name", "category", "contact"]) &&
            (!V.filter || x.category === V.filter),
        );
      return (
        head(
          "供应商",
          "供货品类、月结账期与食安资料，一处协同。",
          b("新增供应商", "new-entity", "suppliers", "primary", "plus"),
        ) +
        stats([
          ["合作供应商", a.suppliers.length, "覆盖六大供货品类", "building"],
          [
            "待收货采购",
            a.purchases.filter((p) => p.status === "待收货").length,
            "采购单待验收入库",
            "box",
          ],
          [
            "待收集资料",
            a.certs.filter((c) => c.status === "待收集").length,
            "收集窗口 18:00–次日01:00",
            "shield",
          ],
          ["采购结算", "月结", "应付以已入库采购为依据", "wallet"],
        ]) +
        `<section class="panel">${toolbar("搜索供应商、联系人", ["蔬菜", "水果", "肉蛋", "调料粮油", "海鲜", "冻品"], "", "全部品类")}${table(
          items,
          [
            { label: "供应商名称", render: (x) => small(x.name, x.address) },
            { label: "供货品类", key: "category" },
            { label: "联系人", render: (x) => small(x.contact, x.phone) },
            { label: "账期", render: (x) => x.term + " 天" },
            {
              label: "食安资料",
              render: (x) => {
                const cs = a.certs.filter((c) => c.supplierId === x.id);
                return (
                  cs.filter(
                    (c) => !["待收集", "待审核", "已退回"].includes(c.status),
                  ).length +
                  " / " +
                  cs.length +
                  " 份有效"
                );
              },
            },
            {
              label: "状态",
              render: (x) => tag(x.active ? "已启用" : "已停用"),
            },
            {
              label: "操作",
              render: (x) =>
                b("详情", "entity-detail", "suppliers|" + x.id, "sm ghost") +
                b("编辑", "edit-entity", "suppliers|" + x.id, "sm ghost"),
            },
          ],
        )}</section>`
      );
    },
    products() {
      const a = d(),
        items = a.products.filter(
          (x) =>
            search(x, ["name", "code", "spec", "sub"]) &&
            (!V.filter || x.category === V.filter),
        );
      return (
        head(
          "商品库",
          "统一商品分类、规格、计价单位与两套学校协议价。",
          b("新增商品", "new-entity", "products", "primary", "plus"),
        ) +
        `<section class="panel">${toolbar("搜索商品名称、编码、规格", ["蔬菜", "水果", "肉蛋", "调料粮油", "冻品", "海鲜"], `<span class="small muted">${n(a.products.length)} 个 SKU</span>`, "全部分类")}${table(
          items,
          [
            { label: "商品信息", render: productCell },
            { label: "分类", render: (x) => small(x.category, x.sub) },
            {
              label: "采购基准",
              right: true,
              render: (x) => m(x.cost) + " / " + x.unit,
            },
            {
              label: "中小学协议价",
              right: true,
              render: (x) => m(x.prices["中小学"]),
            },
            {
              label: "幼儿园协议价",
              right: true,
              render: (x) => m(x.prices["幼儿园"]),
            },
            { label: "供应商", render: (x) => e(sup(x.supplierId).name) },
            { label: "状态", render: (x) => tag(x.active ? "在售" : "已下架") },
            {
              label: "操作",
              render: (x) =>
                b("详情", "entity-detail", "products|" + x.id, "sm ghost") +
                b("编辑", "edit-entity", "products|" + x.id, "sm ghost"),
            },
          ],
        )}</section>`
      );
    },
    orders() {
      const a = d(),
        items = a.orders
          .filter(
            (o) =>
              search(o, ["id", (x) => s(x.schoolId).name]) &&
              (!V.filter || o.status === V.filter) &&
              (!V.school || o.schoolId === V.school),
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return (
        head(
          "订单管理",
          "从学校需求到配送签收，全程追踪每一张订单。",
          b("AI 录单", "goto", "ai-entry.html", "", "spark") +
            b("新建订单", "new-order", "", "primary", "plus"),
        ) +
        stats([
          [
            "今日订单",
            a.orders.filter((o) => o.date === a.settings.date).length,
            "按业务日期统计",
            "orders",
          ],
          [
            "待接单",
            a.orders.filter((o) => o.status === "待确认").length,
            "核对学校需求后确认",
            "clock",
          ],
          [
            "履约中",
            a.orders.filter((o) =>
              ["采购中", "待分拣", "待装车", "配送中"].includes(o.status),
            ).length,
            "采购到配送作业",
            "truck",
          ],
          [
            "已签收",
            a.orders.filter((o) => o.status === "已签收").length,
            "可纳入客户对账",
            "check",
          ],
        ]) +
        `<section class="panel">${toolbar("搜索订单号、学校名称", ["待确认", "待采购", "采购中", "待分拣", "待装车", "配送中", "已签收", "已取消"], `<select aria-label="学校筛选" data-filter="school">${U.opts(a.schools, V.school, "全部学校")}</select>`)}${table(items, colOrder)}</section>`
      );
    },
    procurement() {
      const a = d(),
        pending = a.orders.filter((o) => o.status === "待采购"),
        items = a.purchases
          .filter(
            (o) =>
              search(o, ["id", (x) => sup(x.supplierId).name]) &&
              (!V.filter || o.status === V.filter),
          )
          .sort((a, b) => b.date.localeCompare(a.date));
      return (
        head(
          "采购管理",
          "按订单汇总采购需求，供应商送货后确认收货入库。",
          b("新建采购", "new-purchase", "", "", "plus") +
            b("汇总待采购订单", "generate-purchases", "", "primary", "box"),
        ) +
        stats([
          ["待采购订单", pending.length, "确认接单后汇总需求", "orders"],
          [
            "待收货",
            a.purchases.filter((p) => p.status === "待收货").length,
            "核对数量与生产日期",
            "box",
          ],
          [
            "已入库",
            a.purchases.filter((p) => p.status === "已入库").length,
            "已生成批次与库存流水",
            "warehouse",
          ],
          [
            "本月已采购",
            m(
              Y.sum(
                a.purchases.filter((p) => p.status === "已入库"),
                (p) => Y.sum(p.lines, (l) => Math.round(l.qty * l.cost)),
              ),
            ),
            "按已入库采购金额",
            "money",
          ],
        ]) +
        `<section class="panel">${toolbar("搜索采购编号、供应商", ["待收货", "已入库"])}${table(
          items,
          [
            { label: "采购单编号", render: (x) => small(x.id, x.source) },
            { label: "供应商", render: (x) => e(sup(x.supplierId).name) },
            { label: "采购日期", key: "date" },
            { label: "商品数", render: (x) => x.lines.length + " 项" },
            {
              label: "采购金额",
              right: true,
              render: (x) =>
                m(Y.sum(x.lines, (l) => Math.round(l.qty * l.cost))),
            },
            { label: "关联订单", render: (x) => x.orderIds.length + " 单" },
            { label: "状态", render: (x) => tag(x.status) },
            {
              label: "操作",
              render: (x) =>
                b("详情", "purchase-detail", x.id, "sm ghost") +
                (x.status === "待收货"
                  ? b("收货入库", "purchase-receive", x.id, "sm primary")
                  : ""),
            },
          ],
        )}</section>`
      );
    },
    inventory() {
      const a = d(),
        stockTab = V.tab || "库存总览";
      let items = a.products.filter(
        (x) =>
          search(x, ["name", "code"]) && (!V.filter || x.category === V.filter),
      );
      const low = a.products.filter((x) => Y.stock(a, x.id) < x.minStock);
      const cols = [
        { label: "商品信息", render: productCell },
        { label: "分类", key: "category" },
        {
          label: "可用库存",
          right: true,
          render: (x) =>
            `<span class="num ${Y.stock(a, x.id) < x.minStock ? "negative strong" : ""}">${n(Y.stock(a, x.id))} ${e(x.unit)}</span>`,
        },
        {
          label: "安全库存",
          right: true,
          render: (x) => n(x.minStock) + " " + x.unit,
        },
        {
          label: "库存状态",
          render: (x) =>
            tag(Y.stock(a, x.id) < x.minStock ? "库存偏低" : "库存正常"),
        },
        {
          label: "操作",
          render: (x) =>
            b("批次", "inventory-detail", x.id, "sm ghost") +
            b("库存作业", "inventory-adjust", x.id, "sm ghost"),
        },
      ];
      if (stockTab === "库存流水") {
        items = a.movements.filter((x) =>
          search(x, ["id", "type", "note", (x) => p(x.productId).name]),
        );
        cols.splice(
          0,
          cols.length,
          { label: "流水编号", key: "id" },
          { label: "业务日期", key: "date" },
          { label: "商品", render: (x) => e(p(x.productId).name) },
          { label: "业务类型", render: (x) => tag(x.type) },
          {
            label: "变动数量",
            right: true,
            render: (x) =>
              (x.qty > 0 ? "+" : "") +
              n(x.qty) +
              " " +
              p(x.productId).unit +
              (x.movedQty ? "（调拨" + n(x.movedQty) + "）" : ""),
          },
          { label: "关联单据 / 说明", render: (x) => e(x.note) },
        );
      }
      return (
        head(
          "入库库存",
          "单仓批次管理，收货、退换货、调拨与报损留痕。",
          b("新增库存作业", "inventory-adjust", "", "primary", "plus"),
        ) +
        stats([
          [
            "在库商品",
            a.products.filter((x) => Y.stock(a, x.id) > 0).length,
            "可用库存大于零",
            "box",
          ],
          ["库存预警", low.length, "低于商品安全库存", "alert"],
          [
            "库存批次",
            a.batches.filter((x) => x.qty > 0).length,
            "先进到期批次优先出库",
            "warehouse",
          ],
          [
            "本日库存流水",
            a.movements.filter((x) => x.date === a.settings.date).length,
            "每一次变动都有记录",
            "file",
          ],
        ]) +
        `<section class="panel"><div class="toolbar">${tabs(["库存总览", "库存流水"], stockTab)}<span class="small muted">总仓 · 西安中心仓</span></div>${toolbar("搜索商品、编码或流水", stockTab === "库存流水" ? [] : ["蔬菜", "水果", "肉蛋", "调料粮油", "冻品", "海鲜"], "", "全部分类")}${table(items, cols)}</section>`
      );
    },
    sorting() {
      const a = d(),
        items = a.orders.filter(
          (o) =>
            ["待分拣", "待装车"].includes(o.status) &&
            search(o, ["id", (x) => s(x.schoolId).name]) &&
            (!V.filter || o.status === V.filter),
        );
      return (
        head(
          "分拣管理",
          "按学校核对商品与实称，确认后扣减库存并转待装车。",
          b("查看库存", "goto", "inventory.html", "", "warehouse"),
        ) +
        `<section class="panel" style="margin-bottom:20px"><div class="step-flow">${[
          ["确认接单", "核对学校需求"],
          ["采购收货", "补齐所需库存"],
          ["称重分拣", "记录实称差异"],
          ["装车配送", "第三方承运"],
          ["学校签收", "完成履约"],
        ]
          .map(
            (x, k) =>
              `<div class="step"><span class="step-circle">${k + 1}</span><span>${x[0]}<small>${x[1]}</small></span></div>`,
          )
          .join("")}</div></section>` +
        stats([
          [
            "待分拣订单",
            a.orders.filter((o) => o.status === "待分拣").length,
            "支持实称数量核对",
            "sort",
          ],
          [
            "待装车订单",
            a.orders.filter((o) => o.status === "待装车").length,
            "分拣已完成",
            "truck",
          ],
          [
            "待分拣商品行",
            Y.sum(
              a.orders.filter((o) => o.status === "待分拣"),
              (o) => o.lines.length,
            ),
            "以商品计价单位录入",
            "box",
          ],
          ["出库规则", "先到期先出", "库存不足时不能确认", "shield"],
        ]) +
        notice(
          "实称数量可在订购量的 120% 以内调整；件装商品按整数件核对。确认分拣后按实际数量计价。",
        ) +
        `<section class="panel">${toolbar("搜索订单号或学校", ["待分拣", "待装车"])}${table(items, colOrder)}</section>`
      );
    },
    dispatch() {
      const a = d(),
        items = a.orders.filter(
          (o) =>
            ["待装车", "配送中", "已签收"].includes(o.status) &&
            o.deliveryDate === a.settings.date &&
            (!V.route || o.routeId === V.route) &&
            search(o, ["id", (x) => s(x.schoolId).name]) &&
            (!V.filter || o.status === V.filter),
        );
      return (
        head(
          "配送管理",
          "第三方冷链承运，按线路装车与跟踪学校签收。",
          b("打印配送清单", "dispatch-print", "", "", "print"),
        ) +
        `<div class="route-grid">${a.routes
          .map((r) => {
            const os = a.orders.filter(
              (o) =>
                o.routeId === r.id &&
                o.deliveryDate === a.settings.date &&
                o.status !== "已取消",
            );
            return `<button class="route-card ${V.route === r.id ? "active" : ""}" data-action="route" data-id="${r.id}"><div class="between">${i("truck")}<span class="tag">${os.length} 单</span></div><strong>${e(r.name)}</strong><p>${e(r.driver)} · ${e(r.vehicle)}<br>${e(r.carrier)}</p><div class="progress-track" style="margin-top:13px"><span style="width:${(os.filter((o) => o.status === "已签收").length / Math.max(1, os.length)) * 100}%"></span></div></button>`;
          })
          .join("")}</div>` +
        notice(
          "全部配送由第三方承运。发车前需完成分拣；学校端确认收货后，后台同步更新为已签收。",
          "blue",
        ) +
        `<section class="panel">${toolbar("搜索订单、学校", ["待装车", "配送中", "已签收"], V.route ? b("全部线路", "route", "", "sm") : "")}${table(items, [...colOrder.slice(0, 3), { label: "配送线路", render: (o) => small(route(o.routeId).name, route(o.routeId).driver + " · " + route(o.routeId).vehicle) }, ...colOrder.slice(3)])}</section>`
      );
    },
    "ai-entry"() {
      const a = d(),
        type = V.tab || "供应商送货单";
      return (
        head(
          "AI 智慧录单",
          "让重复录入交给助手，把审核与确认留给业务人员。",
          `<span class="tag blue">${i("spark")}演示识别流程</span>`,
        ) +
        `<div class="ai-grid"><section class="panel"><div class="panel-head">${tabs(["供应商送货单", "学校订货单"], type)}</div><div class="ai-source"><div class="between"><h3>原始单据</h3><span class="small muted">样例 / 本地预览</span></div><label class="upload-zone" style="display:block">${i("upload")}<p>点击选择图片或 PDF</p><small>文件用于预览；识别结果采用可编辑的演示样例</small><input type="file" id="ai-file" accept="image/*,.pdf" hidden></label><div id="ai-file-preview"></div><div class="sample-sheet"><h3>${type === "供应商送货单" ? "秦丰蔬菜送货单" : "育才小学食堂订货单"}</h3><div>日期：${a.settings.date}　　单号：YM-1117</div><table><thead><tr><th>商品</th><th>数量</th><th>${type === "供应商送货单" ? "采购价" : "单位"}</th></tr></thead><tbody><tr><td>黄心土豆</td><td>80 kg</td><td>${type === "供应商送货单" ? "2.40 元" : "一级散装"}</td></tr><tr><td>西红柿</td><td>60 kg</td><td>${type === "供应商送货单" ? "4.20 元" : "一级散装"}</td></tr><tr><td>油麦菜</td><td>40 kg</td><td>${type === "供应商送货单" ? "3.00 元" : "一级散装"}</td></tr></tbody></table><div style="margin-top:12px">生产日期：${a.settings.date}　保质期：7 天</div><div>经办人：张师傅　验收人：________</div></div><div class="actions" style="margin-top:23px">${b("开始演示识别", "ai-recognize", "", "primary", "spark")}${b("重置结果", "ai-reset", "", "", "refresh")}</div></div></section><section class="panel"><div class="panel-head"><div><h2>识别与确认</h2><p>自动匹配商品库，人工复核后生成业务单据</p></div></div><div class="panel-body" id="ai-result"><div class="empty" style="padding:70px 0">${i("spark")}<div>准备好单据，开始识别</div><p class="small">支持商品、数量、采购价、生产日期与保质期字段</p></div><div class="ai-step">${i("file")}提取单据字段</div><div class="ai-step">${i("box")}匹配商品与计量单位</div><div class="ai-step">${i("shield")}标注待复核项</div><div class="ai-step">${i("check")}确认后生成订单或入库单</div></div></section></div>`
      );
    },
    "food-safety"() {
      const a = d(),
        items = a.certs.filter(
          (c) =>
            search(c, ["id", "type", (x) => sup(x.supplierId).name]) &&
            (!V.filter || c.status === V.filter),
        );
      return (
        head(
          "食安资料",
          "供应商资料统一收集、审核、分配与打印。",
          b("查看打印队列", "cert-queue", "", "", "print") +
            b("模拟收集群资料", "cert-collect", "", "primary", "spark"),
        ) +
        stats([
          ["应收集资料", a.certs.length, "18 家供应商 · 当前作业批次", "file"],
          [
            "待收集 / 退回",
            a.certs.filter((c) => ["待收集", "已退回"].includes(c.status))
              .length,
            "可通过模拟收集补齐",
            "clock",
          ],
          [
            "待审核",
            a.certs.filter((c) => c.status === "待审核").length,
            "请核对供应商与检测内容",
            "shield",
          ],
          [
            "临期资料",
            a.certs.filter(
              (c) =>
                new Date(c.expires) - new Date(a.settings.date) <= 3 * 86400000,
            ).length,
            "有效期剩余不超过 3 天",
            "alert",
          ],
        ]) +
        notice(
          "资料收集窗口：18:00 → 次日 01:00；出车时间 04:00。群文件采集与打印机联动在本版中演示处理流程。",
          "blue",
        ) +
        `<section class="panel">${toolbar("搜索供应商或资料类型", ["待收集", "待审核", "已通过", "已分配", "打印队列", "已退回"])}${table(
          items,
          [
            {
              label: "资料名称",
              render: (c) => small(c.type, c.id + " · " + c.date),
            },
            { label: "供应商", render: (c) => e(sup(c.supplierId).name) },
            {
              label: "有效期",
              render: (c) =>
                small(
                  c.expires,
                  new Date(c.expires) - new Date(a.settings.date) <=
                    3 * 86400000
                    ? "即将到期"
                    : "有效",
                ),
            },
            { label: "分配学校", render: (c) => c.schools.length + " 家" },
            { label: "资料状态", render: (c) => tag(c.status) },
            {
              label: "操作",
              render: (c) =>
                b("预览", "cert-detail", c.id, "sm ghost") +
                (c.status === "待审核"
                  ? b("审核", "cert-review", c.id, "sm primary")
                  : ["已通过", "已分配"].includes(c.status)
                    ? b("分配", "cert-assign", c.id, "sm ghost") +
                      b("打印", "cert-print", c.id, "sm ghost")
                    : ""),
            },
          ],
        )}</section>`
      );
    },
    pricing() {
      const a = d();
      let items = a.products.filter(
        (x) =>
          search(x, ["name", "code"]) && (!V.filter || x.category === V.filter),
      );
      const tab = V.tab || "价格预警";
      if (tab === "价格预警")
        items = items.filter((x) =>
          Object.values(x.prices).some(
            (v) => ((v - x.cost) / v) * 100 < a.settings.lowMargin,
          ),
        );
      const negatives = a.products.filter((p) =>
        Object.values(p.prices).some((v) => v < p.cost),
      );
      return (
        head(
          "协议价与预警",
          "采购基准与两套学校协议价对照，及时识别亏损风险。",
          b("调整预警阈值", "goto", "settings.html", "", "settings"),
        ) +
        stats([
          ["协议价体系", "2 套", "中小学 / 幼儿园", "tag"],
          ["负毛利商品", negatives.length, "至少一套价格低于采购成本", "alert"],
          [
            "低毛利阈值",
            a.settings.lowMargin + "%",
            "可在系统设置统一调整",
            "chart",
          ],
          ["调价规则", "新单生效", "历史订单成交价保持不变", "shield"],
        ]) +
        notice(
          "负毛利与低毛利为实时计算。调价只影响新订单，已生成订单保留原始成交单价。",
          "amber",
        ) +
        `<section class="panel"><div class="toolbar">${tabs(["价格预警", "全部协议价"], tab)}<span class="small muted">蔬菜、鲜果与肉蛋每周维护</span></div>${toolbar("搜索商品名称或编码", ["蔬菜", "水果", "肉蛋", "调料粮油", "冻品", "海鲜"], "", "全部分类")}${table(
          items,
          [
            { label: "商品信息", render: productCell },
            { label: "采购基准", right: true, render: (x) => m(x.cost) },
            {
              label: "中小学协议价",
              right: true,
              render: (x) => m(x.prices["中小学"]),
            },
            {
              label: "毛利率",
              right: true,
              render: (x) =>
                `<span class="${margin(x) < 0 ? "negative" : "positive"} num">${margin(x).toFixed(1)}%</span>`,
            },
            {
              label: "幼儿园协议价",
              right: true,
              render: (x) => m(x.prices["幼儿园"]),
            },
            {
              label: "预警状态",
              render: (x) =>
                Object.values(x.prices).some((v) => v < x.cost)
                  ? tag("负毛利")
                  : Object.values(x.prices).some(
                        (v) => ((v - x.cost) / v) * 100 < a.settings.lowMargin,
                      )
                    ? tag("低毛利")
                    : tag("价格正常"),
            },
            {
              label: "操作",
              render: (x) => b("调整价格", "price-edit", x.id, "sm primary"),
            },
          ],
        )}</section>`
      );
    },
    reconciliation() {
      const a = d(),
        items = a.bills.filter(
          (x) =>
            x.kind === V.kind &&
            x.month === V.month &&
            search(x, ["id", "name"]) &&
            (!V.filter || x.status === V.filter),
        );
      const all = a.bills.filter(
        (b) => b.kind === V.kind && b.month === V.month,
      );
      return (
        head(
          "对账结算",
          "客户应收与供应商应付独立核对，按月生成账单。",
          b("生成本月账单", "generate-bills", "", "primary", "plus"),
        ) +
        stats([
          [
            "账单总额",
            m(Y.sum(all, (b) => b.amount)),
            e(V.month) + " · " + V.kind,
            "wallet",
          ],
          [
            "已结算",
            m(Y.sum(all, (b) => b.paid)),
            "本地登记收付款金额",
            "check",
          ],
          [
            "未结算",
            m(Y.sum(all, (b) => b.amount - b.paid)),
            "待收或待付金额",
            "money",
          ],
          [
            "待核对",
            all.filter((b) => b.status === "待核对").length,
            "核对后可登记收付款",
            "file",
          ],
        ]) +
        `<section class="panel"><div class="toolbar">${tabs(["客户应收", "供应商应付"], V.kind)}<input aria-label="结算月份" data-filter="month" type="month" value="${e(V.month)}"></div>${toolbar("搜索账单号或往来单位", ["待核对", "已确认", "部分结算", "已结清"])}${table(
          items,
          [
            {
              label: "账单编号",
              render: (x) => small(x.id, x.month + " 月结"),
            },
            { label: "往来单位", key: "name" },
            { label: "单据数量", render: (x) => x.docIds.length + " 单" },
            { label: "应结金额", right: true, render: (x) => m(x.amount) },
            { label: "已结金额", right: true, render: (x) => m(x.paid) },
            {
              label: "未结金额",
              right: true,
              render: (x) => m(x.amount - x.paid),
            },
            { label: "状态", render: (x) => tag(x.status) },
            {
              label: "操作",
              render: (x) =>
                b("详情", "bill-detail", x.id, "sm ghost") +
                (x.status === "待核对"
                  ? b("确认对账", "bill-confirm", x.id, "sm primary")
                  : x.status !== "已结清"
                    ? b("登记结算", "bill-pay", x.id, "sm primary")
                    : ""),
            },
          ],
        )}</section>`
      );
    },
    reports() {
      const a = d(),
        rows = Y.report(a, V.start, V.end, V.school),
        revenue = Y.sum(rows, (r) => r.revenue),
        gross = Y.sum(rows, (r) => r.gross),
        tab = V.tab || "学校利润";
      let items = rows.filter(
        (r) => r.orders > 0 && search(r, [(x) => x.school.name]),
      );
      let cols = [
        {
          label: "学校客户",
          render: (r) => small(r.school.name, r.school.type),
        },
        { label: "已签收订单", render: (r) => r.orders + " 单" },
        { label: "销售收入", right: true, render: (r) => m(r.revenue) },
        { label: "采购成本", right: true, render: (r) => m(r.purchase) },
        {
          label: "毛利",
          right: true,
          render: (r) => `<span class="positive">${m(r.gross)}</span>`,
        },
        {
          label: "毛利率",
          right: true,
          render: (r) =>
            (r.revenue ? (r.gross / r.revenue) * 100 : 0).toFixed(1) + "%",
        },
        {
          label: "配送 / 其他 / 损耗",
          right: true,
          render: (r) => m(r.delivery + r.other + r.loss),
        },
        {
          label: "估算净利润",
          right: true,
          render: (r) =>
            `<strong class="${r.net < 0 ? "negative" : "positive"}">${m(r.net)}</strong>`,
        },
      ];
      if (tab === "商品毛利") {
        const map = new Map();
        a.orders
          .filter(
            (o) =>
              o.status === "已签收" &&
              o.deliveryDate >= V.start &&
              o.deliveryDate <= V.end &&
              (!V.school || o.schoolId === V.school),
          )
          .forEach((o) =>
            o.lines.forEach((l) => {
              const r = map.get(l.productId) || {
                id: l.productId,
                qty: 0,
                revenue: 0,
                purchase: 0,
              };
              r.qty += l.actualQty ?? l.qty;
              r.revenue += Math.round((l.actualQty ?? l.qty) * l.price);
              r.purchase += Math.round((l.actualQty ?? l.qty) * l.cost);
              map.set(l.productId, r);
            }),
          );
        items = [...map.values()]
          .filter((r) => search(r, [(x) => p(x.id).name]))
          .sort((a, b) => b.revenue - a.revenue);
        cols = [
          { label: "商品", render: (r) => productCell(p(r.id)) },
          {
            label: "出货数量",
            right: true,
            render: (r) => n(r.qty) + " " + p(r.id).unit,
          },
          { label: "销售收入", right: true, render: (r) => m(r.revenue) },
          { label: "采购成本", right: true, render: (r) => m(r.purchase) },
          {
            label: "商品毛利",
            right: true,
            render: (r) => m(r.revenue - r.purchase),
          },
          {
            label: "毛利率",
            right: true,
            render: (r) =>
              (
                ((r.revenue - r.purchase) / Math.max(1, r.revenue)) *
                100
              ).toFixed(1) + "%",
          },
        ];
      }
      return (
        head(
          "经营报表",
          "按学校和商品查看收入、成本与盈利，支持日期范围和周报。",
          b("本周", "report-week", "", "", "calendar") +
            b("打印报表", "print", "", "", "print"),
        ) +
        stats([
          ["销售收入", m(revenue), "统计已签收订单", "money"],
          [
            "采购成本",
            m(Y.sum(rows, (r) => r.purchase)),
            "采用出库成本快照",
            "box",
          ],
          ["商品毛利", m(gross), "收入减采购成本", "chart"],
          [
            "估算净利润",
            m(Y.sum(rows, (r) => r.net)),
            "扣除演示费用分摊",
            "wallet",
          ],
        ]) +
        notice(
          `费用口径：配送费 ${a.settings.deliveryRate}%、其他费用 ${a.settings.otherRate}%，按学校收入分摊报损。净利润为演示估算值。`,
        ) +
        `<section class="panel"><div class="toolbar">${tabs(["学校利润", "商品毛利"], tab)}<div class="toolbar-start"><input aria-label="开始日期" type="date" data-filter="start" value="${V.start}"><span class="muted">至</span><input aria-label="结束日期" type="date" data-filter="end" value="${V.end}"><select aria-label="学校筛选" data-filter="school">${U.opts(a.schools, V.school, "全部学校")}</select></div></div>${toolbar("搜索学校或商品")}${table(items, cols)}</section>`
      );
    },
    settings() {
      const a = d();
      return (
        head("系统设置", "统一业务参数、软件名称与演示数据管理。") +
        `<div class="settings-grid"><section class="panel"><form id="settings-form"><div class="setting-section"><h3>基础设置</h3><div class="form-grid">${U.field("软件名称", "name", a.settings.name, "text", 'required maxlength="16"')}${U.field("业务日期", "date", a.settings.date, "date", "disabled")}</div></div><div class="setting-section"><h3>价格与经营口径</h3><div class="form-grid">${U.field("低毛利预警阈值（%）", "lowMargin", a.settings.lowMargin, "number", 'required min="0" max="50" step="0.1"')}${U.field("配送费用分摊（%）", "deliveryRate", a.settings.deliveryRate, "number", 'required min="0" max="50" step="0.1"')}${U.field("其他费用分摊（%）", "otherRate", a.settings.otherRate, "number", 'required min="0" max="50" step="0.1"')}<div class="field"><label>食安资料收集窗口</label><input disabled value="18:00 → 次日 01:00"></div></div><div class="form-error" role="alert"></div><div style="margin-top:22px"><button class="btn primary" type="submit">${i("check")}保存设置</button></div></div></form></section><div class="stack"><section class="panel"><div class="setting-section"><h3>演示数据</h3><p class="muted small" style="line-height:2">已内置 40 家学校、18 家供应商、2040 个 SKU 及近 30 天业务单据。操作结果保存在当前浏览器中。</p><div class="actions" style="margin-top:18px">${b("备份数据", "backup", "", "", "download")}${b("恢复初始数据", "reset-data", "", "danger", "refresh")}</div></div></section><section class="panel"><div class="setting-section"><h3>连接与设备</h3><div class="todo-row"><span>AI 单据识别</span><span class="tag blue">演示流程</span></div><div class="todo-row"><span>企业微信群收集</span><span class="tag blue">模拟群文件</span></div><div class="todo-row"><span>打印服务</span><span class="tag green">浏览器预览</span></div><div class="todo-row"><span>访问统计</span><span class="tag">本地关闭</span></div><p class="small muted" style="line-height:1.8;margin-top:14px">同一浏览器、同一站点下的后台与学校端共用数据。跨设备同步需正式系统支持。</p></div></section></div></div>`
      );
    },
  };
  /** 渲染当前业务页面。page 为导航键，未识别时显示总览；返回原生 HTML，不触发业务写操作。 */
  Y.renderView = (page) => (views[page] || views.index)();
  Y.viewHelpers = {
    d,
    p,
    s,
    sup,
    route,
    head,
    stats,
    notice,
    table,
    small,
    productCell,
  };
})(window);

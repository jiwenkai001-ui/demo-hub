/* 供应商入口。订单范围由当前演示供应商确定，所有状态在统一存储中变更。 */
(function () {
  "use strict";
  const J = window.JIAHE;
  if (!J.store) return;
  const U = J.UI;
  const { esc: escape, icon, money, number, status } = U;
  const params = new URLSearchParams(location.search);
  const data = () => J.store.data;
  const suppliers = () => data().suppliers.filter((supplier) => supplier.active);
  let current = params.get("supplier") || "";
  let filter = "";
  let query = params.get("order") || "";
  let page = 1;
  const total = (purchase) => J.sum(purchase.lines, (line) => Math.round(line.qty * line.cost));
  const statuses = ["待供应商确认", "待送货", "待收货", "已入库"];

  function action(purchase) {
    if (purchase.status === "待供应商确认") return U.btn("确认接单", "vendor-accept", purchase.id, "primary", "check");
    if (purchase.status === "待送货") return U.btn("生成送货单", "vendor-deliver", purchase.id, "primary", "truck");
    return "";
  }

  function render() {
    const account = suppliers().find((entry) => entry.id === current) || suppliers()[0];
    const home = document.querySelector("#vendor");
    if (!account) {
      home.innerHTML = '<section class="panel empty">暂无可用供应商 <a class="btn" href="index.html">管理后台</a></section>';
      return;
    }
    current = account.id;
    const owned = data().purchases.filter((purchase) => purchase.supplierId === current)
      .sort((a, b) => b.date.localeCompare(a.date));
    const matches = owned.filter((purchase) => (!filter || purchase.status === filter) &&
      (!query || [purchase.id, purchase.deliveryNo, ...purchase.lines.map((row) => row.name)]
        .some((value) => String(value || "").toLowerCase().includes(query.toLowerCase()))));
    const pages = Math.max(1, Math.ceil(matches.length / 8));
    page = Math.min(page, pages);
    document.title = "供应商工作台 · " + data().settings.name;
    home.innerHTML = `<div class="vendor-shell">
      <header class="vendor-header">
        <a class="brand" href="index.html"><span class="brand-mark">${icon("leaf")}</span>
          <span><strong class="brand-name">${escape(data().settings.name)}</strong><span class="brand-sub"> · 供应商端</span></span></a>
        <a class="btn" href="procurement.html">管理后台 ${icon("external")}</a>
      </header>
      <div class="page-heading vendor-heading"><div><h1>供应商工作台</h1><p>${escape(account.name)} · ${escape(account.category)} · 账期 ${number(account.term)} 天</p></div>
        <div class="vendor-account">${U.select("切换演示供应商", "vendor", suppliers(), current)}</div>
      </div>
      <div class="vendor-metrics">${statuses.map((value) => `<button type="button" class="vendor-metric ${filter === value ? "active" : ""}" data-vendor-status="${value}">
          <span>${value}</span><strong>${owned.filter((po) => po.status === value).length}</strong>
        </button>`).join("")}</div>
      <section class="panel vendor-orders">
        <div class="toolbar"><div class="toolbar-start">
          <label class="search">${icon("search")}<input id="vendor-search" aria-label="搜索采购单" placeholder="采购单号、送货单号或商品" value="${escape(query)}"></label>
          <select id="vendor-filter" aria-label="采购单状态">${U.opts(statuses, filter, "全部状态")}</select>
        </div>${U.btn("导出清单", "vendor-export", "", "sm", "download")}</div>
        <div class="vendor-list">${matches.slice((page - 1) * 8, page * 8).map((po) => `
          <article class="vendor-order">
            <div><button class="btn ghost sm link" data-action="vendor-detail" data-id="${escape(po.id)}">${escape(po.id)}</button>
              <p class="muted small">配送 ${escape(po.deliveryDate || po.date)} · ${po.lines.length} 项商品</p></div>
            <div class="vendor-line-summary"><strong>${money(total(po))}</strong><p class="muted small">
              ${escape(po.lines.map((line) => line.name).slice(0, 2).join("、"))}${po.lines.length > 2 ? " 等" : ""}</p></div>
            <div>${status(po.status)}${po.deliveryNo ? `<p class="muted small">${escape(po.deliveryNo)}</p>` : ""}</div>
            <div class="actions">${U.btn("详情", "vendor-detail", po.id, "sm")}${action(po)}</div>
          </article>`).join("") || '<div class="empty">当前没有符合条件的采购单</div>'}</div>
        <div class="table-footer"><span>${matches.length} 条采购单</span>
          <div class="pagination"><button class="btn sm" data-vendor-page="-1" ${page === 1 ? "disabled" : ""}>上一页</button>
            <span>${page} / ${pages}</span><button class="btn sm" data-vendor-page="1" ${page === pages ? "disabled" : ""}>下一页</button></div></div>
      </section>
    </div>`;
    home.querySelector('[data-action="vendor-export"]').onclick = () => U.csv(
      [["采购单", "送货单", "配送日期", "金额（元）", "状态"],
        ...matches.map((po) => [po.id, po.deliveryNo, po.deliveryDate || po.date, (total(po) / 100).toFixed(2), po.status])],
      "供应商采购清单",
    );
  }

  function details(id) {
    const po = data().purchases.find((entry) => entry.id === id && entry.supplierId === current);
    if (!po) throw new Error("当前供应商无此订单");
    U.modal({
      title: (po.deliveryNo ? "送货单 · " + po.deliveryNo : "采购单 · " + po.id),
      wide: true,
      body: `<div class="between"><span>采购单 ${escape(po.id)}</span>${status(po.status)}</div>
        <p class="muted small vendor-detail-date">配送 ${escape(po.deliveryDate || po.date)}</p>
        <div class="table-wrap"><table><thead><tr><th>商品</th><th>供货数量</th>
          <th>采购单价</th><th>金额</th></tr></thead><tbody>${po.lines.map((line) => `<tr>
          <td>${escape(line.name)}</td><td>${number(line.qty)} ${escape(line.unit)}</td><td>${money(line.cost)}</td>
          <td>${money(Math.round(line.qty * line.cost))}</td></tr>`).join("")}</tbody></table></div>
        <div class="between vendor-detail-date"><strong>合计 ${money(total(po))}</strong>
          <div class="actions">${po.deliveryNo ? '<button class="btn" type="button" data-action="vendor-print">打印送货单</button>' : ""}${action(po)}</div></div>`,
    });
  }

  render();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    try {
      if (button.dataset.vendorStatus) {
        filter = filter === button.dataset.vendorStatus ? "" : button.dataset.vendorStatus;
        page = 1;
        render();
      }
      if (button.dataset.vendorPage) {
        page += Number(button.dataset.vendorPage);
        render();
      }
      if (button.dataset.action === "vendor-detail") details(button.dataset.id);
      if (button.dataset.action === "vendor-print") {
        document.body.classList.add("printing-modal");
        window.print();
        document.body.classList.remove("printing-modal");
      }
      if (["vendor-accept", "vendor-deliver"].includes(button.dataset.action)) {
        const id = button.dataset.id;
        const account = current;
        const action = button.dataset.action === "vendor-accept" ? "accept" : "deliver";
        U.confirm(action === "accept" ? "确认接单" : "生成送货单", id, () => {
          const purchase = J.store.supplierAction(id, account, action);
          filter = "";
          render();
          U.toast(purchase.deliveryNo ? "送货单 " + purchase.deliveryNo + " 已生成" : "已接单，待生成送货单");
        });
      }
    } catch (error) {
      U.toast(error.message, true);
    }
  });
  document.addEventListener("change", (event) => {
    const field = event.target;
    if (field.id === "f-vendor") {
      current = field.value;
      filter = query = "";
      const url = new URL(location.href);
      url.search = "";
      url.searchParams.set("supplier", current);
      history.replaceState(null, "", url);
    } else if (field.id === "vendor-filter") {
      filter = field.value;
    } else {
      return;
    }
    page = 1;
    render();
    document.getElementById(field.id)?.focus();
  });
  document.addEventListener("input", (event) => {
    if (event.target.id !== "vendor-search") return;
    query = event.target.value;
    const caret = event.target.selectionStart;
    page = 1;
    render();
    const input = document.querySelector("#vendor-search");
    input.focus();
    input.setSelectionRange(caret, caret);
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== J.KEY) return;
    J.store.refresh();
    if (!document.querySelector("dialog[open]")) render();
  });
})();

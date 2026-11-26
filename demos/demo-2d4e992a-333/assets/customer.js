/* 客户订货端：独立入口，与后台共享同源浏览器状态。 */
(function () {
  "use strict";
  const Y = window.JIAHE;
  if (Y.bootError) return;
  const U = Y.UI,
    { esc: e, icon: i, money: m, number: n } = U,
    page = document.body.dataset.page;
  let sid = Y.store.data.selectedCustomer || "S1",
    query = "",
    category = "",
    pageNo = 1;
  const data = () => Y.store.data,
    customer = () => Y.find(data(), "customers", sid),
    cart = () => data().carts[sid] || {},
    product = (id) => Y.find(data(), "products", id);
  function shell() {
    document.title = data().settings.name + " · 客户订货";
    document.body.innerHTML = `<div class="customer-app"><header class="customer-header"><a href="customer.html" class="customer-brand"><span class="brand-mark">${i("leaf")}</span>${e(data().settings.name)}<span class="small muted" style="font-weight:400">客户订货</span></a><a href="index.html" class="btn ghost sm" target="_blank" rel="noopener">${i("external")}管理后台</a></header><section class="customer-switch"><div class="between"><div><label class="small muted" for="customer-picker">当前客户</label><div><select id="customer-picker" aria-label="切换客户">${U.opts(
      data().customers.filter((s) => s.active),
      sid,
    )}</select></div></div><span class="tag green">${customer().type}协议价</span></div><div class="between small muted" style="margin-top:8px"><span>${i("truck")} 业务日 ${data().settings.date}</span><span>月结 ${customer().term} 天</span></div></section><main class="customer-content" id="customer-main"></main><div id="cart-bar"></div><nav class="customer-nav"><a class="${page === "customer" ? "active" : ""}" href="customer.html">${i("home")}订货</a><a class="${page === "customer-orders" ? "active" : ""}" href="customer-orders.html">${i("orders")}我的订单</a><button data-customer-action="account">${i("building")}客户</button></nav></div><div class="toast-container" role="status"></div>`;
    render();
  }
  function render() {
    const focus = document.activeElement?.id,
      at = document.activeElement?.selectionStart;
    if (page === "customer-orders") orders();
    else catalog();
    cartBar();
    if (focus === "customer-search") {
      const el = document.querySelector("#customer-search");
      el?.focus();
      el?.setSelectionRange(at, at);
    }
  }
  function cartBar() {
    const c = cart(),
      ids = Object.keys(c),
      total = ids.reduce(
        (s, id) => s + Math.round(c[id] * Y.quoteFor(data(), customer(), product(id)).price),
        0,
      );
    document.querySelector("#cart-bar").innerHTML =
      page === "customer"
        ? `<div class="cart-bar"><div class="inline"><span class="cart-icon">${i("cart")}${ids.length ? `<span class="cart-count">${ids.length}</span>` : ""}</span><div><div class="small muted">已选 ${ids.length} 种商品</div><div class="cart-total num">${m(total)}</div></div></div><button class="btn primary" data-customer-action="checkout" ${!ids.length ? "disabled" : ""}>去结算 ${i("arrow")}</button></div>`
        : "";
  }
  function catalog() {
    const list = data().products.filter(
      (p) =>
        p.active &&
        (!category || p.category === category) &&
        (!query ||
          [p.name, p.code, p.spec, p.sub].some((s) => s.includes(query))),
    );
    const c = cart(),
      visible = list.slice((pageNo - 1) * 12, pageNo * 12);
    document.querySelector("#customer-main").innerHTML =
      `<label class="search customer-search">${i("search")}<input id="customer-search" aria-label="搜索商品" value="${e(query)}" placeholder="搜索商品名称、规格或编码"></label><div class="customer-categories">${["全部", "蔬菜", "水果", "肉蛋", "调料粮油", "冻品", "海鲜"].map((x) => `<button class="tab ${(category || "全部") === x ? "active" : ""}" data-customer-action="category" data-id="${x === "全部" ? "" : x}">${x}</button>`).join("")}</div><div class="between small muted" style="margin:3px 0 13px"><span>按客户协议价结算</span><span>共 ${n(list.length)} 个商品</span></div><div class="catalog">${visible.map((p) => `<article class="catalog-row"><img class="catalog-img" src="assets/images/${p.image}.jpg" alt="${e(p.category)}品类示意"><div class="catalog-info"><h3>${e(p.name)}</h3><p>${e(p.spec)} · ${e(p.unit)}<br>可用库存 ${n(Y.stock(data(), p.id))} ${p.unit}</p><div class="catalog-bottom"><span class="catalog-price">${m(Y.quoteFor(data(), customer(), p).price)}<small> / ${p.unit}</small></span><div class="qty-control"><button data-customer-action="minus" data-id="${p.id}" aria-label="减少${e(p.name)}">${i("minus")}</button><input type="number" min="0" max="100000" step="${p.unit === "kg" ? "0.01" : "1"}" value="${c[p.id] || 0}" data-cart-qty="${p.id}" aria-label="${e(p.name)}数量"><button class="plus" data-customer-action="plus" data-id="${p.id}" aria-label="添加${e(p.name)}">${i("plus")}</button></div></div></div></article>`).join("")}</div>${!list.length ? `<div class="customer-empty">${i("search")}<h3>没有找到符合条件的商品</h3><p class="muted small" style="margin:12px 0">试试其他关键词，或切换商品分类</p><button class="btn" data-customer-action="clear-search">清空筛选</button></div>` : ""}<div class="between small muted" style="margin:20px 0 10px"><button class="btn" data-customer-action="prev" ${pageNo <= 1 ? "disabled" : ""}>${i("left")}上一页</button><span>${pageNo} / ${Math.max(1, Math.ceil(list.length / 12))}</span><button class="btn" data-customer-action="next" ${pageNo >= Math.ceil(list.length / 12) ? "disabled" : ""}>下一页${i("right")}</button></div><p class="file-note">图片为品类示意，规格与价格以客户协议及商品字段为准。</p>`;
  }
  function orders() {
    const list = data()
      .orders.filter((o) => o.customerId === sid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    document.querySelector("#customer-main").innerHTML =
      `<div class="between" style="margin:22px 0 18px"><h2>我的订单</h2><span class="small muted">${list.length} 张订单</span></div>${
        list.length
          ? list
              .map(
                (o) =>
                  `<article class="customer-order"><div class="between"><span class="small muted">${e(o.id)}</span>${U.status(o.status)}</div><div class="small">配送日期：${o.deliveryDate}　·　${e(Y.find(data(), "routes", o.routeId).name)}</div><div class="customer-order-lines">${o.lines
                    .slice(0, 3)
                    .map(
                      (l) =>
                        `${e(l.name)} × ${n(l.actualQty ?? l.qty)} ${l.unit}`,
                    )
                    .join(
                      "<br>",
                    )}${o.lines.length > 3 ? "<br>等 " + o.lines.length + " 项商品" : ""}</div><div class="between" style="margin:0"><span>合计 <strong class="num">${m(Y.amount(o))}</strong></span><div class="actions"><button class="btn sm" data-customer-action="detail" data-id="${o.id}">详情</button>${o.status === "配送中" ? `<button class="btn primary sm" data-customer-action="sign" data-id="${o.id}">确认收货</button>` : ["待确认", "待采购"].includes(o.status) ? `<button class="btn sm" data-customer-action="cancel" data-id="${o.id}">取消订单</button>` : ""}</div></div></article>`,
              )
              .join("")
          : `<div class="customer-empty">${i("orders")}<h3>还没有订单</h3><p class="muted small" style="margin:12px 0 20px">为客户食堂选购今天的新鲜食材</p><a class="btn primary" href="customer.html">开始订货</a></div>`
      }`;
  }
  function setQty(id, value) {
    const p = product(id),
      v = Number(value);
    if (
      !Number.isFinite(v) ||
      v < 0 ||
      v > 100000 ||
      Math.abs(v * 100 - Math.round(v * 100)) > 0.0001
    )
      throw new Error("数量应为 0～100000，最多两位小数");
    if (p.unit !== "kg" && !Number.isInteger(v))
      throw new Error("件装商品数量必须为整数");
    const c = { ...cart() };
    if (v === 0) delete c[id];
    else c[id] = v;
    Y.store.saveCart(sid, c);
    render();
  }
  function checkout() {
    const c = { ...cart() },
      ids = Object.keys(c);
    if (!ids.length) throw new Error("请先选择商品");
    const total = ids.reduce(
      (s, id) => s + Math.round(c[id] * Y.quoteFor(data(), customer(), product(id)).price),
      0,
    );
    U.modal({
      title: "确认订货",
      submit: "提交订单",
      body: `<div class="notice">${i("building")} ${e(customer().name)} · ${customer().type}协议价</div><div class="customer-checkout-lines">${ids
        .map((id) => {
          const p = product(id);
          return `<div class="customer-checkout-row"><img src="assets/images/${p.image}.jpg" alt=""><div>${e(p.name)}<p>${n(c[id])} ${p.unit} × ${m(Y.quoteFor(data(), customer(), p).price)}</p></div><strong>${m(Math.round(c[id] * Y.quoteFor(data(), customer(), p).price))}</strong></div>`;
        })
        .join(
          "",
        )}</div><div class="form-grid">${U.field("配送日期", "deliveryDate", Y.nextDay(data().settings.date), "date", `required min="${data().settings.date}"`)}<div class="field"><label>结算方式</label><input value="月结 ${customer().term} 天" disabled></div><div class="field full"><label>配送备注</label><textarea name="note" placeholder="收货时间、食堂入口等要求"></textarea></div></div><div class="customer-checkout-total between"><span>订单合计</span><strong>${m(total)}</strong></div><p class="small muted">下单无需在线支付，实际称重后按确认数量结算。</p>`,
      onSubmit: (f) => {
        const id = Y.store.createOrder({
          customerId: sid,
          deliveryDate: f.get("deliveryDate"),
          note: f.get("note"),
          lines: ids.map((productId) => ({ productId, qty: c[productId] })),
          source: "客户自主下单",
          clearCart: true,
        });
        render();
        setTimeout(
          () =>
            U.modal({
              title: "订单提交成功",
              body: `<div class="customer-empty" style="padding:25px 0">${i("check")}<h3>客户的食材需求已送达</h3><p class="small muted" style="margin:13px 0 20px">订单号 ${e(id)}<br>等待供应链后台确认接单</p><a class="btn primary" href="customer-orders.html">查看我的订单</a></div>`,
            }),
          0,
        );
      },
    });
  }
  function detail(id) {
    const o = Y.find(data(), "orders", id);
    if (o.customerId !== sid) throw new Error("此订单不属于当前客户");
    U.modal({
      title: "客户订单详情",
      body: `<div class="between">${U.status(o.status)}<span class="small muted">${o.deliveryDate}</span></div><p class="small muted" style="margin:16px 0">${e(o.id)}</p>${o.lines.map((l) => `<div class="todo-row"><div>${e(l.name)}<small>${n(l.actualQty ?? l.qty)} ${l.unit} × ${m(l.price)}${l.actualQty != null ? " · 已按实称结算" : ""}</small></div><span class="num">${m(Math.round((l.actualQty ?? l.qty) * l.price))}</span></div>`).join("")}<div class="between strong" style="margin:20px 0">订单合计 <span>${m(Y.amount(o))}</span></div><p class="small muted" style="line-height:2">配送地址：${e(customer().address)}<br>配送备注：${e(o.note || "无")}<br>承运线路：${e(Y.find(data(), "routes", o.routeId).name)}</p>`,
    });
  }
  const handlers = {
    plus: (id) => setQty(id, (cart()[id] || 0) + 1),
    minus: (id) => setQty(id, Math.max(0, (cart()[id] || 0) - 1)),
    category: (id) => {
      category = id;
      pageNo = 1;
      render();
    },
    prev: () => {
      pageNo--;
      render();
    },
    next: () => {
      pageNo++;
      render();
    },
    "clear-search": () => {
      query = "";
      category = "";
      pageNo = 1;
      render();
    },
    checkout,
    detail,
    sign: (id) =>
      U.confirm(
        "确认收货",
        "请核对配送商品与实称明细，确认客户已经收到本次食材。",
        () => {
          const o = Y.find(data(), "orders", id);
          if (o.customerId !== sid) throw new Error("此订单不属于当前客户");
          Y.store.orderAction(id, "sign");
          render();
          U.toast("收货成功，后台已更新签收状态");
        },
      ),
    cancel: (id) =>
      U.confirm(
        "取消客户订单",
        "确认取消？已开始采购的订单需联系配送企业处理。",
        () => {
          const o = Y.find(data(), "orders", id);
          if (o.customerId !== sid) throw new Error("此订单不属于当前客户");
          Y.store.orderAction(id, "cancel");
          render();
          U.toast("订单已取消");
        },
      ),
    account: () =>
      U.modal({
        title: "客户资料",
        body: `<div class="stack"><h3>${e(customer().name)}</h3><p class="small muted" style="line-height:2.2">客户类型：${customer().type}<br>联系人：${e(customer().contact)}<br>电话：${e(customer().phone)}<br>地址：${e(customer().address)}<br>价格方案：${customer().type}协议价<br>结算账期：${customer().term} 天</p><p class="notice">${i("shield")}资料需要修改时请联系配送企业业务人员。</p><a href="index.html" class="btn" target="_blank" rel="noopener">打开管理后台</a></div>`,
      }),
  };
  shell();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-customer-action]");
    if (!button || button.disabled) return;
    try {
      handlers[button.dataset.customerAction]?.(button.dataset.id || "");
    } catch (error) {
      U.toast(error.message, true);
    }
  });
  let timer;
  document.addEventListener("input", (event) => {
    if (event.target.id === "customer-search") {
      query = event.target.value;
      pageNo = 1;
      clearTimeout(timer);
      render();
    }
  });
  document.addEventListener("change", (event) => {
    const el = event.target;
    try {
      if (el.id === "customer-picker") {
        sid = el.value;
        Y.store.saveCart(sid, data().carts[sid] || {});
        query = "";
        category = "";
        pageNo = 1;
        shell();
      }
      if (el.dataset.cartQty) setQty(el.dataset.cartQty, el.value);
    } catch (error) {
      U.toast(error.message, true);
      render();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === Y.KEY) {
      try {
        Y.store.refresh();
        if (!document.querySelector("dialog[open]")) render();
        U.toast("业务数据已同步");
      } catch (error) {
        U.toast(error.message, true);
      }
    }
  });
  window.addEventListener("focus", () => {
    try {
      if (Y.store.data.revision !== Y.store.read().revision) {
        Y.store.refresh();
        if (!document.querySelector("dialog[open]")) render();
      }
    } catch (error) {
      U.toast(error.message, true);
    }
  });
})();

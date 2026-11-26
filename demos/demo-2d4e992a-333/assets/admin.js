/* 后台事件编排：视图和业务规则分离，所有可见操作都对应可验证结果。 */
(function () {
  "use strict";
  const Y = window.JIAHE;
  if (Y.bootError) return;
  const U = Y.UI,
    { esc: e, icon: i, money: m, number: n, btn: b } = U,
    V = Y.view,
    H = Y.viewHelpers,
    page = document.body.dataset.page;
  const data = () => Y.store.data,
    product = (id) => Y.find(data(), "products", id),
    customer = (id) => Y.find(data(), "customers", id),
    supplier = (id) => Y.find(data(), "suppliers", id);
  const detail = (label, value) =>
    `<div><div class="detail-label">${e(label)}</div><div class="detail-value">${e(value)}</div></div>`;
  const getProduct = (value) => {
    const p = data().products.find(
      (p) => p.name === value || p.id === value || p.code === value,
    );
    if (!p) throw new Error("请选择商品库中存在的商品：" + value);
    return p;
  };
  const productOptions = () =>
    `<datalist id="product-options">${data()
      .products.filter((p) => p.active)
      .map(
        (p) =>
          `<option value="${e(p.name)}">${e(p.code + " · " + p.spec + " · " + p.unit)}</option>`,
      )
      .join("")}</datalist>`;
  const row = (l = {}, purchase = false) => {
    const p = l.productId ? product(l.productId) : data().products[0];
    return `<tr data-line><td><input name="product" list="product-options" class="line-product" value="${e(p.name)}" aria-label="商品" required style="width:230px"></td><td><input name="qty" class="line-qty" type="number" aria-label="数量" min="0.01" max="100000" step="0.01" value="${l.qty ?? 10}" required></td><td class="line-unit">${e(p.unit)}</td><td>${purchase ? `<input name="cost" class="line-cost" type="number" min="0.01" step="0.01" aria-label="采购单价" required value="${(l.cost ?? p.cost) / 100}">` : `<span class="line-price num">${m(p.prices["中小学"])}</span>`}</td><td><button type="button" class="btn icon-only ghost sm" data-action="remove-line" aria-label="移除商品">${i("close")}</button></td></tr>`;
  };
  const lineEditor = (lines, purchase = false) =>
    `${productOptions()}<div class="table-wrap"><table data-lines data-purchase="${purchase}"><thead><tr><th>商品（支持名称搜索）</th><th>数量</th><th>单位</th><th>${purchase ? "采购单价" : "客户协议价"}</th><th></th></tr></thead><tbody>${lines.map((l) => row(l, purchase)).join("")}</tbody></table></div><div style="margin-top:12px">${b("添加商品", "add-line", purchase ? "purchase" : "order", "sm", "plus")}</div>`;
  function readLines(el, purchase = false) {
    return [...el.querySelectorAll("[data-line]")].map((tr) => {
      const p = getProduct(tr.querySelector("[name=product]").value);
      return {
        productId: p.id,
        qty: Number(tr.querySelector("[name=qty]").value),
        ...(purchase
          ? {
              cost: Math.round(
                Number(tr.querySelector("[name=cost]").value) * 100,
              ),
            }
          : {}),
      };
    });
  }
  function render() {
    const focus = document.activeElement?.dataset.filter,
      at = document.activeElement?.selectionStart;
    document.querySelector("#main").innerHTML =
      Y.renderView(page) +
      `<footer class="app-foot">${e(data().settings.name)} · 团膳食材供应链</footer>`;
    if (focus) {
      const el = document.querySelector(`[data-filter="${focus}"]`);
      el?.focus();
      try {
        el?.setSelectionRange(at, at);
      } catch (error) {
        /* select/date 输入不支持选区。 */
      }
    }
    bindSettings();
  }
  function refresh(text) {
    render();
    if (text) U.toast(text);
  }
  function orderIntegration(order) {
    const result = order.push;
    const enabled = !["待确认", "已取消"].includes(order.status);
    const source = order.intakeId
      ? `<a class="btn sm" href="ai-entry.html?source=${encodeURIComponent(order.intakeId)}">${i("file")}查看原单</a>`
      : "";
    const actions = !enabled || result?.state === "推送成功"
      ? ""
      : b(result ? "重试推送" : "模拟推送", "order-push", order.id, "sm primary") +
        (result ? "" : b("模拟失败", "order-push-fail", order.id, "sm"));
    return `<div class="order-integration no-print">
      <div><strong>利客订单推送</strong> ${U.status(result?.state || "待推送")}
        <p class="muted small">${e(result ? (result.receipt || result.message) + " · 尝试 " + result.attempts + " 次" : enabled ? "本地模拟写单" : "确认接单后可模拟推送")}</p>
      </div><div class="actions">${source}${actions}</div>
    </div>`;
  }
  function pushOrder(id, failure) {
    const result = Y.store.pushOrder(id, failure);
    render();
    orderDetails(id);
    U.toast(result.message, result.state === "推送失败");
  }
  function quoteForm(key) {
    const [customerId, productId] = key
      ? key.split("|")
      : [data().customers.find((entry) => entry.active)?.id, data().products.find((entry) => entry.active)?.id];
    if (!customerId || !productId) throw new Error("请先启用客户和商品");
    const product = Y.find(data(), "products", productId);
    const quote = Y.quoteFor(data(), customer(customerId), product);
    U.modal({
      title: key ? "编辑客户专用报价" : "新增客户专用报价",
      wide: true,
      submit: "保存专用报价",
      body: `${productOptions()}<div class="form-grid">
        ${U.select("客户", "customerId", data().customers.filter((c) => c.active || c.id === customerId), customerId, key ? "disabled" : "required")}
        ${U.field("商品", "quoteProduct", product.name, "text", key ? "disabled" : 'required list="product-options"')}
        ${U.field("专用单价（元）", "price", quote.price / 100, "number", 'required min="0.01" step="0.01"')}
        ${U.field("打印品名", "printName", quote.printName, "text", 'required maxlength="80"')}
        ${U.field("打印单位", "printUnit", quote.printUnit, "text", 'required maxlength="12"')}
      </div><p class="quote-note muted small">库存按商品单位计量。公斤可打印为 kg、KG、公斤或千克。</p>`,
      onOpen: (dialog) => {
        if (key) return;
        const form = dialog.querySelector("form");
        const sync = () => {
          try {
            const item = getProduct(form.elements.quoteProduct.value);
            const current = Y.quoteFor(data(), customer(form.elements.customerId.value), item);
            form.elements.price.value = current.price / 100;
            form.elements.printName.value = current.printName;
            form.elements.printUnit.value = current.printUnit;
          } catch (error) {
            form.querySelector(".form-error").textContent = "请选择商品库中的商品";
            return;
          }
          form.querySelector(".form-error").textContent = "";
        };
        form.elements.quoteProduct.onchange = sync;
        form.elements.customerId.onchange = sync;
      },
      onSubmit: (form) => {
        Y.store.saveQuote({
          customerId: key ? customerId : form.get("customerId"),
          productId: key ? productId : getProduct(form.get("quoteProduct")).id,
          price: Math.round(Number(form.get("price")) * 100),
          printName: form.get("printName"),
          printUnit: form.get("printUnit"),
        });
        if (page === "pricing") V.tab = "客户专用报价";
        refresh("客户专用报价已保存");
      },
    });
  }
  function orderDetails(id) {
    const o = Y.find(data(), "orders", id),
      s = customer(o.customerId),
      r = Y.find(data(), "routes", o.routeId);
    U.modal({
      title: "订单详情 · " + id,
      wide: true,
      body: `<div class="between" style="margin-bottom:22px"><span>${U.status(o.status)}</span><a class="btn" href="print-order.html?order=${encodeURIComponent(id)}">${i("print")}客户格式打印</a></div><div class="detail-grid">${detail("客户", s.name)}${detail("联系人", s.contact + " · " + s.phone)}${detail("客户类型", s.type)}${detail("配送日期", o.deliveryDate)}${detail("配送线路", r.name)}${detail("下单来源", o.source)}</div>${orderIntegration(o)}<div class="table-wrap"><table><thead><tr><th>商品</th><th>规格</th><th>订购量</th><th>实称量</th><th>成交单价</th><th>金额</th></tr></thead><tbody>${o.lines.map((l) => `<tr><td>${e(l.name)}</td><td>${e(l.spec)}</td><td>${n(l.qty)} ${l.unit}</td><td>${l.actualQty == null ? "待分拣" : n(l.actualQty) + " " + l.unit}</td><td>${m(l.price)}</td><td>${m(Math.round((l.actualQty ?? l.qty) * l.price))}</td></tr>`).join("")}</tbody></table></div><div class="between" style="margin:20px 0"><span class="muted small">备注：${e(o.note || "无")}</span><strong>订单合计：${m(Y.amount(o))}</strong></div><div class="actions">${o.status === "待确认" ? b("编辑订单", "order-edit", id, "", "edit") + b("确认接单", "order-confirm", id, "primary", "check") : ""}${["待确认", "待采购"].includes(o.status) ? b("取消订单", "order-cancel", id, "danger") : ""}</div>`,
    });
  }
  function newOrder() {
    U.modal({
      title: "新建客户订单",
      wide: true,
      submit: "提交订单",
      body: `<div class="form-grid">${U.select(
        "客户",
        "customerId",
        data().customers.filter((s) => s.active),
        "S1",
        "required",
      )}${U.field("配送日期", "deliveryDate", Y.nextDay(data().settings.date), "date", `required min="${data().settings.date}"`)}</div><div class="form-section">商品明细</div>${lineEditor(
        [
          { productId: "P0001", qty: 20 },
          { productId: "P0002", qty: 15 },
        ],
      )}<div class="field" style="margin-top:20px"><label for="new-note">订单备注</label><textarea id="new-note" name="note" placeholder="例如：食堂早班使用，请在 07:00 前送达"></textarea></div>`,
      onSubmit: (f, el) => {
        const id = Y.store.createOrder({
          customerId: f.get("customerId"),
          deliveryDate: f.get("deliveryDate"),
          note: f.get("note"),
          lines: readLines(el),
          source: "内部代下单",
        });
        refresh("订单 " + id + " 已创建");
      },
      onOpen: (el) => updateLinePrices(el),
    });
  }
  function editOrder(id) {
    const o = Y.find(data(), "orders", id);
    U.modal({
      title: "编辑待确认订单",
      wide: true,
      submit: "保存修改",
      body: `<p class="notice">${i("shield")}调整商品数量与备注，成交单价保留订单原始快照。</p><div class="table-wrap"><table><thead><tr><th>商品</th><th>数量</th><th>单位</th><th>成交单价</th></tr></thead><tbody>${o.lines.map((l, k) => `<tr><td>${e(l.name)}</td><td><input name="q${k}" aria-label="${e(l.name)}数量" type="number" min="0.01" step="0.01" value="${l.qty}" required></td><td>${l.unit}</td><td>${m(l.price)}</td></tr>`).join("")}</tbody></table></div><div class="field" style="margin-top:18px"><label>订单备注</label><textarea name="note">${e(o.note || "")}</textarea></div>`,
      onSubmit: (f) => {
        Y.store.editOrder(
          id,
          o.lines.map((_, k) => Number(f.get("q" + k))),
          f.get("note"),
        );
        refresh("订单已更新");
      },
    });
  }
  function sortOrder(id) {
    const o = Y.find(data(), "orders", id);
    U.modal({
      title: "称重分拣 · " + customer(o.customerId).name,
      wide: true,
      submit: "确认分拣并出库",
      body: `<div class="notice">${i("sort")}以商品单位录入实称或实点数量，允许不超过订购量 20% 的称重差异。</div><div class="table-wrap"><table><thead><tr><th>商品</th><th>订购数量</th><th>可用库存</th><th>实称 / 实点</th><th>单位</th></tr></thead><tbody>${o.lines.map((l, k) => `<tr><td>${e(l.name)}</td><td>${n(l.qty)}</td><td>${n(Y.stock(data(), l.productId))}</td><td><input name="q${k}" type="number" aria-label="${e(l.name)}实称" value="${l.qty}" min="0.01" max="${l.qty * 1.2}" step="${l.unit === "kg" ? "0.01" : "1"}" required></td><td>${l.unit}</td></tr>`).join("")}</tbody></table></div><p class="small muted" style="margin-top:16px">确认后按实称数量扣减库存并更新订单金额，订单进入待装车状态。</p>`,
      onSubmit: (f) => {
        Y.store.orderAction(id, "sort", {
          quantities: o.lines.map((_, k) => Number(f.get("q" + k))),
        });
        refresh("分拣完成，订单已转待装车");
      },
    });
  }
  function shipOrder(id) {
    const o = Y.find(data(), "orders", id);
    U.modal({
      title: "装车发车",
      submit: "确认发车",
      body: `<div class="detail-grid">${detail("订单", o.id)}${detail("客户", customer(o.customerId).name)}</div>${U.select("承运线路", "routeId", data().routes, o.routeId, "required")}<div class="notice blue" style="margin:20px 0 0">${i("truck")}线路关联第三方承运商、司机与车辆。发车后客户端可确认收货。</div>`,
      onSubmit: (f) => {
        Y.store.orderAction(id, "ship", { routeId: f.get("routeId") });
        refresh("已装车发车，等待客户签收");
      },
    });
  }
  function purchaseDetails(id) {
    const po = Y.find(data(), "purchases", id);
    U.modal({
      title: "采购单 · " + id,
      wide: true,
      body: `<div class="between" style="margin-bottom:20px">${U.status(po.status)}<div class="actions"><a class="btn" href="vendor.html?supplier=${encodeURIComponent(po.supplierId)}&amp;order=${encodeURIComponent(po.id)}">${i("external")}供应商作业</a>${b("打印采购单", "print", "", "", "print")}</div></div><div class="detail-grid">${detail("供应商", supplier(po.supplierId).name)}${detail("采购日期", po.date)}${detail("来源", po.source)}${detail("关联订单", po.orderIds.join("、") || "独立采购")}${detail("生产日期", po.productionDate || "收货时录入")}${detail("保质期", po.shelfDays ? po.shelfDays + " 天" : "收货时录入")}${detail("送货单", po.deliveryNo || "待供应商生成")}${detail("批次品控", (po.certIds || []).join("、") || "按供应商资质核对")}</div>${purchaseTable(po)}<div class="right strong" style="margin-top:20px">合计 ${m(Y.sum(po.lines, (l) => Math.round(l.qty * l.cost)))}</div>`,
    });
  }
  const purchaseTable = (po) =>
    `<div class="table-wrap"><table><thead><tr><th>商品</th><th>数量</th><th>采购单价</th><th>金额</th></tr></thead><tbody>${po.lines.map((l) => `<tr><td>${e(l.name)}</td><td>${n(l.qty)} ${l.unit}</td><td>${m(l.cost)}</td><td>${m(Math.round(l.qty * l.cost))}</td></tr>`).join("")}</tbody></table></div>`;
  function receivePurchase(id) {
    const po = Y.find(data(), "purchases", id);
    U.modal({
      title: "供应商收货入库",
      wide: true,
      submit: "确认入库",
      body: `<div class="detail-grid">${detail("采购单", id)}${detail("供应商", supplier(po.supplierId).name)}</div>${purchaseTable(po)}<div class="form-section">批次信息</div><div class="form-grid">${U.field("生产日期", "productionDate", data().settings.date, "date", `required max="${data().settings.date}"`)}${U.field("保质期（天）", "shelfDays", 7, "number", 'required min="1" max="3650" step="1"')}</div><p class="small muted" style="margin-top:14px">验收入库按送货单明细登记，批次将在库存中显示。</p>`,
      onSubmit: (f) => {
        Y.store.receivePurchase(
          id,
          f.get("productionDate"),
          Number(f.get("shelfDays")),
        );
        refresh("入库完成，已更新批次库存与关联订单");
      },
    });
  }
  function newPurchase() {
    U.modal({
      title: "新建采购单",
      wide: true,
      submit: "生成并下发采购单",
      body: `<div class="form-grid">${U.select(
        "供货商",
        "supplierId",
        data().suppliers.filter((s) => s.active),
        "V1",
        "required",
      )}<div class="field"><label>采购日期</label><input disabled value="${data().settings.date}"></div></div><div class="form-section">采购明细</div>${lineEditor([{ productId: "P0001", qty: 100, cost: product("P0001").cost }], true)}`,
      onSubmit: (f, el) => {
        const id = Y.store.createPurchase({
          supplierId: f.get("supplierId"),
          lines: readLines(el, true),
        });
        refresh("采购单 " + id + " 已生成");
      },
    });
  }
  function inventoryDetails(id) {
    const p = product(id),
      bs = data().batches.filter((b) => b.productId === id && b.qty > 0);
    U.modal({
      title: "库存批次 · " + p.name,
      wide: true,
      body: `<div class="detail-grid">${detail("商品规格", p.spec)}${detail("可用库存", n(Y.stock(data(), id)) + " " + p.unit)}${detail("安全库存", p.minStock + " " + p.unit)}</div><div class="table-wrap"><table><thead><tr><th>批次</th><th>库区</th><th>余量</th><th>生产日期</th><th>到期日期</th><th>来源</th></tr></thead><tbody>${bs.map((b) => `<tr><td>${e(b.id)}</td><td>${e(b.zone)}</td><td>${n(b.qty)} ${p.unit}</td><td>${b.productionDate}</td><td>${b.expires} ${b.expires < data().settings.date ? U.status("已过期") : ""}</td><td>${e(b.source)}</td></tr>`).join("")}</tbody></table></div><div style="margin-top:20px">${b("库存作业", "inventory-adjust", id, "primary")}</div>`,
    });
  }
  function inventoryAdjust(id) {
    U.modal({
      title: "库存作业",
      submit: "确认库存作业",
      body: `${productOptions()}<div class="form-grid"><div class="field full"><label>商品名称 / 编码</label><input name="product" list="product-options" value="${e((id ? product(id) : data().products[0]).name)}" required></div>${U.select("作业类型", "type", ["报损", "退货", "换货", "库区调拨"], "报损")}${U.field("作业数量（按商品单位）", "qty", 1, "number", 'required min="0.01" max="100000" step="0.01"')}${U.select("目标库区（调拨时使用）", "zone", ["常温区", "冷藏区", "待分拣区", "复核区"], "复核区")}<div class="field"><label>说明</label><input name="note" placeholder="例如：运输挤压、换货或库区调整" required></div></div><div class="notice amber" style="margin:18px 0 0">${i("alert")}报损和退货减少库存；换货记录等量出入库；库区调拨保持总库存不变。</div>`,
      onSubmit: (f) => {
        Y.store.inventoryAction({
          productId: getProduct(f.get("product")).id,
          type: f.get("type"),
          qty: Number(f.get("qty")),
          zone: f.get("zone"),
          note: f.get("note"),
        });
        refresh("库存作业已保存，流水已更新");
      },
    });
  }
  function entityForm(kind, id) {
    const edit = Boolean(id),
      x = id ? Y.find(data(), kind, id) : {};
    let fields = "";
    const base = U.field(
      kind === "customers"
        ? "客户名称"
        : kind === "suppliers"
          ? "供应商名称"
          : "商品名称",
      "name",
      x.name || "",
      "text",
      'required maxlength="50"',
    );
    if (kind === "products")
      fields =
        base +
        U.select(
          "一级分类",
          "category",
          ["蔬菜", "水果", "肉蛋", "调料粮油", "冻品", "海鲜"],
          x.category || "蔬菜",
        ) +
        U.field("二级分类", "sub", x.sub || "根茎类", "text", "required") +
        U.field("规格", "spec", x.spec || "一级 / 散装", "text", "required") +
        U.select(
          "计价单位",
          "unit",
          ["kg", "件", "袋", "桶", "瓶", "箱"],
          x.unit || "kg",
        ) +
        U.select(
          "默认供货商",
          "supplierId",
          data().suppliers,
          x.supplierId || "V1",
        ) +
        U.field(
          "采购基准价（元）",
          "cost",
          (x.cost || 240) / 100,
          "number",
          'required min="0.01" step="0.01"',
        ) +
        U.field(
          "中小学协议价（元）",
          "primary",
          (x.prices?.["中小学"] || 360) / 100,
          "number",
          'required min="0.01" step="0.01"',
        ) +
        U.field(
          "幼儿园协议价（元）",
          "kindergarten",
          (x.prices?.["幼儿园"] || 380) / 100,
          "number",
          'required min="0.01" step="0.01"',
        ) +
        U.field(
          "安全库存",
          "minStock",
          x.minStock ?? 30,
          "number",
          'required min="0" step="0.01"',
        ) +
        U.select(
          "销售状态",
          "active",
          [
            { id: "true", name: "在售" },
            { id: "false", name: "已下架" },
          ],
          String(x.active !== false),
        );
    else
      fields =
        base +
        (kind === "customers"
          ? U.select(
              "客户类型",
              "type",
              Y.customerTypes,
              x.type || "中小学",
            ) +
            U.field(
              "所在区域",
              "area",
              x.area || "雁塔区",
              "text",
              "required",
            ) +
            U.select("配送线路", "routeId", data().routes, x.routeId || "R1")
          : U.select(
              "供货品类",
              "category",
              ["蔬菜", "水果", "肉蛋", "调料粮油", "冻品", "海鲜"],
              x.category || "蔬菜",
            )) +
        U.field("联系人", "contact", x.contact || "", "text", "required") +
        U.field(
          "手机号",
          "phone",
          x.phone || "",
          "tel",
          'required pattern="1[0-9]{10}" maxlength="11"',
        ) +
        U.field("地址", "address", x.address || "", "text", "required") +
        U.field(
          "账期（天）",
          "term",
          x.term ?? 30,
          "number",
          'required min="0" max="365" step="1"',
        ) +
        U.select(
          "状态",
          "active",
          [
            { id: "true", name: "已启用" },
            { id: "false", name: "已停用" },
          ],
          String(x.active !== false),
        );
    U.modal({
      title:
        (edit ? "编辑" : "新增") +
        { customers: "客户", suppliers: "供应商", products: "商品" }[kind],
      wide: true,
      submit: "保存资料",
      body: `<div class="form-grid">${fields}</div>`,
      onSubmit: (f) => {
        const v = Object.fromEntries(f);
        v.active = v.active === "true";
        if (kind === "products") {
          v.cost = Math.round(Number(v.cost) * 100);
          v.prices = {
            ...x.prices,
            中小学: Math.round(Number(v.primary) * 100),
            幼儿园: Math.round(Number(v.kindergarten) * 100),
          };
          v.minStock = Number(v.minStock);
          delete v.primary;
          delete v.kindergarten;
        } else v.term = Number(v.term);
        Y.store.saveEntity(kind, id, v);
        refresh("资料已保存");
      },
    });
  }
  function entityDetail(kind, id) {
    const x = Y.find(data(), kind, id);
    let body = `<div class="detail-grid">${Object.entries(x)
      .filter(([k]) =>
        [
          "name",
          "type",
          "area",
          "contact",
          "phone",
          "address",
          "term",
          "category",
          "spec",
          "unit",
          "code",
        ].includes(k),
      )
      .map(([k, v]) =>
        detail(
          {
            name: "名称",
            type: "类型",
            area: "区域",
            contact: "联系人",
            phone: "手机号",
            address: "地址",
            term: "账期（天）",
            category: "供货品类",
            spec: "规格",
            unit: "单位",
            code: "商品编码",
          }[k],
          v,
        ),
      )
      .join("")}</div>`;
    if (kind === "customers") {
      const os = data().orders.filter((o) => o.customerId === id);
      body += `<div class="form-section">最近订单</div><div class="table-wrap"><table><thead><tr><th>订单号</th><th>配送日期</th><th>金额</th><th>状态</th></tr></thead><tbody>${os
        .slice(-5)
        .reverse()
        .map(
          (o) =>
            `<tr><td>${b(o.id, "order-detail", o.id, "sm ghost link")}</td><td>${o.deliveryDate}</td><td>${m(Y.amount(o))}</td><td>${U.status(o.status)}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div><div style="margin-top:18px"><a class="btn" href="orders.html?customer=${id}">查看全部订单</a></div>`;
    }
    if (kind === "suppliers") {
      const cs = data().certs.filter((c) => c.supplierId === id);
      body += `<div class="form-section">供应商食安资料</div>${cs.length ? cs.map((c) => `<div class="todo-row"><span>${e(c.type)}</span>${U.status(c.status)}${b("预览", "cert-detail", c.id, "sm ghost")}</div>`).join("") : '<p class="muted">尚未收集资料</p>'}`;
    }
    if (kind === "products")
      body += `<div class="form-section">商品价格与库存</div><div class="detail-grid">${detail("采购基准", m(x.cost))}${detail("中小学", m(x.prices["中小学"]))}${detail("幼儿园", m(x.prices["幼儿园"]))}${detail("可用库存", n(Y.stock(data(), id)) + " " + x.unit)}${detail("默认供应商", supplier(x.supplierId).name)}</div>`;
    body += `<div class="actions" style="margin-top:18px">${b("编辑资料", "edit-entity", kind + "|" + id, "primary", "edit")}</div>`;
    U.modal({ title: "资料详情", wide: true, body });
  }
  function priceEdit(id) {
    const p = product(id);
    U.modal({
      title: "调整协议价 · " + p.name,
      submit: "保存两套协议价",
      body: `<div class="detail-grid">${detail("采购基准", m(p.cost) + " / " + p.unit)}${detail("当前预警阈值", data().settings.lowMargin + "%")}</div><div class="form-grid">${U.field("中小学协议价（元）", "primary", p.prices["中小学"] / 100, "number", 'required min="0.01" step="0.01"')}${U.field("幼儿园协议价（元）", "kindergarten", p.prices["幼儿园"] / 100, "number", 'required min="0.01" step="0.01"')}</div><div class="notice amber" style="margin:18px 0 0">${i("alert")}采购成本与报价请复核；低于成本的售价会继续保留预警。历史订单不受调价影响。</div>`,
      onSubmit: (f) => {
        const p1 = Math.round(Number(f.get("primary")) * 100),
          p2 = Math.round(Number(f.get("kindergarten")) * 100);
        if (p1 <= 0 || p2 <= 0) throw new Error("协议价必须大于 0");
        Y.store.change("更新两套客户协议价", (d) => {
          const x = Y.find(d, "products", id);
          x.prices = { ...x.prices, 中小学: p1, 幼儿园: p2 };
        });
        refresh("协议价已更新，仅对后续新订单生效");
      },
    });
  }
  function certDetail(id) {
    const c = Y.find(data(), "certs", id),
      v = supplier(c.supplierId);
    U.modal({
      title: "食安资料预览",
      wide: true,
      body: `<div class="doc-preview"><h2>${e(c.type)}</h2><div class="tag amber" style="margin-bottom:18px">演示样例 · 不具备检测效力</div><p>资料编号：${e(c.id)}<br>供货单位：${e(v.name)}<br>供货品类：${e(v.category)}<br>出具日期：${c.date}<br>有效期至：${c.expires}<br>关联客户：${e(c.customers.map((id) => customer(id).name).join("、") || "尚未分配")}<br>收集来源：指定供货群（模拟文件）</p><div class="stamp">演示资料<br>仅供流程展示</div></div><div class="between" style="margin-top:20px">${U.status(c.status)}${["已通过", "已分配"].includes(c.status) ? b("加入打印队列", "cert-print", id, "", "print") : ""}</div>`,
    });
  }
  function newCert() {
    const date = data().settings.date;
    U.modal({
      title: "登记供应商资质",
      submit: "提交审核",
      body: `<div class="form-grid">
        ${U.select("供应商", "supplierId", data().suppliers.filter((x) => x.active), "V1", "required")}
        ${U.select("资料类型", "type", ["产品合格证", "第三方检测报告", "营业资质"], "第三方检测报告")}
        ${U.field("资料名称", "name", "", "text", 'required maxlength="80"')}
        ${U.field("出具日期", "date", date, "date", 'required max="' + date + '"')}
        ${U.field("有效期至", "expires", Y.nextDay(date), "date", "required")}
        ${U.field("备注", "note", "", "text", 'maxlength="120"')}
      </div>`,
      onSubmit: (form) => refresh("资料 " + Y.store.addCert(Object.fromEntries(form)) + " 已登记"),
    });
  }
  function certReview(id) {
    const c = Y.find(data(), "certs", id);
    U.modal({
      title: "审核食安资料",
      submit: "审核通过",
      body: `<div class="detail-grid">${detail("供应商", supplier(c.supplierId).name)}${detail("资料类型", c.type)}${detail("有效期", c.expires)}</div><div class="notice">${i("shield")}核对供应商名称、覆盖品类和有效日期，确认资料可用于客户食安留档。</div><div class="actions">${b("退回补充", "cert-reject", id, "danger")}</div>`,
      onSubmit: () => {
        Y.store.certAction(id, "review");
        refresh("资料审核已通过");
      },
    });
  }
  function certAssign(id) {
    const c = Y.find(data(), "certs", id);
    U.modal({
      title: "分配食安资料到客户",
      wide: true,
      submit: "确认分配",
      body: `<p class="muted small" style="margin-bottom:18px">${e(supplier(c.supplierId).name)} · ${e(c.type)}</p><div class="form-grid">${data()
        .customers.map(
          (s) =>
            `<label class="inline" style="font-size:12px;padding:7px 0"><input type="checkbox" name="customers" value="${s.id}" ${c.customers.includes(s.id) ? "checked" : ""}>${e(s.name)}</label>`,
        )
        .join("")}</div>`,
      onSubmit: (f) => {
        Y.store.certAction(id, "assign", f.getAll("customers"));
        refresh("资料已分配到所选客户");
      },
    });
  }
  function queue() {
    const cs = data().certs.filter((c) => c.status === "打印队列");
    U.modal({
      title: "食安打印队列",
      wide: true,
      body: `<div class="notice blue">${i("print")}已加入 ${cs.length} 份资料。打开浏览器打印预览后，可打印或另存 PDF。</div>${cs.length ? `<div class="table-wrap"><table><thead><tr><th>供应商</th><th>资料类型</th><th>有效期</th><th>分配客户</th></tr></thead><tbody>${cs.map((c) => `<tr><td>${e(supplier(c.supplierId).name)}</td><td>${e(c.type)}</td><td>${c.expires}</td><td>${e(c.customers.map((id) => customer(id).name).join("、") || "通用资料")}</td></tr>`).join("")}</tbody></table></div><div class="actions no-print" style="margin-top:20px">${b("打印队列清单", "print", "", "primary", "print")}${cs.map((c) => b("预览 " + c.id, "cert-detail", c.id, "sm")).join("")}</div>` : '<div class="empty">打印队列为空，请先审核并加入资料。</div>'}`,
    });
  }
  function billDetail(id) {
    const bill = Y.find(data(), "bills", id),
      docs = bill.docIds.map((x) =>
        Y.find(data(), bill.kind === "客户应收" ? "orders" : "purchases", x),
      );
    U.modal({
      title: bill.kind + " · " + bill.name,
      wide: true,
      body: `<div class="between" style="margin-bottom:20px">${U.status(bill.status)}${b("打印对账单", "print", "", "", "print")}</div><div class="detail-grid">${detail("账单编号", id)}${detail("对账月份", bill.month)}${detail("账单总额", m(bill.amount))}${detail("已结算", m(bill.paid))}${detail("待结算", m(bill.amount - bill.paid))}</div><div class="table-wrap"><table><thead><tr><th>来源单据</th><th>日期</th><th>商品数</th><th>金额</th></tr></thead><tbody>${docs.map((o) => `<tr><td>${e(o.id)}</td><td>${o.deliveryDate || o.date}</td><td>${o.lines.length} 项</td><td>${m(bill.kind === "客户应收" ? Y.amount(o) : Y.sum(o.lines, (l) => Math.round(l.qty * l.cost)))}</td></tr>`).join("")}</tbody></table></div>${bill.creditIds.length ? `<div class="notice" style="margin-top:16px">包含 ${bill.creditIds.length} 笔退货抵扣，已计入应结金额。</div>` : ""}<div class="form-section">结算记录</div>${
        data()
          .payments.filter((p) => p.billId === id)
          .map(
            (p) =>
              `<div class="todo-row"><span>${p.date} · ${e(p.id)}</span><strong>${m(p.amount)}</strong></div>`,
          )
          .join("") || '<p class="small muted">暂无登记记录</p>'
      }`,
    });
  }
  function payBill(id) {
    const bill = Y.find(data(), "bills", id);
    U.modal({
      title:
        bill.amount < 0
          ? "登记退货退款"
          : "登记" + (bill.kind === "客户应收" ? "收款" : "付款"),
      submit: "确认登记",
      body: `<div class="detail-grid">${detail("往来单位", bill.name)}${detail("未结金额", m(bill.amount - bill.paid))}</div>${U.field("本次结算金额（元）", "amount", Math.abs(bill.amount - bill.paid) / 100, "number", `required min="0.01" max="${Math.abs(bill.amount - bill.paid) / 100}" step="0.01"`)}<p class="small muted" style="line-height:1.8;margin-top:16px">仅记录本地演示结算，不发起真实银行扣款或支付。</p>`,
      onSubmit: (f) => {
        Y.store.billAction(
          id,
          "pay",
          Math.round(Number(f.get("amount")) * 100),
        );
        refresh("结算记录已保存");
      },
    });
  }
  function updateLinePrices(el) {
    if (!el) return;
    const account = customer(
      el.querySelector("[name=customerId]")?.value || "S1",
    );
    el.querySelectorAll("[data-line]").forEach((tr) => {
      try {
        const p = getProduct(tr.querySelector("[name=product]").value);
        tr.querySelector(".line-unit").textContent = p.unit;
        const label = tr.querySelector(".line-price");
        if (label) label.textContent = m(Y.quoteFor(data(), account, p).price);
      } catch (error) {
        /* 未完成输入时保留原值，提交时再校验商品。 */
      }
    });
  }
  function bindSettings() {
    const form = document.querySelector("#settings-form");
    if (form)
      form.onsubmit = (event) => {
        event.preventDefault();
        try {
          Y.store.saveSettings(Object.fromEntries(new FormData(form)));
          U.shell(page);
          render();
          U.toast("设置已保存");
        } catch (error) {
          form.querySelector(".form-error").textContent = error.message;
        }
      };
  }
  function print() {
    const modal = document.querySelector("dialog[open]");
    if (modal) document.body.classList.add("printing-modal");
    try {
      window.print();
    } finally {
      document.body.classList.remove("printing-modal");
    }
  }
  const handlers = {
    menu: () => document.querySelector(".sidebar").classList.toggle("open"),
    goto: (id) => {
      location.href = id;
    },
    page: (id) => {
      V.page = Number(id);
      render();
    },
    tab: (id) => {
      if (["客户应收", "供应商应付"].includes(id)) V.kind = id;
      else V.tab = id;
      V.page = 1;
      V.filter = "";
      render();
    },
    route: (id) => {
      V.route = id;
      V.page = 1;
      render();
    },
    "reset-filters": () => {
      Object.assign(V, {
        q: "",
        filter: "",
        page: 1,
        route: "",
        customer: "",
        start: "2026-11-01",
        end: "2026-11-30",
        day: "",
      });
      render();
    },
    export: () =>
      U.csv(
        Y.currentExport?.() || [],
        U.titleMap[page] + "_" + data().settings.date,
      ),
    print,
    "new-order": newOrder,
    "order-detail": orderDetails,
    "quote-edit": quoteForm,
    "cert-new": newCert,
    "order-push": (id) => pushOrder(id, false),
    "order-push-fail": (id) => pushOrder(id, true),
    "order-edit": editOrder,
    "order-sort": sortOrder,
    "order-ship": shipOrder,
    "order-confirm": (id) =>
      U.confirm(
        "确认接单",
        "确认客户、配送日期与商品数量，订单将进入待采购。",
        () => {
          Y.store.orderAction(id, "confirm");
          document.querySelector("dialog")?.close();
          refresh("接单完成，订单进入待采购");
        },
      ),
    "order-cancel": (id) =>
      U.confirm("取消订单", "此订单尚未开始采购，确认取消？", () => {
        Y.store.orderAction(id, "cancel");
        refresh("订单已取消");
      }),
    "order-purchase": (id) =>
      U.confirm(
        "按订单生成采购",
        "将按默认供应商拆分采购单，收货全部完成后进入待分拣。",
        () => {
          const ids = Y.store.generatePurchase([id]);
          refresh("已生成 " + ids.length + " 张采购单");
        },
      ),
    "order-sign": (id) =>
      U.confirm(
        "确认客户签收",
        "确认配送已经完成，订单将纳入客户应收与经营报表。",
        () => {
          Y.store.orderAction(id, "sign");
          refresh("客户签收已完成");
        },
      ),
    "generate-purchases": () => {
      const ids = data()
        .orders.filter((o) => o.status === "待采购")
        .map((o) => o.id);
      if (!ids.length) throw new Error("当前没有待采购订单，请先在订单页接单");
      U.confirm(
        "汇总采购需求",
        "将汇总 " + ids.length + " 张待采购订单，按供应商生成采购单。",
        () => {
          const result = Y.store.generatePurchase(ids);
          refresh("已生成 " + result.length + " 张采购单");
        },
      );
    },
    "new-purchase": newPurchase,
    "purchase-detail": purchaseDetails,
    "purchase-receive": receivePurchase,
    "inventory-detail": inventoryDetails,
    "inventory-adjust": inventoryAdjust,
    "new-entity": (kind) => entityForm(kind, ""),
    "edit-entity": (id) => entityForm(...id.split("|")),
    "entity-detail": (id) => entityDetail(...id.split("|")),
    "price-edit": priceEdit,
    "add-line": (id, button) => {
      const el = button.closest("dialog") || button.closest("form");
      el.querySelector("[data-lines] tbody").insertAdjacentHTML(
        "beforeend",
        row({}, id === "purchase"),
      );
      updateLinePrices(el);
    },
    "remove-line": (id, button) => {
      const tr = button.closest("[data-line]");
      if (tr.parentElement.children.length === 1)
        throw new Error("请至少保留一行商品");
      tr.remove();
    },
    "cert-detail": certDetail,
    "cert-review": certReview,
    "cert-assign": certAssign,
    "cert-queue": queue,
    "cert-collect": () =>
      U.confirm(
        "模拟收集群资料",
        "将为待收集及已退回资料填入演示文件，随后由你人工审核。",
        () => {
          Y.store.certAction(null, "collectAll");
          refresh("资料已收集至待审核列表");
        },
      ),
    "cert-reject": (id) => {
      Y.store.certAction(id, "reject");
      document.querySelector("dialog")?.close();
      refresh("资料已退回，等待补充");
    },
    "cert-print": (id) => {
      Y.store.certAction(id, "queue");
      document.querySelector("dialog")?.close();
      refresh("已加入打印队列，可在队列中打开预览");
    },
    "generate-bills": () =>
      U.confirm(
        "生成月结账单",
        `为 ${V.month} 的${V.kind}生成账单。客户依据已签收订单，供应商依据已入库采购并扣除退货。`,
        () => {
          const count = Y.store.generateBills(V.kind, V.month);
          refresh("已生成 " + count + " 张账单");
        },
      ),
    "bill-detail": billDetail,
    "bill-confirm": (id) =>
      U.confirm(
        "确认对账",
        "确认单据数量及金额无误？确认后可登记结算。",
        () => {
          Y.store.billAction(id, "confirm");
          refresh("对账已确认");
        },
      ),
    "bill-pay": payBill,
    "report-week": () => {
      V.start = "2026-11-16";
      V.end = "2026-11-26";
      V.page = 1;
      render();
    },
    "dashboard-export": () => {
      const rows = Y.report(data(), "2026-11-01", data().settings.date);
      U.csv(
        [
          [
            "客户",
            "已签收订单",
            "收入（元）",
            "成本（元）",
            "毛利（元）",
            "估算净利润（元）",
          ],
          ...rows.map((r) => [
            r.customer.name,
            r.orders,
            r.revenue / 100,
            r.purchase / 100,
            r.gross / 100,
            r.net / 100,
          ]),
        ],
        "本月客户经营报表",
      );
    },
    "dispatch-print": () => {
      const os = data().orders.filter(
        (o) =>
          o.deliveryDate === (V.day || data().settings.date) &&
          ["待装车", "配送中", "已签收"].includes(o.status) &&
          (!V.route || o.routeId === V.route),
      );
      U.modal({
        title: "配送清单 · " + (V.day || data().settings.date),
        wide: true,
        body: `<div class="table-wrap"><table><thead><tr><th>线路</th><th>订单</th><th>客户</th><th>商品行</th><th>状态</th></tr></thead><tbody>${os.map((o) => `<tr><td>${e(Y.find(data(), "routes", o.routeId).name)}</td><td>${o.id}</td><td>${e(customer(o.customerId).name)}</td><td>${o.lines.length}</td><td>${o.status}</td></tr>`).join("")}</tbody></table></div><div style="margin-top:20px" class="no-print">${b("打开打印预览", "print", "", "primary", "print")}</div>`,
      });
    },
    "reset-data": () =>
      U.confirm(
        "恢复初始演示数据",
        "这会覆盖当前浏览器内的所有演示操作，并恢复 60 家客户、45 家供应商及完整初始业务场景。确认恢复？",
        () => {
          Y.store.reset();
          U.shell(page);
          refresh("初始演示数据已恢复");
        },
      ),
    backup: () => {
      const blob = new Blob([JSON.stringify(data(), null, 2)], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "嘉禾农业演示数据_" + data().settings.date + ".json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      U.toast("数据备份已导出");
    },
  };
  U.shell(page);
  render();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const handler = handlers[button.dataset.action];
    if (!handler) return;
    try {
      handler(button.dataset.id || "", button);
    } catch (error) {
      U.toast(error.message, true);
    }
  });
  document.addEventListener("input", (event) => {
    const el = event.target;
    if (el.matches("[data-filter=q]")) {
      V.q = el.value;
      V.page = 1;
      render();
    }
    if (el.matches(".line-product")) {
      updateLinePrices(el.closest("dialog") || el.closest("form"));
      try {
        const input = el.closest("[data-line]").querySelector(".line-cost");
        if (input) input.value = getProduct(el.value).cost / 100;
      } catch (error) {
        /* 完成商品匹配后再更新采购基准。 */
      }
    }
  });
  document.addEventListener("change", (event) => {
    const el = event.target;
    if (el.dataset.filter) {
      const key = el.dataset.filter;
      if ((key === "start" || key === "end") && !el.value) return;
      const next = { ...V, [key]: el.value };
      if (next.start > next.end) {
        U.toast("开始日期不能晚于结束日期", true);
        el.value = V[key];
        return;
      }
      V[key] = el.value;
      V.page = 1;
      render();
    }
    if (el.name === "customerId")
      updateLinePrices(el.closest("dialog") || el.closest("form"));
  });
  window.addEventListener("storage", (event) => {
    if (event.key === Y.KEY) {
      try {
        Y.store.refresh();
        if (!document.querySelector("dialog[open]")) render();
        U.toast("另一页面的业务操作已同步");
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

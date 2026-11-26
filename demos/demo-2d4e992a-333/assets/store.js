/* 统一数据与业务规则：所有页面共用，可在独立内存存储中自动验证。 */
(function (g) {
  "use strict";
  const Y = (g.JIAHE = g.JIAHE || {}),
    KEY = "JIAHE_FRESH_STATIC_V1";
  const clone = (o) => JSON.parse(JSON.stringify(o)),
    sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const need = (ok, msg) => {
    if (!ok) throw new Error(msg);
  };
  // 比较日期前先校验真实日历值，避免 2 月 31 日等输入被字符串比较误接受。
  const isDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
  const find = (d, k, id) => {
    const x = d[k].find((x) => x.id === id);
    need(x, "记录不存在或已移除");
    return x;
  };
  const qty = (n) => {
    n = Number(n);
    need(
      Number.isFinite(n) &&
        n > 0 &&
        n <= 100000 &&
        Math.abs(n * 100 - Math.round(n * 100)) < 0.0001,
      "数量必须大于 0，最多两位小数，且不超过 100000",
    );
    return n;
  };
  const validQty = (p, n) => {
    n = qty(n);
    need(p.unit === "kg" || Number.isInteger(n), "件装商品请输入整数数量");
    return n;
  };
  const next = (d, p) =>
    p + d.settings.date.replaceAll("-", "") + String(++d.sequence);
  const stock = (d, id) =>
    sum(
      d.batches.filter(
        (b) => b.productId === id && b.expires >= d.settings.date,
      ),
      (b) => b.qty,
    );
  const amount = (o) =>
    sum(o.lines, (l) => Math.round((l.actualQty ?? l.qty) * l.price));
  const cost = (o) =>
    sum(o.lines, (l) => Math.round((l.actualQty ?? l.qty) * l.cost));
  function consume(d, pid, n, type, ref) {
    need(
      stock(d, pid) + 0.0001 >= n,
      find(d, "products", pid).name + " 可用库存不足，请先采购入库",
    );
    let left = n,
      c = 0;
    d.batches
      .filter(
        (b) => b.productId === pid && b.expires >= d.settings.date && b.qty > 0,
      )
      .sort((a, b) => a.expires.localeCompare(b.expires))
      .forEach((b) => {
        const take = Math.min(b.qty, left);
        b.qty = Math.round((b.qty - take) * 100) / 100;
        left = Math.round((left - take) * 100) / 100;
        c += Math.round(take * b.cost);
      });
    d.movements.unshift({
      id: next(d, "LS"),
      date: d.settings.date,
      productId: pid,
      type,
      qty: -n,
      note: ref,
    });
    return Math.round(c / n);
  }
  function receive(d, po, productionDate, shelfDays) {
    need(po.status !== "已入库", "该采购单已入库，不能重复收货");
    need(po.status === "待收货", "请先在供应商端确认送货");
    need(
      isDate(productionDate) && productionDate <= d.settings.date,
      "生产日期必须是有效日期，且不能晚于业务日期",
    );
    const days = Number(shelfDays);
    need(
      Number.isInteger(days) && days > 0 && days <= 3650,
      "保质期应为 1～3650 天的整数",
    );
    const expires = new Date(
      new Date(productionDate + "T00:00:00Z").getTime() + days * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    need(expires >= d.settings.date, "这批商品已过期，不能作为可用库存入库");
    po.lines.forEach((l) => {
      d.batches.push({
        id: next(d, "B"),
        productId: l.productId,
        supplierId: po.supplierId,
        qty: l.qty,
        cost: l.cost,
        productionDate,
        expires,
        zone: "待分拣区",
        source: po.id,
      });
      d.movements.unshift({
        id: next(d, "LS"),
        date: d.settings.date,
        productId: l.productId,
        type: "采购入库",
        qty: l.qty,
        note: po.id,
      });
    });
    po.status = "已入库";
    po.receivedAt = d.settings.date;
    po.productionDate = productionDate;
    po.shelfDays = days;
    po.certIds = d.certs.filter((doc) =>
      doc.supplierId === po.supplierId && doc.expires >= d.settings.date &&
      ["已通过", "已分配", "打印队列"].includes(doc.status),
    ).map((doc) => doc.id);
    po.orderIds.forEach((id) => {
      const o = find(d, "orders", id);
      if (
        d.purchases
          .filter((p) => p.orderIds.includes(id))
          .every((p) => p.status === "已入库")
      )
        o.status = "待分拣";
    });
  }
  function writeOrder(d, input) {
    const customer = find(d, "customers", input.customerId);
    need(customer.active, "该客户已停用");
    need(isDate(input.deliveryDate) && input.deliveryDate >= d.settings.date,
      "配送日期必须有效且不能早于业务日期");
    need(input.lines?.length, "请至少选择一件商品");
    const merged = new Map();
    for (const line of input.lines) {
      const product = find(d, "products", line.productId);
      need(product.active, "商品已下架");
      const quantity = validQty(product, line.qty);
      const existing = merged.get(product.id);
      if (existing) {
        existing.qty = validQty(product, Math.round((existing.qty + quantity) * 100) / 100);
        continue;
      }
      const quote = Y.quoteFor(d, customer, product);
      merged.set(product.id, {
        productId: product.id,
        name: product.name,
        spec: product.spec,
        unit: product.unit,
        qty: quantity,
        price: quote.price,
        printName: quote.printName,
        printUnit: quote.printUnit,
        cost: product.cost,
        actualQty: null,
      });
    }
    const id = next(d, "DD");
    d.orders.unshift({
      id,
      customerId: customer.id,
      customerName: customer.name,
      printTemplate: customer.printTemplate || "标准送货单",
      date: d.settings.date,
      deliveryDate: input.deliveryDate,
      status: input.intakeId ? "待采购" : "待确认",
      lines: [...merged.values()],
      note: input.note || "",
      source: input.source || "内部代下单",
      intakeId: input.intakeId || "",
      routeId: customer.routeId,
      createdAt: d.settings.date + " " + new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    });
    if (input.clearCart) d.carts[customer.id] = {};
    return id;
  }
  /** 本地业务存储类。storage 为具备 getItem/setItem 的存储，不能为空；读写失败抛错，避免报告未保存的成功。 */
  class DataStore {
    constructor(storage) {
      this.storage = storage;
      this.data = this.read();
    }
    /** 读取状态，无参数；缺省时创建种子，损坏时抛错并保留原数据。 */
    read() {
      const raw = this.storage.getItem(KEY);
      if (!raw) return Y.makeSeed();
      let d;
      try {
        d = JSON.parse(raw);
      } catch (e) {
        throw new Error("本地数据无法读取，请在系统设置恢复演示数据");
      }
      need(
        d.version === 1 && Array.isArray(d.orders) && Array.isArray(d.products),
        "演示数据版本不匹配",
      );
      return d;
    }
    /** 刷新内存，无参数；返回当前数据，存储异常保持显式失败。 */
    refresh() {
      this.data = this.read();
      return this.data;
    }
    /** 原子执行变更。label 为非空业务动作，fn 接收副本；校验或保存失败不污染原状态，返回命令结果。 */
    change(label, fn) {
      const d = clone(this.read()),
        result = fn(d);
      d.revision++;
      d.logs.unshift({
        date:
          d.settings.date +
          " " +
          new Date().toLocaleTimeString("zh-CN", { hour12: false }),
        text: label,
      });
      d.logs = d.logs.slice(0, 100);
      try {
        this.storage.setItem(KEY, JSON.stringify(d));
      } catch (e) {
        throw new Error("浏览器存储空间不足或已禁用，本次操作未保存");
      }
      this.data = d;
      return result;
    }
    /** 恢复初始数据，无参数；调用者需先取得界面确认，返回新状态，保存失败抛错。 */
    reset() {
      const d = Y.makeSeed();
      this.storage.setItem(KEY, JSON.stringify(d));
      this.data = d;
      return d;
    }
    /** 新建订单。input 必须含 customerId、合法 deliveryDate 和非空 lines；校验商品、单位、数量后保存价格快照并返回编号。 */
    createOrder(input) {
      return this.change("新建客户订单", (d) => writeOrder(d, input));
    }
    /** 新增待识别消息。input 需提供客户、格式与文本，标题可空；返回来源编号，空文本或停用客户抛错。 */
    addIntake(input) {
      return this.change("接收演示订单消息", (d) => {
        const customer = find(d, "customers", input.customerId);
        const text = String(input.text ?? "").trim();
        need(customer.active, "该客户已停用");
        need(Y.sourceFormats.includes(input.format), "请选择有效消息格式");
        need(text && text.length <= 5000 && text.split(/\r?\n/).length <= 30,
          "请填写原始内容，最多 30 行或 5000 字符");
        const id = next(d, "WX");
        d.intake.unshift({
          id, customerId: customer.id, text, format: input.format, status: "待识别",
          title: String(input.title || "新增客户订单消息").trim().slice(0, 80),
          receivedAt: d.settings.date + " " + new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          channel: input.format === "系统摘录" ? "客户自有系统" : "企业微信群",
          clerk: customer.clerk || "录单组",
        });
        return id;
      });
    }
    /** 识别消息。id 对应未生成订单的来源；返回已保存的识别行，空来源或已确认时抛错。 */
    recognizeIntake(id) {
      return this.change("模拟识别 " + id, (d) => {
        const source = find(d, "intake", id);
        need(!source.orderId, "该消息已生成订单");
        const rows = Y.matchIntake(d, source.customerId, source.text);
        need(rows.length, "原单没有识别到商品明细");
        source.rows = rows;
        source.status = "待复核";
        return rows;
      });
    }
    /** 确认复核。sourceId 必填且未确认，input 含有效配送日期和与原单对应的商品行；完整保存后返回订单号。 */
    confirmIntake(sourceId, input) {
      return this.change("核对并生成订单 " + sourceId, (d) => {
        const source = find(d, "intake", sourceId);
        need(!source.orderId, "该消息已生成订单，不能重复确认");
        need(source.rows?.length && input.rows?.length === source.rows.length,
          "请先模拟识别并确认每一条原始明细");
        const lines = source.rows.map((row, index) => {
          const edited = input.rows[index];
          const product = d.products.find((candidate) => candidate.id === edited.productId && candidate.active);
          need(product, "第 " + (index + 1) + " 行请选择有效商品");
          let quantity;
          try {
            quantity = validQty(product, edited.qty);
          } catch (error) {
            throw new Error("第 " + (index + 1) + " 行：" + error.message);
          }
          const corrected = row.result === "待复核" || row.productId !== product.id || row.qty !== quantity;
          if (edited.remember && row.token && (row.productId !== product.id || !row.productId)) {
            // 仅记录当前客户修正过的叫法，避免覆盖其他客户的专用商品。
            const previous = d.aliases.find((alias) => alias.customerId === source.customerId && alias.token === row.token);
            if (previous) {
              previous.productId = product.id;
            } else {
              d.aliases.push({ customerId: source.customerId, token: row.token, name: row.rawName, productId: product.id });
            }
          }
          return { ...row, productId: product.id, qty: quantity, corrected };
        });
        const id = writeOrder(d, {
          customerId: source.customerId,
          intakeId: source.id,
          deliveryDate: input.deliveryDate,
          note: input.note,
          source: "AI 录单 · " + source.format,
          lines,
        });
        source.review = lines;
        source.orderId = id;
        source.status = "已生成订单";
        return id;
      });
    }
    /** 维护专用价及打印格式。input 需客户和在售商品、正整数分价格、名称和等价单位；保存至客户商品档案。 */
    saveQuote(input) {
      return this.change("保存客户专用报价", (d) => {
        find(d, "customers", input.customerId);
        const product = find(d, "products", input.productId);
        const price = Number(input.price);
        const printName = String(input.printName ?? "").trim();
        const printUnit = String(input.printUnit ?? "").trim();
        need(Number.isInteger(price) && price > 0, "专用价必须大于 0");
        need(printName && printName.length <= 80, "打印品名须为 1～80 个字符");
        need(!d.quotes.some((entry) => entry.customerId === input.customerId &&
          entry.productId !== product.id && Y.aliasKey(entry.printName) === Y.aliasKey(printName)),
          "该客户的打印品名已关联其他商品");
        need(printUnit && Y.normalizedQty(1, printUnit, product.unit) === 1,
          "打印单位须与库存单位等价，例如 kg、KG、公斤或千克");
        const quote = { customerId: input.customerId, productId: product.id, price, printName, printUnit };
        const index = d.quotes.findIndex((entry) => entry.customerId === input.customerId && entry.productId === product.id);
        if (index < 0) d.quotes.unshift(quote);
        else d.quotes[index] = quote;
        return quote;
      });
    }
    /** 模拟推送利客。id 为已确认订单，simulateFailure 指定是否记录模拟超时；已成功订单直接返回既有回执。 */
    pushOrder(id, simulateFailure) {
      return this.change("模拟推送利客 " + id, (d) => {
        const order = find(d, "orders", id);
        need(!["待确认", "已取消"].includes(order.status), "仅可推送已确认的有效订单");
        if (order.push?.state === "推送成功") return order.push;
        order.push = {
          state: simulateFailure ? "推送失败" : "推送成功",
          attempts: (order.push?.attempts || 0) + 1,
          message: simulateFailure ? "模拟接口超时，可用原订单号重试" : "已取得演示回执",
          receipt: simulateFailure ? "" : "LK-" + id,
        };
        return order.push;
      });
    }
    /** 操作订单。id 必填且存在，action 为 confirm/cancel/ship/sign，extra 为线路或分拣数量；状态错误及库存不足抛错。 */
    orderAction(id, action, extra = {}) {
      return this.change("订单 " + id + " · " + action, (d) => {
        const o = find(d, "orders", id);
        if (action === "confirm") {
          need(o.status === "待确认", "仅待确认订单可接单");
          o.status = "待采购";
        } else if (action === "cancel") {
          need(
            ["待确认", "待采购"].includes(o.status),
            "已采购或开始履约的订单不能直接取消",
          );
          o.status = "已取消";
        } else if (action === "sort") {
          need(o.status === "待分拣", "订单尚未完成采购收货，或已分拣");
          o.lines.forEach((l, i) => {
            const p = find(d, "products", l.productId),
              n = validQty(p, extra.quantities ? extra.quantities[i] : l.qty);
            need(n <= l.qty * 1.2 + 0.001, "实称不能超过订购数量的 120%");
            l.cost = consume(d, p.id, n, "分拣出库", o.id);
            l.actualQty = n;
          });
          o.status = "待装车";
        } else if (action === "ship") {
          need(o.status === "待装车", "仅已完成分拣的订单可装车发车");
          find(d, "routes", extra.routeId || o.routeId);
          o.routeId = extra.routeId || o.routeId;
          o.status = "配送中";
        } else if (action === "sign") {
          need(o.status === "配送中", "仅配送中的订单可签收");
          o.status = "已签收";
          o.signedAt = d.settings.date + " 07:30";
        } else throw new Error("未知订单操作");
        return o.id;
      });
    }
    /** 修改订单。id 为待确认订单，quantities 与行一一对应且有效；note 可为空；保留历史单价，失败抛错。 */
    editOrder(id, quantities, note) {
      return this.change("修改待确认订单", (d) => {
        const o = find(d, "orders", id);
        need(o.status === "待确认", "仅待确认订单可修改");
        need(quantities.length === o.lines.length, "商品明细不匹配");
        o.lines.forEach(
          (l, i) =>
            (l.qty = validQty(find(d, "products", l.productId), quantities[i])),
        );
        o.note = note || "";
      });
    }
    /** 汇总采购。ids 是非空待采购订单编号数组；按商品供货商汇总，防重复采购，返回采购单编号数组。 */
    generatePurchase(ids) {
      return this.change("订单需求生成采购", (d) => {
        need(ids && ids.length, "请选择待采购订单");
        const groups = new Map();
        [...new Set(ids)].forEach((id) => {
          const o = find(d, "orders", id);
          need(o.status === "待采购", "订单 " + id + " 不在待采购状态");
          o.lines.forEach((l) => {
            const p = find(d, "products", l.productId),
              sup = find(d, "suppliers", p.supplierId);
            need(sup.active, "供应商已停用，请先调整商品供货商");
            const groupKey = sup.id + "/" + o.deliveryDate;
            if (!groups.has(groupKey))
              groups.set(groupKey, { supplierId: sup.id, deliveryDate: o.deliveryDate, lines: new Map(), ids: new Set() });
            const a = groups.get(groupKey);
            a.ids.add(id);
            const old = a.lines.get(p.id);
            if (old) old.qty = Math.round((old.qty + l.qty) * 100) / 100;
            else
              a.lines.set(p.id, {
                productId: p.id,
                name: p.name,
                unit: p.unit,
                qty: l.qty,
                cost: p.cost,
              });
          });
          o.status = "采购中";
        });
        return [...groups.values()].map((x) => {
          const id = next(d, "CG");
          d.purchases.unshift({
            id,
            supplierId: x.supplierId,
            deliveryDate: x.deliveryDate,
            date: d.settings.date,
            status: "待供应商确认",
            orderIds: [...x.ids],
            lines: [...x.lines.values()],
            source: "订单需求汇总",
          });
          return id;
        });
      });
    }
    /** 供应商作业。id 和 supplierId 必填且归属一致；action 为 accept 或 deliver；成功返回当前采购单。 */
    supplierAction(id, supplierId, action) {
      return this.change("供应商处理 " + id, (d) => {
        const purchase = find(d, "purchases", id);
        need(purchase.supplierId === supplierId, "当前供应商无此订单");
        need(find(d, "suppliers", supplierId).active, "供应商已停用");
        if (action === "accept") {
          need(purchase.status === "待供应商确认", "当前状态不能再次接单");
          purchase.status = "待送货";
          purchase.acceptedAt = d.settings.date;
        } else if (action === "deliver") {
          need(purchase.status === "待送货", "请先接单，已生成的送货单无需重复提交");
          purchase.status = "待收货";
          purchase.deliveryNo = next(d, "SH");
          purchase.deliveredAt = d.settings.date;
        } else {
          throw new Error("未知的供应商操作");
        }
        return purchase;
      });
    }
    /** 确认收货。id 为待收货采购单，productionDate 不得在未来，shelfDays 为有效正整数；成功更新库存及关联订单。 */
    receivePurchase(id, productionDate, shelfDays) {
      return this.change("采购收货入库", (d) =>
        receive(d, find(d, "purchases", id), productionDate, shelfDays),
      );
    }
    /** 新建供应商采购/AI入库。input 含供应商及有效商品行，receiveNow 决定是否一并入库；日期和保质期在入库时必填。 */
    createPurchase(input) {
      return this.change(
        input.receiveNow ? "AI 确认入库" : "新建采购单",
        (d) => {
          const sup = find(d, "suppliers", input.supplierId);
          need(sup.active, "供应商已停用");
          need(input.lines && input.lines.length, "请填写供货明细");
          const lines = input.lines.map((l) => {
            const p = find(d, "products", l.productId);
            const c = Number(l.cost ?? p.cost);
            need(Number.isInteger(c) && c > 0, "采购价必须大于 0");
            return {
              productId: p.id,
              name: p.name,
              unit: p.unit,
              qty: validQty(p, l.qty),
              cost: c,
            };
          });
          const po = {
            id: next(d, "CG"),
            supplierId: sup.id,
            date: d.settings.date,
            status: input.receiveNow ? "待收货" : "待供应商确认",
            orderIds: [],
            lines,
            source: input.source || "手工采购",
          };
          d.purchases.unshift(po);
          if (input.receiveNow)
            receive(d, po, input.productionDate, input.shelfDays);
          return po.id;
        },
      );
    }
    /** 库存作业。input 包含商品、类型和正数数量；调拨仅改变库区，退换货记录结算依据，库存不足不保存。 */
    inventoryAction(input) {
      return this.change("库存" + input.type, (d) => {
        const p = find(d, "products", input.productId),
          n = validQty(p, input.qty);
        need(
          ["报损", "退货", "换货", "库区调拨"].includes(input.type),
          "未知库存操作",
        );
        if (input.type === "库区调拨") {
          const zone = String(input.zone || "").trim();
          need(zone, "请选择目标库区");
          const source = d.batches.filter(
            (b) =>
              b.productId === p.id &&
              b.expires >= d.settings.date &&
              b.qty > 0 &&
              b.zone !== zone,
          );
          need(sum(source, (b) => b.qty) >= n, "其他库区可调拨库存不足");
          let left = n;
          source.forEach((b) => {
            const take = Math.min(left, b.qty);
            if (take > 0) {
              b.qty = Math.round((b.qty - take) * 100) / 100;
              d.batches.push({
                ...b,
                id: next(d, "B"),
                qty: take,
                zone,
                source: "库区调拨",
              });
              left = Math.round((left - take) * 100) / 100;
            }
          });
          d.movements.unshift({
            id: next(d, "LS"),
            date: d.settings.date,
            productId: p.id,
            type: input.type,
            qty: 0,
            movedQty: n,
            note: "调入" + zone + "；" + (input.note || ""),
          });
        } else {
          const c = consume(d, p.id, n, input.type, input.note || "仓库作业");
          if (input.type === "退货" || input.type === "换货")
            d.returns.push({
              id: next(d, "TH"),
              date: d.settings.date,
              supplierId: p.supplierId,
              productId: p.id,
              qty: n,
              amount: input.type === "退货" ? Math.round(n * c) : 0,
              type: input.type,
            });
          if (input.type === "换货") {
            const expires = new Date(
              new Date(d.settings.date + "T00:00Z").getTime() +
                p.shelfDays * 86400000,
            )
              .toISOString()
              .slice(0, 10);
            d.batches.push({
              id: next(d, "B"),
              productId: p.id,
              supplierId: p.supplierId,
              qty: n,
              cost: c,
              productionDate: d.settings.date,
              expires,
              zone: "待分拣区",
              source: "供应商换货",
            });
            d.movements.unshift({
              id: next(d, "LS"),
              date: d.settings.date,
              productId: p.id,
              type: "换货入库",
              qty: n,
              note: input.note || "",
            });
          }
        }
      });
    }
    /** 维护主数据。kind 仅允许 customers/suppliers/products，id 为空代表新增；values 中必填字段为空或价格无效时抛错。 */
    saveEntity(kind, id, values) {
      return this.change("维护" + kind, (d) => {
        need(
          ["customers", "suppliers", "products"].includes(kind),
          "不可编辑此类数据",
        );
        const v = { ...values };
        need(String(v.name || "").trim(), "名称不能为空");
        v.name = v.name.trim();
        need(
          !d[kind].some((x) => x.name === v.name && x.id !== id),
          "名称已存在",
        );
        let entity = id
          ? find(d, kind, id)
          : {
              id: next(
                d,
                kind === "customers" ? "S" : kind === "suppliers" ? "V" : "P",
              ),
              active: true,
            };
        if (kind === "products") {
          if (id && v.unit !== entity.unit)
            need(
              !d.batches.some((b) => b.productId === id && b.qty > 0) &&
                !d.orders.some((o) => o.lines.some((l) => l.productId === id)),
              "已有库存或业务记录的商品不能直接修改计价单位，请新增商品",
            );
          need(
            v.category && v.sub && v.spec && v.unit,
            "分类、规格和单位不能为空",
          );
          find(d, "suppliers", v.supplierId);
          need(Number.isInteger(v.cost) && v.cost > 0, "采购基准价必须大于 0");
          need(
            v.prices &&
              Object.values(v.prices).every(
                (n) => Number.isInteger(n) && n > 0,
              ),
              "协议价必须大于 0",
          );
          need(Number(v.minStock) >= 0, "安全库存不能小于 0");
          v.code = entity.code || "SP" + d.sequence;
          v.image = entity.image || "greens";
          v.shelfDays = entity.shelfDays || 7;
        } else {
          need(
            v.contact && /^1\d{10}$/.test(v.phone || ""),
            "请填写联系人及 11 位手机号",
          );
          need(
            Number(v.term) >= 0 && Number(v.term) <= 365,
            "账期应为 0～365 天",
          );
          if (kind === "customers") {
            need(Y.customerTypes.includes(v.type), "请选择客户类型");
            find(d, "routes", v.routeId);
          }
        }
        Object.assign(entity, v);
        if (!id) d[kind].unshift(entity);
        return entity.id;
      });
    }
    /** 调整价格。id 为商品编号，type 为客户类型，price 为正整数分；已存在订单快照保持不变。 */
    setPrice(id, type, price) {
      return this.change("协议价调整", (d) => {
        need(Y.customerTypes.includes(type), "价格类型不合法");
        need(Number.isInteger(price) && price > 0, "销售价必须大于 0");
        find(d, "products", id).prices[type] = price;
      });
    }
    /** 登记待审核资质。input 包含供应商、资料类型、名称及有效日期；备注可空，成功返回编号。 */
    addCert(input) {
      return this.change("登记供应商资质", (d) => {
        const supplier = find(d, "suppliers", input.supplierId);
        const name = String(input.name ?? "").trim();
        need(supplier.active, "供应商已停用");
        need(["产品合格证", "第三方检测报告", "营业资质"].includes(input.type), "请选择资料类型");
        need(name && name.length <= 80, "资料名称须为 1～80 个字符");
        need(isDate(input.date) && input.date <= d.settings.date &&
          isDate(input.expires) && input.expires >= input.date, "请核对出具日期与有效期");
        const id = next(d, "ZA");
        d.certs.unshift({
          id, supplierId: supplier.id, type: input.type, name,
          date: input.date, expires: input.expires, status: "待审核",
          customers: [], collectedAt: d.settings.date, note: String(input.note || "").slice(0, 120),
        });
        return id;
      });
    }
    /** 资料操作。id 在 collectAll 时可空，action 为 collectAll/review/reject/assign/queue，customerIds 在分配时必填。 */
    certAction(id, action, customerIds = []) {
      return this.change("食安资料处理", (d) => {
        if (action === "collectAll") {
          d.certs
            .filter((c) => ["待收集", "已退回"].includes(c.status))
            .forEach((c) => {
              c.status = "待审核";
              c.collectedAt = d.settings.date + " 18:30";
            });
          return;
        }
        const c = find(d, "certs", id);
        if (action === "review") {
          need(c.status === "待审核", "仅待审核资料可通过");
          c.status = "已通过";
        } else if (action === "reject") {
          need(c.status === "待审核", "仅待审核资料可退回");
          c.status = "已退回";
        } else if (action === "assign") {
          need(
            ["已通过", "已分配", "打印队列"].includes(c.status),
            "请先审核资料",
          );
          need(customerIds.length, "至少选择一家客户");
          customerIds.forEach((x) => find(d, "customers", x));
          c.customers = [...new Set(customerIds)];
          c.status = "已分配";
        } else if (action === "queue") {
          need(
            ["已通过", "已分配"].includes(c.status),
            "资料未审核或已加入打印队列",
          );
          c.status = "打印队列";
        } else throw new Error("未知资料操作");
      });
    }
    /** 生成月度账单。kind 为客户应收或供应商应付，month 为 YYYY-MM；重复对象月份跳过，无可结算数据抛错，返回新增数量。 */
    generateBills(kind, month) {
      return this.change("生成月结账单", (d) => {
        need(
          ["客户应收", "供应商应付"].includes(kind) &&
            /^\d{4}-\d{2}$/.test(month),
          "账单类型或月份无效",
        );
        let count = 0;
        const entities = kind === "客户应收" ? d.customers : d.suppliers;
        entities.forEach((e) => {
          // 同月后续完成的订单生成补充账单；已入账来源不能重复计入，也不能改写已结清账单。
          const existing = d.bills.filter(
              (b) =>
                b.kind === kind && b.targetId === e.id && b.month === month,
            ),
            billed = new Set(existing.flatMap((b) => b.docIds)),
            credited = new Set(existing.flatMap((b) => b.creditIds));
          const docs =
            kind === "客户应收"
              ? d.orders.filter(
                  (o) =>
                    o.customerId === e.id &&
                    o.status === "已签收" &&
                    o.deliveryDate.startsWith(month) &&
                    !billed.has(o.id),
                )
              : d.purchases.filter(
                  (p) =>
                    p.supplierId === e.id &&
                    p.status === "已入库" &&
                    p.receivedAt.startsWith(month) &&
                    !billed.has(p.id),
                );
          const credits =
            kind === "供应商应付"
              ? d.returns.filter(
                  (r) =>
                    r.supplierId === e.id &&
                    r.date.startsWith(month) &&
                    r.amount > 0 &&
                    !credited.has(r.id),
                )
              : [];
          if (!docs.length && !credits.length) return;
          const total =
            (kind === "客户应收"
              ? sum(docs, amount)
              : sum(docs, (p) =>
                  sum(p.lines, (l) => Math.round(l.qty * l.cost)),
                )) - sum(credits, (r) => r.amount);
          d.bills.unshift({
            id: next(d, "DZ"),
            kind,
            targetId: e.id,
            name: e.name,
            month,
            docIds: docs.map((x) => x.id),
            creditIds: credits.map((x) => x.id),
            amount: total,
            paid: 0,
            status: "待核对",
            date: d.settings.date,
          });
          count++;
        });
        need(count > 0, "该月份没有新增可结算单据，或账单已生成");
        return count;
      });
    }
    /** 账单确认或付款。id 必须存在；action 为 confirm/pay，value 付款时为正整数分，不得超过余额；不允许重复结清。 */
    billAction(id, action, value) {
      return this.change("对账结算", (d) => {
        const b = find(d, "bills", id);
        if (action === "confirm") {
          need(b.status === "待核对", "账单已确认");
          b.status = b.amount === 0 ? "已结清" : "已确认";
        } else {
          need(
            action === "pay" && ["已确认", "部分结算"].includes(b.status),
            "请先确认账单，且账单尚未结清",
          );
          need(
            Number.isInteger(value) &&
              value > 0 &&
              value <= Math.abs(b.amount - b.paid),
            "登记金额必须大于 0 且不能超过未结金额",
          );
          b.paid += b.amount < 0 ? -value : value;
          b.status = b.paid === b.amount ? "已结清" : "部分结算";
          d.payments.push({
            id: next(d, "FK"),
            billId: id,
            amount: b.amount < 0 ? -value : value,
            date: d.settings.date,
          });
        }
      });
    }
    /** 更新设置。values 只包含已定义参数；名称非空，费率为 0～50%；无参数对象或非法数值抛错。 */
    saveSettings(values) {
      return this.change("更新系统设置", (d) => {
        need(values && String(values.name || "").trim(), "软件名称不能为空");
        ["lowMargin", "deliveryRate", "otherRate"].forEach((k) =>
          need(
            Number.isFinite(Number(values[k])) &&
              Number(values[k]) >= 0 &&
              Number(values[k]) <= 50,
            "毛利阈值和费率应为 0～50",
          ),
        );
        d.settings.name = values.name.trim();
        ["lowMargin", "deliveryRate", "otherRate"].forEach(
          (k) => (d.settings[k] = Number(values[k])),
        );
      });
    }
    /** 保存客户购物车。customerId 必须有效，cart 为商品编号到非负数量的映射；空对象清空，仅保存有效正数项目。 */
    saveCart(customerId, cart) {
      return this.change("更新客户购物车", (d) => {
        find(d, "customers", customerId);
        const c = {};
        Object.entries(cart || {}).forEach(([id, n]) => {
          if (Number(n) > 0) c[id] = validQty(find(d, "products", id), n);
        });
        d.carts[customerId] = c;
        d.selectedCustomer = customerId;
      });
    }
  }
  Y.DataStore = DataStore;
  Y.KEY = KEY;
  Y.stock = stock;
  Y.amount = amount;
  Y.cost = cost;
  Y.sum = sum;
  Y.find = find;
  /** 按区间汇总客户利润。d 为完整状态，start/end 为闭区间日期，customerId 为空时全部；返回按收入排序明细。 */
  Y.report = function (d, start, end, customerId = "") {
    return d.customers
      .filter((s) => !customerId || s.id === customerId)
      .map((s) => {
        const os = d.orders.filter(
          (o) =>
            o.customerId === s.id &&
            o.status === "已签收" &&
            o.deliveryDate >= start &&
            o.deliveryDate <= end,
        );
        const revenue = sum(os, amount),
          purchase = sum(os, cost),
          delivery = Math.round((revenue * d.settings.deliveryRate) / 100),
          other = Math.round((revenue * d.settings.otherRate) / 100);
        const allRevenue = sum(
          d.orders.filter(
            (o) =>
              o.status === "已签收" &&
              o.deliveryDate >= start &&
              o.deliveryDate <= end,
          ),
          amount,
        );
        const losses = sum(
          d.movements.filter(
            (m) => m.type === "报损" && m.date >= start && m.date <= end,
          ),
          (m) => Math.round(-m.qty * find(d, "products", m.productId).cost),
        );
        const loss = allRevenue
          ? Math.round((losses * revenue) / allRevenue)
          : 0;
        return {
          customer: s,
          orders: os.length,
          revenue,
          purchase,
          gross: revenue - purchase,
          delivery,
          other,
          loss,
          net: revenue - purchase - delivery - other - loss,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  };
})(typeof window !== "undefined" ? window : globalThis);

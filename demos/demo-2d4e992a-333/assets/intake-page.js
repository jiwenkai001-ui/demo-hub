/* AI 录单工作台。原始消息、可编辑行与确认结果都来自当前浏览器的数据。 */
(function () {
  "use strict";
  const J = window.JIAHE;
  if (!J.store) return;
  const U = J.UI;
  const { esc: escape, icon, status, money, number } = U;
  const data = () => J.store.data;
  const params = new URLSearchParams(location.search);
  let selected = params.get("source") || "";
  let filter = params.get("status") || "";
  const tomorrow = () => J.nextDay(data().settings.date);
  const customer = (id) => J.find(data(), "customers", id);
  const formatIcon = { 手写图片: "edit", 电子表格: "orders", 语音消息: "file", 文字消息: "file", 系统摘录: "grid" };

  function queue(items) {
    return `<section class="panel inbox-queue">
      <div class="panel-head"><div><h2>消息队列</h2><p>${items.length} 条消息</p></div></div>
      <div class="inbox-filter"><select id="inbox-filter" aria-label="消息状态">
        ${U.opts(["待识别", "待复核", "已生成订单"], filter, "全部消息")}
      </select></div>
      <div class="inbox-list">${items.map((source) => `
        <button type="button" class="inbox-item" aria-pressed="${source.id === selected}" data-source="${escape(source.id)}">
          <span class="inbox-format">${icon(formatIcon[source.format] || "file")}</span>
          <span class="inbox-summary">
            <strong>${escape(customer(source.customerId).name)}</strong>
            <span>${escape(source.title)}</span>
            <small>${escape(source.receivedAt.slice(11))} · ${escape(source.format)}</small>
          </span>
          <span class="inbox-state" title="${escape(source.status)}">${status(source.status)}</span>
        </button>`).join("") || '<p class="inbox-empty muted">当前状态没有消息</p>'}
      </div>
    </section>`;
  }

  function original(source) {
    const account = customer(source.customerId);
    const audio = source.id === "WX004"
      ? '<audio controls preload="metadata" src="assets/samples/voice-order.wav" aria-label="演示订货语音"></audio>'
      : "";
    const paper = source.format === "手写图片" ? " source-handwritten" : "";
    return `<section class="panel intake-original">
      <div class="panel-head"><div><h2>原始订单</h2><p>${escape(source.channel)} · ${escape(source.format)}</p></div></div>
      <div class="panel-body">
        <div class="source-context"><strong>${escape(account.name)}</strong><span>${escape(source.receivedAt)}</span></div>
        <div class="source-paper${paper}">
          <strong>${escape(source.title)}</strong>
          ${audio}
          <pre>${escape(source.text)}</pre>
        </div>
        <dl class="source-meta"><div><dt>来源编号</dt><dd>${escape(source.id)}</dd></div>
          <div><dt>负责录单</dt><dd>${escape(source.clerk)}</dd></div>
          <div><dt>打印版式</dt><dd>${escape(account.printTemplate || "标准送货单")}</dd></div></dl>
      </div>
    </section>`;
  }

  function editor(source) {
    const account = customer(source.customerId);
    const counts = source.rows.filter((row) => row.result === "待复核").length;
    const options = data().products.filter((p) => p.active)
      .map((p) => `<option value="${escape(p.name)}">${escape(p.code + " · " + p.unit)}</option>`).join("");
    return `<form id="intake-review">
      <div class="review-summary">
        <span>${source.rows.length} 行商品</span>
        ${counts ? status(counts + " 行待复核") : status("匹配完成")}
        <button type="button" class="btn sm ghost" data-intake="recognize">重新识别</button>
      </div>
      <datalist id="intake-products">${options}</datalist>
      <div class="review-lines">${source.rows.map((row, index) => {
        const product = data().products.find((entry) => entry.id === row.productId && entry.active);
        const quote = product ? J.quoteFor(data(), account, product) : null;
        return `<article class="review-line" data-review-line="${index}">
          <div class="review-line-head"><strong>${escape(row.rawName)}</strong>
            <span class="muted">${escape(row.rawQty)} ${escape(row.rawUnit)}</span>${status(row.result)}</div>
          <div class="review-line-fields">
            ${U.field("匹配商品", "item-" + index, product?.name || "", "text", 'list="intake-products" required placeholder="输入商品名称或编码"')}
            ${U.field("确认数量", "qty-" + index, row.qty ?? "", "number", 'required min="0.01" max="100000" step="0.01"')}
          </div>
          <div class="review-line-meta">
            <span data-quote>${quote ? escape(money(quote.price) + " / " + product.unit + " · 打印 " + quote.printName + " / " + quote.printUnit) : escape(row.issue)}</span>
            <label><input type="checkbox" name="remember-${index}" ${product ? "" : "checked"}> 记住叫法</label>
          </div>
        </article>`;
      }).join("")}</div>
      <div class="form-grid intake-footer">
        ${U.field("配送日期", "deliveryDate", tomorrow(), "date", 'required min="' + data().settings.date + '"')}
        ${U.field("订单备注", "note", "", "text", 'maxlength="120" placeholder="选填"')}
      </div>
      <div class="form-error" role="alert"></div>
      <button type="submit" class="btn primary">${icon("check")}确认并生成订单</button>
    </form>`;
  }

  function outcome(source) {
    if (source.orderId) {
      const remembered = source.review.filter((row) => row.result === "记忆命中").length;
      return `<div class="intake-complete">${icon("check")}<h3>订单已生成</h3>
        <p>${escape(source.orderId)} · ${source.review.length} 行商品
          ${remembered ? " · " + remembered + " 行记忆命中" : ""}</p>
        <a class="btn primary" href="orders.html?q=${encodeURIComponent(source.orderId)}">查看订单 ${icon("right")}</a>
        ${source.id === "WX001" ? '<a class="btn" href="ai-entry.html?source=WX002">识别同客户补单</a>' : ""}
      </div>`;
    }
    if (source.rows) return editor(source);
    return `<div class="intake-ready">
      <div class="intake-ready-icon">${icon("spark")}</div>
      <h3>等待识别</h3>
      <p>提取商品和数量，优先匹配客户专用报价。</p>
      <button type="button" class="btn primary" data-intake="recognize">${icon("spark")}模拟识别</button>
    </div>`;
  }

  function render() {
    const items = data().intake.filter((entry) => !filter || entry.status === filter);
    if (!items.some((entry) => entry.id === selected)) selected = items[0]?.id || "";
    const source = items.find((entry) => entry.id === selected);
    const confirmed = data().intake.filter((entry) => entry.orderId);
    const learned = data().aliases.length;
    document.querySelector("#main").innerHTML = `
      <div class="page-heading"><div><h1>AI 智慧录单</h1>
        <p>企业微信群与客户系统消息 · 模拟接入</p></div>
        <div class="actions"><button type="button" class="btn" data-intake="aliases">${icon("tag")}匹配记忆 <strong>${learned}</strong></button>
        <button type="button" class="btn primary" data-intake="add">${icon("plus")}模拟收单</button></div>
      </div>
      <div class="inbox-overview"><span>待识别 <strong>${data().intake.filter((x) => x.status === "待识别").length}</strong></span>
        <span>待复核 <strong>${data().intake.filter((x) => x.status === "待复核").length}</strong></span>
        <span>已生成订单 <strong>${confirmed.length}</strong></span></div>
      <div class="intake-layout">${queue(items)}${source ? `
        <div class="intake-panels">${original(source)}
          <section class="panel intake-result">
            <div class="panel-head"><div><h2>识别与复核</h2><p>客户商品、数量与协议价</p></div></div>
            <div class="panel-body">${outcome(source)}</div>
          </section>
        </div>` : '<section class="panel empty">当前没有待处理的消息</section>'}</div>`;
  }

  function add() {
    U.modal({
      title: "模拟接收订单消息",
      submit: "加入消息队列",
      body: `<div class="form-grid">
        ${U.select("客户", "customerId", data().customers.filter((x) => x.active), "S1", "required")}
        ${U.select("来源格式", "format", J.sourceFormats, "文字消息", "required")}
        ${U.field("消息标题", "title", "", "text", 'maxlength="80" placeholder="例如 夜班加单"')}
        ${U.field("导入文字表格", "file", "", "file", 'accept=".csv,.tsv,.txt"')}
      </div>
      <div class="field intake-text"><label for="intake-raw">原始内容</label>
        <textarea id="intake-raw" name="text" required maxlength="5000" rows="6"
          placeholder="每行填写商品、数量、单位。例如 黄心土豆 20 公斤"></textarea>
      </div>`,
      onOpen: (dialog) => {
        dialog.querySelector('[name="file"]').onchange = async (event) => {
          const file = event.target.files[0];
          if (!file) return;
          if (file.size > 20000) {
            U.toast("请选择较小的 UTF-8 文本文件", true);
            return;
          }
          try {
            dialog.querySelector('[name="text"]').value = (await file.text()).replace(/^\uFEFF/, "");
          } catch (error) {
            U.toast("文件读取失败，请将内容粘贴到原始内容", true);
          }
        };
      },
      onSubmit: (form) => {
        selected = J.store.addIntake(Object.fromEntries(form));
        filter = "";
        render();
        U.toast("消息已加入队列");
      },
    });
  }

  function showAliases() {
    const rows = data().aliases.map((alias) => `<tr>
      <td>${escape(customer(alias.customerId).name)}</td>
      <td>${escape(alias.name)}</td>
      <td>${escape(J.find(data(), "products", alias.productId).name)}</td>
    </tr>`).join("");
    U.modal({
      title: "客户匹配记忆",
      body: rows ? `<div class="table-wrap"><table><thead><tr><th>客户</th><th>原始叫法</th>
        <th>匹配商品</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">复核时勾选记住叫法，记录会显示在这里</div>',
    });
  }

  function findProduct(value) {
    const token = J.aliasKey(value);
    return data().products.find((item) =>
      item.active && [J.aliasKey(item.name), J.aliasKey(item.code)].includes(token));
  }

  U.shell("ai-entry");
  render();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    try {
      if (button.dataset.source) {
        selected = button.dataset.source;
        render();
        document.querySelector(`[data-source="${CSS.escape(selected)}"]`)?.focus();
      }
      if (button.dataset.intake === "add") add();
      if (button.dataset.intake === "aliases") showAliases();
      if (button.dataset.intake === "recognize") {
        J.store.recognizeIntake(selected);
        filter = "";
        render();
        U.toast("已识别，核对商品后确认");
      }
      if (button.dataset.action === "menu") document.querySelector(".sidebar").classList.toggle("open");
    } catch (error) {
      U.toast(error.message, true);
    }
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "inbox-filter") {
      filter = event.target.value;
      render();
      document.querySelector("#inbox-filter").focus();
    }
    if (event.target.matches('[name^="item-"]')) {
      const product = findProduct(event.target.value);
      const line = event.target.closest("[data-review-line]");
      const source = J.find(data(), "intake", selected);
      if (!product) {
        line.querySelector("[data-quote]").textContent = "请选择有效商品";
        return;
      }
      const index = Number(line.dataset.reviewLine);
      const row = source.rows[index];
      const quote = J.quoteFor(data(), customer(source.customerId), product);
      line.querySelector('[name^="qty-"]').value = J.normalizedQty(row.rawQty, row.rawUnit, product.unit) ?? "";
      line.querySelector("[data-quote]").textContent =
        money(quote.price) + " / " + product.unit + " · 打印 " + quote.printName + " / " + quote.printUnit;
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id !== "intake-review") return;
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const source = J.find(data(), "intake", selected);
      const rows = source.rows.map((_, index) => ({
        productId: findProduct(form.get("item-" + index))?.id || "",
        qty: Number(form.get("qty-" + index)),
        remember: form.has("remember-" + index),
      }));
      const id = J.store.confirmIntake(selected, {
        deliveryDate: form.get("deliveryDate"), note: form.get("note"), rows,
      });
      filter = "";
      render();
      U.toast("订单 " + id + " 已生成");
    } catch (error) {
      event.target.querySelector(".form-error").textContent = error.message;
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === J.KEY) J.store.refresh();
  });
})();

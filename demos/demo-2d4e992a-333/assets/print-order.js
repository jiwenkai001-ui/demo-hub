/* 从确认时的名称与单位快照生成客户送货单。 */
(function () {
  "use strict";
  const J = window.JIAHE;
  if (!J.store) return;
  const { esc: escape, icon, money, number } = J.UI;
  const id = new URLSearchParams(location.search).get("order");
  const data = J.store.data;
  const order = data.orders.find((entry) => entry.id === id);
  const panel = document.querySelector("#order-print");
  if (!order) {
    panel.innerHTML = '<section class="panel empty">未找到订单 <a class="btn" href="orders.html">返回订单</a></section>';
    return;
  }
  const custom = order.printTemplate === "客户定制版";
  document.title = order.id + " · 客户送货单";
  panel.innerHTML = `<div class="print-page">
    <div class="between print-toolbar no-print">
      <a class="btn" href="orders.html?q=${encodeURIComponent(id)}">${icon("left")}返回订单</a>
      <button type="button" class="btn primary" id="print-now">${icon("print")}打印或另存 PDF</button>
    </div>
    <article class="print-sheet ${custom ? "print-custom" : ""}">
      <header><p>${escape(data.settings.name)}</p><h1>${custom ? "食材配送明细单" : "客户送货单"}</h1></header>
      <div class="print-order-meta"><div>客户　${escape(order.customerName)}</div>
        <div>送货日期　${escape(order.deliveryDate)}</div>
        <div>单号　${escape(order.id)}</div><div>版式　${escape(order.printTemplate || "标准送货单")}</div></div>
      <div class="table-wrap"><table><thead><tr><th>序号</th><th>品名</th>${custom ? "" : "<th>规格</th>"}
      <th>数量</th><th>单位</th><th>协议价</th><th>金额</th></tr></thead>
      <tbody>${order.lines.map((line, index) => `<tr><td>${index + 1}</td>
        <td>${escape(line.printName || line.name)}</td>${custom ? "" : `<td>${escape(line.spec)}</td>`}
        <td>${number(line.actualQty ?? line.qty)}</td><td>${escape(line.printUnit || line.unit)}</td>
        <td>${money(line.price)}</td><td>${money(Math.round((line.actualQty ?? line.qty) * line.price))}</td></tr>`).join("")}</tbody></table></div>
      <div class="between print-order-total"><span>备注　${escape(order.note || "—")}</span><strong>合计　${money(J.amount(order))}</strong></div>
      <div class="print-signatures"><span>配送员 __________</span><span>收货人 __________</span><span>验收人 __________</span></div>
      <p class="small muted">演示单据</p>
    </article>
  </div>`;
  document.querySelector("#print-now").onclick = () => window.print();
})();

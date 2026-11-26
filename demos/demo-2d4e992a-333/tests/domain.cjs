/* 本地独立内存验证，不触碰浏览器数据。 */
const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const context = { console, Date, Map, Set, JSON, Number, Math };
context.globalThis = context;
vm.createContext(context);
for (const file of ["seed.js", "intake.js", "store.js"])
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../assets", file), "utf8"),
    context,
  );
const Y = context.JIAHE;
let raw = null;
const storage = {
  getItem: () => raw,
  setItem: (k, v) => {
    raw = v;
  },
};
const store = new Y.DataStore(storage);
let checks = 0;
function ok(fn) {
  fn();
  checks++;
}
ok(() => assert.equal(store.data.customers.length, 60));
ok(() => assert.equal(store.data.suppliers.length, 45));
ok(() => assert.equal(store.data.products.length, 2040));
ok(() => assert.equal(store.data.orders.length, 346));
const id = store.createOrder({
  customerId: "S1",
  deliveryDate: "2026-11-27",
  lines: [
    { productId: "P0001", qty: 10 },
    { productId: "P0002", qty: 5 },
  ],
  source: "客户自主下单",
});
const originalPrice = Y.find(store.data, "orders", id).lines[0].price;
ok(() => assert.equal(Y.find(store.data, "orders", id).status, "待确认"));
ok(() => assert.throws(() => store.orderAction(id, "sign"), /仅配送中/));
store.setPrice("P0001", "中小学", 999);
ok(() =>
  assert.equal(Y.find(store.data, "orders", id).lines[0].price, originalPrice),
);
store.orderAction(id, "confirm");
const purchases = store.generatePurchase([id]);
ok(() => assert.ok(purchases.length));
ok(() => assert.throws(() => store.generatePurchase([id]), /不在待采购/));
for (const po of purchases) {
  const vendor = Y.find(store.data, "purchases", po).supplierId;
  ok(() => assert.throws(() => store.receivePurchase(po, "2026-11-26", 7), /请先在供应商端/));
  ok(() => assert.throws(() => store.supplierAction(po, "V45", "accept"), /无此订单/));
  store.supplierAction(po, vendor, "accept");
  const delivered = store.supplierAction(po, vendor, "deliver");
  ok(() => assert.match(delivered.deliveryNo, /^SH20261126/));
  store.receivePurchase(po, "2026-11-26", 7);
}
ok(() => assert.equal(Y.find(store.data, "orders", id).status, "待分拣"));
ok(() =>
  assert.throws(
    () => store.receivePurchase(purchases[0], "2026-11-26", 7),
    /不能重复/,
  ),
);
const stock = Y.stock(store.data, "P0001");
store.orderAction(id, "sort", { quantities: [10, 5] });
ok(() => assert.equal(Y.stock(store.data, "P0001"), stock - 10));
ok(() => assert.throws(() => store.orderAction(id, "sort"), /已分拣/));
store.orderAction(id, "ship", { routeId: "R1" });
store.orderAction(id, "sign");
ok(() => assert.equal(Y.find(store.data, "orders", id).status, "已签收"));
ok(() => assert.throws(() => store.orderAction(id, "sign"), /仅配送中/));
store.generateBills("客户应收", "2026-11");
const bill = store.data.bills.find((b) => b.docIds.includes(id));
ok(() => assert.ok(bill.amount > 0));
ok(() => assert.throws(() => store.billAction(bill.id, "pay", 100), /先确认/));
store.billAction(bill.id, "confirm");
store.billAction(bill.id, "pay", bill.amount);
ok(() => assert.equal(Y.find(store.data, "bills", bill.id).status, "已结清"));
ok(() => assert.throws(() => store.billAction(bill.id, "pay", 100), /先确认/));
ok(() =>
  assert.throws(() => store.generateBills("客户应收", "2026-11"), /账单已生成/),
);
const s = Y.stock(store.data, "P0001");
store.inventoryAction({
  productId: "P0001",
  type: "库区调拨",
  qty: 3,
  zone: "复核区",
});
ok(() => assert.equal(Y.stock(store.data, "P0001"), s));
store.inventoryAction({ productId: "P0001", type: "换货", qty: 2 });
ok(() => assert.equal(Y.stock(store.data, "P0001"), s));
store.inventoryAction({
  productId: "P0001",
  type: "报损",
  qty: 1,
  note: "测试损耗",
});
ok(() => assert.equal(Y.stock(store.data, "P0001"), s - 1));
const snapshot = JSON.stringify(store.data);
ok(() =>
  assert.throws(
    () =>
      store.inventoryAction({ productId: "P0001", type: "报损", qty: 100000 }),
    /库存不足/,
  ),
);
ok(() => assert.equal(JSON.stringify(store.data), snapshot));
ok(() =>
  assert.throws(
    () =>
      store.createOrder({
        customerId: "S1",
        deliveryDate: "2026-11-27",
        lines: [{ productId: "P0025", qty: 1.5 }],
      }),
    /整数数量/,
  ),
);
ok(() =>
  assert.throws(
    () =>
      store.createOrder({
        customerId: "S1",
        deliveryDate: "2026-11-16",
        lines: [{ productId: "P0001", qty: 1 }],
      }),
    /不能早于/,
  ),
);
ok(() =>
  assert.throws(
    () =>
      store.createOrder({
        customerId: "S1",
        deliveryDate: "2026-11-27",
        lines: [{ productId: "P0001", qty: 0 }],
      }),
    /数量必须/,
  ),
);
const pending = store.data.certs.find((c) => c.status === "待收集");
store.certAction(null, "collectAll");
store.certAction(pending.id, "review");
store.certAction(pending.id, "assign", ["S1"]);
store.certAction(pending.id, "queue");
ok(() =>
  assert.equal(Y.find(store.data, "certs", pending.id).status, "打印队列"),
);
ok(() => assert.throws(() => store.certAction(pending.id, "queue"), /已加入/));
const report = Y.report(store.data, "2026-11-01", "2026-11-30", "S1")[0];
ok(() =>
  assert.equal(
    report.net,
    report.revenue -
      report.purchase -
      report.delivery -
      report.other -
      report.loss,
  ),
);
const rawBefore = raw;
storage.setItem = () => {
  throw new Error("quota");
};
ok(() =>
  assert.throws(() => store.setPrice("P0001", "中小学", 1200), /未保存/),
);
ok(() => assert.equal(raw, rawBefore));
ok(() =>
  assert.equal(Y.find(store.data, "products", "P0001").prices["中小学"], 999),
);

const refundRaw = { value: null };
const refunds = new Y.DataStore({
  getItem: () => refundRaw.value,
  setItem: (k, v) => {
    refundRaw.value = v;
  },
});
refunds.generateBills("供应商应付", "2026-11");
refunds.inventoryAction({ productId: "P0001", type: "退货", qty: 2 });
refunds.generateBills("供应商应付", "2026-11");
const refundBill = refunds.data.bills.find((b) => b.amount < 0);
ok(() => assert.ok(refundBill));
refunds.billAction(refundBill.id, "confirm");
refunds.billAction(refundBill.id, "pay", Math.abs(refundBill.amount));
ok(() =>
  assert.equal(Y.find(refunds.data, "bills", refundBill.id).status, "已结清"),
);
ok(() => assert.equal(refunds.data.payments.at(-1).amount, refundBill.amount));
ok(() =>
  assert.throws(
    () =>
      refunds.createOrder({
        customerId: "S1",
        deliveryDate: "2026-11-31",
        lines: [{ productId: "P0001", qty: 1 }],
      }),
    /日期必须有效/,
  ),
);
refunds.saveCart("S1", { P0001: 3 });
refunds.createOrder({
  customerId: "S1",
  deliveryDate: "2026-11-27",
  lines: [{ productId: "P0001", qty: 3 }],
  clearCart: true,
});
ok(() => assert.equal(Object.keys(refunds.data.carts.S1).length, 0));
const existing = Y.find(refunds.data, "products", "P0001");
ok(() =>
  assert.throws(
    () =>
      refunds.saveEntity("products", existing.id, { ...existing, unit: "件" }),
    /不能直接修改计价单位/,
  ),
);

const source = refunds.recognizeIntake("WX001");
ok(() => assert.equal(source[0].result, "待复核"));
ok(() => assert.equal(source[2].result, "客户报价"));
const review = source.map((row, i) => ({
  productId: i === 0 ? "P0001" : row.productId,
  qty: i === 0 ? 24 : row.qty,
  remember: i === 0,
}));
ok(() => assert.throws(() => refunds.confirmIntake("WX001", { deliveryDate: "2026-11-27", rows: [] }), /原始明细/));
const aiId = refunds.confirmIntake("WX001", { deliveryDate: "2026-11-27", rows: review });
const aiOrder = Y.find(refunds.data, "orders", aiId);
ok(() => assert.equal(aiOrder.lines[0].printName, "马铃薯"));
ok(() => assert.equal(aiOrder.lines[0].printUnit, "KG"));
ok(() => assert.equal(aiOrder.lines[0].price, 350));
ok(() => assert.equal(aiOrder.status, "待采购"));
ok(() => assert.throws(() => refunds.confirmIntake("WX001", { deliveryDate: "2026-11-27", rows: review }), /重复确认/));
ok(() => assert.equal(refunds.recognizeIntake("WX002")[0].result, "记忆命中"));
ok(() => assert.equal(Y.matchIntake(refunds.data, "S2", "洋山芋 9 kg")[0].result, "待复核"));
ok(() => assert.equal(refunds.recognizeIntake("WX004")[0].qty, 7.5));
ok(() => assert.equal(refunds.pushOrder(aiId, true).state, "推送失败"));
ok(() => assert.equal(refunds.pushOrder(aiId, false).attempts, 2));
ok(() => assert.equal(refunds.pushOrder(aiId, false).receipt, "LK-" + aiId));
ok(() => assert.throws(() => refunds.saveQuote({
  customerId: "S1", productId: "P0001", price: 500, printName: "马铃薯", printUnit: "袋",
}), /打印单位/));
refunds.saveQuote({ customerId: "S1", productId: "P0001", price: 488, printName: "精选马铃薯", printUnit: "公斤" });
ok(() => assert.equal(Y.find(refunds.data, "orders", aiId).lines[0].price, 350));
ok(() => assert.equal(Y.quoteFor(refunds.data, refunds.data.customers[0], refunds.data.products[0]).price, 488));

console.log(
  JSON.stringify({
    passed: checks,
    orders: store.data.orders.length,
    products: store.data.products.length,
    fullChain: id,
  }),
);

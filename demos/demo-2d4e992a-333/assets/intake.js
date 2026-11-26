/* 客户报价、文字录单与模拟识别规则。 */
(function (global) {
  "use strict";
  const J = (global.JIAHE = global.JIAHE || {});
  const key = (value) => String(value ?? "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "");
  const units = { kg: "kg", 公斤: "kg", 千克: "kg", 斤: "kg" };
  const standardAliases = {
    土豆: "P0001",
    马铃薯: "P0001",
    番茄: "P0002",
    鸡蛋: "P0004",
    小白菜: "P0005",
    黄瓜: "P0009",
    猪腿肉: "P0021",
    豆油: "P0025",
    珍珠米: "P0026",
  };
  J.customerTypes = ["部队食堂", "中小学", "幼儿园", "高校食堂", "企事业单位", "酒店"];
  J.sourceFormats = ["手写图片", "电子表格", "语音消息", "文字消息", "系统摘录"];

  /** date 为 ISO 业务日期，返回下一自然日的 ISO 日期。 */
  J.nextDay = (date) => new Date(Date.parse(date + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);

  /** 查询客户成交规则。data、customer、product 均需有效；没有专用档案时按客户类别计价。 */
  J.quoteFor = function (data, customer, product) {
    const quote = data.quotes?.find(
      (item) => item.customerId === customer.id && item.productId === product.id,
    );
    return {
      price: quote?.price ?? product.prices[customer.type] ?? product.prices["中小学"],
      printName: quote?.printName || product.name,
      printUnit: quote?.printUnit || product.unit,
      custom: Boolean(quote),
    };
  };

  /** 将原始数量按原单位转换为库存单位。数量或单位无效时返回 null，未填写原单位时以商品单位核对。 */
  J.normalizedQty = function (quantity, rawUnit, unit) {
    const number = Number(quantity);
    const token = key(rawUnit);
    if (!Number.isFinite(number) || number <= 0) return null;
    if (token && (units[token] || token) !== unit) return null;
    const normalized = token === "斤" ? number / 2 : number;
    if (Math.abs(normalized * 100 - Math.round(normalized * 100)) > 0.0001) return null;
    if (unit !== "kg" && !Number.isInteger(normalized)) return null;
    return normalized;
  };

  /** 解析客户原始文字或表格。customerId 选择报价和别名范围；未匹配行仍返回，供人工补全。 */
  J.matchIntake = function (data, customerId, text) {
    const customer = data.customers.find((entry) => entry.id === customerId);
    if (!customer) throw new Error("请先选择有效客户");
    const quotes = new Map(data.quotes.filter((entry) => entry.customerId === customerId)
      .map((entry) => [key(entry.printName), entry.productId]));
    const learned = new Map(data.aliases.filter((entry) => entry.customerId === customerId)
      .map((entry) => [entry.token, entry.productId]));
    const catalog = new Map();
    for (const product of data.products) {
      if (product.active) {
        catalog.set(key(product.name), product.id);
        catalog.set(key(product.code), product.id);
      }
    }
    return String(text ?? "").split(/\r?\n/).map((line) => line.normalize("NFKC").trim())
      .filter((line) => line && !/^(商品名称|商品|品名|食材)\s*[,，\t ]+\s*数量/.test(line))
      .map((line) => {
        const match = line.match(/^(.+?)[\s,，:：]*(\d+(?:\.\d+)?)[\s,，]*([a-zA-Z\u4e00-\u9fff]*)$/);
        const rawName = (match?.[1] || line).trim();
        const rawQty = match?.[2] || "";
        const rawUnit = match?.[3] || "";
        const token = key(rawName);
        const candidate = quotes.get(token) || learned.get(token) || catalog.get(token) || standardAliases[token];
        const product = data.products.find((entry) => entry.active && entry.id === candidate);
        const qty = product ? J.normalizedQty(rawQty, rawUnit, product.unit) : null;
        const kind = quotes.get(token) ? "客户报价" : learned.get(token) ? "记忆命中" : "商品匹配";
        return {
          rawName, rawQty, rawUnit, token, qty, productId: product?.id || "",
          result: product && qty !== null ? kind : "待复核",
          issue: product ? (qty === null ? "请核对原数量和单位" : "") : "需要选择对应商品",
        };
      });
  };

  /** 规范化客户别名。value 允许为空；返回可用于客户内精确匹配的文本键。 */
  J.aliasKey = key;
})(typeof window === "undefined" ? globalThis : window);

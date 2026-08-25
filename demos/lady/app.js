const state = {
  page: "overview",
  store: "all",
  lang: "zh",
  inventorySearch: "",
  inventoryCategory: "all",
  docAction: "inbound"
};

const monthLabels = {
  zh: ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"],
  en: ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"]
};

const weekLabels = {
  zh: ["第1周", "第2周", "第3周", "第4周"],
  en: ["Week 1", "Week 2", "Week 3", "Week 4"]
};

const text = {
  zh: {
    title: "LADY FASHION 门店管理系统 Demo",
    topbarLabel: "店铺选择",
    admin: "管理员",
    logout: "退出登录",
    dateChip: "2026年04月14日",
    notify: "通知",
    sidebarLabel: "演示说明",
    sidebarTitle: "纯静态页面",
    sidebarDesc: "双击即可本地查看，后续可直接上传到服务器做客户演示。",
    currentView: "当前视图：",
    currentScope: "当前：",
    nav: { overview: "概览", sales: "销售分析", inventory: "出入库", stores: "店铺管理" },
    storeSelect: {
      all: "所有店铺",
      storeA: "店铺A · 淮海路形象店",
      storeB: "店铺B · 万象城轻奢店"
    },
    overview: {
      title: "销售分析概览",
      desc: "围绕两家女装店铺的销售、订单、会员与库存节奏进行展示，方便客户快速理解系统能力。",
      heroLabel: "总销售额",
      heroNote: "本月累计",
      orders: "订单数",
      ticket: "客单价",
      members: "新增会员",
      trendTitle: "销售趋势：本月 vs 上月 vs 去年同期",
      trendDesc: "适合给客户展示同比、环比和趋势判断能力。",
      compareTitle: "店铺A vs 店铺B 销售对比",
      compareDesc: "按周展示两家门店的销售差异和节奏变化。",
      topTitle: "本月畅销女装 TOP 5",
      topDesc: "结合样图形式展示排名、SKU、销量和销售额。",
      insightTitle: "经营分析摘要",
      insightDesc: "演示系统对门店表现的归纳能力。",
      ordersTrendLabel: "环比",
      ticketTrendLabel: "同比",
      membersTrendLabel: "环比"
    },
    sales: {
      title: "销售详细分析",
      desc: "按照门店维度查看每月销售额、同比、环比和重点商品表现。",
      actionBadge: "销售录入",
      actionTitle: "新增销售录入",
      actionDesc: "给当前门店补录销售额、订单数和新增会员后，页面会立即刷新同比、环比和概览指标。",
      scopeLabel: "当前录入门店",
      actionButton: "新增销售录入",
      yoy: "同比增长（YoY）",
      mom: "环比增长（MoM）",
      tableTitle: "月度销售明细",
      tableDesc: "展示本月销售额、上月同期、去年同期，以及环比和同比结果。",
      summaryTitle: "重点商品分析",
      summaryDesc: "适合演示商品结构、热卖单品和导购建议。",
      recentTitle: "最近销售录入",
      recentDesc: "用户新增后会立即出现在这里，方便现场演示。",
      recentEmptyTitle: "还没有新增记录",
      recentEmptyDesc: "点击上方按钮录入一笔门店销售，下面会立即显示。",
      monthLabel: "录入月份",
      modalTitle: "新增销售录入",
      modalDesc: "录入后会即时刷新当前门店的销售分析、概览指标与最近录入记录。",
      modalStore: "门店",
      modalAmount: "销售额",
      modalOrders: "订单数",
      modalMembers: "新增会员",
      modalNote: "录入说明",
      modalHint: "提交后将同步更新本月销售额、订单数、新增会员和最近录入记录。",
      modalCancel: "取消",
      modalSubmit: "确认录入",
      modalNoteDefault: "示例：午间直播成交补录",
      modalErrorAmount: "请输入大于 0 的销售额。",
      modalErrorOrders: "请输入大于 0 的订单数。",
      modalErrorMembers: "新增会员不能小于 0。",
      recordSales: "销售额",
      recordOrders: "订单",
      recordMembers: "新增会员",
      headers: ["日期", "本月销售额", "上月同期", "去年同期", "环比增长", "同比增长"]
    },
    inventory: {
      title: "出入库管理中心",
      desc: "包含库存查询、低库存预警、出入库记录和店铺调拨申请，贴近你给的样图结构。",
      docsTitle: "入库 / 出库单据管理",
      docsDesc: "演示新增单据、查看最近操作和库存流转。",
      addInbound: "新增入库单",
      addOutbound: "新增出库单",
      docHeaders: ["单据编号", "类型", "日期", "关联店铺", "状态"],
      queryTitle: "库存查询",
      queryDesc: "支持分类筛选和关键字搜索。",
      searchPlaceholder: "搜索商品或 SKU",
      categories: { all: "全部分类", sleepwear: "睡衣", underwear: "内衣", "sleep-pants": "睡裤", briefs: "内裤" },
      inventoryHeaders: ["商品图片", "商品名称", "SKU", "当前库存（店铺A）", "当前库存（店铺B）", "总库存", "安全股数"],
      warningTitle: "库存预警",
      warningDesc: "低库存商品和安全库存提醒。",
      moveTitle: "最新出入库记录",
      moveDesc: "按时间倒序展示最近单据动作。",
      moveHeaders: ["时间", "类型", "商品", "门店", "数量", "操作员"],
      transferTitle: "店铺调拨申请",
      transferDesc: "演示两店之间的库存调拨流程。",
      modalInboundTitle: "新增入库单",
      modalOutboundTitle: "新增出库单",
      modalDesc: "填写商品、门店和数量后，系统会同步刷新库存和记录。",
      modalType: "单据类型",
      modalStore: "门店",
      modalProduct: "商品",
      modalQty: "数量",
      modalRemark: "备注",
      modalHint: "提交后将立即更新库存、最新记录和单据列表。",
      modalCancel: "取消",
      modalSubmitInbound: "确认新增入库单",
      modalSubmitOutbound: "确认新增出库单",
      modalRemarkInbound: "示例：供应商补货到店",
      modalRemarkOutbound: "示例：门店销售出库",
      modalErrorInvalidQty: "请输入大于 0 的数量。",
      modalErrorNoStock: "当前库存不足，无法完成出库。",
      modalSuccessInbound: "入库单已新增，库存和记录已更新。",
      modalSuccessOutbound: "出库单已新增，库存和记录已更新。"
    },
    stores: {
      title: "店铺管理",
      desc: "展示两家店铺的基础信息、运营节奏和管理建议，方便客户理解系统能管什么。",
      compareTitle: "双店铺关键指标对比",
      compareDesc: "从销售额、坪效、连带率和库存周转天数四个维度做展示。",
      compareHeaders: ["店铺", "本月销售额", "坪效", "连带率", "库存周转天数"],
      adviceTitle: "本周营运建议",
      adviceDesc: "用于演示系统从数据出发给管理层的提醒内容。"
    },
    chart: { current: "本月", previous: "上月", lastYear: "去年同期", storeA: "店铺A", storeB: "店铺B" },
    units: { sales: "销量", revenue: "销售额", pieces: "件", items: "项", pcs: "件" },
    status: { completed: "已完成", pending: "待确认", processing: "处理中", approved: "已通过", low: "低库存", watch: "需关注", ok: "库存安全" },
    movementType: { inbound: "入库", outbound: "出库", transfer: "调拨" },
    docType: { purchaseIn: "采购入库", saleOut: "销售出库", transfer: "店铺调拨" },
    operators: { lily: "李主管", amy: "陈店助", yoyo: "悠悠", rose: "罗主管", demo: "演示用户" }
    ,
    login: {
      eyebrow: "客户演示登录入口",
      title: "女装店铺管理系统",
      titleNote: "双店铺销售、库存与调拨演示后台",
      point1Title: "默认中文，支持中英文切换",
      point2Title: "演示账号可直接登录",
      point3Title: "纯静态部署",
      showcaseLabel: "本次演示范围",
      showcaseItem1: "店铺A 销售分析",
      showcaseItem2: "店铺B 库存预警",
      showcaseItem3: "双店铺调拨流程",
      showcaseItem4: "管理后台双语言切换",
      formTitle: "账号登录",
      formDesc: "输入演示账号和密码进入系统。",
      username: "账号",
      password: "密码",
      usernamePlaceholder: "请输入账号",
      passwordPlaceholder: "请输入密码",
      submit: "登录进入系统",
      accountTitle: "演示账号",
      error: "账号或密码不正确，请使用下方演示账号登录。"
    }
  },
  en: {
    title: "LADY FASHION Store Manager Demo",
    topbarLabel: "Store Scope",
    admin: "Administrator",
    logout: "Sign Out",
    dateChip: "Apr 14, 2026",
    notify: "Notifications",
    sidebarLabel: "Demo Notes",
    sidebarTitle: "Pure Static Demo",
    sidebarDesc: "Open locally with a double click, then upload the same files to any web server for client presentations.",
    currentView: "Current View: ",
    currentScope: "Current: ",
    nav: { overview: "Overview", sales: "Sales", inventory: "Inventory", stores: "Store Admin" },
    storeSelect: {
      all: "All Stores",
      storeA: "Store A · Huaihai Road Flagship",
      storeB: "Store B · MixC Boutique Store"
    },
    overview: {
      title: "Sales Overview",
      desc: "Show sales, orders, members, and inventory rhythm across two womenswear stores so clients can understand the system quickly.",
      heroLabel: "Total Sales",
      heroNote: "Month to date",
      orders: "Orders",
      ticket: "Avg. Ticket",
      members: "New Members",
      trendTitle: "Sales Trend: Current vs Previous vs Last Year",
      trendDesc: "Useful for presenting MoM, YoY, and trend analysis capabilities.",
      compareTitle: "Store A vs Store B Sales Comparison",
      compareDesc: "Weekly comparison highlights differences in pace and revenue structure.",
      topTitle: "Top 5 Best-Selling Womenswear Items",
      topDesc: "Show ranking, SKU, units sold, and sales value in a client-friendly way.",
      insightTitle: "Business Summary",
      insightDesc: "Demonstrates how the system turns raw metrics into readable conclusions.",
      ordersTrendLabel: "MoM",
      ticketTrendLabel: "YoY",
      membersTrendLabel: "MoM"
    },
    sales: {
      title: "Detailed Sales Analysis",
      desc: "Review monthly sales, YoY, MoM, and hero-product performance by store scope.",
      actionBadge: "Sales Input",
      actionTitle: "Add Sales Entry",
      actionDesc: "Capture revenue, orders, and new members for the active store scope, then refresh YoY, MoM, and overview metrics immediately.",
      scopeLabel: "Entry Scope",
      actionButton: "Add Sales Entry",
      yoy: "YoY Growth",
      mom: "MoM Growth",
      tableTitle: "Monthly Sales Details",
      tableDesc: "Shows current sales, previous-month baseline, last-year baseline, and both growth indicators.",
      summaryTitle: "Hero Product Insights",
      summaryDesc: "Useful for presenting merchandise mix, top sellers, and in-store selling suggestions.",
      recentTitle: "Recent Sales Entries",
      recentDesc: "Newly added entries appear here right away for live demos.",
      recentEmptyTitle: "No manual entries yet",
      recentEmptyDesc: "Add a store sales entry above and it will appear here immediately.",
      monthLabel: "Entry Month",
      modalTitle: "Add Sales Entry",
      modalDesc: "Submitting will instantly refresh sales analysis, overview KPIs, and the recent-entry log for the selected store.",
      modalStore: "Store",
      modalAmount: "Sales Amount",
      modalOrders: "Orders",
      modalMembers: "New Members",
      modalNote: "Entry Note",
      modalHint: "Submitting will update current-month revenue, orders, new members, and the recent-entry list.",
      modalCancel: "Cancel",
      modalSubmit: "Save Entry",
      modalNoteDefault: "Example: noon livestream sales batch",
      modalErrorAmount: "Please enter a sales amount greater than 0.",
      modalErrorOrders: "Please enter an order count greater than 0.",
      modalErrorMembers: "New members cannot be negative.",
      recordSales: "Sales",
      recordOrders: "Orders",
      recordMembers: "New Members",
      headers: ["Month", "Current Sales", "Previous Month", "Last Year", "MoM", "YoY"]
    },
    inventory: {
      title: "Inbound / Outbound Control Center",
      desc: "Includes stock lookup, low-stock alerts, movement records, and store transfer requests, aligned with your reference image.",
      docsTitle: "Inbound / Outbound Documents",
      docsDesc: "Demonstrates document creation, recent operations, and stock flow.",
      addInbound: "New Inbound",
      addOutbound: "New Outbound",
      docHeaders: ["Document No.", "Type", "Date", "Store", "Status"],
      queryTitle: "Inventory Lookup",
      queryDesc: "Supports category filters and keyword search.",
      searchPlaceholder: "Search product or SKU",
      categories: { all: "All Categories", sleepwear: "Sleepwear", underwear: "Lingerie", "sleep-pants": "Lounge Pants", briefs: "Briefs" },
      inventoryHeaders: ["Image", "Product", "SKU", "Stock (Store A)", "Stock (Store B)", "Total Stock", "Safety Stock"],
      warningTitle: "Inventory Alerts",
      warningDesc: "Low-stock products and safety stock reminders.",
      moveTitle: "Latest Inventory Records",
      moveDesc: "Recent warehouse actions shown in reverse time order.",
      moveHeaders: ["Time", "Type", "Product", "Store", "Qty", "Operator"],
      transferTitle: "Store Transfer Requests",
      transferDesc: "Demonstrates stock transfer flow between the two stores.",
      modalInboundTitle: "Create Inbound Document",
      modalOutboundTitle: "Create Outbound Document",
      modalDesc: "Select the product, store, and quantity, then the demo will refresh inventory and recent records.",
      modalType: "Document Type",
      modalStore: "Store",
      modalProduct: "Product",
      modalQty: "Quantity",
      modalRemark: "Remark",
      modalHint: "Submitting will immediately update stock, recent movements, and the document list.",
      modalCancel: "Cancel",
      modalSubmitInbound: "Create Inbound",
      modalSubmitOutbound: "Create Outbound",
      modalRemarkInbound: "Example: supplier replenishment received",
      modalRemarkOutbound: "Example: store sales outbound",
      modalErrorInvalidQty: "Please enter a quantity greater than 0.",
      modalErrorNoStock: "Current stock is not enough for this outbound request.",
      modalSuccessInbound: "Inbound document created and inventory updated.",
      modalSuccessOutbound: "Outbound document created and inventory updated."
    },
    stores: {
      title: "Store Administration",
      desc: "Presents core store profiles, operating rhythm, and management advice to show what the system can actually manage.",
      compareTitle: "Dual-Store KPI Comparison",
      compareDesc: "Shows monthly sales, sales per sqm, attach rate, and inventory turnover days.",
      compareHeaders: ["Store", "Monthly Sales", "Sales / sqm", "Attach Rate", "Inventory Days"],
      adviceTitle: "Weekly Operations Advice",
      adviceDesc: "A simple example of management prompts generated from business data."
    },
    chart: { current: "Current", previous: "Previous", lastYear: "Last Year", storeA: "Store A", storeB: "Store B" },
    units: { sales: "Units", revenue: "Revenue", pieces: "pcs", items: "items", pcs: "pcs" },
    status: { completed: "Completed", pending: "Pending", processing: "Processing", approved: "Approved", low: "Low Stock", watch: "Watch", ok: "Safe" },
    movementType: { inbound: "Inbound", outbound: "Outbound", transfer: "Transfer" },
    docType: { purchaseIn: "Purchase Inbound", saleOut: "Sales Outbound", transfer: "Store Transfer" },
    operators: { lily: "Lily", amy: "Amy", yoyo: "Yoyo", rose: "Rose", demo: "Demo User" },
    login: {
      eyebrow: "Client Demo Access",
      title: "Womenswear Store Manager",
      titleNote: "A dual-store demo for sales, inventory, and stock transfers",
      point1Title: "Chinese by default, bilingual support included",
      point2Title: "Demo accounts can log in directly",
      point3Title: "Pure static deployment",
      showcaseLabel: "Demo Coverage",
      showcaseItem1: "Store A sales analysis",
      showcaseItem2: "Store B inventory alerts",
      showcaseItem3: "Dual-store transfer flow",
      showcaseItem4: "Chinese / English switching",
      formTitle: "Account Login",
      formDesc: "Enter a demo username and password to continue.",
      username: "Username",
      password: "Password",
      usernamePlaceholder: "Enter username",
      passwordPlaceholder: "Enter password",
      submit: "Sign In",
      accountTitle: "Demo Accounts",
      error: "Incorrect username or password. Please use one of the demo accounts below."
    }
  }
};

const stores = [
  {
    id: "storeA",
    code: { zh: "店铺A", en: "Store A" },
    name: { zh: "淮海路形象店", en: "Huaihai Road Flagship" },
    manager: { zh: "林店长", en: "Manager Lin" },
    area: 168,
    staff: 12,
    rent: 38000,
    monthly: [188000, 205000, 214000, 226000, 243000, 258000],
    lastYear: [165000, 176000, 184000, 195000, 205000, 218000],
    orders: [880, 960, 1012, 1060, 1052, 1180],
    newMembers: [72, 84, 88, 96, 118, 126],
    lastYearOrdersCurrent: 980,
    weeklySales: [156000, 189000, 176000, 214000],
    target: 272000,
    attachRate: "1.72",
    turnoverDays: 28,
    note: {
      zh: "晚间客流稳定，睡衣与内衣套装贡献度高，建议继续加强橱窗主推款。",
      en: "Evening traffic is stable and pajama plus lingerie sets contribute strongly, so the window display should keep focusing on hero looks."
    }
  },
  {
    id: "storeB",
    code: { zh: "店铺B", en: "Store B" },
    name: { zh: "万象城轻奢店", en: "MixC Boutique Store" },
    manager: { zh: "周店长", en: "Manager Zhou" },
    area: 146,
    staff: 9,
    rent: 32000,
    monthly: [172000, 184000, 195000, 202000, 208000, 198000],
    lastYear: [168000, 174000, 182000, 193000, 201000, 206000],
    orders: [790, 824, 860, 905, 952, 924],
    newMembers: [66, 72, 74, 82, 90, 88],
    lastYearOrdersCurrent: 910,
    weeklySales: [188000, 176000, 245000, 298000],
    target: 210000,
    attachRate: "1.58",
    turnoverDays: 31,
    note: {
      zh: "会员复购表现不错，但本月环比略有回落，建议用睡裤和内裤组合促销提升连带。",
      en: "Member repurchase is healthy, but MoM softened this month, so lounge-pants and briefs bundles can help lift attach rate."
    }
  }
];

const products = [
  { sku: "20000001", name: { zh: "云柔睡衣套装", en: "Cloud Soft Pajama Set" }, category: "sleepwear", art: "sleepwear", price: 329, stock: { storeA: 180, storeB: 100 }, safety: { storeA: 120, storeB: 110 }, sold: { storeA: 43, storeB: 32 }, revenue: { storeA: 14147, storeB: 10528 }, yoy: 15.5, mom: 6.8, colors: ["#f2c7cf", "#f6dce3"] },
  { sku: "20000002", name: { zh: "蕾丝内衣套装", en: "Lace Lingerie Set" }, category: "underwear", art: "underwear", price: 268, stock: { storeA: 96, storeB: 82 }, safety: { storeA: 110, storeB: 90 }, sold: { storeA: 36, storeB: 18 }, revenue: { storeA: 9648, storeB: 4824 }, yoy: 9.3, mom: -3.8, colors: ["#d4b7cf", "#e8d8f5"] },
  { sku: "20000003", name: { zh: "莫代尔睡裤", en: "Modal Lounge Pants" }, category: "sleep-pants", art: "pants", price: 169, stock: { storeA: 132, storeB: 168 }, safety: { storeA: 100, storeB: 120 }, sold: { storeA: 28, storeB: 42 }, revenue: { storeA: 4732, storeB: 7098 }, yoy: 11.2, mom: 5.6, colors: ["#c7d0e8", "#edf1fb"] },
  { sku: "20000004", name: { zh: "无痕内裤 3 条装", en: "Seamless Briefs 3-Pack" }, category: "briefs", art: "briefs", price: 99, stock: { storeA: 120, storeB: 96 }, safety: { storeA: 110, storeB: 100 }, sold: { storeA: 58, storeB: 64 }, revenue: { storeA: 5742, storeB: 6336 }, yoy: 18.7, mom: 8.2, colors: ["#f0c7b2", "#f6dfd4"] },
  { sku: "20000005", name: { zh: "真丝吊带睡裙", en: "Silk Slip Nightdress" }, category: "sleepwear", art: "slip", price: 398, stock: { storeA: 88, storeB: 62 }, safety: { storeA: 90, storeB: 80 }, sold: { storeA: 24, storeB: 16 }, revenue: { storeA: 9552, storeB: 6368 }, yoy: 7.5, mom: -1.4, colors: ["#d8c5b7", "#f1e2d7"] },
  { sku: "20000006", name: { zh: "保暖家居服套装", en: "Cozy Homewear Set" }, category: "sleepwear", art: "homewear", price: 359, stock: { storeA: 144, storeB: 118 }, safety: { storeA: 100, storeB: 90 }, sold: { storeA: 21, storeB: 19 }, revenue: { storeA: 7539, storeB: 6821 }, yoy: 12.8, mom: 4.1, colors: ["#c9d9cc", "#e5f0e8"] }
];

const documentRecords = [
  { id: "RK-2026-0414-01", type: "purchaseIn", date: "2026.04.14", store: "storeA", status: "completed" },
  { id: "CK-2026-0414-03", type: "saleOut", date: "2026.04.14", store: "storeB", status: "completed" },
  { id: "DB-2026-0413-02", type: "transfer", date: "2026.04.13", store: "storeA", status: "pending" },
  { id: "CK-2026-0413-06", type: "saleOut", date: "2026.04.13", store: "storeA", status: "processing" },
  { id: "RK-2026-0412-05", type: "purchaseIn", date: "2026.04.12", store: "storeB", status: "completed" }
];

const movementRecords = [
  { time: "2026-04-14 10:20", type: "inbound", product: "20000001", store: "storeA", qty: 36, operator: "lily" },
  { time: "2026-04-14 09:10", type: "outbound", product: "20000002", store: "storeB", qty: 18, operator: "amy" },
  { time: "2026-04-13 18:40", type: "transfer", product: "20000005", store: "storeA", qty: 12, operator: "rose" },
  { time: "2026-04-13 16:05", type: "inbound", product: "20000003", store: "storeB", qty: 28, operator: "yoyo" },
  { time: "2026-04-13 11:25", type: "outbound", product: "20000004", store: "storeA", qty: 42, operator: "lily" }
];

const salesEntries = [
  {
    time: "2026-04-14 11:40",
    store: "storeA",
    amount: 18600,
    orders: 42,
    members: 6,
    note: { zh: "午间直播订单补录", en: "Noon livestream order batch" }
  },
  {
    time: "2026-04-14 13:05",
    store: "storeB",
    amount: 12800,
    orders: 31,
    members: 4,
    note: { zh: "商场会员日快闪成交", en: "Mall member-day flash sales" }
  }
];

const transfers = [
  { from: "storeA", to: "storeB", product: "20000002", qty: 26, status: "pending" },
  { from: "storeB", to: "storeA", product: "20000005", qty: 12, status: "approved" },
  { from: "storeA", to: "storeB", product: "20000004", qty: 20, status: "processing" }
];

const demoAccounts = [
  {
    username: "lin.director",
    password: "Demo@2026",
    name: { zh: "林运营总监", en: "Lin Director" },
    role: { zh: "运营总监", en: "Operations Director" }
  },
  {
    username: "zhou.store",
    password: "Store#2026",
    name: { zh: "周店长", en: "Manager Zhou" },
    role: { zh: "店铺B 店长", en: "Store B Manager" }
  },
  {
    username: "admin.lf",
    password: "Admin#2026",
    name: { zh: "系统管理员", en: "System Admin" },
    role: { zh: "演示管理员", en: "Demo Administrator" }
  }
];

const authStorageKey = "lady-fashion-demo-account";

const pick = (zh, en) => (state.lang === "zh" ? zh : en);
const currentText = () => text[state.lang];

function formatMoney(value) {
  return `¥${Math.round(value).toLocaleString(state.lang === "zh" ? "zh-CN" : "en-US")}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString(state.lang === "zh" ? "zh-CN" : "en-US");
}

function formatPercent(value) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function calcGrowth(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function getStoreById(id) {
  return stores.find((store) => store.id === id);
}

function getProductBySku(sku) {
  return products.find((product) => product.sku === sku);
}

function getStoreIds() {
  return state.store === "all" ? stores.map((store) => store.id) : [state.store];
}

function sumSeries(seriesList) {
  return seriesList[0].map((_, index) => seriesList.reduce((sum, series) => sum + series[index], 0));
}

function getAggregatedSeries(key) {
  const series = getStoreIds().map((id) => getStoreById(id)[key]);
  return state.store === "all" ? sumSeries(series) : series[0];
}

function productTotal(product, field, storeIds = getStoreIds()) {
  return storeIds.reduce((sum, storeId) => sum + product[field][storeId], 0);
}

function getScopeLabel() {
  return currentText().storeSelect[state.store];
}

function getScopeShortLabel() {
  if (state.store === "all") return pick("所有店铺", "All Stores");
  const store = getStoreById(state.store);
  return `${store.code[state.lang]} · ${store.name[state.lang]}`;
}

function getSummaryMetrics() {
  const ids = getStoreIds();
  const currentSales = ids.reduce((sum, id) => sum + getStoreById(id).monthly.at(-1), 0);
  const previousSales = ids.reduce((sum, id) => sum + getStoreById(id).monthly.at(-2), 0);
  const lastYearSales = ids.reduce((sum, id) => sum + getStoreById(id).lastYear.at(-1), 0);
  const currentOrders = ids.reduce((sum, id) => sum + getStoreById(id).orders.at(-1), 0);
  const previousOrders = ids.reduce((sum, id) => sum + getStoreById(id).orders.at(-2), 0);
  const lastYearOrders = ids.reduce((sum, id) => sum + getStoreById(id).lastYearOrdersCurrent, 0);
  const currentMembers = ids.reduce((sum, id) => sum + getStoreById(id).newMembers.at(-1), 0);
  const previousMembers = ids.reduce((sum, id) => sum + getStoreById(id).newMembers.at(-2), 0);

  return {
    currentSales,
    salesYoY: calcGrowth(currentSales, lastYearSales),
    salesMoM: calcGrowth(currentSales, previousSales),
    currentOrders,
    ordersMoM: calcGrowth(currentOrders, previousOrders),
    avgTicket: currentSales / currentOrders,
    avgTicketYoY: calcGrowth(currentSales / currentOrders, lastYearSales / lastYearOrders),
    currentMembers,
    membersMoM: calcGrowth(currentMembers, previousMembers)
  };
}

function addToLatest(array, delta) {
  array[array.length - 1] += delta;
}

function getEntryNote(entry) {
  return typeof entry.note === "string" ? entry.note : entry.note[state.lang];
}

function getSalesScopeValue() {
  return state.store === "all" ? pick("所有店铺（录入时可选择）", "All stores (select in form)") : getScopeShortLabel();
}

function categoryLabel(category) {
  return currentText().inventory.categories[category];
}

function translateChrome() {
  const L = currentText();

  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = L.title;
  document.querySelector(".topbar-label").textContent = L.topbarLabel;
  document.querySelector(".nav-menu").setAttribute("aria-label", pick("主导航", "Main navigation"));
  document.querySelector(".lang-switch").setAttribute("aria-label", pick("语言切换", "Language switch"));
  document.getElementById("adminChip").textContent = L.admin;
  document.getElementById("dateChip").textContent = L.dateChip;
  document.getElementById("logoutButton").textContent = L.logout;
  document.querySelector(".icon-button").setAttribute("aria-label", L.notify);

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.querySelector("span:last-child").textContent = L.nav[button.dataset.page];
  });

  document.querySelectorAll(".lang-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
  });

  const storeSelect = document.getElementById("storeSelect");
  storeSelect.innerHTML = `
    <option value="all">${L.storeSelect.all}</option>
    <option value="storeA">${L.storeSelect.storeA}</option>
    <option value="storeB">${L.storeSelect.storeB}</option>
  `;
  storeSelect.value = state.store;
  storeSelect.setAttribute("aria-label", L.topbarLabel);

  document.getElementById("currentScopeChip").textContent = `${L.currentView}${getScopeLabel()}`;
  document.getElementById("overviewScopeBadge").textContent = `${L.currentScope}${getScopeShortLabel()}`;
}

function translateOverviewStatic() {
  const L = currentText().overview;
  const panelTitles = document.querySelectorAll('[data-page-panel="overview"] .panel-header h2');
  const panelDescs = document.querySelectorAll('[data-page-panel="overview"] .panel-header p');

  document.querySelector('[data-page-panel="overview"] .section-heading h1').textContent = L.title;
  document.querySelector('[data-page-panel="overview"] .section-heading p').textContent = L.desc;
  document.querySelector(".hero-card-label").textContent = L.heroLabel;
  document.querySelector(".hero-note").textContent = L.heroNote;

  const miniTitles = document.querySelectorAll(".mini-kpi-title");
  miniTitles[0].textContent = L.orders;
  miniTitles[1].textContent = L.ticket;
  miniTitles[2].textContent = L.members;

  panelTitles[0].textContent = L.trendTitle;
  panelTitles[1].textContent = L.compareTitle;
  panelTitles[2].textContent = L.topTitle;
  panelTitles[3].textContent = L.insightTitle;
  panelDescs[0].textContent = L.trendDesc;
  panelDescs[1].textContent = L.compareDesc;
  panelDescs[2].textContent = L.topDesc;
  panelDescs[3].textContent = L.insightDesc;
}

function translateSalesStatic() {
  const L = currentText().sales;
  const titles = document.querySelectorAll('[data-page-panel="sales"] .panel-header h2');
  const descs = document.querySelectorAll('[data-page-panel="sales"] .panel-header p');

  document.getElementById("salesPageTitle").textContent = L.title;
  document.querySelector('[data-page-panel="sales"] .section-heading p').textContent = L.desc;
  document.getElementById("salesEntryBadge").textContent = L.actionBadge;
  document.getElementById("salesEntryPanelTitle").textContent = L.actionTitle;
  document.getElementById("salesEntryPanelDesc").textContent = L.actionDesc;
  document.getElementById("salesEntryScopeLabel").textContent = L.scopeLabel;
  document.getElementById("openSalesEntryButton").textContent = L.actionButton;
  document.querySelectorAll(".growth-title")[0].textContent = L.yoy;
  document.querySelectorAll(".growth-title")[1].textContent = L.mom;
  titles[0].textContent = L.tableTitle;
  titles[1].textContent = L.summaryTitle;
  descs[0].textContent = L.tableDesc;
  descs[1].textContent = L.summaryDesc;
  document.getElementById("salesEntryListTitle").textContent = L.recentTitle;
  document.getElementById("salesEntryListDesc").textContent = L.recentDesc;

  document.querySelectorAll('[data-page-panel="sales"] thead th').forEach((th, index) => {
    th.textContent = L.headers[index];
  });
}

function translateInventoryStatic() {
  const L = currentText().inventory;
  const titles = document.querySelectorAll('[data-page-panel="inventory"] .panel-header h2');
  const descs = document.querySelectorAll('[data-page-panel="inventory"] .panel-header p');

  document.querySelector('[data-page-panel="inventory"] .section-heading h1').textContent = L.title;
  document.querySelector('[data-page-panel="inventory"] .section-heading p').textContent = L.desc;

  titles[0].textContent = L.docsTitle;
  titles[1].textContent = L.queryTitle;
  titles[2].textContent = L.warningTitle;
  titles[3].textContent = L.moveTitle;
  titles[4].textContent = L.transferTitle;
  descs[0].textContent = L.docsDesc;
  descs[1].textContent = L.queryDesc;
  descs[2].textContent = L.warningDesc;
  descs[3].textContent = L.moveDesc;
  descs[4].textContent = L.transferDesc;

  const actionButtons = document.querySelectorAll(".action-buttons button");
  actionButtons[0].textContent = L.addInbound;
  actionButtons[1].textContent = L.addOutbound;

  const tables = document.querySelectorAll('[data-page-panel="inventory"] thead');
  tables[0].querySelectorAll("th").forEach((th, index) => { th.textContent = L.docHeaders[index]; });
  tables[1].querySelectorAll("th").forEach((th, index) => { th.textContent = L.inventoryHeaders[index]; });
  tables[2].querySelectorAll("th").forEach((th, index) => { th.textContent = L.moveHeaders[index]; });

  document.getElementById("inventorySearch").placeholder = L.searchPlaceholder;
  const categorySelect = document.getElementById("inventoryCategory");
  categorySelect.innerHTML = `
    <option value="all">${L.categories.all}</option>
    <option value="sleepwear">${L.categories.sleepwear}</option>
    <option value="underwear">${L.categories.underwear}</option>
    <option value="sleep-pants">${L.categories["sleep-pants"]}</option>
    <option value="briefs">${L.categories.briefs}</option>
  `;
  categorySelect.value = state.inventoryCategory;

  document.getElementById("openInboundButton").textContent = L.addInbound;
  document.getElementById("openOutboundButton").textContent = L.addOutbound;
}

function translateStoresStatic() {
  const L = currentText().stores;
  const titles = document.querySelectorAll('[data-page-panel="stores"] .panel-header h2');
  const descs = document.querySelectorAll('[data-page-panel="stores"] .panel-header p');

  document.querySelector('[data-page-panel="stores"] .section-heading h1').textContent = L.title;
  document.querySelector('[data-page-panel="stores"] .section-heading p').textContent = L.desc;
  titles[0].textContent = L.compareTitle;
  titles[1].textContent = L.adviceTitle;
  descs[0].textContent = L.compareDesc;
  descs[1].textContent = L.adviceDesc;

  document.querySelectorAll('[data-page-panel="stores"] thead th').forEach((th, index) => {
    th.textContent = L.compareHeaders[index];
  });
}

function translateLoginStatic() {
  const L = currentText().login;
  document.getElementById("loginEyebrow").textContent = L.eyebrow;
  document.getElementById("loginTitle").textContent = L.title;
  document.getElementById("loginTitleNote").textContent = L.titleNote;
  document.getElementById("loginPoint1Title").textContent = L.point1Title;
  document.getElementById("loginPoint2Title").textContent = L.point2Title;
  document.getElementById("loginPoint3Title").textContent = L.point3Title;
  document.getElementById("loginShowcaseLabel").textContent = L.showcaseLabel;
  document.getElementById("loginShowcaseItem1").textContent = L.showcaseItem1;
  document.getElementById("loginShowcaseItem2").textContent = L.showcaseItem2;
  document.getElementById("loginShowcaseItem3").textContent = L.showcaseItem3;
  document.getElementById("loginShowcaseItem4").textContent = L.showcaseItem4;
  document.getElementById("loginFormTitle").textContent = L.formTitle;
  document.getElementById("loginFormDesc").textContent = L.formDesc;
  document.getElementById("usernameLabel").textContent = L.username;
  document.getElementById("passwordLabel").textContent = L.password;
  document.getElementById("usernameInput").placeholder = L.usernamePlaceholder;
  document.getElementById("passwordInput").placeholder = L.passwordPlaceholder;
  document.getElementById("loginSubmit").textContent = L.submit;
  document.getElementById("demoAccountTitle").textContent = L.accountTitle;
}

function populateDemoAccounts() {
  document.getElementById("demoAccountList").innerHTML = demoAccounts.map((account) => `
    <div class="demo-account-item">
      <strong>${account.name[state.lang]} / ${account.username}</strong>
      <span>${pick("密码", "Password")}: ${account.password}</span>
      <span>${account.role[state.lang]}</span>
    </div>
  `).join("");
}

function setAuthVisibility(isLoggedIn) {
  document.getElementById("loginShell").hidden = isLoggedIn;
  document.getElementById("appShell").hidden = !isLoggedIn;
}

function clearLoginError() {
  const error = document.getElementById("loginError");
  error.hidden = true;
  error.textContent = "";
}

function showLoginError() {
  const error = document.getElementById("loginError");
  error.hidden = false;
  error.textContent = currentText().login.error;
}

function restoreSession() {
  const saved = window.localStorage.getItem(authStorageKey);
  return demoAccounts.some((account) => account.username === saved);
}

function getNowDate() {
  return "2026.04.14";
}

function getNowDateTime() {
  return "2026-04-14 14:30";
}

function getNextDocumentId(action) {
  const prefix = action === "inbound" ? "RK" : "CK";
  const count = documentRecords.filter((row) => row.id.startsWith(prefix)).length + 1;
  return `${prefix}-2026-0414-${String(count).padStart(2, "0")}`;
}

function getCurrentDocType() {
  return state.docAction === "inbound" ? "purchaseIn" : "saleOut";
}

function openDocumentModal(action) {
  state.docAction = action;
  const inventoryText = currentText().inventory;
  const modalTitle = document.getElementById("docModalTitle");
  const modalDesc = document.getElementById("docModalDesc");
  const docTypeDisplay = document.getElementById("docTypeDisplay");
  const storeSelect = document.getElementById("docStoreSelect");
  const productSelect = document.getElementById("docProductSelect");
  const remarkInput = document.getElementById("docRemarkInput");

  modalTitle.textContent = action === "inbound" ? inventoryText.modalInboundTitle : inventoryText.modalOutboundTitle;
  modalDesc.textContent = inventoryText.modalDesc;
  document.getElementById("docTypeLabel").textContent = inventoryText.modalType;
  document.getElementById("docStoreLabel").textContent = inventoryText.modalStore;
  document.getElementById("docProductLabel").textContent = inventoryText.modalProduct;
  document.getElementById("docQtyLabel").textContent = inventoryText.modalQty;
  document.getElementById("docRemarkLabel").textContent = inventoryText.modalRemark;
  document.getElementById("docModalHint").textContent = inventoryText.modalHint;
  document.getElementById("cancelDocModal").textContent = inventoryText.modalCancel;
  document.getElementById("submitDocModal").textContent = action === "inbound" ? inventoryText.modalSubmitInbound : inventoryText.modalSubmitOutbound;
  docTypeDisplay.value = currentText().docType[getCurrentDocType()];

  storeSelect.innerHTML = stores.map((store) => `<option value="${store.id}">${store.code[state.lang]} · ${store.name[state.lang]}</option>`).join("");
  productSelect.innerHTML = products.map((product) => `<option value="${product.sku}">${product.name[state.lang]} / SKU ${product.sku}</option>`).join("");

  if (state.store !== "all") {
    storeSelect.value = state.store;
  }

  remarkInput.value = action === "inbound" ? inventoryText.modalRemarkInbound : inventoryText.modalRemarkOutbound;
  document.getElementById("docQtyInput").value = 12;
  clearDocumentModalError();
  document.getElementById("docModal").hidden = false;
}

function closeDocumentModal() {
  document.getElementById("docModal").hidden = true;
  clearDocumentModalError();
}

function showDocumentModalError(message) {
  const error = document.getElementById("docModalError");
  error.hidden = false;
  error.textContent = message;
}

function clearDocumentModalError() {
  const error = document.getElementById("docModalError");
  error.hidden = true;
  error.textContent = "";
}

function openSalesEntryModal() {
  const L = currentText().sales;
  const storeSelect = document.getElementById("salesStoreSelect");

  document.getElementById("salesModalTitle").textContent = L.modalTitle;
  document.getElementById("salesModalDesc").textContent = L.modalDesc;
  document.getElementById("salesMonthLabel").textContent = L.monthLabel;
  document.getElementById("salesStoreLabel").textContent = L.modalStore;
  document.getElementById("salesAmountLabel").textContent = L.modalAmount;
  document.getElementById("salesOrdersLabel").textContent = L.modalOrders;
  document.getElementById("salesMembersLabel").textContent = L.modalMembers;
  document.getElementById("salesNoteLabel").textContent = L.modalNote;
  document.getElementById("salesModalHint").textContent = L.modalHint;
  document.getElementById("cancelSalesModal").textContent = L.modalCancel;
  document.getElementById("submitSalesModal").textContent = L.modalSubmit;
  document.getElementById("salesMonthDisplay").value = monthLabels[state.lang].at(-1);
  document.getElementById("salesNoteInput").value = L.modalNoteDefault;

  storeSelect.innerHTML = stores
    .map((store) => `<option value="${store.id}">${store.code[state.lang]} · ${store.name[state.lang]}</option>`)
    .join("");

  if (state.store === "all") {
    storeSelect.disabled = false;
    storeSelect.value = stores[0].id;
  } else {
    storeSelect.value = state.store;
    storeSelect.disabled = true;
  }

  document.getElementById("salesAmountInput").value = 6800;
  document.getElementById("salesOrdersInput").value = 28;
  document.getElementById("salesMembersInput").value = 3;
  clearSalesModalError();
  document.getElementById("salesModal").hidden = false;
}

function closeSalesEntryModal() {
  document.getElementById("salesModal").hidden = true;
  clearSalesModalError();
}

function showSalesModalError(message) {
  const error = document.getElementById("salesModalError");
  error.hidden = false;
  error.textContent = message;
}

function clearSalesModalError() {
  const error = document.getElementById("salesModalError");
  error.hidden = true;
  error.textContent = "";
}

function submitSalesEntryForm(event) {
  event.preventDefault();
  const L = currentText().sales;
  const storeId = document.getElementById("salesStoreSelect").value;
  const amount = Number(document.getElementById("salesAmountInput").value);
  const orders = Number(document.getElementById("salesOrdersInput").value);
  const members = Number(document.getElementById("salesMembersInput").value);
  const note = document.getElementById("salesNoteInput").value.trim() || L.modalNoteDefault;
  const store = getStoreById(storeId);

  if (!Number.isFinite(amount) || amount <= 0) {
    showSalesModalError(L.modalErrorAmount);
    return;
  }

  if (!Number.isFinite(orders) || orders <= 0) {
    showSalesModalError(L.modalErrorOrders);
    return;
  }

  if (!Number.isFinite(members) || members < 0) {
    showSalesModalError(L.modalErrorMembers);
    return;
  }

  clearSalesModalError();
  addToLatest(store.monthly, amount);
  addToLatest(store.orders, orders);
  addToLatest(store.newMembers, members);
  addToLatest(store.weeklySales, amount);

  salesEntries.unshift({
    time: getNowDateTime(),
    store: storeId,
    amount,
    orders,
    members,
    note
  });

  renderOverview();
  renderSales();
  renderStores();
  closeSalesEntryModal();
}

function submitDocumentForm(event) {
  event.preventDefault();
  const inventoryText = currentText().inventory;
  const storeId = document.getElementById("docStoreSelect").value;
  const sku = document.getElementById("docProductSelect").value;
  const quantity = Number(document.getElementById("docQtyInput").value);
  const remark = document.getElementById("docRemarkInput").value.trim();
  const product = getProductBySku(sku);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    showDocumentModalError(inventoryText.modalErrorInvalidQty);
    return;
  }

  if (state.docAction === "outbound" && product.stock[storeId] < quantity) {
    showDocumentModalError(inventoryText.modalErrorNoStock);
    return;
  }

  clearDocumentModalError();

  if (state.docAction === "inbound") {
    product.stock[storeId] += quantity;
  } else {
    product.stock[storeId] -= quantity;
  }

  documentRecords.unshift({
    id: getNextDocumentId(state.docAction),
    type: getCurrentDocType(),
    date: getNowDate(),
    store: storeId,
    status: "completed"
  });

  movementRecords.unshift({
    time: getNowDateTime(),
    type: state.docAction,
    product: sku,
    store: storeId,
    qty: quantity,
    operator: "demo",
    remark
  });

  renderInventory();
  closeDocumentModal();
  document.getElementById("docModalHint").textContent = state.docAction === "inbound" ? inventoryText.modalSuccessInbound : inventoryText.modalSuccessOutbound;
}

function renderLineChart(containerId, config) {
  const container = document.getElementById(containerId);
  const width = Math.max(container.clientWidth || 700, 320);
  const height = container.classList.contains("compact") ? 270 : 320;
  const padding = { top: 18, right: 14, bottom: 34, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const labels = config.labels;
  const allValues = config.series.flatMap((item) => item.values);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const scaleX = (index) => padding.left + (index / Math.max(labels.length - 1, 1)) * chartWidth;
  const scaleY = (value) => padding.top + chartHeight - ((value - min) / Math.max(max - min, 1)) * chartHeight;

  const grid = Array.from({ length: 5 }, (_, index) => {
    const value = min + ((max - min) / 4) * index;
    const y = scaleY(value);
    return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
      <text class="chart-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${Math.round(value / 1000)}k</text>`;
  }).join("");

  const seriesMarkup = config.series.map((item) => {
    const path = item.values.map((value, index) => `${index === 0 ? "M" : "L"} ${scaleX(index)} ${scaleY(value)}`).join(" ");
    const dots = item.values.map((value, index) => `<circle cx="${scaleX(index)}" cy="${scaleY(value)}" r="${item.fill ? 4 : 3.5}" fill="${item.color}"></circle>`).join("");
    const area = item.fill ? `<path class="chart-area" d="${path} L ${scaleX(item.values.length - 1)} ${padding.top + chartHeight} L ${scaleX(0)} ${padding.top + chartHeight} Z" fill="${item.color}"></path>` : "";
    return `${area}<path class="chart-line ${item.dashed ? "secondary" : ""}" d="${path}" stroke="${item.color}"></path>${dots}`;
  }).join("");

  const axisLabels = labels.map((label, index) => `<text class="chart-label" x="${scaleX(index)}" y="${height - 10}" text-anchor="middle">${label}</text>`).join("");

  container.innerHTML = `
    <div class="chart-legend">${config.series.map((item) => `<span><i class="legend-dot" style="background:${item.color}"></i>${item.label}</span>`).join("")}</div>
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${pick("销售趋势图", "Sales trend chart")}">
      ${grid}
      ${seriesMarkup}
      ${axisLabels}
    </svg>
  `;
}

function renderBarChart(containerId, config) {
  const container = document.getElementById(containerId);
  const width = Math.max(container.clientWidth || 640, 320);
  const height = 270;
  const padding = { top: 18, right: 14, bottom: 34, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const labels = config.labels;
  const allValues = config.series.flatMap((item) => item.values);
  const max = Math.max(...allValues);
  const groupWidth = chartWidth / labels.length;
  const barWidth = Math.min(28, groupWidth / (config.series.length + 1));

  const grid = Array.from({ length: 5 }, (_, index) => {
    const value = (max / 4) * index;
    const y = padding.top + chartHeight - (value / Math.max(max, 1)) * chartHeight;
    return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
      <text class="chart-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${Math.round(value / 1000)}k</text>`;
  }).join("");

  const bars = labels.map((label, groupIndex) => {
    const center = padding.left + groupIndex * groupWidth + groupWidth / 2;
    const rects = config.series.map((series, seriesIndex) => {
      const value = series.values[groupIndex];
      const barHeight = (value / Math.max(max, 1)) * chartHeight;
      const x = center - ((config.series.length * barWidth + (config.series.length - 1) * 8) / 2) + seriesIndex * (barWidth + 8);
      const y = padding.top + chartHeight - barHeight;
      return `<rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${series.color}"></rect>
        <text class="chart-label" x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle">${Math.round(value / 1000)}</text>`;
    }).join("");
    return `${rects}<text class="chart-label" x="${center}" y="${height - 10}" text-anchor="middle">${label}</text>`;
  }).join("");

  container.innerHTML = `
    <div class="chart-legend">${config.series.map((item) => `<span><i class="legend-dot" style="background:${item.color}"></i>${item.label}</span>`).join("")}</div>
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${pick("销售柱状图", "Sales bar chart")}">
      ${grid}
      ${bars}
    </svg>
  `;
}

function renderProductThumb(product) {
  const [primary, secondary] = product.colors;
  const silhouettes = {
    sleepwear: `<path d="M28 15c4 0 6 2 7 5l3 8 6 25H12l6-25 3-8c1-3 3-5 7-5z" fill="${primary}"></path><path d="M21 16c1.5 4 11.5 4 13 0" fill="none" stroke="${secondary}" stroke-width="2"></path>`,
    underwear: `<path d="M14 26l8-8h12l8 8-2 8H16z" fill="${primary}"></path><path d="M17 38h22l4 10H13z" fill="${secondary}"></path>`,
    pants: `<path d="M19 16h18l4 34H30l-3-18-3 18H15z" fill="${primary}"></path><path d="M21 16h14" fill="none" stroke="${secondary}" stroke-width="2"></path>`,
    briefs: `<path d="M14 28h28l-3 14H17z" fill="${primary}"></path><path d="M19 28l3 7M37 28l-3 7" stroke="${secondary}" stroke-width="2"></path>`,
    slip: `<path d="M22 16l6-4 6 4 6 34H16z" fill="${primary}"></path><path d="M24 15v8M32 15v8" stroke="${secondary}" stroke-width="2"></path>`,
    homewear: `<path d="M18 18h20l4 10-5 6-4-8H23l-4 8-5-6z" fill="${primary}"></path><path d="M20 34h16l3 18h-8l-3-12-3 12h-8z" fill="${secondary}"></path>`
  };

  return `
    <div class="thumb-box">
      <svg viewBox="0 0 56 68" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="56" height="68" rx="18" fill="url(#bg-${product.sku})"></rect>
        <defs>
          <linearGradient id="bg-${product.sku}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#fff7f5"></stop>
            <stop offset="100%" stop-color="#f2e4e0"></stop>
          </linearGradient>
        </defs>
        <circle cx="42" cy="14" r="10" fill="rgba(255,255,255,.55)"></circle>
        ${silhouettes[product.art]}
      </svg>
    </div>
  `;
}

function getWarningRows() {
  const ids = getStoreIds();
  const rows = [];

  products.forEach((product) => {
    ids.forEach((storeId) => {
      const stock = product.stock[storeId];
      const safety = product.safety[storeId];
      if (stock <= safety + 10) {
        rows.push({ product, storeId, stock, safety, gap: safety - stock });
      }
    });
  });

  return rows.sort((a, b) => a.gap - b.gap);
}

function renderOverview() {
  const L = currentText();
  const metrics = getSummaryMetrics();
  document.getElementById("heroSalesValue").textContent = formatMoney(metrics.currentSales);
  document.getElementById("heroYoyValue").textContent = `${pick("同比 ", "YoY ")}${formatPercent(metrics.salesYoY)}`;
  document.getElementById("ordersValue").textContent = formatNumber(metrics.currentOrders);
  document.getElementById("ordersTrend").textContent = `${L.overview.ordersTrendLabel} ${formatPercent(metrics.ordersMoM)}`;
  document.getElementById("ticketValue").textContent = formatMoney(metrics.avgTicket);
  document.getElementById("ticketTrend").textContent = `${L.overview.ticketTrendLabel} ${formatPercent(metrics.avgTicketYoY)}`;
  document.getElementById("memberValue").textContent = formatNumber(metrics.currentMembers);
  document.getElementById("memberTrend").textContent = `${L.overview.membersTrendLabel} ${formatPercent(metrics.membersMoM)}`;

  const currentSeries = getAggregatedSeries("monthly");
  renderLineChart("trendChart", {
    labels: monthLabels[state.lang],
    series: [
      { label: L.chart.current, values: currentSeries, color: "#6d83ca", fill: true },
      { label: L.chart.previous, values: currentSeries.map((value, index, source) => (index === 0 ? value * 0.92 : source[index - 1])), color: "#e0b1a9", dashed: true },
      { label: L.chart.lastYear, values: getAggregatedSeries("lastYear"), color: "#63ba95", dashed: true }
    ]
  });

  renderBarChart("compareChart", {
    labels: weekLabels[state.lang],
    series: [
      { label: L.chart.storeA, values: getStoreById("storeA").weeklySales, color: "#7289d1" },
      { label: L.chart.storeB, values: getStoreById("storeB").weeklySales, color: "#efbfb2" }
    ]
  });

  const scopeProducts = [...products]
    .map((product) => ({ product, sold: productTotal(product, "sold"), revenue: productTotal(product, "revenue") }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  document.getElementById("topProductsList").innerHTML = scopeProducts.map((entry, index) => `
    <div class="rank-item">
      <div class="rank-index">${index + 1}</div>
      ${renderProductThumb(entry.product)}
      <div class="rank-meta">
        <strong>${entry.product.name[state.lang]}</strong>
        <span>SKU: ${entry.product.sku}</span>
        <span>${pick("销量", "Units")}: ${formatNumber(entry.sold)} ${currentText().units.pcs}</span>
      </div>
      <div class="rank-side">
        <strong>${formatMoney(entry.revenue)}</strong>
        <span>${pick("同比", "YoY")} ${formatPercent(entry.product.yoy)}</span>
      </div>
    </div>
  `).join("");

  const topStore = [...stores].sort((a, b) => b.monthly.at(-1) - a.monthly.at(-1))[0];
  const warnings = getWarningRows();
  const favorite = [...products].sort((a, b) => productTotal(b, "sold") - productTotal(a, "sold"))[0];

  const insightRows = [
    {
      tag: pick("销售领先", "Sales Lead"),
      title: `${topStore.code[state.lang]} · ${topStore.name[state.lang]}`,
      body: pick(
        `${topStore.manager[state.lang]}管理的门店本月销售 ${formatMoney(topStore.monthly.at(-1))}，距离目标仅差 ${formatMoney(Math.max(topStore.target - topStore.monthly.at(-1), 0))}。`,
        `${topStore.manager[state.lang]} leads the strongest store this month with ${formatMoney(topStore.monthly.at(-1))}, leaving only ${formatMoney(Math.max(topStore.target - topStore.monthly.at(-1), 0))} to target.`
      )
    },
    {
      tag: pick("库存风险", "Inventory Risk"),
      title: pick(`当前有 ${warnings.length} 项需要关注的库存`, `${warnings.length} inventory alerts need attention`),
      body: pick(
        "蕾丝内衣套装与真丝吊带睡裙在单店库存上已接近安全值，适合演示系统的预警机制。",
        "Lace Lingerie Set and Silk Slip Nightdress are already close to safety stock in single stores, which is perfect for demonstrating alert logic."
      )
    },
    {
      tag: pick("热卖品类", "Hero Product"),
      title: favorite.name[state.lang],
      body: pick(
        `该单品本月累计售出 ${formatNumber(productTotal(favorite, "sold"))} 件，适合做主推款与会员复购推荐。`,
        `This item sold ${formatNumber(productTotal(favorite, "sold"))} units this month and works well as a hero product and repeat-purchase driver.`
      )
    }
  ];

  document.getElementById("overviewInsights").innerHTML = insightRows.map((item) => `
    <div class="insight-item">
      <span class="metric-tag">${item.tag}</span>
      <strong>${item.title}</strong>
      <span>${item.body}</span>
    </div>
  `).join("");
}

function renderSales() {
  const L = currentText().sales;
  const metrics = getSummaryMetrics();
  document.getElementById("salesYoyBanner").textContent = formatPercent(metrics.salesYoY);
  document.getElementById("salesMomBanner").textContent = formatPercent(metrics.salesMoM);
  document.getElementById("salesEntryScopeValue").textContent = getSalesScopeValue();

  const currentSeries = getAggregatedSeries("monthly");
  const lastYearSeries = getAggregatedSeries("lastYear");
  const rows = currentSeries.slice(1).map((value, index) => ({
    month: monthLabels[state.lang][index + 1],
    value,
    previous: currentSeries[index],
    lastYear: lastYearSeries[index + 1],
    mom: calcGrowth(value, currentSeries[index]),
    yoy: calcGrowth(value, lastYearSeries[index + 1])
  }));

  document.getElementById("salesDetailTable").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.month}</td>
      <td class="value-strong">${formatMoney(row.value)}</td>
      <td>${formatMoney(row.previous)}</td>
      <td>${formatMoney(row.lastYear)}</td>
      <td class="${row.mom >= 0 ? "positive" : "negative"}">${formatPercent(row.mom)}</td>
      <td class="${row.yoy >= 0 ? "positive" : "negative"}">${formatPercent(row.yoy)}</td>
    </tr>
  `).join("");

  const summaries = [...products]
    .map((product) => ({ product, sold: productTotal(product, "sold"), revenue: productTotal(product, "revenue") }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  document.getElementById("salesProductSummary").innerHTML = summaries.map((entry) => `
    <div class="summary-item">
      ${renderProductThumb(entry.product)}
      <div>
        <span class="metric-tag">${categoryLabel(entry.product.category)}</span>
        <strong>${entry.product.name[state.lang]}</strong>
        <span>SKU: ${entry.product.sku}</span>
        <span>${pick("销量", "Units")}: ${formatNumber(entry.sold)} ${currentText().units.pcs} / ${pick("销售额", "Revenue")}: ${formatMoney(entry.revenue)}</span>
        <span>${pick("同比", "YoY")} ${formatPercent(entry.product.yoy)} · ${pick("环比", "MoM")} ${formatPercent(entry.product.mom)}</span>
      </div>
    </div>
  `).join("");

  const scopedEntries = salesEntries.filter((entry) => state.store === "all" || entry.store === state.store);
  document.getElementById("salesEntryList").innerHTML = scopedEntries.length
    ? scopedEntries.slice(0, 4).map((entry) => `
      <div class="sales-entry-item">
        <div class="sales-entry-main">
          <span class="metric-tag">${getStoreById(entry.store).code[state.lang]}</span>
          <strong>${getEntryNote(entry)}</strong>
          <span>${entry.time}</span>
          <span>${L.recordOrders}: ${formatNumber(entry.orders)} · ${L.recordMembers}: ${formatNumber(entry.members)}</span>
        </div>
        <div class="sales-entry-side">
          <strong>${formatMoney(entry.amount)}</strong>
          <span>${L.recordSales}</span>
        </div>
      </div>
    `).join("")
    : `<div class="insight-item"><strong>${L.recentEmptyTitle}</strong><span>${L.recentEmptyDesc}</span></div>`;
}

function renderInventory() {
  document.getElementById("recordDocTable").innerHTML = documentRecords
    .filter((row) => state.store === "all" || row.store === state.store)
    .map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${currentText().docType[row.type]}</td>
        <td>${row.date}</td>
        <td>${getStoreById(row.store).code[state.lang]}</td>
        <td><span class="status-badge ${row.status === "completed" || row.status === "approved" ? "ok" : row.status === "pending" ? "watch" : "low"}">${currentText().status[row.status]}</span></td>
      </tr>
    `).join("");

  const filteredProducts = products.filter((product) => {
    const searchValue = state.inventorySearch.toLowerCase();
    const searchHit = !searchValue || product.name.zh.includes(state.inventorySearch) || product.name.en.toLowerCase().includes(searchValue) || product.sku.includes(searchValue);
    const categoryHit = state.inventoryCategory === "all" || product.category === state.inventoryCategory;
    return searchHit && categoryHit;
  });

  document.getElementById("inventoryTable").innerHTML = filteredProducts.map((product) => {
    const totalStock = product.stock.storeA + product.stock.storeB;
    const totalSafety = product.safety.storeA + product.safety.storeB;
    return `
      <tr>
        <td>${renderProductThumb(product)}</td>
        <td>
          <div class="inventory-row-title">
            <div>
              <div class="value-strong">${product.name[state.lang]}</div>
              <div class="muted">${categoryLabel(product.category)}</div>
            </div>
          </div>
        </td>
        <td>${product.sku}</td>
        <td class="${product.stock.storeA <= product.safety.storeA ? "negative" : ""}">${formatNumber(product.stock.storeA)}</td>
        <td class="${product.stock.storeB <= product.safety.storeB ? "negative" : ""}">${formatNumber(product.stock.storeB)}</td>
        <td class="value-strong">${formatNumber(totalStock)}</td>
        <td>${formatNumber(totalSafety)}</td>
      </tr>
    `;
  }).join("");

  const warningRows = getWarningRows();
  document.getElementById("warningList").innerHTML = warningRows.length ? warningRows.map((row) => `
    <div class="warning-item">
      <div class="warning-main">
        <strong>${getStoreById(row.storeId).code[state.lang]} · ${row.product.name[state.lang]}</strong>
        <span>SKU: ${row.product.sku}</span>
        <span>${pick("当前库存", "Current")}: ${formatNumber(row.stock)} / ${pick("安全库存", "Safety")}: ${formatNumber(row.safety)}</span>
      </div>
      <div class="warning-side">
        <strong class="${row.gap > 0 ? "negative" : ""}">${row.gap > 0 ? formatNumber(row.gap) : `+${formatNumber(Math.abs(row.gap))}`}</strong>
        <span class="status-badge ${row.gap > 0 ? "low" : "watch"}">${row.gap > 0 ? currentText().status.low : currentText().status.watch}</span>
      </div>
    </div>
  `).join("") : `<div class="insight-item"><strong>${pick("当前无预警项", "No active alerts")}</strong><span>${pick("所选门店范围内库存安全。", "Inventory is healthy within the selected scope.")}</span></div>`;

  document.getElementById("movementTable").innerHTML = movementRecords
    .filter((record) => state.store === "all" || record.store === state.store)
    .map((record) => `
      <tr>
        <td>${record.time}</td>
        <td class="${record.type === "outbound" ? "negative" : "positive"}">${currentText().movementType[record.type]}</td>
        <td>${getProductBySku(record.product).name[state.lang]}</td>
        <td>${getStoreById(record.store).code[state.lang]}</td>
        <td>${formatNumber(record.qty)}</td>
        <td>${currentText().operators[record.operator]}</td>
      </tr>
    `).join("");

  document.getElementById("transferList").innerHTML = transfers.map((item) => `
    <div class="transfer-item">
      <div>
        <div class="transfer-route"><b>${getStoreById(item.from).code[state.lang]}</b><span>→</span><b>${getStoreById(item.to).code[state.lang]}</b></div>
        <strong>${getProductBySku(item.product).name[state.lang]}</strong>
        <span>SKU: ${item.product} · ${pick("调拨数量", "Transfer Qty")}: ${formatNumber(item.qty)}</span>
      </div>
      <span class="status-badge ${item.status === "approved" ? "ok" : item.status === "pending" ? "watch" : "low"}">${currentText().status[item.status]}</span>
    </div>
  `).join("");
}

function renderStores() {
  document.getElementById("storeCards").innerHTML = stores.map((store) => {
    const monthlySales = store.monthly.at(-1);
    const salesPerSqm = Math.round(monthlySales / store.area);
    const targetGap = store.target - monthlySales;
    const badge = state.store === store.id ? pick("当前选中", "Selected") : pick("门店概览", "Store Profile");

    return `
      <article class="store-card">
        <div class="store-card-top">
          <div>
            <span class="metric-tag">${badge}</span>
            <strong>${store.code[state.lang]} · ${store.name[state.lang]}</strong>
            <span>${pick("店长", "Manager")}: ${store.manager[state.lang]} · ${pick("员工", "Staff")}: ${store.staff}</span>
          </div>
          <span class="status-badge ${monthlySales >= store.target ? "ok" : "watch"}">${monthlySales >= store.target ? pick("达成目标", "On Target") : pick("冲刺中", "Closing Gap")}</span>
        </div>
        <div class="store-card-gridline">
          <div class="store-metric"><span>${pick("面积", "Area")}</span><strong>${store.area} m²</strong></div>
          <div class="store-metric"><span>${pick("本月销售", "Monthly Sales")}</span><strong>${formatMoney(monthlySales)}</strong></div>
          <div class="store-metric"><span>${pick("坪效", "Sales / sqm")}</span><strong>${formatMoney(salesPerSqm)}</strong></div>
          <div class="store-metric"><span>${pick("目标差额", "Gap to Target")}</span><strong>${targetGap > 0 ? formatMoney(targetGap) : pick("已超额", "Exceeded")}</strong></div>
        </div>
        <div class="store-note">${store.note[state.lang]}</div>
      </article>
    `;
  }).join("");

  document.getElementById("storeCompareTable").innerHTML = stores.map((store) => {
    const monthlySales = store.monthly.at(-1);
    const salesPerSqm = Math.round(monthlySales / store.area);
    return `
      <tr>
        <td>${store.code[state.lang]} · ${store.name[state.lang]}</td>
        <td class="value-strong">${formatMoney(monthlySales)}</td>
        <td>${formatMoney(salesPerSqm)}</td>
        <td>${store.attachRate}</td>
        <td>${store.turnoverDays}${pick(" 天", " days")}</td>
      </tr>
    `;
  }).join("");

  const adviceRows = [
    {
      title: pick("睡衣与睡裤应在周末前完成橱窗联陈", "Sleepwear and lounge pants should share the window before the weekend"),
      body: pick("店铺B 周末客流更集中，建议用“家居套装 + 内裤加购”组合提升连带率。", "Store B sees stronger weekend traffic, so a homewear plus briefs bundle can improve attach rate.")
    },
    {
      title: pick("内衣类库存应优先做跨店调拨", "Lingerie stock should be rebalanced across stores first"),
      body: pick("店铺A 的蕾丝内衣套装低于安全值，可从店铺B 调拨并同步补采购单。", "Store A is below safety stock on the Lace Lingerie Set, so transfer from Store B and trigger replenishment in parallel.")
    },
    {
      title: pick("会员回访重点放在高单价睡裙客户", "Follow up first with high-value slip-dress customers"),
      body: pick("真丝吊带睡裙的复购潜力高，适合给客户展示会员精细化运营场景。", "Silk slip dresses carry strong repurchase potential, which is a good example of refined member operations.")
    }
  ];

  document.getElementById("storeAdviceList").innerHTML = adviceRows.map((item) => `
    <div class="insight-item">
      <strong>${item.title}</strong>
      <span>${item.body}</span>
    </div>
  `).join("");
}

function renderAll() {
  translateLoginStatic();
  translateChrome();
  translateOverviewStatic();
  translateSalesStatic();
  translateInventoryStatic();
  translateStoresStatic();
  populateDemoAccounts();
  renderOverview();
  renderSales();
  renderInventory();
  renderStores();
}

function activatePage(page) {
  state.page = page;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  document.querySelectorAll(".page").forEach((section) => {
    section.classList.toggle("active", section.dataset.pagePanel === page);
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => activatePage(button.dataset.page));
  });

  document.getElementById("openSalesEntryButton").addEventListener("click", openSalesEntryModal);
  document.getElementById("closeSalesModal").addEventListener("click", closeSalesEntryModal);
  document.getElementById("cancelSalesModal").addEventListener("click", closeSalesEntryModal);
  document.getElementById("salesModalBackdrop").addEventListener("click", closeSalesEntryModal);
  document.getElementById("salesForm").addEventListener("submit", submitSalesEntryForm);

  document.getElementById("openInboundButton").addEventListener("click", () => openDocumentModal("inbound"));
  document.getElementById("openOutboundButton").addEventListener("click", () => openDocumentModal("outbound"));
  document.getElementById("closeDocModal").addEventListener("click", closeDocumentModal);
  document.getElementById("cancelDocModal").addEventListener("click", closeDocumentModal);
  document.getElementById("docModalBackdrop").addEventListener("click", closeDocumentModal);
  document.getElementById("docForm").addEventListener("submit", submitDocumentForm);

  document.getElementById("storeSelect").addEventListener("change", (event) => {
    state.store = event.target.value;
    renderAll();
  });

  document.querySelectorAll(".lang-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang;
      renderAll();
    });
  });

  document.getElementById("inventorySearch").addEventListener("input", (event) => {
    state.inventorySearch = event.target.value.trim();
    renderInventory();
  });

  document.getElementById("inventoryCategory").addEventListener("change", (event) => {
    state.inventoryCategory = event.target.value;
    renderInventory();
  });

  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const matched = demoAccounts.find((account) => account.username === username && account.password === password);

    if (!matched) {
      showLoginError();
      return;
    }

    clearLoginError();
    window.localStorage.setItem(authStorageKey, matched.username);
    setAuthVisibility(true);
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    window.localStorage.removeItem(authStorageKey);
    document.getElementById("loginForm").reset();
    clearLoginError();
    setAuthVisibility(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!document.getElementById("docModal").hidden) {
        closeDocumentModal();
      }

      if (!document.getElementById("salesModal").hidden) {
        closeSalesEntryModal();
      }
    }
  });

  window.addEventListener("resize", renderOverview);
}

function init() {
  bindEvents();
  renderAll();
  activatePage(state.page);
  setAuthVisibility(restoreSession());
}

window.addEventListener("load", init);

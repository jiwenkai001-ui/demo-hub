(function setupI18n(global) {
  "use strict";

  const STORAGE_KEY = "hanfu_queue_lang";
  const dictionaries = {
    zh: {
      "lang.zh": "中",
      "lang.en": "EN",
      "common.backHome": "返回总入口",
      "service.general": "汉服到店服务",
      "status.waiting": "等待中",
      "status.called": "已叫号",
      "status.passed": "过号待重呼",
      "status.completed": "已完成",
      "error.readState": "无法获取队列状态",
      "error.request": "请求失败",
      "index.title": "云裳序 · 汉服排队叫号演示",
      "index.headline": "云裳序 · 汉服商户排队叫号系统",
      "index.intro": "单队列版汉服门店叫号演示。顾客手机扫码取号，店员手机扫码叫号，全程 H5 操作。",
      "index.localTitle": "本地可随时改",
      "index.localBody": "纯静态页面 + 轻量 Python 服务，改完刷新即可演示。",
      "index.deployTitle": "简单服务器部署",
      "index.deployBody": "支持 0.0.0.0 启动，局域网或公网地址均可访问。",
      "index.entryTitle": "演示入口",
      "index.customerTitle": "顾客端 H5",
      "index.customerDesc": "手机扫码后取号",
      "index.merchantTitle": "商户叫号端 H5",
      "index.merchantDesc": "手机扫码后叫号",
      "index.tipLabel": "推荐演示方式：",
      "index.tipBody": "两部手机分别打开顾客端与商户端，直接演示取号与叫号联动。",
      "index.scanTitle": "手机扫码模拟入口",
      "index.scanCustomer": "顾客端扫码",
      "index.scanMerchant": "商户端扫码",
      "index.scanHint": "请用手机相机或扫码工具扫描二维码进入 H5 页面。",
      "index.scanFallback": "当前二维码未加载，可直接复制下方地址到手机浏览器打开。",
      "index.scanCustomerLink": "顾客端地址",
      "index.scanMerchantLink": "商户端地址",
      "customer.title": "顾客取号端 H5 · 汉服排队叫号演示",
      "customer.header": "顾客取号端 H5",
      "customer.desc": "扫码进入后点击下方按钮取号；同一手机当天只保留一个有效号单。",
      "customer.takeNow": "立即取号 / 查看进度",
      "customer.hint": "提示：有效号单期间再次扫码会直接显示当前进度，不会重复取号。",
      "customer.myTicket": "我的号单",
      "customer.noTicketShort": "尚未取号",
      "customer.noTicketLong": "尚未取号，点击上方按钮即可生成号单。",
      "customer.overview": "当前队列概况",
      "customer.overviewWaiting": "等待人数",
      "customer.overviewPassed": "过号人数",
      "customer.ticketNumber": "当前号码：",
      "customer.ticketType": "服务类型：",
      "customer.ticketStatus": "状态：",
      "customer.ticketAhead": "前方人数：",
      "customer.ticketTime": "取号时间：",
      "customer.errorState": "状态读取失败：{message}",
      "customer.errorTake": "取号失败：{message}",
      "customer.reusedTicketNotice": "你今天已有有效号单，已直接为你展示当前进度。",
      "merchant.title": "商户叫号端 H5 · 汉服排队叫号演示",
      "merchant.header": "商户叫号端 H5",
      "merchant.desc": "手机端一键叫号，支持过号、重呼与完成。",
      "merchant.quickCall": "快速叫号",
      "merchant.callNext": "叫下一位",
      "merchant.control": "现场控制",
      "merchant.recallCurrent": "重呼当前号",
      "merchant.passCurrent": "过号（稍后）",
      "merchant.completeCurrent": "完成办理",
      "merchant.resetDemo": "重置演示数据",
      "merchant.controlHint": "建议开场前先点一次“重置演示数据”，保证队列干净。",
      "merchant.waitingList": "等待中队列",
      "merchant.passedList": "过号队列",
      "merchant.completedList": "已完成记录",
      "merchant.recallTicket": "重呼该号",
      "merchant.ticketTime": "取号时间：{time}",
      "merchant.ticketPassCount": "过号次数：{count}",
      "merchant.noCurrent": "当前没有正在叫号的顾客。",
      "merchant.currentNumberLabel": "当前叫号：",
      "merchant.currentType": "服务：{type}",
      "merchant.currentTime": "叫号时间：{time}",
      "merchant.noWaiting": "暂无等待中的号单",
      "merchant.noPassed": "暂无过号记录",
      "merchant.noCompleted": "暂无完成记录",
      "merchant.errorRead": "读取失败：{message}",
      "merchant.errorCall": "叫号失败：{message}",
      "merchant.errorRecall": "重呼失败：{message}",
      "merchant.errorPass": "过号失败：{message}",
      "merchant.errorComplete": "完成失败：{message}",
      "merchant.errorReset": "重置失败：{message}",
      "merchant.confirmReset": "将清空所有号单与叫号记录，是否继续？",
      "display.title": "门店大屏端 · 汉服排队叫号演示",
      "display.header": "云裳序 · 当前叫号",
      "display.noneCurrent": "暂无叫号",
      "display.noneHint": "请在商户端点击“叫下一位”",
      "display.callTime": "叫号时间 {time}",
      "display.waitingTag": "等待中",
      "display.noneWaiting": "暂无等待",
      "display.readFail": "读取失败",
      "display.waitingList": "等待队列"
    },
    en: {
      "lang.zh": "中",
      "lang.en": "EN",
      "common.backHome": "Back to Home",
      "service.general": "Hanfu In-Store Service",
      "status.waiting": "Waiting",
      "status.called": "Called",
      "status.passed": "Passed (Recall)",
      "status.completed": "Completed",
      "error.readState": "Failed to read queue state",
      "error.request": "Request failed",
      "index.title": "Yunshangxu · Hanfu Queue Demo",
      "index.headline": "Yunshangxu · Hanfu Merchant Queue System",
      "index.intro": "Single-queue Hanfu store demo. Customer takes ticket by mobile QR, staff calls numbers by mobile QR, all in H5.",
      "index.localTitle": "Easy Local Editing",
      "index.localBody": "Pure static pages + lightweight Python service. Edit and refresh instantly.",
      "index.deployTitle": "Simple Server Deployment",
      "index.deployBody": "Run on 0.0.0.0 and demo from LAN or public addresses.",
      "index.entryTitle": "Demo Entrances",
      "index.customerTitle": "Customer H5",
      "index.customerDesc": "Scan by phone and take a ticket",
      "index.merchantTitle": "Merchant H5",
      "index.merchantDesc": "Scan by phone and call next",
      "index.tipLabel": "Recommended flow:",
      "index.tipBody": "Open customer and merchant pages on two phones for ticket and call flow demo.",
      "index.scanTitle": "Mobile QR Entrances",
      "index.scanCustomer": "Customer QR",
      "index.scanMerchant": "Merchant QR",
      "index.scanHint": "Scan with phone camera or QR tool to enter H5 pages.",
      "index.scanFallback": "If QR is not loaded, copy the links below to mobile browser.",
      "index.scanCustomerLink": "Customer URL",
      "index.scanMerchantLink": "Merchant URL",
      "customer.title": "Customer H5 · Hanfu Queue Demo",
      "customer.header": "Customer H5",
      "customer.desc": "Tap below to take a ticket. One phone keeps only one active ticket per day.",
      "customer.takeNow": "Take Ticket / View Progress",
      "customer.hint": "Tip: While ticket is active, scanning again shows progress instead of creating a new ticket.",
      "customer.myTicket": "My Ticket",
      "customer.noTicketShort": "No ticket yet",
      "customer.noTicketLong": "No ticket yet. Tap the button above to create one.",
      "customer.overview": "Queue Overview",
      "customer.overviewWaiting": "Waiting Count",
      "customer.overviewPassed": "Passed Count",
      "customer.ticketNumber": "Ticket Number:",
      "customer.ticketType": "Service Type:",
      "customer.ticketStatus": "Status:",
      "customer.ticketAhead": "People Ahead:",
      "customer.ticketTime": "Created At:",
      "customer.errorState": "Failed to load queue state: {message}",
      "customer.errorTake": "Failed to take ticket: {message}",
      "customer.reusedTicketNotice": "You already have an active ticket today. Current progress is shown.",
      "merchant.title": "Merchant H5 · Hanfu Queue Demo",
      "merchant.header": "Merchant H5",
      "merchant.desc": "One-tap call, pass, recall and complete on mobile.",
      "merchant.quickCall": "Quick Call",
      "merchant.callNext": "Call Next",
      "merchant.control": "Queue Control",
      "merchant.recallCurrent": "Recall Current",
      "merchant.passCurrent": "Pass (Later)",
      "merchant.completeCurrent": "Mark Completed",
      "merchant.resetDemo": "Reset Demo Data",
      "merchant.controlHint": "Recommended: reset once before each live demo.",
      "merchant.waitingList": "Waiting Queue",
      "merchant.passedList": "Passed Queue",
      "merchant.completedList": "Completed Records",
      "merchant.recallTicket": "Recall Ticket",
      "merchant.ticketTime": "Created At: {time}",
      "merchant.ticketPassCount": "Pass Count: {count}",
      "merchant.noCurrent": "No ticket is currently being called.",
      "merchant.currentNumberLabel": "Current Call:",
      "merchant.currentType": "Service: {type}",
      "merchant.currentTime": "Called At: {time}",
      "merchant.noWaiting": "No waiting tickets",
      "merchant.noPassed": "No passed tickets",
      "merchant.noCompleted": "No completed records",
      "merchant.errorRead": "Load failed: {message}",
      "merchant.errorCall": "Call failed: {message}",
      "merchant.errorRecall": "Recall failed: {message}",
      "merchant.errorPass": "Pass failed: {message}",
      "merchant.errorComplete": "Complete failed: {message}",
      "merchant.errorReset": "Reset failed: {message}",
      "merchant.confirmReset": "This will clear all tickets and call records. Continue?",
      "display.title": "Store Display · Hanfu Queue Demo",
      "display.header": "Yunshangxu · Current Call",
      "display.noneCurrent": "No active call",
      "display.noneHint": "Click 'Call Next' in merchant page",
      "display.callTime": "Called at {time}",
      "display.waitingTag": "Waiting",
      "display.noneWaiting": "No waiting tickets",
      "display.readFail": "Load Failed",
      "display.waitingList": "Waiting Queue"
    }
  };

  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "zh";
  }

  function setLang(nextLang) {
    const lang = nextLang === "en" ? "en" : "zh";
    localStorage.setItem(STORAGE_KEY, lang);
    apply(lang);
  }

  function t(key, vars) {
    const lang = getLang();
    const text = dictionaries[lang]?.[key] ?? dictionaries.zh[key] ?? key;
    if (!vars) {
      return text;
    }
    return text.replace(/\{(\w+)\}/g, (match, token) => {
      return Object.prototype.hasOwnProperty.call(vars, token) ? String(vars[token]) : match;
    });
  }

  function apply(lang) {
    const nextLang = lang === "en" ? "en" : "zh";
    document.documentElement.lang = nextLang === "en" ? "en" : "zh-CN";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = t(key);
      }
    });
    document.querySelectorAll("[data-lang-btn]").forEach((button) => {
      const value = button.getAttribute("data-lang-btn");
      button.classList.toggle("active", value === nextLang);
      button.textContent = t(value === "en" ? "lang.en" : "lang.zh");
    });
    document.dispatchEvent(new CustomEvent("hanfu:langchange", { detail: { lang: nextLang } }));
  }

  function initSwitcher() {
    document.querySelectorAll("[data-lang-switcher]").forEach((root) => {
      root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-lang-btn]");
        if (!button) {
          return;
        }
        setLang(button.getAttribute("data-lang-btn") || "zh");
      });
    });
  }

  function init() {
    initSwitcher();
    apply(getLang());
  }

  global.HanfuI18n = { t, getLang, setLang, apply };

  document.addEventListener("DOMContentLoaded", init);
})(window);

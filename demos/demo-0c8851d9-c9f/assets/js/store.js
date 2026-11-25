/* ============================================================
 * 装修公司管理系统 - 共享数据层（纯前端 localStorage）
 * PC 管理端 / 业主小程序端 共用
 * ============================================================ */
(function (global) {
  'use strict';
  var PREFIX = 'decoMgmt_';

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw === null || raw === undefined ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { console.warn('[Store] write failed', key, e); }
    return value;
  }
  function nextId(prefix) {
    var key = 'seq_' + prefix, n = read(key, 1000) + 1;
    write(key, n);
    return prefix + String(n);
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  var today = new Date();
  function d(offset) {
    var t = new Date(today); t.setDate(t.getDate() + offset);
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }

  var PHASES = ['拆改工程', '水电工程', '泥木工程', '油漆工程', '安装工程', '竣工验收'];
  var PHASE_WEIGHT = [15, 25, 25, 15, 15, 5];

  var seedStaff = [
    { id: 'S01', name: '林嘉怡', role: '设计师', phone: '138****2201', specialty: '现代简约 / 全案设计', years: 8, color: '#c2410c' },
    { id: 'S02', name: '周子涵', role: '设计师', phone: '139****5518', specialty: '新中式 / 别墅设计', years: 11, color: '#7c3aed' },
    { id: 'S03', name: '王海涛', role: '项目经理', phone: '135****8862', specialty: '工地统筹 / 质量控制', years: 12, color: '#0f766e' },
    { id: 'S04', name: '赵国强', role: '项目经理', phone: '137****3319', specialty: '工期管理 / 现场协调', years: 9, color: '#1d4ed8' },
    { id: 'S05', name: '陈立军', role: '施工工长', phone: '186****7720', specialty: '水电泥木 / 工艺交底', years: 15, color: '#b45309' },
    { id: 'S06', name: '孙晓梅', role: '监理', phone: '158****4403', specialty: '节点验收 / 材料核验', years: 10, color: '#be185d' }
  ];

  var seedCustomers = [
    { id: 'C001', name: '张先生', phone: '138****2046', community: '曲江华著中城', address: '西安市雁塔区曲江新区', area: 128, budget: 260000, level: 'A类意向', source: '老客户推荐', date: d(-95), note: '改善型住房，注重环保材料' },
    { id: 'C002', name: '李女士', phone: '139****7788', community: '高新万达广场', address: '西安市高新区科技路', area: 89, budget: 150000, level: 'A类意向', source: '线上咨询', date: d(-72), note: '新婚房，偏好奶油风格' },
    { id: 'C003', name: '王先生', phone: '186****3390', community: '保利心语花园', address: '西安市未央区凤城九路', area: 143, budget: 320000, level: 'B类意向', source: '小区推广', date: d(-60), note: '三代同堂，需儿童房与老人房' },
    { id: 'C004', name: '刘女士', phone: '135****1209', community: '万科城', address: '西安市长安区韦曲街道', area: 110, budget: 190000, level: 'B类意向', source: '线上咨询', date: d(-45), note: '关注收纳设计' },
    { id: 'C005', name: '陈先生', phone: '187****6612', community: '融创府阅大都会', address: '西安市莲湖区北大街', area: 168, budget: 450000, level: 'A类意向', source: '老客户推荐', date: d(-30), note: '大平层，全案设计需求' },
    { id: 'C006', name: '周女士', phone: '158****9021', community: '碧桂园天玺', address: '西安市灞桥区纺渭路', area: 76, budget: 120000, level: 'C类跟进', source: '门店到访', date: d(-12), note: '小户型，预算敏感' }
  ];

  var seedProjects = [
    { id: 'J001', customerId: 'C001', name: '曲江华著中城 · 张先生雅居', address: '西安市雁塔区曲江新区', area: 128, style: '现代简约', budget: 260000, status: '施工中', phase: '水电工程', progress: 40, designerId: 'S01', managerId: 'S03', startDate: d(-52), endDate: d(28), note: '客厅无主灯设计，全屋新风系统' },
    { id: 'J002', customerId: 'C002', name: '高新万达 · 李女士新居', address: '西安市高新区科技路', area: 89, style: '奶油风', budget: 150000, status: '施工中', phase: '泥木工程', progress: 62, designerId: 'S01', managerId: 'S04', startDate: d(-40), endDate: d(18), note: '注重收纳与采光' },
    { id: 'J003', customerId: 'C003', name: '保利心语 · 王先生住宅', address: '西安市未央区凤城九路', area: 143, style: '新中式', budget: 320000, status: '设计中', phase: '方案设计', progress: 12, designerId: 'S02', managerId: 'S03', startDate: d(-18), endDate: d(95), note: '方案已出初稿，等待客户确认' },
    { id: 'J004', customerId: 'C004', name: '万科城 · 刘女士家', address: '西安市长安区韦曲街道', area: 110, style: '北欧风', budget: 190000, status: '已完工', phase: '竣工验收', progress: 100, designerId: 'S02', managerId: 'S04', startDate: d(-150), endDate: d(-12), note: '已交付，进入售后质保期' },
    { id: 'J005', customerId: 'C005', name: '融创府阅 · 陈先生大平层', address: '西安市莲湖区北大街', area: 168, style: '现代轻奢', budget: 450000, status: '待开工', phase: '待开工', progress: 0, designerId: 'S02', managerId: 'S03', startDate: d(10), endDate: d(130), note: '施工图深化中' },
    { id: 'J006', customerId: 'C006', name: '碧桂园天玺 · 周女士家', address: '西安市灞桥区纺渭路', area: 76, style: '现代简约', budget: 120000, status: '设计中', phase: '方案设计', progress: 8, designerId: 'S01', managerId: 'S04', startDate: d(-6), endDate: d(85), note: '小户型改造，需优化动线' }
  ];

  var seedProgress = [
    { id: 'G001', projectId: 'J001', date: d(-48), phase: '拆改工程', progress: 15, content: '拆改工程开工，墙体拆除与垃圾清运完成，现场已清理。', author: '王海涛', photo: '拆改现场' },
    { id: 'G002', projectId: 'J001', date: d(-35), phase: '水电工程', progress: 32, content: '水电定位完成，强弱电开槽布线进行中，厨房与卫生间防水已涂刷。', author: '陈立军', photo: '水电布线' },
    { id: 'G003', projectId: 'J001', date: d(-6), phase: '水电工程', progress: 40, content: '水路打压测试通过，电路穿线完成，等待监理节点验收。', author: '陈立军', photo: '水路验收' },
    { id: 'G004', projectId: 'J002', date: d(-36), phase: '拆改工程', progress: 15, content: '拆除旧装修，保护地漏与下水口，现场交底完成。', author: '赵国强', photo: '拆改现场' },
    { id: 'G005', projectId: 'J002', date: d(-22), phase: '水电工程', progress: 40, content: '水电改造完成并通过验收，开始厨房墙砖铺贴。', author: '陈立军', photo: '水电验收' },
    { id: 'G006', projectId: 'J002', date: d(-4), phase: '泥木工程', progress: 62, content: '客厅地砖铺贴完成 70%，木工吊顶龙骨已搭建。', author: '赵国强', photo: '瓷砖铺贴' },
    { id: 'G007', projectId: 'J004', date: d(-40), phase: '油漆工程', progress: 80, content: '墙面腻子打磨完成，开始乳胶漆涂刷。', author: '王海涛', photo: '墙面施工' },
    { id: 'G008', projectId: 'J004', date: d(-14), phase: '竣工验收', progress: 100, content: '全部工程验收通过，客户已签字确认，正式交付。', author: '孙晓梅', photo: '竣工实景' }
  ];

  var seedPlans = [
    { id: 'F001', projectId: 'J001', name: '平面布局方案', type: '平面方案', version: 'V2.0', date: d(-46), designerId: 'S01', status: '已确认', description: '优化客厅与餐厅动线，主卧增加衣帽间，厨房改为开放式。', feedback: '布局满意，同意按此方案施工。' },
    { id: 'F002', projectId: 'J001', name: '客厅效果图', type: '效果图', version: 'V1.2', date: d(-30), designerId: 'S01', status: '已确认', description: '无主灯设计，浅灰乳胶漆搭配原木色家具，电视墙采用岩板。', feedback: '效果很好，色彩搭配喜欢。' },
    { id: 'F003', projectId: 'J001', name: '水电施工图', type: '施工图', version: 'V1.0', date: d(-26), designerId: 'S01', status: '已确认', description: '含强弱电点位、开关插座定位、给排水走向。', feedback: '' },
    { id: 'F004', projectId: 'J003', name: '新中式平面方案', type: '平面方案', version: 'V1.1', date: d(-8), designerId: 'S02', status: '待确认', description: '保留四室布局，客厅与阳台打通，增设茶室区域。', feedback: '' },
    { id: 'F005', projectId: 'J003', name: '客厅新中式效果图', type: '效果图', version: 'V1.0', date: d(-5), designerId: 'S02', status: '待确认', description: '胡桃木家具搭配米白墙面，融入中式格栅元素。', feedback: '' },
    { id: 'F006', projectId: 'J002', name: '奶油风全屋效果图', type: '效果图', version: 'V2.1', date: d(-19), designerId: 'S01', status: '已确认', description: '奶油色系搭配弧形元素，突出温馨感与收纳功能。', feedback: '确认，希望柜体颜色再浅一点。' },
    { id: 'F007', projectId: 'J005', name: '轻奢风格概念方案', type: '概念方案', version: 'V1.0', date: d(-3), designerId: 'S02', status: '待确认', description: '大理石与金属元素结合，强调空间通透感。', feedback: '' },
    { id: 'F008', projectId: 'J004', name: '北欧风竣工实景', type: '效果图', version: '终稿', date: d(-20), designerId: 'S02', status: '已确认', description: '实景拍摄效果，原木与绿植搭配。', feedback: '非常满意。' }
  ];

  var seedMessages = [
    { id: 'M001', projectId: 'J001', from: '客户', fromName: '张先生', date: d(-6) + ' 10:24', content: '王经理，水电什么时候能验收？我想现场看一下。', read: true },
    { id: 'M002', projectId: 'J001', from: '项目经理', fromName: '王海涛', date: d(-6) + ' 10:31', content: '张先生您好，水路打压已通过，明天下午 3 点可以现场验收，我提前通知监理。', read: true },
    { id: 'M003', projectId: 'J001', from: '客户', fromName: '张先生', date: d(-5) + ' 09:12', content: '好的，另外客厅插座位置能不能往左移 20 公分？', read: true },
    { id: 'M004', projectId: 'J001', from: '设计师', fromName: '林嘉怡', date: d(-5) + ' 09:40', content: '收到，我明天到现场复核一下，如果不影响水电走线就可以调整。', read: true },
    { id: 'M005', projectId: 'J001', from: '客户', fromName: '张先生', date: d(-1) + ' 16:08', content: '今天看了现场，施工很规范，辛苦各位了！', read: false },
    { id: 'M006', projectId: 'J002', from: '客户', fromName: '李女士', date: d(-3) + ' 14:20', content: '请问瓷砖铺贴什么时候能完成？', read: true },
    { id: 'M007', projectId: 'J002', from: '项目经理', fromName: '赵国强', date: d(-3) + ' 14:35', content: '预计本周五完成客厅铺贴，下周开始木工吊顶。', read: true },
    { id: 'M008', projectId: 'J003', from: '设计师', fromName: '周子涵', date: d(-2) + ' 11:05', content: '王先生您好，新中式平面方案和效果图已经上传，请您查看并反馈。', read: false },
    { id: 'M009', projectId: 'J004', from: '客户', fromName: '刘女士', date: d(-12) + ' 18:30', content: '乔迁大吉！感谢团队的服务，后面有朋友装修一定推荐。', read: true },
    { id: 'M010', projectId: 'J005', from: '客户', fromName: '陈先生', date: d(-1) + ' 20:15', content: '轻奢方案什么时候能看？期待中。', read: false }
  ];

  var seedQuotes = [
    { id: 'Q001', projectId: 'J001', date: d(-50), status: '已确认', items: [{ name: '设计费', price: 18000, qty: 1 }, { name: '水电改造', price: 32000, qty: 1 }, { name: '泥木工程', price: 68000, qty: 1 }, { name: '油漆工程', price: 36000, qty: 1 }, { name: '主材代购', price: 86000, qty: 1 }], note: '含基础施工与主材，不含家电家具' },
    { id: 'Q002', projectId: 'J002', date: d(-38), status: '已确认', items: [{ name: '设计费', price: 12000, qty: 1 }, { name: '水电改造', price: 22000, qty: 1 }, { name: '泥木工程', price: 45000, qty: 1 }, { name: '油漆工程', price: 26000, qty: 1 }, { name: '主材代购', price: 45000, qty: 1 }], note: '' },
    { id: 'Q003', projectId: 'J003', date: d(-7), status: '待确认', items: [{ name: '设计费', price: 28000, qty: 1 }, { name: '基础施工', price: 168000, qty: 1 }, { name: '主材代购', price: 124000, qty: 1 }], note: '方案确认后签订正式合同' },
    { id: 'Q004', projectId: 'J004', date: d(-148), status: '已确认', items: [{ name: '设计费', price: 15000, qty: 1 }, { name: '全包施工', price: 175000, qty: 1 }], note: '' }
  ];

  var seedPayments = [
    { id: 'K001', projectId: 'J001', date: d(-50), name: '首期款（合同 30%）', amount: 78000, status: '已支付', method: '银行转账' },
    { id: 'K002', projectId: 'J001', date: d(-35), name: '水电节点款（30%）', amount: 78000, status: '已支付', method: '微信' },
    { id: 'K003', projectId: 'J001', date: d(5), name: '泥木节点款（30%）', amount: 78000, status: '待支付', method: '' },
    { id: 'K004', projectId: 'J002', date: d(-38), name: '首期款（40%）', amount: 60000, status: '已支付', method: '支付宝' },
    { id: 'K005', projectId: 'J002', date: d(-20), name: '中期款（40%）', amount: 60000, status: '已支付', method: '微信' },
    { id: 'K006', projectId: 'J003', date: d(-7), name: '设计定金', amount: 10000, status: '已支付', method: '微信' },
    { id: 'K007', projectId: 'J004', date: d(-148), name: '全款', amount: 190000, status: '已支付', method: '银行转账' },
    { id: 'K008', projectId: 'J005', date: d(3), name: '设计费首期', amount: 15000, status: '待支付', method: '' }
  ];

  var seedMaterials = [
    { id: 'W001', projectId: 'J001', name: '弱电线材', brand: '秋叶原', spec: '六类非屏蔽', qty: 5, unit: '箱', price: 680, supplier: '华强建材', status: '已到场' },
    { id: 'W002', projectId: 'J001', name: '防水涂料', brand: '东方雨虹', spec: '柔性防水', qty: 4, unit: '桶', price: 420, supplier: '华强建材', status: '已到场' },
    { id: 'W003', projectId: 'J001', name: '岩板电视墙', brand: '蒙娜丽莎', spec: '1200×2400', qty: 1, unit: '套', price: 12800, supplier: '陶瓷城', status: '待采购' },
    { id: 'W004', projectId: 'J002', name: '客厅地砖', brand: '马可波罗', spec: '800×800 奶油白', qty: 62, unit: '片', price: 168, supplier: '陶瓷城', status: '已到场' },
    { id: 'W005', projectId: 'J002', name: '轻钢龙骨', brand: '可耐福', spec: '国标 0.6mm', qty: 40, unit: '根', price: 58, supplier: '华强建材', status: '已到场' },
    { id: 'W006', projectId: 'J003', name: '胡桃木饰面板', brand: '兔宝宝', spec: 'E0 级', qty: 30, unit: '张', price: 280, supplier: '林木家具', status: '待采购' },
    { id: 'W007', projectId: 'J005', name: '大理石板材', brand: '天然石材', spec: '爵士白', qty: 20, unit: '㎡', price: 680, supplier: '石材市场', status: '待采购' }
  ];

  var seedNotices = [
    { id: 'N001', title: '关于装修施工雨季注意事项的提醒', date: d(-3), content: '近期进入雨季，请注意施工现场防潮、材料保管与电路安全，监理将加强节点巡查。' },
    { id: 'N002', title: '“金秋装修季”老客户推荐活动', date: d(-10), content: '老客户推荐新客户签约，双方均可获得价值 3000 元的主材升级礼包。' },
    { id: 'N003', title: '材料展厅开放日通知', date: d(-18), content: '每周六下午 14:00 材料展厅开放，欢迎携带方案到店选材。' }
  ];

  var seedSettings = {
    companyName: '臻品装饰',
    phone: '029-8888 6699',
    address: '西安市高新区丈八北路 88 号',
    hours: '09:00 - 18:00（周一至周日）',
    notice: '匠心筑家 · 让每一处细节都值得信赖',
    version: '1.0.0'
  };

  var SEEDS = {
    staff: seedStaff, customers: seedCustomers, projects: seedProjects, progress: seedProgress,
    plans: seedPlans, messages: seedMessages, quotes: seedQuotes, payments: seedPayments,
    materials: seedMaterials, notices: seedNotices, settings: seedSettings
  };

  function seed(force) {
    Object.keys(SEEDS).forEach(function (k) {
      if (force || read(k, null) === null) write(k, JSON.parse(JSON.stringify(SEEDS[k])));
    });
  }

  var Store = {
    ready: function () { seed(false); return this; },
    reset: function () { seed(true); return this; },
    get: function (key) { return read(key, Array.isArray(SEEDS[key]) ? [] : (SEEDS[key] || null)); },
    set: function (key, value) { return write(key, value); },
    add: function (key, item) {
      var list = read(key, []);
      if (!item.id) item.id = nextId(key.charAt(0).toUpperCase());
      list.unshift(item); write(key, list); return item;
    },
    update: function (key, id, patch) {
      var list = read(key, []);
      for (var i = 0; i < list.length; i++) if (list[i].id === id) { Object.assign(list[i], patch); break; }
      write(key, list); return list;
    },
    remove: function (key, id) {
      var list = read(key, []).filter(function (x) { return x.id !== id; });
      write(key, list); return list;
    },
    find: function (key, id) {
      var list = read(key, []);
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    },
    listBy: function (key, field, value) {
      return read(key, []).filter(function (x) { return x[field] === value; });
    },
    nextId: nextId,
    today: function () { return d(0); },
    dateOffset: d,
    phases: PHASES,
    phaseWeight: PHASE_WEIGHT,
    money: function (n) { return '¥' + Number(n || 0).toLocaleString('zh-CN'); },
    escape: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }
  };

  global.Store = Store;
  Store.ready();
})(window);

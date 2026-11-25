/* ============================================================
 * 视力门诊管理系统 - 共享数据层（纯前端 localStorage）
 * 两端（PC 管理端 / 小程序客户端）共用同一套数据与接口
 * ============================================================ */
(function (global) {
  'use strict';

  var PREFIX = 'visionClinic_';

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('[Store] 写入失败', key, e);
    }
    return value;
  }

  function nextId(prefix) {
    var key = 'seq_' + prefix;
    var n = read(key, 1000) + 1;
    write(key, n);
    return prefix + String(n);
  }

  /* ---------------- 演示数据 ---------------- */
  var today = new Date();
  function d(offset) {
    var t = new Date(today);
    t.setDate(t.getDate() + offset);
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var seedDoctors = [
    { id: 'D001', name: '陈明远', title: '主任医师', dept: '眼科门诊', years: 18, fee: 80, specialty: '近视防控 / 青少年验光', tags: ['近视防控', '角膜塑形镜'], color: '#0e7490', women: false },
    { id: 'D002', name: '林晓雯', title: '副主任医师', dept: '验光中心', years: 12, fee: 60, specialty: '医学验光 / 屈光不正', tags: ['医学验光', '散光矫正'], color: '#7c3aed', women: true },
    { id: 'D003', name: '王建国', title: '主治医师', dept: '眼科门诊', years: 9, fee: 50, specialty: '眼表疾病 / 干眼症', tags: ['干眼诊疗', '白内障筛查'], color: '#059669', women: false },
    { id: 'D004', name: '赵雨薇', title: '主治医师', dept: '儿童眼科', years: 8, fee: 60, specialty: '儿童视力筛查 / 弱视训练', tags: ['儿童眼科', '弱视训练'], color: '#db2777', women: true }
  ];

  var seedPatients = [
    { id: 'P001', name: '张一诺', gender: '女', age: 9, phone: '138****2046', idcard: '6101**********1221', address: '西安市雁塔区科技路', registerDate: d(-120), tag: '学生' },
    { id: 'P002', name: '李思远', gender: '男', age: 32, phone: '139****7788', idcard: '6101**********0315', address: '西安市高新区丈八北路', registerDate: d(-96), tag: '上班族' },
    { id: 'P003', name: '王梓涵', gender: '女', age: 14, phone: '186****3390', idcard: '6101**********0642', address: '西安市碑林区长安路', registerDate: d(-75), tag: '学生' },
    { id: 'P004', name: '刘建华', gender: '男', age: 58, phone: '135****1209', idcard: '6101**********2517', address: '西安市未央区凤城九路', registerDate: d(-63), tag: '中老年' },
    { id: 'P005', name: '陈欣怡', gender: '女', age: 26, phone: '187****6612', idcard: '6101**********0834', address: '西安市莲湖区北大街', registerDate: d(-40), tag: '上班族' },
    { id: 'P006', name: '周子墨', gender: '男', age: 7, phone: '158****9021', idcard: '6101**********1418', address: '西安市长安区韦曲街道', registerDate: d(-22), tag: '学生' }
  ];

  var seedAppointments = [
    { id: 'A1001', patientId: 'P001', doctorId: 'D001', date: d(0), time: '09:00', type: '近视复查', status: '待就诊', note: '角膜塑形镜复查', createdAt: d(-3) },
    { id: 'A1002', patientId: 'P002', doctorId: 'D002', date: d(0), time: '10:30', type: '医学验光', status: '已就诊', note: '散光度数调整', createdAt: d(-2) },
    { id: 'A1003', patientId: 'P003', doctorId: 'D004', date: d(0), time: '14:00', type: '视力筛查', status: '待就诊', note: '', createdAt: d(-1) },
    { id: 'A1004', patientId: 'P004', doctorId: 'D003', date: d(1), time: '09:30', type: '干眼诊疗', status: '已预约', note: '长期眼干', createdAt: d(-1) },
    { id: 'A1005', patientId: 'P005', doctorId: 'D002', date: d(1), time: '11:00', type: '配镜咨询', status: '已预约', note: '', createdAt: d(0) },
    { id: 'A1006', patientId: 'P006', doctorId: 'D004', date: d(2), time: '15:30', type: '儿童眼科', status: '已预约', note: '入园体检异常', createdAt: d(0) },
    { id: 'A1007', patientId: 'P003', doctorId: 'D001', date: d(-1), time: '10:00', type: '近视复查', status: '已完成', note: '', createdAt: d(-6) },
    { id: 'A1008', patientId: 'P001', doctorId: 'D001', date: d(-7), time: '09:00', type: '近视复查', status: '已完成', note: '', createdAt: d(-12) }
  ];

  var seedRecords = [
    { id: 'R2001', patientId: 'P001', doctorId: 'D001', date: d(-7), nakedL: '4.6', nakedR: '4.5', correctedL: '5.0', correctedR: '5.0', sphereL: '-2.00', sphereR: '-2.25', cylinderL: '-0.50', cylinderR: '-0.75', axisL: '180', axisR: '175', diagnosis: '双眼复合近视散光', advice: '坚持佩戴角膜塑形镜，每日户外活动 2 小时，3 个月复查。', prescription: '角膜塑形镜 / 夜戴' },
    { id: 'R2002', patientId: 'P002', doctorId: 'D002', date: d(-2), nakedL: '4.3', nakedR: '4.4', correctedL: '5.1', correctedR: '5.1', sphereL: '-3.25', sphereR: '-3.00', cylinderL: '-0.75', cylinderR: '-0.50', axisL: '170', axisR: '10', diagnosis: '双眼近视散光', advice: '建议足矫配镜，减少连续近距离用眼时间。', prescription: '框架眼镜 / 非球面' },
    { id: 'R2003', patientId: 'P003', doctorId: 'D001', date: d(-1), nakedL: '4.7', nakedR: '4.8', correctedL: '5.0', correctedR: '5.0', sphereL: '-1.50', sphereR: '-1.25', cylinderL: '', cylinderR: '', axisL: '', axisR: '', diagnosis: '双眼轻度近视', advice: '注意读写姿势，半年复查一次。', prescription: '暂不配镜，观察' },
    { id: 'R2004', patientId: 'P004', doctorId: 'D003', date: d(-15), nakedL: '4.9', nakedR: '4.8', correctedL: '5.0', correctedR: '5.0', sphereL: '+0.50', sphereR: '+0.75', cylinderL: '', cylinderR: '', axisL: '', axisR: '', diagnosis: '双眼老视 / 干眼症', advice: '人工泪液每日 3 次，热敷双眼，避免长时间看屏幕。', prescription: '渐进多焦点镜片' }
  ];

  var seedProducts = [
    { id: 'G001', name: '青少年近视防控镜片', category: '镜片', brand: '明月', price: 1280, stock: 24, unit: '片', status: '在售' },
    { id: 'G002', name: '非球面防蓝光镜片', category: '镜片', brand: '依视路', price: 980, stock: 36, unit: '片', status: '在售' },
    { id: 'G003', name: '纯钛轻量镜架', category: '镜架', brand: '暴龙', price: 680, stock: 12, unit: '副', status: '在售' },
    { id: 'G004', name: '儿童硅胶镜架', category: '镜架', brand: '派蒙', price: 320, stock: 8, unit: '副', status: '在售' },
    { id: 'G005', name: '角膜塑形镜护理液', category: '护理品', brand: '博视顿', price: 158, stock: 45, unit: '瓶', status: '在售' },
    { id: 'G006', name: '人工泪液滴眼液', category: '药品', brand: '海露', price: 68, stock: 60, unit: '支', status: '在售' },
    { id: 'G007', name: '验光检查套餐', category: '服务', brand: '本院', price: 60, stock: 999, unit: '次', status: '在售' }
  ];

  var seedBills = [
    { id: 'B3001', patientId: 'P001', date: d(-7), items: [{ name: '医学验光', price: 60, qty: 1 }, { name: '角膜塑形镜护理液', price: 158, qty: 2 }], total: 376, status: '已支付', payMethod: '微信' },
    { id: 'B3002', patientId: 'P002', date: d(-2), items: [{ name: '医学验光', price: 60, qty: 1 }, { name: '非球面防蓝光镜片', price: 980, qty: 2 }, { name: '纯钛轻量镜架', price: 680, qty: 1 }], total: 2700, status: '已支付', payMethod: '支付宝' },
    { id: 'B3003', patientId: 'P003', date: d(-1), items: [{ name: '视力筛查', price: 30, qty: 1 }], total: 30, status: '已支付', payMethod: '现金' },
    { id: 'B3004', patientId: 'P004', date: d(0), items: [{ name: '干眼检查', price: 120, qty: 1 }, { name: '人工泪液滴眼液', price: 68, qty: 3 }], total: 324, status: '待支付', payMethod: '' },
    { id: 'B3005', patientId: 'P005', date: d(-5), items: [{ name: '配镜咨询', price: 0, qty: 1 }], total: 0, status: '已支付', payMethod: '微信' }
  ];

  var seedNotices = [
    { id: 'N001', title: '暑期青少年近视防控专项筛查开始啦', date: d(-2), content: '本院即日起开展青少年近视防控专项筛查，包含裸眼视力、医学验光、眼轴测量等项目，预约免挂号费。' },
    { id: 'N002', title: '验光中心营业时间调整通知', date: d(-9), content: '验光中心周一至周日 08:30—18:00 正常营业，节假日另行通知。' },
    { id: 'N003', title: '角膜塑形镜佩戴注意事项', date: d(-16), content: '请各位家长督促孩子按规范清洁镜片，定期复查，出现异常及时就诊。' }
  ];

  var seedSettings = {
    clinicName: '明眸视力门诊',
    phone: '029-8888 6699',
    address: '西安市高新区丈八北路 88 号',
    hours: '08:30 - 18:00（周一至周日）',
    notice: '爱护眼睛，从我做起',
    version: '1.0.0'
  };

  var SEEDS = {
    doctors: seedDoctors,
    patients: seedPatients,
    appointments: seedAppointments,
    records: seedRecords,
    products: seedProducts,
    bills: seedBills,
    notices: seedNotices,
    settings: seedSettings
  };

  function seed(force) {
    Object.keys(SEEDS).forEach(function (key) {
      var existing = read(key, null);
      if (force || existing === null) write(key, JSON.parse(JSON.stringify(SEEDS[key])));
    });
  }

  /* ---------------- 对外 API ---------------- */
  var Store = {
    ready: function () { seed(false); return this; },
    reset: function () { seed(true); return this; },
    get: function (key) { return read(key, Array.isArray(SEEDS[key]) ? [] : (SEEDS[key] || null)); },
    set: function (key, value) { return write(key, value); },
    add: function (key, item) {
      var list = read(key, []);
      if (!item.id) item.id = nextId(key.charAt(0).toUpperCase());
      list.unshift(item);
      write(key, list);
      return item;
    },
    update: function (key, id, patch) {
      var list = read(key, []);
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { Object.assign(list[i], patch); break; }
      }
      write(key, list);
      return list;
    },
    remove: function (key, id) {
      var list = read(key, []).filter(function (x) { return x.id !== id; });
      write(key, list);
      return list;
    },
    find: function (key, id) {
      var list = read(key, []);
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    },
    nextId: nextId,
    today: function () { return d(0); },
    dateOffset: d,
    /* 通用工具 */
    money: function (n) { return '¥' + Number(n || 0).toFixed(2).replace(/\.00$/, ''); },
    escape: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    },
    uid: function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  };

  global.Store = Store;
  Store.ready();
})(window);

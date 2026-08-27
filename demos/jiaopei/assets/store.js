// 数据存储模块 - 使用 localStorage 模拟后台数据
var Store = (function() {
  var KEY = 'payment_demo_config';

  // 默认配置
  var defaultConfig = {
    // 商品信息
    product: {
      name: '精选商品',
      price: 99.00,
      desc: '优质商品，全国包邮'
    },
    // 邮费配置 - 按省/市/区分级
    shipping: {
      defaultFee: 10.00,
      freeThreshold: 199,
      provinces: {
        '北京市': { fee: 8, freeThreshold: 99 },
        '上海市': { fee: 8, freeThreshold: 99 },
        '广东省': { fee: 8, freeThreshold: 99 },
        '江苏省': { fee: 8, freeThreshold: 99 },
        '浙江省': { fee: 8, freeThreshold: 99 },
        '西藏自治区': { fee: 25, freeThreshold: 299 },
        '新疆维吾尔自治区': { fee: 25, freeThreshold: 299 },
        '青海省': { fee: 20, freeThreshold: 299 },
        '内蒙古自治区': { fee: 18, freeThreshold: 299 },
        '海南省': { fee: 15, freeThreshold: 199 }
      },
      cities: {},
      districts: {}
    },
    // 支付方式 - 仅微信支付
    payment: {
      wechat: {
        enabled: true,
        name: '微信支付',
        icon: '💚',
        jumpUrl: 'https://pay.weixin.qq.com'
      }
    }
  };

  function getConfig() {
    var stored = localStorage.getItem(KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch(e) {
        return JSON.parse(JSON.stringify(defaultConfig));
      }
    }
    return JSON.parse(JSON.stringify(defaultConfig));
  }

  function saveConfig(config) {
    localStorage.setItem(KEY, JSON.stringify(config));
  }

  function resetConfig() {
    localStorage.removeItem(KEY);
    return getConfig();
  }

  function calculateShipping(province, city, district, price) {
    var config = getConfig();
    var shipping = config.shipping;
    var fee = shipping.defaultFee;
    var freeThreshold = shipping.freeThreshold;

    if (province && shipping.provinces[province]) {
      fee = shipping.provinces[province].fee;
      freeThreshold = shipping.provinces[province].freeThreshold;
    }
    if (city && shipping.cities[city]) {
      fee = shipping.cities[city].fee;
      freeThreshold = shipping.cities[city].freeThreshold;
    }
    if (district && shipping.districts[district]) {
      fee = shipping.districts[district].fee;
      freeThreshold = shipping.districts[district].freeThreshold;
    }

    if (price >= freeThreshold) {
      fee = 0;
    }

    return {
      fee: fee,
      freeThreshold: freeThreshold,
      isFree: fee === 0
    };
  }

  // 模拟图表数据
  function getChartData() {
    return {
      // 近7天订单趋势
      orderTrend: {
        dates: ['8/21', '8/22', '8/23', '8/24', '8/25', '8/26', '8/27'],
        values: [86, 95, 72, 110, 128, 105, 128]
      },
      // 近7天收入统计
      revenueTrend: {
        dates: ['8/21', '8/22', '8/23', '8/24', '8/25', '8/26', '8/27'],
        values: [8514, 9405, 7128, 10890, 12672, 10395, 12680]
      },
      // 地区订单分布
      regionDist: [
        { name: '广东省', value: 320 },
        { name: '江苏省', value: 215 },
        { name: '北京市', value: 180 },
        { name: '浙江省', value: 156 },
        { name: '四川省', value: 98 },
        { name: '其他', value: 142 }
      ],
      // 订单状态分布
      orderStatus: [
        { name: '已支付', value: 856 },
        { name: '待支付', value: 124 },
        { name: '已取消', value: 48 }
      ]
    };
  }

  return {
    getConfig: getConfig,
    saveConfig: saveConfig,
    resetConfig: resetConfig,
    calculateShipping: calculateShipping,
    getChartData: getChartData
  };
})();

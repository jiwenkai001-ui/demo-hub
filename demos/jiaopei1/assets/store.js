// 数据存储模块 - 使用 localStorage 模拟后台数据
var Store = (function() {
  var KEY = 'payment_demo_config';
  var ORDERS_KEY = 'payment_demo_orders';

  // 默认配置
  var defaultConfig = {
    product: {
      name: '精选商品',
      price: 99.00,
      desc: '优质商品，全国包邮'
    },
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
    payment: {
      wechat: {
        enabled: true,
        name: '微信支付',
        icon: '💚',
        jumpUrl: 'https://pay.weixin.qq.com'
      }
    }
  };

  // 状态映射
  var ORDER_STATUS = {
    pending: { label: '待支付', color: 'warning' },
    paid: { label: '已支付', color: 'success' },
    shipped: { label: '已发货', color: 'success' },
    completed: { label: '已完成', color: 'success' },
    cancelled: { label: '已取消', color: 'error' }
  };

  function getConfig() {
    var stored = localStorage.getItem(KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
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
    if (price >= freeThreshold) fee = 0;
    return { fee: fee, freeThreshold: freeThreshold, isFree: fee === 0 };
  }

  // ====== 订单管理 ======
  function generateOrderNo() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var rand = Math.floor(Math.random() * 9000 + 1000);
    return 'DD' + y + m + d + rand;
  }

  function getOrders() {
    var stored = localStorage.getItem(ORDERS_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    // 生成模拟订单数据
    var mock = generateMockOrders();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(mock));
    return mock;
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function addOrder(orderData) {
    var orders = getOrders();
    var order = {
      orderNo: generateOrderNo(),
      createdAt: new Date().toISOString(),
      customerName: orderData.customerName,
      phone: orderData.phone,
      province: orderData.province,
      city: orderData.city,
      district: orderData.district,
      detailAddress: orderData.detailAddress,
      productName: orderData.productName,
      productPrice: orderData.productPrice,
      shippingFee: orderData.shippingFee,
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod || 'wechat',
      status: 'pending',
      paidAt: null,
      shippedAt: null,
      completedAt: null,
      cancelledAt: null
    };
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }

  function updateOrderStatus(orderNo, status) {
    var orders = getOrders();
    var order = orders.find(function(o) { return o.orderNo === orderNo; });
    if (!order) return null;
    order.status = status;
    var now = new Date().toISOString();
    if (status === 'paid') order.paidAt = now;
    if (status === 'shipped') order.shippedAt = now;
    if (status === 'completed') order.completedAt = now;
    if (status === 'cancelled') order.cancelledAt = now;
    saveOrders(orders);
    return order;
  }

  function getOrder(orderNo) {
    var orders = getOrders();
    return orders.find(function(o) { return o.orderNo === orderNo; });
  }

  function deleteOrder(orderNo) {
    var orders = getOrders();
    var idx = orders.findIndex(function(o) { return o.orderNo === orderNo; });
    if (idx >= 0) {
      orders.splice(idx, 1);
      saveOrders(orders);
      return true;
    }
    return false;
  }

  // 生成模拟订单数据
  function generateMockOrders() {
    var orders = [];
    var names = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨帆', '赵磊', '黄敏', '周杰', '吴婷', '徐强', '孙丽', '朱军', '马红', '胡明'];
    var provinces = ['广东省', '江苏省', '北京市', '浙江省', '四川省', '上海市', '山东省', '湖北省', '福建省', '河南省'];
    var statuses = ['completed', 'completed', 'completed', 'completed', 'paid', 'paid', 'shipped', 'pending', 'cancelled'];
    var config = getConfig();

    var now = new Date();
    for (var i = 0; i < 35; i++) {
      var daysAgo = Math.floor(Math.random() * 7);
      var hoursAgo = Math.floor(Math.random() * 24);
      var created = new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000);
      var province = provinces[Math.floor(Math.random() * provinces.length)];
      var status = statuses[Math.floor(Math.random() * statuses.length)];
      var shipping = calculateShipping(province, '', '', config.product.price);
      var total = config.product.price + shipping.fee;

      var order = {
        orderNo: 'DD2026082' + (7 - daysAgo) + String(1000 + i),
        createdAt: created.toISOString(),
        customerName: names[Math.floor(Math.random() * names.length)],
        phone: '1' + (3 + Math.floor(Math.random() * 6)) + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0'),
        province: province,
        city: getMockCity(province),
        district: '示例区',
        detailAddress: '示例街道' + (Math.floor(Math.random() * 99) + 1) + '号' + (Math.floor(Math.random() * 20) + 1) + '室',
        productName: config.product.name,
        productPrice: config.product.price,
        shippingFee: shipping.fee,
        totalAmount: total,
        paymentMethod: 'wechat',
        status: status,
        paidAt: status !== 'pending' && status !== 'cancelled' ? new Date(created.getTime() + 300000).toISOString() : null,
        shippedAt: status === 'shipped' || status === 'completed' ? new Date(created.getTime() + 7200000).toISOString() : null,
        completedAt: status === 'completed' ? new Date(created.getTime() + 86400000 * 2).toISOString() : null,
        cancelledAt: status === 'cancelled' ? new Date(created.getTime() + 3600000).toISOString() : null
      };
      orders.push(order);
    }
    orders.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    return orders;
  }

  function getMockCity(province) {
    var map = {
      '广东省': '深圳市', '江苏省': '苏州市', '北京市': '北京市', '浙江省': '杭州市',
      '四川省': '成都市', '上海市': '上海市', '山东省': '青岛市', '湖北省': '武汉市',
      '福建省': '厦门市', '河南省': '郑州市'
    };
    return map[province] || '示例市';
  }

  // ====== 从真实订单计算图表数据 ======
  function getChartData() {
    var orders = getOrders();
    var now = new Date();
    now.setHours(23, 59, 59, 999);

    // 近7天日期
    var dates = [];
    var orderCounts = [];
    var revenueValues = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var dateStr = (d.getMonth() + 1) + '/' + d.getDate();
      dates.push(dateStr);
      orderCounts.push(0);
      revenueValues.push(0);
    }

    // 地区分布
    var regionMap = {};
    // 状态分布
    var statusMap = { '已支付': 0, '待支付': 0, '已取消': 0 };

    orders.forEach(function(order) {
      var created = new Date(order.createdAt);
      // 近7天统计
      var daysDiff = Math.floor((now.getTime() - created.getTime()) / 86400000);
      if (daysDiff >= 0 && daysDiff < 7) {
        var idx = 6 - daysDiff;
        if (idx >= 0 && idx < 7) {
          orderCounts[idx]++;
          if (order.status !== 'pending' && order.status !== 'cancelled') {
            revenueValues[idx] += order.totalAmount;
          }
        }
      }
      // 地区分布
      if (order.province) {
        regionMap[order.province] = (regionMap[order.province] || 0) + 1;
      }
      // 状态分布
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'completed') {
        statusMap['已支付']++;
      } else if (order.status === 'pending') {
        statusMap['待支付']++;
      } else if (order.status === 'cancelled') {
        statusMap['已取消']++;
      }
    });

    // 地区分布转数组，取前5 + 其他
    var regionArr = Object.keys(regionMap).map(function(k) { return { name: k, value: regionMap[k] }; });
    regionArr.sort(function(a, b) { return b.value - a.value; });
    var regionDist = [];
    if (regionArr.length > 5) {
      regionDist = regionArr.slice(0, 5);
      var other = 0;
      for (var j = 5; j < regionArr.length; j++) other += regionArr[j].value;
      regionDist.push({ name: '其他', value: other });
    } else {
      regionDist = regionArr;
    }

    // 状态分布转数组
    var orderStatus = Object.keys(statusMap).map(function(k) { return { name: k, value: statusMap[k] }; });

    return {
      orderTrend: { dates: dates, values: orderCounts },
      revenueTrend: { dates: dates, values: revenueValues.map(function(v) { return Math.round(v * 100) / 100; }) },
      regionDist: regionDist,
      orderStatus: orderStatus,
      // 统计卡片数据
      stats: {
        todayOrders: orderCounts[orderCounts.length - 1],
        todayRevenue: revenueValues[revenueValues.length - 1]
      }
    };
  }

  return {
    getConfig: getConfig,
    saveConfig: saveConfig,
    resetConfig: resetConfig,
    calculateShipping: calculateShipping,
    getChartData: getChartData,
    getOrders: getOrders,
    addOrder: addOrder,
    updateOrderStatus: updateOrderStatus,
    getOrder: getOrder,
    deleteOrder: deleteOrder,
    ORDER_STATUS: ORDER_STATUS
  };
})();

// ====== Global State ======
var config = Store.getConfig();
var selectedPayment = 'wechat';
var editingPaymentKey = null;
var charts = {};

// Order state
var orderFilter = 'all';
var orderSearchKeyword = '';
var orderPage = 1;
var pageSize = 10;

// ====== Module Switching ======
function switchModule(name) {
  document.querySelectorAll('.topnav-tab').forEach(function(el) {
    el.classList.toggle('active', el.dataset.module === name);
  });
  document.querySelectorAll('.module').forEach(function(el) {
    el.classList.remove('active');
  });
  document.getElementById('module-' + name).classList.add('active');

  if (name === 'qr') renderQR();
  if (name === 'admin') {
    switchAdminSection('overview');
  }
  if (name === 'pay') refreshPayPage();
}

// ====== QR Module ======
function getPayUrl() {
  return window.location.href.replace(/[^\/]*$/, '') + 'app.html?m=pay';
}

function renderQR() {
  var canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  QRCodeGen.renderToCanvas(canvas, getPayUrl(), {
    scale: 8, margin: 2, fgColor: '#1a1a2e', ecl: 'M'
  });
  document.getElementById('qrUrl').textContent = getPayUrl();
}

function downloadQR() {
  var canvas = document.getElementById('qrCanvas');
  var link = document.createElement('a');
  link.download = '支付二维码.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showAdminToast('二维码已下载', 'success');
}

function copyPayLink() {
  var url = getPayUrl();
  var input = document.createElement('textarea');
  input.value = url;
  document.body.appendChild(input);
  input.select();
  try { document.execCommand('copy'); showAdminToast('链接已复制', 'success'); }
  catch(e) { showAdminToast('复制失败', 'error'); }
  document.body.removeChild(input);
}

// ====== Payment Form Module ======
function refreshPayPage() {
  config = Store.getConfig();
  document.getElementById('payProductName').textContent = config.product.name;
  document.getElementById('payProductDesc').textContent = config.product.desc;
  document.getElementById('payProductPrice').textContent = config.product.price.toFixed(2);
  document.getElementById('goodsAmount').textContent = '¥' + config.product.price.toFixed(2);

  var list = document.getElementById('paymentList');
  list.innerHTML = '';
  var firstEnabled = null;
  Object.keys(config.payment).forEach(function(key) {
    var method = config.payment[key];
    if (!method.enabled) return;
    if (!firstEnabled) firstEnabled = key;
    var item = document.createElement('div');
    item.className = 'pay-item' + (key === selectedPayment ? ' selected' : '');
    item.dataset.type = key;
    item.innerHTML = '<div class="pay-icon">' + method.icon + '</div><div class="pay-name">' + method.name + '</div><div class="pay-radio"></div>';
    item.onclick = function() {
      selectedPayment = key;
      document.querySelectorAll('.pay-item').forEach(function(el) { el.classList.remove('selected'); });
      item.classList.add('selected');
    };
    list.appendChild(item);
  });
  if (firstEnabled && !document.querySelector('.pay-item.selected')) {
    selectedPayment = firstEnabled;
    var firstItem = list.querySelector('.pay-item');
    if (firstItem) firstItem.classList.add('selected');
  }
  updatePayTotal();
}

function initRegionSelectors() {
  var provinceSelect = document.getElementById('province');
  provinceSelect.innerHTML = '<option value="">省份</option>';
  RegionData.getProvinces().forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    provinceSelect.appendChild(opt);
  });
}

document.getElementById('province').addEventListener('change', function() {
  var province = this.value;
  var citySelect = document.getElementById('city');
  var districtSelect = document.getElementById('district');
  citySelect.innerHTML = '<option value="">城市</option>';
  districtSelect.innerHTML = '<option value="">区县</option>';
  if (province) {
    RegionData.getCities(province).forEach(function(c) {
      citySelect.appendChild(new Option(c, c));
    });
  }
  updatePayShipping();
});

document.getElementById('city').addEventListener('change', function() {
  var province = document.getElementById('province').value;
  var city = this.value;
  var districtSelect = document.getElementById('district');
  districtSelect.innerHTML = '<option value="">区县</option>';
  if (province && city) {
    RegionData.getDistricts(province, city).forEach(function(d) {
      districtSelect.appendChild(new Option(d, d));
    });
  }
  updatePayShipping();
});

document.getElementById('district').addEventListener('change', updatePayShipping);
document.getElementById('detailAddress').addEventListener('input', function() {
  document.getElementById('addrCount').textContent = this.value.length;
});
document.getElementById('name').addEventListener('input', validateName);
document.getElementById('phone').addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '');
  validatePhone();
});

function updatePayShipping() {
  var province = document.getElementById('province').value;
  var city = document.getElementById('city').value;
  var district = document.getElementById('district').value;
  var shippingInfo = document.getElementById('shippingInfo');
  var shippingHint = document.getElementById('shippingHint');

  if (province) {
    var result = Store.calculateShipping(province, city, district, config.product.price);
    var feeEl = document.getElementById('shippingFee');
    if (result.isFree) {
      feeEl.textContent = '包邮'; feeEl.className = 'fee free';
    } else {
      feeEl.textContent = '¥' + result.fee.toFixed(2); feeEl.className = 'fee';
    }
    shippingInfo.style.display = 'flex';
    if (result.isFree) {
      shippingHint.textContent = '🎉 已享包邮';
    } else if (result.freeThreshold) {
      var diff = result.freeThreshold - config.product.price;
      shippingHint.textContent = diff > 0 ? '再购 ¥' + diff.toFixed(2) + ' 即可享包邮' : '';
    }
    shippingHint.style.display = shippingHint.textContent ? 'block' : 'none';
    document.getElementById('shipAmount').textContent = result.isFree ? '包邮' : '¥' + result.fee.toFixed(2);
  } else {
    shippingInfo.style.display = 'none';
    shippingHint.style.display = 'none';
    document.getElementById('shipAmount').textContent = '待计算';
  }
  updatePayTotal();
}

function updatePayTotal() {
  var province = document.getElementById('province').value;
  var city = document.getElementById('city').value;
  var district = document.getElementById('district').value;
  var shipping = config.shipping.defaultFee;
  if (province) {
    var result = Store.calculateShipping(province, city, district, config.product.price);
    shipping = result.fee;
  }
  var total = config.product.price + shipping;
  document.getElementById('totalAmount').textContent = total.toFixed(2);
  document.getElementById('bottomTotal').textContent = total.toFixed(2);
}

function validateName() {
  var name = document.getElementById('name').value.trim();
  var group = document.getElementById('nameGroup');
  if (!name) { group.classList.add('has-error'); return false; }
  group.classList.remove('has-error'); return true;
}
function validatePhone() {
  var phone = document.getElementById('phone').value.trim();
  var group = document.getElementById('phoneGroup');
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) { group.classList.add('has-error'); return false; }
  group.classList.remove('has-error'); return true;
}
function validateRegion() {
  var p = document.getElementById('province').value;
  var c = document.getElementById('city').value;
  var d = document.getElementById('district').value;
  var group = document.getElementById('regionGroup');
  if (!p || !c || !d) { group.classList.add('has-error'); return false; }
  group.classList.remove('has-error'); return true;
}
function validateDetail() {
  var detail = document.getElementById('detailAddress').value.trim();
  return detail && detail.length >= 5;
}

function submitOrder() {
  if (!validateName()) { showToast('请输入收货人姓名'); return; }
  if (!validatePhone()) { showToast('请输入正确的11位手机号'); return; }
  if (!validateRegion()) { showToast('请选择完整的省市区地址'); return; }
  if (!validateDetail()) { showToast('请填写详细地址（至少5个字）'); return; }

  var method = config.payment[selectedPayment];
  if (!method || !method.enabled) { showToast('请选择支付方式'); return; }

  // 计算运费
  var province = document.getElementById('province').value;
  var city = document.getElementById('city').value;
  var district = document.getElementById('district').value;
  var shippingResult = Store.calculateShipping(province, city, district, config.product.price);
  var total = config.product.price + shippingResult.fee;

  // 创建订单
  var order = Store.addOrder({
    customerName: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    province: province,
    city: city,
    district: district,
    detailAddress: document.getElementById('detailAddress').value.trim(),
    productName: config.product.name,
    productPrice: config.product.price,
    shippingFee: shippingResult.fee,
    totalAmount: total,
    paymentMethod: selectedPayment
  });

  // 模拟支付成功
  setTimeout(function() {
    Store.updateOrderStatus(order.orderNo, 'paid');
  }, 2000);

  var modal = document.getElementById('payModal');
  document.getElementById('payModalIcon').textContent = method.icon;
  document.getElementById('payModalTitle').textContent = '正在跳转' + method.name;
  document.getElementById('payModalDesc').textContent = '订单号：' + order.orderNo + '\n请在' + method.name + '中完成支付，支付成功后将自动返回';
  modal.classList.add('show');
}

function closePayModal() {
  document.getElementById('payModal').classList.remove('show');
}

var toastTimer;
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// ====== Admin Section ======
function switchAdminSection(section) {
  document.querySelectorAll('.admin-side-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.section === section);
  });
  document.querySelectorAll('.admin-section').forEach(function(el) {
    el.classList.remove('active');
  });
  document.getElementById('section-' + section).classList.add('active');

  if (section === 'overview') setTimeout(renderCharts, 100);
  if (section === 'orders') loadOrderList();
}

// Product
function loadProduct() {
  document.getElementById('adminProductName').value = config.product.name;
  document.getElementById('adminProductPrice').value = config.product.price;
  document.getElementById('adminProductDesc').value = config.product.desc;
  document.getElementById('statPrice').textContent = '¥' + config.product.price.toFixed(2);
}
function saveProduct() {
  var name = document.getElementById('adminProductName').value.trim();
  var price = parseFloat(document.getElementById('adminProductPrice').value);
  var desc = document.getElementById('adminProductDesc').value.trim();
  if (!name) { showAdminToast('请输入商品名称', 'error'); return; }
  if (isNaN(price) || price <= 0) { showAdminToast('请输入正确的商品价格', 'error'); return; }
  config.product.name = name;
  config.product.price = price;
  config.product.desc = desc;
  Store.saveConfig(config);
  loadProduct();
  loadQRProduct();
  showAdminToast('商品设置已保存', 'success');
}

// Shipping
function loadShipping() {
  document.getElementById('defaultFee').value = config.shipping.defaultFee;
  document.getElementById('freeThreshold').value = config.shipping.freeThreshold;
  document.getElementById('statShipping').textContent = '¥' + config.shipping.defaultFee.toFixed(2);
  renderShippingTable();
  loadProvinceOptions();
}
function saveDefaultShipping() {
  var fee = parseFloat(document.getElementById('defaultFee').value);
  var threshold = parseFloat(document.getElementById('freeThreshold').value);
  if (isNaN(fee) || fee < 0) { showAdminToast('请输入正确的默认邮费', 'error'); return; }
  if (isNaN(threshold) || threshold < 0) { showAdminToast('请输入正确的包邮门槛', 'error'); return; }
  config.shipping.defaultFee = fee;
  config.shipping.freeThreshold = threshold;
  Store.saveConfig(config);
  loadShipping();
  showAdminToast('默认配置已保存', 'success');
}
function renderShippingTable() {
  var tbody = document.getElementById('shippingTable');
  tbody.innerHTML = '';
  var levels = [
    { key: 'provinces', label: '省级', cls: 'badge-warning' },
    { key: 'cities', label: '市级', cls: 'badge-success' },
    { key: 'districts', label: '区级', cls: 'badge-success' }
  ];
  levels.forEach(function(lv) {
    var data = config.shipping[lv.key];
    Object.keys(data).forEach(function(name) {
      var rule = data[name];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td><span class="badge ' + lv.cls + '">' + lv.label + '</span></td><td>' + name + '</td><td>¥' + rule.fee.toFixed(2) + '</td><td>' + (rule.freeThreshold > 0 ? '满¥' + rule.freeThreshold.toFixed(2) : '不包邮') + '</td><td><span class="action-link danger" onclick="deleteShippingRule(\'' + lv.key + '\',\'' + name.replace(/'/g, "\\'") + '\')">删除</span></td>';
      tbody.appendChild(tr);
    });
  });
  if (tbody.children.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px;">暂无地区配置</td></tr>';
  }
}
function loadProvinceOptions() {
  var sel = document.getElementById('shippingProvince');
  sel.innerHTML = '<option value="">请选择省份</option>';
  RegionData.getProvinces().forEach(function(p) {
    sel.innerHTML += '<option value="' + p + '">' + p + '</option>';
  });
}
function onLevelChange() {
  var level = document.getElementById('shippingLevel').value;
  document.getElementById('provinceRow').style.display = 'flex';
  document.getElementById('cityRow').style.display = (level === 'city' || level === 'district') ? 'flex' : 'none';
  document.getElementById('districtRow').style.display = (level === 'district') ? 'flex' : 'none';
}
function onProvinceChange() {
  var province = document.getElementById('shippingProvince').value;
  var sel = document.getElementById('shippingCity');
  sel.innerHTML = '<option value="">请选择城市</option>';
  if (province) RegionData.getCities(province).forEach(function(c) { sel.innerHTML += '<option value="' + c + '">' + c + '</option>'; });
  document.getElementById('shippingDistrict').innerHTML = '<option value="">请选择区县</option>';
}
function onCityChange() {
  var province = document.getElementById('shippingProvince').value;
  var city = document.getElementById('shippingCity').value;
  var sel = document.getElementById('shippingDistrict');
  sel.innerHTML = '<option value="">请选择区县</option>';
  if (province && city) RegionData.getDistricts(province, city).forEach(function(d) { sel.innerHTML += '<option value="' + d + '">' + d + '</option>'; });
}
function openShippingModal() {
  document.getElementById('shippingLevel').value = 'province';
  document.getElementById('shippingProvince').value = '';
  document.getElementById('shippingCity').innerHTML = '<option value="">请选择城市</option>';
  document.getElementById('shippingDistrict').innerHTML = '<option value="">请选择区县</option>';
  document.getElementById('shippingFee').value = '';
  document.getElementById('shippingFree').value = '';
  onLevelChange();
  document.getElementById('shippingModal').classList.add('show');
}
function closeShippingModal() {
  document.getElementById('shippingModal').classList.remove('show');
}
function saveShippingRule() {
  var level = document.getElementById('shippingLevel').value;
  var fee = parseFloat(document.getElementById('shippingFee').value);
  var freeThreshold = parseFloat(document.getElementById('shippingFree').value) || 0;
  var name = '';
  if (level === 'province') name = document.getElementById('shippingProvince').value;
  else if (level === 'city') name = document.getElementById('shippingCity').value;
  else name = document.getElementById('shippingDistrict').value;
  if (!name) { showAdminToast('请选择地区', 'error'); return; }
  if (isNaN(fee) || fee < 0) { showAdminToast('请输入正确的邮费', 'error'); return; }
  var target = level === 'province' ? config.shipping.provinces : level === 'city' ? config.shipping.cities : config.shipping.districts;
  target[name] = { fee: fee, freeThreshold: freeThreshold };
  Store.saveConfig(config);
  renderShippingTable();
  closeShippingModal();
  showAdminToast('地区邮费已添加', 'success');
}
function deleteShippingRule(key, name) {
  if (!confirm('确定删除「' + name + '」的邮费配置吗？')) return;
  delete config.shipping[key][name];
  Store.saveConfig(config);
  renderShippingTable();
  showAdminToast('已删除', 'success');
}

// Payment
function loadPaymentMethods() {
  var container = document.getElementById('adminPaymentMethods');
  container.innerHTML = '';
  Object.keys(config.payment).forEach(function(key) {
    var method = config.payment[key];
    var row = document.createElement('div');
    row.className = 'pm-row';
    row.innerHTML = '<div class="pm-icon">' + method.icon + '</div><div class="pm-info"><div class="pm-name">' + method.name + '</div><div class="pm-url">' + method.jumpUrl + '</div></div><div style="margin-right:16px;"><span class="badge ' + (method.enabled ? 'badge-success' : 'badge-error') + '">' + (method.enabled ? '已启用' : '已停用') + '</span></div><button class="btn btn-sm" onclick="editPayMethod(\'' + key + '\')">编辑</button>';
    container.appendChild(row);
  });
}
function editPayMethod(key) {
  editingPaymentKey = key;
  var method = config.payment[key];
  document.getElementById('pmModalTitle').textContent = '编辑 - ' + method.name;
  document.getElementById('pmName').value = method.name;
  document.getElementById('pmJumpUrl').value = method.jumpUrl;
  document.getElementById('pmEnabled').checked = method.enabled;
  document.getElementById('payMethodModal').classList.add('show');
}
function closePayMethodModal() {
  document.getElementById('payMethodModal').classList.remove('show');
  editingPaymentKey = null;
}
function savePayMethod() {
  if (!editingPaymentKey) return;
  var name = document.getElementById('pmName').value.trim();
  var jumpUrl = document.getElementById('pmJumpUrl').value.trim();
  var enabled = document.getElementById('pmEnabled').checked;
  if (!name) { showAdminToast('请输入显示名称', 'error'); return; }
  if (!jumpUrl) { showAdminToast('请输入跳转链接', 'error'); return; }
  config.payment[editingPaymentKey].name = name;
  config.payment[editingPaymentKey].jumpUrl = jumpUrl;
  config.payment[editingPaymentKey].enabled = enabled;
  Store.saveConfig(config);
  loadPaymentMethods();
  closePayMethodModal();
  showAdminToast('支付方式已保存', 'success');
}

// ====== Order Management ======
function loadOrderList() {
  renderOrderStatusCounts();
  renderOrderTable();
}

function renderOrderStatusCounts() {
  var orders = Store.getOrders();
  var counts = { all: orders.length, pending: 0, paid: 0, shipped: 0, completed: 0, cancelled: 0 };
  orders.forEach(function(o) {
    if (counts[o.status] !== undefined) counts[o.status]++;
  });
  Object.keys(counts).forEach(function(status) {
    var el = document.getElementById('count-' + status);
    if (el) el.textContent = counts[status];
  });
}

function getFilteredOrders() {
  var orders = Store.getOrders();
  // Status filter
  if (orderFilter !== 'all') {
    orders = orders.filter(function(o) { return o.status === orderFilter; });
  }
  // Search filter
  if (orderSearchKeyword) {
    var kw = orderSearchKeyword.toLowerCase();
    orders = orders.filter(function(o) {
      return o.orderNo.toLowerCase().indexOf(kw) >= 0 ||
             o.customerName.indexOf(kw) >= 0 ||
             o.phone.indexOf(kw) >= 0;
    });
  }
  return orders;
}

function renderOrderTable() {
  var orders = getFilteredOrders();
  var tbody = document.getElementById('orderTableBody');
  var empty = document.getElementById('orderEmpty');
  var pgInfo = document.getElementById('pgInfo');
  var pgBtns = document.getElementById('pgBtns');

  if (orders.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    pgInfo.textContent = '共 0 条';
    pgBtns.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  // Pagination
  var totalPages = Math.ceil(orders.length / pageSize);
  if (orderPage > totalPages) orderPage = totalPages;
  var start = (orderPage - 1) * pageSize;
  var pageOrders = orders.slice(start, start + pageSize);

  tbody.innerHTML = '';
  pageOrders.forEach(function(order) {
    var statusInfo = Store.ORDER_STATUS[order.status];
    var tr = document.createElement('tr');
    var fullAddr = order.province + order.city + order.district + order.detailAddress;
    tr.innerHTML =
      '<td><span class="order-no" onclick="showOrderDetail(\'' + order.orderNo + '\')">' + order.orderNo + '</span></td>' +
      '<td>' + formatDateTime(order.createdAt) + '</td>' +
      '<td><div class="order-customer">' + order.customerName + '</div><div class="order-phone">' + order.phone + '</div></td>' +
      '<td><div class="order-addr" title="' + fullAddr + '">' + fullAddr + '</div></td>' +
      '<td>' + order.productName + '</td>' +
      '<td class="order-amount">¥' + order.totalAmount.toFixed(2) + '</td>' +
      '<td><span class="badge badge-' + statusInfo.color + '">' + statusInfo.label + '</span></td>' +
      '<td><div class="order-actions">' +
        '<span class="action-link" onclick="showOrderDetail(\'' + order.orderNo + '\')">详情</span>' +
        getStatusActions(order) +
      '</div></td>';
    tbody.appendChild(tr);
  });

  // Pagination info
  pgInfo.textContent = '共 ' + orders.length + ' 条，第 ' + orderPage + '/' + totalPages + ' 页';

  // Pagination buttons
  pgBtns.innerHTML = '';
  function addPgBtn(text, page, disabled, active) {
    var btn = document.createElement('button');
    btn.className = 'pg-btn' + (active ? ' active' : '');
    btn.textContent = text;
    btn.disabled = disabled;
    btn.onclick = function() { if (!disabled && !active) { orderPage = page; renderOrderTable(); } };
    pgBtns.appendChild(btn);
  }
  addPgBtn('上一页', orderPage - 1, orderPage <= 1, false);
  var startPage = Math.max(1, orderPage - 2);
  var endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
  for (var p = startPage; p <= endPage; p++) {
    addPgBtn(p, p, false, p === orderPage);
  }
  addPgBtn('下一页', orderPage + 1, orderPage >= totalPages, false);
}

function getStatusActions(order) {
  var actions = [];
  if (order.status === 'pending') {
    actions.push('<span class="action-link" onclick="changeOrderStatus(\'' + order.orderNo + '\',\'paid\')">标记已支付</span>');
    actions.push('<span class="action-link danger" onclick="changeOrderStatus(\'' + order.orderNo + '\',\'cancelled\')">取消</span>');
  } else if (order.status === 'paid') {
    actions.push('<span class="action-link" onclick="changeOrderStatus(\'' + order.orderNo + '\',\'shipped\')">发货</span>');
  } else if (order.status === 'shipped') {
    actions.push('<span class="action-link" onclick="changeOrderStatus(\'' + order.orderNo + '\',\'completed\')">完成</span>');
  }
  actions.push('<span class="action-link danger" onclick="deleteOrderConfirm(\'' + order.orderNo + '\')">删除</span>');
  return actions.join('');
}

function filterOrders(status) {
  orderFilter = status;
  orderPage = 1;
  document.querySelectorAll('.order-status-tab').forEach(function(el) {
    el.classList.toggle('active', el.dataset.status === status);
  });
  renderOrderTable();
}

function onOrderSearch(val) {
  orderSearchKeyword = val.trim();
  orderPage = 1;
  renderOrderTable();
}

function changeOrderStatus(orderNo, status) {
  var actionMap = { paid: '确认已支付', shipped: '确认已发货', completed: '确认已完成', cancelled: '确认取消订单' };
  if (!confirm(actionMap[status] + '？')) return;
  Store.updateOrderStatus(orderNo, status);
  renderOrderStatusCounts();
  renderOrderTable();
  renderCharts();
  showAdminToast('状态已更新', 'success');
}

function deleteOrderConfirm(orderNo) {
  if (!confirm('确定删除订单 ' + orderNo + ' ？此操作不可恢复。')) return;
  Store.deleteOrder(orderNo);
  renderOrderStatusCounts();
  renderOrderTable();
  renderCharts();
  showAdminToast('订单已删除', 'success');
}

function showOrderDetail(orderNo) {
  var order = Store.getOrder(orderNo);
  if (!order) return;
  var statusInfo = Store.ORDER_STATUS[order.status];
  var method = config.payment[order.paymentMethod] || { name: '未知', icon: '💳' };

  var body = document.getElementById('orderDetailBody');
  body.innerHTML =
    '<div class="detail-section">' +
      '<div class="detail-section-title">📦 商品信息</div>' +
      '<div class="detail-row"><span class="label">商品名称</span><span class="value">' + order.productName + '</span></div>' +
      '<div class="detail-row"><span class="label">商品单价</span><span class="value">¥' + order.productPrice.toFixed(2) + '</span></div>' +
      '<div class="detail-row"><span class="label">运费</span><span class="value">¥' + order.shippingFee.toFixed(2) + '</span></div>' +
      '<div class="detail-row"><span class="label">实付金额</span><span class="value" style="color:var(--red);font-weight:600;font-size:16px;">¥' + order.totalAmount.toFixed(2) + '</span></div>' +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">📍 收货信息</div>' +
      '<div class="detail-row"><span class="label">收货人</span><span class="value">' + order.customerName + '</span></div>' +
      '<div class="detail-row"><span class="label">联系电话</span><span class="value">' + order.phone + '</span></div>' +
      '<div class="detail-row"><span class="label">收货地址</span><span class="value">' + order.province + order.city + order.district + order.detailAddress + '</span></div>' +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">💳 支付信息</div>' +
      '<div class="detail-row"><span class="label">支付方式</span><span class="value">' + method.icon + ' ' + method.name + '</span></div>' +
      '<div class="detail-row"><span class="label">订单状态</span><span class="value"><span class="badge badge-' + statusInfo.color + '">' + statusInfo.label + '</span></span></div>' +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">📝 订单时间线</div>' +
      '<div class="detail-timeline">' +
        getTimelineItem('下单', order.createdAt, 'done') +
        getTimelineItem('支付', order.paidAt, order.paidAt ? 'done' : (order.status === 'pending' ? 'current' : '')) +
        getTimelineItem('发货', order.shippedAt, order.shippedAt ? 'done' : (order.status === 'paid' ? 'current' : '')) +
        getTimelineItem('完成', order.completedAt, order.completedAt ? 'done' : (order.status === 'shipped' ? 'current' : '')) +
      '</div>' +
    '</div>';

  var footer = document.getElementById('orderDetailFooter');
  footer.innerHTML = '';
  if (order.status === 'pending') {
    footer.innerHTML += '<button class="btn" onclick="changeOrderStatusFromDetail(\'' + orderNo + '\',\'cancelled\')">取消订单</button>';
    footer.innerHTML += '<button class="btn btn-primary" onclick="changeOrderStatusFromDetail(\'' + orderNo + '\',\'paid\')">标记已支付</button>';
  } else if (order.status === 'paid') {
    footer.innerHTML += '<button class="btn btn-primary" onclick="changeOrderStatusFromDetail(\'' + orderNo + '\',\'shipped\')">标记已发货</button>';
  } else if (order.status === 'shipped') {
    footer.innerHTML += '<button class="btn btn-primary" onclick="changeOrderStatusFromDetail(\'' + orderNo + '\',\'completed\')">标记已完成</button>';
  }

  document.getElementById('orderDetailModal').classList.add('show');
}

function getTimelineItem(title, time, status) {
  if (!time && status !== 'current') return '';
  return '<div class="timeline-item ' + status + '">' +
    '<div class="timeline-title">' + title + '</div>' +
    '<div class="timeline-time">' + (time ? formatDateTime(time) : '待处理') + '</div>' +
  '</div>';
}

function changeOrderStatusFromDetail(orderNo, status) {
  closeOrderDetail();
  changeOrderStatus(orderNo, status);
}

function closeOrderDetail() {
  document.getElementById('orderDetailModal').classList.remove('show');
}

// ====== Export ======
function toggleExportDropdown() {
  var dd = document.getElementById('exportDropdown');
  dd.classList.toggle('show');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.export-wrap')) {
    var dd = document.getElementById('exportDropdown');
    if (dd) dd.classList.remove('show');
  }
});

function exportOrders(type) {
  var orders = type === 'all' ? Store.getOrders() : getFilteredOrders();
  if (orders.length === 0) {
    showAdminToast('没有可导出的订单', 'error');
    return;
  }

  // CSV with BOM for Excel Chinese support
  var headers = ['订单号','下单时间','客户姓名','联系电话','省份','城市','区县','详细地址','商品名称','商品单价','运费','实付金额','支付方式','订单状态','支付时间','发货时间','完成时间'];
  var rows = [headers];

  orders.forEach(function(order) {
    var statusInfo = Store.ORDER_STATUS[order.status];
    var method = config.payment[order.paymentMethod];
    rows.push([
      order.orderNo,
      formatDateTime(order.createdAt),
      order.customerName,
      order.phone,
      order.province,
      order.city,
      order.district,
      order.detailAddress,
      order.productName,
      order.productPrice.toFixed(2),
      order.shippingFee.toFixed(2),
      order.totalAmount.toFixed(2),
      method ? method.name : '',
      statusInfo ? statusInfo.label : order.status,
      order.paidAt ? formatDateTime(order.paidAt) : '',
      order.shippedAt ? formatDateTime(order.shippedAt) : '',
      order.completedAt ? formatDateTime(order.completedAt) : ''
    ]);
  });

  var csv = rows.map(function(row) {
    return row.map(function(cell) {
      var s = String(cell == null ? '' : cell);
      if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\r\n');

  // UTF-8 BOM
  var bom = '\uFEFF';
  var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  var today = new Date();
  var dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
  link.href = url;
  link.download = '订单列表_' + dateStr + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  document.getElementById('exportDropdown').classList.remove('show');
  showAdminToast('已导出 ' + orders.length + ' 条订单', 'success');
}

// ====== Charts ======
function renderCharts() {
  var data = Store.getChartData();
  var accent = '#1890ff';
  var green = '#52c41a';
  var red = '#ff4d4f';
  var warning = '#faad14';
  var muted = '#8c8c8c';

  // Update stats cards from real data
  document.getElementById('statOrders') && (document.getElementById('statOrders').textContent = data.stats.todayOrders);
  document.getElementById('statRevenue') && (document.getElementById('statRevenue').textContent = '¥' + data.stats.todayRevenue.toLocaleString());

  // Chart 1: Order Trend (Line)
  if (charts.order) charts.order.dispose();
  charts.order = echarts.init(document.getElementById('chartOrder'));
  charts.order.setOption({
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.orderTrend.dates, axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: muted } },
    series: [{
      name: '订单数', type: 'line', smooth: true, data: data.orderTrend.values,
      itemStyle: { color: accent }, lineStyle: { width: 3, color: accent },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24,144,255,0.3)' }, { offset: 1, color: 'rgba(24,144,255,0.02)' }] } },
      symbol: 'circle', symbolSize: 8
    }]
  });

  // Chart 2: Revenue (Bar)
  if (charts.revenue) charts.revenue.dispose();
  charts.revenue = echarts.init(document.getElementById('chartRevenue'));
  charts.revenue.setOption({
    tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) { return p[0].name + '<br/>收入: ¥' + p[0].value.toLocaleString(); } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.revenueTrend.dates, axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: muted, formatter: function(v) { return '¥' + (v / 1000).toFixed(0) + 'k'; } } },
    series: [{
      name: '收入', type: 'bar', data: data.revenueTrend.values,
      itemStyle: { color: green, borderRadius: [4, 4, 0, 0] }, barWidth: '50%'
    }]
  });

  // Chart 3: Region Distribution (Pie)
  if (charts.region) charts.region.dispose();
  charts.region = echarts.init(document.getElementById('chartRegion'));
  charts.region.setOption({
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}单 ({d}%)' },
    legend: { bottom: 0, left: 'center', textStyle: { color: muted, fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      data: data.regionDist,
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { color: muted, fontSize: 12 },
      color: [accent, green, warning, '#722ed1', '#13c2c2', '#eb2f96']
    }]
  });

  // Chart 4: Order Status (Donut)
  if (charts.status) charts.status.dispose();
  charts.status = echarts.init(document.getElementById('chartStatus'));
  charts.status.setOption({
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}单 ({d}%)' },
    legend: { bottom: 0, left: 'center', textStyle: { color: muted, fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: data.orderStatus,
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      color: [green, warning, red]
    }]
  });
}

window.addEventListener('resize', function() {
  Object.keys(charts).forEach(function(k) {
    if (charts[k]) charts[k].resize();
  });
});

// ====== Utilities ======
function loadQRProduct() {
  document.getElementById('qrProductName').textContent = config.product.name;
  document.getElementById('qrProductDesc').textContent = config.product.desc;
  document.getElementById('qrProductPrice').textContent = config.product.price.toFixed(2);
}

function formatDateTime(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  var h = String(d.getHours()).padStart(2, '0');
  var min = String(d.getMinutes()).padStart(2, '0');
  return y + '-' + m + '-' + day + ' ' + h + ':' + min;
}

var adminToastTimer;
function showAdminToast(msg, type) {
  type = type || 'success';
  var toast = document.getElementById('adminToast');
  toast.className = 'admin-toast ' + type;
  document.getElementById('adminToastIcon').textContent = type === 'success' ? '✓' : '✕';
  document.getElementById('adminToastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(adminToastTimer);
  adminToastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// ====== Init ======
initRegionSelectors();
loadProduct();
loadShipping();
loadPaymentMethods();
loadQRProduct();
refreshPayPage();
renderQR();

// Update stat cards with real data
var chartData = Store.getChartData();
document.getElementById('statOrders').textContent = chartData.stats.todayOrders;
document.getElementById('statRevenue').textContent = '¥' + chartData.stats.todayRevenue.toLocaleString();

// Auto-switch to payment module when accessed via QR code (?m=pay)
var params = new URLSearchParams(window.location.search);
if (params.get('m') === 'pay') {
  switchModule('pay');
}

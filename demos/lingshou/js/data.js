// ========== Mock 数据(预包装食品批发 DEMO) ==========

// 商品档案(11 个,覆盖食品行业特色)
const products = [
  { id:1, code:'SP001', barcode:'6920152400016', name:'康师傅红烧牛肉面 5包', spec:'5包/袋', categoryId:1, categoryName:'方便食品', mainUnit:'袋', shelfLifeDays:180, status:1, costPrice:1.80, retailPrice:2.50 },
  { id:2, code:'SP002', barcode:'6920152400023', name:'统一老坛酸菜面 5包', spec:'5包/袋', categoryId:1, categoryName:'方便食品', mainUnit:'袋', shelfLifeDays:180, status:1, costPrice:1.85, retailPrice:2.50 },
  { id:3, code:'SP003', barcode:'6920152400030', name:'可口可乐 330ml', spec:'330ml/罐', categoryId:2, categoryName:'碳酸饮料', mainUnit:'罐', shelfLifeDays:365, status:1, costPrice:1.50, retailPrice:2.00 },
  { id:4, code:'SP004', barcode:'6920152400047', name:'农夫山泉 550ml', spec:'550ml/瓶', categoryId:3, categoryName:'饮用水', mainUnit:'瓶', shelfLifeDays:730, status:1, costPrice:0.80, retailPrice:1.50 },
  { id:5, code:'SP005', barcode:'6920152400054', name:'康师傅冰红茶 500ml', spec:'500ml/瓶', categoryId:2, categoryName:'茶饮料', mainUnit:'瓶', shelfLifeDays:270, status:1, costPrice:1.60, retailPrice:2.50 },
  { id:6, code:'SP006', barcode:'6921168509316', name:'王老吉凉茶 310ml', spec:'310ml/罐', categoryId:2, categoryName:'植物饮料', mainUnit:'罐', shelfLifeDays:540, status:1, costPrice:2.00, retailPrice:3.50 },
  { id:7, code:'SP007', barcode:'6924743910131', name:'奥利奥原味饼干 116g', spec:'116g/包', categoryId:4, categoryName:'饼干糕点', mainUnit:'包', shelfLifeDays:270, status:1, costPrice:3.50, retailPrice:5.00 },
  { id:8, code:'SP008', barcode:'6924743910148', name:'达利园法式软面包 360g', spec:'360g/袋', categoryId:4, categoryName:'烘焙食品', mainUnit:'袋', shelfLifeDays:120, status:1, costPrice:4.50, retailPrice:6.50 },
  { id:9, code:'SP009', barcode:'6920152400061', name:'康师傅绿茶 500ml', spec:'500ml/瓶', categoryId:2, categoryName:'茶饮料', mainUnit:'瓶', shelfLifeDays:270, status:1, costPrice:1.60, retailPrice:2.50 },
  { id:10, code:'SP010', barcode:'6920152400078', name:'旺旺仙贝 50g', spec:'50g/包', categoryId:4, categoryName:'膨化食品', mainUnit:'包', shelfLifeDays:240, status:1, costPrice:0.90, retailPrice:1.50 },
  { id:11, code:'SP011', barcode:'6920152400085', name:'达能碧悠原味酸奶 200g', spec:'200g/杯', categoryId:5, categoryName:'乳制品', mainUnit:'杯', shelfLifeDays:21, status:1, costPrice:2.50, retailPrice:3.80 },
]

// 商品批次(13 个,含临期/过期)
// 计算日期基准:今天 2026-09-17
const batches = [
  { id:1, batchNo:'KF20260801', productId:1, productionDate:'2026-08-01', expiryDate:'2027-01-28', initialQty:200, remainingQty:120, status:1, warehouseId:1 },
  { id:2, batchNo:'KF20260501', productId:1, productionDate:'2026-05-01', expiryDate:'2026-10-28', initialQty:100, remainingQty:30, status:1, warehouseId:1 },
  { id:3, batchNo:'TY20260815', productId:2, productionDate:'2026-08-15', expiryDate:'2027-02-11', initialQty:150, remainingQty:80, status:1, warehouseId:1 },
  { id:4, batchNo:'KE20260901', productId:3, productionDate:'2026-09-01', expiryDate:'2027-09-01', initialQty:300, remainingQty:200, status:1, warehouseId:1 },
  { id:5, batchNo:'NF20260601', productId:4, productionDate:'2026-06-01', expiryDate:'2028-05-31', initialQty:500, remainingQty:350, status:1, warehouseId:2 },
  { id:6, batchNo:'BC20260701', productId:5, productionDate:'2026-07-01', expiryDate:'2027-03-29', initialQty:200, remainingQty:120, status:1, warehouseId:1 },
  { id:7, batchNo:'WLJ20240101', productId:6, productionDate:'2024-01-01', expiryDate:'2025-06-26', initialQty:100, remainingQty:20, status:3, warehouseId:1 },
  { id:8, batchNo:'AL20260801', productId:7, productionDate:'2026-08-01', expiryDate:'2027-04-29', initialQty:150, remainingQty:90, status:1, warehouseId:1 },
  { id:9, batchNo:'DL20260910', productId:8, productionDate:'2026-09-10', expiryDate:'2027-01-08', initialQty:80, remainingQty:50, status:1, warehouseId:2 },
  { id:10, batchNo:'LC20260820', productId:9, productionDate:'2026-08-20', expiryDate:'2027-05-17', initialQty:200, remainingQty:100, status:1, warehouseId:1 },
  { id:11, batchNo:'WW20260801', productId:10, productionDate:'2026-08-01', expiryDate:'2027-03-29', initialQty:300, remainingQty:200, status:1, warehouseId:1 },
  { id:12, batchNo:'DN20260901', productId:11, productionDate:'2026-09-01', expiryDate:'2026-09-22', initialQty:50, remainingQty:30, status:1, warehouseId:2 },
  { id:13, batchNo:'DN20260915', productId:11, productionDate:'2026-09-15', expiryDate:'2026-10-06', initialQty:30, remainingQty:30, status:1, warehouseId:2 },
]

// 仓库
const warehouses = [
  { id:1, name:'档口仓库' },
  { id:2, name:'后备库房' },
]

// 客户档案(5 个,含信用额度)
const customers = [
  { id:1, code:'C001', name:'城市便利连锁', grade:1, gradeLabel:'A级', creditLimit:50000, accountPeriod:30, balance:18300, status:1 },
  { id:2, code:'C002', name:'福满楼餐饮', grade:1, gradeLabel:'A级', creditLimit:30000, accountPeriod:15, balance:21500, status:1 },
  { id:3, code:'C003', name:'好再来超市', grade:2, gradeLabel:'B级', creditLimit:20000, accountPeriod:30, balance:12800, status:1 },
  { id:4, code:'C004', name:'天天鲜果店', grade:3, gradeLabel:'C级', creditLimit:10000, accountPeriod:0, balance:3500, status:1 },
  { id:5, code:'C005', name:'欣旺达二批', grade:2, gradeLabel:'B级', creditLimit:40000, accountPeriod:45, balance:34000, status:1 },
]

// 客户分级价(A 级 0.85, B 级 0.92, C 级 1.0)
function getGradePrice(retailPrice, grade) {
  const ratio = grade === 1 ? 0.85 : grade === 2 ? 0.92 : 1.0
  return Number((retailPrice * ratio).toFixed(2))
}

// 临期状态:剩 ≤7 天 danger, ≤30 天 warning, 过期 danger, 其他 success
function getExpiryStatus(expiryDate) {
  const today = new Date('2026-09-17')
  const exp = new Date(expiryDate)
  const diffDays = Math.floor((exp - today) / (1000*60*60*24))
  if (diffDays < 0) return { type:'expired', label:'已过期', days: diffDays }
  if (diffDays <= 7) return { type:'danger', label: `剩${diffDays}天`, days: diffDays }
  if (diffDays <= 30) return { type:'warning', label: `剩${diffDays}天`, days: diffDays }
  return { type:'success', label: `剩${diffDays}天`, days: diffDays }
}

// 7 日销售趋势(KPI 看板用)
const salesTrend7d = [
  { date:'09-11', amount: 720 },
  { date:'09-12', amount: 950 },
  { date:'09-13', amount: 1100 },
  { date:'09-14', amount: 860 },
  { date:'09-15', amount: 1240 },
  { date:'09-16', amount: 980 },
  { date:'09-17', amount: 830 },
]

// Top10 商品销售排行
const top10Products = [
  { name: '可口可乐 330ml', qty: 320, amount: 640 },
  { name: '康师傅红烧牛肉面 5包', qty: 280, amount: 700 },
  { name: '农夫山泉 550ml', qty: 250, amount: 375 },
  { name: '统一老坛酸菜面 5包', qty: 200, amount: 500 },
  { name: '康师傅冰红茶 500ml', qty: 180, amount: 450 },
  { name: '王老吉凉茶 310ml', qty: 150, amount: 525 },
  { name: '奥利奥原味饼干 116g', qty: 120, amount: 600 },
  { name: '达利园法式软面包 360g', qty: 100, amount: 650 },
  { name: '康师傅绿茶 500ml', qty: 90, amount: 225 },
  { name: '旺旺仙贝 50g', qty: 80, amount: 120 },
]

// 应收账龄分桶(按客户)
const agingBuckets = ['0-30天', '31-60天', '61-90天', '91-180天', '180天以上']
// 5 个客户的账龄分布
const receivables = [
  { customerId:1, customerName:'城市便利连锁', creditLimit:50000, accountPeriod:30, balance:18300, aging:[12000, 5000, 1300, 0, 0] },
  { customerId:2, customerName:'福满楼餐饮', creditLimit:30000, accountPeriod:15, balance:21500, aging:[8000, 9000, 3500, 1000, 0] },
  { customerId:3, customerName:'好再来超市', creditLimit:20000, accountPeriod:30, balance:12800, aging:[6800, 4000, 2000, 0, 0] },
  { customerId:4, customerName:'天天鲜果店', creditLimit:10000, accountPeriod:0, balance:3500, aging:[3500, 0, 0, 0, 0] },
  { customerId:5, customerName:'欣旺达二批', creditLimit:40000, accountPeriod:45, balance:34000, aging:[10000, 12000, 8000, 3000, 1000] },
]

// 销售单流水(对账单用,客户 1)
const salesOrders = [
  { no:'XS20260901-001', date:'2026-09-01', customerId:1, amount:3200, paid:0, type:'销售' },
  { no:'XS20260903-002', date:'2026-09-03', customerId:1, amount:2800, paid:0, type:'销售' },
  { no:'XS20260905-003', date:'2026-09-05', customerId:1, amount:1500, paid:0, type:'销售' },
  { no:'SK20260905-001', date:'2026-09-05', customerId:1, amount:2000, paid:2000, type:'收款' },
  { no:'XS20260908-004', date:'2026-09-08', customerId:1, amount:4500, paid:0, type:'销售' },
  { no:'XS20260912-005', date:'2026-09-12', customerId:1, amount:1800, paid:0, type:'销售' },
  { no:'SK20260912-002', date:'2026-09-12', customerId:1, amount:3500, paid:3500, type:'收款' },
  { no:'XS20260915-006', date:'2026-09-15', customerId:1, amount:2600, paid:0, type:'销售' },
]

// 站内消息(顶部铃铛)
const messages = [
  { id:1, title:'临期预警:DN20260901 批次酸奶剩余 5 天到期', read:false },
  { id:2, title:'应收逾期:欣旺达二批 账期 45 天,欠款 ¥34000', read:false },
  { id:3, title:'证照过期:供应商"益海嘉里"食品经营许可证已过期', read:false },
  { id:4, title:'库存预警:王老吉凉茶 310ml 已过期,已自动冻结销售', read:true },
  { id:5, title:'采购审批:采购单 CG20260917-001 待老板审批', read:true },
]

// KPI 看板汇总数据
const kpiSummary = {
  todaySales: 830,           // 今日销售额
  receivableTotal: 90100,    // 应收总额
  expiringCount: 3,          // 临期商品数(<=30 天)
  expiredCount: 1,           // 过期商品数
  stockAmount: 4196,         // 库存总金额
}

// 生成下一个销售单号
function genSalesOrderNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const seq = String(Math.floor(Math.random()*900)+100)
  return `XS${ymd}-${seq}`
}

// 计算商品批次剩余库存合计
function getProductStock(productId) {
  return batches.filter(b => b.productId === productId && b.status === 1).reduce((s,b) => s + b.remainingQty, 0)
}

// 计算商品库存金额(按最新成本价)
function getStockAmount() {
  return batches.filter(b => b.status === 1).reduce((s,b) => {
    const p = products.find(x => x.id === b.productId)
    return s + (p ? p.costPrice * b.remainingQty : 0)
  }, 0)
}

// 取某商品的批次列表(用于开单 FIFO 匹配)
function pickBatchByFIFO(productId, qty) {
  const list = batches
    .filter(b => b.productId === productId && b.status === 1 && b.remainingQty > 0)
    .sort((a,b) => new Date(a.productionDate) - new Date(b.productionDate))
  const result = []
  let remain = qty
  for (const b of list) {
    if (remain <= 0) break
    const take = Math.min(remain, b.remainingQty)
    result.push({ batchNo: b.batchNo, qty: take, productionDate: b.productionDate, expiryDate: b.expiryDate })
    remain -= take
  }
  return result
}

// 导出供其他模块使用(ES6 模块语法在浏览器中需要 type="module")
// 这里直接挂到 window 上,避免模块加载跨域问题(file:// 协议下 import 会被 CORS 拦截)
window.DB = {
  products, batches, warehouses, customers, messages,
  salesTrend7d, top10Products, receivables, agingBuckets,
  salesOrders, kpiSummary,
  getGradePrice, getExpiryStatus,
  getProductStock, getStockAmount, pickBatchByFIFO,
  genSalesOrderNo,
}

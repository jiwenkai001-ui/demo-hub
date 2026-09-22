import dayjs from 'dayjs'

const now = dayjs()

// 商品分类
export const categories = [
  { id: 1, name: '方便面', parentId: 0 },
  { id: 2, name: '碳酸饮料', parentId: 0 },
  { id: 3, name: '饮用水', parentId: 0 },
  { id: 4, name: '乳制品', parentId: 0 },
  { id: 5, name: '休闲零食', parentId: 0 },
  { id: 6, name: '糕点', parentId: 0 },
  { id: 7, name: '功能饮料', parentId: 0 },
  { id: 8, name: '植物饮料', parentId: 0 },
]

// 计量单位组
export const unitGroups = [
  { id: 1, name: '箱-包-瓶', baseUnit: '瓶', units: [
    { unit: '箱', ratio: 24, isBase: false },
    { unit: '包', ratio: 6, isBase: false },
    { unit: '瓶', ratio: 1, isBase: true },
  ]},
  { id: 2, name: '箱-袋', baseUnit: '袋', units: [
    { unit: '箱', ratio: 40, isBase: false },
    { unit: '袋', ratio: 1, isBase: true },
  ]},
  { id: 3, name: '箱-罐', baseUnit: '罐', units: [
    { unit: '箱', ratio: 24, isBase: false },
    { unit: '罐', ratio: 1, isBase: true },
  ]},
]

// 商品档案
export const products = [
  { id: 1, code: 'SP-001', barcode: '6901234567890', name: '康师傅红烧牛肉面', spec: '105g/袋', categoryId: 1, categoryName: '方便面',
    mainUnit: '袋', unitGroupId: 2, shelfLifeDays: 180, costPrice: 1.85, retailPrice: 2.5, status: 1, image: '',
    supplierIds: [1, 2], minStock: 50, maxStock: 500, purchasePrices: [
      { date: '2026-07-01', price: 1.80, supplierId: 1 },
      { date: '2026-08-01', price: 1.85, supplierId: 2 },
    ]},
  { id: 2, code: 'SP-002', barcode: '6901234567891', name: '统一老坛酸菜面', spec: '108g/袋', categoryId: 1, categoryName: '方便面',
    mainUnit: '袋', unitGroupId: 2, shelfLifeDays: 180, costPrice: 1.92, retailPrice: 2.5, status: 1, image: '',
    supplierIds: [1], minStock: 30, maxStock: 300, purchasePrices: [{ date: '2026-08-15', price: 1.92, supplierId: 1 }] },
  { id: 3, code: 'SP-003', barcode: '6901234567892', name: '可口可乐', spec: '330ml/罐', categoryId: 2, categoryName: '碳酸饮料',
    mainUnit: '罐', unitGroupId: 3, shelfLifeDays: 270, costPrice: 1.6, retailPrice: 2.2, status: 1, image: '',
    supplierIds: [3], minStock: 100, maxStock: 1000, purchasePrices: [{ date: '2026-08-20', price: 1.60, supplierId: 3 }] },
  { id: 4, code: 'SP-004', barcode: '6901234567893', name: '农夫山泉矿泉水', spec: '550ml/瓶', categoryId: 3, categoryName: '饮用水',
    mainUnit: '瓶', unitGroupId: 1, shelfLifeDays: 365, costPrice: 0.85, retailPrice: 1.5, status: 1, image: '',
    supplierIds: [4], minStock: 200, maxStock: 2000, purchasePrices: [{ date: '2026-06-10', price: 0.85, supplierId: 4 }] },
  { id: 5, code: 'SP-005', barcode: '6901234567894', name: '达利园蛋黄派', spec: '1000g/箱', categoryId: 6, categoryName: '糕点',
    mainUnit: '箱', unitGroupId: 2, shelfLifeDays: 90, costPrice: 32, retailPrice: 45, status: 1, image: '',
    supplierIds: [2], minStock: 10, maxStock: 100, purchasePrices: [{ date: '2026-07-01', price: 32, supplierId: 2 }] },
  { id: 6, code: 'SP-006', barcode: '6901234567895', name: '旺旺雪饼', spec: '500g/包', categoryId: 5, categoryName: '休闲零食',
    mainUnit: '包', unitGroupId: 2, shelfLifeDays: 240, costPrice: 18, retailPrice: 28, status: 1, image: '',
    supplierIds: [2], minStock: 20, maxStock: 200, purchasePrices: [{ date: '2026-08-01', price: 18, supplierId: 2 }] },
  { id: 7, code: 'SP-007', barcode: '6901234567896', name: '蒙牛纯牛奶', spec: '250ml*24/箱', categoryId: 4, categoryName: '乳制品',
    mainUnit: '箱', unitGroupId: 1, shelfLifeDays: 60, costPrice: 45, retailPrice: 59, status: 1, image: '',
    supplierIds: [1], minStock: 15, maxStock: 150, purchasePrices: [{ date: '2026-09-01', price: 45, supplierId: 1 }] },
  { id: 8, code: 'SP-008', barcode: '6901234567897', name: '伊利安慕希', spec: '250ml*12/箱', categoryId: 4, categoryName: '乳制品',
    mainUnit: '箱', unitGroupId: 1, shelfLifeDays: 90, costPrice: 38, retailPrice: 52, status: 1, image: '',
    supplierIds: [1], minStock: 10, maxStock: 100, purchasePrices: [{ date: '2026-06-15', price: 38, supplierId: 1 }] },
  { id: 9, code: 'SP-009', barcode: '6901234567898', name: '乐事黄瓜味薯片', spec: '104g/袋', categoryId: 5, categoryName: '休闲零食',
    mainUnit: '袋', unitGroupId: 2, shelfLifeDays: 270, costPrice: 4.5, retailPrice: 6.5, status: 1, image: '',
    supplierIds: [3], minStock: 30, maxStock: 300, purchasePrices: [{ date: '2026-07-01', price: 4.5, supplierId: 3 }] },
  { id: 10, code: 'SP-010', barcode: '6901234567899', name: '王老吉凉茶', spec: '310ml/罐', categoryId: 7, categoryName: '功能饮料',
    mainUnit: '罐', unitGroupId: 3, shelfLifeDays: 365, costPrice: 2.4, retailPrice: 3.5, status: 1, image: '',
    supplierIds: [4], minStock: 50, maxStock: 500, purchasePrices: [{ date: '2026-01-01', price: 2.4, supplierId: 4 }] },
  { id: 11, code: 'SP-011', barcode: '6901234568000', name: '椰树椰汁', spec: '245ml/罐', categoryId: 8, categoryName: '植物饮料',
    mainUnit: '罐', unitGroupId: 3, shelfLifeDays: 540, costPrice: 2.6, retailPrice: 3.8, status: 2, image: '',
    supplierIds: [3], minStock: 20, maxStock: 200, purchasePrices: [{ date: '2026-03-15', price: 2.6, supplierId: 3 }] },
]

// 批次库存
export const batches = [
  { id: 1, batchNo: 'MN20260901', productId: 7, productionDate: now.subtract(20, 'day').format('YYYY-MM-DD'), expiryDate: now.add(40, 'day').format('YYYY-MM-DD'), remainingQty: 25, warehouseId: 1, status: 1, supplierId: 1, inboundDate: now.subtract(18, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260901-001' },
  { id: 2, batchNo: 'MN20260720', productId: 7, productionDate: now.subtract(50, 'day').format('YYYY-MM-DD'), expiryDate: now.add(10, 'day').format('YYYY-MM-DD'), remainingQty: 8, warehouseId: 1, status: 1, supplierId: 1, inboundDate: now.subtract(48, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260720-001' },
  { id: 3, batchNo: 'YL20260615', productId: 8, productionDate: now.subtract(80, 'day').format('YYYY-MM-DD'), expiryDate: now.add(5, 'day').format('YYYY-MM-DD'), remainingQty: 3, warehouseId: 1, status: 1, supplierId: 1, inboundDate: now.subtract(78, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260615-001' },
  { id: 4, batchNo: 'DLY20260701', productId: 5, productionDate: now.subtract(60, 'day').format('YYYY-MM-DD'), expiryDate: now.add(30, 'day').format('YYYY-MM-DD'), remainingQty: 12, warehouseId: 1, status: 1, supplierId: 2, inboundDate: now.subtract(58, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260701-002' },
  { id: 5, batchNo: 'WLJ20240101', productId: 10, productionDate: now.subtract(560, 'day').format('YYYY-MM-DD'), expiryDate: now.subtract(20, 'day').format('YYYY-MM-DD'), remainingQty: 4, warehouseId: 1, status: 3, supplierId: 4, inboundDate: now.subtract(558, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20240101-001' },
  { id: 6, batchNo: 'YZ20260315', productId: 11, productionDate: now.subtract(180, 'day').format('YYYY-MM-DD'), expiryDate: now.add(360, 'day').format('YYYY-MM-DD'), remainingQty: 6, warehouseId: 1, status: 1, supplierId: 3, inboundDate: now.subtract(178, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260315-001' },
  { id: 7, batchNo: 'KF20260801', productId: 1, productionDate: now.subtract(46, 'day').format('YYYY-MM-DD'), expiryDate: now.add(134, 'day').format('YYYY-MM-DD'), remainingQty: 120, warehouseId: 1, status: 1, supplierId: 2, inboundDate: now.subtract(44, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260801-001' },
  { id: 8, batchNo: 'KF20260815', productId: 1, productionDate: now.subtract(32, 'day').format('YYYY-MM-DD'), expiryDate: now.add(148, 'day').format('YYYY-MM-DD'), remainingQty: 80, warehouseId: 2, status: 1, supplierId: 1, inboundDate: now.subtract(30, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260815-002' },
  { id: 9, batchNo: 'TY20260901', productId: 2, productionDate: now.subtract(15, 'day').format('YYYY-MM-DD'), expiryDate: now.add(165, 'day').format('YYYY-MM-DD'), remainingQty: 90, warehouseId: 1, status: 1, supplierId: 1, inboundDate: now.subtract(13, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260901-002' },
  { id: 10, batchNo: 'CO20260820', productId: 3, productionDate: now.subtract(27, 'day').format('YYYY-MM-DD'), expiryDate: now.add(243, 'day').format('YYYY-MM-DD'), remainingQty: 200, warehouseId: 1, status: 1, supplierId: 3, inboundDate: now.subtract(25, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260820-001' },
  { id: 11, batchNo: 'NF20260610', productId: 4, productionDate: now.subtract(98, 'day').format('YYYY-MM-DD'), expiryDate: now.add(267, 'day').format('YYYY-MM-DD'), remainingQty: 500, warehouseId: 1, status: 1, supplierId: 4, inboundDate: now.subtract(96, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260610-001' },
  { id: 12, batchNo: 'WW20260801', productId: 6, productionDate: now.subtract(46, 'day').format('YYYY-MM-DD'), expiryDate: now.add(194, 'day').format('YYYY-MM-DD'), remainingQty: 35, warehouseId: 1, status: 1, supplierId: 2, inboundDate: now.subtract(44, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260801-003' },
  { id: 13, batchNo: 'LS20260701', productId: 9, productionDate: now.subtract(77, 'day').format('YYYY-MM-DD'), expiryDate: now.add(193, 'day').format('YYYY-MM-DD'), remainingQty: 60, warehouseId: 1, status: 1, supplierId: 3, inboundDate: now.subtract(75, 'day').format('YYYY-MM-DD'), inboundNo: 'RK20260701-001' },
]

// 仓库
export const warehouses = [
  { id: 1, name: '档口仓库', address: '批发市场A区12号' },
  { id: 2, name: '后备库房', address: '物流园B栋3楼' },
]

// 汇总库存（按商品+仓库）
export const stockSummary = [
  { productId: 1, warehouseId: 1, qty: 120 }, { productId: 1, warehouseId: 2, qty: 80 },
  { productId: 7, warehouseId: 1, qty: 33 }, { productId: 7, warehouseId: 2, qty: 0 },
  { productId: 8, warehouseId: 1, qty: 3 }, { productId: 8, warehouseId: 2, qty: 0 },
  { productId: 10, warehouseId: 1, qty: 4 }, { productId: 10, warehouseId: 2, qty: 0 },
  { productId: 4, warehouseId: 1, qty: 500 }, { productId: 4, warehouseId: 2, qty: 300 },
  { productId: 5, warehouseId: 1, qty: 12 }, { productId: 5, warehouseId: 2, qty: 0 },
  { productId: 3, warehouseId: 1, qty: 200 }, { productId: 3, warehouseId: 2, qty: 0 },
  { productId: 2, warehouseId: 1, qty: 90 }, { productId: 2, warehouseId: 2, qty: 0 },
  { productId: 6, warehouseId: 1, qty: 35 }, { productId: 6, warehouseId: 2, qty: 0 },
  { productId: 9, warehouseId: 1, qty: 60 }, { productId: 9, warehouseId: 2, qty: 0 },
  { productId: 11, warehouseId: 1, qty: 6 }, { productId: 11, warehouseId: 2, qty: 0 },
]

// 客户
export const customers = [
  { id: 1, code: 'KH-001', name: '城市便利连锁', grade: 1, gradeName: '一级', creditLimit: 50000, accountPeriod: 30, usedCredit: 12800, phone: '13800001111', address: '城区10家连锁店' },
  { id: 2, code: 'KH-002', name: '老王超市', grade: 2, gradeName: '二级', creditLimit: 20000, accountPeriod: 15, usedCredit: 5600, phone: '13800002222', address: '城东菜市场旁' },
  { id: 3, code: 'KH-003', name: '福满楼餐饮', grade: 1, gradeName: '一级', creditLimit: 30000, accountPeriod: 30, usedCredit: 28500, phone: '13800003333', address: '老街美食城2楼' },
  { id: 4, code: 'KH-004', name: '小张便利店', grade: 3, gradeName: '三级', creditLimit: 5000, accountPeriod: 7, usedCredit: 1200, phone: '13800004444', address: '小区门口' },
  { id: 5, code: 'KH-005', name: '兴隆二批', grade: 2, gradeName: '二级', creditLimit: 80000, accountPeriod: 45, usedCredit: 42000, phone: '13800005555', address: '批发市场B区5号' },
]

// 供应商
export const suppliers = [
  { id: 1, name: '蒙牛乳业华南分公司', code: 'GYS-001', contact: '李经理', phone: '13900001111', address: '广州开发区蒙牛路', businessLicense: '91440101MA5XXXXX', foodLicense: 'SC10530130101234', certs: [
    { name: '营业执照', fileName: '蒙牛营业执照.pdf', uploadDate: '2026-01-10' },
    { name: '食品生产许可证', fileName: '蒙牛食品生产许可.pdf', uploadDate: '2026-01-10' },
    { name: '检验报告', fileName: '蒙牛检验报告202606.pdf', uploadDate: '2026-06-15' },
  ]},
  { id: 2, name: '达利园食品商贸', code: 'GYS-002', contact: '王总', phone: '13900002222', address: '福州仓山区达利路', businessLicense: '91350104MA0XXXXX', foodLicense: 'SC11435010401234', certs: [
    { name: '营业执照', fileName: '达利园营业执照.pdf', uploadDate: '2026-02-01' },
    { name: '食品经营许可证', fileName: '达利园经营许可.pdf', uploadDate: '2026-02-01' },
  ]},
  { id: 3, name: '太古可口可乐分销', code: 'GYS-003', contact: '张经理', phone: '13900003333', address: '上海浦东太古路', businessLicense: '91310115MA1XXXXX', foodLicense: 'SC10131011501234', certs: [
    { name: '营业执照', fileName: '太古营业执照.pdf', uploadDate: '2026-01-05' },
    { name: '食品经营许可证', fileName: '太古经营许可.pdf', uploadDate: '2026-01-05' },
    { name: '检验报告', fileName: '可口可乐检验报告.pdf', uploadDate: '2026-07-20' },
  ]},
  { id: 4, name: '农夫山泉区域代理', code: 'GYS-004', contact: '陈经理', phone: '13900004444', address: '杭州西湖区农夫路', businessLicense: '91330106MA2XXXXX', foodLicense: 'SC10633010601234', certs: [
    { name: '营业执照', fileName: '农夫营业执照.pdf', uploadDate: '2026-03-01' },
    { name: '食品经营许可证', fileName: '农夫经营许可.pdf', uploadDate: '2026-03-01' },
  ]},
]

// 供应商价格本
export const supplierPrices = [
  { supplierId: 1, productId: 7, price: 45, minQty: 10, lastUpdate: '2026-09-01' },
  { supplierId: 1, productId: 8, price: 38, minQty: 10, lastUpdate: '2026-06-15' },
  { supplierId: 1, productId: 1, price: 1.80, minQty: 100, lastUpdate: '2026-07-01' },
  { supplierId: 2, productId: 5, price: 32, minQty: 5, lastUpdate: '2026-07-01' },
  { supplierId: 2, productId: 6, price: 18, minQty: 10, lastUpdate: '2026-08-01' },
  { supplierId: 3, productId: 3, price: 1.60, minQty: 50, lastUpdate: '2026-08-20' },
  { supplierId: 3, productId: 9, price: 4.50, minQty: 30, lastUpdate: '2026-07-01' },
  { supplierId: 3, productId: 11, price: 2.60, minQty: 20, lastUpdate: '2026-03-15' },
  { supplierId: 4, productId: 4, price: 0.85, minQty: 100, lastUpdate: '2026-06-10' },
  { supplierId: 4, productId: 10, price: 2.40, minQty: 50, lastUpdate: '2026-01-01' },
]

// 员工列表
export const employees = [
  { id: 1, username: 'admin', password: '123456', name: '管理员', role: 'admin', roleName: '系统管理员', phone: '13800000001', status: 1, createdAt: '2026-01-01', permissions: ['*'] },
  { id: 2, username: 'sales01', password: '123456', name: '张销售', role: 'sales', roleName: '销售员', phone: '13800000002', status: 1, createdAt: '2026-03-15', permissions: ['sales', 'product', 'stock'] },
  { id: 3, username: 'sales02', password: '123456', name: '李外勤', role: 'field', roleName: '外勤业务员', phone: '13800000003', status: 1, createdAt: '2026-04-01', permissions: ['sales', 'field'] },
  { id: 4, username: 'purchase', password: '123456', name: '王采购', role: 'purchase', roleName: '采购员', phone: '13800000004', status: 1, createdAt: '2026-02-10', permissions: ['purchase', 'product', 'stock'] },
  { id: 5, username: 'stockkeeper', password: '123456', name: '赵库管', role: 'stock', roleName: '仓库管理员', phone: '13800000005', status: 1, createdAt: '2026-01-20', permissions: ['stock', 'product'] },
  { id: 6, username: 'sales03', password: '123456', name: '刘车销', role: 'field', roleName: '外勤业务员', phone: '13800000006', status: 0, createdAt: '2026-05-01', permissions: ['sales', 'field'] },
]

// 角色权限定义
export const roles = [
  { value: 'admin', label: '系统管理员', permissions: ['*'] },
  { value: 'sales', label: '销售员', permissions: ['sales', 'product', 'stock'] },
  { value: 'field', label: '外勤业务员', permissions: ['sales', 'field'] },
  { value: 'purchase', label: '采购员', permissions: ['purchase', 'product', 'stock'] },
  { value: 'stock', label: '仓库管理员', permissions: ['stock', 'product'] },
]

export const permissionModules = [
  { value: 'product', label: '商品档案' },
  { value: 'purchase', label: '采购管理' },
  { value: 'sales', label: '销售管理' },
  { value: 'stock', label: '库存管理' },
  { value: 'employee', label: '员工管理' },
  { value: 'field', label: '外勤车销' },
]

// 销售单
export const salesOrders = [
  { id: 'XS20260916-001', customerName: '城市便利连锁', customerId: 1, items: [
    { productId: 1, name: '康师傅红烧牛肉面', spec: '105g/袋', unit: '袋', qty: 100, price: 2.2, amount: 220, batchNo: 'KF20260801' },
    { productId: 3, name: '可口可乐', spec: '330ml/罐', unit: '罐', qty: 120, price: 2, amount: 240, batchNo: 'CO20260820' },
  ], totalAmount: 460, discount: 0, payAmount: 460, createdAt: now.format('YYYY-MM-DD HH:mm'), status: 'submitted', salesman: '张销售' },
  { id: 'XS20260916-002', customerName: '福满楼餐饮', customerId: 3, items: [
    { productId: 7, name: '蒙牛纯牛奶', spec: '250ml*24/箱', unit: '箱', qty: 5, price: 55, amount: 275, batchNo: 'MN20260901' },
    { productId: 8, name: '伊利安慕希', spec: '250ml*12/箱', unit: '箱', qty: 2, price: 50, amount: 100, batchNo: 'YL20260615' },
  ], totalAmount: 375, discount: 5, payAmount: 370, createdAt: now.format('YYYY-MM-DD HH:mm'), status: 'submitted', salesman: '张销售' },
]

// 采购订单
export const purchaseOrders = [
  { id: 'CG20260915-001', supplierId: 1, supplierName: '蒙牛乳业华南分公司', items: [
    { productId: 7, name: '蒙牛纯牛奶', spec: '250ml*24/箱', unit: '箱', qty: 30, price: 45, amount: 1350 },
  ], totalAmount: 1350, prepayAmount: 500, freight: 50, freightAlloc: true, status: 'inbound', createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), buyer: '王采购', inboundNo: 'RK20260915-001' },
  { id: 'CG20260910-002', supplierId: 3, supplierName: '太古可口可乐分销', items: [
    { productId: 3, name: '可口可乐', spec: '330ml/罐', unit: '箱', qty: 20, price: 38.4, amount: 768 },
  ], totalAmount: 768, prepayAmount: 0, freight: 30, freightAlloc: true, status: 'pending', createdAt: now.subtract(6, 'day').format('YYYY-MM-DD HH:mm'), buyer: '王采购', inboundNo: '' },
]

// 进货台账（索证索票记录）
export const purchaseLedger = [
  { id: 1, inboundNo: 'RK20260901-001', supplierId: 1, supplierName: '蒙牛乳业华南分公司', productId: 7, productName: '蒙牛纯牛奶', batchNo: 'MN20260901', productionDate: now.subtract(20, 'day').format('YYYY-MM-DD'), expiryDate: now.add(40, 'day').format('YYYY-MM-DD'), qty: 30, unit: '箱', certStatus: 'complete', certFiles: ['蒙牛检验报告202606.pdf', '蒙牛食品生产许可.pdf'], invoiceNo: 'FP20260901-001', invoiceAmount: 1350, inboundDate: now.subtract(18, 'day').format('YYYY-MM-DD') },
  { id: 2, inboundNo: 'RK20260820-001', supplierId: 3, supplierName: '太古可口可乐分销', productId: 3, productName: '可口可乐', batchNo: 'CO20260820', productionDate: now.subtract(27, 'day').format('YYYY-MM-DD'), expiryDate: now.add(243, 'day').format('YYYY-MM-DD'), qty: 10, unit: '箱', certStatus: 'complete', certFiles: ['可口可乐检验报告.pdf'], invoiceNo: 'FP20260820-003', invoiceAmount: 384, inboundDate: now.subtract(25, 'day').format('YYYY-MM-DD') },
  { id: 3, inboundNo: 'RK20260701-002', supplierId: 2, supplierName: '达利园食品商贸', productId: 5, productName: '达利园蛋黄派', batchNo: 'DLY20260701', productionDate: now.subtract(60, 'day').format('YYYY-MM-DD'), expiryDate: now.add(30, 'day').format('YYYY-MM-DD'), qty: 15, unit: '箱', certStatus: 'partial', certFiles: ['达利园营业执照.pdf'], invoiceNo: 'FP20260701-005', invoiceAmount: 480, inboundDate: now.subtract(58, 'day').format('YYYY-MM-DD') },
]

// 应收台账
export const receivables = [
  { customerName: '城市便利连锁', period: 30, amount: 12800, age30: 5000, age60: 7800, age90: 0, age180: 0 },
  { customerName: '老王超市', period: 15, amount: 5600, age30: 3000, age60: 2600, age90: 0, age180: 0 },
  { customerName: '福满楼餐饮', period: 30, amount: 28500, age30: 8000, age60: 10000, age90: 9500, age180: 1000 },
  { customerName: '小张便利店', period: 7, amount: 1200, age30: 1200, age60: 0, age90: 0, age180: 0 },
  { customerName: '兴隆二批', period: 45, amount: 42000, age30: 12000, age60: 15000, age90: 10000, age180: 5000 },
]

// 站内消息
export const messages = [
  { id: 'm1', title: '【临期预警】伊利安慕希 批次 YL20260615 剩余 5 天,库存 3 箱', type: 'near_expiry', read: false, time: now.format('MM-DD HH:mm') },
  { id: 'm2', title: '【逾期应收】福满楼餐饮欠款 28500 元已超账期 30 天', type: 'overdue', read: false, time: now.format('MM-DD HH:mm') },
  { id: 'm3', title: '【过期商品】王老吉凉茶 批次 WLJ20240101 已过期,自动冻结销售', type: 'expired', read: true, time: now.subtract(1, 'day').format('MM-DD 18:00') },
  { id: 'm4', title: '【审批待办】兴隆二批超额赊销申请需审批', type: 'approval', read: false, time: now.format('MM-DD 10:15') },
  { id: 'm5', title: '【库存预警】蒙牛纯牛奶 库存仅 33 箱,低于下限 15 箱', type: 'low_stock', read: false, time: now.format('MM-DD 09:00') },
]

// 调拨单
export const transferOrders = [
  { id: 'DB20260915-001', fromWarehouseId: 2, fromWarehouseName: '后备库房', toWarehouseId: 1, toWarehouseName: '档口仓库', items: [{ productId: 1, name: '康师傅红烧牛肉面', qty: 50, unit: '袋', batchNo: 'KF20260815' }], status: 'completed', createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), operator: '赵库管' },
  { id: 'DB20260910-002', fromWarehouseId: 1, fromWarehouseName: '档口仓库', toWarehouseId: 2, toWarehouseName: '后备库房', items: [{ productId: 4, name: '农夫山泉矿泉水', qty: 200, unit: '瓶', batchNo: 'NF20260610' }], status: 'completed', createdAt: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm'), operator: '赵库管' },
]

// 盘点单
export const stockCounts = [
  { id: 'PD20260915-001', warehouseId: 1, warehouseName: '档口仓库', items: [
    { productId: 1, name: '康师傅红烧牛肉面', bookQty: 120, actualQty: 118, diff: -2, unit: '袋', batchNo: 'KF20260801' },
    { productId: 7, name: '蒙牛纯牛奶', bookQty: 33, actualQty: 33, diff: 0, unit: '箱', batchNo: 'MN20260901' },
    { productId: 10, name: '王老吉凉茶', bookQty: 4, actualQty: 3, diff: -1, unit: '罐', batchNo: 'WLJ20240101' },
  ], status: 'completed', createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), operator: '赵库管' },
]

// 外勤签到记录
export const fieldVisits = [
  { id: 1, salesman: '李外勤', customerId: 1, customerName: '城市便利连锁', checkInTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'), checkOutTime: '', status: 'visiting', address: '城区10家连锁店', photos: 2, orderAmount: 0 },
  { id: 2, salesman: '李外勤', customerId: 2, customerName: '老王超市', checkInTime: now.subtract(5, 'hour').format('YYYY-MM-DD HH:mm'), checkOutTime: now.subtract(3, 'hour').format('YYYY-MM-DD HH:mm'), status: 'completed', address: '城东菜市场旁', photos: 3, orderAmount: 560 },
  { id: 3, salesman: '李外勤', customerId: 3, customerName: '福满楼餐饮', checkInTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), checkOutTime: now.subtract(1, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm'), status: 'completed', address: '老街美食城2楼', photos: 5, orderAmount: 370 },
]

// 销售退货单
export const salesReturns = [
  { id: 'TH20260914-001', customerName: '老王超市', originalOrder: 'XS20260910-003', items: [
    { productId: 7, name: '蒙牛纯牛奶', batchNo: 'MN20260901', qty: 2, unit: '箱', reason: '包装破损' },
  ], totalAmount: 90, status: 'pending', createdAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm') },
]

// 商品组合（组装拆分）
export const productCombos = [
  { id: 1, name: '休闲大礼包', comboItems: [{ productId: 6, name: '旺旺雪饼', qty: 1 }, { productId: 9, name: '乐事黄瓜味薯片', qty: 2 }], salePrice: 38, costPrice: 27 },
]

// 采购退货单
export const purchaseReturns = [
  { id: 'CGTH20260912-001', supplierId: 2, supplierName: '达利园食品商贸', items: [
    { productId: 5, name: '达利园蛋黄派', batchNo: 'DLY20260701', qty: 2, unit: '箱', reason: '临近过期' },
  ], totalAmount: 64, status: 'pending', createdAt: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm') },
]

// 工具函数：保质期状态计算
export function getExpiryStatus(expiryDate) {
  const diff = dayjs(expiryDate).diff(now, 'day')
  if (diff < 0) return { label: '已过期', type: 'expired', color: '#ee0a24' }
  if (diff <= 7) return { label: `剩${diff}天`, type: 'danger', color: '#ee0a24' }
  if (diff <= 15) return { label: `剩${diff}天`, type: 'warning', color: '#ff976a' }
  if (diff <= 30) return { label: `剩${diff}天`, type: 'warning', color: '#ff976a' }
  return { label: `剩${diff}天`, type: 'normal', color: '#07c160' }
}

// FIFO 分配
export function allocateFIFO(productId, qty) {
  const available = batches.filter(b => b.productId === productId && b.status === 1 && b.remainingQty > 0)
    .sort((a, b) => dayjs(a.productionDate).valueOf() - dayjs(b.productionDate).valueOf())
  const result = []
  let remaining = qty
  for (const b of available) {
    if (remaining <= 0) break
    const alloc = Math.min(remaining, b.remainingQty)
    result.push({ batchNo: b.batchNo, qty: alloc })
    remaining -= alloc
  }
  return result
}

// 客户分级定价
export function getGradePrice(product, grade) {
  if (grade === 1) return +(product.retailPrice * 0.88).toFixed(2)
  if (grade === 2) return +(product.retailPrice * 0.95).toFixed(2)
  return product.retailPrice
}

// 历史销售统计（用于智能补货）
export const salesHistory = [
  { productId: 7, dailyAvg: 3, weeklySales: 21, monthlySales: 84, trend: 'up' },
  { productId: 8, dailyAvg: 2, weeklySales: 14, monthlySales: 56, trend: 'down' },
  { productId: 1, dailyAvg: 15, weeklySales: 105, monthlySales: 420, trend: 'stable' },
  { productId: 3, dailyAvg: 10, weeklySales: 70, monthlySales: 280, trend: 'up' },
  { productId: 4, dailyAvg: 25, weeklySales: 175, monthlySales: 700, trend: 'stable' },
  { productId: 10, dailyAvg: 0, weeklySales: 0, monthlySales: 4, trend: 'down' },
]

// ========= mock 数据:预包装食品批发场景 =========
// 包含商品、客户、仓库、批次、库存、销售单、应收台账,数据贴近真实档口经营
import dayjs from 'dayjs'

export interface Product {
  id: number
  code: string
  barcode: string
  name: string
  spec: string
  category: string
  mainUnit: string
  shelfLifeDays: number
  costPrice: number
  retailPrice: number
  status: 1 | 2 | 3
  image: string
}

export interface Batch {
  batchNo: string
  productId: number
  productionDate: string
  expiryDate: string
  remainingQty: number
  status: 1 | 2 | 3
}

export interface Customer {
  id: number
  code: string
  name: string
  grade: 1 | 2 | 3
  creditLimit: number
  accountPeriod: number
  usedCredit: number
}

export interface Warehouse {
  id: number
  name: string
}

export interface StockItem {
  productId: number
  warehouseId: number
  qty: number
}

export interface SalesItem {
  productId: number
  name: string
  spec: string
  unit: string
  qty: number
  price: number
  amount: number
  batchNo: string
  isGift?: boolean
}

export interface SalesOrder {
  id: string
  customerName: string
  items: SalesItem[]
  totalAmount: number
  discount: number
  payAmount: number
  createdAt: string
  status: 'draft' | 'submitted'
}

export interface Receivable {
  customerName: string
  period: number
  amount: number
  age30: number
  age60: number
  age90: number
  age180: number
}

// 商品档案(11 条,食品行业典型品类)
export const products: Product[] = [
  { id: 1, code: 'SP-001', barcode: '6901234567890', name: '康师傅红烧牛肉面', spec: '105g/袋', category: '方便面', mainUnit: '袋', shelfLifeDays: 180, costPrice: 1.85, retailPrice: 2.5, status: 1, image: '' },
  { id: 2, code: 'SP-002', barcode: '6901234567891', name: '统一老坛酸菜面', spec: '108g/袋', category: '方便面', mainUnit: '袋', shelfLifeDays: 180, costPrice: 1.92, retailPrice: 2.5, status: 1, image: '' },
  { id: 3, code: 'SP-003', barcode: '6901234567892', name: '可口可乐', spec: '330ml/罐', category: '碳酸饮料', mainUnit: '罐', shelfLifeDays: 270, costPrice: 1.6, retailPrice: 2.2, status: 1, image: '' },
  { id: 4, code: 'SP-004', barcode: '6901234567893', name: '农夫山泉矿泉水', spec: '550ml/瓶', category: '饮用水', mainUnit: '瓶', shelfLifeDays: 365, costPrice: 0.85, retailPrice: 1.5, status: 1, image: '' },
  { id: 5, code: 'SP-005', barcode: '6901234567894', name: '达利园蛋黄派', spec: '1000g/箱', category: '糕点', mainUnit: '箱', shelfLifeDays: 90, costPrice: 32, retailPrice: 45, status: 1, image: '' },
  { id: 6, code: 'SP-006', barcode: '6901234567895', name: '旺旺雪饼', spec: '500g/包', category: '休闲零食', mainUnit: '包', shelfLifeDays: 240, costPrice: 18, retailPrice: 28, status: 1, image: '' },
  { id: 7, code: 'SP-007', barcode: '6901234567896', name: '蒙牛纯牛奶', spec: '250ml*24/箱', category: '乳制品', mainUnit: '箱', shelfLifeDays: 60, costPrice: 45, retailPrice: 59, status: 1, image: '' },
  { id: 8, code: 'SP-008', barcode: '6901234567897', name: '伊利安慕希', spec: '250ml*12/箱', category: '乳制品', mainUnit: '箱', shelfLifeDays: 90, costPrice: 38, retailPrice: 52, status: 1, image: '' },
  { id: 9, code: 'SP-009', barcode: '6901234567898', name: '乐事黄瓜味薯片', spec: '104g/袋', category: '休闲零食', mainUnit: '袋', shelfLifeDays: 270, costPrice: 4.5, retailPrice: 6.5, status: 1, image: '' },
  { id: 10, code: 'SP-010', barcode: '6901234567899', name: '王老吉凉茶', spec: '310ml/罐', category: '功能饮料', mainUnit: '罐', shelfLifeDays: 365, costPrice: 2.4, retailPrice: 3.5, status: 1, image: '' },
  { id: 11, code: 'SP-011', barcode: '6901234568000', name: '椰树椰汁', spec: '245ml/罐', category: '植物饮料', mainUnit: '罐', shelfLifeDays: 540, costPrice: 2.6, retailPrice: 3.8, status: 2, image: '' },
]

// 批次数据(体现食品批次/保质期/临期)
const today = dayjs()
export const batches: Batch[] = [
  // 蒙牛纯牛奶:近期生产,正常在库
  { batchNo: 'MN20260901', productId: 7, productionDate: today.subtract(20, 'day').format('YYYY-MM-DD'), expiryDate: today.add(40, 'day').format('YYYY-MM-DD'), remainingQty: 25, status: 1 },
  // 蒙牛:临界 15 天,触发临期预警
  { batchNo: 'MN20260720', productId: 7, productionDate: today.subtract(50, 'day').format('YYYY-MM-DD'), expiryDate: today.add(10, 'day').format('YYYY-MM-DD'), remainingQty: 8, status: 1 },
  // 伊利安慕希:临界 7 天,触发红色临期预警
  { batchNo: 'YL20260615', productId: 8, productionDate: today.subtract(80, 'day').format('YYYY-MM-DD'), expiryDate: today.add(5, 'day').format('YYYY-MM-DD'), remainingQty: 3, status: 1 },
  // 达利园蛋黄派:保质期 90 天,临界 30 天
  { batchNo: 'DLY20260701', productId: 5, productionDate: today.subtract(60, 'day').format('YYYY-MM-DD'), expiryDate: today.add(30, 'day').format('YYYY-MM-DD'), remainingQty: 12, status: 1 },
  // 王老吉:已过期(540 天)
  { batchNo: 'WLJ20240101', productId: 10, productionDate: today.subtract(560, 'day').format('YYYY-MM-DD'), expiryDate: today.subtract(20, 'day').format('YYYY-MM-DD'), remainingQty: 4, status: 3 },
  // 椰树椰汁:停采批次
  { batchNo: 'YZ20260315', productId: 11, productionDate: today.subtract(180, 'day').format('YYYY-MM-DD'), expiryDate: today.add(360, 'day').format('YYYY-MM-DD'), remainingQty: 6, status: 1 },
  // 康师傅:正常
  { batchNo: 'KF20260801', productId: 1, productionDate: today.subtract(46, 'day').format('YYYY-MM-DD'), expiryDate: today.add(134, 'day').format('YYYY-MM-DD'), remainingQty: 120, status: 1 },
  { batchNo: 'KF20260815', productId: 1, productionDate: today.subtract(32, 'day').format('YYYY-MM-DD'), expiryDate: today.add(148, 'day').format('YYYY-MM-DD'), remainingQty: 80, status: 1 },
  { batchNo: 'TY20260901', productId: 2, productionDate: today.subtract(15, 'day').format('YYYY-MM-DD'), expiryDate: today.add(165, 'day').format('YYYY-MM-DD'), remainingQty: 90, status: 1 },
  { batchNo: 'CO20260820', productId: 3, productionDate: today.subtract(27, 'day').format('YYYY-MM-DD'), expiryDate: today.add(243, 'day').format('YYYY-MM-DD'), remainingQty: 200, status: 1 },
  { batchNo: 'NF20260610', productId: 4, productionDate: today.subtract(98, 'day').format('YYYY-MM-DD'), expiryDate: today.add(267, 'day').format('YYYY-MM-DD'), remainingQty: 500, status: 1 },
  { batchNo: 'WW20260801', productId: 6, productionDate: today.subtract(46, 'day').format('YYYY-MM-DD'), expiryDate: today.add(194, 'day').format('YYYY-MM-DD'), remainingQty: 35, status: 1 },
  { batchNo: 'LS20260701', productId: 9, productionDate: today.subtract(77, 'day').format('YYYY-MM-DD'), expiryDate: today.add(193, 'day').format('YYYY-MM-DD'), remainingQty: 60, status: 1 },
]

// 客户档案(含信用额度)
export const customers: Customer[] = [
  { id: 1, code: 'KH-001', name: '城市便利连锁', grade: 1, creditLimit: 50000, accountPeriod: 30, usedCredit: 12800 },
  { id: 2, code: 'KH-002', name: '老王超市', grade: 2, creditLimit: 20000, accountPeriod: 15, usedCredit: 5600 },
  { id: 3, code: 'KH-003', name: '福满楼餐饮', grade: 1, creditLimit: 30000, accountPeriod: 30, usedCredit: 28500 },
  { id: 4, code: 'KH-004', name: '小张便利店', grade: 3, creditLimit: 5000, accountPeriod: 7, usedCredit: 1200 },
  { id: 5, code: 'KH-005', name: '兴隆二批', grade: 2, creditLimit: 80000, accountPeriod: 45, usedCredit: 42000 },
]

// 仓库
export const warehouses: Warehouse[] = [
  { id: 1, name: '档口仓库' },
  { id: 2, name: '后备库房' },
]

// 各仓库商品库存汇总
export const stocks: StockItem[] = [
  { productId: 1, warehouseId: 1, qty: 200 },
  { productId: 1, warehouseId: 2, qty: 0 },
  { productId: 7, warehouseId: 1, qty: 33 },
  { productId: 8, warehouseId: 1, qty: 3 },
  { productId: 10, warehouseId: 1, qty: 4 },
  { productId: 4, warehouseId: 1, qty: 500 },
  { productId: 4, warehouseId: 2, qty: 300 },
  { productId: 5, warehouseId: 1, qty: 12 },
]

// 销售单(已发生的近 7 天)
export const salesOrders: SalesOrder[] = [
  {
    id: 'XS20260916-001', customerName: '城市便利连锁',
    items: [
      { productId: 1, name: '康师傅红烧牛肉面', spec: '105g/袋', unit: '袋', qty: 100, price: 2.2, amount: 220, batchNo: 'KF20260801' },
      { productId: 3, name: '可口可乐', spec: '330ml/罐', unit: '罐', qty: 120, price: 2.0, amount: 240, batchNo: 'CO20260820' },
    ], totalAmount: 460, discount: 0, payAmount: 460, createdAt: dayjs().format('YYYY-MM-DD HH:mm'), status: 'submitted',
  },
  {
    id: 'XS20260916-002', customerName: '福满楼餐饮',
    items: [
      { productId: 7, name: '蒙牛纯牛奶', spec: '250ml*24/箱', unit: '箱', qty: 5, price: 55, amount: 275, batchNo: 'MN20260901' },
      { productId: 8, name: '伊利安慕希', spec: '250ml*12/箱', unit: '箱', qty: 2, price: 50, amount: 100, batchNo: 'YL20260615' },
    ], totalAmount: 375, discount: 5, payAmount: 370, createdAt: dayjs().format('YYYY-MM-DD HH:mm'), status: 'submitted',
  },
]

// 应收台账(按客户、账龄分桶)
export const receivables: Receivable[] = [
  { customerName: '城市便利连锁', period: 30, amount: 12800, age30: 5000, age60: 7800, age90: 0, age180: 0 },
  { customerName: '老王超市', period: 15, amount: 5600, age30: 3000, age60: 2600, age90: 0, age180: 0 },
  { customerName: '福满楼餐饮', period: 30, amount: 28500, age30: 8000, age60: 10000, age90: 9500, age180: 1000 },
  { customerName: '小张便利店', period: 7, amount: 1200, age30: 1200, age60: 0, age90: 0, age180: 0 },
  { customerName: '兴隆二批', period: 45, amount: 42000, age30: 12000, age60: 15000, age90: 10000, age180: 5000 },
]

// 工具函数:根据到期日计算临期状态(返回 label + type)
export function getExpiryStatus(expiryDate: string): { label: string; type: 'normal' | 'warning' | 'danger' | 'expired' } {
  const diff = dayjs(expiryDate).diff(today, 'day')
  if (diff < 0) return { label: '已过期', type: 'expired' }
  if (diff <= 7) return { label: `剩${diff}天`, type: 'danger' }
  if (diff <= 15) return { label: `剩${diff}天`, type: 'warning' }
  if (diff <= 30) return { label: `剩${diff}天`, type: 'warning' }
  return { label: `剩${diff}天`, type: 'normal' }
}

// 工具函数:按先进先出匹配批次(同一商品按生产日期升序)
export function pickBatchByFIFO(productId: number, needQty: number): { batchNo: string; qty: number }[] {
  return batches
    .filter(b => b.productId === productId && b.status === 1 && b.remainingQty > 0)
    .sort((a, b) => dayjs(a.productionDate).valueOf() - dayjs(b.productionDate).valueOf())
    .reduce<{ batchNo: string; qty: number }[]>((acc, b) => {
      if (needQty <= 0) return acc
      const take = Math.min(needQty, b.remainingQty)
      acc.push({ batchNo: b.batchNo, qty: take })
      needQty -= take
      return acc
    }, [])
}

// 工具函数:根据客户分级获取价格
export function getPriceByGrade(product: Product, grade: 1 | 2 | 3): number {
  // A级客户最优(批发价),C级零售价
  if (grade === 1) return +(product.retailPrice * 0.88).toFixed(2)
  if (grade === 2) return +(product.retailPrice * 0.95).toFixed(2)
  return product.retailPrice
}

// mock 查询 API(模拟延迟)
export function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

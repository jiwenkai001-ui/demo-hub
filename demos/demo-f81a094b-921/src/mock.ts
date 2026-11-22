export type ProductStatus = '正常' | '库存预警' | '滞销'
export type MerchantStatus = '正常经营' | '待续约' | '欠费预警'

export interface Product {
  id: string
  name: string
  brand: string
  category: string
  sku: string
  stock: number
  cost: number
  price: number
  age: number
  status: ProductStatus
}

export interface Merchant {
  id: string
  name: string
  brand: string
  floor: string
  area: number
  model: '固定租金' | '保底+扣点'
  sales: number
  bill: number
  status: MerchantStatus
}

export interface Member {
  id: string
  name: string
  phone: string
  level: '普通卡' | '银卡' | '金卡' | '白金卡'
  points: number
  spend: number
  lastVisit: string
  tag: string
}

export const products: Product[] = [
  { id: 'SKU-1028', name: '轻量跑鞋', brand: 'Nike', category: '运动鞋', sku: 'NK-RUN-42-黑', stock: 18, cost: 229, price: 399, age: 16, status: '正常' },
  { id: 'SKU-1046', name: '经典连帽卫衣', brand: 'Adidas', category: '服饰', sku: 'AD-HOOD-M-灰', stock: 6, cost: 148, price: 269, age: 38, status: '滞销' },
  { id: 'SKU-1083', name: '城市通勤包', brand: 'FILA', category: '箱包', sku: 'FL-BAG-01-米', stock: 4, cost: 188, price: 329, age: 12, status: '库存预警' },
  { id: 'SKU-1117', name: '训练紧身裤', brand: 'Under Armour', category: '运动服', sku: 'UA-TIGHT-S-黑', stock: 26, cost: 119, price: 239, age: 8, status: '正常' },
  { id: 'SKU-1142', name: '轻户外冲锋衣', brand: 'The North Face', category: '户外', sku: 'TNF-SHELL-L-蓝', stock: 9, cost: 466, price: 799, age: 71, status: '滞销' },
]

export const merchants: Merchant[] = [
  { id: 'M-001', name: '运动集合店', brand: 'Nike / Adidas', floor: '1F-A12', area: 186, model: '保底+扣点', sales: 426800, bill: 38412, status: '正常经营' },
  { id: 'M-002', name: 'FILA 生活方式', brand: 'FILA', floor: '1F-A18', area: 128, model: '固定租金', sales: 268400, bill: 22500, status: '待续约' },
  { id: 'M-003', name: '童装优选馆', brand: 'Mini Peace', floor: '2F-B07', area: 92, model: '保底+扣点', sales: 168900, bill: 14580, status: '欠费预警' },
  { id: 'M-004', name: '户外生活馆', brand: 'Columbia', floor: '2F-B12', area: 154, model: '固定租金', sales: 313200, bill: 19800, status: '正常经营' },
  { id: 'M-005', name: '鞋履折扣店', brand: 'Skechers', floor: '1F-A06', area: 110, model: '保底+扣点', sales: 225600, bill: 16840, status: '正常经营' },
]

export const members: Member[] = [
  { id: 'MB-00821', name: '王女士', phone: '138****2180', level: '金卡', points: 2860, spend: 8620, lastVisit: '今天', tag: '运动偏好' },
  { id: 'MB-00820', name: '李先生', phone: '139****0912', level: '银卡', points: 1240, spend: 3380, lastVisit: '3天前', tag: '周末到访' },
  { id: 'MB-00819', name: '张女士', phone: '186****7731', level: '白金卡', points: 9230, spend: 28600, lastVisit: '昨天', tag: '高客单' },
  { id: 'MB-00818', name: '刘先生', phone: '133****4856', level: '普通卡', points: 360, spend: 680, lastVisit: '48天前', tag: '轻度沉睡' },
  { id: 'MB-00817', name: '赵女士', phone: '156****3499', level: '银卡', points: 1750, spend: 4290, lastVisit: '12天前', tag: '乡镇客群' },
]

export const salesTrend = [62, 72, 58, 81, 76, 88, 96]

export const defaultState = {
  products,
  merchants,
  members,
  inventoryAdjustments: 0,
  billsConfirmed: 12,
  couponsIssued: 186,
  ticketsOpen: 4,
}

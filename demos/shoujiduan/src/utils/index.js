import dayjs from 'dayjs'
import { unitGroups } from '@/mock/data'

// 单位换算
export function convertUnit(qty, fromUnit, toUnit, unitGroupId) {
  const group = unitGroups.find(g => g.id === unitGroupId)
  if (!group) return qty
  const fromU = group.units.find(u => u.unit === fromUnit)
  const toU = group.units.find(u => u.unit === toUnit)
  if (!fromU || !toU) return qty
  const baseQty = qty * fromU.ratio
  return baseQty / toU.ratio
}

// 拆零换算（箱 -> 袋/瓶 等）
export function splitToSmall(qty, fromUnit, unitGroupId) {
  const group = unitGroups.find(g => g.id === unitGroupId)
  if (!group) return [{ unit: fromUnit, qty }]
  const fromU = group.units.find(u => u.unit === fromUnit)
  if (!fromU) return [{ unit: fromUnit, qty }]
  const baseQty = qty * fromU.ratio
  const result = []
  for (const u of group.units) {
    if (u.ratio > fromU.ratio) {
      const big = Math.floor(baseQty / u.ratio)
      if (big > 0) {
        result.push({ unit: u.unit, qty: big })
      }
    }
  }
  const remaining = baseQty % (fromU.ratio)
  if (remaining > 0) {
    result.push({ unit: group.baseUnit, qty: remaining })
  }
  return result.length ? result : [{ unit: fromUnit, qty }]
}

// 格式化金额
export function formatMoney(n) {
  return `¥${Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 格式化日期
export function formatDate(d, fmt = 'YYYY-MM-DD') {
  return dayjs(d).format(fmt)
}

// 生成单号
export function genOrderNo(prefix = 'XS') {
  return `${prefix}${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 900) + 100)}`
}

// 保质期状态
export function getExpiryStatus(expiryDate) {
  const diff = dayjs(expiryDate).diff(dayjs(), 'day')
  if (diff < 0) return { label: '已过期', type: 'expired', color: '#ee0a24', icon: 'warning-o' }
  if (diff <= 7) return { label: `剩${diff}天`, type: 'danger', color: '#ee0a24', icon: 'warning-o' }
  if (diff <= 30) return { label: `剩${diff}天`, type: 'warning', color: '#ff976a', icon: 'clock-o' }
  return { label: `剩${diff}天`, type: 'normal', color: '#07c160', icon: 'passed' }
}

// 获取商品库存总量
export function getProductStock(productId, store) {
  return store.stockSummary
    .filter(s => s.productId === productId)
    .reduce((sum, s) => sum + s.qty, 0)
}

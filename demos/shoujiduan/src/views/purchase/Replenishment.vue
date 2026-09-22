<template>
  <div class="replenish-page">
    <!-- 顶部说明 -->
    <div class="head-banner">
      <div class="hb-title">
        <van-icon name="chart-trending-o" size="22" />
        智能补货分析
      </div>
      <div class="hb-note">基于历史销售数据 + 现有库存自动生成建议采购量</div>
    </div>

    <!-- 概览统计 -->
    <div class="stat-grid">
      <div class="stat-card stat-red">
        <div class="sc-num">{{ urgentList.length }}</div>
        <div class="sc-label">紧急补货</div>
      </div>
      <div class="stat-card stat-orange">
        <div class="sc-num">{{ warningList.length }}</div>
        <div class="sc-label">需补货</div>
      </div>
      <div class="stat-card stat-green">
        <div class="sc-num">{{ sufficientList.length }}</div>
        <div class="sc-label">库存充足</div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="product-list">
      <div
        v-for="item in replenishList"
        :key="item.productId"
        class="product-card"
        :class="`urgency-${item.urgency}`"
      >
        <div class="pc-header">
          <div class="pc-name">
            <van-icon
              :name="trendIcon(item.trend)"
              :color="trendColor(item.trend)"
              size="16"
            />
            {{ item.productName }}
          </div>
          <van-tag :type="urgencyTagType(item.urgency)" round>
            {{ urgencyLabel(item.urgency) }}
          </van-tag>
        </div>

        <div class="pc-stats">
          <div class="ps-item">
            <div class="ps-num">{{ item.dailyAvg }}</div>
            <div class="ps-label">日均销量</div>
          </div>
          <div class="ps-item">
            <div class="ps-num">{{ item.weeklySales }}</div>
            <div class="ps-label">周销量</div>
          </div>
          <div class="ps-item">
            <div class="ps-num">{{ item.monthlySales }}</div>
            <div class="ps-label">月销量</div>
          </div>
          <div class="ps-item">
            <div class="ps-num" :class="`text-${item.urgency}`">{{ item.currentStock }}</div>
            <div class="ps-label">当前库存</div>
          </div>
        </div>

        <div class="pc-suggest">
          <div class="ps-row">
            <span class="ps-label">建议采购量</span>
            <span class="suggest-qty">{{ item.suggestedQty }}</span>
            <span class="ps-unit">{{ item.unit }}</span>
          </div>
          <div class="ps-row sub">
            <span class="ps-label">可供应天数</span>
            <span>{{ item.supplyDays }} 天</span>
          </div>
        </div>

        <div class="pc-actions">
          <van-checkbox
            v-model="item.checked"
            shape="square"
            :disabled="item.suggestedQty <= 0"
          >
            批量
          </van-checkbox>
          <van-button
            size="small"
            type="primary"
            icon="cart-o"
            :disabled="item.suggestedQty <= 0"
            @click="quickPurchase(item)"
          >
            一键生成采购单
          </van-button>
        </div>
      </div>
      <van-empty v-if="!replenishList.length" description="暂无可分析商品" :image-size="80" />
    </div>

    <!-- 批量生成 -->
    <div class="batch-bar" v-if="checkedList.length">
      <div class="batch-info">
        已选 <span class="batch-num">{{ checkedList.length }}</span> 件 ·
        合计 <span class="batch-amount">{{ formatMoney(batchTotal) }}</span>
      </div>
      <van-button type="danger" size="small" round @click="batchPurchase">批量生成采购单</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, formatDate, getProductStock } from '@/utils/index.js'

const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()
authStore.restore()

// 补货清单（含计算字段）
const replenishList = computed(() => {
  return dataStore.salesHistory.map(sh => {
    const product = dataStore.products.find(p => p.id === sh.productId)
    const currentStock = getProductStock(sh.productId, dataStore)
    const dailyAvg = Number(sh.dailyAvg) || 0
    // 14 天供应量建议
    const suggestedQty = Math.max(Math.ceil(dailyAvg * 14 - currentStock), 0)
    // 当前库存可供应天数
    const supplyDays = dailyAvg > 0 ? Math.floor(currentStock / dailyAvg) : 999
    // 紧急程度
    let urgency = 'green'
    if (dailyAvg > 0) {
      if (supplyDays < 3) urgency = 'red'
      else if (supplyDays < 7) urgency = 'orange'
    } else if (currentStock === 0) {
      urgency = 'orange'
    }
    return {
      productId: sh.productId,
      productName: product?.name || `商品#${sh.productId}`,
      spec: product?.spec || '',
      unit: product?.mainUnit || '',
      dailyAvg,
      weeklySales: sh.weeklySales,
      monthlySales: sh.monthlySales,
      trend: sh.trend,
      currentStock,
      suggestedQty,
      supplyDays,
      urgency,
      checked: false,
      costPrice: product?.costPrice || 0,
      supplierId: product?.supplierIds?.[0] || null,
      supplierName: product?.supplierIds?.[0]
        ? dataStore.suppliers.find(s => s.id === product.supplierIds[0])?.name || ''
        : ''
    }
  })
})

// 紧急程度过滤
const urgentList = computed(() => replenishList.value.filter(i => i.urgency === 'red'))
const warningList = computed(() => replenishList.value.filter(i => i.urgency === 'orange'))
const sufficientList = computed(() => replenishList.value.filter(i => i.urgency === 'green'))

// 批量选中
const checkedList = computed(() => replenishList.value.filter(i => i.checked))
const batchTotal = computed(() =>
  checkedList.value.reduce((sum, it) => sum + it.suggestedQty * it.costPrice, 0)
)

function trendIcon(trend) {
  return { up: 'arrow-up', down: 'arrow-down', stable: 'minus' }[trend] || 'minus'
}
function trendColor(trend) {
  return { up: '#ee0a24', down: '#07c160', stable: '#969799' }[trend] || '#969799'
}
function urgencyLabel(u) {
  return { red: '紧急', orange: '需补货', green: '充足' }[u] || ''
}
function urgencyTagType(u) {
  return { red: 'danger', orange: 'warning', green: 'success' }[u] || 'default'
}

// 构建单个采购单
function buildOrder(items) {
  const orderItems = items.map(it => ({
    productId: it.productId,
    name: it.productName,
    spec: it.spec,
    unit: it.unit,
    qty: it.suggestedQty,
    price: it.costPrice,
    amount: +(it.suggestedQty * it.costPrice).toFixed(2)
  }))
  const totalAmount = orderItems.reduce((sum, it) => sum + it.amount, 0)
  const firstSupplierId = items[0]?.supplierId
  return {
    supplierId: firstSupplierId || null,
    supplierName: items[0]?.supplierName || '',
    items: orderItems,
    totalAmount: +totalAmount.toFixed(2),
    prepayAmount: 0,
    freight: 0,
    freightAlloc: false,
    status: 'pending',
    buyer: authStore.user?.name || '当前用户',
    inboundNo: ''
  }
}

function quickPurchase(item) {
  if (!item.suggestedQty || item.suggestedQty <= 0) {
    showToast('该商品库存充足，无需补货')
    return
  }
  if (!item.supplierId) {
    showToast('该商品未配置供应商，请先在商品档案中关联')
    return
  }
  showConfirmDialog({
    title: '一键生成采购单',
    message: `将创建 ${item.productName} ×${item.suggestedQty}${item.unit} 的采购单？`
  }).then(() => {
    const order = buildOrder([item])
    dataStore.addPurchaseOrder(order)
    showSuccessToast('采购单已生成')
  }).catch(() => {})
}

function batchPurchase() {
  if (!checkedList.value.length) {
    showToast('请先选择要补货的商品')
    return
  }
  const validItems = checkedList.value.filter(i => i.supplierId)
  if (!validItems.length) {
    showToast('所选商品未配置供应商')
    return
  }
  // 按供应商分组生成
  const groupMap = {}
  validItems.forEach(it => {
    if (!groupMap[it.supplierId]) groupMap[it.supplierId] = []
    groupMap[it.supplierId].push(it)
  })
  const count = Object.keys(groupMap).length
  showConfirmDialog({
    title: '批量生成采购单',
    message: `将创建 ${count} 张采购单（按供应商分组），共 ${validItems.length} 件商品？`
  }).then(() => {
    Object.values(groupMap).forEach(items => {
      const order = buildOrder(items)
      dataStore.addPurchaseOrder(order)
    })
    // 取消勾选
    replenishList.value.forEach(it => { it.checked = false })
    showSuccessToast(`已生成 ${count} 张采购单`)
  }).catch(() => {})
}
</script>

<style scoped>
.replenish-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 100px;
}

/* 顶部 */
.head-banner {
  background: linear-gradient(120deg, #1989fa 0%, #4ba9ff 100%);
  color: #fff;
  padding: 18px 16px 22px;
}
.hb-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hb-note {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 6px;
}

/* 概览统计 */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 0 12px;
  margin-top: -12px;
}
.stat-card {
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.stat-card .sc-num {
  font-size: 22px;
  font-weight: 700;
}
.stat-card .sc-label {
  font-size: 11px;
  opacity: 0.95;
  margin-top: 2px;
}
.stat-red { background: linear-gradient(135deg, #ee0a24, #ff4d4f); }
.stat-orange { background: linear-gradient(135deg, #ff976a, #ffb070); }
.stat-green { background: linear-gradient(135deg, #07c160, #4dc787); }

/* 商品列表 */
.product-list {
  padding: 12px 8px 8px;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 0 4px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  border-left: 4px solid #07c160;
}
.product-card.urgency-red { border-left-color: #ee0a24; }
.product-card.urgency-orange { border-left-color: #ff976a; }
.product-card.urgency-green { border-left-color: #07c160; }
.pc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.pc-name {
  font-size: 15px;
  font-weight: 700;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 8px 4px;
  margin-bottom: 8px;
}
.ps-item {
  text-align: center;
}
.ps-num {
  font-size: 16px;
  font-weight: 700;
  color: #323233;
}
.text-red { color: #ee0a24 !important; }
.text-orange { color: #ff976a !important; }
.text-green { color: #07c160 !important; }
.ps-label {
  font-size: 11px;
  color: #969799;
  margin-top: 2px;
}

.pc-suggest {
  background: #fff8e8;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.ps-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #646566;
}
.ps-row.sub {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}
.ps-label {
  color: #969799;
}
.suggest-qty {
  font-size: 20px;
  font-weight: 700;
  color: #ee0a24;
}
.ps-unit {
  color: #646566;
  font-size: 12px;
  margin-left: 2px;
}

.pc-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
}

/* 批量浮动 */
.batch-bar {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  padding: 10px 16px;
  background: #fff;
  border-top: 1px solid #ebedf0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  z-index: 99;
}
.batch-info {
  font-size: 13px;
  color: #323233;
}
.batch-num {
  color: #ee0a24;
  font-weight: 700;
  font-size: 15px;
}
.batch-amount {
  color: #ee0a24;
  font-weight: 700;
}
</style>

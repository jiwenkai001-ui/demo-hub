<template>
  <div class="stock-list-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <van-search
        v-model="keyword"
        placeholder="搜索商品名称/编码"
        shape="round"
        show-action
        @search="onSearch"
        @clear="onSearch"
      >
        <template #action>
          <van-button size="small" type="primary" icon="scan" @click="scanVisible = true">扫码</van-button>
        </template>
      </van-search>
      <van-dropdown-menu>
        <van-dropdown-item v-model="warehouseFilter" :options="warehouseOptions" />
      </van-dropdown-menu>
    </div>

    <van-tabs v-model:active="activeTab" sticky offset-top="96">
      <!-- 汇总库存 -->
      <van-tab title="汇总库存">
        <div class="list-wrap">
          <div v-for="p in summaryProducts" :key="p.id" class="stock-card">
            <div class="stock-card-head">
              <div class="stock-name">{{ p.name }}</div>
              <van-tag v-if="p.totalQty < p.minStock" type="danger" size="medium">库存不足</van-tag>
              <van-tag v-else-if="p.totalQty > p.maxStock" type="warning" size="medium">库存积压</van-tag>
            </div>
            <div class="stock-meta">{{ p.code }} · 规格: {{ p.spec }} · 单位: {{ p.mainUnit }}</div>
            <div class="stock-qty-row">
              <div class="stock-qty-item">
                <span class="lbl">档口仓库</span>
                <span class="val" :class="{ 'qty-zero': p.w1Qty === 0 }">{{ p.w1Qty }}</span>
              </div>
              <div class="stock-qty-item">
                <span class="lbl">后备库房</span>
                <span class="val" :class="{ 'qty-zero': p.w2Qty === 0 }">{{ p.w2Qty }}</span>
              </div>
              <div class="stock-qty-item">
                <span class="lbl">合计</span>
                <span
                  class="val total"
                  :class="{ 'text-red': p.totalQty < p.minStock, 'text-orange': p.totalQty > p.maxStock }"
                >{{ p.totalQty }}</span>
              </div>
            </div>
            <div class="stock-foot">
              <span class="stock-value">库存价值: {{ formatMoney(p.stockValue) }}</span>
              <van-tag v-if="p.nearExpiryCount > 0" type="warning" size="medium" round>
                <van-icon name="clock-o" /> 临期批次 {{ p.nearExpiryCount }}
              </van-tag>
            </div>
          </div>
          <van-empty v-if="!summaryProducts.length" description="暂无库存数据" />
        </div>
      </van-tab>

      <!-- 批次库存 -->
      <van-tab title="批次库存">
        <div class="list-wrap">
          <div v-for="b in batchList" :key="b.id" class="batch-card">
            <div class="batch-head">
              <div class="batch-product">{{ b.productName }}</div>
              <van-tag :color="b.expiryStatus.color" plain>{{ b.expiryStatus.label }}</van-tag>
            </div>
            <div class="batch-meta-line">
              <span>批次号: {{ b.batchNo }}</span>
              <van-tag v-if="b.fifoRank === 1" type="primary" size="medium">优先出库</van-tag>
              <van-tag v-else type="default" size="medium">第{{ b.fifoRank }}顺位</van-tag>
            </div>
            <div class="batch-meta-line">
              <span>生产: {{ formatDate(b.productionDate) }}</span>
              <span>到期: {{ formatDate(b.expiryDate) }}</span>
            </div>
            <div class="batch-foot">
              <span>剩余: <b class="qty-strong">{{ b.remainingQty }}</b> {{ b.unit }}</span>
              <van-tag plain>{{ b.warehouseName }}</van-tag>
            </div>
          </div>
          <van-empty v-if="!batchList.length" description="暂无批次数据" />
        </div>
      </van-tab>
    </van-tabs>

    <!-- 扫码弹窗 -->
    <ScanDialog v-model="scanVisible" @scanned="onScanned" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { showToast } from 'vant'
import ScanDialog from '@/components/ScanDialog.vue'
import { formatMoney, formatDate, getExpiryStatus } from '@/utils/index.js'
import dayjs from 'dayjs'

const dataStore = useDataStore()

const activeTab = ref(0)
const keyword = ref('')
const warehouseFilter = ref('all')
const scanVisible = ref(false)

const warehouseOptions = [
  { text: '全部仓库', value: 'all' },
  { text: '档口仓库', value: 1 },
  { text: '后备库房', value: 2 },
]

function onSearch() {
  // 即时过滤,无需额外动作
}

function onScanned(code) {
  scanVisible.value = false
  const product = dataStore.products.find(p => p.barcode === code)
  if (product) {
    keyword.value = product.name
    showToast(`已匹配: ${product.name}`)
  } else {
    showToast('未匹配到商品')
  }
}

// 汇总库存列表
const summaryProducts = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return dataStore.products
    .filter(p => p.status === 1)
    .filter(p => {
      if (!kw) return true
      return p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw)
    })
    .filter(p => {
      if (warehouseFilter.value === 'all') return true
      return dataStore.stockSummary.some(s => s.productId === p.id && s.warehouseId === warehouseFilter.value && s.qty > 0)
    })
    .map(p => {
      const w1 = dataStore.stockSummary.find(s => s.productId === p.id && s.warehouseId === 1)
      const w2 = dataStore.stockSummary.find(s => s.productId === p.id && s.warehouseId === 2)
      const w1Qty = w1 ? w1.qty : 0
      const w2Qty = w2 ? w2.qty : 0
      const totalQty = w1Qty + w2Qty
      // 临期批次计数(<=15天)
      const nearExpiryCount = dataStore.batches.filter(b => {
        if (b.productId !== p.id || b.status !== 1 || b.remainingQty <= 0) return false
        const diff = dayjs(b.expiryDate).diff(dayjs(), 'day')
        return diff >= 0 && diff <= 15
      }).length
      return {
        ...p,
        w1Qty,
        w2Qty,
        totalQty,
        stockValue: totalQty * (p.costPrice || 0),
        nearExpiryCount
      }
    })
    .filter(p => {
      // 应用仓库过滤后,如果没有该仓库库存则不显示
      if (warehouseFilter.value === 'all') return true
      return warehouseFilter.value === 1 ? p.w1Qty > 0 : p.w2Qty > 0
    })
})

// 批次库存列表
const batchList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  // 按 productId 分组,计算每个批次的 FIFO 顺位
  const groups = {}
  dataStore.batches
    .filter(b => b.status === 1 && b.remainingQty > 0)
    .filter(b => {
      if (warehouseFilter.value === 'all') return true
      return b.warehouseId === warehouseFilter.value
    })
    .forEach(b => {
      if (!groups[b.productId]) groups[b.productId] = []
      groups[b.productId].push(b)
    })

  // 每组按生产日期升序排序,赋予顺位
  Object.values(groups).forEach(arr => {
    arr.sort((a, b) => dayjs(a.productionDate).valueOf() - dayjs(b.productionDate).valueOf())
    arr.forEach((b, i) => { b._fifoRank = i + 1 })
  })

  return dataStore.batches
    .filter(b => b.status === 1 && b.remainingQty > 0)
    .filter(b => {
      if (warehouseFilter.value === 'all') return true
      return b.warehouseId === warehouseFilter.value
    })
    .map(b => {
      const product = dataStore.products.find(p => p.id === b.productId)
      const warehouse = dataStore.warehouses.find(w => w.id === b.warehouseId)
      return {
        ...b,
        productName: product ? product.name : '未知商品',
        unit: product ? product.mainUnit : '',
        warehouseName: warehouse ? warehouse.name : '未知仓库',
        expiryStatus: getExpiryStatus(b.expiryDate),
        fifoRank: b._fifoRank || 1
      }
    })
    .filter(b => {
      if (!kw) return true
      return b.productName.toLowerCase().includes(kw) || (b.batchNo && b.batchNo.toLowerCase().includes(kw))
    })
})
</script>

<style scoped>
.stock-list-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.toolbar {
  background: #fff;
}
.list-wrap {
  padding: 8px;
}
.stock-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin: 8px 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.stock-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.stock-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.stock-meta {
  font-size: 12px;
  color: #969799;
  margin-bottom: 10px;
}
.stock-qty-row {
  display: flex;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 10px 4px;
  margin-bottom: 10px;
}
.stock-qty-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stock-qty-item .lbl {
  font-size: 11px;
  color: #969799;
}
.stock-qty-item .val {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.stock-qty-item .val.total {
  font-size: 17px;
}
.qty-zero {
  color: #c8c9cc !important;
}
.text-red { color: #ee0a24 !important; }
.text-orange { color: #ff976a !important; }
.stock-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
}
.stock-value {
  color: #07c160;
  font-weight: 500;
}
.batch-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin: 8px 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.batch-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.batch-product {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.batch-meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #646566;
  margin: 4px 0;
}
.batch-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #646566;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #ebedf0;
}
.qty-strong {
  font-size: 16px;
  color: #07c160;
}
</style>

<template>
  <div class="stock-warning-page">
    <!-- 顶部统计卡片 -->
    <div class="summary-grid">
      <div class="summary-card summary-red" @click="activeSection = 'low'">
        <div class="summary-value">{{ lowStockList.length }}</div>
        <div class="summary-label">库存不足</div>
      </div>
      <div class="summary-card summary-orange" @click="activeSection = 'over'">
        <div class="summary-value">{{ overStockList.length }}</div>
        <div class="summary-label">库存积压</div>
      </div>
      <div class="summary-card summary-yellow" @click="activeSection = 'expiry'">
        <div class="summary-value">{{ nearExpiryList.length }}</div>
        <div class="summary-label">临期预警</div>
      </div>
    </div>

    <!-- 三段式标签 -->
    <van-tabs v-model:active="activeSection" sticky offset-top="0">
      <!-- 库存不足 -->
      <van-tab title="库存不足" name="low">
        <div class="list-wrap">
          <div v-for="item in lowStockList" :key="item.id" class="warning-card">
            <div class="card-head">
              <div class="card-title">{{ item.name }}</div>
              <van-tag :type="item.totalQty === 0 ? 'danger' : 'warning'" round>
                {{ item.totalQty === 0 ? '缺货' : '偏低' }}
              </van-tag>
            </div>
            <div class="card-meta">{{ item.code }} · 规格 {{ item.spec }} · 单位 {{ item.mainUnit }}</div>
            <div class="stat-row">
              <div class="stat-block">
                <span class="stat-lbl">当前库存</span>
                <span class="stat-val" :class="{ 'text-red': item.totalQty < item.minStock }">{{ item.totalQty }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-lbl">最低库存</span>
                <span class="stat-val">{{ item.minStock }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-lbl">建议补货</span>
                <span class="stat-val text-blue">{{ item.suggestQty }}</span>
              </div>
            </div>
            <div class="card-actions">
              <van-button size="small" type="primary" icon="cart-o" @click="onReplenish(item)">补货</van-button>
            </div>
          </div>
          <van-empty v-if="!lowStockList.length" description="暂无库存不足商品" />
        </div>
      </van-tab>

      <!-- 库存积压 -->
      <van-tab title="库存积压" name="over">
        <div class="list-wrap">
          <div v-for="item in overStockList" :key="item.id" class="warning-card">
            <div class="card-head">
              <div class="card-title">{{ item.name }}</div>
              <van-tag type="warning" round>积压</van-tag>
            </div>
            <div class="card-meta">{{ item.code }} · 规格 {{ item.spec }} · 单位 {{ item.mainUnit }}</div>
            <div class="stat-row">
              <div class="stat-block">
                <span class="stat-lbl">当前库存</span>
                <span class="stat-val text-orange">{{ item.totalQty }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-lbl">最高库存</span>
                <span class="stat-val">{{ item.maxStock }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-lbl">积压数量</span>
                <span class="stat-val text-red">{{ item.overQty }}</span>
              </div>
            </div>
            <div class="card-extra">
              <span v-if="item.daysOfStock !== null">
                可售天数: <b :class="item.daysOfStock > 90 ? 'text-red' : 'text-orange'">{{ item.daysOfStock }} 天</b>
                <em v-if="item.monthlySales">(月均 {{ item.monthlySales }} {{ item.mainUnit }})</em>
              </span>
              <span v-else class="text-gray">无销售数据</span>
            </div>
            <div class="card-actions">
              <van-button size="small" type="warning" icon="fire-o" @click="onPromote(item)">促销</van-button>
            </div>
          </div>
          <van-empty v-if="!overStockList.length" description="暂无库存积压商品" />
        </div>
      </van-tab>

      <!-- 临期预警 -->
      <van-tab title="临期预警" name="expiry">
        <div class="list-wrap">
          <div v-for="item in nearExpiryList" :key="item.id" class="warning-card">
            <div class="card-head">
              <div class="card-title">{{ item.productName }}</div>
              <van-tag :color="item.urgencyColor" round>{{ item.urgencyLabel }}</van-tag>
            </div>
            <div class="card-meta">批次号: {{ item.batchNo }} · 剩余 {{ item.remainingQty }} {{ item.unit }}</div>
            <div class="stat-row">
              <div class="stat-block">
                <span class="stat-lbl">到期日期</span>
                <span class="stat-val">{{ formatDate(item.expiryDate) }}</span>
              </div>
              <div class="stat-block">
                <span class="stat-lbl">剩余天数</span>
                <span class="stat-val" :style="{ color: item.urgencyColor }">{{ item.daysRemaining }} 天</span>
              </div>
              <div class="stat-block">
                <span class="stat-lbl">存放仓库</span>
                <span class="stat-val">{{ item.warehouseName }}</span>
              </div>
            </div>
            <div class="card-actions">
              <van-button size="small" type="danger" icon="warning-o" @click="onDispose(item)">报损</van-button>
            </div>
          </div>
          <van-empty v-if="!nearExpiryList.length" description="暂无临期商品" />
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { formatMoney, formatDate, getProductStock } from '@/utils/index.js'
import dayjs from 'dayjs'

const dataStore = useDataStore()
const router = useRouter()

const activeSection = ref('low')

// 库存不足列表
const lowStockList = computed(() =>
  dataStore.products
    .filter(p => p.status === 1)
    .map(p => {
      const totalQty = getProductStock(p.id, dataStore)
      return { ...p, totalQty }
    })
    .filter(p => p.totalQty < p.minStock)
    .map(p => ({
      ...p,
      suggestQty: Math.max(p.minStock - p.totalQty, Math.ceil(p.minStock * 1.5) - p.totalQty)
    }))
    .sort((a, b) => a.totalQty - b.totalQty)
)

// 库存积压列表
const overStockList = computed(() =>
  dataStore.products
    .filter(p => p.status === 1)
    .map(p => {
      const totalQty = getProductStock(p.id, dataStore)
      const salesRec = dataStore.salesHistory.find(s => s.productId === p.id)
      const monthlySales = salesRec ? salesRec.monthlySales : 0
      let daysOfStock = null
      if (monthlySales > 0) {
        daysOfStock = Math.round((totalQty / monthlySales) * 30)
      }
      return { ...p, totalQty, monthlySales, daysOfStock }
    })
    .filter(p => p.totalQty > p.maxStock)
    .map(p => ({ ...p, overQty: p.totalQty - p.maxStock }))
    .sort((a, b) => b.overQty - a.overQty)
)

// 临期预警(<=30天,含已过期)
const nearExpiryList = computed(() =>
  dataStore.batches
    .filter(b => b.status === 1 && b.remainingQty > 0)
    .map(b => {
      const product = dataStore.products.find(p => p.id === b.productId)
      const warehouse = dataStore.warehouses.find(w => w.id === b.warehouseId)
      const daysRemaining = dayjs(b.expiryDate).diff(dayjs(), 'day')
      let urgencyColor, urgencyLabel
      if (daysRemaining < 0) {
        urgencyColor = '#ee0a24'
        urgencyLabel = '已过期'
      } else if (daysRemaining <= 7) {
        urgencyColor = '#ee0a24'
        urgencyLabel = `紧急(剩${daysRemaining}天)`
      } else if (daysRemaining <= 15) {
        urgencyColor = '#ff976a'
        urgencyLabel = `警告(剩${daysRemaining}天)`
      } else {
        urgencyColor = '#ffba0d'
        urgencyLabel = `注意(剩${daysRemaining}天)`
      }
      return {
        ...b,
        productName: product ? product.name : '未知商品',
        unit: product ? product.mainUnit : '',
        warehouseName: warehouse ? warehouse.name : '未知仓库',
        daysRemaining,
        urgencyColor,
        urgencyLabel
      }
    })
    .filter(b => b.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
)

// 操作
function onReplenish(item) {
  router.push('/purchase/replenish')
}
function onPromote(item) {
  showToast(`已为 ${item.name} 创建促销建议`)
}
function onDispose(item) {
  showConfirmDialog({
    title: '确认报损',
    message: `确认将 ${item.productName} 批次 ${item.batchNo} 剩余 ${item.remainingQty} ${item.unit} 报损处理?`,
    confirmButtonText: '确认报损',
    cancelButtonText: '取消'
  }).then(() => {
    showToast('报损单已生成')
  }).catch(() => {})
}
</script>

<style scoped>
.stock-warning-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

/* 顶部统计 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 12px;
  background: #fff;
}
.summary-card {
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.summary-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.summary-label {
  font-size: 12px;
  opacity: 0.95;
  margin-top: 4px;
}
.summary-red { background: linear-gradient(135deg, #ee0a24, #ff4d4f); }
.summary-orange { background: linear-gradient(135deg, #ff976a, #ffb070); }
.summary-yellow { background: linear-gradient(135deg, #ffba0d, #ffd01a); }

/* 列表 */
.list-wrap {
  padding: 8px;
}
.warning-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin: 8px 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.card-meta {
  font-size: 12px;
  color: #969799;
  margin-bottom: 10px;
}
.stat-row {
  display: flex;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 8px 4px;
  margin-bottom: 10px;
}
.stat-block {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-block .stat-lbl {
  font-size: 11px;
  color: #969799;
}
.stat-block .stat-val {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.text-red { color: #ee0a24 !important; }
.text-orange { color: #ff976a !important; }
.text-blue { color: #1989fa !important; }
.text-gray { color: #969799 !important; }
.card-extra {
  font-size: 12px;
  color: #646566;
  margin-bottom: 8px;
}
.card-extra em {
  font-style: normal;
  color: #969799;
  margin-left: 4px;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<template>
  <div class="expired-page">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-red">
        <div class="stat-icon"><van-icon name="warning-o" /></div>
        <div class="stat-body">
          <div class="stat-value">{{ expiredList.length }}</div>
          <div class="stat-label">过期商品项</div>
        </div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon"><van-icon name="gold-pay-o" /></div>
        <div class="stat-body">
          <div class="stat-value">{{ formatMoney(totalValue) }}</div>
          <div class="stat-label">涉及金额</div>
        </div>
      </div>
    </div>

    <!-- 过期商品 -->
    <div class="section">
      <div class="section-title">
        <span><van-icon name="close" color="#ee0a24" /> 已过期商品</span>
        <van-tag type="danger" size="mini">{{ expiredList.length }}</van-tag>
      </div>
      <div class="list-wrap">
        <van-empty v-if="!expiredList.length" description="暂无过期商品" :image-size="80" />

        <div class="expired-item" v-for="b in expiredList" :key="b.id">
          <div class="ei-head">
            <span class="ei-name">{{ getProductName(b.productId) }}</span>
            <van-tag type="danger" size="medium" round>已过期</van-tag>
          </div>
          <div class="ei-row">
            <span>批次号：{{ b.batchNo }}</span>
            <span>到期日：{{ b.expiryDate }}</span>
          </div>
          <div class="ei-row">
            <span>剩余数量：{{ b.remainingQty }} {{ getProductUnit(b.productId) }}</span>
            <span>货值：{{ formatMoney(getBatchValue(b)) }}</span>
          </div>
          <div class="ei-frozen">
            <van-icon name="warning-o" color="#ee0a24" />
            <span>已自动冻结销售</span>
          </div>
          <div class="ei-action">
            <van-button size="small" type="danger" plain icon="delete-o" @click="onScrap(b)">
              报损处理
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 即将过期 -->
    <div class="section">
      <div class="section-title">
        <span><van-icon name="clock-o" color="#ff976a" /> 即将过期（7天内）</span>
        <van-tag type="warning" size="mini">{{ nearList.length }}</van-tag>
      </div>
      <div class="list-wrap">
        <van-empty v-if="!nearList.length" description="暂无临期商品" :image-size="80" />

        <div class="near-item" v-for="b in nearList" :key="b.id">
          <div class="ei-head">
            <span class="ei-name">{{ getProductName(b.productId) }}</span>
            <van-tag :color="getExpiryStatus(b.expiryDate).color" size="mini" round>
              {{ getExpiryStatus(b.expiryDate).label }}
            </van-tag>
          </div>
          <div class="ei-row">
            <span>批次号：{{ b.batchNo }}</span>
            <span>到期日：{{ b.expiryDate }}</span>
          </div>
          <div class="ei-row">
            <span>剩余：{{ b.remainingQty }} {{ getProductUnit(b.productId) }}</span>
            <span>仓库：{{ getWarehouseName(b.warehouseId) }}</span>
          </div>
          <div class="ei-tip">建议优先促销/调拨，避免过期损失</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { showSuccessToast, showConfirmDialog } from 'vant'
import { useDataStore } from '@/stores/data'
import { getExpiryStatus, formatMoney } from '@/utils/index'
import dayjs from 'dayjs'

const dataStore = useDataStore()

// 已过期：状态为3 或 到期日早于今天
const expiredList = computed(() =>
  dataStore.batches.filter(b => b.status === 3 || dayjs(b.expiryDate).isBefore(dayjs().startOf('day')))
)

// 涉及总金额
const totalValue = computed(() =>
  expiredList.value.reduce((sum, b) => sum + getBatchValue(b), 0)
)

// 即将过期：状态正常、有库存、到期日在 0~7 天内
const nearList = computed(() =>
  dataStore.batches.filter(b => {
    if (b.status !== 1 || !b.remainingQty || b.remainingQty <= 0) return false
    const diff = dayjs(b.expiryDate).diff(dayjs().startOf('day'), 'day')
    return diff >= 0 && diff <= 7
  })
)

function getProductName(id) {
  return dataStore.products.find(p => p.id === id)?.name || '未知商品'
}
function getProductUnit(id) {
  return dataStore.products.find(p => p.id === id)?.mainUnit || ''
}
function getWarehouseName(id) {
  return dataStore.warehouses.find(w => w.id === id)?.name || '-'
}
function getBatchValue(b) {
  const p = dataStore.products.find(x => x.id === b.productId)
  const price = p?.costPrice || 0
  return (b.remainingQty || 0) * price
}

function onScrap(b) {
  showConfirmDialog({
    title: '报损处理',
    message: `确认对「${getProductName(b.productId)}」批次 ${b.batchNo} 进行报损处理？`
  }).then(() => {
    showSuccessToast('已报损')
  }).catch(() => {})
}
</script>

<style scoped>
.expired-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px 12px 24px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 10px;
  flex-shrink: 0;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}
.stat-red { background: linear-gradient(135deg, #ee0a24, #ff4d4f); }
.stat-orange { background: linear-gradient(135deg, #ff976a, #ffb070); }

/* 区块 */
.section {
  margin-top: 8px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 4px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.expired-item,
.near-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.ei-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ei-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.ei-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}
.ei-frozen {
  margin-top: 8px;
  padding: 6px 10px;
  background: #fff1f0;
  border-radius: 6px;
  color: #ee0a24;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.ei-action {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.ei-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #ff976a;
}
</style>

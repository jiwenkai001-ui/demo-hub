<template>
  <div class="stock-count-page">
    <div class="topbar">
      <van-button type="primary" icon="plus" size="small" block @click="openCreate">新增盘点</van-button>
    </div>

    <!-- 盘点历史 -->
    <div class="list-wrap">
      <div v-for="order in countList" :key="order.id" class="count-card" @click="openDetail(order)">
        <div class="count-head">
          <span class="count-id">{{ order.id }}</span>
          <van-tag :type="statusTagType(order.status)" plain>{{ statusLabel(order.status) }}</van-tag>
        </div>
        <div class="count-info">
          <van-icon name="shop-o" />
          <span>{{ order.warehouseName }}</span>
        </div>
        <div class="count-summary">
          <span>共 {{ order.items.length }} 项</span>
          <span>盘盈 {{ diffStat(order.items).positive }} · 盘亏 {{ diffStat(order.items).negative }} · 一致 {{ diffStat(order.items).equal }}</span>
        </div>
        <div class="count-meta">
          <span><van-icon name="clock-o" /> {{ order.createdAt }}</span>
          <span><van-icon name="manager-o" /> {{ order.operator }}</span>
        </div>
      </div>
      <van-empty v-if="!countList.length" description="暂无盘点单" />
    </div>

    <!-- 新增盘点弹窗 -->
    <van-popup v-model:show="formVisible" position="bottom" round :style="{ height: '88%' }" teleport="body">
      <div class="form-popup">
        <van-nav-bar title="新增盘点单" />
        <div class="form-body">
          <van-cell-group inset title="仓库选择">
            <van-cell title="盘点仓库" is-link :value="form.warehouseName || '请选择'" @click="openWarehousePicker" required />
            <van-cell title="扫码盘点">
              <van-button size="small" type="primary" icon="scan" :disabled="!form.warehouseId" @click="scanVisible = true">扫码添加</van-button>
            </van-cell>
          </van-cell-group>

          <van-cell-group inset title="盘点明细">
            <div v-if="!form.items.length" class="empty-tip">请通过扫码或下方按钮添加商品</div>
            <div v-for="(item, idx) in form.items" :key="idx" class="form-item">
              <div class="form-item-head">
                <span class="form-item-name">{{ item.name }}</span>
                <van-icon name="delete-o" color="#ee0a24" size="18" @click="removeItem(idx)" />
              </div>
              <div class="form-item-meta">批次: {{ item.batchNo || '默认' }}</div>
              <div class="form-item-row">
                <div class="qty-cell">
                  <span class="lbl">账面</span>
                  <span class="val">{{ item.bookQty }}</span>
                  <span class="unit">{{ item.unit }}</span>
                </div>
                <div class="qty-cell">
                  <span class="lbl">实际</span>
                  <van-stepper v-model="item.actualQty" :min="0" integer @change="updateDiff(item)" />
                  <span class="unit">{{ item.unit }}</span>
                </div>
                <div class="qty-cell diff-cell">
                  <span class="lbl">差异</span>
                  <span class="val" :class="diffClass(item.diff)">
                    {{ item.diff > 0 ? '+' + item.diff : item.diff }}
                    <em v-if="item.diff > 0">盘盈</em>
                    <em v-else-if="item.diff < 0">盘亏</em>
                    <em v-else>一致</em>
                  </span>
                </div>
              </div>
            </div>
          </van-cell-group>

          <div class="form-actions">
            <van-button block type="success" :disabled="!canSave" @click="onConfirm">确认盘点</van-button>
          </div>
        </div>

        <!-- 仓库选择 -->
        <van-popup v-model:show="warehousePickerVisible" position="bottom" teleport="body">
          <van-picker
            :columns="warehouseColumns"
            title="选择盘点仓库"
            @confirm="onWarehouseConfirm"
            @cancel="warehousePickerVisible = false"
          />
        </van-popup>
      </div>
    </van-popup>

    <!-- 详情弹窗 -->
    <van-popup v-model:show="detailVisible" position="bottom" round :style="{ height: '75%' }" teleport="body">
      <div class="detail-popup">
        <van-nav-bar :title="currentDetail.id" />
        <van-cell-group inset>
          <van-cell title="盘点仓库" :value="currentDetail.warehouseName" />
          <van-cell title="状态">
            <van-tag :type="statusTagType(currentDetail.status)" plain>{{ statusLabel(currentDetail.status) }}</van-tag>
          </van-cell>
          <van-cell title="操作人" :value="currentDetail.operator" />
          <van-cell title="盘点时间" :value="currentDetail.createdAt" />
        </van-cell-group>
        <div class="detail-title">盘点明细</div>
        <van-cell-group inset>
          <div v-for="(item, i) in currentDetail.items" :key="i" class="detail-item">
            <div class="detail-item-head">
              <span class="detail-item-name">{{ item.name }}</span>
              <van-tag :color="diffColor(item.diff)" plain>
                {{ item.diff > 0 ? '盘盈' + item.diff : item.diff < 0 ? '盘亏' + Math.abs(item.diff) : '一致' }}
              </van-tag>
            </div>
            <div class="detail-item-meta">
              <span>批次: {{ item.batchNo || '默认' }}</span>
              <span>账面: {{ item.bookQty }} {{ item.unit }}</span>
              <span>实际: {{ item.actualQty }} {{ item.unit }}</span>
            </div>
          </div>
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 扫码弹窗 -->
    <ScanDialog v-model="scanVisible" @scanned="onScanned" />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useDataStore } from '@/stores/data'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import ScanDialog from '@/components/ScanDialog.vue'
import { formatDate } from '@/utils/index.js'

const dataStore = useDataStore()

const countList = computed(() => dataStore.stockCounts)

// 新增盘点表单
const formVisible = ref(false)
const scanVisible = ref(false)
const warehousePickerVisible = ref(false)
const form = reactive({
  warehouseId: null,
  warehouseName: '',
  items: []
})

const warehouseColumns = computed(() =>
  dataStore.warehouses.map(w => ({ text: w.name, value: w.id }))
)

const canSave = computed(() => form.warehouseId && form.items.length > 0)

function openCreate() {
  form.warehouseId = null
  form.warehouseName = ''
  form.items.splice(0, form.items.length)
  formVisible.value = true
}

function openWarehousePicker() {
  warehousePickerVisible.value = true
}
function onWarehouseConfirm({ selectedValues, selectedOptions }) {
  form.warehouseId = selectedValues[0]
  form.warehouseName = selectedOptions[0]?.text || ''
  warehousePickerVisible.value = false
}

// 扫码盘点
function onScanned(code) {
  scanVisible.value = false
  if (!form.warehouseId) {
    showToast('请先选择盘点仓库')
    return
  }
  const product = dataStore.products.find(p => p.barcode === code)
  if (!product) {
    showToast('未匹配到商品')
    return
  }
  // 已存在则跳过
  if (form.items.some(it => it.productId === product.id)) {
    showToast('该商品已在盘点列表')
    return
  }
  // 自动填充账面库存(取该仓库该商品的批次总和)
  const bookQty = dataStore.stockSummary
    .filter(s => s.productId === product.id && s.warehouseId === form.warehouseId)
    .reduce((sum, s) => sum + Number(s.qty || 0), 0)
  // 找一个该商品在该仓库的批次
  const batch = dataStore.batches.find(b => b.productId === product.id && b.warehouseId === form.warehouseId && b.status === 1)
  form.items.push({
    productId: product.id,
    name: product.name,
    batchNo: batch ? batch.batchNo : '',
    bookQty,
    actualQty: bookQty,
    diff: 0,
    unit: product.mainUnit
  })
  showToast(`已添加: ${product.name}`)
}

function removeItem(idx) {
  form.items.splice(idx, 1)
}
function updateDiff(item) {
  item.diff = Number(item.actualQty) - Number(item.bookQty)
}

function onConfirm() {
  if (!canSave.value) {
    showToast('请完善盘点信息')
    return
  }
  form.items.forEach(it => { it.diff = Number(it.actualQty) - Number(it.bookQty) })
  dataStore.addStockCount({
    warehouseId: form.warehouseId,
    warehouseName: form.warehouseName,
    items: form.items.map(it => ({ ...it })),
    status: 'completed',
    operator: '赵库管'
  })
  const stat = diffStat(form.items)
  formVisible.value = false
  showSuccessToast('盘点已提交')
  // 是否自动报损报溢
  if (stat.positive > 0 || stat.negative > 0) {
    setTimeout(() => {
      showConfirmDialog({
        title: '差异处理',
        message: `本次盘点共 ${stat.positive + stat.negative} 项存在差异,是否自动生成报损报溢单据?`,
        confirmButtonText: '自动报损报溢',
        cancelButtonText: '稍后处理'
      }).then(() => {
        showSuccessToast('已生成报损报溢单据')
      }).catch(() => {})
    }, 800)
  }
}

// 详情
const detailVisible = ref(false)
const currentDetail = reactive({
  id: '',
  warehouseName: '',
  items: [],
  status: '',
  createdAt: '',
  operator: ''
})
function openDetail(order) {
  Object.assign(currentDetail, order)
  detailVisible.value = true
}

// 工具
function diffStat(items) {
  let positive = 0, negative = 0, equal = 0
  items.forEach(it => {
    const d = Number(it.diff)
    if (d > 0) positive++
    else if (d < 0) negative++
    else equal++
  })
  return { positive, negative, equal }
}
function statusLabel(s) {
  const map = { completed: '已完成', submitted: '待审核', draft: '草稿' }
  return map[s] || s
}
function statusTagType(s) {
  const map = { completed: 'success', submitted: 'warning', draft: 'default' }
  return map[s] || 'default'
}
function diffClass(diff) {
  const d = Number(diff)
  if (d > 0) return 'text-green'
  if (d < 0) return 'text-red'
  return 'text-gray'
}
function diffColor(diff) {
  const d = Number(diff)
  if (d > 0) return '#07c160'
  if (d < 0) return '#ee0a24'
  return '#969799'
}
</script>

<style scoped>
.stock-count-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.topbar {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}
.list-wrap {
  padding: 8px;
}
.count-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin: 8px 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.count-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.count-id {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.count-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #323233;
  margin-bottom: 6px;
}
.count-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #646566;
  margin-bottom: 6px;
}
.count-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
}
.count-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 表单 */
.form-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.form-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}
.empty-tip {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: #969799;
}
.form-item {
  padding: 10px 12px;
  border-top: 1px solid #ebedf0;
}
.form-item:first-of-type { border-top: none; }
.form-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.form-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}
.form-item-meta {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}
.form-item-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.qty-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f7f8fa;
  border-radius: 6px;
  margin-right: 4px;
}
.qty-cell .lbl {
  font-size: 12px;
  color: #969799;
}
.qty-cell .val {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.qty-cell .unit {
  font-size: 11px;
  color: #969799;
}
.diff-cell .val em {
  font-style: normal;
  font-size: 11px;
  margin-left: 4px;
}
.text-green { color: #07c160 !important; }
.text-red { color: #ee0a24 !important; }
.text-gray { color: #969799 !important; }

.form-actions {
  padding: 12px;
}

/* 详情 */
.detail-popup {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 16px;
}
.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin: 16px 16px 8px;
}
.detail-item {
  padding: 10px 12px;
  border-top: 1px solid #ebedf0;
}
.detail-item:first-of-type { border-top: none; }
.detail-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.detail-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}
.detail-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}
</style>

<template>
  <div class="stock-transfer-page">
    <!-- 顶部操作 -->
    <div class="topbar">
      <van-button type="primary" icon="plus" size="small" block @click="openCreate">新增调拨</van-button>
    </div>

    <!-- 调拨列表 -->
    <div class="list-wrap">
      <div v-for="order in transferList" :key="order.id" class="transfer-card" @click="openDetail(order)">
        <div class="transfer-head">
          <span class="transfer-id">{{ order.id }}</span>
          <van-tag :type="statusTagType(order.status)" plain>{{ statusLabel(order.status) }}</van-tag>
        </div>
        <div class="transfer-route">
          <van-tag type="primary" size="medium">{{ order.fromWarehouseName }}</van-tag>
          <van-icon name="arrow" />
          <van-tag type="success" size="medium">{{ order.toWarehouseName }}</van-tag>
        </div>
        <div class="transfer-summary">
          <van-icon name="gift-o" />
          <span>{{ order.items.length }} 项 · 共 {{ totalQty(order.items) }} 件</span>
        </div>
        <div class="transfer-meta">
          <span><van-icon name="clock-o" /> {{ order.createdAt }}</span>
          <span><van-icon name="manager-o" /> {{ order.operator }}</span>
        </div>
      </div>
      <van-empty v-if="!transferList.length" description="暂无调拨单" />
    </div>

    <!-- 新增调拨弹窗 -->
    <van-popup v-model:show="formVisible" position="bottom" round :style="{ height: '85%' }" teleport="body">
      <div class="form-popup">
        <van-nav-bar title="新增调拨单" />
        <div class="form-body">
          <!-- 调出/调入仓库 -->
          <van-cell-group inset title="仓库选择">
            <van-cell title="调出仓库" is-link :value="form.fromWarehouseName || '请选择'" @click="openFromPicker" required />
            <van-cell title="调入仓库" is-link :value="form.toWarehouseName || '请选择'" @click="openToPicker" required />
          </van-cell-group>

          <!-- 调拨明细 -->
          <van-cell-group inset title="调拨明细">
            <div v-if="!form.items.length" class="empty-tip">请添加调拨商品</div>
            <div v-for="(item, idx) in form.items" :key="idx" class="form-item">
              <div class="form-item-head">
                <span class="form-item-name">{{ item.name }}</span>
                <van-icon name="delete-o" color="#ee0a24" size="18" @click="removeItem(idx)" />
              </div>
              <div class="form-item-meta">批次: {{ item.batchNo }}</div>
              <div class="form-item-row">
                <span class="lbl">数量</span>
                <van-stepper v-model="item.qty" :min="1" integer />
                <span class="unit">{{ item.unit }}</span>
              </div>
            </div>
          </van-cell-group>

          <div class="form-actions">
            <van-button block type="primary" @click="addItem">+ 添加商品</van-button>
            <van-button block type="success" class="save-btn" :disabled="!canSave" @click="onSave">保存调拨单</van-button>
          </div>
        </div>

        <!-- 调出仓库选择 -->
        <van-popup v-model:show="fromPickerVisible" position="bottom" teleport="body">
          <van-picker
            :columns="warehouseColumns"
            title="选择调出仓库"
            @confirm="onFromConfirm"
            @cancel="fromPickerVisible = false"
          />
        </van-popup>

        <!-- 调入仓库选择 -->
        <van-popup v-model:show="toPickerVisible" position="bottom" teleport="body">
          <van-picker
            :columns="toWarehouseColumns"
            title="选择调入仓库"
            @confirm="onToConfirm"
            @cancel="toPickerVisible = false"
          />
        </van-popup>

        <!-- 添加商品弹窗 -->
        <van-popup v-model:show="productPickerVisible" position="bottom" teleport="body">
          <van-picker
            :columns="productColumns"
            title="选择商品"
            @confirm="onProductConfirm"
            @cancel="productPickerVisible = false"
          />
        </van-popup>

        <!-- 批次选择弹窗 -->
        <van-popup v-model:show="batchPickerVisible" position="bottom" teleport="body">
          <van-picker
            :columns="currentBatchColumns"
            title="选择批次"
            @confirm="onBatchConfirm"
            @cancel="batchPickerVisible = false"
          />
        </van-popup>
      </div>
    </van-popup>

    <!-- 调拨详情弹窗 -->
    <van-popup v-model:show="detailVisible" position="bottom" round :style="{ height: '70%' }" teleport="body">
      <div class="detail-popup">
        <van-nav-bar :title="currentDetail.id" />
        <van-cell-group inset>
          <van-cell title="调出仓库" :value="currentDetail.fromWarehouseName" />
          <van-cell title="调入仓库" :value="currentDetail.toWarehouseName" />
          <van-cell title="状态">
            <van-tag :type="statusTagType(currentDetail.status)" plain>{{ statusLabel(currentDetail.status) }}</van-tag>
          </van-cell>
          <van-cell title="操作人" :value="currentDetail.operator" />
          <van-cell title="创建时间" :value="currentDetail.createdAt" />
        </van-cell-group>
        <div class="detail-title">调拨明细</div>
        <van-cell-group inset>
          <van-cell v-for="(item, i) in currentDetail.items" :key="i" :title="item.name">
            <template #label>
              <div>批次: {{ item.batchNo }}</div>
              <div>数量: {{ item.qty }} {{ item.unit }}</div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useDataStore } from '@/stores/data'
import { showToast, showSuccessToast } from 'vant'
import { formatDate } from '@/utils/index.js'

const dataStore = useDataStore()

// 调拨单列表
const transferList = computed(() => dataStore.transferOrders)

// 新增表单
const formVisible = ref(false)
const form = reactive({
  fromWarehouseId: null,
  fromWarehouseName: '',
  toWarehouseId: null,
  toWarehouseName: '',
  items: []
})

const fromPickerVisible = ref(false)
const toPickerVisible = ref(false)
const productPickerVisible = ref(false)
const batchPickerVisible = ref(false)
const pendingProductId = ref(null)

const warehouseColumns = computed(() =>
  dataStore.warehouses.map(w => ({ text: w.name, value: w.id }))
)
const toWarehouseColumns = computed(() =>
  dataStore.warehouses
    .filter(w => w.id !== form.fromWarehouseId)
    .map(w => ({ text: w.name, value: w.id }))
)

const productColumns = computed(() =>
  dataStore.products
    .filter(p => p.status === 1)
    .map(p => ({ text: `${p.name}(${p.spec})`, value: p.id }))
)

const currentBatchColumns = computed(() => {
  if (!pendingProductId.value) return []
  return dataStore.batches
    .filter(b => b.productId === pendingProductId.value && b.status === 1 && b.remainingQty > 0)
    .map(b => ({ text: `${b.batchNo}(剩${b.remainingQty})`, value: b.id }))
})

const canSave = computed(() => {
  return (
    form.fromWarehouseId &&
    form.toWarehouseId &&
    form.fromWarehouseId !== form.toWarehouseId &&
    form.items.length > 0 &&
    form.items.every(it => it.qty > 0 && it.batchNo)
  )
})

function openCreate() {
  form.fromWarehouseId = null
  form.fromWarehouseName = ''
  form.toWarehouseId = null
  form.toWarehouseName = ''
  form.items.splice(0, form.items.length)
  formVisible.value = true
}

function openFromPicker() {
  fromPickerVisible.value = true
}
function openToPicker() {
  if (!form.fromWarehouseId) {
    showToast('请先选择调出仓库')
    return
  }
  toPickerVisible.value = true
}
function onFromConfirm({ selectedValues, selectedOptions }) {
  form.fromWarehouseId = selectedValues[0]
  form.fromWarehouseName = selectedOptions[0]?.text || ''
  if (form.fromWarehouseId === form.toWarehouseId) {
    form.toWarehouseId = null
    form.toWarehouseName = ''
  }
  fromPickerVisible.value = false
}
function onToConfirm({ selectedValues, selectedOptions }) {
  form.toWarehouseId = selectedValues[0]
  form.toWarehouseName = selectedOptions[0]?.text || ''
  toPickerVisible.value = false
}

function addItem() {
  if (!form.fromWarehouseId) {
    showToast('请先选择调出仓库')
    return
  }
  productPickerVisible.value = true
}
function onProductConfirm({ selectedValues, selectedOptions }) {
  pendingProductId.value = selectedValues[0]
  productPickerVisible.value = false
  if (!currentBatchColumns.value.length) {
    showToast('该商品没有可用批次')
    return
  }
  batchPickerVisible.value = true
}
function onBatchConfirm({ selectedValues, selectedOptions }) {
  const batch = dataStore.batches.find(b => b.id === selectedValues[0])
  const product = dataStore.products.find(p => p.id === pendingProductId.value)
  if (batch && product) {
    form.items.push({
      productId: product.id,
      name: product.name,
      batchNo: batch.batchNo,
      qty: 1,
      unit: product.mainUnit
    })
  }
  pendingProductId.value = null
  batchPickerVisible.value = false
}
function removeItem(idx) {
  form.items.splice(idx, 1)
}

function onSave() {
  if (!canSave.value) {
    showToast('请检查表单完整性')
    return
  }
  dataStore.addTransferOrder({
    fromWarehouseId: form.fromWarehouseId,
    fromWarehouseName: form.fromWarehouseName,
    toWarehouseId: form.toWarehouseId,
    toWarehouseName: form.toWarehouseName,
    items: form.items.map(it => ({ ...it })),
    status: 'submitted',
    operator: '赵库管'
  })
  formVisible.value = false
  showSuccessToast('调拨单已创建')
}

// 详情弹窗
const detailVisible = ref(false)
const currentDetail = reactive({
  id: '',
  fromWarehouseName: '',
  toWarehouseName: '',
  items: [],
  status: '',
  createdAt: '',
  operator: ''
})
function openDetail(order) {
  Object.assign(currentDetail, order)
  detailVisible.value = true
}

// 工具方法
function totalQty(items) {
  return items.reduce((s, it) => s + Number(it.qty || 0), 0)
}
function statusLabel(s) {
  const map = { submitted: '待审核', approved: '已审核', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}
function statusTagType(s) {
  const map = { submitted: 'warning', approved: 'primary', completed: 'success', cancelled: 'default' }
  return map[s] || 'default'
}
</script>

<style scoped>
.stock-transfer-page {
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
.transfer-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin: 8px 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.transfer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.transfer-id {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.transfer-route {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.transfer-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #646566;
  margin-bottom: 6px;
}
.transfer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
}
.transfer-meta span {
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
  margin-bottom: 6px;
}
.form-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-item-row .lbl {
  font-size: 13px;
  color: #646566;
}
.form-item-row .unit {
  font-size: 12px;
  color: #969799;
}
.form-actions {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.save-btn {
  margin-top: 4px;
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
</style>

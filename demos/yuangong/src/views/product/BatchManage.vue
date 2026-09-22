<template>
  <div class="batch-page">
    <!-- 顶部筛选 -->
    <div class="filter-bar">
      <van-search v-model="keyword" placeholder="按商品名称搜索批次" shape="round" />
      <van-dropdown-menu>
        <van-dropdown-item v-model="warehouseId" :options="warehouseOptions" />
        <van-dropdown-item v-model="statusFilter" :options="statusOptions" />
      </van-dropdown-menu>
    </div>

    <!-- 新增按钮 -->
    <div class="action-row">
      <van-button size="small" type="primary" icon="plus" @click="openAdd">新增批次</van-button>
      <span class="action-count">共 {{ filteredBatches.length }} 个批次</span>
    </div>

    <!-- 按商品分组展示 -->
    <div class="batch-wrap" v-if="groupedBatches.length">
      <van-collapse v-model="activeNames">
        <van-collapse-item
          v-for="g in groupedBatches"
          :key="g.productId"
          :name="g.productId"
        >
          <template #title>
            <div class="group-title">
              <span class="group-name">{{ g.productName }}</span>
              <van-tag plain type="primary" size="mini">{{ g.batches.length }} 批</van-tag>
            </div>
          </template>

          <div class="batch-cell" v-for="b in g.batches" :key="b.id">
            <div class="batch-head">
              <span class="batch-no">批次号：{{ b.batchNo }}</span>
              <van-tag v-if="b.id === g.fifoId" type="danger" size="mini" round>优先出库</van-tag>
            </div>
            <div class="batch-row">
              <span>生产：{{ b.productionDate }}</span>
              <span>到期：{{ b.expiryDate }}</span>
            </div>
            <div class="batch-row">
              <span>剩余：{{ b.remainingQty }} {{ g.unit }}</span>
              <span>仓库：{{ getWarehouseName(b.warehouseId) }}</span>
            </div>
            <div class="batch-status">
              <van-tag :color="getExpiryStatus(b.expiryDate).color" size="mini" round>
                {{ getExpiryStatus(b.expiryDate).label }}
              </van-tag>
              <van-tag v-if="b.status === 3" type="danger" size="mini" plain>已过期</van-tag>
            </div>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>
    <van-empty v-else description="暂无批次数据" :image-size="90" />

    <!-- 新增批次弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" round :style="{ height: '70%' }">
      <div class="form-popup">
        <div class="popup-title">新增批次</div>
        <van-cell-group inset>
          <van-field v-model="newBatch.batchNo" label="批次号" placeholder="如 MN20260901" required />
          <van-field
            v-model="productText"
            label="商品"
            placeholder="请选择商品"
            readonly
            is-link
            input-align="right"
            @click="showProductPicker = true"
            required
          />
          <van-field
            v-model="productionText"
            label="生产日期"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="openDate('production')"
          />
          <van-field
            v-model="expiryText"
            label="到期日期"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="openDate('expiry')"
          />
          <van-field label="入库数量" input-align="right">
            <template #right-icon>
              <van-stepper v-model="newBatch.qty" :min="0" :step="1" integer />
            </template>
          </van-field>
          <van-field
            v-model="warehouseText"
            label="入库仓库"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="showWarehousePicker = true"
          />
        </van-cell-group>
        <div class="popup-btn">
          <van-button block type="primary" round @click="onAddBatch">确认新增</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 商品选择器 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round>
      <van-picker
        :columns="productColumns"
        @confirm="onProductConfirm"
        @cancel="showProductPicker = false"
      />
    </van-popup>

    <!-- 仓库选择器 -->
    <van-popup v-model:show="showWarehousePicker" position="bottom" round>
      <van-picker
        :columns="warehouseColumns"
        @confirm="onWarehouseConfirm"
        @cancel="showWarehousePicker = false"
      />
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="dateValue"
        title="选择日期"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { getExpiryStatus } from '@/utils/index'
import dayjs from 'dayjs'

const dataStore = useDataStore()

const keyword = ref('')
const warehouseId = ref(0)
const statusFilter = ref('all')
const activeNames = ref([])

const showAdd = ref(false)
const showProductPicker = ref(false)
const showWarehousePicker = ref(false)
const showDatePicker = ref(false)
const dateValue = ref([])
const dateTarget = ref('production')

const newBatch = reactive({
  batchNo: '',
  productId: null,
  productName: '',
  productionDate: '',
  expiryDate: '',
  qty: 0,
  warehouseId: null,
  warehouseName: ''
})

// 下拉选项
const warehouseOptions = computed(() => [
  { text: '全部仓库', value: 0 },
  ...dataStore.warehouses.map(w => ({ text: w.name, value: w.id }))
])
const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '正常', value: 'normal' },
  { text: '临期', value: 'near' },
  { text: '过期', value: 'expired' }
]

const productColumns = computed(() =>
  dataStore.products.map(p => ({ text: p.name, value: p.id }))
)
const warehouseColumns = computed(() =>
  dataStore.warehouses.map(w => ({ text: w.name, value: w.id }))
)

const productText = computed(() => newBatch.productName)
const warehouseText = computed(() => newBatch.warehouseName)
const productionText = computed(() => newBatch.productionDate || '')
const expiryText = computed(() => newBatch.expiryDate || '')

// 过滤后的批次列表
const filteredBatches = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return dataStore.batches.filter(b => {
    const p = dataStore.products.find(x => x.id === b.productId)
    const pname = p ? p.name.toLowerCase() : ''
    const matchKw = !kw || pname.includes(kw) || b.batchNo.toLowerCase().includes(kw)
    const matchWh = !warehouseId.value || b.warehouseId === warehouseId.value
    const es = getExpiryStatus(b.expiryDate)
    let matchStatus = true
    if (statusFilter.value === 'normal') matchStatus = b.status === 1 && es.type === 'normal'
    else if (statusFilter.value === 'near') matchStatus = b.status === 1 && (es.type === 'warning' || es.type === 'danger')
    else if (statusFilter.value === 'expired') matchStatus = b.status === 3 || es.type === 'expired'
    return matchKw && matchWh && matchStatus
  })
})

// 按商品分组 + FIFO 优先出库标记
const groupedBatches = computed(() => {
  const map = new Map()
  filteredBatches.value.forEach(b => {
    if (!map.has(b.productId)) {
      const p = dataStore.products.find(x => x.id === b.productId)
      map.set(b.productId, { productId: b.productId, productName: p?.name || '未知商品', unit: p?.mainUnit || '', batches: [], fifoId: null })
    }
    map.get(b.productId).batches.push(b)
  })
  const groups = Array.from(map.values())
  groups.forEach(g => {
    // FIFO：可售批次中生产日期最早者标记优先出库
    const sellable = g.batches.filter(b => b.status === 1 && b.remainingQty > 0)
      .sort((a, b) => dayjs(a.productionDate).valueOf() - dayjs(b.productionDate).valueOf())
    g.fifoId = sellable.length ? sellable[0].id : null
    // 按到期日升序展示
    g.batches.sort((a, b) => dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf())
  })
  return groups
})

// 默认展开全部分组，筛选变化后重新展开
watch(groupedBatches, (groups) => {
  activeNames.value = groups.map(g => g.productId)
}, { immediate: true })

function getWarehouseName(id) {
  const w = dataStore.warehouses.find(x => x.id === id)
  return w ? w.name : '-'
}

// 选择器回调
function onProductConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    newBatch.productId = opt.value
    newBatch.productName = opt.text
  }
  showProductPicker.value = false
}
function onWarehouseConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    newBatch.warehouseId = opt.value
    newBatch.warehouseName = opt.text
  }
  showWarehousePicker.value = false
}

function openDate(target) {
  dateTarget.value = target
  const d = dayjs()
  dateValue.value = [String(d.year()), String(d.month() + 1), String(d.date())]
  showDatePicker.value = true
}
function onDateConfirm({ selectedValues }) {
  const dateStr = selectedValues.join('-')
  if (dateTarget.value === 'production') {
    newBatch.productionDate = dateStr
  } else {
    newBatch.expiryDate = dateStr
  }
  showDatePicker.value = false
}

function openAdd() {
  Object.assign(newBatch, {
    batchNo: '', productId: null, productName: '',
    productionDate: '', expiryDate: '', qty: 0,
    warehouseId: null, warehouseName: ''
  })
  showAdd.value = true
}

function onAddBatch() {
  if (!newBatch.batchNo) return showToast('请填写批次号')
  if (!newBatch.productId) return showToast('请选择商品')
  if (!newBatch.productionDate || !newBatch.expiryDate) return showToast('请选择生产/到期日期')
  if (!newBatch.warehouseId) return showToast('请选择入库仓库')

  const p = dataStore.products.find(x => x.id === newBatch.productId)
  dataStore.addBatch({
    batchNo: newBatch.batchNo,
    productId: newBatch.productId,
    productionDate: newBatch.productionDate,
    expiryDate: newBatch.expiryDate,
    remainingQty: newBatch.qty,
    qty: newBatch.qty,
    warehouseId: newBatch.warehouseId,
    status: 1,
    supplierId: p?.supplierIds?.[0] || null,
    inboundDate: dayjs().format('YYYY-MM-DD'),
    inboundNo: `RK${dayjs().format('YYYYMMDD')}-${String(dataStore.batches.length + 1).padStart(3, '0')}`
  })
  showAdd.value = false
  showSuccessToast('批次已新增')
}
</script>

<style scoped>
.batch-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.filter-bar {
  background: #fff;
}
.filter-bar :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 40px;
}
.action-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
}
.action-count {
  margin-left: auto;
  font-size: 12px;
  color: #969799;
}

.batch-wrap {
  padding: 0 8px;
}
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.batch-cell {
  padding: 10px 4px;
  border-bottom: 1px solid #f7f8fa;
}
.batch-cell:last-child {
  border-bottom: none;
}
.batch-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.batch-no {
  font-size: 13px;
  font-weight: 600;
  color: #1989fa;
}
.batch-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}
.batch-status {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

/* 弹窗表单 */
.form-popup {
  padding: 0 0 16px;
}
.popup-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  padding: 16px 0;
  border-bottom: 1px solid #ebedf0;
}
.popup-btn {
  padding: 20px 16px 0;
}
</style>

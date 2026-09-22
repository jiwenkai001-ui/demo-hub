<template>
  <div class="ledger-page">
    <!-- 食品行业提示 -->
    <van-notice-bar
      left-icon="info-o"
      text="可用于市场监管检查 — 食品版独有重点模块"
      wrapable
      background="#e6f7ff"
      color="#1989fa"
    />

    <!-- 筛选 -->
    <div class="filter-bar">
      <van-field
        v-model="dateRange.start"
        label="起始日期"
        placeholder="点击选择"
        readonly
        is-link
        input-align="right"
        @click="openDate('start')"
        class="date-field"
      />
      <van-field
        v-model="dateRange.end"
        label="截止日期"
        placeholder="点击选择"
        readonly
        is-link
        input-align="right"
        @click="openDate('end')"
        class="date-field"
      />
      <van-button v-if="dateRange.start || dateRange.end" size="mini" plain type="primary" @click="clearDate">清空</van-button>
    </div>
    <van-dropdown-menu class="ledger-menu">
      <van-dropdown-item v-model="supplierFilter" :options="supplierOptions" />
    </van-dropdown-menu>

    <!-- 操作按钮 -->
    <div class="action-row">
      <van-button size="small" type="primary" icon="description" @click="onExport">导出纸质台账</van-button>
      <van-button size="small" type="primary" plain icon="plus" @click="openAdd">新增台账</van-button>
      <span class="action-count">共 {{ filteredList.length }} 条</span>
    </div>

    <!-- 台账列表 -->
    <div class="ledger-wrap">
      <van-empty v-if="!filteredList.length" description="暂无台账记录" :image-size="90" />

      <div class="ledger-item" v-for="l in filteredList" :key="l.id">
        <div class="li-head">
          <span class="li-no">{{ l.inboundNo }}</span>
          <van-tag :color="certStatusColor(l.certStatus)" size="mini" round>{{ certStatusLabel(l.certStatus) }}</van-tag>
        </div>
        <div class="li-row">
          <span class="li-supplier"><van-icon name="friends-o" /> {{ l.supplierName }}</span>
        </div>
        <div class="li-row">
          <span>商品：{{ l.productName }}</span>
          <span>批次：{{ l.batchNo }}</span>
        </div>
        <div class="li-row">
          <span>生产：{{ l.productionDate }}</span>
          <span>到期：{{ l.expiryDate }}</span>
        </div>
        <div class="li-row">
          <span>数量：{{ l.qty }} {{ l.unit }}</span>
          <span>金额：{{ formatMoney(l.invoiceAmount) }}</span>
        </div>
        <div class="li-row">
          <span>入库：{{ l.inboundDate }}</span>
          <span>发票号：{{ l.invoiceNo }}</span>
        </div>
      </div>
    </div>

    <!-- 新增台账弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" round :style="{ height: '80%' }">
      <div class="form-popup">
        <div class="popup-title">新增进货台账</div>
        <van-cell-group inset>
          <van-field
            v-model="supplierText"
            label="供应商"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="showSupplierPicker = true"
            required
          />
          <van-field
            v-model="productText"
            label="商品"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="showProductPicker = true"
            required
          />
          <van-field v-model="newLedger.batchNo" label="批次号" placeholder="如 MN20260901" required />
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
              <van-stepper v-model="newLedger.qty" :min="0" :step="1" integer />
            </template>
          </van-field>
          <van-field v-model="newLedger.unit" label="单位" placeholder="如 箱" />
          <van-field
            v-model="certText"
            label="证票状态"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="showCertPicker = true"
          />
          <van-field v-model="newLedger.invoiceNo" label="发票号" placeholder="如 FP20260920-001" />
          <van-field label="发票金额" input-align="right">
            <template #right-icon>
              <van-stepper v-model="newLedger.invoiceAmount" :min="0" :step="0.01" :decimal-length="2" />
            </template>
          </van-field>
        </van-cell-group>
        <div class="popup-btn">
          <van-button block type="primary" round @click="onAddLedger">确认新增</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 选择器 -->
    <van-popup v-model:show="showSupplierPicker" position="bottom" round>
      <van-picker :columns="supplierColumns" @confirm="onSupplierConfirm" @cancel="showSupplierPicker = false" />
    </van-popup>
    <van-popup v-model:show="showProductPicker" position="bottom" round>
      <van-picker :columns="productColumns" @confirm="onProductConfirm" @cancel="showProductPicker = false" />
    </van-popup>
    <van-popup v-model:show="showCertPicker" position="bottom" round>
      <van-picker :columns="certColumns" @confirm="onCertConfirm" @cancel="showCertPicker = false" />
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
import { ref, reactive, computed } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney } from '@/utils/index'
import dayjs from 'dayjs'

const dataStore = useDataStore()

const supplierFilter = ref(0)
const showAdd = ref(false)
const showSupplierPicker = ref(false)
const showProductPicker = ref(false)
const showCertPicker = ref(false)
const showDatePicker = ref(false)
const dateValue = ref([])
const dateTarget = ref('start')
const dateRange = reactive({ start: '', end: '' })

const newLedger = reactive({
  supplierId: null, supplierName: '',
  productId: null, productName: '',
  batchNo: '', productionDate: '', expiryDate: '',
  qty: 0, unit: '', certStatus: 'complete',
  invoiceNo: '', invoiceAmount: 0
})

// 下拉选项
const supplierOptions = computed(() => [
  { text: '全部供应商', value: 0 },
  ...dataStore.suppliers.map(s => ({ text: s.name, value: s.id }))
])
const supplierColumns = computed(() =>
  dataStore.suppliers.map(s => ({ text: s.name, value: s.id }))
)
const productColumns = computed(() =>
  dataStore.products.map(p => ({ text: p.name, value: p.id }))
)
const certColumns = [
  { text: '证票齐全', value: 'complete' },
  { text: '部分缺失', value: 'partial' },
  { text: '未上传', value: 'missing' }
]

const dateRangeText = computed(() => {
  if (!dateRange.start) return '请选择起止日期'
  if (!dateRange.end) return `${dateRange.start} ~ 至今`
  return `${dateRange.start} ~ ${dateRange.end}`
})
const supplierText = computed(() => newLedger.supplierName)
const productText = computed(() => newLedger.productName)
const productionText = computed(() => newLedger.productionDate)
const expiryText = computed(() => newLedger.expiryDate)
const certText = computed(() => ({
  complete: '证票齐全', partial: '部分缺失', missing: '未上传'
}[newLedger.certStatus]))

// 过滤
const filteredList = computed(() => {
  return dataStore.purchaseLedger.filter(l => {
    const matchSup = !supplierFilter.value || l.supplierId === supplierFilter.value
    let matchDate = true
    const inb = dayjs(l.inboundDate).valueOf()
    if (dateRange.start) matchDate = inb >= dayjs(dateRange.start).startOf('day').valueOf()
    if (dateRange.end) matchDate = matchDate && inb <= dayjs(dateRange.end).endOf('day').valueOf()
    return matchSup && matchDate
  })
})

// 证票状态
function certStatusLabel(s) {
  return { complete: '证票齐全', partial: '部分缺失', missing: '未上传' }[s] || s
}
function certStatusColor(s) {
  return { complete: '#07c160', partial: '#ff976a', missing: '#ee0a24' }[s] || '#969799'
}

function onExport() {
  showToast('台账导出中...')
}

// 日期
function openDate(target) {
  dateTarget.value = target
  const d = dayjs()
  dateValue.value = [String(d.year()), String(d.month() + 1), String(d.date())]
  showDatePicker.value = true
}
function onDateConfirm({ selectedValues }) {
  const dateStr = selectedValues.join('-')
  if (dateTarget.value === 'start' || dateTarget.value === 'end') {
    dateRange[dateTarget.value] = dateStr
  } else {
    // 新增台账的生产/到期日期
    newLedger[dateTarget.value] = dateStr
  }
  showDatePicker.value = false
}
function clearDate() {
  dateRange.start = ''
  dateRange.end = ''
}

// 选择器回调
function onSupplierConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    newLedger.supplierId = opt.value
    newLedger.supplierName = opt.text
  }
  showSupplierPicker.value = false
}
function onProductConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    newLedger.productId = opt.value
    newLedger.productName = opt.text
    const p = dataStore.products.find(x => x.id === opt.value)
    if (p) newLedger.unit = p.mainUnit
  }
  showProductPicker.value = false
}
function onCertConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) newLedger.certStatus = opt.value
  showCertPicker.value = false
}

function openAdd() {
  Object.assign(newLedger, {
    supplierId: null, supplierName: '',
    productId: null, productName: '',
    batchNo: '', productionDate: '', expiryDate: '',
    qty: 0, unit: '', certStatus: 'complete',
    invoiceNo: '', invoiceAmount: 0
  })
  showAdd.value = true
}

function onAddLedger() {
  if (!newLedger.supplierId) return showToast('请选择供应商')
  if (!newLedger.productId) return showToast('请选择商品')
  if (!newLedger.batchNo) return showToast('请填写批次号')
  if (!newLedger.productionDate || !newLedger.expiryDate) return showToast('请选择生产/到期日期')

  dataStore.addLedger({
    inboundNo: `RK${dayjs().format('YYYYMMDD')}-${String(dataStore.purchaseLedger.length + 1).padStart(3, '0')}`,
    supplierId: newLedger.supplierId,
    supplierName: newLedger.supplierName,
    productId: newLedger.productId,
    productName: newLedger.productName,
    batchNo: newLedger.batchNo,
    productionDate: newLedger.productionDate,
    expiryDate: newLedger.expiryDate,
    qty: newLedger.qty,
    unit: newLedger.unit,
    certStatus: newLedger.certStatus,
    certFiles: [],
    invoiceNo: newLedger.invoiceNo,
    invoiceAmount: newLedger.invoiceAmount,
    inboundDate: dayjs().format('YYYY-MM-DD')
  })
  showAdd.value = false
  showSuccessToast('台账已新增')
}
</script>

<style scoped>
.ledger-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.filter-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 4px;
}
.date-field {
  flex: 1;
}
.ledger-menu :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 40px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
}
.action-count {
  margin-left: auto;
  font-size: 12px;
  color: #969799;
}

.ledger-wrap {
  padding: 0 10px;
}
.ledger-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.li-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.li-no {
  font-size: 14px;
  font-weight: 600;
  color: #1989fa;
}
.li-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}
.li-supplier {
  color: #323233;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
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

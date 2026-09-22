<template>
  <div class="inbound-page">
    <!-- 待入库列表 -->
    <div class="section">
      <div class="section-title">
        <span>待入库订单</span>
        <van-tag type="warning" round>{{ pendingOrders.length }}</van-tag>
      </div>
      <div class="order-list">
        <div
          v-for="order in pendingOrders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-card-header">
            <span class="order-id">{{ order.id }}</span>
            <van-tag type="warning" round plain>待入库</van-tag>
          </div>
          <div class="order-card-supplier">
            <van-icon name="friends-o" />
            {{ order.supplierName }}
          </div>
          <div class="order-card-items">
            <div v-for="(it, i) in order.items" :key="i" class="order-item-line">
              <span class="oi-name">{{ it.name }}</span>
              <span class="oi-spec">{{ it.spec }}</span>
              <span class="oi-qty">×{{ it.qty }}{{ it.unit }}</span>
            </div>
          </div>
          <div class="order-card-footer">
            <div class="order-amount">
              <span class="oa-label">合计</span>
              <span class="oa-value">{{ formatMoney(order.totalAmount) }}</span>
            </div>
            <van-button size="small" type="primary" icon="logistics" @click="openInbound(order)">
              入库
            </van-button>
          </div>
        </div>
        <van-empty v-if="!pendingOrders.length" description="暂无待入库订单" :image-size="80" />
      </div>
    </div>

    <!-- 已入库列表 -->
    <div class="section">
      <div class="section-title">
        <span>已入库记录</span>
        <van-tag type="success" round>{{ inboundOrders.length }}</van-tag>
      </div>
      <div class="order-list">
        <div
          v-for="order in inboundOrders"
          :key="order.id"
          class="order-card inbounded"
        >
          <div class="order-card-header">
            <span class="order-id">{{ order.id }}</span>
            <van-tag type="success" round>已入库</van-tag>
          </div>
          <div class="order-card-supplier">
            <van-icon name="friends-o" />
            {{ order.supplierName }}
          </div>
          <div class="order-inbound-no">
            <van-icon name="label-o" />
            入库单号: <span class="inbound-no">{{ order.inboundNo }}</span>
          </div>
          <div class="order-card-items">
            <div v-for="(it, i) in order.items" :key="i" class="order-item-line">
              <span class="oi-name">{{ it.name }}</span>
              <span class="oi-spec">{{ it.spec }}</span>
              <span class="oi-qty">×{{ it.qty }}{{ it.unit }}</span>
            </div>
          </div>
          <div class="order-card-footer">
            <div class="order-amount">
              <span class="oa-label">合计</span>
              <span class="oa-value">{{ formatMoney(order.totalAmount) }}</span>
            </div>
            <span class="order-time">{{ order.createdAt }}</span>
          </div>
        </div>
        <van-empty v-if="!inboundOrders.length" description="暂无已入库记录" :image-size="80" />
      </div>
    </div>

    <!-- 入库弹窗 -->
    <van-popup
      v-model:show="showInbound"
      position="bottom"
      round
      :style="{ height: '90vh' }"
      closeable
      close-icon-position="top-left"
    >
      <div class="popup-header">
        <span class="popup-title">采购入库</span>
      </div>
      <div v-if="currentOrder" class="popup-body">
        <van-cell-group inset>
          <van-cell title="采购单号" :value="currentOrder.id" />
          <van-cell title="供应商" :value="currentOrder.supplierName" />
          <van-cell title="商品数" :value="`${currentOrder.items.length} 件`" />
        </van-cell-group>

        <van-cell-group inset class="form-group">
          <van-field
            :model-value="warehouseName"
            label="入库仓库"
            placeholder="请选择入库仓库"
            readonly
            is-link
            input-align="right"
            :required="true"
            @click="showWarehousePicker = true"
          />
          <van-cell title="入库单号">
            <span class="inbound-no-preview">{{ inboundNoPreview }}</span>
          </van-cell>
        </van-cell-group>

        <div class="section-title">
          <span>批次信息</span>
          <span class="sub-tip">每个商品录入批次</span>
        </div>
        <div
          v-for="(it, idx) in batchForm.items"
          :key="idx"
          class="batch-block"
        >
          <div class="batch-head">
            <span class="bh-name">{{ it.name }}</span>
            <span class="bh-spec">{{ it.spec }}</span>
          </div>
          <van-cell-group inset>
            <van-cell title="入库数量">
              <van-stepper v-model="it.qty" :min="1" :max="it.originQty" integer />
            </van-cell>
            <van-field
              v-model="it.batchNo"
              label="批次号"
              placeholder="如：MN20260920"
              input-align="right"
              :required="true"
            />
            <van-field
              :model-value="it.productionDate"
              label="生产日期"
              placeholder="点击选择"
              readonly
              is-link
              input-align="right"
              :required="true"
              @click="openDatePicker(idx)"
            />
            <van-cell title="保质期天数" :value="`${it.shelfLifeDays} 天`" />
            <van-cell v-if="it.expiryDate" title="到期日期">
              <span class="expiry-text" :style="{ color: expiryColor(it.expiryDate) }">
                {{ it.expiryDate }}
              </span>
            </van-cell>
          </van-cell-group>
        </div>
      </div>

      <div class="popup-footer">
        <van-button block type="primary" @click="onConfirmInbound">确认入库</van-button>
      </div>
    </van-popup>

    <!-- 仓库选择 -->
    <van-popup v-model:show="showWarehousePicker" position="bottom" round>
      <van-picker
        :columns="warehouseColumns"
        title="选择入库仓库"
        @confirm="onWarehouseConfirm"
        @cancel="showWarehousePicker = false"
      />
    </van-popup>

    <!-- 日期选择 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="currentDate"
        title="选择生产日期"
        :max-date="maxDate"
        :min-date="minDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney, formatDate } from '@/utils/index.js'
import dayjs from 'dayjs'

const dataStore = useDataStore()

const showInbound = ref(false)
const showWarehousePicker = ref(false)
const showDatePicker = ref(false)
const currentOrder = ref(null)
const pickingIdx = ref(0)
const warehouseId = ref(null)
const warehouseName = ref('')
const currentDate = ref([])
const minDate = new Date(dayjs().subtract(2, 'year').valueOf())
const maxDate = new Date()

// 待入库订单
const pendingOrders = computed(() =>
  dataStore.purchaseOrders.filter(o => o.status === 'pending')
)
// 已入库订单
const inboundOrders = computed(() =>
  dataStore.purchaseOrders.filter(o => o.status === 'inbound')
)

// 仓库选项
const warehouseColumns = computed(() =>
  dataStore.warehouses.map(w => ({ text: w.name, value: w.id }))
)

// 入库单号预览
const inboundNoPreview = computed(() =>
  `RK${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 900) + 100)}`
)

// 批次表单
const batchForm = reactive({ items: [] })

function openInbound(order) {
  currentOrder.value = order
  warehouseId.value = null
  warehouseName.value = ''
  batchForm.items = order.items.map(it => {
    const product = dataStore.products.find(p => p.id === it.productId)
    return {
      productId: it.productId,
      name: it.name,
      spec: it.spec,
      unit: it.unit,
      originQty: it.qty,
      qty: it.qty,
      batchNo: '',
      productionDate: '',
      expiryDate: '',
      shelfLifeDays: product?.shelfLifeDays || 0
    }
  })
  showInbound.value = true
}

function onWarehouseConfirm({ selectedOptions }) {
  const w = selectedOptions[0]
  if (w) {
    warehouseId.value = w.value
    warehouseName.value = w.text
  }
  showWarehousePicker.value = false
}

function openDatePicker(idx) {
  pickingIdx.value = idx
  const it = batchForm.items[idx]
  if (it.productionDate) {
    const d = dayjs(it.productionDate)
    currentDate.value = [String(d.year()), String(d.month() + 1), String(d.date())]
  } else {
    const d = dayjs()
    currentDate.value = [String(d.year()), String(d.month() + 1), String(d.date())]
  }
  showDatePicker.value = true
}

function onDateConfirm({ selectedValues }) {
  const dateStr = selectedValues.join('-')
  const it = batchForm.items[pickingIdx.value]
  it.productionDate = dateStr
  // 自动计算到期日
  if (it.shelfLifeDays > 0) {
    it.expiryDate = dayjs(dateStr).add(it.shelfLifeDays, 'day').format('YYYY-MM-DD')
  }
  showDatePicker.value = false
}

function expiryColor(date) {
  const diff = dayjs(date).diff(dayjs(), 'day')
  if (diff < 0) return '#ee0a24'
  if (diff <= 7) return '#ee0a24'
  if (diff <= 30) return '#ff976a'
  return '#07c160'
}

function onConfirmInbound() {
  if (!warehouseId.value) {
    showToast('请选择入库仓库')
    return
  }
  // 校验批次信息
  for (const it of batchForm.items) {
    if (!it.batchNo) {
      showToast(`请填写 ${it.name} 的批次号`)
      return
    }
    if (!it.productionDate) {
      showToast(`请选择 ${it.name} 的生产日期`)
      return
    }
  }
  // 生成入库单号
  const inboundNo = inboundNoPreview.value
  // 创建批次记录
  batchForm.items.forEach(it => {
    dataStore.addBatch({
      batchNo: it.batchNo,
      productId: it.productId,
      productionDate: it.productionDate,
      expiryDate: it.expiryDate,
      remainingQty: it.qty,
      warehouseId: warehouseId.value,
      status: 1,
      supplierId: currentOrder.value.supplierId,
      inboundDate: dayjs().format('YYYY-MM-DD'),
      inboundNo
    })
    // 增加汇总库存
    const sumItem = dataStore.stockSummary.find(
      s => s.productId === it.productId && s.warehouseId === warehouseId.value
    )
    if (sumItem) {
      sumItem.qty += it.qty
    } else {
      dataStore.stockSummary.push({
        productId: it.productId,
        warehouseId: warehouseId.value,
        qty: it.qty
      })
    }
  })
  // 更新采购单状态
  currentOrder.value.status = 'inbound'
  currentOrder.value.inboundNo = inboundNo
  showSuccessToast('入库成功')
  showInbound.value = false
}
</script>

<style scoped>
.inbound-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

.section {
  margin-top: 12px;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.sub-tip {
  font-size: 12px;
  color: #969799;
  font-weight: normal;
}

.order-list {
  padding: 0 8px;
}
.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin: 0 4px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.order-card.inbounded {
  border-left: 3px solid #07c160;
}
.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.order-id {
  font-size: 15px;
  font-weight: 700;
  color: #323233;
}
.order-card-supplier {
  font-size: 13px;
  color: #1989fa;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.order-inbound-no {
  font-size: 12px;
  color: #646566;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}
.inbound-no {
  color: #07c160;
  font-weight: 600;
}
.order-card-items {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
}
.order-item-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #646566;
  padding: 2px 0;
}
.oi-name { flex: 1; }
.oi-spec { margin: 0 8px; color: #969799; }
.oi-qty { color: #323233; }
.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #ebedf0;
  padding-top: 8px;
}
.order-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.oa-label { font-size: 12px; color: #969799; }
.oa-value { font-size: 16px; font-weight: 700; color: #ee0a24; }
.order-time {
  font-size: 11px;
  color: #969799;
}

/* 弹窗 */
.popup-header {
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #ebedf0;
}
.popup-title {
  font-size: 16px;
  font-weight: 600;
}
.popup-body {
  padding: 8px 0 100px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}
.popup-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #ebedf0;
}

.form-group {
  margin-top: 12px;
}
.inbound-no-preview {
  color: #07c160;
  font-weight: 600;
  font-size: 13px;
}

/* 批次块 */
.batch-block {
  margin-bottom: 12px;
}
.batch-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
}
.bh-name { color: #1989fa; }
.bh-spec { color: #969799; font-size: 12px; font-weight: normal; }
.expiry-text {
  font-weight: 600;
}
</style>

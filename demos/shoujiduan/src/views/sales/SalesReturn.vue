<template>
  <div class="sales-return-page">
    <div class="page-actions">
      <van-button type="primary" block icon="plus" @click="onAdd">新增退货</van-button>
    </div>

    <van-cell-group inset title="退货列表">
      <van-empty v-if="!returns.length" description="暂无退货记录" :image-size="80" />
      <van-cell v-for="r in returns" :key="r.id">
        <template #title>
          <div class="ret-row">
            <span class="ret-cust">{{ r.customerName }}</span>
            <van-tag :type="retStatusType(r.status)" plain size="mini">{{ retStatusLabel(r.status) }}</van-tag>
          </div>
          <div class="ret-meta">退货单号: {{ r.id }}</div>
          <div class="ret-meta">原销售单: {{ r.originalOrder }}</div>
          <div class="ret-meta">日期: {{ r.createdAt }}</div>
          <div class="ret-items">
            <span v-for="(it, i) in r.items" :key="i" class="ret-item">
              {{ it.name }} ×{{ it.qty }}{{ it.unit }}
            </span>
          </div>
        </template>
        <template #value>
          <span class="ret-amt">{{ formatMoney(r.totalAmount) }}</span>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 新增退货 popup -->
    <van-popup v-model:show="showForm" position="bottom" round teleport="body" :style="{ height: '85%' }">
      <div class="form-wrap">
        <div class="form-title">新增退货单</div>
        <van-cell-group inset>
          <van-cell title="选择客户" is-link :value="form.customerLabel" @click="showCustomerPicker = true" />
          <van-cell title="原销售单" is-link :value="form.orderLabel" @click="onPickOrder" />
        </van-cell-group>

        <van-cell-group inset title="退货商品" v-if="form.selectedItems.length">
          <div v-for="(it, i) in form.selectedItems" :key="i" class="ret-item-row">
            <div class="ret-item-head">
              <van-checkbox v-model="it.checked" shape="square">{{ it.name }}</van-checkbox>
              <span class="ret-item-spec">{{ it.spec }} · {{ it.batchNo }}</span>
            </div>
            <div class="ret-item-info">
              <span>可退: {{ it.qty }}{{ it.unit }} · 单价 {{ formatMoney(it.price) }}</span>
            </div>
            <div class="ret-item-row2">
              <span class="row-label">退货数量</span>
              <van-stepper v-model="it.returnQty" :min="0" :max="it.qty" integer />
            </div>
            <van-field v-model="it.reason" label="退货原因" placeholder="如：包装破损/临期/质量问题" />
          </div>
        </van-cell-group>

        <van-cell-group inset title="结算" v-if="form.selectedItems.length">
          <van-cell title="退货商品数" :value="`${formReturnCount} 件`" />
          <van-cell title="退货金额">
            <template #value>
              <span class="ret-amt">{{ formatMoney(formTotalAmount) }}</span>
            </template>
          </van-cell>
        </van-cell-group>

        <div class="form-actions">
          <van-button block plain @click="showForm = false" style="margin-bottom: 8px;">取消</van-button>
          <van-button block type="primary" :disabled="!canSave" @click="onSave">保存退货单</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 客户 picker -->
    <van-popup v-model:show="showCustomerPicker" position="bottom" round teleport="body">
      <van-picker
        :columns="customerColumns"
        title="选择客户"
        @confirm="onCustomerConfirm"
        @cancel="showCustomerPicker = false"
      />
    </van-popup>

    <!-- 原单 picker -->
    <van-popup v-model:show="showOrderPicker" position="bottom" round teleport="body">
      <van-picker
        :columns="orderColumns"
        title="选择原销售单"
        @confirm="onOrderConfirm"
        @cancel="showOrderPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import dayjs from 'dayjs'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { formatMoney } from '@/utils/index.js'

const dataStore = useDataStore()
const authStore = useAuthStore()
authStore.restore()

// 退货列表
const returns = computed(() => dataStore.salesReturns)

// 新增表单
const showForm = ref(false)
const form = reactive({
  customerId: null,
  customerLabel: '请选择',
  orderId: null,
  orderLabel: '请选择',
  selectedItems: []
})

function onAdd() {
  form.customerId = null
  form.customerLabel = '请选择'
  form.orderId = null
  form.orderLabel = '请选择'
  form.selectedItems = []
  showForm.value = true
}

// 客户选择
const showCustomerPicker = ref(false)
const customerColumns = computed(() =>
  dataStore.customers.map(c => ({ text: `${c.name} (${c.code})`, value: c.id }))
)
function onCustomerConfirm({ selectedValues }) {
  const id = selectedValues[0]
  const c = dataStore.customers.find(c => c.id === id)
  if (c) {
    form.customerId = c.id
    form.customerLabel = `${c.name} (${c.code})`
    // 重置原单选择
    form.orderId = null
    form.orderLabel = '请选择'
    form.selectedItems = []
  }
  showCustomerPicker.value = false
}

// 原单选择
const showOrderPicker = ref(false)
const orderColumns = computed(() => {
  const list = form.customerId
    ? dataStore.salesOrders.filter(o => o.customerId === form.customerId)
    : dataStore.salesOrders
  return list.map(o => ({ text: `${o.id} · ${o.customerName} · ¥${o.payAmount}`, value: o.id }))
})
function onPickOrder() {
  if (!form.customerId) {
    showToast('请先选择客户')
    return
  }
  if (!orderColumns.value.length) {
    showToast('该客户无销售订单')
    return
  }
  showOrderPicker.value = true
}
function onOrderConfirm({ selectedValues }) {
  const id = selectedValues[0]
  const o = dataStore.salesOrders.find(o => o.id === id)
  if (o) {
    form.orderId = o.id
    form.orderLabel = o.id
    form.selectedItems = (o.items || []).map(it => ({
      productId: it.productId,
      name: it.name,
      spec: it.spec,
      unit: it.unit,
      batchNo: it.batchNo,
      price: it.price,
      qty: it.qty,
      returnQty: it.qty,
      reason: '',
      checked: true
    }))
  }
  showOrderPicker.value = false
}

// 退货金额
const formReturnCount = computed(() =>
  form.selectedItems.filter(i => i.checked && i.returnQty > 0).reduce((s, i) => s + i.returnQty, 0)
)
const formTotalAmount = computed(() =>
  form.selectedItems
    .filter(i => i.checked && i.returnQty > 0)
    .reduce((s, i) => s + i.returnQty * i.price, 0)
)
const canSave = computed(() =>
  form.customerId && form.orderId && formReturnCount.value > 0
)

// 保存
function onSave() {
  if (!form.customerId) {
    showToast('请选择客户')
    return
  }
  if (!form.orderId) {
    showToast('请选择原销售单')
    return
  }
  if (formReturnCount.value <= 0) {
    showToast('请填写退货数量')
    return
  }
  const customer = dataStore.customers.find(c => c.id === form.customerId)
  const items = form.selectedItems
    .filter(i => i.checked && i.returnQty > 0)
    .map(i => ({
      productId: i.productId,
      name: i.name,
      batchNo: i.batchNo,
      qty: i.returnQty,
      unit: i.unit,
      reason: i.reason || '未说明'
    }))
  const newReturn = {
    id: `TH${dayjs().format('YYYYMMDD')}-${String(dataStore.salesReturns.length + 1).padStart(3, '0')}`,
    customerName: customer?.name || '',
    originalOrder: form.orderId,
    items,
    totalAmount: +formTotalAmount.value.toFixed(2),
    status: 'pending',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm')
  }
  dataStore.salesReturns.unshift(newReturn)
  showForm.value = false
  showSuccessToast('退货单已保存')
}

// 工具
function retStatusLabel(s) {
  const map = { pending: '待审核', approved: '已审核', rejected: '已驳回', completed: '已完成' }
  return map[s] || s
}
function retStatusType(s) {
  const map = { pending: 'warning', approved: 'primary', rejected: 'danger', completed: 'success' }
  return map[s] || 'default'
}
</script>

<style scoped>
.sales-return-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px 0 24px;
}
.page-actions {
  padding: 0 16px 12px;
}

/* 退货列表 */
.ret-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.ret-cust { font-size: 14px; font-weight: 600; color: #323233; }
.ret-meta { font-size: 12px; color: #969799; line-height: 1.6; }
.ret-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 4px;
}
.ret-item {
  font-size: 12px;
  color: #646566;
  background: #f7f8fa;
  padding: 2px 6px;
  border-radius: 4px;
}
.ret-amt {
  font-size: 15px;
  font-weight: 700;
  color: #ee0a24;
}

/* 新增表单 */
.form-wrap {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
}
.form-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 0;
}
.ret-item-row {
  padding: 10px 4px;
  border-bottom: 1px solid #f2f3f5;
}
.ret-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.ret-item-spec { font-size: 12px; color: #969799; }
.ret-item-info {
  font-size: 12px;
  color: #646566;
  margin-bottom: 4px;
}
.ret-item-row2 {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.ret-item-row2 .row-label {
  font-size: 13px;
  color: #646566;
  width: 70px;
}
.form-actions {
  padding: 16px;
}
</style>

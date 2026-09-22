<template>
  <div class="return-page">
    <!-- 顶部统计 -->
    <div class="head-bar">
      <div class="hb-info">
        <div class="hb-title">采购退货</div>
        <div class="hb-sub">已记录 {{ dataStore.purchaseReturns.length }} 单退货</div>
      </div>
      <van-button type="primary" size="small" icon="plus" round @click="openCreate">新增退货</van-button>
    </div>

    <!-- 退货列表 -->
    <div class="return-list">
      <div
        v-for="ret in dataStore.purchaseReturns"
        :key="ret.id"
        class="return-card"
      >
        <div class="return-card-header">
          <span class="return-id">{{ ret.id }}</span>
          <van-tag :type="ret.status === 'pending' ? 'warning' : 'success'" round plain>
            {{ ret.status === 'pending' ? '待处理' : '已处理' }}
          </van-tag>
        </div>
        <div class="return-card-supplier">
          <van-icon name="friends-o" />
          {{ ret.supplierName }}
        </div>
        <div class="return-card-items">
          <div v-for="(it, i) in ret.items" :key="i" class="return-item-line">
            <span class="ri-name">{{ it.name }}</span>
            <span class="ri-batch">{{ it.batchNo }}</span>
            <span class="ri-qty">×{{ it.qty }}{{ it.unit }}</span>
            <span v-if="it.reason" class="ri-reason">{{ it.reason }}</span>
          </div>
        </div>
        <div class="return-card-footer">
          <div class="return-amount">
            <span class="ra-label">退货金额</span>
            <span class="ra-value">{{ formatMoney(ret.totalAmount) }}</span>
          </div>
          <span class="return-time">{{ ret.createdAt }}</span>
        </div>
      </div>
      <van-empty v-if="!dataStore.purchaseReturns.length" description="暂无退货记录" :image-size="80" />
    </div>

    <!-- 新增退货弹窗 -->
    <van-popup
      v-model:show="showCreate"
      position="bottom"
      round
      :style="{ height: '90vh' }"
      closeable
      close-icon-position="top-left"
    >
      <div class="popup-header">
        <span class="popup-title">新增采购退货</span>
      </div>
      <div class="popup-body">
        <van-cell-group inset>
          <van-field
            :model-value="form.orderId"
            label="原采购单"
            placeholder="请选择原采购单"
            readonly
            is-link
            input-align="right"
            :required="true"
            @click="openOrderPicker"
          />
          <van-cell v-if="form.supplierName" title="供应商" :value="form.supplierName" />
        </van-cell-group>

        <div class="section-title">
          <span>退货商品</span>
          <span class="sub-tip">选择商品并填写退货数量及原因</span>
        </div>
        <div v-if="form.items.length === 0" class="items-empty">
          请先选择原采购单
        </div>
        <div v-for="(it, idx) in form.items" :key="idx" class="return-item-block">
          <div class="rib-head">
            <span class="rib-name">{{ it.name }}</span>
            <van-checkbox v-model="it.selected" shape="square">退货</van-checkbox>
          </div>
          <van-cell-group inset>
            <van-cell title="规格/批次">
              <span class="cell-val">{{ it.spec }} / {{ it.batchNo }}</span>
            </van-cell>
            <van-cell title="原数量">
              <span>{{ it.originQty }}{{ it.unit }}</span>
            </van-cell>
            <van-cell title="退货数量" v-if="it.selected">
              <van-stepper v-model="it.qty" :min="1" :max="it.originQty" integer />
            </van-cell>
            <van-field
              v-if="it.selected"
              v-model="it.reason"
              label="退货原因"
              placeholder="如：临近过期 / 包装破损"
              input-align="right"
            />
          </van-cell-group>
        </div>

        <van-cell-group inset class="total-group" v-if="form.items.some(i => i.selected)">
          <van-cell title="退货合计">
            <span class="amount-val">{{ formatMoney(returnTotal) }}</span>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="popup-footer">
        <van-button block type="primary" @click="onSave">保存退货单</van-button>
      </div>
    </van-popup>

    <!-- 原采购单选择 -->
    <van-popup v-model:show="showOrderPicker" position="bottom" round>
      <van-picker
        :columns="orderColumns"
        title="选择原采购单"
        @confirm="onOrderConfirm"
        @cancel="showOrderPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney, formatDate } from '@/utils/index.js'
import dayjs from 'dayjs'

const dataStore = useDataStore()

const showCreate = ref(false)
const showOrderPicker = ref(false)

const defaultForm = () => ({
  orderId: '',
  supplierId: null,
  supplierName: '',
  items: []
})
const form = reactive(defaultForm())

// 可退货订单（已入库的）
const orderColumns = computed(() =>
  dataStore.purchaseOrders
    .filter(o => o.status === 'inbound')
    .map(o => ({
      text: `${o.id} - ${o.supplierName}`,
      value: o.id
    }))
)

// 退货总额
const returnTotal = computed(() => {
  return form.items
    .filter(i => i.selected)
    .reduce((sum, it) => sum + it.price * it.qty, 0)
})

function openCreate() {
  Object.assign(form, defaultForm())
  showCreate.value = true
}

function openOrderPicker() {
  if (!orderColumns.value.length) {
    showToast('暂无可退货的采购单')
    return
  }
  showOrderPicker.value = true
}

function onOrderConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (!opt) {
    showOrderPicker.value = false
    return
  }
  const order = dataStore.purchaseOrders.find(o => o.id === opt.value)
  if (order) {
    form.orderId = order.id
    form.supplierId = order.supplierId
    form.supplierName = order.supplierName
    // 加载批次信息
    form.items = order.items.map(it => {
      const batch = dataStore.batches.find(
        b => b.productId === it.productId && b.supplierId === order.supplierId
      )
      return {
        productId: it.productId,
        name: it.name,
        spec: it.spec,
        unit: it.unit,
        batchNo: batch?.batchNo || '',
        price: it.price,
        originQty: it.qty,
        qty: it.qty,
        reason: '',
        selected: false
      }
    })
  }
  showOrderPicker.value = false
}

function onSave() {
  if (!form.orderId) {
    showToast('请选择原采购单')
    return
  }
  const selected = form.items.filter(i => i.selected)
  if (!selected.length) {
    showToast('请选择退货商品')
    return
  }
  for (const it of selected) {
    if (!it.reason) {
      showToast(`请填写 ${it.name} 的退货原因`)
      return
    }
    if (it.qty > it.originQty) {
      showToast(`${it.name} 退货数量超出原数量`)
      return
    }
  }
  const ret = {
    id: `CGTH${dayjs().format('YYYYMMDD')}-${String(dataStore.purchaseReturns.length + 1).padStart(3, '0')}`,
    supplierId: form.supplierId,
    supplierName: form.supplierName,
    originalOrder: form.orderId,
    items: selected.map(it => ({
      productId: it.productId,
      name: it.name,
      batchNo: it.batchNo,
      qty: it.qty,
      unit: it.unit,
      reason: it.reason
    })),
    totalAmount: +returnTotal.value.toFixed(2),
    status: 'pending',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm')
  }
  dataStore.purchaseReturns.unshift(ret)
  showSuccessToast('退货单已创建')
  showCreate.value = false
}
</script>

<style scoped>
.return-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

/* 顶部 */
.head-bar {
  background: linear-gradient(120deg, #ee0a24 0%, #ff6b6b 100%);
  color: #fff;
  padding: 18px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hb-title {
  font-size: 18px;
  font-weight: 700;
}
.hb-sub {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

/* 列表 */
.return-list {
  padding: 8px;
  margin-top: 8px;
}
.return-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin: 0 4px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  border-left: 3px solid #ee0a24;
}
.return-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.return-id {
  font-size: 15px;
  font-weight: 700;
  color: #323233;
}
.return-card-supplier {
  font-size: 13px;
  color: #1989fa;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.return-card-items {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
}
.return-item-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #646566;
  padding: 2px 0;
}
.ri-name { color: #323233; font-weight: 600; }
.ri-batch { color: #969799; }
.ri-qty { color: #ee0a24; }
.ri-reason {
  color: #ff976a;
  background: #fff7e8;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.return-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #ebedf0;
  padding-top: 8px;
}
.return-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ra-label { font-size: 12px; color: #969799; }
.ra-value { font-size: 16px; font-weight: 700; color: #ee0a24; }
.return-time {
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
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 6px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.sub-tip {
  font-size: 12px;
  color: #969799;
  font-weight: normal;
}
.items-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: #969799;
}
.return-item-block {
  margin-bottom: 12px;
}
.rib-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
}
.rib-name { color: #1989fa; }
.cell-val { color: #646566; }
.amount-val {
  color: #ee0a24;
  font-weight: 700;
  font-size: 16px;
}
.total-group { margin-top: 12px; }
</style>

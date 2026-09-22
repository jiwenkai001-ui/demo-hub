<template>
  <div class="purchase-order-page">
    <!-- 状态统计 -->
    <div class="stat-bar">
      <div class="stat-item">
        <div class="stat-num">{{ totalCount }}</div>
        <div class="stat-label">全部</div>
      </div>
      <div class="stat-item">
        <div class="stat-num stat-warn">{{ pendingCount }}</div>
        <div class="stat-label">待入库</div>
      </div>
      <div class="stat-item">
        <div class="stat-num stat-success">{{ inboundCount }}</div>
        <div class="stat-label">已入库</div>
      </div>
      <div class="stat-item">
        <div class="stat-num stat-danger">{{ returnedCount }}</div>
        <div class="stat-label">已退货</div>
      </div>
    </div>

    <!-- 状态标签 -->
    <van-tabs v-model:active="activeTab" sticky :offset-top="46" class="order-tabs">
      <van-tab title="全部" name="all" />
      <van-tab title="待入库" name="pending" />
      <van-tab title="已入库" name="inbound" />
      <van-tab title="已退货" name="returned" />
    </van-tabs>

    <!-- 订单列表 -->
    <div class="order-list">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        @click="openDetail(order)"
      >
        <div class="order-card-header">
          <span class="order-id">{{ order.id }}</span>
          <van-tag :type="statusTagType(order.status)" round plain>
            {{ statusLabel(order.status) }}
          </van-tag>
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
          <div v-if="order.items.length > 2" class="oi-more">等 {{ order.items.length }} 件商品</div>
        </div>
        <div class="order-card-footer">
          <div class="order-amount">
            <span class="oa-label">合计</span>
            <span class="oa-value">{{ formatMoney(order.totalAmount) }}</span>
          </div>
          <div class="order-meta">
            <span>{{ order.buyer }}</span>
            <span>{{ order.createdAt }}</span>
          </div>
        </div>
      </div>
      <van-empty v-if="!filteredOrders.length" description="暂无采购订单" :image-size="80" />
    </div>

    <!-- 新增采购单 浮动按钮 -->
    <van-floating-bubble
      icon="plus"
      @click="openCreatePopup"
      class="create-bubble"
    />

    <!-- 新增采购单 弹窗 -->
    <van-popup
      v-model:show="showCreate"
      position="bottom"
      round
      :style="{ height: '90vh' }"
      closeable
      close-icon-position="top-left"
    >
      <div class="popup-header">
        <span class="popup-title">新增采购单</span>
      </div>
      <div class="popup-body">
        <van-cell-group inset>
          <van-field
            :model-value="form.supplierName"
            label="供应商"
            placeholder="请选择供应商"
            readonly
            is-link
            input-align="right"
            :required="true"
            @click="openSupplierPicker"
          />
        </van-cell-group>

        <!-- 商品明细 -->
        <div class="items-section">
          <div class="section-title">
            <span>商品明细</span>
            <van-button size="mini" type="primary" plain icon="plus" @click="addItem">添加商品</van-button>
          </div>
          <div v-if="form.items.length === 0" class="items-empty">
            点击"添加商品"开始录入
          </div>
          <div v-for="(it, idx) in form.items" :key="idx" class="item-block">
            <div class="item-block-head">
              <span class="ib-name">{{ it.name || '未选择商品' }}</span>
              <van-icon name="delete-o" color="#ee0a24" size="18" @click="removeItem(idx)" />
            </div>
            <van-cell-group inset>
              <van-field
                :model-value="it.name"
                label="商品"
                placeholder="点击选择"
                readonly
                is-link
                input-align="right"
                @click="openProductPicker(idx)"
              />
              <van-cell title="规格/单位">
                <span class="cell-val">{{ it.spec || '-' }} / {{ it.unit || '-' }}</span>
              </van-cell>
              <van-cell title="单价">
                <van-stepper v-model="it.price" :step="0.1" :min="0" :decimal-length="4" />
              </van-cell>
              <van-cell title="数量">
                <van-stepper v-model="it.qty" :min="1" integer />
              </van-cell>
              <van-cell title="金额">
                <span class="amount-val">{{ formatMoney(it.price * it.qty) }}</span>
              </van-cell>
            </van-cell-group>
          </div>
        </div>

        <!-- 其他费用 -->
        <van-cell-group inset class="extra-group">
          <van-cell title="商品总额">
            <span class="amount-val">{{ formatMoney(itemTotal) }}</span>
          </van-cell>
          <van-cell title="预付金额">
            <van-stepper v-model="form.prepayAmount" :step="100" :min="0" />
          </van-cell>
          <van-cell title="运费">
            <van-stepper v-model="form.freight" :step="10" :min="0" />
          </van-cell>
          <van-cell title="运费分摊" label="开启后运费按比例分摊到商品成本">
            <van-switch v-model="form.freightAlloc" />
          </van-cell>
          <van-cell title="订单总额">
            <span class="amount-val grand-total">{{ formatMoney(grandTotal) }}</span>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="popup-footer">
        <van-button block type="primary" @click="onSave">保存采购单</van-button>
      </div>
    </van-popup>

    <!-- 供应商选择 -->
    <van-popup v-model:show="showSupplierPicker" position="bottom" round>
      <van-picker
        :columns="supplierColumns"
        title="选择供应商"
        @confirm="onSupplierConfirm"
        @cancel="showSupplierPicker = false"
      />
    </van-popup>

    <!-- 商品选择 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round>
      <van-picker
        :columns="productColumns"
        title="选择商品"
        @confirm="onProductConfirm"
        @cancel="showProductPicker = false"
      />
    </van-popup>

    <!-- 订单详情 -->
    <van-popup
      v-model:show="showDetail"
      position="bottom"
      round
      :style="{ height: '80vh' }"
      closeable
      close-icon-position="top-left"
    >
      <div v-if="currentOrder" class="popup-header">
        <span class="popup-title">采购单详情</span>
      </div>
      <div v-if="currentOrder" class="popup-body">
        <div class="detail-head">
          <div class="dh-id">{{ currentOrder.id }}</div>
          <van-tag :type="statusTagType(currentOrder.status)" round>
            {{ statusLabel(currentOrder.status) }}
          </van-tag>
        </div>
        <van-cell-group inset>
          <van-cell title="供应商" :value="currentOrder.supplierName" />
          <van-cell title="采购员" :value="currentOrder.buyer" />
          <van-cell title="创建时间" :value="currentOrder.createdAt" />
          <van-cell v-if="currentOrder.inboundNo" title="入库单号" :value="currentOrder.inboundNo" />
        </van-cell-group>

        <div class="detail-section-title">商品明细</div>
        <van-cell-group inset>
          <div
            v-for="(it, i) in currentOrder.items"
            :key="i"
            class="detail-item"
          >
            <div class="di-row">
              <span class="di-name">{{ it.name }}</span>
              <span class="di-amount">{{ formatMoney(it.amount) }}</span>
            </div>
            <div class="di-sub">
              {{ it.spec }} · {{ it.qty }}{{ it.unit }} × ¥{{ it.price }}
            </div>
          </div>
        </van-cell-group>

        <van-cell-group inset class="detail-amounts">
          <van-cell title="商品总额">
            <span>{{ formatMoney(currentOrder.totalAmount) }}</span>
          </van-cell>
          <van-cell title="预付金额">
            <span class="text-warn">{{ formatMoney(currentOrder.prepayAmount) }}</span>
          </van-cell>
          <van-cell title="运费">
            <span>{{ formatMoney(currentOrder.freight) }}</span>
          </van-cell>
          <van-cell title="运费分摊">
            <van-tag :type="currentOrder.freightAlloc ? 'success' : 'default'" size="mini">
              {{ currentOrder.freightAlloc ? '是' : '否' }}
            </van-tag>
          </van-cell>
          <van-cell title="应付总额">
            <span class="amount-val grand-total">{{ formatMoney(grandTotalFor(currentOrder)) }}</span>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, formatDate } from '@/utils/index.js'

const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()
authStore.restore()

const activeTab = ref('all')
const showCreate = ref(false)
const showDetail = ref(false)
const showSupplierPicker = ref(false)
const showProductPicker = ref(false)
const currentOrder = ref(null)
const pickingItemIdx = ref(0)

// 统计
const totalCount = computed(() => dataStore.purchaseOrders.length)
const pendingCount = computed(() => dataStore.purchaseOrders.filter(o => o.status === 'pending').length)
const inboundCount = computed(() => dataStore.purchaseOrders.filter(o => o.status === 'inbound').length)
const returnedCount = computed(() => dataStore.purchaseOrders.filter(o => o.status === 'returned').length)

// 列表过滤
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return dataStore.purchaseOrders
  return dataStore.purchaseOrders.filter(o => o.status === activeTab.value)
})

// 状态映射
function statusLabel(s) {
  return { pending: '待入库', inbound: '已入库', returned: '已退货' }[s] || s
}
function statusTagType(s) {
  return { pending: 'warning', inbound: 'success', returned: 'danger' }[s] || 'default'
}

// 供应商选择列
const supplierColumns = computed(() =>
  dataStore.suppliers.map(s => ({ text: s.name, value: s.id }))
)
// 商品选择列
const productColumns = computed(() =>
  dataStore.products.map(p => ({
    text: `${p.name} (${p.spec})`,
    value: p.id
  }))
)

// 新增表单
const defaultForm = () => ({
  supplierId: null,
  supplierName: '',
  items: [],
  prepayAmount: 0,
  freight: 0,
  freightAlloc: false
})
const form = reactive(defaultForm())

// 商品明细总额
const itemTotal = computed(() =>
  form.items.reduce((sum, it) => sum + it.price * it.qty, 0)
)
// 订单总额
const grandTotal = computed(() => itemTotal.value + form.freight)
function grandTotalFor(o) {
  return Number(o.totalAmount) + Number(o.freight || 0)
}

function resetForm() {
  Object.assign(form, defaultForm())
}

function openCreatePopup() {
  resetForm()
  showCreate.value = true
}

function openSupplierPicker() {
  if (!supplierColumns.value.length) {
    showToast('请先添加供应商')
    return
  }
  showSupplierPicker.value = true
}

function onSupplierConfirm({ selectedOptions }) {
  const s = selectedOptions[0]
  if (s) {
    form.supplierId = s.value
    form.supplierName = s.text
  }
  showSupplierPicker.value = false
}

function addItem() {
  form.items.push({
    productId: null,
    name: '',
    spec: '',
    unit: '',
    qty: 1,
    price: 0,
    amount: 0
  })
}

function removeItem(idx) {
  form.items.splice(idx, 1)
}

function openProductPicker(idx) {
  if (!productColumns.value.length) {
    showToast('暂无商品')
    return
  }
  pickingItemIdx.value = idx
  showProductPicker.value = true
}

function onProductConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (!opt) {
    showProductPicker.value = false
    return
  }
  const product = dataStore.products.find(p => p.id === opt.value)
  if (product) {
    const item = form.items[pickingItemIdx.value]
    item.productId = product.id
    item.name = product.name
    item.spec = product.spec
    item.unit = product.mainUnit
    // 自动填充价格
    const sp = dataStore.supplierPrices.find(
      s => s.supplierId === form.supplierId && s.productId === product.id
    )
    item.price = sp ? sp.price : product.costPrice || 0
    item.amount = +(item.price * item.qty).toFixed(2)
  }
  showProductPicker.value = false
}

function onSave() {
  if (!form.supplierId) {
    showToast('请选择供应商')
    return
  }
  if (!form.items.length) {
    showToast('请添加采购商品')
    return
  }
  // 计算金额 + 运费分摊
  const itemsAmount = form.items.reduce((sum, it) => sum + it.price * it.qty, 0)
  const items = form.items.map(it => ({
    ...it,
    amount: +(it.price * it.qty).toFixed(2)
  }))
  // 运费分摊到商品成本
  if (form.freightAlloc && form.freight > 0 && itemsAmount > 0) {
    items.forEach(it => {
      const ratio = (it.price * it.qty) / itemsAmount
      const alloc = +(form.freight * ratio).toFixed(2)
      it.price = +(it.price + alloc / it.qty).toFixed(4)
      it.amount = +(it.price * it.qty).toFixed(2)
    })
  }
  const order = {
    supplierId: form.supplierId,
    supplierName: form.supplierName,
    items,
    totalAmount: +itemsAmount.toFixed(2),
    prepayAmount: form.prepayAmount,
    freight: form.freight,
    freightAlloc: form.freightAlloc,
    status: 'pending',
    buyer: authStore.user?.name || '当前用户',
    inboundNo: ''
  }
  dataStore.addPurchaseOrder(order)
  showSuccessToast('采购单已创建')
  showCreate.value = false
}

function openDetail(order) {
  currentOrder.value = order
  showDetail.value = true
}
</script>

<style scoped>
.purchase-order-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

/* 状态统计 */
.stat-bar {
  display: flex;
  background: linear-gradient(120deg, #1989fa 0%, #4ba9ff 100%);
  color: #fff;
  padding: 16px 8px 24px;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-num {
  font-size: 20px;
  font-weight: 700;
}
.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}
.stat-warn { color: #ffd21e; }
.stat-success { color: #b7f0c8; }
.stat-danger { color: #ffb3b3; }

/* 标签 */
.order-tabs {
  --van-tabs-bottom-bar-color: #1989fa;
}

/* 订单列表 */
.order-list {
  padding: 8px;
}
.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin: 0 4px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
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
.oi-more {
  font-size: 12px;
  color: #969799;
  text-align: center;
  padding-top: 4px;
}
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
.order-meta {
  font-size: 11px;
  color: #969799;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

/* 浮动按钮 */
.create-bubble {
  --van-floating-bubble-background: #1989fa;
  --van-floating-bubble-size: 52px;
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

/* 商品明细区块 */
.items-section {
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
.items-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: #969799;
}
.item-block {
  margin-bottom: 12px;
}
.item-block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
}
.ib-name { color: #1989fa; }

.cell-val { color: #646566; }
.amount-val { color: #ee0a24; font-weight: 600; }
.grand-total { font-size: 16px; font-weight: 700; }
.extra-group { margin-top: 12px; }

/* 详情 */
.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px;
}
.dh-id {
  font-size: 16px;
  font-weight: 700;
  color: #323233;
}
.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  padding: 12px 16px 6px;
}
.detail-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f7f8fa;
}
.detail-item:last-child { border-bottom: none; }
.di-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.di-name { font-size: 14px; color: #323233; }
.di-amount { font-size: 14px; color: #ee0a24; font-weight: 600; }
.di-sub { font-size: 12px; color: #969799; margin-top: 4px; }
.detail-amounts { margin-top: 12px; }
.text-warn { color: #ff976a; }
</style>

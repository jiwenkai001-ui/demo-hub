<template>
  <div class="sales-order-page">
    <!-- 订单信息 -->
    <div class="order-info-card">
      <div class="order-info-row">
        <span class="label">单号</span>
        <span class="value">{{ orderNo }}</span>
      </div>
      <div class="order-info-row">
        <span class="label">日期</span>
        <span class="value">{{ today }}</span>
      </div>
      <div class="order-info-row">
        <span class="label">业务员</span>
        <span class="value">{{ salesman }}</span>
      </div>
    </div>

    <!-- 客户信息 -->
    <van-cell-group inset title="客户信息">
      <van-cell title="选择客户" is-link :value="customerLabel" @click="showCustomerPicker = true" />
      <template v-if="selectedCustomer">
        <van-cell title="客户编码" :value="selectedCustomer.code" />
        <van-cell title="客户分级">
          <template #value>
            <van-tag :type="gradeTagType(selectedCustomer.grade)" plain>{{ selectedCustomer.gradeName }}</van-tag>
          </template>
        </van-cell>
        <van-cell title="账期" :value="`${selectedCustomer.accountPeriod} 天`" />
        <van-cell title="信用额度">
          <template #value>
            <span :class="{ 'credit-over': isCreditOver }">
              {{ formatMoney(selectedCustomer.usedCredit) }} / {{ formatMoney(selectedCustomer.creditLimit) }}
            </span>
          </template>
        </van-cell>
        <van-cell v-if="isCreditOver">
          <template #title>
            <div class="inline-warn">
              <van-icon name="warning-o" color="#ee0a24" />
              <span>信用额度已超限，订单需审批</span>
            </div>
          </template>
        </van-cell>
      </template>
    </van-cell-group>

    <!-- 商品明细 -->
    <van-cell-group inset title="商品明细">
      <van-cell>
        <template #title>
          <div class="add-row">
            <van-button size="small" type="primary" icon="scan" @click="showScan = true">扫码加货</van-button>
            <van-button size="small" type="success" icon="add-o" @click="showProductPicker = true">选择商品</van-button>
          </div>
        </template>
      </van-cell>
      <van-empty v-if="!cart.length" description="暂无商品，扫码或选择商品" :image-size="80" />
      <div v-else class="cart-list">
        <div v-for="(item, i) in cart" :key="i" class="cart-item">
          <div class="cart-head">
            <div class="cart-name">
              {{ item.name }}
              <van-tag plain type="primary" size="mini">{{ item.spec }}</van-tag>
            </div>
            <van-icon name="delete-o" color="#ee0a24" size="20" @click="removeItem(i)" />
          </div>
          <div class="cart-batch">
            <van-tag plain type="success" size="mini">批次: {{ item.batchNo }}</van-tag>
            <span class="unit">单位: {{ item.unit }}</span>
          </div>
          <div class="cart-row">
            <span class="row-label">数量</span>
            <van-stepper v-model="item.qty" :min="1" integer @change="onQtyChange(item)" />
          </div>
          <div class="cart-row">
            <span class="row-label">单价</span>
            <van-stepper v-model="item.price" :min="0" :step="0.1" :decimal-length="2" @change="onPriceChange(item)" />
          </div>
          <div class="cart-row">
            <span class="row-label">赠品</span>
            <van-switch v-model="item.isGift" size="20" @change="onGiftChange(item)" />
            <span v-if="item.isGift" class="gift-tip">赠品不计金额</span>
          </div>
          <div class="cart-foot">
            <span>小计</span>
            <span class="cart-amount">{{ formatMoney(item.amount) }}</span>
          </div>
        </div>
      </div>
    </van-cell-group>

    <!-- 结算 -->
    <van-cell-group inset title="结算" v-if="cart.length">
      <van-cell title="商品金额">
        <template #value>{{ formatMoney(totalAmount) }}</template>
      </van-cell>
      <van-cell title="抹零">
        <template #value>
          <van-stepper v-model="discount" :min="0" :step="0.5" :decimal-length="2" />
        </template>
      </van-cell>
      <van-cell title="应付金额">
        <template #value>
          <span class="pay-amount">{{ formatMoney(payAmount) }}</span>
        </template>
      </van-cell>
      <van-cell v-if="creditWarn">
        <template #title>
          <div class="inline-warn">
            <van-icon name="warning-o" color="#ee0a24" />
            <span>信用超限 {{ formatMoney(overCredit) }}，请申请超额审批</span>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 保存按钮 -->
    <div class="save-bar">
      <van-button block type="danger" :disabled="!canSave" @click="onSave">保存订单</van-button>
      <van-button v-if="creditWarn" block plain type="warning" @click="onApplyApproval" style="margin-top: 8px;">
        超额审批申请
      </van-button>
    </div>

    <!-- 最近订单 -->
    <van-cell-group inset title="最近订单">
      <van-empty v-if="!recentOrders.length" description="暂无订单" :image-size="80" />
      <van-cell v-for="o in recentOrders" :key="o.id" is-link @click="previewOrder(o)">
        <template #title>
          <div class="recent-row">
            <span class="recent-cust">{{ o.customerName }}</span>
            <van-tag plain :type="orderStatusType(o.status)" size="mini">{{ orderStatusLabel(o.status) }}</van-tag>
          </div>
          <div class="recent-meta">{{ o.id }} · {{ o.createdAt }}</div>
        </template>
        <template #value>
          <span class="recent-amount">{{ formatMoney(o.payAmount) }}</span>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 客户选择 -->
    <van-popup v-model:show="showCustomerPicker" position="bottom" round teleport="body">
      <van-picker
        :columns="customerColumns"
        title="选择客户"
        @confirm="onCustomerConfirm"
        @cancel="showCustomerPicker = false"
      />
    </van-popup>

    <!-- 商品选择 -->
    <van-popup v-model:show="showProductPicker" position="bottom" round teleport="body" :style="{ height: '60%' }">
      <div class="product-picker">
        <div class="picker-title">选择商品</div>
        <van-search v-model="productKeyword" placeholder="按名称/编码/条码搜索" />
        <div class="picker-list">
          <van-cell
            v-for="p in filteredProducts"
            :key="p.id"
            :title="p.name"
            :label="`${p.code} · ${p.spec} · 库存 ${getProductStock(p.id, dataStore)}${p.mainUnit}`"
            is-link
            @click="onProductSelect(p)"
          >
            <template #value>
              <span class="product-price">{{ formatMoney(p.retailPrice) }}</span>
            </template>
          </van-cell>
          <van-empty v-if="!filteredProducts.length" description="无匹配商品" :image-size="60" />
        </div>
      </div>
    </van-popup>

    <!-- 扫码 -->
    <ScanDialog v-model="showScan" @scanned="onScanned" />

    <!-- 打印预览 -->
    <van-popup v-model:show="showPrint" position="center" round teleport="body" :style="{ width: '88%' }">
      <div class="receipt">
        <div class="receipt-title">销售单据</div>
        <div class="receipt-row"><span>单号</span><span>{{ printData.id }}</span></div>
        <div class="receipt-row"><span>客户</span><span>{{ printData.customerName }}</span></div>
        <div class="receipt-row"><span>日期</span><span>{{ printData.createdAt }}</span></div>
        <div class="receipt-row"><span>业务员</span><span>{{ printData.salesman }}</span></div>
        <div class="receipt-divider" />
        <div class="receipt-table">
          <div class="receipt-thead">
            <span>商品</span><span>数量</span><span>金额</span>
          </div>
          <div v-for="(it, i) in (printData.items || [])" :key="i" class="receipt-trow">
            <span>{{ it.name }}<van-tag v-if="it.isGift" type="danger" size="mini">赠</van-tag></span>
            <span>{{ it.qty }}{{ it.unit }}</span>
            <span>{{ formatMoney(it.amount) }}</span>
          </div>
        </div>
        <div class="receipt-divider" />
        <div class="receipt-row"><span>合计</span><span>{{ formatMoney(printData.totalAmount || 0) }}</span></div>
        <div class="receipt-row"><span>抹零</span><span>{{ formatMoney(printData.discount || 0) }}</span></div>
        <div class="receipt-row"><span>应收</span><span class="receipt-pay">{{ formatMoney(printData.payAmount || 0) }}</span></div>
        <div class="receipt-divider" />
        <div class="receipt-sign">客户签字：____________</div>
        <div class="receipt-actions">
          <van-button type="primary" size="small" icon="printer" @click="onPrint">打印</van-button>
          <van-button size="small" @click="showPrint = false">关闭</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import dayjs from 'dayjs'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import ScanDialog from '@/components/ScanDialog.vue'
import { formatMoney, getProductStock } from '@/utils/index.js'
import { allocateFIFO, getGradePrice } from '@/mock/data'

const dataStore = useDataStore()
const authStore = useAuthStore()
authStore.restore()

// 订单基础信息
const orderNo = ref(`XS${dayjs().format('YYYYMMDD')}-${String(dataStore.salesOrders.length + 1).padStart(3, '0')}`)
const today = ref(dayjs().format('YYYY-MM-DD HH:mm'))
const salesman = computed(() => authStore.user?.name || authStore.user?.username || '业务员')

// 客户选择
const showCustomerPicker = ref(false)
const selectedCustomer = ref(null)
const customerColumns = computed(() =>
  dataStore.customers.map(c => ({ text: `${c.name} (${c.code})`, value: c.id }))
)
function onCustomerConfirm({ selectedValues }) {
  const id = selectedValues[0]
  selectedCustomer.value = dataStore.customers.find(c => c.id === id) || null
  showCustomerPicker.value = false
  // 切换客户后按其分级重新计算价格
  if (selectedCustomer.value) {
    cart.value.forEach(item => {
      const product = dataStore.products.find(p => p.id === item.productId)
      if (product && !item.isGift) {
        item.price = getGradePrice(product, selectedCustomer.value.grade)
        item.amount = +(item.qty * item.price).toFixed(2)
      }
    })
  }
}
const customerLabel = computed(() => selectedCustomer.value ? selectedCustomer.value.name : '请选择')
const isCreditOver = computed(() => {
  if (!selectedCustomer.value) return false
  return selectedCustomer.value.usedCredit >= selectedCustomer.value.creditLimit
})

// 商品选择
const showProductPicker = ref(false)
const productKeyword = ref('')
const filteredProducts = computed(() => {
  const k = productKeyword.value.trim().toLowerCase()
  if (!k) return dataStore.products.filter(p => p.status === 1)
  return dataStore.products.filter(p =>
    p.status === 1 && (
      p.name.toLowerCase().includes(k) ||
      p.code.toLowerCase().includes(k) ||
      p.barcode.includes(k)
    )
  )
})
function onProductSelect(p) {
  addProductToCart(p)
  showProductPicker.value = false
  productKeyword.value = ''
}

// 扫码
const showScan = ref(false)
function onScanned(code) {
  const product = dataStore.products.find(p => p.barcode === code)
  if (!product) {
    showToast('未匹配到商品: ' + code)
    return
  }
  if (product.status !== 1) {
    showToast('商品已停售: ' + product.name)
    return
  }
  addProductToCart(product)
  showScan.value = false
}

// 购物车
const cart = ref([])
function addProductToCart(product) {
  const existing = cart.value.find(i => i.productId === product.id && !i.isGift)
  if (existing) {
    existing.qty += 1
    onQtyChange(existing)
    showToast(`已加 1 ${product.name}`)
    return
  }
  const grade = selectedCustomer.value?.grade
  const price = grade ? getGradePrice(product, grade) : product.retailPrice
  const alloc = allocateFIFO(product.id, 1)
  const batchNo = alloc.length ? alloc[0].batchNo : '无库存'
  cart.value.push({
    productId: product.id,
    name: product.name,
    spec: product.spec,
    unit: product.mainUnit,
    qty: 1,
    price,
    amount: price,
    batchNo,
    isGift: false
  })
  showToast(`已添加 ${product.name}`)
}
function onQtyChange(item) {
  const alloc = allocateFIFO(item.productId, item.qty)
  if (alloc.length === 1) item.batchNo = alloc[0].batchNo
  else if (alloc.length > 1) item.batchNo = `${alloc[0].batchNo}+${alloc.length - 1}批`
  else item.batchNo = '无库存'
  item.amount = item.isGift ? 0 : +(item.qty * item.price).toFixed(2)
}
function onPriceChange(item) {
  item.amount = item.isGift ? 0 : +(item.qty * item.price).toFixed(2)
}
function onGiftChange(item) {
  item.amount = item.isGift ? 0 : +(item.qty * item.price).toFixed(2)
}
function removeItem(i) {
  cart.value.splice(i, 1)
}

// 汇总
const discount = ref(0)
const totalAmount = computed(() => +cart.value.reduce((s, i) => s + i.amount, 0).toFixed(2))
const payAmount = computed(() => Math.max(0, +(totalAmount.value - discount.value).toFixed(2)))
const overCredit = computed(() => {
  if (!selectedCustomer.value) return 0
  return Math.max(0, +(selectedCustomer.value.usedCredit + payAmount.value - selectedCustomer.value.creditLimit).toFixed(2))
})
const creditWarn = computed(() => overCredit.value > 0)
const canSave = computed(() => selectedCustomer.value && cart.value.length > 0 && !creditWarn.value)

// 保存
const showPrint = ref(false)
const printData = ref({})
function onSave() {
  if (!selectedCustomer.value) {
    showToast('请先选择客户')
    return
  }
  if (!cart.value.length) {
    showToast('请添加商品')
    return
  }
  if (creditWarn.value) {
    showToast('信用超限，请申请审批')
    return
  }
  const order = {
    customerName: selectedCustomer.value.name,
    customerId: selectedCustomer.value.id,
    items: cart.value.map(i => ({
      productId: i.productId,
      name: i.name,
      spec: i.spec,
      unit: i.unit,
      qty: i.qty,
      price: i.price,
      amount: i.amount,
      batchNo: i.batchNo,
      isGift: i.isGift
    })),
    totalAmount: totalAmount.value,
    discount: discount.value,
    payAmount: payAmount.value,
    status: 'submitted',
    salesman: salesman.value
  }
  dataStore.addSalesOrder(order)
  printData.value = order
  showPrint.value = true
  showSuccessToast('订单保存成功')
  // 重置
  cart.value = []
  discount.value = 0
  selectedCustomer.value = null
  orderNo.value = `XS${dayjs().format('YYYYMMDD')}-${String(dataStore.salesOrders.length + 1).padStart(3, '0')}`
  today.value = dayjs().format('YYYY-MM-DD HH:mm')
}
function onApplyApproval() {
  showConfirmDialog({
    title: '超额审批申请',
    message: `该订单将超出信用额度 ${formatMoney(overCredit.value)}，确认提交审批申请？`
  }).then(() => {
    showSuccessToast('已提交审批申请')
  }).catch(() => {})
}
function onPrint() {
  showToast('打印中...')
}
function previewOrder(o) {
  printData.value = o
  showPrint.value = true
}

// 最近订单
const recentOrders = computed(() => [...dataStore.salesOrders].slice(0, 3))

// 工具
function orderStatusLabel(s) {
  const map = { submitted: '待处理', approved: '已审核', completed: '已完成', draft: '草稿' }
  return map[s] || s
}
function orderStatusType(s) {
  const map = { submitted: 'warning', approved: 'primary', completed: 'success', draft: 'default' }
  return map[s] || 'default'
}
function gradeTagType(g) {
  return g === 1 ? 'danger' : g === 2 ? 'warning' : 'primary'
}
</script>

<style scoped>
.sales-order-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px 0 24px;
}

/* 订单信息 */
.order-info-card {
  margin: 0 12px 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1989fa, #4ba9ff);
  border-radius: 12px;
  color: #fff;
}
.order-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  line-height: 1.8;
}
.order-info-row .label { opacity: 0.9; }
.order-info-row .value { font-weight: 600; }

/* 加货按钮 */
.add-row {
  display: flex;
  gap: 8px;
}

/* 购物车 */
.cart-list {
  padding: 4px 0;
}
.cart-item {
  margin: 6px 12px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f2f3f5;
}
.cart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.cart-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.cart-batch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.cart-batch .unit { font-size: 12px; color: #969799; }
.cart-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.cart-row .row-label {
  width: 50px;
  font-size: 13px;
  color: #646566;
}
.gift-tip {
  font-size: 12px;
  color: #ee0a24;
  margin-left: 8px;
}
.cart-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed #ebedf0;
  font-size: 13px;
  color: #646566;
}
.cart-amount {
  font-size: 16px;
  font-weight: 700;
  color: #ee0a24;
}

/* 结算 */
.pay-amount {
  font-size: 16px;
  font-weight: 700;
  color: #ee0a24;
}
.inline-warn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ee0a24;
}
.credit-over { color: #ee0a24; font-weight: 600; }

/* 保存按钮 */
.save-bar {
  padding: 12px 16px 4px;
}

/* 最近订单 */
.recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.recent-cust { font-size: 14px; font-weight: 600; color: #323233; }
.recent-meta { font-size: 12px; color: #969799; }
.recent-amount { font-size: 14px; font-weight: 600; color: #ee0a24; }

/* 商品 picker */
.product-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.picker-title {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 0 4px;
}
.picker-list {
  flex: 1;
  overflow-y: auto;
}
.product-price { color: #ee0a24; font-weight: 600; }

/* 收据 */
.receipt {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}
.receipt-title {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  padding-bottom: 8px;
  border-bottom: 1px dashed #dcdee0;
  margin-bottom: 8px;
}
.receipt-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 3px 0;
  color: #323233;
}
.receipt-divider {
  height: 1px;
  background: #dcdee0;
  margin: 8px 0;
  border-top: 1px dashed #dcdee0;
  background: none;
}
.receipt-table { font-size: 12px; }
.receipt-thead, .receipt-trow {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 4px;
  padding: 3px 0;
}
.receipt-thead {
  font-weight: 600;
  color: #969799;
  border-bottom: 1px dashed #ebedf0;
}
.receipt-trow { color: #323233; }
.receipt-pay {
  color: #ee0a24;
  font-weight: 700;
}
.receipt-sign {
  font-size: 13px;
  color: #323233;
  margin-top: 12px;
  margin-bottom: 12px;
}
.receipt-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>

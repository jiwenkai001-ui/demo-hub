<template>
  <!-- 销售开单:选客户→扫码/手选商品→录入数量→信用额度校验→保存单据→销货单预览 -->
  <div class="page">
    <div class="card">
      <div class="order-head">
        <span class="page-title">销售开单</span>
        <span class="order-no">单号:{{ orderNo }}</span>
      </div>

      <el-form :model="form" label-width="90px" label-position="left">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="客户">
              <el-select v-model="form.customerId" placeholder="选择客户" style="width: 100%" filterable @change="onCustomerChange">
                <el-option v-for="c in customers" :key="c.id" :label="`${c.name}(${c.code})`" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="开单日期">
              <el-date-picker v-model="form.date" type="datetime" format="YYYY-MM-DD HH:mm" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="信用额度">
              <span v-if="currentCustomer">
                已用 <b :class="{ 'over-limit': form.usedAmount > currentCustomer.creditLimit }">¥{{ form.usedAmount.toLocaleString() }}</b>
                / 额度 ¥{{ currentCustomer.creditLimit.toLocaleString() }}
                <el-tag v-if="form.usedAmount > currentCustomer.creditLimit" type="danger" size="small" style="margin-left:6px">超额度</el-tag>
              </span>
              <span v-else class="hint">先选择客户</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 商品行 -->
      <div class="goods-toolbar">
        <el-input v-model="searchCode" placeholder="扫码/输入商品条码" style="width: 260px" @keyup.enter="onSearchByCode">
          <template #append>
            <el-button @click="showScan = true"><el-icon><Camera /></el-icon> 扫码</el-button>
          </template>
        </el-input>
        <el-select v-model="manualProductId" placeholder="手选商品" filterable style="width: 240px" @change="onManualAdd">
          <el-option v-for="p in products" :key="p.id" :label="`${p.name}(${p.spec})`" :value="p.id" />
        </el-select>
      </div>

      <el-table :data="form.items" size="small" :summary-method="getSummary" show-summary>
        <el-table-column type="index" label="#" width="40" />
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <div>{{ row.name }}</div>
            <div class="spec">{{ row.spec }} · {{ row.unit }}</div>
            <div class="batch-info">批次:<el-tag size="small">{{ row.batchNo }}</el-tag></div>
          </template>
        </el-table-column>
        <el-table-column prop="qty" label="数量" width="100">
          <template #default="{ row, $index }">
            <el-input-number v-model="row.qty" :min="1" :step="1" size="small" @change="recalc($index)" />
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row, $index }">
            <el-input-number v-model="row.price" :min="0" :step="0.5" :precision="2" size="small" @change="recalc($index)" />
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column label="赠品" width="70">
          <template #default="{ row }">
            <el-switch v-model="row.isGift" @change="onGift($index)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="order-bottom">
        <div class="summary-box">
          <div>合计金额:<b>¥{{ totalAmount.toFixed(2) }}</b></div>
          <div>抹零:<el-input-number v-model="form.discount" :min="0" :step="0.01" :precision="2" size="small" @change="recalcTotal" /></div>
          <div>应收金额:<b class="pay-amount">¥{{ payAmount.toFixed(2) }}</b></div>
        </div>
        <div class="actions">
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" :disabled="!canSave" @click="onSave">保存单据</el-button>
        </div>
      </div>
    </div>

    <!-- 扫码弹窗 -->
    <ScanDialog v-model="showScan" @scanned="onScanned" />

    <!-- 销货单预览 -->
    <el-dialog v-model="showPreview" title="销货单预览(可打印)" width="600px">
      <div class="print-area" ref="printRef">
        <h3 style="text-align:center;margin:0 0 8px">销货单</h3>
        <div class="print-meta">单号:{{ savedOrder?.id }}</div>
        <div class="print-meta">客户:{{ savedOrder?.customerName }}</div>
        <div class="print-meta">日期:{{ savedOrder?.createdAt }}</div>
        <table class="print-table">
          <thead>
            <tr><th>商品</th><th>规格</th><th>数量</th><th>单价</th><th>金额</th><th>批次</th></tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in savedOrder?.items" :key="i">
              <td>{{ it.name }}</td>
              <td>{{ it.spec }}</td>
              <td>{{ it.qty }}{{ it.unit }}</td>
              <td>¥{{ it.price.toFixed(2) }}</td>
              <td>¥{{ it.amount.toFixed(2) }}</td>
              <td>{{ it.batchNo }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="4" style="text-align:right">合计:</td><td colspan="2">¥{{ savedOrder?.totalAmount.toFixed(2) }}</td></tr>
            <tr><td colspan="4" style="text-align:right">抹零:</td><td colspan="2">-¥{{ savedOrder?.discount.toFixed(2) }}</td></tr>
            <tr><td colspan="4" style="text-align:right">应收:</td><td colspan="2"><b>¥{{ savedOrder?.payAmount.toFixed(2) }}</b></td></tr>
          </tfoot>
        </table>
        <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:13px">
          <div>签字:____________</div>
          <div>日期:{{ savedOrder?.createdAt }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreview = false">关闭</el-button>
        <el-button type="primary" @click="onPrint">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScanDialog from '@/components/ScanDialog.vue'
import { products, customers, batches, pickBatchByFIFO, getPriceByGrade, salesOrders, type SalesItem, type SalesOrder } from '@/api/mock'
import dayjs from 'dayjs'

// 表单
const form = reactive({
  customerId: null as number | null,
  date: new Date(),
  items: [] as (SalesItem & { isGift?: boolean })[],
  discount: 0,
  usedAmount: 0,
})

const searchCode = ref('')
const manualProductId = ref<number | null>(null)
const showScan = ref(false)
const showPreview = ref(false)
const savedOrder = ref<SalesOrder | null>(null)
const orderNo = computed(() => `XS${dayjs().format('YYYYMMDD')}-${(salesOrders.length + 1).toString().padStart(3, '0')}`)

const currentCustomer = computed(() => customers.find(c => c.id === form.customerId))

const totalAmount = computed(() => form.items.reduce((s, i) => s + (i.isGift ? 0 : i.amount), 0))
const payAmount = computed(() => Math.max(0, totalAmount.value - form.discount))
const canSave = computed(() => form.customerId != null && form.items.length > 0 && form.usedAmount + payAmount.value <= (currentCustomer.value?.creditLimit || 0))

function onCustomerChange() {
  form.usedAmount = currentCustomer.value?.usedCredit || 0
}

function onSearchByCode() {
  const code = searchCode.value.trim()
  if (!code) return
  const p = products.find(x => x.barcode === code)
  if (p) addProduct(p)
  else ElMessage.warning('未匹配到商品,请重扫或手选')
  searchCode.value = ''
}

function onManualAdd(pid: number) {
  const p = products.find(x => x.id === pid)
  if (p) addProduct(p)
  manualProductId.value = null
}

function onScanned(code: string) {
  const p = products.find(x => x.barcode === code)
  if (p) addProduct(p)
  else ElMessage.warning(`未匹配到商品(条码 ${code})`)
}

function addProduct(p: typeof products[number]) {
  // 信用额度校验
  if (currentCustomer.value && form.usedAmount + payAmount.value > currentCustomer.value.creditLimit) {
    ElMessageBox.confirm('已超过客户信用额度,是否申请超额审批?', '提示', { type: 'warning' })
      .then(() => ElMessage.success('已提交超额审批申请(模拟)'))
      .catch(() => {})
    return
  }
  // 批次先进先出匹配
  const batchesPicked = pickBatchByFIFO(p.id, 1)
  if (batchesPicked.length === 0) {
    ElMessage.warning(`${p.name} 无可用批次库存`)
    return
  }
  const price = currentCustomer.value ? getPriceByGrade(p, currentCustomer.value.grade) : p.retailPrice
  const item: SalesItem & { isGift?: boolean } = {
    productId: p.id,
    name: p.name,
    spec: p.spec,
    unit: p.mainUnit,
    qty: 1,
    price,
    amount: price,
    batchNo: batchesPicked[0].batchNo,
    isGift: false,
  }
  form.items.push(item)
  recalc(form.items.length - 1)
}

function recalc(idx: number) {
  const it = form.items[idx]
  it.amount = +(it.qty * it.price).toFixed(2)
}

function recalcTotal() {
  // 抹零变更后无需重算,计算属性会自动响应
}

function onGift(idx: number) {
  const it = form.items[idx]
  if (it.isGift) it.amount = 0
  else recalc(idx)
}

function removeRow(idx: number) {
  form.items.splice(idx, 1)
}

function getSummary() {
  const total = form.items.reduce((s, i) => s + (i.isGift ? 0 : i.amount), 0)
  return ['合计', '', '', '', `¥${total.toFixed(2)}`, '', '']
}

function onReset() {
  form.customerId = null
  form.items = []
  form.discount = 0
  form.usedAmount = 0
}

function onSave() {
  const cust = currentCustomer.value
  if (!cust) return
  // 信用额度校验
  if (form.usedAmount + payAmount.value > cust.creditLimit) {
    ElMessage.error('超过信用额度,无法保存')
    return
  }
  const order: SalesOrder = {
    id: orderNo.value,
    customerName: cust.name,
    items: form.items.map(({ isGift, ...rest }) => ({ ...rest, isGift })),
    totalAmount: totalAmount.value,
    discount: form.discount,
    payAmount: payAmount.value,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
    status: 'submitted',
  }
  savedOrder.value = order
  salesOrders.push(order)
  showPreview.value = true
  ElMessage.success('单据已保存')
}

function onPrint() {
  window.print()
}
</script>

<style scoped>
.order-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.order-no { font-size: 13px; color: #909399; }
.goods-toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.spec { font-size: 12px; color: #909399; }
.batch-info { font-size: 12px; color: #606266; margin-top: 2px; }
.hint { color: #909399; font-size: 13px; }
.order-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; flex-wrap: wrap; gap: 12px; }
.summary-box { display: flex; gap: 24px; align-items: center; font-size: 14px; }
.pay-amount { color: #f56c6c; font-size: 18px; }
.actions { display: flex; gap: 8px; }
.over-limit { color: #f56c6c; }

.print-area { padding: 16px; }
.print-meta { font-size: 13px; margin-bottom: 4px; }
.print-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
.print-table th, .print-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
.print-table tfoot td { font-weight: 600; }
</style>

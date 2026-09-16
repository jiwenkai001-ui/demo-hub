<template>
  <!-- 往来对账:应收台账按客户、账龄分桶 -->
  <div class="page">
    <div class="card">
      <div class="page-title">应收台账</div>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="客户名称" clearable style="width: 220px" />
        <el-button @click="showStatement = true"><el-icon><Document /></el-icon> 生成对账单</el-button>
      </div>

      <el-table :data="filteredList" :summary-method="getSummary" show-summary stripe>
        <el-table-column prop="customerName" label="客户" min-width="160" />
        <el-table-column label="信用额度" width="120">
          <template #default="{ row }">
            <div>额度:¥{{ row.creditLimit.toLocaleString() }}</div>
            <div class="used-credit">已用:¥{{ row.usedCredit.toLocaleString() }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="period" label="账期(天)" width="100" />
        <el-table-column prop="amount" label="应收余额" width="120">
          <template #default="{ row }"><b>¥{{ row.amount.toLocaleString() }}</b></template>
        </el-table-column>
        <el-table-column label="账龄分桶" width="600">
          <template #default="{ row }">
            <div class="age-row">
              <div class="age-bar">
                <div class="age-seg seg-30" :style="{ width: pct(row.age30, row.amount) + '%' }" :title="`0-30天: ¥${row.age30}`"></div>
                <div class="age-seg seg-60" :style="{ width: pct(row.age60, row.amount) + '%' }" :title="`31-60天: ¥${row.age60}`"></div>
                <div class="age-seg seg-90" :style="{ width: pct(row.age90, row.amount) + '%' }" :title="`61-90天: ¥${row.age90}`"></div>
                <div class="age-seg seg-180" :style="{ width: pct(row.age180, row.amount) + '%' }" :title="`90-180天: ¥${row.age180}`"></div>
              </div>
            </div>
            <div class="age-legend">
              <span class="dot dot-30"></span>30天内 ¥{{ row.age30 }}
              <span class="dot dot-60"></span>31-60 ¥{{ row.age60 }}
              <span class="dot dot-90"></span>61-90 ¥{{ row.age90 }}
              <span class="dot dot-180"></span>>180 ¥{{ row.age180 }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="onStatement(row)">对账</el-button>
            <el-button type="success" link @click="onCollect(row)">收款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 对账单弹窗 -->
    <el-dialog v-model="showStatement" title="对账单(可微信发送链接)" width="600px">
      <div class="statement">
        <h3 style="text-align:center;margin:0 0 8px">客户对账单</h3>
        <div class="st-meta">客户:{{ currentRow?.customerName }}</div>
        <div class="st-meta">账期:{{ currentRow?.period }} 天</div>
        <div class="st-meta">应收余额:<b style="color:#f56c6c">¥{{ currentRow?.amount.toLocaleString() }}</b></div>
        <el-divider />
        <div class="st-section-title">期间明细:</div>
        <table class="st-table">
          <thead><tr><th>单据类型</th><th>单据号</th><th>金额</th><th>批次</th></tr></thead>
          <tbody>
            <tr><td>销售单</td><td>XS20260916-001</td><td>¥460.00</td><td>KF20260801</td></tr>
            <tr><td>销售单</td><td>XS20260916-002</td><td>¥375.00</td><td>MN20260901</td></tr>
            <tr><td>收款单</td><td>SK20260916-001</td><td>-¥200.00</td><td>-</td></tr>
          </tbody>
          <tfoot><tr><td colspan="2" style="text-align:right">余额:</td><td colspan="2">¥635.00</td></tr></tfoot>
        </table>
        <div class="st-tip">客户扫码电子签收 → 差异处理 → 定案</div>
      </div>
      <template #footer>
        <el-button @click="showStatement = false">关闭</el-button>
        <el-button type="primary" @click="onShare">发送对账链接</el-button>
      </template>
    </el-dialog>

    <!-- 收款单弹窗 -->
    <el-dialog v-model="showCollect" title="收款单" width="480px">
      <el-form :model="collectForm" label-width="100px">
        <el-form-item label="客户">{{ currentRow?.customerName }}</el-form-item>
        <el-form-item label="应收余额">¥{{ currentRow?.amount.toLocaleString() }}</el-form-item>
        <el-form-item label="本次收款">
          <el-input-number v-model="collectForm.amount" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="收款方式">
          <el-select v-model="collectForm.method" style="width: 200px">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="transfer" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCollect = false">取消</el-button>
        <el-button type="primary" @click="onSubmitCollect">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { receivables, customers, type Receivable } from '@/api/mock'

const keyword = ref('')
const showStatement = ref(false)
const showCollect = ref(false)
const currentRow = ref<Receivable | null>(null)
const collectForm = reactive({ amount: 0, method: 'transfer' })

// 在 receivables 上补充客户档案信息(信用额度)
const enriched = computed(() => receivables.map(r => {
  const cust = customers.find(c => c.name === r.customerName)
  return {
    ...r,
    creditLimit: cust?.creditLimit || 0,
    usedCredit: cust?.usedCredit || 0,
  }
}))

const filteredList = computed(() => enriched.value.filter(r => !keyword.value || r.customerName.includes(keyword.value)))

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function getSummary() {
  const total = filteredList.value.reduce((s, r) => s + r.amount, 0)
  const age30 = filteredList.value.reduce((s, r) => s + r.age30, 0)
  const age60 = filteredList.value.reduce((s, r) => s + r.age60, 0)
  const age90 = filteredList.value.reduce((s, r) => s + r.age90, 0)
  const age180 = filteredList.value.reduce((s, r) => s + r.age180, 0)
  return ['合计', '', '', `¥${total.toLocaleString()}`, `${age30} / ${age60} / ${age90} / ${age180}`, '']
}

function onStatement(row: Receivable) {
  currentRow.value = row
  showStatement.value = true
}

function onCollect(row: Receivable) {
  currentRow.value = row
  collectForm.amount = row.amount
  collectForm.method = 'transfer'
  showCollect.value = true
}

function onSubmitCollect() {
  ElMessage.success(`已确认收款 ¥${collectForm.amount.toFixed(2)}(${collectForm.method})`)
  showCollect.value = false
}

function onShare() {
  ElMessage.success('对账单链接已发送到客户微信(模拟)')
  showStatement.value = false
}
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.used-credit { font-size: 12px; color: #909399; }
.age-row { margin-bottom: 6px; }
.age-bar { width: 100%; height: 14px; background: #f5f7fa; border-radius: 7px; overflow: hidden; display: flex; }
.age-seg { height: 100%; }
.seg-30 { background: #67c23a; }
.seg-60 { background: #e6a23c; }
.seg-90 { background: #f56c6c; }
.seg-180 { background: #909399; }
.age-legend { font-size: 11px; color: #606266; display: flex; gap: 8px; flex-wrap: wrap; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 2px; margin-left: 6px; }
.dot-30 { background: #67c23a; }
.dot-60 { background: #e6a23c; }
.dot-90 { background: #f56c6c; }
.dot-180 { background: #909399; }

.statement { padding: 16px; }
.st-meta { font-size: 13px; margin-bottom: 6px; color: #303133; }
.st-section-title { font-size: 13px; font-weight: 600; margin: 8px 0; }
.st-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.st-table th, .st-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
.st-table tfoot td { font-weight: 600; }
.st-tip { margin-top: 12px; font-size: 12px; color: #909399; }
</style>

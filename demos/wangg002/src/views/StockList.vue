<template>
  <!-- 库存查询:多仓库存 + 批次库存 + 临期/过期标识 -->
  <div class="page">
    <div class="card">
      <div class="page-title">库存查询</div>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="商品名称/编码" clearable style="width: 220px" />
        <el-select v-model="warehouseId" placeholder="仓库" clearable style="width: 160px">
          <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
        </el-select>
        <el-radio-group v-model="viewType">
          <el-radio-button value="summary">汇总库存</el-radio-button>
          <el-radio-button value="batch">批次库存</el-radio-button>
        </el-radio-group>
        <el-button @click="showScan = true"><el-icon><Camera /></el-icon> 扫码查商品</el-button>
      </div>

      <!-- 汇总库存视图 -->
      <el-table v-if="viewType === 'summary'" :data="summaryList" stripe size="default">
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="商品" min-width="160" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="mainUnit" label="单位" width="70" />
        <el-table-column label="档口仓库" width="100">
          <template #default="{ row }">{{ row.qty1 }} {{ row.mainUnit }}</template>
        </el-table-column>
        <el-table-column label="后备库房" width="100">
          <template #default="{ row }">{{ row.qty2 }} {{ row.mainUnit }}</template>
        </el-table-column>
        <el-table-column label="合计" width="90">
          <template #default="{ row }">
            <b>{{ row.total }}</b> {{ row.mainUnit }}
          </template>
        </el-table-column>
        <el-table-column label="库存金额" width="110">
          <template #default="{ row }">¥{{ row.amount.toFixed(0) }}</template>
        </el-table-column>
        <el-table-column label="临期预警" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.nearExpiryCount > 0" type="warning" size="small">{{ row.nearExpiryCount }} 批</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批次库存视图 -->
      <el-table v-else :data="batchList" stripe size="default">
        <el-table-column prop="productName" label="商品" min-width="160" />
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="productionDate" label="生产日期" width="110" />
        <el-table-column prop="expiryDate" label="到期日期" width="110" />
        <el-table-column label="剩余库存" width="100">
          <template #default="{ row }">{{ row.remainingQty }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="临期状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.tagType" size="small">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="先进先出建议" min-width="200">
          <template #default="{ row }">
            <span v-if="row.fifoPriority === 1" class="fifo-first">优先出库(最早批次)</span>
            <span v-else style="color:#909399">第 {{ row.fifoPriority }} 顺位</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ScanDialog v-model="showScan" @scanned="onScanned" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ScanDialog from '@/components/ScanDialog.vue'
import { products, batches, warehouses, stocks, getExpiryStatus } from '@/api/mock'
import dayjs from 'dayjs'

const keyword = ref('')
const warehouseId = ref<number | null>(null)
const viewType = ref<'summary' | 'batch'>('summary')
const showScan = ref(false)

// 汇总库存(按商品)
const summaryList = computed(() => products.map(p => {
  const qty1 = stocks.filter(s => s.productId === p.id && s.warehouseId === 1).reduce((s, x) => s + x.qty, 0)
  const qty2 = stocks.filter(s => s.productId === p.id && s.warehouseId === 2).reduce((s, x) => s + x.qty, 0)
  const total = qty1 + qty2
  const pBatches = batches.filter(b => b.productId === p.id)
  const nearExpiryCount = pBatches.filter(b => {
    const s = getExpiryStatus(b.expiryDate)
    return s.type === 'warning' || s.type === 'danger'
  }).length
  return {
    code: p.code, name: p.name, spec: p.spec, mainUnit: p.mainUnit,
    qty1, qty2, total, amount: total * p.costPrice, nearExpiryCount,
    matched: !keyword.value || p.name.includes(keyword.value) || p.code.includes(keyword.value),
    whMatched: !warehouseId.value || warehouseId.value === 1 || warehouseId.value === 2,
  }
}).filter(r => r.matched && r.whMatched && (warehouseId.value !== 1 || r.qty1 > 0) && (warehouseId.value !== 2 || r.qty2 > 0)))

// 批次库存(按批次)
const batchList = computed(() => {
  const list = batches.map(b => {
    const p = products.find(x => x.id === b.productId)
    const s = getExpiryStatus(b.expiryDate)
    return {
      productName: p?.name || '',
      batchNo: b.batchNo,
      productionDate: b.productionDate,
      expiryDate: b.expiryDate,
      remainingQty: b.remainingQty,
      unit: p?.mainUnit || '',
      statusLabel: s.label,
      tagType: s.type === 'expired' ? 'danger' : s.type === 'danger' ? 'danger' : s.type === 'warning' ? 'warning' : 'success',
      productId: b.productId,
      fifoPriority: 0 as number,
    }
  }).filter(r => !keyword.value || r.productName.includes(keyword.value))
  // 按商品分组,在同商品内按生产日期升序,标注 FIFO 优先级
  const groups: Record<number, typeof list> = {}
  list.forEach(item => {
    groups[item.productId] = groups[item.productId] || []
    groups[item.productId].push(item)
  })
  Object.values(groups).forEach(g => g.sort((a, b) => dayjs(a.productionDate).valueOf() - dayjs(b.productionDate).valueOf()).forEach((item, i) => { item.fifoPriority = i + 1 }))
  return list
})

function onScanned(code: string) {
  const p = products.find(x => x.barcode === code)
  if (p) {
    keyword.value = p.name
    viewType.value = 'batch'
    ElMessage.success(`已定位:${p.name}`)
  } else {
    ElMessage.warning('未匹配到商品')
  }
}
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
.fifo-first { color: #f56c6c; font-weight: 600; }
</style>

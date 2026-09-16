<template>
  <!-- 商品档案列表:分页 + 扫码建商品 + 批次/保质期展示 -->
  <div class="page">
    <div class="card">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="商品名称/编码/条码" clearable style="width: 240px" />
        <el-button type="primary" @click="showScan = true">
          <el-icon><Camera /></el-icon> 扫码建商品
        </el-button>
        <el-button @click="showBatchDialog = true">
          <el-icon><Tickets /></el-icon> 查看批次/保质期
        </el-button>
      </div>

      <el-table :data="paged" stripe size="default" @row-click="onRowClick">
        <el-table-column prop="code" label="商品编码" width="100" />
        <el-table-column prop="barcode" label="条码" width="140" />
        <el-table-column label="商品名称" min-width="180">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.status === 2" size="small" type="warning" style="margin-left:6px">停采</el-tag>
            <el-tag v-else-if="row.status === 3" size="small" type="danger" style="margin-left:6px">停售</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="mainUnit" label="单位" width="70" />
        <el-table-column label="保质期(天)" width="100">
          <template #default="{ row }">
            <span :class="{ 'tag-near-expiry': row.shelfLifeDays < 90 }">{{ row.shelfLifeDays }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="costPrice" label="成本价" width="80" />
        <el-table-column prop="retailPrice" label="零售价" width="80" />
        <el-table-column label="在库批次" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ batchCount(row.id) }} 批</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="filtered.length"
        :page-sizes="[5, 10, 20]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 12px; justify-content: flex-end"
      />
    </div>

    <!-- 扫码弹窗 -->
    <ScanDialog v-model="showScan" @scanned="onScanned" />

    <!-- 批次详情弹窗 -->
    <el-dialog v-model="showBatchDialog" title="商品批次/保质期总览" width="900px">
      <el-table :data="batchList" size="small">
        <el-table-column prop="productName" label="商品" min-width="160" />
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="productionDate" label="生产日期" width="110" />
        <el-table-column prop="expiryDate" label="到期日期" width="110" />
        <el-table-column prop="remainingQty" label="剩余库存" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.tagType" size="small">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ScanDialog from '@/components/ScanDialog.vue'
import { products, batches, getExpiryStatus, type Product } from '@/api/mock'

const keyword = ref('')
const page = ref(1)
const size = ref(10)
const showScan = ref(false)
const showBatchDialog = ref(false)

const filtered = computed(() => products.filter(p =>
  !keyword.value ||
  p.name.includes(keyword.value) ||
  p.code.includes(keyword.value) ||
  p.barcode.includes(keyword.value)
))

const paged = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

function batchCount(productId: number) {
  return batches.filter(b => b.productId === productId && b.remainingQty > 0).length
}

function onRowClick(row: Product) {
  ElMessage.info(`已选中:${row.name}`)
}

function onScanned(code: string) {
  const p = products.find(x => x.barcode === code)
  if (p) {
    ElMessage.success(`扫码匹配到商品:${p.name}`)
  } else {
    ElMessage.warning(`未匹配到商品(条码 ${code}),可手工建档`)
  }
}

const batchList = computed(() => batches.map(b => {
  const p = products.find(x => x.id === b.productId)
  const s = getExpiryStatus(b.expiryDate)
  return {
    productName: p?.name || '',
    batchNo: b.batchNo,
    productionDate: b.productionDate,
    expiryDate: b.expiryDate,
    remainingQty: b.remainingQty + (p?.mainUnit || ''),
    statusLabel: s.label,
    tagType: s.type === 'expired' ? 'danger' : s.type === 'danger' ? 'danger' : s.type === 'warning' ? 'warning' : 'success',
  }
}))
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
</style>

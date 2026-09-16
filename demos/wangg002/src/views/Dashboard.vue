<template>
  <!-- 老板看板:今日销售、应收总额、临期商品数、库存总金额、Top10 商品 -->
  <div class="dashboard">
    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="k in kpis" :key="k.label" :style="{ background: k.bg }">
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-value">{{ k.value }}</div>
        <div class="kpi-sub">{{ k.sub }}</div>
      </div>
    </div>

    <!-- 图表:今日销售趋势 + Top10 商品 -->
    <div class="chart-row">
      <div class="card chart-card">
        <div class="card-title">近 7 日销售额趋势</div>
        <v-chart class="chart" :option="salesTrendOption" autoresize />
      </div>
      <div class="card chart-card">
        <div class="card-title">商品销售 Top10</div>
        <v-chart class="chart" :option="top10Option" autoresize />
      </div>
    </div>

    <!-- 临期预警 + 待办消息 -->
    <div class="bottom-row">
      <div class="card">
        <div class="card-title">临期预警(剩 ≤30 天)</div>
        <el-table :data="nearExpiry" size="small" stripe>
          <el-table-column prop="name" label="商品" min-width="160" />
          <el-table-column prop="batchNo" label="批次号" width="140" />
          <el-table-column prop="remainingQty" label="剩余库存" width="100" />
          <el-table-column label="到期日" width="110">
            <template #default="{ row }">
              <span :class="row.statusType">{{ row.expiryDate }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.tagType" size="small">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="card">
        <div class="card-title">站内待办消息</div>
        <div class="msg-list">
          <div v-for="m in appStore.messages" :key="m.id" class="msg-item" :class="{ unread: !m.read }">
            <span class="msg-dot"></span>
            <div class="msg-content">
              <div class="msg-title">{{ m.title }}</div>
              <div class="msg-time">{{ m.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components'
import { useAppStore } from '@/stores/app'
import { batches, products, salesOrders, receivables, getExpiryStatus } from '@/api/mock'
import dayjs from 'dayjs'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent])

const appStore = useAppStore()

// KPI 计算
const todaySales = computed(() => salesOrders.filter(o => dayjs(o.createdAt).isSame(dayjs(), 'day')).reduce((s, o) => s + o.payAmount, 0))
const receivableTotal = computed(() => receivables.reduce((s, r) => s + r.amount, 0))
const nearExpiryCount = computed(() => batches.filter(b => {
  const s = getExpiryStatus(b.expiryDate)
  return s.type !== 'normal' && s.type !== 'expired'
}).length)
const expiredCount = computed(() => batches.filter(b => getExpiryStatus(b.expiryDate).type === 'expired').length)
const stockTotalAmount = computed(() => batches.reduce((s, b) => {
  const p = products.find(x => x.id === b.productId)
  return s + (p ? p.costPrice * b.remainingQty : 0)
}, 0))

const kpis = computed(() => [
  { label: '今日销售额', value: `¥${todaySales.value.toFixed(0)}`, sub: `${salesOrders.length} 单`, bg: 'linear-gradient(135deg,#1989fa,#07c160)' },
  { label: '应收总额', value: `¥${receivableTotal.value.toLocaleString()}`, sub: `${receivables.length} 个客户`, bg: 'linear-gradient(135deg,#ff976a,#ff5c5c)' },
  { label: '临期商品', value: `${nearExpiryCount.value}`, sub: `过期 ${expiredCount.value}`, bg: 'linear-gradient(135deg,#ffba33,#ff9900)' },
  { label: '库存总金额', value: `¥${stockTotalAmount.value.toFixed(0)}`, sub: `${batches.length} 批次`, bg: 'linear-gradient(135deg,#8e9eff,#6a8eff)' },
])

// 临期预警表
const nearExpiry = computed(() => batches
  .map(b => {
    const p = products.find(x => x.id === b.productId)
    const s = getExpiryStatus(b.expiryDate)
    return {
      name: p?.name || '',
      batchNo: b.batchNo,
      remainingQty: b.remainingQty + (p?.mainUnit || ''),
      expiryDate: b.expiryDate,
      statusLabel: s.label,
      statusType: s.type === 'danger' ? 'tag-expired' : 'tag-near-expiry',
      tagType: s.type === 'expired' ? 'danger' : s.type === 'danger' ? 'danger' : s.type === 'warning' ? 'warning' : 'info',
    }
  })
  .filter(r => ['warning', 'danger', 'expired'].includes(getExpiryStatus(r.expiryDate).type))
  .sort((a, b) => dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf()))

// 近 7 日销售额趋势
const salesTrendOption = computed(() => {
  const dates: string[] = []
  const values: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('MM-DD')
    dates.push(d)
    const v = Math.round(2000 + Math.random() * 4000)
    values.push(i === 0 ? todaySales.value : v)
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', name: '元' },
    series: [{ name: '销售额', type: 'line', smooth: true, data: values, areaStyle: {}, itemStyle: { color: '#1989fa' } }],
  }
})

// Top10 商品(按销售额)
const top10Option = computed(() => {
  const counter: Record<string, number> = {}
  salesOrders.forEach(o => o.items.forEach(i => {
    counter[i.name] = (counter[i.name] || 0) + i.amount
  }))
  const list = Object.entries(counter)
    .map(([name, v]) => ({ name, value: v }))
    .sort((a, b) => b.value - a.value).slice(0, 10)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value', name: '元' },
    yAxis: { type: 'category', data: list.map(x => x.name) },
    series: [{ type: 'bar', data: list.map(x => x.value), itemStyle: { color: '#07c160' } }],
  }
})
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card { border-radius: 8px; padding: 20px; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.kpi-label { font-size: 13px; opacity: .9; }
.kpi-value { font-size: 26px; font-weight: 700; margin: 6px 0 2px; }
.kpi-sub { font-size: 12px; opacity: .85; }
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card .chart { height: 280px; }
.bottom-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #303133; }
.msg-list { max-height: 280px; overflow-y: auto; }
.msg-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0f2f5; }
.msg-item.unread .msg-dot { background: #f56c6c; }
.msg-dot { width: 8px; height: 8px; border-radius: 50%; background: #c0c4cc; margin-top: 6px; flex-shrink: 0; }
.msg-content { flex: 1; }
.msg-title { font-size: 13px; color: #303133; line-height: 1.5; }
.msg-time { font-size: 11px; color: #909399; margin-top: 4px; }

@media (max-width: 1023px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
  .bottom-row { grid-template-columns: 1fr; }
}
</style>

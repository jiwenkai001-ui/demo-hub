<template>
  <div class="dashboard-page">
    <!-- 顶部问候 -->
    <div class="greeting-card">
      <div class="greeting-info">
        <div class="greeting-hello">
          你好, <span class="greeting-name">{{ username }}</span>
        </div>
        <div class="greeting-meta">
          <van-tag type="danger" size="medium" round>{{ roleName }}</van-tag>
          <span class="greeting-date">{{ today }}</span>
        </div>
      </div>
      <van-icon name="user-circle-o" size="42" color="#fff" />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-blue">
        <div class="stat-icon"><van-icon name="balance-o" /></div>
        <div class="stat-body">
          <div class="stat-value">{{ formatMoney(todaySales) }}</div>
          <div class="stat-label">今日销售额</div>
        </div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon"><van-icon name="orders-o" /></div>
        <div class="stat-body">
          <div class="stat-value">{{ pendingOrders }}</div>
          <div class="stat-label">待处理订单</div>
        </div>
      </div>
      <div class="stat-card stat-red">
        <div class="stat-icon"><van-icon name="warning-o" /></div>
        <div class="stat-body">
          <div class="stat-value">{{ stockWarningCount }}</div>
          <div class="stat-label">库存预警</div>
        </div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon"><van-icon name="clock-o" /></div>
        <div class="stat-body">
          <div class="stat-value">{{ nearExpiryCount }}</div>
          <div class="stat-label">临期商品</div>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="section">
      <div class="section-title">快捷功能</div>
      <van-grid :column-num="3" :border="false" class="quick-grid">
        <van-grid-item
          v-for="act in quickActions"
          :key="act.path"
          :icon="act.icon"
          :text="act.label"
          @click="go(act.path)"
        />
      </van-grid>
    </div>

    <!-- 最近订单 -->
    <div class="section">
      <div class="section-title">
        <span>最近订单</span>
        <span class="section-more" @click="go('/sales')">查看全部 ></span>
      </div>
      <div class="orders-wrap">
        <van-card
          v-for="order in recentOrders"
          :key="order.id"
          :title="order.customerName"
          :desc="`单号: ${order.id}`"
          :price="order.payAmount"
          currency="¥"
          class="order-card"
        >
          <template #tags>
            <van-tag :type="orderStatusType(order.status)" plain>
              {{ orderStatusLabel(order.status) }}
            </van-tag>
          </template>
          <template #footer>
            <span class="order-meta">{{ order.createdAt }}</span>
            <span class="order-meta">业务员: {{ order.salesman }}</span>
          </template>
        </van-card>
        <van-empty v-if="!recentOrders.length" description="暂无订单" :image-size="80" />
      </div>
    </div>

    <!-- 站内通知 -->
    <div class="section">
      <div class="section-title">
        <span>站内通知</span>
        <van-tag v-if="unreadCount > 0" type="danger" size="mini">{{ unreadCount }} 条未读</van-tag>
      </div>
      <van-cell-group inset v-if="unreadMessages.length">
        <van-cell
          v-for="msg in unreadMessages"
          :key="msg.id"
          :title="msg.title"
          :label="msg.time"
          @click="appStore.markRead(msg.id)"
        >
          <template #icon>
            <van-icon
              :name="msgIcon(msg.type)"
              :color="msgColor(msg.type)"
              size="20"
              style="margin-right: 8px;"
            />
          </template>
          <template #value>
            <van-tag type="danger" size="mini" v-if="!msg.read">新</van-tag>
          </template>
        </van-cell>
      </van-cell-group>
      <van-empty v-else description="暂无未读消息" :image-size="80" />
    </div>

    <!-- 更多功能 -->
    <div class="more-btn-wrap">
      <van-button block plain type="primary" @click="showMore = true">
        <van-icon name="apps-o" /> 更多功能
      </van-button>
    </div>

    <!-- 更多功能动作面板 -->
    <van-action-sheet
      v-model:show="showMore"
      title="更多功能"
      :actions="moreActions"
      cancel-text="取消"
      close-on-click-action
      @select="onMoreSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import { formatMoney, getProductStock } from '@/utils/index'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const dataStore = useDataStore()

// 页面刷新后恢复用户信息
authStore.restore()

const showMore = ref(false)

// 用户问候信息
const username = computed(() => authStore.user?.name || authStore.user?.username || '员工')
const roleName = computed(() => authStore.user?.roleName || '员工')
const today = computed(() => dayjs().format('YYYY年MM月DD日'))

// 今日销售额：当日创建的销售单 payAmount 之和
const todaySales = computed(() => {
  const todayStr = dayjs().format('YYYY-MM-DD')
  return dataStore.salesOrders
    .filter(o => String(o.createdAt).startsWith(todayStr))
    .reduce((sum, o) => sum + Number(o.payAmount || 0), 0)
})

// 待处理订单：状态为 submitted 的销售单
const pendingOrders = computed(() =>
  dataStore.salesOrders.filter(o => o.status === 'submitted').length
)

// 库存预警：在售商品库存低于下限数量
const stockWarningCount = computed(() =>
  dataStore.products
    .filter(p => p.status === 1)
    .filter(p => getProductStock(p.id, dataStore) < p.minStock)
    .length
)

// 临期商品：在售批次剩余量大于 0 且保质期剩余 <= 15 天
const nearExpiryCount = computed(() =>
  dataStore.batches.filter(b => {
    if (b.status !== 1 || !b.remainingQty || b.remainingQty <= 0) return false
    const diff = dayjs(b.expiryDate).diff(dayjs(), 'day')
    return diff >= 0 && diff <= 15
  }).length
)

// 最近订单：取最新 3 条
const recentOrders = computed(() => [...dataStore.salesOrders].slice(0, 3))

// 未读消息
const unreadMessages = computed(() => appStore.messages.filter(m => !m.read))
const unreadCount = computed(() => appStore.unreadCount)

// 快捷功能入口
const quickActions = [
  { path: '/product', icon: 'apps-o', label: '商品档案' },
  { path: '/sales', icon: 'edit', label: '销售开单' },
  { path: '/purchase', icon: 'cart-o', label: '采购管理' },
  { path: '/stock', icon: 'balance-o', label: '库存查询' },
  { path: '/sales/field', icon: 'location-o', label: '外勤车销' },
  { path: '/employee', icon: 'manager-o', label: '员工管理' }
]

// 更多功能菜单
const moreActions = [
  { name: '批次管理', path: '/product/batch' },
  { name: '分类管理', path: '/product/category' },
  { name: '索证索票', path: '/product/cert' },
  { name: '进货台账', path: '/product/ledger' },
  { name: '过期商品查询', path: '/product/expired' },
  { name: '智能补货', path: '/purchase/replenish' },
  { name: '采购入库', path: '/purchase/inbound' },
  { name: '采购退货', path: '/purchase/return' },
  { name: '供应商档案', path: '/purchase/supplier' },
  { name: '销售退货', path: '/sales/return' },
  { name: '价格体系', path: '/sales/price' },
  { name: '仓库调拨', path: '/stock/transfer' },
  { name: '库存盘点', path: '/stock/count' },
  { name: '库存预警', path: '/stock/warning' }
]

function go(path) {
  router.push(path)
}

function onMoreSelect(item) {
  showMore.value = false
  router.push(item.path)
}

function orderStatusLabel(s) {
  const map = { submitted: '待处理', approved: '已审核', completed: '已完成', draft: '草稿' }
  return map[s] || s
}
function orderStatusType(s) {
  const map = { submitted: 'warning', approved: 'primary', completed: 'success', draft: 'default' }
  return map[s] || 'default'
}

function msgIcon(type) {
  const map = { near_expiry: 'clock-o', overdue: 'gold-pay-o', expired: 'warning-o', approval: 'info-o', low_stock: 'apps-o' }
  return map[type] || 'bell'
}
function msgColor(type) {
  const map = { near_expiry: '#ff976a', overdue: '#ee0a24', expired: '#ee0a24', approval: '#1989fa', low_stock: '#ff976a' }
  return map[type] || '#1989fa'
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

/* 问候头部 */
.greeting-card {
  padding: 20px 16px 28px;
  background: linear-gradient(120deg, #1989fa 0%, #4ba9ff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.greeting-hello {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
}
.greeting-name {
  color: #fff;
}
.greeting-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.95;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 12px;
  margin-top: -16px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.stat-card .stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 10px;
  flex-shrink: 0;
}
.stat-card .stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-card .stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}
.stat-blue { background: linear-gradient(135deg, #1989fa, #4ba9ff); }
.stat-orange { background: linear-gradient(135deg, #ff976a, #ffb070); }
.stat-red { background: linear-gradient(135deg, #ee0a24, #ff4d4f); }

/* 区块 */
.section {
  margin: 16px 0 0;
}
.section .section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 16px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-more {
  font-size: 12px;
  color: #1989fa;
  font-weight: normal;
}

/* 快捷功能 */
.quick-grid {
  background: #fff;
  border-radius: 12px;
  margin: 0 12px;
  overflow: hidden;
}

/* 订单卡片 */
.orders-wrap {
  padding: 0 8px;
}
.order-card {
  background: #fff;
  border-radius: 12px;
  margin: 0 4px 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.order-meta {
  font-size: 12px;
  color: #969799;
  margin-right: 12px;
}

/* 更多功能按钮 */
.more-btn-wrap {
  padding: 16px;
}
</style>

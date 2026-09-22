<template>
  <div class="main-layout">
    <!-- 顶部导航 -->
    <van-nav-bar :title="currentTitle" left-arrow @click-left="onBack" v-if="showBack" fixed placeholder>
      <template #right>
        <van-icon name="bell" :badge="unreadCount || ''" size="20" @click="showMessages = true" />
      </template>
    </van-nav-bar>
    <van-nav-bar :title="currentTitle" v-else fixed placeholder>
      <template #right>
        <van-icon name="bell" :badge="unreadCount || ''" size="20" @click="showMessages = true" />
      </template>
    </van-nav-bar>

    <!-- 内容区 -->
    <div class="layout-content">
      <router-view />
    </div>

    <!-- 底部 Tabbar -->
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item to="/dashboard" icon="wap-home-o">工作台</van-tabbar-item>
      <van-tabbar-item to="/product" icon="apps-o">商品</van-tabbar-item>
      <van-tabbar-item to="/sales" icon="edit">开单</van-tabbar-item>
      <van-tabbar-item to="/purchase" icon="cart-o">采购</van-tabbar-item>
      <van-tabbar-item to="/stock" icon="balance-o">库存</van-tabbar-item>
    </van-tabbar>

    <!-- 消息弹窗 -->
    <van-popup v-model:show="showMessages" position="top" :style="{ height: '60%' }" round>
      <div class="msg-popup">
        <div class="msg-header">
          <span class="text-bold">站内消息</span>
          <van-button size="small" type="primary" plain @click="markAllRead">全部已读</van-button>
        </div>
        <van-cell-group inset>
          <van-cell
            v-for="msg in messages"
            :key="msg.id"
            :title="msg.title"
            :label="msg.time"
            @click="onMsgClick(msg)"
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
              <van-tag v-if="!msg.read" type="danger" size="mini">新</van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 更多功能入口 -->
    <van-popup v-model:show="showMore" position="bottom" round>
      <div class="more-popup">
        <div class="section-title">更多功能</div>
        <van-grid :column-num="4" :border="false">
          <van-grid-item v-for="item in moreMenu" :key="item.path" :icon="item.icon" :text="item.label" @click="goMore(item.path)" />
        </van-grid>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const activeTab = ref(0)
const showMessages = ref(false)
const showMore = ref(false)

const { messages, unreadCount, markAllRead, markRead } = appStore

const currentTitle = computed(() => route.meta?.title || '食品批发')
const showBack = computed(() => route.path !== '/dashboard')

const moreMenu = [
  { path: '/employee', icon: 'manager-o', label: '员工管理' },
  { path: '/product/batch', icon: 'label-o', label: '批次管理' },
  { path: '/product/category', icon: 'cluster-o', label: '分类管理' },
  { path: '/product/import', icon: 'down', label: '批量导入' },
  { path: '/product/cert', icon: 'certificate', label: '索证索票' },
  { path: '/product/ledger', icon: 'description', label: '进货台账' },
  { path: '/product/expired', icon: 'warning-o', label: '过期商品' },
  { path: '/purchase/inbound', icon: 'logistics', label: '采购入库' },
  { path: '/purchase/return', icon: 'revoke', label: '采购退货' },
  { path: '/purchase/supplier', icon: 'friends-o', label: '供应商' },
  { path: '/purchase/replenish', icon: 'chart-trending-o', label: '智能补货' },
  { path: '/sales/return', icon: 'revoke', label: '销售退货' },
  { path: '/sales/price', icon: 'gold-pay-o', label: '价格体系' },
  { path: '/sales/field', icon: 'location-o', label: '外勤车销' },
  { path: '/stock/transfer', icon: 'exchange', label: '仓库调拨' },
  { path: '/stock/count', icon: 'todo-list-o', label: '库存盘点' },
  { path: '/stock/warning', icon: 'warning-o', label: '库存预警' },
]

function onBack() {
  router.back()
}

function goMore(path) {
  showMore.value = false
  router.push(path)
}

function onMsgClick(msg) {
  markRead(msg.id)
}

function msgIcon(type) {
  const map = { near_expiry: 'clock-o', overdue: 'gold-pay-o', expired: 'warning-o', approval: 'info-o', low_stock: 'apps-o' }
  return map[type] || 'bell'
}

function msgColor(type) {
  const map = { near_expiry: '#ff976a', overdue: '#ee0a24', expired: '#ee0a24', approval: '#1989fa', low_stock: '#ff976a' }
  return map[type] || '#1989fa'
}

watch(() => route.path, (path) => {
  if (path === '/dashboard') {
    // show more button on dashboard
  }
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: #f7f8fa;
}
.layout-content {
  min-height: calc(100vh - 96px);
}
.msg-popup {
  padding: 16px 0;
}
.msg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
}
.more-popup {
  padding: 16px;
  padding-bottom: 32px;
}
</style>

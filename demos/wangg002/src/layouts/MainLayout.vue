<template>
  <!-- 主布局:≥768 用 Element Plus 侧边栏,<768 用 Vant 底部 Tabbar -->
  <div class="main-layout" :class="{ 'is-mobile': isMobile }">
    <!-- 桌面/平板:侧边栏 -->
    <aside v-if="!isMobile" class="sidebar" width="220px">
      <div class="logo">食品批发系统</div>
      <el-menu :default-active="route.path" router class="side-menu">
        <el-menu-item v-for="item in menu" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="main">
      <!-- 顶栏 -->
      <header class="header">
        <div class="header-left">
          <span class="page-name">{{ route.meta?.title || '首页' }}</span>
        </div>
        <div class="header-right">
          <!-- 站内消息铃铛 -->
          <el-badge :value="appStore.unreadCount" :hidden="appStore.unreadCount === 0" class="bell">
            <el-dropdown trigger="click" @command="handleMsg">
              <el-icon size="20" color="#606266"><Bell /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="m in appStore.messages" :key="m.id" :command="m.id">
                    <span :class="{ 'msg-unread': !m.read }">{{ m.title }}</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="all">全部已读</el-dropdown-item>
                </el-dropdown-menu>
              </template>
              </el-dropdown>
            </el-badge>
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar size="small">{{ userInitial }}</el-avatar>
              <span class="username">{{ authStore.user?.username }} · {{ authStore.user?.role }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content">
        <router-view />
      </main>

      <!-- 移动端底部 Tabbar -->
      <van-tabbar v-if="isMobile" v-model="activeTab" route placeholder>
        <van-tabbar-item v-for="item in mobileMenu" :key="item.path" :to="item.path" :icon="item.vantIcon">
          {{ item.title }}
        </van-tabbar-item>
      </van-tabbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const isMobile = computed(() => appStore.isMobile)
const userInitial = computed(() => (authStore.user?.username || 'U').charAt(0).toUpperCase())

const menu = [
  { path: '/dashboard', title: '老板看板', icon: 'DataLine' },
  { path: '/products', title: '商品档案', icon: 'Goods' },
  { path: '/sales', title: '销售开单', icon: 'EditPen' },
  { path: '/stock', title: '库存查询', icon: 'Box' },
  { path: '/receivable', title: '往来对账', icon: 'Money' },
]

const mobileMenu = [
  { path: '/dashboard', title: '看板', vantIcon: 'wap-home-o' },
  { path: '/products', title: '商品', vantIcon: 'goods-collect-o' },
  { path: '/sales', title: '开单', vantIcon: 'edit' },
  { path: '/stock', title: '库存', vantIcon: 'apps-o' },
  { path: '/receivable', title: '对账', vantIcon: 'balance-o' },
]

const activeTab = ref(0)

function handleMsg(cmd: string) {
  if (cmd === 'all') appStore.markAllRead()
  else appStore.markRead(cmd)
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.restore()
  window.addEventListener('resize', appStore.onResize)
})
</script>

<style scoped>
.main-layout { display: flex; height: 100vh; }
.sidebar { width: 220px; background: #001529; color: #fff; flex-shrink: 0; overflow-y: auto; }
.logo { height: 56px; line-height: 56px; text-align: center; color: #fff; font-size: 16px; font-weight: 600; border-bottom: 1px solid #1d2b3a; }
.side-menu { background: transparent; border: none; }
.side-menu :deep(.el-menu-item) { color: #bfcbd9; }
.side-menu :deep(.el-menu-item.is-active) { color: #fff; background: #1d2b3a; }
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.header { height: 56px; background: #fff; box-shadow: 0 1px 4px rgba(0,21,41,.08); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; position: sticky; top: 0; z-index: 10; }
.page-name { font-size: 16px; font-weight: 600; color: #303133; }
.header-right { display: flex; align-items: center; gap: 16px; }
.bell { cursor: pointer; }
.user-info { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.username { font-size: 13px; color: #606266; }
.msg-unread { font-weight: 600; color: #f56c6c; }
.content { flex: 1; padding: 16px; overflow-y: auto; }
.is-mobile .content { padding: 12px; padding-bottom: 60px; }
</style>

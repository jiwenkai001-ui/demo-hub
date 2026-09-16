import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由表:登录页 + 主应用(嵌套布局)
const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '老板看板', icon: 'DataLine' } },
      { path: 'products', name: 'ProductList', component: () => import('@/views/ProductList.vue'), meta: { title: '商品档案', icon: 'Goods' } },
      { path: 'sales', name: 'SalesOrder', component: () => import('@/views/SalesOrder.vue'), meta: { title: '销售开单', icon: 'EditPen' } },
      { path: 'stock', name: 'StockList', component: () => import('@/views/StockList.vue'), meta: { title: '库存查询', icon: 'Box' } },
      { path: 'receivable', name: 'ReceivableList', component: () => import('@/views/ReceivableList.vue'), meta: { title: '往来对账', icon: 'Money' } },
    ],
  },
]

const router = createRouter({ history: createWebHashHistory(), routes })

// 路由守卫:未登录跳 /login
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.name !== 'Login' && !auth.user) return { name: 'Login' }
})

export default router

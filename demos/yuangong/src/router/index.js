import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '工作台' } },
      // 员工管理
      { path: 'employee', name: 'EmployeeList', component: () => import('@/views/employee/EmployeeList.vue'), meta: { title: '员工管理' } },
      { path: 'employee/edit/:id?', name: 'EmployeeEdit', component: () => import('@/views/employee/EmployeeEdit.vue'), meta: { title: '编辑员工' } },
      // 商品档案
      { path: 'product', name: 'ProductList', component: () => import('@/views/product/ProductList.vue'), meta: { title: '商品档案' } },
      { path: 'product/edit/:id?', name: 'ProductEdit', component: () => import('@/views/product/ProductEdit.vue'), meta: { title: '编辑商品' } },
      { path: 'product/batch', name: 'BatchManage', component: () => import('@/views/product/BatchManage.vue'), meta: { title: '批次管理' } },
      { path: 'product/category', name: 'CategoryManage', component: () => import('@/views/product/CategoryManage.vue'), meta: { title: '分类管理' } },
      { path: 'product/import', name: 'ImportProduct', component: () => import('@/views/product/ImportProduct.vue'), meta: { title: '批量导入' } },
      { path: 'product/cert', name: 'SupplierCert', component: () => import('@/views/product/SupplierCert.vue'), meta: { title: '索证索票' } },
      { path: 'product/ledger', name: 'PurchaseLedger', component: () => import('@/views/product/PurchaseLedger.vue'), meta: { title: '进货台账' } },
      { path: 'product/expired', name: 'ExpiredStock', component: () => import('@/views/product/ExpiredStock.vue'), meta: { title: '过期商品查询' } },
      // 采购管理
      { path: 'purchase', name: 'PurchaseOrder', component: () => import('@/views/purchase/PurchaseOrder.vue'), meta: { title: '采购订单' } },
      { path: 'purchase/inbound', name: 'PurchaseInbound', component: () => import('@/views/purchase/PurchaseInbound.vue'), meta: { title: '采购入库' } },
      { path: 'purchase/return', name: 'PurchaseReturn', component: () => import('@/views/purchase/PurchaseReturn.vue'), meta: { title: '采购退货' } },
      { path: 'purchase/supplier', name: 'SupplierList', component: () => import('@/views/purchase/SupplierList.vue'), meta: { title: '供应商档案' } },
      { path: 'purchase/supplier/edit/:id?', name: 'SupplierEdit', component: () => import('@/views/purchase/SupplierEdit.vue'), meta: { title: '编辑供应商' } },
      { path: 'purchase/replenish', name: 'Replenishment', component: () => import('@/views/purchase/Replenishment.vue'), meta: { title: '智能补货' } },
      // 销售管理
      { path: 'sales', name: 'SalesOrder', component: () => import('@/views/sales/SalesOrder.vue'), meta: { title: '销售开单' } },
      { path: 'sales/return', name: 'SalesReturn', component: () => import('@/views/sales/SalesReturn.vue'), meta: { title: '销售退货' } },
      { path: 'sales/price', name: 'PriceSystem', component: () => import('@/views/sales/PriceSystem.vue'), meta: { title: '价格体系' } },
      { path: 'sales/field', name: 'FieldSales', component: () => import('@/views/sales/FieldSales.vue'), meta: { title: '外勤车销' } },
      // 库存管理
      { path: 'stock', name: 'StockList', component: () => import('@/views/stock/StockList.vue'), meta: { title: '库存查询' } },
      { path: 'stock/transfer', name: 'StockTransfer', component: () => import('@/views/stock/StockTransfer.vue'), meta: { title: '仓库调拨' } },
      { path: 'stock/count', name: 'StockCount', component: () => import('@/views/stock/StockCount.vue'), meta: { title: '库存盘点' } },
      { path: 'stock/warning', name: 'StockWarning', component: () => import('@/views/stock/StockWarning.vue'), meta: { title: '库存预警' } },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta?.title || '食品批发员工端'
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router

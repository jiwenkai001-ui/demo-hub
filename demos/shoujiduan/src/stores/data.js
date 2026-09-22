import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  products as mockProducts, batches as mockBatches, categories as mockCategories,
  employees as mockEmployees, suppliers as mockSuppliers, supplierPrices as mockSupplierPrices,
  customers as mockCustomers, salesOrders as mockSalesOrders, purchaseOrders as mockPurchaseOrders,
  purchaseLedger as mockLedger, transferOrders as mockTransfers, stockCounts as mockCounts,
  fieldVisits as mockVisits, salesReturns as mockSalesReturns, purchaseReturns as mockPurchaseReturns,
  productCombos as mockCombos, warehouses as mockWarehouses, stockSummary as mockStockSummary,
  salesHistory as mockSalesHistory, unitGroups as mockUnitGroups, roles, permissionModules
} from '@/mock/data'
import dayjs from 'dayjs'

export const useDataStore = defineStore('data', () => {
  const products = ref([...mockProducts])
  const batches = ref([...mockBatches])
  const categories = ref([...mockCategories])
  const employees = ref([...mockEmployees])
  const suppliers = ref([...mockSuppliers])
  const supplierPrices = ref([...mockSupplierPrices])
  const customers = ref([...mockCustomers])
  const salesOrders = ref([...mockSalesOrders])
  const purchaseOrders = ref([...mockPurchaseOrders])
  const purchaseLedger = ref([...mockLedger])
  const transferOrders = ref([...mockTransfers])
  const stockCounts = ref([...mockCounts])
  const fieldVisits = ref([...mockVisits])
  const salesReturns = ref([...mockSalesReturns])
  const purchaseReturns = ref([...mockPurchaseReturns])
  const productCombos = ref([...mockCombos])
  const warehouses = ref([...mockWarehouses])
  const stockSummary = ref([...mockStockSummary])
  const salesHistory = ref([...mockSalesHistory])
  const unitGroups = ref([...mockUnitGroups])

  // 员工管理
  function addEmployee(emp) {
    emp.id = Math.max(...employees.value.map(e => e.id), 0) + 1
    emp.createdAt = dayjs().format('YYYY-MM-DD')
    employees.value.push(emp)
  }
  function updateEmployee(id, data) {
    const idx = employees.value.findIndex(e => e.id === id)
    if (idx > -1) Object.assign(employees.value[idx], data)
  }
  function deleteEmployee(id) {
    employees.value = employees.value.filter(e => e.id !== id)
  }

  // 商品管理
  function addProduct(p) {
    p.id = Math.max(...products.value.map(p => p.id), 0) + 1
    p.code = p.code || `SP-${String(p.id).padStart(3, '0')}`
    products.value.push(p)
  }
  function updateProduct(id, data) {
    const idx = products.value.findIndex(p => p.id === id)
    if (idx > -1) Object.assign(products.value[idx], data)
  }
  function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== id)
  }

  // 批次管理
  function addBatch(b) {
    b.id = Math.max(...batches.value.map(b => b.id), 0) + 1
    batches.value.push(b)
  }

  // 供应商管理
  function addSupplier(s) {
    s.id = Math.max(...suppliers.value.map(s => s.id), 0) + 1
    s.code = s.code || `GYS-${String(s.id).padStart(3, '0')}`
    suppliers.value.push(s)
  }
  function updateSupplier(id, data) {
    const idx = suppliers.value.findIndex(s => s.id === id)
    if (idx > -1) Object.assign(suppliers.value[idx], data)
  }

  // 采购订单
  function addPurchaseOrder(o) {
    o.id = `CG${dayjs().format('YYYYMMDD')}-${String(purchaseOrders.value.length + 1).padStart(3, '0')}`
    o.createdAt = dayjs().format('YYYY-MM-DD HH:mm')
    purchaseOrders.value.unshift(o)
  }

  // 销售订单
  function addSalesOrder(o) {
    o.id = `XS${dayjs().format('YYYYMMDD')}-${String(salesOrders.value.length + 1).padStart(3, '0')}`
    o.createdAt = dayjs().format('YYYY-MM-DD HH:mm')
    salesOrders.value.unshift(o)
  }

  // 调拨单
  function addTransferOrder(o) {
    o.id = `DB${dayjs().format('YYYYMMDD')}-${String(transferOrders.value.length + 1).padStart(3, '0')}`
    o.createdAt = dayjs().format('YYYY-MM-DD HH:mm')
    transferOrders.value.unshift(o)
  }

  // 盘点单
  function addStockCount(o) {
    o.id = `PD${dayjs().format('YYYYMMDD')}-${String(stockCounts.value.length + 1).padStart(3, '0')}`
    o.createdAt = dayjs().format('YYYY-MM-DD HH:mm')
    stockCounts.value.unshift(o)
  }

  // 外勤签到
  function addFieldVisit(v) {
    v.id = Math.max(...fieldVisits.value.map(v => v.id), 0) + 1
    fieldVisits.value.unshift(v)
  }

  // 进货台账
  function addLedger(l) {
    l.id = Math.max(...purchaseLedger.value.map(l => l.id), 0) + 1
    purchaseLedger.value.unshift(l)
  }

  // 分类管理
  function addCategory(c) {
    c.id = Math.max(...categories.value.map(c => c.id), 0) + 1
    categories.value.push(c)
  }

  return {
    products, batches, categories, employees, suppliers, supplierPrices, customers,
    salesOrders, purchaseOrders, purchaseLedger, transferOrders, stockCounts,
    fieldVisits, salesReturns, purchaseReturns, productCombos, warehouses,
    stockSummary, salesHistory, unitGroups, roles, permissionModules,
    addEmployee, updateEmployee, deleteEmployee,
    addProduct, updateProduct, deleteProduct,
    addBatch, addSupplier, updateSupplier,
    addPurchaseOrder, addSalesOrder, addTransferOrder, addStockCount,
    addFieldVisit, addLedger, addCategory
  }
})

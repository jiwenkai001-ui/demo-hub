<template>
  <div class="product-list-page">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <van-search
        v-model="keyword"
        placeholder="商品名称 / 编码 / 条码"
        shape="round"
        show-action
        @search="onSearch"
        @clear="keyword = ''"
      >
        <template #action>
          <span class="search-action" @click="onSearch">搜索</span>
        </template>
      </van-search>
      <van-dropdown-menu class="cate-menu">
        <van-dropdown-item v-model="categoryId" :options="categoryOptions" @change="onFilter" />
      </van-dropdown-menu>
    </div>

    <!-- 操作按钮 -->
    <div class="action-row">
      <van-button size="small" type="primary" plain icon="scan" @click="showScan = true">扫码建档</van-button>
      <van-button size="small" type="primary" plain icon="down" @click="goImport">批量导入</van-button>
      <span class="action-count">共 {{ filteredList.length }} 个商品</span>
    </div>

    <!-- 商品列表 -->
    <div class="product-wrap">
      <van-empty v-if="!filteredList.length" description="暂无商品档案" :image-size="90" />

      <van-swipe-cell v-for="p in filteredList" :key="p.id" class="swipe-item">
        <div class="product-item" @click="goEdit(p.id)">
          <div class="product-head">
            <div class="product-name">
              <span class="name-text">{{ p.name }}</span>
              <van-tag :color="statusColor(p.status)" size="mini" round>{{ statusLabel(p.status) }}</van-tag>
            </div>
            <van-tag plain type="primary" size="mini" round>{{ p.categoryName }}</van-tag>
          </div>

          <div class="product-meta">
            <span>编码：{{ p.code }}</span>
            <span>条码：{{ p.barcode }}</span>
          </div>
          <div class="product-meta">
            <span>规格：{{ p.spec }}</span>
            <span>单位：{{ p.mainUnit }}</span>
          </div>

          <div class="product-price-row">
            <span class="cost">进价 {{ formatMoney(p.costPrice) }}</span>
            <span class="retail">售价 {{ formatMoney(p.retailPrice) }}</span>
            <span class="stock">
              <van-icon name="balance-o" />
              库存 {{ getProductStock(p.id, dataStore) }}{{ p.mainUnit }}
            </span>
          </div>

          <div class="product-shelf">
            <span>保质期 {{ p.shelfLifeDays }} 天</span>
            <van-tag v-if="p.shelfLifeDays < 90" type="warning" size="mini" round>短保商品</van-tag>
          </div>
        </div>

        <template #right>
          <van-button square type="primary" text="编辑" class="swipe-btn" @click="goEdit(p.id)" />
          <van-button square type="danger" text="删除" class="swipe-btn" @click="onDelete(p)" />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 新增商品 浮动按钮 -->
    <div class="fab-btn" @click="goEdit()">
      <van-icon name="plus" size="20" color="#fff" />
      <span class="fab-text">新增商品</span>
    </div>

    <!-- 扫码弹窗 -->
    <ScanDialog v-model="showScan" @scanned="onScanned" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney, getProductStock } from '@/utils/index'
import ScanDialog from '@/components/ScanDialog.vue'

const router = useRouter()
const dataStore = useDataStore()

const keyword = ref('')
const categoryId = ref(0)
const showScan = ref(false)

// 分类下拉选项
const categoryOptions = computed(() => [
  { text: '全部分类', value: 0 },
  ...dataStore.categories.map(c => ({ text: c.name, value: c.id }))
])

// 过滤后的商品列表
const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return dataStore.products.filter(p => {
    const matchKw = !kw ||
      p.name.toLowerCase().includes(kw) ||
      String(p.code).toLowerCase().includes(kw) ||
      String(p.barcode).includes(kw)
    const matchCate = !categoryId.value || p.categoryId === categoryId.value
    return matchKw && matchCate
  })
})

function onSearch() {
  // 关键字变化由 computed 自动响应，此处仅触发一次 Toast 提示
  if (keyword.value && !filteredList.value.length) {
    showToast('未匹配到商品')
  }
}

function onFilter() {
  // 由 computed 自动响应
}

function statusLabel(s) {
  return { 1: '正常', 2: '停采', 3: '停售' }[s] || '未知'
}
function statusColor(s) {
  return { 1: '#07c160', 2: '#ff976a', 3: '#ee0a24' }[s] || '#969799'
}

function goEdit(id) {
  if (id) {
    router.push(`/product/edit/${id}`)
  } else {
    router.push('/product/edit')
  }
}

function goImport() {
  router.push('/product/import')
}

// 扫码结果处理：匹配到则进入编辑，未匹配则带条码新建
function onScanned(code) {
  showScan.value = false
  const matched = dataStore.products.find(p => String(p.barcode) === String(code))
  if (matched) {
    showToast(`匹配到商品：${matched.name}`)
    router.push(`/product/edit/${matched.id}`)
  } else {
    showToast('未匹配商品，前往建档')
    router.push({ path: '/product/edit', query: { barcode: code } })
  }
}

function onDelete(p) {
  showConfirmDialog({
    title: '删除确认',
    message: `确定删除商品「${p.name}」吗？删除后不可恢复。`
  }).then(() => {
    dataStore.deleteProduct(p.id)
    showSuccessToast('已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.product-list-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 96px;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
}
.cate-menu {
  border-top: 1px solid #f7f8fa;
}
.cate-menu :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 40px;
}

/* 操作按钮行 */
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}
.action-count {
  margin-left: auto;
  font-size: 12px;
  color: #969799;
}
.search-action {
  color: #1989fa;
  font-size: 14px;
}

/* 列表 */
.product-wrap {
  padding: 0 8px;
}
.swipe-item {
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.product-item {
  padding: 12px 14px;
}
.product-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.product-name {
  display: flex;
  align-items: center;
  gap: 6px;
}
.name-text {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.product-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}
.product-price-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ebedf0;
  font-size: 13px;
}
.cost { color: #ee0a24; font-weight: 600; }
.retail { color: #1989fa; font-weight: 600; }
.stock {
  margin-left: auto;
  color: #07c160;
  display: flex;
  align-items: center;
  gap: 2px;
}
.product-shelf {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #969799;
}

/* 滑动按钮 */
.swipe-btn {
  height: 100%;
}

/* 浮动新增按钮 */
.fab-btn {
  position: fixed;
  right: 18px;
  bottom: 72px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1989fa, #4ba9ff);
  box-shadow: 0 4px 14px rgba(25, 137, 250, 0.4);
  color: #fff;
}
.fab-text {
  font-size: 13px;
  font-weight: 600;
}
</style>

<template>
  <div class="supplier-list-page">
    <!-- 搜索 -->
    <van-search
      v-model="keyword"
      placeholder="搜索供应商名称/编号"
      shape="round"
      show-action
      @search="onSearch"
      @clear="onSearch"
    >
      <template #action>
        <span @click="onSearch">搜索</span>
      </template>
    </van-search>

    <!-- 列表 -->
    <div class="supplier-list">
      <van-swipe-cell v-for="s in filteredSuppliers" :key="s.id">
        <div class="supplier-card" @click="goEdit(s.id)">
          <div class="sc-header">
            <span class="sc-name">{{ s.name }}</span>
            <van-tag
              :type="complianceType(s)"
              round
              plain
            >
              {{ complianceLabel(s) }}
            </van-tag>
          </div>
          <div class="sc-row">
            <span class="sc-label">编号:</span>
            <span class="sc-val">{{ s.code }}</span>
          </div>
          <div class="sc-row">
            <span class="sc-label">联系人:</span>
            <span class="sc-val">{{ s.contact }}</span>
            <van-icon name="phone-o" color="#1989fa" />
            <a :href="`tel:${s.phone}`" class="sc-phone" @click.stop>{{ s.phone }}</a>
          </div>
          <div class="sc-row" v-if="s.certs && s.certs.length">
            <span class="sc-label">资质:</span>
            <span class="sc-val">
              {{ s.certs.length }} 个附件
              <van-icon name="certificate" color="#07c160" />
            </span>
          </div>
        </div>
        <template #right>
          <div class="swipe-actions">
            <van-button square type="primary" text="编辑" class="swipe-btn" @click.stop="goEdit(s.id)" />
            <van-button square type="danger" text="删除" class="swipe-btn" @click.stop="onDelete(s)" />
          </div>
        </template>
      </van-swipe-cell>
      <van-empty v-if="!filteredSuppliers.length" description="暂无供应商" :image-size="80" />
    </div>

    <!-- 新增按钮 -->
    <van-floating-bubble
      icon="plus"
      class="create-bubble"
      @click="goEdit()"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney, formatDate } from '@/utils/index.js'

const router = useRouter()
const dataStore = useDataStore()

const keyword = ref('')

// 过滤
const filteredSuppliers = computed(() => {
  if (!keyword.value.trim()) return dataStore.suppliers
  const kw = keyword.value.trim().toLowerCase()
  return dataStore.suppliers.filter(s =>
    s.name.toLowerCase().includes(kw) || s.code.toLowerCase().includes(kw)
  )
})

// 合规状态
function complianceLabel(s) {
  const certs = s.certs || []
  const hasLicense = !!s.businessLicense
  const hasFood = !!s.foodLicense
  const certCount = certs.length
  if (hasLicense && hasFood && certCount >= 2) return '合规'
  if (hasLicense || hasFood || certCount > 0) return '部分'
  return '未合规'
}
function complianceType(s) {
  const label = complianceLabel(s)
  return { '合规': 'success', '部分': 'warning', '未合规': 'danger' }[label] || 'default'
}

function onSearch() {
  // 触发响应式更新
  keyword.value = String(keyword.value || '')
}

function goEdit(id) {
  if (id) {
    router.push(`/purchase/supplier/edit/${id}`)
  } else {
    router.push('/purchase/supplier/edit')
  }
}

function onDelete(s) {
  showConfirmDialog({
    title: '确认删除',
    message: `确定删除供应商 "${s.name}" 吗？`
  }).then(() => {
    const idx = dataStore.suppliers.findIndex(x => x.id === s.id)
    if (idx > -1) {
      dataStore.suppliers.splice(idx, 1)
      showSuccessToast('删除成功')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.supplier-list-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.supplier-list {
  padding: 4px 8px;
}

.supplier-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin: 0 4px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.sc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.sc-name {
  font-size: 15px;
  font-weight: 700;
  color: #323233;
}
.sc-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #646566;
  margin-top: 6px;
}
.sc-label {
  color: #969799;
  width: 60px;
}
.sc-val {
  flex: 1;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sc-phone {
  color: #1989fa;
  margin-left: 4px;
  text-decoration: none;
}

.swipe-actions {
  display: flex;
  height: 100%;
}
.swipe-btn {
  height: 100% !important;
}

.create-bubble {
  --van-floating-bubble-background: #1989fa;
  --van-floating-bubble-size: 52px;
}
</style>

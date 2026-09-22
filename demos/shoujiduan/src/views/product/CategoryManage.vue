<template>
  <div class="category-page">
    <!-- 操作栏 -->
    <div class="action-bar">
      <van-button size="small" type="primary" icon="plus" @click="openAdd">新增分类</van-button>
      <span class="action-count">共 {{ dataStore.categories.length }} 个分类</span>
    </div>

    <!-- 分类列表 -->
    <div class="cate-wrap">
      <van-empty v-if="!dataStore.categories.length" description="暂无分类" :image-size="90" />
      <van-cell-group inset>
        <van-swipe-cell v-for="c in dataStore.categories" :key="c.id">
          <van-cell :title="c.name" :label="`包含 ${productCount(c.id)} 个商品`" is-link @click="openEdit(c)">
            <template #icon>
              <van-icon name="cluster-o" size="20" color="#1989fa" style="margin-right: 8px;" />
            </template>
            <template #value>
              <van-tag plain type="primary" size="mini">ID:{{ c.id }}</van-tag>
            </template>
          </van-cell>
          <template #right>
            <van-button square type="primary" text="编辑" class="swipe-btn" @click="openEdit(c)" />
            <van-button square type="danger" text="删除" class="swipe-btn" @click="onDelete(c)" />
          </template>
        </van-swipe-cell>
      </van-cell-group>
    </div>

    <!-- 新增/编辑弹窗 -->
    <van-popup v-model:show="showForm" position="bottom" round :style="{ height: '40%' }">
      <div class="form-popup">
        <div class="popup-title">{{ editingId ? '编辑分类' : '新增分类' }}</div>
        <van-cell-group inset>
          <van-field
            v-model="form.name"
            label="分类名称"
            placeholder="请输入分类名称"
            clearable
            required
          />
        </van-cell-group>
        <div class="popup-btn">
          <van-button block type="primary" round @click="onSave">{{ editingId ? '保存修改' : '确认新增' }}</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { useDataStore } from '@/stores/data'

const dataStore = useDataStore()

const showForm = ref(false)
const editingId = ref(null)
const form = reactive({ name: '' })

function productCount(cateId) {
  return dataStore.products.filter(p => p.categoryId === cateId).length
}

function openAdd() {
  editingId.value = null
  form.name = ''
  showForm.value = true
}

function openEdit(c) {
  editingId.value = c.id
  form.name = c.name
  showForm.value = true
}

function onSave() {
  if (!form.name.trim()) {
    showToast('请输入分类名称')
    return
  }
  if (editingId.value) {
    // 编辑：直接更新 store 中分类
    const target = dataStore.categories.find(c => c.id === editingId.value)
    if (target) {
      target.name = form.name.trim()
      // 同步更新商品上的分类名
      dataStore.products.forEach(p => {
        if (p.categoryId === editingId.value) p.categoryName = form.name.trim()
      })
    }
    showSuccessToast('修改成功')
  } else {
    dataStore.addCategory({ name: form.name.trim(), parentId: 0 })
    showSuccessToast('新增成功')
  }
  showForm.value = false
}

function onDelete(c) {
  const count = productCount(c.id)
  if (count > 0) {
    showToast(`该分类下有 ${count} 个商品，无法删除`)
    return
  }
  showConfirmDialog({
    title: '删除确认',
    message: `确定删除分类「${c.name}」吗？`
  }).then(() => {
    // store 未提供 deleteCategory，直接操作暴露的 ref
    dataStore.categories = dataStore.categories.filter(x => x.id !== c.id)
    showSuccessToast('已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.action-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}
.action-count {
  margin-left: auto;
  font-size: 12px;
  color: #969799;
}
.cate-wrap {
  padding: 0 4px;
}
.swipe-btn {
  height: 100%;
}

.form-popup {
  padding: 0 0 16px;
}
.popup-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  padding: 16px 0;
  border-bottom: 1px solid #ebedf0;
}
.popup-btn {
  padding: 20px 16px 0;
}
</style>

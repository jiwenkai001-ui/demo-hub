<template>
  <div class="employee-page">
    <!-- 无权限 -->
    <van-empty
      v-if="!authStore.isAdmin"
      image="error"
      description="无权限访问，仅系统管理员可管理员工"
    >
      <van-button type="primary" size="small" round @click="router.push('/dashboard')">
        返回工作台
      </van-button>
    </van-empty>

    <template v-else>
      <!-- 统计概览 -->
      <div class="stats-card">
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-num">{{ totalCount }}</div>
            <div class="stat-label">员工总数</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-num success">{{ activeCount }}</div>
            <div class="stat-label">在岗</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-num danger">{{ disabledCount }}</div>
            <div class="stat-label">停用</div>
          </div>
        </div>
        <div class="role-breakdown">
          <div
            v-for="r in roleBreakdown"
            :key="r.value"
            class="role-chip"
            :class="{ active: activeRole === r.value }"
            @click="toggleRoleFilter(r.value)"
          >
            <span class="role-dot" :style="{ background: roleColor(r.value) }"></span>
            <span class="role-name">{{ r.label }}</span>
            <span class="role-count">{{ r.count }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索栏 -->
      <van-search
        v-model="keyword"
        placeholder="搜索姓名或账号"
        shape="round"
        clearable
        @clear="onClearSearch"
      />

      <!-- 新增按钮 -->
      <div class="add-btn-wrap">
        <van-button block type="primary" icon="plus" @click="onAdd">
          新增员工
        </van-button>
      </div>

      <!-- 员工列表 -->
      <div class="emp-list" v-if="filteredList.length">
        <div class="emp-card" v-for="emp in filteredList" :key="emp.id">
          <van-swipe-cell :before-close="makeBeforeClose(emp)">
            <van-cell center :border="false" is-link @click="onEdit(emp)">
              <template #icon>
                <div
                  class="emp-avatar"
                  :style="{ background: roleColor(emp.role) }"
                >
                  {{ emp.name.charAt(0) }}
                </div>
              </template>
              <template #title>
                <div class="emp-title-row">
                  <span class="emp-name">{{ emp.name }}</span>
                  <van-tag plain :color="roleColor(emp.role)" size="medium" round>
                    {{ emp.roleName }}
                  </van-tag>
                </div>
              </template>
              <template #label>
                <div class="emp-meta">
                  <van-icon name="manager-o" />
                  <span>{{ emp.username }}</span>
                  <span class="dot">·</span>
                  <van-icon name="phone-o" />
                  <span>{{ emp.phone || '未填写' }}</span>
                </div>
              </template>
              <template #value>
                <div class="emp-right">
                  <van-tag
                    :type="emp.status === 1 ? 'success' : 'danger'"
                    size="medium"
                  >
                    {{ emp.status === 1 ? '正常' : '停用' }}
                  </van-tag>
                  <van-button
                    size="small"
                    type="primary"
                    plain
                    @click.stop="onEdit(emp)"
                  >
                    编辑
                  </van-button>
                </div>
              </template>
            </van-cell>
            <template #right>
              <van-button square type="danger" text="删除" class="delete-btn" />
            </template>
          </van-swipe-cell>
        </div>
      </div>
      <van-empty v-else description="暂无符合条件的员工" :image-size="100" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()

// 页面刷新后恢复用户信息，确保 isAdmin 判定正确
authStore.restore()

const keyword = ref('')
const activeRole = ref('')

// 角色配色
const roleColorMap = {
  admin: '#ee0a24',
  sales: '#1989fa',
  field: '#07c160',
  purchase: '#ff976a',
  stock: '#7232dd'
}
function roleColor(role) {
  return roleColorMap[role] || '#969799'
}

// 列表过滤：姓名 / 账号 / 手机号 + 角色筛选
const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return dataStore.employees.filter(e => {
    const roleOk = !activeRole.value || e.role === activeRole.value
    if (!roleOk) return false
    if (!kw) return true
    return (
      e.name.toLowerCase().includes(kw) ||
      e.username.toLowerCase().includes(kw) ||
      (e.phone || '').includes(kw)
    )
  })
})

// 统计概览
const totalCount = computed(() => dataStore.employees.length)
const activeCount = computed(() => dataStore.employees.filter(e => e.status === 1).length)
const disabledCount = computed(() => dataStore.employees.filter(e => e.status === 0).length)
const roleBreakdown = computed(() =>
  dataStore.roles.map(r => ({
    ...r,
    count: dataStore.employees.filter(e => e.role === r.value).length
  }))
)

function toggleRoleFilter(value) {
  activeRole.value = activeRole.value === value ? '' : value
}

function onClearSearch() {
  keyword.value = ''
  activeRole.value = ''
}

function onAdd() {
  router.push('/employee/edit')
}

function onEdit(emp) {
  router.push(`/employee/edit/${emp.id}`)
}

// 滑动删除：点击右侧删除按钮时弹出确认框
function makeBeforeClose(emp) {
  return ({ position, instance }) => {
    if (position === 'right') {
      showConfirmDialog({
        title: '删除确认',
        message: `确定要删除员工「${emp.name}」吗？删除后不可恢复。`,
        confirmButtonText: '删除',
        confirmButtonColor: '#ee0a24',
        cancelButtonText: '取消'
      })
        .then(() => {
          dataStore.deleteEmployee(emp.id)
          showSuccessToast('删除成功')
        })
        .catch(() => {
          instance.close()
        })
      return false
    }
    return true
  }
}
</script>

<style scoped>
.employee-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 70px;
}

/* 统计卡片 */
.stats-card {
  margin: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f2f6ff 100%);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(25, 137, 250, 0.08);
}
.stats-row {
  display: flex;
  align-items: center;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #323233;
  line-height: 1.2;
}
.stat-num.success { color: #07c160; }
.stat-num.danger { color: #ee0a24; }
.stat-label {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: #ebedf0;
}

/* 角色分布 */
.role-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebedf0;
}
.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid #ebedf0;
  border-radius: 20px;
  font-size: 12px;
  color: #646566;
}
.role-chip.active {
  border-color: #1989fa;
  color: #1989fa;
  background: #ecf5ff;
}
.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.role-count {
  font-weight: 600;
  color: #323233;
}

/* 新增按钮 */
.add-btn-wrap {
  padding: 0 12px 8px;
}

/* 员工列表 */
.emp-list {
  padding: 0 12px;
}
.emp-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.emp-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.emp-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.emp-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.emp-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}
.emp-meta .dot {
  margin: 0 2px;
}

.emp-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  height: 100%;
}
</style>

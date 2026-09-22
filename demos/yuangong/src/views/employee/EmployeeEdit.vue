<template>
  <div class="emp-edit-page">
    <van-form @submit="onSave">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="姓名"
          placeholder="请输入姓名"
          clearable
          required
          :rules="[{ required: true, message: '请输入姓名' }]"
        />
        <van-field
          v-model="form.username"
          label="账号"
          placeholder="请输入账号"
          clearable
          required
          :rules="[{ required: true, message: '请输入账号' }]"
        >
          <template #extra>
            <span class="field-hint">登录用账号</span>
          </template>
        </van-field>
        <van-field
          v-model="form.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          clearable
          maxlength="11"
        />
        <van-field
          v-model="form.password"
          label="密码"
          placeholder="请输入密码"
          type="password"
          show-password
          clearable
        >
          <template #extra>
            <span class="field-hint">默认 123456</span>
          </template>
        </van-field>
      </van-cell-group>

      <!-- 角色与权限 -->
      <div class="section-title">角色与权限</div>
      <van-radio-group v-model="form.role">
        <van-cell-group inset>
          <van-cell
            v-for="r in dataStore.roles"
            :key="r.value"
            :title="r.label"
            :label="rolePermText(r)"
            clickable
            @click="form.role = r.value"
          >
            <template #right-icon>
              <van-radio :name="r.value" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-radio-group>

      <div class="perm-hint">
        <van-icon name="info-o" />
        <span>选择角色后会自动勾选该角色的默认权限，您也可以手动调整。</span>
      </div>

      <van-checkbox-group v-model="form.permissions">
        <van-cell-group inset>
          <van-cell
            v-for="m in dataStore.permissionModules"
            :key="m.value"
            :title="m.label"
            clickable
            @click="togglePermission(m.value)"
          >
            <template #right-icon>
              <van-checkbox :name="m.value" shape="square" @click.stop />
            </template>
          </van-cell>
        </van-cell-group>
      </van-checkbox-group>

      <!-- 账号状态 -->
      <div class="section-title">账号状态</div>
      <van-cell-group inset>
        <van-cell title="启用状态" center>
          <template #value>
            <van-tag :type="form.status ? 'success' : 'danger'" size="medium">
              {{ form.status ? '正常' : '停用' }}
            </van-tag>
          </template>
          <template #right-icon>
            <van-switch v-model="form.status" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 保存按钮 -->
      <div class="save-btn-wrap">
        <van-button block type="primary" native-type="submit" :loading="saving">
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'

const router = useRouter()
const route = useRoute()
const dataStore = useDataStore()

const isEdit = computed(() => !!route.params.id)

// 动态设置导航栏标题（MainLayout 的 nav-bar 读取 route.meta.title）
route.meta.title = isEdit.value ? '编辑员工' : '新增员工'

const saving = ref(false)

const form = reactive({
  name: '',
  username: '',
  phone: '',
  password: '',
  role: '',
  permissions: [],
  status: true
})

// 通配符权限 '*' 展开为全部模块，便于复选框勾选
function expandPermissions(perms) {
  if (!perms || !perms.length) return []
  if (perms.includes('*')) {
    return dataStore.permissionModules.map(m => m.value)
  }
  return [...perms]
}

// 加载已有员工数据（编辑场景）
if (isEdit.value) {
  const emp = dataStore.employees.find(e => e.id === Number(route.params.id))
  if (emp) {
    form.name = emp.name
    form.username = emp.username
    form.phone = emp.phone || ''
    form.password = emp.password || ''
    form.role = emp.role
    form.permissions = expandPermissions(emp.permissions)
    form.status = emp.status === 1
  } else {
    showToast('员工不存在')
    router.replace('/employee')
  }
} else {
  // 新增默认值
  form.password = '123456'
  form.status = true
}

// 角色变更后自动勾选默认权限（注册于数据加载之后，避免覆盖已有自定义权限）
watch(
  () => form.role,
  newRole => {
    if (!newRole) return
    const r = dataStore.roles.find(x => x.value === newRole)
    if (r) {
      form.permissions = expandPermissions(r.permissions)
    }
  }
)

function rolePermText(r) {
  if (r.permissions.includes('*')) return '全部权限'
  const labels = r.permissions
    .map(p => dataStore.permissionModules.find(m => m.value === p)?.label)
    .filter(Boolean)
  return labels.length ? labels.join('、') : '无'
}

function togglePermission(value) {
  const idx = form.permissions.indexOf(value)
  if (idx > -1) {
    form.permissions.splice(idx, 1)
  } else {
    form.permissions.push(value)
  }
}

function buildPayload() {
  const roleObj = dataStore.roles.find(r => r.value === form.role)
  // 管理员保留通配符权限语义，其他角色保存显式权限列表
  const perms = form.role === 'admin' ? ['*'] : [...form.permissions]
  return {
    username: form.username,
    password: form.password,
    name: form.name,
    role: form.role,
    roleName: roleObj?.label || '',
    phone: form.phone,
    status: form.status ? 1 : 0,
    permissions: perms
  }
}

async function onSave() {
  if (!form.role) {
    showToast('请选择角色')
    return
  }
  saving.value = true
  const payload = buildPayload()
  if (isEdit.value) {
    dataStore.updateEmployee(Number(route.params.id), payload)
  } else {
    dataStore.addEmployee(payload)
  }
  saving.value = false
  showSuccessToast(isEdit.value ? '保存成功' : '新增成功')
  setTimeout(() => router.replace('/employee'), 600)
}
</script>

<style scoped>
.emp-edit-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #646566;
  margin: 16px 16px 8px;
  padding-left: 8px;
  border-left: 3px solid #1989fa;
}

.field-hint {
  font-size: 12px;
  color: #c8c9cc;
  white-space: nowrap;
}

.perm-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 8px 16px;
  font-size: 12px;
  color: #969799;
  line-height: 1.5;
}

.save-btn-wrap {
  padding: 20px 16px 0;
}
</style>

<template>
  <!-- 登录页:任意账号密码均可登录(DEMO 不做真实鉴权) -->
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="brand-name">预包装食品批发管理系统</div>
        <div class="brand-sub">轻量级业财一体 SaaS · DEMO</div>
      </div>
      <el-form :model="form" label-position="top" @submit.prevent="onLogin">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="任意账号可登录" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="任意密码" prefix-icon="Lock" show-password @keyup.enter="onLogin" />
        </el-form-item>
        <el-button type="primary" :loading="loading" style="width: 100%" @click="onLogin">登录</el-button>
      </el-form>
      <div class="tips">
        <p>· 多端通用:桌面 / 手机 / PDA 浏览器</p>
        <p>· 食品合规内置:批次溯源 · 临期预警 · 先进先出</p>
        <p>· 离线开单:Service Worker + IndexedDB</p>
        <p>· 站内消息:WebSocket 实时推送</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ username: 'admin', password: '123456' })
const loading = ref(false)

async function onLogin() {
  if (!form.username) {
    ElMessage.warning('请输入账号')
    return
  }
  loading.value = true
  await new Promise(r => setTimeout(r, 400))
  authStore.login(form.username)
  loading.value = false
  ElMessage.success('登录成功')
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1989fa 0%, #07c160 100%);
  padding: 16px;
}
.login-card {
  width: 100%; max-width: 420px; background: #fff; border-radius: 12px;
  padding: 32px 24px; box-shadow: 0 8px 32px rgba(0,0,0,.15);
}
.brand { text-align: center; margin-bottom: 24px; }
.brand-name { font-size: 20px; font-weight: 700; color: #303133; }
.brand-sub { font-size: 12px; color: #909399; margin-top: 4px; }
.tips { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; font-size: 12px; color: #909399; line-height: 1.8; }
</style>

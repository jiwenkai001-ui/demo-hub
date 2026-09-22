<template>
  <div class="login-page">
    <!-- 品牌头部 -->
    <div class="login-header">
      <div class="brand-logo">
        <van-icon name="shop-o" size="44" color="#fff" />
      </div>
      <h1 class="brand-title">预包装食品批发管理系统</h1>
      <p class="brand-subtitle">员工端 H5</p>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="账号"
            placeholder="请输入账号"
            left-icon="user-o"
            clearable
            :rules="[{ required: true, message: '请输入账号' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            left-icon="lock"
            show-password
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="login-btn-wrap">
          <van-button
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            loading-text="登录中..."
          >
            登 录
          </van-button>
        </div>
      </van-form>

      <!-- 系统特性 -->
      <div class="login-tips">
        <div class="tips-title">
          <van-icon name="info-o" /> 系统特性
        </div>
        <div class="tips-grid">
          <div class="tip-item" v-for="t in tips" :key="t.label">
            <van-icon :name="t.icon" :color="t.color" size="20" />
            <span class="tip-text">{{ t.label }}</span>
          </div>
        </div>
      </div>

      <!-- 演示账号提示 -->
      <div class="demo-hint">
        <van-icon name="warning-o" size="14" />
        <span>演示账号：admin / 123456</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: 'admin',
  password: '123456'
})
const loading = ref(false)

const tips = [
  { label: '批次溯源', icon: 'label-o', color: '#1989fa' },
  { label: '临期预警', icon: 'clock-o', color: '#ff976a' },
  { label: '先进先出', icon: 'sort', color: '#07c160' },
  { label: '索证索票', icon: 'certificate', color: '#ee0a24' }
]

async function onSubmit() {
  loading.value = true
  // 模拟登录请求延迟，展示 loading 状态
  await new Promise(resolve => setTimeout(resolve, 400))
  const res = authStore.login(form.username, form.password)
  loading.value = false
  if (res.success) {
    showSuccessToast('登录成功')
    router.replace('/dashboard')
  } else {
    showFailToast(res.message || '登录失败')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #1989fa 0%, #07c160 100%);
  display: flex;
  flex-direction: column;
  padding: 56px 16px 24px;
}

/* 品牌头部 */
.login-header {
  text-align: center;
  color: #fff;
  margin-bottom: 28px;
}
.brand-logo {
  width: 84px;
  height: 84px;
  margin: 0 auto 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
}
.brand-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.brand-subtitle {
  font-size: 14px;
  opacity: 0.9;
  letter-spacing: 4px;
}

/* 登录卡片 */
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 0 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.login-btn-wrap {
  padding: 16px;
}

/* 系统特性 */
.login-tips {
  margin: 0 16px 12px;
  padding: 14px;
  background: #f7f8fa;
  border-radius: 12px;
}
.tips-title {
  font-size: 13px;
  color: #969799;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.tip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #323233;
}

/* 演示提示 */
.demo-hint {
  margin: 0 16px;
  padding: 8px 0;
  font-size: 12px;
  color: #969799;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>

import { defineStore } from 'pinia'
import { ref } from 'vue'

// 鉴权 store:存当前登录用户(任意账号均可登录)
export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ username: string; role: string } | null>(null)

  function login(username: string, role = '老板') {
    user.value = { username, role }
    localStorage.setItem('demo_user', JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('demo_user')
  }

  function restore() {
    const cached = localStorage.getItem('demo_user')
    if (cached) {
      try { user.value = JSON.parse(cached) } catch { user.value = null }
    }
  }

  return { user, login, logout, restore }
})

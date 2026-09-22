import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { employees } from '@/mock/data'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function login(username, password) {
    const emp = employees.find(e => e.username === username && e.password === password)
    if (!emp) return { success: false, message: '账号或密码错误' }
    if (emp.status !== 1) return { success: false, message: '账号已停用，请联系管理员' }
    user.value = emp
    token.value = `token_${emp.id}_${Date.now()}`
    localStorage.setItem('token', token.value)
    localStorage.setItem('userInfo', JSON.stringify(emp))
    return { success: true }
  }

  function restore() {
    const saved = localStorage.getItem('userInfo')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function hasPermission(module) {
    if (!user.value) return false
    if (user.value.permissions.includes('*')) return true
    return user.value.permissions.includes(module)
  }

  return { user, token, isLoggedIn, isAdmin, login, restore, logout, hasPermission }
})

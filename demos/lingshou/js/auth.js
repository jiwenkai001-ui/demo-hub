// 鉴权工具:基于 localStorage 模拟登录态
// 用户信息持久化 7 天

const AUTH_KEY = 'food_demo_user'
const AUTH_EXPIRE_KEY = 'food_demo_user_expire'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

/** 获取当前登录用户,未登录或已过期返回 null */
function getCurrentUser() {
  try {
    const u = localStorage.getItem(AUTH_KEY)
    const exp = Number(localStorage.getItem(AUTH_EXPIRE_KEY) || 0)
    if (!u || !exp) return null
    if (Date.now() > exp) {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem(AUTH_EXPIRE_KEY)
      return null
    }
    return JSON.parse(u)
  } catch (e) { return null }
}

/** 登录(任意账号密码可登,密码至少 6 位) */
function login(username, password) {
  if (!username || !password) throw new Error('请输入账号和密码')
  if (password.length < 6) throw new Error('密码至少 6 位')
  const user = {
    id: 1,
    username: username,
    name: username === 'admin' ? '王老板' : username,
    role: '老板',
    loginAt: new Date().toISOString(),
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  localStorage.setItem(AUTH_EXPIRE_KEY, String(Date.now() + SEVEN_DAYS))
  return user
}

/** 登出 */
function logout() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(AUTH_EXPIRE_KEY)
  location.href = 'login.html'
}

/** 在受保护页面调用:未登录跳转到 login.html */
function requireAuth() {
  const u = getCurrentUser()
  if (!u) {
    location.href = 'login.html'
    return null
  }
  return u
}

window.Auth = { getCurrentUser, login, logout, requireAuth }

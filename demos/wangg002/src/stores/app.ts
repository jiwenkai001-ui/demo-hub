import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 应用 store:维护设备类型(桌面/平板/移动) + 站内消息(模拟 WebSocket)
export const useAppStore = defineStore('app', () => {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const messages = ref<{ id: string; title: string; type: string; read: boolean; time: string }[]>([
    { id: 'm1', title: '【临期预警】伊利安慕希 批次 YL20260615 剩余 5 天,库存 3 箱', type: 'near_expiry', read: false, time: '09-16 08:30' },
    { id: 'm2', title: '【逾期应收】福满楼餐饮欠款 28500 元已超账期 30 天', type: 'overdue', read: false, time: '09-16 09:00' },
    { id: 'm3', title: '【过期商品】王老吉凉茶 批次 WLJ20240101 已过期,自动冻结销售', type: 'expired', read: true, time: '09-15 18:00' },
    { id: 'm4', title: '【审批待办】兴隆二批超额赊销申请需审批', type: 'approval', read: false, time: '09-16 10:15' },
  ])

  const device = computed<'desktop' | 'tablet' | 'mobile'>(() => {
    if (width.value >= 1024) return 'desktop'
    if (width.value >= 768) return 'tablet'
    return 'mobile'
  })
  const isMobile = computed(() => device.value === 'mobile')
  const unreadCount = computed(() => messages.value.filter(m => !m.read).length)

  function onResize() { width.value = window.innerWidth }
  function markRead(id: string) {
    const m = messages.value.find(x => x.id === id)
    if (m) m.read = true
  }
  function markAllRead() { messages.value.forEach(m => m.read = true) }

  return { width, device, isMobile, messages, unreadCount, onResize, markRead, markAllRead }
})

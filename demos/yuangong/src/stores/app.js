import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messages as mockMessages } from '@/mock/data'

export const useAppStore = defineStore('app', () => {
  const messages = ref([...mockMessages])
  const unreadCount = computed(() => messages.value.filter(m => !m.read).length)

  function markRead(id) {
    const msg = messages.value.find(m => m.id === id)
    if (msg) msg.read = true
  }
  function markAllRead() {
    messages.value.forEach(m => m.read = true)
  }

  return { messages, unreadCount, markRead, markAllRead }
})

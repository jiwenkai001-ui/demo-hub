<template>
  <!-- 扫码弹窗:点击按钮直接启动摄像头,成功回调条码 -->
  <el-dialog v-model="visible" title="摄像头扫码" width="400px" :close-on-click-modal="false" @close="onClose" class="scan-dialog">
    <div class="scan-wrap">
      <video ref="videoEl" class="scan-video" playsinline></video>
      <div v-if="errorMsg" class="scan-error">{{ errorMsg }}</div>
      <div v-else class="scan-hint">请将条码对准摄像头</div>
    </div>
    <template #footer>
      <el-button @click="onClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { startScan, stopScan } from '@/utils/scan'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  scanned: [code: string]
}>()

const visible = ref(props.modelValue)
const videoEl = ref<HTMLVideoElement | null>(null)
const errorMsg = ref('')

watch(() => props.modelValue, async (v) => {
  visible.value = v
  if (v) {
    errorMsg.value = ''
    await nextTick()
    if (videoEl.value) {
      startScan(videoEl.value, (code) => {
        emit('scanned', code)
        visible.value = false
        emit('update:modelValue', false)
      }, (err) => {
        errorMsg.value = '摄像头不可用:' + err.message + '(如需测试,可手工输入条码)'
      })
    }
  } else {
    stopScan()
  }
})

function onClose() {
  stopScan()
  visible.value = false
  emit('update:modelValue', false)
}
</script>

<style scoped>
.scan-wrap { text-align: center; }
.scan-video { width: 100%; max-height: 320px; background: #000; border-radius: 4px; object-fit: cover; }
.scan-hint { margin-top: 8px; color: #909399; font-size: 13px; }
.scan-error { margin-top: 8px; color: #f56c6c; font-size: 13px; }
</style>

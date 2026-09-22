<template>
  <van-popup v-model:show="show" position="bottom" round :style="{ height: '60%' }" teleport="body">
    <div class="scan-container">
      <div class="scan-header">
        <span class="scan-title">扫码识别</span>
        <van-icon name="cross" size="20" @click="show = false" />
      </div>

      <!-- 模拟扫码区 -->
      <div class="scan-viewport" @click="simulateScan">
        <van-icon name="scan" size="48" color="#1989fa" />
        <p class="scan-hint">点击此处模拟扫码</p>
        <p class="scan-sub">支持条形码/二维码识别</p>
      </div>

      <!-- 手动输入 -->
      <div class="manual-input">
        <van-field
          v-model="manualCode"
          label="条码"
          placeholder="或手动输入条码"
          clearable
        >
          <template #button>
            <van-button size="small" type="primary" @click="onManualSubmit">确认</van-button>
          </template>
        </van-field>
      </div>

      <!-- 扫码历史 -->
      <div class="scan-history" v-if="history.length">
        <div class="scan-history-title">扫码记录</div>
        <van-cell
          v-for="(item, i) in history"
          :key="i"
          :title="item.code"
          :label="item.time"
          :value="item.result"
        />
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import { products } from '@/mock/data'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'scanned'])

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const manualCode = ref('')
const history = ref([])

const sampleBarcodes = products.map(p => p.barcode)

function simulateScan() {
  const code = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)]
  handleScan(code)
}

function onManualSubmit() {
  if (!manualCode.value.trim()) {
    showToast('请输入条码')
    return
  }
  handleScan(manualCode.value.trim())
  manualCode.value = ''
}

function handleScan(code) {
  const product = products.find(p => p.barcode === code)
  const result = product ? `${product.name}(${product.spec})` : '未匹配到商品'
  history.value.unshift({ code, result, time: dayjs().format('HH:mm:ss') })
  emit('scanned', code)
}
</script>

<style scoped>
.scan-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.scan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}
.scan-title { font-size: 16px; font-weight: 600; }
.scan-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  margin: 12px;
  border-radius: 12px;
  min-height: 200px;
  border: 2px dashed #dcdee0;
}
.scan-hint { margin-top: 12px; font-size: 16px; color: #323233; }
.scan-sub { margin-top: 4px; font-size: 12px; color: #969799; }
.manual-input { padding: 0 12px; }
.scan-history {
  padding: 12px;
  max-height: 120px;
  overflow-y: auto;
}
.scan-history-title {
  font-size: 13px;
  color: #969799;
  margin-bottom: 4px;
}
</style>

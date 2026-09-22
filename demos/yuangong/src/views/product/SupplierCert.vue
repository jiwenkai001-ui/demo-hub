<template>
  <div class="cert-page">
    <!-- 食品行业提示 -->
    <van-notice-bar
      left-icon="info-o"
      text="食品行业核心模块 — 供应商资质需齐全，用于市场监管检查"
      wrapable
      background="#fff7e6"
      color="#faab0e"
    />

    <!-- 供应商筛选 -->
    <van-dropdown-menu class="cert-menu">
      <van-dropdown-item v-model="supplierId" :options="supplierOptions" />
    </van-dropdown-menu>

    <!-- 供应商资质列表 -->
    <div class="cert-wrap">
      <van-empty v-if="!filteredSuppliers.length" description="暂无供应商" :image-size="90" />

      <div class="supplier-card" v-for="s in filteredSuppliers" :key="s.id">
        <div class="supplier-head">
          <div class="supplier-info">
            <van-icon name="friends-o" size="18" color="#1989fa" />
            <span class="supplier-name">{{ s.name }}</span>
          </div>
          <van-tag :color="compliance(s).color" size="medium" round>{{ compliance(s).label }}</van-tag>
        </div>
        <div class="supplier-meta">
          <span>编号：{{ s.code }}</span>
          <span>联系人：{{ s.contact }} {{ s.phone }}</span>
        </div>

        <van-cell-group inset class="cert-cells">
          <van-empty v-if="!s.certs.length" description="暂无资质文件" :image-size="50" />
          <van-cell v-for="(c, i) in s.certs" :key="i" :title="c.name" :label="c.fileName">
            <template #value>
              <div class="cert-actions">
                <span class="cert-date">{{ c.uploadDate }}</span>
                <van-button size="mini" type="primary" plain icon="eye-o" @click="onPreview(c)">预览</van-button>
              </div>
            </template>
          </van-cell>
        </van-cell-group>

        <div class="upload-btn-wrap">
          <van-button size="small" type="primary" plain icon="upgrade" block @click="openUpload(s)">
            上传新资质
          </van-button>
        </div>
      </div>
    </div>

    <!-- 上传资质弹窗 -->
    <van-popup v-model:show="showUpload" position="bottom" round :style="{ height: '50%' }">
      <div class="upload-popup">
        <div class="popup-title">上传资质文件</div>
        <div class="popup-sub" v-if="currentSupplier">供应商：{{ currentSupplier.name }}</div>
        <van-cell-group inset>
          <van-field
            v-model="uploadCertName"
            label="资质类型"
            placeholder="请选择"
            readonly
            is-link
            input-align="right"
            @click="showCertTypeSheet = true"
          />
        </van-cell-group>
        <div class="uploader-area">
          <div class="uploader-label">资质文件</div>
          <van-uploader v-model="uploadFiles" :max-count="1" accept="image/*,.pdf" />
        </div>
        <div class="popup-btn">
          <van-button block type="primary" round @click="onConfirmUpload">确认上传</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 资质类型选择 -->
    <van-action-sheet
      v-model:show="showCertTypeSheet"
      :actions="certTypeActions"
      cancel-text="取消"
      close-on-click-action
      @select="onSelectCertType"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import dayjs from 'dayjs'

const dataStore = useDataStore()

const supplierId = ref(0) // 0 = 全部
const showUpload = ref(false)
const showCertTypeSheet = ref(false)
const uploadCertName = ref('检验报告')
const uploadFiles = ref([])

const certTypeActions = [
  '营业执照', '食品生产许可证', '食品经营许可证', '检验报告'
].map(name => ({ name }))

const supplierOptions = computed(() => [
  { text: '全部供应商', value: 0 },
  ...dataStore.suppliers.map(s => ({ text: s.name, value: s.id }))
])

const filteredSuppliers = computed(() =>
  !supplierId.value
    ? dataStore.suppliers
    : dataStore.suppliers.filter(s => s.id === supplierId.value)
)

const currentSupplier = computed(() =>
  dataStore.suppliers.find(s => s.id === uploadSupplierId.value)
)

const uploadSupplierId = ref(null)

// 合规状态评估
function compliance(s) {
  const names = s.certs.map(c => c.name)
  const hasLicense = names.includes('营业执照')
  const hasFood = names.includes('食品生产许可证') || names.includes('食品经营许可证')
  const hasReport = names.includes('检验报告')
  if (!s.certs.length) return { label: '未上传', color: '#ee0a24' }
  if (hasLicense && hasFood && hasReport) return { label: '证照齐全', color: '#07c160' }
  return { label: '部分缺失', color: '#ff976a' }
}

function onPreview(c) {
  showToast(`预览：${c.fileName}`)
}

function openUpload(s) {
  uploadSupplierId.value = s.id
  uploadCertName.value = '检验报告'
  uploadFiles.value = []
  showUpload.value = true
}

function onSelectCertType(item) {
  uploadCertName.value = item.name
  showCertTypeSheet.value = false
}

function onConfirmUpload() {
  const s = currentSupplier.value
  if (!s) {
    showToast('请选择供应商')
    return
  }
  s.certs.push({
    name: uploadCertName.value,
    fileName: uploadFiles.value[0]?.name || `${uploadCertName.value}.pdf`,
    uploadDate: dayjs().format('YYYY-MM-DD')
  })
  showUpload.value = false
  uploadFiles.value = []
  showSuccessToast('上传成功')
}
</script>

<style scoped>
.cert-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.cert-menu :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 44px;
}

.cert-wrap {
  padding: 8px 10px;
}
.supplier-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.supplier-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.supplier-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.supplier-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}
.supplier-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.cert-cells {
  margin: 0;
}
.cert-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cert-date {
  font-size: 12px;
  color: #969799;
}

.upload-btn-wrap {
  margin-top: 8px;
}

/* 上传弹窗 */
.upload-popup {
  padding: 0 0 16px;
}
.popup-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  padding: 16px 0 4px;
}
.popup-sub {
  text-align: center;
  font-size: 12px;
  color: #969799;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebedf0;
  padding-bottom: 10px;
}
.uploader-area {
  padding: 12px 20px;
}
.uploader-label {
  font-size: 14px;
  color: #646566;
  margin-bottom: 8px;
}
.popup-btn {
  padding: 16px 16px 0;
}
</style>

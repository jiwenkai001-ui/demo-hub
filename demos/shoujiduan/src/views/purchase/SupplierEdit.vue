<template>
  <div class="supplier-edit-page">
    <!-- 基础信息 -->
    <div class="form-section">
      <div class="form-section-title">基础信息</div>
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="供应商名称"
          placeholder="请输入供应商名称"
          input-align="right"
          :required="true"
          :error="false"
        />
        <van-field
          v-model="form.code"
          label="供应商编号"
          placeholder="保存时自动生成（如 GYS-001）"
          input-align="right"
        />
        <van-field
          v-model="form.contact"
          label="联系人"
          placeholder="请输入联系人"
          input-align="right"
        />
        <van-field
          v-model="form.phone"
          label="电话"
          type="tel"
          placeholder="请输入联系电话"
          input-align="right"
        />
        <van-field
          v-model="form.address"
          label="地址"
          placeholder="请输入地址"
          input-align="right"
        />
        <van-field
          v-model="form.businessLicense"
          label="营业执照号"
          placeholder="请输入营业执照号"
          input-align="right"
        />
        <van-field
          v-model="form.foodLicense"
          label="食品许可证号"
          placeholder="食品经营/生产许可证号"
          input-align="right"
        />
      </van-cell-group>
    </div>

    <!-- 资质附件 -->
    <div class="form-section">
      <div class="form-section-title">
        <span>资质附件</span>
        <span class="section-count">{{ form.certs.length }} 个</span>
      </div>
      <van-cell-group inset>
        <div v-for="(c, idx) in form.certs" :key="idx" class="cert-item">
          <div class="cert-info">
            <van-icon name="description" size="20" color="#1989fa" />
            <div class="cert-text">
              <div class="cert-name">{{ c.name }}</div>
              <div class="cert-meta">{{ c.fileName }}</div>
              <div class="cert-date">{{ c.uploadDate }}</div>
            </div>
          </div>
          <van-icon name="cross" color="#ee0a24" size="18" @click="removeCert(idx)" />
        </div>
        <div v-if="!form.certs.length" class="cert-empty">
          暂无资质附件
        </div>
      </van-cell-group>

      <div class="upload-section">
        <div class="upload-label">添加资质</div>
        <van-cell-group inset>
          <van-field
            v-model="newCert.name"
            label="资质名称"
            placeholder="如：营业执照 / 食品经营许可证"
            input-align="right"
          />
        </van-cell-group>
        <div class="upload-row">
          <van-uploader
            v-model="fileList"
            :max-count="1"
            :after-read="onAfterRead"
            :preview-full-image="false"
          />
          <van-button
            v-if="newCert.name || newCert.fileName"
            size="small"
            type="primary"
            plain
            @click="addCert"
          >
            添加到列表
          </van-button>
        </div>
      </div>
    </div>

    <!-- 供货价格本 -->
    <div v-if="isEdit" class="form-section">
      <div class="form-section-title">
        <span>供货价格本</span>
        <span class="section-count">{{ supplierPriceList.length }} 项</span>
      </div>
      <van-cell-group inset>
        <div v-for="(p, idx) in supplierPriceList" :key="idx" class="price-item">
          <div class="price-info">
            <div class="price-name">{{ getProductName(p.productId) }}</div>
            <div class="price-meta">
              最低起订 {{ p.minQty }} · 更新于 {{ p.lastUpdate }}
            </div>
          </div>
          <div class="price-value">{{ formatMoney(p.price) }}</div>
        </div>
        <div v-if="!supplierPriceList.length" class="cert-empty">
          暂无供货价格记录
        </div>
      </van-cell-group>
    </div>

    <!-- 保存按钮 -->
    <div class="save-bar">
      <van-button block type="primary" round @click="onSave">保存</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney, formatDate } from '@/utils/index.js'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const dataStore = useDataStore()

const id = computed(() => route.params.id ? Number(route.params.id) : null)
const isEdit = computed(() => !!id.value)

const defaultForm = () => ({
  name: '',
  code: '',
  contact: '',
  phone: '',
  address: '',
  businessLicense: '',
  foodLicense: '',
  certs: []
})
const form = reactive(defaultForm())

// 新资质
const newCert = reactive({ name: '', fileName: '' })
const fileList = ref([])

// 加载供应商
function loadSupplier() {
  if (!id.value) return
  const s = dataStore.suppliers.find(x => x.id === id.value)
  if (s) {
    Object.assign(form, {
      name: s.name || '',
      code: s.code || '',
      contact: s.contact || '',
      phone: s.phone || '',
      address: s.address || '',
      businessLicense: s.businessLicense || '',
      foodLicense: s.foodLicense || '',
      certs: Array.isArray(s.certs) ? [...s.certs] : []
    })
  } else {
    showToast('供应商不存在')
    router.replace('/purchase/supplier')
  }
}
loadSupplier()

// 该供应商的供货价格
const supplierPriceList = computed(() =>
  dataStore.supplierPrices.filter(p => p.supplierId === id.value)
)

function getProductName(productId) {
  const p = dataStore.products.find(x => x.id === productId)
  return p ? `${p.name} (${p.spec})` : `商品#${productId}`
}

function onAfterRead(file) {
  newCert.fileName = file.name || `资质${form.certs.length + 1}.pdf`
}

function addCert() {
  if (!newCert.name) {
    showToast('请输入资质名称')
    return
  }
  if (!newCert.fileName) {
    showToast('请上传资质文件')
    return
  }
  form.certs.push({
    name: newCert.name,
    fileName: newCert.fileName,
    uploadDate: dayjs().format('YYYY-MM-DD')
  })
  newCert.name = ''
  newCert.fileName = ''
  fileList.value = []
  showSuccessToast('已添加资质')
}

function removeCert(idx) {
  form.certs.splice(idx, 1)
}

function onSave() {
  if (!form.name) {
    showToast('请输入供应商名称')
    return
  }
  const payload = {
    name: form.name,
    code: form.code,
    contact: form.contact,
    phone: form.phone,
    address: form.address,
    businessLicense: form.businessLicense,
    foodLicense: form.foodLicense,
    certs: form.certs
  }
  if (isEdit.value) {
    dataStore.updateSupplier(id.value, payload)
    showSuccessToast('保存成功')
    router.replace('/purchase/supplier')
  } else {
    dataStore.addSupplier(payload)
    showSuccessToast('新增成功')
    router.replace('/purchase/supplier')
  }
}
</script>

<style scoped>
.supplier-edit-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.form-section {
  margin-top: 12px;
}
.form-section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.section-count {
  font-size: 12px;
  color: #969799;
  font-weight: normal;
}

/* 资质 */
.cert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f7f8fa;
}
.cert-item:last-child { border-bottom: none; }
.cert-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.cert-text {
  flex: 1;
}
.cert-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.cert-meta {
  font-size: 12px;
  color: #1989fa;
  margin-top: 2px;
}
.cert-date {
  font-size: 11px;
  color: #969799;
  margin-top: 2px;
}
.cert-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: #969799;
}

/* 上传 */
.upload-section {
  margin-top: 8px;
  padding: 0 4px;
}
.upload-label {
  font-size: 13px;
  color: #646566;
  padding: 8px 16px;
}
.upload-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  margin: 0 16px;
  border-radius: 8px;
}

/* 价格本 */
.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f7f8fa;
}
.price-item:last-child { border-bottom: none; }
.price-info { flex: 1; }
.price-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.price-meta {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}
.price-value {
  font-size: 16px;
  font-weight: 700;
  color: #ee0a24;
}

.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px 16px;
  background: #fff;
  border-top: 1px solid #ebedf0;
  z-index: 100;
}
</style>

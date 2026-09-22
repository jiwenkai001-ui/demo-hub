<template>
  <div class="price-system-page">
    <van-tabs v-model:active="activeTab" sticky>
      <!-- 客户分级定价 -->
      <van-tab title="客户分级定价">
        <van-cell-group inset title="分级折扣（可编辑）">
          <van-cell>
            <template #title>
              <div class="grade-row">
                <van-tag type="danger" plain size="medium">一级</van-tag>
                <span class="grade-label">折扣</span>
                <van-stepper v-model="gradeRatio1" :min="1" :max="100" :step="1" integer />
                <span class="grade-pct">%</span>
              </div>
            </template>
            <template #value>
              <span class="grade-hint">约 {{ gradeRatio1 }}折</span>
            </template>
          </van-cell>
          <van-cell>
            <template #title>
              <div class="grade-row">
                <van-tag type="warning" plain size="medium">二级</van-tag>
                <span class="grade-label">折扣</span>
                <van-stepper v-model="gradeRatio2" :min="1" :max="100" :step="1" integer />
                <span class="grade-pct">%</span>
              </div>
            </template>
            <template #value>
              <span class="grade-hint">约 {{ gradeRatio2 }}折</span>
            </template>
          </van-cell>
          <van-cell>
            <template #title>
              <div class="grade-row">
                <van-tag type="primary" plain size="medium">三级</van-tag>
                <span class="grade-label">折扣</span>
                <van-stepper v-model="gradeRatio3" :min="1" :max="100" :step="1" integer />
                <span class="grade-pct">%</span>
              </div>
            </template>
            <template #value>
              <span class="grade-hint">零售价</span>
            </template>
          </van-cell>
        </van-cell-group>

        <van-cell-group inset title="商品价格对照">
          <van-cell v-for="p in products" :key="p.id">
            <template #title>
              <div class="price-row">
                <div class="price-name">{{ p.name }}</div>
                <div class="price-spec">{{ p.spec }} · 零售 {{ formatMoney(p.retailPrice) }}</div>
                <div class="price-grades">
                  <van-tag type="danger" plain size="mini">
                    一级 {{ formatMoney(+(p.retailPrice * gradeRatio1 / 100).toFixed(2)) }}
                  </van-tag>
                  <van-tag type="warning" plain size="mini">
                    二级 {{ formatMoney(+(p.retailPrice * gradeRatio2 / 100).toFixed(2)) }}
                  </van-tag>
                  <van-tag type="primary" plain size="mini">
                    三级 {{ formatMoney(+(p.retailPrice * gradeRatio3 / 100).toFixed(2)) }}
                  </van-tag>
                </div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-tab>

      <!-- 一客一价 -->
      <van-tab title="一客一价">
        <van-cell-group inset>
          <van-cell title="选择客户" is-link :value="customerLabel" @click="showCustomerPicker = true" />
        </van-cell-group>

        <van-cell-group
          :title="selectedCustomer ? `${selectedCustomer.name} 特价商品` : '商品特价列表'"
          v-if="selectedCustomer"
        >
          <van-cell v-for="p in products" :key="p.id">
            <template #title>
              <div class="price-row">
                <div class="price-name">
                  {{ p.name }}
                  <van-tag v-if="getCustomPrice(p)" type="danger" size="mini">特价</van-tag>
                </div>
                <div class="price-spec">{{ p.spec }} · 零售 {{ formatMoney(p.retailPrice) }}</div>
              </div>
            </template>
            <template #value>
              <div class="cust-price-cell">
                <div :class="['cust-price', { 'cust-special': getCustomPrice(p) }]">
                  {{ getCustomPrice(p) ? formatMoney(getCustomPrice(p)) : formatMoney(p.retailPrice) }}
                </div>
                <van-button size="mini" type="primary" plain @click="onSetSpecialPrice(p)">
                  {{ getCustomPrice(p) ? '修改特价' : '设置特价' }}
                </van-button>
              </div>
            </template>
          </van-cell>
        </van-cell-group>

        <van-empty v-else description="请先选择客户" :image-size="80" />
      </van-tab>
    </van-tabs>

    <div class="price-note">
      <van-icon name="info-o" />
      <span>支持多套价格体系，满足不同客户差异化定价需求</span>
    </div>

    <!-- 客户 picker -->
    <van-popup v-model:show="showCustomerPicker" position="bottom" round teleport="body">
      <van-picker
        :columns="customerColumns"
        title="选择客户"
        @confirm="onCustomerConfirm"
        @cancel="showCustomerPicker = false"
      />
    </van-popup>

    <!-- 设置特价 -->
    <van-popup v-model:show="showPriceInput" position="center" round teleport="body" :style="{ width: '82%' }">
      <div class="price-input-wrap" v-if="priceEditProduct">
        <div class="price-input-title">{{ priceEditProduct.name }} 特价</div>
        <div class="price-input-meta">零售价: {{ formatMoney(priceEditProduct.retailPrice) }}</div>
        <van-field
          v-model="priceInput"
          type="number"
          label="特价金额"
          placeholder="请输入特价金额"
          clearable
        />
        <div class="price-input-actions">
          <van-button block plain @click="onClearSpecial">清除特价</van-button>
          <van-button block type="primary" @click="onSavePrice">保存</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney } from '@/utils/index.js'

const dataStore = useDataStore()

const activeTab = ref(0)
const products = computed(() => dataStore.products.filter(p => p.status === 1))

// 分级定价
const gradeRatio1 = ref(88)
const gradeRatio2 = ref(95)
const gradeRatio3 = ref(100)

// 一客一价
const showCustomerPicker = ref(false)
const selectedCustomer = ref(null)
const customerColumns = computed(() =>
  dataStore.customers.map(c => ({ text: `${c.name} (${c.code})`, value: c.id }))
)
const customerLabel = computed(() => selectedCustomer.value ? selectedCustomer.value.name : '请选择')
function onCustomerConfirm({ selectedValues }) {
  const id = selectedValues[0]
  selectedCustomer.value = dataStore.customers.find(c => c.id === id) || null
  showCustomerPicker.value = false
}

// 特价存储 customPrices[customerId][productId] = price
const customPrices = reactive({})
function getCustomPrice(p) {
  if (!selectedCustomer.value) return null
  const map = customPrices[selectedCustomer.value.id]
  if (!map) return null
  const v = map[p.id]
  return (v === undefined || v === null || v === '') ? null : Number(v)
}

// 设置特价
const showPriceInput = ref(false)
const priceEditProduct = ref(null)
const priceInput = ref('')
function onSetSpecialPrice(p) {
  priceEditProduct.value = p
  const cur = getCustomPrice(p)
  priceInput.value = cur !== null ? String(cur) : ''
  showPriceInput.value = true
}
function onSavePrice() {
  if (!priceEditProduct.value || !selectedCustomer.value) return
  const val = Number(priceInput.value)
  if (!priceInput.value || isNaN(val) || val <= 0) {
    showToast('请输入有效的特价金额')
    return
  }
  const cid = selectedCustomer.value.id
  if (!customPrices[cid]) customPrices[cid] = {}
  customPrices[cid][priceEditProduct.value.id] = val
  showPriceInput.value = false
  showSuccessToast('特价已保存')
}
function onClearSpecial() {
  if (!priceEditProduct.value || !selectedCustomer.value) {
    showPriceInput.value = false
    return
  }
  const cid = selectedCustomer.value.id
  if (customPrices[cid]) {
    delete customPrices[cid][priceEditProduct.value.id]
  }
  showPriceInput.value = false
  showSuccessToast('已清除特价')
}
</script>

<style scoped>
.price-system-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

/* 分级定价 */
.grade-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.grade-label { font-size: 13px; color: #646566; }
.grade-pct { font-size: 13px; color: #646566; }
.grade-hint { font-size: 12px; color: #969799; }

/* 商品价格 */
.price-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.price-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 6px;
}
.price-spec { font-size: 12px; color: #969799; }
.price-grades {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

/* 一客一价 */
.cust-price-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.cust-price {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.cust-special { color: #ee0a24; }

/* 提示 */
.price-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  font-size: 12px;
  color: #969799;
}

/* 特价输入 */
.price-input-wrap {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}
.price-input-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
}
.price-input-meta {
  text-align: center;
  font-size: 12px;
  color: #969799;
  margin-bottom: 12px;
}
.price-input-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>

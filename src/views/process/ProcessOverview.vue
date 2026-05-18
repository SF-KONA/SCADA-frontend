<template>
  <div class="process-container">
    <!-- 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-label">PROCESS OVERVIEW</p>
        <h1 class="page-title">공정 현황</h1>
        <p class="page-sub">카드 선택 시 상세 관리 페이지로 이동</p>
      </div>
      <div class="realtime-badge">
        <span class="realtime-dot"></span>
        실시간 · {{ updatedAt }}
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-area">
      <div class="loading-spinner"></div>
    </div>

    <!-- 카드 그리드 -->
    <div v-else class="card-grid">
      <div
        v-for="item in items"
        :key="item.stepNo"
        class="process-card"
        :class="{ 'card-critical': item.status === 'CRITICAL', 'card-warning': item.status === 'WARNING' }"
        @click="handleCardClick(item)"
      >
        <!-- 상단 -->
        <div class="card-top">
          <div class="card-icon" :class="'icon-' + item.status.toLowerCase()">
            <i :class="stepIcon(item.stepNo)"></i>
          </div>
          <div>
            <span class="step-label">STEP {{ item.stepNo }}</span>
            <p class="process-name">{{ item.processName }}</p>
          </div>
        </div>

        <!-- 설비 정보 -->
        <div v-if="item.hasEquipment" class="card-stats">
          <div class="stat-row">
            <span class="stat-item">설비 <b>{{ item.totalEquipment }}</b></span>
            <span class="stat-item">가동 <b>{{ item.runningEquipment }}</b></span>
            <span class="stat-rate">{{ item.utilizationRate }}%</span>
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="'bar-' + item.status.toLowerCase()"
              :style="{ width: item.utilizationRate + '%' }"
            ></div>
          </div>
        </div>

        <!-- 상태 뱃지 -->
        <div class="card-status">
          <span class="status-dot" :class="'dot-' + item.status.toLowerCase()"></span>
          <span class="status-badge" :class="'badge-' + item.status.toLowerCase()">
            {{ item.statusLabel }}
          </span>
        </div>

        <!-- 협력사 안내 -->
        <p v-if="!item.hasEquipment" class="partner-hint">
          협력사 위탁 · 선택 시 현황 팝업
        </p>

        <!-- 알람 -->
        <div v-if="item.alerts && item.alerts.length > 0" class="card-alerts">
          <p
            v-for="alert in item.alerts.slice(0, 2)"
            :key="alert.alarmId"
            class="alert-msg"
            :class="alert.severity === 'ERR' ? 'alert-err' : 'alert-warn'"
          >
            {{ alert.message }}
          </p>
          <span class="alert-time">{{ formatAlertTimes(item.alerts) }}</span>
        </div>
      </div>
    </div>

    <!-- 범례 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot dot-normal"></span>
        정상 — 모든 변수 정상 범위
      </div>
      <div class="legend-item">
        <span class="legend-dot dot-warning"></span>
        경고 — 임계치 접근, 원인 표시
      </div>
      <div class="legend-item">
        <span class="legend-dot dot-critical"></span>
        이상 — 임계치 초과, 즉시 조치
      </div>
    </div>

    <!-- 협력사 모달 -->
    <div v-if="showPartnerModal" class="modal-backdrop" @click.self="showPartnerModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">{{ partnerData?.processName }} — 협력사 현황</h2>
          <button class="modal-close" @click="showPartnerModal = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div v-if="partnerLoading" class="modal-loading">
          <div class="loading-spinner"></div>
        </div>

        <div v-else-if="partnerData" class="modal-body">
          <div class="info-block">
            <p class="info-label">업체 정보</p>
            <p class="info-main">{{ partnerData.partner.companyName }}</p>
            <p class="info-sub">{{ partnerData.partner.productName }}</p>
            <p class="info-sub">담당: {{ partnerData.partner.managerName }} · {{ partnerData.partner.contactTel }}</p>
          </div>

          <div class="info-block">
            <p class="info-label">재고 현황</p>
            <div class="info-row">
              <span class="info-sub">
                {{ partnerData.inventory.stockQty.toLocaleString() }} {{ partnerData.inventory.stockUnit }}
                <span class="info-dim">(안전재고: {{ partnerData.inventory.safetyStock?.toLocaleString() }})</span>
              </span>
              <span class="stock-badge" :class="'stock-' + partnerData.inventory.stockStatus.toLowerCase()">
                {{ partnerData.inventory.stockStatusLabel }}
              </span>
            </div>
          </div>

          <div class="info-block">
            <p class="info-label">납기 현황</p>
            <div class="info-row">
              <span class="info-sub">납기일: {{ partnerData.delivery.deadline }}</span>
              <span
                class="stock-badge"
                :class="partnerData.delivery.deliveryStatus === 'ON_TIME' ? 'stock-sufficient' : 'stock-critical'"
              >
                {{ partnerData.delivery.deliveryStatusLabel }}
              </span>
            </div>
            <p v-if="partnerData.delivery.delayReason" class="delay-reason">
              사유: {{ partnerData.delivery.delayReason }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProcessList, getPartnerDetail } from '@/api/processApi.js'

const router = useRouter()

const items = ref([])
const updatedAt = ref('')
const loading = ref(true)

const showPartnerModal = ref(false)
const partnerData = ref(null)
const partnerLoading = ref(false)

const fetchProcessList = async () => {
  try {
    loading.value = true
    const res = await getProcessList()
    items.value = res.data.data.items
    updatedAt.value = new Date(res.data.data.updatedAt).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }) + ' KST'
  } catch (e) {
    console.error('공정 목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

const handleCardClick = async (item) => {
  if (item.hasEquipment) {
    router.push(`/process/${item.stepNo}/equipment`)
  } else {
    await fetchPartner(item.stepNo)
  }
}

const fetchPartner = async (stepNo) => {
  try {
    partnerLoading.value = true
    showPartnerModal.value = true
    const res = await getPartnerDetail(stepNo)
    partnerData.value = res.data.data
  } catch (e) {
    console.error('협력사 조회 실패', e)
  } finally {
    partnerLoading.value = false
  }
}

const formatAlertTimes = (alerts) => {
  return alerts.slice(0, 2).map((a) => {
    const d = new Date(a.occurredAt)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }).join(' · ')
}

const stepIcon = (stepNo) => {
  const icons = {
    '01': 'fa-solid fa-circle-dot',
    '02': 'fa-solid fa-fire',
    '03': 'fa-solid fa-camera',
    '04': 'fa-solid fa-scissors',
    '05': 'fa-solid fa-layer-group',
    '06': 'fa-solid fa-link',
    '07': 'fa-solid fa-vial',
    '08': 'fa-solid fa-box',
  }
  return icons[stepNo] || 'fa-solid fa-gear'
}

onMounted(fetchProcessList)
</script>

<style scoped>
* { box-sizing: border-box; }

.process-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}
.page-label {
  font-size: 10px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 2px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a1a1a;
}
.page-sub {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.realtime-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}
.realtime-dot {
  width: 7px;
  height: 7px;
  background: #15803d;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.loading-area {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e8e8e4;
  border-top-color: #15803d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.process-card {
  background: #fff;
  border: 1.5px solid #e8e8e4;
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.process-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border-color: #d0d0cc;
  transform: translateY(-2px);
}
.card-critical { border-left: 4px solid #dc2626; }
.card-warning  { border-left: 4px solid #f59e0b; }

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.icon-normal   { background: #f0fdf4; color: #15803d; }
.icon-warning  { background: #fffbeb; color: #d97706; }
.icon-critical { background: #fef2f2; color: #dc2626; }

.step-label {
  font-size: 10px;
  font-weight: 700;
  color: #aaa;
  letter-spacing: 0.04em;
}
.process-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 1px;
}

.card-stats { margin-bottom: 14px; }
.stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.stat-item {
  font-size: 12px;
  color: #888;
}
.stat-item b { color: #1a1a1a; }
.stat-rate {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
  margin-left: auto;
}

.bar-track {
  width: 100%;
  height: 4px;
  background: #f0f0ea;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}
.bar-normal   { background: #15803d; }
.bar-warning  { background: #f59e0b; }
.bar-critical { background: #dc2626; }

.card-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-normal   { background: #15803d; }
.dot-warning  { background: #f59e0b; }
.dot-critical { background: #dc2626; }

.status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
}
.badge-normal   { background: #f0fdf4; color: #15803d; }
.badge-warning  { background: #fffbeb; color: #d97706; }
.badge-critical { background: #fef2f2; color: #dc2626; }

.partner-hint {
  font-size: 11px;
  color: #bbb;
}

.card-alerts {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0ea;
}
.alert-msg {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
}
.alert-err  { color: #dc2626; }
.alert-warn { color: #d97706; }
.alert-time {
  font-size: 10px;
  color: #bbb;
  margin-top: 4px;
  display: block;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin-top: 36px;
  padding: 16px;
  background: #fafaf8;
  border: 1px solid #e8e8e4;
  border-radius: 12px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #777;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  background: #fff;
  border-radius: 16px;
  width: 460px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}
.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f7f7f3;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover { background: #eee; color: #333; }
.modal-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.info-block {
  background: #fafaf8;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 14px 16px;
}
.info-label {
  font-size: 10px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.info-main {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}
.info-sub {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
.info-dim { color: #bbb; }
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stock-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.stock-sufficient { background: #f0fdf4; color: #15803d; }
.stock-warning    { background: #fffbeb; color: #d97706; }
.stock-critical   { background: #fef2f2; color: #dc2626; }
.delay-reason {
  font-size: 11px;
  color: #dc2626;
  margin-top: 6px;
}

@keyframes spin  { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
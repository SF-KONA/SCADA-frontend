<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAlarmStore } from '@/stores/alarmStore'
import { useAuthStore } from '@/stores/auth'

const store    = useAlarmStore()
const auth     = useAuthStore()

// ── 로컬 상태 ──────────────────────────────────
const doneComment   = ref('')
const dateFrom      = ref('')
const dateTo        = ref('')

// ── 권한 ───────────────────────────────────────
const canControl = computed(() => {
  const role = auth.userRole
  return role === 'ADMIN' || role === 'LINE_MGR'
})

// ── 공정 / 상태 옵션 ───────────────────────────
const STEPS = [
  { value: '02', label: '산화' },
  { value: '03', label: '포토' },
  { value: '04', label: '식각' },
  { value: '05', label: '박막증착' },
  { value: '06', label: '금속배선' },
  { value: '07', label: '테스트' },
]

const STATUS_OPTIONS = [
  { value: 'NEW',         label: '미확인' },
  { value: 'ACK',         label: '확인' },
  { value: 'IN_PROGRESS', label: '조치 중' },
  { value: 'DONE',        label: '완료' },
]

// ── 페이지네이션 ───────────────────────────────
const visiblePages = computed(() => {
  const cur   = store.currentPage
  const tot   = store.totalPages
  const pages = []
  const start = Math.max(1, cur - 2)
  const end   = Math.min(tot, cur + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// ── 상세 패널 계산 ─────────────────────────────
const overLimitPct = computed(() => {
  const d = store.alarmDetail
  if (!d || d.triggeredValue == null || d.normalMax == null) return null
  if (d.triggeredValue <= d.normalMax) return null
  return Math.round((d.triggeredValue - d.normalMax) / d.normalMax * 100)
})

const normalPct = computed(() => {
  const d = store.alarmDetail
  if (!d || d.normalMax == null || d.triggeredValue == null) return 80
  const max = Math.max(d.triggeredValue, d.normalMax) * 1.1
  return Math.round((d.normalMax / max) * 100)
})

// ── 필터 핸들러 ────────────────────────────────
function toggleSeverity(sev) {
  const list = [...store.filters.severity]
  const idx  = list.indexOf(sev)
  idx >= 0 ? list.splice(idx, 1) : list.push(sev)
  store.applyFilters({ severity: list })
}

function toggleSeverityAll() {
  store.applyFilters({ severity: [] })
}

function toggleStep(stepNo) {
  store.applyFilters({ stepNo: store.filters.stepNo === stepNo ? null : stepNo })
}

function toggleStatus(st) {
  const list = [...store.filters.status]
  const idx  = list.indexOf(st)
  idx >= 0 ? list.splice(idx, 1) : list.push(st)
  store.applyFilters({ status: list })
}

function applyDateFilter() {
  store.applyFilters({
    from: dateFrom.value ? dateFrom.value + 'T00:00:00' : null,
    to:   dateTo.value   ? dateTo.value   + 'T23:59:59' : null,
  })
}

// ── 포맷 헬퍼 ─────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function formatFull(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function severityClass(sev) {
  return { ERR: 'severity-err', WARN: 'severity-warn', INFO: 'severity-info' }[sev] ?? ''
}
function statusClass(st) {
  return { NEW: 'status-new', ACK: 'status-ack', IN_PROGRESS: 'status-progress', DONE: 'status-done' }[st] ?? ''
}
function statusLabel(st) {
  return { NEW: '미확인', ACK: '확인', IN_PROGRESS: '조치 중', DONE: '완료' }[st] ?? st
}
function locationLabel(alarm) {
  if (alarm.sourceType === 'ENV') return alarm.zoneCode ?? '—'
  return alarm.processName ?? '—'
}

// ── 상세 열릴 때 comment 초기화 ─────────────────
watch(() => store.alarmDetail?.alarmId, () => { doneComment.value = '' })

// ── 마운트 ─────────────────────────────────────
onMounted(async () => {
  await store.loadAlarms()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- ══ 헤더 + 필터 ══════════════════════════ -->
    <div class="flex-shrink-0 mb-4 space-y-3">

      <!-- 상단: 제목 + 심각도 뱃지 + 날짜 -->
      <div class="flex items-center gap-3 flex-wrap">
        <h1 class="text-xl font-bold text-slate-800 tracking-tight">알람 관리</h1>

        <!-- 심각도 뱃지 -->
        <button
            class="badge-btn"
            :class="store.filters.severity.length === 0 ? 'badge-active' : 'badge-inactive'"
            @click="toggleSeverityAll"
        >전체 {{ store.total.toLocaleString() }}</button>

        <button
            class="badge-btn badge-err-btn"
            :class="store.filters.severity.includes('ERR') ? 'ring-2 ring-red-400' : ''"
            @click="toggleSeverity('ERR')"
        >ERR</button>

        <button
            class="badge-btn badge-warn-btn"
            :class="store.filters.severity.includes('WARN') ? 'ring-2 ring-amber-400' : ''"
            @click="toggleSeverity('WARN')"
        >WARN</button>

        <button
            class="badge-btn badge-info-btn"
            :class="store.filters.severity.includes('INFO') ? 'ring-2 ring-blue-400' : ''"
            @click="toggleSeverity('INFO')"
        >INFO</button>

        <!-- 날짜 범위 -->
        <div class="ml-auto flex items-center gap-2">
          <input v-model="dateFrom" type="date" class="input-base" @change="applyDateFilter" />
          <span class="text-slate-400 text-sm">—</span>
          <input v-model="dateTo" type="date" class="input-base" @change="applyDateFilter" />
        </div>
      </div>

      <!-- 공정 + 상태 필터 칩 -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-slate-400 text-xs font-medium">공정</span>
        <button
            v-for="s in STEPS" :key="s.value"
            class="chip"
            :class="store.filters.stepNo === s.value ? 'chip-active' : ''"
            @click="toggleStep(s.value)"
        >{{ s.label }}</button>

        <span class="mx-1 text-slate-300">|</span>
        <span class="text-slate-400 text-xs font-medium">상태</span>
        <button
            v-for="st in STATUS_OPTIONS" :key="st.value"
            class="chip"
            :class="store.filters.status.includes(st.value) ? 'chip-active' : ''"
            @click="toggleStatus(st.value)"
        >{{ st.label }}</button>

        <button
            v-if="store.hasActiveFilters"
            class="ml-auto text-xs text-slate-400 hover:text-slate-700 transition-colors"
            @click="store.resetFilters()"
        >필터 초기화</button>
      </div>
    </div>

    <!-- ══ 메인: 목록 + 상세 패널 ══════════════════ -->
    <div class="flex flex-1 min-h-0 gap-4">

      <!-- 알람 목록 -->
      <div
          class="flex flex-col min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300"
          :class="store.selectedAlarm ? 'w-[58%]' : 'w-full'"
      >
        <!-- 테이블 헤더 -->
        <div class="grid grid-cols-[150px_65px_1fr_110px_1fr_95px] gap-2 px-5 py-3 text-[11px] text-slate-400 font-semibold border-b border-gray-100 flex-shrink-0 bg-gray-50">
          <span>시각</span>
          <span>심각도</span>
          <span>설비명</span>
          <span>위치</span>
          <span>메시지</span>
          <span>상태</span>
        </div>

        <!-- 로딩 -->
        <div v-if="store.listLoading" class="flex-1 flex items-center justify-center">
          <i class="fa-solid fa-spinner animate-spin text-xl text-[#15803D]"></i>
        </div>

        <!-- 에러 -->
        <div v-else-if="store.listError" class="flex-1 flex items-center justify-center">
          <p class="text-red-400 text-sm">데이터를 불러올 수 없습니다. ({{ store.listError }})</p>
        </div>

        <!-- 빈 목록 -->
        <div v-else-if="store.alarms.length === 0" class="flex-1 flex items-center justify-center">
          <p class="text-slate-400 text-sm">조건에 맞는 알람이 없습니다.</p>
        </div>

        <!-- 목록 -->
        <div v-else class="flex-1 overflow-y-auto">
          <div
              v-for="alarm in store.alarms"
              :key="alarm.alarmId"
              class="grid grid-cols-[150px_65px_1fr_110px_1fr_95px] gap-2 px-5 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{
                            'bg-blue-50/50 border-l-2 border-l-blue-500': store.selectedAlarm?.alarmId === alarm.alarmId,
                            'opacity-60': alarm.status === 'DONE',
                        }"
              @click="store.selectAlarm(alarm)"
          >
            <!-- 시각 -->
            <div class="flex flex-col justify-center">
              <span class="text-slate-700 text-xs font-mono tabular-nums">{{ formatDate(alarm.occurredAt) }}</span>
              <span class="text-slate-400 text-xs font-mono tabular-nums">{{ formatTime(alarm.occurredAt) }}</span>
            </div>

            <!-- 심각도 -->
            <div class="flex items-center">
              <span class="severity-badge" :class="severityClass(alarm.severity)">{{ alarm.severity }}</span>
            </div>

            <!-- 설비명 -->
            <div class="flex flex-col justify-center min-w-0">
              <span class="text-slate-700 text-sm font-medium truncate">{{ alarm.equipmentName || alarm.zoneCode || '—' }}</span>
              <span class="text-slate-400 text-xs truncate">{{ alarm.equipmentId || alarm.sourceType }}</span>
            </div>

            <!-- 위치 -->
            <div class="flex items-center">
              <span class="text-slate-500 text-xs truncate">{{ locationLabel(alarm) }}</span>
            </div>

            <!-- 메시지 -->
            <div class="flex items-center min-w-0">
                            <span class="text-slate-600 text-xs truncate">
                                {{ alarm.message }}
                                <span
                                    v-if="alarm.occurrenceCount > 1"
                                    class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-[10px] bg-orange-100 text-orange-600 font-bold"
                                >×{{ alarm.occurrenceCount }}</span>
                            </span>
            </div>

            <!-- 상태 -->
            <div class="flex items-center">
              <span class="status-badge" :class="statusClass(alarm.status)">{{ statusLabel(alarm.status) }}</span>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div class="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <span class="text-slate-400 text-xs">총 {{ store.total.toLocaleString() }} 건</span>
          <div class="flex items-center gap-1">
            <button class="page-btn" :disabled="store.currentPage <= 1" @click="store.goToPage(1)">«</button>
            <button class="page-btn" :disabled="store.currentPage <= 1" @click="store.goToPage(store.currentPage - 1)">‹</button>
            <button
                v-for="p in visiblePages" :key="p"
                class="page-btn"
                :class="{ 'page-btn-active': p === store.currentPage }"
                @click="store.goToPage(p)"
            >{{ p }}</button>
            <button class="page-btn" :disabled="store.currentPage >= store.totalPages" @click="store.goToPage(store.currentPage + 1)">›</button>
            <button class="page-btn" :disabled="store.currentPage >= store.totalPages" @click="store.goToPage(store.totalPages)">»</button>
          </div>
        </div>
      </div>

      <!-- ══ 상세 패널 ══════════════════════════ -->
      <transition name="slide-in">
        <div
            v-if="store.selectedAlarm"
            class="w-[42%] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <!-- 상세 헤더 -->
          <div class="flex-shrink-0 px-5 py-4 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                                    <span class="severity-badge" :class="severityClass(store.selectedAlarm.severity)">
                                        {{ store.selectedAlarm.severity }}
                                    </span>
                  <span class="text-slate-400 text-xs">비상 알람</span>
                </div>
                <h2 class="text-slate-800 font-bold text-base">
                  {{ store.alarmDetail?.tagName || store.selectedAlarm.message?.substring(0, 24) }}
                </h2>
                <p class="text-slate-400 text-xs mt-0.5">{{ formatFull(store.selectedAlarm.occurredAt) }}</p>
              </div>
              <button class="text-slate-400 hover:text-slate-700 text-xl leading-none" @click="store.closeDetail()">×</button>
            </div>
          </div>

          <!-- 스크롤 영역 -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            <!-- 로딩 -->
            <div v-if="store.detailLoading" class="flex justify-center py-8">
              <i class="fa-solid fa-spinner animate-spin text-lg text-[#15803D]"></i>
            </div>

            <template v-else-if="store.alarmDetail">

              <!-- 측정값 / 한계치 -->
              <div class="detail-card">
                <p class="detail-label">측정값 / 한계치</p>
                <div class="flex items-baseline gap-2 mt-2">
                                    <span class="text-red-500 text-3xl font-bold tabular-nums">
                                        {{ store.alarmDetail.triggeredValue?.toLocaleString() ?? '—' }}
                                    </span>
                  <span class="text-slate-400 text-sm">/ {{ store.alarmDetail.normalMax?.toLocaleString() }} {{ store.alarmDetail.unit }}</span>
                </div>
                <p v-if="overLimitPct !== null" class="text-red-500 text-xs mt-1">+{{ overLimitPct }}% over limit</p>

                <!-- 게이지 -->
                <div v-if="store.alarmDetail.triggeredValue != null && store.alarmDetail.normalMax != null"
                     class="mt-3 relative h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div class="absolute top-0 left-0 h-full bg-green-400/60" :style="{ width: normalPct + '%' }"></div>
                  <div class="absolute top-0 h-full bg-red-500" :style="{ left: normalPct + '%', width: Math.min(100 - normalPct, 100) + '%' }"></div>
                </div>
                <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0</span>
                  <span>한계 {{ store.alarmDetail.normalMax?.toLocaleString() }}</span>
                  <span>{{ store.alarmDetail.triggeredValue?.toLocaleString() }}</span>
                </div>
              </div>

              <!-- 반복 발생 -->
              <div class="detail-card">
                <p class="detail-label">반복 발생</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-3xl font-bold text-orange-500 tabular-nums">{{ store.alarmDetail.occurrenceCount }}</span>
                  <div>
                    <p class="text-slate-600 text-sm">동일 알람 {{ store.alarmDetail.occurrenceCount }}회 반복</p>
                    <p v-if="store.alarmDetail.lastOccurredAt" class="text-slate-400 text-xs">
                      최초 발생: {{ formatTime(store.alarmDetail.occurredAt) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 처리 이력 -->
              <div class="detail-card">
                <p class="detail-label mb-3">처리 이력</p>
                <div class="space-y-3">
                  <div v-if="store.alarmDetail.ackUserId" class="flex items-start gap-3">
                    <div class="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p class="text-slate-600 text-xs font-medium">확인 (ACK)</p>
                      <p class="text-slate-400 text-xs">{{ store.alarmDetail.ackUserId }} · {{ formatFull(store.alarmDetail.ackAt) }}</p>
                    </div>
                  </div>
                  <div v-if="store.alarmDetail.startUserId" class="flex items-start gap-3">
                    <div class="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p class="text-slate-600 text-xs font-medium">처리 시작</p>
                      <p class="text-slate-400 text-xs">{{ store.alarmDetail.startUserId }} · {{ formatFull(store.alarmDetail.startAt) }}</p>
                    </div>
                  </div>
                  <div v-if="store.alarmDetail.doneUserId" class="flex items-start gap-3">
                    <div class="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p class="text-slate-600 text-xs font-medium">처리 완료</p>
                      <p class="text-slate-400 text-xs">{{ store.alarmDetail.doneUserId }} · {{ formatFull(store.alarmDetail.doneAt) }}</p>
                    </div>
                  </div>
                  <p v-if="!store.alarmDetail.ackUserId && !store.alarmDetail.startUserId && !store.alarmDetail.doneUserId"
                     class="text-slate-400 text-xs">처리 이력 없음</p>
                </div>
              </div>

              <!-- 처리 완료 코멘트 -->
              <div v-if="store.alarmDetail.doneComment" class="detail-card">
                <p class="detail-label">처리 코멘트</p>
                <p class="text-slate-600 text-sm mt-1 leading-relaxed">{{ store.alarmDetail.doneComment }}</p>
              </div>

              <!-- 조치 메모 입력 -->
              <div v-if="store.alarmDetail.status !== 'DONE' && canControl" class="detail-card">
                <p class="detail-label">조치 메모</p>
                <textarea
                    v-model="doneComment"
                    rows="3"
                    maxlength="500"
                    placeholder="조치 내용을 입력하세요..."
                    class="w-full mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:border-[#15803D] transition-colors"
                ></textarea>
                <div class="flex justify-end mt-1">
                  <span class="text-slate-400 text-xs">{{ doneComment.length }}/500</span>
                </div>
              </div>

            </template>
          </div>

          <!-- 액션 버튼 -->
          <div v-if="store.alarmDetail && canControl" class="flex-shrink-0 px-5 pb-5 pt-3 space-y-2 border-t border-gray-100">
            <p v-if="store.actionError" class="text-red-400 text-xs text-center">오류: {{ store.actionError }}</p>

            <!-- NEW → ACK -->
            <button
                v-if="store.alarmDetail.status === 'NEW'"
                class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                :disabled="store.actionLoading"
                @click="store.handleAck(store.alarmDetail.alarmId)"
            >{{ store.actionLoading ? '처리 중...' : '확인 (ACK)' }}</button>

            <!-- ACK → IN_PROGRESS -->
            <button
                v-if="store.alarmDetail.status === 'ACK'"
                class="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 text-sm font-semibold border border-gray-200 transition-colors disabled:opacity-50"
                :disabled="store.actionLoading"
                @click="store.handleStart(store.alarmDetail.alarmId)"
            >{{ store.actionLoading ? '처리 중...' : '조치 시작' }}</button>

            <!-- IN_PROGRESS → DONE -->
            <button
                v-if="store.alarmDetail.status === 'IN_PROGRESS'"
                class="w-full py-3 rounded-xl bg-[#15803D] hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                :disabled="store.actionLoading"
                @click="store.handleDone(store.alarmDetail.alarmId, doneComment)"
            >{{ store.actionLoading ? '처리 중...' : '처리 완료' }}</button>

            <!-- DONE -->
            <div v-if="store.alarmDetail.status === 'DONE'"
                 class="flex items-center justify-center gap-2 py-3 text-green-600 text-sm font-medium">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              처리 완료
            </div>
          </div>

          <!-- 권한 없음 -->
          <div v-else-if="store.alarmDetail && !canControl" class="flex-shrink-0 px-5 pb-5 pt-3 border-t border-gray-100">
            <p class="text-center text-slate-400 text-xs">조회 전용 권한 (WORKER)</p>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.severity-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.severity-err  { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
.severity-warn { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
.severity-info { background: #dbeafe; color: #2563eb; border: 1px solid #bfdbfe; }

.status-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
.status-new      { background: #fee2e2; color: #dc2626; }
.status-ack      { background: #dbeafe; color: #2563eb; }
.status-progress { background: #fef3c7; color: #d97706; }
.status-done     { background: #dcfce7; color: #16a34a; }

.badge-btn { padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; transition: all 0.15s; border: none; cursor: pointer; }
.badge-active   { background: #334155; color: white; }
.badge-inactive { background: #f3f4f6; color: #475569; }
.badge-inactive:hover { background: #e5e7eb; }
.badge-err-btn  { background: #fee2e2; color: #dc2626; }
.badge-err-btn:hover  { background: #fecaca; }
.badge-warn-btn { background: #fef3c7; color: #d97706; }
.badge-warn-btn:hover { background: #fde68a; }
.badge-info-btn { background: #dbeafe; color: #2563eb; }
.badge-info-btn:hover { background: #bfdbfe; }

.chip { padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #64748b; background: #f3f4f6; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.15s; }
.chip:hover { border-color: #94a3b8; color: #334155; }
.chip-active { background: #f0fdf4; border-color: #15803D; color: #15803D; }

.input-base { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 12px; font-size: 14px; color: #475569; outline: none; transition: border-color 0.15s; }
.input-base:focus { border-color: #15803D; }

.detail-card  { background: #f9fafb; border-radius: 12px; padding: 16px; }
.detail-label { color: #94a3b8; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

.page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 12px; color: #64748b; background: transparent; border: none; cursor: pointer; transition: all 0.15s; }
.page-btn:hover { background: #f3f4f6; color: #334155; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-btn-active { background: #15803D; color: white; }
.page-btn-active:hover { background: #166534; }

.slide-in-enter-active, .slide-in-leave-active { transition: all 0.25s ease; }
.slide-in-enter-from { transform: translateX(100%); opacity: 0; }
.slide-in-leave-to   { transform: translateX(100%); opacity: 0; }
</style>
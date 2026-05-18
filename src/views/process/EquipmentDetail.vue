<template>
  <div class="eq-container">
    <!-- 브레드크럼 -->
    <div class="breadcrumb">
      <button class="bread-link" @click="$router.push('/process')">공정</button>
      <i class="fa-solid fa-chevron-right bread-sep"></i>
      <span class="bread-current">STEP {{ stepNo }} : {{ processName }}</span>
    </div>

    <div class="eq-layout">
      <!-- ───── 좌측: 설비 목록 ───── -->
      <div class="eq-sidebar">
        <p class="sidebar-title">설비 선택</p>
        <div
          v-for="eq in equipmentList"
          :key="eq.equipmentId"
          class="eq-item"
          :class="{ active: selectedId === eq.equipmentId }"
          @click="selectEquipment(eq)"
        >
          <i :class="eqIcon(eq.currentStatus)" class="eq-item-icon"></i>
          <span class="eq-item-name">{{ eq.equipmentName }}</span>
          <span class="eq-item-dot" :class="'dot-' + statusClass(eq.currentStatus)"></span>
        </div>

        <!-- 시간 범위 -->
        <div class="period-section">
          <p class="period-label">시간 범위 선택</p>
          <div class="period-btns">
            <button
              v-for="p in ['1h', '24h', '7d']"
              :key="p"
              class="period-btn"
              :class="{ 'period-active': period === p }"
              @click="changePeriod(p)"
            >
              {{ { '1h': '1시간', '24h': '24시간', '7d': '7일' }[p] }}
            </button>
          </div>
        </div>
      </div>

      <!-- ───── 우측: 상세 ───── -->
      <div class="eq-main">
        <div v-if="!selectedId" class="empty-state">
          <p class="empty-text">좌측에서 설비를 선택하세요</p>
        </div>

        <div v-else-if="paramLoading" class="loading-area">
          <div class="loading-spinner"></div>
        </div>

        <template v-else>
          <!-- 설비명 + 상태 -->
          <div class="eq-header">
            <div>
              <p class="eq-title">설비 주요데이터 <span class="eq-title-sub">선택 설비: {{ selectedName }}</span></p>
            </div>
            <div class="eq-header-right">
              <span class="overall-badge" :class="'badge-' + overallStatus.toLowerCase()">
                {{ overallStatusLabel }}
              </span>
            </div>
          </div>

          <!-- 파라미터 카드 그리드 -->
          <div class="param-grid">
            <div
              v-for="(param, idx) in parameters"
              :key="param.paramId"
              class="param-card"
              :class="'param-' + param.paramStatus.toLowerCase()"
            >
              <p class="param-name">{{ param.tagName }}</p>
              <p class="param-value">
                {{ param.latestValue ?? '-' }}
                <span class="param-unit">{{ param.unit }}</span>
              </p>
              <p class="param-range">범위: {{ param.normalMin }}~{{ param.normalMax }}</p>
              <div :ref="el => chartRefs[idx] = el" class="param-chart"></div>
            </div>
          </div>

          <!-- 실시간 수치 패널 -->
          <div class="realtime-panel">
            <p class="section-label">실시간 수치</p>
            <div class="realtime-list">
              <div v-for="param in parameters" :key="'rt-' + param.paramId" class="realtime-item">
                <span class="rt-name">{{ param.tagName }}</span>
                <span class="rt-value" :class="'text-' + param.paramStatus.toLowerCase()">
                  {{ param.latestValue ?? '-' }} {{ param.unit }}
                </span>
                <span class="rt-range">범위: {{ param.normalMin }}~{{ param.normalMax }}</span>
              </div>
            </div>
          </div>

          <!-- 이벤트 로그 -->
          <div class="event-section">
            <p class="section-label">이벤트 로그</p>
            <div class="event-table-wrap">
              <table class="event-table">
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>이벤트</th>
                    <th>상세 내용</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="evt in events" :key="evt.occurredAt + evt.eventType">
                    <td class="evt-time">{{ formatTime(evt.occurredAt) }}</td>
                    <td>
                      <span class="evt-badge" :class="'evt-' + evt.eventType.toLowerCase()">
                        {{ evt.eventLabel }}
                      </span>
                    </td>
                    <td class="evt-msg">{{ evt.message }}</td>
                    <td>
                      <span class="sev-badge" :class="'sev-' + evt.severity.toLowerCase()">
                        {{ evt.severityLabel }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="events.length === 0">
                    <td colspan="4" class="evt-empty">이벤트 없음</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- 페이징 -->
            <div v-if="eventTotalPages > 1" class="pagination">
              <button class="page-btn" :disabled="eventPage === 1" @click="loadEvents(eventPage - 1)">이전</button>
              <span class="page-info">{{ eventPage }} / {{ eventTotalPages }}</span>
              <button class="page-btn" :disabled="eventPage >= eventTotalPages" @click="loadEvents(eventPage + 1)">다음</button>
            </div>
          </div>

          <!-- 발생 알람 -->
          <div class="alarm-section">
            <p class="section-label">발생 상태</p>
            <div v-if="alarms.length === 0" class="alarm-empty">활성 알람 없음</div>
            <div v-for="alarm in alarms" :key="alarm.alarmId" class="alarm-card">
              <div class="alarm-header">
                <span class="alarm-sev" :class="'sev-' + alarm.severity.toLowerCase()">
                  {{ alarm.severity }} {{ alarm.occurrenceCount }}건 발생 중
                </span>
              </div>
              <p class="alarm-msg">{{ alarm.message }}</p>
              <p class="alarm-time">{{ formatTime(alarm.occurredAt) }}</p>
            </div>
          </div>

          <!-- 관리자 의견 추가 -->
          <div class="note-section">
            <button class="note-btn" @click="showNoteInput = !showNoteInput">
              <i class="fa-solid fa-pen-to-square"></i>
              관리자 의견 추가
            </button>
            <div v-if="showNoteInput" class="note-input-wrap">
              <textarea
                v-model="noteText"
                class="note-textarea"
                placeholder="의견을 입력하세요 (최대 500자)"
                maxlength="500"
                rows="3"
              ></textarea>
              <div class="note-actions">
                <span class="note-count">{{ noteText.length }}/500</span>
                <button class="note-submit" :disabled="!noteText.trim()" @click="submitNote">등록</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  getEquipmentList,
  getEquipmentParameters,
  getEquipmentAlarms,
  getEquipmentEvents,
  addEquipmentNote,
} from '@/api/processApi.js'

const route = useRoute()
const stepNo = ref(route.params.stepNo)
const processName = ref('')

const equipmentList = ref([])
const selectedId = ref(null)
const selectedName = ref('')
const period = ref('1h')

const parameters = ref([])
const overallStatus = ref('NORMAL')
const overallStatusLabel = ref('정상')
const paramLoading = ref(false)

const alarms = ref([])
const events = ref([])
const eventPage = ref(1)
const eventTotalPages = ref(1)

const showNoteInput = ref(false)
const chartRefs = ref([])
const noteText = ref('')

onMounted(async () => {
  try {
    const res = await getEquipmentList(stepNo.value)
    processName.value = res.data.processName
    equipmentList.value = res.data.items
    if (equipmentList.value.length > 0) {
      selectEquipment(equipmentList.value[0])
    }
  } catch (e) {
    console.error('설비 목록 조회 실패', e)
  }
})

const selectEquipment = async (eq) => {
  selectedId.value = eq.equipmentId
  selectedName.value = eq.equipmentName
  await loadAll()
}

const changePeriod = async (p) => {
  period.value = p
  await loadParameters()
}

const loadAll = async () => {
  await Promise.all([loadParameters(), loadAlarms(), loadEvents(1)])
}

const loadParameters = async () => {
  try {
    paramLoading.value = true
    const res = await getEquipmentParameters(selectedId.value, period.value)
    parameters.value = res.data.parameters
    overallStatus.value = res.data.overallStatus
    overallStatusLabel.value = res.data.overallStatusLabel
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('파라미터 조회 실패', e)
  } finally {
    paramLoading.value = false
  }
}

const renderCharts = () => {
  parameters.value.forEach((param, idx) => {
    const el = chartRefs.value[idx]
    if (!el || !param.history || param.history.length === 0) return

    const existing = echarts.getInstanceByDom(el)
    if (existing) existing.dispose()

    const chart = echarts.init(el)
    const times = param.history.map(h => {
      const d = new Date(h.measuredAt)
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    })
    const values = param.history.map(h => h.value)

    const lineColor = param.paramStatus === 'CRITICAL' ? '#dc2626'
      : param.paramStatus === 'WARNING' ? '#f59e0b' : '#15803d'

    chart.setOption({
      grid: { top: 8, right: 8, bottom: 20, left: 36 },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: { fontSize: 9, color: '#bbb' },
        axisLine: { lineStyle: { color: '#eee' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 9, color: '#bbb' },
        splitLine: { lineStyle: { color: '#f5f5f0' } },
      },
      series: [{
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: lineColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: lineColor + '30' },
            { offset: 1, color: lineColor + '05' },
          ]),
        },
      }],
      tooltip: {
        trigger: 'axis',
        textStyle: { fontSize: 11 },
      },
    })
  })
}

const loadAlarms = async () => {
  try {
    const res = await getEquipmentAlarms(selectedId.value)
    alarms.value = res.data.items
  } catch (e) {
    console.error('알람 조회 실패', e)
  }
}

const loadEvents = async (page) => {
  try {
    eventPage.value = page
    const res = await getEquipmentEvents(selectedId.value, page, 10)
    events.value = res.data.items
    eventTotalPages.value = res.data.totalPages
  } catch (e) {
    console.error('이벤트 조회 실패', e)
  }
}

const submitNote = async () => {
  try {
    await addEquipmentNote(selectedId.value, noteText.value)
    noteText.value = ''
    showNoteInput.value = false
    alert('의견이 등록되었습니다.')
  } catch (e) {
    console.error('의견 등록 실패', e)
    alert('등록 실패')
  }
}

const formatTime = (dt) => {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const statusClass = (s) => ({ 0: 'normal', 1: 'normal', 2: 'critical', 3: 'warning' }[s] || 'normal')

const eqIcon = (s) => ({
  0: 'fa-solid fa-pause text-gray-400',
  1: 'fa-solid fa-play text-green-600',
  2: 'fa-solid fa-triangle-exclamation text-red-500',
  3: 'fa-solid fa-wrench text-yellow-500',
}[s] || 'fa-solid fa-gear text-gray-400')
</script>

<style scoped>
* { box-sizing: border-box; }

.eq-container { max-width: 1400px; margin: 0 auto; }

/* 브레드크럼 */
.breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.bread-link { background: none; border: none; color: #15803d; font-size: 13px; font-weight: 600; cursor: pointer; }
.bread-link:hover { text-decoration: underline; }
.bread-sep { font-size: 10px; color: #ccc; }
.bread-current { font-size: 13px; color: #888; }

/* 레이아웃 */
.eq-layout { display: flex; gap: 20px; height: calc(100vh - 180px); }

/* 사이드바 */
.eq-sidebar {
  width: 200px; flex-shrink: 0;
  background: #fff; border: 1px solid #e8e8e4; border-radius: 14px;
  padding: 16px 12px; overflow-y: auto;
  display: flex; flex-direction: column;
}
.sidebar-title { font-size: 10px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; padding: 0 4px; }
.eq-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 8px; border-radius: 8px; cursor: pointer;
  transition: background 0.15s; margin-bottom: 2px; border: 1px solid transparent;
}
.eq-item:hover { background: #f7f7f3; }
.eq-item.active { background: #f0fdf4; border-color: #bbf7d0; }
.eq-item-icon { font-size: 13px; width: 18px; text-align: center; }
.eq-item-name { font-size: 12px; color: #333; flex: 1; font-weight: 500; }
.eq-item-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-normal { background: #15803d; }
.dot-warning { background: #f59e0b; }
.dot-critical { background: #dc2626; }

.period-section { margin-top: auto; padding-top: 16px; border-top: 1px solid #eee; }
.period-label { font-size: 10px; color: #aaa; font-weight: 600; margin-bottom: 8px; }
.period-btns { display: flex; gap: 4px; }
.period-btn {
  flex: 1; padding: 6px 0; border: 1px solid #e8e8e4; background: #fff;
  border-radius: 6px; font-size: 11px; color: #888; cursor: pointer; text-align: center;
  transition: all 0.15s;
}
.period-btn:hover { border-color: #15803d; color: #15803d; }
.period-active { background: #15803d; color: #fff; border-color: #15803d; }

/* 메인 */
.eq-main {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 20px;
}

.empty-state { display: flex; align-items: center; justify-content: center; height: 100%; }
.empty-text { font-size: 14px; color: #bbb; }
.loading-area { display: flex; justify-content: center; padding: 80px 0; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid #e8e8e4; border-top-color: #15803d; border-radius: 50%; animation: spin 0.8s linear infinite; }

/* 설비 헤더 */
.eq-header { display: flex; align-items: center; justify-content: space-between; }
.eq-title { font-size: 18px; font-weight: 700; color: #1a1a1a; }
.eq-title-sub { font-size: 13px; font-weight: 400; color: #999; margin-left: 8px; }
.overall-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 6px; }
.badge-normal { background: #f0fdf4; color: #15803d; }
.badge-warning { background: #fffbeb; color: #d97706; }
.badge-critical { background: #fef2f2; color: #dc2626; }

/* 파라미터 카드 */
.param-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.param-card {
  background: #fff; border: 1.5px solid #e8e8e4; border-radius: 12px; padding: 16px;
  transition: all 0.15s;
}
.param-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.param-normal { border-top: 3px solid #15803d; }
.param-warning { border-top: 3px solid #f59e0b; }
.param-critical { border-top: 3px solid #dc2626; }
.param-name { font-size: 11px; color: #888; margin-bottom: 6px; }
.param-value { font-size: 24px; font-weight: 800; color: #1a1a1a; }
.param-unit { font-size: 13px; font-weight: 400; color: #aaa; }
.param-range { font-size: 10px; color: #bbb; margin-top: 4px; }
.param-chart { width: 100%; height: 80px; margin-top: 8px; }

/* 실시간 수치 */
.section-label { font-size: 11px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.realtime-panel { background: #fff; border: 1px solid #e8e8e4; border-radius: 14px; padding: 20px; }
.realtime-list { display: flex; flex-direction: column; gap: 8px; }
.realtime-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f5f5f0; }
.realtime-item:last-child { border-bottom: none; }
.rt-name { font-size: 12px; color: #666; width: 140px; }
.rt-value { font-size: 14px; font-weight: 700; width: 120px; }
.text-normal { color: #15803d; }
.text-warning { color: #d97706; }
.text-critical { color: #dc2626; }
.rt-range { font-size: 11px; color: #bbb; }

/* 이벤트 테이블 */
.event-section { background: #fff; border: 1px solid #e8e8e4; border-radius: 14px; padding: 20px; }
.event-table-wrap { overflow-x: auto; }
.event-table { width: 100%; border-collapse: collapse; }
.event-table th {
  font-size: 11px; font-weight: 600; color: #aaa; padding: 10px 14px;
  text-align: left; border-bottom: 1px solid #eee; white-space: nowrap;
}
.event-table td { padding: 10px 14px; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f0; }
.evt-time { color: #999; font-size: 11px; white-space: nowrap; }
.evt-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.evt-alarm { background: #fef2f2; color: #dc2626; }
.evt-status_change { background: #f0fdf4; color: #15803d; }
.evt-pm { background: #eff6ff; color: #2563eb; }
.evt-msg { max-width: 400px; }
.evt-empty { text-align: center; color: #ccc; padding: 20px 0; }
.sev-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.sev-err { background: #fef2f2; color: #dc2626; }
.sev-warn { background: #fffbeb; color: #d97706; }
.sev-info { background: #f0fdf4; color: #15803d; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; }
.page-btn {
  padding: 6px 14px; border: 1px solid #e8e8e4; background: #fff;
  border-radius: 6px; font-size: 12px; color: #666; cursor: pointer;
}
.page-btn:hover:not(:disabled) { border-color: #15803d; color: #15803d; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 12px; color: #999; }

/* 알람 */
.alarm-section { background: #fff; border: 1px solid #e8e8e4; border-radius: 14px; padding: 20px; }
.alarm-empty { font-size: 12px; color: #ccc; text-align: center; padding: 16px 0; }
.alarm-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; margin-bottom: 8px; }
.alarm-header { margin-bottom: 4px; }
.alarm-sev { font-size: 11px; font-weight: 700; }
.alarm-msg { font-size: 13px; color: #1a1a1a; font-weight: 600; }
.alarm-time { font-size: 10px; color: #999; margin-top: 4px; }

/* 관리자 의견 */
.note-section { padding-bottom: 40px; }
.note-btn {
  width: 100%; padding: 14px; background: #15803d; color: #fff;
  border: none; border-radius: 12px; font-size: 14px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.2s;
}
.note-btn:hover { background: #166534; }
.note-input-wrap {
  margin-top: 12px; background: #fff; border: 1px solid #e8e8e4;
  border-radius: 12px; padding: 16px;
}
.note-textarea {
  width: 100%; border: 1px solid #e8e8e4; border-radius: 8px; padding: 12px;
  font-size: 13px; resize: none; outline: none; font-family: inherit;
}
.note-textarea:focus { border-color: #15803d; }
.note-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.note-count { font-size: 11px; color: #bbb; }
.note-submit {
  padding: 8px 20px; background: #15803d; color: #fff; border: none;
  border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.note-submit:hover { background: #166534; }
.note-submit:disabled { background: #d1d5db; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
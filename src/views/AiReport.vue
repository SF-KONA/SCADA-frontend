<template>
  <div class="ai-report-container">

    <!-- 좌측: 이전 리포트 목록 -->
    <div class="sidebar">
      <p class="sidebar-title">이전 리포트</p>
      <div v-if="reportList.length === 0" class="sidebar-empty">
        아직 생성된 리포트가 없어요
      </div>
      <div
          v-for="item in reportList"
          :key="item.job_id"
          class="sidebar-item"
          :class="{ active: currentJobId === item.job_id }"
          @click="loadReport(item.job_id)"
      >
        <div class="sidebar-item-query">{{ item.query_text }}</div>
        <div class="sidebar-item-meta">
          <span>{{ formatDate(item.requested_at) }}</span>
          <div style="display:flex; gap:4px; align-items:center;">
            <span v-if="item.has_pdf" class="pdf-tag">PDF</span>
            <span class="status-badge" :class="item.status.toLowerCase()">{{ statusLabel(item.status) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 우측: 메인 영역 -->
    <div class="main-area">

      <!-- 결과 영역 -->
      <div class="result-area">

        <!-- 초기 빈 상태 -->
        <div v-if="!isLoading && !currentReport" class="result-empty">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
          </div>
          <p class="empty-title">AI 분석 리포트</p>
          <p class="empty-sub">아래 입력창에 질의를 입력하면 AI가 분석 리포트를 생성합니다</p>
          <div class="suggest-list">
            <button v-for="q in suggestQuestions" :key="q" class="suggest-chip" @click="setQuery(q)">
              {{ q }}
            </button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-else-if="isLoading" class="result-loading">
          <div class="loading-wrap">
            <div class="loading-spinner-big"></div>
            <p class="loading-title">분석 중입니다...</p>
            <div class="loading-steps">
              <div class="loading-step" :class="{ done: loadingStep > 0, active: loadingStep === 0 }">
                <span class="step-dot"></span>질의 분석 중
              </div>
              <div class="loading-step" :class="{ done: loadingStep > 1, active: loadingStep === 1 }">
                <span class="step-dot"></span>데이터 조회 중
              </div>
              <div class="loading-step" :class="{ done: loadingStep > 2, active: loadingStep === 2 }">
                <span class="step-dot"></span>리포트 생성 중
              </div>
            </div>
          </div>
        </div>

        <!-- 결과 -->
        <div v-else class="result-content">

          <div class="result-query-bar">
            <span class="result-query-text">{{ currentReport.query_text }}</span>
            <button class="pdf-btn" @click="downloadPdf">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF 다운로드
            </button>
          </div>

          <div class="result-section">
            <p class="section-label">분석 요약</p>
            <div class="narrative-box" v-html="renderedNarrative"></div>
          </div>

          <div v-if="currentReport.charts && currentReport.charts.length" class="result-section">
            <p class="section-label">시각화</p>
            <div class="charts-grid">
              <div v-for="(chart, idx) in currentReport.charts" :key="idx" class="chart-card">
                <p class="chart-title">{{ chart.title }}</p>
                <div :ref="el => chartRefs[idx] = el" class="chart-area"></div>
              </div>
            </div>
          </div>

          <div v-if="currentReport.fmea && currentReport.fmea.length" class="result-section">
            <p class="section-label">FMEA 위험도 분석</p>
            <div class="fmea-table-wrap">
              <table class="fmea-table">
                <thead>
                <tr>
                  <th>고장 모드</th><th>영향</th><th>원인</th>
                  <th>S</th><th>O</th><th>D</th>
                  <th>RPN</th><th>위험도</th><th>권고 조치</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(row, idx) in currentReport.fmea" :key="idx">
                  <td>{{ row.failure_mode }}</td>
                  <td>{{ row.effect }}</td>
                  <td>{{ row.cause }}</td>
                  <td class="score">{{ row.S }}</td>
                  <td class="score">{{ row.O }}</td>
                  <td class="score">{{ row.D }}</td>
                  <td class="rpn" :class="rpnClass(row.rpn)">{{ row.rpn }}</td>
                  <td><span class="risk-badge" :class="rpnClass(row.rpn)">{{ rpnLabel(row.rpn) }}</span></td>
                  <td>{{ row.action }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- 하단 프롬프트 -->
      <div class="prompt-bar">
        <div class="prompt-wrap">
          <textarea
              v-model="queryText"
              class="prompt-input"
              placeholder="설비·기간·지표를 포함해 질문하세요  예) FURN_01의 지난주 OEE 분석해줘"
              rows="1"
              :disabled="isLoading"
              @keydown.enter.exact.prevent="submitQuery"
              @input="autoResize"
              ref="promptRef"
          ></textarea>
          <button class="prompt-send-btn" @click="submitQuery" :disabled="isLoading || !queryText.trim()">
            <span v-if="isLoading" class="spinner"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <p class="prompt-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import http from '@/api/http'
import * as echarts from 'echarts'

const queryText     = ref('')
const isLoading     = ref(false)
const loadingStep   = ref(0)
const currentJobId  = ref(null)
const currentReport = ref(null)
const reportList    = ref([])
const chartRefs     = ref([])
const promptRef     = ref(null)
let wsConnection    = null
let loadingTimer    = null

const suggestQuestions = [
  'FURN_01의 지난주 OEE 분석해줘',
  '이번 달 ERR 알람 빈도가 높은 설비 알려줘',
  '지난달 미처리 알람 현황 보여줘',
]

const setQuery = (q) => {
  queryText.value = q
  nextTick(() => promptRef.value?.focus())
}

const autoResize = (e) => {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

const renderedNarrative = computed(() => {
  if (!currentReport.value?.narrative) return ''
  return currentReport.value.narrative
      .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>')
})

const fetchReportList = async () => {
  try {
    const res = await http.get('/api/reports', { params: { page: 1, size: 20 } })
    reportList.value = res.data.data.items
  } catch (e) { console.error('목록 조회 실패', e) }
}

const submitQuery = async () => {
  if (!queryText.value.trim() || isLoading.value) return
  isLoading.value     = true
  loadingStep.value   = 0
  currentReport.value = null
  try {
    const res   = await http.post('/api/reports', { query_text: queryText.value })
    const jobId = res.data.data.job_id
    currentJobId.value = jobId
    queryText.value    = ''
    if (promptRef.value) promptRef.value.style.height = 'auto'
    connectWebSocket(jobId)
    loadingTimer = setInterval(() => {
      if (loadingStep.value < 2) loadingStep.value++
    }, 3000)
  } catch (e) {
    console.error('분석 요청 실패', e)
    isLoading.value = false
  }
}

const connectWebSocket = (jobId) => {
  const token = sessionStorage.getItem('accessToken')
  const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws/reports?token=${token}`
  wsConnection = new WebSocket(wsUrl)
  wsConnection.onopen = () => {
    wsConnection.send(JSON.stringify({ type: 'SUBSCRIBE', job_id: jobId }))
  }
  wsConnection.onmessage = async (e) => {
    const msg = JSON.parse(e.data)
    if (msg.status === 'DONE') {
      clearInterval(loadingTimer)
      await loadReport(jobId)
      await fetchReportList()
      isLoading.value = false
      wsConnection.close()
    } else if (msg.status === 'FAILED') {
      clearInterval(loadingTimer)
      isLoading.value = false
      alert('분석 중 오류: ' + msg.error_message)
      wsConnection.close()
    }
  }
  wsConnection.onerror = () => { clearInterval(loadingTimer); isLoading.value = false }
}

const loadReport = async (jobId) => {
  try {
    const res = await http.get(`/api/reports/${jobId}`)
    currentReport.value = res.data.data
    currentJobId.value  = jobId
    await nextTick()
    renderCharts()
  } catch (e) { console.error('결과 조회 실패', e) }
}

const renderCharts = () => {
  if (!currentReport.value?.charts) return
  currentReport.value.charts.forEach((chart, idx) => {
    const el = chartRefs.value[idx]
    if (!el) return
    const inst = echarts.init(el)
    if (chart.type === 'pie') {
      inst.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { color: '#aaa' } },
        series: [{ type: 'pie', radius: '60%',
          data: chart.data.labels.map((l, i) => ({ name: l, value: chart.data.datasets[0].data[i] }))
        }]
      })
    } else {
      inst.setOption({
        tooltip: { trigger: 'axis' },
        legend: { textStyle: { color: '#aaa' } },
        grid: { left: 40, right: 20, top: 30, bottom: 30 },
        xAxis: { type: 'category', data: chart.data.labels, axisLabel: { color: '#aaa' } },
        yAxis: { type: 'value', axisLabel: { color: '#aaa' } },
        series: chart.data.datasets.map(ds => ({
          name: ds.label, type: chart.type === 'line' ? 'line' : 'bar',
          data: ds.data, smooth: chart.type === 'line',
        }))
      })
    }
  })
}

const downloadPdf = async () => {
  if (!currentJobId.value) return
  try {
    const res = await http.get(`/api/reports/${currentJobId.value}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a   = document.createElement('a')
    a.href = url; a.download = `report_${currentJobId.value}.pdf`; a.click()
    URL.revokeObjectURL(url)
  } catch (e) { alert('PDF 다운로드 실패') }
}

const statusLabel = (s) => ({ QUEUED: '대기', RUNNING: '분석중', DONE: '완료', FAILED: '실패' }[s] || s)
const formatDate  = (d) => d ? new Date(d).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const rpnClass    = (rpn) => rpn >= 70 ? 'high' : rpn >= 30 ? 'medium' : 'low'
const rpnLabel    = (rpn) => rpn >= 70 ? '높음' : rpn >= 30 ? '중간' : '낮음'

onMounted(fetchReportList)
onUnmounted(() => { wsConnection?.close(); clearInterval(loadingTimer) })
</script>

<style scoped>
* { box-sizing: border-box; }

.ai-report-container {
  display: flex;
  height: 100%;
  background: #f4f4f0;
  overflow: hidden;
}

/* ── 좌측 사이드바 ────────────────────────────────── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e8e8e4;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 10px;
}
.sidebar-title {
  font-size: 10px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 6px;
  margin-bottom: 10px;
}
.sidebar-empty {
  font-size: 11px;
  color: #ccc;
  text-align: center;
  padding: 20px 0;
}
.sidebar-item {
  padding: 9px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
  border: 1px solid transparent;
}
.sidebar-item:hover { background: #f7f7f3; }
.sidebar-item.active { background: #f0fdf4; border-color: #bbf7d0; }
.sidebar-item-query {
  font-size: 11px;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
}
.sidebar-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: #bbb;
}
.pdf-tag {
  background: #fef3c7; color: #92400e;
  border-radius: 3px; padding: 1px 4px;
  font-size: 9px; font-weight: 700;
}
.status-badge {
  font-size: 9px; font-weight: 600;
  border-radius: 3px; padding: 1px 5px;
}
.status-badge.done    { background: #f0fdf4; color: #15803d; }
.status-badge.queued  { background: #f8fafc; color: #64748b; }
.status-badge.running { background: #fffbeb; color: #92400e; }
.status-badge.failed  { background: #fef2f2; color: #dc2626; }

/* ── 우측 메인 ───────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-area {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px 20px;
}

/* 빈 상태 */
.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  text-align: center;
}
.empty-icon {
  width: 72px; height: 72px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #15803d;
  margin-bottom: 4px;
}
.empty-title { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.empty-sub   { font-size: 13px; color: #999; }
.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
  max-width: 480px;
}
.suggest-chip {
  background: #fff;
  border: 1px solid #e8e8e4;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.suggest-chip:hover { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }

/* 로딩 */
.result-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.loading-spinner-big {
  width: 44px; height: 44px;
  border: 3px solid #e8e8e4;
  border-top-color: #15803d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-title { font-size: 14px; font-weight: 600; color: #333; }
.loading-steps { display: flex; flex-direction: column; gap: 10px; }
.loading-step {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #ccc; transition: color 0.3s;
}
.loading-step.active { color: #15803d; font-weight: 600; }
.loading-step.done   { color: #86efac; }
.step-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.loading-step.active .step-dot { animation: pulse 1s infinite; }

/* 결과 */
.result-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 900px;
}
.result-query-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid #eee;
}
.result-query-text { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.pdf-btn {
  display: flex; align-items: center; gap: 5px;
  background: transparent;
  border: 1px solid #e0e0d8;
  border-radius: 7px;
  padding: 7px 14px;
  font-size: 12px; color: #555;
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s; flex-shrink: 0;
}
.pdf-btn:hover { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }

.section-label {
  font-size: 11px; font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.narrative-box {
  background: #fafaf8;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px 24px;
  font-size: 13px;
  line-height: 1.8;
  color: #333;
}
:deep(.md-h3) { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 14px 0 6px; }
:deep(.md-h4) { font-size: 13px; font-weight: 600; color: #333; margin: 10px 0 4px; }
:deep(ul) { padding-left: 18px; margin: 4px 0; }
:deep(li) { margin-bottom: 4px; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.chart-card {
  background: #fafaf8;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
}
.chart-title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 10px; }
.chart-area  { height: 220px; }

.fmea-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #eee; }
.fmea-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.fmea-table th {
  background: #f7f7f3; color: #888; font-weight: 600;
  padding: 10px 14px; text-align: left;
  white-space: nowrap; border-bottom: 1px solid #eee;
}
.fmea-table td {
  padding: 10px 14px; color: #333;
  border-bottom: 1px solid #f0f0ea;
  vertical-align: top; line-height: 1.4;
}
.fmea-table tr:last-child td { border-bottom: none; }
.fmea-table td.score { text-align: center; font-weight: 600; }
.fmea-table td.rpn   { text-align: center; font-weight: 700; }
.fmea-table td.rpn.high   { color: #dc2626; }
.fmea-table td.rpn.medium { color: #d97706; }
.fmea-table td.rpn.low    { color: #15803d; }
.risk-badge {
  display: inline-block; border-radius: 5px;
  padding: 2px 8px; font-size: 11px; font-weight: 600;
}
.risk-badge.high   { background: #fef2f2; color: #dc2626; }
.risk-badge.medium { background: #fffbeb; color: #d97706; }
.risk-badge.low    { background: #f0fdf4; color: #15803d; }

/* ── 하단 프롬프트 ───────────────────────────────── */
.prompt-bar {
  flex-shrink: 0;
  padding: 12px 40px 18px;
  background: #f4f4f0;
  border-top: 1px solid #e8e8e4;
}
.prompt-wrap {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #fff;
  border: 1.5px solid #e0e0d8;
  border-radius: 14px;
  padding: 10px 12px;
  transition: border-color 0.2s;
}
.prompt-wrap:focus-within { border-color: #15803d; }
.prompt-input {
  flex: 1;
  border: none; outline: none; resize: none;
  font-size: 14px; color: #1a1a1a;
  background: transparent;
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
  font-family: inherit;
}
.prompt-input::placeholder { color: #bbb; }
.prompt-input:disabled     { opacity: 0.5; }
.prompt-send-btn {
  width: 36px; height: 36px; flex-shrink: 0;
  background: #15803d; border: none;
  border-radius: 9px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.prompt-send-btn:hover:not(:disabled) { background: #166534; }
.prompt-send-btn:disabled { background: #d1d5db; cursor: not-allowed; }
.prompt-hint { font-size: 10px; color: #bbb; margin-top: 6px; text-align: center; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin  { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
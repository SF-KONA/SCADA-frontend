<template>
    <div class="ai-report-container">
        <!-- 좌측: 이전 리포트 목록 -->
        <aside class="report-sidebar">
            <div class="sidebar-header">
                <p>REPORT HISTORY</p>
                <h2>이전 리포트</h2>
            </div>

            <div v-if="reportList.length === 0" class="sidebar-empty">
                <i class="fa-regular fa-file-lines"></i>
                <p>아직 생성된 리포트가 없어요</p>
            </div>

            <div class="report-list">
                <button
                    v-for="item in reportList"
                    :key="item.job_id"
                    type="button"
                    class="report-item"
                    :class="{ active: currentJobId === item.job_id }"
                    @click="loadReport(item.job_id)"
                >
                    <div class="report-item-title">
                        {{ item.query_text }}
                    </div>

                    <div class="report-item-meta">
                        <span>{{ formatDate(item.requested_at) }}</span>

                        <div class="report-badges">
                            <span v-if="item.has_pdf" class="pdf-tag">PDF</span>
                            <span class="status-badge" :class="item.status.toLowerCase()">
                                {{ statusLabel(item.status) }}
                            </span>
                        </div>
                    </div>
                </button>
            </div>
        </aside>

        <!-- 우측: 메인 영역 -->
        <main class="report-main">
            <!-- 결과 영역 -->
            <section class="result-area">
                <!-- 초기 빈 상태 -->
                <div v-if="!isLoading && !currentReport" class="report-empty">
                    <div class="empty-panel">
                        <div class="empty-icon">
                            <i class="fa-solid fa-file-lines"></i>
                        </div>

                        <p class="empty-eyebrow">AI REPORT GENERATOR</p>
                        <h1>AI 분석 리포트</h1>
                        <p class="empty-desc">
                            설비, 기간, 지표를 포함해 질문하면 AI가 공정 데이터를 기반으로
                            분석 리포트를 생성합니다.
                        </p>

                        <div class="analysis-filter-row">
                            <div class="filter-card">
                                <span>분석 대상</span>
                                <strong>설비 / 공정 / 알람</strong>
                            </div>

                            <div class="filter-card">
                                <span>분석 기간</span>
                                <strong>일간 / 주간 / 월간</strong>
                            </div>

                            <div class="filter-card">
                                <span>분석 유형</span>
                                <strong>OEE / ERR / FMEA</strong>
                            </div>
                        </div>

                        <div class="suggest-section">
                            <div class="suggest-header">
                                <p>추천 분석</p>
                                <span>자주 사용하는 리포트 질의</span>
                            </div>

                            <div class="suggest-grid">
                                <button
                                    v-for="q in suggestQuestions"
                                    :key="q"
                                    type="button"
                                    class="suggest-card"
                                    @click="setQuery(q)"
                                >
                                    <i class="fa-solid fa-chart-line"></i>
                                    <span>{{ q }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 로딩 -->
                <div v-else-if="isLoading" class="result-loading">
                    <div class="loading-panel">
                        <div class="loading-spinner-big"></div>

                        <div>
                            <p class="loading-title">분석 리포트를 생성하는 중입니다</p>
                            <p class="loading-sub">질의 분석, 데이터 조회, 리포트 생성을 순차적으로 진행합니다.</p>
                        </div>

                        <div class="loading-steps">
                            <div class="loading-step" :class="{ done: loadingStep > 0, active: loadingStep === 0 }">
                                <span class="step-dot"></span>
                                질의 분석 중
                            </div>

                            <div class="loading-step" :class="{ done: loadingStep > 1, active: loadingStep === 1 }">
                                <span class="step-dot"></span>
                                데이터 조회 중
                            </div>

                            <div class="loading-step" :class="{ done: loadingStep > 2, active: loadingStep === 2 }">
                                <span class="step-dot"></span>
                                리포트 생성 중
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 결과 -->
                <div v-else class="result-content">
                    <div class="result-query-bar">
                        <div>
                            <p class="result-label">분석 질의</p>
                            <h2>{{ currentReport.query_text }}</h2>
                        </div>

                        <button class="pdf-btn" type="button" @click="downloadPdf">
                            <i class="fa-solid fa-download"></i>
                            PDF 다운로드
                        </button>
                    </div>

                    <section class="result-section">
                        <div class="section-header">
                            <p>분석 요약</p>
                            <span>AI generated report</span>
                        </div>

                        <div class="narrative-box" v-html="renderedNarrative"></div>
                    </section>

                    <section v-if="currentReport.charts && currentReport.charts.length" class="result-section">
                        <div class="section-header">
                            <p>시각화</p>
                            <span>Chart analysis</span>
                        </div>

                        <div class="charts-grid">
                            <div
                                v-for="(chart, idx) in currentReport.charts"
                                :key="idx"
                                class="chart-card"
                            >
                                <p class="chart-title">{{ chart.title }}</p>
                                <div :ref="el => chartRefs[idx] = el" class="chart-area"></div>
                            </div>
                        </div>
                    </section>

                    <section v-if="currentReport.fmea && currentReport.fmea.length" class="result-section">
                        <div class="section-header">
                            <p>FMEA 위험도 분석</p>
                            <span>Risk priority number</span>
                        </div>

                        <div class="fmea-table-wrap">
                            <table class="fmea-table">
                                <thead>
                                    <tr>
                                        <th>고장 모드</th>
                                        <th>영향</th>
                                        <th>원인</th>
                                        <th>S</th>
                                        <th>O</th>
                                        <th>D</th>
                                        <th>RPN</th>
                                        <th>위험도</th>
                                        <th>권고 조치</th>
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
                                        <td class="rpn" :class="rpnClass(row.rpn)">
                                            {{ row.rpn }}
                                        </td>
                                        <td>
                                            <span class="risk-badge" :class="rpnClass(row.rpn)">
                                                {{ rpnLabel(row.rpn) }}
                                            </span>
                                        </td>
                                        <td>{{ row.action }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </section>

            <!-- 하단 프롬프트 -->
            <footer class="prompt-bar">
                <div class="prompt-wrap">
                    <textarea
                        ref="promptRef"
                        v-model="queryText"
                        class="prompt-input"
                        placeholder="설비·기간·지표를 포함해 질문하세요  예) FURN_01의 지난주 OEE 분석해줘"
                        rows="1"
                        :disabled="isLoading"
                        @keydown.enter.exact.prevent="submitQuery"
                        @input="autoResize"
                    ></textarea>

                    <button
                        class="prompt-send-btn"
                        type="button"
                        :disabled="isLoading || !queryText.trim()"
                        @click="submitQuery"
                    >
                        <span v-if="isLoading" class="spinner"></span>
                        <i v-else class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>

                <p class="prompt-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
            </footer>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import http from '@/api/http'
import * as echarts from 'echarts'

const queryText = ref('')
const isLoading = ref(false)
const loadingStep = ref(0)
const currentJobId = ref(null)
const currentReport = ref(null)
const reportList = ref([])
const chartRefs = ref([])
const promptRef = ref(null)

let wsConnection = null
let loadingTimer = null

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
    } catch (e) {
        console.error('목록 조회 실패', e)
    }
}

const submitQuery = async () => {
    if (!queryText.value.trim() || isLoading.value) return

    isLoading.value = true
    loadingStep.value = 0
    currentReport.value = null

    try {
        const res = await http.post('/api/reports', { query_text: queryText.value })
        const jobId = res.data.data.job_id

        currentJobId.value = jobId
        queryText.value = ''

        if (promptRef.value) {
            promptRef.value.style.height = 'auto'
        }

        connectWebSocket(jobId)

        loadingTimer = setInterval(() => {
            if (loadingStep.value < 2) {
                loadingStep.value++
            }
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

    wsConnection.onerror = () => {
        clearInterval(loadingTimer)
        isLoading.value = false
    }
}

const loadReport = async (jobId) => {
    try {
        const res = await http.get(`/api/reports/${jobId}`)
        currentReport.value = res.data.data
        currentJobId.value = jobId

        await nextTick()
        renderCharts()
    } catch (e) {
        console.error('결과 조회 실패', e)
    }
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
                legend: {
                    bottom: 0,
                    textStyle: { color: '#647067' },
                },
                series: [{
                    type: 'pie',
                    radius: '60%',
                    data: chart.data.labels.map((label, i) => ({
                        name: label,
                        value: chart.data.datasets[0].data[i],
                    })),
                }],
            })
        } else {
            inst.setOption({
                tooltip: { trigger: 'axis' },
                legend: {
                    textStyle: { color: '#647067' },
                },
                grid: { left: 40, right: 20, top: 30, bottom: 30 },
                xAxis: {
                    type: 'category',
                    data: chart.data.labels,
                    axisLabel: { color: '#647067' },
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#647067' },
                },
                series: chart.data.datasets.map(ds => ({
                    name: ds.label,
                    type: chart.type === 'line' ? 'line' : 'bar',
                    data: ds.data,
                    smooth: chart.type === 'line',
                })),
            })
        }
    })
}

const downloadPdf = async () => {
    if (!currentJobId.value) return

    try {
        const res = await http.get(`/api/reports/${currentJobId.value}/pdf`, {
            responseType: 'blob',
        })

        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')

        a.href = url
        a.download = `report_${currentJobId.value}.pdf`
        a.click()

        URL.revokeObjectURL(url)
    } catch (e) {
        alert('PDF 다운로드 실패')
    }
}

const statusLabel = (s) => ({
    QUEUED: '대기',
    RUNNING: '분석중',
    DONE: '완료',
    FAILED: '실패',
}[s] || s)

const formatDate = (date) => date
    ? new Date(date).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
    : '-'

const rpnClass = (rpn) => rpn >= 70 ? 'high' : rpn >= 30 ? 'medium' : 'low'
const rpnLabel = (rpn) => rpn >= 70 ? '높음' : rpn >= 30 ? '중간' : '낮음'

onMounted(fetchReportList)

onUnmounted(() => {
    wsConnection?.close()
    clearInterval(loadingTimer)
})
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.ai-report-container {
    display: flex;
    height: calc(100vh - 60px);
    background: #f4f6f5;
    overflow: hidden;
}

/* 좌측 사이드바 */
.report-sidebar {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: 18px 14px;
    background: #ffffff;
    border-right: 1px solid #dce3df;
    overflow-y: auto;
}

.sidebar-header {
    padding: 0 4px 14px;
    border-bottom: 1px solid #edf1ee;
    margin-bottom: 12px;
}

.sidebar-header p {
    margin-bottom: 4px;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.08em;
    color: #8a9990;
}

.sidebar-header h2 {
    font-size: 15px;
    font-weight: 850;
    color: #17211b;
}

.sidebar-empty {
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px dashed #dce3df;
    border-radius: 12px;
    color: #a0aca4;
    font-size: 12px;
    text-align: center;
}

.sidebar-empty i {
    font-size: 22px;
    color: #b6c1ba;
}

.report-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.report-item {
    width: 100%;
    padding: 11px 10px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.report-item:hover {
    background: #f8faf9;
    border-color: #dce3df;
}

.report-item.active {
    background: #f0fdf4;
    border-color: #bbf7d0;
}

.report-item-title {
    margin-bottom: 7px;
    color: #17211b;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.45;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.report-item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 10px;
    color: #8a9990;
}

.report-badges {
    display: flex;
    align-items: center;
    gap: 4px;
}

.pdf-tag {
    padding: 2px 5px;
    border-radius: 4px;
    background: #fffbeb;
    color: #b45309;
    font-size: 9px;
    font-weight: 850;
}

.status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 850;
}

.status-badge.done {
    background: #dcfce7;
    color: #15803d;
}

.status-badge.queued {
    background: #f1f5f9;
    color: #64748b;
}

.status-badge.running {
    background: #fef3c7;
    color: #b45309;
}

.status-badge.failed {
    background: #fee2e2;
    color: #dc2626;
}

/* 우측 메인 */
.report-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.result-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 28px 40px 20px;
}

.report-empty {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-panel {
    width: min(760px, 100%);
    padding: 34px 36px;
    border: 1px solid #dce3df;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    text-align: center;
}

.empty-icon {
    width: 62px;
    height: 62px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #f0fdf4;
    color: #15803d;
    font-size: 26px;
}

.empty-eyebrow {
    margin-bottom: 8px;
    color: #15803d;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.1em;
}

.empty-panel h1 {
    color: #17211b;
    font-size: 26px;
    font-weight: 850;
    letter-spacing: -0.04em;
}

.empty-desc {
    max-width: 520px;
    margin: 10px auto 22px;
    color: #647067;
    font-size: 14px;
    line-height: 1.7;
}

.analysis-filter-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 24px;
}

.filter-card {
    padding: 13px 14px;
    border: 1px solid #dce3df;
    border-radius: 12px;
    background: #f8faf9;
    text-align: left;
}

.filter-card span {
    display: block;
    margin-bottom: 6px;
    color: #8a9990;
    font-size: 11px;
    font-weight: 700;
}

.filter-card strong {
    color: #17211b;
    font-size: 13px;
    font-weight: 850;
}

.suggest-section {
    text-align: left;
}

.suggest-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 10px;
}

.suggest-header p {
    color: #17211b;
    font-size: 14px;
    font-weight: 850;
}

.suggest-header span {
    color: #8a9990;
    font-size: 12px;
}

.suggest-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
}

.suggest-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    border: 1px solid #dce3df;
    border-radius: 10px;
    background: #ffffff;
    color: #374151;
    text-align: left;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
}

.suggest-card i {
    color: #15803d;
}

.suggest-card:hover {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #15803d;
}

/* 로딩 */
.result-loading {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-panel {
    width: 420px;
    padding: 30px;
    border: 1px solid #dce3df;
    border-radius: 16px;
    background: #ffffff;
    text-align: center;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.loading-spinner-big {
    width: 44px;
    height: 44px;
    margin: 0 auto 18px;
    border: 3px solid #edf1ee;
    border-top-color: #15803d;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.loading-title {
    color: #17211b;
    font-size: 15px;
    font-weight: 850;
}

.loading-sub {
    margin-top: 6px;
    color: #8a9990;
    font-size: 13px;
}

.loading-steps {
    margin-top: 22px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
}

.loading-step {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #b6c1ba;
    font-size: 13px;
    transition: color 0.3s ease;
}

.loading-step.active {
    color: #15803d;
    font-weight: 800;
}

.loading-step.done {
    color: #22c55e;
}

.step-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
    flex-shrink: 0;
}

.loading-step.active .step-dot {
    animation: pulse 1s infinite;
}

/* 결과 */
.result-content {
    width: min(980px, 100%);
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.result-query-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 18px 20px;
    border: 1px solid #dce3df;
    border-radius: 14px;
    background: #ffffff;
}

.result-label {
    margin-bottom: 4px;
    color: #8a9990;
    font-size: 11px;
    font-weight: 850;
    letter-spacing: 0.06em;
}

.result-query-bar h2 {
    color: #17211b;
    font-size: 17px;
    font-weight: 850;
}

.pdf-btn {
    height: 36px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 14px;
    border: 1px solid #dce3df;
    border-radius: 8px;
    background: #ffffff;
    color: #647067;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
}

.pdf-btn:hover {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #15803d;
}

.result-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
}

.section-header p {
    color: #17211b;
    font-size: 15px;
    font-weight: 850;
}

.section-header span {
    color: #8a9990;
    font-size: 12px;
}

.narrative-box {
    padding: 20px 22px;
    border: 1px solid #dce3df;
    border-radius: 14px;
    background: #ffffff;
    color: #374151;
    font-size: 14px;
    line-height: 1.8;
}

:deep(.md-h3) {
    margin: 14px 0 6px;
    color: #17211b;
    font-size: 15px;
    font-weight: 850;
}

:deep(.md-h4) {
    margin: 10px 0 4px;
    color: #374151;
    font-size: 14px;
    font-weight: 750;
}

:deep(ul) {
    margin: 4px 0;
    padding-left: 18px;
}

:deep(li) {
    margin-bottom: 4px;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 14px;
}

.chart-card {
    padding: 16px;
    border: 1px solid #dce3df;
    border-radius: 14px;
    background: #ffffff;
}

.chart-title {
    margin-bottom: 10px;
    color: #374151;
    font-size: 13px;
    font-weight: 850;
}

.chart-area {
    height: 220px;
}

.fmea-table-wrap {
    overflow-x: auto;
    border: 1px solid #dce3df;
    border-radius: 14px;
    background: #ffffff;
}

.fmea-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.fmea-table th {
    padding: 11px 14px;
    border-bottom: 1px solid #dce3df;
    background: #f8faf9;
    color: #7b8a82;
    font-weight: 850;
    text-align: left;
    white-space: nowrap;
}

.fmea-table td {
    padding: 11px 14px;
    border-bottom: 1px solid #edf1ee;
    color: #374151;
    line-height: 1.45;
    vertical-align: top;
}

.fmea-table tr:last-child td {
    border-bottom: none;
}

.fmea-table td.score {
    text-align: center;
    font-weight: 800;
}

.fmea-table td.rpn {
    text-align: center;
    font-weight: 850;
}

.fmea-table td.rpn.high {
    color: #dc2626;
}

.fmea-table td.rpn.medium {
    color: #d97706;
}

.fmea-table td.rpn.low {
    color: #15803d;
}

.risk-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 850;
}

.risk-badge.high {
    background: #fee2e2;
    color: #dc2626;
}

.risk-badge.medium {
    background: #fef3c7;
    color: #b45309;
}

.risk-badge.low {
    background: #dcfce7;
    color: #15803d;
}

/* 하단 프롬프트 */
.prompt-bar {
    flex-shrink: 0;
    padding: 12px 40px 16px;
    background: #f4f6f5;
    border-top: 1px solid #dce3df;
}

.prompt-wrap {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #dce3df;
    border-radius: 14px;
    background: #ffffff;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.prompt-wrap:focus-within {
    border-color: #15803d;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}

.prompt-input {
    flex: 1;
    max-height: 120px;
    border: none;
    outline: none;
    resize: none;
    overflow-y: auto;
    background: transparent;
    color: #17211b;
    font-size: 14px;
    line-height: 1.6;
    font-family: inherit;
}

.prompt-input::placeholder {
    color: #9aa7a0;
}

.prompt-input:disabled {
    opacity: 0.5;
}

.prompt-send-btn {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 9px;
    background: #15803d;
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.prompt-send-btn:hover:not(:disabled) {
    background: #166534;
}

.prompt-send-btn:disabled {
    background: #cbd5d0;
    cursor: not-allowed;
}

.prompt-hint {
    margin-top: 6px;
    color: #9aa7a0;
    font-size: 10px;
    text-align: center;
}

.spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }
}

@media (max-width: 1024px) {
    .report-sidebar {
        width: 220px;
    }

    .result-area {
        padding: 24px;
    }

    .prompt-bar {
        padding: 12px 24px 16px;
    }

    .analysis-filter-row {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 760px) {
    .ai-report-container {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 60px);
        overflow: visible;
    }

    .report-sidebar {
        width: 100%;
        max-height: 220px;
        border-right: none;
        border-bottom: 1px solid #dce3df;
    }

    .result-area {
        padding: 18px;
    }

    .empty-panel {
        padding: 26px 20px;
    }

    .prompt-bar {
        padding: 12px 18px 16px;
    }
}
</style>
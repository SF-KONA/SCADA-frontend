<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '@/stores/dashboardStore'

const store = useDashboardStore()

// --- chart refs ---
const oeeDonutRef = ref(null)
const oeeTrendRef = ref(null)
const yieldDonutRef = ref(null)
const defectChartRef = ref(null)
const envChartRefs = ref([])

let oeeDonutChart = null
let oeeTrendChart = null
let yieldDonutChart = null
let defectChart = null
let envChartInstances = []

// --- helpers ---
const statusColor = s => ({ RUN: '#15803D', ALARM: '#DC2626', WARNING: '#F97316' }[s] ?? '#9ca3af')
const formatTime = iso => iso ? iso.replace('T', ' ').slice(0, 16) : '-'
const periodLabel = p => ({ today: '오늘', week: '주간', month: '월간' }[p])

const STATUS_PRIORITY = { ALARM: 0, RUN: 1, IDLE: 2 }

const sortedEquipments = computed(() => {
    const items = store.equipments?.items ?? []

    return [...items].sort((a, b) =>
        (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
    )
})

const kpiCards = computed(() => {
    const s = store.status

    if (!s) {
        return []
    }

    return [
        { label: '전체 설비', value: s.total, icon: '🏭', color: '#374151', bg: '#f9fafb' },
        { label: '가동 중', value: s.running, icon: '⚙️', color: '#15803D', bg: '#f0fdf4' },
        { label: '경보', value: s.warning, icon: '⚠️', color: '#F97316', bg: '#fff7ed' },
        { label: '알람', value: s.alarm, icon: '🚨', color: '#DC2626', bg: '#fef2f2' },
        { label: '유지보수', value: s.maintenance, icon: '🔧', color: '#8B5CF6', bg: '#f5f3ff' },
    ]
})

const ZONE_COLORS = { FRONT: '#0284C7', BACK: '#F97316', EQP: '#7C3AED' }

// --- OEE 도넛 ---
const initOeeDonut = () => {
    if (!oeeDonutRef.value || !store.oee) return

    oeeDonutChart?.dispose()
    oeeDonutChart = echarts.init(oeeDonutRef.value)

    const val = store.oee.oee

    oeeDonutChart.setOption({
        graphic: [{
            type: 'group',
            left: 'center',
            top: 'middle',
            children: [
                {
                    type: 'text',
                    style: {
                        text: val + '%',
                        font: 'bold 26px sans-serif',
                        fill: '#15803D',
                        textAlign: 'center',
                        x: 0,
                        y: -10,
                    },
                },
                {
                    type: 'text',
                    style: {
                        text: (() => {
                            const diff = (val - store.oee.prevOee).toFixed(1)
                            return (diff >= 0 ? '▲ +' : '▼ ') + diff + '%'
                        })(),
                        font: '11px sans-serif',
                        fill: val >= store.oee.prevOee ? '#15803D' : '#dc2626',
                        textAlign: 'center',
                        x: 0,
                        y: 18,
                    },
                },
            ],
        }],
        series: [{
            type: 'pie',
            radius: ['72%', '88%'],
            startAngle: 90,
            data: [
                { value: val, itemStyle: { color: '#15803D' } },
                { value: 100 - val, itemStyle: { color: '#f3f4f6' } },
            ],
            label: { show: false },
            emphasis: { scale: false },
        }],
    })
}

// --- OEE 추이 ---
const initOeeTrend = () => {
    if (!oeeTrendRef.value || !store.oee) return

    oeeTrendChart?.dispose()
    oeeTrendChart = echarts.init(oeeTrendRef.value)

    const trend = store.oee.trend

    oeeTrendChart.setOption({
        grid: { left: 4, right: 12, top: 8, bottom: 4, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: p => p[0].axisValue + '<br/>OEE: ' + p[0].value + '%',
        },
        xAxis: {
            type: 'category',
            data: trend.map(t => t.periodStart.slice(11, 16)),
            axisLabel: { fontSize: 10, color: '#9ca3af' },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            min: 65,
            max: 80,
            axisLabel: { show: false },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,.04)' } },
        },
        series: [{
            type: 'line',
            data: trend.map(t => t.oee),
            smooth: true,
            lineStyle: { color: '#15803D', width: 2.5 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(21,128,61,0.12)' },
                        { offset: 1, color: 'rgba(21,128,61,0)' },
                    ],
                },
            },
            symbol: 'circle',
            symbolSize: 5,
            itemStyle: { color: '#15803D', borderColor: '#fff', borderWidth: 2 },
        }],
    })
}

// --- 양품률 도넛 ---
const initYieldDonut = () => {
    if (!yieldDonutRef.value || !store.yieldData) return

    yieldDonutChart?.dispose()
    yieldDonutChart = echarts.init(yieldDonutRef.value)

    const val = store.yieldData.yield

    yieldDonutChart.setOption({
        graphic: [{
            type: 'group',
            left: 'center',
            top: 'middle',
            children: [
                {
                    type: 'text',
                    style: {
                        text: val + '%',
                        font: 'bold 17px sans-serif',
                        fill: '#15803D',
                        textAlign: 'center',
                        x: 0,
                        y: -8,
                    },
                },
                {
                    type: 'text',
                    style: {
                        text: '목표 ' + store.yieldData.target + '%',
                        font: '9px sans-serif',
                        fill: '#9ca3af',
                        textAlign: 'center',
                        x: 0,
                        y: 10,
                    },
                },
            ],
        }],
        series: [{
            type: 'pie',
            radius: ['68%', '85%'],
            startAngle: 90,
            data: [
                { value: val, itemStyle: { color: '#15803D' } },
                { value: 100 - val, itemStyle: { color: '#f3f4f6' } },
            ],
            label: { show: false },
            emphasis: { scale: false },
        }],
    })
}

// --- 공정별 이상률 ---
const defectBarColor = v => v >= 5 ? '#ef4444' : v >= 3 ? '#f59e0b' : '#22c55e'

const initDefectChart = () => {
    if (!defectChartRef.value || !store.defectRate) return

    defectChart?.dispose()
    defectChart = echarts.init(defectChartRef.value)

    const processes = store.defectRate.processes

    defectChart.setOption({
        grid: { left: 0, right: 20, top: 4, bottom: 0, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: params => {
                const bar = params.find(p => p.seriesName === '이상률')
                return bar ? `${bar.axisValue}<br/>이상률: ${bar.value}%` : ''
            },
        },
        xAxis: {
            type: 'value',
            min: 0,
            max: 8,
            axisLabel: { formatter: '{value}%', fontSize: 10, color: '#9ca3af' },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,.04)' } },
        },
        yAxis: {
            type: 'category',
            data: processes.map(p => p.processName),
            axisLabel: { fontSize: 11, color: '#374151' },
            axisTick: { show: false },
            axisLine: { show: false },
        },
        series: [
            {
                name: '이상률',
                type: 'bar',
                data: processes.map(p => ({
                    value: p.defectRate,
                    itemStyle: {
                        color: defectBarColor(p.defectRate),
                        borderRadius: [0, 4, 4, 0],
                    },
                })),
                barMaxWidth: 14,
                label: { show: false },
            },
            {
                name: '경보기준',
                type: 'line',
                data: Array(processes.length).fill(5),
                symbol: 'none',
                lineStyle: { color: '#dc2626', width: 1.5, type: 'dashed' },
                areaStyle: { color: 'transparent' },
            },
        ],
    })
}

// --- 환경 미니 스파크라인 ---
const initEnvChart = (sensor, el) => {
    if (!el) return null

    const chart = echarts.init(el)
    const times = store.environment?.times ?? []

    chart.setOption({
        grid: { left: 10, right: 10, top: 4, bottom: 0, containLabel: false },
        tooltip: {
            trigger: 'axis',
            formatter: params => params
                .filter(p => p.seriesName !== '경계값')
                .map(p => `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value}`)
                .join('<br>'),
        },
        xAxis: { type: 'category', data: times, show: false, boundaryGap: false },
        yAxis: { type: 'value', min: sensor.yMin, max: sensor.yMax, show: false },
        series: [
            ...sensor.zones.map(z => ({
                name: z.label,
                type: 'line',
                data: z.trend,
                smooth: true,
                symbol: 'none',
                lineStyle: { color: ZONE_COLORS[z.zone], width: 1.8 },
                areaStyle: { color: ZONE_COLORS[z.zone] + '18' },
                itemStyle: { color: ZONE_COLORS[z.zone] },
            })),
            {
                name: '경계값',
                type: 'line',
                data: Array(times.length).fill(sensor.threshold),
                symbol: 'none',
                lineStyle: { color: '#ef4444', width: 1.5, type: 'dashed' },
                areaStyle: { color: 'transparent' },
            },
        ],
    })

    return chart
}

const initEnvCharts = () => {
    if (!store.environment) return

    store.environment.sensors.forEach((sensor, i) => {
        const el = envChartRefs.value[i]

        if (!el) return

        if (envChartInstances[i]) {
            envChartInstances[i].dispose()
        }

        envChartInstances[i] = initEnvChart(sensor, el)
    })
}

const handleResize = () => {
    oeeDonutChart?.resize()
    oeeTrendChart?.resize()
    yieldDonutChart?.resize()
    defectChart?.resize()
    envChartInstances.forEach(c => c?.resize())
}

watch(() => store.oee, async val => {
    if (val) {
        await nextTick()
        initOeeDonut()
        initOeeTrend()
    }
})

watch(() => store.yieldData, async val => {
    if (val) {
        await nextTick()
        initYieldDonut()
    }
})

watch(() => store.defectRate, async val => {
    if (val) {
        await nextTick()
        initDefectChart()
    }
})

watch(() => store.environment, async val => {
    if (val) {
        await nextTick()
        initEnvCharts()
    }
})

onMounted(async () => {
    await store.loadAll()
    await nextTick()

    initOeeDonut()
    initOeeTrend()
    initYieldDonut()
    initDefectChart()
    initEnvCharts()

    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    oeeDonutChart?.dispose()
    oeeTrendChart?.dispose()
    yieldDonutChart?.dispose()
    defectChart?.dispose()
    envChartInstances.forEach(c => c?.dispose())

    window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <main class="dashboard-page">
        <!-- 에러 -->
        <div v-if="store.errorMessage" class="error-panel">
            {{ store.errorMessage }}
        </div>

        <!-- 로딩 -->
        <div v-if="store.isLoading" class="loading-panel">
            <i class="fa-solid fa-spinner animate-spin"></i>
        </div>

        <template v-else-if="store.status">
            <!-- KPI 카드 5개 -->
            <section class="kpi-grid">
                <article
                    v-for="card in kpiCards"
                    :key="card.label"
                    class="kpi-card"
                >
                    <span
                        class="kpi-icon"
                        :style="{ background: card.bg, color: card.color }"
                    >
                        {{ card.icon }}
                    </span>

                    <div class="kpi-content">
                        <p>{{ card.label }}</p>
                        <strong :style="{ color: card.color }">
                            {{ card.value }}
                        </strong>
                    </div>
                </article>
            </section>

            <!-- 메인 그리드: OEE 히어로(좌) + 우측 컬럼(우) -->
            <section class="dashboard-grid">
                <!-- OEE 히어로 패널 -->
                <div class="dashboard-card oee-card">
                    <div class="panel-header">
                        <h2>종합 설비 효율(OEE)</h2>

                        <div class="period-tabs">
                            <button
                                v-for="p in ['today', 'week', 'month']"
                                :key="p"
                                type="button"
                                :class="{ active: store.period === p }"
                                @click="store.changePeriod(p)"
                            >
                                {{ periodLabel(p) }}
                            </button>
                        </div>
                    </div>

                    <!-- 대형 도넛 -->
                    <div ref="oeeDonutRef" class="oee-donut"></div>

                    <!-- 3개 바 -->
                    <div class="oee-bars">
                        <div
                            v-for="(item, i) in [
                                { label: '가용률 (Availability)', value: store.oee.availability, color: '#22c55e' },
                                { label: '성능률 (Performance)', value: store.oee.performance, color: '#4ade80' },
                                { label: '품질률 (Quality)', value: store.oee.quality, color: '#f59e0b' },
                            ]"
                            :key="i"
                            class="oee-bar-item"
                        >
                            <div class="oee-bar-label">
                                <span>{{ item.label }}</span>
                                <strong :style="{ color: item.color }">
                                    {{ item.value }}%
                                </strong>
                            </div>

                            <div class="oee-bar-track">
                                <div
                                    class="oee-bar-fill"
                                    :style="{ width: item.value + '%', background: item.color }"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <!-- OEE 추이 -->
                    <div class="oee-trend">
                        <p>OEE 추이</p>
                        <div ref="oeeTrendRef" class="oee-trend-chart"></div>
                    </div>
                </div>

                <!-- 우측 컬럼 -->
                <div class="dashboard-column">
                    <!-- 양품률 + 공정별 이상률 패널 -->
                    <div
                        v-if="store.yieldData && store.defectRate"
                        class="dashboard-card yield-defect-card"
                    >
                        <!-- 양품률 도넛 -->
                        <div class="yield-box">
                            <p>테스트 양품률</p>
                            <div ref="yieldDonutRef" class="yield-donut"></div>

                            <strong
                                :style="{ color: store.yieldData.yield >= store.yieldData.prevYield ? '#15803D' : '#DC2626' }"
                            >
                                {{ store.yieldData.yield >= store.yieldData.prevYield ? '▲' : '▼' }}
                                {{ Math.abs(store.yieldData.yield - store.yieldData.prevYield).toFixed(1) }}%p vs 전일
                            </strong>
                        </div>

                        <!-- 공정별 이상률 바 차트 -->
                        <div class="defect-box">
                            <div class="sub-panel-header">
                                <p>공정별 이상률</p>
                                <span>허용범위 이탈 기준</span>
                            </div>

                            <div ref="defectChartRef" class="defect-chart"></div>

                            <div class="chart-legend">
                                <span>
                                    <i class="legend-dot normal"></i>
                                    정상 (3% 미만)
                                </span>
                                <span>
                                    <i class="legend-dot warning"></i>
                                    주의 (3~5%)
                                </span>
                                <span>
                                    <i class="legend-dot danger"></i>
                                    이상 (5% 초과)
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 클린룸 환경 모니터링 -->
                    <div v-if="store.environment" class="dashboard-card env-panel">
                        <div class="env-header">
                            <h2>클린룸 환경 모니터링</h2>

                            <div class="zone-legend">
                                <span :style="{ color: ZONE_COLORS.FRONT }">
                                    <i :style="{ background: ZONE_COLORS.FRONT }"></i>
                                    전공정
                                </span>
                                <span :style="{ color: ZONE_COLORS.BACK }">
                                    <i :style="{ background: ZONE_COLORS.BACK }"></i>
                                    후공정
                                </span>
                                <span :style="{ color: ZONE_COLORS.EQP }">
                                    <i :style="{ background: ZONE_COLORS.EQP }"></i>
                                    EQP
                                </span>
                                <span class="limit">
                                    <i></i>
                                    경계값
                                </span>
                            </div>
                        </div>

                        <div class="env-grid">
                            <div
                                v-for="(sensor, i) in store.environment.sensors"
                                :key="sensor.item"
                                class="env-card"
                                :class="{
                                    danger: sensor.zones.some(z => z.status === 'ALARM'),
                                    warning: sensor.zones.some(z => z.status === 'WARNING'),
                                }"
                            >
                                <div class="env-card-header">
                                    <p>{{ sensor.label }}</p>

                                    <span
                                        v-if="sensor.zones.some(z => z.status === 'ALARM')"
                                        class="status-pill danger"
                                    >
                                        알람
                                    </span>
                                    <span
                                        v-else-if="sensor.zones.some(z => z.status === 'WARNING')"
                                        class="status-pill warning"
                                    >
                                        주의
                                    </span>
                                    <span v-else class="status-pill normal">
                                        정상
                                    </span>
                                </div>

                                <div class="env-values">
                                    <span
                                        v-for="z in sensor.zones"
                                        :key="z.zone"
                                        :style="{ color: z.status === 'ALARM' ? '#dc2626' : z.status === 'WARNING' ? '#ea580c' : ZONE_COLORS[z.zone] }"
                                    >
                                        {{ z.label }}: {{ z.value }}{{ sensor.unit }}
                                        <template v-if="z.status !== 'NORMAL'">⚠</template>
                                    </span>
                                </div>

                                <p class="env-range">{{ sensor.rangeLabel }}</p>

                                <div
                                    :ref="el => { if (el) envChartRefs[i] = el }"
                                    class="env-chart"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 설비 목록 테이블 -->
            <section class="dashboard-card equipment-table-panel">
                <div class="table-panel-header">
                    <p>설비 목록 현황</p>
                    <span>총 {{ store.equipments?.total ?? 0 }}대</span>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:16%">설비</th>
                                <th style="width:10%">공정</th>
                                <th style="width:9%">상태</th>
                                <th style="width:8%">OEE</th>
                                <th style="width:37%">이상 내용</th>
                                <th style="width:12%">업데이트</th>
                                <th style="width:8%">알람 확인</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr
                                v-for="eq in sortedEquipments"
                                :key="eq.equipmentId"
                                :class="{ alarm: eq.status === 'ALARM' }"
                            >
                                <td>
                                    <p class="equipment-name">{{ eq.equipmentName }}</p>
                                </td>

                                <td>{{ eq.processName }}</td>

                                <td>
                                    <span
                                        class="equipment-status"
                                        :class="{
                                            run: eq.status === 'RUN',
                                            alarm: eq.status === 'ALARM',
                                            idle: eq.status === 'IDLE',
                                        }"
                                    >
                                        {{ eq.statusLabel }}
                                    </span>
                                </td>

                                <td>
                                    <strong
                                        class="oee-value"
                                        :style="{ color: eq.status === 'ALARM' ? '#dc2626' : '#374151' }"
                                    >
                                        {{ eq.oee != null ? eq.oee + '%' : '—' }}
                                    </strong>
                                </td>

                                <td>
                                    <p
                                        v-if="eq.lastAlarm"
                                        class="alarm-message"
                                        :class="eq.lastAlarm.severity === 'ERR' ? 'danger' : 'warning'"
                                    >
                                        {{ eq.lastAlarm.message }}
                                    </p>
                                    <p v-else class="empty-text">—</p>
                                </td>

                                <td class="date-text">
                                    {{ formatTime(eq.updatedAt) }}
                                </td>

                                <td>
                                    <button
                                        v-if="eq.lastAlarm"
                                        type="button"
                                        class="ack-button"
                                        :class="eq.lastAlarm.severity === 'ERR' ? 'danger' : 'warning'"
                                        @click="store.ackAlarm(eq.lastAlarm.alarmId, eq.equipmentId)"
                                    >
                                        확인
                                    </button>

                                    <span v-else class="empty-text">—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    </main>
</template>

<style scoped>
.dashboard-page {
    min-height: calc(100vh - 60px);
    padding: 12px 18px 18px;
    background: #f4f6f5;
}

.error-panel {
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
    font-size: 14px;
    font-weight: 600;
}

.loading-panel {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #15803d;
    font-size: 28px;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 14px;
}

.kpi-card {
    min-height: 76px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    border: 1px solid #dce3df;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.kpi-card {
    min-height: 68px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid #dce3df;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.kpi-icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    font-size: 18px;
}


.kpi-content strong {
    font-size: 25px;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 14px;
    margin-bottom: 14px;
}

.dashboard-column {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.dashboard-card {
    border: 1px solid #dce3df;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.oee-card {
    padding: 18px;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.panel-header h2 {
    font-size: 16px;
    font-weight: 850;
    color: #17211b;
}

.period-tabs {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.period-tabs button {
    min-width: 54px;
    height: 30px;
    padding: 0 12px;
    border: 1px solid #dce3df;
    border-radius: 7px;
    background: #ffffff;
    color: #647067;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    line-height: 1;
    cursor: pointer;
}

.period-tabs button.active {
    background: #15803d;
    border-color: #15803d;
    color: #ffffff;
}

.oee-donut {
    width: 180px;
    height: 180px;
    margin: 0 auto 14px;
}

.oee-bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.oee-bar-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.oee-bar-label span {
    font-size: 11px;
    color: #647067;
}

.oee-bar-label strong {
    font-size: 13px;
    font-weight: 800;
}

.oee-bar-track {
    height: 5px;
    width: 100%;
    overflow: hidden;
    border-radius: 999px;
    background: #edf1ee;
}

.oee-bar-fill {
    height: 100%;
    border-radius: 999px;
}

.oee-trend {
    margin-top: 16px;
}

.oee-trend p {
    margin-bottom: 4px;
    font-size: 11px;
    color: #8a9990;
}

.oee-trend-chart {
    height: 80px;
}

.yield-defect-card {
    padding: 18px;
    display: flex;
    gap: 18px;
}

.yield-box {
    width: 124px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
}

.yield-box p {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 800;
    color: #17211b;
}

.yield-donut {
    width: 100px;
    height: 100px;
}

.yield-box strong {
    margin-top: 6px;
    font-size: 11px;
    font-weight: 800;
}

.defect-box {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.sub-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.sub-panel-header p {
    font-size: 12px;
    font-weight: 800;
    color: #17211b;
}

.sub-panel-header span {
    font-size: 10px;
    color: #8a9990;
}

.defect-chart {
    flex: 1;
    min-height: 140px;
}

.chart-legend {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #edf1ee;
}

.chart-legend span {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: #647067;
}

.legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
}

.legend-dot.normal {
    background: #22c55e;
}

.legend-dot.warning {
    background: #f59e0b;
}

.legend-dot.danger {
    background: #ef4444;
}

.env-panel {
    padding: 14px;
}

.env-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
}

.env-header h2 {
    font-size: 14px;
    font-weight: 850;
    color: #17211b;
}

.zone-legend {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 11px;
    font-weight: 700;
}

.zone-legend span {
    display: flex;
    align-items: center;
    gap: 6px;
}

.zone-legend i {
    width: 16px;
    height: 2px;
    border-radius: 999px;
}

.zone-legend .limit {
    color: #ef4444;
}

.zone-legend .limit i {
    background: transparent;
    border-top: 2px dashed #ef4444;
}

.env-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.env-card {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #dce3df;
    background: #f8faf9;
}

.env-card.warning {
    border-color: #fed7aa;
    background: #fff7ed;
}

.env-card.danger {
    border-color: #fecaca;
    background: #fef2f2;
}

.env-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.env-card-header p {
    font-size: 12px;
    font-weight: 850;
    color: #17211b;
}

.status-pill {
    padding: 2px 6px;
    border-radius: 5px;
    font-size: 10px;
    font-weight: 850;
}

.status-pill.normal {
    background: #dcfce7;
    color: #15803d;
}

.status-pill.warning {
    background: #fef3c7;
    color: #b45309;
}

.status-pill.danger {
    background: #fee2e2;
    color: #dc2626;
}

.env-values {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    margin-bottom: 4px;
}

.env-values span {
    font-size: 10px;
    font-weight: 800;
}

.env-range {
    margin-bottom: 4px;
    font-size: 9px;
    color: #8a9990;
}

.env-chart {
    height: 58px;
    margin-bottom: 0px;
}

.equipment-table-panel {
    overflow: hidden;
}

.table-panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    border-bottom: 1px solid #dce3df;
    background: #ffffff;
}

.table-panel-header p {
    font-size: 16px;
    font-weight: 850;
    color: #17211b;
}

.table-panel-header span {
    font-size: 13px;
    color: #8a9990;
}

.table-wrap {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    text-align: left;
}

thead {
    background: #f8faf9;
}

th {
    padding: 11px 18px;
    border-bottom: 1px solid #dce3df;
    color: #7b8a82;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
}

td {
    padding: 11px 18px;
    border-bottom: 1px solid #edf1ee;
    color: #374151;
    font-size: 12px;
    vertical-align: middle;
}

tbody tr {
    transition: background-color 0.15s ease;
}

tbody tr:hover {
    background: #f8faf9;
}

tbody tr.alarm {
    background: #fff5f5;
}

.equipment-name {
    font-weight: 800;
    color: #17211b;
}

.equipment-status {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 850;
}

.equipment-status.run {
    background: #dcfce7;
    color: #15803d;
}

.equipment-status.alarm {
    background: #fee2e2;
    color: #dc2626;
}

.equipment-status.idle {
    background: #f1f5f9;
    color: #64748b;
}

.oee-value {
    font-weight: 850;
    font-variant-numeric: tabular-nums;
}

.alarm-message {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.alarm-message.danger {
    color: #dc2626;
}

.alarm-message.warning {
    color: #ea580c;
}

.empty-text {
    color: #b6c1ba;
}

.date-text {
    color: #8a9990;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
}

.ack-button {
    padding: 5px 12px;
    border-radius: 7px;
    border: 1px solid;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.15s ease;
}

.ack-button.danger {
    border-color: #fecaca;
    background: #fef2f2;
    color: #dc2626;
}

.ack-button.danger:hover {
    background: #fee2e2;
}

.ack-button.warning {
    border-color: #fde68a;
    background: #fffbeb;
    color: #b45309;
}

.ack-button.warning:hover {
    background: #fef3c7;
}

@media (max-width: 1280px) {
    .kpi-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 900px) {
    .env-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .zone-legend {
        flex-wrap: wrap;
        justify-content: flex-end;
    }
}

@media (max-width: 760px) {
    .dashboard-page {
        padding: 12px;
    }

    .kpi-grid {
        grid-template-columns: 1fr;
    }

    .yield-defect-card {
        flex-direction: column;
    }

    .env-grid {
        grid-template-columns: 1fr;
    }
}
</style>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '@/stores/dashboardStore'

const store = useDashboardStore()

// --- chart refs ---
const oeeDonutRef    = ref(null)
const oeeTrendRef    = ref(null)
const yieldDonutRef  = ref(null)
const defectChartRef = ref(null)
const envChartRefs   = ref([])

let oeeDonutChart     = null
let oeeTrendChart     = null
let yieldDonutChart   = null
let defectChart       = null
let envChartInstances = []

// --- helpers ---
const statusColor = s => ({ RUN: '#15803D', ALARM: '#DC2626', WARNING: '#F97316' }[s] ?? '#9ca3af')
const formatTime  = iso => iso ? iso.replace('T', ' ').slice(0, 16) : '-'
const periodLabel = p => ({ today: '오늘', week: '이번 주', month: '이번 달' }[p])

const STATUS_PRIORITY = { ALARM: 0, RUN: 1, IDLE: 2 }

const sortedEquipments = computed(() => {
    const items = store.equipments?.items ?? []
    return [...items].sort((a, b) =>
        (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
    )
})

const kpiCards = computed(() => {
    const s = store.status
    if (!s) return []
    return [
        { label: '전체 설비', value: s.total,       icon: '🏭', color: '#374151', bg: '#f9fafb' },
        { label: '가동 중',   value: s.running,     icon: '⚙️', color: '#15803D', bg: '#f0fdf4' },
        { label: '경보',      value: s.warning,     icon: '⚠️', color: '#F97316', bg: '#fff7ed' },
        { label: '알람',      value: s.alarm,       icon: '🚨', color: '#DC2626', bg: '#fef2f2' },
        { label: '유지보수',  value: s.maintenance, icon: '🔧', color: '#8B5CF6', bg: '#f5f3ff' },
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
            type: 'group', left: 'center', top: 'middle',
            children: [
                { type: 'text', style: { text: val + '%', font: 'bold 26px sans-serif', fill: '#15803D', textAlign: 'center', x: 0, y: -10 } },
                { type: 'text', style: {
                    text: (() => {
                        const diff = (val - store.oee.prevOee).toFixed(1)
                        return (diff >= 0 ? '▲ +' : '▼ ') + diff + '%'
                    })(),
                    font: '11px sans-serif',
                    fill: val >= store.oee.prevOee ? '#15803D' : '#dc2626',
                    textAlign: 'center', x: 0, y: 18,
                }},
            ],
        }],
        series: [{
            type: 'pie', radius: ['72%', '88%'], startAngle: 90,
            data: [
                { value: val,       itemStyle: { color: '#15803D' } },
                { value: 100 - val, itemStyle: { color: '#f3f4f6' } },
            ],
            label: { show: false }, emphasis: { scale: false },
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
        tooltip: { trigger: 'axis', formatter: p => p[0].axisValue + '<br/>OEE: ' + p[0].value + '%' },
        xAxis: {
            type: 'category',
            data: trend.map(t => t.periodStart.slice(11, 16)),
            axisLabel: { fontSize: 10, color: '#9ca3af' },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value', min: 65, max: 80,
            axisLabel: { show: false },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,.04)' } },
        },
        series: [{
            type: 'line', data: trend.map(t => t.oee), smooth: true,
            lineStyle: { color: '#15803D', width: 2.5 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(21,128,61,0.12)' }, { offset: 1, color: 'rgba(21,128,61,0)' }] } },
            symbol: 'circle', symbolSize: 5, itemStyle: { color: '#15803D', borderColor: '#fff', borderWidth: 2 },
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
            type: 'group', left: 'center', top: 'middle',
            children: [
                { type: 'text', style: { text: val + '%', font: 'bold 17px sans-serif', fill: '#15803D', textAlign: 'center', x: 0, y: -8 } },
                { type: 'text', style: { text: '목표 ' + store.yieldData.target + '%', font: '9px sans-serif', fill: '#9ca3af', textAlign: 'center', x: 0, y: 10 } },
            ],
        }],
        series: [{
            type: 'pie', radius: ['68%', '85%'], startAngle: 90,
            data: [
                { value: val,       itemStyle: { color: '#15803D' } },
                { value: 100 - val, itemStyle: { color: '#f3f4f6' } },
            ],
            label: { show: false }, emphasis: { scale: false },
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
            type: 'value', min: 0, max: 8,
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
                    itemStyle: { color: defectBarColor(p.defectRate), borderRadius: [0, 4, 4, 0] },
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
        if (envChartInstances[i]) envChartInstances[i].dispose()
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
    if (val) { await nextTick(); initOeeDonut(); initOeeTrend() }
})
watch(() => store.yieldData, async val => {
    if (val) { await nextTick(); initYieldDonut() }
})
watch(() => store.defectRate, async val => {
    if (val) { await nextTick(); initDefectChart() }
})
watch(() => store.environment, async val => {
    if (val) { await nextTick(); initEnvCharts() }
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
    <div class="space-y-8">


        <!-- 에러 -->
        <div v-if="store.errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {{ store.errorMessage }}
        </div>

        <!-- 로딩 -->
        <div v-if="store.isLoading" class="flex items-center justify-center py-24">
            <i class="fa-solid fa-spinner animate-spin text-2xl text-[#15803D]"></i>
        </div>

        <template v-else-if="store.status">

            <!-- KPI 카드 5개 -->
            <section class="grid grid-cols-5 gap-5" style="margin-bottom: 1rem;">
                <article
                    v-for="card in kpiCards" :key="card.label"
                    class="rounded-2xl border border-gray-200 bg-white px-6 py-14 shadow-sm flex items-center gap-4"
                >
                    <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                          :style="{ background: card.bg }">
                        {{ card.icon }}
                    </span>
                    <div>
                        <p class="text-[14px] text-slate-400">{{ card.label }}</p>
                        <p class="text-[26px] font-bold leading-tight tabular-nums" :style="{ color: card.color }">
                            {{ card.value }}
                        </p>
                    </div>
                </article>
            </section>

            <!-- 메인 그리드: OEE 히어로(좌) + 우측 컬럼(우) -->
            <section class="grid gap-4" style="grid-template-columns: 300px 1fr; margin-bottom: 1rem;">

                <!-- OEE 히어로 패널 -->
                <div class="rounded-[18px] border border-gray-200 bg-white p-[22px] shadow-sm flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-[16px] font-bold text-slate-700">종합 설비 효율(OEE)</h2>
                        <div class="flex gap-1.5">
                            <button
                                v-for="p in ['today', 'week', 'month']" :key="p"
                                class="px-4 py-2 font-medium text-sm rounded-lg border transition"
                                :class="store.period === p ? 'bg-[#15803D] text-white border-[#15803D] font-semibold' : 'text-slate-500 border-gray-200 hover:bg-gray-50'"
                                @click="store.changePeriod(p)"
                            >{{ periodLabel(p) }}</button>
                        </div>
                    </div>

                    <!-- 대형 도넛 -->
                    <div ref="oeeDonutRef" style="width:200px;height:200px;margin:0 auto 18px;"></div>

                    <!-- 3개 바 -->
                    <div class="space-y-2.5">
                        <div v-for="(item, i) in [
                            { label: '가용률 (Availability)', value: store.oee.availability, color: '#22c55e' },
                            { label: '성능률 (Performance)',  value: store.oee.performance,  color: '#4ade80' },
                            { label: '품질률 (Quality)',      value: store.oee.quality,      color: '#f59e0b' },
                        ]" :key="i">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-[11px] text-slate-500">{{ item.label }}</span>
                                <span class="text-[13px] font-bold tabular-nums" :style="{ color: item.color }">{{ item.value }}%</span>
                            </div>
                            <div class="h-[5px] w-full overflow-hidden rounded-full bg-gray-100">
                                <div class="h-full rounded-full" :style="{ width: item.value + '%', background: item.color }"></div>
                            </div>
                        </div>
                    </div>

                    <!-- OEE 추이 -->
                    <div class="mt-4">
                        <div class="flex items-center justify-between mb-1.5">
                            <p class="text-[11px] text-slate-400">OEE 추이</p>
                        </div>
                        <div ref="oeeTrendRef" style="height:80px;"></div>
                    </div>
                </div>

                <!-- 우측 컬럼 -->
                <div class="flex flex-col gap-4">

                    <!-- 양품률 + 공정별 이상률 패널 -->
                    <div v-if="store.yieldData && store.defectRate"
                         class="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm flex gap-5">
                        <!-- 양품률 도넛 -->
                        <div class="flex flex-col items-center flex-shrink-0">
                            <p class="text-[12px] font-bold text-slate-700 mb-2.5">테스트 양품률</p>
                            <div ref="yieldDonutRef" style="width:100px;height:100px;"></div>
                            <p class="text-[11px] font-bold mt-1.5"
                               :style="{ color: store.yieldData.yield >= store.yieldData.prevYield ? '#15803D' : '#DC2626' }">
                                {{ store.yieldData.yield >= store.yieldData.prevYield ? '▲' : '▼' }}
                                {{ Math.abs(store.yieldData.yield - store.yieldData.prevYield).toFixed(1) }}%p vs 전일
                            </p>
                        </div>

                        <!-- 공정별 이상률 바 차트 -->
                        <div class="flex-1 flex flex-col">
                            <div class="flex items-center justify-between mb-2.5">
                                <p class="text-[12px] font-bold text-slate-700">공정별 이상률</p>
                                <p class="text-[10px] text-slate-400">허용범위 이탈 기준</p>
                            </div>
                            <div ref="defectChartRef" class="flex-1" style="min-height:140px;"></div>
                            <div class="flex gap-3 mt-2 pt-2 border-t border-gray-100">
                                <span class="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span class="inline-block w-2 h-2 rounded-sm bg-[#22c55e]"></span>정상 (3% 미만)
                                </span>
                                <span class="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span class="inline-block w-2 h-2 rounded-sm bg-[#f59e0b]"></span>주의 (3~5%)
                                </span>
                                <span class="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span class="inline-block w-2 h-2 rounded-sm bg-[#ef4444]"></span>이상 (5% 초과)
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 클린룸 환경 모니터링 -->
                    <div v-if="store.environment" class="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start justify-between mb-3.5">
                            <div>
                                <h2 class="text-[13px] font-bold text-slate-700">클린룸 환경 모니터링</h2>
                            </div>
                            <div class="flex items-center gap-3.5 text-[11px]">
                                <span class="flex items-center gap-1.5 font-medium" :style="{ color: ZONE_COLORS.FRONT }">
                                    <span class="inline-block h-0.5 w-4 rounded" :style="{ background: ZONE_COLORS.FRONT }"></span>전공정
                                </span>
                                <span class="flex items-center gap-1.5 font-medium" :style="{ color: ZONE_COLORS.BACK }">
                                    <span class="inline-block h-0.5 w-4 rounded" :style="{ background: ZONE_COLORS.BACK }"></span>후공정
                                </span>
                                <span class="flex items-center gap-1.5 font-medium" :style="{ color: ZONE_COLORS.EQP }">
                                    <span class="inline-block h-0.5 w-4 rounded" :style="{ background: ZONE_COLORS.EQP }"></span>EQP
                                </span>
                                <span class="flex items-center gap-1.5 text-red-400">
                                    <span class="inline-block border-t-2 border-dashed border-red-400 w-4"></span>경계값
                                </span>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <div
                                v-for="(sensor, i) in store.environment.sensors" :key="sensor.item"
                                class="rounded-[10px] border p-3"
                                :class="sensor.zones.some(z => z.status === 'ALARM')   ? 'border-red-200 bg-red-50/40'
                                      : sensor.zones.some(z => z.status === 'WARNING') ? 'border-orange-200 bg-orange-50/30'
                                      : 'border-gray-200 bg-gray-50/60'"
                            >
                                <div class="flex items-start justify-between mb-1.5">
                                    <p class="text-[11px] font-bold text-slate-700">{{ sensor.label }}</p>
                                    <span v-if="sensor.zones.some(z => z.status === 'ALARM')"
                                        class="rounded px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-600">알람</span>
                                    <span v-else-if="sensor.zones.some(z => z.status === 'WARNING')"
                                        class="rounded px-1.5 py-0.5 text-[9px] font-bold bg-yellow-100 text-yellow-700">주의</span>
                                    <span v-else
                                        class="rounded px-1.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-700">정상</span>
                                </div>

                                <div class="flex gap-2 flex-wrap mb-1">
                                    <span v-for="z in sensor.zones" :key="z.zone"
                                        class="text-[10px] font-semibold"
                                        :style="{ color: z.status === 'ALARM' ? '#dc2626' : z.status === 'WARNING' ? '#ea580c' : ZONE_COLORS[z.zone] }">
                                        {{ z.label }}: {{ z.value }}{{ sensor.unit }}<span v-if="z.status !== 'NORMAL'"> ⚠</span>
                                    </span>
                                </div>

                                <p class="text-[9px] text-slate-400 mb-1.5">{{ sensor.rangeLabel }}</p>
                                <div :ref="el => { if (el) envChartRefs[i] = el }" style="height:70px; margin-bottom: 4px;"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <!-- 설비 목록 테이블 -->
            <section class="rounded-[18px] border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div class="flex items-center px-7 py-4 border-b border-gray-200 gap-2">
                    <p class="text-[16px] font-bold text-slate-700">설비 목록 현황</p>
                    <p class="text-[13px] text-slate-400">총 {{ store.equipments?.total ?? 0 }}대</p>
                </div>
                <table class="w-full border-collapse text-left table-fixed">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:16%">설비</th>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:10%">공정</th>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:9%">상태</th>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:8%">OEE</th>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:37%">이상 내용</th>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:12%">업데이트</th>
                            <th class="px-7 py-4 text-[11px] font-semibold text-slate-400 border-b border-gray-200 whitespace-nowrap" style="width:8%">알람 확인</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 bg-white">
                        <tr
                            v-for="eq in sortedEquipments" :key="eq.equipmentId"
                            class="hover:bg-gray-50 transition-colors"
                            :class="{ 'bg-red-50': eq.status === 'ALARM' }"
                        >
                            <td class="px-7 py-4 text-[12px]">
                                <p class="font-semibold text-slate-700">{{ eq.equipmentName }}</p>
                            </td>
                            <td class="px-7 py-4 text-[12px] text-slate-600">{{ eq.processName }}</td>
                            <td class="px-7 py-4">
                                <span class="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold"
                                    :class="{
                                        'bg-green-100 text-green-700': eq.status === 'RUN',
                                        'bg-red-100 text-red-700': eq.status === 'ALARM',
                                        'bg-gray-100 text-gray-500': eq.status === 'IDLE',
                                    }">
                                    {{ eq.statusLabel }}
                                </span>
                            </td>
                            <td class="px-7 py-4 text-[12px] font-bold tabular-nums"
                                :style="{ color: eq.status === 'ALARM' ? '#dc2626' : '#374151' }">
                                {{ eq.oee != null ? eq.oee + '%' : '—' }}
                            </td>
                            <td class="px-7 py-4 max-w-xs text-[12px]">
                                <p v-if="eq.lastAlarm" class="truncate"
                                    :class="eq.lastAlarm.severity === 'ERR' ? 'text-red-600' : 'text-orange-600'">
                                    {{ eq.lastAlarm.message }}
                                </p>
                                <p v-else class="text-slate-400">—</p>
                            </td>
                            <td class="px-7 py-4 text-[11px] text-slate-400 tabular-nums">{{ formatTime(eq.updatedAt) }}</td>
                            <td class="px-7 py-4">
                                <button
                                    v-if="eq.lastAlarm"
                                    type="button"
                                    class="text-[12px] px-4 py-1.5 rounded border cursor-pointer whitespace-nowrap transition-colors font-semibold"
                                    :class="eq.lastAlarm.severity === 'ERR'
                                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'"
                                    @click="store.ackAlarm(eq.lastAlarm.alarmId, eq.equipmentId)"
                                >확인</button>
                                <span v-else class="text-slate-300 text-[12px]">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>

        </template>
    </div>
</template>


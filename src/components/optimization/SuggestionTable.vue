<script setup>
import { computed } from 'vue'

const props = defineProps({
    suggestions: { type: Array, default: () => [] },
    parameters: { type: Array, default: () => [] },
    pendingCount: { type: Number, default: 0 },
    abnormalCount: { type: Number, default: 0 },
    isApplying: { type: Boolean, default: false },
})

const emit = defineEmits(['apply', 'reject', 'apply-all'])

const normalizeTag = value => (value == null ? '' : String(value).trim().toUpperCase())

const suggestionByTag = computed(() => {
    const map = new Map()
    for (const s of props.suggestions) {
        const key = normalizeTag(s.parameterTag)
        if (key && !map.has(key)) map.set(key, s)
    }
    return map
})

const computeParamStatus = param => {
    const { currentValue, normalMin, normalMax } = param
    if (currentValue == null) return 'EMPTY'
    if (normalMin == null || normalMax == null) return 'NORMAL'
    if (currentValue >= normalMin && currentValue <= normalMax) return 'NORMAL'
    const range = normalMax - normalMin
    const tolerance = range > 0 ? range * 0.05 : Math.max(Math.abs(normalMax) * 0.05, 1)
    if (currentValue < normalMin - tolerance || currentValue > normalMax + tolerance) {
        return 'ABNORMAL'
    }
    return 'WARNING'
}

const rows = computed(() =>
    props.parameters.map(param => {
        const suggestion = suggestionByTag.value.get(normalizeTag(param.tagCode)) || null
        return {
            paramId: param.paramId,
            tagCode: param.tagCode,
            tagName: param.tagName,
            unit: param.unit,
            currentValue: param.currentValue,
            normalMin: param.normalMin,
            normalMax: param.normalMax,
            suggestion,
            paramStatus: computeParamStatus(param),
        }
    }),
)

const showAllNormalBanner = computed(
    () =>
        props.parameters.length > 0 &&
        props.pendingCount === 0 &&
        props.abnormalCount === 0,
)

const rowStatusBadge = row => {
    if (row.suggestion) {
        switch (row.suggestion.status) {
            case 'APPLIED':
                return { label: '적용', class: 'bg-green-100 text-green-700' }
            case 'REJECTED':
                return { label: '거부', class: 'bg-gray-100 text-gray-600' }
            case 'EXPIRED':
                return { label: '만료', class: 'bg-gray-100 text-gray-500' }
            default:
                return { label: '대기', class: 'bg-yellow-100 text-yellow-700' }
        }
    }
    switch (row.paramStatus) {
        case 'ABNORMAL':
            return { label: '이상', class: 'bg-red-100 text-red-700' }
        case 'WARNING':
            return { label: '경고', class: 'bg-yellow-100 text-yellow-700' }
        case 'EMPTY':
            return { label: '수집 중', class: 'bg-gray-100 text-gray-500' }
        default:
            return { label: '정상', class: 'bg-green-100 text-green-700' }
    }
}

const yieldImpactStyle = score => {
    if (score >= 0.7) return { label: '매우 높음', bar: 'bg-red-500' }
    if (score >= 0.5) return { label: '높음', bar: 'bg-[#F97316]' }
    if (score >= 0.3) return { label: '중간', bar: 'bg-yellow-400' }
    return { label: '낮음', bar: 'bg-blue-400' }
}

const formatNumber = v => {
    if (v == null) return '-'
    return Number.isInteger(v)
        ? v.toLocaleString()
        : Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

const formatDelta = (current, suggested) => {
    if (current == null || suggested == null) return ''
    const diff = suggested - current
    const sign = diff > 0 ? '+' : ''
    return `${sign}${Number(diff.toFixed(2))}`
}
</script>

<template>
    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-end justify-between gap-4">
            <div>
                <h2 class="text-lg font-bold text-gray-900">
                    파라미터 현황 및 적정값 제안
                </h2>
                <p v-if="pendingCount > 0" class="mt-1 text-sm text-gray-500">
                    공정 파라미터 {{ pendingCount }}건 조정 제안
                </p>
            </div>
            <button
                v-if="pendingCount > 0"
                type="button"
                class="shrink-0 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="isApplying"
                @click="emit('apply-all')"
            >
                <i class="fa-solid fa-check mr-1"></i>
                전체 일괄 적용 ({{ pendingCount }}건)
            </button>
        </div>

        <!-- 정상 가동 배너 -->
        <div
            v-if="showAllNormalBanner"
            class="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm"
        >
            <i class="fa-solid fa-circle-check text-[#15803D]"></i>
            <p class="font-semibold text-[#15803D]">
                현재 모든 파라미터가 정상 범위 내
            </p>
            <p class="text-xs text-gray-500">· 조정 제안 없음</p>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-200">
            <table class="w-full border-collapse text-left text-sm">
                <thead class="bg-gray-50 text-gray-600">
                    <tr>
                        <th class="px-4 py-3 font-semibold">파라미터</th>
                        <th class="px-4 py-3 font-semibold">현재값</th>
                        <th class="px-4 py-3 font-semibold">목표 범위</th>
                        <th class="px-4 py-3 font-semibold">AI 제안값</th>
                        <th class="px-4 py-3 font-semibold">수율 영향도</th>
                        <th class="px-4 py-3 font-semibold">상태</th>
                        <th class="px-4 py-3 font-semibold text-right">적용</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-gray-100 bg-white">
                    <tr v-if="!rows.length">
                        <td colspan="7" class="px-4 py-10 text-center text-sm text-gray-400">
                            <i class="fa-solid fa-spinner fa-spin mr-1"></i>
                            제어 가능 파라미터를 수집 중입니다.
                        </td>
                    </tr>

                    <tr v-for="row in rows" :key="row.paramId">
                        <td class="px-4 py-4">
                            <p class="font-semibold text-gray-900">{{ row.tagName }}</p>
                            <p class="mt-1 text-xs text-gray-400">{{ row.tagCode }}</p>
                        </td>

                        <td class="px-4 py-4">
                            <template v-if="row.currentValue != null">
                                <span class="font-bold text-gray-900">
                                    {{ formatNumber(row.currentValue) }}
                                </span>
                                <span class="ml-0.5 text-xs font-medium text-gray-500">{{ row.unit }}</span>
                            </template>
                            <span v-else class="text-xs text-gray-400">수집 중</span>
                        </td>

                        <td class="px-4 py-4 text-xs text-gray-600">
                            <template v-if="row.normalMin != null && row.normalMax != null">
                                {{ row.normalMin }} ~ {{ row.normalMax }}{{ row.unit }}
                            </template>
                            <span v-else class="text-gray-400">-</span>
                        </td>

                        <td class="px-4 py-4">
                            <template v-if="row.suggestion">
                                <p class="font-bold text-[#15803D]">
                                    {{ formatNumber(row.suggestion.suggestedValue) }}
                                    <span class="text-xs font-medium text-gray-500">{{ row.unit }}</span>
                                </p>
                                <p class="mt-1 text-[11px] text-gray-400">
                                    {{ formatDelta(row.currentValue, row.suggestion.suggestedValue) }}{{ row.unit }} 조정
                                </p>
                            </template>
                            <span v-else class="text-gray-400">—</span>
                        </td>

                        <td class="px-4 py-4">
                            <div v-if="row.suggestion" class="flex items-center gap-2">
                                <div class="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        :class="['h-full rounded-full', yieldImpactStyle(row.suggestion.yieldImpact).bar]"
                                        :style="{ width: `${Math.min(Math.max((row.suggestion.yieldImpact ?? 0) * 100, 4), 100)}%` }"
                                    ></div>
                                </div>
                                <span class="text-[11px] font-medium text-gray-600">
                                    {{ yieldImpactStyle(row.suggestion.yieldImpact).label }}
                                </span>
                            </div>
                            <span v-else class="text-gray-400">—</span>
                        </td>

                        <td class="px-4 py-4">
                            <span
                                class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                                :class="rowStatusBadge(row).class"
                            >
                                {{ rowStatusBadge(row).label }}
                            </span>
                        </td>

                        <td class="px-4 py-4">
                            <div
                                v-if="row.suggestion && row.suggestion.status === 'PENDING'"
                                class="flex justify-end gap-2"
                            >
                                <button
                                    type="button"
                                    class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    @click="emit('reject', row.suggestion)"
                                >
                                    거부
                                </button>
                                <button
                                    type="button"
                                    class="rounded-lg bg-[#15803D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
                                    @click="emit('apply', row.suggestion)"
                                >
                                    적용
                                </button>
                            </div>
                            <p
                                v-else-if="!row.suggestion && row.paramStatus === 'NORMAL'"
                                class="text-right text-xs text-gray-400"
                            >
                                ✓ 최적
                            </p>
                            <p v-else class="text-right text-gray-300">—</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

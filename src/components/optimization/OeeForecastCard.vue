<script setup>
import { computed } from 'vue'

const props = defineProps({
    currentOee: { type: Number, default: null },
    predictedOee: { type: Number, default: null },
    suggestions: { type: Array, default: () => [] },
})

const formatPercent = v => {
    if (v == null) return '-'
    return `${Number(v).toFixed(1)}%`
}

const delta = computed(() => {
    if (props.currentOee == null || props.predictedOee == null) return null
    return props.predictedOee - props.currentOee
})

const deltaLabel = computed(() => {
    if (delta.value == null) return ''
    const sign = delta.value >= 0 ? '+' : ''
    return `${sign}${delta.value.toFixed(1)}%p 개선 예상`
})

const avgConfidence = computed(() => {
    const pool = props.suggestions.map(s => s.confidence).filter(v => v != null)
    if (!pool.length) return null
    return (pool.reduce((a, b) => a + b, 0) / pool.length) * 100
})

const contributions = computed(() => {
    const seen = new Set()
    const unique = []
    for (const s of props.suggestions) {
        if (s.contributionScore == null) continue
        const key = s.parameterTag || s.tagName
        if (seen.has(key)) continue
        seen.add(key)
        unique.push(s)
    }
    return unique
        .sort((a, b) => (b.contributionScore ?? 0) - (a.contributionScore ?? 0))
        .slice(0, 3)
})
</script>

<template>
    <section class="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 class="text-xs font-bold text-gray-700">OEE 예측</h3>

        <div class="mt-3 flex items-baseline gap-2">
            <span class="text-xl font-bold text-gray-400">{{ formatPercent(currentOee) }}</span>
            <i class="fa-solid fa-arrow-right text-xs text-gray-300"></i>
            <span class="text-2xl font-bold text-[#15803D]">{{ formatPercent(predictedOee) }}</span>
        </div>

        <p v-if="deltaLabel" class="mt-1.5 text-[11px] font-semibold text-[#15803D]">
            {{ deltaLabel }}
            <span v-if="avgConfidence != null" class="ml-1 font-medium text-gray-500">
                · 신뢰도 {{ avgConfidence.toFixed(0) }}%
            </span>
        </p>

        <div v-if="contributions.length" class="mt-4 space-y-1.5 border-t border-gray-200 pt-3">
            <p class="text-[10px] font-semibold text-gray-500">상위 기여 파라미터</p>
            <div
                v-for="item in contributions"
                :key="item.parameterTag || item.suggestionId"
                class="flex items-center justify-between text-[11px]"
            >
                <span class="truncate text-gray-700">{{ item.tagName }}</span>
                <span class="font-semibold text-[#15803D]">
                    {{ ((item.contributionScore ?? 0) * 100).toFixed(1) }}%
                </span>
            </div>
        </div>
    </section>
</template>

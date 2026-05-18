<script setup>
import { computed } from 'vue'

const props = defineProps({
    parameter: { type: Object, required: true },
})

const status = computed(() => {
    const { currentValue, normalMin, normalMax } = props.parameter
    if (currentValue == null) return 'EMPTY'
    if (normalMin == null || normalMax == null) return 'NORMAL'

    if (currentValue >= normalMin && currentValue <= normalMax) return 'NORMAL'

    const range = normalMax - normalMin
    const tolerance = range > 0 ? range * 0.05 : Math.max(Math.abs(normalMax) * 0.05, 1)
    if (currentValue < normalMin - tolerance || currentValue > normalMax + tolerance) {
        return 'ABNORMAL'
    }
    return 'WARNING'
})

const statusStyle = computed(() => {
    switch (status.value) {
        case 'ABNORMAL':
            return {
                card: 'border-red-200 bg-red-50',
                badge: 'bg-red-100 text-red-700',
                label: '이상',
                value: 'text-red-700',
            }
        case 'WARNING':
            return {
                card: 'border-yellow-200 bg-yellow-50',
                badge: 'bg-yellow-100 text-yellow-700',
                label: '경고',
                value: 'text-yellow-800',
            }
        case 'EMPTY':
            return {
                card: 'border-gray-200 bg-gray-50',
                badge: 'bg-gray-200 text-gray-500',
                label: '수집 중',
                value: 'text-gray-400',
            }
        default:
            return {
                card: 'border-gray-200 bg-white',
                badge: 'bg-green-100 text-green-700',
                label: '정상',
                value: 'text-gray-900',
            }
    }
})

const formattedValue = computed(() => {
    const v = props.parameter.currentValue
    if (v == null) return '—'
    return Number.isInteger(v) ? v.toLocaleString() : Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
})

const hasRange = computed(
    () => props.parameter.normalMin != null && props.parameter.normalMax != null,
)
</script>

<template>
    <div :class="['rounded-xl border p-4', statusStyle.card]">
        <div class="flex items-center justify-between gap-2">
            <p class="truncate text-xs font-medium text-gray-500">
                {{ parameter.tagName }}
            </p>
            <span :class="['rounded-full px-2 py-0.5 text-[10px] font-bold', statusStyle.badge]">
                {{ statusStyle.label }}
            </span>
        </div>

        <p :class="['mt-2 text-xl font-bold', statusStyle.value]">
            {{ formattedValue }}
            <span v-if="parameter.currentValue != null" class="text-sm font-medium text-gray-500">
                {{ parameter.unit }}
            </span>
        </p>

        <p class="mt-1 text-[11px] text-gray-400">
            <template v-if="hasRange">
                목표 {{ parameter.normalMin }} ~ {{ parameter.normalMax }}{{ parameter.unit }}
            </template>
            <template v-else>
                목표 범위 미설정
            </template>
        </p>
    </div>
</template>

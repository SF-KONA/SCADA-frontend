<script setup>
import { computed } from 'vue'

const props = defineProps({
    history: { type: Array, default: () => [] },
    parameters: { type: Array, default: () => [] },
})

const normalize = v => (v == null ? '' : String(v).trim().toUpperCase())

const paramByTag = computed(() => {
    const map = new Map()
    for (const p of props.parameters) {
        const key = normalize(p.tagCode)
        if (key) map.set(key, p)
    }
    return map
})

const rows = computed(() =>
    props.history.map(item => {
        const param = paramByTag.value.get(normalize(item.parameterTag))
        return {
            ...item,
            tagName: item.tagName || param?.tagName || item.parameterTag || '-',
            unit: item.unit || param?.unit || '',
        }
    }),
)

const formatDate = iso => {
    if (!iso) return ''
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd}\n${hh}:${mi}`
}

const actionBadge = type => {
    if (type === 'REJECT') return { label: '거부', class: 'bg-gray-100 text-gray-500' }
    return { label: '적용', class: 'bg-green-100 text-green-700' }
}
</script>

<template>
    <section class="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 class="text-xs font-bold text-gray-700">최적화 적용 이력</h3>

        <div v-if="!rows.length" class="mt-3 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-6 text-center text-[11px] text-gray-400">
            데이터 누적 후 표시 예정
        </div>

        <ul v-else class="mt-3 space-y-2">
            <li
                v-for="(item, idx) in rows"
                :key="item.actionId ?? `${item.parameterTag}-${item.actedAt}-${idx}`"
                class="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
                <div class="whitespace-pre text-[10px] font-semibold leading-tight text-gray-400">
                    {{ formatDate(item.actedAt) }}
                </div>

                <div class="flex-1 text-[11px]">
                    <div class="flex items-center gap-1.5">
                        <span class="font-semibold text-gray-900">{{ item.tagName }}</span>
                        <span
                            :class="['rounded-full px-1.5 py-0.5 text-[9px] font-bold', actionBadge(item.actionType).class]"
                        >
                            {{ actionBadge(item.actionType).label }}
                        </span>
                    </div>
                    <p class="mt-0.5 text-gray-500">
                        {{ item.beforeValue }} → {{ item.afterValue }}{{ item.unit }}
                    </p>
                    <p v-if="item.comment" class="mt-0.5 truncate text-[10px] text-gray-400">
                        {{ item.comment }}
                    </p>
                </div>
            </li>
        </ul>
    </section>
</template>

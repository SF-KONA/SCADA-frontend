<script setup>
defineProps({
    history: { type: Array, default: () => [] },
})

const formatDate = iso => {
    if (!iso) return ''
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd}\n${hh}:${mi}`
}
</script>

<template>
    <section class="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 class="text-xs font-bold text-gray-700">최적화 적용 이력</h3>

        <div v-if="!history.length" class="mt-3 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-6 text-center text-[11px] text-gray-400">
            데이터 누적 후 표시 예정
        </div>

        <ul v-else class="mt-3 space-y-2">
            <li
                v-for="item in history"
                :key="item.actionId"
                class="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
                <div class="whitespace-pre text-[10px] font-semibold leading-tight text-gray-400">
                    {{ formatDate(item.actedAt) }}
                </div>

                <div class="flex-1 text-[11px]">
                    <p class="font-semibold text-gray-900">
                        {{ item.tagName }}
                        <span class="text-gray-500">
                            {{ item.beforeValue }} → {{ item.afterValue }}{{ item.unit }}
                        </span>
                    </p>
                    <p v-if="item.comment" class="mt-0.5 truncate text-[10px] text-gray-500">
                        {{ item.comment }}
                    </p>
                </div>
            </li>
        </ul>
    </section>
</template>

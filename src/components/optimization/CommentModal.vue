<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
    open: { type: Boolean, default: false },
    mode: { type: String, default: 'apply' },
    target: { type: Object, default: null },
    bulkCount: { type: Number, default: 0 },
})

const emit = defineEmits(['confirm', 'cancel'])

const comment = ref('')
const MAX = 200

watch(
    () => props.open,
    isOpen => {
        if (isOpen) comment.value = ''
    },
)

const config = computed(() => {
    if (props.mode === 'applyAll') {
        return {
            title: 'AI 제안 일괄 적용',
            confirmLabel: '전체 적용',
            confirmClass: 'bg-[#15803D] text-white hover:bg-[#166534]',
            placeholder: '일괄 적용 사유를 입력하세요. 200자 이내',
        }
    }
    if (props.mode === 'reject') {
        return {
            title: 'AI 제안 거부',
            confirmLabel: '거부',
            confirmClass: 'bg-red-600 text-white hover:bg-red-700',
            placeholder: '거부 사유를 입력하세요. 200자 이내',
        }
    }
    return {
        title: 'AI 제안 적용',
        confirmLabel: '적용',
        confirmClass: 'bg-[#15803D] text-white hover:bg-[#166534]',
        placeholder: '적용 사유를 입력하세요. 200자 이내',
    }
})

const isOverflow = computed(() => comment.value.length > MAX)
const isEmpty = computed(() => comment.value.trim().length === 0)
const isInvalid = computed(() => isOverflow.value || isEmpty.value)

const handleConfirm = () => {
    if (isInvalid.value) return
    emit('confirm', comment.value.trim())
}
</script>

<template>
    <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="emit('cancel')"
    >
        <div class="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div class="border-b border-gray-100 px-6 py-4">
                <h3 class="text-base font-bold text-gray-900">
                    {{ config.title }}
                </h3>

                <p v-if="mode === 'applyAll'" class="mt-1 text-sm text-gray-500">
                    PENDING {{ bulkCount }}건을 한 번에 적용합니다.
                </p>

                <p v-else-if="target" class="mt-1 text-sm text-gray-500">
                    {{ target.equipmentName }} · {{ target.tagName }}
                    <span class="text-gray-400">
                        ({{ target.currentValue }} → {{ target.suggestedValue }}{{ target.unit }})
                    </span>
                </p>
            </div>

            <div class="px-6 py-5">
                <textarea
                    v-model="comment"
                    rows="4"
                    class="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#15803D]"
                    :placeholder="config.placeholder"
                ></textarea>

                <div class="mt-2 flex items-center justify-between text-xs">
                    <span
                        v-if="isEmpty"
                        class="text-red-600"
                    >
                        변경 사유를 입력해주세요.
                    </span>
                    <span v-else></span>
                    <span :class="isOverflow ? 'text-red-600' : 'text-gray-400'">
                        {{ comment.length }} / {{ MAX }}
                    </span>
                </div>
            </div>

            <div class="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                    type="button"
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    @click="emit('cancel')"
                >
                    취소
                </button>
                <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    :class="config.confirmClass"
                    :disabled="isInvalid"
                    @click="handleConfirm"
                >
                    {{ config.confirmLabel }}
                </button>
            </div>
        </div>
    </div>
</template>

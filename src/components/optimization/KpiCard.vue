<script setup>
defineProps({
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    unit: { type: String, default: '' },
    delta: { type: String, default: '' },
    deltaTone: { type: String, default: 'neutral' },
    note: { type: String, default: '' },
    noteTone: { type: String, default: 'neutral' },
    empty: { type: Boolean, default: false },
})

const TONE_CLASSES = {
    positive: 'text-[#15803D]',
    negative: 'text-red-600',
    warning: 'text-yellow-700',
    neutral: 'text-gray-500',
}
</script>

<template>
    <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="text-sm text-gray-500">
            {{ label }}
        </p>

        <p
            :class="[
                'mt-2',
                empty
                    ? 'text-base font-semibold text-gray-400'
                    : 'text-2xl font-bold text-gray-900',
            ]"
        >
            {{ value }}<span v-if="unit && !empty" class="ml-1 text-sm font-medium text-gray-500">{{ unit }}</span>
        </p>

        <p v-if="delta" :class="['mt-2 text-xs font-semibold', TONE_CLASSES[deltaTone]]">
            {{ delta }}
        </p>

        <p v-if="note" :class="['mt-1 text-xs', TONE_CLASSES[noteTone]]">
            {{ note }}
        </p>
    </div>
</template>

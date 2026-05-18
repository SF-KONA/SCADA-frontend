<script setup>
import { ref } from 'vue'

const props = defineProps({
    parameters: { type: Array, default: () => [] },
})

const emit = defineEmits(['update'])

const parameterValues = ref({})
const parameterComments = ref({})

const handleSubmit = parameter => {
    emit('update', {
        parameter,
        newValue: parameterValues.value[parameter.paramId],
        comment: parameterComments.value[parameter.paramId] || '',
        onSuccess: () => {
            parameterValues.value[parameter.paramId] = ''
            parameterComments.value[parameter.paramId] = ''
        },
    })
}
</script>

<template>
    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-5">
            <h2 class="text-lg font-bold text-gray-900">
                수동 제어 파라미터
            </h2>
            <p class="mt-1 text-sm text-gray-500">
                운영자 판단에 따라 설비 파라미터를 직접 변경합니다.
            </p>
        </div>

        <div v-if="!parameters.length" class="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
            제어 가능 파라미터가 없습니다.
        </div>

        <div v-else class="overflow-hidden rounded-xl border border-gray-200">
            <table class="w-full border-collapse text-left text-sm">
                <thead class="bg-gray-50 text-gray-600">
                    <tr>
                        <th class="px-4 py-3 font-semibold">태그</th>
                        <th class="px-4 py-3 font-semibold">현재값</th>
                        <th class="px-4 py-3 font-semibold">정상 범위</th>
                        <th class="px-4 py-3 font-semibold">변경값</th>
                        <th class="px-4 py-3 font-semibold">변경 사유</th>
                        <th class="px-4 py-3 font-semibold">제어</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-gray-100 bg-white">
                    <tr v-for="parameter in parameters" :key="parameter.paramId">
                        <td class="px-4 py-4">
                            <p class="font-semibold text-gray-900">{{ parameter.tagName }}</p>
                            <p class="mt-1 text-xs text-gray-400">{{ parameter.tagCode }}</p>
                        </td>

                        <td class="px-4 py-4 font-bold text-gray-900">
                            {{ parameter.currentValue ?? '-' }}{{ parameter.unit }}
                        </td>

                        <td class="px-4 py-4 text-gray-600">
                            <template v-if="parameter.normalMin != null && parameter.normalMax != null">
                                {{ parameter.normalMin }} ~ {{ parameter.normalMax }}{{ parameter.unit }}
                            </template>
                            <span v-else class="text-gray-400">-</span>
                        </td>

                        <td class="px-4 py-4">
                            <input
                                v-model="parameterValues[parameter.paramId]"
                                type="number"
                                class="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-[#15803D]"
                                placeholder="값"
                            />
                        </td>

                        <td class="px-4 py-4">
                            <input
                                v-model="parameterComments[parameter.paramId]"
                                type="text"
                                maxlength="200"
                                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-[#15803D]"
                                placeholder="변경 사유"
                            />
                        </td>

                        <td class="px-4 py-4">
                            <button
                                type="button"
                                class="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                                :disabled="!parameterValues[parameter.paramId]"
                                @click="handleSubmit(parameter)"
                            >
                                변경
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p class="mt-4 text-xs text-gray-400">
            정상 범위를 벗어난 값도 운영자 판단에 따라 변경은 허용되며, 변경 이력은 audit 로그로 기록됩니다.
        </p>
    </section>
</template>

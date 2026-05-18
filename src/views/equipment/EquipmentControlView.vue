<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEquipmentControlStore } from '@/stores/equipmentControlStore'

const equipmentControlStore = useEquipmentControlStore()

const suggestionComments = ref({})
const parameterValues = ref({})
const parameterComments = ref({})

const controlSummary = computed(() => [
    { label: '대기 제안', value: equipmentControlStore.pendingSuggestions.length, tone: 'text-orange-600' },
    { label: '적용 완료', value: equipmentControlStore.appliedSuggestions.length, tone: 'text-green-700' },
    { label: '거부', value: equipmentControlStore.rejectedSuggestions.length, tone: 'text-red-600' },
    { label: '제어 가능 태그', value: equipmentControlStore.controllableParameters.length, tone: 'text-gray-900' },
])

const getOeeDelta = suggestion => {
    const delta = suggestion.predictedOee - suggestion.currentOee
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
}

const handleApplySuggestion = async suggestionId => {
    try {
        equipmentControlStore.clearMessage()

        await equipmentControlStore.applySuggestion(
            suggestionId,
            suggestionComments.value[suggestionId] || '',
        )
    } catch (error) {
        equipmentControlStore.errorMessage = error.message || 'AI 제안 적용 중 오류가 발생했습니다.'
    }
}

const handleRejectSuggestion = async suggestionId => {
    try {
        equipmentControlStore.clearMessage()

        await equipmentControlStore.rejectSuggestion(
            suggestionId,
            suggestionComments.value[suggestionId] || '',
        )
    } catch (error) {
        equipmentControlStore.errorMessage = error.message || 'AI 제안 거부 중 오류가 발생했습니다.'
    }
}

const handleUpdateParameter = async parameter => {
    try {
        equipmentControlStore.clearMessage()

        await equipmentControlStore.updateParameter({
            paramId: parameter.paramId,
            newValue: parameterValues.value[parameter.paramId],
            comment: parameterComments.value[parameter.paramId] || '',
        })

        parameterValues.value[parameter.paramId] = ''
        parameterComments.value[parameter.paramId] = ''
    } catch (error) {
        equipmentControlStore.errorMessage = error.message || '파라미터 변경 중 오류가 발생했습니다.'
    }
}

onMounted(() => {
    equipmentControlStore.loadMockSuggestions()
    equipmentControlStore.loadMockControllableParameters('FURN_01')
})
</script>

<template>
    <div class="mx-auto w-full max-w-[1480px] space-y-6 pb-10">
        <div class="flex items-end justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-5">
            <div>
                <p class="text-xs font-semibold uppercase text-gray-500">
                    Equipment Control
                </p>
                <h1 class="mt-1 text-2xl font-bold text-gray-950">
                    설비 파라미터 제어
                </h1>
            </div>

            <div class="text-right text-xs text-gray-500">
                <p>선택 설비</p>
                <p class="mt-1 font-mono text-sm font-semibold text-gray-900">
                    {{ equipmentControlStore.selectedEquipmentId }}
                </p>
            </div>
        </div>

        <!-- 피드백 메시지 -->
        <div
            v-if="equipmentControlStore.successMessage"
            class="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
            {{ equipmentControlStore.successMessage }}
        </div>

        <div
            v-if="equipmentControlStore.errorMessage"
            class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
            {{ equipmentControlStore.errorMessage }}
        </div>

        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
                v-for="item in controlSummary"
                :key="item.label"
                class="rounded-lg border border-gray-200 bg-white px-6 py-5"
            >
                <p class="text-xs font-semibold text-gray-500">
                    {{ item.label }}
                </p>
                <p class="mt-1 font-mono text-2xl font-bold" :class="item.tone">
                    {{ item.value }}
                </p>
            </div>
        </section>

        <!-- 제어 제안 목록 -->
        <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
                <div>
                    <h2 class="text-base font-bold text-gray-900">
                        제어 제안 검토
                    </h2>
                    <p class="mt-1 text-sm text-gray-500">
                        공정 효율 예측값을 확인한 뒤 적용 또는 거부합니다.
                    </p>
                </div>

                <span class="rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-700">
                    PENDING {{ equipmentControlStore.pendingSuggestions.length }}
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[1180px] border-collapse text-left text-sm">
                    <thead class="border-b border-gray-200 bg-gray-100 text-gray-600">
                        <tr>
                            <th class="px-5 py-4 font-semibold">상태</th>
                            <th class="px-5 py-4 font-semibold">설비</th>
                            <th class="px-5 py-4 font-semibold">태그</th>
                            <th class="px-5 py-4 text-right font-semibold">현재값</th>
                            <th class="px-5 py-4 text-right font-semibold">제안값</th>
                            <th class="px-5 py-4 text-right font-semibold">OEE</th>
                            <th class="px-5 py-4 text-right font-semibold">예측</th>
                            <th class="px-5 py-4 text-right font-semibold">영향/신뢰</th>
                            <th class="px-5 py-4 font-semibold">처리 사유</th>
                            <th class="px-5 py-4 text-right font-semibold">작업</th>
                        </tr>
                    </thead>

                    <tbody class="divide-y divide-gray-100">
                        <tr
                            v-for="suggestion in equipmentControlStore.suggestions"
                            :key="suggestion.suggestionId"
                            class="hover:bg-gray-50"
                        >
                            <td class="px-5 py-5">
                                <span
                                    class="inline-flex min-w-20 justify-center rounded border px-2.5 py-1.5 text-xs font-bold"
                                    :class="{
                                        'border-orange-200 bg-orange-50 text-orange-700': suggestion.status === 'PENDING',
                                        'border-green-200 bg-green-50 text-green-700': suggestion.status === 'APPLIED',
                                        'border-red-200 bg-red-50 text-red-700': suggestion.status === 'REJECTED',
                                    }"
                                >
                                    {{ suggestion.status }}
                                </span>
                            </td>

                            <td class="px-5 py-5">
                                <p class="font-semibold text-gray-900">
                                    {{ suggestion.equipmentName }}
                                </p>
                                <p class="mt-0.5 font-mono text-[11px] text-gray-500">
                                    {{ suggestion.equipmentId }}
                                </p>
                            </td>

                            <td class="px-5 py-5">
                                <p class="font-semibold text-gray-800">
                                    {{ suggestion.tagName }}
                                </p>
                                <p class="mt-0.5 font-mono text-[11px] text-gray-500">
                                    {{ suggestion.parameterTag }}
                                </p>
                            </td>

                            <td class="px-5 py-5 text-right font-mono font-semibold text-gray-900">
                                {{ suggestion.currentValue }}{{ suggestion.unit }}
                            </td>

                            <td class="px-5 py-5 text-right font-mono font-bold text-gray-950">
                                {{ suggestion.suggestedValue }}{{ suggestion.unit }}
                            </td>

                            <td class="px-5 py-5 text-right font-mono text-gray-700">
                                {{ suggestion.currentOee }}%
                            </td>

                            <td class="px-5 py-5 text-right">
                                <p class="font-mono font-bold text-green-700">
                                    {{ suggestion.predictedOee }}%
                                </p>
                                <p class="font-mono text-[11px] text-green-700">
                                    {{ getOeeDelta(suggestion) }}%p
                                </p>
                            </td>

                            <td class="px-5 py-5 text-right font-mono text-gray-700">
                                {{ suggestion.yieldImpact }} / {{ suggestion.confidence }}
                            </td>

                            <td class="px-5 py-5">
                                <textarea
                                    v-model="suggestionComments[suggestion.suggestionId]"
                                    class="h-20 w-72 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#15803D]"
                                    placeholder="적용/거부 사유"
                                    :disabled="suggestion.status !== 'PENDING'"
                                ></textarea>
                            </td>

                            <td class="px-5 py-5">
                                <div class="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        class="rounded-md border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        :disabled="suggestion.status !== 'PENDING'"
                                        @click="handleRejectSuggestion(suggestion.suggestionId)"
                                    >
                                        거부
                                    </button>

                                    <button
                                        type="button"
                                        class="rounded-md bg-[#15803D] px-4 py-2 text-sm font-bold text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-40"
                                        :disabled="suggestion.status !== 'PENDING'"
                                        @click="handleApplySuggestion(suggestion.suggestionId)"
                                    >
                                        적용
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 제어 가능 파라미터 -->
        <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div class="border-b border-gray-200 bg-gray-50 px-6 py-5">
                <h2 class="text-base font-bold text-gray-900">
                    제어 가능 파라미터
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                    운영자 판단에 따라 설비 파라미터를 직접 변경합니다.
                </p>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[980px] border-collapse text-left text-sm">
                    <thead class="border-b border-gray-200 bg-gray-100 text-gray-600">
                        <tr>
                            <th class="px-5 py-4 font-semibold">설비/태그</th>
                            <th class="px-5 py-4 text-right font-semibold">현재값</th>
                            <th class="px-5 py-4 text-right font-semibold">정상 범위</th>
                            <th class="px-5 py-4 font-semibold">구분</th>
                            <th class="px-5 py-4 font-semibold">변경값</th>
                            <th class="px-5 py-4 font-semibold">변경 사유</th>
                            <th class="px-5 py-4 text-right font-semibold">제어</th>
                        </tr>
                    </thead>

                    <tbody class="divide-y divide-gray-100">
                        <tr
                            v-for="parameter in equipmentControlStore.controllableParameters"
                            :key="parameter.paramId"
                            class="hover:bg-gray-50"
                        >
                            <td class="px-5 py-5">
                                <p class="font-semibold text-gray-900">
                                    {{ parameter.tagName }}
                                </p>
                                <p class="mt-0.5 font-mono text-[11px] text-gray-500">
                                    {{ parameter.tagCode }}
                                </p>
                            </td>

                            <td class="px-5 py-5 text-right font-mono font-bold text-gray-900">
                                {{ parameter.currentValue }}{{ parameter.unit }}
                            </td>

                            <td class="px-5 py-5 text-right font-mono text-gray-600">
                                {{ parameter.normalMin }} ~ {{ parameter.normalMax }}{{ parameter.unit }}
                            </td>

                            <td class="px-5 py-5">
                                <span class="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-600">
                                    {{ parameter.paramCategory }}
                                </span>
                            </td>

                            <td class="px-5 py-5">
                                <input
                                    v-model="parameterValues[parameter.paramId]"
                                    type="number"
                                    class="w-32 rounded-md border border-gray-300 bg-white px-3 py-2.5 font-mono text-gray-900 outline-none focus:border-[#15803D]"
                                    placeholder="값"
                                />
                            </td>

                            <td class="px-5 py-5">
                                <input
                                    v-model="parameterComments[parameter.paramId]"
                                    type="text"
                                    class="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-[#15803D]"
                                    placeholder="변경 사유"
                                />
                            </td>

                            <td class="px-5 py-5 text-right">
                                <button
                                    type="button"
                                    class="rounded-md bg-[#F97316] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                                    @click="handleUpdateParameter(parameter)"
                                >
                                    변경
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p class="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-500">
                API 명세서 기준으로 정상 범위를 벗어난 값도 운영자 판단에 따라 변경은 허용되며, 변경 이력은 audit 로그로 기록됩니다.
            </p>
        </section>
    </div>
</template>

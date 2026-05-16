<script setup>
import { onMounted, ref } from 'vue'
import { useEquipmentControlStore } from '@/stores/equipmentControlStore'

const equipmentControlStore = useEquipmentControlStore()

const suggestionComments = ref({})
const parameterValues = ref({})
const parameterComments = ref({})

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
    <div class="space-y-6">
        <!-- 피드백 메시지 -->
        <div
            v-if="equipmentControlStore.successMessage"
            class="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
            {{ equipmentControlStore.successMessage }}
        </div>

        <div
            v-if="equipmentControlStore.errorMessage"
            class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
            {{ equipmentControlStore.errorMessage }}
        </div>

        <!-- AI 제안 목록 -->
        <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="mb-5 flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-bold text-gray-900">
                        AI 제안 목록
                    </h2>
                    <p class="mt-1 text-sm text-gray-500">
                        수율 영향도와 신뢰도를 기준으로 공정 파라미터 변경을 제안합니다.
                    </p>
                </div>

                <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    PENDING {{ equipmentControlStore.pendingSuggestions.length }}건
                </span>
            </div>

            <div class="grid gap-5 lg:grid-cols-2">
                <article
                    v-for="suggestion in equipmentControlStore.suggestions"
                    :key="suggestion.suggestionId"
                    class="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-sm font-semibold text-[#15803D]">
                                {{ suggestion.equipmentName }}
                            </p>
                            <h3 class="mt-1 text-base font-bold text-gray-900">
                                {{ suggestion.tagName }}
                            </h3>
                        </div>

                        <span
                            class="rounded-full px-3 py-1 text-xs font-bold"
                            :class="{
                                'bg-yellow-100 text-yellow-700': suggestion.status === 'PENDING',
                                'bg-green-100 text-green-700': suggestion.status === 'APPLIED',
                                'bg-red-100 text-red-700': suggestion.status === 'REJECTED',
                            }"
                        >
                            {{ suggestion.status }}
                        </span>
                    </div>

                    <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div class="rounded-xl border border-gray-200 bg-white p-4">
                            <p class="text-gray-500">
                                현재값
                            </p>
                            <p class="mt-1 text-xl font-bold text-gray-900">
                                {{ suggestion.currentValue }}{{ suggestion.unit }}
                            </p>
                        </div>

                        <div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <p class="text-blue-600">
                                AI 제안값
                            </p>
                            <p class="mt-1 text-xl font-bold text-blue-700">
                                {{ suggestion.suggestedValue }}{{ suggestion.unit }}
                            </p>
                        </div>

                        <div class="rounded-xl border border-gray-200 bg-white p-4">
                            <p class="text-gray-500">
                                현재 OEE
                            </p>
                            <p class="mt-1 text-xl font-bold text-gray-900">
                                {{ suggestion.currentOee }}%
                            </p>
                        </div>

                        <div class="rounded-xl border border-green-100 bg-green-50 p-4">
                            <p class="text-[#15803D]">
                                예측 OEE
                            </p>
                            <p class="mt-1 text-xl font-bold text-[#15803D]">
                                {{ suggestion.predictedOee }}%
                            </p>
                        </div>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <p class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600">
                            수율 영향도:
                            <strong class="text-gray-900">{{ suggestion.yieldImpact }}</strong>
                        </p>
                        <p class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600">
                            신뢰도:
                            <strong class="text-gray-900">{{ suggestion.confidence }}</strong>
                        </p>
                    </div>

                    <textarea
                        v-model="suggestionComments[suggestion.suggestionId]"
                        class="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#15803D]"
                        rows="3"
                        placeholder="적용 또는 거부 사유를 입력하세요. 200자 이내"
                        :disabled="suggestion.status !== 'PENDING'"
                    ></textarea>

                    <div class="mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            class="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="suggestion.status !== 'PENDING'"
                            @click="handleRejectSuggestion(suggestion.suggestionId)"
                        >
                            거부
                        </button>

                        <button
                            type="button"
                            class="rounded-lg bg-[#15803D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="suggestion.status !== 'PENDING'"
                            @click="handleApplySuggestion(suggestion.suggestionId)"
                        >
                            적용
                        </button>
                    </div>
                </article>
            </div>
        </section>

        <!-- 제어 가능 파라미터 -->
        <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="mb-5">
                <h2 class="text-lg font-bold text-gray-900">
                    제어 가능 파라미터
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                    운영자 판단에 따라 설비 파라미터를 직접 변경합니다.
                </p>
            </div>

            <div class="overflow-hidden rounded-xl border border-gray-200">
                <table class="w-full border-collapse text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                        <tr>
                            <th class="px-4 py-3 font-semibold">
                                태그
                            </th>
                            <th class="px-4 py-3 font-semibold">
                                현재값
                            </th>
                            <th class="px-4 py-3 font-semibold">
                                정상 범위
                            </th>
                            <th class="px-4 py-3 font-semibold">
                                변경값
                            </th>
                            <th class="px-4 py-3 font-semibold">
                                변경 사유
                            </th>
                            <th class="px-4 py-3 font-semibold">
                                제어
                            </th>
                        </tr>
                    </thead>

                    <tbody class="divide-y divide-gray-100 bg-white">
                        <tr
                            v-for="parameter in equipmentControlStore.controllableParameters"
                            :key="parameter.paramId"
                        >
                            <td class="px-4 py-4">
                                <p class="font-semibold text-gray-900">
                                    {{ parameter.tagName }}
                                </p>
                                <p class="mt-1 text-xs text-gray-400">
                                    {{ parameter.tagCode }}
                                </p>
                            </td>

                            <td class="px-4 py-4 font-bold text-gray-900">
                                {{ parameter.currentValue }}{{ parameter.unit }}
                            </td>

                            <td class="px-4 py-4 text-gray-600">
                                {{ parameter.normalMin }} ~ {{ parameter.normalMax }}{{ parameter.unit }}
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
                                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-[#15803D]"
                                    placeholder="변경 사유"
                                />
                            </td>

                            <td class="px-4 py-4">
                                <button
                                    type="button"
                                    class="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                                    @click="handleUpdateParameter(parameter)"
                                >
                                    변경
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p class="mt-4 text-xs text-gray-400">
                API 명세서 기준으로 정상 범위를 벗어난 값도 운영자 판단에 따라 변경은 허용되며, 변경 이력은 audit 로그로 기록됩니다.
            </p>
        </section>
    </div>
</template>

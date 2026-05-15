<script setup>
import { onMounted, ref } from 'vue'
import { useEquipmentControlStore } from '../../stores/equipmentControlStore'

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
    <main class="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <section class="mx-auto max-w-6xl space-y-8">
            <div>
                <p class="text-sm font-semibold text-orange-400">
                    DB HiTek Smart Factory
                </p>
                <h1 class="mt-2 text-3xl font-bold text-white">
                    설비 제어 / AI 최적화
                </h1>
                <p class="mt-2 text-sm text-slate-400">
                    AI 제안값을 검토하고, 제어 가능 파라미터를 수동으로 변경합니다.
                </p>
            </div>

            <div
                v-if="equipmentControlStore.successMessage"
                class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300"
            >
                {{ equipmentControlStore.successMessage }}
            </div>

            <div
                v-if="equipmentControlStore.errorMessage"
                class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
                {{ equipmentControlStore.errorMessage }}
            </div>

            <section class="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                <div class="mb-5 flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            AI 제안 목록
                        </h2>
                        <p class="mt-1 text-sm text-slate-400">
                            수율 영향도와 신뢰도를 기준으로 공정 파라미터 변경을 제안합니다.
                        </p>
                    </div>

                    <span class="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                        PENDING {{ equipmentControlStore.pendingSuggestions.length }}건
                    </span>
                </div>

                <div class="grid gap-5 lg:grid-cols-2">
                    <article
                        v-for="suggestion in equipmentControlStore.suggestions"
                        :key="suggestion.suggestionId"
                        class="rounded-2xl border border-slate-700 bg-slate-950 p-5"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-blue-300">
                                    {{ suggestion.equipmentName }}
                                </p>
                                <h3 class="mt-1 text-lg font-bold text-white">
                                    {{ suggestion.tagName }}
                                </h3>
                            </div>

                            <span
                                class="rounded-full px-3 py-1 text-xs font-bold"
                                :class="{
                                    'bg-yellow-500/10 text-yellow-300': suggestion.status === 'PENDING',
                                    'bg-green-500/10 text-green-300': suggestion.status === 'APPLIED',
                                    'bg-red-500/10 text-red-300': suggestion.status === 'REJECTED',
                                }"
                            >
                                {{ suggestion.status }}
                            </span>
                        </div>

                        <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <div class="rounded-xl bg-slate-900 p-4">
                                <p class="text-slate-400">
                                    현재값
                                </p>
                                <p class="mt-1 text-xl font-bold text-white">
                                    {{ suggestion.currentValue }}{{ suggestion.unit }}
                                </p>
                            </div>

                            <div class="rounded-xl bg-blue-500/10 p-4">
                                <p class="text-blue-300">
                                    AI 제안값
                                </p>
                                <p class="mt-1 text-xl font-bold text-blue-200">
                                    {{ suggestion.suggestedValue }}{{ suggestion.unit }}
                                </p>
                            </div>

                            <div class="rounded-xl bg-slate-900 p-4">
                                <p class="text-slate-400">
                                    현재 OEE
                                </p>
                                <p class="mt-1 text-xl font-bold text-white">
                                    {{ suggestion.currentOee }}%
                                </p>
                            </div>

                            <div class="rounded-xl bg-green-500/10 p-4">
                                <p class="text-green-300">
                                    예측 OEE
                                </p>
                                <p class="mt-1 text-xl font-bold text-green-200">
                                    {{ suggestion.predictedOee }}%
                                </p>
                            </div>
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <p class="rounded-lg bg-slate-900 px-3 py-2 text-slate-300">
                                수율 영향도:
                                <strong class="text-white">{{ suggestion.yieldImpact }}</strong>
                            </p>
                            <p class="rounded-lg bg-slate-900 px-3 py-2 text-slate-300">
                                신뢰도:
                                <strong class="text-white">{{ suggestion.confidence }}</strong>
                            </p>
                        </div>

                        <textarea
                            v-model="suggestionComments[suggestion.suggestionId]"
                            class="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                            rows="3"
                            placeholder="적용 또는 거부 사유를 입력하세요. 200자 이내"
                            :disabled="suggestion.status !== 'PENDING'"
                        ></textarea>

                        <div class="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                class="rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                :disabled="suggestion.status !== 'PENDING'"
                                @click="handleRejectSuggestion(suggestion.suggestionId)"
                            >
                                거부
                            </button>

                            <button
                                type="button"
                                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                :disabled="suggestion.status !== 'PENDING'"
                                @click="handleApplySuggestion(suggestion.suggestionId)"
                            >
                                적용
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <section class="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                <div class="mb-5">
                    <h2 class="text-xl font-bold text-white">
                        제어 가능 파라미터
                    </h2>
                    <p class="mt-1 text-sm text-slate-400">
                        운영자 판단에 따라 설비 파라미터를 직접 변경합니다.
                    </p>
                </div>

                <div class="overflow-hidden rounded-2xl border border-slate-700">
                    <table class="w-full border-collapse text-left text-sm">
                        <thead class="bg-slate-950 text-slate-300">
                            <tr>
                                <th class="px-4 py-3">
                                    태그
                                </th>
                                <th class="px-4 py-3">
                                    현재값
                                </th>
                                <th class="px-4 py-3">
                                    정상 범위
                                </th>
                                <th class="px-4 py-3">
                                    변경값
                                </th>
                                <th class="px-4 py-3">
                                    변경 사유
                                </th>
                                <th class="px-4 py-3">
                                    제어
                                </th>
                            </tr>
                        </thead>

                        <tbody class="divide-y divide-slate-800 bg-slate-900">
                            <tr
                                v-for="parameter in equipmentControlStore.controllableParameters"
                                :key="parameter.paramId"
                            >
                                <td class="px-4 py-4">
                                    <p class="font-semibold text-white">
                                        {{ parameter.tagName }}
                                    </p>
                                    <p class="mt-1 text-xs text-slate-500">
                                        {{ parameter.tagCode }}
                                    </p>
                                </td>

                                <td class="px-4 py-4 font-bold text-white">
                                    {{ parameter.currentValue }}{{ parameter.unit }}
                                </td>

                                <td class="px-4 py-4 text-slate-300">
                                    {{ parameter.normalMin }} ~ {{ parameter.normalMax }}{{ parameter.unit }}
                                </td>

                                <td class="px-4 py-4">
                                    <input
                                        v-model="parameterValues[parameter.paramId]"
                                        type="number"
                                        class="w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                                        placeholder="값"
                                    />
                                </td>

                                <td class="px-4 py-4">
                                    <input
                                        v-model="parameterComments[parameter.paramId]"
                                        type="text"
                                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                                        placeholder="변경 사유"
                                    />
                                </td>

                                <td class="px-4 py-4">
                                    <button
                                        type="button"
                                        class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                                        @click="handleUpdateParameter(parameter)"
                                    >
                                        변경
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p class="mt-4 text-xs text-slate-500">
                    API 명세서 기준으로 정상 범위를 벗어난 값도 운영자 판단에 따라 변경은 허용되며, 변경 이력은 audit 로그로 기록됩니다.
                </p>
            </section>
        </section>
    </main>
</template>
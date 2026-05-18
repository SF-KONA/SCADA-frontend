<script setup>
import { computed, onMounted, ref } from 'vue'
import { useOptimizationStore } from '@/stores/optimizationStore'
import CommentModal from '@/components/optimization/CommentModal.vue'
import EquipmentParamCard from '@/components/optimization/EquipmentParamCard.vue'
import KpiCard from '@/components/optimization/KpiCard.vue'
import SuggestionTable from '@/components/optimization/SuggestionTable.vue'
import OeeForecastCard from '@/components/optimization/OeeForecastCard.vue'
import OptimizationHistoryList from '@/components/optimization/OptimizationHistoryList.vue'
import ManualControlPanel from '@/components/optimization/ManualControlPanel.vue'

const store = useOptimizationStore()

const modalState = ref({
    open: false,
    mode: 'apply',
    target: null,
    bulkCount: 0,
})

const openApplyModal = suggestion => {
    modalState.value = { open: true, mode: 'apply', target: suggestion, bulkCount: 0 }
}

const openRejectModal = suggestion => {
    modalState.value = { open: true, mode: 'reject', target: suggestion, bulkCount: 0 }
}

const openApplyAllModal = () => {
    modalState.value = {
        open: true,
        mode: 'applyAll',
        target: null,
        bulkCount: store.pendingCount,
    }
}

const closeModal = () => {
    modalState.value = { ...modalState.value, open: false }
}

const handleConfirm = async comment => {
    const { mode, target } = modalState.value
    closeModal()

    try {
        store.clearMessage()
        if (mode === 'apply' && target) {
            await store.applyOne(target.suggestionId, comment)
            store.successMessage = 'AI 제안을 적용했습니다.'
        } else if (mode === 'reject' && target) {
            await store.rejectOne(target.suggestionId, comment)
            store.successMessage = 'AI 제안을 거부했습니다.'
        } else if (mode === 'applyAll') {
            await store.applyAllPending(comment)
        }
    } catch (error) {
        store.errorMessage =
            error?.response?.data?.message || error?.message || '처리 중 오류가 발생했습니다.'
    }
}

const handleManualUpdate = async ({ parameter, newValue, comment, onSuccess }) => {
    try {
        store.clearMessage()
        await store.updateParameter({
            equipmentId: parameter.equipmentId || store.selectedEquipmentId,
            paramId: parameter.paramId,
            newValue,
            comment,
        })
        store.successMessage = `${parameter.tagName} 값을 변경했습니다.`
        onSuccess?.()
    } catch (error) {
        store.errorMessage =
            error?.response?.data?.message || error?.message || '파라미터 변경 중 오류가 발생했습니다.'
    }
}

const lastApplied = computed(() => store.lastAppliedAction)

const lastAppliedLabel = computed(() => {
    if (!lastApplied.value) return '이력 없음'
    const d = new Date(lastApplied.value.actedAt)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd} ${hh}:${mi}`
})

const lastAppliedNote = computed(() => {
    const last = lastApplied.value
    if (!last) return '적용 후 누적 표시'
    if (!last.tagName) return '✓ 성공'
    return `${last.tagName} ${last.beforeValue} → ${last.afterValue}${last.unit || ''}`
})

const oeeDeltaInfo = computed(() => {
    const delta = store.oeeDelta
    if (delta == null) return { label: '', tone: 'neutral' }
    const sign = delta >= 0 ? '+' : ''
    return {
        label: `${sign}${delta.toFixed(1)}%p 개선 예상`,
        tone: delta >= 0 ? 'positive' : 'negative',
    }
})

const formatPercent = v => (v == null ? '—' : `${Number(v).toFixed(1)}%`)

onMounted(async () => {
    await store.fetchSuggestions()
    const equipmentIds = [
        store.selectedEquipmentId,
        ...store.suggestions.map(s => s.equipmentId),
    ]
    await Promise.all([
        store.fetchControllableParametersForEquipments(equipmentIds),
        store.fetchHistory(store.selectedEquipmentId),
    ])
})
</script>

<template>
    <div class="space-y-6">
        <!-- 페이지 헤더 -->
        <header class="flex items-end justify-between">
            <div>
                <p class="text-xs font-medium text-gray-400">공정 설비 / STEP 02</p>
                <h1 class="mt-1 text-xl font-bold text-gray-900">
                    산화 공정 — 파라미터 최적화
                </h1>
            </div>
            <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <i class="fa-solid fa-circle-check mr-1"></i>
                AI 분석 완료
            </span>
        </header>

        <!-- 피드백 메시지 -->
        <div
            v-if="store.successMessage"
            class="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
            {{ store.successMessage }}
        </div>
        <div
            v-if="store.errorMessage"
            class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
            {{ store.errorMessage }}
        </div>

        <!-- 환경변수 placeholder (다른 팀원 작업) -->
        <section
            class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-xs text-gray-400"
        >
            <i class="fa-solid fa-temperature-three-quarters mr-2"></i>
            클린룸 환경변수 영역 (별도 작업 예정)
        </section>

        <!-- 설비 변수 카드 row -->
        <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-gray-900">설비 변수 · 실시간</h2>
                    <p class="mt-0.5 text-xs text-gray-500">{{ store.selectedEquipmentId }}</p>
                </div>
                <span
                    v-if="store.abnormalParamCount > 0"
                    class="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700"
                >
                    이상 {{ store.abnormalParamCount }}건
                </span>
            </div>

            <div v-if="!store.controllableParameters.length" class="py-6 text-center text-xs text-gray-400">
                <i class="fa-solid fa-spinner fa-spin mr-1"></i>
                파라미터 정보를 수집 중입니다.
            </div>
            <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <EquipmentParamCard
                    v-for="param in store.controllableParameters"
                    :key="param.paramId"
                    :parameter="param"
                />
            </div>
        </section>

        <!-- KPI 4종 고정 -->
        <section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
                label="현재 OEE"
                :value="formatPercent(store.currentOee)"
                :empty="store.currentOee == null"
                :note="store.currentOee != null && store.currentOee < 80 ? '목표 미달' : ''"
                note-tone="negative"
            />
            <KpiCard
                label="AI 예측 OEE"
                :value="formatPercent(store.predictedOee)"
                :empty="store.predictedOee == null"
                :delta="oeeDeltaInfo.label"
                :delta-tone="oeeDeltaInfo.tone"
            />
            <KpiCard
                label="이상 파라미터"
                :value="store.abnormalParamCount"
                unit="건"
                :note="store.abnormalParamCount > 0 ? '조정 필요' : '정상'"
                :note-tone="store.abnormalParamCount > 0 ? 'warning' : 'positive'"
            />
            <KpiCard
                label="마지막 최적화 적용"
                :value="lastAppliedLabel"
                :empty="!lastApplied"
                :note="lastAppliedNote"
                :note-tone="lastApplied ? 'positive' : 'neutral'"
            />
        </section>

        <!-- 메인 컨텐츠: 좌측 테이블 + 우측 사이드 (테이블 3/4) -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div class="lg:col-span-3">
                <SuggestionTable
                    :suggestions="store.suggestions"
                    :parameters="store.controllableParameters"
                    :pending-count="store.pendingCount"
                    :abnormal-count="store.abnormalParamCount"
                    :is-applying="store.isApplying"
                    @apply="openApplyModal"
                    @reject="openRejectModal"
                    @apply-all="openApplyAllModal"
                />
            </div>

            <aside class="space-y-4">
                <OeeForecastCard
                    :current-oee="store.currentOee"
                    :predicted-oee="store.predictedOee"
                    :suggestions="store.suggestions"
                />
                <OptimizationHistoryList
                    :history="store.history"
                    :parameters="store.controllableParameters"
                />
            </aside>
        </div>

        <!-- 수동 제어 -->
        <ManualControlPanel
            :parameters="store.controllableParameters"
            @update="handleManualUpdate"
        />

        <CommentModal
            :open="modalState.open"
            :mode="modalState.mode"
            :target="modalState.target"
            :bulk-count="modalState.bulkCount"
            @confirm="handleConfirm"
            @cancel="closeModal"
        />
    </div>
</template>

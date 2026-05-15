<script setup>
import { computed } from 'vue'
import { useAlarmStore } from '../../stores/alarmStore'

const alarmStore = useAlarmStore()

const alarm = computed(() => alarmStore.currentEmergencyAlarm)

const targetText = computed(() => {
    if (!alarm.value) {
        return '-'
    }

    return alarm.value.zoneCode || alarm.value.equipmentName || '-'
})

const measuredValueText = computed(() => {
    if (!alarm.value) {
        return '-'
    }

    return `${alarm.value.triggeredValue}${alarm.value.unit || ''}`
})

const normalRangeText = computed(() => {
    if (!alarm.value) {
        return '-'
    }

    const min = alarm.value.normalMin ?? '-'
    const max = alarm.value.normalMax ?? '-'
    const unit = alarm.value.unit || ''

    return `${min}${unit} ~ ${max}${unit}`
})

const exceedRate = computed(() => {
    if (!alarm.value?.triggeredValue || !alarm.value?.normalMax) {
        return null
    }

    if (alarm.value.normalMax === 0) {
        return null
    }

    return (((alarm.value.triggeredValue - alarm.value.normalMax) / alarm.value.normalMax) * 100).toFixed(1)
})

const handleConfirm = () => {
    alarmStore.dismissCurrentEmergencyAlarm()
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-2"
        >
            <div
                v-if="alarmStore.isEmergencyPopupVisible && alarm"
                class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]"
            >
                <section
                    class="w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/30 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.45),0_10px_25px_rgba(239,68,68,0.18)]"
                >
                    <!-- Header -->
                    <div class="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-5 py-4 text-white">
                        <div class="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                        <div class="absolute left-[-10px] bottom-[-25px] h-20 w-20 rounded-full bg-black/10 blur-2xl"></div>

                        <div class="relative flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-white"></span>
                                    <p class="text-xs font-semibold tracking-[0.18em] text-red-100">
                                        EMERGENCY ALARM
                                    </p>
                                </div>

                                <h2 class="mt-2 text-2xl font-bold leading-tight">
                                    비상 알람 발생
                                </h2>
                            </div>

                            <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-bold shadow-inner">
                                {{ alarm.severity }}
                            </span>
                        </div>
                    </div>

                    <!-- Body -->
                    <div class="space-y-4 px-5 py-5">
                        <div class="rounded-xl bg-slate-50 p-4 shadow-inner">
                            <p class="text-xs font-semibold tracking-wide text-slate-500">
                                알람 메시지
                            </p>
                            <p class="mt-2 text-lg font-bold leading-snug text-slate-900">
                                {{ alarm.message }}
                            </p>
                        </div>

                        <div class="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm shadow-inner md:grid-cols-2">
                            <div>
                                <p class="text-slate-500">
                                    공정
                                </p>
                                <p class="mt-1 font-semibold text-slate-900">
                                    {{ alarm.processName }}
                                </p>
                            </div>

                            <div>
                                <p class="text-slate-500">
                                    구역 / 설비
                                </p>
                                <p class="mt-1 font-semibold text-slate-900">
                                    {{ targetText }}
                                </p>
                            </div>

                            <div>
                                <p class="text-slate-500">
                                    태그명
                                </p>
                                <p class="mt-1 font-semibold text-slate-900">
                                    {{ alarm.tagName }}
                                </p>
                            </div>

                            <div>
                                <p class="text-slate-500">
                                    발생 횟수
                                </p>
                                <p class="mt-1 font-semibold text-slate-900">
                                    {{ alarm.occurrenceCount }}회
                                </p>
                            </div>
                        </div>

                        <div class="grid gap-3 md:grid-cols-3">
                            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                                <p class="text-xs font-semibold text-slate-500">
                                    측정값
                                </p>
                                <p class="mt-2 text-2xl font-bold text-red-600">
                                    {{ measuredValueText }}
                                </p>
                            </div>

                            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                                <p class="text-xs font-semibold text-slate-500">
                                    정상 범위
                                </p>
                                <p class="mt-2 text-sm font-bold leading-6 text-slate-800">
                                    {{ normalRangeText }}
                                </p>
                            </div>

                            <div class="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-[0_8px_20px_rgba(251,146,60,0.12)]">
                                <p class="text-xs font-semibold text-orange-700">
                                    초과율
                                </p>
                                <p class="mt-2 text-2xl font-bold text-orange-600">
                                    {{ exceedRate ? `${exceedRate}%` : '-' }}
                                </p>
                            </div>
                        </div>

                        <div class="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 shadow-inner">
                            <p>
                                발생 시각:
                                <span class="font-semibold text-slate-900">
                                    {{ alarm.occurredAt }}
                                </span>
                            </p>
s

                            <p class="mt-1">
                                추가 비상 알람:
                                <span class="font-semibold text-red-600">
                                    {{ alarmStore.remainingEmergencyCount }}건
                                </span>
                            </p>

                            <p class="mt-2 text-xs leading-5 text-slate-500">
                                여러 비상 알람이 발생한 경우 가장 먼저 확인해야 할 알람 1건만 표시합니다.
                                나머지 알람도 존재하며, 추후 알람 관리 화면에서 전체 확인이 가능합니다.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4">
                        <button
                            type="button"
                            class="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(220,38,38,0.25)] transition hover:-translate-y-0.5 hover:bg-red-700"
                            @click="handleConfirm"
                        >
                            확인
                        </button>
                    </div>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>
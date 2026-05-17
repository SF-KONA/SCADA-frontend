<script setup>
import { computed } from 'vue'
import { useAlarmStore } from '@/stores/alarmStore'

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

const deviationRate = computed(() => {
    if (!alarm.value?.triggeredValue) return null

    const value = alarm.value.triggeredValue
    const max = alarm.value.normalMax
    const min = alarm.value.normalMin

    if (max != null && value > max && max !== 0) {
        return (((value - max) / max) * 100).toFixed(1)
    }
    if (min != null && value < min && min !== 0) {
        return (((value - min) / min) * 100).toFixed(1)
    }
    return null
})

const isExceeded = computed(() => {
    if (!alarm.value?.triggeredValue || alarm.value.normalMax == null) return false
    return alarm.value.triggeredValue > alarm.value.normalMax
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
                style="position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); padding: 0 1rem; backdrop-filter: blur(2px);"
            >
                <div style="width: 100%; max-width: 480px; background: white; border-radius: 16px; overflow: hidden; border: 0.5px solid #e5e7eb; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">

                    <!-- Header -->
                    <div style="background: #DC2626; padding: 1.25rem 1.5rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: white;"></span>
                                <span style="font-size: 11px; font-weight: 500; letter-spacing: 0.12em; color: rgba(255,255,255,0.8);">EMERGENCY ALARM</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size: 28px; color: white;" aria-hidden="true"></i>
                            <h2 style="margin: 0; font-size: 26px; font-weight: 600; color: white;">비상 알람 발생</h2>
                        </div>
                    </div>

                    <!-- Body -->
                    <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 12px;">

                        <div style="background: #f9fafb; border-radius: 8px; padding: 0.875rem 1rem;">
                            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">알람 메시지</p>
                            <p style="font-size: 15px; font-weight: 500; color: #111827; margin: 0; line-height: 1.4;">{{ alarm.message }}</p>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div style="background: #f9fafb; border-radius: 8px; padding: 0.75rem 1rem;">
                                <p style="font-size: 12px; color: #6b7280; margin: 0 0 3px;">공정</p>
                                <p style="font-size: 14px; font-weight: 500; color: #111827; margin: 0;">{{ alarm.processName }}</p>
                            </div>
                            <div style="background: #f9fafb; border-radius: 8px; padding: 0.75rem 1rem;">
                                <p style="font-size: 12px; color: #6b7280; margin: 0 0 3px;">구역 / 설비</p>
                                <p style="font-size: 14px; font-weight: 500; color: #111827; margin: 0;">{{ targetText }}</p>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                            <div style="background: #f9fafb; border-radius: 8px; padding: 0.75rem 1rem;">
                                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">측정값</p>
                                <p
                                    style="font-size: 18px; font-weight: 500; margin: 0;"
                                    :style="{ color: isExceeded ? '#DC2626' : '#2563EB' }"
                                >{{ measuredValueText }}</p>
                            </div>
                            <div style="background: #f9fafb; border-radius: 8px; padding: 0.75rem 1rem;">
                                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">정상 범위</p>
                                <p style="font-size: 13px; font-weight: 500; color: #111827; margin: 0; line-height: 1.5;">{{ normalRangeText }}</p>
                            </div>
                            <div
                                style="border-radius: 8px; padding: 0.75rem 1rem;"
                                :style="isExceeded
                                    ? 'background: #FEF2F2; border: 0.5px solid #FCA5A5;'
                                    : 'background: #EFF6FF; border: 0.5px solid #93C5FD;'"
                            >
                                <p
                                    style="font-size: 12px; margin: 0 0 4px;"
                                    :style="{ color: isExceeded ? '#991B1B' : '#1E40AF' }"
                                >이탈률</p>
                                <p
                                    style="font-size: 18px; font-weight: 500; margin: 0;"
                                    :style="{ color: isExceeded ? '#DC2626' : '#2563EB' }"
                                >{{ deviationRate ? `${deviationRate}%` : '-' }}</p>
                            </div>
                        </div>

                        <div style="font-size: 12px; color: #6b7280; display: flex; align-items: center; justify-content: space-between;">
                            <span>발생 시각: <span style="color: #111827; font-weight: 500;">{{ alarm.occurredAt }}</span></span>
                            <span>추가 알람: <span style="color: #DC2626; font-weight: 500;">{{ alarmStore.remainingEmergencyCount }}건</span></span>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 0 1.5rem 1.5rem;">
                        <button
                            type="button"
                            style="width: 100%; padding: 1rem; background: #DC2626; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;"
                            @click="handleConfirm"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
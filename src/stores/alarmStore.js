import { defineStore } from 'pinia'

const getAlarmKey = alarm => {
    if (!alarm) {
        return ''
    }

    return `${alarm.alarmId}:${alarm.occurrenceCount ?? 1}`
}

export const useAlarmStore = defineStore('alarm', {
    state: () => ({
        currentEmergencyAlarm: null,
        emergencyQueue: [],
        isEmergencyPopupVisible: false,
        dismissedEmergencyKeys: [],
        isInitialEmergencyLoaded: false,
    }),

    getters: {
        currentEmergencyCount: state => state.currentEmergencyAlarm ? 1 : 0,

        remainingEmergencyCount: state => state.emergencyQueue.length,

        totalEmergencyCount: state => {
            const currentCount = state.currentEmergencyAlarm ? 1 : 0
            return currentCount + state.emergencyQueue.length
        },

        dismissedEmergencyCount: state => state.dismissedEmergencyKeys.length,
    },

    actions: {
        hasSameEmergencyAlarm(alarm) {
            const alarmKey = getAlarmKey(alarm)

            if (!alarmKey) {
                return true
            }

            const currentKey = getAlarmKey(this.currentEmergencyAlarm)

            const isCurrent = currentKey === alarmKey
            const isQueued = this.emergencyQueue.some(item => getAlarmKey(item) === alarmKey)
            const isDismissed = this.dismissedEmergencyKeys.includes(alarmKey)

            return isCurrent || isQueued || isDismissed
        },

        addEmergencyAlarms(alarms) {
            if (!Array.isArray(alarms) || alarms.length === 0) {
                return
            }

            const newAlarms = alarms.filter(alarm => !this.hasSameEmergencyAlarm(alarm))

            if (newAlarms.length === 0) {
                return
            }

            if (!this.currentEmergencyAlarm && !this.isEmergencyPopupVisible) {
                const [firstAlarm, ...restAlarms] = newAlarms

                this.currentEmergencyAlarm = firstAlarm
                this.isEmergencyPopupVisible = true
                this.emergencyQueue.push(...restAlarms)

                return
            }

            this.emergencyQueue.push(...newAlarms)
        },

        triggerEmergency(alarm) {
            if (!alarm || this.hasSameEmergencyAlarm(alarm)) {
                return
            }

            if (!this.currentEmergencyAlarm && !this.isEmergencyPopupVisible) {
                this.currentEmergencyAlarm = alarm
                this.isEmergencyPopupVisible = true
                return
            }

            this.emergencyQueue.push(alarm)
        },

        dismissCurrentEmergencyAlarm() {
            const alarmKey = getAlarmKey(this.currentEmergencyAlarm)

            if (alarmKey && !this.dismissedEmergencyKeys.includes(alarmKey)) {
                this.dismissedEmergencyKeys.push(alarmKey)
            }

            this.currentEmergencyAlarm = null
            this.isEmergencyPopupVisible = false
        },

        loadInitialMockEmergencyAlarms() {
            if (this.isInitialEmergencyLoaded) {
                return
            }

            this.isInitialEmergencyLoaded = true

            const mockAlarms = [
                {
                    alarmId: 1001,
                    sourceType: 'ENV',
                    equipmentId: null,
                    equipmentName: null,
                    stepNo: '03',
                    processName: '식각공정',
                    zoneCode: 'BACK',
                    tagCode: 'ENV_PARTICLE_01_VAL',
                    tagName: 'B-04 파티클',
                    unit: 'cnt/m³',
                    triggeredValue: 682.0,
                    normalMin: 0.0,
                    normalMax: 500.0,
                    severity: 'ERR',
                    message: 'B-04 파티클 초과 (682 cnt/m³ / 한계 500 cnt/m³)',
                    status: 'NEW',
                    occurredAt: '2026-05-11T14:02:18+09:00',
                    occurrenceCount: 1,
                },
                {
                    alarmId: 1002,
                    sourceType: 'EQP',
                    equipmentId: 'FURN_03',
                    equipmentName: '확산로 #3',
                    stepNo: '02',
                    processName: '산화공정',
                    zoneCode: null,
                    tagCode: 'FURN_03_TEMP',
                    tagName: '확산로 #3 온도',
                    unit: '°C',
                    triggeredValue: 1108.0,
                    normalMin: 900.0,
                    normalMax: 1100.0,
                    severity: 'ERR',
                    message: '확산로 #3 온도 1,108°C — 한계치 1,100°C 초과',
                    status: 'NEW',
                    occurredAt: '2026-05-11T14:28:00+09:00',
                    occurrenceCount: 3,
                },
            ]

            this.addEmergencyAlarms(mockAlarms)
        },

        resetEmergencyAlarms() {
            this.currentEmergencyAlarm = null
            this.emergencyQueue = []
            this.isEmergencyPopupVisible = false
            this.dismissedEmergencyKeys = []
            this.isInitialEmergencyLoaded = false
        },
    },
})
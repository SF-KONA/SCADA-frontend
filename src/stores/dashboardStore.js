import { defineStore } from 'pinia'
import { getDashboardStatus, getOeeSummary, getDefectRate, getYieldSummary, getDashboardEquipments } from '@/api/dashboardApi'
import { ackAlarm } from '@/api/alarmApi'
import { connectEnvironmentSocket, disconnectEnvironmentSocket } from '@/composables/useEnvironmentSocket'
import { connectDashboardSocket, disconnectDashboardSocket } from '@/composables/useDashboardSocket'

const STATUS_LABEL = { RUN: '가동', ALARM: '알람', PM: 'PM', IDLE: '대기' }

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        status: null,
        oee: null,
        defectRate: null,
        yieldData: null,
        equipments: null,
        environment: null,
        period: 'today',
        isLoading: false,
        errorMessage: '',
    }),

    actions: {
        async loadAll() {
            try {
                this.isLoading = true
                this.errorMessage = ''

                await Promise.all([
                    this._loadStatus(),
                    this._loadOee(),
                    this._loadDefectRate(),
                    this._loadYield(),
                    this._loadEquipments(),
                ])

                connectEnvironmentSocket((envData) => { this.environment = envData })
                connectDashboardSocket((msg) => { this._handleDashboardMessage(msg) })
            } catch (error) {
                this.errorMessage = error.message || '대시보드 데이터를 불러오지 못했습니다.'
            } finally {
                this.isLoading = false
            }
        },

        async changePeriod(period) {
            this.period = period
            await Promise.all([
                this._loadOee(),
                this._loadDefectRate(),
                this._loadYield(),
            ])
        },

        async ackAlarm(alarmId, equipmentId) {
            await ackAlarm(alarmId)
            if (!this.equipments) return
            const eq = this.equipments.equipments?.find(e => e.equipmentId === equipmentId)
            if (eq) eq.lastAlarm = null
        },

        _handleDashboardMessage(msg) {
            if (!this.equipments?.equipments) return

            if (msg.type === 'STATUS_CHANGE') {
                const eq = this.equipments.equipments.find(e => e.equipmentId === msg.equipmentId)
                if (eq) {
                    eq.status = msg.status
                    eq.statusLabel = STATUS_LABEL[msg.status] ?? msg.status
                }
            } else if (msg.type === 'ALARM') {
                const eq = this.equipments.equipments.find(e => e.equipmentId === msg.equipmentId)
                if (eq) {
                    eq.status = 'ALARM'
                    eq.statusLabel = '알람'
                    if (msg.alarm) eq.lastAlarm = msg.alarm
                }
            } else if (msg.type === 'ALARM_ACK') {
                const eq = this.equipments.equipments.find(e => e.equipmentId === msg.equipmentId)
                if (eq && eq.lastAlarm?.alarmId === msg.alarm?.alarmId) {
                    eq.lastAlarm = null
                }
            }
        },

        // --- API helpers ---
        async _loadStatus() {
            const { data } = await getDashboardStatus()
            this.status = data.data
        },
        async _loadOee() {
            const { data } = await getOeeSummary(this.period)
            this.oee = data.data
        },
        async _loadDefectRate() {
            const { data } = await getDefectRate(this.period)
            this.defectRate = data.data
        },
        async _loadYield() {
            const { data } = await getYieldSummary(this.period)
            this.yieldData = data.data
        },
        async _loadEquipments() {
            const { data } = await getDashboardEquipments()
            this.equipments = data.data
        },

        disconnect() {
            disconnectEnvironmentSocket()
            disconnectDashboardSocket()
        },
    },
})

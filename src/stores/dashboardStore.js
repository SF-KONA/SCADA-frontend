import { defineStore } from 'pinia'
import { getDashboardStatus, getOeeSummary, getDefectRate, getYieldSummary, getDashboardEquipments } from '@/api/dashboardApi'
import { ackAlarm } from '@/api/alarmApi'

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

                // TODO: 백엔드 연결 시 아래 주석 해제, mock 블록 제거
                // await Promise.all([
                //     this._loadStatus(),
                //     this._loadOee(),
                //     this._loadDefectRate(),
                //     this._loadYield(),
                //     this._loadEquipments(),
                // ])

                await new Promise(r => setTimeout(r, 300))
                this._setMock()
            } catch (error) {
                this.errorMessage = error.message || '대시보드 데이터를 불러오지 못했습니다.'
            } finally {
                this.isLoading = false
            }
        },

        async changePeriod(period) {
            this.period = period
            await this.loadAll()
        },

        async ackAlarm(alarmId, equipmentId) {
            // TODO: 백엔드 연결 시 주석 해제
            // await ackAlarm(alarmId)
            if (!this.equipments) return
            const eq = this.equipments.items.find(e => e.equipmentId === equipmentId)
            if (eq) eq.lastAlarm = null
        },

        // --- real API helpers (백엔드 연결 후 사용) ---
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

        // --- mock ---
        _setMock() {
            this.status = { total: 18, running: 14, warning: 2, alarm: 1, maintenance: 1, updatedAt: '2026-05-16T14:32:00+09:00' }

            this.oee = {
                period: this.period,
                oee: 72.4, target: 75.0, prevOee: 71.9, availability: 88.9, performance: 91.2, quality: 89.3,
                trend: [
                    { periodStart: '2026-05-16T00:00:00+09:00', oee: 70.1 },
                    { periodStart: '2026-05-16T04:00:00+09:00', oee: 71.8 },
                    { periodStart: '2026-05-16T08:00:00+09:00', oee: 73.5 },
                    { periodStart: '2026-05-16T10:00:00+09:00', oee: 74.2 },
                    { periodStart: '2026-05-16T12:00:00+09:00', oee: 72.4 },
                    { periodStart: '2026-05-16T14:00:00+09:00', oee: 71.9 },
                ],
                updatedAt: '2026-05-16T14:32:00+09:00',
            }

            this.defectRate = {
                period: this.period,
                processes: [
                    { stepNo: '02', processName: '산화', defectRate: 3.2, alertLevel: 'WARNING' },
                    { stepNo: '03', processName: '포토', defectRate: 1.5, alertLevel: 'NORMAL' },
                    { stepNo: '04', processName: '식각', defectRate: 5.6, alertLevel: 'CRITICAL' },
                    { stepNo: '05', processName: '박막증착', defectRate: 0.8, alertLevel: 'NORMAL' },
                    { stepNo: '06', processName: '금속배선', defectRate: 2.1, alertLevel: 'NORMAL' },
                    { stepNo: '07', processName: '테스트', defectRate: 1.2, alertLevel: 'NORMAL' },
                ],
                updatedAt: '2026-05-16T14:32:00+09:00',
            }

            this.yieldData = {
                period: this.period,
                yield: 96.8, target: 98.0, prevYield: 97.1,
                trend: [
                    { periodStart: '2026-05-16T00:00:00+09:00', yield: 97.2 },
                    { periodStart: '2026-05-16T04:00:00+09:00', yield: 96.5 },
                    { periodStart: '2026-05-16T08:00:00+09:00', yield: 97.0 },
                    { periodStart: '2026-05-16T12:00:00+09:00', yield: 96.8 },
                ],
                updatedAt: '2026-05-16T14:32:00+09:00',
            }

            const times = ['13:32', '13:42', '13:52', '14:02', '14:12', '14:22', '14:32']
            this.environment = {
                times,
                updatedAt: '2026-05-16T14:32:00+09:00',
                sensors: [
                    {
                        item: 'TEMP', label: '온도', unit: '°C',
                        rangeLabel: '22~23°C · 경계 23°C',
                        threshold: 23, yMin: 21.5, yMax: 23.5,
                        zones: [
                            { zone: 'FRONT', label: '전공정', value: 22.4, status: 'WARNING', trend: [21.9, 22.0, 22.1, 22.2, 22.1, 22.0, 22.4] },
                            { zone: 'BACK',  label: '후공정', value: 22.4, status: 'NORMAL',  trend: [22.2, 22.3, 22.5, 22.4, 22.4, 22.3, 22.4] },
                            { zone: 'EQP',   label: 'EQP',   value: 22.2, status: 'NORMAL',  trend: [22.0, 22.1, 22.2, 22.3, 22.2, 22.1, 22.2] },
                        ],
                    },
                    {
                        item: 'HUMIDITY', label: '습도', unit: '%RH',
                        rangeLabel: '40~50%RH · 경계 50%',
                        threshold: 50, yMin: 38, yMax: 55,
                        zones: [
                            { zone: 'FRONT', label: '전공정', value: 44, status: 'NORMAL', trend: [43, 44, 44, 43, 44, 44, 44] },
                            { zone: 'BACK',  label: '후공정', value: 46, status: 'NORMAL', trend: [45, 46, 47, 46, 46, 45, 46] },
                            { zone: 'EQP',   label: 'EQP',   value: 45, status: 'NORMAL', trend: [44, 45, 45, 46, 45, 45, 45] },
                        ],
                    },
                    {
                        item: 'PARTICLE', label: '파티클', unit: '/ft³',
                        rangeLabel: '0~100/ft³ · 경계 100',
                        threshold: 100, yMin: 0, yMax: 3200,
                        zones: [
                            { zone: 'FRONT', label: '전공정', value: 85,   status: 'NORMAL', trend: [80, 85, 82, 88, 85, 83, 85] },
                            { zone: 'BACK',  label: '후공정', value: 2840, status: 'ALARM',  trend: [2700, 2800, 2650, 2950, 2840, 2780, 2840] },
                            { zone: 'EQP',   label: 'EQP',   value: 92,   status: 'NORMAL', trend: [88, 90, 92, 91, 93, 90, 92] },
                        ],
                    },
                    {
                        item: 'AMC', label: 'AMC', unit: 'ppb',
                        rangeLabel: '0~1ppb · 경계 2ppb',
                        threshold: 2, yMin: 0, yMax: 2.5,
                        zones: [
                            { zone: 'FRONT', label: '전공정', value: 0.3, status: 'NORMAL', trend: [0.2, 0.3, 0.3, 0.4, 0.3, 0.3, 0.3] },
                            { zone: 'BACK',  label: '후공정', value: 0.8, status: 'NORMAL', trend: [0.7, 0.8, 0.9, 0.8, 0.8, 0.7, 0.8] },
                            { zone: 'EQP',   label: 'EQP',   value: 0.5, status: 'NORMAL', trend: [0.4, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5] },
                        ],
                    },
                    {
                        item: 'VIBRATION', label: '진동', unit: 'μm/s',
                        rangeLabel: '0~5μm/s · 경계 10μm/s',
                        threshold: 10, yMin: 0, yMax: 12,
                        zones: [
                            { zone: 'FRONT', label: '전공정', value: 1.8, status: 'NORMAL', trend: [1.6, 1.8, 1.7, 1.9, 1.8, 1.7, 1.8] },
                            { zone: 'BACK',  label: '후공정', value: 2.1, status: 'NORMAL', trend: [2.0, 2.1, 2.3, 2.2, 2.1, 2.0, 2.1] },
                            { zone: 'EQP',   label: 'EQP',   value: 3.2, status: 'NORMAL', trend: [3.0, 3.2, 3.1, 3.3, 3.2, 3.1, 3.2] },
                        ],
                    },
                    {
                        item: 'ESD', label: 'ESD', unit: 'V',
                        rangeLabel: '-100~100V · 경계 ±200V',
                        threshold: 200, yMin: 0, yMax: 220,
                        zones: [
                            { zone: 'FRONT', label: '전공정', value: 32,  status: 'NORMAL', trend: [28, 32, 30, 35, 32, 31, 32] },
                            { zone: 'BACK',  label: '후공정', value: 42,  status: 'NORMAL', trend: [38, 42, 44, 43, 42, 40, 42] },
                            { zone: 'EQP',   label: 'EQP',   value: 58,  status: 'NORMAL', trend: [52, 58, 55, 60, 58, 56, 58] },
                        ],
                    },
                ],
            }

            this.equipments = {
                total: 18,
                items: [
                    {
                        equipmentId: 'FURN_01', equipmentName: '수직형 확산로 #1',
                        stepNo: '02', processName: '산화',
                        status: 'RUN', statusLabel: '가동', oee: 88.5,
                        lastAlarm: null, updatedAt: '2026-05-16T14:30:00+09:00',
                    },
                    {
                        equipmentId: 'FURN_02', equipmentName: '수직형 확산로 #2',
                        stepNo: '02', processName: '산화',
                        status: 'RUN', statusLabel: '가동', oee: 85.2,
                        lastAlarm: null, updatedAt: '2026-05-16T14:30:00+09:00',
                    },
                    {
                        equipmentId: 'FURN_03', equipmentName: '수직형 확산로 #3',
                        stepNo: '02', processName: '산화',
                        status: 'ALARM', statusLabel: '알람', oee: 61.2,
                        lastAlarm: {
                            alarmId: 101, sourceType: 'EQP', severity: 'ERR',
                            message: '온도 1,108°C (한계 1,100°C)',
                            occurredAt: '2026-05-16T11:58:00+09:00',
                        },
                        updatedAt: '2026-05-16T11:58:00+09:00',
                    },
                    {
                        equipmentId: 'LITHO_01', equipmentName: '노광기 #1',
                        stepNo: '03', processName: '포토',
                        status: 'RUN', statusLabel: '가동', oee: 79.3,
                        lastAlarm: null, updatedAt: '2026-05-16T14:28:00+09:00',
                    },
                    {
                        equipmentId: 'ETCH_01', equipmentName: '식각기 #1',
                        stepNo: '04', processName: '식각',
                        status: 'RUN', statusLabel: '가동', oee: 70.1,
                        lastAlarm: {
                            alarmId: 102, sourceType: 'EQP', severity: 'WARN',
                            message: '압력 편차 ±0.8Pa (허용 ±0.5Pa)',
                            occurredAt: '2026-05-16T13:45:00+09:00',
                        },
                        updatedAt: '2026-05-16T13:45:00+09:00',
                    },
                    {
                        equipmentId: 'CVD_01', equipmentName: 'CVD #1',
                        stepNo: '05', processName: '박막증착',
                        status: 'IDLE', statusLabel: '대기', oee: null,
                        lastAlarm: null, updatedAt: '2026-05-16T09:00:00+09:00',
                    },
                ],
            }
        },
    },
})

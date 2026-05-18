import { defineStore } from 'pinia'
import http from '@/api/http'

const getAlarmKey = alarm => {
    if (!alarm) return ''
    return `${alarm.alarmId}:${alarm.occurrenceCount ?? 1}`
}

export const useAlarmStore = defineStore('alarm', {
    state: () => ({
        // ── 비상 알람 팝업 상태 (기존 유지) ──────────
        currentEmergencyAlarm: null,
        emergencyQueue: [],
        isEmergencyPopupVisible: false,
        dismissedEmergencyKeys: [],
        isInitialEmergencyLoaded: false,

        // ── 알람 센터 목록 상태 ───────────────────────
        alarms: [],
        total: 0,
        currentPage: 1,
        pageSize: 20,
        totalPages: 0,
        listLoading: false,
        listError: null,

        // ── 필터 상태 ─────────────────────────────────
        filters: {
            severity: [],
            status: [],
            sourceType: null,
            stepNo: null,
            equipmentId: null,
            from: null,
            to: null,
        },

        // ── 상세 패널 상태 ────────────────────────────
        selectedAlarm: null,
        alarmDetail: null,
        detailLoading: false,
        detailError: null,

        // ── 액션 상태 ─────────────────────────────────
        actionLoading: false,
        actionError: null,
    }),

    getters: {
        // 기존 비상 알람 getter 유지
        currentEmergencyCount: state => state.currentEmergencyAlarm ? 1 : 0,
        remainingEmergencyCount: state => state.emergencyQueue.length,
        totalEmergencyCount: state => {
            const currentCount = state.currentEmergencyAlarm ? 1 : 0
            return currentCount + state.emergencyQueue.length
        },
        dismissedEmergencyCount: state => state.dismissedEmergencyKeys.length,

        // 알람 센터 필터 쿼리 파라미터
        queryParams: state => {
            const f = state.filters
            const params = {
                page: state.currentPage,
                size: state.pageSize,
            }
            if (f.severity.length)  params.severity    = f.severity.join(',')
            if (f.status.length)    params.status      = f.status.join(',')
            if (f.sourceType)       params.sourceType  = f.sourceType
            if (f.stepNo)           params.stepNo      = f.stepNo
            if (f.equipmentId)      params.equipmentId = f.equipmentId
            if (f.from)             params.from        = f.from
            if (f.to)               params.to          = f.to
            return params
        },

        hasActiveFilters: state =>
            state.filters.severity.length > 0 ||
            state.filters.status.length > 0 ||
            state.filters.sourceType != null ||
            state.filters.stepNo != null ||
            state.filters.from != null ||
            state.filters.to != null,
    },

    actions: {
        // ── 기존 비상 알람 액션 유지 ──────────────────

        hasSameEmergencyAlarm(alarm) {
            const alarmKey = getAlarmKey(alarm)
            if (!alarmKey) return true
            const currentKey = getAlarmKey(this.currentEmergencyAlarm)
            const isCurrent  = currentKey === alarmKey
            const isQueued   = this.emergencyQueue.some(item => getAlarmKey(item) === alarmKey)
            const isDismissed = this.dismissedEmergencyKeys.includes(alarmKey)
            return isCurrent || isQueued || isDismissed
        },

        addEmergencyAlarms(alarms) {
            if (!Array.isArray(alarms) || alarms.length === 0) return
            const newAlarms = alarms.filter(alarm => !this.hasSameEmergencyAlarm(alarm))
            if (newAlarms.length === 0) return
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
            if (!alarm || this.hasSameEmergencyAlarm(alarm)) return
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

            // 큐에 다음 알람 있으면 표시
            if (this.emergencyQueue.length > 0) {
                this.currentEmergencyAlarm = this.emergencyQueue.shift()
                this.isEmergencyPopupVisible = true
            }
        },

        // ── mock → 실제 BE 호출로 교체 ───────────────
        async loadInitialMockEmergencyAlarms() {
            if (this.isInitialEmergencyLoaded) return
            this.isInitialEmergencyLoaded = true

            try {
                const res = await http.get('/alarms/emergency')
                const items = res.data.data?.items ?? []
                this.addEmergencyAlarms(items)
            } catch (e) {
                console.error('비상 알람 조회 실패', e)
            }
        },

        resetEmergencyAlarms() {
            this.currentEmergencyAlarm = null
            this.emergencyQueue = []
            this.isEmergencyPopupVisible = false
            this.dismissedEmergencyKeys = []
            this.isInitialEmergencyLoaded = false
        },

        // ── STOMP 이벤트 핸들러 ───────────────────────
        handleAlarmAckEvent(payload) {
            const alarm = payload.alarm
            if (!alarm) return
            const idx = this.alarms.findIndex(a => a.alarmId === alarm.alarmId)
            if (idx !== -1) {
                this.alarms[idx] = { ...this.alarms[idx], status: 'ACK', ackUserId: alarm.ackUserId, ackAt: alarm.ackAt }
            }
            if (this.alarmDetail?.alarmId === alarm.alarmId) {
                this.alarmDetail = { ...this.alarmDetail, status: 'ACK', ackUserId: alarm.ackUserId, ackAt: alarm.ackAt }
            }
        },

        // ── 알람 센터 목록 ────────────────────────────
        async loadAlarms() {
            this.listLoading = true
            this.listError   = null
            try {
                const res = await http.get('/alarms', { params: this.queryParams })
                const d   = res.data.data
                this.alarms     = d.items
                this.total      = d.total
                this.totalPages = d.totalPages
            } catch (e) {
                this.listError = e?.response?.data?.error?.code || 'LOAD_ERROR'
            } finally {
                this.listLoading = false
            }
        },

        async goToPage(page) {
            this.currentPage = page
            await this.loadAlarms()
        },

        async applyFilters(newFilters) {
            this.filters     = { ...this.filters, ...newFilters }
            this.currentPage = 1
            await this.loadAlarms()
        },

        async resetFilters() {
            this.filters = { severity: [], status: [], sourceType: null, stepNo: null, equipmentId: null, from: null, to: null }
            this.currentPage = 1
            await this.loadAlarms()
        },

        // ── 상세 조회 ─────────────────────────────────
        async selectAlarm(alarm) {
            this.selectedAlarm  = alarm
            this.alarmDetail    = null
            this.detailLoading  = true
            this.detailError    = null
            try {
                const res = await http.get(`/alarms/${alarm.alarmId}`)
                this.alarmDetail = res.data.data
            } catch (e) {
                this.detailError = e?.response?.data?.error?.code || 'DETAIL_ERROR'
            } finally {
                this.detailLoading = false
            }
        },

        closeDetail() {
            this.selectedAlarm = null
            this.alarmDetail   = null
        },

        // ── 상태 전환 ─────────────────────────────────
        async handleAck(alarmId) {
            this.actionLoading = true
            this.actionError   = null
            try {
                await http.patch(`/alarms/${alarmId}/ack`)
                await this._refreshAfterAction(alarmId)
            } catch (e) {
                this.actionError = e?.response?.data?.error?.code || 'ACK_ERROR'
                throw e
            } finally {
                this.actionLoading = false
            }
        },

        async handleStart(alarmId) {
            this.actionLoading = true
            this.actionError   = null
            try {
                await http.patch(`/alarms/${alarmId}/start`)
                await this._refreshAfterAction(alarmId)
            } catch (e) {
                this.actionError = e?.response?.data?.error?.code || 'START_ERROR'
                throw e
            } finally {
                this.actionLoading = false
            }
        },

        async handleDone(alarmId, comment) {
            this.actionLoading = true
            this.actionError   = null
            try {
                await http.patch(`/alarms/${alarmId}/done`, { comment })
                await this._refreshAfterAction(alarmId)
            } catch (e) {
                this.actionError = e?.response?.data?.error?.code || 'DONE_ERROR'
                throw e
            } finally {
                this.actionLoading = false
            }
        },

        async _refreshAfterAction(alarmId) {
            await this.loadAlarms()
            if (this.selectedAlarm?.alarmId === alarmId) {
                const res = await http.get(`/alarms/${alarmId}`)
                this.alarmDetail = res.data.data
                const idx = this.alarms.findIndex(a => a.alarmId === alarmId)
                if (idx !== -1) this.alarms[idx] = { ...this.alarms[idx], status: this.alarmDetail.status }
            }
        },
    },
})
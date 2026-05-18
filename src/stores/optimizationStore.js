import { defineStore } from 'pinia'
import {
    getSuggestions,
    applySuggestion as applySuggestionApi,
    rejectSuggestion as rejectSuggestionApi,
} from '@/api/suggestionApi'
import {
    getControllableParameters,
    updateEquipmentParameter,
} from '@/api/equipmentControlApi'
import { getOptimizationHistory } from '@/api/optimizationApi'

const COMMENT_MAX = 200
const HISTORY_MAX = 5

const unwrapList = response => {
    const payload = response?.data?.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.items)) return payload.items
    return []
}

export const useOptimizationStore = defineStore('optimization', {
    state: () => ({
        suggestions: [],
        controllableParameters: [],
        history: [],
        selectedEquipmentId: 'FURN_01',
        isLoading: false,
        isApplying: false,
        errorMessage: '',
        successMessage: '',
    }),

    getters: {
        pendingSuggestions: state => state.suggestions.filter(s => s.status === 'PENDING'),

        pendingCount() {
            return this.pendingSuggestions.length
        },

        currentOee() {
            const pool = this.suggestions
            if (!pool.length) return null
            const values = pool.map(s => s.currentOee).filter(v => v != null)
            if (!values.length) return null
            return values.reduce((a, b) => a + b, 0) / values.length
        },

        predictedOee() {
            const pool = this.suggestions
            if (!pool.length) return null
            const values = pool.map(s => s.predictedOee).filter(v => v != null)
            if (!values.length) return null
            return values.reduce((a, b) => a + b, 0) / values.length
        },

        oeeDelta() {
            if (this.currentOee == null || this.predictedOee == null) return null
            return this.predictedOee - this.currentOee
        },

        abnormalParamCount(state) {
            return state.controllableParameters.filter(p => {
                if (p.normalMin == null || p.normalMax == null || p.currentValue == null) return false
                return p.currentValue < p.normalMin || p.currentValue > p.normalMax
            }).length
        },

        lastAppliedAction(state) {
            const applied = state.history.filter(h => h.actionType === 'APPLY')
            if (!applied.length) return null
            return applied.slice().sort((a, b) => new Date(b.actedAt) - new Date(a.actedAt))[0]
        },
    },

    actions: {
        async fetchSuggestions(params = {}) {
            this.isLoading = true
            this.errorMessage = ''
            try {
                const response = await getSuggestions(params)
                this.suggestions = unwrapList(response)
            } catch (error) {
                this.errorMessage =
                    error?.response?.data?.message || 'AI 제안 목록을 불러오지 못했습니다.'
            } finally {
                this.isLoading = false
            }
        },

        async fetchControllableParameters(equipmentId) {
            this.selectedEquipmentId = equipmentId
            try {
                const response = await getControllableParameters(equipmentId)
                this.controllableParameters = unwrapList(response).map(item => ({
                    ...item,
                    equipmentId: item.equipmentId || equipmentId,
                }))
            } catch (error) {
                this.errorMessage =
                    error?.response?.data?.message || '제어 파라미터를 불러오지 못했습니다.'
            }
        },

        async fetchHistory(equipmentId) {
            try {
                const response = await getOptimizationHistory(equipmentId, HISTORY_MAX)
                const body = response?.data

                // 응답 shape 방어:
                // 1. { data: [...] }            ← 명세
                // 2. [...]
                // 3. { items: [...] }
                // 4. { data: { items: [...] } }
                let items = []
                if (Array.isArray(body)) {
                    items = body
                } else if (Array.isArray(body?.data)) {
                    items = body.data
                } else if (Array.isArray(body?.items)) {
                    items = body.items
                } else if (Array.isArray(body?.data?.items)) {
                    items = body.data.items
                }

                this.history = items.slice(0, HISTORY_MAX)
            } catch (error) {
                this.history = []
            }
        },

        async fetchControllableParametersForEquipments(equipmentIds) {
            const unique = [...new Set((equipmentIds || []).filter(Boolean))]
            if (!unique.length) {
                this.controllableParameters = []
                return
            }

            const results = await Promise.allSettled(
                unique.map(id => getControllableParameters(id)),
            )

            const merged = []
            results.forEach((r, idx) => {
                if (r.status !== 'fulfilled') return
                const equipmentId = unique[idx]
                for (const item of unwrapList(r.value)) {
                    merged.push({
                        ...item,
                        equipmentId: item.equipmentId || equipmentId,
                    })
                }
            })

            this.controllableParameters = merged
        },

        async applyOne(suggestionId, comment) {
            const trimmed = (comment || '').trim()
            if (trimmed.length > COMMENT_MAX) {
                throw new Error(`적용 사유는 ${COMMENT_MAX}자 이내로 입력해주세요.`)
            }

            const response = await applySuggestionApi(suggestionId, { comment: trimmed })
            const result = response?.data?.data

            const target = this.suggestions.find(s => s.suggestionId === suggestionId)
            if (target) {
                target.status = 'APPLIED'
                target.actionType = 'APPLY'
                target.comment = trimmed
                target.actedAt = result?.actedAt || new Date().toISOString()
            }

            if (result) {
                this.history.unshift({
                    actionId: result.actionId,
                    suggestionId: result.suggestionId,
                    equipmentId: target?.equipmentId,
                    parameterTag: target?.parameterTag,
                    tagName: target?.tagName,
                    unit: target?.unit,
                    beforeValue: result.beforeValue,
                    afterValue: result.afterValue,
                    actionType: result.actionType,
                    comment: result.comment,
                    actedAt: result.actedAt,
                    yieldImpact: target?.yieldImpact,
                })
                if (this.history.length > HISTORY_MAX) {
                    this.history = this.history.slice(0, HISTORY_MAX)
                }
            }

            return result
        },

        async rejectOne(suggestionId, comment) {
            const trimmed = (comment || '').trim()
            if (trimmed.length > COMMENT_MAX) {
                throw new Error(`거부 사유는 ${COMMENT_MAX}자 이내로 입력해주세요.`)
            }

            const response = await rejectSuggestionApi(suggestionId, { comment: trimmed })
            const result = response?.data?.data

            const target = this.suggestions.find(s => s.suggestionId === suggestionId)
            if (target) {
                target.status = 'REJECTED'
                target.actionType = 'REJECT'
                target.comment = trimmed
                target.actedAt = result?.actedAt || new Date().toISOString()
            }

            if (result) {
                this.history.unshift({
                    actionId: result.actionId,
                    suggestionId: result.suggestionId,
                    equipmentId: target?.equipmentId,
                    parameterTag: target?.parameterTag,
                    tagName: target?.tagName,
                    unit: target?.unit,
                    beforeValue: result.beforeValue,
                    afterValue: result.afterValue,
                    actionType: result.actionType || 'REJECT',
                    comment: result.comment,
                    actedAt: result.actedAt,
                })
                if (this.history.length > HISTORY_MAX) {
                    this.history = this.history.slice(0, HISTORY_MAX)
                }
            }

            return result
        },

        async applyAllPending(comment) {
            const pending = this.suggestions.filter(s => s.status === 'PENDING')
            if (!pending.length) {
                this.successMessage = '적용할 PENDING 제안이 없습니다.'
                return { success: 0, failed: 0 }
            }

            this.isApplying = true
            this.errorMessage = ''
            this.successMessage = ''

            try {
                const results = await Promise.allSettled(
                    pending.map(s => this.applyOne(s.suggestionId, comment)),
                )

                const success = results.filter(r => r.status === 'fulfilled').length
                const failed = results.length - success

                if (failed === 0) {
                    this.successMessage = `${success}건 모두 적용 완료`
                } else if (success === 0) {
                    this.errorMessage = `${failed}건 모두 적용 실패`
                } else {
                    this.successMessage = `${success}건 적용 완료, ${failed}건 실패`
                }

                return { success, failed }
            } finally {
                this.isApplying = false
            }
        },

        async updateParameter({ equipmentId, paramId, newValue, comment }) {
            if (newValue === '' || newValue == null) {
                throw new Error('변경할 값을 입력해주세요.')
            }
            const numericValue = Number(newValue)
            if (Number.isNaN(numericValue)) {
                throw new Error('숫자 값을 입력해주세요.')
            }
            const trimmed = (comment || '').trim()
            if (trimmed.length > COMMENT_MAX) {
                throw new Error(`변경 사유는 ${COMMENT_MAX}자 이내로 입력해주세요.`)
            }

            const response = await updateEquipmentParameter(equipmentId, paramId, {
                newValue: numericValue,
                comment: trimmed,
            })

            const result = response?.data?.data

            const param = this.controllableParameters.find(p => p.paramId === paramId)
            if (param) {
                param.beforeValue = result?.beforeValue ?? param.currentValue
                param.currentValue = result?.afterValue ?? numericValue
                param.comment = trimmed
                param.changedAt = result?.actedAt || new Date().toISOString()
            }

            return result
        },

        clearMessage() {
            this.errorMessage = ''
            this.successMessage = ''
        },
    },
})

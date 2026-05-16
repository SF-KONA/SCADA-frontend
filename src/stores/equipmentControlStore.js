import { defineStore } from 'pinia'

export const useEquipmentControlStore = defineStore('equipmentControl', {
    state: () => ({
        suggestions: [],
        controllableParameters: [],
        selectedEquipmentId: 'FURN_01',
        isLoading: false,
        errorMessage: '',
        successMessage: '',
    }),

    getters: {
        pendingSuggestions: state => {
            return state.suggestions.filter(suggestion => suggestion.status === 'PENDING')
        },

        appliedSuggestions: state => {
            return state.suggestions.filter(suggestion => suggestion.status === 'APPLIED')
        },

        rejectedSuggestions: state => {
            return state.suggestions.filter(suggestion => suggestion.status === 'REJECTED')
        },
    },

    actions: {
        loadMockSuggestions() {
            this.suggestions = [
                {
                    suggestionId: 301,
                    equipmentId: 'FURN_01',
                    equipmentName: '산화로 1호기',
                    parameterTag: 'FURN_01_TEMP',
                    tagName: '산화로 1호기 온도',
                    unit: '°C',
                    currentValue: 980.0,
                    suggestedValue: 950.0,
                    yieldImpact: 0.82,
                    confidence: 0.91,
                    currentOee: 74.0,
                    predictedOee: 81.0,
                    predictedAvailability: 2.0,
                    predictedPerformance: 3.0,
                    predictedQuality: 2.0,
                    status: 'PENDING',
                    validUntil: '2026-05-15T18:00:00+09:00',
                    generatedAt: '2026-05-15T12:00:00+09:00',
                },
                {
                    suggestionId: 302,
                    equipmentId: 'ETCH_01',
                    equipmentName: '건식 식각기 ICP #1',
                    parameterTag: 'ETCH_01_PRESSURE',
                    tagName: '챔버 압력',
                    unit: 'mTorr',
                    currentValue: 42.0,
                    suggestedValue: 38.0,
                    yieldImpact: 0.74,
                    confidence: 0.86,
                    currentOee: 69.5,
                    predictedOee: 75.2,
                    predictedAvailability: 1.4,
                    predictedPerformance: 2.2,
                    predictedQuality: 2.1,
                    status: 'PENDING',
                    validUntil: '2026-05-15T18:30:00+09:00',
                    generatedAt: '2026-05-15T12:10:00+09:00',
                },
            ]
        },

        loadMockControllableParameters(equipmentId = 'FURN_01') {
            this.selectedEquipmentId = equipmentId

            this.controllableParameters = [
                {
                    paramId: 12,
                    equipmentId: 'FURN_01',
                    equipmentName: '산화로 1호기',
                    tagCode: 'FURN_01_TEMP',
                    tagName: '산화로 1호기 온도',
                    unit: '°C',
                    normalMin: 900.0,
                    normalMax: 1000.0,
                    currentValue: 980.0,
                    dataType: 'Float',
                    paramCategory: 'PROCESS',
                },
                {
                    paramId: 13,
                    equipmentId: 'FURN_01',
                    equipmentName: '산화로 1호기',
                    tagCode: 'FURN_01_O2_FLOW',
                    tagName: 'O₂ 유량',
                    unit: 'sccm',
                    normalMin: 100.0,
                    normalMax: 300.0,
                    currentValue: 220.0,
                    dataType: 'Float',
                    paramCategory: 'PROCESS',
                },
            ]
        },

        async applySuggestion(suggestionId, comment) {
            const suggestion = this.suggestions.find(item => item.suggestionId === suggestionId)

            if (!suggestion) {
                throw new Error('AI 제안을 찾을 수 없습니다.')
            }

            if (suggestion.status !== 'PENDING') {
                throw new Error('이미 처리된 AI 제안입니다.')
            }

            if (comment && comment.length > 200) {
                throw new Error('적용 사유는 200자 이내로 입력해주세요.')
            }

            suggestion.status = 'APPLIED'
            suggestion.actionType = 'APPLY'
            suggestion.comment = comment
            suggestion.actedAt = new Date().toISOString()

            this.successMessage = 'AI 제안을 적용했습니다.'
        },

        async rejectSuggestion(suggestionId, comment) {
            const suggestion = this.suggestions.find(item => item.suggestionId === suggestionId)

            if (!suggestion) {
                throw new Error('AI 제안을 찾을 수 없습니다.')
            }

            if (suggestion.status !== 'PENDING') {
                throw new Error('이미 처리된 AI 제안입니다.')
            }

            if (comment && comment.length > 200) {
                throw new Error('거부 사유는 200자 이내로 입력해주세요.')
            }

            suggestion.status = 'REJECTED'
            suggestion.actionType = 'REJECT'
            suggestion.comment = comment
            suggestion.actedAt = new Date().toISOString()

            this.successMessage = 'AI 제안을 거부했습니다.'
        },

        async updateParameter(parameterData) {
            const { paramId, newValue, comment } = parameterData

            if (newValue === '' || newValue === null || newValue === undefined) {
                throw new Error('변경할 값을 입력해주세요.')
            }

            if (comment && comment.length > 200) {
                throw new Error('변경 사유는 200자 이내로 입력해주세요.')
            }

            const parameter = this.controllableParameters.find(item => item.paramId === paramId)

            if (!parameter) {
                throw new Error('제어 파라미터를 찾을 수 없습니다.')
            }

            parameter.beforeValue = parameter.currentValue
            parameter.currentValue = Number(newValue)
            parameter.comment = comment
            parameter.changedAt = new Date().toISOString()

            this.successMessage = '파라미터가 변경되었습니다.'
        },

        clearMessage() {
            this.errorMessage = ''
            this.successMessage = ''
        },
    },
})
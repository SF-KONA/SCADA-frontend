import http from './http'

export const getSuggestions = params => {
    return http.get('/suggestions', {
        params,
    })
}

export const getSuggestionDetail = suggestionId => {
    return http.get(`/suggestions/${suggestionId}`)
}

export const applySuggestion = (suggestionId, data) => {
    return http.post(`/suggestions/${suggestionId}/apply`, data)
}

export const rejectSuggestion = (suggestionId, data) => {
    return http.post(`/suggestions/${suggestionId}/reject`, data)
}
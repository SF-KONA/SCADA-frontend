import http from './http'

export const getEmergencyAlarms = () => {
    return http.get('/alarms/emergency')
}
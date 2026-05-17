import http from './http'

export const getEmergencyAlarms = () => http.get('/alarms/emergency')
export const ackAlarm = alarmId => http.patch(`/alarms/${alarmId}/ack`)

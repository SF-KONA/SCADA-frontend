import { Client } from '@stomp/stompjs'

let stompClient = null
let onMessageCallback = null

export function connectDashboardSocket(onMessage) {
    if (stompClient?.active) return
    onMessageCallback = onMessage

    const baseUrl = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080'
    stompClient = new Client({
        brokerURL: `${baseUrl}/ws-native`,
        reconnectDelay: 5000,
        onConnect: () => {
            stompClient.subscribe('/topic/dashboard', (frame) => {
                try {
                    const msg = JSON.parse(frame.body)
                    if (onMessageCallback) onMessageCallback(msg)
                } catch (e) {
                    console.error('[DASH WS] parse error', e)
                }
            })
        },
        onStompError: (frame) => console.error('[DASH WS] STOMP error', frame),
        onWebSocketError: (e) => console.error('[DASH WS] WebSocket error', e),
        onWebSocketClose: (e) => console.warn('[DASH WS] WebSocket closed', e),
    })

    stompClient.activate()
}

export function disconnectDashboardSocket() {
    stompClient?.deactivate()
    stompClient = null
}

import { Client } from '@stomp/stompjs'

const TREND_SIZE = 7

const ITEM_META = {
    TEMP:      { label: '온도',   unit: '°C',    yMin: 21.5, yMax: 23.5 },
    HUMIDITY:  { label: '습도',   unit: '%RH',   yMin: 38,   yMax: 55   },
    PARTICLE:  { label: '파티클', unit: '/ft³',  yMin: 0,    yMax: 3200 },
    AMC:       { label: 'AMC',    unit: 'ppb',   yMin: 0,    yMax: 2.5  },
    VIBRATION: { label: '진동',   unit: 'μm/s',  yMin: 0,    yMax: 12   },
    ESD:       { label: 'ESD',    unit: 'V',     yMin: 0,    yMax: 220  },
}

const ZONE_LABEL = { FRONT: '전공정', BACK: '후공정', EQP: 'EQP' }

// 누적 상태 (item → zone → { value, status, trend[], normalMin, normalMax })
const envState = {}

let stompClient = null
let onUpdateCallback = null

function getOrCreate(item, zone) {
    if (!envState[item]) envState[item] = {}
    if (!envState[item][zone]) {
        envState[item][zone] = { value: null, status: 'NORMAL', trend: [], normalMin: null, normalMax: null }
    }
    return envState[item][zone]
}

function buildEnvironmentData() {
    const now = new Date()
    const times = Array.from({ length: TREND_SIZE }, (_, i) => {
        const t = new Date(now - (TREND_SIZE - 1 - i) * 5000)
        return t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    })

    const sensors = Object.entries(ITEM_META).map(([item, meta]) => {
        const zones = ['FRONT', 'BACK', 'EQP'].map(zone => {
            const z = envState[item]?.[zone]
            return {
                zone,
                label: ZONE_LABEL[zone],
                value: z?.value ?? null,
                status: z?.status ?? 'NORMAL',
                trend: z?.trend ?? [],
            }
        })

        const anyZone = envState[item]
            ? Object.values(envState[item]).find(z => z.normalMin != null)
            : null
        const min = anyZone?.normalMin ?? null
        const max = anyZone?.normalMax ?? null

        return {
            item,
            label: meta.label,
            unit: meta.unit,
            rangeLabel: min != null && max != null
                ? `${min}~${max}${meta.unit} · 경계 ${max}${meta.unit}`
                : '',
            threshold: max,
            yMin: meta.yMin,
            yMax: meta.yMax,
            zones,
        }
    })

    return {
        times,
        sensors,
        updatedAt: now.toISOString(),
    }
}

function handleMessage(msg) {
    if (msg.type !== 'ENV_DATA') return

    const { item, zone, value, status, normalMin, normalMax } = msg
    if (!item || !zone) return

    const entry = getOrCreate(item, zone)
    entry.value = value
    entry.status = status
    entry.normalMin = normalMin
    entry.normalMax = normalMax

    entry.trend.push(value)
    if (entry.trend.length > TREND_SIZE) entry.trend.shift()

    if (onUpdateCallback) onUpdateCallback(buildEnvironmentData())
}

async function initFromHistory() {
    try {
        const wsBase = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080'
        const httpBase = wsBase.replace(/^ws/, 'http')
        const res = await fetch(`${httpBase}/api/environment/history`)
        const data = await res.json()
        for (const entry of data) {
            const { item, zone, value, status, normalMin, normalMax, trend } = entry
            if (!item || !zone) continue
            const e = getOrCreate(item, zone)
            e.value = value
            e.status = status
            e.normalMin = normalMin
            e.normalMax = normalMax
            e.trend = [...trend]
        }
        if (onUpdateCallback) onUpdateCallback(buildEnvironmentData())
    } catch (err) {
        console.error('[ENV] history fetch error', err)
    }
}

export function connectEnvironmentSocket(onUpdate) {
    if (stompClient?.active) return
    onUpdateCallback = onUpdate

    initFromHistory()

    const baseUrl = (import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080')
    stompClient = new Client({
        brokerURL: `${baseUrl}/ws-native`,
        reconnectDelay: 5000,
        onConnect: () => {
            stompClient.subscribe('/topic/environment', (frame) => {
                try {
                    handleMessage(JSON.parse(frame.body))
                } catch (e) {
                    console.error('[ENV WS] parse error', e)
                }
            })
        },
        onStompError: (frame) => console.error('[ENV WS] STOMP error', frame),
        onWebSocketError: (e) => console.error('[ENV WS] WebSocket error', e),
        onWebSocketClose: (e) => console.warn('[ENV WS] WebSocket closed', e),
    })

    stompClient.activate()
}

export function disconnectEnvironmentSocket() {
    stompClient?.deactivate()
    stompClient = null
}

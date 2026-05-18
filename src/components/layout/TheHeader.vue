<template>
    <header class="app-header">
        <!-- 로고 -->
        <div class="header-brand">
            <div class="brand-icon">
                <i class="fa-solid fa-microchip"></i>
            </div>

            <div class="brand-text">
                <span class="brand-name">
                    <span class="brand-orange">Hi</span><span class="brand-blue">CADA</span>
                </span>
                <span class="brand-subtitle">Web SCADA</span>
            </div>
        </div>

        <!-- 상단 네비게이션 -->
        <nav class="header-nav">
            <button
                v-for="menu in menus"
                :key="menu.path"
                :class="[
                    'nav-button',
                    { 'nav-button-active': isActive(menu.path) },
                ]"
                @click="$router.push(menu.path)"
            >
                {{ menu.name }}
            </button>
        </nav>

        <!-- 우측 정보 + 로그아웃 -->
        <div class="header-actions">
            <div class="time-chip">
                <span class="time-dot"></span>
                <span>{{ currentTime }} KST</span>
            </div>

            <!-- 비상 알람 아이콘 -->
            <div class="alarm-area">
                <button
                    type="button"
                    class="icon-button"
                    @click="isAlarmDropdownOpen = !isAlarmDropdownOpen"
                >
                    <i class="fa-solid fa-bell"></i>

                    <span v-if="alarmList.length > 0" class="alarm-badge">
                        {{ alarmList.length }}
                    </span>
                </button>

                <!-- 드롭다운 backdrop -->
                <div
                    v-if="isAlarmDropdownOpen"
                    class="dropdown-backdrop"
                    @click="isAlarmDropdownOpen = false"
                ></div>

                <!-- 드롭다운 패널 -->
                <div v-if="isAlarmDropdownOpen" class="alarm-dropdown">
                    <div v-if="alarmList.length === 0" class="alarm-empty">
                        비상 알람 없음
                    </div>

                    <div v-else class="alarm-list">
                        <div
                            v-for="alarm in alarmList"
                            :key="alarm.alarmId"
                            class="alarm-item"
                        >
                            <i class="fa-solid fa-triangle-exclamation alarm-warning-icon"></i>

                            <p>
                                {{ alarm.message }}
                            </p>

                            <button
                                type="button"
                                class="alarm-dismiss-button"
                                @click.stop="dismissAlarm(alarm.alarmId)"
                            >
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="user-chip">
                <i class="fa-solid fa-user-gear"></i>
                <span>{{ userLabel }}</span>
            </div>

            <button type="button" class="logout-button" @click="handleLogout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>로그아웃</span>
            </button>
        </div>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlarmStore } from '@/stores/alarmStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const alarmStore = useAlarmStore()

const currentTime = ref('')
const isAlarmDropdownOpen = ref(false)
const dismissedAlarmIds = ref(new Set())
let timer = null

const alarmList = computed(() => {
    const list = []

    if (alarmStore.currentEmergencyAlarm) {
        list.push(alarmStore.currentEmergencyAlarm)
    }

    list.push(...alarmStore.emergencyQueue)

    return list.filter((alarm) => !dismissedAlarmIds.value.has(alarm.alarmId))
})

const dismissAlarm = (alarmId) => {
    dismissedAlarmIds.value = new Set([...dismissedAlarmIds.value, alarmId])
}

const ROLE_LABEL = {
    ADMIN: '관리자',
    ENGINEER: '엔지니어',
    OPERATOR: '운영자',
}

const menus = [
    { name: '메인 대시보드', path: '/dashboard' },
    { name: '공정', path: '/process' },
    { name: '설비 제어', path: '/equipment-control' },
    { name: 'AI리포트', path: '/report' },
    { name: '알림 센터', path: '/alarm' },
    { name: '사용자 관리', path: '/users' },
]

const isActive = (path) => route.path === path

const userLabel = computed(() => {
    const user = auth.user

    if (!user) {
        return ''
    }

    return `${user.name} (${ROLE_LABEL[user.role] ?? user.role})`
})

const handleLogout = async () => {
    await auth.logout()
    router.push('/login')
}

const updateTime = () => {
    currentTime.value = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

onMounted(() => {
    updateTime()
    timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
    clearInterval(timer)
})
</script>

<style scoped>
.app-header {
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 24px;
    background: #0f3323;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    flex-shrink: 0;
    z-index: 50;
}

.header-brand {
    width: 184px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.brand-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #22c55e;
    font-size: 17px;
}

.brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.brand-name {
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.05em;
}

.brand-orange {
    color: #f97316;
}

.brand-blue {
    color: #60a5fa;
}

.brand-subtitle {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.52);
}

.header-nav {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.nav-button {
    position: relative;
    height: 100%;
    min-width: 112px;
    padding: 0 14px;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.68);
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition:
        color 0.15s ease,
        background-color 0.15s ease;
}

.nav-button:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
}

.nav-button::after {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 0;
    height: 2px;
    border-radius: 999px 999px 0 0;
    background: transparent;
    transition: background-color 0.15s ease;
}

.nav-button-active {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
}

.nav-button-active::after {
    background: #f97316;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.time-chip {
    height: 34px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}

.time-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #f97316;
}

.alarm-area {
    position: relative;
}

.icon-button {
    position: relative;
    width: 36px;
    height: 36px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: rgba(255, 255, 255, 0.82);
    cursor: pointer;
    transition:
        color 0.15s ease,
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.icon-button:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
}

.alarm-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #f97316;
    color: #ffffff;
    font-size: 10px;
    font-weight: 900;
}

.dropdown-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
}

.alarm-dropdown {
    position: absolute;
    right: 0;
    top: 46px;
    z-index: 50;
    width: 320px;
    overflow: hidden;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #d8e0dc;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.alarm-empty {
    padding: 28px 16px;
    text-align: center;
    color: #8a9990;
    font-size: 14px;
}

.alarm-list {
    max-height: 300px;
    overflow-y: auto;
}

.alarm-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border-bottom: 1px solid #edf1ee;
}

.alarm-item:last-child {
    border-bottom: 0;
}

.alarm-warning-icon {
    margin-top: 2px;
    color: #dc2626;
    flex-shrink: 0;
}

.alarm-item p {
    flex: 1;
    color: #17211b;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
}

.alarm-dismiss-button {
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #8a9990;
    cursor: pointer;
    flex-shrink: 0;
}

.alarm-dismiss-button:hover {
    background: #f1f5f2;
    color: #17211b;
}

.user-chip {
    height: 34px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}

.logout-button {
    height: 34px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: transparent;
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition:
        color 0.15s ease,
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.logout-button:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
}

@media (max-width: 1280px) {
    .app-header {
        padding: 0 16px;
    }

    .header-brand {
        width: 152px;
    }

    .brand-subtitle {
        display: none;
    }

    .nav-button {
        min-width: 94px;
        padding: 0 10px;
        font-size: 14px;
    }

    .time-chip {
        display: none;
    }
}

@media (max-width: 980px) {
    .app-header {
        overflow-x: auto;
    }

    .header-nav {
        flex: 0 0 auto;
    }

    .header-actions {
        margin-left: 8px;
    }
}
</style>
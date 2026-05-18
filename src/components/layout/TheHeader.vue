<template>
    <header class="h-[72px] bg-[#15803D] flex items-center pl-10 shrink-0 z-50" style="padding-right: 2rem;">
        <!-- 사이드바 토글 버튼 -->
        <button
            class="flex items-center justify-center w-9 h-9 rounded hover:bg-white/10 transition-colors shrink-0 text-white" style="margin-left: 1rem; margin-right: 1rem;"
            @click="sidebar.toggle()"
        >
            <i class="fa-solid fa-bars text-lg"></i>
        </button>

        <!-- 로고 -->
        <div class="flex items-center gap-3 border-r border-white/20 font-bold shrink-0" style="padding-right: 1rem;">
            <i class="fa-solid fa-microchip bg-white/15 p-3 rounded text-xl text-white"></i>
            <span class="text-2xl tracking-tight font-extrabold">
                <span class="text-[#F97316]">Hi</span><span class="text-[#3B82F6]">CADA</span>
            </span>
        </div>

        <!-- 상단 네비게이션 -->
        <nav class="flex h-full pl-4 flex-1">
            <template v-for="(menu, index) in menus" :key="menu.path">
                <button
                    :class="[
                        'flex flex-1 items-center justify-center h-full text-[17px] font-medium border-b-[3px] transition-colors whitespace-nowrap',
                        isActive(menu.path)
                            ? 'border-[#F97316] text-white'
                            : 'border-transparent text-white/70 hover:text-white hover:border-white/30',
                    ]"
                    @click="$router.push(menu.path)"
                >
                    {{ menu.name }}
                </button>
                <span
                    v-if="index < menus.length - 1"
                    class="self-center h-5 w-px bg-white/20 shrink-0"
                ></span>
            </template>
        </nav>

        <!-- 우측 정보 + 로그아웃 -->
        <div class="flex items-center gap-5 shrink-0">
            <div class="flex items-center gap-2 text-[15px] text-white/80 font-medium">
                <span class="w-2.5 h-2.5 bg-[#F97316] rounded-full animate-pulse"></span>
                {{ currentTime }} KST
            </div>
            <!-- 비상 알람 아이콘 -->
            <div class="relative">
                <button
                    class="relative flex items-center justify-center w-9 h-9 rounded hover:bg-white/10 transition-colors text-white"
                    @click="isAlarmDropdownOpen = !isAlarmDropdownOpen"
                >
                    <i class="fa-solid fa-bell text-lg"></i>
                    <span
                        v-if="alarmList.length > 0"
                        class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-bold"
                    >
                        {{ alarmList.length }}
                    </span>
                </button>

                <!-- 드롭다운 backdrop -->
                <div
                    v-if="isAlarmDropdownOpen"
                    class="fixed inset-0 z-40"
                    @click="isAlarmDropdownOpen = false"
                ></div>

                <!-- 드롭다운 패널 -->
                <div
                    v-if="isAlarmDropdownOpen"
                    class="absolute right-0 top-12 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                >
                    <div v-if="alarmList.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
                        비상 알람 없음
                    </div>

                    <div v-else class="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        <div
                            v-for="alarm in alarmList"
                            :key="alarm.alarmId"
                            class="flex items-center gap-3 px-4 py-3"
                        >
                            <i class="fa-solid fa-triangle-exclamation text-red-500 shrink-0"></i>
                            <p class="flex-1 text-sm font-medium text-gray-900 leading-snug">
                                {{ alarm.message }}
                            </p>
                            <button
                                class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                @click.stop="dismissAlarm(alarm.alarmId)"
                            >
                                <i class="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white/10 px-4 py-2 rounded flex items-center gap-2 border border-white/10 text-[15px] text-white font-medium">
                <i class="fa-solid fa-user-gear text-lg"></i>
                <span>{{ userLabel }}</span>
            </div>
            <button
                class="flex items-center gap-2 px-4 py-2 rounded text-[15px] text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors font-medium"
                @click="handleLogout"
            >
                <i class="fa-solid fa-arrow-right-from-bracket text-lg"></i>
                <span>로그아웃</span>
            </button>
        </div>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import { useAlarmStore } from '@/stores/alarmStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const sidebar = useSidebarStore()
const alarmStore = useAlarmStore()

const currentTime = ref('')
const isAlarmDropdownOpen = ref(false)
const dismissedAlarmIds = ref(new Set())
let timer = null

const alarmList = computed(() => {
    const list = []
    if (alarmStore.currentEmergencyAlarm) list.push(alarmStore.currentEmergencyAlarm)
    list.push(...alarmStore.emergencyQueue)
    return list.filter(a => !dismissedAlarmIds.value.has(a.alarmId))
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
    if (!user) return ''
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

onUnmounted(() => clearInterval(timer))
</script>

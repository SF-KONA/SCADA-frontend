<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TheHeader from '@/components/layout/TheHeader.vue'
import TheSidebar from '@/components/layout/TheSidebar.vue'
import EmergencyAlarmPopup from '@/components/alarm/EmergencyAlarmPopup.vue'
import { useAlarmStore } from '@/stores/alarmStore'

const route = useRoute()
const auth = useAuthStore()
const alarmStore = useAlarmStore()

const noLayout = computed(() => route.meta.noLayout === true)

watch(
    () => route.path,
    () => {
        if (auth.isLoggedIn && !noLayout.value) {
            alarmStore.loadInitialMockEmergencyAlarms()
        }
    },
    { immediate: true },
)
</script>

<template>
    <!-- 레이아웃 없이 단독 렌더링 (로그인, 아이디 찾기, 비밀번호 찾기 등) -->
    <router-view v-if="noLayout" />

    <!-- 일반 페이지: 헤더 + 사이드바 + 콘텐츠 -->
    <div v-else class="h-screen flex flex-col bg-[#F0F2F0] overflow-hidden">
        <TheHeader />
        <div class="flex flex-1 overflow-hidden">
            <TheSidebar />
            <main class="flex-1 overflow-y-auto px-10 py-8">
                <router-view />
            </main>
        </div>
    </div>

    <!-- 전역 비상 알람 팝업 -->
    <EmergencyAlarmPopup />
</template>

<template>
    <!-- 로그인 페이지: 레이아웃 없이 단독 렌더링 -->
    <router-view v-if="isLoginPage" />

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
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TheHeader from '@/components/layout/TheHeader.vue'
import TheSidebar from '@/components/layout/TheSidebar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'Login')
</script>

<template>
    <aside
        :class="[
            'bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden transition-all duration-300',
            sidebar.isOpen ? 'w-60' : 'w-0',
        ]"
    >
        <nav class="flex-1 px-4 py-4 space-y-2 w-60">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 pb-3">
                Menug
            </p>

            <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                custom
                v-slot="{ isActive, navigate }"
            >
                <button
                    :class="[
                        'w-full flex items-center gap-3 px-4 py-4 rounded-lg text-base font-medium transition-colors',
                        isActive
                            ? 'bg-[#15803D] text-white'
                            : 'text-gray-600 hover:bg-[#F0F9F0] hover:text-[#15803D]',
                    ]"
                    @click="navigate"
                >
                    <i :class="['w-5 text-center text-base', item.icon]"></i>
                    <span>{{ item.name }}</span>
                </button>
            </router-link>
        </nav>
    </aside>
</template>

<script setup>
import { useSidebarStore } from '@/stores/sidebar'

const sidebar = useSidebarStore()

const navItems = [
    { name: '메인 대시보드', path: '/dashboard', icon: 'fa-solid fa-gauge-high' },
    { name: '공정', path: '/equipment', icon: 'fa-solid fa-industry' },
    { name: '설비 제어', path: '/control', icon: 'fa-solid fa-sliders' },
    { name: 'AI리포트', path: '/report', icon: 'fa-solid fa-chart-line' },
    { name: '알림 센터', path: '/alarm', icon: 'fa-solid fa-bell' },
    { name: '사용자 관리', path: '/users', icon: 'fa-solid fa-users-gear' },
]
</script>

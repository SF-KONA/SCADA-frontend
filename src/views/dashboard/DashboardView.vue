<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
    await authStore.logout()
    router.push('/login')
}
</script>

<template>
    <main class="min-h-screen bg-slate-950 p-8 text-white">
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p class="text-sm font-semibold text-orange-400">
                DB HiTek Smart Factory
            </p>

            <h1 class="mt-2 text-3xl font-bold">
                Dashboard
            </h1>

            <p class="mt-3 text-slate-300">
                로그인 성공 후 진입한 임시 대시보드입니다.
            </p>

            <button
                class="mt-6 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
                @click="handleLogout"
            >
                로그아웃
            </button>
        </section>
    </main>
</template>
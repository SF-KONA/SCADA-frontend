<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const userId = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
    if (!userId.value.trim() || !password.value.trim()) {
        errorMessage.value = '아이디와 비밀번호를 입력해주세요.'
        return
    }

    try {
        isLoading.value = true
        errorMessage.value = ''

        await authStore.login({
            userId: userId.value,
            password: password.value,
        })

        router.push('/dashboard')
    } catch (error) {
        errorMessage.value = error.message || '로그인 중 오류가 발생했습니다.'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <main class="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <section class="w-full max-w-md rounded-2xl border border-slate-800 bg-white p-8 shadow-2xl">
            <div class="mb-8">
                <p class="mb-2 text-sm font-semibold text-blue-700">
                    DB HiTek Smart Factory
                </p>
                <h1 class="text-2xl font-bold text-slate-900">
                    SCADA 로그인
                </h1>
                <p class="mt-2 text-sm text-slate-500">
                    설비 모니터링 시스템에 접속합니다.
                </p>
            </div>

            <form class="space-y-5" @submit.prevent="handleLogin">
                <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        아이디
                    </label>
                    <input
                        v-model="userId"
                        type="text"
                        autocomplete="username"
                        class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        placeholder="아이디를 입력하세요"
                    />
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        비밀번호
                    </label>
                    <input
                        v-model="password"
                        type="password"
                        autocomplete="current-password"
                        class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        placeholder="비밀번호를 입력하세요"
                    />
                </div>

                <p v-if="errorMessage" class="text-sm font-medium text-red-600">
                    {{ errorMessage }}
                </p>

                <button
                    type="submit"
                    :disabled="isLoading"
                    class="w-full rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {{ isLoading ? '로그인 중...' : '로그인' }}
                </button>

                <div class="flex justify-center gap-3 text-sm text-slate-500">
                    <RouterLink to="/find-id" class="hover:text-blue-700">
                        아이디 찾기
                    </RouterLink>
                    <span>|</span>
                    <RouterLink to="/find-password" class="hover:text-blue-700">
                        비밀번호 찾기
                    </RouterLink>
                </div>
            </form>
        </section>
    </main>
</template>
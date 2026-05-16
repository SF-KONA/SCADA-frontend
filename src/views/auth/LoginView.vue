<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    <div class="min-h-screen bg-[#0F1F0F] flex items-center justify-center">
        <div class="bg-[#1A2E1A] rounded-2xl p-14 w-full max-w-lg">
            <!-- 로고 -->
            <div class="flex items-center gap-3 mb-10">
                <i class="fa-solid fa-microchip text-[#15803D] text-3xl"></i>
                <span class="text-3xl font-extrabold tracking-tight">
                    <span class="text-[#F97316]">Hi</span><span class="text-[#60A5FA]">CADA</span>
                    <span class="text-white font-medium text-2xl ml-1">Login</span>
                </span>
            </div>

            <!-- 로그인 폼 -->
            <form @submit.prevent="handleLogin" class="space-y-5">
                <div>
                    <label class="block text-sm text-white/50 mb-2">아이디</label>
                    <input
                        v-model="userId"
                        type="text"
                        placeholder="아이디를 입력하세요"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-[#15803D] transition-colors"
                    />
                </div>
                <div>
                    <label class="block text-sm text-white/50 mb-2">비밀번호</label>
                    <input
                        v-model="password"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-[#15803D] transition-colors"
                    />
                </div>

                <p v-if="errorMessage" class="text-red-400 text-sm pt-1">{{ errorMessage }}</p>

                <button
                    type="submit"
                    :disabled="isLoading"
                    class="w-full bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white font-medium py-3 rounded-lg text-base transition-colors mt-2"
                >
                    {{ isLoading ? '로그인 중...' : '로그인' }}
                </button>

                <div class="flex justify-center gap-3 text-sm text-white/40 pt-1">
                    <RouterLink to="/find-id" class="hover:text-white/70 transition-colors">
                        아이디 찾기
                    </RouterLink>
                    <span>|</span>
                    <RouterLink to="/find-password" class="hover:text-white/70 transition-colors">
                        비밀번호 찾기
                    </RouterLink>
                </div>
            </form>
        </div>
    </div>
</template>

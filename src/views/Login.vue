<template>
    <div class="min-h-screen bg-[#0F1F0F] flex items-center justify-center">
        <div class="bg-[#1A2E1A] rounded-2xl p-10 w-full max-w-sm">
            <!-- 로고 -->
            <div class="flex items-center gap-3 mb-8">
                <i class="fa-solid fa-microchip text-[#15803D] text-2xl"></i>
                <span class="text-white font-bold text-lg">DB HiTek Web SCADA</span>
            </div>

            <!-- 로그인 폼 -->
            <form @submit.prevent="handleLogin" class="space-y-4">
                <div>
                    <label class="block text-xs text-white/50 mb-1.5">아이디</label>
                    <input
                        v-model="form.userId"
                        type="text"
                        placeholder="아이디를 입력하세요"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#15803D] transition-colors"
                    />
                </div>
                <div>
                    <label class="block text-xs text-white/50 mb-1.5">비밀번호</label>
                    <input
                        v-model="form.password"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#15803D] transition-colors"
                    />
                </div>

                <p v-if="errorMsg" class="text-red-400 text-xs pt-1">{{ errorMsg }}</p>

                <button
                    type="submit"
                    :disabled="isLoading"
                    class="w-full bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
                >
                    {{ isLoading ? '로그인 중...' : '로그인' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ userId: '', password: '' })
const isLoading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    await auth.login({ userId: form.value.userId, password: form.value.password })
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || '아이디 또는 비밀번호가 올바르지 않습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>
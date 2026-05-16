<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const code = ref('')
const foundUserId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isCodeSent = ref(false)
const isLoading = ref(false)

const handleSendCode = async () => {
    if (!email.value.trim()) {
        errorMessage.value = '이메일을 입력해주세요.'
        return
    }

    try {
        isLoading.value = true
        errorMessage.value = ''
        successMessage.value = ''

        await authStore.sendEmailCode({
            email: email.value,
            purpose: 'FIND_ID',
        })

        isCodeSent.value = true
        successMessage.value = '인증 코드가 발송되었습니다. 테스트 코드는 123456입니다.'
    } catch (error) {
        errorMessage.value = error.message || '인증 코드 발송 중 오류가 발생했습니다.'
    } finally {
        isLoading.value = false
    }
}

const handleVerifyCode = async () => {
    if (!code.value.trim()) {
        errorMessage.value = '인증 코드를 입력해주세요.'
        return
    }

    try {
        isLoading.value = true
        errorMessage.value = ''
        successMessage.value = ''

        const result = await authStore.verifyEmailCode({
            email: email.value,
            code: code.value,
            purpose: 'FIND_ID',
        })

        foundUserId.value = result.userId
        successMessage.value = '아이디 찾기가 완료되었습니다.'
    } catch (error) {
        errorMessage.value = error.message || '인증 확인 중 오류가 발생했습니다.'
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
                    <span class="text-white font-medium text-2xl ml-1">아이디 찾기</span>
                </span>
            </div>

            <div class="space-y-5">
                <div>
                    <label class="block text-sm text-white/50 mb-2">이메일</label>
                    <div class="flex gap-2">
                        <input
                            v-model="email"
                            type="email"
                            placeholder="이메일을 입력하세요"
                            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-[#15803D] transition-colors"
                        />
                        <button
                            type="button"
                            :disabled="isLoading"
                            class="whitespace-nowrap bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg text-base transition-colors"
                            @click="handleSendCode"
                        >
                            발송
                        </button>
                    </div>
                </div>

                <div v-if="isCodeSent">
                    <label class="block text-sm text-white/50 mb-2">인증 코드</label>
                    <input
                        v-model="code"
                        type="text"
                        maxlength="6"
                        placeholder="6자리 인증 코드를 입력하세요"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-[#15803D] transition-colors"
                    />
                </div>

                <button
                    v-if="isCodeSent"
                    type="button"
                    :disabled="isLoading"
                    class="w-full bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white font-medium py-3 rounded-lg text-base transition-colors"
                    @click="handleVerifyCode"
                >
                    아이디 확인
                </button>

                <div
                    v-if="foundUserId"
                    class="rounded-lg border border-white/10 bg-white/5 p-4 text-base text-white/80"
                >
                    가입된 아이디는 <strong class="text-white">{{ foundUserId }}</strong> 입니다.
                </div>

                <p v-if="successMessage" class="text-[#60A5FA] text-sm pt-1">{{ successMessage }}</p>
                <p v-if="errorMessage" class="text-red-400 text-sm pt-1">{{ errorMessage }}</p>

                <div class="flex justify-center gap-3 text-sm text-white/40 pt-1">
                    <RouterLink to="/login" class="hover:text-white/70 transition-colors">
                        로그인
                    </RouterLink>
                    <span>|</span>
                    <RouterLink to="/find-password" class="hover:text-white/70 transition-colors">
                        비밀번호 찾기
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>

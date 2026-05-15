<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

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
    <main class="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <section class="w-full max-w-md rounded-2xl border border-slate-800 bg-white p-8 shadow-2xl">
            <div class="mb-8">
                <p class="mb-2 text-sm font-semibold text-blue-700">
                    DB HiTek Smart Factory
                </p>
                <h1 class="text-2xl font-bold text-slate-900">
                    아이디 찾기
                </h1>
                <p class="mt-2 text-sm text-slate-500">
                    가입된 이메일로 인증 코드를 확인합니다.
                </p>
            </div>

            <div class="space-y-5">
                <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        이메일
                    </label>
                    <div class="flex gap-2">
                        <input
                            v-model="email"
                            type="email"
                            class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="이메일을 입력하세요"
                        />
                        <button
                            type="button"
                            class="whitespace-nowrap rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                            :disabled="isLoading"
                            @click="handleSendCode"
                        >
                            발송
                        </button>
                    </div>
                </div>

                <div v-if="isCodeSent">
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        인증 코드
                    </label>
                    <input
                        v-model="code"
                        type="text"
                        maxlength="6"
                        class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        placeholder="6자리 인증 코드를 입력하세요"
                    />
                </div>

                <button
                    v-if="isCodeSent"
                    type="button"
                    class="w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    :disabled="isLoading"
                    @click="handleVerifyCode"
                >
                    아이디 확인
                </button>

                <div
                    v-if="foundUserId"
                    class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                    가입된 아이디는
                    <strong>{{ foundUserId }}</strong>
                    입니다.
                </div>

                <p v-if="successMessage" class="text-sm font-medium text-blue-700">
                    {{ successMessage }}
                </p>

                <p v-if="errorMessage" class="text-sm font-medium text-red-600">
                    {{ errorMessage }}
                </p>

                <div class="flex justify-center gap-3 text-sm text-slate-500">
                    <RouterLink to="/login" class="hover:text-blue-700">
                        로그인
                    </RouterLink>
                    <span>|</span>
                    <RouterLink to="/find-password" class="hover:text-blue-700">
                        비밀번호 찾기
                    </RouterLink>
                </div>
            </div>
        </section>
    </main>
</template>
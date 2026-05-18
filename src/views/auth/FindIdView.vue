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
    <main class="auth-page">
        <section class="auth-container">
            <div class="auth-intro">
                <div class="brand">
                    <div class="brand-icon">
                        <i class="fa-solid fa-microchip"></i>
                    </div>

                    <div>
                        <h1>
                            <span class="brand-orange">Hi</span><span class="brand-blue">CADA</span>
                        </h1>
                        <p>Web SCADA Monitoring System</p>
                    </div>
                </div>

                <div class="intro-text">
                    <span class="intro-label">ACCOUNT RECOVERY</span>
                    <h2>
                        등록된 이메일로<br />
                        사용자 계정을 확인합니다
                    </h2>
                    <p>
                        계정에 등록된 이메일 인증을 통해 사용자 아이디를 조회할 수 있습니다.
                    </p>
                </div>

                <div class="intro-tags">
                    <span>User Auth</span>
                    <span>Email Verify</span>
                    <span>Account</span>
                </div>
            </div>

            <div class="auth-card">
                <div class="auth-card-header">
                    <p>FIND USER ID</p>
                    <h2>아이디 찾기</h2>
                    <span>가입 시 등록한 이메일을 입력하세요.</span>
                </div>

                <div class="auth-form">
                    <div class="form-field">
                        <label for="email">이메일</label>

                        <div class="inline-field">
                            <input
                                id="email"
                                v-model="email"
                                type="email"
                                placeholder="이메일을 입력하세요"
                                autocomplete="email"
                            />

                            <button
                                type="button"
                                :disabled="isLoading"
                                class="send-button"
                                @click="handleSendCode"
                            >
                                {{ isLoading ? '처리 중' : '발송' }}
                            </button>
                        </div>
                    </div>

                    <div v-if="isCodeSent" class="form-field">
                        <label for="code">인증 코드</label>
                        <input
                            id="code"
                            v-model="code"
                            type="text"
                            maxlength="6"
                            placeholder="6자리 인증 코드를 입력하세요"
                        />
                    </div>

                    <button
                        v-if="isCodeSent"
                        type="button"
                        :disabled="isLoading"
                        class="primary-button"
                        @click="handleVerifyCode"
                    >
                        아이디 확인
                    </button>

                    <div v-if="foundUserId" class="result-box">
                        <p>가입된 아이디</p>
                        <strong>{{ foundUserId }}</strong>
                    </div>

                    <p v-if="successMessage" class="success-message">
                        {{ successMessage }}
                    </p>

                    <p v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </p>

                    <div class="auth-links">
                        <RouterLink to="/login">로그인</RouterLink>
                        <span></span>
                        <RouterLink to="/find-password">비밀번호 찾기</RouterLink>
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background:
        radial-gradient(circle at 18% 18%, rgba(249, 115, 22, 0.12), transparent 28%),
        radial-gradient(circle at 78% 6%, rgba(96, 165, 250, 0.13), transparent 30%),
        linear-gradient(135deg, #07150d 0%, #0b2418 48%, #0f3323 100%);
    color: #ffffff;
}

.auth-container {
    width: min(1080px, 100%);
    min-height: 560px;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.04);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
}

.auth-intro {
    padding: 56px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background:
        linear-gradient(135deg, rgba(21, 128, 61, 0.28), rgba(15, 31, 15, 0.18)),
        rgba(255, 255, 255, 0.02);
}

.brand {
    display: flex;
    align-items: center;
    gap: 14px;
}

.brand-icon {
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #22c55e;
    font-size: 22px;
}

.brand h1 {
    font-size: 32px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.05em;
}

.brand p {
    margin-top: 7px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.58);
}

.brand-orange {
    color: #f97316;
}

.brand-blue {
    color: #60a5fa;
}

.intro-text {
    max-width: 560px;
}

.intro-label {
    display: inline-block;
    margin-bottom: 16px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #86efac;
}

.intro-text h2 {
    font-size: 32px;
    line-height: 1.32;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: #ffffff;
}

.intro-text p {
    margin-top: 18px;
    max-width: 480px;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.68);
}

.intro-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.intro-tags span {
    padding: 7px 11px;
    border-radius: 999px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.auth-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 48px;
    background: #ffffff;
    color: #17211b;
}

.auth-card-header {
    margin-bottom: 32px;
}

.auth-card-header p {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #15803d;
}

.auth-card-header h2 {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.04em;
    color: #17211b;
}

.auth-card-header span {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #647067;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-field label {
    font-size: 13px;
    font-weight: 700;
    color: #5f6f66;
}

.form-field input {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border: 1px solid #cfd9d3;
    border-radius: 8px;
    background: #ffffff;
    color: #17211b;
    font-size: 14px;
    outline: none;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.form-field input::placeholder {
    color: #9aa7a0;
}

.form-field input:focus {
    border-color: #15803d;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.12);
}

.inline-field {
    display: grid;
    grid-template-columns: 1fr 82px;
    gap: 8px;
}

.send-button,
.primary-button {
    height: 46px;
    border: 0;
    border-radius: 8px;
    background: #15803d;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        transform 0.15s ease;
}

.send-button:hover,
.primary-button:hover {
    background: #166534;
}

.send-button:active,
.primary-button:active {
    transform: translateY(1px);
}

.send-button:disabled,
.primary-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.result-box {
    padding: 16px;
    border-radius: 10px;
    background: #f4f8f5;
    border: 1px solid #dce7df;
}

.result-box p {
    margin-bottom: 6px;
    font-size: 13px;
    color: #647067;
}

.result-box strong {
    font-size: 20px;
    color: #15803d;
}

.success-message {
    padding: 10px 12px;
    border-radius: 8px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #2563eb;
    font-size: 13px;
}

.error-message {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 13px;
}

.auth-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding-top: 2px;
}

.auth-links a {
    color: #647067;
    font-size: 13px;
    text-decoration: none;
    transition: color 0.15s ease;
}

.auth-links a:hover {
    color: #15803d;
}

.auth-links span {
    width: 1px;
    height: 12px;
    background: #cfd9d3;
}

@media (max-width: 900px) {
    .auth-container {
        grid-template-columns: 1fr;
    }

    .auth-intro {
        padding: 40px;
        gap: 64px;
    }

    .auth-card {
        padding: 40px;
    }

    .intro-text h2 {
        font-size: 28px;
    }
}

@media (max-width: 560px) {
    .auth-page {
        padding: 16px;
    }

    .auth-intro,
    .auth-card {
        padding: 28px;
    }

    .intro-text h2 {
        font-size: 24px;
    }

    .brand h1 {
        font-size: 28px;
    }

    .inline-field {
        grid-template-columns: 1fr;
    }
}
</style>
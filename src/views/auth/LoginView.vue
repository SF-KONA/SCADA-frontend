<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userId = ref('admin')
const password = ref('1234')
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
    <main class="login-page">
        <section class="login-container">
            <div class="login-intro">
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
                    <span class="intro-label">FAB EQUIPMENT MONITORING</span>
                    <h2>
                        공정 설비·환경 데이터를<br />
                        통합 관리하는 관제 시스템
                    </h2>
                    <p>
                        설비 상태, 알림 이력, AI 리포트, 사용자 권한을 하나의 화면에서
                        안정적으로 관리합니다.
                    </p>
                </div>

                <div class="intro-tags">
                    <span>Equipment</span>
                    <span>Alarm</span>
                    <span>AI Report</span>
                    <span>Control</span>
                </div>
            </div>

            <div class="login-card">
                <div class="login-card-header">
                    <p>ADMIN ACCESS</p>
                    <h2>로그인</h2>
                    <span>계정 정보를 입력하여 시스템에 접속하세요.</span>
                </div>

                <form @submit.prevent="handleLogin" class="login-form">
                    <div class="form-field">
                        <label for="userId">아이디</label>
                        <input
                            id="userId"
                            v-model="userId"
                            type="text"
                            placeholder="아이디를 입력하세요"
                            autocomplete="username"
                        />
                    </div>

                    <div class="form-field">
                        <label for="password">비밀번호</label>
                        <input
                            id="password"
                            v-model="password"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            autocomplete="current-password"
                        />
                    </div>

                    <p v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </p>

                    <button type="submit" :disabled="isLoading" class="login-button">
                        {{ isLoading ? '로그인 중...' : '로그인' }}
                    </button>

                    <div class="login-links">
                        <RouterLink to="/find-id">아이디 찾기</RouterLink>
                        <span></span>
                        <RouterLink to="/find-password">비밀번호 찾기</RouterLink>
                    </div>
                </form>
            </div>
        </section>
    </main>
</template>

<style scoped>
.login-page {
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

.login-container {
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

.login-intro {
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

.login-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 48px;
    background: #ffffff;
    color: #17211b;
}

.login-card-header {
    margin-bottom: 32px;
}

.login-card-header p {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #15803d;
}

.login-card-header h2 {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.04em;
    color: #17211b;
    text-shadow: none;
}

.login-card-header span {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #647067;
}

.login-form {
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

.error-message {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 13px;
}

.login-button {
    height: 46px;
    border: 0;
    border-radius: 8px;
    background: #15803d;
    color: #ffffff;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        transform 0.15s ease;
}

.login-button:hover {
    background: #166534;
}

.login-button:active {
    transform: translateY(1px);
}

.login-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.login-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding-top: 2px;
}

.login-links a {
    color: #647067;
    font-size: 13px;
    text-decoration: none;
    transition: color 0.15s ease;
}

.login-links a:hover {
    color: #15803d;
}

.login-links span {
    width: 1px;
    height: 12px;
    background: #cfd9d3;
}

@media (max-width: 900px) {
    .login-container {
        grid-template-columns: 1fr;
    }

    .login-intro {
        padding: 40px;
        gap: 64px;
    }

    .login-card {
        padding: 40px;
    }

    .intro-text h2 {
        font-size: 28px;
    }
}

@media (max-width: 560px) {
    .login-page {
        padding: 16px;
    }

    .login-intro,
    .login-card {
        padding: 28px;
    }

    .intro-text h2 {
        font-size: 24px;
    }

    .brand h1 {
        font-size: 28px;
    }
}
</style>
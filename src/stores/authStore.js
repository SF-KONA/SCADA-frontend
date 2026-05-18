import { defineStore } from 'pinia'
import http from '@/api/http'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: sessionStorage.getItem('accessToken') || '',
        refreshToken: sessionStorage.getItem('refreshToken') || '',
        user: JSON.parse(sessionStorage.getItem('user') || 'null'),
    }),

    getters: {
        isLoggedIn: state => Boolean(state.accessToken),
        userId: state => state.user?.userId || '',
        userName: state => state.user?.name || '',
        userRole: state => state.user?.role || '',
        userRoleLabel: state => state.user?.roleLabel || '',
        isAdmin: state => state.user?.role === 'ADMIN',
    },

    actions: {
        // 0.1 로그인
        async login(loginData) {
            const res = await http.post('/auth/login', {
                userId: loginData.userId,
                password: loginData.password,
            })

            const data = res.data.data

            this.accessToken = data.accessToken
            this.refreshToken = data.refreshToken
            this.user = {
                userId: data.userId,
                name: data.name,
                role: data.role,
                roleLabel: data.roleLabel,
            }

            sessionStorage.setItem('accessToken', data.accessToken)
            sessionStorage.setItem('refreshToken', data.refreshToken)
            sessionStorage.setItem('user', JSON.stringify(this.user))
        },

        // 0.4 이메일 인증코드 발송
        async sendEmailCode(emailData) {
            const res = await http.post('/auth/email/send', {
                email: emailData.email,
                purpose: emailData.purpose,
            })
            return res.data.data
        },

        // 0.5 이메일 인증코드 확인
        async verifyEmailCode(verifyData) {
            const res = await http.post('/auth/email/verify', {
                email: verifyData.email,
                code: verifyData.code,
                purpose: verifyData.purpose,
            })
            return res.data.data
        },

        // 0.3 로그아웃
        async logout() {
            try {
                await http.post('/auth/logout')
            } catch (_) {
                // 로그아웃 실패해도 로컬 세션은 클리어
            } finally {
                this.clearAuth()
            }
        },

        clearAuth() {
            this.accessToken = ''
            this.refreshToken = ''
            this.user = null

            sessionStorage.removeItem('accessToken')
            sessionStorage.removeItem('refreshToken')
            sessionStorage.removeItem('user')
        },
    },
})
import { defineStore } from 'pinia'

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
        async login(loginData) {
            // 백엔드 연결 전 임시 mock 계정
            if (loginData.userId !== 'admin' || loginData.password !== '1234') {
                throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
            }

            const data = {
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                tokenType: 'Bearer',
                accessTokenExpiresIn: 1800,
                userId: 'admin',
                name: '관리자',
                role: 'ADMIN',
                roleLabel: '관리자',
            }

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

        async sendEmailCode(emailData) {
            const { email, purpose } = emailData

            if (!email.trim()) {
                throw new Error('이메일을 입력해주세요.')
            }

            if (!['FIND_ID', 'FIND_PW'].includes(purpose)) {
                throw new Error('인증 목적이 올바르지 않습니다.')
            }

            // TODO: 백엔드 연결 시 /api/auth/email/send 호출로 교체
            return {
                email,
                expiresIn: 180,
            }
        },

        async verifyEmailCode(verifyData) {
            const { email, code, purpose } = verifyData

            if (!email.trim() || !code.trim()) {
                throw new Error('이메일과 인증 코드를 입력해주세요.')
            }

            // 백엔드 연결 전 임시 인증 코드
            if (code !== '123456') {
                throw new Error('인증 코드가 올바르지 않거나 만료되었습니다.')
            }

            // TODO: 백엔드 연결 시 /api/auth/email/verify 호출로 교체
            if (purpose === 'FIND_ID') {
                return {
                    userId: 'admin',
                }
            }

            if (purpose === 'FIND_PW') {
                return {
                    userId: 'admin',
                    temporaryPassword: 'Temp#1234',
                    resetAt: new Date().toISOString(),
                }
            }

            throw new Error('인증 목적이 올바르지 않습니다.')
        },

        async logout() {
            this.clearAuth()
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
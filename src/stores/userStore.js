import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        createdUser: null,
        isLoading: false,
        errorMessage: '',
    }),

    actions: {
        async createUser(userData) {
            const { userId, password, name, email, role } = userData

            if (!userId.trim() || !password.trim() || !name.trim() || !email.trim() || !role) {
                throw new Error('모든 항목을 입력해주세요.')
            }

            const userIdPattern = /^[A-Za-z0-9]{4,16}$/
            if (!userIdPattern.test(userId)) {
                throw new Error('아이디는 영문·숫자 4~16자로 입력해주세요.')
            }

            const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
            if (!passwordPattern.test(password)) {
                throw new Error('비밀번호는 8자 이상, 영문·숫자·특수문자를 포함해야 합니다.')
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailPattern.test(email)) {
                throw new Error('올바른 이메일 형식으로 입력해주세요.')
            }

            if (!['ADMIN', 'LINE_MGR', 'WORKER'].includes(role)) {
                throw new Error('권한 값이 올바르지 않습니다.')
            }

            // TODO: 백엔드 연결 시 POST /api/users 호출로 교체
            const createdUser = {
                userId,
                role,
            }

            this.createdUser = createdUser

            return createdUser
        },
    },
})
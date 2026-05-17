import { defineStore } from 'pinia'

const MOCK_USERS = [
    { userId: 'admin', name: '김영복', factory: '인천', factoryCode: 'ICN', email: 'admin@dbhitek.com', role: 'ADMIN', roleLabel: '관리자', status: 'ACTIVE', lastLoginAt: '2026-05-18T09:30:00+09:00' },
    { userId: 'line_mgr01', name: '이철수', factory: '인천', factoryCode: 'ICN', email: 'lee@dbhitek.com', role: 'LINE_MGR', roleLabel: '라인장', status: 'ACTIVE', lastLoginAt: '2026-05-17T14:22:00+09:00' },
    { userId: 'line_mgr02', name: '한지수', factory: '평택', factoryCode: 'PTK', email: 'han@dbhitek.com', role: 'LINE_MGR', roleLabel: '라인장', status: 'ACTIVE', lastLoginAt: '2026-05-18T07:55:00+09:00' },
    { userId: 'worker01', name: '박영희', factory: '평택', factoryCode: 'PTK', email: 'park@dbhitek.com', role: 'WORKER', roleLabel: '작업자', status: 'ACTIVE', lastLoginAt: '2026-05-16T08:15:00+09:00' },
    { userId: 'worker02', name: '최민준', factory: '평택', factoryCode: 'PTK', email: 'choi@dbhitek.com', role: 'WORKER', roleLabel: '작업자', status: 'LOCKED', lastLoginAt: '2026-05-10T11:40:00+09:00' },
    { userId: 'worker03', name: '정수연', factory: '인천', factoryCode: 'ICN', email: 'jung@dbhitek.com', role: 'WORKER', roleLabel: '작업자', status: 'INACTIVE', lastLoginAt: '2026-04-20T16:00:00+09:00' },
    { userId: 'worker04', name: '오태양', factory: '인천', factoryCode: 'ICN', email: 'oh@dbhitek.com', role: 'WORKER', roleLabel: '작업자', status: 'ACTIVE', lastLoginAt: '2026-05-17T22:10:00+09:00' },
]

const MOCK_FACTORIES = [
    { factoryCode: 'ICN', factoryName: '인천' },
    { factoryCode: 'PTK', factoryName: '평택' },
]

const ROLE_LABELS = { ADMIN: '관리자', LINE_MGR: '라인장', WORKER: '작업자' }

export const useUserStore = defineStore('user', {
    state: () => ({
        users: [],
        total: 0,
        page: 1,
        pageSize: 20,
        selectedUser: null,
        factories: MOCK_FACTORIES,
        isLoading: false,
        errorMessage: '',
        searchQuery: '',
        filterFactory: '',
        filterRole: '',
        filterStatus: '',
    }),

    getters: {
        filteredUsers: (state) => {
            let list = [...state.users]
            const q = state.searchQuery.toLowerCase()
            if (q) {
                list = list.filter(u =>
                    u.userId.toLowerCase().includes(q) ||
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
                )
            }
            if (state.filterFactory) list = list.filter(u => u.factoryCode === state.filterFactory)
            if (state.filterRole) list = list.filter(u => u.role === state.filterRole)
            if (state.filterStatus) list = list.filter(u => u.status === state.filterStatus)
            return list
        },
        pagedUsers() {
            const start = (this.page - 1) * this.pageSize
            return this.filteredUsers.slice(start, start + this.pageSize)
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize))
        },
    },

    actions: {
        async loadUsers() {
            try {
                this.isLoading = true
                this.errorMessage = ''
                // TODO: 백엔드 연결 시 아래 주석 해제, mock 블록 제거
                // const { data } = await getUsers({ q: this.searchQuery, factory: this.filterFactory, role: this.filterRole, status: this.filterStatus, page: this.page, size: this.pageSize })
                // this.users = data.data.items
                // this.total = data.data.total
                await new Promise(r => setTimeout(r, 200))
                this.users = [...MOCK_USERS]
                this.total = MOCK_USERS.length
            } catch (e) {
                this.errorMessage = e.message || '사용자 목록을 불러오지 못했습니다.'
            } finally {
                this.isLoading = false
            }
        },

        selectUser(userId) {
            this.selectedUser = this.users.find(u => u.userId === userId) ?? null
        },

        async createUser(userData) {
            const { userId, password, name, email, factoryCode, role } = userData

            if (!userId.trim() || !password.trim() || !name.trim() || !email.trim() || !factoryCode || !role) {
                throw new Error('모든 필수 항목을 입력해주세요.')
            }
            if (!/^[A-Za-z0-9]{4,16}$/.test(userId)) {
                throw new Error('아이디는 영문·숫자 4~16자로 입력해주세요.')
            }
            if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
                throw new Error('비밀번호는 8자 이상, 영문·숫자·특수문자를 포함해야 합니다.')
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error('올바른 이메일 형식으로 입력해주세요.')
            }
            if (this.users.some(u => u.userId === userId)) {
                throw new Error('이미 사용 중인 아이디입니다.')
            }
            if (this.users.some(u => u.email === email)) {
                throw new Error('이미 사용 중인 이메일입니다.')
            }

            // TODO: 백엔드 연결 시 POST /api/users 호출로 교체
            const factoryObj = this.factories.find(f => f.factoryCode === factoryCode)
            const newUser = {
                userId, name, email,
                factory: factoryObj?.factoryName ?? factoryCode,
                factoryCode, role,
                roleLabel: ROLE_LABELS[role],
                status: 'ACTIVE',
                lastLoginAt: null,
            }
            this.users.push(newUser)
            this.total = this.users.length
        },

        async updateUser(userId, data) {
            // TODO: 백엔드 연결 시 PUT /api/users/{userId} 호출로 교체
            const idx = this.users.findIndex(u => u.userId === userId)
            if (idx === -1) throw new Error('사용자를 찾을 수 없습니다.')
            const factoryObj = this.factories.find(f => f.factoryCode === data.factoryCode)
            this.users[idx] = {
                ...this.users[idx],
                ...data,
                factory: factoryObj?.factoryName ?? this.users[idx].factory,
                roleLabel: ROLE_LABELS[data.role] ?? this.users[idx].roleLabel,
            }
            this.selectedUser = { ...this.users[idx] }
        },

        async resetPassword(userId) {
            // TODO: 백엔드 연결 시 POST /api/users/{userId}/reset-password 호출로 교체
        },

        async lockUser(userId) {
            // TODO: 백엔드 연결 시 POST /api/users/{userId}/lock 호출로 교체
            this._setStatus(userId, 'LOCKED')
        },

        async unlockUser(userId) {
            // TODO: 백엔드 연결 시 POST /api/users/{userId}/unlock 호출로 교체
            this._setStatus(userId, 'ACTIVE')
        },

        async deactivateUser(userId) {
            // TODO: 백엔드 연결 시 POST /api/users/{userId}/deactivate 호출로 교체
            this._setStatus(userId, 'INACTIVE')
        },

        async activateUser(userId) {
            // TODO: 백엔드 연결 시 POST /api/users/{userId}/activate 호출로 교체
            this._setStatus(userId, 'ACTIVE')
        },

        _setStatus(userId, status) {
            const u = this.users.find(u => u.userId === userId)
            if (u) u.status = status
            if (this.selectedUser?.userId === userId) this.selectedUser = { ...u }
        },

        resetFilters() {
            this.searchQuery = ''
            this.filterFactory = ''
            this.filterRole = ''
            this.filterStatus = ''
            this.page = 1
        },
    },
})

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/auth'

const store = useUserStore()
const auth = useAuthStore()

// ── 패널 모드: 'register' | 'detail' ─────────────────────────────────────
const panelMode = ref('register')

// ── 검색 디바운스 ─────────────────────────────────────────────────────────
let searchTimer = null
const searchInput = ref('')
watch(searchInput, (val) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        store.searchQuery = val
        store.page = 1
    }, 300)
})

// ── 필터 변경 시 페이지 리셋 ─────────────────────────────────────────────
watch([() => store.filterFactory, () => store.filterRole, () => store.filterStatus], () => {
    store.page = 1
})

// ── 행 선택 ──────────────────────────────────────────────────────────────
const selectRow = (userId) => {
    store.selectUser(userId)
    panelMode.value = 'detail'
    // 상세 패널 편집 폼 초기화
    const u = store.selectedUser
    if (u) {
        editForm.value = { email: u.email, factoryCode: u.factoryCode, role: u.role }
    }
}

// ── 등록 폼 ──────────────────────────────────────────────────────────────
const registerForm = ref({ userId: '', password: '', name: '', email: '', factoryCode: '', role: '' })
const registerError = ref('')
const registerSuccess = ref('')
const isRegistering = ref(false)

const submitRegister = async () => {
    registerError.value = ''
    registerSuccess.value = ''
    isRegistering.value = true
    try {
        await store.createUser(registerForm.value)
        registerSuccess.value = '사용자가 등록되었습니다.'
        registerForm.value = { userId: '', password: '', name: '', email: '', factoryCode: '', role: '' }
    } catch (e) {
        registerError.value = e.message
    } finally {
        isRegistering.value = false
    }
}

// ── 상세·수정 폼 ──────────────────────────────────────────────────────────
const editForm = ref({ email: '', factoryCode: '', role: '' })
const editError = ref('')
const editSuccess = ref('')
const isSaving = ref(false)

const submitEdit = async () => {
    editError.value = ''
    editSuccess.value = ''
    isSaving.value = true
    try {
        await store.updateUser(store.selectedUser.userId, editForm.value)
        editSuccess.value = '수정되었습니다.'
    } catch (e) {
        editError.value = e.message
    } finally {
        isSaving.value = false
    }
}

// ── 확인 다이얼로그 ──────────────────────────────────────────────────────
const confirm = ref({ visible: false, message: '', action: null })

const openConfirm = (message, action) => {
    confirm.value = { visible: true, message, action }
}

const doConfirm = async () => {
    if (confirm.value.action) await confirm.value.action()
    confirm.value.visible = false
}

// ── 위험 액션 ─────────────────────────────────────────────────────────────
const actionLoading = ref(false)

const handleAction = (message, fn) => {
    openConfirm(message, async () => {
        actionLoading.value = true
        try { await fn() } finally { actionLoading.value = false }
    })
}

const doResetPassword = () => handleAction(
    `${store.selectedUser?.name}의 비밀번호를 초기화하시겠습니까? 임시 비밀번호가 이메일로 발송됩니다.`,
    () => store.resetPassword(store.selectedUser.userId)
)
const doLock = () => handleAction(
    `${store.selectedUser?.name} 계정을 잠금 처리하시겠습니까?`,
    () => store.lockUser(store.selectedUser.userId)
)
const doUnlock = () => handleAction(
    `${store.selectedUser?.name} 계정 잠금을 해제하시겠습니까?`,
    () => store.unlockUser(store.selectedUser.userId)
)
const doDeactivate = () => handleAction(
    `${store.selectedUser?.name} 계정을 비활성화하시겠습니까? 해당 사용자는 로그인이 불가능해집니다.`,
    () => store.deactivateUser(store.selectedUser.userId)
)
const doActivate = () => handleAction(
    `${store.selectedUser?.name} 계정을 활성화하시겠습니까?`,
    () => store.activateUser(store.selectedUser.userId)
)

// ── 헬퍼 ─────────────────────────────────────────────────────────────────
const formatLoginTime = (iso) => {
    if (!iso) return '-'
    const diff = Math.abs(Date.now() - new Date(iso).getTime())
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (d >= 1) return `${d}일 전`
    return `${h}시간 전`
}

const roleBadgeClass = (role) => ({
    ADMIN: 'bg-red-100 text-red-700',
    LINE_MGR: 'bg-blue-100 text-blue-700',
    WORKER: 'bg-green-100 text-green-700',
}[role] ?? 'bg-gray-100 text-gray-600')

const statusDotClass = (status) => ({
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-gray-400',
    LOCKED: 'bg-red-500',
}[status] ?? 'bg-gray-400')

const statusLabel = (status) => ({ ACTIVE: '활성', INACTIVE: '비활성', LOCKED: '잠금' }[status] ?? status)

onMounted(() => store.loadUsers())
</script>

<template>
    <div class="flex flex-col h-full bg-gray-50 overflow-hidden">

        <!-- 페이지 헤더 -->
        <div class="shrink-0 px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
            <i class="fa-solid fa-users-gear text-[#15803D] text-xl"></i>
            <h1 class="text-xl font-bold text-gray-900">사용자 관리</h1>
            <span class="text-sm text-gray-400 font-medium">총 {{ store.filteredUsers.length }}명</span>
        </div>

        <!-- 본문 분할 레이아웃 -->
        <div class="flex flex-1 gap-4 p-4 overflow-hidden">

            <!-- ── 좌측: 사용자 목록 (62%) ─────────────────────────────── -->
            <div class="flex flex-col w-[62%] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                <!-- 검색 + 필터 -->
                <div class="shrink-0 p-4 border-b border-gray-100 flex flex-wrap gap-2 items-center">
                    <!-- 검색창 -->
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input
                            v-model="searchInput"
                            type="text"
                            placeholder="아이디 · 이름 · 이메일 검색"
                            class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]"
                        />
                    </div>
                    <!-- 필터: 소속공장 -->
                    <select
                        v-model="store.filterFactory"
                        class="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#15803D] text-gray-600"
                    >
                        <option value="">전체 공장</option>
                        <option v-for="f in store.factories" :key="f.factoryCode" :value="f.factoryCode">{{ f.factoryName }}</option>
                    </select>
                    <!-- 필터: 역할 -->
                    <select
                        v-model="store.filterRole"
                        class="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#15803D] text-gray-600"
                    >
                        <option value="">전체 역할</option>
                        <option value="ADMIN">관리자</option>
                        <option value="LINE_MGR">라인장</option>
                        <option value="WORKER">작업자</option>
                    </select>
                    <!-- 필터: 상태 -->
                    <select
                        v-model="store.filterStatus"
                        class="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#15803D] text-gray-600"
                    >
                        <option value="">전체 상태</option>
                        <option value="ACTIVE">활성</option>
                        <option value="INACTIVE">비활성</option>
                        <option value="LOCKED">잠금</option>
                    </select>
                    <!-- 필터 초기화 -->
                    <button
                        v-if="store.searchQuery || store.filterFactory || store.filterRole || store.filterStatus"
                        class="text-sm text-gray-400 hover:text-gray-600 px-2"
                        @click="store.resetFilters(); searchInput = ''"
                    >
                        초기화
                    </button>
                </div>

                <!-- 테이블 -->
                <div class="flex-1 overflow-auto">
                    <table class="w-full text-base table-fixed">
                        <thead class="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:18%">사용자 ID</th>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:14%">이름</th>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:12%">소속공장</th>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:24%">이메일</th>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:13%">역할</th>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:10%">상태</th>
                                <th class="text-left px-4 py-3 text-sm font-semibold text-gray-500" style="width:9%">최종 로그인</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- 로딩 스켈레톤 -->
                            <template v-if="store.isLoading">
                                <tr v-for="i in 5" :key="i" class="border-b border-gray-100">
                                    <td colspan="7" class="px-4 py-3">
                                        <div class="h-4 bg-gray-100 rounded animate-pulse"></div>
                                    </td>
                                </tr>
                            </template>

                            <!-- 빈 상태 -->
                            <tr v-else-if="store.filteredUsers.length === 0">
                                <td colspan="7" class="py-16 text-center text-gray-400">
                                    <i class="fa-solid fa-user-slash text-3xl mb-3 block"></i>
                                    검색 결과가 없습니다.
                                </td>
                            </tr>

                            <!-- 데이터 행 -->
                            <tr
                                v-else
                                v-for="user in store.pagedUsers"
                                :key="user.userId"
                                class="border-b border-gray-100 cursor-pointer transition-colors"
                                :class="[
                                    store.selectedUser?.userId === user.userId
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                                ]"
                                @click="selectRow(user.userId)"
                            >
                                <td class="px-4 py-3 font-mono text-gray-700 font-medium truncate">{{ user.userId }}</td>
                                <td class="px-4 py-3 text-gray-900 font-medium truncate">{{ user.name }}</td>
                                <td class="px-4 py-3 text-gray-600 truncate">{{ user.factory }}</td>
                                <td class="px-4 py-3 text-gray-600 truncate">{{ user.email }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium" :class="roleBadgeClass(user.role)">
                                        {{ user.roleLabel }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center gap-1.5 text-sm text-gray-700">
                                        <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotClass(user.status)"></span>
                                        <i v-if="user.status === 'LOCKED'" class="fa-solid fa-lock text-red-500 text-xs"></i>
                                        {{ statusLabel(user.status) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-400 truncate">{{ formatLoginTime(user.lastLoginAt) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 페이지네이션 -->
                <div class="shrink-0 px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span class="text-xs text-gray-400">
                        총 {{ store.filteredUsers.length }}명 중 {{ (store.page - 1) * store.pageSize + 1 }}–{{ Math.min(store.page * store.pageSize, store.filteredUsers.length) }}명
                    </span>
                    <div class="flex items-center gap-1">
                        <button
                            class="px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            :disabled="store.page === 1"
                            @click="store.page--"
                        >이전</button>
                        <button
                            v-for="p in store.totalPages"
                            :key="p"
                            class="px-2.5 py-1 text-xs border rounded"
                            :class="store.page === p ? 'bg-[#15803D] text-white border-[#15803D]' : 'border-gray-200 hover:bg-gray-50'"
                            @click="store.page = p"
                        >{{ p }}</button>
                        <button
                            class="px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            :disabled="store.page === store.totalPages"
                            @click="store.page++"
                        >다음</button>
                    </div>
                </div>
            </div>

            <!-- ── 우측: 등록 폼 / 상세 패널 (38%) ───────────────────────── -->
            <div class="flex flex-col w-[38%] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                <!-- 모드 탭 -->
                <div class="shrink-0 flex border-b border-gray-200">
                    <button
                        class="flex-1 py-3 text-sm font-medium transition-colors"
                        :class="panelMode === 'register' ? 'text-[#15803D] border-b-2 border-[#15803D] bg-green-50/50' : 'text-gray-500 hover:text-gray-700'"
                        @click="panelMode = 'register'"
                    >
                        <i class="fa-solid fa-user-plus mr-1.5"></i>사용자 등록
                    </button>
                    <button
                        class="flex-1 py-3 text-sm font-medium transition-colors"
                        :class="panelMode === 'detail' ? 'text-[#15803D] border-b-2 border-[#15803D] bg-green-50/50' : 'text-gray-500 hover:text-gray-700'"
                        @click="panelMode = 'detail'"
                    >
                        <i class="fa-solid fa-user-pen mr-1.5"></i>상세 / 수정
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-5">

                    <!-- ── 등록 폼 ────────────────────────────────────────── -->
                    <template v-if="panelMode === 'register'">
                        <form @submit.prevent="submitRegister" class="flex flex-col gap-4">

                            <div v-if="registerError" class="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                <i class="fa-solid fa-circle-exclamation mr-1.5"></i>{{ registerError }}
                            </div>
                            <div v-if="registerSuccess" class="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                <i class="fa-solid fa-circle-check mr-1.5"></i>{{ registerSuccess }}
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-600">사용자 ID <span class="text-red-500">*</span></label>
                                <input v-model="registerForm.userId" type="text" placeholder="영문·숫자 4~16자"
                                    class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-600">비밀번호 <span class="text-red-500">*</span></label>
                                <input v-model="registerForm.password" type="password" placeholder="영문+숫자+특수문자 8자 이상"
                                    class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-600">이름 <span class="text-red-500">*</span></label>
                                <input v-model="registerForm.name" type="text" placeholder="이름"
                                    class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-600">이메일 <span class="text-red-500">*</span></label>
                                <input v-model="registerForm.email" type="email" placeholder="example@dbhitek.com"
                                    class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-600">소속공장 <span class="text-red-500">*</span></label>
                                <select v-model="registerForm.factoryCode"
                                    class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] text-gray-700">
                                    <option value="">선택</option>
                                    <option v-for="f in store.factories" :key="f.factoryCode" :value="f.factoryCode">{{ f.factoryName }}</option>
                                </select>
                            </div>

                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-semibold text-gray-600">역할 <span class="text-red-500">*</span></label>
                                <select v-model="registerForm.role"
                                    class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] text-gray-700">
                                    <option value="">선택</option>
                                    <option value="ADMIN">관리자</option>
                                    <option value="LINE_MGR">라인장</option>
                                    <option value="WORKER">작업자</option>
                                </select>
                            </div>

                            <div class="mt-2 flex justify-center">
                                <button
                                    type="submit"
                                    :disabled="isRegistering"
                                    class="w-4/5 py-4 bg-[#15803D] text-white text-base font-semibold rounded-lg hover:bg-[#166534] transition-colors disabled:opacity-50"
                                >
                                    <i class="fa-solid fa-plus mr-1.5"></i>
                                    {{ isRegistering ? '등록 중...' : '등록' }}
                                </button>
                            </div>
                        </form>
                    </template>

                    <!-- ── 상세 / 수정 패널 ───────────────────────────────── -->
                    <template v-else>
                        <div v-if="!store.selectedUser" class="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
                            <i class="fa-solid fa-arrow-left text-2xl"></i>
                            목록에서 사용자를 선택해주세요.
                        </div>

                        <template v-else>
                            <!-- 사용자 요약 -->
                            <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-5">
                                <div class="w-11 h-11 rounded-full bg-[#15803D]/10 flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-user text-[#15803D]"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="font-bold text-gray-900 text-base">{{ store.selectedUser.name }}</span>
                                        <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="roleBadgeClass(store.selectedUser.role)">
                                            {{ store.selectedUser.roleLabel }}
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-500 font-mono mt-0.5">{{ store.selectedUser.userId }}</div>
                                </div>
                                <span class="inline-flex items-center gap-1.5 text-xs shrink-0">
                                    <span class="w-2 h-2 rounded-full" :class="statusDotClass(store.selectedUser.status)"></span>
                                    <i v-if="store.selectedUser.status === 'LOCKED'" class="fa-solid fa-lock text-red-500 text-[10px]"></i>
                                    {{ statusLabel(store.selectedUser.status) }}
                                </span>
                            </div>

                            <!-- 수정 폼 -->
                            <div v-if="editError" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                <i class="fa-solid fa-circle-exclamation mr-1.5"></i>{{ editError }}
                            </div>
                            <div v-if="editSuccess" class="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                <i class="fa-solid fa-circle-check mr-1.5"></i>{{ editSuccess }}
                            </div>

                            <div class="flex flex-col gap-4 mb-5">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-gray-600">이메일</label>
                                    <input v-model="editForm.email" type="email"
                                        class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]" />
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-gray-600">소속공장</label>
                                    <select v-model="editForm.factoryCode"
                                        class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] text-gray-700">
                                        <option v-for="f in store.factories" :key="f.factoryCode" :value="f.factoryCode">{{ f.factoryName }}</option>
                                    </select>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-gray-600">역할</label>
                                    <select v-model="editForm.role"
                                        class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#15803D] text-gray-700">
                                        <option value="ADMIN">관리자</option>
                                        <option value="LINE_MGR">라인장</option>
                                        <option value="WORKER">작업자</option>
                                    </select>
                                </div>

                                <div class="flex justify-center">
                                    <button
                                        :disabled="isSaving"
                                        class="w-4/5 py-4 bg-[#15803D] text-white text-base font-semibold rounded-lg hover:bg-[#166534] transition-colors disabled:opacity-50"
                                        @click="submitEdit"
                                    >
                                        <i class="fa-solid fa-floppy-disk mr-1.5"></i>
                                        {{ isSaving ? '저장 중...' : '수정 저장' }}
                                    </button>
                                </div>
                            </div>

                            <!-- 관리 액션 -->
                            <div class="border-t border-gray-100 pt-4">
                                <p class="text-xs font-semibold text-gray-500 mb-3">계정 관리</p>
                                <div class="flex flex-col gap-2">
                                    <button
                                        class="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                                        @click="doResetPassword"
                                    >
                                        <i class="fa-solid fa-key text-amber-500 w-4 text-center"></i>
                                        비밀번호 초기화
                                    </button>

                                    <button
                                        v-if="store.selectedUser.status !== 'LOCKED'"
                                        class="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                                        @click="doLock"
                                    >
                                        <i class="fa-solid fa-lock text-orange-500 w-4 text-center"></i>
                                        계정 잠금
                                    </button>
                                    <button
                                        v-else
                                        class="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                                        @click="doUnlock"
                                    >
                                        <i class="fa-solid fa-lock-open text-blue-500 w-4 text-center"></i>
                                        잠금 해제
                                    </button>

                                    <button
                                        v-if="store.selectedUser.status !== 'INACTIVE'"
                                        class="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-red-600"
                                        @click="doDeactivate"
                                    >
                                        <i class="fa-solid fa-user-slash w-4 text-center"></i>
                                        계정 비활성화
                                    </button>
                                    <button
                                        v-else
                                        class="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-green-700"
                                        @click="doActivate"
                                    >
                                        <i class="fa-solid fa-user-check w-4 text-center"></i>
                                        계정 활성화
                                    </button>
                                </div>
                            </div>
                        </template>
                    </template>

                </div>
            </div>
        </div>

        <!-- ── 확인 다이얼로그 ──────────────────────────────────────────── -->
        <Teleport to="body">
            <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="confirm.visible"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    @click.self="confirm.visible = false"
                >
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                        <div class="flex items-start gap-3 mb-5">
                            <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
                            </div>
                            <p class="text-sm text-gray-700 leading-relaxed pt-1">{{ confirm.message }}</p>
                        </div>
                        <div class="flex gap-2 justify-end">
                            <button
                                class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                                @click="confirm.visible = false"
                            >취소</button>
                            <button
                                class="px-4 py-2 text-sm bg-[#15803D] text-white rounded-lg hover:bg-[#166534] font-medium"
                                :disabled="actionLoading"
                                @click="doConfirm"
                            >확인</button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
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

    const u = store.selectedUser
    if (u) {
        editForm.value = {
            email: u.email,
            factoryCode: u.factoryCode,
            role: u.role,
        }
    }
}

// ── 등록 폼 ──────────────────────────────────────────────────────────────
const registerForm = ref({
    userId: '',
    password: '',
    name: '',
    email: '',
    factoryCode: '',
    role: '',
})

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
        registerForm.value = {
            userId: '',
            password: '',
            name: '',
            email: '',
            factoryCode: '',
            role: '',
        }
    } catch (e) {
        registerError.value = e.message
    } finally {
        isRegistering.value = false
    }
}

// ── 상세·수정 폼 ──────────────────────────────────────────────────────────
const editForm = ref({
    email: '',
    factoryCode: '',
    role: '',
})

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
const confirm = ref({
    visible: false,
    message: '',
    action: null,
})

const openConfirm = (message, action) => {
    confirm.value = {
        visible: true,
        message,
        action,
    }
}

const doConfirm = async () => {
    if (confirm.value.action) {
        await confirm.value.action()
    }

    confirm.value.visible = false
}

// ── 위험 액션 ─────────────────────────────────────────────────────────────
const actionLoading = ref(false)

const handleAction = (message, fn) => {
    openConfirm(message, async () => {
        actionLoading.value = true

        try {
            await fn()
        } finally {
            actionLoading.value = false
        }
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
    ADMIN: 'admin',
    LINE_MGR: 'line-manager',
    WORKER: 'worker',
}[role] ?? 'default')

const statusDotClass = (status) => ({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    LOCKED: 'locked',
}[status] ?? 'inactive')

const statusLabel = (status) => ({
    ACTIVE: '활성',
    INACTIVE: '비활성',
    LOCKED: '잠금',
}[status] ?? status)

onMounted(() => store.loadUsers())
</script>

<template>
    <main class="user-page">
        <!-- 페이지 헤더 -->
        <section class="page-header">
            <div class="page-title-wrap">
                <div class="page-icon">
                    <i class="fa-solid fa-users-gear"></i>
                </div>

                <div>
                    <p class="page-eyebrow">USER MANAGEMENT</p>
                    <h1>사용자 관리</h1>
                </div>

                <span class="total-chip">총 {{ store.filteredUsers.length }}명</span>
            </div>
        </section>

        <!-- 본문 분할 레이아웃 -->
        <section class="user-layout">
            <!-- 좌측: 사용자 목록 -->
            <section class="user-list-panel">
                <div class="panel-toolbar">
                    <div class="search-box">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input
                            v-model="searchInput"
                            type="text"
                            placeholder="아이디 · 이름 · 이메일 검색"
                        />
                    </div>

                    <div class="filter-group">
                        <select v-model="store.filterFactory">
                            <option value="">전체 공장</option>
                            <option
                                v-for="f in store.factories"
                                :key="f.factoryCode"
                                :value="f.factoryCode"
                            >
                                {{ f.factoryName }}
                            </option>
                        </select>

                        <select v-model="store.filterRole">
                            <option value="">전체 역할</option>
                            <option value="ADMIN">관리자</option>
                            <option value="LINE_MGR">라인장</option>
                            <option value="WORKER">작업자</option>
                        </select>

                        <select v-model="store.filterStatus">
                            <option value="">전체 상태</option>
                            <option value="ACTIVE">활성</option>
                            <option value="INACTIVE">비활성</option>
                            <option value="LOCKED">잠금</option>
                        </select>

                        <button
                            v-if="store.searchQuery || store.filterFactory || store.filterRole || store.filterStatus"
                            type="button"
                            class="reset-filter-button"
                            @click="store.resetFilters(); searchInput = ''"
                        >
                            초기화
                        </button>
                    </div>
                </div>

                <!-- 테이블 -->
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:18%">사용자 ID</th>
                                <th style="width:14%">이름</th>
                                <th style="width:12%">소속공장</th>
                                <th style="width:24%">이메일</th>
                                <th style="width:13%">역할</th>
                                <th style="width:10%">상태</th>
                                <th style="width:9%">최종 로그인</th>
                            </tr>
                        </thead>

                        <tbody>
                            <!-- 로딩 스켈레톤 -->
                            <template v-if="store.isLoading">
                                <tr v-for="i in 5" :key="i">
                                    <td colspan="7">
                                        <div class="skeleton-line"></div>
                                    </td>
                                </tr>
                            </template>

                            <!-- 빈 상태 -->
                            <tr v-else-if="store.filteredUsers.length === 0">
                                <td colspan="7" class="empty-table">
                                    <i class="fa-solid fa-user-slash"></i>
                                    <p>검색 결과가 없습니다.</p>
                                </td>
                            </tr>

                            <!-- 데이터 행 -->
                            <tr
                                v-else
                                v-for="user in store.pagedUsers"
                                :key="user.userId"
                                class="user-row"
                                :class="{ selected: store.selectedUser?.userId === user.userId }"
                                @click="selectRow(user.userId)"
                            >
                                <td>
                                    <span class="user-id">{{ user.userId }}</span>
                                </td>

                                <td>
                                    <strong class="user-name">{{ user.name }}</strong>
                                </td>

                                <td>{{ user.factory }}</td>
                                <td class="email-cell">{{ user.email }}</td>

                                <td>
                                    <span class="role-badge" :class="roleBadgeClass(user.role)">
                                        {{ user.roleLabel }}
                                    </span>
                                </td>

                                <td>
                                    <span class="status-text">
                                        <span class="status-dot" :class="statusDotClass(user.status)"></span>
                                        <i
                                            v-if="user.status === 'LOCKED'"
                                            class="fa-solid fa-lock lock-icon"
                                        ></i>
                                        {{ statusLabel(user.status) }}
                                    </span>
                                </td>

                                <td class="login-time">
                                    {{ formatLoginTime(user.lastLoginAt) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 페이지네이션 -->
                <div class="pagination-bar">
                    <span>
                        총 {{ store.filteredUsers.length }}명 중
                        {{ (store.page - 1) * store.pageSize + 1 }}–{{ Math.min(store.page * store.pageSize, store.filteredUsers.length) }}명
                    </span>

                    <div class="pagination-buttons">
                        <button
                            type="button"
                            :disabled="store.page === 1"
                            @click="store.page--"
                        >
                            이전
                        </button>

                        <button
                            v-for="p in store.totalPages"
                            :key="p"
                            type="button"
                            :class="{ active: store.page === p }"
                            @click="store.page = p"
                        >
                            {{ p }}
                        </button>

                        <button
                            type="button"
                            :disabled="store.page === store.totalPages"
                            @click="store.page++"
                        >
                            다음
                        </button>
                    </div>
                </div>
            </section>

            <!-- 우측: 등록 폼 / 상세 패널 -->
            <aside class="user-form-panel">
                <!-- 모드 탭 -->
                <div class="panel-tabs">
                    <button
                        type="button"
                        :class="{ active: panelMode === 'register' }"
                        @click="panelMode = 'register'"
                    >
                        <i class="fa-solid fa-user-plus"></i>
                        사용자 등록
                    </button>

                    <button
                        type="button"
                        :class="{ active: panelMode === 'detail' }"
                        @click="panelMode = 'detail'"
                    >
                        <i class="fa-solid fa-user-pen"></i>
                        상세 / 수정
                    </button>
                </div>

                <div class="form-panel-body">
                    <!-- 등록 폼 -->
                    <template v-if="panelMode === 'register'">
                        <form class="account-form" @submit.prevent="submitRegister">
                            <div v-if="registerError" class="message-box error">
                                <i class="fa-solid fa-circle-exclamation"></i>
                                {{ registerError }}
                            </div>

                            <div v-if="registerSuccess" class="message-box success">
                                <i class="fa-solid fa-circle-check"></i>
                                {{ registerSuccess }}
                            </div>

                            <div class="form-field">
                                <label>사용자 ID <span>*</span></label>
                                <input
                                    v-model="registerForm.userId"
                                    type="text"
                                    placeholder="영문·숫자 4~16자"
                                />
                            </div>

                            <div class="form-field">
                                <label>비밀번호 <span>*</span></label>
                                <input
                                    v-model="registerForm.password"
                                    type="password"
                                    placeholder="영문+숫자+특수문자 8자 이상"
                                />
                            </div>

                            <div class="form-field">
                                <label>이름 <span>*</span></label>
                                <input
                                    v-model="registerForm.name"
                                    type="text"
                                    placeholder="이름"
                                />
                            </div>

                            <div class="form-field">
                                <label>이메일 <span>*</span></label>
                                <input
                                    v-model="registerForm.email"
                                    type="email"
                                    placeholder="example@dbhitek.com"
                                />
                            </div>

                            <div class="form-field">
                                <label>소속공장 <span>*</span></label>
                                <select v-model="registerForm.factoryCode">
                                    <option value="">선택</option>
                                    <option
                                        v-for="f in store.factories"
                                        :key="f.factoryCode"
                                        :value="f.factoryCode"
                                    >
                                        {{ f.factoryName }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-field">
                                <label>역할 <span>*</span></label>
                                <select v-model="registerForm.role">
                                    <option value="">선택</option>
                                    <option value="ADMIN">관리자</option>
                                    <option value="LINE_MGR">라인장</option>
                                    <option value="WORKER">작업자</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                class="primary-submit-button"
                                :disabled="isRegistering"
                            >
                                <i class="fa-solid fa-plus"></i>
                                {{ isRegistering ? '등록 중...' : '등록' }}
                            </button>
                        </form>
                    </template>

                    <!-- 상세 / 수정 패널 -->
                    <template v-else>
                        <div v-if="!store.selectedUser" class="select-empty">
                            <i class="fa-solid fa-arrow-left"></i>
                            <p>목록에서 사용자를 선택해주세요.</p>
                        </div>

                        <template v-else>
                            <!-- 사용자 요약 -->
                            <div class="selected-user-card">
                                <div class="selected-avatar">
                                    <i class="fa-solid fa-user"></i>
                                </div>

                                <div class="selected-user-info">
                                    <div class="selected-name-row">
                                        <strong>{{ store.selectedUser.name }}</strong>
                                        <span class="role-badge" :class="roleBadgeClass(store.selectedUser.role)">
                                            {{ store.selectedUser.roleLabel }}
                                        </span>
                                    </div>

                                    <p>{{ store.selectedUser.userId }}</p>
                                </div>

                                <span class="selected-status">
                                    <span class="status-dot" :class="statusDotClass(store.selectedUser.status)"></span>
                                    <i
                                        v-if="store.selectedUser.status === 'LOCKED'"
                                        class="fa-solid fa-lock lock-icon"
                                    ></i>
                                    {{ statusLabel(store.selectedUser.status) }}
                                </span>
                            </div>

                            <div v-if="editError" class="message-box error">
                                <i class="fa-solid fa-circle-exclamation"></i>
                                {{ editError }}
                            </div>

                            <div v-if="editSuccess" class="message-box success">
                                <i class="fa-solid fa-circle-check"></i>
                                {{ editSuccess }}
                            </div>

                            <div class="account-form">
                                <div class="form-field">
                                    <label>이메일</label>
                                    <input v-model="editForm.email" type="email" />
                                </div>

                                <div class="form-field">
                                    <label>소속공장</label>
                                    <select v-model="editForm.factoryCode">
                                        <option
                                            v-for="f in store.factories"
                                            :key="f.factoryCode"
                                            :value="f.factoryCode"
                                        >
                                            {{ f.factoryName }}
                                        </option>
                                    </select>
                                </div>

                                <div class="form-field">
                                    <label>역할</label>
                                    <select v-model="editForm.role">
                                        <option value="ADMIN">관리자</option>
                                        <option value="LINE_MGR">라인장</option>
                                        <option value="WORKER">작업자</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    class="primary-submit-button"
                                    :disabled="isSaving"
                                    @click="submitEdit"
                                >
                                    <i class="fa-solid fa-floppy-disk"></i>
                                    {{ isSaving ? '저장 중...' : '수정 저장' }}
                                </button>
                            </div>

                            <!-- 관리 액션 -->
                            <div class="account-actions">
                                <p>계정 관리</p>

                                <button type="button" class="action-button" @click="doResetPassword">
                                    <i class="fa-solid fa-key amber"></i>
                                    비밀번호 초기화
                                </button>

                                <button
                                    v-if="store.selectedUser.status !== 'LOCKED'"
                                    type="button"
                                    class="action-button"
                                    @click="doLock"
                                >
                                    <i class="fa-solid fa-lock orange"></i>
                                    계정 잠금
                                </button>

                                <button
                                    v-else
                                    type="button"
                                    class="action-button"
                                    @click="doUnlock"
                                >
                                    <i class="fa-solid fa-lock-open blue"></i>
                                    잠금 해제
                                </button>

                                <button
                                    v-if="store.selectedUser.status !== 'INACTIVE'"
                                    type="button"
                                    class="action-button danger"
                                    @click="doDeactivate"
                                >
                                    <i class="fa-solid fa-user-slash"></i>
                                    계정 비활성화
                                </button>

                                <button
                                    v-else
                                    type="button"
                                    class="action-button success"
                                    @click="doActivate"
                                >
                                    <i class="fa-solid fa-user-check"></i>
                                    계정 활성화
                                </button>
                            </div>
                        </template>
                    </template>
                </div>
            </aside>
        </section>

        <!-- 확인 다이얼로그 -->
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
                    class="confirm-backdrop"
                    @click.self="confirm.visible = false"
                >
                    <div class="confirm-dialog">
                        <div class="confirm-content">
                            <div class="confirm-icon">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </div>

                            <p>{{ confirm.message }}</p>
                        </div>

                        <div class="confirm-actions">
                            <button type="button" class="confirm-cancel" @click="confirm.visible = false">
                                취소
                            </button>

                            <button
                                type="button"
                                class="confirm-ok"
                                :disabled="actionLoading"
                                @click="doConfirm"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </main>
</template>

<style scoped>
* {
    box-sizing: border-box;
}

.user-page {
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    background: #f4f6f5;
    overflow: hidden;
}

.page-header {
    flex-shrink: 0;
    padding: 14px 20px;
    border-bottom: 1px solid #dce3df;
    background: #ffffff;
}

.page-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #f0fdf4;
    color: #15803d;
    font-size: 17px;
}

.page-eyebrow {
    margin-bottom: 2px;
    color: #8a9990;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.08em;
}

.page-title-wrap h1 {
    color: #17211b;
    font-size: 20px;
    font-weight: 850;
    letter-spacing: -0.04em;
}

.total-chip {
    padding: 4px 9px;
    border-radius: 999px;
    background: #f8faf9;
    border: 1px solid #dce3df;
    color: #647067;
    font-size: 12px;
    font-weight: 700;
}

.user-layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(360px, 0.95fr);
    gap: 14px;
    padding: 14px;
    overflow: hidden;
}

.user-list-panel,
.user-form-panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #dce3df;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    overflow: hidden;
}

.panel-toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    border-bottom: 1px solid #edf1ee;
    background: #ffffff;
}

.search-box {
    position: relative;
    flex: 1;
    min-width: 220px;
}

.search-box i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9aa7a0;
    font-size: 13px;
}

.search-box input,
.filter-group select,
.form-field input,
.form-field select {
    height: 38px;
    width: 100%;
    border: 1px solid #cfd9d3;
    border-radius: 8px;
    background: #ffffff;
    color: #17211b;
    font-size: 13px;
    outline: none;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.search-box input {
    padding: 0 12px 0 34px;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-group select {
    width: 116px;
    padding: 0 10px;
    color: #647067;
}

.search-box input:focus,
.filter-group select:focus,
.form-field input:focus,
.form-field select:focus {
    border-color: #15803d;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}

.reset-filter-button {
    height: 38px;
    padding: 0 10px;
    border: 1px solid #dce3df;
    border-radius: 8px;
    background: #ffffff;
    color: #647067;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.reset-filter-button:hover {
    background: #f8faf9;
}

.table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    text-align: left;
}

thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f8faf9;
}

th {
    padding: 11px 14px;
    border-bottom: 1px solid #dce3df;
    color: #7b8a82;
    font-size: 12px;
    font-weight: 850;
    white-space: nowrap;
}

td {
    padding: 11px 14px;
    border-bottom: 1px solid #edf1ee;
    color: #374151;
    font-size: 13px;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-row {
    cursor: pointer;
    border-left: 3px solid transparent;
    transition:
        background-color 0.15s ease,
        border-left-color 0.15s ease;
}

.user-row:hover {
    background: #f8faf9;
}

.user-row.selected {
    background: #f0fdf4;
    border-left-color: #15803d;
}

.user-id {
    color: #374151;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
}

.user-name {
    color: #17211b;
    font-weight: 850;
}

.email-cell {
    color: #647067;
}

.role-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 850;
}

.role-badge.admin {
    background: #fee2e2;
    color: #dc2626;
}

.role-badge.line-manager {
    background: #dbeafe;
    color: #2563eb;
}

.role-badge.worker {
    background: #dcfce7;
    color: #15803d;
}

.role-badge.default {
    background: #f1f5f9;
    color: #64748b;
}

.status-text {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #374151;
    font-size: 12px;
    font-weight: 700;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
}

.status-dot.active {
    background: #22c55e;
}

.status-dot.inactive {
    background: #94a3b8;
}

.status-dot.locked {
    background: #ef4444;
}

.lock-icon {
    color: #ef4444;
    font-size: 11px;
}

.login-time {
    color: #8a9990;
    font-size: 12px;
}

.skeleton-line {
    height: 14px;
    border-radius: 999px;
    background: #edf1ee;
    animation: pulse-bg 1.2s ease-in-out infinite;
}

.empty-table {
    padding: 56px 20px;
    text-align: center;
    color: #9aa7a0;
}

.empty-table i {
    display: block;
    margin-bottom: 10px;
    font-size: 28px;
}

.pagination-bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-top: 1px solid #edf1ee;
    background: #ffffff;
}

.pagination-bar > span {
    color: #8a9990;
    font-size: 12px;
}

.pagination-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
}

.pagination-buttons button {
    min-width: 30px;
    height: 30px;
    padding: 0 9px;
    border: 1px solid #dce3df;
    border-radius: 7px;
    background: #ffffff;
    color: #647067;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

.pagination-buttons button:hover:not(:disabled) {
    background: #f8faf9;
}

.pagination-buttons button.active {
    background: #15803d;
    border-color: #15803d;
    color: #ffffff;
}

.pagination-buttons button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

/* 오른쪽 패널 */
.panel-tabs {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #dce3df;
    background: #ffffff;
}

.panel-tabs button {
    position: relative;
    height: 46px;
    border: none;
    background: transparent;
    color: #647067;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
}

.panel-tabs button i {
    margin-right: 6px;
}

.panel-tabs button.active {
    color: #15803d;
    background: #f0fdf4;
}

.panel-tabs button.active::after {
    content: '';
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 0;
    height: 2px;
    background: #15803d;
    border-radius: 999px 999px 0 0;
}

.form-panel-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px;
}

.account-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.form-field label {
    color: #5f6f66;
    font-size: 12px;
    font-weight: 850;
}

.form-field label span {
    color: #dc2626;
}

.form-field input,
.form-field select {
    padding: 0 12px;
}

.message-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 12px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 700;
}

.message-box.error {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
}

.message-box.success {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #15803d;
}

.primary-submit-button {
    width: 180px;
    height: 42px;
    align-self: center;
    margin-top: 6px;
    border: none;
    border-radius: 8px;
    background: #15803d;
    color: #ffffff;
    font-size: 14px;
    font-weight: 850;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        transform 0.15s ease;
}

.primary-submit-button i {
    margin-right: 6px;
}

.primary-submit-button:hover:not(:disabled) {
    background: #166534;
}

.primary-submit-button:active {
    transform: translateY(1px);
}

.primary-submit-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.select-empty {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px dashed #dce3df;
    border-radius: 12px;
    color: #9aa7a0;
    font-size: 13px;
}

.select-empty i {
    font-size: 24px;
}

.selected-user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    margin-bottom: 16px;
    border: 1px solid #dce3df;
    border-radius: 12px;
    background: #f8faf9;
}

.selected-avatar {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #f0fdf4;
    color: #15803d;
    flex-shrink: 0;
}

.selected-user-info {
    flex: 1;
    min-width: 0;
}

.selected-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.selected-name-row strong {
    color: #17211b;
    font-size: 15px;
    font-weight: 850;
}

.selected-user-info p {
    margin-top: 3px;
    color: #647067;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.selected-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #374151;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
}

.account-actions {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid #edf1ee;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.account-actions > p {
    margin-bottom: 2px;
    color: #7b8a82;
    font-size: 12px;
    font-weight: 850;
}

.action-button {
    height: 38px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px;
    border: 1px solid #dce3df;
    border-radius: 8px;
    background: #ffffff;
    color: #374151;
    font-size: 13px;
    font-weight: 750;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.action-button:hover {
    background: #f8faf9;
}

.action-button i {
    width: 16px;
    text-align: center;
}

.action-button .amber {
    color: #d97706;
}

.action-button .orange {
    color: #ea580c;
}

.action-button .blue {
    color: #2563eb;
}

.action-button.danger {
    border-color: #fecaca;
    color: #dc2626;
}

.action-button.danger:hover {
    background: #fef2f2;
}

.action-button.success {
    border-color: #bbf7d0;
    color: #15803d;
}

.action-button.success:hover {
    background: #f0fdf4;
}

/* 확인 다이얼로그 */
.confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(3px);
}

.confirm-dialog {
    width: min(390px, 100%);
    padding: 22px;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.confirm-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
}

.confirm-icon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #fffbeb;
    color: #d97706;
    flex-shrink: 0;
}

.confirm-content p {
    padding-top: 4px;
    color: #374151;
    font-size: 14px;
    line-height: 1.55;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.confirm-actions button {
    height: 36px;
    padding: 0 15px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
}

.confirm-cancel {
    border: 1px solid #dce3df;
    background: #ffffff;
    color: #647067;
}

.confirm-cancel:hover {
    background: #f8faf9;
}

.confirm-ok {
    border: none;
    background: #15803d;
    color: #ffffff;
}

.confirm-ok:hover:not(:disabled) {
    background: #166534;
}

.confirm-ok:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

@keyframes pulse-bg {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}

@media (max-width: 1280px) {
    .user-layout {
        grid-template-columns: 1fr;
        overflow-y: auto;
    }

    .user-list-panel,
    .user-form-panel {
        min-height: 420px;
    }
}

@media (max-width: 760px) {
    .user-page {
        height: auto;
        min-height: calc(100vh - 60px);
        overflow: visible;
    }

    .page-header {
        padding: 12px;
    }

    .user-layout {
        padding: 12px;
        gap: 12px;
    }

    .panel-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        flex-wrap: wrap;
    }

    .filter-group select {
        flex: 1;
        min-width: 120px;
    }

    .pagination-bar {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '../../stores/userStore'

const userStore = useUserStore()

const userId = ref('')
const password = ref('')
const name = ref('')
const email = ref('')
const role = ref('WORKER')

const errorMessage = ref('')
const successMessage = ref('')
const createdUser = ref(null)
const isLoading = ref(false)

const roleOptions = [
    {
        value: 'ADMIN',
        label: '관리자',
        description: '전체 접근 권한',
    },
    {
        value: 'LINE_MGR',
        label: '라인 관리자',
        description: '담당 라인 관리 권한',
    },
    {
        value: 'WORKER',
        label: '작업자',
        description: '조회 중심 권한',
    },
]

const resetForm = () => {
    userId.value = ''
    password.value = ''
    name.value = ''
    email.value = ''
    role.value = 'WORKER'
}

const handleCreateUser = async () => {
    try {
        isLoading.value = true
        errorMessage.value = ''
        successMessage.value = ''
        createdUser.value = null

        const result = await userStore.createUser({
            userId: userId.value,
            password: password.value,
            name: name.value,
            email: email.value,
            role: role.value,
        })

        createdUser.value = result
        successMessage.value = '사용자가 등록되었습니다.'
        resetForm()
    } catch (error) {
        errorMessage.value = error.message || '사용자 등록 중 오류가 발생했습니다.'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <main class="min-h-screen bg-slate-950 px-6 py-10">
        <section class="mx-auto w-full max-w-2xl rounded-2xl border border-slate-800 bg-white p-8 shadow-2xl">
            <div class="mb-8">
                <p class="mb-2 text-sm font-semibold text-blue-700">
                    DB HiTek Smart Factory
                </p>
                <h1 class="text-2xl font-bold text-slate-900">
                    사용자 등록
                </h1>
                <p class="mt-2 text-sm text-slate-500">
                    관리자 권한으로 SCADA 시스템 사용자를 등록합니다.
                </p>
            </div>

            <form class="space-y-5" @submit.prevent="handleCreateUser">
                <div class="grid gap-5 md:grid-cols-2">
                    <div>
                        <label class="mb-2 block text-sm font-medium text-slate-700">
                            아이디
                        </label>
                        <input
                            v-model="userId"
                            type="text"
                            class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="영문·숫자 4~16자"
                        />
                    </div>

                    <div>
                        <label class="mb-2 block text-sm font-medium text-slate-700">
                            이름
                        </label>
                        <input
                            v-model="name"
                            type="text"
                            class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="사용자 이름"
                        />
                    </div>
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        이메일
                    </label>
                    <input
                        v-model="email"
                        type="email"
                        class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        placeholder="example@dbhitek.com"
                    />
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        초기 비밀번호
                    </label>
                    <input
                        v-model="password"
                        type="password"
                        class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        placeholder="8자 이상, 영문·숫자·특수문자 포함"
                    />
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-slate-700">
                        권한
                    </label>

                    <div class="grid gap-3 md:grid-cols-3">
                        <label
                            v-for="option in roleOptions"
                            :key="option.value"
                            class="cursor-pointer rounded-xl border p-4 transition"
                            :class="role === option.value
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                                : 'border-slate-200 hover:border-blue-300'"
                        >
                            <input
                                v-model="role"
                                type="radio"
                                name="role"
                                class="sr-only"
                                :value="option.value"
                            />
                            <span class="block text-sm font-bold text-slate-900">
                                {{ option.label }}
                            </span>
                            <span class="mt-1 block text-xs text-slate-500">
                                {{ option.description }}
                            </span>
                            <span class="mt-2 block text-xs font-semibold text-blue-700">
                                {{ option.value }}
                            </span>
                        </label>
                    </div>
                </div>

                <p v-if="errorMessage" class="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                    {{ errorMessage }}
                </p>

                <div
                    v-if="successMessage"
                    class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                >
                    <p class="font-semibold">
                        {{ successMessage }}
                    </p>
                    <p v-if="createdUser" class="mt-1">
                        등록 ID:
                        <strong>{{ createdUser.userId }}</strong>
                        / 권한:
                        <strong>{{ createdUser.role }}</strong>
                    </p>
                </div>

                <div class="flex items-center justify-between pt-2">
                    <RouterLink to="/dashboard" class="text-sm font-medium text-slate-500 hover:text-blue-700">
                        대시보드로 이동
                    </RouterLink>

                    <button
                        type="submit"
                        :disabled="isLoading"
                        class="rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {{ isLoading ? '등록 중...' : '사용자 등록' }}
                    </button>
                </div>
            </form>
        </section>
    </main>
</template>
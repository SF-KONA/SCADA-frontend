import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(sessionStorage.getItem('user') ?? 'null'))
    const token = ref(sessionStorage.getItem('token') ?? null)

    const isLoggedIn = computed(() => !!token.value)

    function setAuth(userData, accessToken) {
        user.value = userData
        token.value = accessToken
        sessionStorage.setItem('user', JSON.stringify(userData))
        sessionStorage.setItem('token', accessToken)
    }

    function logout() {
        user.value = null
        token.value = null
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('token')
    }

    return { user, token, isLoggedIn, setAuth, logout }
})

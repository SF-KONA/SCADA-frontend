import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { requiresAuth: false, noLayout: true },
    },
    {
        path: '/find-id',
        name: 'FindId',
        component: () => import('@/views/auth/FindIdView.vue'),
        meta: { requiresAuth: false, noLayout: true },
    },
    {
        path: '/find-password',
        name: 'FindPassword',
        component: () => import('@/views/auth/FindPasswordView.vue'),
        meta: { requiresAuth: false, noLayout: true },
    },
    {
        path: '/dashboard',
        name: 'MainDashboard',
        component: () => import('@/views/MainDashboard.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/equipment',
        name: 'EquipmentStatus',
        component: () => import('@/views/EquipmentStatus.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/control',
        name: 'OptimizationControl',
        component: () => import('@/views/OptimizationControl.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/report',
        name: 'AiReport',
        component: () => import('@/views/AiReport.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/alarm',
        name: 'AlarmCenter',
        component: () => import('@/views/AlarmCenter.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/users',
        name: 'UserManagement',
        component: () => import('@/views/UserManagement.vue'),
        meta: { requiresAuth: true, adminOnly: true },
    },
    {
        path: '/users/create',
        name: 'UserCreate',
        component: () => import('@/views/users/UserCreateView.vue'),
        meta: { requiresAuth: true, adminOnly: true },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard',
    },
    {
        path: '/alerts',
        name: 'AlertList',
        component: () => import('@/views/alerts/AlertListView.vue'),
        meta: { requiresAuth: true },
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

router.beforeEach((to) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        return { name: 'Login' }
    }

    if (to.meta.adminOnly && auth.user?.role !== 'ADMIN') {
        return { name: 'MainDashboard' }
    }

    if (to.name === 'Login' && auth.isLoggedIn) {
        return { name: 'MainDashboard' }
    }
})

export default router

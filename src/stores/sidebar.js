import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', () => {
    const isOpen = ref(true)
    const toggle = () => { isOpen.value = !isOpen.value }
    return { isOpen, toggle }
})

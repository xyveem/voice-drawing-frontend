import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义 store
export const useTestStore = defineStore('testStore', () => {
  // state
  const count = ref(0)
  const msg = ref('hello')
  // getters
  const getCount = computed(() => count.value)
  // actions
  const setCount = (newCount: number) => {
    console.log(newCount)
    count.value = newCount
  }
  return { count, msg, getCount, setCount }
})

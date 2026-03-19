<!-- app/app.vue -->
<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const authStore = useAuthStore()
const cartStore = useCartStore()

// 页面初始化：已登录时拉取 profile 和购物车
if (user.value?.id && !authStore.profile) {
  await authStore.fetchProfile().catch(() => { })
  await cartStore.loadFromSupabase().catch(() => { })
}

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    authStore.fetchProfile().catch(() => { })
    cartStore.mergeOnLogin().catch(() => { })   // 登录时合并本地与云端
  } else if (event === 'SIGNED_OUT') {
    authStore.profile = null
    cartStore.clearCart().catch(() => { })       // 退出时清空本地购物车
  }
})
</script>

<template>
  <UApp>
    <AppHeader />
    <main>
      <NuxtPage />
    </main>
  </UApp>
</template>
<!-- app/app.vue -->
<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const authStore = useAuthStore()

// 页面初始化：已登录但 profile 为空时，主动拉取
if (user.value && !authStore.profile) {
  await authStore.fetchProfile().catch(() => { })
}

// 监听 Supabase 认证状态变化
// ✅ 只保留这一个
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    authStore.fetchProfile().catch(() => { })
  } else if (event === 'SIGNED_OUT') {
    authStore.profile = null
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
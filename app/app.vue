<!-- app/app.vue -->
<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const authStore = useAuthStore()

// 页面初始化：已登录但 profile 为空时，主动拉取
if (user.value && !authStore.profile) {
  await authStore.fetchProfile().catch(() => {})
}

// 监听 Supabase 认证状态变化
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    authStore.fetchProfile().catch(() => {})
  } else if (event === 'SIGNED_OUT') {
    authStore.profile = null
  }
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
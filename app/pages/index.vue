<!-- app/pages/index.vue -->
<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 class="text-2xl font-semibold">首页</h1>

    <template v-if="authStore.isLoggedIn">
      <p class="text-gray-500">欢迎，{{ authStore.profile?.full_name ?? '用户' }}</p>
      <UButton color="error" variant="soft" @click="authStore.logout()">退出登录</UButton>
    </template>

    <template v-else>
      <div class="flex gap-2">
        <UButton to="/auth/login">登录</UButton>
        <UButton to="/auth/register" variant="outline">注册</UButton>
      </div>
    </template>
  </div>
</template>
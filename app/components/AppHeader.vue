<!-- app/components/AppHeader.vue -->
<template>
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
      <!-- Logo -->
      <NuxtLink to="/" class="font-bold text-gray-900 text-lg tracking-tight mr-2">
        MyShop
      </NuxtLink>

      <!-- 导航链接 -->
      <nav class="hidden sm:flex items-center gap-1 text-sm">
        <NuxtLink to="/products"
          class="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          active-class="text-gray-900 bg-gray-100 font-medium">
          全部商品
        </NuxtLink>
      </nav>

      <!-- 搜索框（中间撑开） -->
      <div class="flex-1 max-w-xs hidden md:block">
        <UInput v-model="searchText" icon="i-lucide-search" placeholder="搜索商品…" size="sm" @keyup.enter="goSearch" />
      </div>

      <div class="flex-1" />

      <!-- 右侧操作区 -->
      <div class="flex items-center gap-2">
        <!-- 未登录 -->
        <template v-if="!isLoggedIn">
          <NuxtLink to="/auth/login">
            <UButton variant="ghost" size="sm">登录</UButton>
          </NuxtLink>
          <NuxtLink to="/auth/register" class="hidden sm:block">
            <UButton size="sm">注册</UButton>
          </NuxtLink>
        </template>

        <!-- 已登录：用户下拉菜单 -->
        <template v-else>
          <UDropdownMenu :items="userMenuItems">
            <UButton variant="ghost" size="sm" class="gap-2 px-2">
              <UAvatar :src="authStore.profile?.avatar_url ?? undefined" :alt="displayName" size="xs" />
              <span class="hidden sm:block text-sm max-w-24 truncate">
                {{ displayName }}
              </span>
              <UIcon name="i-lucide-chevron-down" class="size-3.5 text-gray-400" />
            </UButton>
          </UDropdownMenu>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)
const user = useSupabaseUser()
const isLoggedIn = computed(() => !!user.value)

const router = useRouter()
const toast = useToast()

const searchText = ref("")

function goSearch() {
  if (searchText.value.trim()) {
    router.push(`/products?search=${encodeURIComponent(searchText.value.trim())}`)
  }
}

const displayName = computed(
  () => profile.value?.full_name || "用户"
)

async function handleLogout() {
  try {
    await authStore.logout()
    toast.add({ title: "已退出登录", icon: "i-lucide-log-out", color: "success" })
    router.push("/")
  } catch {
    toast.add({ title: "退出失败，请重试", color: "error" })
  }
}

const userMenuItems = computed(() => [
  [
    {
      label: displayName.value,
      slot: "account",
      disabled: true,
    },
  ],
  [
    {
      label: "个人中心",
      icon: "i-lucide-user",
      onSelect: () => router.push("/profile"),
    },
    {
      label: "我的订单",
      icon: "i-lucide-package",
      onSelect: () => router.push("/orders"),
    },
  ],
  [
    {
      label: "退出登录",
      icon: "i-lucide-log-out",
      color: "error" as const,
      onSelect: handleLogout,
    },
  ],
])
</script>
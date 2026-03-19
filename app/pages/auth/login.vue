<!-- app/pages/auth/login.vue -->
<script setup lang="ts">
import * as v from 'valibot'

definePageMeta({ middleware: 'guest' })

const authStore = useAuthStore()

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty('请输入邮箱'), v.email('邮箱格式不正确')),
  password: v.pipe(v.string(), v.nonEmpty('请输入密码'), v.minLength(6, '密码至少 6 位')),
})

type LoginForm = v.InferOutput<typeof schema>

const state = reactive<LoginForm>({ email: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login(state.email, state.password)
    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message ?? '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold text-center">登录</h1>
      </template>

      <div class="space-y-4">
        <UAlert
          v-if="errorMsg"
          color="error"
          variant="soft"
          :title="errorMsg"
          icon="i-lucide-circle-alert"
        />

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="邮箱" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              placeholder="请输入邮箱"
              class="w-full"
            />
          </UFormField>

          <UFormField label="密码" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              placeholder="请输入密码"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            :loading="loading"
          >
            登录
          </UButton>
        </UForm>
      </div>

      <template #footer>
        <p class="text-center text-sm text-gray-500">
          没有账号？
          <NuxtLink to="/auth/register" class="text-primary-500 hover:underline">
            去注册
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
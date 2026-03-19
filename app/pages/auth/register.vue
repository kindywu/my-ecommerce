<!-- app/pages/auth/register.vue -->
<script setup lang="ts">
import * as v from 'valibot'

definePageMeta({ middleware: 'guest' })

const authStore = useAuthStore()

const schema = v.pipe(
  v.object({
    full_name: v.pipe(v.string(), v.nonEmpty('请输入姓名')),
    email: v.pipe(v.string(), v.nonEmpty('请输入邮箱'), v.email('邮箱格式不正确')),
    password: v.pipe(v.string(), v.nonEmpty('请输入密码'), v.minLength(6, '密码至少 6 位')),
    confirmPassword: v.pipe(v.string(), v.nonEmpty('请确认密码')),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      '两次密码输入不一致'
    ),
    ['confirmPassword']
  )
)

type RegisterForm = v.InferOutput<typeof schema>

const state = reactive<RegisterForm>({
  full_name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.register(state.email, state.password, state.full_name)
    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message ?? '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold text-center">注册</h1>
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
          <UFormField label="姓名" name="full_name" required>
            <UInput
              v-model="state.full_name"
              placeholder="请输入姓名"
              class="w-full"
            />
          </UFormField>

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
              placeholder="请输入密码（至少 6 位）"
              class="w-full"
            />
          </UFormField>

          <UFormField label="确认密码" name="confirmPassword" required>
            <UInput
              v-model="state.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            :loading="loading"
          >
            注册
          </UButton>
        </UForm>
      </div>

      <template #footer>
        <p class="text-center text-sm text-gray-500">
          已有账号？
          <NuxtLink to="/auth/login" class="text-primary-500 hover:underline">
            去登录
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
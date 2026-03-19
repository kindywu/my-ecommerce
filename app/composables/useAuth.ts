// app/composables/useAuth.ts
export function useAuthUser() {
  return useSupabaseUser();
}

export function useProfile() {
  const authStore = useAuthStore();
  return computed(() => authStore.profile);
}

export function useIsLoggedIn() {
  const authStore = useAuthStore();
  return computed(() => authStore.isLoggedIn);
}

export async function requireAuth() {
  const user = useSupabaseUser();
  if (!user.value) {
    await navigateTo("/auth/login");
  }
}

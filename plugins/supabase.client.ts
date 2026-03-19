// plugins/supabase.client.ts
export default defineNuxtPlugin(async () => {
  const user = useSupabaseUser();
  const authStore = useAuthStore();

  if (user.value && !authStore.profile) {
    await authStore.fetchProfile().catch(() => {});
  }
});

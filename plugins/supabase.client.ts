export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient();
  const authStore = useAuthStore();
});

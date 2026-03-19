// app/stores/auth.ts
import { defineStore } from "pinia";
import type { ProfileRow, ProfileUpdate } from "~/types";

export const useAuthStore = defineStore("auth", () => {
  const supabase = useSupabaseClient();

  const profile = ref<ProfileRow | null>(null);
  const loading = ref(false);

  // isLoggedIn 根据 profile 判断，由 app.vue 负责在登录后填充
  const isLoggedIn = computed(() => !!profile.value);
  const isAdmin = computed(() => profile.value?.role === "admin");

  // 获取当前已认证用户 id（通过 getUser() 确保安全可靠）
  async function getCurrentUserId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  }

  async function fetchProfile() {
    const userId = await getCurrentUserId();
    if (!userId) return;

    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw new Error(error.message);
      profile.value = data as ProfileRow;
    } catch (err: any) {
      throw new Error(err.message ?? "获取用户信息失败");
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      await fetchProfile();
    } catch (err: any) {
      throw new Error(err.message ?? "登录失败");
    } finally {
      loading.value = false;
    }
  }

  async function register(email: string, password: string, fullName: string) {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("注册失败：未返回用户信息");

      // 有 session 说明免验证模式，直接拉 profile
      if (data.session) {
        await fetchProfile();
      }
    } catch (err: any) {
      throw new Error(err.message ?? "注册失败");
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      profile.value = null;
    } catch (err: any) {
      throw new Error(err.message ?? "退出登录失败");
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data: ProfileUpdate) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("未登录");

    loading.value = true;
    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);
      if (error) throw new Error(error.message);
      await fetchProfile();
    } catch (err: any) {
      throw new Error(err.message ?? "更新失败");
    } finally {
      loading.value = false;
    }
  }

  return {
    profile,
    loading,
    isLoggedIn,
    isAdmin,
    fetchProfile,
    login,
    register,
    logout,
    updateProfile,
  };
});

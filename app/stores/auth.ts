// app/stores/auth.ts
import { defineStore } from "pinia";
import type { ProfileRow, ProfileUpdate } from "~/types";

export const useAuthStore = defineStore("auth", () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const profile = ref<ProfileRow | null>(null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => profile.value?.role === "admin");

  async function fetchProfile() {
    if (!user.value) return;
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.value.id)
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
      const newUser = data.user;
      if (!newUser) throw new Error("注册失败：未返回用户信息");

      const { error: insertError } = await supabase.from("profiles").insert({
        id: newUser.id,
        full_name: fullName,
        role: "user",
      });
      if (insertError) throw new Error(insertError.message);

      await fetchProfile();
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
    if (!user.value) throw new Error("未登录");
    loading.value = true;
    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.value.id);
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

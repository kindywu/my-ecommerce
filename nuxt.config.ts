export default defineNuxtConfig({
  compatibilityDate: "2026-03-17",
  modules: [
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "@nuxt/ui",
    "pinia-plugin-persistedstate/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  ui: { fonts: false },
  devtools: { enabled: true },
  supabase: {
    redirectOptions: {
      login: "/auth/login",
      callback: "/auth/confirm",
      exclude: ["/", "/auth/*", "/products", "/products/*"],
    },
  },
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SECRET_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
    },
  },
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit", "@vueuse/core"],
    },
  },
});

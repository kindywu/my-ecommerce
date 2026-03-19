export default defineNuxtConfig({
  compatibilityDate: "2026-03-17",
  modules: ["@nuxtjs/supabase", "@pinia/nuxt", "@nuxt/ui"],
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
});

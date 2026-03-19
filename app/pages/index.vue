<!-- app/pages/index.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ── Hero Banner ─────────────────────────────────────── -->
    <section>
      <UCarousel
        v-slot="{ item }"
        :items="BANNERS"
        :ui="{ item: 'basis-full' }"
        arrows
        dots
        :auto-play="{ interval: 4500 }"
        class="overflow-hidden"
      >
        <div class="relative h-[360px] md:h-[500px] w-full">
          <img
            :src="item.image"
            :alt="item.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent flex items-center">
            <div class="max-w-7xl mx-auto w-full px-6 md:px-10 text-white">
              <p class="text-xs uppercase tracking-widest mb-2 opacity-75">
                {{ item.subtitle }}
              </p>
              <h1 class="text-3xl md:text-5xl font-extrabold mb-5 leading-tight max-w-lg">
                {{ item.title }}
              </h1>
              <NuxtLink
                :to="item.link"
                class="inline-block bg-white text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                立即选购 →
              </NuxtLink>
            </div>
          </div>
        </div>
      </UCarousel>
    </section>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- ── 分类导航 ─────────────────────────────────────── -->
      <section class="py-8">
        <h2 class="text-lg font-bold text-gray-800 mb-4">全部分类</h2>
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          <NuxtLink
            to="/products"
            class="flex-shrink-0 flex flex-col items-center gap-1.5 group"
          >
            <div class="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center group-hover:opacity-80 transition-opacity">
              <UIcon name="i-lucide-layout-grid" class="size-7 text-white" />
            </div>
            <span class="text-xs text-gray-600 font-medium">全部</span>
          </NuxtLink>

          <template v-if="categoriesLoading">
            <div
              v-for="n in 6"
              :key="n"
              class="flex-shrink-0 flex flex-col items-center gap-1.5"
            >
              <div class="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
              <div class="w-10 h-3 rounded bg-gray-200 animate-pulse" />
            </div>
          </template>

          <NuxtLink
            v-for="cat in topCategories"
            :key="cat.id"
            :to="`/products?category=${cat.slug}`"
            class="flex-shrink-0 flex flex-col items-center gap-1.5 group"
          >
            <div class="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 group-hover:ring-2 ring-gray-900 transition-all">
              <img
                v-if="cat.image_url"
                :src="cat.image_url"
                :alt="cat.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-tag" class="size-6 text-gray-400" />
              </div>
            </div>
            <span class="text-xs text-gray-600 font-medium whitespace-nowrap">
              {{ cat.name }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- ── 推荐商品 ─────────────────────────────────────── -->
      <section class="pb-16">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold text-gray-800">新品推荐</h2>
          <NuxtLink
            to="/products"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            查看全部 →
          </NuxtLink>
        </div>

        <ProductGrid :products="featured" :loading="featuredLoading" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryTree, Product } from "~/types";

// ── 静态 Banner 数据（替换为真实图片 URL）─────────────────
const BANNERS = [
  {
    title: "新季上新，焕新风格",
    subtitle: "New Collection 2025",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80",
    link: "/products",
  },
  {
    title: "精选好物，品质生活",
    subtitle: "Best Sellers",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1400&q=80",
    link: "/products",
  },
  {
    title: "限时特惠，低至五折",
    subtitle: "Flash Sale",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80",
    link: "/products",
  },
];

// ── 数据获取 ───────────────────────────────────────────────
const { getCategories, getFeaturedProducts } = useProducts();

const categoriesLoading = ref(true);
const featuredLoading = ref(true);
const categories = ref<CategoryTree[]>([]);
const featured = ref<Product[]>([]);

const topCategories = computed(() =>
  categories.value.filter((c) => !c.parent_id).slice(0, 8)
);

const { data: catsData } = await useAsyncData("home-categories", () =>
  getCategories()
);
categories.value = catsData.value ?? [];
categoriesLoading.value = false;

const { data: featData } = await useAsyncData("home-featured", () =>
  getFeaturedProducts(8)
);
featured.value = featData.value ?? [];
featuredLoading.value = false;

// ── SEO ───────────────────────────────────────────────────
useSeoMeta({
  title: "首页 · My Ecommerce",
  description: "发现优质好物，享受精致购物体验",
});
</script>
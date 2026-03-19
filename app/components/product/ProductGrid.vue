<!-- app/components/product/ProductGrid.vue -->
<template>
  <!-- 骨架屏 -->
  <div
    v-if="loading"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    <div
      v-for="n in skeletonCount"
      :key="n"
      class="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-100"
    >
      <div class="aspect-square bg-gray-200" />
      <div class="p-3 space-y-2">
        <div class="h-3 bg-gray-200 rounded w-1/3" />
        <div class="h-4 bg-gray-200 rounded w-full" />
        <div class="h-4 bg-gray-200 rounded w-3/4" />
        <div class="h-5 bg-gray-200 rounded w-1/4 mt-2" />
      </div>
    </div>
  </div>

  <!-- 空态 -->
  <div
    v-else-if="!products.length"
    class="flex flex-col items-center justify-center py-24 text-gray-400 gap-3"
  >
    <UIcon name="i-lucide-package-search" class="size-14" />
    <p class="text-sm">暂无相关商品</p>
  </div>

  <!-- 网格 -->
  <div
    v-else
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product } from "~/types";

withDefaults(
  defineProps<{
    products: Product[];
    loading?: boolean;
    skeletonCount?: number;
  }>(),
  { loading: false, skeletonCount: 8 }
);
</script>
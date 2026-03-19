<!-- app/components/product/ProductCard.vue -->
<template>
  <NuxtLink
    :to="`/products/${product.slug}`"
    class="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
  >
    <!-- 图片 -->
    <div class="relative aspect-square overflow-hidden bg-gray-50">
      <img
        v-if="coverImage"
        :src="coverImage.url"
        :alt="coverImage.alt || product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <UIcon name="i-lucide-image" class="size-10 text-gray-300" />
      </div>

      <!-- 折扣角标 -->
      <span
        v-if="discountPercent"
        class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
      >
        -{{ discountPercent }}%
      </span>

      <!-- 售罄遮罩 -->
      <div
        v-if="product.stock === 0"
        class="absolute inset-0 bg-black/40 flex items-center justify-center"
      >
        <span class="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
          已售罄
        </span>
      </div>
    </div>

    <!-- 文字信息 -->
    <div class="flex flex-col flex-1 p-3 gap-1">
      <span v-if="product.category" class="text-xs text-gray-400 truncate">
        {{ product.category.name }}
      </span>
      <h3 class="text-sm font-medium text-gray-800 line-clamp-2 leading-snug flex-1">
        {{ product.name }}
      </h3>
      <div class="flex items-baseline gap-1.5 mt-1">
        <span class="text-base font-bold text-gray-900">
          ¥{{ fmtPrice(product.price) }}
        </span>
        <span
          v-if="product.compare_price"
          class="text-xs text-gray-400 line-through"
        >
          ¥{{ fmtPrice(product.compare_price) }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Product } from "~/types";

const props = defineProps<{ product: Product }>();

const coverImage = computed(() => props.product.images?.[0] ?? null);

const discountPercent = computed(() => {
  const { price, compare_price } = props.product;
  if (!compare_price || compare_price <= price) return null;
  return Math.round((1 - price / compare_price) * 100);
});

const fmtPrice = (v: number) => v.toFixed(2);
</script>
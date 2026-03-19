<!-- app/pages/products/[slug].vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 404 -->
    <div
      v-if="!product && !pending"
      class="max-w-7xl mx-auto px-4 py-24 text-center"
    >
      <UIcon name="i-lucide-package-x" class="size-16 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500 mb-6">商品不存在或已下架</p>
      <NuxtLink to="/products">
        <UButton>返回商品列表</UButton>
      </NuxtLink>
    </div>

    <!-- 骨架屏 -->
    <div
      v-else-if="pending"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div class="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div class="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
        <div class="space-y-4">
          <div class="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
          <div class="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
          <div class="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div class="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
      </div>
    </div>

    <!-- 商品详情 -->
    <div
      v-else-if="product"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <!-- 面包屑 -->
      <UBreadcrumb :items="breadcrumbs" class="mb-6" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <!-- ── 左：图片区 ─────────────────────────────────── -->
        <div class="space-y-3">
          <!-- 主图 -->
          <div class="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
            <img
              v-if="activeImage"
              :src="activeImage.url"
              :alt="activeImage.alt || product.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon name="i-lucide-image" class="size-16 text-gray-300" />
            </div>
          </div>

          <!-- 缩略图列表 -->
          <div
            v-if="product.images.length > 1"
            class="flex gap-2 overflow-x-auto pb-1"
          >
            <button
              v-for="(img, i) in product.images"
              :key="i"
              class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors"
              :class="
                activeImageIndex === i
                  ? 'border-gray-900'
                  : 'border-transparent hover:border-gray-300'
              "
              @click="activeImageIndex = i"
            >
              <img
                :src="img.url"
                :alt="img.alt || `图片${i + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <!-- ── 右：信息区 ─────────────────────────────────── -->
        <div class="flex flex-col gap-5">
          <!-- 标题 + 分类 -->
          <div>
            <span
              v-if="product.category"
              class="text-xs text-gray-400 font-medium uppercase tracking-wide"
            >
              {{ product.category.name }}
            </span>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 leading-tight">
              {{ product.name }}
            </h1>
          </div>

          <!-- 价格 -->
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-extrabold text-gray-900">
              ¥{{ fmtPrice(effectivePrice) }}
            </span>
            <span
              v-if="product.compare_price"
              class="text-base text-gray-400 line-through"
            >
              ¥{{ fmtPrice(product.compare_price) }}
            </span>
            <span
              v-if="discountPercent"
              class="text-sm bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full"
            >
              省 {{ discountPercent }}%
            </span>
          </div>

          <!-- 规格选择 -->
          <div v-if="product.variants?.length" class="space-y-2">
            <p class="text-sm font-medium text-gray-700">
              规格：<span class="text-gray-900">{{ selectedVariant?.name ?? "请选择" }}</span>
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="v in product.variants"
                :key="v.id"
                class="px-3 py-1.5 rounded-lg border text-sm transition-all"
                :class="[
                  selectedVariant?.id === v.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : v.stock === 0
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400',
                ]"
                :disabled="v.stock === 0"
                @click="selectedVariant = v"
              >
                {{ v.name }}
                <span v-if="v.price_modifier !== 0" class="text-xs opacity-75">
                  {{ v.price_modifier > 0 ? "+" : "" }}¥{{ v.price_modifier }}
                </span>
              </button>
            </div>
          </div>

          <!-- 库存状态 -->
          <div class="flex items-center gap-2 text-sm">
            <span
              v-if="currentStock > 0"
              class="inline-flex items-center gap-1 text-green-600"
            >
              <span class="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              有货（剩余 {{ currentStock }} 件）
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 text-red-500"
            >
              <span class="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
              暂时缺货
            </span>
          </div>

          <!-- 数量选择器 -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">数量</span>
            <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                class="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-40"
                :disabled="quantity <= 1"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                <UIcon name="i-lucide-minus" class="size-3.5" />
              </button>
              <span class="w-12 text-center text-sm font-semibold text-gray-900 select-none">
                {{ quantity }}
              </span>
              <button
                class="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-40"
                :disabled="quantity >= currentStock"
                @click="quantity = Math.min(currentStock, quantity + 1)"
              >
                <UIcon name="i-lucide-plus" class="size-3.5" />
              </button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 pt-2">
            <UButton
              size="lg"
              variant="outline"
              class="flex-1"
              :disabled="currentStock === 0 || addingCart"
              :loading="addingCart"
              icon="i-lucide-shopping-cart"
              @click="handleAddToCart"
            >
              加入购物车
            </UButton>
            <UButton
              size="lg"
              class="flex-1 bg-gray-900 hover:bg-gray-700"
              :disabled="currentStock === 0"
              @click="handleBuyNow"
            >
              立即购买
            </UButton>
          </div>

          <!-- 商品描述 -->
          <div
            v-if="product.description"
            class="border-t border-gray-100 pt-5"
          >
            <h3 class="text-sm font-bold text-gray-700 mb-3">商品详情</h3>
            <div
              class="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
              v-html="product.description"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariantRow } from "~/types";

const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug as string);

// ── 数据获取 ───────────────────────────────────────────────
const { getProduct } = useProducts();

const {
  data: product,
  pending,
  error,
} = await useAsyncData<Product | null>(
  `product-${slug.value}`,
  () => getProduct(slug.value),
  { watch: [slug] }
);

// ── 图片轮播 ───────────────────────────────────────────────
const activeImageIndex = ref(0);
const activeImage = computed(
  () => product.value?.images?.[activeImageIndex.value] ?? null
);

// ── 规格选择 ───────────────────────────────────────────────
const selectedVariant = ref<ProductVariantRow | null>(null);

watch(product, (p) => {
  if (p?.variants?.length) {
    selectedVariant.value = p.variants.find((v) => v.stock > 0) ?? p.variants[0] ?? null
  }
}, { immediate: true });

// ── 计算属性 ───────────────────────────────────────────────
const effectivePrice = computed(() => {
  if (!product.value) return 0;
  return product.value.price + (selectedVariant.value?.price_modifier ?? 0);
});

const currentStock = computed(() => {
  if (!product.value) return 0;
  return selectedVariant.value?.stock ?? product.value.stock;
});

const discountPercent = computed(() => {
  if (!product.value?.compare_price) return null;
  const cmp = product.value.compare_price;
  if (cmp <= effectivePrice.value) return null;
  return Math.round((1 - effectivePrice.value / cmp) * 100);
});

const quantity = ref(1);

// 面包屑
const breadcrumbs = computed(() => {
  const crumbs: { label: string; to?: string }[] = [
    { label: "首页", to: "/" },
    { label: "商品列表", to: "/products" },
  ];
  if (product.value?.category) {
    crumbs.push({
      label: product.value.category.name,
      to: `/products?category=${product.value.category.slug}`,
    });
  }
  if (product.value) crumbs.push({ label: product.value.name });
  return crumbs;
});

// ── 操作 ──────────────────────────────────────────────────
const addingCart = ref(false);
const toast = useToast();
const user = useSupabaseUser();

async function handleAddToCart() {
  if (!user.value) {
    router.push("/auth/login");
    return;
  }
  if (!product.value) return;
  addingCart.value = true;
  try {
    // TODO: 接入购物车 store（阶段 5 实现）
    await new Promise((r) => setTimeout(r, 600));
    toast.add({ title: "已加入购物车", icon: "i-lucide-check-circle", color: "success" });
  } catch {
    toast.add({ title: "操作失败，请重试", color: "error" });
  } finally {
    addingCart.value = false;
  }
}

function handleBuyNow() {
  if (!user.value) {
    router.push("/auth/login");
    return;
  }
  // TODO: 接入结算（阶段 6 实现）
  toast.add({ title: "结算功能即将上线", icon: "i-lucide-info" });
}

const fmtPrice = (v: number) => v.toFixed(2);

// ── SEO ───────────────────────────────────────────────────
useSeoMeta({
  title: computed(() =>
    product.value ? `${product.value.name} · My Ecommerce` : "商品详情"
  ),
  description: computed(() => product.value?.description ?? ""),
});
</script>
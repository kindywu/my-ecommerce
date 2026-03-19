<!-- app/pages/products/index.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 面包屑 -->
      <UBreadcrumb
        :items="[
          { label: '首页', to: '/' },
          { label: activeCategory ? activeCategory.name : '全部商品' },
        ]"
        class="mb-6"
      />

      <div class="flex gap-6">
        <!-- ── 左侧：分类过滤 ──────────────────────────────── -->
        <aside class="hidden lg:block w-52 flex-shrink-0">
          <div class="bg-white rounded-2xl border border-gray-100 p-4 sticky top-6">
            <h3 class="text-sm font-bold text-gray-700 mb-3">商品分类</h3>

            <!-- 全部 -->
            <button
              class="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
              :class="
                !query.category
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              "
              @click="selectCategory(null)"
            >
              全部商品
            </button>

            <!-- 分类树 -->
            <template v-for="cat in categoryTree" :key="cat.id">
              <button
                class="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors mt-0.5"
                :class="
                  query.category === cat.slug
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                "
                @click="selectCategory(cat.slug)"
              >
                {{ cat.name }}
              </button>
              <!-- 子分类 -->
              <button
                v-for="sub in cat.children"
                :key="sub.id"
                class="w-full text-left text-sm pl-6 pr-3 py-1.5 rounded-lg transition-colors mt-0.5"
                :class="
                  query.category === sub.slug
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:bg-gray-50'
                "
                @click="selectCategory(sub.slug)"
              >
                {{ sub.name }}
              </button>
            </template>

            <!-- 价格区间 -->
            <div class="mt-5 border-t border-gray-100 pt-4">
              <h3 class="text-sm font-bold text-gray-700 mb-3">价格区间</h3>
              <div class="px-1">
                <USlider
                  v-model="priceRange"
                  :min="0"
                  :max="10000"
                  :step="100"
                  class="mb-3"
                />
                <div class="flex justify-between text-xs text-gray-500">
                  <span>¥{{ priceRange[0] }}</span>
                  <span>¥{{ priceRange[1] }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- ── 右侧：商品区 ────────────────────────────────── -->
        <div class="flex-1 min-w-0">
          <!-- 顶部工具栏 -->
          <div class="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <!-- 搜索框 -->
            <UInput
              v-model="searchInput"
              icon="i-lucide-search"
              placeholder="搜索商品…"
              class="w-52"
              @keyup.enter="applySearch"
            />

            <div class="flex items-center gap-3 ml-auto">
              <!-- 移动端分类 -->
              <USelect
                v-model="mobileCategoryValue"
                :items="mobileCategoryOptions"
                value-key="value"
                label-key="label"
                class="lg:hidden w-32"
              />

              <!-- 排序 -->
              <USelect
                v-model="query.sort"
                :items="SORT_OPTIONS"
                value-key="value"
                label-key="label"
                class="w-32"
                @update:model-value="syncUrl"
              />

              <!-- 结果数 -->
              <span class="text-sm text-gray-400 hidden sm:block">
                共 {{ total }} 件
              </span>
            </div>
          </div>

          <!-- 商品网格 -->
          <ProductGrid
            :products="products"
            :loading="pending"
            :skeleton-count="query.pageSize"
          />

          <!-- 错误提示 -->
          <div
            v-if="error"
            class="mt-8 text-center text-sm text-red-500"
          >
            加载失败，请稍后重试
          </div>

          <!-- 分页 -->
          <div
            v-if="totalPages > 1"
            class="flex justify-center mt-10"
          >
            <UPagination
              v-model:page="query.page"
              :total="total"
              :items-per-page="query.pageSize"
              @update:page="syncUrl"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryTree } from "~/types";

// ── 常量 ──────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: "最新上架", value: "newest" },
  { label: "价格从低到高", value: "price_asc" },
  { label: "价格从高到低", value: "price_desc" },
];

// ── URL 查询参数同步 ───────────────────────────────────────
const route = useRoute();
const router = useRouter();

const ALL_CATEGORY = "__all__"

const query = reactive({
  category: (route.query.category as string) || "",
  search: (route.query.search as string) || "",
  sort: (route.query.sort as string) || "newest",
  page: Number(route.query.page) || 1,
  pageSize: 12,
});

const searchInput = ref(query.search);
const priceRange = ref([0, 10000]);

function syncUrl() {
  router.replace({
    query: {
      ...(query.category ? { category: query.category } : {}),
      ...(query.search ? { search: query.search } : {}),
      ...(query.sort !== "newest" ? { sort: query.sort } : {}),
      ...(query.page > 1 ? { page: String(query.page) } : {}),
    },
  });
}

function selectCategory(slug: string | null) {
  query.category = slug ?? "";
  query.page = 1;
  syncUrl();
}

function applySearch() {
  query.search = searchInput.value;
  query.page = 1;
  syncUrl();
}

// ── 数据获取 ───────────────────────────────────────────────
const { getProducts, getCategories } = useProducts();

// 分类树
const { data: catData } = await useAsyncData("products-categories", () =>
  getCategories()
);
const categoryTree = ref<CategoryTree[]>(catData.value ?? []);

// 商品列表（响应式 query）
const {
  data: result,
  pending,
  error,
  refresh,
} = await useAsyncData(
  "products-list",
  () =>
    getProducts({
      categorySlug: query.category || undefined,
      search: query.search || undefined,
      sort: query.sort as any,
      page: query.page,
      pageSize: query.pageSize,
    }),
  { watch: [() => ({ ...query })] }
);

const products = computed(() => result.value?.data ?? []);
const total = computed(() => result.value?.total ?? 0);
const totalPages = computed(() => result.value?.totalPages ?? 1);

// 当前激活分类（用于面包屑）
const activeCategory = computed(() => {
  if (!query.category) return null;
  const flat: CategoryTree[] = [];
  categoryTree.value.forEach((c) => {
    flat.push(c);
    c.children.forEach((s) => flat.push(s));
  });
  return flat.find((c) => c.slug === query.category) ?? null;
});

// 移动端分类下拉
const mobileCategoryOptions = computed(() => {
  const opts = [{ label: "全部", value: ALL_CATEGORY }]
  categoryTree.value.forEach((c) => {
    opts.push({ label: c.name, value: c.slug })
    c.children.forEach((s) =>
      opts.push({ label: `  └ ${s.name}`, value: s.slug })
    )
  })
  return opts
})

// 移动端 select 绑定值（空分类映射到 sentinel）
const mobileCategoryValue = computed({
  get: () => query.category || ALL_CATEGORY,
  set: (val: string) => {
    query.category = val === ALL_CATEGORY ? "" : val
    query.page = 1
    syncUrl()
  },
})

// ── SEO ───────────────────────────────────────────────────
useSeoMeta({
  title: computed(
    () =>
      `${activeCategory.value ? activeCategory.value.name + " · " : ""}商品列表 · My Ecommerce`
  ),
});
</script>
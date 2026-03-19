<!-- app/pages/cart.vue -->
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-6">购物车</h1>

            <!-- 空态 -->
            <div v-if="cartStore.isEmpty" class="flex flex-col items-center justify-center py-28 text-gray-400 gap-4">
                <UIcon name="i-lucide-shopping-cart" class="size-16" />
                <p class="text-base">购物车是空的</p>
                <NuxtLink to="/products">
                    <UButton>去选购商品</UButton>
                </NuxtLink>
            </div>

            <div v-else class="flex flex-col lg:flex-row gap-6">
                <!-- ── 左：商品列表 ──────────────────────────────── -->
                <div class="flex-1 min-w-0 space-y-3">
                    <!-- 全选工具栏 -->
                    <div
                        class="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <UCheckbox :model-value="allSelected"
                                @update:model-value="cartStore.toggleSelectAll($event)" />
                            <span class="text-sm text-gray-600">全选</span>
                        </label>
                        <UButton v-if="selectedItems.length" variant="ghost" size="xs" color="error"
                            icon="i-lucide-trash-2" @click="showBatchDeleteModal = true">
                            删除所选 ({{ selectedItems.length }})
                        </UButton>
                    </div>

                    <!-- 商品行 -->
                    <div v-for="item in cartStore.items" :key="`${item.product_id}-${item.variant_id}`"
                        class="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                        <!-- 勾选 -->
                        <div class="flex items-center">
                            <UCheckbox :model-value="item.selected"
                                @update:model-value="cartStore.toggleSelect(item.product_id, item.variant_id)" />
                        </div>

                        <!-- 图片 -->
                        <NuxtLink :to="`/products/${item.product.slug}`" class="flex-shrink-0">
                            <img :src="item.product.images?.[0]?.url" :alt="item.product.name"
                                class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-gray-50" />
                        </NuxtLink>

                        <!-- 信息 -->
                        <div class="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <NuxtLink :to="`/products/${item.product.slug}`"
                                    class="text-sm font-medium text-gray-800 hover:text-gray-600 line-clamp-2">
                                    {{ item.product.name }}
                                </NuxtLink>
                                <p v-if="item.variant" class="text-xs text-gray-400 mt-0.5">
                                    {{ item.variant.name }}
                                </p>
                            </div>

                            <div class="flex items-center justify-between flex-wrap gap-2 mt-2">
                                <!-- 单价 -->
                                <span class="text-sm text-gray-500">
                                    ¥{{ item.unit_price.toFixed(2) }} / 件
                                </span>

                                <!-- 数量控制 -->
                                <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                        class="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
                                        :disabled="item.quantity <= 1 || cartStore.syncing"
                                        @click="debouncedUpdate(item.product_id, item.variant_id, item.quantity - 1)">
                                        <UIcon name="i-lucide-minus" class="size-3.5" />
                                    </button>
                                    <span class="w-10 text-center text-sm font-semibold text-gray-900 select-none">
                                        {{ item.quantity }}
                                    </span>
                                    <button
                                        class="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
                                        :disabled="cartStore.syncing"
                                        @click="debouncedUpdate(item.product_id, item.variant_id, item.quantity + 1)">
                                        <UIcon name="i-lucide-plus" class="size-3.5" />
                                    </button>
                                </div>

                                <!-- 小计 -->
                                <span class="text-base font-bold text-gray-900 w-24 text-right">
                                    ¥{{ item.subtotal.toFixed(2) }}
                                </span>

                                <!-- 删除 -->
                                <button class="text-gray-400 hover:text-red-500 transition-colors"
                                    @click="confirmDelete(item.product_id, item.variant_id)">
                                    <UIcon name="i-lucide-trash-2" class="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── 右：价格汇总 ──────────────────────────────── -->
                <aside class="lg:w-72 flex-shrink-0">
                    <div class="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20 space-y-4">
                        <h3 class="font-bold text-gray-900">订单摘要</h3>

                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between text-gray-600">
                                <span>商品总价（{{ selectedItems.length || cartStore.totalItems }} 件）</span>
                                <span>¥{{ selectedTotal.toFixed(2) }}</span>
                            </div>
                            <div class="flex justify-between text-gray-600">
                                <span>运费</span>
                                <span :class="shippingFee === 0 ? 'text-green-600' : ''">
                                    {{ shippingFee === 0 ? '免运费' : `¥${shippingFee.toFixed(2)}` }}
                                </span>
                            </div>
                        </div>

                        <div class="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                            <span>实付金额</span>
                            <span class="text-gray-900">¥{{ (selectedTotal + shippingFee).toFixed(2) }}</span>
                        </div>

                        <UButton block size="lg" class="bg-gray-900 hover:bg-gray-700"
                            :disabled="selectedItems.length === 0" @click="handleCheckout">
                            去结算
                            <span v-if="selectedItems.length" class="ml-1 opacity-75 text-sm">
                                ({{ selectedItems.length }} 件)
                            </span>
                        </UButton>

                        <p v-if="selectedItems.length === 0" class="text-xs text-gray-400 text-center">
                            请选择要结算的商品
                        </p>
                    </div>
                </aside>
            </div>
        </div>

        <!-- 单个删除确认 -->
        <UModal v-model:open="showDeleteModal" title="确认删除">
            <template #body>
                <p class="text-sm text-gray-600">确定要从购物车中移除该商品吗？</p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="outline" @click="showDeleteModal = false">取消</UButton>
                    <UButton color="error" @click="executeDelete">删除</UButton>
                </div>
            </template>
        </UModal>

        <!-- 批量删除确认 -->
        <UModal v-model:open="showBatchDeleteModal" title="批量删除">
            <template #body>
                <p class="text-sm text-gray-600">
                    确定要删除选中的 {{ selectedItems.length }} 件商品吗？
                </p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="outline" @click="showBatchDeleteModal = false">取消</UButton>
                    <UButton color="error" @click="executeBatchDelete">全部删除</UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()

// ── 选中态计算 ─────────────────────────────────────────────
const selectedItems = computed(() => cartStore.items.filter((i) => i.selected))
const allSelected = computed(
    () => cartStore.items.length > 0 && cartStore.items.every((i) => i.selected)
)
const selectedTotal = computed(() =>
    selectedItems.value.reduce((sum, i) => sum + i.subtotal, 0)
)
const shippingFee = computed(() => (selectedTotal.value >= 99 ? 0 : 10))

// ── 防抖更新数量（500ms）─────────────────────────────────────
const debouncedUpdate = useDebounceFn(
    (productId: number, variantId: number | null, quantity: number) => {
        cartStore.updateQuantity(productId, variantId, quantity)
    },
    500
)

// ── 删除逻辑 ──────────────────────────────────────────────
const showDeleteModal = ref(false)
const showBatchDeleteModal = ref(false)
const pendingDelete = ref<{ productId: number; variantId: number | null } | null>(null)

function confirmDelete(productId: number, variantId: number | null) {
    pendingDelete.value = { productId, variantId }
    showDeleteModal.value = true
}

async function executeDelete() {
    if (!pendingDelete.value) return
    await cartStore.removeItem(pendingDelete.value.productId, pendingDelete.value.variantId)
    showDeleteModal.value = false
    pendingDelete.value = null
}

async function executeBatchDelete() {
    for (const item of selectedItems.value) {
        await cartStore.removeItem(item.product_id, item.variant_id)
    }
    showBatchDeleteModal.value = false
}

// ── 结算 ──────────────────────────────────────────────────
function handleCheckout() {
    console.log('[cart] items:', cartStore.items.map(i => ({ id: i.product_id, selected: i.selected })))
    if (!authStore.isLoggedIn) {
        router.push('/auth/login')
        return
    }
    router.push('/checkout')
}

// ── SEO ───────────────────────────────────────────────────
useSeoMeta({ title: '购物车 · MyShop' })
</script>
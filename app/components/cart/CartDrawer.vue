<!-- app/components/cart/CartDrawer.vue -->
<template>
    <UDrawer v-model:open="open" direction="right" :ui="{ container: 'w-full sm:w-96' }">
        <template #content>
            <div class="flex flex-col h-full">
                <!-- 头部 -->
                <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 class="font-bold text-gray-900">
                        购物车
                        <span v-if="!cartStore.isEmpty" class="text-gray-400 font-normal text-sm ml-1">
                            ({{ cartStore.totalItems }} 件)
                        </span>
                    </h2>
                    <UButton variant="ghost" icon="i-lucide-x" size="sm" @click="open = false" />
                </div>

                <!-- 空态 -->
                <div v-if="cartStore.isEmpty"
                    class="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <UIcon name="i-lucide-shopping-cart" class="size-14" />
                    <p class="text-sm">购物车还是空的</p>
                    <UButton variant="outline" size="sm" @click="open = false; navigateTo('/products')">
                        去选购
                    </UButton>
                </div>

                <!-- 商品列表 -->
                <div v-else class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    <div v-for="item in cartStore.items" :key="`${item.product_id}-${item.variant_id}`"
                        class="flex gap-3 bg-white rounded-xl border border-gray-100 p-3">
                        <!-- 图片 -->
                        <NuxtLink :to="`/products/${item.product.slug}`" class="flex-shrink-0" @click="open = false">
                            <img :src="item.product.images?.[0]?.url" :alt="item.product.name"
                                class="w-16 h-16 rounded-lg object-cover bg-gray-50" />
                        </NuxtLink>

                        <!-- 信息 -->
                        <div class="flex-1 min-w-0">
                            <NuxtLink :to="`/products/${item.product.slug}`"
                                class="text-sm font-medium text-gray-800 line-clamp-2 leading-snug hover:text-gray-600"
                                @click="open = false">
                                {{ item.product.name }}
                            </NuxtLink>
                            <p v-if="item.variant" class="text-xs text-gray-400 mt-0.5">
                                {{ item.variant.name }}
                            </p>
                            <div class="flex items-center justify-between mt-2">
                                <span class="text-sm font-bold text-gray-900">
                                    ¥{{ item.subtotal.toFixed(2) }}
                                </span>
                                <div class="flex items-center gap-1">
                                    <!-- 数量 -->
                                    <button
                                        class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 disabled:opacity-40"
                                        :disabled="item.quantity <= 1"
                                        @click="cartStore.updateQuantity(item.product_id, item.variant_id, item.quantity - 1)">
                                        <UIcon name="i-lucide-minus" class="size-3" />
                                    </button>
                                    <span class="w-6 text-center text-xs font-semibold">{{ item.quantity }}</span>
                                    <button
                                        class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                                        @click="cartStore.updateQuantity(item.product_id, item.variant_id, item.quantity + 1)">
                                        <UIcon name="i-lucide-plus" class="size-3" />
                                    </button>
                                    <!-- 删除 -->
                                    <button
                                        class="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"
                                        @click="cartStore.removeItem(item.product_id, item.variant_id)">
                                        <UIcon name="i-lucide-trash-2" class="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 底部结算 -->
                <div v-if="!cartStore.isEmpty" class="border-t border-gray-100 px-5 py-4 space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">商品合计</span>
                        <span class="font-bold text-gray-900">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
                    </div>
                    <UButton block size="lg" class="bg-gray-900 hover:bg-gray-700" @click="handleCheckout">
                        去结算 ({{ cartStore.totalItems }} 件)
                    </UButton>
                    <UButton block variant="outline" size="sm" @click="navigateTo('/cart'); open = false">
                        查看购物车
                    </UButton>
                </div>
            </div>
        </template>
    </UDrawer>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()

function handleCheckout() {
    if (!authStore.isLoggedIn) {
        router.push('/auth/login')
        open.value = false
        return
    }

    router.push('/checkout')
    open.value = false
}
</script>
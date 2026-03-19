<!-- app/pages/orders/index.vue -->
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-6">我的订单</h1>

            <!-- 状态标签页 -->
            <div class="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 mb-5 overflow-x-auto">
                <button v-for="tab in STATUS_TABS" :key="tab.value"
                    class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors" :class="activeStatus === tab.value
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        " @click="switchStatus(tab.value)">
                    {{ tab.label }}
                </button>
            </div>

            <!-- 加载骨架 -->
            <div v-if="orderStore.loading" class="space-y-3">
                <div v-for="n in 3" :key="n" class="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                    <div class="flex justify-between mb-3">
                        <div class="h-4 bg-gray-200 rounded w-32" />
                        <div class="h-4 bg-gray-200 rounded w-16" />
                    </div>
                    <div class="flex gap-2">
                        <div v-for="i in 2" :key="i" class="w-14 h-14 bg-gray-200 rounded-xl" />
                    </div>
                </div>
            </div>

            <!-- 空态 -->
            <div v-else-if="!orderStore.orders.length"
                class="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                <UIcon name="i-lucide-package-search" class="size-14" />
                <p class="text-sm">暂无相关订单</p>
                <NuxtLink to="/products">
                    <UButton variant="outline" size="sm">去购物</UButton>
                </NuxtLink>
            </div>

            <!-- 订单列表 -->
            <div v-else class="space-y-3">
                <NuxtLink v-for="order in orderStore.orders" :key="order.id" :to="`/orders/${order.id}`"
                    class="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                    <!-- 头部 -->
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-xs text-gray-400">
                            订单号：{{ order.id }} · {{ formatDate(order.created_at) }}
                        </div>
                        <UBadge :color="statusColor(order.status)" variant="soft" size="sm">
                            {{ statusLabel(order.status) }}
                        </UBadge>
                    </div>

                    <!-- 商品缩略图 -->
                    <div class="flex gap-2 mb-3">
                        <img v-for="(item, i) in (order.items ?? []).slice(0, 4)" :key="i"
                            :src="(item.product_snapshot as any)?.image" :alt="(item.product_snapshot as any)?.name"
                            class="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100" />
                        <div v-if="(order.items?.length ?? 0) > 4"
                            class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                            +{{ (order.items?.length ?? 0) - 4 }}
                        </div>
                    </div>

                    <!-- 底部 -->
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-500">
                            共 {{ order.items?.length ?? 0 }} 件商品
                        </span>
                        <span class="text-base font-bold text-gray-900">
                            ¥{{ (order.total_amount + order.shipping_fee).toFixed(2) }}
                        </span>
                    </div>
                </NuxtLink>
            </div>

            <!-- 分页 -->
            <div v-if="totalPages > 1" class="flex justify-center mt-8">
                <UPagination v-model:page="currentPage" :total="orderStore.total" :items-per-page="PAGE_SIZE"
                    @update:page="loadOrders" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { OrderStatus } from "~/types";

definePageMeta({ middleware: "auth" });

const orderStore = useOrderStore();

const STATUS_TABS = [
    { label: "全部", value: "" },
    { label: "待付款", value: "pending" },
    { label: "待发货", value: "paid" },
    { label: "已发货", value: "shipped" },
    { label: "已完成", value: "delivered" },
    { label: "已取消", value: "cancelled" },
];

const activeStatus = ref("");
const currentPage = ref(1);
const PAGE_SIZE = 10;
const totalPages = computed(() => Math.ceil(orderStore.total / PAGE_SIZE));

async function loadOrders() {
    await orderStore.fetchOrders(
        activeStatus.value as OrderStatus || undefined,
        currentPage.value,
        PAGE_SIZE
    );
}

async function switchStatus(status: string) {
    activeStatus.value = status;
    currentPage.value = 1;
    await loadOrders();
}

await loadOrders();

// ── 工具函数 ──────────────────────────────────────────────
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
    });
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        pending: "待付款", paid: "待发货", shipped: "已发货",
        delivered: "已完成", cancelled: "已取消", refunded: "已退款",
    };
    return map[status] ?? status;
}

function statusColor(status: string) {
    const map: Record<string, string> = {
        pending: "warning", paid: "info", shipped: "primary",
        delivered: "success", cancelled: "neutral", refunded: "neutral",
    };
    return map[status] ?? "neutral";
}

useSeoMeta({ title: "我的订单 · MyShop" });
</script>
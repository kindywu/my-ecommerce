<!-- app/pages/orders/[id].vue -->
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <!-- 成功提示 -->
            <div v-if="showSuccess"
                class="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-lucide-check-circle" class="size-6 text-green-600" />
                </div>
                <div>
                    <p class="font-semibold text-green-800">订单提交成功！</p>
                    <p class="text-sm text-green-600 mt-0.5">请尽快完成支付，我们将为您安排发货</p>
                </div>
            </div>

            <!-- 骨架屏 -->
            <div v-if="orderStore.loading" class="space-y-4">
                <div class="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
                <div class="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
            </div>

            <template v-else-if="order">
                <!-- 头部：订单号 + 状态 -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h1 class="text-xl font-bold text-gray-900">订单 #{{ order.id }}</h1>
                        <p class="text-sm text-gray-400 mt-0.5">{{ formatDate(order.created_at) }}</p>
                    </div>
                    <UBadge :color="statusColor(order.status)" variant="soft" size="lg">
                        {{ statusLabel(order.status) }}
                    </UBadge>
                </div>

                <!-- 进度条 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <div class="flex items-center">
                        <template v-for="(step, i) in ORDER_STEPS" :key="i">
                            <div class="flex flex-col items-center gap-1 flex-shrink-0">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                    :class="stepDone(i)
                                            ? 'bg-green-500'
                                            : stepActive(i)
                                                ? 'bg-gray-900'
                                                : 'bg-gray-200'
                                        ">
                                    <UIcon :name="stepDone(i) ? 'i-lucide-check' : step.icon" class="size-4"
                                        :class="stepDone(i) || stepActive(i) ? 'text-white' : 'text-gray-400'" />
                                </div>
                                <span class="text-xs font-medium whitespace-nowrap"
                                    :class="stepActive(i) ? 'text-gray-900' : 'text-gray-400'">
                                    {{ step.label }}
                                </span>
                            </div>
                            <div v-if="i < ORDER_STEPS.length - 1" class="flex-1 h-0.5 mb-4 mx-1 transition-colors"
                                :class="stepDone(i) ? 'bg-green-400' : 'bg-gray-200'" />
                        </template>
                    </div>
                </div>

                <!-- 收货地址 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">收货地址</p>
                    <p class="text-sm font-semibold text-gray-900">
                        {{ order.address_snapshot.receiver }}
                        <span class="font-normal text-gray-500 ml-2">{{ order.address_snapshot.phone }}</span>
                    </p>
                    <p class="text-sm text-gray-600 mt-0.5">{{ order.address_snapshot.full_address }}</p>
                </div>

                <!-- 商品明细 -->
                <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-4">
                    <div v-for="item in order.items" :key="item.id" class="flex gap-4 p-4">
                        <img :src="(item.product_snapshot as any)?.image" :alt="(item.product_snapshot as any)?.name"
                            class="w-16 h-16 rounded-xl object-cover bg-gray-50 flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800">
                                {{ (item.product_snapshot as any)?.name }}
                            </p>
                            <p v-if="(item.product_snapshot as any)?.variant_name" class="text-xs text-gray-400 mt-0.5">
                                {{ (item.product_snapshot as any)?.variant_name }}
                            </p>
                            <div class="flex justify-between items-center mt-2">
                                <span class="text-xs text-gray-500">× {{ item.quantity }}</span>
                                <span class="text-sm font-bold text-gray-900">
                                    ¥{{ (item.unit_price * item.quantity).toFixed(2) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 价格明细 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-4 space-y-2">
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>商品总价</span>
                        <span>¥{{ order.total_amount.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>运费</span>
                        <span :class="order.shipping_fee === 0 ? 'text-green-600' : ''">
                            {{ order.shipping_fee === 0 ? '免运费' : `¥${order.shipping_fee.toFixed(2)}` }}
                        </span>
                    </div>
                    <div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                        <span>实付金额</span>
                        <span>¥{{ (order.total_amount + order.shipping_fee).toFixed(2) }}</span>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="flex gap-3 justify-end">
                    <!-- 模拟支付 -->
                    <UButton v-if="order.status === 'pending'" size="lg" class="bg-green-600 hover:bg-green-700"
                        :loading="paying" @click="handlePay">
                        立即支付 ¥{{ (order.total_amount + order.shipping_fee).toFixed(2) }}
                    </UButton>

                    <!-- 取消订单 -->
                    <UButton v-if="order.status === 'pending'" variant="outline" color="error" :loading="cancelling"
                        @click="showCancelModal = true">
                        取消订单
                    </UButton>

                    <NuxtLink v-if="order.status !== 'pending'" to="/orders">
                        <UButton variant="outline">返回订单列表</UButton>
                    </NuxtLink>
                </div>
            </template>

            <!-- 取消确认弹窗 -->
            <UModal v-model:open="showCancelModal" title="确认取消订单">
                <template #body>
                    <p class="text-sm text-gray-600">取消后订单将无法恢复，确定要取消此订单吗？</p>
                </template>
                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton variant="outline" @click="showCancelModal = false">再想想</UButton>
                        <UButton color="error" :loading="cancelling" @click="handleCancel">确认取消</UButton>
                    </div>
                </template>
            </UModal>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const toast = useToast();

const orderId = Number(route.params.id);
const showSuccess = ref(route.query.success === "true");
const showCancelModal = ref(false);
const paying = ref(false);
const cancelling = ref(false);

await orderStore.fetchOrder(orderId);
const order = computed(() => orderStore.currentOrder);

// ── 订单进度步骤 ──────────────────────────────────────────
const ORDER_STEPS = [
    { label: "提交订单", icon: "i-lucide-file-text", status: ["pending", "paid", "shipped", "delivered"] },
    { label: "付款成功", icon: "i-lucide-credit-card", status: ["paid", "shipped", "delivered"] },
    { label: "商家发货", icon: "i-lucide-package", status: ["shipped", "delivered"] },
    { label: "确认收货", icon: "i-lucide-check-circle", status: ["delivered"] },
];

const statusIndex = computed(() => {
    const map: Record<string, number> = {
        pending: 0, paid: 1, shipped: 2, delivered: 3, cancelled: -1,
    };
    return map[order.value?.status ?? ""] ?? 0;
});

function stepDone(i: number) {
    return i < statusIndex.value;
}
function stepActive(i: number) {
    return i === statusIndex.value;
}

// ── 操作 ──────────────────────────────────────────────────
async function handlePay() {
    paying.value = true;
    try {
        await orderStore.simulatePay(orderId);
        toast.add({ title: "支付成功！", icon: "i-lucide-check-circle", color: "success" });
        showSuccess.value = false;
    } catch (e: any) {
        toast.add({ title: e.message, color: "error" });
    } finally {
        paying.value = false;
    }
}

async function handleCancel() {
    cancelling.value = true;
    try {
        await orderStore.cancelOrder(orderId);
        showCancelModal.value = false;
        toast.add({ title: "订单已取消", color: "success" });
        router.push("/orders");
    } catch (e: any) {
        toast.add({ title: e.message, color: "error" });
    } finally {
        cancelling.value = false;
    }
}

// ── 工具函数 ──────────────────────────────────────────────
function formatDate(iso: string) {
    return new Date(iso).toLocaleString("zh-CN");
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

useSeoMeta({ title: `订单 #${orderId} · MyShop` });
</script>
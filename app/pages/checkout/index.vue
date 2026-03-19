<!-- app/pages/checkout/index.vue -->
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-8">结账</h1>

            <!-- 步骤指示器 -->
            <div class="flex items-center mb-8">
                <template v-for="(step, i) in STEPS" :key="i">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                            :class="currentStep > i
                                    ? 'bg-green-500 text-white'
                                    : currentStep === i
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                ">
                            <UIcon v-if="currentStep > i" name="i-lucide-check" class="size-3.5" />
                            <span v-else>{{ i + 1 }}</span>
                        </div>
                        <span class="text-sm font-medium"
                            :class="currentStep === i ? 'text-gray-900' : 'text-gray-400'">
                            {{ step }}
                        </span>
                    </div>
                    <div v-if="i < STEPS.length - 1" class="flex-1 h-px mx-3 transition-colors"
                        :class="currentStep > i ? 'bg-green-400' : 'bg-gray-200'" />
                </template>
            </div>

            <!-- ── 步骤 0：确认商品 ────────────────────────────── -->
            <div v-if="currentStep === 0" class="space-y-4">
                <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                    <div v-for="item in checkoutItems" :key="`${item.product_id}-${item.variant_id}`"
                        class="flex gap-4 p-4">
                        <img :src="item.product.images?.[0]?.url" :alt="item.product.name"
                            class="w-16 h-16 rounded-xl object-cover bg-gray-50 flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800 line-clamp-2">{{ item.product.name }}</p>
                            <p v-if="item.variant" class="text-xs text-gray-400 mt-0.5">{{ item.variant.name }}</p>
                            <div class="flex justify-between items-center mt-2">
                                <span class="text-xs text-gray-500">× {{ item.quantity }}</span>
                                <span class="text-sm font-bold text-gray-900">¥{{ item.subtotal.toFixed(2) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-gray-100 p-4 flex justify-between text-sm">
                    <span class="text-gray-500">共 {{ checkoutItems.length }} 种商品</span>
                    <span class="font-bold text-gray-900">合计 ¥{{ checkoutTotal.toFixed(2) }}</span>
                </div>

                <div class="flex justify-end">
                    <UButton @click="currentStep = 1">下一步：填写地址 →</UButton>
                </div>
            </div>

            <!-- ── 步骤 1：填写地址 ────────────────────────────── -->
            <div v-else-if="currentStep === 1" class="space-y-4">
                <!-- 已有地址 -->
                <div v-if="addresses.length" class="space-y-2">
                    <p class="text-sm font-medium text-gray-700">选择收货地址</p>
                    <div v-for="addr in addresses" :key="addr.id"
                        class="bg-white rounded-2xl border-2 p-4 cursor-pointer transition-colors" :class="selectedAddressId === addr.id
                                ? 'border-gray-900'
                                : 'border-gray-100 hover:border-gray-300'
                            " @click="selectedAddressId = addr.id">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-sm font-semibold text-gray-900">{{ addr.receiver }}</span>
                                    <span class="text-sm text-gray-500">{{ addr.phone }}</span>
                                    <UBadge v-if="addr.is_default" size="xs" variant="soft">默认</UBadge>
                                </div>
                                <p class="text-sm text-gray-600">
                                    {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}
                                </p>
                            </div>
                            <div class="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center"
                                :class="selectedAddressId === addr.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'">
                                <div v-if="selectedAddressId === addr.id" class="w-2 h-2 rounded-full bg-white" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 新增地址表单 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-5">
                    <button class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4"
                        @click="showAddressForm = !showAddressForm">
                        <UIcon name="i-lucide-plus-circle" class="size-4" />
                        {{ showAddressForm ? '收起' : '新增地址' }}
                    </button>

                    <div v-if="showAddressForm" class="space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="收货人">
                                <UInput v-model="newAddress.receiver" placeholder="姓名" />
                            </UFormField>
                            <UFormField label="手机号">
                                <UInput v-model="newAddress.phone" placeholder="11位手机号" />
                            </UFormField>
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                            <UFormField label="省份">
                                <UInput v-model="newAddress.province" placeholder="省" />
                            </UFormField>
                            <UFormField label="城市">
                                <UInput v-model="newAddress.city" placeholder="市" />
                            </UFormField>
                            <UFormField label="区县">
                                <UInput v-model="newAddress.district" placeholder="区/县" />
                            </UFormField>
                        </div>
                        <UFormField label="详细地址">
                            <UInput v-model="newAddress.detail" placeholder="街道、门牌号等" />
                        </UFormField>
                        <div class="flex items-center gap-2">
                            <UCheckbox v-model="newAddress.is_default" label="设为默认地址" />
                        </div>
                        <UButton size="sm" :loading="savingAddress" @click="saveNewAddress">
                            保存地址
                        </UButton>
                    </div>
                </div>

                <div class="flex justify-between">
                    <UButton variant="outline" @click="currentStep = 0">← 返回</UButton>
                    <UButton :disabled="!selectedAddressId" @click="currentStep = 2">
                        下一步：确认支付 →
                    </UButton>
                </div>
            </div>

            <!-- ── 步骤 2：确认支付 ────────────────────────────── -->
            <div v-else-if="currentStep === 2" class="space-y-4">
                <!-- 收货地址 -->
                <div v-if="selectedAddress" class="bg-white rounded-2xl border border-gray-100 p-4">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">收货地址</p>
                    <p class="text-sm font-semibold text-gray-900">
                        {{ selectedAddress.receiver }}
                        <span class="font-normal text-gray-500 ml-2">{{ selectedAddress.phone }}</span>
                    </p>
                    <p class="text-sm text-gray-600 mt-0.5">
                        {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{
                        selectedAddress.detail }}
                    </p>
                </div>

                <!-- 支付方式 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-4">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">支付方式</p>
                    <div class="grid grid-cols-3 gap-2">
                        <button v-for="method in PAYMENT_METHODS" :key="method.value"
                            class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors" :class="paymentMethod === method.value
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-100 hover:border-gray-300'
                                " @click="paymentMethod = method.value">
                            <UIcon :name="method.icon" class="size-6" :class="method.color" />
                            <span class="text-xs font-medium text-gray-700">{{ method.label }}</span>
                        </button>
                    </div>
                </div>

                <!-- 价格明细 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">价格明细</p>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>商品总价</span>
                        <span>¥{{ checkoutTotal.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>运费</span>
                        <span :class="shippingFee === 0 ? 'text-green-600' : ''">
                            {{ shippingFee === 0 ? '免运费' : `¥${shippingFee.toFixed(2)}` }}
                        </span>
                    </div>
                    <div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                        <span>实付金额</span>
                        <span>¥{{ (checkoutTotal + shippingFee).toFixed(2) }}</span>
                    </div>
                </div>

                <div class="flex justify-between">
                    <UButton variant="outline" @click="currentStep = 1">← 返回</UButton>
                    <UButton size="lg" class="bg-gray-900 hover:bg-gray-700 px-8" :loading="orderStore.loading"
                        @click="handleSubmitOrder">
                        提交订单 ¥{{ (checkoutTotal + shippingFee).toFixed(2) }}
                    </UButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AddressRow } from "~/types";

definePageMeta({ middleware: "auth" });

const cartStore = useCartStore();
const orderStore = useOrderStore();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

// ── 常量 ──────────────────────────────────────────────────
const STEPS = ["确认商品", "填写地址", "确认支付"];

const PAYMENT_METHODS = [
    { label: "微信支付", value: "wechat", icon: "i-lucide-smartphone", color: "text-green-500" },
    { label: "支付宝", value: "alipay", icon: "i-lucide-credit-card", color: "text-blue-500" },
    { label: "货到付款", value: "cod", icon: "i-lucide-package", color: "text-orange-500" },
];

// ── 结算商品（只取选中的）────────────────────────────────
const checkoutItems = computed(() =>
    cartStore.items.filter((i) => i.selected)
);

const checkoutTotal = computed(() =>
    checkoutItems.value.reduce((sum, i) => sum + i.subtotal, 0)
);

const shippingFee = computed(() => (checkoutTotal.value >= 99 ? 0 : 10));

// 如果没有选中商品，跳回购物车
if (!checkoutItems.value.length) {
    await navigateTo("/cart");
}

// ── 步骤状态 ──────────────────────────────────────────────
const currentStep = ref(0);
const paymentMethod = ref("wechat");

// ── 地址 ──────────────────────────────────────────────────
const addresses = ref<AddressRow[]>([]);
const selectedAddressId = ref<number | null>(null);
const showAddressForm = ref(false);
const savingAddress = ref(false);

const newAddress = reactive({
    receiver: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
    is_default: false,
});

const selectedAddress = computed(() =>
    addresses.value.find((a) => a.id === selectedAddressId.value) ?? null
);

async function loadAddresses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
    addresses.value = (data ?? []) as AddressRow[];
    // 默认选中默认地址
    const def = addresses.value.find((a) => a.is_default);
    if (def) selectedAddressId.value = def.id;
    else if (addresses.value.length) selectedAddressId.value = addresses.value[0].id;
}

await loadAddresses();

async function saveNewAddress() {
    if (!newAddress.receiver || !newAddress.phone || !newAddress.detail) {
        toast.add({ title: "请填写完整地址信息", color: "error" });
        return;
    }
    savingAddress.value = true;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("addresses")
            .insert({ ...newAddress, user_id: user.id, label: newAddress.receiver })
            .select()
            .single();

        if (error) throw error;
        addresses.value.unshift(data as AddressRow);
        selectedAddressId.value = (data as AddressRow).id;
        showAddressForm.value = false;
        Object.assign(newAddress, { receiver: "", phone: "", province: "", city: "", district: "", detail: "", is_default: false });
        toast.add({ title: "地址已保存", color: "success" });
    } catch (e: any) {
        toast.add({ title: e.message, color: "error" });
    } finally {
        savingAddress.value = false;
    }
}

// ── 提交订单 ──────────────────────────────────────────────
async function handleSubmitOrder() {
    if (!selectedAddressId.value) return;

    try {
        const orderId = await orderStore.createOrder({
            addressId: selectedAddressId.value,
            paymentMethod: paymentMethod.value,
            items: checkoutItems.value.map((i) => ({
                product_id: i.product_id,
                variant_id: i.variant_id,
                quantity: i.quantity,
            })),
        });

        // 清空本地购物车
        cartStore.items = cartStore.items.filter((i) => !i.selected);

        router.push(`/orders/${orderId}?success=true`);
    } catch (e: any) {
        toast.add({ title: e.message || "订单创建失败", color: "error" });
    }
}

useSeoMeta({ title: "结账 · MyShop" });
</script>
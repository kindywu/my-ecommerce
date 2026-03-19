<!-- app/pages/profile/addresses.vue -->
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold text-gray-900">收货地址</h1>
                <UButton icon="i-lucide-plus" size="sm" @click="openForm()">新增地址</UButton>
            </div>

            <!-- 地址列表 -->
            <div v-if="loading" class="space-y-3">
                <div v-for="n in 2" :key="n"
                    class="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
            </div>

            <div v-else-if="!addresses.length" class="flex flex-col items-center py-20 text-gray-400 gap-3">
                <UIcon name="i-lucide-map-pin" class="size-12" />
                <p class="text-sm">还没有收货地址</p>
                <UButton size="sm" @click="openForm()">添加第一个地址</UButton>
            </div>

            <div v-else class="space-y-3">
                <div v-for="addr in addresses" :key="addr.id" class="bg-white rounded-2xl border border-gray-100 p-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <span class="font-semibold text-gray-900">{{ addr.receiver }}</span>
                                <span class="text-gray-500 text-sm">{{ addr.phone }}</span>
                                <UBadge v-if="addr.is_default" size="xs" variant="soft" color="success">默认</UBadge>
                                <UBadge v-if="addr.label" size="xs" variant="outline">{{ addr.label }}</UBadge>
                            </div>
                            <p class="text-sm text-gray-600">
                                {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}
                            </p>
                        </div>

                        <div class="flex items-center gap-1 flex-shrink-0">
                            <UButton variant="ghost" size="xs" icon="i-lucide-pencil" @click="openForm(addr)" />
                            <UButton variant="ghost" size="xs" icon="i-lucide-trash-2" color="error"
                                @click="confirmDelete(addr.id)" />
                        </div>
                    </div>

                    <div v-if="!addr.is_default" class="mt-3 pt-3 border-t border-gray-50">
                        <UButton variant="ghost" size="xs" icon="i-lucide-star" :loading="settingDefault === addr.id"
                            @click="setDefault(addr.id)">
                            设为默认
                        </UButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- 新增/编辑弹窗 -->
        <UModal v-model:open="showForm" :title="editingId ? '编辑地址' : '新增地址'">
            <template #body>
                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <UFormField label="收货人 *">
                            <UInput v-model="form.receiver" placeholder="姓名" />
                        </UFormField>
                        <UFormField label="手机号 *">
                            <UInput v-model="form.phone" placeholder="11位手机号" />
                        </UFormField>
                    </div>
                    <UFormField label="标签">
                        <UInput v-model="form.label" placeholder="家/公司/学校" />
                    </UFormField>
                    <div class="grid grid-cols-3 gap-3">
                        <UFormField label="省份 *">
                            <UInput v-model="form.province" placeholder="省" />
                        </UFormField>
                        <UFormField label="城市 *">
                            <UInput v-model="form.city" placeholder="市" />
                        </UFormField>
                        <UFormField label="区县 *">
                            <UInput v-model="form.district" placeholder="区/县" />
                        </UFormField>
                    </div>
                    <UFormField label="详细地址 *">
                        <UInput v-model="form.detail" placeholder="街道、楼号、门牌号等" />
                    </UFormField>
                    <UCheckbox v-model="form.is_default" label="设为默认地址" />
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="outline" @click="showForm = false">取消</UButton>
                    <UButton :loading="saving" @click="saveAddress">保存</UButton>
                </div>
            </template>
        </UModal>

        <!-- 删除确认 -->
        <UModal v-model:open="showDeleteModal" title="删除地址">
            <template #body>
                <p class="text-sm text-gray-600">确定删除该地址吗？</p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="outline" @click="showDeleteModal = false">取消</UButton>
                    <UButton color="error" :loading="deleting" @click="executeDelete">删除</UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { AddressRow } from "~/types";

definePageMeta({ middleware: "auth" });

const supabase = useSupabaseClient();
const toast = useToast();

const addresses = ref<AddressRow[]>([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const settingDefault = ref<number | null>(null);
const showForm = ref(false);
const showDeleteModal = ref(false);
const editingId = ref<number | null>(null);
const pendingDeleteId = ref<number | null>(null);

const form = reactive({
    label: "",
    receiver: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
    is_default: false,
});

async function loadAddresses() {
    loading.value = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
    addresses.value = (data ?? []) as AddressRow[];
    loading.value = false;
}

await loadAddresses();

function openForm(addr?: AddressRow) {
    if (addr) {
        editingId.value = addr.id;
        Object.assign(form, {
            label: addr.label ?? "",
            receiver: addr.receiver,
            phone: addr.phone,
            province: addr.province,
            city: addr.city,
            district: addr.district,
            detail: addr.detail,
            is_default: addr.is_default,
        });
    } else {
        editingId.value = null;
        Object.assign(form, { label: "", receiver: "", phone: "", province: "", city: "", district: "", detail: "", is_default: false });
    }
    showForm.value = true;
}

async function saveAddress() {
    if (!form.receiver || !form.phone || !form.province || !form.city || !form.district || !form.detail) {
        toast.add({ title: "请填写所有必填项", color: "error" });
        return;
    }
    saving.value = true;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 如果设为默认，先取消其他默认
        if (form.is_default) {
            await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
        }

        if (editingId.value) {
            await supabase.from("addresses").update({ ...form }).eq("id", editingId.value);
        } else {
            await supabase.from("addresses").insert({ ...form, user_id: user.id });
        }

        toast.add({ title: editingId.value ? "地址已更新" : "地址已添加", color: "success" });
        showForm.value = false;
        await loadAddresses();
    } catch (e: any) {
        toast.add({ title: e.message, color: "error" });
    } finally {
        saving.value = false;
    }
}

function confirmDelete(id: number) {
    pendingDeleteId.value = id;
    showDeleteModal.value = true;
}

async function executeDelete() {
    if (!pendingDeleteId.value) return;
    deleting.value = true;
    try {
        await supabase.from("addresses").delete().eq("id", pendingDeleteId.value);
        addresses.value = addresses.value.filter((a) => a.id !== pendingDeleteId.value);
        showDeleteModal.value = false;
        toast.add({ title: "地址已删除", color: "success" });
    } finally {
        deleting.value = false;
    }
}

async function setDefault(id: number) {
    settingDefault.value = id;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    await loadAddresses();
    settingDefault.value = null;
    toast.add({ title: "默认地址已更新", color: "success" });
}

useSeoMeta({ title: "收货地址 · MyShop" });
</script>
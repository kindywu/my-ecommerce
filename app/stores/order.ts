// app/stores/order.ts
import { defineStore } from "pinia";
import type { Order, OrderStatus } from "~/types";

export const useOrderStore = defineStore("order", () => {
  const supabase = useSupabaseClient();

  const orders = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);
  const loading = ref(false);
  const total = ref(0);

  // ── 创建订单（调用 RPC）──────────────────────────────────
  async function createOrder(params: {
    addressId: number;
    paymentMethod: string;
    items: Array<{
      product_id: number;
      variant_id?: number | null;
      quantity: number;
    }>;
  }): Promise<number> {
    loading.value = true;
    try {
      const { data, error } = await supabase.rpc("create_order", {
        p_address_id: params.addressId,
        p_payment_method: params.paymentMethod,
        p_items: params.items,
      });
      if (error) throw new Error(error.message);
      return data as number;
    } finally {
      loading.value = false;
    }
  }

  // ── 获取订单列表 ─────────────────────────────────────────
  async function fetchOrders(status?: OrderStatus, page = 1, pageSize = 10) {
    loading.value = true;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("orders")
        .select("*, items:order_items(*)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (status) query = query.eq("status", status);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      orders.value = (data ?? []) as unknown as Order[];
      total.value = count ?? 0;
    } finally {
      loading.value = false;
    }
  }

  // ── 获取单个订单 ─────────────────────────────────────────
  async function fetchOrder(id: number) {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      currentOrder.value = data as unknown as Order;
    } finally {
      loading.value = false;
    }
  }

  // ── 取消订单 ─────────────────────────────────────────────
  async function cancelOrder(id: number) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending"); // 只允许取消待付款订单

    if (error) throw new Error(error.message);

    // 更新本地状态
    const order = orders.value.find((o) => o.id === id) as Order | undefined;
    if (order) order.status = "cancelled" as OrderStatus;

    if (currentOrder.value?.id === id) currentOrder.value.status = "cancelled";
  }

  // ── 模拟支付（直接变更状态）─────────────────────────────
  async function simulatePay(id: number) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");

    if (error) throw new Error(error.message);
    if (currentOrder.value?.id === id) {
      currentOrder.value.status = "paid";
      currentOrder.value.paid_at = new Date().toISOString();
    }
  }

  return {
    orders,
    currentOrder,
    loading,
    total,
    createOrder,
    fetchOrders,
    fetchOrder,
    cancelOrder,
    simulatePay,
  };
});

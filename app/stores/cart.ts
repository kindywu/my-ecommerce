// app/stores/cart.ts
import { defineStore } from "pinia";
import type {
  CartItemView,
  CartItemAdd,
  Product,
  ProductVariantRow,
} from "~/types";

export const useCartStore = defineStore(
  "cart",
  () => {
    const supabase = useSupabaseClient();
    const authStore = useAuthStore();

    // ── State ────────────────────────────────────────────────
    const items = ref<CartItemView[]>([]);
    const loading = ref(false);
    const syncing = ref(false);

    // ── Getters ──────────────────────────────────────────────
    const totalItems = computed(() =>
      items.value.reduce((sum, item) => sum + item.quantity, 0),
    );

    const totalAmount = computed(() =>
      items.value.reduce((sum, item) => sum + item.subtotal, 0),
    );

    const isEmpty = computed(() => items.value.length === 0);

    // ── 内部工具 ──────────────────────────────────────────────
    function buildCartItemView(
      raw: {
        id: number;
        product_id: number;
        variant_id: number | null;
        quantity: number;
        user_id: string;
        created_at: string;
        updated_at: string;
      },
      product: Product,
      variant: ProductVariantRow | null,
    ): CartItemView {
      const unit_price = product.price + (variant?.price_modifier ?? 0);
      return {
        ...raw,
        product,
        variant,
        unit_price,
        subtotal: unit_price * raw.quantity,
        selected: true,
      };
    }

    function parseImages(raw: unknown) {
      if (!Array.isArray(raw)) return [];
      return raw.map((item: unknown) => {
        if (typeof item === "object" && item !== null && "url" in item)
          return item as { url: string; alt?: string };
        return { url: String(item) };
      });
    }

    // ── Actions ──────────────────────────────────────────────

    // 从 Supabase 加载购物车
    async function loadFromSupabase() {
      if (!authStore.isLoggedIn) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      loading.value = true;
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select(
            `
            *,
            product:products(*, category:categories(*), variants:product_variants(*)),
            variant:product_variants(*)
          `,
          )
          .eq("user_id", user.id);

        if (error) throw error;

        items.value = (data ?? []).map((row: any) => {
          const product: Product = {
            ...row.product,
            images: parseImages(row.product?.images),
          };
          return buildCartItemView(row, product, row.variant ?? null);
        });
      } finally {
        loading.value = false;
      }
    }

    // 同步到 Supabase（upsert 当前所有条目）
    async function syncToSupabase() {
      if (!authStore.isLoggedIn) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      syncing.value = true;
      try {
        // 先删除云端全部，再重新写入（简单可靠）
        await supabase.from("cart_items").delete().eq("user_id", user.id);

        if (items.value.length === 0) return;

        const rows = items.value.map((item) => ({
          user_id: user.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        }));

        const { error } = await supabase.from("cart_items").insert(rows);
        if (error) throw error;
      } finally {
        syncing.value = false;
      }
    }

    // 加入购物车
    async function addItem(
      params: CartItemAdd & {
        product: Product;
        variant?: ProductVariantRow | null;
      },
    ) {
      const {
        product_id,
        variant_id = null,
        quantity,
        product,
        variant = null,
      } = params;

      const existing = items.value.find(
        (i) => i.product_id === product_id && i.variant_id === variant_id,
      );

      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.unit_price * existing.quantity;
      } else {
        const unit_price = product.price + (variant?.price_modifier ?? 0);
        const newItem: CartItemView = {
          id: Date.now(), // 本地临时 id，同步后会被覆盖
          user_id: "",
          product_id,
          variant_id,
          quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product,
          variant,
          unit_price,
          subtotal: unit_price * quantity,
          selected: true,
        };
        items.value.push(newItem);
      }

      await syncToSupabase();
    }

    // 移除商品
    async function removeItem(
      productId: number,
      variantId: number | null = null,
    ) {
      items.value = items.value.filter(
        (i) => !(i.product_id === productId && i.variant_id === variantId),
      );
      await syncToSupabase();
    }

    // 更新数量
    async function updateQuantity(
      productId: number,
      variantId: number | null,
      quantity: number,
    ) {
      const item = items.value.find(
        (i) => i.product_id === productId && i.variant_id === variantId,
      );
      if (!item) return;
      if (quantity <= 0) {
        await removeItem(productId, variantId);
        return;
      }
      item.quantity = quantity;
      item.subtotal = item.unit_price * quantity;
      await syncToSupabase();
    }

    // 清空购物车
    async function clearCart() {
      items.value = [];
      await syncToSupabase();
    }

    // 切换选中状态
    function toggleSelect(productId: number, variantId: number | null) {
      const item = items.value.find(
        (i) => i.product_id === productId && i.variant_id === variantId,
      );
      if (item) item.selected = !item.selected;
    }

    function toggleSelectAll(selected: boolean) {
      items.value.forEach((i) => (i.selected = selected));
    }

    // 登录后合并本地与云端购物车
    async function mergeOnLogin() {
      const localItems = [...items.value];
      await loadFromSupabase();

      // 把本地有但云端没有的条目合并进来
      for (const local of localItems) {
        const exists = items.value.find(
          (i) =>
            i.product_id === local.product_id &&
            i.variant_id === local.variant_id,
        );
        if (!exists) {
          items.value.push(local);
        }
      }

      await syncToSupabase();
    }

    return {
      items,
      loading,
      syncing,
      totalItems,
      totalAmount,
      isEmpty,
      loadFromSupabase,
      syncToSupabase,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      toggleSelect,
      toggleSelectAll,
      mergeOnLogin,
    };
  },
  {
    // pinia-plugin-persistedstate：仅持久化 items 的精简版本
    persist: {
      key: "cart",
      pick: ["items"],
    },
  },
);

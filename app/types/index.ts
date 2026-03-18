// ============================================================
// app/types/index.ts
// 业务实体类型定义
// 基于 `bunx supabase gen types typescript --linked` 生成的
// database.types.ts 进行二次封装，供业务代码使用
// ============================================================

import type { Database } from "./database.types";
import type { Json } from "./database.types";

// ────────────────────────────────────────────────────────────
// Supabase 原始 Row 类型别名（直接映射数据库表结构）
// ────────────────────────────────────────────────────────────

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariantRow =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

// Insert / Update 类型（Supabase 自动推导，含可选字段）
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
export type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type OrderItemInsert =
  Database["public"]["Tables"]["order_items"]["Insert"];
export type CartItemInsert =
  Database["public"]["Tables"]["cart_items"]["Insert"];
export type CartItemUpdate =
  Database["public"]["Tables"]["cart_items"]["Update"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];

// 枚举类型
export type OrderStatus = Database["public"]["Enums"]["order_status"];

// ────────────────────────────────────────────────────────────
// 通用工具类型
// ────────────────────────────────────────────────────────────

export type Nullable<T> = T | null;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ────────────────────────────────────────────────────────────
// 商品图片（对应 products.images JSONB 结构）
// ────────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  alt?: string;
}

// ────────────────────────────────────────────────────────────
// 业务层扩展类型（在 Row 基础上附加关联数据）
// ────────────────────────────────────────────────────────────

// 用户（auth 信息 + profile 合并）
export interface AppUser {
  id: string;
  email: string;
  profile: ProfileRow;
  isAdmin: boolean;
}

// 分类（含嵌套子分类，用于树形展示）
export interface CategoryTree extends CategoryRow {
  children: CategoryTree[];
}

// 商品详情（含分类 + 规格）
export interface Product extends Omit<ProductRow, "images"> {
  images: ProductImage[];
  category?: Nullable<CategoryRow>;
  variants?: ProductVariantRow[];
}

// 商品列表查询参数
export interface ProductQueryParams {
  categorySlug?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

// 地址快照（存入订单，防止地址修改影响历史记录）
export interface AddressSnapshot {
  label: string;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  full_address: string; // 拼接展示用：省+市+区+详细地址
}

// 购物车条目（含关联商品和规格，以及前端计算字段）
export interface CartItemView extends CartItemRow {
  product: Product;
  variant: Nullable<ProductVariantRow>;
  unit_price: number; // price + variant.price_modifier
  subtotal: number; // unit_price × quantity
  selected: boolean; // 前端勾选状态（不持久化）
}

// 购物车 Store 状态
export interface CartState {
  items: CartItemView[];
  loading: boolean;
}

// 加入购物车参数
export interface CartItemAdd {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

// 商品快照（存入订单条目，记录下单时的商品信息）
export interface ProductSnapshot {
  product_id: number;
  name: string;
  image: string;
  variant_name?: string; // 如"颜色：红色 / 尺码：XL"
  [key: string]: Json | undefined; // 兼容 Supabase Json 类型
}

// 订单条目（含商品快照）
export interface OrderItem extends Omit<OrderItemRow, "product_snapshot"> {
  product_snapshot: ProductSnapshot;
  product?: Nullable<Product>;
  variant?: Nullable<ProductVariantRow>;
}

// 订单详情（含条目列表 + 地址快照）
export interface Order extends Omit<OrderRow, "address_snapshot"> {
  address_snapshot: AddressSnapshot;
  items?: OrderItem[];
}

// 创建订单参数
export interface OrderCreateParams {
  address_id: number;
  payment_method: "wechat" | "alipay";
  items: Array<{
    product_id: number;
    variant_id?: number;
    quantity: number;
  }>;
}

// 评价（含用户信息）
export interface Review extends ReviewRow {
  profile?: Nullable<Pick<ProfileRow, "id" | "full_name" | "avatar_url">>;
}

// 表单类型（前端表单提交用，与 Insert 区分）
export interface AddressForm {
  label: string;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

export interface ReviewForm {
  product_id: number;
  order_id?: number;
  rating: number;
  content?: string;
  images?: string[];
}

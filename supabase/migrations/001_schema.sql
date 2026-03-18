-- ============================================================
-- 电商网站 Supabase 数据库 Schema
-- 适用技术栈：Nuxt 4 + Supabase + Pinia + Tailwind CSS
-- ============================================================

-- ============================================================
-- 0. 扩展 & 枚举类型
-- ============================================================

-- 订单状态枚举
CREATE TYPE order_status AS ENUM (
  'pending',    -- 待付款
  'paid',       -- 已付款
  'shipped',    -- 已发货
  'delivered',  -- 已完成
  'cancelled',  -- 已取消
  'refunded'    -- 已退款
);

-- ============================================================
-- 1. 用户扩展信息表 profiles
--    关联 auth.users，由触发器自动创建
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_profiles_id ON public.profiles(id);

-- ============================================================
-- 2. 商品分类表 categories
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  parent_id   BIGINT      REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_categories_slug      ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- ============================================================
-- 3. 商品表 products
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           TEXT           NOT NULL,
  slug           TEXT           NOT NULL UNIQUE,
  description    TEXT,
  price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_price  NUMERIC(10, 2)          CHECK (compare_price >= 0),  -- 原价（划线价）
  stock          INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id    BIGINT         REFERENCES public.categories(id) ON DELETE SET NULL,
  images         JSONB          NOT NULL DEFAULT '[]'::JSONB,           -- [{ url, alt }]
  is_active      BOOLEAN        NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_products_slug        ON public.products(slug);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active   ON public.products(is_active);
CREATE INDEX idx_products_created_at  ON public.products(created_at DESC);

-- 全文搜索索引（simple 配置支持中文 ilike 降级）
CREATE INDEX idx_products_fts ON public.products
  USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- ============================================================
-- 4. 商品规格表 product_variants
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id     BIGINT         NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name           TEXT           NOT NULL,   -- 规格名，如"颜色"
  value          TEXT           NOT NULL,   -- 规格值，如"红色"
  price_modifier NUMERIC(10, 2) NOT NULL DEFAULT 0,  -- 在商品价格基础上的加减价
  stock          INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_variants_product_id ON public.product_variants(product_id);

-- ============================================================
-- 5. 收货地址表 addresses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL DEFAULT '家',  -- 地址标签：家/公司/学校
  receiver    TEXT        NOT NULL,               -- 收件人姓名
  phone       TEXT        NOT NULL,
  province    TEXT        NOT NULL,
  city        TEXT        NOT NULL,
  district    TEXT        NOT NULL,
  detail      TEXT        NOT NULL,               -- 详细地址
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- 确保每个用户只有一个默认地址（部分索引）
CREATE UNIQUE INDEX idx_addresses_user_default
  ON public.addresses(user_id)
  WHERE is_default = true;

-- ============================================================
-- 6. 订单表 orders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          UUID           NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status           order_status   NOT NULL DEFAULT 'pending',
  total_amount     NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_fee     NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  address_snapshot JSONB          NOT NULL,  -- 下单时的地址快照，防止地址修改影响历史订单
  payment_method   TEXT,                     -- wechat / alipay
  paid_at          TIMESTAMPTZ,
  shipped_at       TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  remark           TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_orders_user_id    ON public.orders(user_id);
CREATE INDEX idx_orders_status     ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================================
-- 7. 订单详情表 order_items
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id         BIGINT         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id       BIGINT         REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id       BIGINT         REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity         INT            NOT NULL CHECK (quantity > 0),
  unit_price       NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  product_snapshot JSONB          NOT NULL  -- 下单时的商品快照（名称、图片、规格等）
);

-- 索引
CREATE INDEX idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================
-- 8. 购物车表 cart_items
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  BIGINT  NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id  BIGINT  REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity    INT     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 同一用户、同一商品+规格组合唯一
  UNIQUE (user_id, product_id, variant_id)
);

-- 索引
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);

-- ============================================================
-- 9. 商品评价表 reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  BIGINT  NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id    BIGINT  REFERENCES public.orders(id) ON DELETE SET NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT,
  images      TEXT[]  NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 每笔订单每个商品只能评价一次
  UNIQUE (user_id, product_id, order_id)
);

-- 索引
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_user_id    ON public.reviews(user_id);

-- ============================================================
-- 10. 触发器：新用户注册时自动创建 profiles 记录
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- 绑定触发器到 auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 11. 触发器：自动更新 updated_at 字段
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 12. Row Level Security（RLS）策略
-- ============================================================

-- 开启 RLS
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────
-- 用户只能读写自己的 profile
CREATE POLICY "profiles: 用户可读自己的资料"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: 用户可更新自己的资料"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── categories（公开只读） ───────────────────────────────
CREATE POLICY "categories: 所有人可读"
  ON public.categories FOR SELECT
  USING (true);

-- ── products（公开只读 is_active 商品） ─────────────────
CREATE POLICY "products: 所有人可读上架商品"
  ON public.products FOR SELECT
  USING (is_active = true);

-- ── product_variants（公开只读） ────────────────────────
CREATE POLICY "product_variants: 所有人可读"
  ON public.product_variants FOR SELECT
  USING (true);

-- ── addresses ────────────────────────────────────────────
CREATE POLICY "addresses: 用户只能读自己的地址"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses: 用户只能新增自己的地址"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: 用户只能更新自己的地址"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: 用户只能删除自己的地址"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ── orders ───────────────────────────────────────────────
CREATE POLICY "orders: 用户只能读自己的订单"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders: 用户只能创建自己的订单"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders: 用户只能更新自己的订单（如取消）"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── order_items ──────────────────────────────────────────
CREATE POLICY "order_items: 用户只能读自己订单的条目"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items: 用户只能在自己的订单下新增条目"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── cart_items ───────────────────────────────────────────
CREATE POLICY "cart_items: 用户只能读自己的购物车"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cart_items: 用户只能新增到自己的购物车"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items: 用户只能更新自己购物车的数量"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items: 用户只能删除自己的购物车条目"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- ── reviews（公开可读，登录可写） ────────────────────────
CREATE POLICY "reviews: 所有人可读评价"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews: 登录用户可发表评价"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: 用户只能更新自己的评价"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: 用户只能删除自己的评价"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

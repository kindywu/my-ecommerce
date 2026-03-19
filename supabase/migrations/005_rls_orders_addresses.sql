-- supabase/migrations/005_rls_orders_addresses.sql

-- ── addresses ─────────────────────────────────────────────
alter table public.addresses enable row level security;

create policy "用户可以查看自己的地址"
  on public.addresses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可以新增地址"
  on public.addresses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "用户可以修改自己的地址"
  on public.addresses for update
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可以删除自己的地址"
  on public.addresses for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── orders ────────────────────────────────────────────────
alter table public.orders enable row level security;

create policy "用户可以查看自己的订单"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可以更新自己的待付款订单"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id and status in ('pending'));

-- ── order_items ───────────────────────────────────────────
alter table public.order_items enable row level security;

create policy "用户可以查看自己订单的条目"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ── cart_items ────────────────────────────────────────────
alter table public.cart_items enable row level security;

create policy "用户可以查看自己的购物车"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可以操作自己的购物车"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "用户可以更新自己的购物车"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可以删除自己的购物车"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);
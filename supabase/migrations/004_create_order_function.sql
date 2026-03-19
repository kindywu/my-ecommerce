-- supabase/migrations/004_create_order_function.sql
-- 原子性创建订单：校验库存 → 创建订单 → 写入条目 → 扣减库存 → 清空购物车

create or replace function public.create_order(
  p_address_id   int,
  p_payment_method text,
  p_items jsonb   -- [{ product_id, variant_id, quantity }]
)
returns int        -- 返回新订单 id
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_order_id     int;
  v_total        numeric := 0;
  v_item         jsonb;
  v_product      products%rowtype;
  v_variant      product_variants%rowtype;
  v_unit_price   numeric;
  v_qty          int;
  v_addr         addresses%rowtype;
  v_addr_snapshot jsonb;
begin
  -- ── 校验地址属于当前用户 ───────────────────────────────
  select * into v_addr
  from addresses
  where id = p_address_id and user_id = v_user_id;

  if not found then
    raise exception '地址不存在或无权使用';
  end if;

  -- ── 构建地址快照 ───────────────────────────────────────
  v_addr_snapshot := jsonb_build_object(
    'label',        v_addr.label,
    'receiver',     v_addr.receiver,
    'phone',        v_addr.phone,
    'province',     v_addr.province,
    'city',         v_addr.city,
    'district',     v_addr.district,
    'detail',       v_addr.detail,
    'full_address', v_addr.province || v_addr.city || v_addr.district || v_addr.detail
  );

  -- ── 校验库存并计算总价 ─────────────────────────────────
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_product
    from products
    where id = (v_item->>'product_id')::int and is_active = true;

    if not found then
      raise exception '商品 % 不存在或已下架', v_item->>'product_id';
    end if;

    if v_item->>'variant_id' is not null then
      select * into v_variant
      from product_variants
      where id = (v_item->>'variant_id')::int and product_id = v_product.id;

      if not found then
        raise exception '规格不存在';
      end if;

      if v_variant.stock < v_qty then
        raise exception '商品「%」库存不足', v_product.name;
      end if;

      v_unit_price := v_product.price + v_variant.price_modifier;
    else
      if v_product.stock < v_qty then
        raise exception '商品「%」库存不足', v_product.name;
      end if;
      v_unit_price := v_product.price;
    end if;

    v_total := v_total + v_unit_price * v_qty;
  end loop;

  -- ── 创建订单主记录 ─────────────────────────────────────
  insert into orders (
    user_id, status, total_amount, shipping_fee,
    payment_method, address_snapshot
  )
  values (
    v_user_id, 'pending', v_total,
    case when v_total >= 99 then 0 else 10 end,
    p_payment_method, v_addr_snapshot
  )
  returning id into v_order_id;

  -- ── 写入订单条目 + 扣减库存 ───────────────────────────
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_product
    from products where id = (v_item->>'product_id')::int;

    if v_item->>'variant_id' is not null then
      select * into v_variant
      from product_variants where id = (v_item->>'variant_id')::int;

      v_unit_price := v_product.price + v_variant.price_modifier;

      -- 扣减规格库存
      update product_variants
      set stock = stock - v_qty
      where id = v_variant.id;

      insert into order_items (
        order_id, product_id, variant_id, quantity, unit_price, product_snapshot
      )
      values (
        v_order_id, v_product.id, v_variant.id, v_qty, v_unit_price,
        jsonb_build_object(
          'product_id',   v_product.id,
          'name',         v_product.name,
          'image',        (v_product.images->0->>'url'),
          'variant_name', v_variant.name || '：' || v_variant.value
        )
      );
    else
      v_unit_price := v_product.price;

      -- 扣减主商品库存
      update products
      set stock = stock - v_qty
      where id = v_product.id;

      insert into order_items (
        order_id, product_id, variant_id, quantity, unit_price, product_snapshot
      )
      values (
        v_order_id, v_product.id, null, v_qty, v_unit_price,
        jsonb_build_object(
          'product_id', v_product.id,
          'name',       v_product.name,
          'image',      (v_product.images->0->>'url')
        )
      );
    end if;
  end loop;

  -- ── 清空购物车 ─────────────────────────────────────────
  delete from cart_items where user_id = v_user_id;

  return v_order_id;
end;
$$;

-- RLS：只有登录用户可以调用（通过 security definer 保证内部权限）
revoke all on function public.create_order from anon;
grant execute on function public.create_order to authenticated;
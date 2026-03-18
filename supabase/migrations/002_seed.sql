-- ============================================================
-- 种子数据 seed.sql
-- 执行前提：已运行 schema.sql
-- 执行顺序：在 Supabase SQL Editor 中整体粘贴执行
-- ============================================================

-- 启用 pgcrypto 扩展（crypt/gen_salt 依赖）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- STEP 1：创建管理员账号
--
-- 直接 INSERT 到 auth.users，使用预生成的 bcrypt 哈希（cost=10）。
-- admin@shop.com  密码：Admin@123456
-- test@shop.com   密码：User@123456
-- ============================================================

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@shop.com',
  '$2b$10$dvV69zDCWUX9vJAC3oZLye90HISI7na.9VmcSu28MWQjDi.eLlj3m',
  now(),
  'authenticated',
  'authenticated',
  '{"full_name":"超级管理员","role":"admin"}'::JSONB,
  now(),
  now(),
  '', '', '', ''
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@shop.com',
  '$2b$10$ooY/BafaJIUsMDDxaOUMxO/muRBVC5qmQdszfP4h2N8n33SskPhcu',
  now(),
  'authenticated',
  'authenticated',
  '{"full_name":"测试用户"}'::JSONB,
  now(),
  now(),
  '', '', '', ''
);

-- ── 在 profiles 里补充管理员信息 ─────────────────────────
-- （触发器会自动创建记录，这里只做更新以补全字段）
UPDATE public.profiles
SET
  full_name  = '超级管理员',
  phone      = '13800000001',
  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@shop.com'
);

UPDATE public.profiles
SET
  full_name  = '测试用户',
  phone      = '13800000002',
  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=test'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'test@shop.com'
);

-- ============================================================
-- STEP 2：补充更多分类（如 schema.sql 的分类已插入可跳过）
-- ============================================================

-- 顶级分类（幂等写法：冲突时跳过）
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('服装',   'clothing',     1),
  ('电子产品','electronics',  2),
  ('家居',   'home',         3),
  ('运动',   'sports',       4),
  ('美妆',   'beauty',       5),
  ('食品',   'food',         6)
ON CONFLICT (slug) DO NOTHING;

-- 子分类
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('男装',   'mens-clothing',    (SELECT id FROM public.categories WHERE slug='clothing'),    1),
  ('女装',   'womens-clothing',  (SELECT id FROM public.categories WHERE slug='clothing'),    2),
  ('手机',   'phones',           (SELECT id FROM public.categories WHERE slug='electronics'), 1),
  ('电脑',   'computers',        (SELECT id FROM public.categories WHERE slug='electronics'), 2),
  ('耳机',   'headphones',       (SELECT id FROM public.categories WHERE slug='electronics'), 3),
  ('床上用品','bedding',         (SELECT id FROM public.categories WHERE slug='home'),        1),
  ('厨具',   'kitchen',          (SELECT id FROM public.categories WHERE slug='home'),        2),
  ('跑步',   'running',          (SELECT id FROM public.categories WHERE slug='sports'),      1),
  ('健身',   'fitness',          (SELECT id FROM public.categories WHERE slug='sports'),      2),
  ('护肤',   'skincare',         (SELECT id FROM public.categories WHERE slug='beauty'),      1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STEP 3：插入商品（30 款，覆盖各分类）
-- ============================================================

INSERT INTO public.products
  (name, slug, description, price, compare_price, stock, category_id, images, is_active)
VALUES

-- ── 男装 ────────────────────────────────────────────────
(
  '经典白色纯棉T恤',
  'classic-white-tshirt',
  '100% 有机棉面料，透气舒适，简约圆领设计，日常穿搭必备单品。',
  89.00, 129.00, 500,
  (SELECT id FROM public.categories WHERE slug='mens-clothing'),
  '[{"url":"https://picsum.photos/seed/tshirt1/600/600","alt":"白色T恤正面"},{"url":"https://picsum.photos/seed/tshirt2/600/600","alt":"白色T恤背面"}]'::JSONB,
  true
),
(
  '修身商务西裤',
  'slim-business-trousers',
  '羊毛混纺面料，修身版型，适合商务会议及日常通勤穿着。',
  259.00, 359.00, 200,
  (SELECT id FROM public.categories WHERE slug='mens-clothing'),
  '[{"url":"https://picsum.photos/seed/trousers1/600/600","alt":"西裤正面"},{"url":"https://picsum.photos/seed/trousers2/600/600","alt":"西裤侧面"}]'::JSONB,
  true
),
(
  '休闲连帽卫衣',
  'casual-hoodie',
  '300g重磅棉，保暖舒适，前置大口袋，秋冬出行首选。',
  199.00, 279.00, 350,
  (SELECT id FROM public.categories WHERE slug='mens-clothing'),
  '[{"url":"https://picsum.photos/seed/hoodie1/600/600","alt":"卫衣正面"},{"url":"https://picsum.photos/seed/hoodie2/600/600","alt":"卫衣背面"}]'::JSONB,
  true
),

-- ── 女装 ────────────────────────────────────────────────
(
  '碎花雪纺连衣裙',
  'floral-chiffon-dress',
  '轻薄雪纺面料，碎花印花，V领设计，腰部系带显瘦，适合春夏季节。',
  189.00, 260.00, 300,
  (SELECT id FROM public.categories WHERE slug='womens-clothing'),
  '[{"url":"https://picsum.photos/seed/dress1/600/600","alt":"连衣裙正面"},{"url":"https://picsum.photos/seed/dress2/600/600","alt":"连衣裙侧面"}]'::JSONB,
  true
),
(
  '高腰阔腿牛仔裤',
  'high-waist-wide-jeans',
  '弹力牛仔布，高腰设计拉长腿型，阔腿剪裁宽松舒适。',
  229.00, 299.00, 250,
  (SELECT id FROM public.categories WHERE slug='womens-clothing'),
  '[{"url":"https://picsum.photos/seed/jeans1/600/600","alt":"牛仔裤正面"},{"url":"https://picsum.photos/seed/jeans2/600/600","alt":"牛仔裤背面"}]'::JSONB,
  true
),
(
  '羊绒混纺毛衣',
  'cashmere-blend-sweater',
  '30% 羊绒 + 70% 羊毛，柔软亲肤，套头圆领，多色可选。',
  399.00, 580.00, 150,
  (SELECT id FROM public.categories WHERE slug='womens-clothing'),
  '[{"url":"https://picsum.photos/seed/sweater1/600/600","alt":"毛衣正面"},{"url":"https://picsum.photos/seed/sweater2/600/600","alt":"毛衣细节"}]'::JSONB,
  true
),

-- ── 手机 ────────────────────────────────────────────────
(
  'ProMax X 旗舰手机 256GB',
  'promax-x-256gb',
  '6.7英寸 OLED 屏幕，5000mAh 超大电池，1亿像素主摄，支持 5G 网络。',
  4999.00, 5499.00, 80,
  (SELECT id FROM public.categories WHERE slug='phones'),
  '[{"url":"https://picsum.photos/seed/phone1/600/600","alt":"手机正面"},{"url":"https://picsum.photos/seed/phone2/600/600","alt":"手机背面"},{"url":"https://picsum.photos/seed/phone3/600/600","alt":"手机侧面"}]'::JSONB,
  true
),
(
  'AirSlim 轻薄手机 128GB',
  'airslim-128gb',
  '6.1英寸 AMOLED，厚度仅 6.5mm，轻至 168g，双摄系统，一整天续航。',
  2899.00, 3299.00, 120,
  (SELECT id FROM public.categories WHERE slug='phones'),
  '[{"url":"https://picsum.photos/seed/phone4/600/600","alt":"轻薄手机正面"},{"url":"https://picsum.photos/seed/phone5/600/600","alt":"轻薄手机背面"}]'::JSONB,
  true
),
(
  '经济实惠入门手机 64GB',
  'budget-phone-64gb',
  '5.5英寸 LCD，4000mAh，支持快充，适合老人和学生使用。',
  799.00, 999.00, 300,
  (SELECT id FROM public.categories WHERE slug='phones'),
  '[{"url":"https://picsum.photos/seed/phone6/600/600","alt":"入门手机"},{"url":"https://picsum.photos/seed/phone7/600/600","alt":"入门手机背面"}]'::JSONB,
  true
),

-- ── 电脑 ────────────────────────────────────────────────
(
  'UltraBook Pro 14寸笔记本',
  'ultrabook-pro-14',
  'Intel Core i7，16GB DDR5 内存，512GB NVMe SSD，2K IPS 屏幕，全天候续航。',
  7999.00, 9299.00, 50,
  (SELECT id FROM public.categories WHERE slug='computers'),
  '[{"url":"https://picsum.photos/seed/laptop1/600/600","alt":"笔记本正面"},{"url":"https://picsum.photos/seed/laptop2/600/600","alt":"笔记本键盘"}]'::JSONB,
  true
),
(
  '游戏本 RTX 4070 16寸',
  'gaming-laptop-rtx4070',
  'AMD Ryzen 9，RTX 4070 独显，32GB 内存，2TB SSD，165Hz 高刷屏，电竞首选。',
  12999.00, 14999.00, 30,
  (SELECT id FROM public.categories WHERE slug='computers'),
  '[{"url":"https://picsum.photos/seed/gaming1/600/600","alt":"游戏本正面"},{"url":"https://picsum.photos/seed/gaming2/600/600","alt":"游戏本侧面"}]'::JSONB,
  true
),

-- ── 耳机 ────────────────────────────────────────────────
(
  'ANC Pro 主动降噪耳机',
  'anc-pro-headphones',
  '40dB 主动降噪，30小时续航，蓝牙 5.3，可折叠设计，配备携行包。',
  899.00, 1299.00, 200,
  (SELECT id FROM public.categories WHERE slug='headphones'),
  '[{"url":"https://picsum.photos/seed/headphone1/600/600","alt":"耳机正面"},{"url":"https://picsum.photos/seed/headphone2/600/600","alt":"耳机折叠状态"}]'::JSONB,
  true
),
(
  'BudsPro 真无线降噪耳塞',
  'budspro-tws',
  '圈铁双驱，主动降噪，IPX5防水，单次续航8小时，充电盒可额外充3次。',
  499.00, 699.00, 400,
  (SELECT id FROM public.categories WHERE slug='headphones'),
  '[{"url":"https://picsum.photos/seed/buds1/600/600","alt":"耳塞本体"},{"url":"https://picsum.photos/seed/buds2/600/600","alt":"耳塞充电盒"}]'::JSONB,
  true
),

-- ── 床上用品 ────────────────────────────────────────────
(
  '60支长绒棉四件套 1.8m',
  'cotton-bedding-4pcs-180',
  '60支长绒棉，触感细腻柔软，透气吸湿，适合全年使用，多色可选。',
  359.00, 499.00, 180,
  (SELECT id FROM public.categories WHERE slug='bedding'),
  '[{"url":"https://picsum.photos/seed/bedding1/600/600","alt":"四件套整体"},{"url":"https://picsum.photos/seed/bedding2/600/600","alt":"被套细节"}]'::JSONB,
  true
),
(
  '鹅绒冬被 2kg',
  'goose-down-quilt-2kg',
  '90% 白鹅绒填充，轻盈保暖，防钻绒面料，适合冬季使用，建议干洗。',
  799.00, 1099.00, 100,
  (SELECT id FROM public.categories WHERE slug='bedding'),
  '[{"url":"https://picsum.photos/seed/quilt1/600/600","alt":"鹅绒被正面"},{"url":"https://picsum.photos/seed/quilt2/600/600","alt":"被子细节"}]'::JSONB,
  true
),

-- ── 厨具 ────────────────────────────────────────────────
(
  '铸铁珐琅锅 24cm',
  'cast-iron-enamel-pot-24',
  '荷兰珐琅铸铁锅，均匀导热，可用于煮汤、炖肉、烤面包，适配所有炉灶含电磁炉。',
  459.00, 620.00, 90,
  (SELECT id FROM public.categories WHERE slug='kitchen'),
  '[{"url":"https://picsum.photos/seed/pot1/600/600","alt":"珐琅锅正面"},{"url":"https://picsum.photos/seed/pot2/600/600","alt":"珐琅锅内部"}]'::JSONB,
  true
),
(
  '不锈钢厨刀三件套',
  'stainless-knife-set-3pcs',
  '德国进口钢材，三层复合锻造，含主厨刀/面包刀/水果刀，附磁吸刀架。',
  299.00, 420.00, 130,
  (SELECT id FROM public.categories WHERE slug='kitchen'),
  '[{"url":"https://picsum.photos/seed/knife1/600/600","alt":"刀具套装"},{"url":"https://picsum.photos/seed/knife2/600/600","alt":"刀架展示"}]'::JSONB,
  true
),

-- ── 跑步 ────────────────────────────────────────────────
(
  '云软跑鞋 男款',
  'cloud-running-shoes-men',
  'CloudFoam 中底缓震，透气网面鞋面，适合公路跑步，支撑性强，减少膝盖冲击。',
  479.00, 629.00, 220,
  (SELECT id FROM public.categories WHERE slug='running'),
  '[{"url":"https://picsum.photos/seed/shoes1/600/600","alt":"跑鞋侧面"},{"url":"https://picsum.photos/seed/shoes2/600/600","alt":"跑鞋鞋底"}]'::JSONB,
  true
),
(
  '压缩跑步紧身裤 男款',
  'compression-running-tights-men',
  '高弹力压缩面料，促进血液循环，减少肌肉疲劳，反光细节保障夜跑安全。',
  189.00, 249.00, 160,
  (SELECT id FROM public.categories WHERE slug='running'),
  '[{"url":"https://picsum.photos/seed/tights1/600/600","alt":"紧身裤正面"},{"url":"https://picsum.photos/seed/tights2/600/600","alt":"紧身裤背面"}]'::JSONB,
  true
),

-- ── 健身 ────────────────────────────────────────────────
(
  '可调节哑铃 2-24kg',
  'adjustable-dumbbell-2-24kg',
  '快速旋钮调节重量，2kg 起步到 24kg，节省空间，适合家庭健身房。',
  1299.00, 1699.00, 60,
  (SELECT id FROM public.categories WHERE slug='fitness'),
  '[{"url":"https://picsum.photos/seed/dumbbell1/600/600","alt":"哑铃全貌"},{"url":"https://picsum.photos/seed/dumbbell2/600/600","alt":"调节旋钮"}]'::JSONB,
  true
),
(
  'TPE 专业瑜伽垫 6mm',
  'tpe-yoga-mat-6mm',
  'TPE 环保材料，双面防滑，6mm 厚度缓冲关节，自带背包带，尺寸 183×61cm。',
  129.00, 179.00, 500,
  (SELECT id FROM public.categories WHERE slug='fitness'),
  '[{"url":"https://picsum.photos/seed/yoga1/600/600","alt":"瑜伽垫展开"},{"url":"https://picsum.photos/seed/yoga2/600/600","alt":"瑜伽垫细节"}]'::JSONB,
  true
),
(
  '弹力带阻力带套装 5条装',
  'resistance-bands-5pcs',
  '5种不同阻力等级，乳胶材质，可用于热身、康复训练、力量训练，含收纳袋。',
  69.00, 99.00, 800,
  (SELECT id FROM public.categories WHERE slug='fitness'),
  '[{"url":"https://picsum.photos/seed/bands1/600/600","alt":"弹力带套装"},{"url":"https://picsum.photos/seed/bands2/600/600","alt":"弹力带使用"}]'::JSONB,
  true
),

-- ── 护肤 ────────────────────────────────────────────────
(
  '玻尿酸补水精华 30ml',
  'hyaluronic-acid-serum-30ml',
  '三重分子量玻尿酸，深层补水锁水，质地清爽不黏腻，适合所有肤质。',
  159.00, 220.00, 600,
  (SELECT id FROM public.categories WHERE slug='skincare'),
  '[{"url":"https://picsum.photos/seed/serum1/600/600","alt":"精华正面"},{"url":"https://picsum.photos/seed/serum2/600/600","alt":"精华质地"}]'::JSONB,
  true
),
(
  'SPF50+ 轻薄防晒霜 50ml',
  'sunscreen-spf50-50ml',
  'PA++++，物理+化学双重防护，无白浮，适合油皮混皮，可作为妆前底乳。',
  99.00, 139.00, 700,
  (SELECT id FROM public.categories WHERE slug='skincare'),
  '[{"url":"https://picsum.photos/seed/sunscreen1/600/600","alt":"防晒霜正面"},{"url":"https://picsum.photos/seed/sunscreen2/600/600","alt":"防晒霜质地"}]'::JSONB,
  true
),
(
  '氨基酸洁面慕斯 150ml',
  'amino-acid-cleanser-150ml',
  '氨基酸表活，温和不刺激，充分起泡清洁毛孔，洗后不紧绷，干皮油皮均适用。',
  79.00, 109.00, 900,
  (SELECT id FROM public.categories WHERE slug='skincare'),
  '[{"url":"https://picsum.photos/seed/cleanser1/600/600","alt":"洁面慕斯"},{"url":"https://picsum.photos/seed/cleanser2/600/600","alt":"泡沫效果"}]'::JSONB,
  true
),
(
  'A醇抗老面霜 50ml',
  'retinol-anti-aging-cream-50ml',
  '0.1% 纯视黄醇配方，淡化细纹，改善肤色不均，搭配角鲨烷保湿，夜间使用。',
  299.00, 420.00, 200,
  (SELECT id FROM public.categories WHERE slug='skincare'),
  '[{"url":"https://picsum.photos/seed/cream1/600/600","alt":"面霜正面"},{"url":"https://picsum.photos/seed/cream2/600/600","alt":"面霜质地"}]'::JSONB,
  true
);

-- ============================================================
-- STEP 4：插入商品规格 product_variants
-- ============================================================

-- T恤：尺码 + 颜色
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '尺码', 'S',  0, 100 FROM public.products WHERE slug='classic-white-tshirt' UNION ALL
SELECT id, '尺码', 'M',  0, 150 FROM public.products WHERE slug='classic-white-tshirt' UNION ALL
SELECT id, '尺码', 'L',  0, 150 FROM public.products WHERE slug='classic-white-tshirt' UNION ALL
SELECT id, '尺码', 'XL', 0, 100 FROM public.products WHERE slug='classic-white-tshirt';

-- 卫衣：颜色
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '颜色', '黑色', 0,   100 FROM public.products WHERE slug='casual-hoodie' UNION ALL
SELECT id, '颜色', '灰色', 0,   120 FROM public.products WHERE slug='casual-hoodie' UNION ALL
SELECT id, '颜色', '藏青', 0,    80 FROM public.products WHERE slug='casual-hoodie' UNION ALL
SELECT id, '颜色', '卡其', 10,   50 FROM public.products WHERE slug='casual-hoodie';

-- 毛衣：颜色
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '颜色', '驼色', 0,   60 FROM public.products WHERE slug='cashmere-blend-sweater' UNION ALL
SELECT id, '颜色', '黑色', 0,   50 FROM public.products WHERE slug='cashmere-blend-sweater' UNION ALL
SELECT id, '颜色', '米白', 0,   40 FROM public.products WHERE slug='cashmere-blend-sweater';

-- 手机 ProMax X：存储容量
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '存储', '128GB',  -500,  30 FROM public.products WHERE slug='promax-x-256gb' UNION ALL
SELECT id, '存储', '256GB',     0,  30 FROM public.products WHERE slug='promax-x-256gb' UNION ALL
SELECT id, '存储', '512GB',   500,  20 FROM public.products WHERE slug='promax-x-256gb';

-- 手机 ProMax X：颜色
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '颜色', '星空黑',   0,  30 FROM public.products WHERE slug='promax-x-256gb' UNION ALL
SELECT id, '颜色', '冰川白',   0,  30 FROM public.products WHERE slug='promax-x-256gb' UNION ALL
SELECT id, '颜色', '薄雾紫',  50,  20 FROM public.products WHERE slug='promax-x-256gb';

-- 笔记本 UltraBook Pro：内存+存储组合
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '配置', '16GB+512GB',     0,  20 FROM public.products WHERE slug='ultrabook-pro-14' UNION ALL
SELECT id, '配置', '16GB+1TB',    1000,  20 FROM public.products WHERE slug='ultrabook-pro-14' UNION ALL
SELECT id, '配置', '32GB+1TB',    2500,  10 FROM public.products WHERE slug='ultrabook-pro-14';

-- 哑铃
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '规格', '单只',  -650,  30 FROM public.products WHERE slug='adjustable-dumbbell-2-24kg' UNION ALL
SELECT id, '规格', '一对（2只）',  0,  30 FROM public.products WHERE slug='adjustable-dumbbell-2-24kg';

-- 瑜伽垫：颜色
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '颜色', '深蓝',  0,  150 FROM public.products WHERE slug='tpe-yoga-mat-6mm' UNION ALL
SELECT id, '颜色', '粉紫',  0,  150 FROM public.products WHERE slug='tpe-yoga-mat-6mm' UNION ALL
SELECT id, '颜色', '墨绿',  0,  100 FROM public.products WHERE slug='tpe-yoga-mat-6mm' UNION ALL
SELECT id, '颜色', '黑色',  0,  100 FROM public.products WHERE slug='tpe-yoga-mat-6mm';

-- 跑鞋：尺码
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '尺码', '39',  0,  30 FROM public.products WHERE slug='cloud-running-shoes-men' UNION ALL
SELECT id, '尺码', '40',  0,  50 FROM public.products WHERE slug='cloud-running-shoes-men' UNION ALL
SELECT id, '尺码', '41',  0,  60 FROM public.products WHERE slug='cloud-running-shoes-men' UNION ALL
SELECT id, '尺码', '42',  0,  50 FROM public.products WHERE slug='cloud-running-shoes-men' UNION ALL
SELECT id, '尺码', '43',  0,  30 FROM public.products WHERE slug='cloud-running-shoes-men' UNION ALL
SELECT id, '尺码', '44',  0,  20 FROM public.products WHERE slug='cloud-running-shoes-men';

-- 防晒霜：规格
INSERT INTO public.product_variants (product_id, name, value, price_modifier, stock)
SELECT id, '规格', '50ml 单支',    0,  300 FROM public.products WHERE slug='sunscreen-spf50-50ml' UNION ALL
SELECT id, '规格', '50ml 买二送一', 80, 200 FROM public.products WHERE slug='sunscreen-spf50-50ml';

-- ============================================================
-- STEP 5：插入示例评价数据
--
-- 注意：评价需要关联真实的 user_id，
-- 这里用子查询取测试用户 ID
-- ============================================================

INSERT INTO public.reviews (user_id, product_id, order_id, rating, content, images)
VALUES
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  (SELECT id FROM public.products WHERE slug='classic-white-tshirt'),
  NULL,
  5,
  '面料非常舒服，穿上去凉快透气，尺码很准，M码正好合适，已经买了第二件！',
  ARRAY['https://picsum.photos/seed/rv1/400/400']
),
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  (SELECT id FROM public.products WHERE slug='promax-x-256gb'),
  NULL,
  5,
  '拍照效果真的很好，夜景也清晰，续航也比之前用的手机强多了，总体非常满意。',
  ARRAY['https://picsum.photos/seed/rv2/400/400','https://picsum.photos/seed/rv3/400/400']
),
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  (SELECT id FROM public.products WHERE slug='tpe-yoga-mat-6mm'),
  NULL,
  4,
  '垫子厚度够，防滑效果不错，颜色和图片一样好看。就是有点味道，晾了两天就好了。',
  ARRAY[]::TEXT[]
),
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  (SELECT id FROM public.products WHERE slug='hyaluronic-acid-serum-30ml'),
  NULL,
  5,
  '吸收很快，不油腻，上完之后皮肤确实水润很多，已经回购第三瓶了，强烈推荐！',
  ARRAY['https://picsum.photos/seed/rv4/400/400']
),
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  (SELECT id FROM public.products WHERE slug='anc-pro-headphones'),
  NULL,
  4,
  '降噪效果很强，坐地铁开到最高档基本听不到外面的声音，音质也不错，就是稍微有点重。',
  ARRAY[]::TEXT[]
);

-- ============================================================
-- STEP 6：测试用户的收货地址
-- ============================================================

INSERT INTO public.addresses
  (user_id, label, receiver, phone, province, city, district, detail, is_default)
VALUES
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  '家', '张三', '13812345678',
  '广东省', '深圳市', '南山区',
  '科技园南路 88 号创业大厦 1601',
  true
),
(
  (SELECT id FROM auth.users WHERE email='test@shop.com'),
  '公司', '张三', '13812345678',
  '广东省', '深圳市', '福田区',
  '深南大道 6008 号广控大厦 2201',
  false
);

-- ============================================================
-- 完成提示
-- ============================================================
-- 执行完毕后可以用以下 SQL 验证数据：
--
-- SELECT COUNT(*) FROM public.products;           -- 应为 26
-- SELECT COUNT(*) FROM public.product_variants;   -- 应为 ~40
-- SELECT COUNT(*) FROM public.reviews;            -- 应为 5
-- SELECT COUNT(*) FROM public.addresses;          -- 应为 2
-- SELECT email, raw_user_meta_data->>'role'
--   FROM auth.users;                              -- 应显示 admin/test 两个账号
-- ============================================================
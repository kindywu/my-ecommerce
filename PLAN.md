以下是针对 **Bun + Nuxt 4 + Supabase + Pinia + @nuxt/ui** 电商网站的完整开发计划，分为多个阶段，每个阶段都可以直接交给大模型执行。---

下面是每个阶段的完整执行 Prompt，你可以直接复制给大模型执行。

---

## 阶段 1 · 项目初始化与环境配置

```
使用以下技术栈初始化一个电商项目：
- 包管理器：Bun
- 框架：Nuxt 4（nuxt@latest）
- UI 组件库：@nuxt/ui v3（基于 Tailwind v4）
- 状态管理：@pinia/nuxt
- 后端服务：@nuxtjs/supabase
- 类型安全：TypeScript

请完成以下步骤：
1. 用 `bun create nuxt` 创建项目，选择 TypeScript
2. 安装所有依赖：`bun add @nuxt/ui @pinia/nuxt @nuxtjs/supabase`
3. 配置 nuxt.config.ts，注册所有模块
4. 创建 .env 文件模板（SUPABASE_URL、SUPABASE_ANON_KEY）
5. 配置 app.config.ts 设置 @nuxt/ui 主题颜色（primary: emerald）
6. 创建项目目录结构：
   - stores/（Pinia stores）
   - types/（TypeScript 类型）
   - composables/（组合式函数）
   - utils/（工具函数）
7. 在 app.vue 中集成 UApp 组件

输出完整的配置文件内容和目录结构说明。
```

---

## 阶段 2 · Supabase 数据库设计

```
为电商网站设计并创建 Supabase 数据库，包含以下内容：

1. 创建以下数据表的 SQL 迁移文件：
   - profiles（用户档案：id, username, avatar_url, phone, created_at）
   - categories（商品分类：id, name, slug, parent_id, image_url, sort_order）
   - products（商品：id, name, slug, description, price, original_price, stock, category_id, images jsonb, is_active, created_at）
   - cart_items（购物车：id, user_id, product_id, quantity, created_at）
   - addresses（收货地址：id, user_id, name, phone, province, city, district, detail, is_default）
   - orders（订单：id, user_id, address_id, status enum, total_amount, payment_method, paid_at, created_at）
   - order_items（订单明细：id, order_id, product_id, quantity, price, product_snapshot jsonb）

2. 为每张表配置 Row Level Security (RLS) 策略：
   - profiles：用户只能读写自己的档案
   - cart_items：用户只能操作自己的购物车
   - addresses：用户只能操作自己的地址
   - orders/order_items：用户只能查看自己的订单
   - products/categories：所有人可读，仅管理员可写

3. 创建必要的数据库函数：
   - get_cart_total(user_id)：计算购物车总价
   - create_order_from_cart(user_id, address_id)：从购物车创建订单并清空购物车（事务）

4. 创建索引：products(category_id)、orders(user_id, status)、cart_items(user_id)

5. 在 types/database.ts 中用 TypeScript 定义所有表的类型（符合 Supabase 生成格式）

输出完整 SQL 和 TypeScript 类型文件。
```

---

## 阶段 3 · 认证系统

```
基于 @nuxtjs/supabase 实现认证系统：

1. Supabase 控制台配置（重要）：
   - Authentication → Settings → 关闭 "Enable email confirmations"
   - 这样用户注册后直接登录，无需验证邮件

2. 创建认证相关页面（使用 @nuxt/ui 组件）：
   - pages/auth/login.vue（邮箱+密码登录）
   - pages/auth/register.vue（注册，注册成功后自动跳转首页）
     · 注册完成后调用 supabase.auth.signUp()
     · 同时在 profiles 表 insert 一条用户记录
     · 无需邮件确认，注册即登录

3. 创建 stores/auth.ts（Pinia store）：
   - state: user, profile, loading
   - actions: login, register, logout, updateProfile, fetchProfile
   - getters: isLoggedIn, isAdmin

4. 创建路由中间件：
   - middleware/auth.ts（未登录跳转 /auth/login）
   - middleware/guest.ts（已登录跳转首页）
   - middleware/admin.ts（非管理员跳转 403）

5. 创建 composables/useAuth.ts 封装常用认证操作

6. 在 layouts/default.vue 中：
   - 顶部导航显示登录状态
   - 头像下拉菜单（个人中心、我的订单、退出登录）

7. 监听 Supabase Auth 的 onAuthStateChange 事件，保持状态同步

页面只需 login.vue 和 register.vue 两个，使用 @nuxt/ui 的
UForm + UFormField + UInput 组件，添加表单验证（使用 valibot）。
登录/注册失败时在表单顶部显示 UAlert 错误提示。
```

---

## 阶段 4 · 商品模块

```
实现完整的商品展示模块：

1. 创建 composables/useProducts.ts：
   - getProducts({ categoryId, search, page, pageSize, sortBy })
   - getProduct(slug)
   - getCategories()
   - 使用 useAsyncData + Supabase 客户端

2. 创建以下页面：
   - pages/index.vue（首页）：
     · 横幅 Banner（UCarousel）
     · 分类导航横向滚动
     · 推荐商品网格（4列）
   
   - pages/products/index.vue（商品列表）：
     · 左侧分类树形过滤
     · 顶部排序（价格/销量/最新）
     · 价格区间过滤（USlider）
     · 商品卡片网格（响应式：1/2/3/4列）
     · 分页（UPagination）
     · URL 参数同步过滤状态
   
   - pages/products/[slug].vue（商品详情）：
     · 图片轮播（主图+缩略图）
     · 价格、库存状态
     · 数量选择器
     · 加入购物车 / 立即购买
     · 商品描述（富文本）
     · 面包屑导航

3. 创建 components/product/ProductCard.vue（商品卡片组件）
4. 创建 components/product/ProductGrid.vue（响应式网格）
5. 图片使用 Nuxt Image（@nuxt/image）优化

所有数据请求使用 useAsyncData，添加 loading 和 error 状态处理。
```

---

## 阶段 5 · 购物车 & Pinia 状态管理

```
实现购物车功能，使用 Pinia 管理状态：

1. 创建 stores/cart.ts：
   - state: items(CartItem[]), loading, syncing
   - getters: totalItems, totalAmount, isEmpty
   - actions:
     · addItem(productId, quantity)：已存在则增加数量
     · removeItem(productId)
     · updateQuantity(productId, quantity)
     · clearCart()
     · syncToSupabase()：登录用户同步到数据库
     · loadFromSupabase()：登录后从数据库加载
   - 使用 pinia-plugin-persistedstate 本地持久化（localStorage）
   - 监听 auth 状态变化：登录时合并本地与云端购物车

2. 创建 pages/cart.vue（购物车页面）：
   - 商品列表（图片、名称、单价、数量+-、小计）
   - 数量修改实时更新（防抖 500ms 后同步）
   - 删除商品（带确认 UModal）
   - 全选/批量删除
   - 右侧价格汇总卡片（商品总价、运费、实付金额）
   - 结算按钮（未登录则跳转登录）
   - 空购物车状态（UEmptyState）

3. 创建 components/cart/CartDrawer.vue（侧边栏购物车）：
   - 从顶部导航图标触发 UDrawer
   - 显示商品列表 + 总价
   - 快速删除
   - 去结算按钮

4. 购物车图标显示商品数量徽标（UBadge）

安装：`bun add pinia-plugin-persistedstate`，在 nuxt.config.ts 中配置。
```

---

## 阶段 6 · 订单与结账流程

```
实现完整的订单流程：

1. 创建 pages/checkout/index.vue（结账页）：
   分三步（USteps 组件）：
   步骤1 - 确认商品：购物车商品只读列表
   步骤2 - 填写地址：
     · 已有地址列表（URadioGroup 选择）
     · 新增地址表单
   步骤3 - 确认支付：
     · 订单汇总
     · 支付方式选择（模拟：微信/支付宝/货到付款）
     · 提交订单按钮（调用 Supabase 数据库函数 create_order_from_cart）

2. 创建 pages/orders/index.vue（我的订单列表）：
   - 状态标签页筛选（全部/待付款/待发货/已完成/已取消）
   - 订单卡片（订单号、时间、商品缩略图、总价、状态、操作按钮）
   - 无限滚动或分页

3. 创建 pages/orders/[id].vue（订单详情）：
   - 订单进度条（UStepper）
   - 收货地址
   - 商品明细
   - 价格明细
   - 取消订单功能（待付款状态可取消）

4. 创建 stores/order.ts（Pinia store）：
   - createOrder(addressId)
   - fetchOrders(status?)
   - fetchOrder(id)
   - cancelOrder(id)

5. 地址管理页 pages/profile/addresses.vue（增删改查默认地址）

结账成功后跳转 /orders/[id]?success=true，显示成功提示。
```

---

## 阶段 7 · 管理后台

```
实现管理员后台（路径前缀 /admin）：

1. 创建 layouts/admin.vue：
   - 左侧固定导航侧边栏（UNavigationMenu 垂直）
   - 顶部面包屑
   - 仅允许 isAdmin 用户访问（middleware/admin.ts）

2. 创建以下后台页面：

   pages/admin/index.vue（数据看板）：
   - 今日订单数、总销售额、用户数、商品数（UCard 统计）
   - 最近7天销售折线图（用 @nuxt/ui charts 或 Chart.js）
   - 最新订单表格（最近10条）

   pages/admin/products/index.vue（商品管理）：
   - 带搜索、分类过滤的 UTable
   - 上下架切换（UToggle，乐观更新）
   - 批量删除
   - 链接到新增/编辑页

   pages/admin/products/[id].vue（商品编辑）：
   - 完整商品表单（UForm）
   - 多图上传（Supabase Storage，拖拽排序）
   - 富文本描述（使用 @vueup/vue-quill 或 tiptap）
   - 发布/存草稿

   pages/admin/orders/index.vue（订单管理）：
   - 订单列表（带状态筛选、时间范围筛选）
   - 点击查看详情 + 修改订单状态（发货、完成）

3. 在 profiles 表中添加 role 字段（user/admin），RLS 策略更新
4. Supabase Storage bucket：products-images（公开读，登录写）

所有管理操作添加操作确认弹窗和成功/失败 toast 提示（UNotification）。
```

---

## 阶段 8 · UI 完善与响应式

```
完善整体 UI 体验：

1. 主题与全局样式：
   - app.config.ts 配置完整的 @nuxt/ui 主题（colors, fonts, radius）
   - 实现暗色模式切换（useColorMode，保存到 localStorage）
   - 顶部导航添加暗色模式切换按钮（USun/UMoon 图标）

2. 全局布局优化：
   - layouts/default.vue：
     · PC 端顶部导航（logo、分类菜单、搜索框、购物车、用户头像）
     · 移动端汉堡菜单（UDrawer 侧边栏导航）
     · 底部 Footer（链接、版权信息）
   - 搜索框：实时搜索联想（useDebounce + Supabase ILIKE 查询）

3. 加载与空状态处理：
   - 每个数据请求添加骨架屏（USkeleton）
   - 空状态使用 UEmptyState 组件
   - 错误边界处理（error.vue）
   - 全局 loading 进度条（nuxt 内置 loadingIndicator）

4. 响应式断点（@nuxt/ui / Tailwind）：
   - 商品网格：sm:2列 md:3列 lg:4列
   - 购物车：移动端竖向排列
   - 结账步骤：移动端垂直

5. 表单体验优化：
   - 所有表单添加实时校验反馈
   - 提交按钮 loading 状态
   - 操作成功/失败全局 Toast 通知

6. 性能优化：
   - 图片懒加载（@nuxt/image lazy 属性）
   - 路由切换 loading 状态

输出修改后的关键组件文件。
```

---

## 阶段 9 · 性能优化与部署

```
完成最终优化和部署配置：

1. SEO 优化：
   - nuxt.config.ts 配置全局 SEO meta
   - 每个页面使用 useSeoMeta() 设置动态 title/description
   - 商品详情页添加 JSON-LD 结构化数据（Product schema）
   - 生成 sitemap（使用 @nuxtjs/sitemap）

2. 渲染策略：
   - 首页、商品列表：ISR（增量静态再生，routeRules）
   - 商品详情：SSR + 缓存头
   - 购物车、订单、个人中心：CSR（client only）
   
   nuxt.config.ts 中配置 routeRules：
   '/'        → { isr: 3600 }
   '/products/**' → { isr: 1800 }
   '/cart'    → { ssr: false }
   '/orders/**' → { ssr: false }

3. 性能：
   - 启用 Nuxt 图片优化（@nuxt/image + Cloudflare Images 或 Vercel）
   - 关键 CSS 内联
   - 第三方脚本延迟加载

4. 环境变量配置：
   - .env.production（Supabase 生产环境密钥）
   - 运行时配置（runtimeConfig）区分公开/私密变量

5. 部署到 Vercel：
   - 创建 vercel.json 配置
   - 设置环境变量
   - 连接 GitHub 仓库自动 CI/CD
   - 配置自定义域名

6. 部署后检查清单：
   - Supabase RLS 策略全部启用
   - Storage bucket 权限正确
   - 生产环境 CORS 配置
   - Edge Function 超时配置

输出 vercel.json、nuxt.config.ts 最终版本和部署步骤文档。
```

---

**Bun + Nuxt 4 + Supabase + Pinia + Tailwind CSS** 

---

# 电商网站开发实施计划

## 阶段一：项目初始化与基础配置

---

### Step 1 — 项目脚手架初始化

**发给大模型的 Prompt：**

> 使用 Bun 初始化一个 Nuxt 4（nuxt v4.x）项目，要求：
> 1. 使用 `bunx nuxi@latest init` 创建项目，包管理器选 Bun
> 2. 安装依赖：`@nuxtjs/supabase`、`@pinia/nuxt`、`@nuxtjs/tailwindcss`、`pinia`
> 3. 输出完整的 `nuxt.config.ts`，启用以上三个模块
> 4. 输出 `tailwind.config.ts`，content 路径覆盖 Nuxt 4 的 `app/` 目录结构
> 5. 输出 `.env.example`，包含 `SUPABASE_URL` 和 `SUPABASE_KEY`
> 6. 所有命令使用 `bun` 而非 `npm`/`yarn`

---

### Step 2 — Supabase 数据库 Schema 设计

**发给大模型的 Prompt：**

> 为一个电商网站设计 Supabase（PostgreSQL）数据库 Schema，包含以下表并输出完整 SQL：
>
> - `profiles`：用户扩展信息（关联 auth.users，字段：id, full_name, avatar_url, phone, created_at）
> - `categories`：商品分类（id, name, slug, parent_id, image_url, sort_order）
> - `products`：商品（id, name, slug, description, price, compare_price, stock, category_id, images jsonb[], is_active, created_at）
> - `product_variants`：商品规格（id, product_id, name, value, price_modifier, stock）
> - `addresses`：收货地址（id, user_id, label, receiver, phone, province, city, district, detail, is_default）
> - `orders`：订单（id, user_id, status enum, total_amount, shipping_fee, address snapshot jsonb, created_at）
> - `order_items`：订单详情（id, order_id, product_id, variant_id, quantity, unit_price, product_snapshot jsonb）
> - `cart_items`：购物车（id, user_id, product_id, variant_id, quantity）
> - `reviews`：评价（id, user_id, product_id, order_id, rating, content, images text[]）
>
> 要求：
> 1. 添加必要的外键约束和索引
> 2. 为 `orders.status` 创建 enum 类型：pending / paid / shipped / delivered / cancelled / refunded
> 3. 为 `profiles` 添加 `on auth.users insert` 的触发器自动创建记录
> 4. 配置 RLS（Row Level Security）策略，确保用户只能访问自己的数据

---

### Step 3 — Nuxt 4 目录结构规划

**发给大模型的 Prompt：**

> 为 Nuxt 4 电商项目规划完整的 `app/` 目录结构，输出每个文件/目录的用途说明（树形结构），包含：
>
> - `app/pages/`：首页、商品列表、商品详情、购物车、结算、订单列表、订单详情、用户中心、登录/注册
> - `app/components/`：按功能拆分（product/、cart/、order/、ui/、layout/）
> - `app/composables/`：useCart, useAuth, useProduct, useOrder, useAddress
> - `app/stores/`：cart.ts, user.ts, ui.ts（Pinia）
> - `app/middleware/`：auth.ts（需要登录的页面守卫）
> - `server/api/`：支付回调、订单创建等服务端接口
> - `app/utils/`：price.ts（价格格式化）、validator.ts
> - `app/types/`：index.ts（所有 TypeScript 类型定义）
>
> 同时输出 `app/types/index.ts` 的完整内容，导出所有业务实体的 TypeScript 接口

---

## 阶段二：认证与用户系统

---

### Step 4 — 用户认证页面与逻辑

**发给大模型的 Prompt：**

> 在 Nuxt 4 + @nuxtjs/supabase 项目中实现用户认证功能，输出以下文件：
>
> 1. `app/pages/auth/login.vue`：邮箱+密码登录表单，使用 `useSupabaseClient()` 调用 `auth.signInWithPassword`，登录成功跳转首页，错误显示提示
> 2. `app/pages/auth/register.vue`：注册表单（邮箱、密码、确认密码、昵称），调用 `auth.signUp`，注册后提示验证邮件
> 3. `app/middleware/auth.ts`：路由守卫，使用 `useSupabaseUser()` 检查登录状态，未登录重定向到 `/auth/login`，保存 `redirect` 参数
> 4. `app/stores/user.ts`：Pinia store，state 包含 profile 信息，actions：fetchProfile、updateProfile、logout
> 5. `app/composables/useAuth.ts`：封装登录、登出、注册方法，处理 loading 和 error 状态
>
> 使用 Tailwind CSS 编写 UI，表单需有完整的前端校验

---

### Step 5 — 用户中心页面

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现用户中心页面，路由 `/account`，需要 auth 中间件保护，输出：
>
> 1. `app/pages/account/index.vue`：用户信息展示+编辑（头像、昵称、手机号），调用 Supabase 更新 `profiles` 表
> 2. `app/pages/account/addresses.vue`：收货地址列表，支持新增/编辑/删除/设为默认，CRUD 操作 `addresses` 表
> 3. `app/pages/account/orders.vue`：订单列表（简版，分页），显示订单号、状态、金额、时间
> 4. `app/components/layout/AccountSidebar.vue`：账户页侧边导航组件
>
> 使用 Tailwind CSS，地址表单用 `<dialog>` 或 modal 组件实现

---

## 阶段三：商品系统

---

### Step 6 — Pinia 商品 Store 与 Composable

**发给大模型的 Prompt：**

> 在 Nuxt 4 + Pinia + Supabase 项目中实现商品数据层，输出：
>
> 1. `app/composables/useProduct.ts`：
>    - `fetchProducts(params: { categorySlug?, page?, pageSize?, sort?, search? })`：查询商品列表，支持分类过滤、关键词搜索、分页、排序（price_asc/price_desc/newest），返回 `{ data, total, page }`
>    - `fetchProductBySlug(slug: string)`：查询商品详情，关联查询 category 和 variants
>    - `fetchCategories()`：查询所有分类（含层级）
>    所有方法使用 `useSupabaseClient()` 操作 Supabase，包含 loading 和 error 状态
>
> 2. `app/types/index.ts` 中的相关类型：`Product`, `ProductVariant`, `Category`（完整字段）

---

### Step 7 — 商品列表页

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现商品列表页 `app/pages/products/index.vue`，要求：
>
> 1. URL 参数支持：`?category=xxx&page=1&sort=price_asc&search=关键词`
> 2. 左侧分类筛选栏（从 useProduct 获取分类树）
> 3. 顶部排序切换（最新/价格升序/价格降序）
> 4. 商品网格（响应式：手机2列，平板3列，桌面4列）
> 5. 分页组件
> 6. 搜索栏，输入后更新 URL query
> 7. `app/components/product/ProductCard.vue`：商品卡片，显示图片、名称、价格、原价（划线），加入购物车按钮
>
> 使用 Nuxt 的 `useRoute`/`useRouter` 管理 URL 参数，使用 `useProduct` composable 获取数据，Tailwind CSS 布局

---

### Step 8 — 商品详情页

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现商品详情页 `app/pages/products/[slug].vue`，要求：
>
> 1. 使用 `useSeoMeta` 设置商品名称和描述为 SEO meta
> 2. 图片轮播（使用纯 CSS + Vue 实现，不引入额外组件库）：主图大图 + 缩略图列表
> 3. 商品名称、价格展示（含原价划线）
> 4. 规格选择器：从 `product_variants` 读取，点击选中，影响库存和价格显示
> 5. 数量选择器（+-按钮，最大值=库存）
> 6. "加入购物车"和"立即购买"按钮
> 7. 商品详情描述区域（富文本 HTML 渲染）
> 8. 调用 `useCart` 的 `addToCart` 方法处理加购逻辑
>
> 输出完整的 Vue 单文件组件，使用 Tailwind CSS

---

## 阶段四：购物车系统

---

### Step 9 — 购物车 Store 与 Composable

**发给大模型的 Prompt：**

> 在 Nuxt 4 + Pinia + Supabase 项目中实现购物车系统，输出：
>
> 1. `app/stores/cart.ts`（Pinia store）：
>    - state: `items: CartItem[]`（含 product 快照信息）
>    - getters: `totalCount`, `totalAmount`, `isEmpty`
>    - actions: `loadCart()`（从 Supabase 加载）, `addItem(productId, variantId, qty)`, `updateQty(itemId, qty)`, `removeItem(itemId)`, `clearCart()`
>    - 未登录时用 `localStorage` 临时存储，登录后合并到数据库
>
> 2. `app/composables/useCart.ts`：封装 store，提供 `addToCart` 方法（含 toast 反馈）
>
> 3. `app/types/index.ts` 补充 `CartItem` 类型
>
> 登录状态变化时（`watch(user, ...)`）自动触发购物车同步

---

### Step 10 — 购物车页面

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现购物车页面 `app/pages/cart.vue`，要求：
>
> 1. 从 `cartStore` 读取购物车数据
> 2. 商品列表：图片、名称、规格、单价、数量调节（+-）、小计、删除按钮
> 3. 全选/反选 checkbox，批量删除
> 4. 右侧价格汇总卡片：已选商品数、合计金额、"去结算"按钮
> 5. 购物车为空时显示空状态插图和"去购物"按钮
> 6. `app/components/cart/CartItem.vue`：单个购物车条目组件
>
> 使用 Tailwind CSS，数量变更实时调用 `cartStore.updateQty`，乐观更新 UI

---

## 阶段五：订单与结算

---

### Step 11 — 结算页面

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现结算页面 `app/pages/checkout.vue`（需要 auth 中间件），要求：
>
> 1. 从购物车读取选中商品，若为空重定向回购物车
> 2. 收货地址选择：列出用户地址列表，可快速新增地址（内联表单）
> 3. 订单明细：商品清单、小计、运费（固定10元，满99免运费）、总计
> 4. 支付方式选择（模拟：微信支付 / 支付宝，仅 UI，不接真实支付）
> 5. 提交订单按钮：调用 `useOrder` 的 `createOrder` 方法
> 6. 提交成功后跳转 `/orders/[id]`，并清空购物车中已结算商品
>
> 输出完整 Vue 文件，Tailwind CSS

---

### Step 12 — 订单 Composable 与服务端接口

**发给大模型的 Prompt：**

> 在 Nuxt 4 + Supabase 项目中实现订单创建逻辑，输出：
>
> 1. `app/composables/useOrder.ts`：
>    - `createOrder(params: { addressId, items, paymentMethod })`：在 Supabase 中事务性创建 `orders` + `order_items` 记录，存储商品快照，清空对应购物车条目，返回 orderId
>    - `fetchOrders(page?)`：分页获取当前用户订单列表
>    - `fetchOrderById(id)`：获取订单详情（含 order_items 和商品信息）
>    - `cancelOrder(id)`：取消订单（校验状态为 pending 才可取消）
>
> 2. `server/api/orders/create.post.ts`：Nuxt server route，服务端验证订单合法性（库存校验、价格校验），调用 Supabase admin client 创建订单
>
> 3. `app/types/index.ts` 补充 `Order`, `OrderItem` 类型

---

### Step 13 — 订单详情页

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现订单详情页 `app/pages/orders/[id].vue`，要求：
>
> 1. 订单状态进度条：待付款 → 已付款 → 已发货 → 已完成（根据 status 高亮当前步骤）
> 2. 收货地址信息卡片（从 order snapshot 读取）
> 3. 商品明细列表（图片、名称、规格、数量、单价）
> 4. 费用汇总（小计、运费、合计）
> 5. 操作按钮区：status=pending 显示"取消订单"和"模拟付款"按钮；status=delivered 显示"确认收货"
> 6. "模拟付款"按钮将订单状态更新为 paid
>
> 使用 Tailwind CSS，状态步骤条用纯 CSS + flex 实现

---

## 阶段六：全局 UI 组件

---

### Step 14 — 导航栏与布局

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现全局布局组件，输出：
>
> 1. `app/components/layout/Navbar.vue`：顶部导航栏，包含：
>    - Logo（左）
>    - 搜索框（中，输入回车跳转 `/products?search=xxx`）
>    - 右侧：购物车图标（badge 显示数量，来自 cartStore.totalCount）、用户头像下拉菜单（已登录显示昵称和菜单，未登录显示"登录/注册"）
>    - 移动端汉堡菜单
>
> 2. `app/layouts/default.vue`：默认布局，包含 Navbar + `<slot>` + Footer
>
> 3. `app/components/layout/Footer.vue`：简洁页脚，版权信息 + 快速链接
>
> 4. `app/components/ui/Toast.vue`：全局 Toast 通知组件（success/error/info），使用 `app/stores/ui.ts` 管理消息队列，支持自动消失
>
> 使用 Tailwind CSS，导航栏需 sticky + 磨砂玻璃效果

---

### Step 15 — 通用 UI 组件库

**发给大模型的 Prompt：**

> 在 Nuxt 4 + Tailwind CSS 项目中实现以下通用 UI 组件（输出每个文件的完整代码）：
>
> 1. `app/components/ui/Button.vue`：Props: variant(primary/secondary/ghost/danger), size(sm/md/lg), loading, disabled；loading 时显示 spinner
> 2. `app/components/ui/Input.vue`：Props: label, placeholder, error, type, modelValue；支持 v-model
> 3. `app/components/ui/Modal.vue`：Props: modelValue(v-model 控制显示), title；slot: default, footer；点击遮罩关闭；ESC 键关闭
> 4. `app/components/ui/Pagination.vue`：Props: total, page, pageSize；emit: update:page；显示首页/上一页/页码/下一页/末页
> 5. `app/components/ui/EmptyState.vue`：Props: title, description, actionText, actionLink；显示空状态插图（SVG inline）和操作按钮
> 6. `app/components/ui/LoadingSpinner.vue`：全屏或局部 loading 遮罩
>
> 所有组件使用 TypeScript defineProps，Tailwind CSS 样式

---

## 阶段七：首页与搜索

---

### Step 16 — 首页

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中实现电商首页 `app/pages/index.vue`，包含以下区块（使用 Tailwind CSS，所有数据从 Supabase 获取）：
>
> 1. Hero Banner：全宽轮播图（自动播放+手动切换），数据硬编码3张示例图（使用 picsum.photos 占位图）
> 2. 商品分类导航：图标+名称的网格，点击跳转 `/products?category=slug`，从 `fetchCategories()` 获取
> 3. 热销商品区：标题 + 横向滚动商品卡片列表（`is_active=true` 前8个，按 created_at 降序）
> 4. 促销 Banner：静态两列布局，硬编码文案和背景色
> 5. 新品推荐：4列商品网格（最新8个商品）
>
> 使用 `Promise.all` 并行请求所有数据，`useSeoMeta` 设置首页 SEO

---

### Step 17 — 搜索功能优化

**发给大模型的 Prompt：**

> 在 Nuxt 4 + Supabase 项目中优化搜索体验，输出：
>
> 1. 在 `app/components/layout/Navbar.vue` 的搜索框添加搜索建议下拉（输入时防抖300ms查询商品名称，最多显示5条，点击直接跳转商品详情）
> 2. 在 Supabase 的 `products` 表上创建全文搜索索引的 SQL（使用 `tsvector` + `to_tsquery`，支持中文分词使用 `simple` 配置）
> 3. 修改 `useProduct.ts` 的 `fetchProducts` 方法，当有 `search` 参数时使用 `textSearch` 或 `ilike` 查询
> 4. `app/pages/products/index.vue` 中搜索结果为空时显示"没有找到相关商品"的空状态组件
>
> 搜索建议使用 `onClickOutside`（VueUse）关闭，需安装 `@vueuse/nuxt`

---

## 阶段八：性能与工程化

---

### Step 18 — SEO 与 SSR 优化

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中进行 SEO 和渲染优化，输出以下修改：
>
> 1. `nuxt.config.ts` 中配置：
>    - `routeRules`：首页和商品列表用 `swr: 60`（Stale-While-Revalidate），商品详情用 `swr: 3600`，购物车/结算/账户页用 `ssr: false`
>    - 配置 `site.url` 用于 sitemap
>
> 2. `app/pages/products/[slug].vue` 中：
>    - 使用 `useAsyncData` + `useSeoMeta` 设置动态 title/description/og:image
>    - 添加商品的 JSON-LD 结构化数据（`useSchemaOrg` 或手动注入 script tag）
>
> 3. `app/components/product/ProductCard.vue`：图片使用 Nuxt `<NuxtImg>`，配置懒加载和尺寸
>
> 4. `nuxt.config.ts` 配置 `@nuxt/image` 模块，provider 使用 `ipx`

---

### Step 19 — 错误处理与 Loading 状态

**发给大模型的 Prompt：**

> 在 Nuxt 4 项目中完善错误处理和加载体验，输出：
>
> 1. `app/error.vue`：自定义错误页面，处理 404（商品不存在）和 500（服务异常），提供"返回首页"按钮
> 2. `app/stores/ui.ts`（Pinia store）：管理全局 loading 状态和 toast 消息队列，提供 `showToast(message, type)` action
> 3. 修改所有 composable（useProduct/useCart/useOrder）：统一错误处理，catch 后调用 `uiStore.showToast` 显示错误信息
> 4. `app/components/ui/PageLoading.vue`：页面切换时顶部进度条（类似 nprogress），在 `app/plugins/loading.client.ts` 中通过 `router.beforeEach/afterEach` 控制
>
> Toast 组件在 `app/layouts/default.vue` 中全局挂载

---

### Step 20 — 环境配置与部署

**发给大模型的 Prompt：**

> 为 Nuxt 4 + Bun 电商项目完成生产环境配置，输出：
>
> 1. `nuxt.config.ts` 完整最终版本：整合所有模块配置、routeRules、runtimeConfig（公开 supabaseUrl，私有 supabaseServiceKey）
> 2. `.env.production.example`：所有生产环境变量说明（SUPABASE_URL, SUPABASE_KEY, NUXT_PUBLIC_SITE_URL 等）
> 3. `Dockerfile`：多阶段构建，使用 `oven/bun` 基础镜像，`bun run build` 后用 node 运行 `.output/server/index.mjs`
> 4. `.github/workflows/deploy.yml`：GitHub Actions CI/CD，push to main 触发，运行 `bun run lint && bun run build`，然后 Docker build & push 到 ghcr.io
> 5. `package.json` scripts 补充：`lint`（eslint）、`typecheck`（vue-tsc）、`test`（vitest）

---

## 快速参考：步骤总览

| # | 阶段 | 步骤 | 核心产出 |
|---|------|------|---------|
| 1 | 初始化 | 项目脚手架 | nuxt.config.ts, tailwind.config.ts |
| 2 | 初始化 | 数据库 Schema | SQL DDL + RLS 策略 |
| 3 | 初始化 | 目录结构 + 类型 | types/index.ts |
| 4 | 认证 | 登录/注册页 | auth pages + middleware |
| 5 | 认证 | 用户中心 | account pages |
| 6 | 商品 | 数据层 | useProduct composable |
| 7 | 商品 | 列表页 | products/index.vue |
| 8 | 商品 | 详情页 | products/[slug].vue |
| 9 | 购物车 | 购物车逻辑 | cart store + composable |
| 10 | 购物车 | 购物车页面 | cart.vue |
| 11 | 订单 | 结算页 | checkout.vue |
| 12 | 订单 | 订单逻辑 | useOrder + server API |
| 13 | 订单 | 订单详情 | orders/[id].vue |
| 14 | UI | 导航与布局 | Navbar + layouts |
| 15 | UI | 通用组件 | Button/Input/Modal 等 |
| 16 | 首页 | 首页 | index.vue |
| 17 | 搜索 | 搜索优化 | 全文搜索 + 建议下拉 |
| 18 | 工程化 | SEO + SSR | routeRules + JSON-LD |
| 19 | 工程化 | 错误处理 | error.vue + toast |
| 20 | 工程化 | 部署配置 | Dockerfile + CI/CD |

> **建议执行顺序**：严格按 1→20 顺序推进，Step 3 产出的类型文件会被后续所有步骤依赖，Step 15 的 UI 组件可在 Step 14 之后随时补充。
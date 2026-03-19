# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

supabase database password: `FBaF2VFWscjXW5g5`

## 启动开发服务器
bunx nuxt dev 

## 部署数据库迁移
bunx supabase db push   
bunx supabase functions deploy order-pdf
bunx supabase gen types typescript --project-id jrwlagkwlbupffuekawa > app/types/database.types.ts


npx supabase db execute --file supabase/migrations/schema.sql --linked
npx supabase db execute --file supabase/migrations/seed.sql --linked

bun add <包名> --registry=https://registry.npmmirror.com
bun add -D <包名> --registry=https://registry.npmmirror.com


find . -type f -not -path '*/node_modules/*' -not -path '*/.nuxt/*' -not -path '*/.git/*' -not -path '*/.output/*'

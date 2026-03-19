// app/composables/useProducts.ts
import type {
  Product,
  ProductQueryParams,
  ProductImage,
  CategoryRow,
  CategoryTree,
} from "~/types";

// ── 辅助函数 ─────────────────────────────────────────────────

function parseImages(raw: unknown): ProductImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    if (typeof item === "object" && item !== null && "url" in item)
      return item as ProductImage;
    return { url: String(item) };
  });
}

function buildCategoryTree(rows: CategoryRow[]): CategoryTree[] {
  const map = new Map<number, CategoryTree>();
  rows.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryTree[] = [];
  map.forEach((node) => {
    if (node.parent_id !== null && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots.sort((a, b) => a.sort_order - b.sort_order);
}

// ─────────────────────────────────────────────────────────────

export function useProducts() {
  const supabase = useSupabaseClient();

  // 商品列表（含分页）
  async function getProducts(params: ProductQueryParams = {}) {
    const {
      categorySlug,
      search,
      sort = "newest",
      page = 1,
      pageSize = 12,
    } = params;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)", {
        count: "exact",
      })
      .eq("is_active", true);

    if (categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      if (cat) query = query.eq("category_id", cat.id);
    }

    if (search?.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const products: Product[] = (data ?? []).map((row: any) => ({
      ...row,
      images: parseImages(row.images),
    }));

    return {
      data: products,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  // 单个商品（by slug）
  async function getProduct(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return {
      ...(data as any),
      images: parseImages((data as any).images),
    } as Product;
  }

  // 分类树
  async function getCategories(): Promise<CategoryTree[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return buildCategoryTree((data ?? []) as CategoryRow[]);
  }

  // 首页推荐商品
  async function getFeaturedProducts(limit = 8): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      images: parseImages(row.images),
    }));
  }

  return { getProducts, getProduct, getCategories, getFeaturedProducts };
}

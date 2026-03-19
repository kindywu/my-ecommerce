// supabase/functions/order-pdf/index.ts
// Deno Edge Function — 生成订单 PDF 并返回二进制流
//
// 路由：  GET  /functions/v1/order-pdf?id=<orderId>
// 认证：  Authorization: Bearer <supabase_access_token>
// 响应：  application/pdf

import { createClient } from "jsr:@supabase/supabase-js@2";
// jsPDF via esm.sh（支持 Deno）
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// ── 工具 ──────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonError(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── 主处理器 ──────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. 从 URL 取订单 ID
  const url = new URL(req.url);
  const orderId = Number(url.searchParams.get("id"));
  if (!orderId || isNaN(orderId)) {
    return jsonError("缺少有效的订单 ID（?id=<number>）");
  }

  // 2. 验证 JWT，获取当前用户
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return jsonError("未提供认证 Token", 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return jsonError("认证失败，请重新登录", 401);
  }

  // 3. 查询订单（RLS 自动限制只能访问本人订单）
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `id, created_at, status, total_amount, shipping_fee,
       payment_method, address_snapshot,
       order_items ( id, quantity, unit_price, product_snapshot )`,
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return jsonError("订单不存在或无权访问", 404);
  }

  // 4. 生成 PDF
  const pdfBytes = buildPdf(order);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="order-${orderId}.pdf"`,
    },
  });
});

// ── PDF 构建 ──────────────────────────────────────────────

function buildPdf(order: any): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const addr = order.address_snapshot as any;
  const items = (order.order_items ?? []) as any[];

  const PAGE_W = 210;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // ── 辅助函数 ──
  const text = (
    str: string,
    x: number,
    yPos: number,
    opts?: Parameters<typeof doc.text>[3],
  ) => doc.text(str, x, yPos, opts);

  const line = (x1: number, y1: number, x2: number, y2: number) =>
    doc.line(x1, y1, x2, y2);

  const nextLine = (gap = 6) => {
    y += gap;
    return y;
  };

  // ── 页眉 ──
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  text("MyShop", MARGIN, 9.5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  text("Order Receipt", PAGE_W - MARGIN, 9.5, { align: "right" });

  doc.setTextColor(30, 30, 30);
  y = 26;

  // ── 标题 ──
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  text(`Order #${order.id}`, MARGIN, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  text(
    `Created: ${new Date(order.created_at).toLocaleString("zh-CN")}`,
    PAGE_W - MARGIN,
    y,
    { align: "right" },
  );

  doc.setTextColor(30, 30, 30);
  nextLine(2);

  // 状态徽章
  const statusMap: Record<string, [string, [number, number, number]]> = {
    pending: ["Pending Payment", [234, 179, 8]],
    paid: ["Paid", [59, 130, 246]],
    shipped: ["Shipped", [168, 85, 247]],
    delivered: ["Delivered", [34, 197, 94]],
    cancelled: ["Cancelled", [156, 163, 175]],
    refunded: ["Refunded", [156, 163, 175]],
  };
  const [statusLabel, statusRgb] = statusMap[order.status] ?? [
    "Unknown",
    [100, 100, 100],
  ];
  doc.setFillColor(...statusRgb);
  doc.roundedRect(MARGIN, y, 32, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  text(statusLabel, MARGIN + 16, y + 4.7, { align: "center" });

  doc.setTextColor(30, 30, 30);
  y += 16;

  // ── 分割线 ──
  doc.setDrawColor(220, 220, 220);
  line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // ── 收货地址 ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  text("SHIPPING ADDRESS", MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9.5);
  text(`${addr.receiver}   ${addr.phone}`, MARGIN, y);
  y += 5.5;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);

  // 自动换行处理长地址
  const addressLines = doc.splitTextToSize(
    addr.full_address ??
      `${addr.province}${addr.city}${addr.district}${addr.detail}`,
    CONTENT_W * 0.55,
  );
  doc.text(addressLines, MARGIN, y);
  y += addressLines.length * 5 + 8;

  // ── 商品明细表格 ──
  doc.setDrawColor(220, 220, 220);
  line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 1;

  // 表头
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN, y, CONTENT_W, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);

  const COL = {
    name: MARGIN + 2,
    variant: MARGIN + 90,
    qty: MARGIN + 130,
    price: MARGIN + 152,
    total: PAGE_W - MARGIN - 2,
  };

  text("PRODUCT", COL.name, y + 5.2);
  text("VARIANT", COL.variant, y + 5.2);
  text("QTY", COL.qty, y + 5.2);
  text("UNIT PRICE", COL.price, y + 5.2);
  text("SUBTOTAL", COL.total, y + 5.2, { align: "right" });
  y += 9;

  // 商品行
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);

  for (const item of items) {
    const snap = item.product_snapshot as any;
    const subtotal = item.unit_price * item.quantity;

    doc.setFontSize(9);
    const nameLines = doc.splitTextToSize(snap?.name ?? "-", 82);
    const rowH = Math.max(nameLines.length * 5, 7) + 4;

    // 隔行底色
    if (items.indexOf(item) % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(MARGIN, y, CONTENT_W, rowH, "F");
    }

    doc.text(nameLines, COL.name, y + 5);
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8.5);
    text(snap?.variant_name ?? "-", COL.variant, y + 5);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    text(String(item.quantity), COL.qty, y + 5);
    text(`¥${item.unit_price.toFixed(2)}`, COL.price, y + 5);
    doc.setFont("helvetica", "bold");
    text(`¥${subtotal.toFixed(2)}`, COL.total, y + 5, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += rowH;

    // 换页保护
    if (y > 260) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // 表格底线
  doc.setDrawColor(220, 220, 220);
  line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // ── 金额汇总 ──
  const RIGHT = PAGE_W - MARGIN;
  const LABEL_X = RIGHT - 58;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  text("Subtotal", LABEL_X, y);
  text(`¥${order.total_amount.toFixed(2)}`, RIGHT, y, { align: "right" });
  y += 6;

  text("Shipping", LABEL_X, y);
  doc.setTextColor(
    order.shipping_fee === 0 ? 34 : 30,
    order.shipping_fee === 0 ? 197 : 30,
    order.shipping_fee === 0 ? 94 : 30,
  );
  text(
    order.shipping_fee === 0 ? "Free" : `¥${order.shipping_fee.toFixed(2)}`,
    RIGHT,
    y,
    { align: "right" },
  );
  y += 1;

  doc.setDrawColor(200, 200, 200);
  line(LABEL_X, y + 2, RIGHT, y + 2);
  y += 7;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  text("Total", LABEL_X, y);
  text(`¥${(order.total_amount + order.shipping_fee).toFixed(2)}`, RIGHT, y, {
    align: "right",
  });

  if (order.payment_method) {
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const pmMap: Record<string, string> = {
      wechat: "WeChat Pay",
      alipay: "Alipay",
    };
    text(
      `Payment: ${pmMap[order.payment_method] ?? order.payment_method}`,
      LABEL_X,
      y,
    );
  }

  // ── 页脚 ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${i} of ${pageCount}   ·   Generated ${new Date().toLocaleString("zh-CN")}   ·   MyShop`,
      PAGE_W / 2,
      292,
      { align: "center" },
    );
  }

  // 返回 Uint8Array
  return doc.output("arraybuffer") as unknown as Uint8Array;
}

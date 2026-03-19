// server/api/orders/[id]/pdf.get.ts
import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

export default defineEventHandler(async (event) => {
  const orderId = Number(getRouterParam(event, "id"));
  if (isNaN(orderId)) {
    throw createError({ statusCode: 400, message: "无效的订单 ID" });
  }

  // ── 验证身份 ──────────────────────────────────────────────
  const authHeader = getHeader(event, "authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, message: "未授权" });
  }
  const token = authHeader.slice(7);

  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw createError({ statusCode: 401, message: "Token 无效" });
  }

  // ── 查询订单 ──────────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) {
    throw createError({ statusCode: 404, message: "订单不存在" });
  }

  // ── 加载中文字体 ──────────────────────────────────────────
  let fontBuffer: Buffer | null = null;
  try {
    const fontPath = resolve(
      process.cwd(),
      "public/fonts/NotoSansSC-Regular.ttf",
    );
    fontBuffer = readFileSync(fontPath);
  } catch {
    console.warn(
      "[PDF] 未找到中文字体，请将 NotoSansSC-Regular.ttf 放入 public/fonts/",
    );
  }

  // ── 生成 PDF ──────────────────────────────────────────────
  const chunks: Buffer[] = [];

  await new Promise<void>((res, rej) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    if (fontBuffer) {
      doc.registerFont("SC", fontBuffer);
      doc.font("SC");
    }

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", res);
    doc.on("error", rej);

    const W = doc.page.width; // 595
    const BLACK = "#111827";
    const GRAY = "#6B7280";
    const LGRAY = "#F3F4F6";
    const BORDER = "#E5E7EB";

    // ── 页眉 ─────────────────────────────────────────────
    doc.fontSize(22).fillColor(BLACK).text("MyShop", 50, 50);
    doc.fontSize(10).fillColor(GRAY).text("订单收据", 50, 78);

    doc
      .fontSize(10)
      .fillColor(GRAY)
      .text(`订单编号：#${order.id}`, W - 250, 50, {
        width: 200,
        align: "right",
      })
      .text(
        `下单时间：${new Date(order.created_at).toLocaleString("zh-CN")}`,
        W - 250,
        66,
        { width: 200, align: "right" },
      );

    doc
      .moveTo(50, 102)
      .lineTo(W - 50, 102)
      .strokeColor(BORDER)
      .lineWidth(1)
      .stroke();

    let y = 120;

    // ── 收货信息 ─────────────────────────────────────────
    doc.fontSize(11).fillColor(BLACK).text("收货信息", 50, y);
    y += 20;

    const addr = order.address_snapshot as any;
    doc
      .fontSize(10)
      .fillColor(GRAY)
      .text(`收货人：${addr.receiver}　　电话：${addr.phone}`, 50, y);
    y += 16;
    doc.text(
      `地址：${addr.full_address ?? addr.province + addr.city + addr.district + addr.detail}`,
      50,
      y,
    );
    y += 30;

    // ── 商品表头 ──────────────────────────────────────────
    const COL = { name: 60, spec: 290, price: 390, qty: 455, sub: W - 100 };

    doc.rect(50, y, W - 100, 24).fill(LGRAY);
    doc
      .fontSize(9)
      .fillColor(BLACK)
      .text("商品名称", COL.name, y + 8, { width: 220 })
      .text("规格", COL.spec, y + 8, { width: 90 })
      .text("单价", COL.price, y + 8, { width: 55, align: "right" })
      .text("数量", COL.qty, y + 8, { width: 40, align: "right" })
      .text("小计", COL.sub, y + 8, { width: 55, align: "right" });
    y += 24;

    // ── 商品行 ────────────────────────────────────────────
    const items: any[] = order.items ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const snap = item.product_snapshot as any;
      const subtotal = item.unit_price * item.quantity;

      doc.rect(50, y, W - 100, 22).fill(i % 2 === 1 ? "#FAFAFA" : "#FFFFFF");
      doc
        .fontSize(9)
        .fillColor(BLACK)
        .text(snap?.name ?? "-", COL.name, y + 6, {
          width: 220,
          lineBreak: false,
          ellipsis: true,
        })
        .text(snap?.variant_name ?? "-", COL.spec, y + 6, {
          width: 90,
          lineBreak: false,
          ellipsis: true,
        });
      doc
        .fillColor(GRAY)
        .text(`¥${item.unit_price.toFixed(2)}`, COL.price, y + 6, {
          width: 55,
          align: "right",
        })
        .text(`×${item.quantity}`, COL.qty, y + 6, {
          width: 40,
          align: "right",
        });
      doc
        .fillColor(BLACK)
        .text(`¥${subtotal.toFixed(2)}`, COL.sub, y + 6, {
          width: 55,
          align: "right",
        });

      doc
        .moveTo(50, y + 22)
        .lineTo(W - 50, y + 22)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();
      y += 22;
    }

    y += 16;

    // ── 价格汇总 ──────────────────────────────────────────
    const SX = W - 230; // 汇总区左边距

    const row = (label: string, value: string, bold = false) => {
      doc
        .fontSize(bold ? 11 : 10)
        .fillColor(bold ? BLACK : GRAY)
        .text(label, SX, y, { width: 120 })
        .text(value, SX + 120, y, { width: 60, align: "right" });
      y += bold ? 20 : 18;
    };

    row("商品总价", `¥${order.total_amount.toFixed(2)}`);
    row(
      "运费",
      order.shipping_fee === 0 ? "免运费" : `¥${order.shipping_fee.toFixed(2)}`,
    );
    doc
      .moveTo(SX, y)
      .lineTo(W - 50, y)
      .strokeColor(BORDER)
      .lineWidth(0.8)
      .stroke();
    y += 8;
    row(
      "实付金额",
      `¥${(order.total_amount + order.shipping_fee).toFixed(2)}`,
      true,
    );

    y += 16;

    // ── 状态信息 ──────────────────────────────────────────
    const statusMap: Record<string, string> = {
      pending: "待付款",
      paid: "已付款",
      shipped: "已发货",
      delivered: "已完成",
      cancelled: "已取消",
      refunded: "已退款",
    };
    doc
      .fontSize(10)
      .fillColor(GRAY)
      .text(
        `支付方式：${order.payment_method ?? "-"}　　订单状态：${statusMap[order.status] ?? order.status}`,
        50,
        y,
      );
    y += 40;

    // ── 页脚 ──────────────────────────────────────────────
    doc
      .moveTo(50, y)
      .lineTo(W - 50, y)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();
    doc
      .fontSize(8)
      .fillColor(GRAY)
      .text("感谢您在 MyShop 购物，如有问题请联系客服。", 50, y + 10, {
        align: "center",
        width: W - 100,
      });

    doc.end();
  });

  // ── 返回 PDF ──────────────────────────────────────────────
  const pdfBuffer = Buffer.concat(chunks);
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="order-${orderId}.pdf"`,
  );
  setHeader(event, "Content-Length", String(pdfBuffer.length));
  return pdfBuffer;
});

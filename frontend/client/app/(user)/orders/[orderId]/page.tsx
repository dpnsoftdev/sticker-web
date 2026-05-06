"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { orderApi } from "@/features/order/order.api";
import type {
  OrderCreatedData,
  OrderItemData,
} from "@/features/order/order.types";
import { PLACEHOLDER_IMAGE, ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "Chờ xác nhận",
  payment_confirmed: "Đã thanh toán",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

function readShipping(order: OrderCreatedData) {
  const s = order.shippingInfo as Record<string, unknown> | null | undefined;
  if (!s || typeof s !== "object") return null;
  return {
    receiver_name: typeof s.receiver_name === "string" ? s.receiver_name : "",
    receiver_phone:
      typeof s.receiver_phone === "string" ? s.receiver_phone : "",
    address: typeof s.address === "string" ? s.address : "",
    notes: typeof s.notes === "string" ? s.notes : "",
  };
}

function readContact(order: OrderCreatedData) {
  const c = order.contact as Record<string, unknown> | null | undefined;
  if (!c || typeof c !== "object") return null;
  return {
    email: typeof c.email === "string" ? c.email : "",
    phone: typeof c.phone === "string" ? c.phone : "",
    social_link: typeof c.social_link === "string" ? c.social_link : "",
  };
}

function readPayment(order: OrderCreatedData) {
  const p = order.payment as Record<string, unknown> | null | undefined;
  if (!p || typeof p !== "object") return null;
  const plan = p.plan_type === "deposit" ? "deposit" : "full";
  const method = typeof p.method === "string" ? p.method : "";
  const bill = p.bill_image;
  const hasBill = bill != null && bill !== "" && typeof bill === "string";
  return { plan_type: plan as "full" | "deposit", method, hasBill };
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.orderId === "string" ? params.orderId : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderCreatedData | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await orderApi.getMine(orderId);
      if (!res.success || res.data == null) {
        setError(res.message ?? "Không tìm thấy đơn hàng.");
        setOrder(null);
        return;
      }
      setOrder(res.data);
    } catch {
      setError("Không tải được đơn hàng. Vui lòng thử lại.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!orderId) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <p className="text-destructive">Mã đơn không hợp lệ.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href={ROUTES.MY_ORDERS}>Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <p className="text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 space-y-4">
        <p className="text-destructive">
          {error ?? "Không tìm thấy đơn hàng."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()}>
            Thử lại
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href={ROUTES.MY_ORDERS}>Danh sách đơn</Link>
          </Button>
        </div>
      </div>
    );
  }

  const shipping = readShipping(order);
  const contact = readContact(order);
  const payment = readPayment(order);
  const items = (order.items ?? []) as OrderItemData[];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại
      </button>

      <div className="space-y-2 border-b border-border pb-6">
        <p className="font-mono text-sm text-muted-foreground">
          #{order.id.slice(-8).toUpperCase()}
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Chi tiết đơn hàng
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <span className="text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("vi-VN")}
          </span>
        </div>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Sản phẩm</h2>
        <ul className="space-y-3">
          {items.map(it => {
            const line = it.unitPrice * it.quantity;
            const img = it.image ?? PLACEHOLDER_IMAGE;
            return (
              <li
                key={it.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={img.startsWith("data:")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {it.productName}
                  </p>
                  {it.variantName ? (
                    <p className="text-xs text-muted-foreground">
                      {it.variantName}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    SL: {it.quantity} × {formatVND(it.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatVND(line)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tạm tính</span>
          <span className="tabular-nums">
            {formatVND(order.subtotalAmount)}
          </span>
        </div>
        {order.discountAmount > 0 ? (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Giảm giá</span>
            <span className="tabular-nums">
              −{formatVND(order.discountAmount)}
            </span>
          </div>
        ) : null}
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Thành tiền</span>
          <span className="text-primary tabular-nums">
            {formatVND(order.finalAmount)}
          </span>
        </div>
      </section>

      {payment ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Thanh toán</h2>
          <p className="text-sm text-muted-foreground">
            Hình thức:{" "}
            <span className="text-foreground">
              {payment.plan_type === "deposit"
                ? "Đặt cọc 50%"
                : "Thanh toán đủ"}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Phương thức:{" "}
            <span className="text-foreground">{payment.method || "—"}</span>
          </p>
          {payment.hasBill ? (
            <p className="text-sm text-muted-foreground">
              Bill chuyển khoản: <span className="text-foreground">Đã gửi</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {shipping ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Giao hàng</h2>
          <p className="text-sm">
            <span className="text-muted-foreground">Người nhận: </span>
            {shipping.receiver_name || "—"}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">SĐT: </span>
            {shipping.receiver_phone || "—"}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Địa chỉ: </span>
            {shipping.address || "—"}
          </p>
          {shipping.notes ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Ghi chú: </span>
              {shipping.notes}
            </p>
          ) : null}
        </section>
      ) : null}

      {contact ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Liên hệ (theo đơn)
          </h2>
          <p className="text-sm">
            <span className="text-muted-foreground">Email: </span>
            {contact.email || "—"}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">SĐT: </span>
            {contact.phone || "—"}
          </p>
          {contact.social_link ? (
            <p className="text-sm break-all">
              <span className="text-muted-foreground">MXH: </span>
              <Link
                href={contact.social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                {contact.social_link}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

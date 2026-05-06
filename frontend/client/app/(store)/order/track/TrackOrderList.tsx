"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import type { OrderTrackPublicOrder } from "@/features/order/orderTrack.api";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "Chờ xác nhận",
  payment_confirmed: "Đã thanh toán",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

function formatMoney(n: number, currency: string) {
  return `${n.toLocaleString("vi-VN")} ${currency}`;
}

type TrackOrderListProps = {
  orders: OrderTrackPublicOrder[];
};

export function TrackOrderList({ orders }: TrackOrderListProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground">
        Không tìm thấy đơn hàng nào gắn với số điện thoại này.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-red-500" aria-hidden>
          *
        </span>{" "}
        Chạm hoặc nhấn vào một đơn hàng để xem sản phẩm mà bạn đã đặt 🛍️✨
      </p>
      <ul className="space-y-2">
        {orders.map(o => {
          const isOpen = openId === o.id;
          return (
            <li
              key={o.id}
              className="overflow-hidden rounded-md border border-border/90 bg-card shadow-sm"
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isOpen && "bg-muted/25"
                )}
                aria-expanded={isOpen}
                onClick={() => setOpenId(id => (id === o.id ? null : o.id))}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-mono text-sm font-medium tracking-tight text-foreground">
                    {`#${o.id.slice(-6)}`.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <p className="mt-1 text-sm tabular-nums text-foreground">
                    {formatMoney(o.finalAmount, o.currency)}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {isOpen && (
                <div className="border-t border-border/80 bg-muted/15 px-4 py-3">
                  {o.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Chưa có dòng sản phẩm cho đơn này.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {o.items.map(item => {
                        const line = item.quantity * item.unitPrice;
                        return (
                          <li
                            key={item.id}
                            className="flex gap-3 rounded-md bg-background/60 p-2.5 ring-1 ring-border/60"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image || PLACEHOLDER_IMAGE}
                              alt=""
                              className="size-14 shrink-0 rounded-lg bg-muted object-cover"
                              onError={e => {
                                const el = e.currentTarget;
                                if (el.src !== PLACEHOLDER_IMAGE)
                                  el.src = PLACEHOLDER_IMAGE;
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug text-foreground">
                                {item.productName}
                              </p>
                              {item.variantName ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {item.variantName}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>SL: {item.quantity}</span>
                                <span>
                                  Đơn giá:{" "}
                                  {formatMoney(item.unitPrice, item.currency)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                                Tạm tính: {formatMoney(line, item.currency)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

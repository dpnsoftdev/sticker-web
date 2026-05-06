"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { orderApi } from "@/features/order/order.api";
import type { OrderCreatedData } from "@/features/order/order.types";
import { ROUTES } from "@/lib/constants";
import { cn, formatVND } from "@/lib/utils";

const ORDER_STATUS_VI: Record<string, string> = {
  pending_confirmation: "Chờ xác nhận",
  payment_confirmed: "Đã thanh toán",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export default function OrdersPage() {
  const [isBooting, setIsBooting] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderCreatedData[]>([]);

  const fetchOrders = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet === true;
    setFetchError(null);
    if (!quiet) {
      setIsBooting(true);
    }
    try {
      const apiRes = await orderApi.listMine({ page: 1, limit: 50 });
      if (!apiRes.success || apiRes.data == null) {
        if (quiet) {
          toast.error("Không cập nhật được danh sách. Thử tải lại trang.");
        } else {
          setFetchError(
            apiRes.message ??
              "Không tải được danh sách. Kiểm tra kết nối và thử lại."
          );
          setOrders([]);
        }
        return;
      }
      setOrders(apiRes.data.data);
    } catch {
      if (quiet) {
        toast.error("Không cập nhật được danh sách. Thử tải lại trang.");
      } else {
        setFetchError("Không tải được danh sách. Kiểm tra kết nối và thử lại.");
        setOrders([]);
      }
    } finally {
      if (!quiet) {
        setIsBooting(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const linkGuestOrders = async () => {
    if (isLinking) return;
    setIsLinking(true);
    try {
      const apiRes = await orderApi.claimGuestOrders();
      if (!apiRes.success || apiRes.data == null) {
        toast.error("Chưa gộp được đơn. Vui lòng thử lại sau ít phút.");
        return;
      }
      const n = apiRes.data.linkedCount;
      if (n > 0) {
        toast.success(
          n === 1
            ? "Đã tìm thấy và thêm 1 đơn hàng cũ vào danh sách của bạn."
            : `Đã tìm thấy và thêm ${n} đơn hàng cũ vào danh sách của bạn.`,
          {
            description:
              "Địa chỉ, cách thanh toán… trên đơn cũ vẫn giữ đúng như lúc bạn đặt.",
          }
        );
      } else {
        toast.info("Không tìm thấy đơn hàng nào", {
          description:
            "Vui lòng liên hệ với admin để được hỗ trợ nếu bạn vẫn chưa tìm thấy đơn hàng.",
        });
      }
      await fetchOrders({ quiet: true });
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau giây lát.");
    } finally {
      setIsLinking(false);
    }
  };

  if (isBooting) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <p className="text-muted-foreground">Đang tải danh sách đơn…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 space-y-4">
        <p className="text-destructive">{fetchError}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchOrders()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6 md:py-10">
        <Link
          href={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Về cửa hàng
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Đơn hàng của tôi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mọi đơn hàng trong tầm tay – theo dõi và quản lý dễ dàng với Dango
          📦✨
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">
            Đồng bộ đơn hàng cũ
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Tìm và thêm các đơn hàng bạn đã đặt trước đây (cùng email) vào tài
            khoản này.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-xl"
            disabled={isLinking}
            onClick={() => void linkGuestOrders()}
          >
            <RefreshCw
              className={cn(
                "mr-2 size-4 shrink-0 transition-transform",
                isLinking && "animate-spin"
              )}
              aria-hidden
            />
            {isLinking ? "Đang tìm và gộp đơn…" : "Tìm và gộp đơn cùng email"}
          </Button>
        </section>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Đơn của bạn</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Nhấn vào đơn hàng để xem chi tiết đơn đặt hàng của bạn nhé 🛍️✨.
          </p>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
              <p className="text-muted-foreground">
                Chưa có đơn nào ở đây. Nếu bạn từng đặt khi chưa đăng nhập, hãy
                bấm nút gộp đơn phía trên — chỉ khi email đặt hàng trùng email
                tài khoản của bạn.
              </p>
              <Button className="mt-6 rounded-xl" asChild>
                <Link href={ROUTES.PRODUCT}>Xem sản phẩm</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map(row => (
                <li key={row.id}>
                  <Link
                    href={`${ROUTES.MY_ORDERS}/${row.id}`}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors",
                      "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center md:justify-between"
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-mono text-sm font-semibold text-foreground">
                        #{row.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-row items-center gap-3 md:flex-col md:items-end">
                      <span className="inline-flex rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {ORDER_STATUS_VI[row.status] ?? row.status}
                      </span>
                      <p className="text-base font-semibold tabular-nums text-foreground">
                        {formatVND(row.finalAmount)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

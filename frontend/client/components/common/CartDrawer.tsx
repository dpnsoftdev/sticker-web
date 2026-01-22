"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useCartStore } from "@/stores/cart.store";
import type { CartItem } from "@/types/cart";
import { formatVND } from "@/stores/cart.store";
import { cn } from "@/lib/utils";

export function CartDrawer({
  trigger,
  onCheckout,
}: {
  trigger: React.ReactNode;
  onCheckout?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const items = useCartStore(s => s.items);
  const itemCount = useCartStore(s => s.getItemCount());
  const subtotal = useCartStore(s => s.getSubtotal());

  const onIncrement = useCartStore(s => s.incrementQuantity);
  const onDecrement = useCartStore(s => s.decrementQuantity);
  const onRemove = useCartStore(s => s.removeItem);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      {/* right drawer */}
      <SheetContent
        side="right"
        className={cn(
          "p-0",
          "w-full sm:max-w-[480px]",
          "border-l border-border bg-background"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="flex items-start justify-between p-4">
            <div>
              <SheetHeader className="space-y-1">
                <SheetTitle className="text-2xl font-semibold text-foreground">
                  Giỏ hàng của bạn
                </SheetTitle>
              </SheetHeader>
              <p className="mt-1 text-sm text-muted-foreground">
                {itemCount === 0 ? "Giỏ hàng trống" : `${itemCount} sản phẩm`}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setOpen(false)}
              aria-label="Đóng giỏ hàng"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex h-[calc(100vh-72px)] flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map(line => (
                  <CartLineItem
                    key={line.cartItemId}
                    item={line}
                    onIncrement={() => onIncrement(line.cartItemId)}
                    onDecrement={() => onDecrement(line.cartItemId)}
                    onRemove={() => onRemove(line.cartItemId)}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Footer (sticky) */}
            <div className="sticky bottom-0 border-t border-border bg-background p-4">
              <div className="flex items-end justify-between">
                <div className="text-xl font-semibold text-foreground">
                  Tổng cộng:
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatVND(subtotal)}
                </div>
              </div>

              <Separator className="my-4" />

              <Button
                className="h-14 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setOpen(false);
                  onCheckout?.();
                }}
              >
                Đặt hàng ngay
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmptyCart() {
  return (
    <div className="flex h-[calc(100vh-88px)] flex-col items-center justify-center px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="mt-6 text-base font-medium text-foreground">
        Giỏ hàng của bạn đang trống
      </p>
    </div>
  );
}

function CartLineItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onNavigate: () => void;
}) {
  const img = item.image || "/images/placeholder.png";
  const price = item.campaignPrice ?? item.price ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-start gap-4">
        <Link
          href={`/products/${item.sku ?? item.productId}`}
          onClick={onNavigate}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border"
          aria-label={item.productName ?? "Sản phẩm"}
        >
          <Image
            src={img}
            alt={item.productName ?? "Product"}
            fill
            className="object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground line-clamp-2">
                <span className="mr-2">x{item.quantity}</span>
                {item.productName ?? "Sản phẩm"}
              </div>

              {item.variantName && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Phân loại: {item.variantName}
                </p>
              )}

              <p className="mt-2 text-sm font-bold text-primary">
                {formatVND(price)}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-red-600 hover:text-red-600"
              onClick={onRemove}
              aria-label="Xóa sản phẩm"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-2 inline-flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onDecrement}
              aria-label="Giảm số lượng"
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <div className="w-6 text-center text-xs font-semibold text-foreground">
              {item.quantity}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onIncrement}
              aria-label="Tăng số lượng"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

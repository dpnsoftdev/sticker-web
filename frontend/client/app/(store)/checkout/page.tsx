"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tag, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";
import {
  APP_NAME,
  CHECKOUT_SUCCESS_SESSION_KEY,
  PAYMENT_METHOD,
  PLACEHOLDER_IMAGE,
  ROUTES,
  BILL_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/constants";
import { PAYMENT_METHODS } from "@/features/contact/contact.data";
import { orderApi } from "@/features/order/order.api";
import type { CartItem } from "@/types/cart";
import type { PaymentMethod } from "@/types/order";
import { formatVND, getUnitPrice } from "@/lib/utils";
import {
  normalizeVietnamPhone,
  validateDisplayName,
  validateEmailBasic,
  validateHttpUrl,
  validateRequiredTrim,
  validateVietnamPhoneRequired,
  VALIDATION_MESSAGES_VI,
} from "@/lib/validation";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore(s => s.items);
  const subtotal = useCartStore(s => s.getSubtotal());
  const {
    contact_info,
    shipping_info,
    promotion_code,
    payment_info,
    setContactInfo,
    setShippingInfo,
    setPromotionCode,
    setPaymentInfo,
  } = useCheckoutStore();

  const [socialLink, setSocialLink] = useState(contact_info?.social_link ?? "");
  const [email, setEmail] = useState(contact_info?.email ?? "");
  const [phone, setPhone] = useState(contact_info?.phone ?? "");
  const [receiverName, setReceiverName] = useState(
    shipping_info?.receiver_name ?? ""
  );
  const [receiverPhone, setReceiverPhone] = useState(
    shipping_info?.receiver_phone ?? ""
  );
  const [address, setAddress] = useState(shipping_info?.address ?? "");
  const [notes, setNotes] = useState(shipping_info?.notes ?? "");
  const [discountCode, setDiscountCode] = useState(promotion_code ?? "");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "deposit">(
    payment_info?.plan_type ?? "full"
  );

  const storeMethodToId = (method: string | undefined): string => {
    const map: Record<string, string> = {
      [PAYMENT_METHOD.BANK_TRANSFER]: "tpbank",
      [PAYMENT_METHOD.MOMO]: "momo",
      [PAYMENT_METHOD.PAYPAL]: "paypal",
    };
    return method && map[method] ? map[method] : PAYMENT_METHODS[0].id;
  };

  const [paymentMethod, setPaymentMethod] = useState<string>(
    storeMethodToId(payment_info?.method)
  );
  /** Data URL (base64) for preview and for API; null when no file selected. */
  const [billImageDataUrl, setBillImageDataUrl] = useState<string | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      router.replace(ROUTES.HOME);
    }
  }, [items.length, router]);

  const selectedPayment = PAYMENT_METHODS.find(m => m.id === paymentMethod);

  const copyPaymentInfo = () => {
    if (selectedPayment) {
      void navigator.clipboard.writeText(selectedPayment.value);
    }
  };

  const onBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setBillImageDataUrl(null);
      return;
    }
    if (file.size > BILL_IMAGE_MAX_SIZE_BYTES) {
      toast.error("File quá lớn", {
        description:
          "Bill chuyển khoản phải nhỏ hơn 5MB. Vui lòng chọn file khác.",
      });
      e.target.value = "";
      setBillImageDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      setBillImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const depositAmount = Math.floor(subtotal * 0.5);
  const total = paymentPlan === "deposit" ? depositAmount : subtotal;

  const paymentMethodToStore = (id: string): PaymentMethod => {
    const map: Record<string, PaymentMethod> = {
      tpbank: PAYMENT_METHOD.BANK_TRANSFER,
      momo: PAYMENT_METHOD.MOMO,
      paypal: PAYMENT_METHOD.PAYPAL,
    };
    return map[id] ?? (PAYMENT_METHOD.BANK_TRANSFER as PaymentMethod);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const urlCheck = validateHttpUrl(socialLink);
    if (!urlCheck.ok) {
      toast.error(urlCheck.message);
      return;
    }
    const emailCheck = validateEmailBasic(email);
    if (!emailCheck.ok) {
      toast.error(emailCheck.message);
      return;
    }
    const contactPhoneCheck = validateVietnamPhoneRequired(phone);
    if (!contactPhoneCheck.ok) {
      toast.error(contactPhoneCheck.message);
      return;
    }
    const receiverNameCheck = validateDisplayName(receiverName);
    if (!receiverNameCheck.ok) {
      toast.error(receiverNameCheck.message);
      return;
    }
    const receiverPhoneCheck = validateVietnamPhoneRequired(receiverPhone);
    if (!receiverPhoneCheck.ok) {
      toast.error(receiverPhoneCheck.message);
      return;
    }
    const addressCheck = validateRequiredTrim(
      address,
      VALIDATION_MESSAGES_VI.addressRequired
    );
    if (!addressCheck.ok) {
      toast.error(addressCheck.message);
      return;
    }

    const phoneNorm = normalizeVietnamPhone(phone);
    const receiverPhoneNorm = normalizeVietnamPhone(receiverPhone);

    setContactInfo({
      social_link: socialLink,
      email,
      phone: phoneNorm,
    });
    setShippingInfo({
      receiver_name: receiverName.trim(),
      receiver_phone: receiverPhoneNorm,
      address: address.trim(),
      notes: notes || undefined,
    });
    setPromotionCode(discountCode || null);
    setPaymentInfo({
      plan_type: paymentPlan,
      method: paymentMethodToStore(paymentMethod),
      bill_image: billImageDataUrl ?? null,
    });

    if (selectedPayment && !billImageDataUrl) {
      toast.error("Vui lòng đăng bill chuyển khoản", {
        description: "Bill chuyển khoản là bắt buộc trước khi đặt hàng.",
      });
      return;
    }

    if (isSubmitting) return;

    const itemsWithVariant = items.filter(
      (item): item is CartItem & { variantId: string } =>
        !!item.variantId && item.variantId.length > 0
    );

    // if (itemsWithVariant.length !== items.length) {
    //   toast.error("Giỏ hàng không hợp lệ", {
    //     description:
    //       "Một số sản phẩm thiếu thông tin phân loại. Vui lòng xóa và thêm lại từ trang sản phẩm.",
    //   });
    //   return;
    // }

    setIsSubmitting(true);

    const payload = {
      contact: {
        social_link: socialLink.trim(),
        email: email.trim(),
        phone: phoneNorm,
      },
      shippingInfo: {
        receiver_name: receiverName.trim(),
        receiver_phone: receiverPhoneNorm,
        address: address.trim(),
        notes: notes || undefined,
      },
      payment: {
        plan_type: paymentPlan,
        method: paymentMethodToStore(paymentMethod),
        bill_image: billImageDataUrl ?? null,
      },
      promotionCode: discountCode?.trim() || null,
      subtotalAmount: subtotal,
      discountAmount: 0,
      finalAmount: total,
      items: itemsWithVariant.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await orderApi.createOrder(payload);
      if (res.success && res.data) {
        toast.success("Đơn hàng đã được tạo", {
          description: "Trạng thái: Chờ xác nhận",
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            CHECKOUT_SUCCESS_SESSION_KEY,
            crypto.randomUUID()
          );
        }
        router.push(ROUTES.CHECKOUT_SUCCESS);
      } else {
        toast.error(res.message ?? "Không thể tạo đơn hàng");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      toast.error(message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6 md:py-8">
        <Link
          href={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tiếp tục mua sắm
        </Link>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">
              Thông tin liên hệ
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Link Facebook / Instagram{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="url"
                  placeholder="https://..."
                  value={socialLink}
                  onChange={e => setSocialLink(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Số điện thoại <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="090..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">
              Thông tin nhận hàng
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Họ và tên người nhận{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Số điện thoại nhận hàng{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="090..."
                  value={receiverPhone}
                  onChange={e => setReceiverPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Địa chỉ nhận hàng <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="Số nhà, đường, phường, quận, thành phố (đơn vị hành chính mới)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Ghi chú (Tùy chọn)
                </label>
                <textarea
                  placeholder="Ví dụ: Giao ngoài giờ hành chính, gọi trước khi giao..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground placeholder:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">Thanh toán</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hình thức thanh toán
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4">
                <input
                  type="radio"
                  name="plan"
                  checked={paymentPlan === "full"}
                  onChange={() => setPaymentPlan("full")}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">
                  Thanh toán đủ 100% ({formatVND(subtotal)})
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4">
                <input
                  type="radio"
                  name="plan"
                  checked={paymentPlan === "deposit"}
                  onChange={() => setPaymentPlan("deposit")}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">
                  Đặt cọc 50% ({formatVND(depositAmount)}) - Hẹn hoàn cọc trong
                  1 tháng
                </span>
              </label>
            </div>

            <p className="mt-6 text-sm font-medium text-foreground">
              Chọn phương thức thanh toán
            </p>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              name="payment-method"
            >
              <SelectTrigger
                className="mt-2 rounded-xl"
                id="payment-method-trigger"
                aria-labelledby="payment-method-label"
              >
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem
                    key={method.id}
                    value={method.id}
                    id={`payment-method-${method.id}`}
                  >
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPayment && (
              <>
                <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">
                          {selectedPayment.label}
                        </span>
                      </p>
                      <p className="break-all text-muted-foreground">
                        {selectedPayment.value}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg"
                      onClick={copyPaymentInfo}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border-2 border-dashed border-pink-300 bg-pink-50/50 p-4 dark:border-pink-700 dark:bg-pink-950/20">
                  <label
                    htmlFor="bill-upload"
                    className="block text-sm font-medium text-foreground"
                  >
                    Đăng bill chuyển khoản{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="bill-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onBillChange}
                    className="mt-2 h-14 cursor-pointer rounded-xl border-border file:pointer-cursor file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:p-2 file:text-sm file:text-primary-foreground"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    * Bắt buộc gửi bill trước khi bấm đặt hàng ngay (tối đa 5MB)
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Cart summary */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Giỏ hàng</h2>
            <ul className="mt-4 space-y-3">
              {items.map(item => (
                <CheckoutLineItem key={item.cartItemId} item={item} />
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Mã giảm giá
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Nhập mã giảm giá"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value)}
              />
              <Button type="button" variant="outline" className="rounded-xl">
                Áp dụng
              </Button>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span className="font-medium">{formatVND(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold text-primary-bold">
              <span>Tổng cộng:</span>
              <span>{formatVND(total)}</span>
            </div>
          </section>

          {/* Agreement & Submit */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={e => setAgreedToPolicy(e.target.checked)}
                className="checkbox-white-check h-5 w-5 shrink-0 rounded-full border-2 border-border accent-primary cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                Tôi đã đọc kỹ thông tin sản phẩm và đồng ý với{" "}
                <Link
                  href={ROUTES.POLICY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  chính sách đặt hàng
                </Link>{" "}
                của {APP_NAME}.
              </span>
            </label>
            <Button
              type="submit"
              variant={"default"}
              disabled={
                !agreedToPolicy ||
                isSubmitting ||
                (!!selectedPayment && !billImageDataUrl)
              }
              className="mt-4 h-14 w-full rounded-2xl text-lg font-semibold"
            >
              {isSubmitting ? "Đang xử lý..." : "Đặt hàng ngay"}
            </Button>
          </section>
        </form>
      </div>
    </div>
  );
}

function CheckoutLineItem({ item }: { item: CartItem }) {
  const img = item.image ?? PLACEHOLDER_IMAGE;
  const price = getUnitPrice(item);
  const lineTotal = price * item.quantity;

  return (
    <li className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={img}
          alt={item.productName ?? "Product"}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          <span className="text-muted-foreground">x{item.quantity}</span>{" "}
          {item.productName ?? "Sản phẩm"}
        </p>
        {item.variantName && (
          <p className="text-xs text-muted-foreground">{item.variantName}</p>
        )}
      </div>
      <p className="text-sm font-bold text-primary-bold">
        {formatVND(lineTotal)}
      </p>
    </li>
  );
}

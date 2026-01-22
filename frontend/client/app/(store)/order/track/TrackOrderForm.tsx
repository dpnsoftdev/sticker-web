"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizePhone(v: string) {
  return v.replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

export default function TrackOrderForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [phone, setPhone] = React.useState(sp.get("phone") ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-left md:p-8"
      onSubmit={e => {
        e.preventDefault();
        const value = normalizePhone(phone);

        // Basic validation: VN phone numbers commonly 10 digits (0xxxxxxxxx)
        if (!value) {
          setError("Vui lòng nhập số điện thoại.");
          return;
        }
        if (!/^(0\d{9}|\+84\d{9})$/.test(value)) {
          setError(
            "Số điện thoại không hợp lệ. Ví dụ: 0395939035 hoặc +84395939035"
          );
          return;
        }

        setError(null);

        // ✅ Use querystring so it’s shareable + SEO friendly for indexing page itself
        startTransition(() => {
          router.push(`/order/track?phone=${encodeURIComponent(value)}`);
        });
      }}
    >
      <label className="block text-sm font-medium text-foreground">
        Số điện thoại
      </label>

      <Input
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Nhập số điện thoại đã dùng khi đặt hàng"
        className="mt-2 h-11 rounded-xl"
        inputMode="tel"
        autoComplete="tel"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        className="mt-5 h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={pending}
      >
        {pending ? "Đang tra cứu..." : "Tra cứu"}
      </Button>
    </form>
  );
}

import type { Metadata } from "next";
import TrackOrderForm from "./TrackOrderForm";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng – Dango's Corner",
  description:
    "Nhập số điện thoại đã dùng khi đặt hàng để tra cứu trạng thái đơn hàng tại Dango's Corner.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TrackOrderPage() {
  return (
    <main className="bg-background">
      <section className="container mx-auto max-w-3xl px-4 py-16 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
          <span className="text-3xl" aria-hidden>
            📦
          </span>
        </div>

        <h1 className="text-4xl font-semibold text-foreground">
          Tra cứu đơn hàng
        </h1>
        <p className="mt-4 text-muted-foreground">
          Nhập số điện thoại để tra cứu đơn hàng của bạn
        </p>

        <div className="mt-10">
          <TrackOrderForm />
        </div>
      </section>
    </main>
  );
}

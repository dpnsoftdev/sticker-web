import type { Metadata } from "next";
import { POLICY_SECTIONS } from "@/features/policy/policy.data";

export const metadata: Metadata = {
  title: "Chính sách mua hàng – Dango Corner",
  description:
    "Tổng hợp các chính sách đặt hàng, thanh toán và vận chuyển khi mua hàng tại Dango Corner.",
};

export default function PolicyPage() {
  return (
    <main className="bg-background">
      <section className="container mx-auto max-w-4xl px-4 py-14">
        {/* Page heading */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-semibold text-foreground">Chính sách</h1>
          <p className="mt-4 text-muted-foreground">
            Các chính sách quan trọng khi mua hàng tại Dango Corner
          </p>
        </header>

        {/* Policy sections */}
        <div className="space-y-6">
          {POLICY_SECTIONS.map(section => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <h2
                id={section.id}
                className="mb-4 text-lg font-semibold text-foreground"
              >
                {section.title}
              </h2>

              <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                {section.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              {section.note && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {section.note}
                </p>
              )}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

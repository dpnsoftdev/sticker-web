"use client";

import {
  Copy,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Users,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import {
  PAYMENT_METHODS,
  CONTACT_INFO,
  SOCIAL_LINKS,
  TRACKING_GROUP,
} from "@/features/contact/contact.data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function ContactClient() {
  return (
    <main className="bg-background">
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-semibold text-foreground">Thông tin</h1>
          <p className="mt-4 text-muted-foreground">
            Dango&apos;s Corner luôn sẵn sàng hỗ trợ bạn 🤍
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment card */}
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg border border-border p-2">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Thông tin thanh toán
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nhấn để copy thông tin thanh toán (bao gồm STK và tên thụ
                  hưởng)
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={async () => {
                    try {
                      await copyToClipboard(m.value);
                      toast(`Thông tin ${m.label} đã được copy vào clipboard`, {
                        position: "bottom-right",
                      });
                    } catch {
                      toast("Không thể copy", { position: "bottom-right" });
                    }
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl border border-border px-4 py-4 text-left transition",
                    "hover:border-primary/40 hover:bg-accent/40 cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      m.highlight ? "text-white" : "text-foreground"
                    )}
                  >
                    {m.label}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs",
                        m.highlight ? "text-white/80" : "text-muted-foreground"
                      )}
                    >
                      Copy
                    </span>
                    <Copy
                      className={cn(
                        "h-4 w-4",
                        m.highlight ? "text-white" : "text-muted-foreground"
                      )}
                    />
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Contact card */}
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground">
              Thông tin liên hệ
            </h2>

            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Điện thoại
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {CONTACT_INFO.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {CONTACT_INFO.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Địa chỉ</p>
                  <p className="text-sm text-muted-foreground">
                    {CONTACT_INFO.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Optional CTA */}
            <div className="mt-8">
              <Link
                href="https://www.facebook.com/share/g/1G6e1XqsyZ/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="rounded-xl">
                  Nhắn tin hỗ trợ
                </Button>
              </Link>
            </div>
          </section>

          {/* Socials */}
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-3xl font-semibold text-foreground">
              Mạng xã hội
            </h2>

            <div className="mt-6 space-y-6">
              {SOCIAL_LINKS.map(s => (
                <Link
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4"
                  aria-label={s.label}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/30">
                    <s.Icon className="h-5 w-5 text-primary" />
                  </span>

                  <span
                    className={[
                      "text-lg transition-colors",
                      "text-foreground/90 group-hover:text-primary",
                    ].join(" ")}
                  >
                    {s.value}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Tracking group */}
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl">
                <Users className="h-5 w-5 text-primary" />
              </span>

              <div>
                <h2 className="text-3xl font-semibold text-foreground">
                  {TRACKING_GROUP.title}
                </h2>
                <p className="mt-3 text-muted-foreground">
                  {TRACKING_GROUP.description}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href={TRACKING_GROUP.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Facebook className="h-5 w-5 text-primary-foreground" />
                {TRACKING_GROUP.ctaLabel}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

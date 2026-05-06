"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthPanels, AuthSplitShell } from "@/components/common/AuthModal";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <Link
          href={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Về trang chủ
        </Link>
        <AuthSplitShell className="border border-border shadow-xl">
          <AuthPanels
            defaultView="signin"
            onAuthenticated={() => router.push("/")}
          />
        </AuthSplitShell>
      </div>
    </div>
  );
}

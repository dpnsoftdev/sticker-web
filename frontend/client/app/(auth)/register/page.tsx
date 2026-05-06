"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthPanels, AuthSplitShell } from "@/components/common/AuthModal";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <AuthSplitShell className="border border-border shadow-xl">
          <AuthPanels
            defaultView="register"
            onAuthenticated={() => router.push("/")}
          />
        </AuthSplitShell>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Bạn đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-[#134E48] underline-offset-4 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

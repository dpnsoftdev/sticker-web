"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authService, getAuthErrorMessage } from "@/features/auth/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  validateEmailBasic,
  validateDisplayName,
  validateNewPasswordPair,
  validateVietnamPhoneRequired,
} from "@/lib/validation";
import { APP_NAME } from "@/lib/constants";

function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (local.length <= 2) return `${local[0] ?? ""}••@${domain}`;
  return `${local.slice(0, 2)}•••@${domain}`;
}

export type AuthView = "signin" | "register";

export type AuthPanelsProps = {
  defaultView?: AuthView;
  onAuthenticated?: () => void;
  className?: string;
};

export type AuthSplitShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra wrapper classes for the outer split (e.g. shadow, max-width) */
  shellClassName?: string;
};

/**
 * Sample-style split: form left (~46%), hero image right (~54%).
 * On small screens the image stacks on top.
 */
export function AuthSplitShell({
  children,
  className,
  shellClassName,
}: AuthSplitShellProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-background max-sm:rounded-xl sm:flex-row sm:items-stretch",
        shellClassName,
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center p-6 max-sm:px-4 max-sm:pb-8 max-sm:pt-6 sm:p-10 lg:max-w-[46%] lg:basis-[46%]">
        {children}
      </div>

      <div className="relative order-first aspect-[4/3] w-full max-sm:aspect-[16/10] max-sm:max-h-[min(38vh,260px)] sm:order-none sm:max-h-none sm:aspect-auto sm:min-h-[420px] sm:flex-1 sm:self-stretch">
        <Image
          src="/auth_login.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 54vw"
          priority
        />
        {/* Mobile only: ties hero to form + improves contrast */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent sm:hidden"
          aria-hidden
        />
      </div>
    </div>
  );
}

/**
 * Sign-in / register with opacity crossfade; Vietnamese copy for sticker shop.
 */
export function AuthPanels({
  defaultView = "signin",
  onAuthenticated,
  className,
}: AuthPanelsProps) {
  const router = useRouter();
  const [view, setView] = React.useState<AuthView>(defaultView);

  React.useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [signInLoading, setSignInLoading] = React.useState(false);

  const [regName, setRegName] = React.useState("");
  const [regPhone, setRegPhone] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regConfirm, setRegConfirm] = React.useState("");
  const [regStep, setRegStep] = React.useState<1 | 2>(1);
  const [registrationSessionId, setRegistrationSessionId] = React.useState<
    string | null
  >(null);
  const [regOtp, setRegOtp] = React.useState("");
  const [regLoading, setRegLoading] = React.useState(false);
  const [regVerifyLoading, setRegVerifyLoading] = React.useState(false);

  const resetRegistrationFlow = React.useCallback(() => {
    setRegStep(1);
    setRegistrationSessionId(null);
    setRegOtp("");
    setRegName("");
    setRegPhone("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
  }, []);

  const finishSuccess = React.useCallback(() => {
    onAuthenticated?.();
    router.refresh();
  }, [onAuthenticated, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const emailCheck = validateEmailBasic(signInEmail);
    if (!emailCheck.ok) {
      toast.error(emailCheck.message);
      return;
    }
    setSignInLoading(true);
    try {
      const res = await signIn("credentials", {
        email: signInEmail.trim(),
        password: signInPassword,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Email hoặc mật khẩu không đúng.");
        return;
      }
      toast.success("Đăng nhập thành công.");
      finishSuccess();
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleRegisterStart(e: React.FormEvent) {
    e.preventDefault();
    const nameCheck = validateDisplayName(regName);
    if (!nameCheck.ok) {
      toast.error(nameCheck.message);
      return;
    }
    const phoneCheck = validateVietnamPhoneRequired(regPhone);
    if (!phoneCheck.ok) {
      toast.error(phoneCheck.message);
      return;
    }
    const emailCheck = validateEmailBasic(regEmail);
    if (!emailCheck.ok) {
      toast.error(emailCheck.message);
      return;
    }
    const pwdCheck = validateNewPasswordPair(regPassword, regConfirm);
    if (!pwdCheck.ok) {
      toast.error(pwdCheck.message);
      return;
    }
    setRegLoading(true);
    try {
      const { registrationSessionId: sid } = await authService.registerStart({
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      setRegistrationSessionId(sid);
      setRegStep(2);
      setRegOtp("");
      toast.success("Đã gửi mã xác nhận đến email của bạn.");
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setRegLoading(false);
    }
  }

  async function handleRegisterVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!registrationSessionId) {
      toast.error("Phiên đăng ký không hợp lệ. Vui lòng nhập lại thông tin.");
      resetRegistrationFlow();
      return;
    }
    const otp = regOtp.replace(/\D/g, "");
    if (otp.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setRegVerifyLoading(true);
    try {
      await authService.registerVerify({
        registrationSessionId,
        otp,
      });
      const res = await signIn("credentials", {
        email: regEmail.trim(),
        password: regPassword,
        redirect: false,
      });
      if (res?.error) {
        toast.error(
          "Đã tạo tài khoản. Vui lòng đăng nhập bằng email và mật khẩu."
        );
        setView("signin");
        setSignInEmail(regEmail.trim());
        resetRegistrationFlow();
        return;
      }
      toast.success("Chào mừng bạn!");
      resetRegistrationFlow();
      finishSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 410) {
        toast.error(getAuthErrorMessage(err));
        resetRegistrationFlow();
        return;
      }
      toast.error(getAuthErrorMessage(err));
    } finally {
      setRegVerifyLoading(false);
    }
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="grid w-full min-w-0">
        {/* Đăng nhập */}
        <div
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            view === "signin"
              ? "relative z-10 opacity-100"
              : "pointer-events-none opacity-0"
          )}
          aria-hidden={view !== "signin"}
        >
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
              Chào mừng bạn <br />
              đến với {APP_NAME}
            </h2>
            <p className="text-sm leading-relaxed text-neutral-500">
              Trải nghiệm mua sắm sticker và sáng tạo theo cách của bạn.
            </p>
          </div>
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label
                htmlFor="auth-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={signInEmail}
                onChange={e => setSignInEmail(e.target.value)}
                required
                placeholder="youremail@example.com"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="auth-password"
                className="text-sm font-medium text-foreground"
              >
                Mật khẩu
              </label>
              <Input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                value={signInPassword}
                onChange={e => setSignInPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={signInLoading}
              className={cn(
                "h-12 w-full rounded-2xl text-base font-medium shadow-none"
              )}
            >
              {signInLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang đăng nhập…
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
            <p className="text-center text-sm text-neutral-500">
              Bạn chưa có tài khoản?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => {
                  resetRegistrationFlow();
                  setView("register");
                }}
              >
                Đăng ký ngay
              </Button>
            </p>
          </form>
        </div>

        {/* Đăng ký */}
        <div
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            view === "register"
              ? "relative z-10 opacity-100"
              : "pointer-events-none opacity-0"
          )}
          aria-hidden={view !== "register"}
        >
          <div className="mb-6 space-y-2">
            {regStep === 1 ? (
              <>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                  Tạo tài khoản mới
                </h2>
                <p className="text-sm leading-relaxed text-neutral-500">
                  Vài bước đơn giản để bắt đầu mua sắm cùng chúng tôi.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                  Nhập mã xác nhận
                </h2>
                <p className="text-sm leading-relaxed text-neutral-500">
                  Mã gồm 6 chữ số đã gửi đến{" "}
                  <span className="font-medium text-foreground">
                    {maskEmail(regEmail)}
                  </span>
                  .
                </p>
              </>
            )}
          </div>
          {regStep === 1 ? (
            <form
              onSubmit={handleRegisterStart}
              className="flex flex-col gap-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="auth-reg-name"
                  className="text-sm font-medium text-foreground"
                >
                  Họ và tên
                </label>
                <Input
                  id="auth-reg-name"
                  autoComplete="name"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                  placeholder="Tên hiển thị của bạn"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-reg-phone"
                  className="text-sm font-medium text-foreground"
                >
                  Số điện thoại
                </label>
                <Input
                  id="auth-reg-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  required
                  placeholder="Ví dụ: 0395939035"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-reg-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <Input
                  id="auth-reg-email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                  placeholder="tenban@email.com"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-reg-password"
                  className="text-sm font-medium text-foreground"
                >
                  Mật khẩu
                </label>
                <Input
                  id="auth-reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Ít nhất 8 ký tự"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="auth-reg-confirm"
                  className="text-sm font-medium text-foreground"
                >
                  Xác nhận mật khẩu
                </label>
                <Input
                  id="auth-reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  required
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
              <Button
                type="submit"
                disabled={regLoading}
                className={cn(
                  "h-12 w-full rounded-2xl text-base font-medium shadow-none"
                )}
              >
                {regLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Đang gửi mã…
                  </>
                ) : (
                  "Gửi mã xác nhận"
                )}
              </Button>
              <p className="text-center text-sm text-neutral-500">
                Bạn đã có tài khoản?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => setView("signin")}
                >
                  Đăng nhập
                </Button>
              </p>
            </form>
          ) : (
            <form
              onSubmit={handleRegisterVerify}
              className="flex flex-col gap-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="auth-reg-otp"
                  className="text-sm font-medium text-foreground"
                >
                  Mã OTP
                </label>
                <Input
                  id="auth-reg-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={regOtp}
                  onChange={e =>
                    setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  placeholder="••••••"
                  className={cn(
                    "text-center font-mono text-lg tracking-[0.35em]"
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={regVerifyLoading}
                className={cn(
                  "h-12 w-full rounded-2xl text-base font-medium shadow-none"
                )}
              >
                {regVerifyLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Đang xác nhận…
                  </>
                ) : (
                  "Xác nhận và tạo tài khoản"
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => {
                  setRegStep(1);
                  setRegistrationSessionId(null);
                  setRegOtp("");
                }}
              >
                Quay lại chỉnh sửa thông tin
              </Button>
              <p className="text-center text-sm text-neutral-500">
                Bạn đã có tài khoản?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    resetRegistrationFlow();
                    setView("signin");
                  }}
                >
                  Đăng nhập
                </Button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startWith?: AuthView;
  openSession?: number;
};

export function AuthModal({
  open,
  onOpenChange,
  startWith = "signin",
  openSession = 0,
}: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[min(100vw-1rem,1040px)] max-w-[1040px] gap-0 border-0 bg-transparent p-3 shadow-none sm:p-4",
          "max-sm:p-2 max-sm:pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          // Mobile: form có thể cuộn khi nội dung cao / bàn phím
          "max-sm:max-h-[min(94vh,780px)] max-sm:overflow-y-auto max-sm:overscroll-contain",
          // Desktop trở lên: không cuộn khung modal
          "sm:max-h-none sm:overflow-visible"
        )}
      >
        <DialogTitle className="sr-only">
          Đăng nhập hoặc đăng ký tài khoản khách hàng
        </DialogTitle>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl max-sm:rounded-xl max-sm:shadow-xl">
          <AuthSplitShell>
            <AuthPanels
              key={openSession}
              defaultView={startWith}
              onAuthenticated={() => onOpenChange(false)}
            />
          </AuthSplitShell>
        </div>
      </DialogContent>
    </Dialog>
  );
}

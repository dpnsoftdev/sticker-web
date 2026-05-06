"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { flushSync } from "react-dom";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from "firebase/auth";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TrackOrderList } from "./TrackOrderList";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import {
  orderTrackApi,
  type OrderTrackPublicOrder,
  type VerifyEmailTrackFailData,
  type VerifyPhoneAuthData,
} from "@/features/order/orderTrack.api";
import { translateOrderTrackApiMessage } from "@/features/order/orderTrack.i18n";
import {
  firebaseAuthErrorVi,
  isOtpConfirmSessionExpiredError,
  normalizePhone,
  shouldUseVisibleRecaptchaOnNextSmsSend,
  toFirebaseE164,
} from "@/lib/firebaseUtils";

type TrackTab = "email" | "phone";

const TOAST_OPTIONS = { position: "bottom-right" as const };

function recaptchaContainerId(key: number) {
  return `recaptcha-container-${key}`;
}

export default function TrackOrderForm() {
  const searchParams = useSearchParams();
  /** `?devTrackOrder` — gọi API verify với bypassAuth (không OTP / Firebase) */
  const devTrackOrder = searchParams.has("devTrackOrder");

  const [trackTab, setTrackTab] = React.useState<TrackTab>("email");
  const [flowPhase, setFlowPhase] = React.useState<"input" | "otp" | "done">(
    "input"
  );
  const [email, setEmail] = React.useState("");
  const [emailOtp, setEmailOtp] = React.useState("");
  const [orderTrackEmailSessionId, setOrderTrackEmailSessionId] =
    React.useState<string | null>(null);
  const [emailOtpLockedOut, setEmailOtpLockedOut] = React.useState(false);

  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [orders, setOrders] = React.useState<OrderTrackPublicOrder[]>([]);
  const [pending, startTransition] = React.useTransition();
  const [otpConfirmBlocked, setOtpConfirmBlocked] = React.useState(false);
  /** Hiển thị khung reCAPTCHA normal + effect tự gửi SMS sau khi user xác thực. */
  const [smsRecaptchaUseVisibleWidget, setSmsRecaptchaUseVisibleWidget] =
    React.useState(false);
  /** Tăng mỗi lần cần chạy luồng phục hồi (visible reCAPTCHA → tự gửi SMS). */
  const [recoveryAttemptId, setRecoveryAttemptId] = React.useState(0);
  const [visibleCaptchaPending, setVisibleCaptchaPending] =
    React.useState(false);

  const confirmationRef = React.useRef<ConfirmationResult | null>(null);
  const recaptchaRef = React.useRef<RecaptchaVerifier | null>(null);
  /** Bumped so React mounts a fresh DOM node per SMS attempt — Firebase rejects re-using the same element. */
  const [recaptchaMountKey, setRecaptchaMountKey] = React.useState(0);

  const recaptchaMountKeyRef = React.useRef(0);
  const trackTabRef = React.useRef(trackTab);
  React.useEffect(() => {
    trackTabRef.current = trackTab;
  }, [trackTab]);

  const normalizedPhone = React.useMemo(() => normalizePhone(phone), [phone]);
  const phoneForSmsRef = React.useRef(normalizedPhone);

  React.useEffect(() => {
    phoneForSmsRef.current = normalizedPhone;
  }, [normalizedPhone]);

  const validatePhone = () => {
    if (!normalizedPhone) {
      toast.error("Số điện thoại của bạn không hợp lệ.", TOAST_OPTIONS);
      return false;
    }
    if (!/^(0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
      toast.error(
        "Số điện thoại không hợp lệ. Ví dụ: 0395939035 hoặc +84395939035",
        TOAST_OPTIONS
      );
      return false;
    }
    return true;
  };

  const disposeRecaptcha = React.useCallback(() => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* ignore */
    }
    recaptchaRef.current = null;
    if (typeof document !== "undefined") {
      const el = document.getElementById(
        recaptchaContainerId(recaptchaMountKeyRef.current)
      );
      if (el) el.replaceChildren();
    }
  }, []);

  function triggerVisibleRecaptchaRecovery() {
    flushSync(() => {
      disposeRecaptcha();
      recaptchaMountKeyRef.current += 1;
      setRecaptchaMountKey(recaptchaMountKeyRef.current);
    });
    setSmsRecaptchaUseVisibleWidget(true);
    setRecoveryAttemptId(n => n + 1);
  }

  /** Sau lỗi -39 / invalid-app-credential (và tương đương): không toast ngay; bật reCAPTCHA normal — SDK chờ user tích xong rồi gửi SMS. */
  React.useEffect(() => {
    if (recoveryAttemptId === 0) return;

    let stale = false;
    startTransition(async () => {
      if (trackTabRef.current !== "phone") {
        setVisibleCaptchaPending(false);
        return;
      }
      setVisibleCaptchaPending(true);
      try {
        const phoneNorm = phoneForSmsRef.current;
        const e164 = toFirebaseE164(phoneNorm);
        if (!e164) {
          if (!stale) {
            toast.error(
              "Không chuyển được số sang định dạng quốc tế.",
              TOAST_OPTIONS
            );
            setSmsRecaptchaUseVisibleWidget(false);
          }
          return;
        }
        const check = await orderTrackApi.checkPhoneForTrack(phoneNorm);
        if (!check.success) {
          if (!stale) {
            toast.error(
              translateOrderTrackApiMessage(check.message),
              TOAST_OPTIONS
            );
            setSmsRecaptchaUseVisibleWidget(false);
          }
          return;
        }
        if (stale) return;

        const auth = getFirebaseAuth();
        const mountId = recaptchaContainerId(recaptchaMountKeyRef.current);
        disposeRecaptcha();
        recaptchaRef.current = new RecaptchaVerifier(auth, mountId, {
          size: "normal",
        });
        const confirmation = await signInWithPhoneNumber(
          auth,
          e164,
          recaptchaRef.current
        );
        if (stale) return;
        confirmationRef.current = confirmation;
        setOtp("");
        setOtpConfirmBlocked(false);
        setSmsRecaptchaUseVisibleWidget(false);
        setFlowPhase("otp");
        toast.success("Đã gửi mã OTP qua SMS.", TOAST_OPTIONS);
      } catch (err: unknown) {
        if (stale) return;
        toast.error(firebaseAuthErrorVi(err), TOAST_OPTIONS);
        setSmsRecaptchaUseVisibleWidget(false);
      } finally {
        if (!stale) setVisibleCaptchaPending(false);
      }
    });

    return () => {
      stale = true;
      disposeRecaptcha();
    };
  }, [recoveryAttemptId, disposeRecaptcha]);

  React.useEffect(() => {
    return () => {
      try {
        recaptchaRef.current?.clear();
      } catch (err: unknown) {
        console.error("Error clearing recaptcha", err);
      }
      recaptchaRef.current = null;
      if (typeof document !== "undefined") {
        const el = document.getElementById(
          recaptchaContainerId(recaptchaMountKeyRef.current)
        );
        if (el) el.replaceChildren();
      }
    };
  }, []);

  const sendFirebaseCode = () => {
    if (trackTab !== "phone") return;
    if (!validatePhone()) return;
    const e164 = toFirebaseE164(normalizedPhone);

    if (!e164) {
      toast.error(
        "Không chuyển được số sang định dạng quốc tế.",
        TOAST_OPTIONS
      );
      return;
    }

    startTransition(async () => {
      try {
        const check = await orderTrackApi.checkPhoneForTrack(normalizedPhone);
        if (!check.success) {
          toast.error(
            translateOrderTrackApiMessage(check.message),
            TOAST_OPTIONS
          );
          return;
        }

        const auth = getFirebaseAuth();
        flushSync(() => {
          disposeRecaptcha();
          recaptchaMountKeyRef.current += 1;
          setRecaptchaMountKey(recaptchaMountKeyRef.current);
        });
        const mountId = recaptchaContainerId(recaptchaMountKeyRef.current);
        recaptchaRef.current = new RecaptchaVerifier(auth, mountId, {
          size: "invisible",
        });
        const confirmation = await signInWithPhoneNumber(
          auth,
          e164,
          recaptchaRef.current
        );
        confirmationRef.current = confirmation;
        setOtp("");
        setOtpConfirmBlocked(false);
        setFlowPhase("otp");
        toast.success("Đã gửi mã OTP qua SMS.", TOAST_OPTIONS);
      } catch (err: unknown) {
        if (shouldUseVisibleRecaptchaOnNextSmsSend(err)) {
          triggerVisibleRecaptchaRecovery();
        } else {
          toast.error(firebaseAuthErrorVi(err), TOAST_OPTIONS);
        }
      }
    });
  };

  const confirmAndLoadOrders = () => {
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) {
      toast.error("Vui lòng nhập mã 6 số.", TOAST_OPTIONS);
      return;
    }

    startTransition(async () => {
      const confirmation = confirmationRef.current;
      if (!confirmation) {
        triggerVisibleRecaptchaRecovery();
        return;
      }

      try {
        const cred = await confirmation.confirm(code);
        const idToken = await cred.user.getIdToken();
        const res = await orderTrackApi.verifyPhoneAuth({ idToken });
        if (!res.success) {
          toast.error(
            translateOrderTrackApiMessage(res.message),
            TOAST_OPTIONS
          );
          return;
        }
        setOrders((res.data as VerifyPhoneAuthData)?.orders ?? []);
        setFlowPhase("done");
        toast.success(
          translateOrderTrackApiMessage(res.message),
          TOAST_OPTIONS
        );
        try {
          await signOut(getFirebaseAuth());
        } catch {
          /* ignore */
          console.error("Error signing out after confirming phone auth");
        }
        confirmationRef.current = null;
      } catch (err: unknown) {
        if (isOtpConfirmSessionExpiredError(err)) {
          setOtpConfirmBlocked(true);
          confirmationRef.current = null;
          triggerVisibleRecaptchaRecovery();
          return;
        }
        if (shouldUseVisibleRecaptchaOnNextSmsSend(err)) {
          triggerVisibleRecaptchaRecovery();
          return;
        }
        toast.error(firebaseAuthErrorVi(err), TOAST_OPTIONS);
      }
    });
  };

  const resetFlow = () => {
    disposeRecaptcha();
    setTrackTab("email");
    setFlowPhase("input");
    setEmail("");
    setEmailOtp("");
    setOrderTrackEmailSessionId(null);
    setEmailOtpLockedOut(false);
    setPhone("");
    setOtp("");
    setOrders([]);
    setOtpConfirmBlocked(false);
    setSmsRecaptchaUseVisibleWidget(false);
    setRecoveryAttemptId(0);
    confirmationRef.current = null;
  };

  const validateEmail = () => {
    const e = email.trim();
    if (!e) {
      toast.error("Vui lòng nhập email.", TOAST_OPTIONS);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Email không hợp lệ.", TOAST_OPTIONS);
      return false;
    }
    return true;
  };

  const requestEmailTrackOtp = () => {
    if (!validateEmail()) return;
    startTransition(async () => {
      const res = await orderTrackApi.requestEmailForTrack(email.trim());
      if (!res.success) {
        toast.error(translateOrderTrackApiMessage(res.message), TOAST_OPTIONS);
        return;
      }
      const sid = (res.data as { orderTrackEmailSessionId?: string })
        ?.orderTrackEmailSessionId;
      if (!sid) {
        toast.error("Phản hồi máy chủ không hợp lệ.", TOAST_OPTIONS);
        return;
      }
      setOrderTrackEmailSessionId(sid);
      setEmailOtp("");
      setFlowPhase("otp");
      toast.success(translateOrderTrackApiMessage(res.message), TOAST_OPTIONS);
    });
  };

  const verifyEmailTrackOtp = () => {
    const code = emailOtp.replace(/\D/g, "");
    if (code.length !== 6) {
      toast.error("Vui lòng nhập mã 6 số.", TOAST_OPTIONS);
      return;
    }
    if (!orderTrackEmailSessionId) {
      toast.error(
        "Phiên xác thực không hợp lệ. Vui lòng thử lại.",
        TOAST_OPTIONS
      );
      setFlowPhase("input");
      return;
    }

    startTransition(async () => {
      const res = await orderTrackApi.verifyEmailForTrack({
        orderTrackEmailSessionId,
        otp: code,
      });
      if (!res.success) {
        if (res.statusCode === 403) {
          toast.error(
            translateOrderTrackApiMessage(res.message),
            TOAST_OPTIONS
          );
          setOrderTrackEmailSessionId(null);
          setEmailOtp("");
          setEmail("");
          setFlowPhase("input");
          setEmailOtpLockedOut(true);
          return;
        }
        const failData = res.data as VerifyEmailTrackFailData | null;
        const attempts = failData?.attemptsRemaining;
        const base = translateOrderTrackApiMessage(res.message);
        toast.error(
          attempts != null ? `${base} Còn ${attempts} lần thử.` : base,
          TOAST_OPTIONS
        );
        return;
      }
      setOrders((res.data as VerifyPhoneAuthData)?.orders ?? []);
      setFlowPhase("done");
      toast.success(translateOrderTrackApiMessage(res.message), TOAST_OPTIONS);
    });
  };

  const changeTrackTab = (tab: TrackTab) => {
    if (flowPhase === "otp") return;
    if (tab === trackTab) return;
    if (tab === "email") {
      disposeRecaptcha();
      setRecoveryAttemptId(0);
      setSmsRecaptchaUseVisibleWidget(false);
      setOtpConfirmBlocked(false);
      setPhone("");
      setOtp("");
      confirmationRef.current = null;
    } else {
      setEmail("");
      setEmailOtp("");
      setOrderTrackEmailSessionId(null);
    }
    setTrackTab(tab);
  };

  const submitDevTrackOrder = () => {
    if (trackTab !== "phone") return;
    if (!validatePhone()) return;
    startTransition(async () => {
      try {
        const check = await orderTrackApi.checkPhoneForTrack(normalizedPhone);
        if (!check.success) {
          toast.error(
            translateOrderTrackApiMessage(check.message),
            TOAST_OPTIONS
          );
          return;
        }
        const res = await orderTrackApi.verifyPhoneAuth({
          phone: normalizedPhone,
          bypassAuth: true,
        });
        if (!res.success) {
          toast.error(
            translateOrderTrackApiMessage(res.message),
            TOAST_OPTIONS
          );
          return;
        }
        setOrders((res.data as VerifyPhoneAuthData)?.orders ?? []);
        setFlowPhase("done");
        toast.success(
          translateOrderTrackApiMessage(res.message),
          TOAST_OPTIONS
        );
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Đã có lỗi xảy ra.",
          TOAST_OPTIONS
        );
      }
    });
  };

  const handleSubmitTrackOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (trackTab === "email") {
      if (emailOtpLockedOut) return;
      if (flowPhase === "input") requestEmailTrackOtp();
      else verifyEmailTrackOtp();
      return;
    }
    if (devTrackOrder) {
      if (flowPhase === "input") submitDevTrackOrder();
      return;
    }
    if (flowPhase === "input") sendFirebaseCode();
    else confirmAndLoadOrders();
  };

  return (
    <>
      {flowPhase !== "done" && (
        <p className="mt-2 mb-4 text-muted-foreground">
          Nhập email hoặc số điện thoại để tra cứu đơn hàng của bạn
        </p>
      )}
      <div className="mt-4 mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-left md:p-8">
        {/* New node each send (key) so Firebase never re-renders into the same element */}
        <div
          className={
            trackTab === "phone" && smsRecaptchaUseVisibleWidget
              ? "mb-3 space-y-2 rounded-xl border border-border bg-muted/30 px-3 py-3"
              : "contents"
          }
        >
          {trackTab === "phone" && smsRecaptchaUseVisibleWidget && (
            <p className="text-center text-xs text-muted-foreground">
              Vui lòng hoàn tất xác thực reCAPTCHA bên dưới. Sau khi tích thành
              công, hệ thống sẽ tự gửi mã OTP tới số điện thoại đã nhập.
            </p>
          )}
          <div
            key={recaptchaMountKey}
            id={recaptchaContainerId(recaptchaMountKey)}
            className={
              trackTab === "phone" && smsRecaptchaUseVisibleWidget
                ? "flex min-h-[72px] justify-center"
                : "hidden"
            }
            aria-hidden={
              !(trackTab === "phone" && smsRecaptchaUseVisibleWidget)
            }
          />
        </div>

        {flowPhase === "done" ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Đơn hàng của bạn
            </h2>
            <TrackOrderList orders={orders} />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl"
              onClick={resetFlow}
            >
              Quay lại
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmitTrackOrder}>
            <div className="flex flex-col gap-2">
              <div
                role="tablist"
                aria-labelledby="track-method-label"
                aria-label="Cách tra cứu"
                className="relative inline-flex w-fit max-w-full items-end gap-0.5 sm:gap-1"
              >
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent"
                  aria-hidden
                />
                <button
                  type="button"
                  role="tab"
                  aria-selected={trackTab === "email"}
                  disabled={flowPhase === "otp"}
                  onClick={() => changeTrackTab("email")}
                  className={`cursor-pointer group relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-2.5 pb-2.5 pt-1.5 text-sm font-semibold transition-[color] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 ${
                    trackTab === "email"
                      ? "text-primary-bold"
                      : "text-muted-foreground hover:text-primary-bold"
                  }`}
                >
                  <span className="shrink-0 text-inherit">
                    <Mail className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  Email
                  <span
                    className={`pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary-bold transition-opacity duration-200 ease-out ${
                      trackTab === "email"
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-40"
                    }`}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={trackTab === "phone"}
                  disabled={flowPhase === "otp"}
                  onClick={() => changeTrackTab("phone")}
                  className={`cursor-pointer group relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-2.5 pb-2.5 pt-1.5 text-sm font-semibold transition-[color] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 ${
                    trackTab === "phone"
                      ? "text-primary-bold"
                      : "text-muted-foreground hover:text-primary-bold"
                  }`}
                >
                  <span className="shrink-0 text-inherit">
                    <Phone className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  Số điện thoại
                  <span
                    className={`pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary-bold transition-opacity duration-200 ease-out ${
                      trackTab === "phone"
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-40"
                    }`}
                    aria-hidden
                  />
                </button>
              </div>
            </div>

            {emailOtpLockedOut && trackTab === "email" && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Bạn đã nhập sai quá nhiều lần. Vui lòng liên hệ admin để được hỗ
                trợ. Tải lại trang nếu bạn cần thử tra cứu bằng email sau.
              </p>
            )}

            {trackTab === "email" && flowPhase === "input" && (
              <div>
                <input
                  type="email"
                  name="track-email"
                  id="track-email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Nhập email đã dùng khi đặt hàng"
                  className="h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="email"
                  aria-label="Email tra cứu"
                  disabled={emailOtpLockedOut}
                />
              </div>
            )}

            {trackTab === "email" && flowPhase === "otp" && (
              <div>
                <label
                  htmlFor="email-otp"
                  className="block text-sm font-medium text-foreground"
                >
                  Mã OTP (email)
                </label>
                <input
                  type="text"
                  name="email-otp"
                  id="email-otp"
                  value={emailOtp}
                  onChange={e =>
                    setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Mã gồm 6 chữ số"
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  aria-label="Mã OTP email"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Mã đã được gửi tới email của bạn. Kiểm tra cả thư mục spam.
                </p>
              </div>
            )}

            {trackTab === "phone" && (
              <div>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại đã dùng khi đặt hàng"
                  className="h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-label="Số điện thoại"
                  disabled={flowPhase === "otp" && !devTrackOrder}
                />
              </div>
            )}

            {trackTab === "phone" && flowPhase === "otp" && !devTrackOrder && (
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-foreground"
                >
                  Mã OTP (SMS)
                </label>
                <input
                  type="text"
                  name="otp"
                  id="otp"
                  value={otp}
                  onChange={e =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Mã OTP gồm 6 chữ số"
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  aria-label="Mã OTP"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Mã đã được gửi đến số điện thoại của bạn. Nếu không nhận được,
                  hãy thử gửi lại mã.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {trackTab === "email" && flowPhase === "otp" && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-2xl"
                  disabled={pending}
                  onClick={() => {
                    setFlowPhase("input");
                    setEmailOtp("");
                    setOrderTrackEmailSessionId(null);
                  }}
                >
                  Đổi email
                </Button>
              )}
              {trackTab === "phone" &&
                flowPhase === "otp" &&
                !devTrackOrder && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 rounded-2xl"
                      disabled={pending || visibleCaptchaPending}
                      onClick={() => {
                        disposeRecaptcha();
                        setFlowPhase("input");
                        setOtp("");
                        setOtpConfirmBlocked(false);
                        setSmsRecaptchaUseVisibleWidget(false);
                        setRecoveryAttemptId(0);
                        confirmationRef.current = null;
                      }}
                    >
                      Đổi số
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 flex-1 rounded-2xl"
                      disabled={
                        pending ||
                        visibleCaptchaPending ||
                        smsRecaptchaUseVisibleWidget
                      }
                      onClick={() => sendFirebaseCode()}
                    >
                      Gửi lại mã OTP
                    </Button>
                  </>
                )}
              <Button
                type="submit"
                className="h-12 min-w-0 flex-1 rounded-2xl"
                disabled={
                  pending ||
                  visibleCaptchaPending ||
                  (trackTab === "phone" &&
                    flowPhase === "otp" &&
                    !devTrackOrder &&
                    otpConfirmBlocked) ||
                  (trackTab === "phone" &&
                    flowPhase === "input" &&
                    smsRecaptchaUseVisibleWidget) ||
                  (trackTab === "email" && emailOtpLockedOut)
                }
              >
                {pending
                  ? "Đang xử lý..."
                  : trackTab === "email"
                    ? flowPhase === "input"
                      ? "Gửi mã OTP"
                      : "Xác nhận"
                    : flowPhase === "input"
                      ? devTrackOrder
                        ? "Tra cứu (dev)"
                        : "Gửi mã OTP"
                      : "Xác nhận"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

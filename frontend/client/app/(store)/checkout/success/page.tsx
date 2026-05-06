"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";
import { CHECKOUT_SUCCESS_SESSION_KEY, ROUTES } from "@/lib/constants";

const PARTICLE_COUNT = 48;

const FIREWORK_COLORS = [
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f472b6",
  "#a78bfa",
];

let validatedThisNavigation = false;

function runConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.6 }, zIndex: 50 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export default function CheckoutSuccessPage() {
  const [allowed, setAllowed] = useState(false);
  const confettiFiredRef = useRef(false);

  const clearCart = useCartStore(s => s.clearCart);
  const resetCheckout = useCheckoutStore(s => s.reset);

  const router = useRouter();

  useEffect(() => {
    if (validatedThisNavigation) {
      setAllowed(true);
      return;
    }

    const hasFlag = sessionStorage.getItem(CHECKOUT_SUCCESS_SESSION_KEY);

    console.log("hasFlag", hasFlag);
    if (!hasFlag) {
      console.log("pushing to home");
      router.push(ROUTES.HOME);
      return;
    }

    validatedThisNavigation = true;
    sessionStorage.removeItem(CHECKOUT_SUCCESS_SESSION_KEY);
    clearCart();
    resetCheckout();
    requestAnimationFrame(() => setAllowed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!allowed || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    runConfetti();
  }, [allowed]);

  const handleGoHome = () => {
    console.log("pushing to home");
    validatedThisNavigation = false;
    router.push(ROUTES.HOME);
  };

  if (!allowed) return null;

  return (
    <div
      className="fixed inset-0 z-[40] flex flex-col items-center justify-center bg-gradient-to-b from-pink-50/90 to-background px-4 py-8 dark:from-pink-950/20 dark:to-background"
      aria-live="polite"
      aria-label="Order placed successfully"
    >
      <style>{`
        @keyframes firework-burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) var(--rotate) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) var(--rotate) translateY(-120px) scale(0.15);
          }
        }
        @keyframes checkmark-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes message-in {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Firework burst around checkmark */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
          const angle = (i / PARTICLE_COUNT) * 360;
          const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{
                ["--rotate" as string]: `rotate(${angle}deg)`,
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: `firework-burst 1.8s ease-out ${i * 0.018}s forwards`,
              }}
            />
          );
        })}
        <div
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-pink-200/80 shadow-lg dark:bg-pink-500/30"
          style={{
            animation:
              "checkmark-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <span
            className="text-4xl font-bold text-pink-600 dark:text-pink-400"
            aria-hidden
          >
            ✓
          </span>
        </div>
      </div>

      {/* Thank you message */}
      <h1
        className="mt-8 text-center text-3xl font-bold tracking-tight text-foreground"
        style={{ animation: "message-in 0.5s 0.2s ease-out both" }}
      >
        Cảm ơn bạn đã đặt hàng!
      </h1>
      <p
        className="mt-3 max-w-sm text-center text-base text-muted-foreground"
        style={{ animation: "message-in 0.5s 0.35s ease-out both" }}
      >
        Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận và liên hệ sớm
        nhé! 💕
      </p>
      <p
        className="mt-1 text-center text-sm text-muted-foreground/80"
        style={{ animation: "message-in 0.5s 0.45s ease-out both" }}
      >
        Trạng thái: Chờ xác nhận
      </p>

      <Button
        size="lg"
        onClick={handleGoHome}
        className="mt-10 rounded-xl bg-pink-500 px-8 py-6 text-base font-semibold text-white shadow-md transition hover:bg-pink-600 hover:shadow-lg dark:bg-pink-600 dark:hover:bg-pink-700"
        aria-label="Về trang chủ"
        style={{ animation: "message-in 0.5s 0.55s ease-out both" }}
      >
        Về trang chủ
      </Button>
    </div>
  );
}

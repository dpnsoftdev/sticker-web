"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

/** Parse date string (YYYY-MM-DD or ISO) to end-of-day Date if no time part */
function parseEndDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (dateStr.length <= 10) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

function getTimeLeft(
  endDate: Date
): { days: number; hours: number; minutes: number; seconds: number } | null {
  const now = Date.now();
  const end = endDate.getTime();
  if (end <= now) return null;
  let diff = Math.floor((end - now) / 1000);
  const seconds = diff % 60;
  diff = Math.floor(diff / 60);
  const minutes = diff % 60;
  diff = Math.floor(diff / 60);
  const hours = diff % 24;
  const days = Math.floor(diff / 24);
  return { days, hours, minutes, seconds };
}

interface PreorderCountdownProps {
  endDate: string;
  startDate?: string;
}

export function PreorderCountdown({ endDate }: PreorderCountdownProps) {
  const end = useMemo(() => parseEndDate(endDate), [endDate]);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(() =>
    getTimeLeft(end)
  );

  useEffect(() => {
    const t = setInterval(() => {
      const next = getTimeLeft(end);
      setTimeLeft(next);
      if (!next) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [end]);

  if (timeLeft === null) {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-[#fffcf3] px-5 py-4">
        <div className="flex items-center gap-2 text-[#a36b2f]">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">Đã hết hạn đặt hàng</span>
        </div>
      </div>
    );
  }

  const units: { value: number; label: string }[] = [
    { value: timeLeft.days, label: "Ngày" },
    { value: timeLeft.hours, label: "Giờ" },
    { value: timeLeft.minutes, label: "Phút" },
    { value: timeLeft.seconds, label: "Giây" },
  ];

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-[#fffcf3] px-5 py-4">
      <div className="mb-4 flex items-center gap-2 text-[#a36b2f]">
        <Clock className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-sm font-medium">Thời gian còn lại để order</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {units.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums text-[#a36b2f]">
              {String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

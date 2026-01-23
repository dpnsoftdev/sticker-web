"use client";
const notices = [
  "📦 Hàng order về từ 5–15 ngày sau khi kho Trung nhận được hàng 📦",
  "🍮 Hàng pre-order thời gian sản xuất lâu, cân nhắc kỹ trước khi đặt hàng 🍮",
];

export function HeaderNotification() {
  return (
    <div className="sticky top-16 z-40 h-9 w-full bg-accent overflow-hidden">
      <div className="relative flex h-full items-center">
        <div className="animate-marquee flex min-w-full items-center gap-24 px-8">
          <NoticeItem>{notices[0]}</NoticeItem>
          <NoticeItem>{notices[1]}</NoticeItem>

          {/* duplicate for seamless loop */}
          <NoticeItem>{notices[0]}</NoticeItem>
          <NoticeItem>{notices[1]}</NoticeItem>
        </div>
      </div>
    </div>
  );
}

function NoticeItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap text-sm font-medium text-foreground">
      {children}
    </span>
  );
}

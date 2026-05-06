"use client";
const notices = [
  "🚚 Hàng pre-order 2-4 tháng thử thách sự kiên nhẫn 🚚",
  "🫶 Cảm ơn người đẹp đã đặt hàng~ 🫶",
  "🐸 Ví tiền có thể mỏng, nhưng stickers thì phải dày lên 🐸",
  "🫧 Mỗi ngày dán 1 trang sticker, da mặt sẽ đẹp lên 🫧",
];

export function HeaderNotification() {
  return (
    <div className="sticky top-16 z-40 h-9 w-full bg-accent overflow-hidden">
      <div className="relative flex h-full min-h-0 items-center contain-layout">
        <div className="animate-marquee flex w-max shrink-0 items-center gap-24 px-8">
          {notices.map((notice, i) => (
            <NoticeItem key={`a-${i}`}>{notice}</NoticeItem>
          ))}
          {/* duplicate for seamless loop */}
          {notices.map((notice, i) => (
            <NoticeItem key={`b-${i}`}>{notice}</NoticeItem>
          ))}
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

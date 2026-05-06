"use client";

import Image from "next/image";

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95"
      role="status"
      aria-label="Đang tải"
    >
      <div className="animate-bounce">
        <Image
          src="/rabbit.png"
          alt="rabbit"
          width={120}
          height={120}
          className="h-24 w-auto md:h-32"
        />
      </div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-muted-foreground">
        Đợi mình một xíu nhoé... 💖
      </h1>
    </div>
  );
}

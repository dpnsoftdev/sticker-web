import type { Metadata } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const baloo = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  title: {
    default: "Dango's Corner – Stickers & Văn phòng phẩm",
    template: "%s | Dango's Corner",
  },
  description:
    "Dango's Corner chuyên stickers, sticker book, văn phòng phẩm, pre-order và order nội địa Trung từ Taobao, PDD, Douyin, XHS. Nhận pre-order & order theo yêu cầu.",
  openGraph: {
    title: "Dango's Corner – Stickers & Văn phòng phẩm",
    description:
      "Shop stickers, sticker book, văn phòng phẩm và order nội địa Trung theo yêu cầu.",
    images: [
      {
        url: "/dango_icon.png",
        width: 240,
        height: 240,
        alt: "Dango's Corner logo – thỏ trắng và dango ba màu",
      },
    ],
  },
  icons: {
    icon: "/dango_icon.png",
    apple: "/dango_icon.png",
  },
  verification: {
    google: "u5eCObjaYKHIPjnaTCsY4bRmpmiWm0Rf0cZ38Tq4sVc",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

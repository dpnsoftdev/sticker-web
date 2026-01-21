import type { Metadata } from "next";
import { Baloo_2, Fredoka, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
  title: "Sticker Store - Handmade & Collectible Products",
  description: "Order and pre-order store for handmade and collectible products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

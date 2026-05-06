import type { LucideIcon } from "lucide-react";
import { Facebook, Instagram, MessageCircle, Music } from "lucide-react";

export interface SocialLink {
  id: string;
  label: string;
  value: string;
  href: string;
  Icon: LucideIcon;
  highlight?: boolean;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "facebook",
    label: "Facebook",
    value: "Facebook: Dango's corner",
    href: "https://www.facebook.com/lovelydangoxoxo/", // TODO: thay link thật
    Icon: Facebook,
    highlight: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    value: "Instagram: @dangoxoxo",
    href: "https://www.instagram.com/dangoxoxo",
    Icon: Instagram,
  },
  {
    id: "tiktok",
    label: "TikTok",
    value: "TikTok: @lovelyashley444",
    href: "https://www.tiktok.com/@lovelyashley444",
    Icon: Music,
  },
];

export const TRACKING_GROUP = {
  title: "Group cộng đồng stickers",
  description:
    "Tham gia group Facebook để cập nhật hot trends mới nhất về stickers!!",
  ctaLabel: "Dango's corner - Ở đây chỉ có stickers",
  href: "https://www.facebook.com/share/g/1G6e1XqsyZ/",
};

export interface PaymentMethod {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "tpbank",
    label: "TPBank",
    value: "TPBank - STK: 0359 3720 999 - DOAN THI HONG NGUYEN",
  },
  {
    id: "momo",
    label: "Momo",
    value: "Momo - 0963 137 109 - DOAN THI HONG NGUYEN",
  },
  {
    id: "paypal",
    label: "Paypal",
    value: "Paypal - ztamong@gmail.com",
  },
];

export const CONTACT_INFO = {
  phone: "0963 137 109",
  email: "dangoxoxo444@gmail.com",
  address: "TP. Hồ Chí Minh, Việt Nam",
};

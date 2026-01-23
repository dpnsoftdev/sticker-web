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
    value: "Facebook: Dango Corner - Muốn Gì Cũm Coá",
    href: "https://facebook.com", // TODO: thay link thật
    Icon: Facebook,
    highlight: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    value: "Instagram: @dango_corner",
    href: "https://instagram.com/dango_corner",
    Icon: Instagram,
  },
  {
    id: "threads",
    label: "Threads",
    value: "Threads: @dango_corner",
    href: "https://www.threads.net/@dango_corner",
    Icon: MessageCircle,
  },
  {
    id: "tiktok",
    label: "TikTok",
    value: "TikTok: @dango_corner",
    href: "https://www.tiktok.com/@dango_corner",
    Icon: Music,
  },
];

export const TRACKING_GROUP = {
  title: "Group theo dõi đơn hàng",
  description:
    "Tham gia group Facebook để cập nhật tiến độ đơn hàng, nhận thông báo mới nhất và kết nối với cộng đồng Dango Corner!",
  ctaLabel: "Tham gia group theo dõi đơn hàng",
  href: "https://facebook.com", // TODO: thay link group thật
};

export interface PaymentMethod {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "vpbank",
    label: "VPBank",
    value: "VPBank - STK: 0123456789 - NGUYEN VAN A",
    highlight: true,
  },
  {
    id: "momo",
    label: "Momo",
    value: "Momo - 0395 939 035 - NGUYEN VAN A",
  },
  {
    id: "zalopay",
    label: "ZaloPay",
    value: "ZaloPay - 0395 939 035 - NGUYEN VAN A",
  },
];

export const CONTACT_INFO = {
  phone: "0395 939 035",
  email: "dangdangcorner@gmail.com",
  address: "TP. Hồ Chí Minh, Việt Nam",
};

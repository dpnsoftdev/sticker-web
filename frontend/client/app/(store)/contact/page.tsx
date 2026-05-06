import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Thông tin – Dango's Corner",
  description:
    "Thông tin thanh toán và liên hệ Dango's Corner – stickers, sticker book, văn phòng phẩm, pre-order, order nội địa Trung.",
};

export default function ContactPage() {
  return <ContactClient />;
}

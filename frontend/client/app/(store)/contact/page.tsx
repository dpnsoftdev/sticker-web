import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Thông tin – Dango Corner",
  description: "Thông tin thanh toán và liên hệ của Dango Corner.",
};

export default function ContactPage() {
  return <ContactClient />;
}

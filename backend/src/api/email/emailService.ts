import nodemailer from "nodemailer";
import { pino } from "pino";

import { ORDER_STATUS } from "@/common/constants";
import { env } from "@/common/utils/envConfig";
import type { OrderStatus } from "@/common/lib/prisma-client";

const log = pino({ name: "email" });

function isConfigured(): boolean {
  return Boolean(env.SMTP_HOST?.trim() && env.MAIL_FROM?.trim());
}

function createTransporter() {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST.trim(),
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransporter() {
  if (cachedTransporter === undefined) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

export type OrderStatusMailPayload = {
  to: string;
  orderId: string;
  status: OrderStatus;
  finalAmount: number;
  currency: string;
  receiverName?: string | null;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function buildOrderStatusEmail(payload: OrderStatusMailPayload): { subject: string; text: string; html: string } {
  const { orderId, status, finalAmount, currency, receiverName } = payload;
  const greet = receiverName?.trim() ? `Xin chào ${receiverName.trim()} 👋` : "Xin chào Quý khách 👋";
  const amountLine = `Tổng giá trị đơn hàng: ${formatMoney(finalAmount, currency)}. 💰`;
  const thanksOrder = "Cảm ơn bạn đã tin tưởng và đặt hàng tại Dango's Corner! 💖";
  const thanksSupport = "Cảm ơn bạn iu đã luôn đồng hành và ủng hộ! Dango chúc bạn một ngày tốt lành ✨";
  const minimalOrderId = `#${orderId.slice(0, 8).toUpperCase()}`;

  if (status === ORDER_STATUS.PAYMENT_CONFIRMED) {
    const subject = `✅ Đã xác nhận thanh toán — Đơn hàng ${minimalOrderId}`;
    const text = `${greet}

Dango's Corner đã xác nhận thanh toán thành công cho đơn hàng của bạn. 🎉
${amountLine}

Đơn hàng đang được chuẩn bị, tụi mình sẽ cập nhật cho bạn khi đơn hàng được vận chuyển. 📦

${thanksOrder}`;
    const html = `<p>${greet}</p>
<p>Dango's Corner đã <strong>xác nhận thanh toán thành công</strong> cho đơn hàng <strong>${minimalOrderId}</strong>. 🎉</p>
<p>${amountLine}</p>
<p>Đơn hàng đang được chuẩn bị, tụi mình sẽ cập nhật cho bạn khi đơn hàng được vận chuyển. 📦</p>
<p><strong>${thanksOrder}</strong></p>`;
    return { subject, text, html };
  }

  if (status === ORDER_STATUS.SHIPPING) {
    const subject = `🚚 Đơn hàng của bạn đang được vận chuyển!`;
    const text = `${greet}

Đơn hàng ${minimalOrderId} của bạn đã được chuyển giao cho đơn vị vận chuyển. 🚚

Quý khách vui lòng chờ nhận hàng trong thời gian tới. Nếu cần hỗ trợ, hãy trả lời email này hoặc liên hệ qua kênh Facebook của Dango's Corner nhé. 💬

${thanksSupport}`;
    const html = `<p>${greet}</p>
<p>Đơn hàng <strong>${minimalOrderId}</strong> của Quý khách đã được <strong>chuyển giao cho đơn vị vận chuyển</strong>. 🚚</p>
<p>Quý khách vui lòng chờ nhận hàng trong thời gian tới. Nếu cần hỗ trợ, hãy trả lời email này hoặc liên hệ qua kênh Facebook của Dango's Corner nhé. 💬</p>
<p><strong>${thanksSupport}</strong></p>`;
    return { subject, text, html };
  }

  if (status === ORDER_STATUS.CANCELLED) {
    const subject = `❌ Đơn hàng đã hủy — ${minimalOrderId}`;
    const text = `${greet}

Đơn hàng ${minimalOrderId} đã được hủy theo cập nhật mới nhất từ hệ thống.

${amountLine}

Nếu Quý khách không chủ động yêu cầu hủy hoặc cần làm rõ, vui lòng liên hệ cửa hàng để được hỗ trợ ngay. 🙏

Cảm ơn Quý khách đã quan tâm; rất mong được phục vụ Quý khách trong những lần mua sắm sau! 💐`;
    const html = `<p>${greet}</p>
<p>Đơn hàng <strong>${minimalOrderId}</strong> đã được <strong>hủy</strong> theo cập nhật mới nhất từ hệ thống.</p>
<p>${amountLine}</p>
<p>Nếu Quý khách không chủ động yêu cầu hủy hoặc cần làm rõ, vui lòng liên hệ cửa hàng để được hỗ trợ ngay. 🙏</p>
<p><strong>Cảm ơn Quý khách đã quan tâm; rất mong được phục vụ Quý khách trong những lần mua sắm sau! 💐</strong></p>`;
    return { subject, text, html };
  }

  const subject = `📋 Cập nhật đơn hàng — ${minimalOrderId}`;
  const text = `${greet}

Trạng thái đơn hàng ${minimalOrderId} hiện tại: ${status}.
${amountLine}

${thanksOrder}`;
  const html = `<p>${greet}</p>
<p>Trạng thái đơn hàng <strong>${minimalOrderId}</strong> hiện tại: <strong>${status}</strong>.</p>
<p>${amountLine}</p>
<p><strong>${thanksOrder}</strong></p>`;
  return { subject, text, html };
}

export const emailService = {
  isConfigured,

  /**
   * Sends a transactional email for key order status changes.
   * Does not throw — logs errors so callers can treat the operation as best-effort.
   */
  sendOrderStatusNotification: async (payload: OrderStatusMailPayload): Promise<void> => {
    const transporter = getTransporter();
    if (!transporter) {
      log.debug({ orderId: payload.orderId, status: payload.status }, "email skipped: SMTP not configured");
      return;
    }

    const to = payload.to.trim();
    if (!to) {
      log.warn({ orderId: payload.orderId }, "email skipped: empty recipient");
      return;
    }

    const { subject, text, html } = buildOrderStatusEmail(payload);
    const fromName = env.MAIL_FROM_NAME?.trim() || "Cửa hàng Sticker";
    const from = `${fromName} <${env.MAIL_FROM.trim()}>`;

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      log.info({ orderId: payload.orderId, status: payload.status, to }, "order status email sent");
    } catch (err) {
      log.error({ err, orderId: payload.orderId, status: payload.status, to }, "failed to send order status email");
    }
  },

  /**
   * Sends a 6-digit OTP for email verification during registration.
   * Does not throw — logs errors; caller should treat failure as unable to deliver.
   */
  sendRegistrationOtp: async (to: string, code: string): Promise<boolean> => {
    const transporter = getTransporter();
    if (!transporter) {
      log.debug({ to }, "registration OTP email skipped: SMTP not configured");
      return false;
    }

    const email = to.trim();
    if (!email) {
      log.warn("registration OTP email skipped: empty recipient");
      return false;
    }

    const fromName = env.MAIL_FROM_NAME?.trim() || "Cửa hàng Sticker";
    const from = `${fromName} <${env.MAIL_FROM.trim()}>`;
    const subject = `Mã xác nhận đăng ký — ${code}`;
    const text = `Mã xác nhận đăng ký tài khoản của bạn là: ${code}

Mã có hiệu lực trong vòng 5 phút. Vui lòng nhập mã này để xác nhận đăng ký tài khoản.`;
    const html = `<p>Mã xác nhận đăng ký tài khoản của bạn là:</p>
<p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>
<p>Mã có hiệu lực trong vòng 5 phút. Vui lòng nhập mã này để xác nhận đăng ký tài khoản.</p>`;

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html,
      });
      log.info({ to: email }, "registration OTP email sent");
      return true;
    } catch (err) {
      log.error({ err, to: email }, "failed to send registration OTP email");
      return false;
    }
  },

  /**
   * Sends a 6-digit OTP for public order lookup by email.
   * Does not throw — caller treats false as undeliverable.
   */
  sendOrderTrackEmailOtp: async (to: string, code: string): Promise<boolean> => {
    const transporter = getTransporter();
    if (!transporter) {
      log.debug({ to }, "order-track email OTP skipped: SMTP not configured");
      return false;
    }

    const email = to.trim();
    if (!email) {
      log.warn("order-track email OTP skipped: empty recipient");
      return false;
    }

    const fromName = env.MAIL_FROM_NAME?.trim() || "Cửa hàng Sticker";
    const from = `${fromName} <${env.MAIL_FROM.trim()}>`;
    const subject = `Mã tra cứu đơn hàng — ${code}`;
    const text = `Mã xác nhận tra cứu đơn hàng của bạn là: ${code}`;
    const html = `<p>Mã xác nhận tra cứu đơn hàng của bạn là:</p>
<p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>`;

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html,
      });
      log.info({ to: email }, "order-track email OTP sent");
      return true;
    } catch (err) {
      log.error({ err, to: email }, "failed to send order-track email OTP");
      return false;
    }
  },
};

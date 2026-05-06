import { FirebaseError } from "firebase/app";

export function normalizePhone(v: string) {
  return v.replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

/** VN local 0xxxxxxxxx or +84 → E.164 for Firebase Phone Auth */
export function toFirebaseE164(raw: string): string | null {
  const n = normalizePhone(raw);
  if (!n) return null;
  if (n.startsWith("+84")) return n;
  if (/^0\d{9}$/.test(n)) return `+84${n.slice(1)}`;
  return null;
}

function gatherAuthErrorText(err: unknown): string {
  const parts: string[] = [];
  if (err instanceof FirebaseError) {
    parts.push(err.code, err.message);
    const custom = (err as FirebaseError & { customData?: unknown }).customData;
    if (custom !== undefined) {
      try {
        parts.push(
          typeof custom === "string" ? custom : JSON.stringify(custom)
        );
      } catch {
        parts.push(String(custom));
      }
    }
  } else if (err instanceof Error) {
    parts.push(err.message, err.name);
  } else if (err !== null && typeof err === "object") {
    try {
      parts.push(JSON.stringify(err));
    } catch {
      parts.push(String(err));
    }
  } else if (err != null) {
    parts.push(String(err));
  }
  return parts.join(" ");
}

/** Phiên xác nhận OTP hết hạn hoặc backend từ chối — cần gửi lại SMS. */
export function isOtpConfirmSessionExpiredError(err: unknown): boolean {
  if (err instanceof FirebaseError) {
    if (
      err.code === "auth/session-expired" ||
      err.code === "auth/code-expired" ||
      err.code === "auth/error-code:-39"
    ) {
      return true;
    }
  }
  const blob = gatherAuthErrorText(err);
  if (blob.includes("SESSION_EXPIRED")) return true;
  if (blob.includes('"code":503') && blob.includes("Error code: 39"))
    return true;
  if (blob.includes("Error code: 39")) return true;
  return false;
}

/**
 * Lần gửi SMS tiếp theo nên dùng reCAPTCHA dạng hiển thị (`normal`) thay vì invisible.
 * Firebase **không** cho phép bỏ reCAPTCHA khi gửi SMS tới số thật; `appVerificationDisabledForTesting`
 * chỉ dùng với số test trong Console.
 */
export function shouldUseVisibleRecaptchaOnNextSmsSend(err: unknown): boolean {
  if (err instanceof FirebaseError) {
    if (
      err.code === "auth/error-code:-39" ||
      err.code === "auth/invalid-app-credential" ||
      err.code === "auth/missing-app-credential"
    ) {
      return true;
    }
    const msg = err.message ?? "";
    if (msg.includes("auth/error-code:-39") || msg.includes("Error code: 39")) {
      return true;
    }
    if (msg.includes("auth/invalid-app-credential")) {
      return true;
    }
  } else if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("auth/error-code:-39") || msg.includes("Error code: 39")) {
      return true;
    }
    if (msg.includes("auth/invalid-app-credential")) {
      return true;
    }
  }
  return false;
}

export function firebaseAuthErrorVi(err: unknown): string {
  if (err instanceof FirebaseError) {
    const msg = err.message ?? "";
    // Một số bản SDK / Identity Toolkit đưa mã vào message thay vì `code`
    if (msg.includes("auth/error-code:-39") || msg.includes("Error code: 39")) {
      return "Xác thực không thành công. Vui lòng tải lại trang và thử lại.";
    }
    if (msg.includes("auth/invalid-app-credential")) {
      return "Xác thực không thành công. Vui lòng tải lại trang và thử lại.";
    }

    switch (err.code) {
      case "auth/invalid-verification-code":
        return "Mã OTP không đúng.";
      case "auth/missing-verification-code":
        return "Thiếu mã OTP.";
      case "auth/invalid-verification-id":
        return "Phiên xác thực không hợp lệ. Vui lòng gửi lại mã OTP.";
      case "auth/code-expired":
      case "auth/session-expired":
      case "auth/error-code:-39":
        return "Phiên xác thực đã hết hạn. Vui lòng gửi lại mã OTP.";
      case "auth/too-many-requests":
        return "Thao tác quá nhiều lần. Vui lòng thử lại sau.";
      case "auth/invalid-phone-number":
        return "Số điện thoại không hợp lệ.";
      case "auth/missing-phone-number":
        return "Thiếu số điện thoại.";
      case "auth/captcha-check-failed":
        return "Xác thực reCAPTCHA thất bại. Vui lòng thử lại.";
      case "auth/invalid-app-credential":
      case "auth/missing-app-credential":
        return "Xác thực không thành công. Vui lòng tải lại trang và thử lại.";
      case "auth/operation-not-allowed":
        return "Đăng nhập bằng số điện thoại chưa được bật trên hệ thống.";
      case "auth/network-request-failed":
        return "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.";
      case "auth/quota-exceeded":
        return "Đã vượt giới hạn gửi SMS. Vui lòng thử lại sau.";
      case "auth/unauthorized-domain":
        return "Domain này chưa được phép dùng xác thực. Vui lòng thêm domain trong Firebase Console.";
      case "auth/invalid-api-key":
        return "API key Firebase không hợp lệ.";
      case "auth/app-not-authorized":
        return "Ứng dụng chưa được cấp quyền dùng Firebase Authentication.";
      case "auth/internal-error":
        return "Lỗi hệ thống xác thực. Vui lòng thử lại sau.";
      default:
        return (
          err.message || "Không thể xác thực số điện thoại. Vui lòng thử lại."
        );
    }
  }
  if (err instanceof Error) return err.message;
  return "Không thể xác thực số điện thoại. Vui lòng thử lại.";
}

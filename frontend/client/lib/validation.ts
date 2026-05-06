// --- Shared form validation (profile, checkout, AuthModal) ---

export const PASSWORD_MIN_LENGTH = 8;
export const DISPLAY_NAME_MAX_LENGTH = 120;

/** Vietnamese UI messages for consistency across forms */
export const VALIDATION_MESSAGES_VI = {
  nameRequired: "Vui lòng nhập họ và tên.",
  nameTooLong: `Họ tên tối đa ${DISPLAY_NAME_MAX_LENGTH} ký tự.`,
  phoneInvalid:
    "Số điện thoại không hợp lệ. Dùng 0xxxxxxxxx hoặc +84xxxxxxxxx (số di động Việt Nam).",
  phoneRequired: "Vui lòng nhập số điện thoại.",
  passwordMin: `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
  passwordMismatch: "Mật khẩu xác nhận không khớp.",
  currentPasswordRequired: "Vui lòng nhập mật khẩu hiện tại.",
  emailRequired: "Vui lòng nhập email.",
  emailInvalid: "Email không hợp lệ.",
  urlInvalid: "Link không hợp lệ (cần http:// hoặc https://).",
  addressRequired: "Vui lòng nhập địa chỉ nhận hàng.",
} as const;

export type FieldValidation = { ok: true } | { ok: false; message: string };

export function validateRequiredTrim(
  raw: string,
  emptyMessage: string
): FieldValidation {
  if (raw.trim() === "") {
    return { ok: false, message: emptyMessage };
  }
  return { ok: true };
}

/** Normalize spaces/dashes; +84 / 84 prefix → leading 0 for mobile check */
export function normalizeVietnamPhone(input: string): string {
  let s = input.trim().replace(/[\s.-]/g, "");
  if (s.startsWith("+84")) {
    s = `0${s.slice(3)}`;
  } else if (s.startsWith("84") && s.length >= 10 && !s.startsWith("0")) {
    s = `0${s.slice(2)}`;
  }
  return s;
}

/** 10-digit VN mobile: 0 + [3-9] + 8 digits */
export function isValidVietnamMobilePhone(input: string): boolean {
  const s = normalizeVietnamPhone(input);
  return /^0[3-9]\d{8}$/.test(s);
}

/** Profile: empty allowed; if filled must be valid mobile */
export function validateVietnamPhoneOptional(raw: string): FieldValidation {
  const t = raw.trim();
  if (t === "") return { ok: true };
  if (!isValidVietnamMobilePhone(t)) {
    return { ok: false, message: VALIDATION_MESSAGES_VI.phoneInvalid };
  }
  return { ok: true };
}

/** Checkout / required phone fields */
export function validateVietnamPhoneRequired(raw: string): FieldValidation {
  const t = raw.trim();
  if (t === "") {
    return { ok: false, message: VALIDATION_MESSAGES_VI.phoneRequired };
  }
  if (!isValidVietnamMobilePhone(t)) {
    return { ok: false, message: VALIDATION_MESSAGES_VI.phoneInvalid };
  }
  return { ok: true };
}

export function validateDisplayName(raw: string): FieldValidation {
  const t = raw.trim();
  if (t === "") {
    return { ok: false, message: VALIDATION_MESSAGES_VI.nameRequired };
  }
  if (t.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, message: VALIDATION_MESSAGES_VI.nameTooLong };
  }
  return { ok: true };
}

export function validatePasswordMinLength(
  password: string,
  minLength: number = PASSWORD_MIN_LENGTH
): FieldValidation {
  if (password.length < minLength) {
    return { ok: false, message: VALIDATION_MESSAGES_VI.passwordMin };
  }
  return { ok: true };
}

export function validateNewPasswordPair(
  newPassword: string,
  confirmPassword: string,
  minLength: number = PASSWORD_MIN_LENGTH
): FieldValidation {
  const min = validatePasswordMinLength(newPassword, minLength);
  if (!min.ok) return min;
  if (newPassword !== confirmPassword) {
    return { ok: false, message: VALIDATION_MESSAGES_VI.passwordMismatch };
  }
  return { ok: true };
}

/** Change password form: current required, new min length, confirm match */
export function validatePasswordChangeInput(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): FieldValidation {
  if (!input.currentPassword.trim()) {
    return {
      ok: false,
      message: VALIDATION_MESSAGES_VI.currentPasswordRequired,
    };
  }
  const pair = validateNewPasswordPair(
    input.newPassword,
    input.confirmPassword
  );
  if (!pair.ok) return pair;
  return { ok: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailBasic(raw: string): FieldValidation {
  const t = raw.trim();
  if (t === "") {
    return { ok: false, message: VALIDATION_MESSAGES_VI.emailRequired };
  }
  if (!EMAIL_RE.test(t)) {
    return { ok: false, message: VALIDATION_MESSAGES_VI.emailInvalid };
  }
  return { ok: true };
}

export function validateHttpUrl(raw: string): FieldValidation {
  const t = raw.trim();
  if (t === "") {
    return { ok: false, message: VALIDATION_MESSAGES_VI.urlInvalid };
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, message: VALIDATION_MESSAGES_VI.urlInvalid };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: VALIDATION_MESSAGES_VI.urlInvalid };
  }
}

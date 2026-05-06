/**
 * Maps backend API messages (English) to Vietnamese for toasts.
 * Keep in sync with `backend/src/common/constants` and `orderService` (checkPhoneForTrack, verifyPhoneAuth).
 */
const API_MESSAGE_VI: Record<string, string> = {
  "You have reached the maximum number of OTP requests.":
    "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
  "Too many incorrect verification attempts.":
    "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.",
  "No order was found for this phone number.":
    "Không tìm thấy đơn hàng nào với số điện thoại này.",
  "No order was found for this email address.":
    "Không tìm thấy đơn hàng nào với email này.",
  "Too many incorrect verification attempts. Please contact the shop administrator for assistance.":
    "Bạn đã nhập sai quá nhiều lần. Vui lòng liên hệ admin để được hỗ trợ.",
  "Verification code has been sent to your email.":
    "Đã gửi mã xác nhận tới email của bạn.",
  "Unable to send verification email. Please try again later or contact support.":
    "Không thể gửi email xác nhận. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
  "Invalid verification code.": "Mã xác thực không đúng.",
  "This verification code has expired or is no longer valid. Please request a new code.":
    "Mã xác thực đã hết hạn hoặc không còn hiệu lực.",
  "Failed to send verification SMS.":
    "Không gửi được tin nhắn SMS. Vui lòng thử lại.",
  "Unable to process your request OTP.":
    "Không thể xử lý yêu cầu. Vui lòng thử lại.",
  "Verification code sent.": "Đã gửi mã xác thực qua SMS.",
  "Verified.": "Xác thực thành công.",
  "Order tracking verification is temporarily unavailable.":
    "Hệ thống xác thực tạm thời không khả dụng. Vui lòng thử lại sau.",
  "Unable to verify the code. Please try again later.":
    "Không thể xác thực. Vui lòng thử lại sau.",
  "Order tracking is temporarily unavailable.":
    "Hệ thống tra cứu tạm thời không khả dụng. Vui lòng thử lại sau.",
  "Unable to load orders. Please try again later.":
    "Không thể tải đơn hàng. Vui lòng thử lại sau.",
  "Phone number is required.": "Vui lòng nhập số điện thoại.",
  "Invalid Vietnam mobile number. Use 0xxxxxxxxx or +84xxxxxxxxx.":
    "Số điện thoại không hợp lệ. Dùng dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.",
  "Invalid or expired sign-in. Please verify your phone number again.":
    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng xác thực số điện thoại lại.",
  "This account is not linked to a phone number.":
    "Tài khoản chưa gắn số điện thoại.",
  "Order-track bypass is not enabled on this server.":
    "Máy chủ không bật chế độ tra cứu bypass.",
};

export function translateOrderTrackApiMessage(message: string): string {
  return API_MESSAGE_VI[message] ?? message;
}

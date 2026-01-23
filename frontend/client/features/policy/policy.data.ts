export interface PolicySection {
  id: string;
  title: string;
  items: string[];
  note?: string;
}

export const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "order-policy",
    title: "1. Chính sách đặt hàng",
    items: [
      "Vì đa phần là hàng order, Dango chỉ chấp nhận hình thức thanh toán trước 50–100%.",
      "Sau khi xác nhận và thanh toán, Dango không chấp nhận huỷ đơn vì bất kỳ lý do gì, trừ khi shop Trung Quốc báo huỷ hoặc không có hàng.",
      "Sản phẩm bên Dango đa phần là sản phẩm không có sẵn. Thời gian sản xuất sẽ được thông báo rõ khi đăng bài (nếu có).",
      "Tiến độ đơn hàng sẽ được Dango thông báo qua Email, Facebook hoặc Instagram để bạn dễ dàng theo dõi.",
      "Thời gian hàng về phụ thuộc vào shop Trung và tốc độ vận chuyển. Dango sẽ cập nhật và thông báo nếu có chậm trễ.",
      "Khi hàng về, Dango sẽ thông báo qua fanpage và Email/FB/IG khách hàng — vui lòng chú ý các kênh này để không bỏ lỡ cập nhật.",
    ],
  },
  {
    id: "payment-policy",
    title: "2. Chính sách thanh toán",
    items: [
      "Thanh toán 50–100% giá trị đơn hàng qua chuyển khoản ngân hàng hoặc ví điện tử (Momo, ZaloPay).",
      "Dango không chịu trách nhiệm trong trường hợp khách hàng thanh toán sai thông tin tài khoản được cung cấp.",
    ],
  },
  {
    id: "shipping-policy",
    title: "3. Chính sách vận chuyển",
    items: [
      "Phí ship được tính theo khu vực: 15.000đ – 50.000đ.",
      "Thời gian giao hàng: 2–5 ngày làm việc sau khi hàng về đến Dango.",
      "Khách hàng được kiểm tra hàng trước khi nhận.",
    ],
  },
  {
    id: "return-policy",
    title: "4. Chính sách đổi trả",
    items: [
      "Dango chỉ chấp nhận hỗ trợ đổi trả nếu sản phẩm bị lỗi do nhà sản xuất.",
      "Sản phẩm đổi trả phải còn nguyên seal, tem, nhãn mác và chưa qua sử dụng.",
      "Không chấp nhận đổi trả với lý do cá nhân như đổi ý, không thích, hoặc khác màu.",
    ],
  },
  {
    id: "refund-policy",
    title: "5. Chính sách Hoàn tiền",
    items: [
      "Hàng thất lạc: Hoàn 50–100% tùy mức bồi thường của vận chuyển + công cân.",
      "Hàng thiếu/lỗi: Hoàn theo số tiền được bồi thường của Mas sau khi xác nhận. Không bồi thường nếu Mas không xử lý.",
      "Trường hợp gian lận (scam): Không hoàn tiền 100%, chỉ hoàn công cân đã thu.",
    ],
    note: "Lưu ý: Không hoàn tiền vì khác hình, lỗi xưởng, hoặc đổi ý."
  },
  {
    id: "privacy-policy",
    title: "6. Chính sách bảo mật thông tin",
    items: [
      "Dango cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng.",
      "Thông tin chỉ được sử dụng cho mục đích xử lý đơn hàng và chăm sóc khách hàng.",
      "Không chia sẻ thông tin khách hàng cho bên thứ ba.",
      "Khách hàng có quyền yêu cầu chỉnh sửa hoặc xóa thông tin bất cứ lúc nào.",
    ],
  }
];

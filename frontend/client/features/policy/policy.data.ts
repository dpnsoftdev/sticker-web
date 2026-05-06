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
      "Phần lớn sản phẩm tại Dango là hàng đặt trước (pre-order). Khách hàng cần thanh toán trước từ 50–100% giá trị đơn hàng để shop tiến hành đặt hàng.",
      "Đối với deal Xianyu, Taobao, Pinduoduo, giỏ hàng Rednote: Thanh toán 100% tiền hàng, thanh toán phụ phí (ship Trung - Việt) khi hàng về; hoặc thanh toán 50% tiền hàng, thanh toán 50% còn lại + phụ phí khi hàng về.",
      "Đối với hàng gắn mác Pre-Order: Thanh toán 100% tiền hàng, thanh toán phụ phí (ship nội địa + ship Trung - Việt) khi hàng về; hoặc thanh toán 50% tiền hàng trước deadline, thanh toán nốt 50% còn lại sau 2 tuần, hàng về sẽ thanh toán tiếp phụ phí.",
      "Sau khi đơn hàng đã được xác nhận và thanh toán, shop không hỗ trợ hủy đơn theo yêu cầu cá nhân. Trường hợp duy nhất được hủy đơn là khi shop Trung Quốc thông báo hết hàng hoặc hủy đơn.",
      "Đối với các sản phẩm cần thời gian sản xuất, thời gian dự kiến sẽ được ghi rõ trong bài đăng. Khách hàng vui lòng kiểm tra thông tin trước khi đặt.",
    ],
  },
  {
    id: "payment-policy",
    title: "2. Chính sách thanh toán",
    items: ["Chuyển khoản ngân hàng.", "Ví điện tử (Momo, Paypal)."],
    note: "Khách hàng cần kiểm tra kỹ thông tin tài khoản trước khi chuyển khoản. Dango không chịu trách nhiệm đối với các trường hợp chuyển khoản nhầm.",
  },
  {
    id: "shipping-policy",
    title: "3. Chính sách vận chuyển",
    items: [
      "Sau khi hàng về đến kho của Dango, shop sẽ tiến hành đóng gói và gửi hàng cho khách.",
      "Phí vận chuyển: từ 15.000đ – 30.000đ tùy khu vực.",
      "Thời gian giao hàng: khoảng 2–5 ngày làm việc.",
    ],
  },
  {
    id: "return-policy",
    title: "4. Chính sách đổi trả",
    items: [
      "Dango hỗ trợ đổi trả trong trường hợp sản phẩm bị lỗi của phía shop: shop giao thiếu, nhầm hàng; hàng bị hư hỏng do cách đóng gói của shop.",
      "Điều kiện áp dụng: Sản phẩm còn nguyên tem, nhãn, seal; chưa qua sử dụng.",
      "Shop không hỗ trợ đổi trả đối với: khách thay đổi ý định; không thích sản phẩm sau khi nhận; sai khác nhỏ về màu sắc so với hình ảnh.",
    ],
  },
  {
    id: "refund-policy",
    title: "5. Chính sách Hoàn tiền",
    items: [
      "Hàng thất lạc: hoàn từ 50–100% tùy theo mức bồi thường từ đơn vị vận chuyển.",
      "Hàng thiếu: hoàn tiền theo mức bồi thường từ đơn vị vận chuyển trung gian sau khi xác nhận.",
      "Trong trường hợp phía seller Trung scam, shop chỉ hoàn phí dịch vụ đã thu, không hoàn toàn bộ giá trị đơn hàng.",
    ],
    note: "Dango không hoàn tiền trong các trường hợp: khác hình minh họa; lỗi nhỏ từ xưởng sản xuất; khách đổi ý sau khi đặt.",
  },
  {
    id: "transfer-policy",
    title: "6. Chính sách nhượng đơn",
    items: [
      "Dango cho phép khách hàng nhượng lại đơn hàng cho người khác trong trường hợp không thể tiếp tục nhận hàng.",
      "Khách hàng tự tìm người nhận nhượng và thông báo lại cho Dango để cập nhật thông tin đơn hàng.",
      "Sau khi hoàn tất nhượng đơn, mọi quyền lợi và trách nhiệm của đơn hàng sẽ được chuyển sang người nhận nhượng.",
      "Dango không chịu trách nhiệm về việc thanh toán giữa hai bên (người nhượng và người nhận nhượng).",
      "Shop chỉ hỗ trợ cập nhật thông tin người nhận mới sau khi cả hai bên xác nhận.",
    ],
    note: "Dango không hỗ trợ hủy đơn thông qua hình thức nhượng đơn. Việc nhượng đơn chỉ nhằm chuyển quyền nhận hàng sang người khác.",
  },
];

import { isAxiosError } from "axios";

import { apiClient } from "@/lib/fetcher";
import { API_ENDPOINTS } from "@/lib/constants";

export type OrderTrackServiceResponse<T> = {
  success: boolean;
  message: string;
  data?: T | null;
  statusCode: number;
};

export type OrderTrackPublicLineItem = {
  id: string;
  quantity: number;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  currency: string;
  image: string | null;
};

export type OrderTrackPublicOrder = {
  id: string;
  status: string;
  createdAt: string;
  finalAmount: number;
  currency: string;
  items: OrderTrackPublicLineItem[];
};

export type VerifyPhoneAuthData = {
  orders: OrderTrackPublicOrder[];
};

export type CheckPhoneForTrackData = {
  eligible: true;
};

export type RequestOrderTrackEmailOtpData = {
  orderTrackEmailSessionId: string;
};

export type VerifyEmailTrackFailData = {
  attemptsRemaining?: number;
};

function extractMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as
      | OrderTrackServiceResponse<null>
      | undefined;
    if (body?.message) return body.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export const orderTrackApi = {
  async checkPhoneForTrack(
    phone: string
  ): Promise<OrderTrackServiceResponse<CheckPhoneForTrackData>> {
    try {
      const { data } = await apiClient.post<
        OrderTrackServiceResponse<CheckPhoneForTrackData>
      >(API_ENDPOINTS.ORDER_TRACK_CHECK_PHONE, { phone });
      return data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        return err.response
          .data as OrderTrackServiceResponse<CheckPhoneForTrackData>;
      }
      return {
        success: false,
        message: extractMessage(err),
        data: null,
        statusCode: 500,
      };
    }
  },

  async verifyPhoneAuth(body: {
    idToken?: string;
    phone?: string;
    bypassAuth?: boolean;
  }): Promise<OrderTrackServiceResponse<VerifyPhoneAuthData>> {
    try {
      const { data } = await apiClient.post<
        OrderTrackServiceResponse<VerifyPhoneAuthData>
      >(API_ENDPOINTS.ORDER_TRACK_VERIFY_PHONE_AUTH, body);
      return data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        return err.response
          .data as OrderTrackServiceResponse<VerifyPhoneAuthData>;
      }
      return {
        success: false,
        message: extractMessage(err),
        data: null,
        statusCode: 500,
      };
    }
  },

  async requestEmailForTrack(
    email: string
  ): Promise<OrderTrackServiceResponse<RequestOrderTrackEmailOtpData>> {
    try {
      const { data } = await apiClient.post<
        OrderTrackServiceResponse<RequestOrderTrackEmailOtpData>
      >(API_ENDPOINTS.ORDER_TRACK_REQUEST_EMAIL_OTP, { email });
      return data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        return err.response
          .data as OrderTrackServiceResponse<RequestOrderTrackEmailOtpData>;
      }
      return {
        success: false,
        message: extractMessage(err),
        data: null,
        statusCode: 500,
      };
    }
  },

  async verifyEmailForTrack(body: {
    orderTrackEmailSessionId: string;
    otp: string;
  }): Promise<
    OrderTrackServiceResponse<
      VerifyPhoneAuthData | VerifyEmailTrackFailData | null
    >
  > {
    try {
      const { data } = await apiClient.post<
        OrderTrackServiceResponse<VerifyPhoneAuthData | null>
      >(API_ENDPOINTS.ORDER_TRACK_VERIFY_EMAIL_OTP, body);
      return data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        return err.response.data as OrderTrackServiceResponse<
          VerifyPhoneAuthData | VerifyEmailTrackFailData | null
        >;
      }
      return {
        success: false,
        message: extractMessage(err),
        data: null,
        statusCode: 500,
      };
    }
  },
};

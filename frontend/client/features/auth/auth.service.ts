import axios, { AxiosError } from "axios";

import { apiClient } from "@/lib/fetcher";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RegisterStartResult,
  ServiceResponseEnvelope,
  TokenResponseData,
} from "./auth.types";

function mapTokenToAuthResponse(token: TokenResponseData): AuthResponse {
  return {
    user: {
      id: token.user.id,
      email: token.user.email,
      name: token.user.name,
      role: token.user.role,
    },
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn,
  };
}

function assertSuccess<T>(envelope: ServiceResponseEnvelope<T>, fallback: string): T {
  if (!envelope.success || envelope.data == null) {
    throw new Error(envelope.message || fallback);
  }
  return envelope.data;
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ServiceResponseEnvelope<null>>;
    const msg = ax.response?.data?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    return error.message || "Request failed";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<ServiceResponseEnvelope<TokenResponseData>>(
      "/auth/login",
      credentials,
    );
    const token = assertSuccess(data, "Login failed");
    return mapTokenToAuthResponse(token);
  },

  /** Step 1: validate fields + send OTP to email (stores pending session server-side). */
  async registerStart(body: RegisterData): Promise<RegisterStartResult> {
    const { data } = await apiClient.post<ServiceResponseEnvelope<RegisterStartResult>>(
      "/auth/register/start",
      {
        email: body.email,
        password: body.password,
        name: body.name,
        phone: body.phone,
      },
    );
    return assertSuccess(data, "Không thể gửi mã xác nhận");
  },

  /** Step 2: verify OTP; creates account and returns tokens (same shape as login). */
  async registerVerify(payload: {
    registrationSessionId: string;
    otp: string;
  }): Promise<AuthResponse> {
    const { data } = await apiClient.post<ServiceResponseEnvelope<TokenResponseData>>(
      "/auth/register/verify",
      payload,
    );
    const token = assertSuccess(data, "Xác minh thất bại");
    return mapTokenToAuthResponse(token);
  },
};

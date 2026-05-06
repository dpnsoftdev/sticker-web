import { apiClient } from "@/lib/fetcher";
import type { ServiceResponseEnvelope } from "@/features/auth/auth.types";

function assertSuccess<T>(envelope: ServiceResponseEnvelope<T>, fallback: string): T {
  if (!envelope.success || envelope.data == null) {
    throw new Error(envelope.message || fallback);
  }
  return envelope.data;
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: "owner" | "customer";
  createdAt: string;
  updatedAt: string;
}

export const profileApi = {
  async getMe(): Promise<ProfileUser> {
    const { data } = await apiClient.get<ServiceResponseEnvelope<ProfileUser>>("/auth/me");
    return assertSuccess(data, "Không tải được hồ sơ");
  },

  async updateProfile(body: { name?: string; phone?: string | null }): Promise<ProfileUser> {
    const { data } = await apiClient.patch<ServiceResponseEnvelope<ProfileUser>>("/auth/me", body);
    return assertSuccess(data, "Không cập nhật được hồ sơ");
  },

  async changePassword(body: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const { data } = await apiClient.patch<ServiceResponseEnvelope<null>>("/auth/me/password", body);
    if (!data.success) {
      throw new Error(data.message || "Đổi mật khẩu thất bại");
    }
  },
};

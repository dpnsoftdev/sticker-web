import { apiClient } from "@/lib/fetcher";
import { LoginCredentials, RegisterData, AuthResponse } from "./auth.types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/login", credentials);
    return data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const { data: response } = await apiClient.post<AuthResponse>("/api/auth/register", data);
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.post("/api/auth/logout");
  },
};

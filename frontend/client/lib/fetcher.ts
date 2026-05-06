import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type {
  ServiceResponseEnvelope,
  TokenResponseData,
} from "@/features/auth/auth.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/** No auth interceptors — avoids refresh recursion; used only for POST /auth/refresh. */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

let _refreshInFlight: Promise<string> | null = null;
let _sessionInvalidInFlight: Promise<void> | null = null;

export type AuthSessionBridge = {
  persistSessionTokens: (
    accessToken: string,
    refreshToken: string
  ) => Promise<void>;
  onSessionInvalid: () => Promise<void>;
} | null;

let _bridge: AuthSessionBridge = null;

export function registerAuthSessionBridge(bridge: AuthSessionBridge): void {
  _bridge = bridge;
}

export function setAuthTokens(
  access: string | null,
  refresh: string | null
): void {
  _accessToken = access;
  _refreshToken = refresh;
}

/** @deprecated Prefer setAuthTokens — kept for any stray imports */
export function setAuthToken(token: string | null): void {
  setAuthTokens(token, null);
}

/** Do not attempt refresh on auth endpoints (wrong password, refresh failure loop, etc.). */
function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) return false;
  if (url.includes("/auth/login")) return true;
  if (url.includes("/auth/refresh")) return true;
  if (url.includes("/auth/register/start")) return true;
  if (url.includes("/auth/register/verify")) return true;
  if (url === "/auth/register" || url.endsWith("/auth/register")) return true;
  /** Wrong current password returns 401 — session is still valid; must not logout. */
  if (url.includes("/auth/me/password")) return true;
  return false;
}

async function performTokenRefresh(): Promise<string> {
  if (!_refreshToken) {
    throw new Error("No refresh token");
  }
  const { data } = await refreshClient.post<
    ServiceResponseEnvelope<TokenResponseData>
  >("/auth/refresh", {
    refreshToken: _refreshToken,
  });
  if (!data.success || data.data == null) {
    throw new Error(data.message || "Refresh failed");
  }
  const { accessToken, refreshToken } = data.data;
  _accessToken = accessToken;
  _refreshToken = refreshToken;
  if (_bridge?.persistSessionTokens) {
    await _bridge.persistSessionTokens(accessToken, refreshToken);
  }
  return accessToken;
}

async function getRefreshedAccessToken(): Promise<string> {
  if (!_refreshInFlight) {
    _refreshInFlight = performTokenRefresh().finally(() => {
      _refreshInFlight = null;
    });
  }
  return _refreshInFlight;
}

async function triggerSessionInvalid(): Promise<void> {
  if (_sessionInvalidInFlight) {
    return _sessionInvalidInFlight;
  }
  _sessionInvalidInFlight = (async () => {
    _accessToken = null;
    _refreshToken = null;
    if (_bridge?.onSessionInvalid) {
      await _bridge.onSessionInvalid();
    }
  })().finally(() => {
    _sessionInvalidInFlight = null;
  });
  return _sessionInvalidInFlight;
}

apiClient.interceptors.request.use(
  config => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await triggerSessionInvalid();
      return Promise.reject(error);
    }

    if (!_refreshToken) {
      await triggerSessionInvalid();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccess = await getRefreshedAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch {
      await triggerSessionInvalid();
      return Promise.reject(error);
    }
  }
);

export async function fetcher<T>(url: string): Promise<T> {
  const { data } = await apiClient.get<T>(url);
  return data;
}

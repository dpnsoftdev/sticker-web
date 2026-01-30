export interface AuthData {
  roles: string[];
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  // some other data...
}

export type UserRoleType = "admin" | "editor" | "user";

export const ROUTES_APP = {
  ROOT: "/",
  ADMIN: "/admin",
  AUTH: "/auth",
  PRIVATE: "/private",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  UNAUTHORIZED: "/unauthorized",
  ACCOUNT: "account",
};

export const USER_API = {
  SIGNIN: "/auth/signin",
  LOGOUT: "/auth/logout",
};

// Roles id defined in database
export const ROLES = {
  ADMIN: 202,
  EDITOR: 203,
  USER: 204,
  ACCESS_ALL: 205,
};

export const ROLES_NAME = {
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
  ACCESS_ALL: "*",
};

import { DefaultSession } from "next-auth";
import { SessionUser } from "./user";

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }

  interface User extends SessionUser { }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

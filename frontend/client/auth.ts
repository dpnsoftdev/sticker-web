import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authService } from "@/features/auth/auth.service";
import { UserRole } from "@/types/user";
import { mapDatabaseRoleToAppRole } from "@/lib/role-utils";

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await authService.login({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (!response.user) return null;

          // Map database role (owner/customer) to application role (ADMIN/USER)
          const appRole = mapDatabaseRoleToAppRole(
            response.user.role as "owner" | "customer"
          );

          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: appRole,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.name = user.name;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as {
          user?: { name?: string | null };
          accessToken?: string;
          refreshToken?: string;
        };
        if (s.user?.name !== undefined) {
          token.name = s.user.name;
        }
        if (typeof s.accessToken === "string") {
          token.accessToken = s.accessToken;
        }
        if (typeof s.refreshToken === "string") {
          token.refreshToken = s.refreshToken;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.name =
          (token.name as string | null | undefined) ?? session.user.name ?? null;
      }
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

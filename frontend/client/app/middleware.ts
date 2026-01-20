import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLES } from "@/lib/constants";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  // ---------- PUBLIC ROUTES ----------
  if (
    path === "/" ||
    path.startsWith("/products") ||
    path.startsWith("/cart") ||
    path.startsWith("/checkout") ||
    path.startsWith("/campaigns") ||
    path.startsWith("/order/track") ||
    path.startsWith("/login") ||
    path.startsWith("/register")
  ) {
    return NextResponse.next();
  }

  // ---------- ADMIN ROUTES ----------
  if (path.startsWith("/admin")) {
    if (!session || session.user?.role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ---------- USER ROUTES ----------
  if (path.startsWith("/user")) {
    if (
      !session ||
      (session.user.role !== ROLES.USER &&
        session.user.role !== ROLES.ADMIN)
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

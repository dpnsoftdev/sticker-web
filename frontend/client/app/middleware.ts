import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLES, ROUTES } from "@/lib/constants";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  // ---------- PUBLIC ROUTES ----------
  if (
    path === "/" ||
    path.startsWith(ROUTES.PRODUCT) ||
    path.startsWith(ROUTES.CART) ||
    path.startsWith(ROUTES.CHECKOUT) ||
    path.startsWith(ROUTES.CAMPAIGNS) ||
    path.startsWith(ROUTES.ORDER_TRACK) ||
    path.startsWith(ROUTES.LOGIN) ||
    path.startsWith(ROUTES.REGISTER)
  ) {
    return NextResponse.next();
  }

  // ---------- ADMIN ROUTES ----------
  if (path.startsWith(ROUTES.ADMIN)) {
    if (!session || session.user?.role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ---------- USER ROUTES ----------
  if (path.startsWith(ROUTES.USER)) {
    if (
      !session ||
      (session.user.role !== ROLES.USER && session.user.role !== ROLES.ADMIN)
    ) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }
  }

  return NextResponse.next();
}

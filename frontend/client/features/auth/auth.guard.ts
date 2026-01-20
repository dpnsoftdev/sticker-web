import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { auth } from "@/auth";

export async function requireAuthGuard() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdminGuard() {
  const session = await requireAuthGuard();
  if (session.user.role !== ROLES.ADMIN) {
    redirect("/");
  }
  return session;
}

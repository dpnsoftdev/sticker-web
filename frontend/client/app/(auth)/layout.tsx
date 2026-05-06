import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ROUTES } from "@/lib/constants";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(ROUTES.HOME);
  }

  return <>{children}</>;
}

import { requireAuth } from "@/lib/auth";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}

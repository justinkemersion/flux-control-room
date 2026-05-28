import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authSafe } from "@/auth";
import { AppShell } from "@/components/shell/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authSafe();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";

  return (
    <AppShell pathname={pathname} email={session.user.email}>
      {children}
    </AppShell>
  );
}

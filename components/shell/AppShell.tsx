import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export function AppShell({
  children,
  pathname,
  email,
}: {
  children: ReactNode;
  pathname: string;
  email?: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar email={email} />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="hidden w-52 shrink-0 border-r border-[var(--border)] md:block">
          <SidebarNav pathname={pathname} />
        </aside>
        <div className="border-b border-[var(--border)] px-4 py-2 md:hidden">
          <Link href="/control-room" className="text-sm font-medium">
            Control Room
          </Link>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

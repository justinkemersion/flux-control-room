import type { ReactNode } from "react";
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
      <div className="flex flex-1">
        <aside className="w-52 shrink-0 border-r border-[var(--border)]">
          <SidebarNav pathname={pathname} />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/ui/cn";

const links = [{ href: "/control-room", label: "Control Room" }];

/** Reference routes kept in repo but hidden from nav: /records, /activity, /settings/profile */
export function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            pathname === link.href || pathname.startsWith(`${link.href}/`)
              ? "bg-[var(--muted)] font-medium"
              : "text-[var(--muted-fg)] hover:bg-[var(--muted)]",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

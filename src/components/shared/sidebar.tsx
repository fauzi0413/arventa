"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconBuilding,
  IconUsers,
  IconCash,
  IconClipboardCheck,
  IconChartBar,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sidebar — Dashboard Navigation
// ---------------------------------------------------------------------------

const navItems = [
  { href: "/", label: "Dashboard", icon: IconHome },
  { href: "/properties", label: "Properti", icon: IconBuilding },
  { href: "/tenants", label: "Penyewa", icon: IconUsers },
  { href: "/finance", label: "Keuangan", icon: IconCash },
  { href: "/operations", label: "Operasional", icon: IconClipboardCheck },
  { href: "/reports", label: "Laporan", icon: IconChartBar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
              ARVENTA
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t px-3 py-4">
          <p className="text-xs text-sidebar-foreground/50">
            © 2026 ARVENTA
          </p>
        </div>
      </div>
    </aside>
  );
}

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
  IconReceipt,
  IconFileText,
  IconBed,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/generated/prisma/client";

interface SidebarProps {
  role?: UserRole;
}

// ---------------------------------------------------------------------------
// Role-Based Navigation Configuration
// ---------------------------------------------------------------------------

const ownerNavItems = [
  { href: "/", label: "Dashboard", icon: IconHome },
  { href: "/properties", label: "Properti & Kamar", icon: IconBuilding },
  { href: "/tenants", label: "Penyewa", icon: IconUsers },
  { href: "/finance", label: "Keuangan", icon: IconCash },
  { href: "/operations", label: "Status Kamar (Operations)", icon: IconClipboardCheck },
  { href: "/reports", label: "Laporan", icon: IconChartBar },
];

const housekeepingNavItems = [
  { href: "/operations", label: "Status Kamar (Room Grid)", icon: IconClipboardCheck },
  { href: "/finance/expenses", label: "Catat OpEx", icon: IconCash },
];

const userNavItems = [
  { href: "/room", label: "Portal Kamar Saya", icon: IconBed },
  { href: "/room/invoices", label: "Tagihan & Payment", icon: IconReceipt },
  { href: "/room/contract", label: "Surat Kontrak PDF", icon: IconFileText },
];

export function Sidebar({ role = UserRole.OWNER }: SidebarProps) {
  const pathname = usePathname();

  let items = ownerNavItems;
  if (role === UserRole.HOUSEKEEPING) {
    items = housekeepingNavItems;
  } else if (role === UserRole.USER) {
    items = userNavItems;
  }

  const defaultHome =
    role === UserRole.HOUSEKEEPING
      ? "/operations"
      : role === UserRole.USER
      ? "/room"
      : "/";

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        {/* Logo & Role Badge */}
        <div className="flex h-14 items-center border-b px-6">
          <Link href={defaultHome} className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
              ARVENTA
            </span>
            <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-accent-foreground uppercase">
              {role}
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const isActive =
              item.href === "/" || item.href === "/operations" || item.href === "/room"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
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
            © 2026 ARVENTA • Room-Based PMS
          </p>
        </div>
      </div>
    </aside>
  );
}

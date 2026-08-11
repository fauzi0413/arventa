"use client";

import { useEffect, useState } from "react";
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
  IconShieldCheck,
  IconSparkles,
  IconLock,
  IconRoute,
  IconSettings,
  IconUserCheck,
  IconArmchair,
  IconMessages,
  IconBuildingStore,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/roles";

interface SidebarProps {
  role?: UserRole;
}

const adminNavItems = [
  { href: "/", label: "Executive Dashboard", icon: IconHome },
  { href: "/platform/owners", label: "Owner Management", icon: IconBuildingStore },
  { href: "/platform/subscriptions", label: "Subscriptions & Billing", icon: IconCash },
  { href: "/platform/roles", label: "Role & Permission Management", icon: IconLock },
  { href: "/platform/menus", label: "Dynamic Menu Management", icon: IconRoute },
  { href: "/platform/settings", label: "Platform Settings & Integrasi", icon: IconSettings },
];

const ownerNavItems = [
  { href: "/", label: "Dashboard Utama", icon: IconHome },
  { href: "/properties", label: "Properti & Manajemen Unit", icon: IconBuilding },
  { href: "/operations/housekeeping-team", label: "Tim Operasional & Housekeeping", icon: IconSparkles },
  { href: "/tenants", label: "Penyewa & Kontrak", icon: IconUsers },
  { href: "/finance", label: "Keuangan & Penagihan", icon: IconCash },
];

const housekeepingNavItems = [
  { href: "/", label: "Status Kamar Grid", icon: IconClipboardCheck },
  { href: "/housekeeping/tenants", label: "Data Penghuni Lapangan", icon: IconUserCheck },
  { href: "/housekeeping/inventories", label: "Kondisi Perabotan & Unit", icon: IconArmchair },
  { href: "/housekeeping/unit-expenses", label: "Keuangan & Penagihan Unit", icon: IconCash },
  { href: "/housekeeping/community", label: "Komunitas & Pengumuman", icon: IconMessages },
];

const userNavItems = [
  { href: "/", label: "Info Kamar Saya", icon: IconBed },
  { href: "/portal/contract", label: "Kontrak & Dokumen", icon: IconFileText },
  { href: "/portal/invoices", label: "Tagihan & Pembayaran", icon: IconReceipt },
  { href: "/portal/community", label: "Komunitas Properti", icon: IconMessages },
];

export function Sidebar({ role: initialRole }: SidebarProps) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole || UserRole.OWNER);

  useEffect(() => {
    if (!initialRole) {
      async function loadRole() {
        try {
          const res = await fetch("/api/auth/me");
          const json = await res.json();
          if (json.success && json.data?.role) {
            setCurrentRole(json.data.role);
          }
        } catch (err) {
          console.error("Failed to load user role in sidebar:", err);
        }
      }
      loadRole();
    } else {
      setCurrentRole(initialRole);
    }
  }, [initialRole]);

  let items = ownerNavItems;
  if (currentRole === UserRole.PLATFORM_ADMIN) {
    items = adminNavItems;
  } else if (currentRole === UserRole.HOUSEKEEPING) {
    items = housekeepingNavItems;
  } else if (currentRole === UserRole.USER) {
    items = userNavItems;
  }

  const getBadgeColor = (r: UserRole) => {
    switch (r) {
      case UserRole.PLATFORM_ADMIN:
        return "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30";
      case UserRole.OWNER:
        return "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30";
      case UserRole.HOUSEKEEPING:
        return "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30";
      case UserRole.USER:
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        {/* Logo & Role Badge */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-sidebar-foreground leading-none">
                ARVENTA
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                Property Platform
              </span>
            </div>
          </Link>

          <span className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase", getBadgeColor(currentRole))}>
            {currentRole}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {items.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          <p className="text-[11px] text-muted-foreground text-center font-medium">
            © 2026 ARVENTA • Room PMS
          </p>
        </div>
      </div>
    </aside>
  );
}

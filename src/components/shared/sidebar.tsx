"use client";

import { useEffect, useState, useCallback } from "react";
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
  IconTrendingUp,
  IconTools,
  IconQrcode,
  IconSearch,
  IconFolder,
  IconBell,
  IconKey,
  IconPlus,
  IconUpload,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/roles";

interface SidebarProps {
  role?: UserRole;
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: any;
  group: string;
  parentId?: string | null;
  children?: NavItem[];
}

const ICON_MAP: Record<string, any> = {
  IconHome,
  IconBuildingStore,
  IconBuilding,
  IconBed,
  IconUsers,
  IconUserCheck,
  IconCash,
  IconReceipt,
  IconFileText,
  IconClipboardCheck,
  IconArmchair,
  IconMessages,
  IconLock,
  IconSettings,
  IconShieldCheck,
  IconKey,
  IconChartBar,
  IconBell,
  IconUpload,
  IconTrendingUp,
  IconTools,
  IconQrcode,
  IconSearch,
  IconFolder,
  IconSparkles,
  IconRoute,
  IconPlus,
};

const adminNavItems: NavItem[] = [
  { id: "admin-1", href: "/platform/dashboard", label: "Executive Dashboard", icon: IconHome, group: "UTAMA" },
  { id: "admin-2", href: "/platform/owners", label: "Owner Management", icon: IconBuildingStore, group: "MANAJEMEN SAAS" },
  { id: "admin-3", href: "/platform/subscriptions", label: "Subscriptions & Billing", icon: IconCash, group: "MANAJEMEN SAAS" },
  { id: "admin-4", href: "/platform/roles", label: "Role & Permission Management", icon: IconLock, group: "SISTEM & KONFIGURASI" },
  { id: "admin-5", href: "/platform/menus", label: "Dynamic Menu Management", icon: IconRoute, group: "SISTEM & KONFIGURASI" },
  { id: "admin-6", href: "/platform/settings", label: "Platform Settings & Integrasi", icon: IconSettings, group: "SISTEM & KONFIGURASI" },
];

const ownerNavItems: NavItem[] = [
  { id: "owner-1", href: "/owner/dashboard", label: "Dashboard Utama", icon: IconHome, group: "UTAMA" },
  { id: "owner-2", href: "/properties", label: "Properti & Manajemen Unit", icon: IconBuilding, group: "PROPERTI & OPERASIONAL" },
  { id: "owner-3", href: "/operations/housekeeping-team", label: "Tim Operasional & Housekeeping", icon: IconSparkles, group: "PROPERTI & OPERASIONAL" },
  { id: "owner-4", href: "/tenants", label: "Penyewa & Kontrak", icon: IconUsers, group: "PENYEWA & KEUANGAN" },
  { id: "owner-5", href: "/finance", label: "Keuangan & Penagihan", icon: IconCash, group: "PENYEWA & KEUANGAN" },
];

const housekeepingNavItems: NavItem[] = [
  { id: "hk-1", href: "/housekeeping/room-grid", label: "Status Kamar Grid", icon: IconClipboardCheck, group: "LAPANGAN & UNIT" },
  { id: "hk-2", href: "/housekeeping/tenants", label: "Data Penghuni Lapangan", icon: IconUserCheck, group: "LAPANGAN & UNIT" },
  { id: "hk-3", href: "/housekeeping/inventories", label: "Kondisi Perabotan & Unit", icon: IconArmchair, group: "LAPANGAN & UNIT" },
  { id: "hk-4", href: "/housekeeping/unit-expenses", label: "Keuangan & Penagihan Unit", icon: IconCash, group: "KEUANGAN & KOMUNITAS" },
  { id: "hk-5", href: "/housekeeping/community", label: "Komunitas & Pengumuman", icon: IconMessages, group: "KEUANGAN & KOMUNITAS" },
];

const userNavItems: NavItem[] = [
  { id: "usr-1", href: "/portal/room", label: "Info Kamar Saya", icon: IconBed, group: "PORTAL KAMAR" },
  { id: "usr-2", href: "/portal/contract", label: "Kontrak & Dokumen", icon: IconFileText, group: "PORTAL KAMAR" },
  { id: "usr-3", href: "/portal/invoices", label: "Tagihan & Pembayaran", icon: IconReceipt, group: "PORTAL KAMAR" },
  { id: "usr-4", href: "/portal/community", label: "Komunitas Properti", icon: IconMessages, group: "KOMUNITAS" },
];

export function Sidebar({ role: initialRole }: SidebarProps) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole || UserRole.OWNER);
  const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[] | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const fetchDynamicMenus = useCallback(async (roleToFetch: UserRole) => {
    try {
      const res = await fetch("/api/admin/menus-flags", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.menuItems)) {
        // Filter menu items assigned to roleToFetch
        const rawItems = json.data.menuItems.filter((item: any) =>
          item.roles?.some((r: any) => r.code === roleToFetch)
        );

        if (rawItems.length > 0) {
          // Separate roots and children
          const rootItems = rawItems
            .filter((m: any) => !m.parentId)
            .sort((a: any, b: any) => a.order - b.order);

          const childItems = rawItems.filter((m: any) => Boolean(m.parentId));

          // Build tree hierarchy
          const tree: NavItem[] = rootItems.map((root: any) => {
            const childrenForRoot = childItems
              .filter((child: any) => child.parentId === root.id)
              .sort((a: any, b: any) => a.order - b.order)
              .map((child: any) => ({
                id: child.id,
                href: child.path,
                label: child.title,
                icon: ICON_MAP[child.icon] || IconRoute,
                group: child.group || root.group || "UTAMA",
                parentId: root.id,
              }));

            return {
              id: root.id,
              href: root.path,
              label: root.title,
              icon: ICON_MAP[root.icon] || IconRoute,
              group: root.group || "UTAMA",
              parentId: null,
              children: childrenForRoot.length > 0 ? childrenForRoot : undefined,
            };
          });

          setDynamicNavItems(tree);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load dynamic sidebar menus:", err);
    }
  }, []);

  useEffect(() => {
    if (!initialRole) {
      async function loadRole() {
        try {
          const res = await fetch("/api/auth/me");
          const json = await res.json();
          if (json.success && json.data?.role) {
            const userRole = json.data.role;
            setCurrentRole(userRole);
            fetchDynamicMenus(userRole);
          }
        } catch (err) {
          console.error("Failed to load user role in sidebar:", err);
        }
      }
      loadRole();
    } else {
      setCurrentRole(initialRole);
      fetchDynamicMenus(initialRole);
    }
  }, [initialRole, fetchDynamicMenus]);

  useEffect(() => {
    const handleMenuUpdated = () => {
      fetchDynamicMenus(currentRole);
    };

    window.addEventListener("menu-updated", handleMenuUpdated);
    return () => {
      window.removeEventListener("menu-updated", handleMenuUpdated);
    };
  }, [currentRole, fetchDynamicMenus]);

  let fallbackItems = ownerNavItems;
  if (currentRole === UserRole.PLATFORM_ADMIN) {
    fallbackItems = adminNavItems;
  } else if (currentRole === UserRole.HOUSEKEEPING) {
    fallbackItems = housekeepingNavItems;
  } else if (currentRole === UserRole.USER) {
    fallbackItems = userNavItems;
  }

  const items = dynamicNavItems && dynamicNavItems.length > 0 ? dynamicNavItems : fallbackItems;

  // Auto-expand parent if pathname matches any of its children
  useEffect(() => {
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((child) =>
          child.href === "/" ? pathname === "/" : pathname.startsWith(child.href)
        );
        if (hasActiveChild) {
          setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [pathname, items]);

  // Group root items by section header while preserving sequential order
  const groupOrder: string[] = [];
  const groupedItems = items.reduce((acc, item) => {
    const groupKey = item.group || "UTAMA";
    if (!acc[groupKey]) {
      acc[groupKey] = [];
      groupOrder.push(groupKey);
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

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

        {/* Navigation Items Grouped by Section Headers */}
        <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
          {groupOrder.map((groupTitle) => {
            const groupNavItems = groupedItems[groupTitle];
            return (
              <div key={groupTitle} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                  {groupTitle}
                </p>
                {groupNavItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const isParentActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  const IconComp = item.icon;
                  const isOpen = Boolean(openSubmenus[item.id]);

                  if (hasChildren) {
                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all text-left",
                            isParentActive
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                            <IconComp className="size-4 shrink-0" />
                            <span className="text-left leading-snug">{item.label}</span>
                          </div>
                          {isOpen ? (
                            <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground ml-1.5" />
                          ) : (
                            <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground ml-1.5" />
                          )}
                        </button>

                        {isOpen && item.children && (
                          <div className="ml-4 pl-2.5 border-l space-y-1 my-1">
                            {item.children.map((child) => {
                              const isChildActive =
                                child.href === "/"
                                  ? pathname === "/"
                                  : pathname.startsWith(child.href);
                              const ChildIconComp = child.icon;

                              return (
                                <Link
                                  key={child.id}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all text-left",
                                    isChildActive
                                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                  )}
                                >
                                  <ChildIconComp className="size-3.5 shrink-0" />
                                  <span className="text-left leading-snug">{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                        isParentActive
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <IconComp className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
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

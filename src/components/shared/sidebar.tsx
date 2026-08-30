"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import packageJson from "../../../package.json";
import {
  IconHome,
  IconHome2,
  IconBuildingStore,
  IconBuilding,
  IconBuildingCommunity,
  IconBuildingSkyscraper,
  IconBed,
  IconDoor,
  IconBath,
  IconWifi,
  IconBulb,
  IconDroplet,
  IconFlame,
  IconShirt,
  IconCar,
  IconBike,
  IconShieldLock,
  IconUsers,
  IconUserCheck,
  IconUser,
  IconUserPlus,
  IconUsersGroup,
  IconId,
  IconFingerprint,
  IconUserShield,
  IconUserCog,
  IconAddressBook,
  IconCash,
  IconReceipt,
  IconReceiptTax,
  IconWallet,
  IconCreditCard,
  IconBuildingBank,
  IconPercentage,
  IconCoins,
  IconCurrencyDollar,
  IconFileText,
  IconClipboardCheck,
  IconArmchair,
  IconMessages,
  IconMessageDots,
  IconBrandWhatsapp,
  IconMail,
  IconBroadcast,
  IconHeadset,
  IconHelpCircle,
  IconLock,
  IconSettings,
  IconShieldCheck,
  IconShield,
  IconKey,
  IconChartBar,
  IconChartPie,
  IconChartLine,
  IconReportAnalytics,
  IconCalculator,
  IconFileSpreadsheet,
  IconBell,
  IconUpload,
  IconTrendingUp,
  IconTools,
  IconQrcode,
  IconSearch,
  IconFolder,
  IconCornerDownRight,
  IconDatabase,
  IconServer,
  IconCloud,
  IconAdjustments,
  IconAdjustmentsHorizontal,
  IconHistory,
  IconGlobe,
  IconApi,
  IconCode,
  IconPlus,
  IconRoute,
  IconChevronDown,
  IconChevronRight,
  IconSparkles,
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
  IconHome2,
  IconBuildingStore,
  IconBuilding,
  IconBuildingCommunity,
  IconBuildingSkyscraper,
  IconBed,
  IconDoor,
  IconBath,
  IconWifi,
  IconBulb,
  IconDroplet,
  IconFlame,
  IconShirt,
  IconCar,
  IconBike,
  IconShieldLock,
  IconUsers,
  IconUserCheck,
  IconUser,
  IconUserPlus,
  IconUsersGroup,
  IconId,
  IconFingerprint,
  IconUserShield,
  IconUserCog,
  IconAddressBook,
  IconCash,
  IconReceipt,
  IconReceiptTax,
  IconWallet,
  IconCreditCard,
  IconBuildingBank,
  IconPercentage,
  IconCoins,
  IconCurrencyDollar,
  IconFileText,
  IconClipboardCheck,
  IconArmchair,
  IconMessages,
  IconMessageDots,
  IconBrandWhatsapp,
  IconMail,
  IconBroadcast,
  IconHeadset,
  IconHelpCircle,
  IconLock,
  IconSettings,
  IconShieldCheck,
  IconShield,
  IconKey,
  IconChartBar,
  IconChartPie,
  IconChartLine,
  IconReportAnalytics,
  IconCalculator,
  IconFileSpreadsheet,
  IconBell,
  IconUpload,
  IconTrendingUp,
  IconTools,
  IconQrcode,
  IconSearch,
  IconFolder,
  IconCornerDownRight,
  IconDatabase,
  IconServer,
  IconCloud,
  IconAdjustments,
  IconAdjustmentsHorizontal,
  IconHistory,
  IconGlobe,
  IconApi,
  IconCode,
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
  { id: "owner-4", href: "/operations/maintenance-reports", label: "Pusat Laporan & Maintenance", icon: IconTools, group: "PROPERTI & OPERASIONAL" },
  { id: "owner-5", href: "/tenants", label: "Penyewa & Kontrak", icon: IconUsers, group: "PENYEWA & KEUANGAN" },
  { id: "owner-6", href: "/finance", label: "Keuangan & Penagihan", icon: IconCash, group: "PENYEWA & KEUANGAN" },
  { id: "owner-7", href: "/owner/faq", label: "FAQ & Bantuan", icon: IconHelpCircle, group: "BANTUAN" },
];

const housekeepingNavItems: NavItem[] = [
  { id: "hk-1", href: "/housekeeping/room-grid", label: "Status Kamar Grid", icon: IconClipboardCheck, group: "LAPANGAN & UNIT" },
  { id: "hk-2", href: "/housekeeping/maintenance-reports", label: "Laporan & Tugas Lapangan", icon: IconTools, group: "LAPANGAN & UNIT" },
  { id: "hk-3", href: "/housekeeping/tenants", label: "Data Penghuni Lapangan", icon: IconUserCheck, group: "LAPANGAN & UNIT" },
  { id: "hk-4", href: "/housekeeping/inventories", label: "Kondisi Perabotan & Unit", icon: IconArmchair, group: "LAPANGAN & UNIT" },
  { id: "hk-5", href: "/housekeeping/unit-expenses", label: "Keuangan & Penagihan Unit", icon: IconCash, group: "KEUANGAN & KOMUNITAS" },
  { id: "hk-6", href: "/housekeeping/community", label: "Komunitas & Pengumuman", icon: IconMessages, group: "KEUANGAN & KOMUNITAS" },
];

const userNavItems: NavItem[] = [
  { id: "usr-1", href: "/portal/room", label: "Info Kamar Saya", icon: IconBed, group: "PORTAL KAMAR" },
  { id: "usr-2", href: "/portal/contract", label: "Kontrak & Dokumen", icon: IconFileText, group: "PORTAL KAMAR" },
  { id: "usr-3", href: "/portal/invoices", label: "Tagihan & Pembayaran", icon: IconReceipt, group: "PORTAL KAMAR" },
  { id: "usr-4", href: "/portal/community", label: "Komunitas Properti", icon: IconMessages, group: "KOMUNITAS" },
];

const ROUTE_FEATURE_MAP: Record<string, { code: string; label: string }> = {
  "/properties": { code: "PROP_MGMT", label: "Manajemen Properti & Inventory" },
  "/operations/housekeeping-team": { code: "HOUSEKEEPING_MODULE", label: "Modul Tim Operational Housekeeping" },
  "/operations/maintenance-reports": { code: "HOUSEKEEPING_MODULE", label: "Pusat Laporan & Maintenance" },
  "/housekeeping/maintenance-reports": { code: "HOUSEKEEPING_MODULE", label: "Laporan & Tugas Lapangan" },
  "/tenant-&-contract": { code: "TENANT_MGMT", label: "Manajemen Penyewa & Kontrak" },
  "/tenants": { code: "TENANT_MGMT", label: "Manajemen Penyewa & Kontrak" },
  "/tenant-contract": { code: "TENANT_MGMT", label: "Manajemen Penyewa & Kontrak" },
  "/finance": { code: "FINANCIAL_ANALYTICS", label: "Analitik & Insights Keuangan SaaS" },
  "/finance/expenses": { code: "FINANCIAL_ANALYTICS", label: "Analitik & Insights Keuangan SaaS" },
  "/reports": { code: "FINANCIAL_ANALYTICS", label: "Analitik & Insights Keuangan SaaS" },
};

function getTemplateItemsForRole(r: UserRole): NavItem[] {
  switch (r) {
    case UserRole.PLATFORM_ADMIN:
      return adminNavItems;
    case UserRole.HOUSEKEEPING:
      return housekeepingNavItems;
    case UserRole.USER:
    case UserRole.TENANT:
      return userNavItems;
    default:
      return ownerNavItems;
  }
}

export function Sidebar({ role: initialRole }: SidebarProps) {
  const pathname = usePathname();

  // Hide sidebar on standalone pages like /owner/subscription
  if (pathname === "/owner/subscription" || pathname.startsWith("/owner/subscription")) {
    return null;
  }

  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole || UserRole.OWNER);
  const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[] | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // SaaS Feature Gating State
  const [enabledFeatureCodes, setEnabledFeatureCodes] = useState<string[]>([]);
  const [saasPlanName, setSaasPlanName] = useState<string>("Perintis");
  const [highestPlanName, setHighestPlanName] = useState<string>("Juragan");
  const [closestPlanMap, setClosestPlanMap] = useState<Record<string, string>>({});
  const [lockedFeatureModal, setLockedFeatureModal] = useState<{
    featureName: string;
    featureCode?: string;
    requiredPlan?: string;
    route: string;
  } | null>(null);

  const fetchSaaSStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/saas-status");
      const json = await res.json();
      if (json.success && json.data) {
        setEnabledFeatureCodes(json.data.enabledFeatureCodes || []);
        setSaasPlanName(json.data.planName || "Perintis");
        setHighestPlanName(json.data.highestPlanName || "Juragan");
        setClosestPlanMap(json.data.closestPlanMap || {});
      }
    } catch (err) {
      console.warn("Failed to fetch owner SaaS status for sidebar:", err);
    }
  }, []);

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
          const templateList = getTemplateItemsForRole(roleToFetch);

          // Helper to resolve group name from template list or item data
          const resolveGroup = (path: string, itemGroup?: string) => {
            const matched = templateList.find((t) => t.href === path);
            if (matched?.group) return matched.group;
            if (itemGroup && itemGroup !== "UTAMA") return itemGroup;
            return "UTAMA";
          };

          // Separate roots and children
          const rootItems = rawItems
            .filter((m: any) => !m.parentId)
            .sort((a: any, b: any) => a.order - b.order);

          const childItems = rawItems.filter((m: any) => Boolean(m.parentId));

          // Build tree hierarchy
          const tree: NavItem[] = rootItems.map((root: any) => {
            const rootGroup = resolveGroup(root.path, root.group);

            const childrenForRoot = childItems
              .filter((child: any) => child.parentId === root.id)
              .sort((a: any, b: any) => a.order - b.order)
              .map((child: any) => ({
                id: child.id,
                href: child.path,
                label: child.title,
                icon: ICON_MAP[child.icon] || IconRoute,
                group: resolveGroup(child.path, child.group || rootGroup),
                parentId: root.id,
              }));

            return {
              id: root.id,
              href: root.path,
              label: root.title,
              icon: ICON_MAP[root.icon] || IconRoute,
              group: rootGroup,
              parentId: null,
              children: childrenForRoot.length > 0 ? childrenForRoot : undefined,
            };
          });

          setDynamicNavItems(tree);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to load dynamic sidebar menus:", err);
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
            if (userRole === UserRole.OWNER) {
              fetchSaaSStatus();
            }
          }
        } catch (err) {
          console.warn("Failed to load user role in sidebar:", err);
        }
      }
      loadRole();
    } else {
      setCurrentRole(initialRole);
      fetchDynamicMenus(initialRole);
      if (initialRole === UserRole.OWNER) {
        fetchSaaSStatus();
      }
    }
  }, [initialRole, fetchDynamicMenus, fetchSaaSStatus]);

  useEffect(() => {
    if (currentRole === UserRole.OWNER) {
      fetchSaaSStatus();
    }
  }, [currentRole, fetchSaaSStatus]);

  useEffect(() => {
    const handleMenuUpdated = () => {
      fetchDynamicMenus(currentRole);
      if (currentRole === UserRole.OWNER) {
        fetchSaaSStatus();
      }
    };

    window.addEventListener("menu-updated", handleMenuUpdated);
    return () => {
      window.removeEventListener("menu-updated", handleMenuUpdated);
    };
  }, [currentRole, fetchDynamicMenus, fetchSaaSStatus]);

  const fallbackItems = getTemplateItemsForRole(currentRole);

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
        return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800";
      case UserRole.OWNER:
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800";
      case UserRole.HOUSEKEEPING:
        return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800";
      case UserRole.USER:
      case UserRole.TENANT:
        return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen flex flex-col justify-between p-4 shrink-0 shadow-sm font-sans hidden lg:flex overflow-x-hidden transition-colors">
      {/* Upper Brand & Navigation */}
      <div className="space-y-6">
        {/* App Brand Header */}
        <div className="border-b border-sidebar-border pb-4 px-1 space-y-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#8FA28A] to-[#C8A96B] p-0.5 shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="h-full w-full bg-sidebar rounded-[10px] flex items-center justify-center">
                <IconBuildingStore className="h-5 w-5 text-[#C8A96B]" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-base font-black tracking-wide text-sidebar-foreground block leading-none truncate">
                ARVENTA
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase block mt-0.5 truncate">
                Property Management
              </span>
            </div>
          </Link>

        </div>

        {/* Grouped Sidebar Navigation */}
        <nav className="space-y-5">
          {groupOrder.map((groupName) => {
            const groupNavs = groupedItems[groupName];
            return (
              <div key={groupName} className="space-y-1.5">
                <h4 className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">
                  {groupName}
                </h4>

                <div className="space-y-1">
                  {groupNavs.map((item) => {
                    const IconComponent = item.icon || IconRoute;
                    const hasChildren = item.children && item.children.length > 0;
                    const isParentActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    const isOpen = Boolean(openSubmenus[item.id]);

                    if (hasChildren) {
                      return (
                        <div key={item.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleSubmenu(item.id)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group text-left",
                              isParentActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold border border-sidebar-border"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors",
                                  isParentActive
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                                )}
                              />
                              <span>{item.label}</span>
                            </div>
                            {isOpen ? (
                              <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>

                          {/* Submenu Dropdown */}
                          {isOpen && (
                            <div className="pl-6 space-y-1 border-l border-sidebar-border ml-4">
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon || IconRoute;
                                const isChildActive =
                                  pathname === child.href ||
                                  (child.href !== "/" && pathname.startsWith(child.href));

                                const childReqFeat = ROUTE_FEATURE_MAP[child.href];
                                const isChildLocked =
                                  currentRole === UserRole.OWNER &&
                                  Boolean(childReqFeat) &&
                                  !enabledFeatureCodes.includes(childReqFeat!.code);

                                if (isChildLocked) {
                                  const targetPlan = closestPlanMap[childReqFeat.code]
                                    ? `Paket ${closestPlanMap[childReqFeat.code]}`
                                    : `Paket ${highestPlanName}`;

                                  return (
                                    <button
                                      key={child.id}
                                      type="button"
                                      onClick={() =>
                                        setLockedFeatureModal({
                                          featureName: childReqFeat.label,
                                          featureCode: childReqFeat.code,
                                          requiredPlan: targetPlan,
                                          route: child.href,
                                        })
                                      }
                                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 text-left opacity-75 hover:opacity-100 bg-sidebar-accent/30 text-sidebar-foreground/60 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <ChildIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span>{child.label}</span>
                                      </div>
                                      <span className="flex items-center justify-center p-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 shrink-0">
                                        <IconLock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      </span>
                                    </button>
                                  );
                                }

                                return (
                                  <Link
                                    key={child.id}
                                    href={child.href}
                                    className={cn(
                                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left",
                                      isChildActive
                                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                  >
                                    <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span>{child.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const requiredFeat = ROUTE_FEATURE_MAP[item.href];
                    const isLocked =
                      currentRole === UserRole.OWNER &&
                      Boolean(requiredFeat) &&
                      !enabledFeatureCodes.includes(requiredFeat!.code);

                    if (isLocked) {
                      const targetPlan = closestPlanMap[requiredFeat.code]
                        ? `Paket ${closestPlanMap[requiredFeat.code]}`
                        : `Paket ${highestPlanName}`;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setLockedFeatureModal({
                              featureName: requiredFeat.label,
                              featureCode: requiredFeat.code,
                              requiredPlan: targetPlan,
                              route: item.href,
                            })
                          }
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group text-left opacity-75 hover:opacity-100 bg-sidebar-accent/30 text-sidebar-foreground/60 border border-transparent hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{item.label}</span>
                          </div>
                          <span className="flex items-center justify-center p-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 shrink-0">
                            <IconLock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                          isParentActive
                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <IconComponent
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isParentActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Version */}
      <div className="border-t border-sidebar-border pt-4 px-2 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Versi App</span>
          <span className="font-mono font-bold text-sidebar-foreground">v{packageJson.version}</span>
        </div>
        <p className="text-[9px] text-muted-foreground text-center font-medium">
          © 2026 Arventa SaaS Property. All rights reserved.
        </p>
      </div>

      {/* Locked Feature Upgrade Modal */}
      {lockedFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <IconLock className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground">Fitur SaaS Terkunci</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fitur <strong className="text-foreground">{lockedFeatureModal.featureName}</strong> belum termasuk dalam paket langganan <strong className="text-amber-700 dark:text-amber-400 font-extrabold">{saasPlanName}</strong> Anda saat ini.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-left text-xs space-y-1 border border-amber-500/20">
              <span className="text-[10px] font-black tracking-wider text-amber-800 dark:text-amber-400 uppercase block">
                Tersedia Di:
              </span>
              <p className="font-black text-amber-950 dark:text-amber-200 text-xs">
                {lockedFeatureModal.requiredPlan || "Paket Pro Tier"} <span className="font-semibold text-muted-foreground">atau Add-On Modul SaaS</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setLockedFeatureModal(null)}
                className="flex-1 py-2 rounded-xl border border-input text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href="/owner/subscription"
                onClick={() => setLockedFeatureModal(null)}
                className="flex-1 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold text-center shadow-md cursor-pointer"
              >
                Upgrade Paket
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

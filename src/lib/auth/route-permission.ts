import { prisma } from "@/lib/prisma";

export interface RouteValidationResult {
  allowed: boolean;
  redirectUrl?: string;
}

const DEFAULT_HOME_ROUTES: Record<string, string> = {
  PLATFORM_ADMIN: "/platform/dashboard",
  OWNER: "/owner/dashboard",
  HOUSEKEEPING: "/housekeeping/room-grid",
  TENANT: "/portal/room",
  USER: "/portal/room",
};

export function getDefaultHomeRoute(role?: string | null): string {
  if (!role) return "/login";
  const normalizedRole = role === "USER" ? "TENANT" : role;
  return DEFAULT_HOME_ROUTES[normalizedRole] || DEFAULT_HOME_ROUTES[role] || "/login";
}

// ---------------------------------------------------------------------------
// In-memory cache for dynamic menu permissions (60s TTL)
// Avoids executing heavy MenuItem findMany queries on every page transition
// ---------------------------------------------------------------------------
let cachedMenuItems: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function getCachedMenuItems() {
  const now = Date.now();
  if (cachedMenuItems && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedMenuItems;
  }
  const items = await prisma.menuItem.findMany({
    include: {
      roleMenus: {
        include: {
          role: { select: { code: true } },
        },
      },
    },
  });
  cachedMenuItems = items;
  lastCacheTime = now;
  return items;
}

/**
 * Validates whether a given userRole is authorized to access a target pathname
 * based on dynamic MenuItem & RoleMenu database mappings.
 */
export async function validateRouteAccess(
  role: string | null | undefined,
  pathname: string
): Promise<RouteValidationResult> {
  const userRole = role || "OWNER";
  const normalizedUserRole = userRole === "USER" ? "TENANT" : userRole;
  const defaultHome = getDefaultHomeRoute(normalizedUserRole);

  // Normalize target pathname (strip trailing slash)
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // 1. Root / Generic entry paths redirect to role default home
  if (cleanPath === "" || cleanPath === "/" || cleanPath === "/dashboard" || cleanPath === "/overview") {
    return {
      allowed: false,
      redirectUrl: defaultHome,
    };
  }

  // 2. Handling prefix base paths
  if (cleanPath === "/portal" || cleanPath === "/portal/dashboard") {
    if (normalizedUserRole === "TENANT") {
      return { allowed: false, redirectUrl: "/portal/room" };
    }
    return { allowed: false, redirectUrl: defaultHome };
  }

  if (cleanPath === "/owner") {
    if (normalizedUserRole === "OWNER") {
      return { allowed: false, redirectUrl: "/owner/dashboard" };
    }
    return { allowed: false, redirectUrl: defaultHome };
  }

  if (cleanPath === "/housekeeping" || cleanPath === "/housekeeping/dashboard") {
    if (normalizedUserRole === "HOUSEKEEPING") {
      return { allowed: false, redirectUrl: "/housekeeping/room-grid" };
    }
    return { allowed: false, redirectUrl: defaultHome };
  }

  if (cleanPath === "/platform") {
    if (normalizedUserRole === "PLATFORM_ADMIN") {
      return { allowed: false, redirectUrl: "/platform/dashboard" };
    }
    return { allowed: false, redirectUrl: defaultHome };
  }

  // 3. Fetch all dynamic menu items with their assigned roles from database (cached)
  try {
    const menuItems = await getCachedMenuItems();

    // Find dynamic menu items matching requested path
    const matchingMenus = menuItems.filter((item: any) => {
      const menuPath = item.path.replace(/\/$/, "");
      if (cleanPath === menuPath) return true;
      if (cleanPath.startsWith(menuPath + "/")) return true;

      // Alias handling for tenant-contract & tenants
      if (
        menuPath === "/tenant-&-contract" &&
        (cleanPath.startsWith("/tenant-contract") || cleanPath.startsWith("/tenants"))
      ) {
        return true;
      }
      return false;
    });

    if (matchingMenus.length > 0) {
      // Gather all role codes allowed for these matching menus
      const allowedRoles = new Set<string>();
      for (const menu of matchingMenus) {
        for (const rm of menu.roleMenus) {
          const roleCode = rm.role.code;
          allowedRoles.add(roleCode);
          if (roleCode === "TENANT") allowedRoles.add("USER");
          if (roleCode === "USER") allowedRoles.add("TENANT");
        }
      }

      const isAllowed = allowedRoles.has(normalizedUserRole) || allowedRoles.has(userRole);

      if (!isAllowed) {
        return {
          allowed: false,
          redirectUrl: defaultHome,
        };
      }

      return { allowed: true };
    }
  } catch (err) {
    console.warn("Error fetching dynamic route permissions from DB:", err);
  }

  // 4. Prefix fallback guard rules
  if (cleanPath.startsWith("/portal/")) {
    // /portal/community (History Komunitas) is accessible to OWNER, TENANT, and HOUSEKEEPING
    if (cleanPath === "/portal/community") {
      if (normalizedUserRole !== "TENANT" && normalizedUserRole !== "OWNER" && normalizedUserRole !== "HOUSEKEEPING") {
        return { allowed: false, redirectUrl: defaultHome };
      }
    } else if (normalizedUserRole !== "TENANT") {
      return { allowed: false, redirectUrl: defaultHome };
    }
  }

  if (cleanPath.startsWith("/platform/")) {
    if (normalizedUserRole !== "PLATFORM_ADMIN") {
      return { allowed: false, redirectUrl: defaultHome };
    }
  }

  if (cleanPath.startsWith("/housekeeping/")) {
    if (normalizedUserRole !== "HOUSEKEEPING" && normalizedUserRole !== "OWNER") {
      return { allowed: false, redirectUrl: defaultHome };
    }
  }

  if (
    cleanPath.startsWith("/owner/") ||
    cleanPath.startsWith("/properties") ||
    cleanPath.startsWith("/properti") ||
    cleanPath.startsWith("/units") ||
    cleanPath.startsWith("/operations") ||
    cleanPath.startsWith("/finance") ||
    cleanPath.startsWith("/reports") ||
    cleanPath.startsWith("/tenants") ||
    cleanPath.startsWith("/tenant-contract")
  ) {
    if (normalizedUserRole !== "OWNER" && normalizedUserRole !== "PLATFORM_ADMIN") {
      return { allowed: false, redirectUrl: defaultHome };
    }
  }

  return { allowed: true };
}

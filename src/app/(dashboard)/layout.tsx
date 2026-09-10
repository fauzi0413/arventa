import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isMaintenanceModeActive } from "@/lib/settings";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { validateRouteAccess } from "@/lib/auth/route-permission";

// ---------------------------------------------------------------------------
// (dashboard) Layout — Sidebar + Header + Main Content + Dynamic Route Guard
// ---------------------------------------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  const authUser = await getAuthenticatedUser();

  // 1. Check live Maintenance Mode status directly from database
  const isMaintenance = await isMaintenanceModeActive();

  if (isMaintenance) {
    const isPlatformAdmin = authUser?.role === "PLATFORM_ADMIN";
    if (!isPlatformAdmin) {
      redirect("/maintenance");
    }
  }

  // 2. Dynamic Route Authorization Guard based on MenuItem & RoleMenu database
  if (pathname) {
    const accessResult = await validateRouteAccess(authUser?.role, pathname);
    if (!accessResult.allowed && accessResult.redirectUrl) {
      redirect(accessResult.redirectUrl);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar role={authUser?.role} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

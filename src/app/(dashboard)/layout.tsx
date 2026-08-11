import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { redirect } from "next/navigation";
import { isMaintenanceModeActive } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// (dashboard) Layout — Sidebar + Header + Main Content + Maintenance Enforcement
// ---------------------------------------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check live Maintenance Mode status directly from database
  const isMaintenance = await isMaintenanceModeActive();

  if (isMaintenance) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isPlatformAdmin = false;

    if (user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true },
      });

      const userRole = dbUser?.role || user.user_metadata?.role;
      isPlatformAdmin = userRole === "PLATFORM_ADMIN";
    }

    if (!isPlatformAdmin) {
      redirect("/maintenance");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

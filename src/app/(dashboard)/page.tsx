"use client";

import { useEffect, useState } from "react";
import { IconLoader2, IconAlertCircle } from "@tabler/icons-react";
import { UserRole } from "@/types/roles";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { HousekeepingDashboard } from "@/components/dashboard/housekeeping-dashboard";
import { TenantDashboard } from "@/components/dashboard/tenant-dashboard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();

        if (json.success && json.data) {
          setStatsData(json.data);
        } else {
          setError(json.message || "Gagal mengambil data dashboard.");
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Terjadi kesalahan koneksi saat memuat dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Memuat data dashboard ARVENTA...</p>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <IconAlertCircle className="size-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Gagal Memuat Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">{error || "Data tidak tersedia."}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Render role dashboard based on role
  switch (statsData.role) {
    case UserRole.PLATFORM_ADMIN:
      return <AdminDashboard data={statsData} />;
    case UserRole.OWNER:
      return <OwnerDashboard data={statsData} />;
    case UserRole.HOUSEKEEPING:
      return <HousekeepingDashboard data={statsData} />;
    case UserRole.USER:
    case UserRole.TENANT:
      return <TenantDashboard data={statsData} />;
    default:
      return <OwnerDashboard data={statsData} />;
  }
}

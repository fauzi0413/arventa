"use client";

import { useState } from "react";
import {
  IconBuilding,
  IconBed,
  IconReceipt,
  IconShieldCheck,
  IconUsers,
  IconActivity,
  IconArrowUpRight,
  IconBuildingStore,
  IconChecklist,
  IconSparkles,
  IconLock,
  IconRoute,
  IconSettings,
  IconCheck,
  IconX,
  IconCpu,
  IconDatabase,
  IconClock,
  IconKey,
  IconMail,
  IconAlertCircle,
  IconUserPlus,
  IconEye,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminDashboardProps {
  data: {
    user: { fullName: string; email: string };
    totalRevenue: number;
    activeSubscriptionsCount: number;
    totalProperties: number;
    totalUnits: number;
    systemHealth: {
      apiLatencyMs: number;
      dbConnectionPool: string;
      cronJobStatus: string;
      uptimePercentage: string;
    };
    saasInvoices: Array<{
      id: string;
      invoiceNumber: string;
      amount: number;
      status: string;
      ownerName: string;
      planName: string;
      createdAt: string;
    }>;
    saasPlans: Array<{
      id: string;
      name: string;
      maxProperties: number;
      maxUnits: number;
      subscriberCount: number;
      priceMonthly: number;
      features: string[];
    }>;
    owners: Array<{
      id: string;
      fullName: string;
      email: string;
      phoneNumber: string | null;
      isActive: boolean;
      propertyCount: number;
    }>;
    masterRoles: Array<{
      id: string;
      name: string;
      code: string;
      isSystem: boolean;
      userCount: number;
      permissionCount: number;
    }>;
    featureFlags: Array<{
      id: string;
      key: string;
      name: string;
      isEnabled: boolean;
    }>;
    recentLogs: Array<{
      id: string;
      action: string;
      entityName: string;
      userName: string;
      createdAt: string;
    }>;
  };
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "owners" | "subscriptions" | "roles" | "menus" | "settings"
  >("overview");

  const [ownersState, setOwnersState] = useState(data.owners);
  const [flagsState, setFlagsState] = useState(data.featureFlags);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const toggleOwnerStatus = (ownerId: string) => {
    setOwnersState((prev) =>
      prev.map((o) => (o.id === ownerId ? { ...o, isActive: !o.isActive } : o))
    );
  };

  const toggleFlag = (flagId: string) => {
    setFlagsState((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, isEnabled: !f.isEnabled } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs tracking-wide uppercase">
                <IconShieldCheck className="mr-1 size-3.5" /> Platform Admin Master Portal
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Executive Hub — {data.user.fullName}
            </h1>
            <p className="mt-1 text-sm text-purple-200/80">
              Kelola ekosistem SaaS ARVENTA, data owner, paket langganan, permission matrix, dan integrasi API.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={maintenanceMode ? "destructive" : "secondary"}
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className="font-semibold text-xs gap-1.5"
            >
              <IconAlertCircle className="size-4" />
              {maintenanceMode ? "Maintenance Mode: AKTIF" : "Mode Maintenance: Off"}
            </Button>
          </div>
        </div>
      </div>

      {/* Module Tabs Bar (No raw emojis in text labels) */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: "overview", label: "Executive Dashboard", icon: IconActivity },
          { id: "owners", label: "Owner Management", icon: IconBuildingStore },
          { id: "subscriptions", label: "Subscriptions & Billing", icon: IconReceipt },
          { id: "roles", label: "Roles & Permissions", icon: IconLock },
          { id: "menus", label: "Dynamic Menus & Feature Flags", icon: IconRoute },
          { id: "settings", label: "Platform & API Settings", icon: IconSettings },
        ].map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id as any)}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Revenue SaaS
                  </span>
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                    <IconReceipt className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{formatIDR(data.totalRevenue)}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    MRR / ARR Pembayaran Owner
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Owner Aktif
                  </span>
                  <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
                    <IconUsers className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{data.activeSubscriptionsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pelanggan Aktif Paket SaaS</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Properti
                  </span>
                  <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
                    <IconBuilding className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{data.totalProperties}</p>
                  <p className="text-xs text-muted-foreground mt-1">Gedung Properti Platform</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Kamar Terdaftar
                  </span>
                  <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                    <IconBed className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{data.totalUnits}</p>
                  <p className="text-xs text-muted-foreground mt-1">Kamar & Unit di Seluruh Sistem</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm bg-gradient-to-r from-slate-900 to-slate-950 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconCpu className="size-5 text-emerald-400" />
                System Health & Telemetry Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4 text-xs">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">API Response Latency</span>
                <p className="text-lg font-bold text-emerald-400">{data.systemHealth?.apiLatencyMs || 42} ms</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Database Pool</span>
                <p className="text-xs font-bold text-slate-200 truncate">{data.systemHealth?.dbConnectionPool}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Cron Jobs</span>
                <p className="text-xs font-bold text-slate-200 truncate">{data.systemHealth?.cronJobStatus}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">System Uptime</span>
                <p className="text-lg font-bold text-blue-400">{data.systemHealth?.uptimePercentage || "99.9%"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconActivity className="size-5 text-purple-600" />
                Recent Registrations & Security Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {data.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{log.userName}</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{log.action}</Badge>
                    <span className="text-muted-foreground">{log.entityName}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString("id-ID")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: OWNER MANAGEMENT */}
      {activeTab === "owners" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconBuildingStore className="size-5 text-blue-600" />
                Daftar Owner Properti Terdaftar
              </CardTitle>
              <CardDescription>Kelola status akun, onboarding owner baru, dan suspend/unsuspend.</CardDescription>
            </div>
            <Button size="sm" className="font-semibold text-xs gap-1.5" onClick={() => alert("Form Onboarding Owner Baru dibuka")}>
              <IconUserPlus className="size-4" /> Onboard Owner Baru
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-xl border">
              {ownersState.map((o) => (
                <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{o.fullName}</span>
                      <Badge variant={o.isActive ? "default" : "destructive"} className="text-[10px]">
                        {o.isActive ? "Aktif" : "Suspended"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{o.email} • 📱 {o.phoneNumber || "081222222222"}</p>
                    <span className="text-[11px] font-medium text-primary">Dimiliki: {o.propertyCount} Properti</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={o.isActive ? "destructive" : "outline"}
                      onClick={() => toggleOwnerStatus(o.id)}
                      className="text-xs h-8"
                    >
                      {o.isActive ? "Suspend Akun" : "Unsuspend Akun"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SUBSCRIPTIONS & BILLING */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconReceipt className="size-5 text-indigo-600" />
                Paket Langganan SaaS (Tier Settings)
              </CardTitle>
              <CardDescription>Atur batas limit kamar & fitur untuk tier Basic, Business, dan Pro.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {data.saasPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-foreground">{plan.name}</span>
                    <Badge variant="secondary" className="text-xs">{plan.subscriberCount} Owner</Badge>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">
                    {formatIDR(plan.priceMonthly)} <span className="text-xs font-normal text-muted-foreground">/bln</span>
                  </p>
                  <div className="space-y-1 text-xs border-t pt-2">
                    <p>✓ Maks Properti: <strong>{plan.maxProperties} Gedung</strong></p>
                    <p>✓ Maks Unit: <strong>{plan.maxUnits} Kamar</strong></p>
                    {plan.features.map((f) => (
                      <p key={f} className="text-muted-foreground">✓ {f}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: ROLES & PERMISSION MATRIX */}
      {activeTab === "roles" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconLock className="size-5 text-purple-600" />
              Role & Granular Permission Matrix
            </CardTitle>
            <CardDescription>Pemetaan hak akses sistem (Read, Create, Edit, Delete) per role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {data.masterRoles.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 text-xs space-y-1">
                  <span className="font-bold text-foreground text-sm">{r.name}</span>
                  <p className="text-muted-foreground">Code: {r.code}</p>
                  <Badge variant="outline" className="text-[10px]">{r.userCount} Pengguna</Badge>
                </div>
              ))}
            </div>

            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Modul</th>
                    <th className="p-3 text-center">Platform Admin</th>
                    <th className="p-3 text-center">Owner</th>
                    <th className="p-3 text-center">Housekeeping</th>
                    <th className="p-3 text-center">Tenant</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { module: "Manajemen Properti & Kamar", admin: "Full", owner: "Full", hk: "Read/Status", tenant: "Read" },
                    { module: "Keuangan & OpEx", admin: "Full", owner: "Full", hk: "OpEx Input", tenant: "Invoice Pay" },
                    { module: "Penugasan Housekeeping", admin: "Full", owner: "Full", hk: "Read", tenant: "None" },
                    { module: "Kontrak & Check-In", admin: "Full", owner: "Full", hk: "Fast Checkin", tenant: "PDF Read" },
                  ].map((row) => (
                    <tr key={row.module}>
                      <td className="p-3 font-bold">{row.module}</td>
                      <td className="p-3 text-center"><Badge variant="default">{row.admin}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="secondary">{row.owner}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline">{row.hk}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline">{row.tenant}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: DYNAMIC MENUS & FEATURE FLAGS */}
      {activeTab === "menus" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconRoute className="size-5 text-amber-500" />
              Dynamic Feature Flags & Menu Access Toggles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flagsState.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between border p-3 rounded-lg text-xs">
                <div>
                  <p className="font-bold text-foreground">{flag.name}</p>
                  <p className="text-[11px] text-muted-foreground">Key: {flag.key}</p>
                </div>
                <Button
                  size="sm"
                  variant={flag.isEnabled ? "default" : "outline"}
                  onClick={() => toggleFlag(flag.id)}
                  className="text-xs h-8"
                >
                  {flag.isEnabled ? "ON (Aktif)" : "OFF (Non-aktif)"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: PLATFORM & API SETTINGS */}
      {activeTab === "settings" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconSettings className="size-5 text-blue-500" />
              Konfigurasi Platform & API Gateway Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg border p-3 space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <IconKey className="size-4 text-amber-500" /> Gemini AI API Key Gateway
              </span>
              <p className="text-muted-foreground">Status: Connected (Generative AI Financial Analytics Enabled)</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <IconMail className="size-4 text-emerald-500" /> Resend Email Gateway
              </span>
              <p className="text-muted-foreground">Status: Connected (Automated Email Invoicing Active)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

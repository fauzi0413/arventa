"use client";

import { useState } from "react";
import {
  IconBuilding,
  IconBed,
  IconReceipt,
  IconShieldCheck,
  IconUsers,
  IconActivity,
  IconBuildingStore,
  IconLock,
  IconRoute,
  IconSettings,
  IconCpu,
  IconKey,
  IconMail,
  IconUserPlus,
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
      {/* Header Hero Banner (ARVENTRA Brand Dark Sage & Gold) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconShieldCheck className="mr-1 size-3.5 text-[#C8A96B]" /> PLATFORM ADMIN MASTER PORTAL
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Platform Executive Hub — {data.user.fullName}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Kelola ekosistem SaaS ARVENTRA, data owner, paket langganan, permission matrix, dan integrasi API.
            </p>
          </div>
        </div>
      </div>

      {/* Module Tabs Bar (ARVENTRA Sage Theme) */}
      <div className="flex flex-wrap gap-2 border-b border-[#C7D3C0]/40 pb-3">
        {[
          { id: "overview", label: "Executive Dashboard", icon: IconActivity },
          { id: "owners", label: "Owner Management", icon: IconBuildingStore },
          { id: "subscriptions", label: "Subscriptions & Billing", icon: IconReceipt },
          { id: "roles", label: "Roles & Permissions", icon: IconLock },
          { id: "menus", label: "Dynamic Menus & Feature Flags", icon: IconRoute },
          { id: "settings", label: "Platform & API Settings", icon: IconSettings },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-bold gap-1.5 h-9 rounded-xl transition-all ${
                isActive
                  ? "bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white shadow-sm"
                  : "border-[#C7D3C0]/60 hover:bg-[#C7D3C0]/20 text-gray-700 dark:text-gray-300 dark:border-[#383E36]"
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Revenue SaaS
                  </span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2.5 text-[#8FA28A]">
                    <IconReceipt className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#2F332E] dark:text-white">{formatIDR(data.totalRevenue)}</p>
                  <p className="text-xs text-[#8FA28A] font-bold mt-1">
                    MRR / ARR Pembayaran Owner
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner Aktif
                  </span>
                  <div className="rounded-xl bg-[#C8A96B]/15 p-2.5 text-[#C8A96B]">
                    <IconUsers className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#2F332E] dark:text-white">{data.activeSubscriptionsCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pelanggan Aktif Paket SaaS</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Properti
                  </span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2.5 text-[#8FA28A]">
                    <IconBuilding className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#2F332E] dark:text-white">{data.totalProperties}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gedung Properti Platform</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Kamar Terdaftar
                  </span>
                  <div className="rounded-xl bg-[#C8A96B]/15 p-2.5 text-[#C8A96B]">
                    <IconBed className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-[#2F332E] dark:text-white">{data.totalUnits}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kamar & Unit di Seluruh Sistem</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health Status Card */}
          <Card className="rounded-2xl border border-[#383E36] bg-[#1E221E] text-white shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconCpu className="size-5 text-[#8FA28A]" />
                System Health & Telemetry Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4 text-xs">
              <div className="rounded-xl border border-[#383E36] bg-[#242823] p-3 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">API Response Latency</span>
                <p className="text-lg font-black text-[#8FA28A]">{data.systemHealth?.apiLatencyMs || 42} ms</p>
              </div>
              <div className="rounded-xl border border-[#383E36] bg-[#242823] p-3 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Database Pool</span>
                <p className="text-xs font-bold text-gray-200 truncate">{data.systemHealth?.dbConnectionPool}</p>
              </div>
              <div className="rounded-xl border border-[#383E36] bg-[#242823] p-3 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Cron Jobs</span>
                <p className="text-xs font-bold text-gray-200 truncate">{data.systemHealth?.cronJobStatus}</p>
              </div>
              <div className="rounded-xl border border-[#383E36] bg-[#242823] p-3 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">System Uptime</span>
                <p className="text-lg font-black text-[#C8A96B]">{data.systemHealth?.uptimePercentage || "99.9%"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Card */}
          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconActivity className="size-5 text-[#8FA28A]" />
                Recent Registrations & Security Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {data.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-[#C7D3C0]/30 dark:border-[#383E36] pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2F332E] dark:text-white">{log.userName}</span>
                    <Badge variant="outline" className="text-[9px] uppercase border-[#8FA28A] text-[#8FA28A]">{log.action}</Badge>
                    <span className="text-gray-500 dark:text-gray-400">{log.entityName}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
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
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconBuildingStore className="size-5 text-[#8FA28A]" />
                Daftar Owner Properti Terdaftar
              </CardTitle>
              <CardDescription>Kelola status akun, onboarding owner baru, dan suspend/unsuspend.</CardDescription>
            </div>
            <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Form Onboarding Owner Baru dibuka")}>
              <IconUserPlus className="size-4" /> Onboard Owner Baru
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#C7D3C0]/30 dark:divide-[#383E36] rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36]">
              {ownersState.map((o) => (
                <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2F332E] dark:text-white">{o.fullName}</span>
                      <Badge variant={o.isActive ? "default" : "destructive"} className={o.isActive ? "bg-[#8FA28A] text-white text-[10px]" : "text-[10px]"}>
                        {o.isActive ? "Aktif" : "Suspended"}
                      </Badge>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{o.email} • 📱 {o.phoneNumber || "081222222222"}</p>
                    <span className="text-[11px] font-bold text-[#8FA28A]">Dimiliki: {o.propertyCount} Properti</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={o.isActive ? "destructive" : "outline"}
                      onClick={() => toggleOwnerStatus(o.id)}
                      className="text-xs h-8 rounded-xl"
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
          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconReceipt className="size-5 text-[#8FA28A]" />
                Paket Langganan SaaS (Tier Settings)
              </CardTitle>
              <CardDescription>Atur batas limit kamar & fitur untuk tier Basic, Business, dan Pro.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {data.saasPlans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-[#C7D3C0]/50 dark:border-[#383E36] bg-white dark:bg-[#1E221E] p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-[#2F332E] dark:text-white">{plan.name}</span>
                    <Badge variant="secondary" className="text-xs bg-[#8FA28A]/15 text-[#8FA28A] font-bold">{plan.subscriberCount} Owner</Badge>
                  </div>
                  <p className="text-2xl font-black text-[#8FA28A]">
                    {formatIDR(plan.priceMonthly)} <span className="text-xs font-normal text-gray-400">/bln</span>
                  </p>
                  <div className="space-y-1 text-xs border-t border-[#C7D3C0]/30 dark:border-[#383E36] pt-2 text-gray-600 dark:text-gray-300">
                    <p>✓ Maks Properti: <strong>{plan.maxProperties} Gedung</strong></p>
                    <p>✓ Maks Unit: <strong>{plan.maxUnits} Kamar</strong></p>
                    {plan.features.map((f) => (
                      <p key={f} className="text-gray-500 dark:text-gray-400">✓ {f}</p>
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
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconLock className="size-5 text-[#8FA28A]" />
              Role & Granular Permission Matrix
            </CardTitle>
            <CardDescription>Pemetaan hak akses sistem (Read, Create, Edit, Delete) per role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {data.masterRoles.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-3 text-xs space-y-1">
                  <span className="font-bold text-[#2F332E] dark:text-white text-sm">{r.name}</span>
                  <p className="text-gray-500 dark:text-gray-400">Code: {r.code}</p>
                  <Badge variant="outline" className="text-[10px] border-[#8FA28A] text-[#8FA28A]">{r.userCount} Pengguna</Badge>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36] overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4ED] dark:bg-[#1E221E] text-gray-700 dark:text-gray-300 font-bold">
                  <tr>
                    <th className="p-3">Modul</th>
                    <th className="p-3 text-center">Platform Admin</th>
                    <th className="p-3 text-center">Owner</th>
                    <th className="p-3 text-center">Housekeeping</th>
                    <th className="p-3 text-center">Tenant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C7D3C0]/30 dark:divide-[#383E36]">
                  {[
                    { module: "Manajemen Properti & Kamar", admin: "Full", owner: "Full", hk: "Read/Status", tenant: "Read" },
                    { module: "Keuangan & OpEx", admin: "Full", owner: "Full", hk: "OpEx Input", tenant: "Invoice Pay" },
                    { module: "Penugasan Housekeeping", admin: "Full", owner: "Full", hk: "Read", tenant: "None" },
                    { module: "Kontrak & Check-In", admin: "Full", owner: "Full", hk: "Fast Checkin", tenant: "PDF Read" },
                  ].map((row) => (
                    <tr key={row.module}>
                      <td className="p-3 font-bold text-[#2F332E] dark:text-white">{row.module}</td>
                      <td className="p-3 text-center"><Badge className="bg-[#8FA28A] text-white">{row.admin}</Badge></td>
                      <td className="p-3 text-center"><Badge className="bg-[#C8A96B] text-white">{row.owner}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline" className="border-[#8FA28A] text-[#8FA28A]">{row.hk}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline" className="border-[#C7D3C0] text-gray-500">{row.tenant}</Badge></td>
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
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconRoute className="size-5 text-[#C8A96B]" />
              Dynamic Feature Flags & Menu Access Toggles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flagsState.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between border border-[#C7D3C0]/40 dark:border-[#383E36] p-3.5 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-[#2F332E] dark:text-white">{flag.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Key: {flag.key}</p>
                </div>
                <Button
                  size="sm"
                  variant={flag.isEnabled ? "default" : "outline"}
                  onClick={() => toggleFlag(flag.id)}
                  className={flag.isEnabled ? "bg-[#8FA28A] text-white hover:bg-[#8FA28A]/90 text-xs h-8 rounded-xl font-bold" : "text-xs h-8 rounded-xl font-bold border-[#C7D3C0]"}
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
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconSettings className="size-5 text-[#8FA28A]" />
              Konfigurasi Platform & API Gateway Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 space-y-1 bg-[#F7F4ED]/50 dark:bg-[#1E221E]">
              <span className="font-bold text-[#2F332E] dark:text-white flex items-center gap-1.5 text-sm">
                <IconKey className="size-4 text-[#C8A96B]" /> Gemini AI API Key Gateway
              </span>
              <p className="text-gray-600 dark:text-gray-400">Status: Connected (Generative AI Financial Analytics Enabled)</p>
            </div>
            <div className="rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 space-y-1 bg-[#F7F4ED]/50 dark:bg-[#1E221E]">
              <span className="font-bold text-[#2F332E] dark:text-white flex items-center gap-1.5 text-sm">
                <IconMail className="size-4 text-[#8FA28A]" /> Resend Email Gateway
              </span>
              <p className="text-gray-600 dark:text-gray-400">Status: Connected (Automated Email Invoicing Active)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

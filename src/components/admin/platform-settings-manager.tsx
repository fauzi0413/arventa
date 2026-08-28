"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSettings,
  IconShieldCheck,
  IconKey,
  IconLock,
  IconRefresh,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  IconServer,
  IconSparkles,
  IconMail,
  IconDatabase,
  IconCreditCard,
  IconSearch,
  IconPower,
  IconClock,
  IconUser,
  IconTerminal2,
  IconBook,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AuditLogItem {
  id: string;
  userId?: string | null;
  userFullName: string;
  userEmail?: string | null;
  userRole: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  details?: any;
  ipAddress: string;
  createdAt: string;
}

export function PlatformSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"global" | "gateway" | "audit">("global");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // System Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    maintenance_mode: "false",
    platform_name: "ARVENTA - Room & Property PMS",
    default_currency: "IDR",
    max_login_attempts: "5",
    session_timeout_mins: "120",
    gemini_api_key: "",
    gemini_model: "gemini-1.5-flash",
    resend_api_key: "",
    sender_email: "no-reply@arventa.id",
    supabase_url: "https://xyz-supabase.co",
    supabase_service_role: "",
    midtrans_server_key: "",
    midtrans_client_key: "",
    midtrans_mode: "SANDBOX",
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);

  // Password Visibility States
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Audit Search & Filter State
  const [searchAudit, setSearchAudit] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setSettings((prev) => ({
          ...prev,
          ...json.data.settings,
        }));
        setAuditLogs(json.data.auditLogs);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleShowKey = (keyName: string) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SETTINGS",
          settings,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Konfigurasi platform berhasil disimpan!");
        fetchData();
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan konfigurasi sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const executeToggleMaintenance = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_MAINTENANCE",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        fetchData();
        setShowMaintenanceModal(false);
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal mengubah mode maintenance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestGateway = async (gatewayName: string) => {
    setTestingGateway(gatewayName);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TEST_GATEWAY",
          gateway: gatewayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Verifikasi Gateway ${gatewayName}: ${json.data.status} (Latency ${json.data.latencyMs}ms)`);
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(`Koneksi gateway ${gatewayName} gagal.`);
    } finally {
      setTestingGateway(null);
    }
  };

  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.userFullName.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchAudit.toLowerCase())
  );

  const isMaintenanceMode = settings.maintenance_mode === "true";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat Konfigurasi Platform & Gateway Status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner (ARVENTA Brand Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconSettings className="mr-1 size-3.5 text-[#C8A96B]" /> PLATFORM CONTROL CENTER
              </Badge>
              {isMaintenanceMode && (
                <Badge variant="destructive" className="animate-pulse text-xs font-bold">
                  <IconPower className="mr-1 size-3" /> MAINTENANCE MODE ACTIVE
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Platform Settings & Integrasi
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Kelola konfigurasi sistem global, mode pemeliharaan (maintenance mode), gateway API, dan audit trail keamanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/api-docs" target="_blank">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 font-bold text-xs rounded-xl border-[#8FA28A]/40 bg-[#8FA28A]/20 text-[#8FA28A] hover:bg-[#8FA28A]/30"
              >
                <IconBook className="size-4 text-[#C8A96B]" />
                Documentation API (Swagger)
              </Button>
            </Link>
            <Button size="sm" onClick={fetchData} variant="outline" className="gap-1.5 font-bold text-xs rounded-xl border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]">
              <IconRefresh className="size-4" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSubmitting}
              className="gap-1.5 font-bold text-xs bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white rounded-xl shadow-sm"
            >
              {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
              Simpan Konfigurasi
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#C7D3C0]/40 pb-3">
        {[
          { id: "global", label: "Konfigurasi Global & Maintenance", icon: IconSettings },
          { id: "gateway", label: "Integrasi API Gateway", icon: IconShieldCheck },
          { id: "audit", label: "Security Audit Log", icon: IconShieldCheck },
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

      {/* TAB 1: KONFIGURASI GLOBAL & MAINTENANCE MODE */}
      {activeTab === "global" && (
        <div className="space-y-6">
          {/* Maintenance Mode Card */}
          <Card className={`border shadow-sm transition-all ${isMaintenanceMode ? "border-amber-500/50 bg-amber-500/5" : "border-border/60"}`}>
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconPower className={`size-5 ${isMaintenanceMode ? "text-amber-500" : "text-emerald-500"}`} />
                  <CardTitle className="text-base font-bold">Global Maintenance Mode</CardTitle>
                  <Badge variant={isMaintenanceMode ? "destructive" : "default"} className="text-[10px]">
                    {isMaintenanceMode ? "MAINTENANCE MODE ACTIVE" : "SISTEM ONLINE (NORMAL)"}
                  </Badge>
                </div>
                <CardDescription>
                  Mengaktifkan maintenance mode akan menampilkan halaman informasi pemeliharaan sistem kepada pengguna non-admin.
                </CardDescription>
              </div>

              <Button
                size="sm"
                variant={isMaintenanceMode ? "default" : "destructive"}
                onClick={() => setShowMaintenanceModal(true)}
                disabled={isSubmitting}
                className="gap-2 font-bold text-xs shrink-0"
              >
                {isSubmitting ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconPower className="size-4" />
                )}
                {isMaintenanceMode ? "Matikan Maintenance Mode" : "Aktifkan Maintenance Mode"}
              </Button>
            </CardHeader>
          </Card>

          {/* General Platform Parameters Form */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconServer className="size-5 text-indigo-500" />
                Parameter Sistem & Keamanan Global
              </CardTitle>
              <CardDescription>
                Atur judul platform, mata uang default, batas keamanan sesi login, dan parameter umum.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveSettings} className="grid gap-4 md:grid-cols-2 text-xs">
                <div>
                  <label className="font-bold block mb-1">Nama Platform SaaS</label>
                  <input
                    type="text"
                    value={settings.platform_name || ""}
                    onChange={(e) => handleSettingChange("platform_name", e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-primary text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Mata Uang Sistem Utama</label>
                  <select
                    value={settings.default_currency || "IDR"}
                    onChange={(e) => handleSettingChange("default_currency", e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-primary text-xs font-semibold"
                  >
                    <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="SGD">SGD - Singapore Dollar (S$)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Batas Percobaan Login Gagal (Max Attempts)</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={settings.max_login_attempts || "5"}
                    onChange={(e) => handleSettingChange("max_login_attempts", e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-primary text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Sesi Timeout Pengguna (Menit)</label>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.session_timeout_mins || "120"}
                    onChange={(e) => handleSettingChange("session_timeout_mins", e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-primary text-xs font-mono"
                    required
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end">
                  <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 font-bold text-xs">
                    {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                    Simpan Parameter Sistem
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: INTEGRASI API GATEWAY */}
      {activeTab === "gateway" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gemini AI Gateway */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconSparkles className="size-5 text-amber-500" />
                  Gemini AI Gateway (OCR & AI Assistant)
                </CardTitle>
                <CardDescription>
                  Integrasi Google Gemini AI untuk auto-fill KTP OCR & asisten pintar operasional.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestGateway("Gemini AI")}
                disabled={testingGateway === "Gemini AI"}
                className="gap-1 text-[11px] h-7"
              >
                {testingGateway === "Gemini AI" ? <IconLoader2 className="size-3 animate-spin" /> : <IconCheck className="size-3 text-emerald-500" />}
                Test AI
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Gemini API Key</label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={settings.gemini_api_key || ""}
                    onChange={(e) => handleSettingChange("gemini_api_key", e.target.value)}
                    className="w-full rounded-lg border p-2.5 pr-9 bg-background font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("gemini")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys.gemini ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Model Gemini Active</label>
                <select
                  value={settings.gemini_model || "gemini-1.5-flash"}
                  onChange={(e) => handleSettingChange("gemini_model", e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs font-mono"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Next Gen - Ultra Fast)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Latest Multimodal Vision)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Stable - Recommended)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (High Accuracy & Complex Analysis)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Resend Email Gateway */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconMail className="size-5 text-blue-500" />
                  Resend Email Gateway
                </CardTitle>
                <CardDescription>
                  Layanan pengiriman email notifikasi tagihan, invoice, dan reset password.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestGateway("Resend Email")}
                disabled={testingGateway === "Resend Email"}
                className="gap-1 text-[11px] h-7"
              >
                {testingGateway === "Resend Email" ? <IconLoader2 className="size-3 animate-spin" /> : <IconCheck className="size-3 text-emerald-500" />}
                Test Email
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Resend API Key</label>
                <div className="relative">
                  <input
                    type={showKeys.resend ? "text" : "password"}
                    placeholder="re_123456..."
                    value={settings.resend_api_key || ""}
                    onChange={(e) => handleSettingChange("resend_api_key", e.target.value)}
                    className="w-full rounded-lg border p-2.5 pr-9 bg-background font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("resend")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys.resend ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Sender Email Address</label>
                <input
                  type="email"
                  placeholder="no-reply@arventa.id"
                  value={settings.sender_email || "no-reply@arventa.id"}
                  onChange={(e) => handleSettingChange("sender_email", e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Supabase Storage & Database */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconDatabase className="size-5 text-emerald-500" />
                  Supabase Storage & Pooler
                </CardTitle>
                <CardDescription>
                  Penyimpanan berkas KTP, bukti bayar, foto kamar, serta Shared Connection Pooler.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Active Pooler 6543
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  value={settings.supabase_url || ""}
                  onChange={(e) => handleSettingChange("supabase_url", e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Service Role Secret Key</label>
                <div className="relative">
                  <input
                    type={showKeys.supabase ? "text" : "password"}
                    placeholder="eyJhbGciOi..."
                    value={settings.supabase_service_role || ""}
                    onChange={(e) => handleSettingChange("supabase_service_role", e.target.value)}
                    className="w-full rounded-lg border p-2.5 pr-9 bg-background font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("supabase")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys.supabase ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Gateway (Midtrans/Xendit) */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconCreditCard className="size-5 text-purple-500" />
                  Payment Gateway (Midtrans)
                </CardTitle>
                <CardDescription>
                  Integrasi otomatisasi pembayaran sewa, QRIS, Bank Transfer, dan e-Wallet.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestGateway("Midtrans Payment")}
                disabled={testingGateway === "Midtrans Payment"}
                className="gap-1 text-[11px] h-7"
              >
                {testingGateway === "Midtrans Payment" ? <IconLoader2 className="size-3 animate-spin" /> : <IconCheck className="size-3 text-emerald-500" />}
                Test Payment
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Midtrans Server Key</label>
                <div className="relative">
                  <input
                    type={showKeys.midtrans ? "text" : "password"}
                    placeholder="SB-Mid-server-..."
                    value={settings.midtrans_server_key || ""}
                    onChange={(e) => handleSettingChange("midtrans_server_key", e.target.value)}
                    className="w-full rounded-lg border p-2.5 pr-9 bg-background font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("midtrans")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys.midtrans ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Environment Mode</label>
                <select
                  value={settings.midtrans_mode || "SANDBOX"}
                  onChange={(e) => handleSettingChange("midtrans_mode", e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                >
                  <option value="SANDBOX">SANDBOX (Testing & Staging)</option>
                  <option value="PRODUCTION">PRODUCTION (Live Production)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 flex justify-end pt-2">
            <Button
              onClick={() => handleSaveSettings()}
              disabled={isSubmitting}
              className="gap-1.5 font-bold text-xs"
            >
              {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
              Simpan Semua Key Gateway
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT LOG */}
      {activeTab === "audit" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconShieldCheck className="size-5 text-emerald-500" />
                Security Audit Log & Trail System
              </CardTitle>
              <CardDescription>
                Catatan aktivitas penting, perubahan konfigurasi, serta audit jejak keamanan di platform.
              </CardDescription>
            </div>

            <div className="relative w-full md:w-64">
              <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari aksi / nama / IP..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-y">
                  <th className="p-3 font-bold text-foreground">Waktu (UTC)</th>
                  <th className="p-3 font-bold text-foreground">Pengguna</th>
                  <th className="p-3 font-bold text-foreground">Aksi Audit</th>
                  <th className="p-3 font-bold text-foreground">Entitas Target</th>
                  <th className="p-3 font-bold text-foreground">IP Address</th>
                  <th className="p-3 font-bold text-foreground">Rincian JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        <div>{log.userFullName}</div>
                        <Badge variant="outline" className="text-[9px] font-mono mt-0.5">
                          {log.userRole}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-muted-foreground">
                        {log.entityName}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">
                        {log.ipAddress}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Tidak ada catatan audit log yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* MAINTENANCE MODE CONFIRMATION MODAL */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-12 items-center justify-center rounded-2xl shrink-0 ${
                  isMaintenanceMode
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {isMaintenanceMode ? <IconCheck className="size-6" /> : <IconPower className="size-6" />}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground">
                  {isMaintenanceMode ? "Matikan Maintenance Mode?" : "Aktifkan Maintenance Mode?"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isMaintenanceMode
                    ? "Sistem akan kembali dibuka secara umum. Seluruh pengguna non-admin dapat mengakses dashboard aplikasi seperti biasa."
                    : "Pengguna umum non-admin (Owner, Housekeeping, Penyewa) akan segera diblokir dari dashboard dan dialihkan ke halaman Pemeliharaan."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMaintenanceModal(false)}
                disabled={isSubmitting}
                className="text-xs font-semibold h-8"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isMaintenanceMode ? "default" : "destructive"}
                onClick={executeToggleMaintenance}
                disabled={isSubmitting}
                className="text-xs font-bold gap-1.5 h-8"
              >
                {isSubmitting ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : isMaintenanceMode ? (
                  <IconCheck className="size-3.5" />
                ) : (
                  <IconPower className="size-3.5" />
                )}
                {isMaintenanceMode ? "Ya, Matikan Maintenance" : "Ya, Aktifkan Maintenance"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

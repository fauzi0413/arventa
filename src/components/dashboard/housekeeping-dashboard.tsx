"use client";

import { useState } from "react";
import {
  IconClipboardCheck,
  IconSparkles,
  IconTools,
  IconCheck,
  IconBed,
  IconBuilding,
  IconLoader2,
  IconAlertTriangle,
  IconRefresh,
  IconKey,
  IconBrandWhatsapp,
  IconUserCheck,
  IconArmchair,
  IconCash,
  IconMessages,
  IconUpload,
  IconPlus,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HousekeepingDashboardProps {
  data: {
    user: { fullName: string; email: string };
    assignedPropertiesCount: number;
    cleaningNeededCount: number;
    maintenanceCount: number;
    readyAvailableCount: number;
    occupiedCount: number;
    statusBreakdown: Record<string, number>;
    allUnits: Array<{
      id: string;
      unitNumber: string;
      floor: number;
      status: string;
      propertyName: string;
      facilities: string[];
      tenantName?: string | null;
      tenantPhone?: string | null;
    }>;
    inventories: Array<{
      id: string;
      unitNumber: string;
      itemName: string;
      quantity: number;
      condition: string;
    }>;
    forumPosts: Array<{
      id: string;
      title: string;
      content: string;
      authorName: string;
      commentCount: number;
      createdAt: string;
    }>;
    recentStatusLogs: Array<{
      id: string;
      unitNumber: string;
      previousStatus: string;
      newStatus: string;
      changedByName: string;
      notes: string | null;
      createdAt: string;
    }>;
  };
}

export function HousekeepingDashboard({ data }: HousekeepingDashboardProps) {
  const [units, setUnits] = useState(data.allUnits);
  const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"grid" | "tenants" | "inventory" | "expenses" | "forum">("grid");
  const [selectedUnitPassModal, setSelectedUnitPassModal] = useState<string | null>(null);

  const handleUpdateStatus = async (unitId: string, newStatus: string) => {
    setUpdatingUnitId(unitId);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/operations/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          newStatus,
          notes: `Updated status to ${newStatus} by Housekeeping Staff`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUnits((prev) =>
          prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
        );
        setSuccessMsg(`Status Kamar ${json.data.unit.unitNumber} berhasil diubah ke ${newStatus}`);
      } else {
        alert("Gagal mengubah status: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setUpdatingUnitId(null);
    }
  };

  const filteredUnits = units.filter((u) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "NEED_ATTENTION") return u.status === "CLEANING" || u.status === "MAINTENANCE";
    return u.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CLEANING":
        return <Badge className="bg-amber-500 text-white font-semibold">Pembersihan</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-rose-600 text-white font-semibold">Maintenance</Badge>;
      case "AVAILABLE":
        return <Badge className="bg-emerald-600 text-white font-semibold">Siap Huni</Badge>;
      case "OCCUPIED":
        return <Badge variant="secondary">Terisi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs tracking-wide uppercase">
                <IconSparkles className="mr-1 size-3.5" /> Housekeeping Operational Hub
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halo, {data.user.fullName}
            </h1>
            <p className="mt-1 text-sm text-amber-200/80">
              Pantau status kebersihan kamar, inventaris perabotan, dan kebutuhan OpEx unit lapangan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
              className="gap-1.5 font-semibold"
            >
              <IconRefresh className="size-4" /> Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Banner for Status Update Success */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
          <IconCheck className="size-5 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Module Tabs Bar (No raw emojis in text labels) */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: "grid", label: "Status Kamar Grid & Kredensial", icon: IconClipboardCheck },
          { id: "tenants", label: "Penghuni & Fast Check-In", icon: IconUserCheck },
          { id: "inventory", label: "Kondisi Perabotan Unit", icon: IconArmchair },
          { id: "expenses", label: "Input OpEx Token/Sabun", icon: IconCash },
          { id: "forum", label: "Forum & Pengumuman", icon: IconMessages },
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

      {/* TAB 1: STATUS KAMAR GRID */}
      {activeTab === "grid" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 shadow-sm border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perlu Dibersihkan</span>
                  <IconSparkles className="size-5 text-amber-500" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                    {units.filter((u) => u.status === "CLEANING").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm border-l-4 border-l-rose-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perlu Maintenance</span>
                  <IconTools className="size-5 text-rose-500" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                    {units.filter((u) => u.status === "MAINTENANCE").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kamar Siap Huni</span>
                  <IconBed className="size-5 text-emerald-500" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {units.filter((u) => u.status === "AVAILABLE").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properti Assignment</span>
                  <IconBuilding className="size-5 text-blue-500" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-foreground">{data.assignedPropertiesCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconClipboardCheck className="size-5 text-amber-500" />
                  Overview Room Status Grid & Akses Kredensial
                </CardTitle>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "ALL", label: "Semua Unit" },
                  { id: "NEED_ATTENTION", label: "Perlu Penanganan" },
                  { id: "CLEANING", label: "Cleaning" },
                  { id: "AVAILABLE", label: "Available" },
                ].map((f) => (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={statusFilter === f.id ? "default" : "outline"}
                    onClick={() => setStatusFilter(f.id)}
                    className="text-xs h-8"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUnits.map((u) => {
                  const isUpdating = updatingUnitId === u.id;
                  return (
                    <div key={u.id} className="rounded-xl border p-4 flex flex-col justify-between space-y-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{u.propertyName} • Lantai {u.floor}</span>
                          <h3 className="text-xl font-extrabold text-foreground mt-0.5">Unit {u.unitNumber}</h3>
                        </div>
                        {getStatusBadge(u.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUnitPassModal(u.unitNumber)}
                          className="text-[11px] h-7 gap-1"
                        >
                          <IconKey className="size-3.5 text-amber-500" /> Pass Baru
                        </Button>
                        <a
                          href={`https://wa.me/${u.tenantPhone || "6281444444444"}?text=Halo%20penghuni%20Unit%20${u.unitNumber},%20berikut%20kredensial%20login%20portal%20kamar%20Anda.`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <IconBrandWhatsapp className="size-3.5" /> Share WA
                        </a>
                      </div>

                      <div className="pt-2 border-t">
                        {u.status === "CLEANING" && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(u.id, "AVAILABLE")}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 gap-1.5"
                          >
                            {isUpdating ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                            Tandai Sudah Dibersihkan (Set AVAILABLE)
                          </Button>
                        )}
                        {u.status === "AVAILABLE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(u.id, "CLEANING")}
                            className="w-full text-xs h-8 gap-1.5"
                          >
                            {isUpdating ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconSparkles className="size-3.5" />}
                            Mulai Pembersihan (Set CLEANING)
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: PENGHUNI & FAST CHECK-IN */}
      {activeTab === "tenants" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconUserCheck className="size-5 text-blue-600" />
                Data Penghuni Lapangan & Fast Check-In
              </CardTitle>
            </div>
            <Button size="sm" className="font-semibold text-xs gap-1.5" onClick={() => alert("Form Fast Check-In Lapangan dibuka")}>
              <IconPlus className="size-4" /> Fast Check-In + Foto KTP
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {units.filter((u) => u.tenantName).map((u) => (
              <div key={u.id} className="flex justify-between items-center border p-3 rounded-lg">
                <div>
                  <span className="font-bold text-foreground">Unit {u.unitNumber} • {u.tenantName}</span>
                  <p className="text-muted-foreground">📱 {u.tenantPhone || "081444444444"}</p>
                </div>
                <a
                  href={`https://wa.me/${u.tenantPhone || "6281444444444"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-emerald-600 text-white px-2.5 py-1 font-semibold flex items-center gap-1 hover:bg-emerald-500"
                >
                  <IconBrandWhatsapp className="size-3.5" /> Chat WA
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: KONDISI PERABOTAN UNIT */}
      {activeTab === "inventory" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconArmchair className="size-5 text-amber-500" />
              Update Status Inventaris & Perabotan
            </CardTitle>
            <CardDescription>Catat kerusakan perabotan (AC, Kasur, Lemari) per unit kamar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.inventories.map((inv) => (
              <div key={inv.id} className="border p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Unit {inv.unitNumber} • {inv.itemName}</span>
                  <Badge variant={inv.condition === "Baik" ? "default" : "destructive"}>{inv.condition}</Badge>
                </div>
                <p className="text-muted-foreground">Jumlah: {inv.quantity} unit</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: KEUANGAN & OPEX UNIT */}
      {activeTab === "expenses" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconCash className="size-5 text-emerald-600" />
                Input Pengeluaran Unit (OpEx Lapangan)
              </CardTitle>
              <CardDescription>Beli token listrik, sabun/pembersih + upload foto nota.</CardDescription>
            </div>
            <Button size="sm" className="font-semibold text-xs gap-1.5" onClick={() => alert("Form Catat OpEx Token/Sabun dibuka")}>
              <IconPlus className="size-4" /> Catat OpEx + Nota
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Form pendaftaran pengeluaran operasional lapangan siap digunakan.
          </CardContent>
        </Card>
      )}

      {/* TAB 5: FORUM & PENGUMUMAN */}
      {activeTab === "forum" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconMessages className="size-5 text-purple-600" />
                Forum & Pengumuman Lapangan
              </CardTitle>
            </div>
            <Button size="sm" className="font-semibold text-xs gap-1.5" onClick={() => alert("Form Buat Pengumuman Baru dibuka")}>
              <IconPlus className="size-4" /> Buat Pengumuman Baru
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {data.forumPosts.map((fp) => (
              <div key={fp.id} className="border p-3 rounded-lg space-y-1">
                <p className="font-bold text-foreground">{fp.title}</p>
                <p className="text-muted-foreground">{fp.content}</p>
                <span className="text-[10px] text-primary">Oleh: {fp.authorName} • {fp.commentCount} Komentar</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Generate Password Modal Simulation */}
      {selectedUnitPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Password Baru Unit {selectedUnitPassModal}</h3>
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <p className="font-bold">Password Login Kamar: <span className="font-mono text-primary">KamarPass123!</span></p>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedUnitPassModal(null)}>Tutup</Button>
              <a
                href={`https://wa.me/?text=Password%20login%20kamar%20Unit%20${selectedUnitPassModal}%20telah%20di-generate:%20KamarPass123!`}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500"
              >
                <IconBrandWhatsapp className="size-4" /> Share Password via WA
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

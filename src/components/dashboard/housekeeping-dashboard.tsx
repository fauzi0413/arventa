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
  IconRefresh,
  IconKey,
  IconBrandWhatsapp,
  IconUserCheck,
  IconArmchair,
  IconCash,
  IconMessages,
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
        return <Badge className="bg-[#C8A96B] text-white font-bold">Pembersihan</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-rose-600 text-white font-bold">Maintenance</Badge>;
      case "AVAILABLE":
        return <Badge className="bg-[#8FA28A] text-white font-bold">Siap Huni</Badge>;
      case "OCCUPIED":
        return <Badge variant="secondary" className="font-bold">Terisi</Badge>;
      default:
        return <Badge variant="outline" className="font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner (ARVENTRA Brand Dark Sage & Gold) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconSparkles className="mr-1 size-3.5 text-[#C8A96B]" /> HOUSEKEEPING OPERATIONAL HUB
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Halo, {data.user.fullName}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Pantau status kebersihan kamar, inventaris perabotan, dan kebutuhan OpEx unit lapangan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold text-xs rounded-xl border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]"
            >
              <IconRefresh className="size-4" /> Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Banner for Status Update Success */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
          <IconCheck className="size-5 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Module Tabs Bar (ARVENTRA Sage Theme) */}
      <div className="flex flex-wrap gap-2 border-b border-[#C7D3C0]/40 pb-3">
        {[
          { id: "grid", label: "Status Kamar Grid & Kredensial", icon: IconClipboardCheck },
          { id: "tenants", label: "Penghuni & Fast Check-In", icon: IconUserCheck },
          { id: "inventory", label: "Kondisi Perabotan Unit", icon: IconArmchair },
          { id: "expenses", label: "Input OpEx Token/Sabun", icon: IconCash },
          { id: "forum", label: "Forum & Pengumuman", icon: IconMessages },
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

      {/* TAB 1: STATUS KAMAR GRID */}
      {activeTab === "grid" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm border-l-4 border-l-[#C8A96B]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Perlu Dibersihkan</span>
                  <div className="rounded-xl bg-[#C8A96B]/15 p-2.5 text-[#C8A96B]">
                    <IconSparkles className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-black text-[#C8A96B]">
                    {units.filter((u) => u.status === "CLEANING").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm border-l-4 border-l-rose-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Perlu Maintenance</span>
                  <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500">
                    <IconTools className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    {units.filter((u) => u.status === "MAINTENANCE").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm border-l-4 border-l-[#8FA28A]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kamar Siap Huni</span>
                  <div className="rounded-xl bg-[#8FA28A]/15 p-2.5 text-[#8FA28A]">
                    <IconBed className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-black text-[#8FA28A]">
                    {units.filter((u) => u.status === "AVAILABLE").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Properti Assignment</span>
                  <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
                    <IconBuilding className="size-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-black text-[#2F332E] dark:text-white">{data.assignedPropertiesCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                  <IconClipboardCheck className="size-5 text-[#8FA28A]" />
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
                    className={`text-xs h-8 rounded-xl font-bold ${
                      statusFilter === f.id
                        ? "bg-[#8FA28A] text-white"
                        : "border-[#C7D3C0] dark:border-[#383E36]"
                    }`}
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
                    <div key={u.id} className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 flex flex-col justify-between space-y-3 shadow-xs bg-white dark:bg-[#1E221E]">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{u.propertyName} • Lantai {u.floor}</span>
                          <h3 className="text-xl font-black text-[#2F332E] dark:text-white mt-0.5">Unit {u.unitNumber}</h3>
                        </div>
                        {getStatusBadge(u.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#C7D3C0]/30 dark:border-[#383E36]">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUnitPassModal(u.unitNumber)}
                          className="text-[11px] h-7 gap-1 font-bold text-[#C8A96B] hover:text-[#C8A96B]/80"
                        >
                          <IconKey className="size-3.5" /> Pass Baru
                        </Button>
                        <a
                          href={`https://wa.me/${u.tenantPhone || "6281444444444"}?text=Halo%20penghuni%20Unit%20${u.unitNumber},%20berikut%20kredensial%20login%20portal%20kamar%20Anda.`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#8FA28A] font-bold flex items-center gap-1 hover:underline"
                        >
                          <IconBrandWhatsapp className="size-3.5" /> Share WA
                        </a>
                      </div>

                      <div className="pt-2 border-t border-[#C7D3C0]/30 dark:border-[#383E36]">
                        {u.status === "CLEANING" && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(u.id, "AVAILABLE")}
                            className="w-full bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold text-xs h-9 gap-1.5 rounded-xl shadow-xs"
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
                            className="w-full text-xs h-9 gap-1.5 rounded-xl border-[#383E36] font-bold"
                          >
                            {isUpdating ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconSparkles className="size-3.5 text-[#C8A96B]" />}
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
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconUserCheck className="size-5 text-[#8FA28A]" />
                Data Penghuni Lapangan & Fast Check-In
              </CardTitle>
            </div>
            <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Form Fast Check-In Lapangan dibuka")}>
              <IconPlus className="size-4" /> Fast Check-In + Foto KTP
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {units.filter((u) => u.tenantName).map((u) => (
              <div key={u.id} className="flex justify-between items-center border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 rounded-2xl">
                <div>
                  <span className="font-bold text-sm text-[#2F332E] dark:text-white">Unit {u.unitNumber} • {u.tenantName}</span>
                  <p className="text-gray-500 dark:text-gray-400">📱 {u.tenantPhone || "081444444444"}</p>
                </div>
                <a
                  href={`https://wa.me/${u.tenantPhone || "6281444444444"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#8FA28A] text-white px-3 py-1.5 font-bold flex items-center gap-1.5 hover:bg-[#8FA28A]/90 shadow-xs"
                >
                  <IconBrandWhatsapp className="size-4" /> Chat WA
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: KONDISI PERABOTAN UNIT */}
      {activeTab === "inventory" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
              <IconArmchair className="size-5 text-[#C8A96B]" />
              Update Status Inventaris & Perabotan
            </CardTitle>
            <CardDescription>Catat kerusakan perabotan (AC, Kasur, Lemari) per unit kamar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.inventories.map((inv) => (
              <div key={inv.id} className="border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-[#2F332E] dark:text-white">Unit {inv.unitNumber} • {inv.itemName}</span>
                  <Badge className={inv.condition === "Baik" ? "bg-[#8FA28A] text-white font-bold" : "bg-rose-600 text-white font-bold"}>{inv.condition}</Badge>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Jumlah: {inv.quantity} unit</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: KEUANGAN & OPEX UNIT */}
      {activeTab === "expenses" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconCash className="size-5 text-[#8FA28A]" />
                Input Pengeluaran Unit (OpEx Lapangan)
              </CardTitle>
              <CardDescription>Beli token listrik, sabun/pembersih + upload foto nota.</CardDescription>
            </div>
            <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Form Catat OpEx Token/Sabun dibuka")}>
              <IconPlus className="size-4" /> Catat OpEx + Nota
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 dark:text-gray-400">
            Form pendaftaran pengeluaran operasional lapangan siap digunakan.
          </CardContent>
        </Card>
      )}

      {/* TAB 5: FORUM & PENGUMUMAN */}
      {activeTab === "forum" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconMessages className="size-5 text-[#8FA28A]" />
                Forum & Pengumuman Lapangan
              </CardTitle>
            </div>
            <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Form Buat Pengumuman Baru dibuka")}>
              <IconPlus className="size-4" /> Buat Pengumuman Baru
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {data.forumPosts.map((fp) => (
              <div key={fp.id} className="border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 rounded-2xl space-y-1">
                <p className="font-bold text-[#2F332E] dark:text-white">{fp.title}</p>
                <p className="text-gray-500 dark:text-gray-400">{fp.content}</p>
                <span className="text-[10px] text-[#8FA28A] font-bold">Oleh: {fp.authorName} • {fp.commentCount} Komentar</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Generate Password Modal Simulation */}
      {selectedUnitPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#242823] border border-[#383E36] text-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Password Baru Unit {selectedUnitPassModal}</h3>
            <div className="rounded-xl bg-[#1E221E] border border-[#383E36] p-3.5 text-xs space-y-1">
              <p className="font-bold">Password Login Kamar: <span className="font-mono text-[#8FA28A]">KamarPass123!</span></p>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="rounded-xl border-[#383E36] text-gray-300" onClick={() => setSelectedUnitPassModal(null)}>Tutup</Button>
              <a
                href={`https://wa.me/?text=Password%20login%20kamar%20Unit%20${selectedUnitPassModal}%20telah%20di-generate:%20KamarPass123!`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#8FA28A] text-white px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 hover:bg-[#8FA28A]/90 shadow-sm"
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

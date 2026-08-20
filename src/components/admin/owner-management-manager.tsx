"use client";

import React, { useState, useEffect } from "react";
import {
  IconBuildingStore,
  IconUserCheck,
  IconUserX,
  IconBuilding,
  IconSearch,
  IconRefresh,
  IconPencil,
  IconShieldLock,
  IconShieldCheck,
  IconEye,
  IconEyeOff,
  IconLock,
  IconCheck,
  IconX,
  IconLoader2,
  IconMail,
  IconPhone,
  IconCalendar,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface OwnerItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  propertyCount: number;
  currentPlan: string;
  planId?: string | null;
  subscriptionStatus: string;
  subscriptionEndDate?: string | null;
  createdAt: string;
}

export interface SaaSPlanOption {
  id: string;
  name: string;
  priceMonthly: number;
  maxProperties: number;
  maxUnits: number;
}

export function OwnerManagementManager() {
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [plans, setPlans] = useState<SaaSPlanOption[]>([]);
  const [stats, setStats] = useState({
    totalOwners: 0,
    activeOwners: 0,
    suspendedOwners: 0,
  });

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [page, setPage] = useState(1);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Selected Owner State
  const [selectedOwner, setSelectedOwner] = useState<OwnerItem | null>(null);

  // Form Fields (Edit)
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");

  // Suspend Guard Step & Admin Password State
  const [suspendStep, setSuspendStep] = useState<1 | 2>(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: page.toString(),
        limit: "15",
      });

      const res = await fetch(`/api/admin/owners?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (json.success && json.data) {
        setOwners(json.data.owners || []);
        if (json.data.plans) setPlans(json.data.plans);
        if (json.data.stats) setStats(json.data.stats);
      } else {
        setErrorMsg(json.message || "Gagal memuat data owner properti.");
      }
    } catch (err) {
      console.error("fetchData error:", err);
      setErrorMsg("Terjadi kesalahan koneksi saat memuat data owner.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, page]);

  // Open Edit Modal
  const handleOpenEditModal = (owner: OwnerItem) => {
    setSelectedOwner(owner);
    setFormFullName(owner.fullName);
    setFormEmail(owner.email);
    setFormPhoneNumber(owner.phoneNumber === "-" ? "" : owner.phoneNumber);
    setModalErrorMsg(null);
    setShowEditModal(true);
  };

  // Submit Edit Owner
  const handleEditOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;

    setIsSubmitting(true);
    setModalErrorMsg(null);

    try {
      const res = await fetch("/api/admin/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_OWNER",
          ownerId: selectedOwner.id,
          fullName: formFullName,
          email: formEmail,
          phoneNumber: formPhoneNumber,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || `Profil ${formFullName} berhasil diperbarui!`);
        setShowEditModal(false);
        setSelectedOwner(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal memperbarui data owner.");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat memperbarui profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Suspend Modal
  const handleOpenSuspendModal = (owner: OwnerItem) => {
    setSelectedOwner(owner);
    setSuspendStep(1);
    setAdminPassword("");
    setShowPassword(false);
    setModalErrorMsg(null);
    setShowSuspendModal(true);
  };

  // Confirm Toggle Suspend with Password Verification
  const handleToggleSuspend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOwner) return;

    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      setModalErrorMsg("Password konfirmasi akun Platform Admin wajib diisi.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setModalErrorMsg("Password minimal 6 karakter. Silakan periksa kembali.");
      return;
    }

    setIsSubmitting(true);
    setModalErrorMsg(null);

    try {
      const res = await fetch("/api/admin/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_SUSPEND",
          ownerId: selectedOwner.id,
          adminPassword: trimmedPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowSuspendModal(false);
        setSelectedOwner(null);
        setAdminPassword("");
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Password tidak cocok atau gagal mengubah status.");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat memproses status akun.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = (owner: OwnerItem) => {
    setSelectedOwner(owner);
    setShowDetailModal(true);
  };

  const totalPropertiesCount = owners.reduce((acc, curr) => acc + curr.propertyCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconBuildingStore className="mr-1 size-3.5 text-[#C8A96B]" /> OWNER DIRECTORY & ACCOUNT GUARD
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manajemen Owner Properti
            </h1>
            <p className="text-sm text-slate-300 max-w-xl mt-1">
              Kelola daftar akun owner properti terdaftar, perbarui profil owner, dan kontrol penangguhan akses akun (Account Suspend Guard).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold gap-1.5 h-9 cursor-pointer"
            >
              <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-75">
            <IconX className="size-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-75">
            <IconX className="size-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <IconBuildingStore className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Owner</p>
            <h3 className="text-2xl font-black text-foreground">{stats.totalOwners}</h3>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <IconUserCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Owner Aktif</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.activeOwners}</h3>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <IconUserX className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ditangguhkan</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.suspendedOwners}</h3>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <IconBuilding className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Properti Dikelola</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalPropertiesCount}</h3>
          </div>
        </Card>
      </div>

      {/* Directory Filter & Search */}
      <Card className="rounded-3xl border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama, email, atau no. telepon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border bg-background pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-amber-500 font-semibold"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "all" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Aktif ({stats.activeOwners})
              </button>
              <button
                onClick={() => setStatusFilter("suspended")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "suspended" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ditangguhkan ({stats.suspendedOwners})
              </button>
            </div>
          </div>

          {/* Owners Table */}
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <IconLoader2 className="size-8 animate-spin mx-auto text-amber-500 mb-2" />
              <p className="text-xs font-semibold">Memuat direktori owner properti...</p>
            </div>
          ) : owners.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl p-6 bg-muted/20">
              <IconBuildingStore className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-sm text-foreground">Tidak Ada Data Owner</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Tidak ditemukan data owner properti sesuai dengan kata kunci pencarian atau filter status yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3.5 pl-4">Detail Owner Properti</th>
                    <th className="p-3.5">Paket SaaS</th>
                    <th className="p-3.5 text-center">Jumlah Properti</th>
                    <th className="p-3.5">Status Akun</th>
                    <th className="p-3.5">Tanggal Registrasi</th>
                    <th className="p-3.5 text-right pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {owners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-muted/30 transition-colors">
                      {/* Owner Profile */}
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-sm border border-amber-500/20">
                            {owner.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{owner.fullName}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <IconMail className="size-3" /> {owner.email}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <IconPhone className="size-3" /> {owner.phoneNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SaaS Plan */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {owner.currentPlan}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Status: <span className="text-foreground">{owner.subscriptionStatus}</span>
                          </p>
                        </div>
                      </td>

                      {/* Property Count */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20">
                          <IconBuilding className="size-3.5" />
                          {owner.propertyCount} Unit
                        </span>
                      </td>

                      {/* Status Akun Guard */}
                      <td className="p-3.5">
                        <Badge
                          variant={owner.isActive ? "default" : "destructive"}
                          className={`text-[10px] font-bold tracking-wide ${
                            owner.isActive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          }`}
                        >
                          {owner.isActive ? "AKTIF" : "DITANGGUHKAN"}
                        </Badge>
                      </td>

                      {/* Registration Date */}
                      <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <IconCalendar className="size-3 text-muted-foreground" />
                          {new Date(owner.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetailModal(owner)}
                            className="size-8 p-0 h-8 hover:bg-muted cursor-pointer"
                            title="Lihat Detail Owner"
                          >
                            <IconEye className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(owner)}
                            className="size-8 p-0 h-8 hover:bg-muted cursor-pointer"
                            title="Edit Profil Owner"
                          >
                            <IconPencil className="size-4 text-amber-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant={owner.isActive ? "destructive" : "default"}
                            onClick={() => handleOpenSuspendModal(owner)}
                            className={`size-8 p-0 h-8 cursor-pointer ${
                              owner.isActive
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                            title={owner.isActive ? "Tangguhkan (Suspend) Akun" : "Aktifkan (Unsuspend) Akun"}
                          >
                            {owner.isActive ? <IconShieldLock className="size-4" /> : <IconShieldCheck className="size-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Edit Owner */}
      {showEditModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <IconPencil className="size-5 text-amber-500" />
                <h3 className="font-black text-base text-foreground">Edit Profil Owner</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-5" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <IconAlertTriangle className="size-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleEditOwner} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Lengkap Owner *</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-semibold focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Alamat Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-semibold focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nomor WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={formPhoneNumber}
                  onChange={(e) => setFormPhoneNumber(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEditModal(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suspend Guard Confirm with Admin Password Re-verification */}
      {showSuspendModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border shadow-2xl p-6 space-y-4 text-center animate-in fade-in zoom-in-95">
            {suspendStep === 1 ? (
              <>
                <div className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
                  selectedOwner.isActive ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                }`}>
                  {selectedOwner.isActive ? <IconShieldLock className="size-8" /> : <IconShieldCheck className="size-8" />}
                </div>

                <div>
                  <h3 className="font-black text-lg text-foreground">
                    {selectedOwner.isActive ? "Tangguhkan Akun Owner?" : "Aktifkan Kembali Akun Owner?"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {selectedOwner.isActive ? (
                      <>
                        Akun owner <strong className="text-foreground">{selectedOwner.fullName}</strong> akan ditangguhkan. Owner tidak akan dapat login atau mengelola propertinya sampai diaktifkan kembali.
                      </>
                    ) : (
                      <>
                        Akses akun owner <strong className="text-foreground">{selectedOwner.fullName}</strong> akan dipulihkan sehingga dapat login kembali ke dashboard.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowSuspendModal(false)}>
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setSuspendStep(2);
                      setAdminPassword("");
                      setModalErrorMsg(null);
                    }}
                    size="sm"
                    className={`cursor-pointer font-bold ${
                      selectedOwner.isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {selectedOwner.isActive ? "Ya, Tangguhkan Akun" : "Ya, Aktifkan Akun"}
                  </Button>
                </div>
              </>
            ) : (
              /* Step 2: Platform Password Verification */
              <form onSubmit={handleToggleSuspend} className="space-y-4 text-left">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <IconLock className="size-8" />
                </div>

                <div className="text-center">
                  <h3 className="font-black text-lg text-foreground">
                    Verifikasi Password Platform
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Demi keamanan, silakan masukkan kembali password akun Platform Admin yang sedang login saat ini untuk memproses akun <strong className="text-foreground">{selectedOwner.fullName}</strong>.
                  </p>
                </div>

                {modalErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <IconAlertTriangle className="size-4 shrink-0" />
                    <span>{modalErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold block mb-1 text-xs">Password Akun Admin Saat Ini *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password akun Anda..."
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full rounded-xl border p-2.5 pr-10 bg-background font-mono text-xs focus:ring-2 focus:ring-amber-500"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSuspendStep(1)}
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !adminPassword}
                    size="sm"
                    className={`font-bold cursor-pointer ${
                      selectedOwner.isActive
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isSubmitting ? <IconLoader2 className="size-4 animate-spin mr-1" /> : <IconCheck className="size-4 mr-1" />}
                    {selectedOwner.isActive ? "Konfirmasi Tangguhkan" : "Konfirmasi Aktifkan"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: View Owner Detail */}
      {showDetailModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <IconInfoCircle className="size-5 text-amber-500" />
                <h3 className="font-black text-base text-foreground">Detail Akun Owner</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-lg border border-amber-500/20">
                    {selectedOwner.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-foreground">{selectedOwner.fullName}</h4>
                    <p className="text-muted-foreground text-xs">{selectedOwner.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Status Akun</p>
                  <Badge variant={selectedOwner.isActive ? "default" : "destructive"} className="mt-1">
                    {selectedOwner.isActive ? "AKTIF" : "DITANGGUHKAN"}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Paket SaaS</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400 mt-1">{selectedOwner.currentPlan}</p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Properti</p>
                  <p className="font-bold text-foreground mt-1">{selectedOwner.propertyCount} Properti</p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Telepon</p>
                  <p className="font-bold text-foreground mt-1">{selectedOwner.phoneNumber}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border bg-card text-[11px] space-y-1">
                <p className="text-muted-foreground">ID Owner: <span className="font-mono text-foreground">{selectedOwner.id}</span></p>
                <p className="text-muted-foreground">Terdaftar Pada: <span className="font-mono text-foreground">{new Date(selectedOwner.createdAt).toLocaleString("id-ID")}</span></p>
              </div>
            </div>

            <div className="pt-2 border-t text-right">
              <Button size="sm" variant="outline" onClick={() => setShowDetailModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

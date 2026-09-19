"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconChecklist,
  IconBuildingBank,
  IconReceipt,
  IconClock,
  IconCheck,
  IconX,
  IconEye,
  IconLoader2,
  IconRefresh,
  IconPlus,
  IconTrash,
  IconEdit,
  IconFileTypePdf,
  IconExternalLink,
  IconAlertTriangle,
  IconBuilding,
  IconUser,
  IconShieldCheck,
  IconDeviceFloppy,
  IconHelpCircle,
} from "@tabler/icons-react";
import ImageWithSkeleton from "@/components/common/ImageWithSkeleton";

interface VerificationInvoice {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  utilityAmount: number | string;
  penaltyAmount: number | string;
  totalAmount: number | string;
  dueDate: string;
  paidAt?: string | null;
  status: string;
  paymentReceipt?: string | null;
  lease?: {
    unit?: {
      unitNumber?: string;
      property?: {
        id?: string;
        name?: string;
      };
    };
    tenant?: {
      fullName?: string;
      phoneNumber?: string;
      user?: {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
      };
    };
  };
}

interface OwnerPaymentMethod {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  notes?: string | null;
  isEnabled: boolean;
  propertyId?: string | null;
  property?: {
    id: string;
    name: string;
  } | null;
}

interface PropertyOption {
  id: string;
  name: string;
}

export function InvoiceVerificationView() {
  const [activeTab, setActiveTab] = useState<"verification" | "bank">("verification");

  // Tab 1: Verification State
  const [invoices, setInvoices] = useState<VerificationInvoice[]>([]);
  const [verifLoading, setVerifLoading] = useState(true);
  const [verifError, setVerifError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("PENDING_VERIFICATION");
  const [verifMeta, setVerifMeta] = useState({ pendingCount: 0, paidCount: 0, totalCount: 0 });

  // Inspection Modal
  const [inspectInvoice, setInspectInvoice] = useState<VerificationInvoice | null>(null);
  const [imgError, setImgError] = useState(false);
  const [actionModalInvoice, setActionModalInvoice] = useState<VerificationInvoice | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (inspectInvoice) {
      setImgError(false);
    }
  }, [inspectInvoice]);

  // Tab 2: Owner Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<OwnerPaymentMethod[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Bank Form Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OwnerPaymentMethod | null>(null);
  const [bankName, setBankName] = useState("BCA");
  const [customBankName, setCustomBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("ALL");
  const [bankNotes, setBankNotes] = useState("");
  const [submittingBank, setSubmittingBank] = useState(false);
  const [bankModalError, setBankModalError] = useState<string | null>(null);

  // Bank Delete Confirmation Modal State
  const [deleteConfirmBank, setDeleteConfirmBank] = useState<OwnerPaymentMethod | null>(null);
  const [deletingBank, setDeletingBank] = useState(false);
  const [deleteBankError, setDeleteBankError] = useState<string | null>(null);

  // Fetch Verification Invoices
  const fetchVerificationInvoices = useCallback(async () => {
    setVerifLoading(true);
    setVerifError(null);
    try {
      const res = await fetch(`/api/finance/verification?status=${filterStatus}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat data verifikasi invoice.");
      }
      setInvoices(json.data || []);
      if (json.meta) setVerifMeta(json.meta);
    } catch (err: any) {
      setVerifError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setVerifLoading(false);
    }
  }, [filterStatus]);

  // Fetch Owner Payment Methods & Properties
  const fetchOwnerPaymentMethods = useCallback(async () => {
    setBankLoading(true);
    setBankError(null);
    try {
      const [pmRes, propRes] = await Promise.all([
        fetch("/api/finance/payment-methods"),
        fetch("/api/properties"),
      ]);

      const pmJson = await pmRes.json();
      if (pmRes.ok && pmJson.success) {
        setPaymentMethods(pmJson.data || []);
      }

      const propJson = await propRes.json();
      if (propRes.ok && propJson.success) {
        setProperties(propJson.data || []);
      }
    } catch (err: any) {
      setBankError(err.message || "Gagal memuat daftar rekening bank.");
    } finally {
      setBankLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "verification") {
      fetchVerificationInvoices();
    } else {
      fetchOwnerPaymentMethods();
    }
  }, [activeTab, fetchVerificationInvoices, fetchOwnerPaymentMethods]);

  // Submit Approval / Rejection
  const handleConfirmAction = async () => {
    if (!actionModalInvoice || !actionType) return;
    setSubmittingAction(true);
    try {
      const res = await fetch("/api/finance/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: actionModalInvoice.id,
          action: actionType,
          notes: actionNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memproses verifikasi.");
      }

      setActionModalInvoice(null);
      setInspectInvoice(null);
      setActionType(null);
      setActionNotes("");
      fetchVerificationInvoices();
    } catch (err: any) {
      alert(err.message || "Gagal memproses aksi verifikasi.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Open Bank Account Modal (Add / Edit)
  const openBankModal = (method?: OwnerPaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      const isKnownBank = ["BCA", "Mandiri", "BRI", "BNI", "BSI", "Bank Jago", "Dana", "GoPay", "QRIS"].includes(method.bankName);
      if (isKnownBank) {
        setBankName(method.bankName);
        setCustomBankName("");
      } else {
        setBankName("LAINNYA");
        setCustomBankName(method.bankName);
      }
      setAccountNumber(method.accountNumber);
      setAccountHolder(method.accountHolder);
      setSelectedPropertyId(method.propertyId || "ALL");
      setBankNotes(method.notes || "");
    } else {
      setEditingMethod(null);
      setBankName("BCA");
      setCustomBankName("");
      setAccountNumber("");
      setAccountHolder("");
      setSelectedPropertyId("ALL");
      setBankNotes("");
    }
    setBankModalError(null);
    setShowBankModal(true);
  };

  // Save Owner Bank Account
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName = bankName === "LAINNYA" ? customBankName.trim() : bankName;
    if (!finalBankName || !accountNumber.trim() || !accountHolder.trim()) {
      setBankModalError("Nama Bank, Nomor Rekening, dan Nama Pemilik Rekening wajib diisi.");
      return;
    }

    setSubmittingBank(true);
    setBankModalError(null);

    try {
      const payload = {
        bankName: finalBankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        propertyId: selectedPropertyId,
        notes: bankNotes.trim(),
      };

      const url = editingMethod
        ? `/api/finance/payment-methods/${editingMethod.id}`
        : "/api/finance/payment-methods";
      const method = editingMethod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan rekening bank.");
      }

      setShowBankModal(false);
      fetchOwnerPaymentMethods();
    } catch (err: any) {
      setBankModalError(err.message || "Gagal menyimpan rekening bank.");
    } finally {
      setSubmittingBank(false);
    }
  };

  // Toggle Active/Disable Bank Account
  const handleToggleBankActive = async (pm: OwnerPaymentMethod) => {
    try {
      const res = await fetch(`/api/finance/payment-methods/${pm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !pm.isEnabled }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchOwnerPaymentMethods();
      }
    } catch (err) {
      console.error("Failed to toggle bank account:", err);
    }
  };

  // Confirm Delete Owner Bank Account
  const handleConfirmDeleteBank = async () => {
    if (!deleteConfirmBank) return;
    setDeletingBank(true);
    setDeleteBankError(null);
    try {
      const res = await fetch(`/api/finance/payment-methods/${deleteConfirmBank.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus rekening bank.");
      }
      setDeleteConfirmBank(null);
      fetchOwnerPaymentMethods();
    } catch (err: any) {
      setDeleteBankError(err.message || "Gagal menghapus rekening bank.");
    } finally {
      setDeletingBank(false);
    }
  };

  const formatIDR = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <IconCheck className="h-3 w-3" /> LUNAS (VERIFIED)
          </span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 animate-pulse">
            <IconClock className="h-3 w-3" /> MENUNGGU VERIFIKASI
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
            <IconAlertTriangle className="h-3 w-3" /> OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-700/60">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            <IconShieldCheck className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Verifikasi Pembayaran &amp; Rekening Properti</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Konfirmasi bukti transfer dari penyewa dan kelola nomor rekening bank / QRIS pengelola Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("verification")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "verification"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <IconChecklist className="h-4 w-4" />
          Konfirmasi Pembayaran Tenant
          {verifMeta.pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-black">
              {verifMeta.pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "bank"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <IconBuildingBank className="h-4 w-4" />
          Pengaturan Rekening Bank Properti
        </button>
      </div>

      {/* TAB 1: VERIFIKASI PEMBAYARAN */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:bg-amber-950/30 dark:border-amber-800/80 shadow-xs">
              <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 text-xs font-bold">
                <span>Perlu Diverifikasi:</span>
                <IconClock className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                {verifMeta.pendingCount} Tagihan
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Bukti bayar diunggah tenant menunggu konfirmasi Owner.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:bg-emerald-950/30 dark:border-emerald-800/80 shadow-xs">
              <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <span>Sudah Diverifikasi Lunas:</span>
                <IconCheck className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                {verifMeta.paidCount} Tagihan
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                Transaksi berhasil disetujui &amp; kuitansi dikirim.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-800/40 dark:border-slate-700 shadow-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 text-xs font-bold">
                <span>Total Riwayat Bukti Bayar:</span>
                <IconReceipt className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {verifMeta.totalCount} Transaksi
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Total bukti transfer yang pernah diterima.
              </p>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {[
                { key: "PENDING_VERIFICATION", label: "Menunggu Verifikasi" },
                { key: "PAID", label: "Sudah Lunas" },
                { key: "ALL", label: "Semua Invoice" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    filterStatus === tab.key
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchVerificationInvoices}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
            >
              <IconRefresh className="h-3.5 w-3.5" /> Refresh Data
            </button>
          </div>

          {/* Verification Invoices Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
            {verifLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                <IconLoader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Memuat data verifikasi pembayaran...</p>
              </div>
            ) : verifError ? (
              <div className="p-8 text-center text-xs text-rose-600 font-medium">{verifError}</div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <IconChecklist className="h-6 w-6" />
                </div>
                <p className="font-bold text-base text-slate-900 dark:text-white">Tidak ada antrean verifikasi</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semua bukti bayar sewa dari tenant telah diproses atau belum ada bukti baru yang diunggah.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="px-4 py-3.5">No. Invoice</th>
                      <th className="px-4 py-3.5">Penyewa &amp; Unit</th>
                      <th className="px-4 py-3.5">Nominal Tagihan</th>
                      <th className="px-4 py-3.5">Bukti Transfer</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Verifikasi Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                    {invoices.map((inv) => {
                      const tenantName = inv.lease?.tenant?.fullName || inv.lease?.tenant?.user?.fullName || "Penyewa";
                      const propertyName = inv.lease?.unit?.property?.name || "Properti";
                      const unitNumber = inv.lease?.unit?.unitNumber || "-";
                      const isPdf = inv.paymentReceipt?.match(/\.pdf($|\?)/i) || inv.paymentReceipt?.startsWith("data:application/pdf");

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            #{inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">{tenantName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {propertyName} • <span className="font-semibold text-emerald-600 dark:text-emerald-400">Unit {unitNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white whitespace-nowrap text-sm">
                            {formatIDR(inv.totalAmount)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {inv.paymentReceipt ? (
                              <button
                                onClick={() => setInspectInvoice(inv)}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition-all"
                              >
                                {isPdf ? (
                                  <>
                                    <IconFileTypePdf className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    <span>Periksa PDF</span>
                                  </>
                                ) : (
                                  <>
                                    <IconEye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Lihat Foto</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Belum diunggah</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status === "PENDING_VERIFICATION" ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setActionModalInvoice(inv);
                                      setActionType("APPROVE");
                                      setActionNotes("");
                                    }}
                                    className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all"
                                  >
                                    <IconCheck className="h-3.5 w-3.5" /> Setujui (Lunas)
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActionModalInvoice(inv);
                                      setActionType("REJECT");
                                      setActionNotes("");
                                    }}
                                    className="flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 transition-all"
                                  >
                                    <IconX className="h-3.5 w-3.5" /> Tolak
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setInspectInvoice(inv)}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                >
                                  Rincian
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PENGATURAN REKENING BANK PROPERTI */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:bg-slate-900 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Rekening Bank &amp; E-Wallet Pengelola</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nomor rekening ini akan tampil otomatis pada portal penyewa saat membayar tagihan sewa unit properti Anda.
              </p>
            </div>
            <button
              onClick={() => openBankModal()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all shrink-0"
            >
              <IconPlus className="h-4 w-4" /> Tambah Rekening Bank
            </button>
          </div>

          {bankLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
              <IconLoader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Memuat daftar rekening bank...</p>
            </div>
          ) : bankError ? (
            <div className="p-8 text-center text-xs text-rose-600 font-medium">{bankError}</div>
          ) : paymentMethods.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <IconBuildingBank className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Belum Ada Rekening Bank Ditambahkan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Tambahkan nomor rekening bank (BCA, Mandiri, BRI, QRIS, dll) agar penyewa dapat melihat instruksi transfer resmi saat membayar invoice.
              </p>
              <button
                onClick={() => openBankModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all"
              >
                <IconPlus className="h-4 w-4" /> Tambah Rekening Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className={`relative rounded-2xl border p-5 transition-all shadow-xs space-y-4 flex flex-col justify-between ${
                    pm.isEnabled
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40 opacity-60"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 text-xs dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {pm.bankName}
                        </span>
                        {pm.property ? (
                          <span className="rounded-lg bg-slate-100 text-slate-600 font-medium px-2 py-0.5 text-[10px] dark:bg-slate-800 dark:text-slate-400 truncate max-w-[120px]">
                            {pm.property.name}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-blue-50 text-blue-700 font-medium px-2 py-0.5 text-[10px] dark:bg-blue-950 dark:text-blue-300">
                            Semua Properti
                          </span>
                        )}
                      </div>

                      {/* Active Status Switch */}
                      <button
                        onClick={() => handleToggleBankActive(pm)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          pm.isEnabled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {pm.isEnabled ? "Aktif" : "Non-Aktif"}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="text-lg font-black font-mono tracking-wider text-slate-900 dark:text-white">
                        {pm.accountNumber}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        a.n {pm.accountHolder}
                      </div>
                    </div>

                    {pm.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                        &quot;{pm.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => openBankModal(pm)}
                      className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                    >
                      <IconEdit className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteBankError(null);
                        setDeleteConfirmBank(pm);
                      }}
                      className="flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 transition-all"
                    >
                      <IconTrash className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECT / PROOF PREVIEW MODAL */}
      {inspectInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  <IconReceipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Inspeksi Bukti Transfer #{inspectInvoice.invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Penyewa: {inspectInvoice.lease?.tenant?.fullName || inspectInvoice.lease?.tenant?.user?.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectInvoice(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:bg-slate-800/50 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Nominal Wajib Bayar:</span>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatIDR(inspectInvoice.totalAmount)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Jatuh Tempo:</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {new Date(inspectInvoice.dueDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Proof File Inspection Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>File Bukti Transfer Pengirim:</span>
                  {inspectInvoice.paymentReceipt && (
                    <a
                      href={inspectInvoice.paymentReceipt}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline text-[11px] font-bold flex items-center gap-1"
                    >
                      Buka di Tab Baru <IconExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </label>

                {inspectInvoice.paymentReceipt ? (
                  inspectInvoice.paymentReceipt.match(/\.pdf($|\?)/i) || inspectInvoice.paymentReceipt.startsWith("data:application/pdf") ? (
                    <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 space-y-3">
                      <IconFileTypePdf className="h-12 w-12 text-rose-600 dark:text-rose-400" />
                      <div className="text-center">
                        <p className="font-bold text-sm">Dokumen Bukti Transfer PDF</p>
                        <p className="text-xs text-rose-700 dark:text-rose-400">
                          File terlampir dalam format PDF digital.
                        </p>
                      </div>
                      <a
                        href={inspectInvoice.paymentReceipt}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <IconEye className="h-4 w-4" /> Buka &amp; Unduh PDF
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-900 p-2 overflow-hidden shadow-xs text-center dark:border-slate-700">
                      {imgError ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-800 text-slate-200 space-y-3">
                          <IconAlertTriangle className="h-10 w-10 text-amber-400" />
                          <div className="text-center space-y-1">
                            <p className="font-bold text-xs text-white">File Gambar Bukti Transfer Tidak Dapat Dimuat</p>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                              Tautan file tidak dapat diakses atau menggunakan URL sampel yang tidak valid.
                            </p>
                          </div>
                          <a
                            href={inspectInvoice.paymentReceipt}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all"
                          >
                            <IconExternalLink className="h-3.5 w-3.5" /> Buka URL Langsung
                          </a>
                        </div>
                      ) : (
                        <ImageWithSkeleton
                          src={inspectInvoice.paymentReceipt}
                          alt="Bukti Transfer Tenant"
                          containerClassName="max-h-80 w-full flex items-center justify-center"
                          className="max-h-80 w-auto mx-auto rounded-lg object-contain"
                          onError={() => setImgError(true)}
                        />
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 space-y-3 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200/70 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <IconReceipt className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Tidak Ada Berkas Bukti Transfer</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Penyewa belum mengunggah berkas bukti transfer untuk tagihan ini ke storage sistem.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Inspect Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectInvoice(null)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>

                {inspectInvoice.status === "PENDING_VERIFICATION" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActionModalInvoice(inspectInvoice);
                        setActionType("REJECT");
                        setActionNotes("");
                      }}
                      className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 text-xs font-bold border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 transition-all flex items-center gap-1"
                    >
                      <IconX className="h-4 w-4" /> Tolak
                    </button>
                    <button
                      onClick={() => {
                        setActionModalInvoice(inspectInvoice);
                        setActionType("APPROVE");
                        setActionNotes("");
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                    >
                      <IconCheck className="h-4 w-4" /> Setujui (Konfirmasi Lunas)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL (APPROVE / REJECT) */}
      {actionModalInvoice && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border font-bold ${
                    actionType === "APPROVE"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                  }`}
                >
                  {actionType === "APPROVE" ? <IconCheck className="h-5 w-5" /> : <IconX className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {actionType === "APPROVE" ? "Konfirmasi Verifikasi Lunas" : "Tolak Bukti Pembayaran"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invoice #{actionModalInvoice.invoiceNumber}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {actionType === "APPROVE"
                  ? `Apakah Anda yakin ingin memverifikasi pembayaran sewa sebesar ${formatIDR(
                      actionModalInvoice.totalAmount
                    )} sebagai LUNAS? Kuitansi digital akan otomatis dikirimkan ke email tenant.`
                  : "Bukti transfer akan ditolak dan tenant diminta mengunggah ulang bukti bayar yang sah."}
              </p>

              {actionType === "REJECT" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alasan Penolakan (Opsional):</label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Contoh: Nominal transfer tidak sesuai / gambar tidak terbaca jelas."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModalInvoice(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleConfirmAction}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 ${
                    actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submittingAction ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : actionType === "APPROVE" ? (
                    "Ya, Verifikasi Lunas"
                  ) : (
                    "Ya, Tolak Bukti"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANK ACCOUNT FORM MODAL (ADD / EDIT) */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  <IconBuildingBank className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingMethod ? "Edit Rekening Bank" : "Tambah Rekening Bank Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instruksi Pembayaran Tenant</p>
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-6 space-y-4">
              {bankModalError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 font-medium">
                  {bankModalError}
                </div>
              )}

              {/* Bank Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Bank / E-Wallet *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="Bank Jago">Bank Jago</option>
                  <option value="Dana">DANA (E-Wallet)</option>
                  <option value="GoPay">GoPay (E-Wallet)</option>
                  <option value="QRIS">QRIS All Payment</option>
                  <option value="LAINNYA">Lainnya (Ketik Manual)</option>
                </select>
              </div>

              {bankName === "LAINNYA" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Bank Kustom *</label>
                  <input
                    type="text"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Contoh: Bank Permata / SeaBank"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              )}

              {/* Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomor Rekening / Nomor Telepon E-Wallet *</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 8421130965 atau 08123456789"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold"
                />
              </div>

              {/* Account Holder */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Pemilik Rekening (a.n) *</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Contoh: Bpk. Hendra Pratama"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              {/* Property Scope */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Properti (Opsional)</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="ALL">Semua Properti Saya</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan / Instruksi Transfer (Opsional)</label>
                <textarea
                  rows={2}
                  value={bankNotes}
                  onChange={(e) => setBankNotes(e.target.value)}
                  placeholder="Contoh: Cantumkan nomor kamar pada berita transfer."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBank}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                >
                  {submittingBank ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy className="h-4 w-4" />
                      Simpan Rekening Bank
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BANK CONFIRMATION MODAL */}
      {deleteConfirmBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800 shrink-0">
                <IconTrash className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Hapus Rekening Bank</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Konfirmasi Penghapusan Rekening</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus rekening bank ini dari opsi pembayaran tenant?
            </p>

            {/* Account Info Preview Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 dark:bg-slate-800/60 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{deleteConfirmBank.bankName}</span>
                {deleteConfirmBank.property ? (
                  <span className="text-[10px] text-slate-500">{deleteConfirmBank.property.name}</span>
                ) : (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Semua Properti</span>
                )}
              </div>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {deleteConfirmBank.accountNumber}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                a.n {deleteConfirmBank.accountHolder}
              </div>
            </div>

            {deleteBankError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 font-medium">
                {deleteBankError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={deletingBank}
                onClick={() => {
                  setDeleteConfirmBank(null);
                  setDeleteBankError(null);
                }}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingBank}
                onClick={handleConfirmDeleteBank}
                className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletingBank ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <IconTrash className="h-4 w-4" /> Ya, Hapus Rekening
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

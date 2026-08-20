"use client";

import React, { useState, useEffect } from "react";
import {
  IconCreditCard,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconLoader2,
  IconRefresh,
  IconBuildingBank,
  IconQrcode,
  IconShieldCheck,
  IconCopy,
  IconSparkles,
  IconInfoCircle,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  badgeColor?: string;
  isEnabled: boolean;
  notes?: string;
}

export function formatAccountNumber(val: string): string {
  if (!val) return "";
  // Keep QRIS NMID or text strings intact
  if (/^NMID/i.test(val) || /[a-zA-Z]/.test(val)) {
    return val;
  }

  const cleaned = val.replace(/\D/g, "");
  if (!cleaned) return val;

  return cleaned.match(/.{1,4}/g)?.join("-") || val;
}

export function SaasPaymentMethodsManager() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formBankName, setFormBankName] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formAccountHolder, setFormAccountHolder] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  // Delete Confirm Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, textToCopy: string) => {
    if (!textToCopy) return;
    // Copy raw original value without hyphen formatting (e.g. 8421130965)
    const rawText = /^NMID/i.test(textToCopy)
      ? textToCopy
      : textToCopy.replace(/-/g, "").trim();

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(rawText)
        .then(() => {
          setCopiedId(id);
          setSuccessMsg(`Nomor rekening (${rawText}) berhasil disalin ke clipboard!`);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          fallbackCopyTextToClipboard(id, rawText);
        });
    } else {
      fallbackCopyTextToClipboard(id, rawText);
    }
  };

  const fallbackCopyTextToClipboard = (id: string, text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(id);
      setSuccessMsg(`Nomor rekening (${text}) berhasil disalin ke clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Fallback copy error:", err);
      setErrorMsg("Gagal menyalin nomor rekening.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/payment-methods", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.paymentMethods)) {
        setAccounts(json.data.paymentMethods);
      } else {
        setAccounts([]);
        if (json.message) setErrorMsg(json.message);
      }
    } catch (err) {
      console.error("Failed to load SaaS payment accounts:", err);
      setErrorMsg("Gagal terhubung ke server database.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormBankName("");
    setFormAccountNumber("");
    setFormAccountHolder("PT ARVENTA PROPERTY SYSTEM");
    setFormNotes("Sertakan nomor invoice pada berita transfer.");
    setFormIsEnabled(true);
    setModalErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (acc: BankAccountItem) => {
    setEditingId(acc.id);
    setFormBankName(acc.bankName);
    setFormAccountNumber(acc.accountNumber ? acc.accountNumber.replace(/-/g, "") : "");
    setFormAccountHolder(acc.accountHolder);
    setFormNotes(acc.notes || "");
    setFormIsEnabled(acc.isEnabled);
    setModalErrorMsg(null);
    setShowModal(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankName || !formAccountNumber || !formAccountHolder) {
      setModalErrorMsg("Nama Bank, Nomor Rekening, dan Atas Nama wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setModalErrorMsg(null);
    setErrorMsg(null);

    try {
      const action = editingId ? "UPDATE" : "CREATE";
      const cleanAccountNumber = formAccountNumber.replace(/-/g, "").trim();
      const payload = {
        action,
        id: editingId,
        bankName: formBankName,
        accountNumber: cleanAccountNumber,
        accountHolder: formAccountHolder,
        notes: formNotes,
        isEnabled: formIsEnabled,
      };

      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setSuccessMsg(json.message || "Rekening bank berhasil disimpan!");
        setShowModal(false);
        setEditingId(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal menyimpan rekening bank");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat menyimpan rekening.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAccount = async (id: string) => {
    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE", id }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        fetchData();
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal mengubah status rekening.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", id: deleteConfirmId }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setDeleteConfirmId(null);
        fetchData();
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghapus rekening bank.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = accounts.filter((a) => a.isEnabled).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconBuildingBank className="mr-1 size-3.5 text-[#C8A96B]" /> SAAS PAYMENT METHOD CONFIGURATION
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Pengaturan Rekening & Metode Pembayaran SaaS
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Kelola nomor rekening bank resmi dan QRIS merchant tujuan transfer tagihan langganan SaaS oleh owner properti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={fetchData}
              variant="outline"
              className="gap-1.5 font-bold text-xs rounded-xl border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]"
            >
              <IconRefresh className="size-4" /> Refresh Data
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="gap-1.5 font-bold text-xs bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white rounded-xl shadow-sm"
            >
              <IconPlus className="size-4" /> Tambah Rekening Bank
            </Button>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <IconX className="size-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Accounts List Grid */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconBuildingBank className="size-5 text-amber-500" />
              Daftar Rekening Bank Pembayaran SaaS ({accounts.length} Terdaftar, {activeCount} Aktif)
            </CardTitle>
            <CardDescription>
              Rekening yang diaktifkan di sini akan tampil sebagai pilihan metode transfer pembayaran invoice SaaS owner.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <IconLoader2 className="size-8 animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-muted-foreground">Memuat data rekening bank SaaS dari database...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/20 space-y-3">
              <IconBuildingBank className="size-10 text-muted-foreground/60" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-foreground">Belum ada Rekening Bank di Database</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Silakan klik tombol &quot;Tambah Rekening Bank&quot; untuk menambahkan data rekening resmi platform ARVENTA.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreateModal} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm">
                <IconPlus className="size-4" /> Tambah Rekening Sekarang
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 bg-card transition-all ${
                    acc.isEnabled ? "border-border/80 shadow-xs" : "border-dashed opacity-60 bg-muted/20"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20">
                          {acc.id === "qris" ? <IconQrcode className="size-5" /> : <IconBuildingBank className="size-5" />}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-foreground">{acc.bankName}</h3>
                          <Badge variant={acc.isEnabled ? "default" : "outline"} className={acc.isEnabled ? "bg-emerald-600 text-white text-[9px]" : "text-[9px]"}>
                            {acc.isEnabled ? "AKTIF (TAMPIL DI INVOICE)" : "NON-AKTIF"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1 font-mono text-xs">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nomor Rekening / Merchant ID:</p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-amber-600 dark:text-amber-400 tracking-wider">
                          {formatAccountNumber(acc.accountNumber)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(acc.id, acc.accountNumber)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            copiedId === acc.id
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-muted/60 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 border border-transparent"
                          }`}
                          title="Salin Nomor Rekening"
                        >
                          {copiedId === acc.id ? (
                            <>
                              <IconCheck className="size-3.5 text-emerald-500" />
                              <span className="text-[11px] font-bold">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <IconCopy className="size-3.5" />
                              <span className="text-[11px] font-bold">Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-foreground font-semibold">A.N: {acc.accountHolder}</p>
                    </div>

                    {acc.notes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/40">
                        <IconInfoCircle className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                        <span>{acc.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between">
                    <Button
                      size="sm"
                      variant={acc.isEnabled ? "default" : "outline"}
                      onClick={() => handleToggleAccount(acc.id)}
                      className="text-xs font-semibold h-8 gap-1.5"
                    >
                      {acc.isEnabled ? <IconToggleRight className="size-4 text-emerald-400" /> : <IconToggleLeft className="size-4" />}
                      {acc.isEnabled ? "Nonaktifkan" : "Aktifkan"}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(acc)}
                        className="text-amber-500 hover:bg-amber-500/10 h-8 px-2.5 gap-1 text-xs"
                      >
                        <IconPencil className="size-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(acc.id)}
                        className="text-red-500 hover:bg-red-500/10 h-8 px-2 text-xs"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              {editingId ? <IconPencil className="size-5 text-amber-500" /> : <IconPlus className="size-5 text-amber-500" />}
              {editingId ? "Edit Rekening Bank SaaS" : "Tambah Rekening Bank Pembayaran Baru"}
            </h3>

            {modalErrorMsg && (
              <div className="flex items-start justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <div className="flex items-start gap-2">
                  <IconX className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{modalErrorMsg}</span>
                </div>
                <button onClick={() => setModalErrorMsg(null)} className="text-[11px] hover:underline shrink-0 ml-2">
                  Tutup
                </button>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Bank / Gateway Pembayaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Bank BCA, Bank Mandiri, QRIS Merchant..."
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-amber-500 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nomor Rekening / Merchant ID</label>
                <input
                  type="text"
                  placeholder="Contoh: 8421130965"
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value.replace(/\s+/g, ""))}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs focus:ring-2 focus:ring-amber-500 font-bold tracking-wider"
                  required
                />
                {formAccountNumber && !/[a-zA-Z]/.test(formAccountNumber) && (
                  <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                    Preview Tampilan Invoice: <span className="font-bold text-amber-600 dark:text-amber-400">{formatAccountNumber(formAccountNumber)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold block mb-1">Atas Nama (A.N. Pemilik Rekening)</label>
                <input
                  type="text"
                  placeholder="Contoh: PT ARVENTA PROPERTY SYSTEM"
                  value={formAccountHolder}
                  onChange={(e) => setFormAccountHolder(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs focus:ring-2 focus:ring-amber-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Petunjuk / Catatan Transfer (Optional)</label>
                <textarea
                  placeholder="Instruksi singkat transfer..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs h-20 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkActive"
                  checked={formIsEnabled}
                  onChange={(e) => setFormIsEnabled(e.target.checked)}
                  className="size-4 rounded border-amber-500 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="chkActive" className="font-bold text-xs cursor-pointer">
                  Aktifkan Rekening Ini (Tampilkan di pilihan pembayaran invoice SaaS)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1"
                >
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Simpan Rekening
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border shadow-2xl p-6 space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <IconTrash className="size-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-foreground">Hapus Rekening Bank?</h3>
              <p className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin menghapus rekening bank ini dari opsi pembayaran SaaS?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 text-xs font-bold h-9 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteAccount}
                className="flex-1 text-xs font-bold h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : "Hapus Rekening"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

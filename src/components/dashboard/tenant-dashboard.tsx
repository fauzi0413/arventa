"use client";

import { useState } from "react";
import {
  IconBed,
  IconBuilding,
  IconReceipt,
  IconFileText,
  IconPhoneCall,
  IconUpload,
  IconAlertCircle,
  IconCheck,
  IconCalendarEvent,
  IconShield,
  IconBell,
  IconMessages,
  IconBrandWhatsapp,
  IconDownload,
  IconSparkles,
  IconSend,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TenantDashboardProps {
  data: {
    user: { fullName: string; email: string; phoneNumber?: string | null };
    tenantProfile: {
      occupation?: string | null;
      emergencyName?: string | null;
      emergencyPhone?: string | null;
    } | null;
    lease: {
      id: string;
      rentPrice: number;
      startDate: string;
      endDate: string;
      rentalPeriod: string;
      status: string;
      contractUrl?: string | null;
      unit: {
        id: string;
        unitNumber: string;
        floor: number;
        facilities: string[];
        property: {
          id: string;
          name: string;
          address: string;
          city: string;
          type: string;
          owner: { fullName: string; phoneNumber?: string | null; email: string };
        };
      };
      invoices: Array<{
        id: string;
        invoiceNumber: string;
        amount: number;
        utilityAmount: number;
        totalAmount: number;
        dueDate: string;
        paidAt?: string | null;
        status: string;
        paymentReceipt?: string | null;
      }>;
    } | null;
    housekeepingStaff: Array<{
      fullName: string;
      phoneNumber: string;
      email: string;
    }>;
    forumPosts: Array<{
      id: string;
      title: string;
      content: string;
      authorName: string;
      commentCount: number;
      createdAt: string;
    }>;
    announcements: Array<{
      id: string;
      title: string;
      content: string;
      isPinned: boolean;
      createdAt: string;
    }>;
  };
}

export function TenantDashboard({ data }: TenantDashboardProps) {
  const [activeTab, setActiveTab] = useState<"room" | "contract" | "invoices" | "community">("room");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const lease = data.lease;
  const unit = lease?.unit;
  const property = unit?.property;
  const pendingInvoice = lease?.invoices.find((inv) => inv.status === "PENDING" || inv.status === "OVERDUE");
  const paidInvoices = lease?.invoices.filter((inv) => inv.status === "PAID") || [];

  const handleSimulatePayment = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setSelectedInvoice(null);
        setUploadSuccess(false);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs tracking-wide uppercase">
                <IconBed className="mr-1 size-3.5" /> Portal Akun Kamar / Tenant Space
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {data.user.fullName}
            </h1>
            <p className="mt-1 text-sm text-emerald-200/80">
              {property ? (
                <>Penghuni aktif <strong>{property.name}</strong> — Unit <strong>{unit?.unitNumber}</strong></>
              ) : (
                "Informasi hunian, tagihan sewa bulanan, dan dokumen kontrak Anda."
              )}
            </p>
          </div>

          {lease && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="font-semibold text-xs gap-1.5"
                onClick={() => alert("Mengunduh Perjanjian Sewa PDF...")}
              >
                <IconDownload className="size-4" /> Unduh Kontrak PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Module Tabs Bar (No raw emojis in text labels) */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: "room", label: "Info Kamar Saya", icon: IconBed },
          { id: "contract", label: "Kontrak & Dokumen", icon: IconFileText },
          { id: "invoices", label: "Tagihan & Pembayaran", icon: IconReceipt },
          { id: "community", label: "Komunitas Properti", icon: IconMessages },
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

      {/* TAB 1: INFO KAMAR SAYA */}
      {activeTab === "room" && (
        <div className="space-y-6">
          {lease ? (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <IconBuilding className="size-5 text-emerald-600" />
                    Detail Kamar & Profil Penghuni Terdaftar
                  </CardTitle>
                  <CardDescription>{property?.address}, {property?.city}</CardDescription>
                </div>
                <Badge variant="default" className="bg-emerald-600 text-white font-semibold text-xs">
                  KONTRAK AKTIF
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3 rounded-xl border bg-muted/20 p-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Nomor Kamar</span>
                    <p className="text-xl font-extrabold text-foreground mt-0.5">Unit {unit?.unitNumber}</p>
                    <span className="text-[11px] text-muted-foreground">Lantai {unit?.floor}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Sewa Bulanan</span>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatIDR(lease.rentPrice)}
                    </p>
                    <span className="text-[11px] text-muted-foreground">Periode: {lease.rentalPeriod}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Masa Sewa</span>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {new Date(lease.startDate).toLocaleDateString("id-ID")} -
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(lease.endDate).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                {unit?.facilities && unit.facilities.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase">Fasilitas Kamar:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {unit.facilities.map((fac) => (
                        <Badge key={fac} variant="secondary" className="text-xs">
                          {fac}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 shadow-sm p-6 text-center text-sm text-muted-foreground">
              Anda belum memiliki kontrak sewa aktif yang terhubung.
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: KONTRAK & DOKUMEN */}
      {activeTab === "contract" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconFileText className="size-5 text-blue-600" />
                Dokumen Kontrak Perjanjian Sewa
              </CardTitle>
              <CardDescription>Unduh file surat perjanjian sewa format PDF terverifikasi.</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5 text-xs font-semibold" onClick={() => alert("Mengunduh Kontrak PDF...")}>
              <IconDownload className="size-4" /> Unduh Surat Perjanjian (PDF)
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Dokumen perjanjian sewa digital Anda tersimpan dengan aman dan dapat diunduh kapan saja.
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TAGIHAN & PEMBAYARAN */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconReceipt className="size-5 text-emerald-600" />
                Daftar Invoice Tagihan Bulanan & Utilitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvoice ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-amber-500 text-white font-semibold mb-1">
                        MENUNGGU PEMBAYARAN
                      </Badge>
                      <h3 className="text-lg font-bold text-foreground">
                        Invoice #{pendingInvoice.invoiceNumber}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Jatuh Tempo: {new Date(pendingInvoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground font-medium">Total Tagihan</span>
                      <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                        {formatIDR(pendingInvoice.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-amber-500/20 pt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Sewa: {formatIDR(pendingInvoice.amount)} • Air/Listrik: {formatIDR(pendingInvoice.utilityAmount)}
                    </span>
                    <Button
                      onClick={() => setSelectedInvoice(pendingInvoice)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md gap-1.5"
                    >
                      <IconUpload className="size-4" /> Upload Bukti Bayar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                  <IconCheck className="size-6 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Tidak ada tagihan tertunggak!</p>
                    <p className="text-xs opacity-90">Semua tagihan sewa kamar Anda telah lunas.</p>
                  </div>
                </div>
              )}

              {paidInvoices.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Kuitansi Pembayaran Digital</span>
                  <div className="divide-y rounded-lg border">
                    {paidInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Lunas pada {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("id-ID") : "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(inv.totalAmount)}</span>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => alert("Mengunduh Kuitansi Digital PDF...")}>
                            <IconDownload className="size-3" /> Download Kuitansi PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: KOMUNITAS PROPERTI */}
      {activeTab === "community" && (
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconBell className="size-5 text-amber-500" />
                Pengumuman Properti (Read-Only)
              </CardTitle>
              <CardDescription>Informasi jadwal pembersihan, aturan hunian, dan info maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {data.announcements.map((a) => (
                <div key={a.id} className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground">{a.title}</span>
                    {a.isPinned && <Badge variant="outline" className="text-[9px]">PINNED</Badge>}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{a.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconMessages className="size-5 text-purple-600" />
                Forum Diskusi Penghuni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {data.forumPosts.map((fp) => (
                <div key={fp.id} className="border p-3 rounded-lg space-y-1">
                  <p className="font-bold text-foreground">{fp.title}</p>
                  <p className="text-muted-foreground">{fp.content}</p>
                  <span className="text-[10px] text-primary">Oleh: {fp.authorName} • {fp.commentCount} Balasan</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconSparkles className="size-5 text-emerald-500" />
                Kontak Staf Housekeeping Penanggung Jawab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {data.housekeepingStaff.map((hk) => (
                <div key={hk.email} className="flex items-center justify-between border p-3.5 rounded-xl">
                  <div>
                    <p className="font-bold text-foreground text-sm">{hk.fullName}</p>
                    <p className="text-muted-foreground">📱 {hk.phoneNumber}</p>
                  </div>
                  <a
                    href={`https://wa.me/${hk.phoneNumber.replace(/[^0-9]/g, "")}?text=Halo%20Staf%20Housekeeping%20${encodeURIComponent(hk.fullName)},%20saya%20penghuni%20Unit%20${unit?.unitNumber || ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-emerald-600 text-white px-3 py-1.5 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-500"
                  >
                    <IconBrandWhatsapp className="size-4" /> Direct Chat WA
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Receipt Upload Modal Simulation */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Upload Bukti Pembayaran</h3>
            <p className="text-xs text-muted-foreground">
              Invoice #{selectedInvoice.invoiceNumber} • Nominal: {formatIDR(selectedInvoice.totalAmount)}
            </p>

            {uploadSuccess ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-600 font-bold">
                ✓ Bukti transfer berhasil dikirim! Pengelola akan melakukan verifikasi.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <IconUpload className="mx-auto size-8 text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold text-foreground">Klik atau drag file struk/bukti transfer di sini</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Format: JPG, PNG, atau PDF (Maks. 5MB)</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    disabled={isUploading}
                    onClick={handleSimulatePayment}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    {isUploading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

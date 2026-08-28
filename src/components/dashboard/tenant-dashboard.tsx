"use client";

import { useState } from "react";
import {
  IconBed,
  IconBuilding,
  IconReceipt,
  IconFileText,
  IconUpload,
  IconCheck,
  IconMessages,
  IconBrandWhatsapp,
  IconDownload,
  IconSparkles,
  IconBell,
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
      {/* Hero Banner (ARVENTA Brand Dark Sage & Gold) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconBed className="mr-1 size-3.5 text-[#C8A96B]" /> PORTAL AKUN KAMAR / TENANT SPACE
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Selamat Datang, {data.user.fullName}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
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
                variant="outline"
                className="font-bold text-xs gap-1.5 rounded-xl border-[#383E36] bg-[#1E221E] text-gray-200 hover:bg-[#383E36]"
                onClick={() => alert("Mengunduh Perjanjian Sewa PDF...")}
              >
                <IconDownload className="size-4 text-[#8FA28A]" /> Unduh Kontrak PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Module Tabs Bar (ARVENTA Sage Theme) */}
      <div className="flex flex-wrap gap-2 border-b border-[#C7D3C0]/40 pb-3">
        {[
          { id: "room", label: "Info Kamar Saya", icon: IconBed },
          { id: "contract", label: "Kontrak & Dokumen", icon: IconFileText },
          { id: "invoices", label: "Tagihan & Pembayaran", icon: IconReceipt },
          { id: "community", label: "Komunitas Properti", icon: IconMessages },
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

      {/* TAB 1: INFO KAMAR SAYA */}
      {activeTab === "room" && (
        <div className="space-y-6">
          {lease ? (
            <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                    <IconBuilding className="size-5 text-[#8FA28A]" />
                    Detail Kamar & Profil Penghuni Terdaftar
                  </CardTitle>
                  <CardDescription>{property?.address}, {property?.city}</CardDescription>
                </div>
                <Badge className="bg-[#8FA28A] text-white font-bold text-xs">
                  KONTRAK AKTIF
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3 rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] bg-[#F7F4ED]/50 dark:bg-[#1E221E] p-4">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Nomor Kamar</span>
                    <p className="text-xl font-black text-[#2F332E] dark:text-white mt-0.5">Unit {unit?.unitNumber}</p>
                    <span className="text-[11px] text-gray-400">Lantai {unit?.floor}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Sewa Bulanan</span>
                    <p className="text-xl font-black text-[#8FA28A] mt-0.5">
                      {formatIDR(lease.rentPrice)}
                    </p>
                    <span className="text-[11px] text-gray-400">Periode: {lease.rentalPeriod}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Masa Sewa</span>
                    <p className="text-sm font-bold text-[#2F332E] dark:text-white mt-1">
                      {new Date(lease.startDate).toLocaleDateString("id-ID")} -
                    </p>
                    <p className="text-sm font-bold text-[#2F332E] dark:text-white">
                      {new Date(lease.endDate).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                {unit?.facilities && unit.facilities.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Fasilitas Kamar:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {unit.facilities.map((fac) => (
                        <Badge key={fac} variant="outline" className="text-xs border-[#8FA28A] text-[#8FA28A] font-bold">
                          {fac}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-[#C7D3C0]/40 p-6 text-center text-sm text-gray-500">
              Anda belum memiliki kontrak sewa aktif yang terhubung.
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: KONTRAK & DOKUMEN */}
      {activeTab === "contract" && (
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconFileText className="size-5 text-[#8FA28A]" />
                Dokumen Kontrak Perjanjian Sewa
              </CardTitle>
              <CardDescription>Unduh file surat perjanjian sewa format PDF terverifikasi.</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5 text-xs font-bold rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white" onClick={() => alert("Mengunduh Kontrak PDF...")}>
              <IconDownload className="size-4" /> Unduh Surat Perjanjian (PDF)
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 dark:text-gray-400">
            Dokumen perjanjian sewa digital Anda tersimpan dengan aman dan dapat diunduh kapan saja.
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TAGIHAN & PEMBAYARAN */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconReceipt className="size-5 text-[#8FA28A]" />
                Daftar Invoice Tagihan Bulanan & Utilitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvoice ? (
                <div className="rounded-2xl border border-[#C8A96B]/40 bg-[#C8A96B]/10 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-[#C8A96B] text-white font-bold mb-1">
                        MENUNGGU PEMBAYARAN
                      </Badge>
                      <h3 className="text-lg font-bold text-[#2F332E] dark:text-white">
                        Invoice #{pendingInvoice.invoiceNumber}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Jatuh Tempo: {new Date(pendingInvoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Total Tagihan</span>
                      <p className="text-2xl font-black text-[#C8A96B]">
                        {formatIDR(pendingInvoice.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#C8A96B]/30 pt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      Sewa: {formatIDR(pendingInvoice.amount)} • Air/Listrik: {formatIDR(pendingInvoice.utilityAmount)}
                    </span>
                    <Button
                      onClick={() => setSelectedInvoice(pendingInvoice)}
                      className="bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold text-xs shadow-sm gap-1.5 rounded-xl"
                    >
                      <IconUpload className="size-4" /> Upload Bukti Bayar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#8FA28A]/40 bg-[#8FA28A]/10 p-4 flex items-center gap-3 text-[#8FA28A]">
                  <IconCheck className="size-6 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Tidak ada tagihan tertunggak!</p>
                    <p className="text-xs opacity-90">Semua tagihan sewa kamar Anda telah lunas.</p>
                  </div>
                </div>
              )}

              {paidInvoices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#C7D3C0]/30 dark:border-[#383E36] space-y-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Kuitansi Pembayaran Digital</span>
                  <div className="divide-y divide-[#C7D3C0]/30 dark:divide-[#383E36] rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36]">
                    {paidInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3.5 text-xs">
                        <div>
                          <p className="font-bold text-[#2F332E] dark:text-white">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-gray-400">
                            Lunas pada {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("id-ID") : "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#8FA28A]">{formatIDR(inv.totalAmount)}</span>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-xl border-[#383E36]" onClick={() => alert("Mengunduh Kuitansi Digital PDF...")}>
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
          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconBell className="size-5 text-[#C8A96B]" />
                Pengumuman Properti (Read-Only)
              </CardTitle>
              <CardDescription>Informasi jadwal pembersihan, aturan hunian, dan info maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {data.announcements.map((a) => (
                <div key={a.id} className="rounded-xl border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#2F332E] dark:text-white">{a.title}</span>
                    {a.isPinned && <Badge variant="outline" className="text-[9px] border-[#C8A96B] text-[#C8A96B] font-bold">PINNED</Badge>}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconMessages className="size-5 text-[#8FA28A]" />
                Forum Diskusi Penghuni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {data.forumPosts.map((fp) => (
                <div key={fp.id} className="border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 rounded-xl space-y-1">
                  <p className="font-bold text-[#2F332E] dark:text-white">{fp.title}</p>
                  <p className="text-gray-600 dark:text-gray-400">{fp.content}</p>
                  <span className="text-[10px] text-[#8FA28A] font-bold">Oleh: {fp.authorName} • {fp.commentCount} Balasan</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2F332E] dark:text-white">
                <IconSparkles className="size-5 text-[#8FA28A]" />
                Kontak Staf Housekeeping Penanggung Jawab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {data.housekeepingStaff.map((hk) => (
                <div key={hk.email} className="flex items-center justify-between border border-[#C7D3C0]/40 dark:border-[#383E36] p-4 rounded-2xl">
                  <div>
                    <p className="font-bold text-[#2F332E] dark:text-white text-sm">{hk.fullName}</p>
                    <p className="text-gray-500 dark:text-gray-400">📱 {hk.phoneNumber}</p>
                  </div>
                  <a
                    href={`https://wa.me/${hk.phoneNumber.replace(/[^0-9]/g, "")}?text=Halo%20Staf%20Housekeeping%20${encodeURIComponent(hk.fullName)},%20saya%20penghuni%20Unit%20${unit?.unitNumber || ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#8FA28A] text-white px-3.5 py-2 font-bold text-xs flex items-center gap-1.5 hover:bg-[#8FA28A]/90 shadow-sm"
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
          <div className="w-full max-w-md rounded-3xl bg-[#242823] border border-[#383E36] text-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Upload Bukti Pembayaran</h3>
            <p className="text-xs text-gray-400">
              Invoice #{selectedInvoice.invoiceNumber} • Nominal: {formatIDR(selectedInvoice.totalAmount)}
            </p>

            {uploadSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs text-emerald-400 font-bold">
                ✓ Bukti transfer berhasil dikirim! Pengelola akan melakukan verifikasi.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#383E36] rounded-2xl p-6 text-center cursor-pointer hover:bg-[#1E221E] transition-colors">
                  <IconUpload className="mx-auto size-8 text-[#8FA28A] mb-2" />
                  <p className="text-xs font-bold text-white">Klik atau drag file struk/bukti transfer di sini</p>
                  <p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG, atau PDF (Maks. 5MB)</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="rounded-xl border-[#383E36] text-gray-300" onClick={() => setSelectedInvoice(null)}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    disabled={isUploading}
                    onClick={handleSimulatePayment}
                    className="bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold rounded-xl"
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

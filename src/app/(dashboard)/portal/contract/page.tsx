'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  Clock,
  FileCheck,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import ContractPreviewModal from '../../tenant-contract/_components/ContractPreviewModal';
import { ContractItem } from '../../tenant-contract/_types';

export interface DynamicArticle {
  id: string;
  pasalNumber: number;
  title: string;
  items: string[];
  summary: string;
}

interface TenantContractDetails {
  contractNumber: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'DRAFT';
  tenantName: string;
  tenantNik: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  unitName: string;
  monthlyPrice: number;
  depositPrice: number;
  allowedPeriod: string;
  contractItem: ContractItem;
  articles: DynamicArticle[];
}

const buildDynamicArticles = (
  contract: ContractItem,
  templateArticles: { title: string; items: string[] }[] = []
): DynamicArticle[] => {
  const articles: DynamicArticle[] = [];

  // Pasal 1: Objek Sewa & Jangka Waktu
  const p1Items: string[] = [
    `Objek Sewa Unit/Kamar (${contract.unitName || 'Unit Kamar'}) pada ${contract.propertyName}.`,
    `Masa Sewa: Berlaku mulai dari ${contract.startDate} s/d ${contract.endDate} (Skema: Bulanan).`,
    `Harga Sewa Pokok: Rp ${(contract.rentPrice || 4500000).toLocaleString('id-ID')} / bulan.`,
  ];
  if ((contract.securityDeposit || 0) > 0) {
    p1Items.push(`Uang Jaminan (Deposit): Rp ${contract.securityDeposit.toLocaleString('id-ID')} (Lunas).`);
  } else {
    p1Items.push(`Ketentuan Jaminan (Deposit) & Bebas Tunggakan.`);
  }

  articles.push({
    id: 'pasal-1',
    pasalNumber: 1,
    title: 'PASAL 1: OBJEK SEWA & JANGKA WAKTU',
    items: p1Items,
    summary: 'Mengatur tentang penyerahan unit kamar yang disewa, penetapan jangka waktu berlaku sewa, skema penentuan harga sewa bulanan, dan ketentuan deposit.',
  });

  // Pasal 2: Hak & Kewajiban Pihak Kedua (Penyewa)
  articles.push({
    id: 'pasal-2',
    pasalNumber: 2,
    title: 'PASAL 2: HAK & KEWAJIBAN PIHAK KEDUA (PENYEWA)',
    items: [
      'Penyewa berhak menggunakan unit dan fasilitas yang disediakan dengan baik.',
      'Penyewa wajib membayar harga sewa sebelum atau pada tanggal jatuh tempo.',
      'Penyewa dilarang memindahtangankan objek sewa kepada pihak ketiga tanpa izin tertulis.',
      'Penyewa dilarang melakukan kegiatan yang melanggar hukum di lokasi properti.',
    ],
    summary: 'Mengatur hak penggunaan fasilitas unit, kewajiban pelunasan sewa sebelum jatuh tempo, serta larangan pemindahtanganan unit dan kegiatan melanggar hukum.',
  });

  // Pasal 3+: Template Articles or Default Rules
  let extraArticles: { title: string; items: string[] }[] = [];
  if (templateArticles && templateArticles.length > 0) {
    extraArticles = templateArticles;
  } else {
    extraArticles = [
      {
        title: 'PASAL 3: TATA TERTIB & KETENTUAN PROPERTI',
        items: [
          'Penyewa wajib menjaga kebersihan, kerapihan, dan ketenangan lingkungan properti.',
          'Penyewa dilarang merusak bangunan, fasilitas, maupun melakukan perubahan fisik pada unit.',
          'Jam tenang lingkungan berlaku mulai pukul 22.00 WIB setiap hari.',
        ],
      },
      {
        title: 'PASAL 4: FASILITAS & BIAYA DEPOSIT',
        items: [
          'Fasilitas pendukung digunakan secara bijak dan bertanggung jawab.',
          'Uang jaminan (deposit) dikembalikan penuh saat masa sewa berakhir jika unit dalam keadaan baik dan bebas tunggakan.',
        ],
      },
    ];
  }

  extraArticles.forEach((art, idx) => {
    const pasalNum = idx + 3;
    const cleanTitle = art.title.replace(/^PASAL\s+\d+:\s*/i, '');
    articles.push({
      id: `pasal-${pasalNum}`,
      pasalNumber: pasalNum,
      title: `PASAL ${pasalNum}: ${cleanTitle.toUpperCase()}`,
      items: art.items,
      summary: art.items.join(' ') || 'Ketentuan khusus mengenai tata tertib dan fasilitas properti.',
    });
  });

  // Custom Clauses Addendum (if present on contract)
  if (contract.customClauses && contract.customClauses.length > 0) {
    const addendumPasalNum = articles.length + 1;
    articles.push({
      id: `pasal-addendum`,
      pasalNumber: addendumPasalNum,
      title: `PASAL ${addendumPasalNum}: KLAUSUL KHUSUS & ADDENDUM PENYEWA`,
      items: contract.customClauses,
      summary: 'Ketentuan tambahan dan kesepakatan khusus antara penyewa dan pemilik properti.',
    });
  }

  return articles;
};

export default function TenantContractPortalPage() {
  const [loading, setLoading] = useState(true);
  const [contractDetails, setContractDetails] = useState<TenantContractDetails | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchContractData = async () => {
    try {
      const userEmail = (typeof window !== 'undefined' && localStorage.getItem('arventa_user_email')) || 'apt12b01@arventa.id';
      const res = await fetch(`/api/portal/my-room?email=${encodeURIComponent(userEmail)}`);
      
      if (res.ok) {
        const json = await res.json();
        const apiData = json.data;

        if (apiData && apiData.unit && apiData.property) {
          const unit = apiData.unit;
          const property = apiData.property;
          const tenantName = apiData.tenantName || 'Siti Rahmawati';
          const tenantPhone = apiData.tenantPhone || '081444444444';
          const tenantEmail = userEmail;
          const checkInDate = apiData.checkInDate || '2026-08-23';

          // Format dates
          const startDateObj = new Date(checkInDate);
          const endDateObj = new Date(startDateObj);
          endDateObj.setFullYear(endDateObj.getFullYear() + 1);

          const contractNumber = apiData.contractNumber || 'KTR/ARV/01F378';
          const startDateFormatted = apiData.startDate || startDateObj.toISOString().split('T')[0];
          const endDateFormatted = apiData.endDate || endDateObj.toISOString().split('T')[0];

          const contractItem: ContractItem = {
            id: apiData.contractId || `contract-${unit.id || '01'}`,
            contractNumber,
            scope: 'UNIT',
            status: 'ACTIVE',
            tenantId: 'tenant-01',
            tenantName,
            tenantPhone,
            tenantEmail,
            tenantNik: '3201015509980001',
            propertyId: property.id,
            propertyName: property.name,
            propertyAddress: property.address || 'Jl. Gunung Batu No. 203, Pasteur, Bandung',
            ownerName: property.ownerName || 'Bpk. Hendra Pratama',
            ownerPhone: property.ownerPhone || '081234567890',
            ownerEmail: property.ownerEmail || 'owner@arventa.id',
            unitId: unit.id,
            unitName: unit.unitNumber || unit.name || 'Apt 12B-01',
            rentalPeriod: 'MONTHLY',
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            rentPrice: unit.pricing?.monthly || 4500000,
            securityDeposit: unit.pricing?.deposit || 0,
            createdAt: `${startDateFormatted}T09:00:00.000Z`,
          };

          // Fetch property template rules dynamically from DB
          let propertyArticles: { title: string; items: string[] }[] = [];
          try {
            const templateRes = await fetch(`/api/properties/${property.id}/contract-template`);
            if (templateRes.ok) {
              const tJson = await templateRes.json();
              if (tJson.data?.rules) {
                try {
                  const parsed = JSON.parse(tJson.data.rules);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    propertyArticles = parsed;
                  }
                } catch {
                  // ignore
                }
              }
            }
          } catch (e) {
            console.warn('Notice: loading contract template fallback in portal');
          }

          const articles = buildDynamicArticles(contractItem, propertyArticles);

          setContractDetails({
            contractNumber,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            status: 'ACTIVE',
            tenantName,
            tenantNik: '3201015509980001',
            tenantEmail,
            tenantPhone,
            propertyName: property.name,
            propertyAddress: property.address || 'Jl. Gunung Batu No. 203, Pasteur, Bandung',
            unitName: unit.unitNumber || unit.name || 'Apt 12B-01',
            monthlyPrice: unit.pricing?.monthly || 4500000,
            depositPrice: unit.pricing?.deposit || 0,
            allowedPeriod: unit.specs?.allowedPeriod || 'MONTHLY',
            contractItem,
            articles,
          });

          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching tenant contract data:', err);
    }

    // Fallback Mock data matching Siti Rahmawati & Apt 12B-01
    const fallbackItem: ContractItem = {
      id: 'contract-fallback',
      contractNumber: 'KTR/ARV/01F378',
      scope: 'UNIT',
      status: 'ACTIVE',
      tenantId: 'tenant-01',
      tenantName: 'Siti Rahmawati',
      tenantPhone: '081444444444',
      tenantEmail: 'apt12b01@arventa.id',
      tenantNik: '3201015509980001',
      propertyId: 'prop-12b',
      propertyName: 'Apartemen Gateway Pasteur Unit 12B',
      propertyAddress: 'Jl. Gunung Batu No. 203, Pasteur, Bandung',
      ownerName: 'Bpk. Hendra Pratama',
      ownerPhone: '081234567890',
      ownerEmail: 'owner@arventa.id',
      unitId: 'unit-12b01',
      unitName: 'Apt 12B-01',
      rentalPeriod: 'MONTHLY',
      startDate: '2026-08-23',
      endDate: '2027-08-23',
      rentPrice: 4500000,
      securityDeposit: 0,
      createdAt: '2026-08-23T09:00:00.000Z',
    };

    const fallbackArticles = buildDynamicArticles(fallbackItem);

    setContractDetails({
      contractNumber: 'KTR/ARV/01F378',
      startDate: '2026-08-23',
      endDate: '2027-08-23',
      status: 'ACTIVE',
      tenantName: 'Siti Rahmawati',
      tenantNik: '3201015509980001',
      tenantEmail: 'apt12b01@arventa.id',
      tenantPhone: '081444444444',
      propertyName: 'Apartemen Gateway Pasteur Unit 12B',
      propertyAddress: 'Jl. Gunung Batu No. 203, Pasteur, Bandung',
      unitName: 'Apt 12B-01',
      monthlyPrice: 4500000,
      depositPrice: 0,
      allowedPeriod: 'MONTHLY',
      contractItem: fallbackItem,
      articles: fallbackArticles,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchContractData();
  }, []);

  const handleCopyContractNumber = () => {
    if (contractDetails?.contractNumber) {
      navigator.clipboard.writeText(contractDetails.contractNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const calculateDaysRemaining = (endStr: string) => {
    const end = new Date(endStr);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 bg-[#F7F4ED] rounded-2xl p-8 border border-[#C7D3C0]/40">
        <Loader2 className="h-8 w-8 animate-spin text-[#8FA28A]" />
        <p className="text-xs font-bold text-gray-600">Memuat Dokumen Kontrak Sewa Digital Anda...</p>
      </div>
    );
  }

  if (!contractDetails) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center rounded-2xl border border-[#C7D3C0]/40 bg-[#F7F4ED] p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-500 animate-bounce" />
        <h2 className="text-lg font-bold text-gray-800">Kontrak Sewa Belum Ditemukan</h2>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Sistem belum menemukan dokumen perjanjian sewa aktif untuk akun Anda. Silakan hubungi pengelola properti.
        </p>
      </div>
    );
  }

  const daysLeft = calculateDaysRemaining(contractDetails.endDate);

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40 text-[#2F332E]">
      
      {/* 1. Header Banner & Status Badge */}
      <div className="relative overflow-hidden rounded-2xl bg-[#242823] p-6 sm:p-8 text-white shadow-lg border border-[#383E36]">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-56 w-56 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#8FA28A]/20 border border-[#8FA28A]/40 px-3 py-1 text-[11px] font-black text-[#8FA28A] tracking-wider uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C8A96B]" /> Dokumen Sewa Digital Resmi
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Kontrak Aktif
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Surat Perjanjian Sewa Digital
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed font-medium">
              Pantau masa berlaku sewa, klausul kesepakatan, serta cetak atau unduh berkas resmi perjanjian sewa kamar dalam format PDF.
            </p>
          </div>

          {/* Quick Action Button to Open PDF Preview Modal */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-black transition-all shadow-sm flex items-center gap-2"
            >
              <FileCheck className="h-4 w-4" />
              <span>Lihat & Cetak Surat Kontrak (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Contract Information Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Card 1: Nomor Kontrak & Identitas Penyewa */}
        <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#8FA28A]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Identitas Penyewa</h3>
            </div>
            <span className="text-[10px] font-bold text-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-full">
              Pihak II (Penyewa)
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Nomor Kontrak Digital</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-gray-800">{contractDetails.contractNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyContractNumber}
                  className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                  title="Salin Nomor Kontrak"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">Nama Lengkap</span>
                <strong className="text-gray-900 font-extrabold">{contractDetails.tenantName}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">NIK KTP</span>
                <strong className="text-gray-800 font-mono">{contractDetails.tenantNik}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">No. WhatsApp</span>
                <strong className="text-gray-800">{contractDetails.tenantPhone}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Email Akun</span>
                <strong className="text-gray-800">{contractDetails.tenantEmail}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Objek Sewa & Lokasi Unit */}
        <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#8FA28A]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Objek & Unit Sewa</h3>
            </div>
            <span className="text-[10px] font-bold text-[#C8A96B] bg-[#C8A96B]/10 px-2 py-0.5 rounded-full">
              Pihak I (Pengelola)
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#8FA28A]/5 border border-[#8FA28A]/20 space-y-1">
              <span className="text-[10px] font-extrabold text-[#8FA28A] uppercase tracking-wider block">Unit Kamar Sewa</span>
              <h4 className="text-lg font-black text-gray-900">{contractDetails.unitName}</h4>
              <p className="text-xs text-gray-600 font-medium">{contractDetails.propertyName}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium shrink-0">Alamat Properti</span>
                <span className="text-gray-800 text-right font-medium leading-tight max-w-[180px]">{contractDetails.propertyAddress}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">Tarif Sewa Pokok</span>
                <strong className="text-gray-900 font-extrabold">{formatIDR(contractDetails.monthlyPrice)} / bln</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Uang Jaminan / Deposit</span>
                <strong className="text-emerald-600 font-bold">{formatIDR(contractDetails.depositPrice)} (Lunas)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Detail Masa Sewa & Tanggal Berlaku */}
        <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#8FA28A]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Detail Masa Sewa</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sisa {daysLeft} Hari
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Masuk</span>
                <strong className="text-gray-900 block font-bold">{contractDetails.startDate}</strong>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Berakhir</span>
                <strong className="text-gray-900 block font-bold">{contractDetails.endDate}</strong>
              </div>
            </div>

            {/* Progress Bar for Lease Duration */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 font-semibold">Progres Masa Berlaku Kontrak</span>
                <span className="font-extrabold text-[#8FA28A]">Aktif (12 Bulan)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#8FA28A] rounded-full w-[95%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Pemberitahuan perpanjangan sewa otomatis akan dikirimkan 30 hari sebelum tanggal kontrak berakhir ({contractDetails.endDate}).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section: Riwayat Kontrak & Log Addendum (Contract History) */}
      <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">Riwayat Kontrak & Addendum</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">3 Aktivitas Teratat</span>
        </div>

        <div className="space-y-4 text-xs">
          {/* Item 1 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">Penandatanganan & Pengaktifan Kontrak Sewa Digital</h4>
                <span className="text-[10px] text-gray-400 font-medium">23 Agustus 2026, 10:00 WIB</span>
              </div>
              <p className="text-gray-600 text-[11px]">
                Surat perjanjian sewa digital nomor <strong className="font-mono text-gray-800">{contractDetails.contractNumber}</strong> telah disetujui secara digital oleh Penyewa ({contractDetails.tenantName}) dan Pengelola.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">Verifikasi Dokumen KTP & Data Penyewa</h4>
                <span className="text-[10px] text-gray-400 font-medium">23 Agustus 2026, 09:45 WIB</span>
              </div>
              <p className="text-gray-600 text-[11px]">
                Dokumen identitas (NIK: {contractDetails.tenantNik}) dan kontak darurat telah diverifikasi dan dinyatakan valid.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">Penempatan & Serah Terima Akses Unit {contractDetails.unitName}</h4>
                <span className="text-[10px] text-gray-400 font-medium">23 Agustus 2026, 09:30 WIB</span>
              </div>
              <p className="text-gray-600 text-[11px]">
                Kredensial login kamar dan password akses unit otomatis di-generate dan diserahkan kepada penyewa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section: Ketentuan & Pasal Kesepakatan Utama */}
      <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-[#8FA28A]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">
                Ketentuan & Struktur Pasal Kesepakatan
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Surat perjanjian sewa digital Anda terdiri dari <strong className="text-gray-900 font-bold">{contractDetails.articles.length} Pasal Utama</strong> dengan total <strong className="text-emerald-700 font-bold">{contractDetails.articles.reduce((acc, a) => acc + a.items.length, 0)} Ayat Kesepakatan</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-700 flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> {contractDetails.articles.length} Pasal ({contractDetails.articles.reduce((acc, a) => acc + a.items.length, 0)} Ayat)
            </span>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="text-xs font-extrabold text-[#8FA28A] hover:underline flex items-center gap-1 pl-2"
            >
              <span>Pratinjau PDF Lengkap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Articles Grid */}
        <div className="grid gap-4 md:grid-cols-2 text-xs">
          {contractDetails.articles.map((art) => (
            <div key={art.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#8FA28A] text-xs uppercase tracking-wide">PASAL {art.pasalNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-extrabold border border-emerald-500/20">
                    {art.items.length} Ayat Kesepakatan
                  </span>
                </div>
                <h4 className="font-black text-sm text-gray-900">{art.title.replace(/^PASAL\s+\d+:\s*/i, '')}</h4>
                <p className="text-gray-600 text-[11px] leading-relaxed font-medium">
                  {art.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200/60 space-y-1 text-[11px] text-gray-700">
                <span className="font-bold text-gray-800 block mb-1">Rincian Ayat ({art.items.length} Ayat):</span>
                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                  {art.items.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <strong>Ayat {idx + 1}:</strong> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Preview & PDF Download Modal */}
      {contractDetails && (
        <ContractPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          contract={contractDetails.contractItem}
        />
      )}
    </div>
  );
}

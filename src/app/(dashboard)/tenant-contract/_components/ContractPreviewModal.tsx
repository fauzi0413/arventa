'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, Share2, CheckCircle2, ShieldCheck, Building2, UserCheck } from 'lucide-react';
import { ContractItem } from '../_types';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractItem | null;
}

export default function ContractPreviewModal({
  isOpen,
  onClose,
  contract,
}: ContractPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [propertyArticles, setPropertyArticles] = React.useState<{ id: string; title: string; items: string[] }[]>([]);

  React.useEffect(() => {
    if (!contract?.propertyId || !isOpen) {
      setPropertyArticles([]);
      return;
    }

    let isMounted = true;
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/properties/${contract.propertyId}/contract-template`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            if (json.data.rules) {
              try {
                const parsedArticles = JSON.parse(json.data.rules);
                if (Array.isArray(parsedArticles) && parsedArticles.length > 0) {
                  setPropertyArticles(parsedArticles);
                  return;
                }
              } catch {
                // Ignore if not JSON
              }
            }

            if (Array.isArray(json.data.customClauses) && json.data.customClauses.length > 0) {
              setPropertyArticles([
                {
                  id: 'art-prop-default',
                  title: 'PASAL 3: KETENTUAN TATA TERTIB PROPERTI',
                  items: json.data.customClauses,
                },
              ]);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Notice: loading property contract template fallback in preview modal');
      }

      if (isMounted) {
        setPropertyArticles([
          {
            id: 'art-default-1',
            title: 'PASAL 3: TATA TERTIB & KETENTUAN PROPERTI',
            items: [
              'Penyewa wajib menjaga kebersihan, kerapihan, dan ketenangan lingkungan properti.',
              'Penyewa dilarang merusak bangunan, fasilitas, maupun melakukan perubahan fisik pada unit.',
              'Jam tenang lingkungan berlaku mulai pukul 22.00 WIB setiap hari.',
            ],
          },
          {
            id: 'art-default-2',
            title: 'PASAL 4: FASILITAS & BIAYA DEPOSIT',
            items: [
              'Fasilitas pendukung digunakan secara bijak dan bertanggung jawab.',
              'Uang jaminan (deposit) dikembalikan penuh saat masa sewa berakhir jika unit dalam keadaan baik dan bebas tunggakan.',
            ],
          },
        ]);
      }
    };

    fetchTemplate();

    return () => {
      isMounted = false;
    };
  }, [contract?.propertyId, isOpen]);

  if (!isOpen || !contract) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodLabelMap: Record<string, string> = {
    DAILY: 'Hari',
    MONTHLY: 'Bulan',
    YEARLY: 'Tahun',
    HOURLY: 'Jam',
  };

  const formatDate = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const getCleanOwnerName = (name?: string) => {
    if (!name) return 'Budi Santoso';
    return name.replace(/\s*\([^)]*\)/g, '').trim() || name;
  };

  // Dynamically parse articles combining property template baseline and custom addendum
  const getParsedArticles = (): { id: string; title: string; items: string[] }[] => {
    if (contract?.notes) {
      try {
        const parsed = JSON.parse(contract.notes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any, idx: number) => ({
            id: a.id || `art-${idx}`,
            title: a.title || `PASAL ${idx + 3}: KETENTUAN KHUSUS`,
            items: Array.isArray(a.items) ? a.items : [],
          }));
        }
      } catch {
        // Not JSON string
      }
    }

    let result: { id: string; title: string; items: string[] }[] = [];

    // 1. Base Property Template Articles
    if (propertyArticles.length > 0) {
      result = [...propertyArticles];
    } else {
      result = [
        {
          id: 'art-default-1',
          title: 'PASAL 3: TATA TERTIB & KETENTUAN PROPERTI',
          items: [
            'Penyewa wajib menjaga kebersihan, kerapihan, dan ketenangan lingkungan properti.',
            'Penyewa dilarang merusak bangunan, fasilitas, maupun melakukan perubahan fisik pada unit.',
            'Jam tenang lingkungan berlaku mulai pukul 22.00 WIB setiap hari.',
          ],
        },
        {
          id: 'art-default-2',
          title: 'PASAL 4: FASILITAS & BIAYA DEPOSIT',
          items: [
            'Fasilitas pendukung digunakan secara bijak dan bertanggung jawab.',
            'Uang jaminan (deposit) dikembalikan penuh saat masa sewa berakhir jika unit dalam keadaan baik dan bebas tunggakan.',
          ],
        },
      ];
    }

    // 2. Custom Tenant Addendum Clauses (if present)
    if (contract?.customClauses && contract.customClauses.length > 0) {
      const nextPasalNum = result.length + 3;
      result.push({
        id: 'art-tenant-addendum',
        title: `PASAL ${nextPasalNum}: KLAUSUL KHUSUS & ADDENDUM PENYEWA`,
        items: contract.customClauses,
      });
    }

    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (Non-printable) */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Pratinjau Dokumen Kontrak Digital
              </h3>
              <p className="text-xs text-muted-foreground">
                No. Kontrak: <span className="font-mono font-semibold text-foreground">{contract.contractNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document View */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible print:bg-white print:text-black">
          <div ref={printRef} className="max-w-3xl mx-auto space-y-6 text-sm leading-relaxed">
            {/* Header Kop Surat */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                  A
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-wider uppercase text-slate-900">ARVENTA</h1>
                  <p className="text-xs font-semibold tracking-widest uppercase text-slate-600">
                    Property Management Systems
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Surat Perjanjian Digital</div>
                <div className="text-xs font-mono font-bold text-slate-900">{contract.contractNumber}</div>
                <div className="text-[11px] text-slate-500">Tanggal: {formatDate(contract.createdAt)}</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-lg font-extrabold uppercase underline tracking-wide">
                SURAT PERJANJIAN SEWA MENYEMA
              </h2>
              <p className="text-xs font-medium text-slate-600">
                {contract.scope === 'PROPERTY' ? 'Perjanjian Sewa Properti Utuh' : 'Perjanjian Sewa Unit Kamar'}
              </p>
            </div>

            {/* Mukadimah */}
            <p className="text-xs text-justify">
              Pada hari ini, disepakati perjanjian sewa-menyewa antara pihak-pihak di bawah ini yang bertindak sah secara hukum:
            </p>

            {/* Identitas Pihak I & Pihak II */}
            <div className="space-y-4 text-xs">
              {/* Pihak I */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-700" />
                  PIHAK PERTAMA (Pemilik Properti / Pengelola):
                </div>
                <div className="grid grid-cols-3 gap-y-1 pl-5">
                  <span className="text-slate-500">Nama Pemilik (Owner)</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {getCleanOwnerName(contract.ownerName)}</span>
                  <span className="text-slate-500">No. Telepon / WA</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.ownerPhone}</span>
                  <span className="text-slate-500">Email Pemilik</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.ownerEmail}</span>
                  <span className="text-slate-500">Nama Properti</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.propertyName}</span>
                  <span className="text-slate-500">Alamat Properti</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.propertyAddress}</span>
                </div>
              </div>

              {/* Pihak II */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                  PIHAK KEDUA (Penyewa / Tenant):
                </div>
                <div className="grid grid-cols-3 gap-y-1 pl-5">
                  <span className="text-slate-500">Nama Lengkap</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.tenantName}</span>
                  <span className="text-slate-500">No. Telepon / WA</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.tenantPhone}</span>
                  <span className="text-slate-500">Email</span>
                  <span className="col-span-2 font-semibold text-slate-900">: {contract.tenantEmail}</span>
                  {contract.tenantNik && (
                    <>
                      <span className="text-slate-500">NIK / No. KTP</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {contract.tenantNik}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rincian Objek & Ketentuan Sewa */}
            <div className="space-y-3 pt-2 text-xs">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                PASAL 1: OBJEK SEWA & JANGKA WAKTU
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                <li>
                  <strong>Objek Sewa:</strong> PIHAK PERTAMA menyewakan objek kepada PIHAK KEDUA berupa{' '}
                  <strong className="text-slate-900">
                    {contract.scope === 'UNIT' ? `Unit / Kamar (${contract.unitName})` : 'Gedung / Properti Utuh'}
                  </strong>{' '}
                  pada <strong className="text-slate-900">{contract.propertyName}</strong>.
                </li>
                <li>
                  <strong>Masa Sewa:</strong> Berlaku mulai dari tanggal{' '}
                  <strong>{formatDate(contract.startDate)}</strong> sampai dengan tanggal{' '}
                  <strong>{formatDate(contract.endDate)}</strong> (Skema Pembayaran:{' '}
                  {contract.rentalPeriod === 'MONTHLY' ? 'Bulanan' : contract.rentalPeriod === 'DAILY' ? 'Harian' : 'Tahunan'}) dan akan bertambah apabila <span className='font-bold'>PIHAK KEDUA</span> (Penyewa) memperpanjang masa sewa.
                </li>
                <li>
                  <strong>Harga Sewa:</strong> Disepakati harga sewa sebesar{' '}
                  <strong className="text-slate-900">
                    Rp {contract.rentPrice?.toLocaleString('id-ID')} / {periodLabelMap[contract.rentalPeriod] || 'Periode'}
                  </strong>.
                </li>
                {contract.securityDeposit > 0 && (
                  <li>
                    <strong>Uang Jaminan (Deposit):</strong> PIHAK KEDUA membayarkan uang deposit jaminan sebesar{' '}
                    <strong className="text-slate-900">Rp {contract.securityDeposit?.toLocaleString('id-ID')}</strong> yang akan dikembalikan setelah masa sewa berakhir jika tidak ada tunggakan atau kerusakan fasilitas.
                  </li>
                )}
              </ol>

              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 pt-2">
                PASAL 2: HAK DAN KEWAJIBAN PIHAK KEDUA (PENYEWA)
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                <li>Penyewa berhak menggunakan unit dan fasilitas yang disediakan dengan baik.</li>
                <li>Penyewa wajib membayar harga sewa sebelum atau pada tanggal jatuh tempo.</li>
                <li>Penyewa dilarang memindahtangankan objek sewa kepada pihak ketiga tanpa izin tertulis dari Pemilik.</li>
                <li>Penyewa dilarang melakukan kegiatan yang melanggar hukum di lokasi properti.</li>
              </ol>

              {/* Dynamic Articles from Property Contract Template */}
              {getParsedArticles().map((art) => (
                <div key={art.id} className="space-y-2 pt-2">
                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                    {art.title}
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                    {art.items.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {/* Penutup */}
            <p className="text-xs text-justify pt-2">
              Demikian surat perjanjian sewa ini dibuat secara sah dan digital melalui platform ARVENTA Property Management untuk dipergunakan sebagaimana mestinya.
            </p>

            {/* Area Tanda Tangan */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-12">
                <p className="font-semibold text-slate-700">PIHAK PERTAMA (Pemilik Properti)</p>
                <div className="py-2 inline-block px-4 border border-emerald-300 bg-emerald-50 rounded-lg text-emerald-800 text-[10px] font-bold">
                  ✓ VERIFIED DIGITAL SIGNATURE
                </div>
                <div>
                  <p className="font-bold text-slate-900">{getCleanOwnerName(contract.ownerName)}</p>
                  <p className="text-[10px] text-slate-500">Pemilik Properti {contract.propertyName}</p>
                </div>
              </div>

              <div className="space-y-12">
                <p className="font-semibold text-slate-700">PIHAK KEDUA (Penyewa)</p>
                <div className="py-2 inline-block px-4 border border-slate-300 bg-slate-50 rounded-lg text-slate-800 text-[10px] font-bold">
                  ✓ SETUJU & MENERIMA SYARAT
                </div>
                <div>
                  <p className="font-bold text-slate-900">{contract.tenantName}</p>
                  <p className="text-[10px] text-slate-500">Penyewa Utama</p>
                </div>
              </div>
            </div>

            {/* Footer Verification Stamp */}
            <div className="pt-6 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200">
              Dokumen ini diterbitkan secara resmi oleh sistem ARVENTA Property Management. Hash ID: {contract.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

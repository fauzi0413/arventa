'use client';

import React from 'react';
import { X, User, Phone, Mail, FileText, Briefcase, HeartHandshake, Building, Calendar, CheckCircle2, Clock, AlertCircle, ArrowRightLeft, UserX, UserCheck } from 'lucide-react';
import { formatIndonesianDateTime, formatIndonesianDate } from '@/lib/utils';
import { Tenant, HistoryEventType } from '../_types';

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onEdit?: (tenant: Tenant) => void;
  onOpenTransfer?: (tenant: Tenant) => void;
  onViewContract?: (tenant: Tenant) => void;
}

export default function TenantDetailModal({
  isOpen,
  onClose,
  tenant,
  onEdit,
  onOpenTransfer,
  onViewContract,
}: TenantDetailModalProps) {
  if (!isOpen || !tenant) return null;

  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'AKTIF':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Penyewa Aktif
          </span>
        );
      case 'CALON':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Calon Penyewa
          </span>
        );
      case 'NONAKTIF':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 border border-gray-200">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Nonaktif / Alumni
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const displayHistory = React.useMemo(() => {
    if (!tenant?.history || tenant.history.length === 0) return [];
    const seen = new Set<string>();
    return tenant.history.filter((item) => {
      const key = `${item.type}_${item.title}_${item.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tenant]);

  const getHistoryBadge = (type: HistoryEventType | string) => {
    switch (type) {
      case 'INITIAL_PLACEMENT':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Penempatan Unit
          </span>
        );
      case 'TRANSFER_UNIT':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Pindah Unit
          </span>
        );
      case 'PREVIOUS_UNIT_RELEASED':
        return (
          <span className="bg-orange-50 text-orange-700 border border-orange-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Kamar Lama Ditinggalkan
          </span>
        );
      case 'DEACTIVATED':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Status Nonaktif
          </span>
        );
      case 'STATUS_CHANGE':
      default:
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            Ubah Status
          </span>
        );
    }
  };

  const getHistoryIcon = (type: HistoryEventType | string) => {
    switch (type) {
      case 'INITIAL_PLACEMENT':
        return <Building className="h-3.5 w-3.5 text-blue-600 shrink-0" />;
      case 'TRANSFER_UNIT':
        return <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
      case 'PREVIOUS_UNIT_RELEASED':
        return <Building className="h-3.5 w-3.5 text-orange-600 shrink-0" />;
      case 'DEACTIVATED':
        return <UserX className="h-3.5 w-3.5 text-rose-600 shrink-0" />;
      case 'STATUS_CHANGE':
      default:
        return <UserCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl border border-border flex flex-col max-h-[90vh]">
        {/* Banner / Header */}
        <div className="bg-muted/40 border-b border-border px-6 py-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8FA28A] text-white font-black text-xl shadow-md border-2 border-card">
              {getInitials(tenant.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">{tenant.fullName}</h2>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{tenant.occupation || 'Profesi Belum Diisi'}</p>
              <div className="mt-2">{getStatusBadge(tenant.status)}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Section 1: Kontak & Identitas Utama */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Identitas &amp; Kontak Utama
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block font-medium">NIK (KTP)</span>
                <span className="font-bold text-foreground tracking-wide">{tenant.nik || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">No. Telepon / WhatsApp</span>
                <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-[#8FA28A]" />
                  {tenant.phoneNumber}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Email</span>
                <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-[#8FA28A]" />
                  {tenant.email || '-'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Tanggal Terdaftar</span>
                <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-[#8FA28A]" />
                  {new Date(tenant.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan / Status Unit */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Penempatan &amp; Kontrak Unit
              </h3>
              <div className="flex items-center gap-2">
                {onViewContract && tenant.status === 'AKTIF' && tenant.currentUnitName && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewContract(tenant);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-slate-900 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <FileText className="h-3 w-3" /> Lihat Kontrak
                  </button>
                )}

                {onOpenTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTransfer(tenant);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-[#8FA28A] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#7D9178] transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="h-3 w-3" /> Pindah Unit
                  </button>
                )}
              </div>
            </div>
            {tenant.currentUnitName ? (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 border border-border">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase text-[#8FA28A] tracking-wider">
                    {tenant.currentPropertyName || 'Properti Kost'}
                  </span>
                  <p className="text-sm font-black text-foreground">{tenant.currentUnitName}</p>
                </div>
                {tenant.leaseStartDate && (
                  <div className="text-right text-xs">
                    <span className="text-muted-foreground block text-[10px]">Periode Kontrak</span>
                    <span className="font-bold text-foreground">
                      {tenant.leaseStartDate} s/d {tenant.leaseEndDate || 'Sekarang'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground bg-muted/20">
                Belum ada unit aktif yang ditempati. Klik &quot;Pindah Unit&quot; untuk menentukan kamar.
              </div>
            )}
          </div>

          {/* Section 3: Kontak Darurat */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5" /> Kontak Darurat
            </h3>
            {tenant.emergencyContact?.name ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Nama Kontak</span>
                  <span className="font-bold text-foreground">{tenant.emergencyContact.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Hubungan</span>
                  <span className="font-bold text-foreground">{tenant.emergencyContact.relation}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">No. Telepon</span>
                  <span className="font-bold text-[#8FA28A]">{tenant.emergencyContact.phone}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada informasi kontak darurat.</p>
            )}
          </div>

          {/* Section 4: Riwayat Perpindahan Unit & Perubahan Status */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Riwayat Perpindahan &amp; Status
            </h3>

            {displayHistory.length > 0 ? (
              <div className="relative pl-4 space-y-3.5 border-l-2 border-[#8FA28A]/30 ml-2 my-2">
                {displayHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-[#8FA28A] ring-4 ring-card shadow-xs" />

                    <div className="bg-card rounded-2xl p-3.5 border border-border shadow-2xs space-y-2 hover:border-[#8FA28A]/40 transition-all">
                      {/* Baris 1: Tanggal, Waktu & Badge Tipe */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg border border-border">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          {formatIndonesianDateTime(item.timestamp)}
                        </span>
                        {getHistoryBadge(item.type)}
                      </div>

                      {/* Baris 2: Judul Utama Perubahan */}
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        {getHistoryIcon(item.type)}
                        <span className="leading-snug">{item.title}</span>
                      </div>

                      {/* Baris 3: Deskripsi / Catatan Rinci */}
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium bg-muted/40 p-2.5 rounded-xl border border-border">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : tenant.currentUnitName ? (
              <div className="relative pl-4 space-y-3.5 border-l-2 border-[#8FA28A]/30 ml-2 my-2">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-[#8FA28A] ring-4 ring-card shadow-xs" />
                  <div className="bg-card rounded-2xl p-3.5 border border-border shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg border border-border">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        {tenant.leaseStartDate ? formatIndonesianDate(tenant.leaseStartDate) : 'Terdaftar'}
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Penempatan Awal
                      </span>
                    </div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                      Penempatan Unit: {tenant.currentPropertyName || 'Properti'} &mdash; {tenant.currentUnitName}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium bg-muted/40 p-2.5 rounded-xl border border-border">
                      Penempatan kamar pertama kali terdaftar di sistem.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada riwayat perpindahan unit atau perubahan status.</p>
            )}
          </div>

          {/* Section 5: Catatan */}
          {tenant.notes && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Catatan Internal
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{tenant.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/30">
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            Tutup
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(tenant);
              }}
              className="rounded-xl bg-[#8FA28A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all"
            >
              Edit Data Penyewa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

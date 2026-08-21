'use client';

import React from 'react';
import { X, User, Phone, Mail, FileText, Briefcase, HeartHandshake, Building, Calendar, CheckCircle2, Clock, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { Tenant } from '../_types';

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onEdit?: (tenant: Tenant) => void;
  onOpenTransfer?: (tenant: Tenant) => void;
}

export default function TenantDetailModal({
  isOpen,
  onClose,
  tenant,
  onEdit,
  onOpenTransfer,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Banner / Header */}
        <div className="bg-[#F7F4ED] border-b border-gray-100 px-6 py-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8FA28A] text-white font-black text-xl shadow-md border-2 border-white">
              {getInitials(tenant.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-800">{tenant.fullName}</h2>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{tenant.occupation || 'Profesi Belum Diisi'}</p>
              <div className="mt-2">{getStatusBadge(tenant.status)}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Section 1: Kontak & Identitas Utama */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Identitas & Kontak Utama
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">NIK (KTP)</span>
                <span className="font-bold text-gray-700 tracking-wide">{tenant.nik || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">No. Telepon / WhatsApp</span>
                <span className="font-bold text-gray-700 flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-[#8FA28A]" />
                  {tenant.phoneNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Email</span>
                <span className="font-bold text-gray-700 flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-[#8FA28A]" />
                  {tenant.email || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Tanggal Terdaftar</span>
                <span className="font-bold text-gray-700 flex items-center gap-1.5 mt-0.5">
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
          <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Penempatan & Kontrak Unit
              </h3>
              {onOpenTransfer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTransfer(tenant);
                  }}
                  className="flex items-center gap-1 rounded-xl bg-[#8FA28A] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#7D9178] transition-all"
                >
                  <ArrowRightLeft className="h-3 w-3" /> Pindah Unit
                </button>
              )}
            </div>
            {tenant.currentUnitName ? (
              <div className="flex items-center justify-between rounded-xl bg-[#F7F4ED] p-3 border border-[#C7D3C0]/50">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase text-[#8FA28A] tracking-wider">
                    {tenant.currentPropertyName || 'Properti Kost'}
                  </span>
                  <p className="text-sm font-black text-gray-800">{tenant.currentUnitName}</p>
                </div>
                {tenant.leaseStartDate && (
                  <div className="text-right text-xs">
                    <span className="text-gray-400 block text-[10px]">Periode Kontrak</span>
                    <span className="font-bold text-gray-700">
                      {tenant.leaseStartDate} s/d {tenant.leaseEndDate || 'Sekarang'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400 bg-gray-50/50">
                Belum ada unit aktif yang ditempati. Klik &quot;Pindah Unit&quot; untuk menentukan kamar.
              </div>
            )}
          </div>

          {/* Section 3: Kontak Darurat */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5" /> Kontak Darurat
            </h3>
            {tenant.emergencyContact?.name ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Nama Kontak</span>
                  <span className="font-bold text-gray-800">{tenant.emergencyContact.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Hubungan</span>
                  <span className="font-bold text-gray-800">{tenant.emergencyContact.relation}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">No. Telepon</span>
                  <span className="font-bold text-[#8FA28A]">{tenant.emergencyContact.phone}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Belum ada informasi kontak darurat.</p>
            )}
          </div>

          {/* Section 4: Catatan */}
          {tenant.notes && (
            <div className="rounded-2xl border border-gray-100 bg-amber-50/40 p-4 space-y-1 border-amber-200/50">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Catatan Internal
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">{tenant.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
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

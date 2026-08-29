'use client';

import React from 'react';
import {
  X,
  User,
  Building,
  Home,
  Phone,
  Mail,
  Calendar,
  ShieldAlert,
  CreditCard,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export interface HousekeepingTenantDetailItem {
  id: string;
  tenantProfileId?: string | null;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  nik: string | null;
  occupation: string | null;
  gender: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;

  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  unitId: string;
  unitNumber: string;
  unitFloor: number;
  unitDimensions: string | null;

  leaseId: string | null;
  leaseStatus: string;
  rentalPeriod: string;
  rentPrice: number;
  startDate: string | null;
  endDate: string | null;

  waNumber?: string | null;
  waLink: string | null;
}

interface HousekeepingTenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: HousekeepingTenantDetailItem | null;
}

export default function HousekeepingTenantDetailModal({
  isOpen,
  onClose,
  tenant,
}: HousekeepingTenantDetailModalProps) {
  if (!isOpen || !tenant) return null;

  // Format currency IDR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date IDR
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isLeaseActive = tenant.leaseStatus === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md font-bold text-lg">
              {tenant.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {tenant.fullName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isLeaseActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isLeaseActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {isLeaseActive ? 'SEWA AKTIF' : tenant.leaseStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {tenant.occupation || 'Penghuni Lapangan'} • Unit {tenant.unitNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition-all cursor-pointer"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Unit & Property Info Card */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8FA28A]">
                <Building className="h-4 w-4" />
                <span>Unit & Properti Tugas</span>
              </div>
              <span className="text-[11px] font-bold text-gray-500 font-mono">
                Lantai {tenant.unitFloor} ({tenant.unitDimensions})
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div>
                <p className="text-sm font-bold text-gray-900">{tenant.propertyName}</p>
                <p className="text-xs text-gray-500 leading-snug mt-0.5">{tenant.propertyAddress}</p>
              </div>
              <div className="shrink-0 px-3 py-1.5 rounded-xl bg-[#8FA28A]/15 border border-[#8FA28A]/30 text-center">
                <span className="text-[10px] font-extrabold text-gray-500 block uppercase">No. Kamar</span>
                <span className="text-sm font-black text-[#6B7F66] font-mono">{tenant.unitNumber}</span>
              </div>
            </div>
          </div>

          {/* Lease Details Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              <Calendar className="h-4 w-4 text-[#C8A96B]" />
              <span>Masa & Tarif Sewa</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Tanggal Mulai
                </span>
                <span className="text-xs font-bold text-gray-800 font-mono">
                  {formatDate(tenant.startDate)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Tanggal Berakhir
                </span>
                <span className="text-xs font-bold text-gray-800 font-mono">
                  {formatDate(tenant.endDate)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800">Harga Sewa Kamar</span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                {formatCurrency(tenant.rentPrice)} / {tenant.rentalPeriod === 'MONTHLY' ? 'Bulan' : tenant.rentalPeriod}
              </span>
            </div>
          </div>

          {/* Contact Information & WA Direct */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>Kontak & Identitas</span>
              </div>
              {tenant.nik && (
                <span className="text-[11px] font-mono font-semibold text-gray-500">
                  NIK: {tenant.nik}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span>{tenant.phoneNumber || 'Nomor HP tidak tercantum'}</span>
                </div>
                {tenant.waLink && (
                  <a
                    href={tenant.waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {tenant.email && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-gray-700">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span>{tenant.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact Card (If Available) */}
          {tenant.emergencyName && (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>Kontak Darurat</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <p className="font-bold text-gray-900">{tenant.emergencyName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Hubungan: {tenant.emergencyRelation || 'Keluarga'}
                  </p>
                </div>
                {tenant.emergencyPhone && (
                  <a
                    href={`tel:${tenant.emergencyPhone}`}
                    className="font-mono font-bold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{tenant.emergencyPhone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">
            Akses tim housekeeping Arventa
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  Receipt,
  MessageCircle,
  KeyRound,
  Edit3,
} from 'lucide-react';
import { HousekeepingMember } from '../_types';

interface HousekeepingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: HousekeepingMember | null;
  onEdit: (staff: HousekeepingMember) => void;
  onResetPassword: (staff: HousekeepingMember) => void;
}

export default function HousekeepingDetailModal({
  isOpen,
  onClose,
  staff,
  onEdit,
  onResetPassword,
}: HousekeepingDetailModalProps) {
  if (!isOpen || !staff) return null;

  const handleWhatsApp = () => {
    if (!staff.phoneNumber || staff.phoneNumber === '-') return;
    let cleanPhone = staff.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const msg = encodeURIComponent(`Halo ${staff.fullName}, terkait operasional properti di Arventa...`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#F7F4ED]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#8FA28A] text-white flex items-center justify-center font-bold text-sm shadow-md">
              {staff.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{staff.fullName}</h2>
              <p className="text-[11px] text-gray-500">Detail Profil & Penugasan Tim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Status & Role Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Status Akun
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    staff.isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-200 text-gray-700 border border-gray-300'
                  }`}
                >
                  {staff.isActive ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Aktif Bertugas
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5 text-gray-500" />
                      Nonaktif
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Akses Peran
              </span>
              <p className="text-xs font-bold text-[#8FA28A]">Housekeeping</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Informasi Kontak
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
                <Mail className="h-4 w-4 text-[#8FA28A] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 block">Email Login</span>
                  <p className="font-semibold text-gray-800 truncate">{staff.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <Phone className="h-4 w-4 text-[#8FA28A] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block">Nomor WhatsApp/HP</span>
                    <p className="font-semibold text-gray-800">{staff.phoneNumber || '-'}</p>
                  </div>
                </div>

                {staff.phoneNumber && staff.phoneNumber !== '-' && (
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-2xs shrink-0"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
                <Calendar className="h-4 w-4 text-[#8FA28A] shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-400 block">Terdaftar Sejak</span>
                  <p className="font-semibold text-gray-800">
                    {new Date(staff.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Properties */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Properti yang Ditangani
              </h4>
              <span className="text-[11px] font-bold text-[#8FA28A]">
                {staff.assignedProperties?.length || 0} Properti
              </span>
            </div>

            {(!staff.assignedProperties || staff.assignedProperties.length === 0) ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                Belum ada penugasan properti untuk staf ini.
              </div>
            ) : (
              <div className="space-y-2">
                {staff.assignedProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200 bg-gray-50/50"
                  >
                    <div className="h-8 w-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <Building className="h-4 w-4 text-[#8FA28A]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">{prop.name}</p>
                      {prop.address && (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{prop.address}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                onClose();
                onResetPassword(staff);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#C8A96B] bg-[#C8A96B]/10 hover:bg-[#C8A96B]/20 text-[#C8A96B] text-xs font-bold transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Reset Password</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(staff);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
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
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
  Trash2,
} from 'lucide-react';
import { HousekeepingMember } from '../_types';

interface HousekeepingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: HousekeepingMember | null;
  onEdit: (staff: HousekeepingMember) => void;
  onResetPassword: (staff: HousekeepingMember) => void;
  onDelete?: (staff: HousekeepingMember) => void;
}

export default function HousekeepingDetailModal({
  isOpen,
  onClose,
  staff,
  onEdit,
  onResetPassword,
  onDelete,
}: HousekeepingDetailModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);

  if (!isOpen || !staff) return null;

  const handleCopyEmail = () => {
    if (!staff.email) return;
    navigator.clipboard.writeText(staff.email);
    setIsEmailCopied(true);
    setTimeout(() => setIsEmailCopied(false), 2000);
  };

  const handleCopyPassword = () => {
    const passwordToCopy = staff.password || 'Housekeeping123!';
    navigator.clipboard.writeText(passwordToCopy);
    setIsPasswordCopied(true);
    setTimeout(() => setIsPasswordCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!staff.phoneNumber || staff.phoneNumber === '-') return;
    let cleanPhone = staff.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const msg = encodeURIComponent(`Halo ${staff.fullName}, terkait operasional properti di Arventa...`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleSendCredentials = () => {
    if (!staff.phoneNumber || staff.phoneNumber === '-') return;
    let cleanPhone = staff.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const currentEmail = staff.email || '-';
    const currentPassword = staff.password || 'Housekeeping123!';
    const messageText = `Halo *${staff.fullName}*,

Berikut adalah kredensial akun login modul Housekeeping Anda di Arventa:

• *Email Login:* ${currentEmail}
• *Password:* ${currentPassword}

Silakan gunakan data di atas untuk login ke sistem Arventa. Terima kasih!`;
    const msg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-8 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl md:max-w-2xl my-auto overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl border border-border flex flex-col max-h-[85vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#8FA28A] text-white flex items-center justify-center font-bold text-sm shadow-md">
              {staff.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{staff.fullName}</h2>
              <p className="text-[11px] text-muted-foreground">Detail Profil & Penugasan Tim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Status & Role Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Status Akun
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${staff.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                    }`}
                >
                  {staff.isActive ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Aktif Bertugas
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                      Nonaktif
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Akses Peran
              </span>
              <p className="text-xs font-bold text-[#8FA28A]">Housekeeping</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Informasi Kontak
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Mail className="h-4 w-4 text-[#8FA28A] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground block">Email Login</span>
                    <p className="font-semibold text-foreground truncate">{staff.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0 ml-2"
                  title="Salin Email"
                >
                  {isEmailCopied ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <KeyRound className="h-4 w-4 text-[#8FA28A] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground block">Password Akun</span>
                    <p className="font-semibold font-mono text-foreground truncate">
                      {showPassword ? (staff.password || 'Housekeeping123!') : '••••••••••••'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Salin Password"
                  >
                    {isPasswordCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <Phone className="h-4 w-4 text-[#8FA28A] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block">Nomor WhatsApp/HP</span>
                    <p className="font-semibold text-foreground">{staff.phoneNumber || '-'}</p>
                  </div>
                </div>

                {staff.phoneNumber && staff.phoneNumber !== '-' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-2xs"
                      title="Buka Chat WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendCredentials}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#8FA28A] hover:bg-[#7D9178] text-white text-[11px] font-bold transition-all shadow-2xs"
                      title="Kirim Username & Password via WhatsApp"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim Akun</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <Calendar className="h-4 w-4 text-[#8FA28A] shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Terdaftar Sejak</span>
                  <p className="font-semibold text-foreground">
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Properti yang Ditangani
              </h4>
              <span className="text-[11px] font-bold text-[#8FA28A]">
                {staff.assignedProperties?.length || 0} Properti
              </span>
            </div>

            {(!staff.assignedProperties || staff.assignedProperties.length === 0) ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Belum ada penugasan properti untuk staf ini.
              </div>
            ) : (
              <div className="space-y-2">
                {staff.assignedProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-muted/30"
                  >
                    <div className="h-8 w-8 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                      <Building className="h-4 w-4 text-[#8FA28A]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{prop.name}</p>
                      {prop.address && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{prop.address}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(staff);
                }}
                className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition-colors cursor-pointer"
                title="Hapus Akun Permanen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

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

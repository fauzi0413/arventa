'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { HousekeepingMember } from '../_types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: HousekeepingMember | null;
  onResetPassword: (staffId: string, newPass: string) => Promise<void>;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  staff,
  onResetPassword,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && staff) {
      setNewPassword(staff.password || '');
      setShowPassword(false);
      setIsCopied(false);
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  const handleClose = () => {
    setNewPassword(staff.password || '');
    setShowPassword(false);
    setIsCopied(false);
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
    setIsCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onResetPassword(staff.id, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password staf');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C8A96B] text-white shadow-md">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Reset Password Staf</h2>
              <p className="text-xs text-muted-foreground">Atur ulang kata sandi akses staf</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Password Berhasil Diubah!</h3>
              <p className="text-xs text-muted-foreground">
                Password baru untuk <b>{staff.fullName}</b> ({staff.email}) telah diperbarui. Silakan bagikan ke staf bersangkutan.
              </p>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-center justify-between">
                <code className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">{newPassword}</code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleClose}
                  className="w-full rounded-xl bg-[#8FA28A] text-white font-bold text-xs py-2.5 shadow-sm hover:bg-[#7D9178] transition-all"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Target Card */}
              <div className="rounded-2xl border border-border bg-muted/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">{staff.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{staff.email}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#8FA28A]/15 text-[#8FA28A] border border-[#8FA28A]/30">
                  Housekeeping
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGenerateRandom}
                    className="text-[11px] font-bold text-[#8FA28A] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Acak Password
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    disabled={isSubmitting}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3.5 pr-20 py-2.5 text-xs font-mono focus:border-[#8FA28A] focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted/50"
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 text-muted-foreground">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowPassword(!showPassword)}
                      className="hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleCopy}
                      className="hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Salin Password"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#C8A96B] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#B39355] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mereset...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Reset</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Mail,
  Phone,
  Building,
  Check,
  Shield,
  Loader2,
  Lock,
} from 'lucide-react';
import { HousekeepingMember, PropertyOption } from '../_types';

interface HousekeepingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password?: string;
    propertyIds: string[];
    isActive: boolean;
  }) => Promise<void>;
  staffToEdit?: HousekeepingMember | null;
  propertiesList: PropertyOption[];
}

export default function HousekeepingFormModal({
  isOpen,
  onClose,
  onSubmit,
  staffToEdit,
  propertiesList,
}: HousekeepingFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (staffToEdit) {
      setFullName(staffToEdit.fullName || '');
      setEmail(staffToEdit.email || '');
      setPhoneNumber(staffToEdit.phoneNumber === '-' ? '' : staffToEdit.phoneNumber || '');
      setSelectedPropertyIds(staffToEdit.assignedProperties?.map((p) => p.id) || []);
      setIsActive(staffToEdit.isActive ?? true);
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('Housekeeping123!');
      setSelectedPropertyIds(propertiesList.length > 0 ? [propertiesList[0].id] : []);
      setIsActive(true);
    }
    setErrors({});
  }, [staffToEdit, isOpen, propertiesList]);

  if (!isOpen) return null;

  const toggleProperty = (propId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId]
    );
  };

  const handleSelectAllProps = () => {
    if (selectedPropertyIds.length === propertiesList.length) {
      setSelectedPropertyIds([]);
    } else {
      setSelectedPropertyIds(propertiesList.map((p) => p.id));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Nama lengkap wajib diisi';
    if (!staffToEdit && !email.trim()) {
      errs.email = 'Email wajib diisi';
    } else if (email && !/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Format email tidak valid';
    }
    if (!phoneNumber.trim()) errs.phoneNumber = 'Nomor telepon wajib diisi';
    if (!staffToEdit && password && password.length < 6) {
      errs.password = 'Password minimal 6 karakter';
    }
    if (selectedPropertyIds.length === 0) {
      errs.properties = 'Pilih minimal 1 properti untuk penugasan';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password: password || undefined,
        propertyIds: selectedPropertyIds,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Gagal menyimpan data staf housekeeping' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-8 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl md:max-w-2xl my-auto overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl border border-border flex flex-col max-h-[85vh] sm:max-h-[88vh]">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {staffToEdit ? 'Edit Staf Housekeeping' : 'Tambah Staf Housekeeping Baru'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {staffToEdit
                  ? 'Perbarui informasi dan penugasan properti staf'
                  : 'Daftarkan akun staf dan tentukan cakupan properti yang ditangani'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errors.form && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400">
              {errors.form}
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Agus Prasetyo"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none transition-all ${errors.fullName
                  ? 'border-red-400 bg-red-50/30'
                  : 'border-border bg-background text-foreground focus:border-[#8FA28A]'
                }`}
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                Email Login <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  disabled={Boolean(staffToEdit)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agus.hk@gmail.com"
                  className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs focus:outline-none transition-all ${staffToEdit ? 'bg-muted text-muted-foreground cursor-not-allowed border-border' :
                      errors.email
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-border bg-background text-foreground focus:border-[#8FA28A]'
                    }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                Nomor WhatsApp/HP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs focus:outline-none transition-all ${errors.phoneNumber
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-border bg-background text-foreground focus:border-[#8FA28A]'
                    }`}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* Password Awal (Only on Add) */}
          {!staffToEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                Password Awal Akun <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password untuk staf"
                  className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs focus:outline-none transition-all ${errors.password
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-border bg-background text-foreground focus:border-[#8FA28A]'
                    }`}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Berikan password ini ke staf untuk login awal ke modul Housekeeping.
              </p>
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
          )}

          {/* Penugasan Properti (Multi-select) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                Properti yang Ditangani <span className="text-red-500">*</span>
              </label>
              {propertiesList.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllProps}
                  className="text-[11px] font-bold text-[#8FA28A] hover:underline"
                >
                  {selectedPropertyIds.length === propertiesList.length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua'}
                </button>
              )}
            </div>

            {propertiesList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Belum ada properti terdaftar. Buat properti terlebih dahulu.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                {propertiesList.map((prop) => {
                  const isChecked = selectedPropertyIds.includes(prop.id);
                  return (
                    <div
                      key={prop.id}
                      onClick={() => toggleProperty(prop.id)}
                      className={`cursor-pointer rounded-2xl border p-3 flex items-start gap-3 transition-all ${isChecked
                          ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-foreground shadow-2xs'
                          : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                        }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${isChecked
                            ? 'border-[#8FA28A] bg-[#8FA28A] text-white'
                            : 'border-border bg-card'
                          }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-foreground">{prop.name}</p>
                        {prop.address && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {prop.address}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.properties && (
              <p className="text-[11px] text-red-500 mt-1">{errors.properties}</p>
            )}
          </div>

          {/* Status Akun */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
              Status Akun
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
              >
                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${!isActive
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
              >
                <div className={`h-2 w-2 rounded-full ${!isActive ? 'bg-white' : 'bg-muted-foreground'}`} />
                Nonaktif
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[#8FA28A] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{staffToEdit ? 'Simpan Perubahan' : 'Tambah Housekeeping'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

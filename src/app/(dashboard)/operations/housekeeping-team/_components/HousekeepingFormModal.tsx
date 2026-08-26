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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {staffToEdit ? 'Edit Staf Housekeeping' : 'Tambah Staf Housekeeping Baru'}
              </h2>
              <p className="text-xs text-gray-500">
                {staffToEdit
                  ? 'Perbarui informasi dan penugasan properti staf'
                  : 'Daftarkan akun staf dan tentukan cakupan properti yang ditangani'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errors.form && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {errors.form}
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Agus Prasetyo"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                errors.fullName
                  ? 'border-red-400 bg-red-50/30'
                  : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
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
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Login <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  disabled={Boolean(staffToEdit)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agus.hk@gmail.com"
                  className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                    staffToEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' :
                    errors.email
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Nomor WhatsApp/HP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08123456789"
                  className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                    errors.phoneNumber
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
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
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password Awal Akun <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password untuk staf"
                  className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                    errors.password
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                  }`}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
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
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
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
                      className={`cursor-pointer rounded-2xl border p-3 flex items-start gap-3 transition-all ${
                        isChecked
                          ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-gray-800 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                          isChecked
                            ? 'border-[#8FA28A] bg-[#8FA28A] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{prop.name}</p>
                        {prop.address && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Status Akun
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  !isActive
                    ? 'bg-gray-700 text-white border-gray-700 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${!isActive ? 'bg-white' : 'bg-gray-400'}`} />
                Nonaktif
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
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

'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, Briefcase, UserCheck, HeartHandshake, Building, Info, ArrowRightLeft } from 'lucide-react';
import { Tenant, TenantStatus } from '../_types';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Partial<Tenant>) => void;
  tenantToEdit?: Tenant | null;
  propertiesList?: { id: string; name: string }[];
  onOpenTransfer?: (tenant: Tenant) => void;
}

export default function TenantFormModal({
  isOpen,
  onClose,
  onSave,
  tenantToEdit,
  onOpenTransfer,
}: TenantFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupation, setOccupation] = useState('Karyawan Swasta');
  const [status, setStatus] = useState<TenantStatus>('CALON');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Orang Tua');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenantToEdit) {
      setFullName(tenantToEdit.fullName || '');
      setNik(tenantToEdit.nik || '');
      setEmail(tenantToEdit.email || '');
      setPhoneNumber(tenantToEdit.phoneNumber || '');
      setOccupation(tenantToEdit.occupation || 'Karyawan Swasta');
      setStatus(tenantToEdit.status || 'CALON');
      setEmergencyName(tenantToEdit.emergencyContact?.name || '');
      setEmergencyPhone(tenantToEdit.emergencyContact?.phone || '');
      setEmergencyRelation(tenantToEdit.emergencyContact?.relation || 'Orang Tua');
      setNotes(tenantToEdit.notes || '');
    } else {
      setFullName('');
      setNik('');
      setEmail('');
      setPhoneNumber('');
      setOccupation('Karyawan Swasta');
      setStatus('CALON');
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyRelation('Orang Tua');
      setNotes('');
    }
    setErrors({});
  }, [tenantToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Nomor telepon wajib diisi';
    if (email && !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email tidak valid';
    if (nik && nik.trim().length !== 16) newErrors.nik = 'NIK harus 16 digit angka';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: tenantToEdit ? tenantToEdit.id : undefined,
      fullName: fullName.trim(),
      nik: nik.trim() || `3201${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phoneNumber: phoneNumber.trim(),
      occupation,
      status,
      emergencyContact: (emergencyName.trim() || emergencyPhone.trim()) ? {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relation: emergencyRelation
      } : undefined,
      currentPropertyName: tenantToEdit?.currentPropertyName,
      currentUnitName: tenantToEdit?.currentUnitName,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {tenantToEdit ? 'Edit Data Penyewa' : 'Tambah Penyewa Baru'}
              </h2>
              <p className="text-xs text-gray-500">
                {tenantToEdit ? 'Perbarui informasi biodata & kontak penyewa master' : 'Isi formulir biodata lengkap penyewa/calon penyewa baru'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Status Penyewa */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Status Penyewa <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatus('CALON')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border ${
                  status === 'CALON'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${status === 'CALON' ? 'bg-white' : 'bg-amber-500'}`} />
                Calon Penyewa
              </button>

              <button
                type="button"
                onClick={() => setStatus('AKTIF')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border ${
                  status === 'AKTIF'
                    ? 'bg-[#8FA28A] text-white border-[#8FA28A] shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${status === 'AKTIF' ? 'bg-white' : 'bg-emerald-500'}`} />
                Penyewa Aktif
              </button>

              <button
                type="button"
                onClick={() => setStatus('NONAKTIF')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border ${
                  status === 'NONAKTIF'
                    ? 'bg-gray-700 text-white border-gray-700 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${status === 'NONAKTIF' ? 'bg-white' : 'bg-gray-400'}`} />
                Nonaktif / Alumni
              </button>
            </div>
          </div>

          {/* Section 1: Informasi Diri */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5">
              <User className="h-4 w-4" /> Informasi Pribadi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                      errors.fullName ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                    }`}
                  />
                </div>
                {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              {/* NIK */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  NIK (KTP) <span className="text-gray-400 font-normal">(16 Digit)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="3201012345670001"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                      errors.nik ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                    }`}
                  />
                </div>
                {errors.nik && <p className="text-[11px] text-red-500 mt-1">{errors.nik}</p>}
              </div>

              {/* No Telepon */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  No. Telepon / WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="08123456789"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                      errors.phoneNumber ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                    }`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                      errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Pekerjaan */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pekerjaan / Status Profesi
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none transition-all"
                  >
                    <option value="Karyawan Swasta">Karyawan Swasta</option>
                    <option value="Mahasiswa / Pelajar">Mahasiswa / Pelajar</option>
                    <option value="PNS / ASN">PNS / ASN</option>
                    <option value="Wiraswasta / Freelance">Wiraswasta / Freelance</option>
                    <option value="Profesional / Dokter / Pengacara">Profesional / Dokter / Pengacara</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Kontak Darurat */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4" /> Kontak Darurat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kontak Darurat</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Contoh: Pak Bambang"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hubungan</label>
                <select
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                >
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Saudara Kandung">Saudara Kandung</option>
                  <option value="Suami / Istri">Suami / Istri</option>
                  <option value="Kerabat">Kerabat</option>
                  <option value="Teman / Rekan">Teman / Rekan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">No. HP Kontak Darurat</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="08198765432"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Informasi Penempatan Unit */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5">
                <Building className="h-4 w-4" /> Informasi Penempatan Unit
              </h3>
              {tenantToEdit && onOpenTransfer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTransfer(tenantToEdit);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#7D9178] transition-all"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Pindah / Atur Unit
                </button>
              )}
            </div>
            {tenantToEdit?.currentUnitName ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#8FA28A] tracking-wider block">
                      {tenantToEdit.currentPropertyName || 'Properti Kost'}
                    </span>
                    <p className="text-sm font-black text-gray-800">{tenantToEdit.currentUnitName}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Terdaftar di Database
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                  <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>Penempatan unit diambil dari proses pemberian akses kamar / check-in unit.</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-xs text-gray-500 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    Belum ada penempatan unit. Klik tombol &quot;Pindah / Atur Unit&quot; untuk menentukan kamar penyewa.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Catatan */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Internal / Keterangan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan mengenai penyewa (misal: bayar via transfer bulanan, permintaan kasur ekstra, dll)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#8FA28A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all"
            >
              {tenantToEdit ? 'Simpan Perubahan' : 'Tambah Penyewa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

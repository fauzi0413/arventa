'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  FileText,
  Briefcase,
  UserCheck,
  HeartHandshake,
  Building,
  Info,
  ArrowRightLeft,
  Upload,
  Sparkles,
  Camera,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Globe,
  Activity,
  Heart,
  Home,
} from 'lucide-react';
import { Tenant, TenantStatus } from '../_types';

interface PropertyOption {
  id: string;
  name: string;
  units: string[];
}

const DEFAULT_PROPERTIES: PropertyOption[] = [
  {
    id: 'prop-1',
    name: 'Kos Graha Asri',
    units: ['Kamar 101', 'Kamar 102', 'Kamar 103', 'Kamar 104', 'Kamar 201', 'Kamar 202'],
  },
  {
    id: 'prop-2',
    name: 'Apartemen Gateway Pasteur Unit 12B',
    units: ['Apt 12B-01', 'Apt 12B-02', 'Apt 12B-03'],
  },
];

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
  // Primary Info
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

  // Unit Assignment States
  const [propertiesList, setPropertiesList] = useState<PropertyOption[]>(DEFAULT_PROPERTIES);
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>('');
  const [selectedUnitName, setSelectedUnitName] = useState<string>('');
  const [leaseStartDate, setLeaseStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Complete KTP OCR Fields
  const [ktpImageUrl, setKtpImageUrl] = useState('');
  const [birthPlaceDate, setBirthPlaceDate] = useState('');
  const [gender, setGender] = useState('LAKI-LAKI');
  const [bloodType, setBloodType] = useState('O');
  const [addressKtp, setAddressKtp] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [kelDesa, setKelDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [religion, setReligion] = useState('ISLAM');
  const [maritalStatus, setMaritalStatus] = useState('BELUM KAWIN');
  const [nationality, setNationality] = useState('WNI');
  const [validUntil, setValidUntil] = useState('SEUMUR HIDUP');

  // OCR Processing & File States
  const [selectedKtpFile, setSelectedKtpFile] = useState<File | null>(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrStatusMessage, setOcrStatusMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOcrEnabled, setIsOcrEnabled] = useState<boolean>(true);

  // Form Scroll Ref
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFeatureFlag = async () => {
      try {
        const res = await fetch('/api/feature-flags');
        if (res.ok) {
          const json = await res.json();
          if (json.data && typeof json.data.ocr_ktp_enabled === 'boolean') {
            setIsOcrEnabled(json.data.ocr_ktp_enabled);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch feature flag ocr_ktp_enabled:', e);
      }
    };
    fetchFeatureFlag();
  }, [isOpen]);

  // Fetch available properties & empty units from API
  useEffect(() => {
    if (!isOpen) return;
    const fetchProps = async () => {
      const occupiedUnits = new Set<string>();

      // Fetch active tenants from API to get occupied units
      try {
        const tenantRes = await fetch('/api/tenants?limit=100');
        if (tenantRes.ok) {
          const tenantJson = await tenantRes.json();
          if (Array.isArray(tenantJson.data)) {
            tenantJson.data.forEach((t: any) => {
              const tUser = t.user || {};
              const leases = Array.isArray(t.leases) ? t.leases : [];
              const activeLease = leases.find((l: any) => l.status === 'ACTIVE');
              const tStatus = activeLease ? 'AKTIF' : (tUser.isActive === false ? 'NONAKTIF' : 'CALON');

              if (t.id !== tenantToEdit?.id && tStatus === 'AKTIF') {
                const uNum = activeLease?.unit?.unitNumber || t.currentUnitName;
                if (uNum) {
                  const clean = uNum.replace(/^(kamar|apt|unit)\s+/i, '').trim();
                  occupiedUnits.add(uNum);
                  occupiedUnits.add(clean);
                  occupiedUnits.add(`Kamar ${clean}`);
                  occupiedUnits.add(`Apt ${clean}`);
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('API tenant fetch notice for occupied units check:', e);
      }

      // Check local storage for active tenants as fallback
      if (typeof window !== 'undefined') {
        const storedTenants = localStorage.getItem('arventa_tenants');
        if (storedTenants) {
          try {
            const parsedTenants = JSON.parse(storedTenants);
            if (Array.isArray(parsedTenants)) {
              parsedTenants.forEach((t: any) => {
                if (t.id !== tenantToEdit?.id && t.status === 'AKTIF' && t.currentUnitName) {
                  const uNum = t.currentUnitName;
                  const clean = uNum.replace(/^(kamar|apt|unit)\s+/i, '').trim();
                  occupiedUnits.add(uNum);
                  occupiedUnits.add(clean);
                  occupiedUnits.add(`Kamar ${clean}`);
                  occupiedUnits.add(`Apt ${clean}`);
                }
              });
            }
          } catch (e) { }
        }
      }

      let rawData: any[] = [];
      try {
        const res = await fetch('/api/properties?limit=50');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            rawData = json.data;
          }
        }
      } catch (err) {
        console.warn('API fetch notice: checking local storage for properties', err);
      }

      if (rawData.length === 0 && typeof window !== 'undefined') {
        const stored = localStorage.getItem('arventa_properties');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) rawData = parsed;
          } catch (e) { }
        }
      }

      if (rawData.length > 0) {
        const formatted: PropertyOption[] = rawData
          .map((p: any) => {
            let emptyUnitsOnly: string[] = [];
            if (Array.isArray(p.units) && p.units.length > 0) {
              const filtered = p.units.filter((u: any) => {
                const rawName = typeof u === 'string' ? u : (u.name || u.unitNumber || '');
                const cleanName = rawName.replace(/^(kamar|apt|unit)\s+/i, '').trim();
                const formattedName = /^(kamar|apt|unit)/i.test(rawName) ? rawName : `Kamar ${rawName}`;
                const rawStatus = typeof u === 'string' ? '' : String(u.status || '').toUpperCase();

                const isOccupiedInDb = rawStatus === 'OCCUPIED' || rawStatus === 'TERISI';
                const isOccupiedByActiveTenant = occupiedUnits.has(rawName) || occupiedUnits.has(cleanName) || occupiedUnits.has(formattedName);

                // Strictly exclude any unit occupied by an active tenant or marked occupied in DB
                if (isOccupiedInDb || isOccupiedByActiveTenant) {
                  return false;
                }

                return true;
              });
              emptyUnitsOnly = filtered.map((u: any) => {
                const uName = typeof u === 'string' ? u : (u.name || u.unitNumber || '');
                return /^(kamar|apt|unit)/i.test(uName) ? uName : `Kamar ${uName}`;
              });
            }
            return {
              id: p.id,
              name: p.name,
              units: emptyUnitsOnly,
            };
          })
          .filter((p) => p.units.length > 0 || (tenantToEdit?.status === 'AKTIF' && tenantToEdit?.currentPropertyName && p.name === tenantToEdit.currentPropertyName));
        setPropertiesList(formatted);
      }
    };
    fetchProps();
  }, [isOpen, tenantToEdit]);

  useEffect(() => {
    setSelectedKtpFile(null);
    setIsSubmitting(false);

    if (isOpen && formRef.current) {
      formRef.current.scrollTop = 0;
    }

    if (tenantToEdit) {
      setFullName(tenantToEdit.fullName || '');
      setNik(tenantToEdit.nik || '');
      setEmail(tenantToEdit.email || '');
      setPhoneNumber(tenantToEdit.phoneNumber || '');
      setOccupation(tenantToEdit.occupation || '');
      setStatus(tenantToEdit.status || 'CALON');
      setEmergencyName(tenantToEdit.emergencyContact?.name || '');
      setEmergencyPhone(tenantToEdit.emergencyContact?.phone || '');
      setEmergencyRelation(tenantToEdit.emergencyContact?.relation || 'Orang Tua');
      setNotes(tenantToEdit.notes || '');

      setKtpImageUrl(tenantToEdit.ktpImageUrl || '');
      setBirthPlaceDate(tenantToEdit.birthPlaceDate || '');
      setGender(tenantToEdit.gender || 'LAKI-LAKI');
      setBloodType(tenantToEdit.bloodType || 'O');
      setAddressKtp(tenantToEdit.addressKtp || '');
      setRtRw(tenantToEdit.rtRw || '');
      setKelDesa(tenantToEdit.kelDesa || '');
      setKecamatan(tenantToEdit.kecamatan || '');
      setReligion(tenantToEdit.religion || 'ISLAM');
      setMaritalStatus(tenantToEdit.maritalStatus || 'BELUM KAWIN');
      setNationality(tenantToEdit.nationality || 'WNI');
      setValidUntil(tenantToEdit.validUntil || 'SEUMUR HIDUP');

      setSelectedPropertyName(tenantToEdit.currentPropertyName || '');
      setSelectedUnitName(tenantToEdit.currentUnitName || '');
      setLeaseStartDate(tenantToEdit.leaseStartDate || new Date().toISOString().split('T')[0]);
    } else {
      setFullName('');
      setNik('');
      setEmail('');
      setPhoneNumber('');
      setOccupation('');
      setStatus('CALON');
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyRelation('Orang Tua');
      setNotes('');

      setKtpImageUrl('');
      setBirthPlaceDate('');
      setGender('LAKI-LAKI');
      setBloodType('O');
      setAddressKtp('');
      setRtRw('');
      setKelDesa('');
      setKecamatan('');
      setReligion('ISLAM');
      setMaritalStatus('BELUM KAWIN');
      setNationality('WNI');
      setValidUntil('SEUMUR HIDUP');

      setSelectedPropertyName('');
      setSelectedUnitName('');
      setLeaseStartDate(new Date().toISOString().split('T')[0]);
    }
    setOcrStatusMessage(null);
    setErrors({});
  }, [tenantToEdit, isOpen]);

  const currentPropUnits = propertiesList.find((p) => p.name === selectedPropertyName)?.units || [];

  const handleStatusChange = (newStatus: TenantStatus) => {
    setStatus(newStatus);
    if (newStatus === 'NONAKTIF') {
      setSelectedPropertyName(tenantToEdit?.currentPropertyName || '');
      setSelectedUnitName(tenantToEdit?.currentUnitName || '');
    } else if (newStatus === 'CALON') {
      setSelectedPropertyName('');
      setSelectedUnitName('');
    } else if (newStatus === 'AKTIF') {
      if (tenantToEdit?.status === 'AKTIF') {
        setSelectedPropertyName(tenantToEdit.currentPropertyName || '');
        setSelectedUnitName(tenantToEdit.currentUnitName || '');
      } else {
        const targetProp = propertiesList.find((p) => p.name === selectedPropertyName && p.units.includes(selectedUnitName));
        if (!targetProp) {
          const firstAvailProp = propertiesList.find((p) => p.units.length > 0);
          if (firstAvailProp) {
            setSelectedPropertyName(firstAvailProp.name);
            setSelectedUnitName(firstAvailProp.units[0] || '');
          } else {
            setSelectedPropertyName('');
            setSelectedUnitName('');
          }
        }
      }
    }
  };

  const handlePropertyChange = (newPropName: string) => {
    setSelectedPropertyName(newPropName);
    if (!newPropName) {
      setSelectedUnitName('');
      return;
    }
    const targetProp = propertiesList.find((p) => p.name === newPropName);
    if (targetProp && targetProp.units.length > 0) {
      setSelectedUnitName(targetProp.units[0]);
    } else {
      setSelectedUnitName('');
    }
  };

  const handleUnitChange = (newUnitName: string) => {
    setSelectedUnitName(newUnitName);
  };

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

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // FE MIME Type Validation
    if (!file.type.startsWith('image/')) {
      setOcrStatusMessage({
        type: 'error',
        text: 'Format file tidak valid. Harap upload foto KTP dalam format gambar (JPG, PNG, WEBP).',
      });
      return;
    }

    // FE File Size Validation (Max 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setOcrStatusMessage({
        type: 'error',
        text: 'Ukuran foto KTP terlalu besar (maksimal 10 MB). Harap pilih foto yang lebih kecil.',
      });
      return;
    }

    processKtpOcr(file);
  };

  const processKtpOcr = (file: File) => {
    setIsOcrScanning(true);
    setOcrStatusMessage(null);

    // Save selected file in state for delayed upload on form submit
    setSelectedKtpFile(file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setKtpImageUrl(base64String);

      // Process AI OCR via /api/ocr/ktp (without uploading to Storage yet)
      try {
        const res = await fetch('/api/ocr/ktp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64String }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const data = json.data;
            if (data.fullName) setFullName(data.fullName);
            if (data.nik) setNik(data.nik.replace(/\D/g, '').substring(0, 16));
            if (data.birthPlaceDate) setBirthPlaceDate(data.birthPlaceDate);
            if (data.gender) setGender(data.gender);
            if (data.bloodType) setBloodType(data.bloodType);
            if (data.addressKtp) setAddressKtp(data.addressKtp);
            if (data.rtRw) setRtRw(data.rtRw);
            if (data.kelDesa) setKelDesa(data.kelDesa);
            if (data.kecamatan) setKecamatan(data.kecamatan);
            if (data.religion) setReligion(data.religion);
            if (data.maritalStatus) setMaritalStatus(data.maritalStatus);
            if (data.occupation) setOccupation(data.occupation);
            if (data.nationality) setNationality(data.nationality);
            if (data.validUntil) setValidUntil(data.validUntil);

            setOcrStatusMessage({
              type: 'success',
              text: 'Data KTP berhasil diambil, silahkan Anda cek kembali.',
            });
          } else {
            setOcrStatusMessage({
              type: 'error',
              text: json.message || 'Scan KTP belum dapat digunakan. Silakan isi data formulir secara manual.',
            });
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          setOcrStatusMessage({
            type: 'error',
            text: errJson.message || 'Scan KTP belum dapat digunakan. Silakan isi data formulir secara manual.',
          });
        }
      } catch (err) {
        console.error('OCR API Error:', err);
        setOcrStatusMessage({
          type: 'error',
          text: 'Terjadi kesalahan sistem saat memproses OCR KTP.',
        });
      } finally {
        setIsOcrScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    let finalKtpUrl = ktpImageUrl;

    // Upload to Supabase Storage ONLY when submitting the form
    if (selectedKtpFile) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedKtpFile);
        uploadFormData.append('bucket', 'ktp-documents');
        if (tenantToEdit?.ktpImageUrl) {
          uploadFormData.append('oldKtpUrl', tenantToEdit.ktpImageUrl);
        }
        if (tenantToEdit?.id) {
          uploadFormData.append('tenantId', tenantToEdit.id);
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson.data?.url) {
            finalKtpUrl = uploadJson.data.url;
          }
        }
      } catch (err) {
        console.warn('Supabase Storage upload warning during submit:', err);
      }
    }

    try {
      await onSave({
        id: tenantToEdit ? tenantToEdit.id : undefined,
        fullName: fullName.trim(),
        nik: nik.trim() || `3201${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        phoneNumber: phoneNumber.trim(),
        occupation,
        status,
        ktpImageUrl: finalKtpUrl || undefined,
        birthPlaceDate: birthPlaceDate.trim() || undefined,
        gender,
        bloodType,
        addressKtp: addressKtp.trim() || undefined,
        rtRw: rtRw.trim() || undefined,
        kelDesa: kelDesa.trim() || undefined,
        kecamatan: kecamatan.trim() || undefined,
        religion,
        maritalStatus,
        nationality,
        validUntil,
        emergencyContact:
          emergencyName.trim() || emergencyPhone.trim()
            ? {
              name: emergencyName.trim(),
              phone: emergencyPhone.trim(),
              relation: emergencyRelation,
            }
            : undefined,
        currentPropertyName: selectedPropertyName || undefined,
        currentUnitName: selectedUnitName || undefined,
        leaseStartDate: selectedUnitName ? leaseStartDate : undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {tenantToEdit ? 'Edit Data Penyewa' : 'Tambah Penyewa Baru'}
              </h2>
              <p className="text-xs text-gray-500">
                {tenantToEdit
                  ? 'Perbarui informasi biodata, KTP & kontak penyewa master'
                  : 'Isi formulir biodata lengkap penyewa/calon penyewa baru'}
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
        <form ref={formRef} onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Status Penyewa */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Status Penyewa <span className="text-red-500">*</span>
            </label>
            <div className={`grid ${tenantToEdit && (tenantToEdit.status === 'AKTIF' || tenantToEdit.status === 'NONAKTIF' || tenantToEdit.currentPropertyName || tenantToEdit.currentUnitName) ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
              {!(tenantToEdit && (tenantToEdit.status === 'AKTIF' || tenantToEdit.status === 'NONAKTIF' || tenantToEdit.currentPropertyName || tenantToEdit.currentUnitName)) && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('CALON')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border ${status === 'CALON'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <div className={`h-2 w-2 rounded-full ${status === 'CALON' ? 'bg-white' : 'bg-amber-500'}`} />
                  Calon Penyewa
                </button>
              )}

              <button
                type="button"
                onClick={() => handleStatusChange('AKTIF')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border ${status === 'AKTIF'
                  ? 'bg-[#8FA28A] text-white border-[#8FA28A] shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className={`h-2 w-2 rounded-full ${status === 'AKTIF' ? 'bg-white' : 'bg-[#8FA28A]'}`} />
                Penyewa Aktif
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('NONAKTIF')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border ${status === 'NONAKTIF'
                  ? 'bg-gray-700 text-white border-gray-700 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className={`h-2 w-2 rounded-full ${status === 'NONAKTIF' ? 'bg-white' : 'bg-gray-400'}`} />
                Nonaktif / Alumni
              </button>
            </div>
          </div>

          {/* Section 0: Upload KTP & Instant AI OCR (Gated by ocr_ktp_enabled Feature Flag) */}
          {isOcrEnabled && (
            <div className="rounded-2xl border border-[#8FA28A]/30 bg-[#8FA28A]/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#8FA28A]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
                    Foto KTP Untuk Otomatis Mengisi Data
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#8FA28A] bg-white px-2 py-0.5 rounded-full border border-[#8FA28A]/30 shadow-2xs">
                  Gemini Vision Powered
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Preview KTP */}
                <div className="relative h-32 w-full rounded-xl border border-dashed border-gray-300 bg-white overflow-hidden flex flex-col items-center justify-center text-center shadow-2xs">
                  {ktpImageUrl ? (
                    <img src={ktpImageUrl} alt="KTP Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="space-y-1 p-2">
                      <Camera className="h-6 w-6 text-gray-400 mx-auto" />
                      <p className="text-[10px] font-semibold text-gray-500">Belum Ada Foto KTP</p>
                    </div>
                  )}
                </div>

                {/* Upload & Camera Action Buttons */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Button 1: Kamera HP */}
                    <label className="relative flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#8FA28A] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#7D9178] transition-all">
                      {isOcrScanning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <span>{ktpImageUrl ? 'Foto Ulang KTP' : 'Ambil Foto Kamera'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleKtpFileChange}
                        disabled={isOcrScanning}
                        className="sr-only"
                      />
                    </label>

                    {/* Button 2: Upload File */}
                    <label className="relative flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-white border border-[#8FA28A] px-3 py-2 text-xs font-bold text-[#8FA28A] shadow-2xs hover:bg-[#8FA28A]/10 transition-all">
                      {isOcrScanning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Pilih dari Galeri</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleKtpFileChange}
                        disabled={isOcrScanning}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-tight">
                    Upload foto KTP penyewa untuk mengekstrak Nama, NIK, Tempat/Tgl Lahir, Jenis Kelamin, Agama, Pekerjaan & Alamat secara otomatis.
                  </p>

                  {/* Info Format & Ukuran File */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-600 bg-white/80 p-2 rounded-xl border border-gray-200/80">
                    <span className="font-bold text-gray-700">Format diizinkan:</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-semibold border border-gray-200">JPG</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-semibold border border-gray-200">JPEG</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-semibold border border-gray-200">PNG</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-semibold border border-gray-200">WEBP</span>
                    <span className="text-gray-400 font-medium ml-auto">Maks. 10 MB</span>
                  </div>
                </div>
              </div>

              {/* OCR Notice / Alert */}
              {ocrStatusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${ocrStatusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : ocrStatusMessage.type === 'warning'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                >
                  {ocrStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{ocrStatusMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Informasi Pribadi KTP */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <User className="h-4 w-4" /> Informasi Pribadi (Sesuai KTP)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nama Lengkap */}
              <div className="md:col-span-2">
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
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${errors.fullName ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
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
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${errors.nik ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                      }`}
                  />
                </div>
                {errors.nik && <p className="text-[11px] text-red-500 mt-1">{errors.nik}</p>}
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tempat, Tanggal Lahir
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={birthPlaceDate}
                    onChange={(e) => setBirthPlaceDate(e.target.value)}
                    placeholder="Contoh: Bandung, 15 Mei 1995"
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white"
                >
                  <option value="LAKI-LAKI">LAKI-LAKI</option>
                  <option value="PEREMPUAN">PEREMPUAN</option>
                </select>
              </div>

              {/* Golongan Darah */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Golongan Darah
                </label>
                <div className="relative">
                  <Activity className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">-</option>
                  </select>
                </div>
              </div>

              {/* Agama */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Agama
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white"
                >
                  <option value="ISLAM">ISLAM</option>
                  <option value="KRISTEN">KRISTEN</option>
                  <option value="KATHOLIK">KATHOLIK</option>
                  <option value="HINDU">HINDU</option>
                  <option value="BUDDHA">BUDDHA</option>
                  <option value="KHONGHUCU">KHONGHUCU</option>
                  <option value="LAINNYA">LAINNYA</option>
                </select>
              </div>

              {/* Status Perkawinan */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status Perkawinan
                </label>
                <div className="relative">
                  <Heart className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white"
                  >
                    <option value="BELUM KAWIN">BELUM KAWIN</option>
                    <option value="KAWIN">KAWIN</option>
                    <option value="CERAI HIDUP">CERAI HIDUP</option>
                    <option value="CERAI MATI">CERAI MATI</option>
                  </select>
                </div>
              </div>

              {/* Pekerjaan */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pekerjaan / Status Profesi
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    list="occupation-suggestions"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Contoh: PELAJAR/MAHASISWA atau KARYAWAN SWASTA"
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white"
                  />
                  <datalist id="occupation-suggestions">
                    <option value="KARYAWAN SWASTA" />
                    <option value="PELAJAR/MAHASISWA" />
                    <option value="PNS / ASN" />
                    <option value="WIRASWASTA" />
                    <option value="BELUM/TIDAK BEKERJA" />
                    <option value="BURUH HARIAN LEPAS" />
                    <option value="IBU RUMAH TANGGA" />
                  </datalist>
                </div>
              </div>

              {/* Kewarganegaraan */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Kewarganegaraan
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="WNI"
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Masa Berlaku KTP */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Masa Berlaku KTP
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    placeholder="SEUMUR HIDUP"
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Alamat KTP Lengkap */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <MapPin className="h-4 w-4" /> Alamat KTP Lengkap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Alamat KTP (Jalan/Dusun)</label>
                <input
                  type="text"
                  value={addressKtp}
                  onChange={(e) => setAddressKtp(e.target.value)}
                  placeholder="Contoh: Jl. Sunda No. 88"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">RT / RW</label>
                <input
                  type="text"
                  value={rtRw}
                  onChange={(e) => setRtRw(e.target.value)}
                  placeholder="002/005"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kelurahan / Desa</label>
                <input
                  type="text"
                  value={kelDesa}
                  onChange={(e) => setKelDesa(e.target.value)}
                  placeholder="Kebon Pisang"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  placeholder="Sumur Bandung"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kontak & Kontak Darurat */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Phone className="h-4 w-4" /> Kontak & Kontak Darurat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${errors.phoneNumber ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                      }`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#8FA28A] focus:bg-white'
                      }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white"
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

          {/* Section 4: Informasi Penempatan Unit */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-[#8FA28A] flex items-center gap-1.5">
                  <Building className="h-4 w-4" /> Informasi Penempatan Unit
                </h3>
                <p className="text-[11px] text-gray-500">Tentukan lokasi gedung & nomor kamar penyewa ini</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pilih Properti */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Properti / Gedung Kost
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedPropertyName}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    disabled={status !== 'AKTIF'}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Belum Penempatan (Calon) --</option>
                    {status === 'NONAKTIF' && selectedPropertyName && !propertiesList.some((p) => p.name === selectedPropertyName) && (
                      <option value={selectedPropertyName}>
                        {selectedPropertyName} (Historis)
                      </option>
                    )}
                    {propertiesList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pilih Kamar / Unit */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Kamar / Unit
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedUnitName}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    disabled={status !== 'AKTIF' || !selectedPropertyName}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {status === 'NONAKTIF' && selectedUnitName && !currentPropUnits.includes(selectedUnitName) && (
                      <option value={selectedUnitName}>
                        {selectedUnitName} (Historis)
                      </option>
                    )}
                    {currentPropUnits.length === 0 && (!selectedUnitName || status === 'AKTIF') ? (
                      <option value="">-- Tidak Ada Kamar Tersedia --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Kamar (Tersedia) --</option>
                        {currentPropUnits.map((u, idx) => (
                          <option key={idx} value={u}>
                            {u}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Tanggal Mulai Sewa */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tanggal Masuk / Mulai Sewa
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={leaseStartDate}
                    onChange={(e) => setLeaseStartDate(e.target.value)}
                    disabled={status !== 'AKTIF' || !selectedUnitName}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-[#8FA28A] focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {status === 'NONAKTIF' ? (
              <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900 font-medium">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {selectedPropertyName && selectedUnitName ? (
                    <>Riwayat penempatan terakhir penyewa ini adalah di <strong>{selectedPropertyName}</strong> &mdash; <strong>{selectedUnitName}</strong>. Data ini disimpan sebagai arsip historis.</>
                  ) : (
                    <>Status penyewa saat ini <strong>Nonaktif / Alumni</strong>. Riwayat kamar tersimpan sebagai arsip historis.</>
                  )}
                </span>
              </div>
            ) : status === 'CALON' ? (
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-medium">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Penempatan unit hanya berlaku untuk status <strong>Penyewa Aktif</strong>. Pilih status &quot;Penyewa Aktif&quot; di atas jika ingin menentukan lokasi kamar.
                </span>
              </div>
            ) : selectedUnitName ? (
              <div className="rounded-xl bg-emerald-50/80 p-2.5 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Ditempatkan di <strong>{selectedPropertyName}</strong> &mdash; <strong>{selectedUnitName}</strong></span>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-medium">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Silakan pilih properti &amp; nomor kamar kosong di atas untuk menempatkan penyewa ini.</span>
              </div>
            )}
          </div>

          {/* Section 5: Catatan */}
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
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#8FA28A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{tenantToEdit ? 'Menyimpan...' : 'Menyimpan & Upload KTP...'}</span>
                </>
              ) : tenantToEdit ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Penyewa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

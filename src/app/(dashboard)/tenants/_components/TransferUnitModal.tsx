'use client';

import React, { useState, useEffect } from 'react';
import { X, Building, Home, ArrowRightLeft, Calendar, FileText, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { Tenant } from '../_types';

interface TransferUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onConfirmTransfer: (tenantId: string, propertyName: string, unitName: string, startDate: string, notes?: string) => Promise<void> | void;
}

interface PropertyOption {
  id: string;
  name: string;
  units: string[];
}

// Database seed fallback matching owner's database
const DB_OWNER_PROPERTIES: PropertyOption[] = [
  {
    id: 'prop-db-1',
    name: 'Apartemen Gateway Pasteur Unit 12B',
    units: ['Apt 12B-01', 'Apt 12B-02', 'Apt 12B-03'],
  },
  {
    id: 'prop-db-2',
    name: 'Kos Graha Asri',
    units: ['Kamar 101', 'Kamar 102', 'Kamar 103', 'Kamar 104'],
  },
];

export default function TransferUnitModal({
  isOpen,
  onClose,
  tenant,
  onConfirmTransfer,
}: TransferUnitModalProps) {
  const [propertiesList, setPropertiesList] = useState<PropertyOption[]>(DB_OWNER_PROPERTIES);
  const [loadingProps, setLoadingProps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Fetch properties dynamically from /api/properties & filter out occupied units
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }

    const fetchProperties = async () => {
      setLoadingProps(true);
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

              if (t.id !== tenant?.id && tStatus === 'AKTIF') {
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

      // Check local storage for active tenants
      if (typeof window !== 'undefined') {
        const storedTenants = localStorage.getItem('arventa_tenants');
        if (storedTenants) {
          try {
            const parsedTenants = JSON.parse(storedTenants);
            if (Array.isArray(parsedTenants)) {
              parsedTenants.forEach((t: any) => {
                if (t.id !== tenant?.id && t.status === 'AKTIF' && t.currentUnitName) {
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
        console.warn('Notice: checking local storage for properties', err);
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
            let availableUnits: string[] = [];
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
              availableUnits = filtered.map((u: any) => typeof u === 'string' ? u : (u.name || u.unitNumber || ''));
            }
            return {
              id: p.id,
              name: p.name,
              units: availableUnits,
            };
          })
          .filter((p: PropertyOption) => p.units.length > 0);

        setPropertiesList(formatted);
        setLoadingProps(false);
      } else {
        setPropertiesList([]);
        setLoadingProps(false);
      }
    };

    fetchProperties();
  }, [isOpen, tenant]);

  // Set initial selections when tenant or propertiesList updates
  useEffect(() => {
    if (tenant && propertiesList.length > 0) {
      const firstPropWithUnits = propertiesList.find((p) => p.units.length > 0) || propertiesList[0];
      if (firstPropWithUnits) {
        setSelectedProperty(firstPropWithUnits.name);
        setSelectedUnit(firstPropWithUnits.units[0] || '');
      } else {
        setSelectedProperty('');
        setSelectedUnit('');
      }
    } else if (tenant) {
      setSelectedProperty('');
      setSelectedUnit('');
    }
  }, [tenant, propertiesList, isOpen]);

  // Update unit selection when property dropdown changes
  const currentPropData = propertiesList.find((p) => p.name === selectedProperty) || propertiesList[0] || { name: '', units: [] };

  const handlePropertyChange = (newPropName: string) => {
    setSelectedProperty(newPropName);
    const targetProp = propertiesList.find((p) => p.name === newPropName);
    if (targetProp && targetProp.units.length > 0) {
      setSelectedUnit(targetProp.units[0]);
    } else {
      setSelectedUnit('');
    }
  };

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !selectedUnit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirmTransfer(tenant.id, selectedProperty, selectedUnit, effectiveDate, transferNotes);
      onClose();
    } catch (err) {
      console.error('Error confirming unit transfer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#F7F4ED] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Pindah / Atur Penempatan Unit</h2>
              <p className="text-xs text-gray-500">
                Pindahkan penyewa <span className="font-bold text-gray-800">{tenant.fullName}</span> ke unit milik Owner
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 max-h-[calc(85vh-80px)]">
          {/* Unit Saat Ini */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Unit Terdaftar Saat Ini</span>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-gray-800">
                {tenant.currentPropertyName || 'Belum Ada Properti'} —{' '}
                <span className="text-[#8FA28A]">{tenant.currentUnitName || 'Belum Ada Kamar'}</span>
              </p>
            </div>
          </div>

          {/* Form Pindah Unit */}
          <div className="space-y-4 pt-1">
            {/* Pilih Properti */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Pilih Properti Tujuan <span className="text-red-500">*</span>
                </label>
                {loadingProps && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin text-[#8FA28A]" /> Memuat database...
                  </span>
                )}
              </div>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  value={selectedProperty}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  disabled={propertiesList.length === 0 || isSubmitting}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {propertiesList.length === 0 ? (
                    <option value="">-- Tidak Ada Properti Kosong --</option>
                  ) : (
                    propertiesList.map((prop) => (
                      <option key={prop.id} value={prop.name}>
                        {prop.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Pilih Kamar / Unit */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Pilih Kamar / Unit Tujuan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={currentPropData.units.length === 0 || isSubmitting}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {currentPropData.units.length === 0 ? (
                    <option value="">-- Tidak Ada Kamar Tersedia --</option>
                  ) : (
                    currentPropData.units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Tanggal Mulai Penempatan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Tanggal Mulai Penempatan Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>

            {/* Alasan / Catatan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Alasan Kepindahan / Catatan (Opsional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Contoh: Permintaan pindah kamar ke lantai 1, upgrade tipe kamar"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>

            {/* Status Auto Aktif Badge */}
            <div className="rounded-xl bg-emerald-50/80 p-2.5 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Status penyewa otomatis menjadi <strong>Penyewa Aktif</strong> saat dikonfirmasi.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
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
              disabled={isSubmitting || !selectedProperty || !selectedUnit}
              className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Konfirmasi Pindah Unit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

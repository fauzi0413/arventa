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

const normalizeUnitName = (name?: string) => {
  if (!name) return '';
  return name.toLowerCase().replace(/^(kamar|apt|unit)\s+/i, '').trim();
};

const isSameUnit = (nameA?: string, nameB?: string) => {
  if (!nameA || !nameB) return false;
  return normalizeUnitName(nameA) === normalizeUnitName(nameB);
};

export default function TransferUnitModal({
  isOpen,
  onClose,
  tenant,
  onConfirmTransfer,
}: TransferUnitModalProps) {
  const [propertiesList, setPropertiesList] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Fetch properties dynamically from /api/properties & filter out occupied units
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setPropertiesList([]);
      setSelectedProperty('');
      setSelectedUnit('');
      setLoadingProps(true);
      return;
    }

    const fetchProperties = async () => {
      setLoadingProps(true);
      setPropertiesList([]);
      setSelectedProperty('');
      setSelectedUnit('');
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
                  const clean = normalizeUnitName(uNum);
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
                  const clean = normalizeUnitName(uNum);
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
          if (Array.isArray(json.data)) {
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
                const cleanName = normalizeUnitName(rawName);
                const formattedName = /^(kamar|apt|unit)/i.test(rawName) ? rawName : `Kamar ${rawName}`;
                const rawStatus = typeof u === 'string' ? '' : String(u.status || '').toUpperCase();

                const isOccupiedInDb = rawStatus === 'OCCUPIED' || rawStatus === 'TERISI';
                const isOccupiedByActiveTenant = occupiedUnits.has(rawName) || occupiedUnits.has(cleanName) || occupiedUnits.has(formattedName);

                // Strictly exclude tenant's current unit from target transfer options
                const isCurrentTenantUnit = isSameUnit(rawName, tenant?.currentUnitName) &&
                  (p.name || '').toLowerCase().includes((tenant?.currentPropertyName || '').toLowerCase());

                if (isOccupiedInDb || isOccupiedByActiveTenant || isCurrentTenantUnit) {
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
        // Fallback to DB_OWNER_PROPERTIES if no custom properties returned
        const fallbackFormatted = DB_OWNER_PROPERTIES.map((p) => ({
          ...p,
          units: p.units.filter((u) => {
            const isOcc = occupiedUnits.has(u) || occupiedUnits.has(normalizeUnitName(u));
            const isCur = isSameUnit(u, tenant?.currentUnitName) && p.name.toLowerCase().includes((tenant?.currentPropertyName || '').toLowerCase());
            return !isOcc && !isCur;
          }),
        })).filter((p) => p.units.length > 0);
        setPropertiesList(fallbackFormatted);
        setLoadingProps(false);
      }
    };

    fetchProperties();
  }, [isOpen, tenant]);

  // Set initial selections synchronized with tenant's current property & available units
  useEffect(() => {
    if (!loadingProps && tenant && propertiesList.length > 0) {
      // Prefer tenant's current property if it has available target units
      const currentPropObj = propertiesList.find(
        (p) => p.name.toLowerCase() === (tenant.currentPropertyName || '').toLowerCase()
      ) || propertiesList.find((p) => tenant.currentPropertyName && p.name.toLowerCase().includes(tenant.currentPropertyName.toLowerCase()));

      if (currentPropObj && currentPropObj.units.length > 0) {
        setSelectedProperty(currentPropObj.name);
        setSelectedUnit(currentPropObj.units[0]);
      } else {
        // Otherwise select first property that has available units
        const firstPropWithUnits = propertiesList.find((p) => p.units.length > 0) || propertiesList[0];
        if (firstPropWithUnits) {
          setSelectedProperty(firstPropWithUnits.name);
          setSelectedUnit(firstPropWithUnits.units[0] || '');
        } else {
          setSelectedProperty('');
          setSelectedUnit('');
        }
      }
    } else if (!loadingProps) {
      setSelectedProperty('');
      setSelectedUnit('');
    }
  }, [tenant, propertiesList, isOpen, loadingProps]);

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
    if (!selectedProperty || !selectedUnit || isSubmitting || loadingProps) return;
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
      <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl border border-border flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A] text-white shadow-md">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Pindah / Atur Penempatan Unit</h2>
              <p className="text-xs text-muted-foreground">
                Pindahkan penyewa <span className="font-bold text-foreground">{tenant.fullName}</span> ke unit milik Owner
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 max-h-[calc(85vh-80px)]">
          {/* Unit Saat Ini */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Unit Terdaftar Saat Ini</span>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-foreground">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Pilih Properti Tujuan <span className="text-red-500">*</span>
                </label>
                {loadingProps && (
                  <span className="text-[11px] text-[#8FA28A] font-bold flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat database...
                  </span>
                )}
              </div>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedProperty}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  disabled={loadingProps || propertiesList.length === 0 || isSubmitting}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-semibold text-foreground focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {loadingProps ? (
                    <option value="">-- Memuat database properti... --</option>
                  ) : propertiesList.length === 0 ? (
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
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                Pilih Kamar / Unit Tujuan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={loadingProps || currentPropData.units.length === 0 || isSubmitting}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-semibold text-foreground focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {loadingProps ? (
                    <option value="">-- Memuat unit kamar... --</option>
                  ) : currentPropData.units.length === 0 ? (
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
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                Tanggal Mulai Penempatan Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  disabled={isSubmitting || loadingProps}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-semibold text-foreground focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-muted disabled:text-muted-foreground"
                />
              </div>
            </div>

            {/* Alasan / Catatan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                Alasan Kepindahan / Catatan (Opsional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  disabled={isSubmitting || loadingProps}
                  placeholder="Contoh: Permintaan pindah kamar ke lantai 1, upgrade tipe kamar"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-medium text-foreground focus:border-[#8FA28A] focus:outline-none transition-all disabled:bg-muted disabled:text-muted-foreground"
                />
              </div>
            </div>

            {/* Status Auto Aktif Badge */}
            <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Status penyewa otomatis menjadi <strong>Penyewa Aktif</strong> saat dikonfirmasi.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingProps || isSubmitting || !selectedProperty || !selectedUnit}
              className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : loadingProps ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat Database...
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

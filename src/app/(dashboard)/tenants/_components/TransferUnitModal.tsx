'use client';

import React, { useState, useEffect } from 'react';
import { X, Building, Home, ArrowRightLeft, Calendar, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { Tenant } from '../_types';

interface TransferUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onConfirmTransfer: (tenantId: string, propertyName: string, unitName: string, startDate: string, notes?: string) => void;
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
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Fetch properties dynamically from /api/properties
  useEffect(() => {
    if (!isOpen) return;

    const fetchProperties = async () => {
      setLoadingProps(true);
      try {
        const res = await fetch('/api/properties?limit=50');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            const formatted: PropertyOption[] = json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              units: Array.isArray(p.units) && p.units.length > 0
                ? p.units.map((u: any) => u.unitNumber)
                : ['Kamar 101', 'Kamar 102'],
            }));
            setPropertiesList(formatted);
            setLoadingProps(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Notice: using database properties list fallback', err);
      }
      setPropertiesList(DB_OWNER_PROPERTIES);
      setLoadingProps(false);
    };

    fetchProperties();
  }, [isOpen]);

  // Set initial selections when tenant or propertiesList updates
  useEffect(() => {
    if (tenant && propertiesList.length > 0) {
      const matchedProp = propertiesList.find((p) => p.name === tenant.currentPropertyName) || propertiesList[0];
      setSelectedProperty(matchedProp.name);
      
      const matchedUnit = matchedProp.units.find((u) => u === tenant.currentUnitName) || matchedProp.units[0] || '';
      setSelectedUnit(matchedUnit);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmTransfer(tenant.id, selectedProperty, selectedUnit, effectiveDate, transferNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-[#F7F4ED]">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all"
                >
                  {propertiesList.map((prop) => (
                    <option key={prop.id} value={prop.name}>
                      {prop.name}
                    </option>
                  ))}
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
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all"
                >
                  {currentPropData.units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
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
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all"
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
                  placeholder="Contoh: Permintaan pindah kamar ke lantai 1, upgrade tipe kamar"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-gray-800 focus:border-[#8FA28A] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#7D9178] transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              Konfirmasi Pindah Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Layers, User, Phone, Calendar, Info, Package, ShieldAlert, Award, Compass, DollarSign } from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';
import { Property, InventoryItem, InventoryCondition } from '@/app/(dashboard)/properties/_types';

const CONDITION_BADGE_STYLE = (cond: InventoryCondition) => {
  switch (cond) {
    case 'Baik':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Perlu Perbaikan':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Rusak Berat':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Hilang':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const DEFAULT_INVENTORIES = (propertyId: string, unitId: string, unitName: string): InventoryItem[] => [
  {
    id: `inv-1-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Air Conditioner (AC) 1 PK',
    condition: 'Baik',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: `inv-2-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Kasur Springbed Queen Size',
    condition: 'Baik',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: `inv-3-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Lemari Pakaian Kayu 2 Pintu',
    condition: 'Baik',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: `inv-4-${unitId}`,
    propertyId,
    unitId,
    unitName,
    name: 'Meja Kerja & Kursi Ergonomis',
    condition: 'Perlu Perbaikan',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600',
    lastUpdated: new Date().toISOString(),
  }
];

export default function PropertyUnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const unitId = params?.unitId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');
    const storedInventory = localStorage.getItem('arventa_inventory');

    let loadedProps: Property[] = [];
    let loadedUnits: Unit[] = [];
    let loadedInventory: InventoryItem[] = [];

    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedUnits) loadedUnits = JSON.parse(storedUnits);
    if (storedInventory) loadedInventory = JSON.parse(storedInventory);

    const foundProp = loadedProps.find((p) => p.id === propertyId);
    const foundUnit = loadedUnits.find((u) => u.id === unitId);

    // Filter inventories specifically for this unit
    let unitInventory = loadedInventory.filter((item) => item.unitId === unitId);

    // If no inventory exists for this unit yet, seed default ones and save to localStorage
    if (unitInventory.length === 0 && foundProp && foundUnit) {
      const defaults = DEFAULT_INVENTORIES(propertyId, unitId, foundUnit.name);
      const updatedMasterInventory = [...loadedInventory, ...defaults];
      localStorage.setItem('arventa_inventory', JSON.stringify(updatedMasterInventory));
      unitInventory = defaults;
    }

    const timer = setTimeout(() => {
      setProperty(foundProp || null);
      setUnit(foundUnit || null);
      setInventories(unitInventory);
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [propertyId, unitId]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Memuat spesifikasi unit...</p>
        </div>
      </div>
    );
  }

  if (!unit || !property) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center rounded-2xl border border-[#C7D3C0]/40 bg-[#F7F4ED] p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Unit Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Unit atau properti tidak terdaftar dalam database atau telah dihapus.
        </p>
        <Link
          href={`/properties/${propertyId}`}
          className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Detail Properti
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[90vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-[#C7D3C0]/30 pb-4">
        <Link
          href={`/properties/${propertyId}`}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#8FA28A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke {property.name}
        </Link>

        <span className="text-xs font-bold text-gray-400">Pratinjau Unit Kamar</span>
      </div>

      {/* Main Grid: Details & Side Column */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns: Specifications & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unit Spec Title Card */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-gray-800">{unit.name}</h2>
                  <span className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                    unit.status === 'Available' ? 'bg-[#8FA28A] text-white' :
                    unit.status === 'Occupied' ? 'bg-blue-600 text-white' :
                    unit.status === 'Need Cleaning' ? 'bg-[#C8A96B] text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {unit.status === 'Available' ? 'Tersedia' :
                     unit.status === 'Occupied' ? 'Terisi' :
                     unit.status === 'Need Cleaning' ? 'Perlu Bersih-Bersih' :
                     'Maintenance'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span>{property.name} • Lantai {unit.capacity?.dimensions ? 'Dasar/Atas' : '1'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-xs font-bold text-gray-400 uppercase">Tarif Sewa</span>
                <p className="text-xl font-black text-[#8FA28A]">{formatRupiah(unit.pricing.monthly)}<span className="text-xs font-normal text-gray-400">/bln</span></p>
              </div>
            </div>

            {/* Quick Metrics (Dimensions & Max Person) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/20 space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-[#8FA28A]" /> Dimensi Kamar
                </span>
                <p className="text-base font-black text-gray-800">{unit.capacity.dimensions}</p>
              </div>
              <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/20 space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#8FA28A]" /> Kapasitas Maksimal
                </span>
                <p className="text-base font-black text-gray-800">{unit.capacity.maxPersons} Orang</p>
              </div>
            </div>

            {/* Facilities Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#8FA28A]" />
                Fasilitas Unit Kamar
              </h3>
              {unit.facilities.length === 0 ? (
                <p className="text-xs text-gray-400">Tidak ada fasilitas terdaftar.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unit.facilities.map((fac) => (
                    <span
                      key={fac}
                      className="rounded-xl bg-[#C7D3C0]/20 border border-[#C7D3C0]/40 px-3.5 py-1.5 text-xs font-bold text-[#6A7866]"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes/Description */}
            {unit.description && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Catatan Tambahan</span>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {unit.description}
                </p>
              </div>
            )}
          </div>

          {/* Unit Inventory List */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#8FA28A]" />
              Daftar Inventaris & Foto Kondisi Barang
            </h3>
            <p className="text-xs text-gray-500">
              Berikut kondisi aset/furnitur di dalam unit sebelum masa sewa dimulai untuk transparansi penyewa.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {inventories.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow transition-shadow flex flex-col">
                  {/* Photo Condition */}
                  <div className="relative h-44 w-full bg-gray-100">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${
                        CONDITION_BADGE_STYLE(item.condition)
                      }`}>
                        {item.condition}
                      </span>
                    </div>
                  </div>

                  {/* Item Specs */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black text-gray-800 line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Terakhir diverifikasi: {new Date(item.lastUpdated).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="text-[11px] text-[#8FA28A] font-semibold mt-3 pt-2 border-t border-gray-50">
                      ✓ Aset Milik Properti {property.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Column: Pricing details & Active Tenant */}
        <div className="space-y-6">
          {/* Financials & Deposits */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <DollarSign className="h-5 w-5 text-[#8FA28A]" />
              Tarif & Deposit Sewa
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Sewa Bulanan (Base)</span>
                <span className="text-sm font-black text-gray-800">{formatRupiah(unit.pricing.monthly)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Sewa Harian (Transit)</span>
                <span className="text-sm font-black text-gray-800">
                  {unit.pricing.daily ? formatRupiah(unit.pricing.daily) : 'Tidak Tersedia'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">Uang Jaminan / Deposit</span>
                <span className="text-sm font-black text-[#C8A96B]">{formatRupiah(unit.pricing.deposit)}</span>
              </div>

              {unit.pricing.utilities && (
                <div className="bg-[#F7F4ED] p-3 rounded-xl border border-[#C7D3C0]/20 space-y-1 mt-2">
                  <span className="text-[10px] font-bold text-[#8FA28A] uppercase tracking-wider block">Aturan Utilitas</span>
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed">{unit.pricing.utilities}</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Tenant Box */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <User className="h-5 w-5 text-[#8FA28A]" />
              Informasi Penyewa Kamar
            </h3>

            {unit.status === 'Occupied' && unit.tenantName ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/60">
                  <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {unit.tenantName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">{unit.tenantName}</h4>
                    <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Aktif Menghuni</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  {unit.tenantPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" /> WhatsApp
                      </span>
                      <strong className="text-gray-800">{unit.tenantPhone}</strong>
                    </div>
                  )}

                  {unit.checkInDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" /> Tanggal Masuk
                      </span>
                      <strong className="text-gray-800">
                        {new Date(unit.checkInDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#C7D3C0] bg-gray-50 p-6 text-center text-xs text-gray-400">
                Unit saat ini dalam keadaan kosong dan siap untuk dipasarkan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

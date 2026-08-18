'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2, Calendar, ShieldAlert, Phone, UserCheck, DollarSign, KeyRound } from 'lucide-react';
import { Unit, UnitStatus } from '../_types';
import UnitFormModal from '../_components/UnitFormModal';
import { Property } from '../../properties/_types';
import { useSafeBack } from '@/app/_hooks/useSafeBack';

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const handleSafeBack = useSafeBack('/units');

  const [unit, setUnit] = useState<Unit | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');

    let loadedProps: Property[] = [];
    let loadedUnits: Unit[] = [];

    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedUnits) loadedUnits = JSON.parse(storedUnits);

    const found = loadedUnits.find((u) => u.id === id);

    const timer = setTimeout(() => {
      setProperties(loadedProps);
      if (found) {
        setUnit(found);
      }
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Memuat detail unit...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-[#C7D3C0]/40 bg-[#F7F4ED] p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Unit Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Unit kamar yang Anda cari tidak terdaftar atau telah dihapus.
        </p>
        <button
          type="button"
          onClick={handleSafeBack}
          className="mt-4 min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Unit
        </button>
      </div>
    );
  }

  const property = properties.find((p) => p.id === unit.propertyId);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleEditUnit = (data: Omit<Unit, 'id' | 'createdAt'>) => {
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id ? { ...u, ...data } : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({ ...unit, ...data });
    }
  };

  const handleDeleteUnit = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      const storedUnits = localStorage.getItem('arventa_units');
      if (storedUnits) {
        const allUnits: Unit[] = JSON.parse(storedUnits);
        const updated = allUnits.filter((u) => u.id !== unit.id);
        localStorage.setItem('arventa_units', JSON.stringify(updated));
        router.push('/units');
      }
    }
  };

  const updateStatus = (newStatus: UnitStatus) => {
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id ? { ...u, status: newStatus } : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({ ...unit, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[90vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#8FA28A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Listing Unit
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-[#C7D3C0] bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/20 transition-all shadow-sm"
          >
            <Edit3 className="h-4 w-4 text-[#8FA28A]" />
            Ubah Unit
          </button>
          <button
            onClick={handleDeleteUnit}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            Hapus Unit
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Card: Core Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800">{unit.name}</h2>
                <p className="text-sm font-semibold text-gray-400 mt-1">{property?.name || 'Properti Lain'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{property?.address}</p>
              </div>

              {/* Status Badge */}
              <span className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                unit.status === 'Available' ? 'bg-[#8FA28A] text-white' :
                unit.status === 'Occupied' ? 'bg-blue-600 text-white' :
                unit.status === 'Need Cleaning' ? 'bg-[#C8A96B] text-white' :
                unit.status === 'Reserved' ? 'bg-purple-600 text-white' :
                'bg-red-600 text-white'
              }`}>
                {unit.status === 'Available' ? 'Tersedia' :
                 unit.status === 'Occupied' ? 'Terisi' :
                 unit.status === 'Need Cleaning' ? 'Perlu Dibersihkan' :
                 unit.status === 'Reserved' ? 'Reserved' :
                 'Perbaikan'}
              </span>
            </div>

            {/* Capacity & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/20 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Kapasitas Maksimal</span>
                <p className="text-base font-black text-gray-800">{unit.capacity.maxPersons} Orang</p>
              </div>
              <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/20 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ukuran / Dimensi</span>
                <p className="text-base font-black text-gray-800">{unit.capacity.dimensions}</p>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-[#8FA28A]" /> Skema Harga & Penagihan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Sewa Bulanan</span>
                  <span className="text-base font-black text-[#8FA28A]">{formatRupiah(unit.pricing.monthly)}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Sewa Harian</span>
                  <span className="text-sm font-bold text-gray-700">
                    {unit.pricing.daily ? formatRupiah(unit.pricing.daily) : 'Tidak disewakan harian'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Deposit Jaminan</span>
                  <span className="text-sm font-bold text-gray-700">{formatRupiah(unit.pricing.deposit)}</span>
                </div>
              </div>
              {unit.pricing.utilities && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-800 font-semibold">
                  Catatan Biaya: {unit.pricing.utilities}
                </div>
              )}
            </div>

            {/* Facilities */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Fasilitas Kamar</h3>
              <div className="flex flex-wrap gap-2">
                {unit.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="rounded-xl bg-[#C7D3C0]/20 px-3 py-1.5 text-xs font-bold text-[#6A7866] border border-[#C7D3C0]/40"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Deskripsi / Catatan</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{unit.description || 'Tidak ada deskripsi tambahan.'}</p>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Status & Tenant Summary */}
        <div className="space-y-6">
          {/* Quick Status Control */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Ubah Status Cepat</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStatus('Available')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Available' ? 'bg-[#8FA28A] text-white border-[#8FA28A]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => updateStatus('Occupied')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Occupied' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Terisi
              </button>
              <button
                type="button"
                onClick={() => updateStatus('Need Cleaning')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Need Cleaning' ? 'bg-[#C8A96B] text-white border-[#C8A96B]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Kotor
              </button>
              <button
                type="button"
                onClick={() => updateStatus('Maintenance')}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  unit.status === 'Maintenance' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Perbaikan
              </button>
            </div>
          </div>

          {/* Tenant Details Card */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#8FA28A]" /> Data Penghuni Aktif
            </h3>
            {unit.status === 'Occupied' && unit.tenantName ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                  <div>
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Nama Penyewa</span>
                    <span className="text-sm font-black text-gray-800">{unit.tenantName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">No. WhatsApp</span>
                    <span className="font-bold text-gray-700">{unit.tenantPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Tanggal Masuk</span>
                    <span className="font-bold text-gray-700">{unit.checkInDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Kamar ini saat ini belum memiliki penghuni terdaftar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Edit Modal */}
      {properties.length > 0 && isFormOpen && (
        <UnitFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleEditUnit}
          initialData={unit}
          properties={properties}
        />
      )}
    </div>
  );
}

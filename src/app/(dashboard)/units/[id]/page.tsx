'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2, Calendar, ShieldAlert, Phone, UserCheck, DollarSign, KeyRound } from 'lucide-react';
import { Unit, UnitStatus } from '../_types';
import UnitFormModal from '../_components/UnitFormModal';
import { Property } from '../../properties/_types';

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

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
        <Link
          href="/units"
          className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Unit
        </Link>
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
    <div className="space-y-6 bg-[#F7F4ED] min-h-[90vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <Link
          href="/units"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#8FA28A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Listing Unit
        </Link>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#C7D3C0] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/20 transition-all shadow-sm"
          >
            <Edit3 className="h-4 w-4 text-[#8FA28A]" />
            Ubah Unit
          </button>
          <button
            onClick={handleDeleteUnit}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"
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
                'bg-red-600 text-white'
              }`}>
                {unit.status === 'Available' ? 'Tersedia' :
                 unit.status === 'Occupied' ? 'Terisi' :
                 unit.status === 'Need Cleaning' ? 'Perlu Dibersihkan' :
                 'Perbaikan'}
              </span>
            </div>

            {/* Capacity & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/20 space-y-1">
                <span className="block text-xs font-bold text-gray-400 uppercase">Kapasitas Maksimal</span>
                <p className="text-base font-black text-gray-800">{unit.capacity.maxPersons} Orang</p>
              </div>
              <div className="bg-[#F7F4ED] rounded-xl p-4 border border-[#C7D3C0]/20 space-y-1">
                <span className="block text-xs font-bold text-gray-400 uppercase">Dimensi Kamar</span>
                <p className="text-base font-black text-gray-800">{unit.capacity.dimensions}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Keterangan Unit</span>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {unit.description || 'Tidak ada deskripsi/catatan khusus untuk unit ini.'}
              </p>
            </div>

            {/* Predefined facilities list */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Fasilitas yang Tersedia</span>
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
          </div>

          {/* Tenant Status Section */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <UserCheck className="h-5 w-5 text-[#8FA28A]" />
              Status Penyewa
            </h3>

            {unit.status === 'Occupied' && unit.tenantName ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/60">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="text-sm font-black text-gray-800">{unit.tenantName}</h4>
                    <p className="text-xs text-gray-500">Penyewa Aktif</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {unit.tenantPhone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>No. Handphone: <strong className="text-gray-800">{unit.tenantPhone}</strong></span>
                    </div>
                  )}
                  {unit.checkInDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Tanggal Check-In: <strong className="text-gray-800">{unit.checkInDate}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#C7D3C0] bg-gray-50 p-6 text-center text-xs text-gray-400">
                Unit saat ini kosong. Tidak ada penyewa aktif yang terdaftar.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Quick Status Controls */}
        <div className="space-y-6">
          {/* Pricing Box */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <DollarSign className="h-5 w-5 text-[#8FA28A]" />
              Struktur Tarif & Biaya
            </h3>

            <div className="space-y-4">
              {/* Monthly */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-xs font-semibold text-gray-500">Tarif Bulanan</span>
                <span className="text-sm font-black text-[#8FA28A]">{formatRupiah(unit.pricing.monthly)}</span>
              </div>

              {/* Daily */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-xs font-semibold text-gray-500">Tarif Harian</span>
                <span className="text-sm font-black text-gray-700">
                  {unit.pricing.daily ? formatRupiah(unit.pricing.daily) : '-'}
                </span>
              </div>

              {/* Deposit */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-xs font-semibold text-gray-500">Uang Jaminan / Deposit</span>
                <span className="text-sm font-black text-[#C8A96B]">{formatRupiah(unit.pricing.deposit)}</span>
              </div>

              {/* Utilities */}
              {unit.pricing.utilities && (
                <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Keterangan Utilitas</span>
                  <p className="text-xs text-gray-600">{unit.pricing.utilities}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Status Control */}
          <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-[#8FA28A]" />
              Ubah Status Cepat
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => updateStatus('Available')}
                disabled={unit.status === 'Available'}
                className="rounded-xl border border-gray-200 bg-white py-2.5 text-center text-gray-700 hover:bg-gray-50 disabled:bg-[#8FA28A] disabled:text-white transition-all disabled:border-transparent"
              >
                Tersedia
              </button>
              <button
                onClick={() => updateStatus('Occupied')}
                disabled={unit.status === 'Occupied'}
                className="rounded-xl border border-gray-200 bg-white py-2.5 text-center text-gray-700 hover:bg-gray-50 disabled:bg-blue-600 disabled:text-white transition-all disabled:border-transparent"
              >
                Terisi
              </button>
              <button
                onClick={() => updateStatus('Need Cleaning')}
                disabled={unit.status === 'Need Cleaning'}
                className="rounded-xl border border-gray-200 bg-white py-2.5 text-center text-gray-700 hover:bg-gray-50 disabled:bg-[#C8A96B] disabled:text-white transition-all disabled:border-transparent"
              >
                Cleaning
              </button>
              <button
                onClick={() => updateStatus('Maintenance')}
                disabled={unit.status === 'Maintenance'}
                className="rounded-xl border border-gray-200 bg-white py-2.5 text-center text-gray-700 hover:bg-gray-50 disabled:bg-red-600 disabled:text-white transition-all disabled:border-transparent"
              >
                Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal for Edit */}
      {properties.length > 0 && (
        <UnitFormModal
          key={unit.id}
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

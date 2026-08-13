'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, ShieldAlert, CheckCircle2, RefreshCw, LayoutGrid, ArrowLeftRight, Edit3 } from 'lucide-react';
import { Unit, UnitStatus } from '../../units/_types';
import { Property } from '../../properties/_types';
import QuickUpdateModal from './_components/QuickUpdateModal';
import RoomTransferModal from './_components/RoomTransferModal';
import { TenantCredential } from '../../tenants/_types';

export default function HousekeepingRoomGridPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');

    let loadedProps: Property[] = [];
    let loadedUnits: Unit[] = [];

    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedUnits) loadedUnits = JSON.parse(storedUnits);

    setProperties(loadedProps);
    setUnits(loadedUnits);
    setLoading(false);
  };

  const saveUnits = (updatedList: Unit[]) => {
    setUnits(updatedList);
    localStorage.setItem('arventa_units', JSON.stringify(updatedList));
  };

  // 1-Click Fast Cleaning status changer (e.g. from Need Cleaning directly to Available)
  const handleFastClean = (unitId: string) => {
    const updated = units.map((u) => {
      if (u.id === unitId) {
        return { ...u, status: 'Available' as UnitStatus };
      }
      return u;
    });
    saveUnits(updated);
  };

  const handleUpdateStatus = (unitId: string, newStatus: UnitStatus) => {
    const updated = units.map((u) => {
      if (u.id === unitId) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveUnits(updated);
    setIsUpdateOpen(false);
    setSelectedUnit(null);
  };

  const handleCheckout = (unitId: string) => {
    const updated = units.map((u) => {
      if (u.id === unitId) {
        // Clear tenant details and change status to Need Cleaning
        const { tenantName, tenantPhone, checkInDate, ...rest } = u;
        return {
          ...rest,
          status: 'Need Cleaning' as UnitStatus
        };
      }
      return u;
    });
    
    saveUnits(updated);

    // Remove login credentials linked to this unit
    const storedCreds = localStorage.getItem('arventa_tenants');
    if (storedCreds) {
      const creds: Record<string, TenantCredential> = JSON.parse(storedCreds);
      if (creds[unitId]) {
        delete creds[unitId];
        localStorage.setItem('arventa_tenants', JSON.stringify(creds));
      }
    }

    setIsUpdateOpen(false);
    setSelectedUnit(null);
  };

  const handleTransfer = (sourceUnitId: string, targetUnitId: string) => {
    const sourceUnit = units.find((u) => u.id === sourceUnitId);
    const targetUnit = units.find((u) => u.id === targetUnitId);
    
    if (!sourceUnit || !targetUnit) return;

    // Shift tenant info to target unit
    const updated = units.map((u) => {
      if (u.id === sourceUnitId) {
        // Clear tenant details from old room & flag as Need Cleaning
        const { tenantName, tenantPhone, checkInDate, ...rest } = u;
        return {
          ...rest,
          status: 'Need Cleaning' as UnitStatus
        };
      }
      if (u.id === targetUnitId) {
        // Assign tenant details to new room & flag as Occupied
        return {
          ...u,
          status: 'Occupied' as UnitStatus,
          tenantName: sourceUnit.tenantName,
          tenantPhone: sourceUnit.tenantPhone,
          checkInDate: sourceUnit.checkInDate
        };
      }
      return u;
    });

    saveUnits(updated);

    // Transfer access credentials in localStorage as well
    const storedCreds = localStorage.getItem('arventa_tenants');
    if (storedCreds) {
      const creds: Record<string, TenantCredential> = JSON.parse(storedCreds);
      if (creds[sourceUnitId]) {
        // Copy credentials to new unit id
        const userCred = creds[sourceUnitId];
        // Auto-update WiFi SSID to match the new room naming convention
        userCred.wifiSsid = `WiFi_${getPropName(targetUnit.propertyId).replace(/\s+/g, '')}_${targetUnit.name.replace(/\s+/g, '')}`;
        
        creds[targetUnitId] = userCred;
        delete creds[sourceUnitId];
        localStorage.setItem('arventa_tenants', JSON.stringify(creds));
      }
    }
  };

  const getPropName = (propId: string) => {
    return properties.find((p) => p.id === propId)?.name || 'Properti Lain';
  };

  // Filter Logic
  const filteredUnits = units.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.tenantName && u.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesProperty = selectedPropertyId === 'all' || u.propertyId === selectedPropertyId;
    const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;
    
    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getStatusBadgeStyle = (status: UnitStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-[#8FA28A]/15 text-[#6A7866] border-[#8FA28A]/35';
      case 'Occupied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Need Cleaning':
        return 'bg-[#C8A96B]/15 text-[#C8A96B] border-[#C8A96B]/35';
      case 'Maintenance':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getCardBorderStyle = (status: UnitStatus) => {
    switch (status) {
      case 'Available':
        return 'hover:border-[#8FA28A] border-l-4 border-l-[#8FA28A]';
      case 'Occupied':
        return 'hover:border-blue-300 border-l-4 border-l-blue-600';
      case 'Need Cleaning':
        return 'hover:border-[#C8A96B] border-l-4 border-l-[#C8A96B]';
      case 'Maintenance':
        return 'hover:border-red-300 border-l-4 border-l-red-600';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Memuat dashboard housekeeping...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Dashboard Visual Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-[#8FA28A]" />
            Dashboard Housekeeping Kamar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualisasi status kebersihan kamar, check-out sewa cepat, pindah kamar (Room Transfer), dan perbaikan unit.
          </p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama kamar atau penyewa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Property Dropdown Filter */}
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Properti</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Available">Tersedia (Available)</option>
            <option value="Occupied">Terisi (Occupied)</option>
            <option value="Need Cleaning">Butuh Pembersihan</option>
            <option value="Maintenance">Perbaikan (Maintenance)</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm space-y-3">
          <ShieldAlert className="h-10 w-10 text-[#C8A96B] mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">Tidak Ada Properti Ditemukan</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Anda harus mendaftarkan properti terlebih dahulu sebelum bisa memantau status housekeeping unit.
          </p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400">Tidak ada unit kamar ditemukan. Coba reset filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        /* ROOM CARD GRID */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUnits.map((unit) => {
            const isNeedCleaning = unit.status === 'Need Cleaning';
            const isOccupied = unit.status === 'Occupied';

            return (
              <div
                key={unit.id}
                className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow transition-all duration-250 flex flex-col justify-between ${
                  getCardBorderStyle(unit.status)
                }`}
              >
                {/* Upper Body */}
                <div className="p-4 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-gray-800">{unit.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{getPropName(unit.propertyId)}</p>
                    </div>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      getStatusBadgeStyle(unit.status)
                    }`}>
                      {unit.status === 'Available' ? 'Tersedia' :
                       unit.status === 'Occupied' ? 'Terisi' :
                       unit.status === 'Need Cleaning' ? 'Kotor' :
                       'Perbaikan'}
                    </span>
                  </div>

                  {/* Tenant / Status Details */}
                  {isOccupied && unit.tenantName ? (
                    <div className="bg-blue-50/40 rounded-xl border border-blue-100/50 p-2.5 space-y-1">
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">Penyewa Aktif</span>
                      <p className="text-xs font-black text-gray-700">{unit.tenantName}</p>
                      <p className="text-[10px] text-gray-400 font-medium">Masuk: {unit.checkInDate}</p>
                    </div>
                  ) : isNeedCleaning ? (
                    <div className="bg-amber-50/40 rounded-xl border border-amber-100/50 p-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-[#C8A96B] uppercase tracking-wide block">Kondisi Kamar</span>
                        <p className="text-[10px] text-gray-500 font-semibold leading-none">Butuh Pembersihan Cepat</p>
                      </div>
                      
                      {/* Fast Clean Trigger (1-Click Update "Need Cleaning" -> "Available") */}
                      <button
                        onClick={() => handleFastClean(unit.id)}
                        className="rounded-lg bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white p-1.5 transition-all shadow-sm hover:shadow"
                        title="1-Klik Bersihkan Kamar"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#F7F4ED] rounded-xl border border-[#C7D3C0]/25 p-2.5 space-y-1">
                      <span className="text-[9px] font-bold text-[#6A7866] uppercase tracking-wide">Info Tambahan</span>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed truncate">
                        {unit.description || 'Tidak ada instruksi khusus.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lower Action bar */}
                <div className="border-t border-gray-100 bg-gray-50/60 p-3.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setIsUpdateOpen(true);
                    }}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-center text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#8FA28A]" />
                    Status
                  </button>

                  {isOccupied && (
                    <button
                      onClick={() => {
                        setSelectedUnit(unit);
                        setIsTransferOpen(true);
                      }}
                      className="rounded-xl border border-[#C7D3C0] bg-white px-3 py-2 text-center text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/20 transition-all flex items-center justify-center gap-1.5"
                      title="Pindahkan Penyewa (Transfer)"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5 text-[#8FA28A]" />
                      Pindah
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK STATUS UPDATE MODAL */}
      <QuickUpdateModal
        isOpen={isUpdateOpen}
        onClose={() => {
          setIsUpdateOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
        onUpdateStatus={handleUpdateStatus}
        onCheckout={handleCheckout}
      />

      {/* ROOM TRANSFER MODAL */}
      <RoomTransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setSelectedUnit(null);
        }}
        sourceUnit={selectedUnit}
        availableUnits={units.filter((u) => u.status === 'Available')}
        properties={properties}
        onTransfer={handleTransfer}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShieldAlert, CheckCircle2, LayoutGrid, ArrowLeftRight, Edit3, ClipboardList } from 'lucide-react';
import { Unit, UnitStatus } from '../../units/_types';
import { Property } from '../../properties/_types';
import QuickUpdateModal from './_components/QuickUpdateModal';
import RoomTransferModal from './_components/RoomTransferModal';
import { TenantCredential } from '../../tenants/_types';

export default function HousekeepingRoomGridPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters for Room Grid
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state for Room Grid
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, unitsRes] = await Promise.all([
        fetch('/api/properties?limit=50'),
        fetch('/api/units?limit=100'),
      ]);

      let loadedProps: Property[] = [];
      let loadedUnits: Unit[] = [];

      if (propsRes.ok) {
        const pJson = await propsRes.json();
        if (Array.isArray(pJson.data)) {
          loadedProps = pJson.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            address: `${p.address}${p.city ? `, ${p.city}` : ''}`,
            categoryId:
              p.type === 'APARTEMEN'
                ? 'cat-2'
                : p.type === 'KONTRAKAN'
                ? 'cat-3'
                : p.type === 'RUKO'
                ? 'cat-4'
                : 'cat-1',
            statusId: 'st-1',
            totalUnits: p._count?.units || p.units?.length || 0,
            occupiedUnits:
              p.units?.filter((u: any) => u.status === 'OCCUPIED' || u.status === 'Occupied')
                .length || 0,
            description: p.description || '',
            imageUrl: p.coverImage || '',
            createdAt: p.createdAt || new Date().toISOString(),
          }));
        }
      }

      if (unitsRes.ok) {
        const uJson = await unitsRes.json();
        if (Array.isArray(uJson.data)) {
          const statusMap: Record<string, UnitStatus> = {
            AVAILABLE: 'Available',
            OCCUPIED: 'Occupied',
            MAINTENANCE: 'Maintenance',
            CLEANING: 'Need Cleaning',
            NEED_CLEANING: 'Need Cleaning',
          };
          loadedUnits = uJson.data.map((u: any) => ({
            id: u.id,
            propertyId: u.propertyId,
            name: u.unitNumber || u.name,
            status: statusMap[u.status] || (u.status as UnitStatus) || 'Available',
            pricing: {
              monthly: Number(u.basePrice) || 0,
              daily: Number(u.transitPrice) || 0,
              deposit: Number(u.deposit) || 0,
            },
            facilities: u.facilities || [],
            tenantName:
              u.leases?.[0]?.tenant?.user?.fullName || u.leases?.[0]?.tenant?.fullName || '',
            tenantPhone:
              u.leases?.[0]?.tenant?.user?.phoneNumber || u.leases?.[0]?.tenant?.phoneNumber || '',
            checkInDate: u.leases?.[0]?.startDate
              ? new Date(u.leases[0].startDate).toISOString().split('T')[0]
              : '',
            createdAt: u.createdAt || new Date().toISOString(),
          }));
        }
      }

      if (loadedProps.length > 0 || loadedUnits.length > 0) {
        setProperties(loadedProps);
        setUnits(loadedUnits);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Failed to load from API in room grid, using local storage cache', e);
    }

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

  const getPropName = (propId: string) => {
    return properties.find((p) => p.id === propId)?.name || 'Properti';
  };

  // Fast Clean handler
  const handleFastClean = async (unitId: string) => {
    const updated = units.map((u) => {
      if (u.id === unitId) {
        return { ...u, status: 'Available' as UnitStatus };
      }
      return u;
    });
    saveUnits(updated);

    try {
      await fetch('/api/operations/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          newStatus: 'AVAILABLE',
          notes: 'Kamar selesai dibersihkan (Fast Clean). Status diperbarui ke Available.',
        }),
      });
    } catch (err) {
      console.error('Failed to log fast clean status in database:', err);
    }
  };

  const handleUpdateStatus = async (unitId: string, newStatus: UnitStatus) => {
    const updated = units.map((u) => {
      if (u.id === unitId) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveUnits(updated);
    setIsUpdateOpen(false);
    setSelectedUnit(null);

    const dbStatusMap: Record<string, string> = {
      Available: 'AVAILABLE',
      Occupied: 'OCCUPIED',
      Maintenance: 'MAINTENANCE',
      'Need Cleaning': 'CLEANING',
    };

    try {
      await fetch('/api/operations/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          newStatus: dbStatusMap[newStatus] || newStatus.toUpperCase(),
          notes: `Status kamar diperbarui menjadi ${newStatus}.`,
        }),
      });
    } catch (err) {
      console.error('Failed to update status in database:', err);
    }
  };

  const handleCheckout = (unitId: string) => {
    const targetUnit = units.find((u) => u.id === unitId);

    const updated = units.map((u) => {
      if (u.id === unitId) {
        const { tenantName, tenantPhone, checkInDate, ...rest } = u;
        return {
          ...rest,
          status: 'Need Cleaning' as UnitStatus,
        };
      }
      return u;
    });
    saveUnits(updated);

    if (targetUnit) {
      // Auto push Housekeeping Request for Checkout Clean to Admin Housekeeping
      const checkoutCall = {
        id: `hk-auto-${Date.now()}`,
        unitId: targetUnit.id,
        unitName: targetUnit.name,
        serviceType: 'Checkout Clean (Selesai Sewa)',
        scheduledDate: new Date().toISOString().split('T')[0],
        timeSlot: 'Pagi (09:00 - 11:00 WIB)',
        notes: `Otomatis dibuat oleh sistem setelah penyewa (${targetUnit.tenantName || 'Penghuni'}) selesai masa sewa (Check-out).`,
        status: 'Diproses',
        createdAt: new Date().toISOString(),
      };

      const storedCalls = localStorage.getItem('arventa_housekeeping_requests');
      let calls = storedCalls ? JSON.parse(storedCalls) : [];
      calls.unshift(checkoutCall);
      localStorage.setItem('arventa_housekeeping_requests', JSON.stringify(calls));

      // Also push to arventa_housekeeping_reports_v4
      const storedReports = localStorage.getItem('arventa_housekeeping_reports_v4');
      let reports = storedReports ? JSON.parse(storedReports) : [];
      reports.unshift({
        id: checkoutCall.id,
        ticketNumber: `HK-CO-${Date.now().toString().slice(-4)}`,
        propertyId: targetUnit.propertyId || 'prop-1',
        propertyName: getPropName(targetUnit.propertyId),
        unitId: targetUnit.id,
        unitNumber: targetUnit.name,
        serviceType: 'CHECKOUT_CLEAN',
        status: 'REQUESTED',
        reportedBy: { id: 'sys-auto', name: 'Sistem Auto Check-out', role: 'STAFF' },
        notes: checkoutCall.notes,
        photos: { before: [], after: [] },
        rating: null,
        timeline: [
          {
            id: `hist-co-${Date.now()}`,
            reportId: checkoutCall.id,
            timestamp: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            status: 'REQUESTED',
            performerName: 'Sistem Auto Check-out',
            performerRole: 'System',
            notes: 'Panggilan kebersihan Checkout Clean dipicu otomatis saat Check-out.',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      localStorage.setItem('arventa_housekeeping_reports_v4', JSON.stringify(reports));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('arventa_task_updated'));
      }
    }

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

    const updated = units.map((u) => {
      if (u.id === sourceUnitId) {
        const { tenantName, tenantPhone, checkInDate, ...rest } = u;
        return { ...rest, status: 'Need Cleaning' as UnitStatus };
      }
      if (u.id === targetUnitId) {
        return {
          ...u,
          status: 'Occupied' as UnitStatus,
          tenantName: sourceUnit.tenantName,
          tenantPhone: sourceUnit.tenantPhone,
          checkInDate: sourceUnit.checkInDate,
        };
      }
      return u;
    });

    saveUnits(updated);

    const storedCreds = localStorage.getItem('arventa_tenants');
    if (storedCreds) {
      const creds: Record<string, TenantCredential> = JSON.parse(storedCreds);
      if (creds[sourceUnitId]) {
        const userCred = creds[sourceUnitId];
        userCred.wifiSsid = `WiFi_${getPropName(targetUnit.propertyId).replace(/\s+/g, '')}_${targetUnit.name.replace(/\s+/g, '')}`;
        creds[targetUnitId] = userCred;
        delete creds[sourceUnitId];
        localStorage.setItem('arventa_tenants', JSON.stringify(creds));
      }
    }
  };

  const filteredUnits = units.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.tenantName && u.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProperty = selectedPropertyId === 'all' || u.propertyId === selectedPropertyId;
    const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getStatusBadge = (status: UnitStatus) => {
    switch (status) {
      case 'Available':
        return { bg: 'bg-[#8FA28A] text-white', label: 'Tersedia' };
      case 'Occupied':
        return { bg: 'bg-blue-600 text-white', label: 'Terisi' };
      case 'Need Cleaning':
        return { bg: 'bg-[#C8A96B] text-white', label: 'Butuh Bersih' };
      case 'Maintenance':
        return { bg: 'bg-red-600 text-white', label: 'Perbaikan' };
      case 'Reserved':
        return { bg: 'bg-purple-600 text-white', label: 'Reserved' };
      default:
        return { bg: 'bg-gray-500 text-white', label: 'Lainnya' };
    }
  };

  const getCardBorderStyle = (status: UnitStatus) => {
    switch (status) {
      case 'Need Cleaning':
        return 'border-[#C8A96B] shadow-[#C8A96B]/10';
      case 'Maintenance':
        return 'border-red-200 shadow-red-50';
      default:
        return 'border-gray-200';
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
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Dashboard Visual Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-[#8FA28A]" />
            Dashboard Housekeeping & Status Kamar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualisasi status kebersihan kamar, check-out sewa cepat, dan pindah kamar (Room Transfer).
          </p>
        </div>

        {/* Shortcut Link to Centralized Maintenance Reports Module */}
        <Link
          href="/housekeeping/maintenance-reports"
          className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm shrink-0"
        >
          <ClipboardList className="h-4 w-4" />
          <span>Lihat Laporan Maintenance & Audit Trail</span>
        </Link>
      </div>

      {/* Search & Filter bar for Room Grid */}
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
            const statusStyle = getStatusBadge(unit.status);

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

                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyle.bg}`}>
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Tenant Tag */}
                  {isOccupied && unit.tenantName && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 text-xs text-blue-800 space-y-0.5">
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider block">Penyewa Terdaftar</span>
                      <p className="font-bold">{unit.tenantName}</p>
                    </div>
                  )}

                  {/* Need Cleaning Banner */}
                  {isNeedCleaning && (
                    <div className="rounded-xl border border-[#C8A96B]/40 bg-[#C8A96B]/10 p-2.5 text-xs text-[#C8A96B] space-y-1">
                      <span className="font-black text-[10px] uppercase tracking-wider block">Perlu Dibersihkan!</span>
                      <p className="text-[11px] leading-snug">Unit baru selesai diproduksi / kotor setelah check-out.</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-1">
                  {isNeedCleaning ? (
                    <button
                      onClick={() => handleFastClean(unit.id)}
                      className="w-full min-h-[36px] flex items-center justify-center gap-1 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Tandai Siap Huni
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedUnit(unit);
                          setIsUpdateOpen(true);
                        }}
                        className="flex-1 min-h-[36px] flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors"
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
                          className="min-h-[36px] px-2.5 flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 transition-colors"
                          title="Pindah Kamar"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Update Modal */}
      {selectedUnit && isUpdateOpen && (
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
      )}

      {/* Room Transfer Modal */}
      {selectedUnit && isTransferOpen && (
        <RoomTransferModal
          isOpen={isTransferOpen}
          onClose={() => {
            setIsTransferOpen(false);
            setSelectedUnit(null);
          }}
          sourceUnit={selectedUnit}
          availableUnits={units}
          properties={properties}
          onTransfer={handleTransfer}
        />
      )}
    </div>
  );
}

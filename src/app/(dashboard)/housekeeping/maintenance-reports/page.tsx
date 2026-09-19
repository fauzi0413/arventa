'use client';

import React, { useState, Suspense, lazy, useEffect } from 'react';
import { ClipboardList, Sparkles, Wrench, History, Plus, Building2 } from 'lucide-react';
import { useMaintenanceReports } from './hooks/useMaintenanceReports';
import ReportsOverviewCards from './components/ReportsOverviewCards';
import DynamicFilterBar from './components/common/DynamicFilterBar';
import HousekeepingTable from './components/housekeeping/HousekeepingTable';
import MaintenanceTable from './components/maintenance/MaintenanceTable';
import AllHistoryTable from './components/history/AllHistoryTable';
import ReportsMobileCardList from './components/ReportsMobileCardList';
import ExportReportButton from './components/ExportReportButton';
import ImageFileInput from './components/common/ImageFileInput';
import { HousekeepingReport, MaintenanceReportItem } from './types';

// Lazy loaded modals for optimal performance
const HousekeepingCompleteModal = lazy(() => import('./components/housekeeping/HousekeepingCompleteModal'));
const MaintenanceResolveModal = lazy(() => import('./components/maintenance/MaintenanceResolveModal'));
const ReportDetailModal = lazy(() => import('./components/ReportDetailModal'));

function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-xl space-y-4 animate-pulse">
        <div className="h-6 w-1/2 bg-muted rounded" />
        <div className="h-20 bg-muted/60 rounded-xl" />
        <div className="h-10 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

function MaintenanceReportsContent() {
  const {
    activeTab,
    handleTabChange,
    housekeepingList,
    maintenanceList,
    properties,
    units,
    loading,
    filters,
    metrics,
    handleFilterChange,
    completeHousekeeping,
    startRepair,
    resolveMaintenance,
    submitRating,
    refreshData,
  } = useMaintenanceReports();

  // Modals state
  const [selectedHousekeeping, setSelectedHousekeeping] = useState<HousekeepingReport | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceReportItem | null>(null);

  const [isHKCompleteOpen, setIsHKCompleteOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Ticket Modal State (Housekeeping direct create)
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicketType, setNewTicketType] = useState<'HOUSEKEEPING' | 'REPAIR'>('HOUSEKEEPING');
  const [newTicketPropId, setNewTicketPropId] = useState('');
  const [newTicketUnitId, setNewTicketUnitId] = useState('');
  const [newTicketServiceType, setNewTicketServiceType] = useState('DAILY_CLEAN');
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('MEDIUM');
  const [newTicketPhotos, setNewTicketPhotos] = useState<string[]>([]);
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    if (properties.length > 0 && !newTicketPropId) {
      setNewTicketPropId(properties[0].id);
    }
  }, [properties, newTicketPropId]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketPropId) {
      alert('Pilih properti terlebih dahulu');
      return;
    }
    if (!newTicketTitle && newTicketType === 'REPAIR') {
      alert('Judul perbaikan wajib diisi');
      return;
    }

    setCreatingTicket(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: newTicketPropId,
          unitId: newTicketUnitId || undefined,
          type: newTicketType,
          serviceType: newTicketType === 'HOUSEKEEPING' ? newTicketServiceType : undefined,
          title: newTicketTitle,
          description: newTicketDesc,
          priority: newTicketPriority,
          photosBefore: newTicketPhotos,
        }),
      });

      if (res.ok) {
        setIsCreateTicketOpen(false);
        setNewTicketTitle('');
        setNewTicketDesc('');
        setNewTicketPhotos([]);
        await refreshData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Gagal membuat tiket');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat tiket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const availableUnits = units.filter((u) => !newTicketPropId || u.propertyId === newTicketPropId);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Memuat pusat laporan & audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[#8FA28A]" />
            Pusat Pengelolaan Laporan Operasional
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pemisahan modul Layanan Kebersihan (Housekeeping) dan Laporan Kerusakan (Maintenance) beserta audit trail & rating ter-lock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateTicketOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#8FA28A] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#8FA28A]/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Laporan / Tiket Baru</span>
          </button>
          {/* CSV Export Engine */}
          <ExportReportButton
            housekeepingData={housekeepingList}
            maintenanceData={maintenanceList}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange('HOUSEKEEPING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${activeTab === 'HOUSEKEEPING'
              ? 'bg-[#8FA28A] text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Layanan Kebersihan (Housekeeping)</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {metrics.totalHousekeeping}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('MAINTENANCE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${activeTab === 'MAINTENANCE'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Laporan Kerusakan & Perbaikan (Maintenance)</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {metrics.totalMaintenance}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${activeTab === 'HISTORY'
              ? 'bg-[#2F332E] dark:bg-[#3D443C] text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <History className="h-4 w-4" />
          <span>Riwayat Audit & Semua Laporan (All History)</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {metrics.totalHousekeeping + metrics.totalMaintenance}
          </span>
        </button>
      </div>

      {/* KPI Overview Metric Cards */}
      <ReportsOverviewCards activeTab={activeTab} metrics={metrics} />

      {/* Tab-Adaptive Dynamic Filter Bar */}
      <DynamicFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        properties={properties}
        activeTab={activeTab}
      />

      {/* Tab Content Display */}
      {activeTab === 'HOUSEKEEPING' ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <HousekeepingTable
              reports={housekeepingList}
              onSelectReport={(report) => {
                setSelectedHousekeeping(report);
                setIsDetailOpen(true);
              }}
              onOpenCompleteModal={(report) => {
                setSelectedHousekeeping(report);
                setIsHKCompleteOpen(true);
              }}
            />
          </div>

          {/* Mobile View */}
          <ReportsMobileCardList
            activeTab="HOUSEKEEPING"
            housekeepingReports={housekeepingList}
            maintenanceReports={[]}
            onSelectHousekeeping={(report) => {
              setSelectedHousekeeping(report);
              setIsDetailOpen(true);
            }}
            onSelectMaintenance={() => { }}
          />
        </>
      ) : activeTab === 'MAINTENANCE' ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <MaintenanceTable
              reports={maintenanceList}
              onSelectReport={(report) => {
                setSelectedMaintenance(report);
                setIsDetailOpen(true);
              }}
              onStartRepair={startRepair}
              onOpenResolveModal={(report) => {
                setSelectedMaintenance(report);
                setIsResolveOpen(true);
              }}
            />
          </div>

          {/* Mobile View */}
          <ReportsMobileCardList
            activeTab="MAINTENANCE"
            housekeepingReports={[]}
            maintenanceReports={maintenanceList}
            onSelectHousekeeping={() => { }}
            onSelectMaintenance={(report) => {
              setSelectedMaintenance(report);
              setIsDetailOpen(true);
            }}
          />
        </>
      ) : (
        /* HISTORY TAB */
        <AllHistoryTable
          housekeepingReports={housekeepingList}
          maintenanceReports={maintenanceList}
          onSelectHousekeeping={(report) => {
            setSelectedHousekeeping(report);
            setIsDetailOpen(true);
          }}
          onSelectMaintenance={(report) => {
            setSelectedMaintenance(report);
            setIsDetailOpen(true);
          }}
        />
      )}

      {/* Modals with React.lazy + Suspense */}
      <Suspense fallback={<ModalSkeleton />}>
        {isHKCompleteOpen && selectedHousekeeping && (
          <HousekeepingCompleteModal
            isOpen={isHKCompleteOpen}
            onClose={() => {
              setIsHKCompleteOpen(false);
              setSelectedHousekeeping(null);
            }}
            report={selectedHousekeeping}
            onComplete={completeHousekeeping}
          />
        )}

        {isResolveOpen && selectedMaintenance && (
          <MaintenanceResolveModal
            isOpen={isResolveOpen}
            onClose={() => {
              setIsResolveOpen(false);
              setSelectedMaintenance(null);
            }}
            report={selectedMaintenance}
            onSubmitResolution={resolveMaintenance}
          />
        )}

        {/* Housekeeping Create Ticket Modal */}
        {isCreateTicketOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Plus className="h-5 w-5 text-[#8FA28A]" />
                  Buat Laporan / Tugas Lapangan
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateTicketOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                {/* Type selector */}
                <div>
                  <label className="font-bold text-foreground block mb-1">Tipe Laporan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTicketType('HOUSEKEEPING')}
                      className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${newTicketType === 'HOUSEKEEPING'
                          ? 'bg-[#8FA28A] text-white border-[#8FA28A] shadow-sm'
                          : 'bg-muted/40 text-foreground border-border'
                        }`}
                    >
                      <Sparkles className="h-4 w-4" /> Kebersihan (Housekeeping)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTicketType('REPAIR')}
                      className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${newTicketType === 'REPAIR'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-muted/40 text-foreground border-border'
                        }`}
                    >
                      <Wrench className="h-4 w-4" /> Kerusakan (Repair)
                    </button>
                  </div>
                </div>

                {/* Property & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground block mb-1">Properti *</label>
                    <select
                      value={newTicketPropId}
                      onChange={(e) => {
                        setNewTicketPropId(e.target.value);
                        setNewTicketUnitId('');
                      }}
                      required
                      className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">Kamar / Lokasi</label>
                    <select
                      value={newTicketUnitId}
                      onChange={(e) => setNewTicketUnitId(e.target.value)}
                      className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none"
                    >
                      <option value="">Area Umum / Fasilitas Gedung</option>
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          Kamar {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service type for Housekeeping */}
                {newTicketType === 'HOUSEKEEPING' && (
                  <div>
                    <label className="font-bold text-foreground block mb-1">Jenis Layanan Kebersihan</label>
                    <select
                      value={newTicketServiceType}
                      onChange={(e) => setNewTicketServiceType(e.target.value)}
                      className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none"
                    >
                      <option value="DAILY_CLEAN">Pembersihan Harian (Daily Clean)</option>
                      <option value="DEEP_CLEAN">Pembersihan Menyeluruh (Deep Clean)</option>
                      <option value="CHECKOUT_CLEAN">Pembersihan Selesai Sewa (Checkout Clean)</option>
                      <option value="LINEN_CHANGE">Ganti Sprei & Linen</option>
                      <option value="SPECIAL_REQUEST">Permintaan Khusus</option>
                    </select>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    {newTicketType === 'REPAIR' ? 'Judul Kerusakan *' : 'Nama Tugas Kebersihan'}
                  </label>
                  <input
                    type="text"
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    placeholder={newTicketType === 'REPAIR' ? 'Contoh: AC Bocor di Kamar 101' : 'Contoh: Pembersihan kamar mandi & ganti sprei'}
                    required={newTicketType === 'REPAIR'}
                    className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="font-bold text-foreground block mb-1">Keterangan / Rincian Pekerjaan</label>
                  <textarea
                    value={newTicketDesc}
                    onChange={(e) => setNewTicketDesc(e.target.value)}
                    rows={3}
                    placeholder="Jelaskan detail kondisi barang atau instruksi pengerjaan..."
                    className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="font-bold text-foreground block mb-1">Prioritas Pengerjaan</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                    className="w-full rounded-xl border border-border p-2.5 bg-muted/40 text-foreground font-medium focus:bg-background focus:outline-none"
                  >
                    <option value="LOW">Rendah (Biasa)</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi (Urgent)</option>
                    <option value="EMERGENCY">Darurat (Emergency)</option>
                  </select>
                </div>

                {/* Upload Foto Bukti / Kerusakan */}
                <ImageFileInput
                  label="Unggah Foto Bukti / Kondisi Awal"
                  images={newTicketPhotos}
                  onChange={setNewTicketPhotos}
                  maxFiles={4}
                />

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCreateTicketOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTicket}
                    className="px-5 py-2 rounded-xl bg-[#8FA28A] text-white font-bold hover:bg-[#8FA28A]/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {creatingTicket ? 'Menyimpan...' : 'Simpan & Terbitkan Tiket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
}

export default function MaintenanceReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Memuat laporan & tugas lapangan...</p>
          </div>
        </div>
      }
    >
      <MaintenanceReportsContent />
    </Suspense>
  );
}

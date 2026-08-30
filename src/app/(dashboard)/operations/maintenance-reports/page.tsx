'use client';

import React, { useState, Suspense, lazy } from 'react';
import { ClipboardList, Sparkles, Wrench, History, Building2, Plus, ShieldCheck, DollarSign } from 'lucide-react';
import { useMaintenanceReports } from '@/app/(dashboard)/housekeeping/maintenance-reports/hooks/useMaintenanceReports';
import ReportsOverviewCards from '@/app/(dashboard)/housekeeping/maintenance-reports/components/ReportsOverviewCards';
import DynamicFilterBar from '@/app/(dashboard)/housekeeping/maintenance-reports/components/common/DynamicFilterBar';
import HousekeepingTable from '@/app/(dashboard)/housekeeping/maintenance-reports/components/housekeeping/HousekeepingTable';
import MaintenanceTable from '@/app/(dashboard)/housekeeping/maintenance-reports/components/maintenance/MaintenanceTable';
import AllHistoryTable from '@/app/(dashboard)/housekeeping/maintenance-reports/components/history/AllHistoryTable';
import ReportsMobileCardList from '@/app/(dashboard)/housekeeping/maintenance-reports/components/ReportsMobileCardList';
import ExportReportButton from '@/app/(dashboard)/housekeeping/maintenance-reports/components/ExportReportButton';
import ImageFileInput from '@/app/(dashboard)/housekeeping/maintenance-reports/components/common/ImageFileInput';
import { HousekeepingReport, MaintenanceReportItem } from '@/app/(dashboard)/housekeeping/maintenance-reports/types';

// Lazy loaded modals for optimal performance
const HousekeepingCompleteModal = lazy(
  () => import('@/app/(dashboard)/housekeeping/maintenance-reports/components/housekeeping/HousekeepingCompleteModal')
);
const MaintenanceResolveModal = lazy(
  () => import('@/app/(dashboard)/housekeeping/maintenance-reports/components/maintenance/MaintenanceResolveModal')
);
const ReportDetailModal = lazy(
  () => import('@/app/(dashboard)/housekeeping/maintenance-reports/components/ReportDetailModal')
);

function OwnerMaintenanceReportsContent() {
  const {
    activeTab,
    handleTabChange,
    housekeepingList,
    maintenanceList,
    properties,
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
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Ticket Modal State (Owner direct create)
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicketType, setNewTicketType] = useState<'HOUSEKEEPING' | 'REPAIR'>('REPAIR');
  const [newTicketPropId, setNewTicketPropId] = useState('');
  const [newTicketUnitId, setNewTicketUnitId] = useState('');
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('MEDIUM');
  const [newTicketCostLiability, setNewTicketCostLiability] = useState('OWNER');
  const [newTicketEstCost, setNewTicketEstCost] = useState('');
  const [newTicketPhotos, setNewTicketPhotos] = useState<string[]>([]);
  const [creatingTicket, setCreatingTicket] = useState(false);

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
          title: newTicketTitle,
          description: newTicketDesc,
          priority: newTicketPriority,
          photosBefore: newTicketPhotos,
          costLiability: newTicketCostLiability,
          estimatedCost: newTicketEstCost ? Number(newTicketEstCost) : undefined,
        }),
      });

      if (res.ok) {
        setIsCreateTicketOpen(false);
        setNewTicketTitle('');
        setNewTicketDesc('');
        setNewTicketEstCost('');
        setNewTicketPhotos([]);
        await refreshData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal membuat tiket');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat tiket');
    } finally {
      setCreatingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-xs font-bold text-gray-500">Memuat pusat laporan & pemeliharaan properti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Header with Owner Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-[#8FA28A]" />
              Pusat Laporan & Pemeliharaan Properti
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] font-extrabold text-[10px] uppercase tracking-wider border border-[#8FA28A]/30 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Mode Owner
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pengawasan menyeluruh laporan kebersihan lapangan, perbaikan unit, alokasi beban biaya (Owner/Tenant), dan audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewTicketPropId(properties[0]?.id || '');
              setIsCreateTicketOpen(true);
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            + Buat Laporan Baru
          </button>

          {/* CSV / Excel Export Engine */}
          <ExportReportButton
            housekeepingData={housekeepingList}
            maintenanceData={maintenanceList}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange('MAINTENANCE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'MAINTENANCE'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Laporan Kerusakan & Perbaikan Unit (Maintenance)</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {metrics.totalMaintenance}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('HOUSEKEEPING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'HOUSEKEEPING'
              ? 'bg-[#8FA28A] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Layanan Kebersihan (Housekeeping)</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {metrics.totalHousekeeping}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'HISTORY'
              ? 'bg-gray-800 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Riwayat Audit & Seluruh Laporan (All History)</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {metrics.totalHousekeeping + metrics.totalMaintenance}
          </span>
        </button>
      </div>

      {/* KPI Overview Metric Cards */}
      <ReportsOverviewCards activeTab={activeTab} metrics={metrics} />

      {/* Dynamic Filter Bar */}
      <DynamicFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        properties={properties}
        activeTab={activeTab}
      />

      {/* Tab Content Display */}
      {activeTab === 'MAINTENANCE' ? (
        <>
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

          <ReportsMobileCardList
            activeTab="MAINTENANCE"
            housekeepingReports={[]}
            maintenanceReports={maintenanceList}
            onSelectHousekeeping={() => {}}
            onSelectMaintenance={(report) => {
              setSelectedMaintenance(report);
              setIsDetailOpen(true);
            }}
          />
        </>
      ) : activeTab === 'HOUSEKEEPING' ? (
        <>
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

          <ReportsMobileCardList
            activeTab="HOUSEKEEPING"
            housekeepingReports={housekeepingList}
            maintenanceReports={[]}
            onSelectHousekeeping={(report) => {
              setSelectedHousekeeping(report);
              setIsDetailOpen(true);
            }}
            onSelectMaintenance={() => {}}
          />
        </>
      ) : (
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

      {/* Detail Modal */}
      <Suspense fallback={null}>
        {isDetailOpen && (
          <ReportDetailModal
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedHousekeeping(null);
              setSelectedMaintenance(null);
            }}
            report={selectedHousekeeping || selectedMaintenance}
            reportType={selectedHousekeeping ? 'HOUSEKEEPING' : 'MAINTENANCE'}
            onSubmitRating={(score, feedback) => {
              const targetId = selectedHousekeeping?.id || selectedMaintenance?.id;
              if (targetId) submitRating(targetId, score, feedback);
            }}
          />
        )}
      </Suspense>

      {/* Housekeeping Complete Modal */}
      <Suspense fallback={null}>
        {isHKCompleteOpen && selectedHousekeeping && (
          <HousekeepingCompleteModal
            isOpen={isHKCompleteOpen}
            onClose={() => {
              setIsHKCompleteOpen(false);
              setSelectedHousekeeping(null);
            }}
            report={selectedHousekeeping}
            onComplete={(reportId, checklist, notes, photos) => {
              completeHousekeeping(reportId, checklist, notes, photos);
              setIsHKCompleteOpen(false);
              setSelectedHousekeeping(null);
            }}
          />
        )}
      </Suspense>

      {/* Maintenance Resolve Modal */}
      <Suspense fallback={null}>
        {isResolveOpen && selectedMaintenance && (
          <MaintenanceResolveModal
            isOpen={isResolveOpen}
            onClose={() => {
              setIsResolveOpen(false);
              setSelectedMaintenance(null);
            }}
            report={selectedMaintenance}
            onResolve={(reportId: string, notes: string, photos: string[], cost?: number) => {
              resolveMaintenance(reportId, notes, photos, cost);
              setIsResolveOpen(false);
              setSelectedMaintenance(null);
            }}
          />
        )}
      </Suspense>

      {/* Owner Create Ticket Modal */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#8FA28A]" />
                Buat Laporan / Tiket Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateTicketOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tipe Laporan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTicketType('REPAIR')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newTicketType === 'REPAIR'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <Wrench className="h-4 w-4" /> Perbaikan Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTicketType('HOUSEKEEPING')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newTicketType === 'HOUSEKEEPING'
                        ? 'bg-[#8FA28A] text-white border-[#8FA28A] shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" /> Housekeeping
                  </button>
                </div>
              </div>

              {/* Property & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Properti *</label>
                  <select
                    value={newTicketPropId}
                    onChange={(e) => {
                      setNewTicketPropId(e.target.value);
                      setNewTicketUnitId('');
                    }}
                    required
                    className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kamar / Lokasi</label>
                  <select
                    value={newTicketUnitId}
                    onChange={(e) => setNewTicketUnitId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="">Area Umum / Gedung</option>
                    {/* Filter units of chosen property */}
                    {/* We can use the units from hook */}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {newTicketType === 'REPAIR' ? 'Judul Kerusakan *' : 'Nama Tugas Kebersihan'}
                </label>
                <input
                  type="text"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  placeholder={newTicketType === 'REPAIR' ? 'Contoh: AC Bocor di Kamar 101' : 'Contoh: Deep cleaning kamar mandi'}
                  required={newTicketType === 'REPAIR'}
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Keterangan / Rincian Kerusakan</label>
                <textarea
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan detail kondisi barang atau instruksi pengerjaan..."
                  className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Priority & Cost Liability (Owner special) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prioritas</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="LOW">Rendah (Biasa)</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi (Urgent)</option>
                    <option value="EMERGENCY">Darurat (Emergency)</option>
                  </select>
                </div>

                {newTicketType === 'REPAIR' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-[#8FA28A]" /> Beban Biaya
                    </label>
                    <select
                      value={newTicketCostLiability}
                      onChange={(e) => setNewTicketCostLiability(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                    >
                      <option value="OWNER">Ditanggung Owner</option>
                      <option value="TENANT">Ditanggung Penyewa</option>
                      <option value="SPLIT">Bagi Hasil / Split</option>
                    </select>
                  </div>
                )}
              </div>

              {newTicketType === 'REPAIR' && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={newTicketEstCost}
                    onChange={(e) => setNewTicketEstCost(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Upload Foto Bukti / Kerusakan */}
              <ImageFileInput
                label="Unggah Foto Bukti / Kondisi Awal"
                images={newTicketPhotos}
                onChange={setNewTicketPhotos}
                maxFiles={4}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateTicketOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2 rounded-xl bg-[#8FA28A] text-white font-bold hover:bg-[#8FA28A]/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {creatingTicket ? 'Menyimpan...' : 'Simpan & Terbitkan Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerMaintenanceReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
          <div className="text-center space-y-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
            <p className="text-xs font-bold text-gray-500">Memuat pusat laporan & pemeliharaan...</p>
          </div>
        </div>
      }
    >
      <OwnerMaintenanceReportsContent />
    </Suspense>
  );
}

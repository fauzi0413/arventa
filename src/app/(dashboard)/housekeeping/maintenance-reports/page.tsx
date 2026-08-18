'use client';

import React, { useState, Suspense, lazy } from 'react';
import { ClipboardList, Sparkles, Wrench, History } from 'lucide-react';
import { useMaintenanceReports } from './hooks/useMaintenanceReports';
import ReportsOverviewCards from './components/ReportsOverviewCards';
import DynamicFilterBar from './components/common/DynamicFilterBar';
import HousekeepingTable from './components/housekeeping/HousekeepingTable';
import MaintenanceTable from './components/maintenance/MaintenanceTable';
import AllHistoryTable from './components/history/AllHistoryTable';
import ReportsMobileCardList from './components/ReportsMobileCardList';
import ExportReportButton from './components/ExportReportButton';
import { HousekeepingReport, MaintenanceReportItem } from './types';

// Lazy loaded modals for optimal performance
const HousekeepingCompleteModal = lazy(() => import('./components/housekeeping/HousekeepingCompleteModal'));
const MaintenanceResolveModal = lazy(() => import('./components/maintenance/MaintenanceResolveModal'));
const ReportDetailModal = lazy(() => import('./components/ReportDetailModal'));

function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-pulse">
        <div className="h-6 w-1/2 bg-gray-200 rounded" />
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function MaintenanceReportsPage() {
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
  } = useMaintenanceReports();

  // Modals state
  const [selectedHousekeeping, setSelectedHousekeeping] = useState<HousekeepingReport | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceReportItem | null>(null);

  const [isHKCompleteOpen, setIsHKCompleteOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-xs font-bold text-gray-500">Memuat pusat laporan & audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[#8FA28A]" />
            Pusat Pengelolaan Laporan Operasional
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pemisahan modul Layanan Kebersihan (Housekeeping) dan Laporan Kerusakan (Maintenance) beserta audit trail & rating ter-lock.
          </p>
        </div>

        {/* CSV Export Engine */}
        <ExportReportButton
          housekeepingData={housekeepingList}
          maintenanceData={maintenanceList}
          activeTab={activeTab}
        />
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
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
          onClick={() => handleTabChange('MAINTENANCE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'MAINTENANCE'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'HISTORY'
              ? 'bg-gray-800 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
            onSelectMaintenance={() => {}}
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
            onSelectHousekeeping={() => {}}
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

        {isDetailOpen && (selectedHousekeeping || selectedMaintenance) && (
          <ReportDetailModal
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedHousekeeping(null);
              setSelectedMaintenance(null);
            }}
            report={selectedHousekeeping ? selectedHousekeeping : selectedMaintenance}
            reportType={selectedHousekeeping ? 'HOUSEKEEPING' : 'MAINTENANCE'}
            onSubmitRating={(score, feedback) => {
              const isHK = !!selectedHousekeeping;
              const targetId = isHK ? selectedHousekeeping?.id : selectedMaintenance?.id;
              if (targetId) {
                submitRating(isHK ? 'HOUSEKEEPING' : 'MAINTENANCE', targetId, score, feedback);
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Printer, ChevronDown } from 'lucide-react';
import { HousekeepingReport, MaintenanceReportItem } from '../types';

interface ExportReportButtonProps {
  housekeepingData: HousekeepingReport[];
  maintenanceData: MaintenanceReportItem[];
  activeTab: 'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY';
}

export default function ExportReportButton({
  housekeepingData,
  maintenanceData,
  activeTab,
}: ExportReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportToCSV = () => {
    if (activeTab === 'HOUSEKEEPING') {
      if (!housekeepingData || housekeepingData.length === 0) {
        alert('Tidak ada data kebersihan untuk diekspor.');
        return;
      }

      const headers = [
        'No Tiket',
        'Jenis Layanan',
        'Properti',
        'Unit',
        'Status',
        'Pelapor',
        'Housekeeper',
        'Catatan Resolusi',
        'Rating CSAT',
        'Tanggal Dibuat',
      ];

      const rows = housekeepingData.map((h) => [
        `"${h.ticketNumber}"`,
        `"${h.serviceType}"`,
        `"${h.propertyName}"`,
        `"${h.unitNumber}"`,
        `"${h.status}"`,
        `"${h.reportedBy?.name || 'Penyewa'}"`,
        `"${h.housekeeper?.name || 'Agus Lapangan'}"`,
        `"${(h.resolutionNotes || '').replace(/"/g, '""')}"`,
        h.rating ? `${h.rating.score}/5` : '-',
        `"${new Date(h.createdAt).toLocaleDateString('id-ID')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Housekeeping_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (!maintenanceData || maintenanceData.length === 0) {
        alert('Tidak ada data perbaikan untuk diekspor.');
        return;
      }

      const headers = [
        'No Tiket',
        'Judul',
        'Properti',
        'Unit',
        'Urgensi',
        'Status',
        'Estimasi Biaya',
        'Tanggungan Biaya',
        'Biaya Riil',
        'Pelapor',
        'Teknisi',
        'Struk Nota URL',
        'Rating CSAT',
        'Tanggal Dibuat',
      ];

      const rows = maintenanceData.map((m) => [
        `"${m.ticketNumber}"`,
        `"${m.title.replace(/"/g, '""')}"`,
        `"${m.propertyName}"`,
        `"${m.unitNumber}"`,
        `"${m.priority}"`,
        `"${m.status}"`,
        m.estimatedCost ? `Rp ${m.estimatedCost}` : '0',
        `"${m.costLiability || 'OWNER'}"`,
        m.actualCost ? `Rp ${m.actualCost}` : '0',
        `"${m.reportedBy?.name || 'Penyewa'}"`,
        `"${m.assignedStaff?.name || 'Mas Rudi'}"`,
        `"${m.receiptUrl || ''}"`,
        m.rating ? `${m.rating.score}/5` : '-',
        `"${new Date(m.createdAt).toLocaleDateString('id-ID')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Maintenance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsOpen(false);
  };

  const exportToPDFPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm active:scale-95"
      >
        <Download className="h-4 w-4" />
        <span>Ekspor Laporan</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-gray-200 shadow-xl z-30 py-1 text-xs font-bold text-gray-700 animate-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={exportToCSV}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Ekspor File CSV / Excel</span>
          </button>
          <button
            type="button"
            onClick={exportToPDFPrint}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors border-t border-gray-100"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}

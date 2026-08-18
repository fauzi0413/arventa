'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HousekeepingReport,
  MaintenanceReportItem,
  ReportFilterState,
  ReportsMetrics,
  HousekeepingStatus,
  HousekeepingServiceType,
  HousekeepingChecklist,
  MaintenanceStatus,
  ReportPriority,
  RatingData,
  TimelineLog,
} from '../types';
import { Property } from '@/app/(dashboard)/properties/_types';
import { Unit } from '@/app/(dashboard)/units/_types';
import { TenantComplaint, HousekeepingRequest } from '@/app/(dashboard)/portal/room/_types';

const STORAGE_HK_KEY = 'arventa_housekeeping_reports_v4';
const STORAGE_MNT_KEY = 'arventa_maintenance_reports_v4';

const SAMPLE_HOUSEKEEPING: HousekeepingReport[] = [
  {
    id: 'hk-001',
    ticketNumber: 'HK-2026-001',
    propertyId: 'prop-1',
    propertyName: 'Kost Griya Melati',
    unitId: 'unit-102',
    unitNumber: 'Kamar 102',
    serviceType: 'DAILY_CLEAN',
    status: 'COMPLETED',
    reportedBy: { id: 'usr-102', name: 'Siti Rahma', role: 'TENANT' },
    housekeeper: { id: 'stf-002', name: 'Agus Lapangan', role: 'STAFF' },
    checklist: {
      bathroom: true,
      bedLinen: true,
      floorSweptMopped: true,
      trashEmptied: true,
    },
    notes: 'Permintaan kebersihan rutin mingguan.',
    resolutionNotes: 'Kamar selesai dibersihkan 100%. Sprei diganti warna krem baru.',
    photos: {
      before: [],
      after: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=600&auto=format&fit=crop'],
    },
    rating: {
      score: 5,
      feedback: 'Bersih sekali dan wangi! Sprei krem sangat rapi.',
      ratedAt: '18/08/2026 12:00',
      ratedBy: { id: 'usr-102', name: 'Siti Rahma' },
    },
    timeline: [
      {
        id: 'hist-hk-1',
        reportId: 'hk-001',
        timestamp: '18/08/2026 10:00',
        status: 'REQUESTED',
        performerName: 'Siti Rahma',
        performerRole: 'Tenant',
        notes: 'Permintaan kebersihan dipesan via Tenant Portal.',
      },
      {
        id: 'hist-hk-2',
        reportId: 'hk-001',
        timestamp: '18/08/2026 11:00',
        status: 'IN_CLEANING',
        performerName: 'Agus Lapangan',
        performerRole: 'Housekeeper',
        notes: 'Pekerjaan kebersihan dimulai.',
      },
      {
        id: 'hist-hk-3',
        reportId: 'hk-001',
        timestamp: '18/08/2026 11:45',
        status: 'COMPLETED',
        performerName: 'Agus Lapangan',
        performerRole: 'Housekeeper',
        notes: 'Pembersihan selesai 100%. Sprei diganti warna krem baru.',
      },
    ],
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-18T11:45:00Z',
  },
];

const SAMPLE_MAINTENANCE: MaintenanceReportItem[] = [
  {
    id: 'mnt-001',
    ticketNumber: 'MNT-2026-001',
    propertyId: 'prop-1',
    propertyName: 'Kost Griya Melati',
    unitId: 'unit-101',
    unitNumber: 'Kamar 101',
    title: 'AC Bocor Menetes Air Deras',
    description: 'Unit AC kamar 101 meneteskan air di atas kasur sejak tadi malam. Butuh perbaikan segera.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    reportedBy: { id: 'usr-101', name: 'Budi Santoso', role: 'TENANT' },
    assignedStaff: { id: 'stf-001', name: 'Mas Rudi (Teknisi)', role: 'STAFF' },
    photos: {
      before: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop'],
      after: [],
    },
    rating: null,
    timeline: [
      {
        id: 'hist-mnt-1',
        reportId: 'mnt-001',
        timestamp: '18/08/2026 09:15',
        status: 'REPORTED',
        performerName: 'Budi Santoso',
        performerRole: 'Tenant',
        notes: 'Laporan kerusakan diajukan via Tenant Portal.',
      },
      {
        id: 'hist-mnt-2',
        reportId: 'mnt-001',
        timestamp: '18/08/2026 10:30',
        status: 'IN_PROGRESS',
        performerName: 'Mas Rudi',
        performerRole: 'Staff Teknisi',
        notes: 'Perbaikan AC dimulai oleh teknisi.',
      },
    ],
    createdAt: '2026-08-18T09:15:00Z',
    updatedAt: '2026-08-18T10:30:00Z',
  },
];

export function useMaintenanceReports() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY'>(
    (searchParams.get('tab') as any) || 'HOUSEKEEPING'
  );

  const [housekeepingList, setHousekeepingList] = useState<HousekeepingReport[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceReportItem[]>([]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<ReportFilterState>({
    search: searchParams.get('search') || '',
    tab: activeTab,
    housekeepingStatus: (searchParams.get('housekeepingStatus') as any) || 'ALL',
    serviceType: (searchParams.get('serviceType') as any) || 'ALL',
    housekeeperId: searchParams.get('housekeeperId') || 'ALL',
    maintenanceStatus: (searchParams.get('maintenanceStatus') as any) || 'ALL',
    priority: (searchParams.get('priority') as any) || 'ALL',
    costLiability: (searchParams.get('costLiability') as any) || 'ALL',
    propertyId: searchParams.get('propertyId') || 'ALL',
    ratingStatus: (searchParams.get('ratingStatus') as any) || 'ALL',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    searchParams.get('reportId') || null
  );

  // Load Initial Data
  const loadData = useCallback(() => {
    const storedProps = localStorage.getItem('arventa_properties');
    const storedUnits = localStorage.getItem('arventa_units');
    const storedHK = localStorage.getItem(STORAGE_HK_KEY);
    const storedMNT = localStorage.getItem(STORAGE_MNT_KEY);

    const storedComplaints = localStorage.getItem('arventa_tenant_complaints');
    const storedHousekeepingCalls = localStorage.getItem('arventa_housekeeping_requests');

    let loadedProps: Property[] = storedProps ? JSON.parse(storedProps) : [];
    let loadedUnits: Unit[] = storedUnits ? JSON.parse(storedUnits) : [];
    let baseHK: HousekeepingReport[] = storedHK ? JSON.parse(storedHK) : SAMPLE_HOUSEKEEPING;
    let baseMNT: MaintenanceReportItem[] = storedMNT ? JSON.parse(storedMNT) : SAMPLE_MAINTENANCE;

    setProperties(loadedProps);
    setUnits(loadedUnits);

    let tenantComplaints: TenantComplaint[] = storedComplaints ? JSON.parse(storedComplaints) : [];
    let convertedComplaints: MaintenanceReportItem[] = tenantComplaints.map((c) => {
      const parentUnit = loadedUnits.find((u) => u.id === c.unitId);
      const parentProp = loadedProps.find((p) => p.id === parentUnit?.propertyId);

      const statusMap: Record<string, MaintenanceStatus> = {
        Pending: 'REPORTED',
        'In Progress': 'IN_PROGRESS',
        Resolved: 'RESOLVED',
      };

      const priorityMap: Record<string, ReportPriority> = {
        Biasa: 'LOW',
        Sedang: 'MEDIUM',
        Mendesak: 'HIGH',
      };

      return {
        id: c.id,
        ticketNumber: `MNT-CMP-${c.id.slice(-4).toUpperCase()}`,
        propertyId: parentProp?.id || 'prop-1',
        propertyName: parentProp?.name || 'Properti Kost',
        unitId: c.unitId,
        unitNumber: c.unitName,
        title: c.title,
        description: c.description,
        priority: priorityMap[c.priority] || 'MEDIUM',
        status: statusMap[c.status] || 'REPORTED',
        reportedBy: { id: `tenant-${c.unitId}`, name: parentUnit?.tenantName || 'Tenant', role: 'TENANT' },
        resolutionNotes: c.resolutionNotes,
        photos: {
          before: c.photoUrl ? [c.photoUrl] : [],
          after: [],
        },
        rating: null,
        timeline: [
          {
            id: `hist-${c.id}`,
            reportId: c.id,
            timestamp: new Date(c.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            }),
            status: 'REPORTED',
            performerName: parentUnit?.tenantName || 'Tenant',
            performerRole: 'Tenant',
            notes: `Komplain kategori ${c.category} diajukan oleh penghuni.`,
          },
        ],
        createdAt: c.createdAt,
        updatedAt: c.resolvedAt || c.createdAt,
      };
    });

    let housekeepingCalls: HousekeepingRequest[] = storedHousekeepingCalls ? JSON.parse(storedHousekeepingCalls) : [];
    let convertedHK: HousekeepingReport[] = housekeepingCalls.map((h) => {
      const parentUnit = loadedUnits.find((u) => u.id === h.unitId);
      const parentProp = loadedProps.find((p) => p.id === parentUnit?.propertyId);

      const statusMap: Record<string, HousekeepingStatus> = {
        Diproses: 'REQUESTED',
        Terjadwal: 'IN_CLEANING',
        Selesai: 'COMPLETED',
      };

      const serviceTypeMap: Record<string, HousekeepingServiceType> = {
        'Pembersihan Kamar Rutin': 'DAILY_CLEAN',
        'Deep Cleaning Kamar Mandi': 'DEEP_CLEAN',
        'Ganti Sprei & Linen': 'LINEN_CHANGE',
      };

      return {
        id: h.id,
        ticketNumber: `HK-CALL-${h.id.slice(-4).toUpperCase()}`,
        propertyId: parentProp?.id || 'prop-1',
        propertyName: parentProp?.name || 'Properti Kost',
        unitId: h.unitId,
        unitNumber: h.unitName,
        serviceType: serviceTypeMap[h.serviceType] || 'DAILY_CLEAN',
        status: statusMap[h.status] || 'REQUESTED',
        reportedBy: { id: `tenant-${h.unitId}`, name: parentUnit?.tenantName || 'Tenant', role: 'TENANT' },
        housekeeper: { id: 'stf-002', name: 'Agus Lapangan', role: 'STAFF' },
        notes: `Jadwal ${h.scheduledDate} ${h.timeSlot}.${h.notes ? ` Catatan: ${h.notes}` : ''}`,
        resolutionNotes: h.resolutionNotes,
        photos: { before: [], after: [] },
        rating: null,
        timeline: [
          {
            id: `hist-hk-${h.id}`,
            reportId: h.id,
            timestamp: new Date(h.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            }),
            status: 'REQUESTED',
            performerName: parentUnit?.tenantName || 'Tenant',
            performerRole: 'Tenant',
            notes: `Panggilan kebersihan ${h.serviceType} untuk ${h.scheduledDate}.`,
          },
        ],
        createdAt: h.createdAt,
        updatedAt: h.createdAt,
      };
    });

    const hkMap = new Map<string, HousekeepingReport>();
    [...baseHK, ...convertedHK].forEach((item) => hkMap.set(item.id, item));
    const finalHK = Array.from(hkMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const mntMap = new Map<string, MaintenanceReportItem>();
    [...baseMNT, ...convertedComplaints].forEach((item) => mntMap.set(item.id, item));
    const finalMNT = Array.from(mntMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setHousekeepingList(finalHK);
    setMaintenanceList(finalMNT);
    localStorage.setItem(STORAGE_HK_KEY, JSON.stringify(finalHK));
    localStorage.setItem(STORAGE_MNT_KEY, JSON.stringify(finalMNT));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: 'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY') => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, tab }));
    setSelectedReportId(null);
  };

  const handleFilterChange = (updates: Partial<ReportFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectReport = (id: string | null) => {
    setSelectedReportId(id);
  };

  // Filtered Lists
  const filteredHousekeeping = useMemo(() => {
    return housekeepingList.filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchTicket = item.ticketNumber.toLowerCase().includes(q);
        const matchUnit = item.unitNumber.toLowerCase().includes(q);
        const matchReporter = item.reportedBy?.name?.toLowerCase().includes(q);
        if (!matchTicket && !matchUnit && !matchReporter) return false;
      }

      if (filters.housekeepingStatus !== 'ALL' && item.status !== filters.housekeepingStatus) return false;
      if (filters.serviceType !== 'ALL' && item.serviceType !== filters.serviceType) return false;
      if (filters.propertyId !== 'ALL' && item.propertyId !== filters.propertyId) return false;

      if (filters.ratingStatus === 'RATED' && !item.rating) return false;
      if (filters.ratingStatus === 'UNRATED' && item.rating) return false;

      // Date Filtering
      if (filters.startDate) {
        const itemDate = new Date(item.createdAt).getTime();
        const startDate = new Date(filters.startDate).getTime();
        if (itemDate < startDate) return false;
      }

      if (filters.endDate) {
        const itemDate = new Date(item.createdAt).getTime();
        const endDate = new Date(filters.endDate).getTime() + 86400000;
        if (itemDate > endDate) return false;
      }

      return true;
    });
  }, [housekeepingList, filters]);

  const filteredMaintenance = useMemo(() => {
    return maintenanceList.filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchTicket = item.ticketNumber.toLowerCase().includes(q);
        const matchUnit = item.unitNumber.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchReporter = item.reportedBy?.name?.toLowerCase().includes(q);
        if (!matchTicket && !matchUnit && !matchTitle && !matchReporter) return false;
      }

      if (filters.maintenanceStatus !== 'ALL' && item.status !== filters.maintenanceStatus) return false;
      if (filters.priority !== 'ALL' && item.priority !== filters.priority) return false;
      if (filters.propertyId !== 'ALL' && item.propertyId !== filters.propertyId) return false;

      if (filters.ratingStatus === 'RATED' && !item.rating) return false;
      if (filters.ratingStatus === 'UNRATED' && item.rating) return false;

      // Date Filtering
      if (filters.startDate) {
        const itemDate = new Date(item.createdAt).getTime();
        const startDate = new Date(filters.startDate).getTime();
        if (itemDate < startDate) return false;
      }

      if (filters.endDate) {
        const itemDate = new Date(item.createdAt).getTime();
        const endDate = new Date(filters.endDate).getTime() + 86400000;
        if (itemDate > endDate) return false;
      }

      return true;
    });
  }, [maintenanceList, filters]);

  const metrics: ReportsMetrics = useMemo(() => {
    return {
      totalHousekeeping: housekeepingList.length,
      housekeepingPending: housekeepingList.filter((h) => h.status === 'REQUESTED' || h.status === 'ASSIGNED').length,
      housekeepingCompleted: housekeepingList.filter((h) => h.status === 'COMPLETED' || h.status === 'CLOSED').length,

      totalMaintenance: maintenanceList.length,
      maintenanceReported: maintenanceList.filter((m) => m.status === 'REPORTED').length,
      maintenanceAwaitingApproval: 0,
      maintenanceInProgress: maintenanceList.filter((m) => m.status === 'IN_PROGRESS').length,
      maintenanceResolved: maintenanceList.filter((m) => m.status === 'RESOLVED' || m.status === 'CLOSED').length,
    };
  }, [housekeepingList, maintenanceList]);

  const saveHK = (updated: HousekeepingReport[]) => {
    setHousekeepingList(updated);
    localStorage.setItem(STORAGE_HK_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('arventa_task_updated'));
  };

  const saveMNT = (updated: MaintenanceReportItem[]) => {
    setMaintenanceList(updated);
    localStorage.setItem(STORAGE_MNT_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('arventa_task_updated'));
  };

  const completeHousekeeping = (
    reportId: string,
    checklist: HousekeepingChecklist,
    notes: string,
    afterPhotos: string[]
  ) => {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const updated = housekeepingList.map((h) => {
      if (h.id === reportId) {
        const newLog: TimelineLog = {
          id: `hist-hk-${Date.now()}`,
          reportId,
          timestamp,
          status: 'COMPLETED',
          performerName: h.housekeeper?.name || 'Agus Lapangan',
          performerRole: 'Housekeeper',
          notes: notes || 'SOP kebersihan selesai 100%.',
        };

        return {
          ...h,
          status: 'COMPLETED' as HousekeepingStatus,
          checklist,
          resolutionNotes: notes,
          photos: {
            ...h.photos,
            after: [...h.photos.after, ...afterPhotos],
          },
          updatedAt: new Date().toISOString(),
          timeline: [...h.timeline, newLog],
        };
      }
      return h;
    });

    saveHK(updated);
  };

  const startRepair = (reportId: string) => {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const updated = maintenanceList.map((m) => {
      if (m.id === reportId) {
        const newLog: TimelineLog = {
          id: `hist-mnt-${Date.now()}`,
          reportId,
          timestamp,
          status: 'IN_PROGRESS',
          performerName: 'Mas Rudi (Teknisi)',
          performerRole: 'Staff Teknisi',
          notes: 'Perbaikan dimulai oleh teknisi.',
        };

        return {
          ...m,
          status: 'IN_PROGRESS' as MaintenanceStatus,
          updatedAt: new Date().toISOString(),
          timeline: [...m.timeline, newLog],
        };
      }
      return m;
    });

    saveMNT(updated);
  };

  const resolveMaintenance = (
    reportId: string,
    resolutionNotes: string,
    afterPhotos: string[]
  ) => {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const updated = maintenanceList.map((m) => {
      if (m.id === reportId) {
        const newLog: TimelineLog = {
          id: `hist-mnt-${Date.now()}`,
          reportId,
          timestamp,
          status: 'RESOLVED',
          performerName: 'Mas Rudi (Teknisi)',
          performerRole: 'Staff Teknisi',
          notes: resolutionNotes || 'Perbaikan selesai.',
        };

        return {
          ...m,
          status: 'RESOLVED' as MaintenanceStatus,
          resolutionNotes,
          photos: {
            ...m.photos,
            after: [...m.photos.after, ...afterPhotos],
          },
          updatedAt: new Date().toISOString(),
          timeline: [...m.timeline, newLog],
        };
      }
      return m;
    });

    saveMNT(updated);
  };

  const submitRating = (
    targetType: 'HOUSEKEEPING' | 'MAINTENANCE',
    reportId: string,
    score: number,
    feedback: string
  ) => {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    if (targetType === 'HOUSEKEEPING') {
      const target = housekeepingList.find((h) => h.id === reportId);
      if (target?.rating) {
        throw new Error('Ticket has already been rated');
      }

      const ratingObj: RatingData = {
        score,
        feedback,
        ratedAt: timestamp,
        ratedBy: { id: target?.reportedBy?.id || 'usr-tenant', name: target?.reportedBy?.name || 'Penyewa' },
      };

      const updated = housekeepingList.map((h) => {
        if (h.id === reportId) {
          return {
            ...h,
            rating: ratingObj,
            status: 'CLOSED' as HousekeepingStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return h;
      });

      saveHK(updated);
    } else {
      const target = maintenanceList.find((m) => m.id === reportId);
      if (target?.rating) {
        throw new Error('Ticket has already been rated');
      }

      const ratingObj: RatingData = {
        score,
        feedback,
        ratedAt: timestamp,
        ratedBy: { id: target?.reportedBy?.id || 'usr-tenant', name: target?.reportedBy?.name || 'Penyewa' },
      };

      const updated = maintenanceList.map((m) => {
        if (m.id === reportId) {
          return {
            ...m,
            rating: ratingObj,
            status: 'CLOSED' as MaintenanceStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      saveMNT(updated);
    }
  };

  return {
    activeTab,
    handleTabChange,
    housekeepingList: filteredHousekeeping,
    maintenanceList: filteredMaintenance,
    properties,
    units,
    loading,
    filters,
    metrics,
    selectedReportId,
    handleFilterChange,
    handleSelectReport,
    completeHousekeeping,
    startRepair,
    resolveMaintenance,
    submitRating,
  };
}

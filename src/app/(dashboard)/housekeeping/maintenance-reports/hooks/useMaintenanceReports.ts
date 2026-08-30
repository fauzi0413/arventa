'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HousekeepingReport,
  MaintenanceReportItem,
  ReportFilterState,
  ReportsMetrics,
  HousekeepingStatus,
  HousekeepingChecklist,
  MaintenanceStatus,
  RatingData,
  TimelineLog,
} from '../types';
import { Property } from '@/app/(dashboard)/properties/_types';
import { Unit } from '@/app/(dashboard)/units/_types';

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
  const [currentStaffName, setCurrentStaffName] = useState('Staf Housekeeping');
  const [currentUserRole, setCurrentUserRole] = useState<'HOUSEKEEPING' | 'OWNER' | 'PLATFORM_ADMIN' | 'USER'>('HOUSEKEEPING');

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

  // Load Data directly from PostgreSQL API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [propsRes, unitsRes, meRes, maintRes] = await Promise.all([
        fetch('/api/properties?limit=50').catch(() => null),
        fetch('/api/units?limit=100').catch(() => null),
        fetch('/api/auth/me').catch(() => null),
        fetch('/api/maintenance').catch(() => null),
      ]);

      let loadedProps: Property[] = [];
      let loadedUnits: Unit[] = [];

      if (propsRes && propsRes.ok) {
        const pJson = await propsRes.json();
        if (Array.isArray(pJson.data)) {
          loadedProps = pJson.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            address: `${p.address}${p.city ? `, ${p.city}` : ''}`,
            categoryId: 'cat-1',
            statusId: 'st-1',
            totalUnits: p._count?.units || p.units?.length || 0,
            occupiedUnits: 0,
            description: p.description || '',
            imageUrl: p.coverImage || '',
            createdAt: p.createdAt || new Date().toISOString(),
          }));
        }
      }

      if (unitsRes && unitsRes.ok) {
        const uJson = await unitsRes.json();
        if (Array.isArray(uJson.data)) {
          loadedUnits = uJson.data.map((u: any) => ({
            id: u.id,
            propertyId: u.propertyId,
            name: u.unitNumber || u.name,
            status: u.status,
            pricing: { monthly: Number(u.basePrice) || 0, daily: 0, deposit: 0 },
            facilities: u.facilities || [],
            tenantName: u.leases?.[0]?.tenant?.user?.fullName || u.leases?.[0]?.tenant?.fullName || '',
            tenantPhone: u.leases?.[0]?.tenant?.user?.phoneNumber || '',
            createdAt: u.createdAt || new Date().toISOString(),
          }));
        }
      }

      if (meRes && meRes.ok) {
        const meJson = await meRes.json();
        if (meJson.data?.fullName) {
          setCurrentStaffName(meJson.data.fullName);
        }
        if (meJson.data?.role) {
          setCurrentUserRole(meJson.data.role);
        }
      }

      setProperties(loadedProps);
      setUnits(loadedUnits);

      if (maintRes && maintRes.ok) {
        const mJson = await maintRes.json();
        if (mJson.data) {
          setHousekeepingList(mJson.data.housekeepingList || []);
          setMaintenanceList(mJson.data.maintenanceList || []);
        }
      }
    } catch (err) {
      console.error('Failed to load maintenance & housekeeping reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync URL query params with active tab & filters
  const handleTabChange = (tab: 'HOUSEKEEPING' | 'MAINTENANCE' | 'HISTORY') => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, tab }));
  };

  const handleFilterChange = (newFilters: Partial<ReportFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSelectReport = (id: string | null) => {
    setSelectedReportId(id);
  };

  // Filtered Lists
  const filteredHousekeeping = useMemo(() => {
    return housekeepingList.filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchTicket = item.ticketNumber?.toLowerCase().includes(q);
        const matchUnit = item.unitNumber?.toLowerCase().includes(q);
        const matchProp = item.propertyName?.toLowerCase().includes(q);
        const matchReporter = item.reportedBy?.name?.toLowerCase().includes(q);
        if (!matchTicket && !matchUnit && !matchProp && !matchReporter) return false;
      }

      if (filters.housekeepingStatus !== 'ALL' && item.status !== filters.housekeepingStatus) return false;
      if (filters.serviceType !== 'ALL' && item.serviceType !== filters.serviceType) return false;
      if (filters.propertyId !== 'ALL' && item.propertyId !== filters.propertyId) return false;

      if (filters.ratingStatus === 'RATED' && !item.rating) return false;
      if (filters.ratingStatus === 'UNRATED' && item.rating) return false;

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
        const matchTicket = item.ticketNumber?.toLowerCase().includes(q);
        const matchUnit = item.unitNumber?.toLowerCase().includes(q);
        const matchProp = item.propertyName?.toLowerCase().includes(q);
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchReporter = item.reportedBy?.name?.toLowerCase().includes(q);
        if (!matchTicket && !matchUnit && !matchProp && !matchTitle && !matchReporter) return false;
      }

      if (filters.maintenanceStatus !== 'ALL' && item.status !== filters.maintenanceStatus) return false;
      if (filters.priority !== 'ALL' && item.priority !== filters.priority) return false;
      if (filters.costLiability !== 'ALL' && item.costLiability !== filters.costLiability) return false;
      if (filters.propertyId !== 'ALL' && item.propertyId !== filters.propertyId) return false;

      if (filters.ratingStatus === 'RATED' && !item.rating) return false;
      if (filters.ratingStatus === 'UNRATED' && item.rating) return false;

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
      housekeepingPending: housekeepingList.filter((h) => h.status === 'REQUESTED' || h.status === 'IN_CLEANING').length,
      housekeepingCompleted: housekeepingList.filter((h) => h.status === 'COMPLETED' || h.status === 'CLOSED').length,

      totalMaintenance: maintenanceList.length,
      maintenanceReported: maintenanceList.filter((m) => m.status === 'REPORTED').length,
      maintenanceAwaitingApproval: maintenanceList.filter((m) => m.status === 'AWAITING_APPROVAL').length,
      maintenanceInProgress: maintenanceList.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'INSPECTION').length,
      maintenanceResolved: maintenanceList.filter((m) => m.status === 'RESOLVED' || m.status === 'CLOSED').length,
    };
  }, [housekeepingList, maintenanceList]);

  // Mutations calling Backend PostgreSQL API
  const completeHousekeeping = async (
    reportId: string,
    checklist: HousekeepingChecklist,
    notes: string,
    afterPhotos: string[]
  ) => {
    try {
      const res = await fetch(`/api/maintenance/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          checklist,
          resolutionNotes: notes,
          photosAfter: afterPhotos,
          timelineNotes: notes || 'SOP kebersihan kamar diselesaikan.',
        }),
      });

      if (res.ok) {
        await loadData();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('arventa_task_updated'));
      }
    } catch (err) {
      console.error('Failed to complete housekeeping task:', err);
    }
  };

  const startRepair = async (reportId: string) => {
    try {
      const res = await fetch(`/api/maintenance/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          timelineNotes: 'Pengerjaan perbaikan dimulai oleh staf/teknisi.',
        }),
      });

      if (res.ok) {
        await loadData();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('arventa_task_updated'));
      }
    } catch (err) {
      console.error('Failed to start repair:', err);
    }
  };

  const resolveMaintenance = async (
    reportId: string,
    resolutionNotes: string,
    afterPhotos: string[],
    actualCost?: number
  ) => {
    try {
      const res = await fetch(`/api/maintenance/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          resolutionNotes,
          photosAfter: afterPhotos,
          actualCost: actualCost || undefined,
          timelineNotes: resolutionNotes || 'Perbaikan selesai dan diverifikasi.',
        }),
      });

      if (res.ok) {
        await loadData();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('arventa_task_updated'));
      }
    } catch (err) {
      console.error('Failed to resolve maintenance report:', err);
    }
  };

  const submitRating = async (reportId: string, score: number, feedback: string) => {
    try {
      const res = await fetch(`/api/maintenance/${reportId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  return {
    activeTab,
    handleTabChange,
    housekeepingList: filteredHousekeeping,
    maintenanceList: filteredMaintenance,
    rawHousekeepingList: housekeepingList,
    rawMaintenanceList: maintenanceList,
    properties,
    units,
    loading,
    filters,
    metrics,
    currentUserRole,
    handleFilterChange,
    selectedReportId,
    handleSelectReport,
    completeHousekeeping,
    startRepair,
    resolveMaintenance,
    submitRating,
    refreshData: loadData,
  };
}

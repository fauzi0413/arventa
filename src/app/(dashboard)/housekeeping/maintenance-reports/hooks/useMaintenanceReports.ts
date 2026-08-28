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

  // Load Data directly from PostgreSQL API & local cache
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch properties, units, current user, and operational activities from API
      const [propsRes, unitsRes, meRes, actRes] = await Promise.all([
        fetch('/api/properties?limit=50').catch(() => null),
        fetch('/api/units?limit=100').catch(() => null),
        fetch('/api/auth/me').catch(() => null),
        fetch('/api/operations/activities?limit=100').catch(() => null),
      ]);

      let loadedProps: Property[] = [];
      let loadedUnits: Unit[] = [];
      let activeUser: any = null;
      let dbActivities: any[] = [];

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
          activeUser = meJson.data;
          setCurrentStaffName(meJson.data.fullName);
        }
      }

      if (actRes && actRes.ok) {
        const actJson = await actRes.json();
        if (Array.isArray(actJson.data)) {
          dbActivities = actJson.data;
        }
      }

      // Fallback local storage props/units if API returned empty
      if (loadedProps.length === 0) {
        const storedProps = localStorage.getItem('arventa_properties');
        if (storedProps) loadedProps = JSON.parse(storedProps);
      }
      if (loadedUnits.length === 0) {
        const storedUnits = localStorage.getItem('arventa_units');
        if (storedUnits) loadedUnits = JSON.parse(storedUnits);
      }

      setProperties(loadedProps);
      setUnits(loadedUnits);

      const staffName = activeUser?.fullName || localStorage.getItem('arventa_user_name') || 'Staf Housekeeping';

      // 2. Convert database activities (UnitStatusLog) into Housekeeping Reports
      const dbHousekeepingReports: HousekeepingReport[] = dbActivities
        .filter((act: any) => act.type === 'ROOM_STATUS')
        .map((act: any) => {
          const isCompleted = act.status === 'AVAILABLE' || act.status === 'Available';
          const performer = act.performerName || staffName;

          return {
            id: `hk-db-${act.id}`,
            ticketNumber: `HK-${act.id.slice(-4).toUpperCase()}`,
            propertyId: act.propertyId || loadedProps[0]?.id || 'prop-1',
            propertyName: act.propertyName || loadedProps[0]?.name || 'Properti Kost',
            unitId: act.unitId || 'unit-1',
            unitNumber: act.unitNumber || 'Kamar',
            serviceType: 'DAILY_CLEAN' as HousekeepingServiceType,
            status: (isCompleted ? 'COMPLETED' : 'IN_CLEANING') as HousekeepingStatus,
            reportedBy: { id: 'sys-sop', name: 'SOP Rutin & Jadwal Kebersihan', role: 'STAFF' as const },
            housekeeper: { id: act.performerId || 'stf-hk', name: performer, role: 'STAFF' as const },
            checklist: {
              bathroom: true,
              bedLinen: true,
              floorSweptMopped: true,
              trashEmptied: true,
            },
            notes: act.notes || 'Pembersihan kamar sesuai standar SOP kebersihan.',
            resolutionNotes: act.notes || 'Kamar telah dibersihkan dan siap digunakan.',
            photos: { before: [], after: [] },
            rating: isCompleted ? {
              score: 5,
              feedback: 'Kamar bersih, rapi, dan wangi sesuai SOP.',
              ratedAt: new Date(act.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              ratedBy: { id: 'usr-penyewa', name: 'Penyewa Kamar' },
            } : null,
            timeline: [
              {
                id: `hist-db-${act.id}`,
                reportId: `hk-db-${act.id}`,
                timestamp: new Date(act.timestamp).toLocaleDateString('id-ID', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                }),
                status: (isCompleted ? 'COMPLETED' : 'IN_CLEANING') as HousekeepingStatus,
                performerName: performer,
                performerRole: 'Housekeeper',
                notes: act.notes || 'Status kebersihan kamar tercatat di sistem.',
              },
            ],
            createdAt: act.timestamp || new Date().toISOString(),
            updatedAt: act.timestamp || new Date().toISOString(),
          };
        });

      // 3. Convert Local Storage Housekeeping Requests
      const storedHousekeepingCalls = localStorage.getItem('arventa_housekeeping_requests');
      let housekeepingCalls: HousekeepingRequest[] = storedHousekeepingCalls ? JSON.parse(storedHousekeepingCalls) : [];

      const convertedHKCalls: HousekeepingReport[] = housekeepingCalls.map((h) => {
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
          'Checkout Clean (Selesai Sewa)': 'CHECKOUT_CLEAN',
        };

        return {
          id: h.id,
          ticketNumber: `HK-CALL-${h.id.slice(-4).toUpperCase()}`,
          propertyId: parentProp?.id || loadedProps[0]?.id || 'prop-1',
          propertyName: parentProp?.name || loadedProps[0]?.name || 'Properti Kost',
          unitId: h.unitId,
          unitNumber: h.unitName,
          serviceType: serviceTypeMap[h.serviceType] || 'DAILY_CLEAN',
          status: statusMap[h.status] || 'REQUESTED',
          reportedBy: { id: `tenant-${h.unitId}`, name: parentUnit?.tenantName || 'Penghuni', role: 'TENANT' as const },
          housekeeper: { id: 'stf-current', name: staffName, role: 'STAFF' as const },
          notes: `Jadwal ${h.scheduledDate || ''} ${h.timeSlot || ''}.${h.notes ? ` Catatan: ${h.notes}` : ''}`,
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
              performerName: parentUnit?.tenantName || 'Penghuni',
              performerRole: 'Tenant',
              notes: `Panggilan kebersihan ${h.serviceType} untuk ${h.scheduledDate || 'hari ini'}.`,
            },
          ],
          createdAt: h.createdAt,
          updatedAt: h.createdAt,
        };
      });

      // 4. Convert Complaints to Maintenance Reports
      const storedComplaints = localStorage.getItem('arventa_tenant_complaints');
      let tenantComplaints: TenantComplaint[] = storedComplaints ? JSON.parse(storedComplaints) : [];

      const convertedComplaints: MaintenanceReportItem[] = tenantComplaints.map((c) => {
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
          ticketNumber: `MNT-${c.id.slice(-4).toUpperCase()}`,
          propertyId: parentProp?.id || loadedProps[0]?.id || 'prop-1',
          propertyName: parentProp?.name || loadedProps[0]?.name || 'Properti Kost',
          unitId: c.unitId,
          unitNumber: c.unitName,
          title: c.title,
          description: c.description,
          priority: priorityMap[c.priority] || 'MEDIUM',
          status: statusMap[c.status] || 'REPORTED',
          reportedBy: { id: `tenant-${c.unitId}`, name: parentUnit?.tenantName || 'Penghuni', role: 'TENANT' as const },
          assignedStaff: { id: 'stf-tech', name: 'Staf Teknisi', role: 'STAFF' as const },
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
              performerName: parentUnit?.tenantName || 'Penghuni',
              performerRole: 'Tenant',
              notes: `Komplain kategori ${c.category} diajukan oleh penghuni.`,
            },
          ],
          createdAt: c.createdAt,
          updatedAt: c.resolvedAt || c.createdAt,
        };
      });

      // Combine cached reports with DB reports
      const storedHK = localStorage.getItem(STORAGE_HK_KEY);
      const storedMNT = localStorage.getItem(STORAGE_MNT_KEY);
      let localHK: HousekeepingReport[] = storedHK ? JSON.parse(storedHK) : [];
      let localMNT: MaintenanceReportItem[] = storedMNT ? JSON.parse(storedMNT) : [];

      // Filter out old sample Agus Lapangan dummy data from local cache
      localHK = localHK.filter((h) => h.housekeeper?.name !== 'Agus Lapangan' && h.propertyName !== 'Kost Griya Melati');
      localMNT = localMNT.filter((m) => m.propertyName !== 'Kost Griya Melati');

      const hkMap = new Map<string, HousekeepingReport>();
      [...dbHousekeepingReports, ...convertedHKCalls, ...localHK].forEach((item) => hkMap.set(item.id, item));
      const finalHK = Array.from(hkMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const mntMap = new Map<string, MaintenanceReportItem>();
      [...convertedComplaints, ...localMNT].forEach((item) => mntMap.set(item.id, item));
      const finalMNT = Array.from(mntMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setHousekeepingList(finalHK);
      setMaintenanceList(finalMNT);
      localStorage.setItem(STORAGE_HK_KEY, JSON.stringify(finalHK));
      localStorage.setItem(STORAGE_MNT_KEY, JSON.stringify(finalMNT));
      setLoading(false);
    } catch (err) {
      console.warn('Error loading maintenance reports:', err);
      setLoading(false);
    }
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
      housekeepingPending: housekeepingList.filter((h) => h.status === 'REQUESTED' || h.status === 'IN_CLEANING').length,
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

    const performer = currentStaffName || 'Staf Housekeeping';

    const updated = housekeepingList.map((h) => {
      if (h.id === reportId) {
        const newLog: TimelineLog = {
          id: `hist-hk-${Date.now()}`,
          reportId,
          timestamp,
          status: 'COMPLETED',
          performerName: performer,
          performerRole: 'Housekeeper',
          notes: notes || 'SOP kebersihan selesai 100%.',
        };

        return {
          ...h,
          status: 'COMPLETED' as HousekeepingStatus,
          housekeeper: {
            id: h.housekeeper?.id || 'stf-current',
            name: performer,
            role: 'STAFF' as const,
          },
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
          performerName: currentStaffName || 'Staf Teknisi',
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
          performerName: currentStaffName || 'Staf Teknisi',
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
        throw new Error('Tiket ini sudah memiliki rating.');
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
        throw new Error('Tiket ini sudah memiliki rating.');
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

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  FileText,
  Building,
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  ContractItem,
  ContractStatus,
  ContractScope,
  PropertyOption,
  UnitOption,
  TenantOption,
} from './_types';
import ContractFormModal from './_components/ContractFormModal';
import ContractPreviewModal from './_components/ContractPreviewModal';

// Empty fallback contract list when loading
const INITIAL_MASTER_CONTRACTS: ContractItem[] = [];

export default function TenantContractPage() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Master options lists
  const [propertiesList, setPropertiesList] = useState<PropertyOption[]>([]);
  const [unitsList, setUnitsList] = useState<UnitOption[]>([]);
  const [tenantsList, setTenantsList] = useState<TenantOption[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ContractScope | 'ALL'>('ALL');
  const [propertyFilter, setPropertyFilter] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [contractToEdit, setContractToEdit] = useState<ContractItem | null>(null);
  const [contractToDelete, setContractToDelete] = useState<ContractItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Toast alert state
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastNotification({ title, message, type });
    setTimeout(() => {
      setToastNotification((curr) => (curr?.title === title ? null : curr));
    }, 4000);
  };

  // Fetch data strictly from database APIs
  const fetchMasterData = async () => {
    setLoading(true);

    // Fetch Properties
    try {
      const resProps = await fetch('/api/properties');
      if (resProps.ok) {
        const json = await resProps.json();
        if (Array.isArray(json.data)) {
          setPropertiesList(
            json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              type: p.type,
              address: p.address || '',
              city: p.city || '',
              ownerName: p.owner?.fullName || p.ownerName || 'Owner Properti',
              ownerPhone: p.owner?.phoneNumber || p.ownerPhone || '',
              ownerEmail: p.owner?.email || p.ownerEmail || '',
            }))
          );
        }
      }
    } catch (e) {
      console.error('Fetch properties error:', e);
    }

    // Fetch Units
    try {
      const resUnits = await fetch('/api/units');
      if (resUnits.ok) {
        const json = await resUnits.json();
        if (Array.isArray(json.data)) {
          setUnitsList(
            json.data.map((u: any) => ({
              id: u.id,
              propertyId: u.propertyId || u.property?.id,
              propertyName: u.propertyName || u.property?.name,
              unitNumber: u.unitNumber || u.name || 'Unit Kamar',
              basePrice: Number(u.basePrice ?? u.pricing?.monthly ?? 0),
              deposit: Number(u.deposit ?? u.pricing?.deposit ?? 0),
              status: u.rawStatus || u.status || 'AVAILABLE',
            }))
          );
        }
      }
    } catch (e) {
      console.error('Fetch units error:', e);
    }

    // Fetch Tenants
    try {
      const resTenants = await fetch('/api/tenants');
      if (resTenants.ok) {
        const json = await resTenants.json();
        if (Array.isArray(json.data)) {
          setTenantsList(
            json.data.map((t: any) => {
              const leases = Array.isArray(t.leases) ? t.leases : [];
              const activeLease = leases.find((l: any) => l.status === 'ACTIVE');
              const hasActiveContract = Boolean(activeLease);

              const logs = Array.isArray(t.leaseLogs) ? t.leaseLogs : [];
              const latestLog = logs.length > 0 ? logs[0] : null;

              let computedStatus = t.status;
              if (!computedStatus) {
                if (activeLease) {
                  computedStatus = 'AKTIF';
                } else if (leases.length > 0 && leases.every((l: any) => l.status === 'TERMINATED' || l.status === 'EXPIRED')) {
                  computedStatus = 'NONAKTIF';
                } else if (latestLog?.toStatus) {
                  computedStatus = latestLog.toStatus === 'ACTIVE' ? 'AKTIF' : latestLog.toStatus;
                } else if (t.user?.isActive && leases.length === 0 && !latestLog) {
                  computedStatus = 'AKTIF';
                } else {
                  computedStatus = 'CALON';
                }
              }

              return {
                id: t.id,
                fullName: t.fullName || t.user?.fullName || 'Tanpa Nama',
                email: t.email || t.user?.email || '',
                phoneNumber: t.phoneNumber || t.user?.phoneNumber || '',
                nik: t.nik || '',
                status: computedStatus,
                hasActiveContract,
              };
            })
          );
        }
      }
    } catch (e) {
      console.error('Fetch tenants error:', e);
    }

    // Fetch Contracts from Database
    try {
      const resContracts = await fetch('/api/contracts');
      if (resContracts.ok) {
        const json = await resContracts.json();
        if (Array.isArray(json.data)) {
          const mapped: ContractItem[] = json.data.map((item: any) => ({
            id: item.id,
            contractNumber: item.contractUrl || `KTR/ARV/${item.id.slice(0, 6).toUpperCase()}`,
            scope: item.unit?.unitNumber?.includes('Gedung Utuh') ? 'PROPERTY' : 'UNIT',
            status: item.status || 'ACTIVE',
            tenantId: item.tenantId,
            tenantName: item.tenant?.fullName || item.tenant?.user?.fullName || 'Penyewa',
            tenantPhone: item.tenant?.phoneNumber || item.tenant?.user?.phoneNumber || '',
            tenantEmail: item.unit?.unitUser?.email || item.tenant?.email || item.tenant?.user?.email || '',
            tenantNik: item.tenant?.nik || '',
            propertyId: item.unit?.property?.id || item.unit?.propertyId || '',
            propertyName: item.unit?.property?.name || 'Properti',
            propertyAddress: item.unit?.property?.address || '',
            ownerName: item.unit?.property?.owner?.fullName || 'Owner Properti',
            ownerPhone: item.unit?.property?.owner?.phoneNumber || '',
            ownerEmail: item.unit?.property?.owner?.email || '',
            unitId: item.unitId,
            unitName: item.unit?.unitNumber || 'Unit',
            rentalPeriod: item.rentalPeriod || 'MONTHLY',
            startDate: item.startDate,
            endDate: item.endDate,
            rentPrice: Number(item.rentPrice || 0),
            securityDeposit: Number(item.securityDeposit || 0),
            customClauses: Array.isArray(item.customClauses) ? item.customClauses : [],
            notes: item.notes || '',
            createdAt: item.createdAt,
          }));

          setContracts(mapped);
          localStorage.setItem('arventa_master_contracts', JSON.stringify(mapped));
        }
      }
    } catch (e) {
      console.error('API contracts fetch error:', e);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Check if page was navigated with trigger from Manajemen Penyewa
  const [isTriggeredFromTenants, setIsTriggeredFromTenants] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('createForTenantId') || params.has('tenantId')) {
        setIsTriggeredFromTenants(true);
      }
    }
  }, []);

  useEffect(() => {
    if (hasAutoOpened || tenantsList.length === 0 || !isTriggeredFromTenants) return;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tenantIdFromUrl = params.get('createForTenantId') || params.get('tenantId');
      if (tenantIdFromUrl) {
        const found = tenantsList.find((t) => t.id === tenantIdFromUrl);
        if (found) {
          setContractToEdit({
            id: '',
            contractNumber: '',
            scope: 'UNIT',
            status: 'ACTIVE',
            tenantId: found.id,
            tenantName: found.fullName,
            tenantPhone: found.phoneNumber || '',
            tenantEmail: found.email || '',
            tenantNik: found.nik || '',
            propertyId: propertiesList[0]?.id || '',
            propertyName: propertiesList[0]?.name || '',
            unitId: '',
            unitName: '',
            rentalPeriod: 'MONTHLY',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            rentPrice: 0,
            securityDeposit: 0,
            createdAt: new Date().toISOString(),
          } as ContractItem);
          setIsFormModalOpen(true);
          setHasAutoOpened(true);
        }
      }
    }
  }, [tenantsList, propertiesList, hasAutoOpened, isTriggeredFromTenants]);

  // Check URL parameters for auto-searching and auto-opening contract preview modal
  const [hasAutoPreviewed, setHasAutoPreviewed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const searchVal = params.get('search') || params.get('viewContractNumber') || params.get('viewContractId');

    if (searchVal && !searchQuery) {
      setSearchQuery(searchVal);
    }

    if (!hasAutoPreviewed && contracts.length > 0 && searchVal) {
      const match = contracts.find(
        (c) =>
          c.contractNumber.toLowerCase() === searchVal.toLowerCase() ||
          c.id === searchVal ||
          c.contractNumber.toLowerCase().includes(searchVal.toLowerCase()) ||
          c.tenantName.toLowerCase().includes(searchVal.toLowerCase())
      );

      if (match) {
        setSelectedContract(match);
        setIsPreviewModalOpen(true);
        setHasAutoPreviewed(true);
      }
    }
  }, [contracts, hasAutoPreviewed, searchQuery]);

  // Reset all filters, search query, modal states, URL path, and refresh data
  const handleResetAndRefreshData = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setScopeFilter('ALL');
    setPropertyFilter('ALL');
    setCurrentPage(1);

    setIsPreviewModalOpen(false);
    setSelectedContract(null);
    setHasAutoPreviewed(true);

    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    fetchMasterData();
  };

  const saveContractsLocally = (updated: ContractItem[]) => {
    setContracts(updated);
    localStorage.setItem('arventa_master_contracts', JSON.stringify(updated));
  };

  // Metrics Summary Calculation
  const metrics = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.status === 'ACTIVE');
    const draft = contracts.filter((c) => c.status === 'DRAFT');
    const terminated = contracts.filter((c) => c.status === 'TERMINATED' || c.status === 'EXPIRED');

    const totalActiveRevenue = active.reduce((sum, c) => sum + (c.rentPrice || 0), 0);
    const totalDeposit = active.reduce((sum, c) => sum + (c.securityDeposit || 0), 0);

    return {
      total,
      activeCount: active.length,
      draftCount: draft.length,
      terminatedCount: terminated.length,
      totalActiveRevenue,
      totalDeposit,
    };
  }, [contracts]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          c.contractNumber.toLowerCase().includes(q) ||
          c.tenantName.toLowerCase().includes(q) ||
          c.propertyName.toLowerCase().includes(q) ||
          (c.unitName && c.unitName.toLowerCase().includes(q));

        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchesScope = scopeFilter === 'ALL' || c.scope === scopeFilter;
        const matchesProperty = propertyFilter === 'ALL' || c.propertyId === propertyFilter;

        return matchesSearch && matchesStatus && matchesScope && matchesProperty;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts, searchQuery, statusFilter, scopeFilter, propertyFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, scopeFilter, propertyFilter, itemsPerPage]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContracts.slice(start, start + itemsPerPage);
  }, [filteredContracts, currentPage, itemsPerPage]);

  // Handlers
  const handleOpenCreateModal = () => {
    setContractToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (c: ContractItem) => {
    setContractToEdit(c);
    setIsFormModalOpen(true);
  };

  const handleOpenPreviewModal = (c: ContractItem) => {
    setSelectedContract(c);
    setIsPreviewModalOpen(true);
  };

  const handleActivateContract = async (c: ContractItem) => {
    if (!confirm(`Apakah Anda yakin ingin menyetujui & mengaktifkan kontrak ${c.contractNumber}? Status penyewa akan menjadi AKTIF, unit terisi (OCCUPIED), dan invoice tagihan sewa akan terbit otomatis.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contracts/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (res.ok) {
        await fetchMasterData();
        showToast(
          'Kontrak Berhasil Diaktifkan',
          `Kontrak ${c.contractNumber} telah aktif. Status penyewa kini AKTIF dan invoice tagihan telah diterbitkan.`
        );
      } else {
        const json = await res.json();
        alert(json.message || 'Gagal mengaktifkan kontrak');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan saat mengaktifkan kontrak');
    }
  };

  const handleSaveContract = async (contractData: Partial<ContractItem>) => {
    if (contractData.id && !contractData.id.startsWith('contract-')) {
      // API Edit Database
      try {
        const res = await fetch(`/api/contracts/${contractData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractData),
        });

        if (res.ok) {
          await fetchMasterData();
          showToast('Kontrak Sewa Diperbarui di Database', `Kontrak ${contractData.contractNumber || ''} berhasil disimpan ke database PostgreSQL.`);
          return;
        }
      } catch (e) {
        console.error('API update error:', e);
      }
    }

    // API Create Database (For new contracts or upgrading local contracts to DB)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (res.ok) {
        await fetchMasterData();
        showToast(
          contractData.id ? 'Kontrak Sewa Diperbarui di Database' : 'Kontrak Sewa Berhasil Diterbitkan ke Database',
          `Surat perjanjian sewa digital untuk ${contractData.tenantName || ''} telah tersimpan permanen di database.`
        );
        return;
      } else {
        const json = await res.json();
        throw new Error(json.message || 'Gagal menyimpan ke database');
      }
    } catch (e: any) {
      console.warn('API create notice: fallback to local state', e);
      // Local fallback create
      const newContract: ContractItem = {
        id: contractData.id || `contract-${Date.now()}`,
        contractNumber: contractData.contractNumber || `KTR/ARV/${Date.now().toString().slice(-6)}`,
        scope: contractData.scope || 'UNIT',
        status: contractData.status || 'ACTIVE',
        tenantId: contractData.tenantId || `tenant-${Date.now()}`,
        tenantName: contractData.tenantName || 'Penyewa',
        tenantPhone: contractData.tenantPhone || '',
        tenantEmail: contractData.tenantEmail || '',
        tenantNik: contractData.tenantNik || '',
        propertyId: contractData.propertyId || 'prop-1',
        propertyName: contractData.propertyName || 'Properti',
        propertyAddress: contractData.propertyAddress || '',
        unitId: contractData.unitId,
        unitName: contractData.unitName || 'Unit',
        rentalPeriod: contractData.rentalPeriod || 'MONTHLY',
        startDate: contractData.startDate || new Date().toISOString().split('T')[0],
        endDate: contractData.endDate || new Date().toISOString().split('T')[0],
        rentPrice: contractData.rentPrice || 0,
        securityDeposit: contractData.securityDeposit || 0,
        customClauses: contractData.customClauses,
        notes: contractData.notes,
        createdAt: new Date().toISOString(),
      };

      const updatedLocally = contractData.id
        ? contracts.map((c) => (c.id === contractData.id ? { ...c, ...contractData } as ContractItem : c))
        : [newContract, ...contracts];

      saveContractsLocally(updatedLocally);
      showToast('Kontrak Sewa Disimpan', `Data kontrak untuk ${contractData.tenantName || ''} telah tersimpan.`);
    }
  };

  const handleToggleStatus = async (contract: ContractItem) => {
    const newStatus: ContractStatus = contract.status === 'ACTIVE' ? 'TERMINATED' : 'ACTIVE';
    const statusText = newStatus === 'ACTIVE' ? 'Diaktifkan Kembali' : 'Diakhiri (Terminated)';

    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchMasterData();
        showToast('Status Kontrak Diubah', `Kontrak ${contract.contractNumber} telah status: ${statusText}.`);
        return;
      }
    } catch (e) {
      console.warn('API status toggle notice: fallback local state', e);
    }

    const updated = contracts.map((c) =>
      c.id === contract.id ? { ...c, status: newStatus } : c
    );
    saveContractsLocally(updated);
    showToast('Status Kontrak Diubah', `Kontrak ${contract.contractNumber} telah status: ${statusText}.`);
  };

  const handleDeleteContract = async (id: string) => {
    const target = contracts.find((c) => c.id === id);
    if (!target) return;

    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMasterData();
        showToast('Kontrak Dihapus', `Kontrak ${target.contractNumber} telah dihapus dari sistem.`);
        setContractToDelete(null);
        return;
      }
    } catch (e) {
      console.warn('API delete notice: fallback local state', e);
    }

    const updated = contracts.filter((c) => c.id !== id);
    saveContractsLocally(updated);
    showToast('Kontrak Dihapus', `Kontrak ${target.contractNumber} telah dihapus dari sistem.`);
    setContractToDelete(null);
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> AKTIF
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5" /> DRAFT / PENDING
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" /> KADALUARSA
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1.5 shrink-0">
            <XCircle className="w-3.5 h-3.5" /> TERMINATED
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && isTriggeredFromTenants) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center mb-6">
          {/* Outer glowing aura */}
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 blur-xl animate-pulse" />
          {/* Animated Spin Ring */}
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          {/* Center Icon */}
          <div className="absolute p-3 rounded-2xl bg-card border border-border shadow-lg text-primary">
            <FileText className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        <h3 className="text-base font-black text-foreground tracking-tight mb-1">
          Menghubungkan Data & Memuat Kontrak...
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Harap tunggu sebentar, sistem sedang memverifikasi unit kamar, data penyewa, dan Surat Perjanjian Digital dari database.
        </p>

        {/* Animated Progress bar */}
        <div className="w-56 h-1.5 bg-muted rounded-full overflow-hidden mt-5 relative">
          <div className="h-full bg-primary rounded-full animate-pulse w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Alert Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-card border border-border shadow-xl rounded-2xl p-4 flex items-center gap-3 max-w-md">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">{toastNotification.title}</h4>
              <p className="text-xs text-muted-foreground">{toastNotification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Kontrak Penyewa
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Buat, kelola, cetak, dan terbitkan Surat Perjanjian Sewa Digital per unit maupun properti utuh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAndRefreshData}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reset filter & Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Buat Kontrak Baru
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Contracts */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Kontrak Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.activeCount}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Rp {metrics.totalActiveRevenue.toLocaleString('id-ID')} /bln terikat
          </div>
        </div>

        {/* Card 2: Draft Contracts */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Draft / Pending</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.draftCount}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            Menunggu persetujuan / TTD
          </div>
        </div>

        {/* Card 3: Terminated / Expired */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Selesai / Kadaluarsa</span>
            <div className="p-2 rounded-xl bg-muted text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.terminatedCount}</div>
          <div className="text-[11px] text-muted-foreground font-semibold">
            Kontrak non-aktif / diakhiri
          </div>
        </div>

        {/* Card 4: Total Deposit */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Uang Deposit Terikat</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            Rp {metrics.totalDeposit.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
            Total jaminan di tangan owner
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor kontrak, nama penyewa, properti, atau nomor unit..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="DRAFT">Draft / Pending</option>
              <option value="EXPIRED">Kadaluarsa</option>
              <option value="TERMINATED">Terminated</option>
            </select>

            {/* Scope Filter */}
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="ALL">Semua Cakupan</option>
              <option value="UNIT">Per Unit / Kamar</option>
              <option value="PROPERTY">Per Properti Utuh</option>
            </select>

            {/* Property Filter */}
            {propertiesList.length > 0 && (
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="ALL">Semua Properti</option>
                {propertiesList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5">No. Kontrak & Scope</th>
                <th className="px-4 py-3.5">Penyewa Utama</th>
                <th className="px-4 py-3.5">Properti & Unit</th>
                <th className="px-4 py-3.5">Masa Sewa</th>
                <th className="px-4 py-3.5 text-right">Harga Sewa & Deposit</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Memuat data kontrak sewa...
                  </td>
                </tr>
              ) : paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-semibold text-foreground">Tidak Ada Kontrak Sewa Ditemukan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {searchQuery || statusFilter !== 'ALL' || scopeFilter !== 'ALL'
                        ? 'Coba sesuaikan kata kunci atau filter pencarian Anda'
                        : 'Klik tombol "Buat Kontrak Baru" untuk membuat kontrak pertama Anda.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    {/* No Kontrak & Scope */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-mono font-bold text-foreground">{c.contractNumber}</div>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                        {c.scope === 'PROPERTY' ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                            <Building className="w-3 h-3" /> Gedung Utuh
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                            <Home className="w-3 h-3" /> Per Unit
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Penyewa */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-foreground">{c.tenantName}</div>
                      <div className="text-[11px] text-muted-foreground">{c.tenantPhone || c.tenantEmail || '-'}</div>
                    </td>

                    {/* Properti & Unit */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-foreground">{c.propertyName}</div>
                      <div className="text-[11px] text-primary font-bold">{c.unitName}</div>
                    </td>

                    {/* Masa Sewa */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-medium text-foreground">
                        {c.startDate ? new Date(c.startDate).toLocaleDateString('id-ID') : '-'} s/d{' '}
                        {c.endDate ? new Date(c.endDate).toLocaleDateString('id-ID') : '-'}
                      </div>
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                        Skema: {c.rentalPeriod}
                      </div>
                    </td>

                    {/* Harga & Deposit */}
                    <td className="px-4 py-3.5 align-top text-right">
                      <div className="font-extrabold text-foreground">
                        Rp {c.rentPrice?.toLocaleString('id-ID')}
                      </div>
                      {c.securityDeposit > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          Dep: Rp {c.securityDeposit?.toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 align-top text-center">
                      {getStatusBadge(c.status)}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        {c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleActivateContract(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-500/20 shrink-0"
                            title="Setujui & Aktifkan Kontrak Ini"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan
                          </button>
                        )}

                        {c.status === 'EXPIRED' && (
                          <button
                            onClick={() => {
                              setContractToEdit(null);
                              setIsFormModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs flex items-center gap-1 transition-colors border border-blue-500/20 shrink-0"
                            title="Buat Perpanjangan Kontrak Baru (Renew)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Perpanjang
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenPreviewModal(c)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors shrink-0"
                          title="Pratinjau / Cetak Kontrak Digital"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                          title="Edit Kontrak"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setContractToDelete(c)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          title="Hapus Kontrak"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredContracts.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-muted/20">
            <div className="text-muted-foreground">
              Menampilkan {Math.min(filteredContracts.length, (currentPage - 1) * itemsPerPage + 1)} -{' '}
              {Math.min(filteredContracts.length, currentPage * itemsPerPage)} dari total{' '}
              <span className="font-bold text-foreground">{filteredContracts.length}</span> kontrak
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-semibold text-foreground px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ContractFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveContract}
        initialData={contractToEdit}
        propertiesList={propertiesList}
        unitsList={unitsList}
        tenantsList={tenantsList}
      />

      <ContractPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
        contract={selectedContract}
      />

      {/* Modal Confirm Delete */}
      {contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-foreground">Hapus Kontrak Sewa?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus dokumen kontrak{' '}
              <strong className="text-foreground">{contractToDelete.contractNumber}</strong> atas nama{' '}
              <strong className="text-foreground">{contractToDelete.tenantName}</strong>? Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setContractToDelete(null)}
                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteContract(contractToDelete.id)}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold shadow-md transition-all"
              >
                Ya, Hapus Kontrak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

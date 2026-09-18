'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Layers,
  User,
  Phone,
  Calendar,
  Info,
  Package,
  ShieldAlert,
  Award,
  Compass,
  DollarSign,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  Wrench,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  CreditCard,
  MessageCircle,
  Send,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';
import { Property, InventoryItem, InventoryCondition } from '@/app/(dashboard)/properties/_types';
import { useSafeBack } from '@/app/_hooks/useSafeBack';
import AssignTenantModal from '@/app/(dashboard)/units/_components/AssignTenantModal';
import UnitFormModal from '@/app/(dashboard)/units/_components/UnitFormModal';
import ImageFileInput from '@/app/(dashboard)/housekeeping/maintenance-reports/components/common/ImageFileInput';
import TenantInvoiceHistoryModal from './_components/TenantInvoiceHistoryModal';
import FacilityIcon from '@/components/common/FacilityIcon';

const CONDITION_BADGE_STYLE = (cond: InventoryCondition) => {
  switch (cond) {
    case 'Baik':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'Perlu Perbaikan':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'Rusak Berat':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    case 'Hilang':
      return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function PropertyUnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const unitId = params?.unitId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<'ALL' | 'UNIT' | 'COMMON_AREA'>('ALL');
  const [loading, setLoading] = useState(true);
  const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState(false);
  const [invoiceKPI, setInvoiceKPI] = useState<{
    id: string;
    invoiceNumber: string;
    periodName: string;
    amount: number;
    dueDate: string;
    status: 'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE';
    isOverdueBeforeCurrentMonth: boolean;
  } | null>(null);
  const [unitInvoices, setUnitInvoices] = useState<any[]>([]);
  const [isInvoiceHistoryModalOpen, setIsInvoiceHistoryModalOpen] = useState(false);

  const resolveInvoiceKPILogic = (invoices: any[], basePrice: number) => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const unpaidPrevious = invoices.filter((inv) => {
      const due = new Date(inv.dueDate || inv.createdAt || now);
      const isUnpaid = inv.status === 'UNPAID' || inv.status === 'PENDING' || inv.status === 'OVERDUE';
      return due < currentMonthStart && isUnpaid;
    });

    if (unpaidPrevious.length > 0) {
      unpaidPrevious.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      const target = unpaidPrevious[0];
      const due = new Date(target.dueDate);
      const periodName = due.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return {
        id: target.id,
        invoiceNumber: target.invoiceNumber || `INV-${target.id.slice(0, 8)}`,
        periodName: `Tagihan ${periodName}`,
        amount: Number(target.totalAmount || target.amount || basePrice || 4500000),
        dueDate: target.dueDate,
        status: (target.status === 'OVERDUE' ? 'OVERDUE' : 'UNPAID') as any,
        isOverdueBeforeCurrentMonth: true,
      };
    }

    const currentMonthInvoice = invoices.find((inv) => {
      const due = new Date(inv.dueDate || inv.createdAt || now);
      return due >= currentMonthStart;
    }) || invoices[0];

    if (currentMonthInvoice) {
      const due = new Date(currentMonthInvoice.dueDate || now);
      const periodName = due.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return {
        id: currentMonthInvoice.id,
        invoiceNumber: currentMonthInvoice.invoiceNumber || `INV-${currentMonthInvoice.id.slice(0, 8)}`,
        periodName: `Tagihan ${periodName}`,
        amount: Number(currentMonthInvoice.totalAmount || currentMonthInvoice.amount || basePrice || 4500000),
        dueDate: currentMonthInvoice.dueDate || now.toISOString(),
        status: currentMonthInvoice.status || 'UNPAID',
        isOverdueBeforeCurrentMonth: false,
      };
    }

    const currentPeriodName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      id: `inv-current-${now.getTime()}`,
      invoiceNumber: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-001`,
      periodName: `Tagihan ${currentPeriodName}`,
      amount: basePrice || 4500000,
      dueDate: endOfMonth.toISOString(),
      status: 'PAID' as const,
      isOverdueBeforeCurrentMonth: false,
    };
  };

  const resolveUnitInventories = async (unitObj: any, propId: string, currentProp?: Property | null) => {
    let resolved: InventoryItem[] = [];
    const selectedNames = Array.isArray(unitObj.facilities) ? unitObj.facilities : [];
    const selectedIds = Array.isArray(unitObj.inventoryIds) ? unitObj.inventoryIds : [];

    try {
      const invRes = await fetch(`/api/inventory?propertyId=${propId}`);
      if (invRes.ok) {
        const invJson = await invRes.json();
        const propMasterItems = invJson.data?.propertyInventories || [];
        if (Array.isArray(propMasterItems)) {
          propMasterItems.forEach((p: any) => {
            const isMatchById = selectedIds.includes(p.id);
            const isMatchByName = selectedNames.some((n: string) => n.toLowerCase() === p.itemName?.toLowerCase());
            const isCommonArea = p.locationType === 'COMMON_AREA';

            if (isMatchById || isMatchByName || isCommonArea) {
              const alreadyExists = resolved.some(
                (r) => r.id === p.id || (r.name.toLowerCase() === p.itemName?.toLowerCase() && r.locationType === p.locationType)
              );
              if (!alreadyExists) {
                resolved.push({
                  id: p.id,
                  propertyId: propId,
                  unitId: isCommonArea ? undefined : unitObj.id,
                  unitName: isCommonArea ? 'Area Umum' : unitObj.name,
                  name: p.itemName,
                  locationType: (p.locationType as 'UNIT' | 'COMMON_AREA') || (isCommonArea ? 'COMMON_AREA' : 'UNIT'),
                  condition: (p.condition as InventoryCondition) || 'Baik',
                  imageUrl: p.imageUrl,
                  lastUpdated: p.updatedAt || new Date().toISOString(),
                });
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch property master inventory:', e);
    }

    // If any selected facility name for unit is not yet in resolved items, append it cleanly
    selectedNames.forEach((facName: string, idx: number) => {
      if (!resolved.some((r) => r.name.toLowerCase() === facName.toLowerCase() && r.locationType === 'UNIT')) {
        resolved.push({
          id: `unit-fac-${idx}-${Date.now()}`,
          propertyId: propId,
          unitId: unitObj.id,
          unitName: unitObj.name,
          name: facName,
          locationType: 'UNIT',
          condition: 'Baik',
          lastUpdated: unitObj.createdAt || new Date().toISOString(),
        });
      }
    });

    // If property has WiFi enabled and no WiFi item exists in resolved list, add common area WiFi item
    if (currentProp?.hasWifi && !resolved.some((r) => r.name.toLowerCase().includes('wifi'))) {
      resolved.push({
        id: `prop-wifi-${propId}`,
        propertyId: propId,
        unitName: 'Area Umum',
        name: currentProp.wifiSsid ? `WiFi (${currentProp.wifiSsid})` : 'WiFi / Internet',
        locationType: 'COMMON_AREA',
        condition: 'Baik',
        lastUpdated: new Date().toISOString(),
      });
    }

    return resolved;
  };

  const handleEditUnitSubmit = async (unitData: Omit<Unit, 'id' | 'createdAt'>) => {
    if (!unit) return;
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unitData.name,
          status: unitData.status,
          basePrice: unitData.pricing.monthly,
          transitPrice: unitData.pricing.daily,
          deposit: unitData.pricing.deposit,
          capacity: unitData.capacity.maxPersons,
          dimensions: unitData.capacity.dimensions,
          facilities: unitData.facilities,
          description: unitData.description,
          inventoryIds: unitData.inventoryIds,
          smartLockPin: unitData.smartLockPin,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const updatedData = json.data;
        if (updatedData) {
          setUnit(updatedData);
          const resolved = await resolveUnitInventories(updatedData, propertyId, property);
          setInventories(resolved);
        } else {
          setUnit((prev) => (prev ? { ...prev, ...unitData } : null));
          const resolved = await resolveUnitInventories({ ...unit, ...unitData, id: unit.id }, propertyId, property);
          setInventories(resolved);
        }
        await fetchUnitData();
      } else {
        setUnit((prev) => (prev ? { ...prev, ...unitData } : null));
        const resolved = await resolveUnitInventories({ ...unit, ...unitData, id: unit.id }, propertyId, property);
        setInventories(resolved);
      }

      const storedUnits = localStorage.getItem('arventa_units');
      if (storedUnits) {
        const allUnits: Unit[] = JSON.parse(storedUnits);
        const updated = allUnits.map((u) => (u.id === unit.id ? { ...u, ...unitData } : u));
        localStorage.setItem('arventa_units', JSON.stringify(updated));
      }

      setIsEditUnitModalOpen(false);
    } catch (err) {
      console.error('Failed to update unit:', err);
      setUnit({ ...unit, ...unitData });
      setIsEditUnitModalOpen(false);
    }
  };

  // 1 Kamar 1 Akun states
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'OWNER' | 'HOUSEKEEPING'>('OWNER');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Unit Maintenance Ticket Creation state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketType, setTicketType] = useState<'REPAIR' | 'HOUSEKEEPING'>('REPAIR');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketCostLiability, setTicketCostLiability] = useState('OWNER');
  const [ticketEstCost, setTicketEstCost] = useState('');
  const [ticketPhotos, setTicketPhotos] = useState<string[]>([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketToast, setTicketToast] = useState<string | null>(null);

  const handleOpenCreateTicket = (type: 'REPAIR' | 'HOUSEKEEPING' = 'REPAIR', initialTitle = '') => {
    setTicketType(type);
    setTicketTitle(initialTitle || (type === 'REPAIR' ? `Perbaikan Unit ${unit?.name || ''}` : `Pembersihan Unit ${unit?.name || ''}`));
    setTicketDesc('');
    setTicketPriority('MEDIUM');
    setTicketCostLiability('OWNER');
    setTicketEstCost('');
    setTicketPhotos([]);
    setIsTicketModalOpen(true);
  };

  const handleCreateMaintenanceTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;

    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          unitId: unit.id,
          type: ticketType,
          title: ticketTitle,
          description: ticketDesc,
          priority: ticketPriority,
          photosBefore: ticketPhotos,
          costLiability: ticketCostLiability,
          estimatedCost: ticketEstCost ? Number(ticketEstCost) : undefined,
        }),
      });

      if (res.ok) {
        setIsTicketModalOpen(false);
        setTicketPhotos([]);
        setTicketToast(`Tiket ${ticketType === 'REPAIR' ? 'perbaikan' : 'housekeeping'} untuk kamar ${unit.name} berhasil dibuat!`);
        setTimeout(() => setTicketToast(null), 4500);

        if (ticketType === 'REPAIR') {
          setUnit((prev) => (prev ? { ...prev, status: 'MAINTENANCE' as any } : null));
        } else {
          setUnit((prev) => (prev ? { ...prev, status: 'CLEANING' as any } : null));
        }
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal membuat tiket');
      }
    } catch (err) {
      console.error('Failed to submit maintenance ticket:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const fetchUnitData = useCallback(async () => {
    // 1. Attempt API fetch
      try {
        const res = await fetch(`/api/units/${unitId}`);
        if (res.ok) {
          const json = await res.json();
          const uData = json.data;
          if (uData) {
            let pData: Property | null = null;
            try {
              const pRes = await fetch(`/api/properties/${propertyId}`);
              if (pRes.ok) {
                const pJson = await pRes.json();
                const pRaw = pJson.data;
                if (pRaw) {
                  const typeToCat: Record<string, string> = {
                    KOS: 'cat-1',
                    APARTEMEN: 'cat-2',
                    KONTRAKAN: 'cat-3',
                    RUKO: 'cat-4',
                  };
                  pData = {
                    id: pRaw.id,
                    name: pRaw.name,
                    address: pRaw.address,
                    categoryId: typeToCat[pRaw.type] || 'cat-1',
                    statusId: 'st-1',
                    totalUnits: pRaw.units?.length || 0,
                    occupiedUnits: pRaw.units?.filter((u: any) => u.status === 'OCCUPIED' || u.status === 'Occupied').length || 0,
                    description: pRaw.description || '',
                    imageUrl: pRaw.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
                    hasCleaningService: pRaw.hasCleaningService ?? true,
                    hasWifi: Boolean(pRaw.hasWifi),
                    wifiSsid: pRaw.wifiSsid || null,
                    wifiPassword: pRaw.wifiPassword || null,
                    hasSmartLock: Boolean(pRaw.hasSmartLock),
                    createdAt: pRaw.createdAt || new Date().toISOString(),
                  };
                }
              }
            } catch (err) {
              console.warn('API property detail error:', err);
            }

            if (!pData) {
              const storedProps = localStorage.getItem('arventa_properties');
              if (storedProps) {
                const loadedProps: Property[] = JSON.parse(storedProps);
                pData = loadedProps.find((p) => p.id === propertyId) || null;
              }
            }

            if (!pData) {
              pData = {
                id: propertyId,
                name: uData.propertyName || 'Properti',
                address: 'Bandung',
                categoryId: 'cat-1',
                statusId: 'st-1',
                totalUnits: 1,
                occupiedUnits: uData.status === 'Occupied' ? 1 : 0,
                description: '',
                hasCleaningService: true,
                createdAt: new Date().toISOString(),
              };
            }

            setProperty(pData);
            setUnit(uData);

            // Calculate Tenant Invoice KPI & Store Unit Invoices
            try {
              const resInv = await fetch(`/api/finance/invoices?unitId=${unitId}&limit=100`);
              if (resInv.ok) {
                const invJson = await resInv.json();
                if (Array.isArray(invJson.data)) {
                  setUnitInvoices(invJson.data);
                  setInvoiceKPI(resolveInvoiceKPILogic(invJson.data, uData.pricing?.monthly || 4500000));
                } else {
                  setUnitInvoices([]);
                  setInvoiceKPI(resolveInvoiceKPILogic([], uData.pricing?.monthly || 4500000));
                }
              } else {
                setUnitInvoices([]);
                setInvoiceKPI(resolveInvoiceKPILogic([], uData.pricing?.monthly || 4500000));
              }
            } catch (e) {
              setUnitInvoices([]);
              setInvoiceKPI(resolveInvoiceKPILogic([], uData.pricing?.monthly || 4500000));
            }

            // Resolve inventories from unit facilities / inventoryIds & property common area
            const resolvedUnitInvs = await resolveUnitInventories(uData, propertyId, pData);
            setInventories(resolvedUnitInvs);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API unit detail error notice: falling back to local storage', err);
      }

      // 2. Fallback to LocalStorage
      const storedProps = localStorage.getItem('arventa_properties');
      const storedUnits = localStorage.getItem('arventa_units');

      let loadedProps: Property[] = [];
      let loadedUnits: Unit[] = [];

      if (storedProps) loadedProps = JSON.parse(storedProps);
      if (storedUnits) loadedUnits = JSON.parse(storedUnits);

      const foundProp = loadedProps.find((p) => p.id === propertyId);
      const foundUnit = loadedUnits.find((u) => u.id === unitId);

      if (foundUnit && (!foundUnit.roomEmail || !foundUnit.roomPassword)) {
        const cleanProp = (foundProp?.name || 'prop')
          .toLowerCase()
          .replace(/^(kos|kost|kontrakan|apartemen|ruko|wisma|homestay|residence)\s+/i, '')
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 16) || 'prop';
        const cleanName = (foundUnit.name || 'unit')
          .toLowerCase()
          .replace(/^(kamar|unit|pintu|ruang|room)\s+/i, '')
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 16) || 'unit';
        foundUnit.roomEmail = `${cleanProp}.${cleanName}@arventa.id`;
        foundUnit.roomPassword = `Arv!${Math.random().toString(36).substring(2, 8)}`;
        foundUnit.roomPasswordLastReset = new Date().toISOString();

        const updated = loadedUnits.map((u) => (u.id === foundUnit.id ? foundUnit : u));
        localStorage.setItem('arventa_units', JSON.stringify(updated));
      }

      setProperty(foundProp || null);
      setUnit(foundUnit || null);
      if (foundUnit) {
        const resolved = await resolveUnitInventories(foundUnit, propertyId);
        setInventories(resolved);
      } else {
        setInventories([]);
      }
    setLoading(false);
  }, [propertyId, unitId]);

  useEffect(() => {
    fetchUnitData();
  }, [fetchUnitData]);

  const [isAssignTenantOpen, setIsAssignTenantOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [isCopiedCustomPass, setIsCopiedCustomPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveTenant = async (data: { tenantName: string; tenantPhone: string; checkInDate: string }) => {
    if (!unit) return;
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
            ...u,
            tenantName: data.tenantName,
            tenantPhone: data.tenantPhone,
            checkInDate: data.checkInDate,
            status: 'Occupied' as any,
          }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({
        ...unit,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        checkInDate: data.checkInDate,
        status: 'Occupied' as any,
      });
    }

    // Backend Prisma Lease creation & DB sync
    try {
      await fetch(`/api/units/${unit.id}/lease`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Failed to sync lease with database:', e);
    }
  };

  const handleCheckoutTenant = async () => {
    if (!unit || !property) return;
    const nextStatus = (property.hasCleaningService ?? true) ? 'Need Cleaning' : 'Available';
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
            ...u,
            tenantName: undefined,
            tenantPhone: undefined,
            checkInDate: undefined,
            status: nextStatus as any,
            roomPassword: `Arv!${Math.random().toString(36).substring(2, 8)}`,
            roomPasswordLastReset: new Date().toISOString(),
          }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({
        ...unit,
        tenantName: undefined,
        tenantPhone: undefined,
        checkInDate: undefined,
        status: nextStatus as any,
      });
    }

    // Backend Prisma Lease checkout & DB sync
    try {
      await fetch(`/api/units/${unit.id}/lease`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to checkout lease in database:', e);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenResetModal = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomPasswordInput(`Arv!${rand}`);
    setShowCustomPassword(false);
    setIsCopiedCustomPass(false);
    setPasswordError(null);
    setIsResetConfirmOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomPasswordInput(`Arv!${rand}`);
    setPasswordError(null);
  };

  const handleCopyCustomPassword = () => {
    if (!customPasswordInput) return;
    navigator.clipboard.writeText(customPasswordInput);
    setIsCopiedCustomPass(true);
    setTimeout(() => setIsCopiedCustomPass(false), 2000);
  };

  const handleConfirmResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unit) return;
    const cleanPass = customPasswordInput.trim();
    if (!cleanPass || cleanPass.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return;
    }

    setIsResettingPassword(true);
    setPasswordError(null);
    const nowIso = new Date().toISOString();

    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits: Unit[] = JSON.parse(storedUnits);
      const updated = allUnits.map((u) =>
        u.id === unit.id
          ? {
            ...u,
            roomPassword: cleanPass,
            roomPasswordLastReset: nowIso,
          }
          : u
      );
      localStorage.setItem('arventa_units', JSON.stringify(updated));
      setUnit({ ...unit, roomPassword: cleanPass, roomPasswordLastReset: nowIso });
      setResetMessage(`Password akun unit berhasil di-reset: ${cleanPass}`);
      setTimeout(() => setResetMessage(null), 5000);
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/units/${unit.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPass }),
      });
    } catch (e) {
      console.error('Failed to reset password in database:', e);
    } finally {
      setIsResettingPassword(false);
      setIsResetConfirmOpen(false);
    }
  };

  const handleTenantWhatsApp = () => {
    if (!unit?.tenantPhone || unit.tenantPhone === '-') return;
    let cleanPhone = unit.tenantPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const msg = encodeURIComponent(`Halo ${unit.tenantName || 'Penyewa'}, terkait unit ${unit.name || ''} di Arventa...`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleSendTenantCredentials = () => {
    if (!unit?.tenantPhone || unit.tenantPhone === '-') return;
    let cleanPhone = unit.tenantPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const currentEmail = unit.roomEmail || (unit.name ? `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id` : 'tenant@arventa.id');
    const currentPassword = unit.roomPassword || 'Arv!789210';
    const tenantName = unit.tenantName || 'Penyewa';
    const messageText = `Halo *${tenantName}*,

Berikut adalah kredensial akun login modul Penyewa Anda di Arventa:

• *Email Login:* ${currentEmail}
• *Password:* ${currentPassword}

Silakan gunakan data di atas untuk login ke sistem Arventa. Terima kasih!`;
    const msg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleToggleHousekeepingService = async () => {
    if (!property) return;
    const nextState = !(property.hasCleaningService ?? true);
    const storedProps = localStorage.getItem('arventa_properties');
    if (storedProps) {
      const allProps: Property[] = JSON.parse(storedProps);
      const updated = allProps.map((p) =>
        p.id === property.id ? { ...p, hasCleaningService: nextState } : p
      );
      localStorage.setItem('arventa_properties', JSON.stringify(updated));
      setProperty({ ...property, hasCleaningService: nextState });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arventa_task_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // Backend Prisma DB sync
    try {
      await fetch(`/api/properties/${property.id}/cleaning-service`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
    } catch (e) {
      console.error('Failed to toggle cleaning service in database:', e);
    }
  };

  const handleSafeBack = useSafeBack(`/properties/${propertyId}`);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat spesifikasi unit...</p>
        </div>
      </div>
    );
  }

  if (!unit || !property) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-8 text-center text-card-foreground dark:text-card-foreground">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] mb-3" />
        <h2 className="text-lg font-bold text-foreground dark:text-foreground">Unit Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 max-w-sm">
          Unit atau properti tidak terdaftar dalam database atau telah dihapus.
        </p>
        <button
          type="button"
          onClick={handleSafeBack}
          className="mt-4 min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Detail Properti
        </button>
      </div>
    );
  }

  const hasCleaningService = property.hasCleaningService ?? true;

  return (
    <div className="space-y-6 bg-background text-foreground dark:bg-background dark:text-foreground min-h-[90vh] p-6 rounded-2xl border border-border dark:border-border">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-border dark:border-border pb-4">
        <button
          type="button"
          onClick={handleSafeBack}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke {property.name}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditUnitModalOpen(true)}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-card dark:bg-card hover:bg-muted text-foreground px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Edit3 className="h-4 w-4 text-[#8FA28A]" />
            <span>Edit Informasi Unit</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details & Side Column */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns: Specifications & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unit Spec Title Card */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border dark:border-border pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="text-2xl font-black text-foreground dark:text-foreground">{unit.name}</h2>
                  {(() => {
                    const st = (unit.status as string) || '';
                    const isAvail = st === 'Available' || st === 'AVAILABLE';
                    const isOcc = st === 'Occupied' || st === 'OCCUPIED';
                    const isClean = st === 'Need Cleaning' || st === 'Cleaning' || st === 'CLEANING';
                    const isRes = st === 'Reserved' || st === 'RESERVED';

                    const badgeClass = isAvail
                      ? 'bg-emerald-600 text-white'
                      : isOcc
                        ? 'bg-blue-600 text-white'
                        : isClean
                          ? 'bg-amber-500 text-white'
                          : isRes
                            ? 'bg-purple-600 text-white'
                            : 'bg-rose-600 text-white';

                    const labelText = isAvail
                      ? 'Tersedia'
                      : isOcc
                        ? 'Terisi'
                        : isClean
                          ? 'Perlu Dibersihkan'
                          : isRes
                            ? 'Reserved'
                            : 'Perlu Perbaikan';

                    return <span className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${badgeClass}`}>{labelText}</span>;
                  })()}

                  {/* Compact Sleek Tarif Sewa Pill */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8FA28A]/10 border border-[#8FA28A]/30 text-[#8FA28A] font-black text-xs shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">TARIF:</span>
                    <span className="text-foreground dark:text-foreground font-black">{formatRupiah(unit.pricing.monthly)}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">/bln</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{property.name} • Lantai {unit.capacity?.dimensions ? 'Dasar/Atas' : '1'}</span>
                </div>
              </div>

              {/* Quick Maintenance Ticket Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenCreateTicket('REPAIR')}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Buat Tiket Perbaikan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateTicket('HOUSEKEEPING')}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Housekeeping</span>
                </button>
              </div>
            </div>

            {/* Active Maintenance Status Banner */}
            {((unit.status as string) === 'MAINTENANCE' || (unit.status as string) === 'CLEANING' || (unit.status as string) === 'Need Cleaning') && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                  <Wrench className="h-4 w-4 shrink-0 text-amber-600 animate-bounce" />
                  <span>
                    Unit ini sedang dalam status{' '}
                    <strong className="underline">
                      {(unit.status as string) === 'MAINTENANCE' ? 'Pemeliharaan / Perbaikan' : 'Pembersihan / Housekeeping'}
                    </strong>
                    .
                  </span>
                </div>
                <Link
                  href="/operations/maintenance-reports"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs shrink-0"
                >
                  <span>Pantau Laporan</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-4 border border-border dark:border-border space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-[#8FA28A]" /> Dimensi Kamar
                </span>
                <p className="text-base font-black text-foreground dark:text-foreground">
                  {typeof unit.capacity === 'object' && unit.capacity !== null ? (unit.capacity.dimensions || '3x4 m') : '3x4 m'}
                </p>
              </div>
              <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-4 border border-border dark:border-border space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#8FA28A]" /> Kapasitas Maksimal
                </span>
                <p className="text-base font-black text-foreground dark:text-foreground">
                  {typeof unit.capacity === 'object' && unit.capacity !== null ? (typeof unit.capacity.maxPersons === 'object' ? 1 : unit.capacity.maxPersons || 1) : (unit.capacity || 1)} Orang
                </p>
              </div>
            </div>

            {/* 1 KAMAR 1 AKUN (ROOM CREDENTIALS & PASSWORD RESET) */}
            <div className="rounded-xl border border-[#8FA28A]/40 bg-[#8FA28A]/5 dark:bg-[#8FA28A]/10 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8FA28A]/20 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#8FA28A]" />
                  <div>
                    <h3 className="text-sm font-black text-foreground dark:text-foreground flex items-center gap-1.5">
                      Sistem 1 Kamar 1 Akun (Akses Unit)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Kredensial login khusus untuk {unit.name}. Dapat di-reset oleh Owner & Housekeeping.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {Boolean((unit.status === 'Occupied' || (unit.status as string) === 'OCCUPIED') && unit.tenantName && unit.tenantPhone) && (
                    <button
                      type="button"
                      onClick={handleSendTenantCredentials}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      title="Kirim Username & Password via WhatsApp Penyewa"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Kirim Akun ke WA
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Generate / Reset Password
                  </button>
                </div>
              </div>

              {resetMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold">
                  ✓ {resetMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Email Login Kamar
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-foreground dark:text-foreground select-all truncate">
                      {unit.roomEmail || `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const email = unit.roomEmail || `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`;
                        navigator.clipboard.writeText(email);
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }}
                      title="Salin Email"
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#8FA28A] transition-colors shrink-0"
                    >
                      {copiedEmail ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Password Login
                    </span>
                    {userRole === 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground text-[10px] font-bold flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPassword ? 'Sembunyikan' : 'Lihat'}
                      </button>
                    )}
                  </div>

                  {userRole === 'OWNER' ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#8FA28A] select-all truncate">
                        {showPassword ? unit.roomPassword || 'Arv!908123' : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const pass = unit.roomPassword || 'Arv!908123';
                          navigator.clipboard.writeText(pass);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        title="Salin Password"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#8FA28A] transition-colors shrink-0"
                      >
                        {copiedPass ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono text-muted-foreground italic block">
                      [Disembunyikan untuk Housekeeping - Gunakan Reset Password bila perlu]
                    </span>
                  )}
                </div>

                {property?.hasSmartLock && (
                  <div className="bg-card dark:bg-card p-3.5 rounded-xl border border-border dark:border-border space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        PIN Smart Lock Pintu Unit
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        Smart Lock Aktif
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 tracking-wider">
                        {unit.smartLockPin || 'Belum diatur (Edit unit untuk isi PIN)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes/Description */}
            {unit.description && (
              <div className="space-y-2 border-t border-border dark:border-border pt-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Catatan Tambahan
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border dark:border-border">
                  {unit.description}
                </p>
              </div>
            )}
          </div>

          {/* Unit & Common Area Inventory List */}
          {(() => {
            const filteredInventories = inventories.filter((i) => {
              if (inventoryFilter === 'UNIT') return i.locationType !== 'COMMON_AREA';
              if (inventoryFilter === 'COMMON_AREA') return i.locationType === 'COMMON_AREA';
              return true;
            });
            const unitCount = inventories.filter((i) => i.locationType !== 'COMMON_AREA').length;
            const commonCount = inventories.filter((i) => i.locationType === 'COMMON_AREA').length;

            return (
              <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground dark:text-foreground flex items-center gap-2">
                      <Package className="h-5 w-5 text-[#8FA28A]" />
                      <span>Fasilitas & Inventaris</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Daftar fasilitas kamar dan fasilitas area umum properti.
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  {inventories.length > 0 && (
                    <div className="flex items-center gap-1 p-1 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setInventoryFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                          inventoryFilter === 'ALL'
                            ? 'bg-card text-foreground shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Semua ({inventories.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInventoryFilter('UNIT')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                          inventoryFilter === 'UNIT'
                            ? 'bg-card text-foreground shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Dalam Kamar ({unitCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInventoryFilter('COMMON_AREA')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                          inventoryFilter === 'COMMON_AREA'
                            ? 'bg-card text-foreground shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Area Umum ({commonCount})
                      </button>
                    </div>
                  )}
                </div>

                {filteredInventories.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border dark:border-border p-8 text-center space-y-3">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                    <p className="text-xs text-muted-foreground">
                      {inventoryFilter === 'COMMON_AREA'
                        ? 'Belum ada fasilitas area umum yang terdaftar untuk properti ini.'
                        : 'Belum ada fasilitas atau perabot yang terdaftar untuk kamar ini.'}
                    </p>
                    {inventoryFilter !== 'COMMON_AREA' && (
                      <button
                        type="button"
                        onClick={() => setIsEditUnitModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#8FA28A] text-white text-xs font-bold hover:bg-[#8FA28A]/90 transition-colors cursor-pointer shadow-xs"
                      >
                        + Pilih Fasilitas Kamar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredInventories.map((item) => {
                      const isCommon = item.locationType === 'COMMON_AREA';
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-border dark:border-border bg-card dark:bg-card p-3.5 shadow-2xs hover:border-[#8FA28A]/40 transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Photo Thumbnail or Clean Facility Icon (No N/A box) */}
                              <div
                                className={`h-11 w-11 shrink-0 rounded-xl overflow-hidden flex items-center justify-center border ${
                                  isCommon
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/20'
                                }`}
                              >
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                  <FacilityIcon name={item.name} className="h-5 w-5" />
                                )}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-bold text-foreground dark:text-foreground truncate">
                                    {item.name}
                                  </h4>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${
                                      isCommon
                                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                                        : 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/25'
                                    }`}
                                  >
                                    {isCommon ? 'Area Umum' : 'Dalam Kamar'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  Terverifikasi: {new Date(item.lastUpdated).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${CONDITION_BADGE_STYLE(
                                item.condition
                              )}`}
                            >
                              {item.condition}
                            </span>
                          </div>

                          {(item.condition === 'Perlu Perbaikan' || item.condition === 'Rusak Berat') && (
                            <div className="mt-3 pt-2 border-t border-border/60 dark:border-border/60 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenCreateTicket(
                                    'REPAIR',
                                    `Perbaikan ${item.name} (${isCommon ? 'Area Umum' : unit.name})`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                              >
                                <Wrench className="h-3 w-3" />
                                Tiket Perbaikan
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Side Column: Pricing details, Active Tenant & Housekeeping Service */}
        <div className="space-y-6">
          {/* Financials & Deposits */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-foreground dark:text-foreground border-b border-border dark:border-border pb-3 flex items-center gap-1.5">
              <DollarSign className="h-5 w-5 text-[#8FA28A]" />
              Tarif & Deposit Sewa
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
                <span className="text-muted-foreground">Sewa Bulanan (Base)</span>
                <span className="text-sm font-black text-foreground">{formatRupiah(unit.pricing.monthly)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
                <span className="text-muted-foreground">Sewa Harian (Transit)</span>
                <span className="text-sm font-black text-foreground">
                  {unit.pricing.daily ? formatRupiah(unit.pricing.daily) : 'Tidak Tersedia'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
                <span className="text-muted-foreground">Uang Jaminan / Deposit</span>
                <span className="text-sm font-black text-[#C8A96B]">{formatRupiah(unit.pricing.deposit)}</span>
              </div>
            </div>
          </div>

          {/* TENANT WIDGET (Matching SS 2 & SS 3 + Assign Tenant Action) */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-4">
            {(unit.status === 'Occupied' || (unit.status as string) === 'OCCUPIED') && unit.tenantName ? (
              /* MATCHING SS 2: PENYEWA AKTIF */
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                      PENYEWA AKTIF
                    </span>
                    <h4 className="text-lg font-black text-foreground dark:text-foreground">
                      {unit.tenantName}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      {property.name} • {unit.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const targetParam = (unit as any).tenantId || (unit as any).leases?.[0]?.tenantId || unit.tenantName;
                      router.push(`/tenants?editTenantId=${encodeURIComponent(targetParam || '')}`);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1 transition-colors min-h-[36px]"
                  >
                    Edit Penyewa
                  </button>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-border dark:border-border">
                  {unit.tenantPhone && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 min-w-0">
                      <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> WhatsApp
                      </span>
                      <strong className="text-foreground font-mono text-right">{unit.tenantPhone}</strong>
                    </div>
                  )}

                  {unit.checkInDate && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 min-w-0">
                      <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Masuk
                      </span>
                      <strong className="text-foreground text-right">
                        {new Date(unit.checkInDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Highlight Information Kontrak Sewa Aktif */}
                <div className="p-3.5 rounded-xl bg-[#8FA28A]/10 border border-[#8FA28A]/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#8FA28A]/20">
                    <span className="text-[10px] font-black uppercase text-[#8FA28A] tracking-wider flex items-center gap-1.5 shrink-0">
                      <FileText className="h-3.5 w-3.5" /> Highlight Kontrak
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] uppercase shrink-0">
                      {(unit as any).activeLease?.status || 'AKTIF'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-muted-foreground font-medium shrink-0">Nomor Kontrak:</span>
                      <strong className="font-mono text-foreground font-bold text-right truncate min-w-0">
                        {(() => {
                          const rawNum = (unit as any).activeLease?.contractNumber;
                          if (!rawNum || rawNum.startsWith('http')) {
                            const leaseId = (unit as any).activeLease?.id || unit.id;
                            return `KTR/ARV/${leaseId.slice(0, 6).toUpperCase()}`;
                          }
                          return rawNum;
                        })()}
                      </strong>
                    </div>

                    {(unit as any).activeLease?.endDate && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium shrink-0">Masa Berakhir:</span>
                        <strong className="text-foreground font-semibold text-right truncate min-w-0">
                          {new Date((unit as any).activeLease.endDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-muted-foreground font-medium shrink-0">Tarif Sewa Pokok:</span>
                      <strong className="text-foreground font-bold text-right truncate min-w-0">
                        Rp {((unit as any).activeLease?.rentPrice || unit.pricing?.monthly || 0).toLocaleString('id-ID')} / bln
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#8FA28A]/20 text-center">
                    {(() => {
                      const cleanNum = (() => {
                        const raw = (unit as any).activeLease?.contractNumber;
                        if (raw && !raw.startsWith('http')) return raw;
                        const leaseId = (unit as any).activeLease?.id || unit.id;
                        return `KTR/ARV/${leaseId.slice(0, 6).toUpperCase()}`;
                      })();
                      return (
                        <Link
                          href={`/tenant-contract?search=${encodeURIComponent(cleanNum)}&autoPreview=true`}
                          className="text-[11px] font-extrabold text-[#8FA28A] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Lihat Rincian Kontrak Penyewa</span>
                          <ArrowLeft className="h-3 w-3 rotate-180" />
                        </Link>
                      );
                    })()}
                  </div>
                </div>

                {/* KPI Status Invoice / Tagihan Penyewa */}
                {invoiceKPI && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                    invoiceKPI.isOverdueBeforeCurrentMonth || invoiceKPI.status === 'OVERDUE'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : invoiceKPI.status === 'PAID'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-current/15">
                      <span className="text-[10px] font-black uppercase text-[#8FA28A] tracking-wider flex items-center gap-1.5 shrink-0">
                        <CreditCard className="h-3.5 w-3.5" /> Status Invoice
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase shrink-0 ${
                        invoiceKPI.isOverdueBeforeCurrentMonth || invoiceKPI.status === 'OVERDUE'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : invoiceKPI.status === 'PAID'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-500 text-white shadow-xs'
                      }`}>
                        {invoiceKPI.isOverdueBeforeCurrentMonth
                          ? 'TUNGGAKAN'
                          : invoiceKPI.status === 'PAID'
                          ? 'LUNAS'
                          : 'BELUM DIBAYAR'}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5 text-xs">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium shrink-0">Periode Tagihan:</span>
                        <strong className="text-foreground font-bold text-right truncate min-w-0">
                          {invoiceKPI.periodName}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium shrink-0">No. Invoice:</span>
                        <strong className="font-mono text-foreground font-bold text-right truncate min-w-0">
                          {invoiceKPI.invoiceNumber}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium shrink-0">Nominal Tagihan:</span>
                        <strong className="text-foreground font-bold text-right truncate min-w-0">
                          Rp {invoiceKPI.amount.toLocaleString('id-ID')}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium shrink-0">Jatuh Tempo:</span>
                        <strong className="text-foreground font-bold text-right truncate min-w-0">
                          {new Date(invoiceKPI.dueDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-current/15 text-center">
                      <button
                        type="button"
                        onClick={() => setIsInvoiceHistoryModalOpen(true)}
                        className="text-[11px] font-extrabold text-[#8FA28A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Lihat Riwayat Invoice Penyewa</span>
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MATCHING SS 3: INFORMASI PENYEWA KAMAR (EMPTY STATE) + ATUR PENYEWA */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground dark:text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Informasi Penyewa Kamar
                </h3>
                <div className="rounded-xl border border-dashed border-border dark:border-border bg-muted/20 p-6 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Unit saat ini dalam keadaan kosong dan siap untuk dipasarkan.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/tenants?openAdd=true')}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-black text-xs inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    + Atur / Tambah Penyewa Kamar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Owner Housekeeping Service Toggle - Moved below tenant info */}
          <div className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-foreground dark:text-foreground uppercase tracking-wider">
                  Layanan Kebersihan Kamar
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ON/OFF Layanan Kebersihan oleh Owner
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleHousekeepingService}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${hasCleaningService
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground border border-border'
                  }`}
              >
                {hasCleaningService ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {hasCleaningService ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground border-t border-border dark:border-border pt-2">
              Status di Info Kamar Tenant:{' '}
              <strong className={hasCleaningService ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {hasCleaningService ? '✓ Layanan Kebersihan Aktif' : '✗ Layanan Kebersihan Nonaktif'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {ticketToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5" />
          <span>{ticketToast}</span>
        </div>
      )}

      {/* Modal: Direct Create Maintenance/Housekeeping Ticket for Unit */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card text-card-foreground p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {ticketType === 'REPAIR' ? (
                  <Wrench className="h-5 w-5 text-amber-500" />
                ) : (
                  <Sparkles className="h-5 w-5 text-[#8FA28A]" />
                )}
                <h3 className="text-base font-black text-foreground">
                  {ticketType === 'REPAIR' ? 'Buat Tiket Perbaikan Unit' : 'Buat Tugas Housekeeping'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaintenanceTicket} className="space-y-3.5 text-xs">
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1">
                <p className="font-bold text-foreground">
                  Unit: {unit.name} ({property.name})
                </p>
                <p className="text-[11px] text-muted-foreground">Status saat ini: {unit.status}</p>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Judul Laporan *</label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full rounded-xl border border-border p-2.5 bg-background font-medium focus:outline-none focus:border-[#8FA28A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-foreground block mb-1">Prioritas</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full rounded-xl border border-border p-2.5 bg-background font-medium focus:outline-none"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi (Urgent)</option>
                    <option value="EMERGENCY">Darurat</option>
                  </select>
                </div>

                {ticketType === 'REPAIR' && (
                  <div>
                    <label className="font-bold text-foreground block mb-1">Beban Biaya</label>
                    <select
                      value={ticketCostLiability}
                      onChange={(e) => setTicketCostLiability(e.target.value)}
                      className="w-full rounded-xl border border-border p-2.5 bg-background font-medium focus:outline-none"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="TENANT">Penyewa</option>
                      <option value="SPLIT">Split</option>
                    </select>
                  </div>
                )}
              </div>

              {ticketType === 'REPAIR' && (
                <div>
                  <label className="font-bold text-foreground block mb-1">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={ticketEstCost}
                    onChange={(e) => setTicketEstCost(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-border p-2.5 bg-background font-medium focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-foreground block mb-1">Keterangan / Rincian Tambahan</label>
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan detail kerusakan atau instruksi khusus..."
                  className="w-full rounded-xl border border-border p-2.5 bg-background font-medium focus:outline-none resize-none"
                />
              </div>

              {/* Upload Foto Kerusakan */}
              <ImageFileInput
                label="Unggah Foto Kerusakan / Kondisi Unit"
                images={ticketPhotos}
                onChange={setTicketPhotos}
                maxFiles={4}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground font-bold hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTicket ? 'Menerbitkan...' : 'Terbitkan Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tenant Modal */}
      {unit && isAssignTenantOpen && (
        <AssignTenantModal
          isOpen={isAssignTenantOpen}
          onClose={() => setIsAssignTenantOpen(false)}
          unit={unit}
          onSaveTenant={handleSaveTenant}
          onCheckoutTenant={handleCheckoutTenant}
        />
      )}

      {/* Edit Unit Modal */}
      {unit && property && isEditUnitModalOpen && (
        <UnitFormModal
          isOpen={isEditUnitModalOpen}
          onClose={() => setIsEditUnitModalOpen(false)}
          onSubmit={handleEditUnitSubmit}
          initialData={unit}
          initialPropertyId={property.id}
          properties={[property]}
        />
      )}

      {/* Tenant Invoice History Modal */}
      {unit && property && (
        <TenantInvoiceHistoryModal
          isOpen={isInvoiceHistoryModalOpen}
          onClose={() => setIsInvoiceHistoryModalOpen(false)}
          tenantName={unit.tenantName || 'Penyewa Aktif'}
          tenantPhone={unit.tenantPhone}
          checkInDate={unit.checkInDate}
          unitName={unit.name}
          propertyName={property.name}
          monthlyRate={unit.pricing?.monthly || 4500000}
          invoices={unitInvoices}
        />
      )}

      {/* Reset Password Modal (Manual Input & Auto Randomize) */}
      {unit && isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A]/15 text-[#8FA28A] border border-[#8FA28A]/30 shadow-2xs">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Reset Password Unit</h2>
                  <p className="text-xs text-muted-foreground">Kredensial Akses Unit {unit.name}</p>
                </div>
              </div>
              <button
                onClick={() => !isResettingPassword && setIsResetConfirmOpen(false)}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Unit Properti:</span>
                  <strong className="text-foreground">{property?.name || 'Properti'} • {unit.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email Login:</span>
                  <strong className="text-foreground font-mono">{unit.roomEmail || `${unit.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`}</strong>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={isResettingPassword}
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-[#8FA28A] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                  >
                    <RefreshCw className={`h-3 w-3 ${isResettingPassword ? 'animate-spin' : ''}`} />
                    <span>Acak Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    value={customPasswordInput}
                    disabled={isResettingPassword}
                    onChange={(e) => {
                      setCustomPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Masukkan password baru..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-20 text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground focus:border-[#8FA28A] focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted/50"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                    <button
                      type="button"
                      disabled={isResettingPassword}
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={showCustomPassword ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showCustomPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      disabled={isResettingPassword}
                      onClick={handleCopyCustomPassword}
                      className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Salin Password"
                    >
                      {isCopiedCustomPass ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 pt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  Perhatian
                </p>
                <p className="leading-relaxed text-[11px] text-amber-700/90 dark:text-amber-300/90">
                  Password yang disimpan akan langsung aktif untuk login kamar. Jika unit sedang dihuni, pastikan untuk membagikan password baru kepada penyewa.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={isResettingPassword}
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex items-center gap-1.5 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Simpan Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Home,
  User,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Eye,
  Building2,
  UserCheck,
  Sparkles,
  Info,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  ContractItem,
  ContractScope,
  ContractStatus,
  RentalPeriod,
  PropertyOption,
  UnitOption,
  TenantOption,
} from '../_types';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: Partial<ContractItem>) => Promise<void> | void;
  initialData?: ContractItem | null;
  propertiesList: PropertyOption[];
  unitsList: UnitOption[];
  tenantsList: TenantOption[];
}

export default function ContractFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  propertiesList,
  unitsList,
  tenantsList,
}: ContractFormModalProps) {
  const isEdit = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState<'FORM' | 'PREVIEW'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalBodyRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const [propertyArticles, setPropertyArticles] = useState<{ id: string; title: string; items: string[] }[]>([]);

  const getParsedArticles = (): { id: string; title: string; items: string[] }[] => {
    if (notes) {
      try {
        const parsed = JSON.parse(notes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any, idx: number) => ({
            id: a.id || `art-${idx}`,
            title: a.title || `PASAL ${idx + 3}: KETENTUAN KHUSUS`,
            items: Array.isArray(a.items) ? a.items : [],
          }));
        }
      } catch {
        // Not JSON
      }
    }

    let result: { id: string; title: string; items: string[] }[] = [];

    // 1. Base Property Template Articles
    if (propertyArticles.length > 0) {
      result = [...propertyArticles];
    } else {
      result = [
        {
          id: 'art-default-1',
          title: 'PASAL 3: TATA TERTIB & KETENTUAN PROPERTI',
          items: [
            'Penyewa wajib menjaga kebersihan, kerapihan, dan ketenangan lingkungan properti.',
            'Penyewa dilarang merusak bangunan, fasilitas, maupun melakukan perubahan fisik pada unit.',
            'Jam tenang lingkungan berlaku mulai pukul 22.00 WIB setiap hari.',
          ],
        },
        {
          id: 'art-default-2',
          title: 'PASAL 4: FASILITAS & BIAYA DEPOSIT',
          items: [
            'Fasilitas pendukung digunakan secara bijak dan bertanggung jawab.',
            'Uang jaminan (deposit) dikembalikan penuh saat masa sewa berakhir jika unit dalam keadaan baik dan bebas tunggakan.',
          ],
        },
      ];
    }

    // 2. Custom Tenant Addendum Clauses (if present)
    if (customClauses && customClauses.length > 0) {
      const nextPasalNum = result.length + 3;
      result.push({
        id: 'art-tenant-addendum',
        title: `PASAL ${nextPasalNum}: KLAUSUL KHUSUS & ADDENDUM PENYEWA`,
        items: customClauses,
      });
    }

    return result;
  };

  const [scope, setScope] = useState<ContractScope>('UNIT');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  
  // Tenant Selection mode
  const [tenantMode, setTenantMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantNik, setTenantNik] = useState('');

  // Terms & Financials
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [rentPrice, setRentPrice] = useState<number | ''>('');
  const [securityDeposit, setSecurityDeposit] = useState<number | ''>(0);
  const [status, setStatus] = useState<ContractStatus>('ACTIVE');
  const [notes, setNotes] = useState('');

  // Custom Clauses (Addendum per tenant contract, empty by default)
  const [customClauses, setCustomClauses] = useState<string[]>([]);
  const [newClauseInput, setNewClauseInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveTab('FORM');
    if (initialData) {
      setScope(initialData.scope || 'UNIT');
      setPropertyId(initialData.propertyId || '');
      setUnitId(initialData.unitId || '');
      setTenantId(initialData.tenantId || '');
      setTenantName(initialData.tenantName || '');
      setTenantPhone(initialData.tenantPhone || '');
      setTenantEmail(initialData.tenantEmail || '');
      setTenantNik(initialData.tenantNik || '');
      setRentalPeriod(initialData.rentalPeriod || 'MONTHLY');
      const start = initialData.startDate ? initialData.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
      setStartDate(start);

      if (initialData.endDate && initialData.endDate.trim() !== '') {
        setEndDate(initialData.endDate.split('T')[0]);
      } else {
        const d = new Date(start);
        if (initialData.rentalPeriod === 'DAILY') d.setDate(d.getDate() + 1);
        else d.setFullYear(d.getFullYear() + 1);
        setEndDate(d.toISOString().split('T')[0]);
      }
      setRentPrice(initialData.rentPrice ?? '');
      setSecurityDeposit(initialData.securityDeposit ?? 0);
      setStatus(initialData.status || 'ACTIVE');
      setNotes(initialData.notes || '');
      setCustomClauses(Array.isArray(initialData.customClauses) ? initialData.customClauses : []);
      setTenantMode(initialData.tenantId ? 'EXISTING' : 'NEW');
    } else {
      setScope('UNIT');
      const defaultProp = propertiesList.length > 0 ? propertiesList[0].id : '';
      setPropertyId(defaultProp);
      setUnitId('');
      setTenantMode('EXISTING');
      setTenantId('');
      setTenantName('');
      setTenantPhone('');
      setTenantEmail('');
      setTenantNik('');
      setRentalPeriod('MONTHLY');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);

      const defaultEnd = new Date();
      defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
      setEndDate(defaultEnd.toISOString().split('T')[0]);

      setRentPrice('');
      setSecurityDeposit(0);
      setStatus('ACTIVE');
      setNotes('');
      setCustomClauses([]);
    }
    setErrors({});
  }, [initialData, isOpen, propertiesList]);

  const selectedPropObj = propertiesList.find((p) => p.id === propertyId);

  // Available units filtered by property: match by propertyId or propertyName, and status is AVAILABLE (or currently assigned unit if editing)
  const filteredUnits = unitsList.filter((u) => {
    const matchesProp =
      (propertyId && u.propertyId === propertyId) ||
      (selectedPropObj?.name && u.propertyName && u.propertyName.toLowerCase() === selectedPropObj.name.toLowerCase());
    if (!matchesProp) return false;

    if (isEdit && u.id === unitId) return true;

    const s = (u.status || '').toUpperCase();
    return s === 'AVAILABLE' || s === 'KOSONG' || s === 'VACANT' || !u.status;
  });

  // Available tenants filtered: show candidate prospects (status CALON) or active tenants without an active contract (or current tenant if editing)
  const availableTenants = tenantsList.filter((t) => {
    if (isEdit && t.id === tenantId) return true;
    return !t.hasActiveContract || t.status === 'CALON';
  });

  // Helper to fetch property contract template articles
  const loadPropertyTemplate = async (selectedPropId: string) => {
    if (!selectedPropId) {
      setPropertyArticles([]);
      return;
    }

    try {
      const res = await fetch(`/api/properties/${selectedPropId}/contract-template`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.rules) {
            try {
              const parsedArticles = JSON.parse(json.data.rules);
              if (Array.isArray(parsedArticles) && parsedArticles.length > 0) {
                setPropertyArticles(parsedArticles);
                return;
              }
            } catch {
              // Ignore if not JSON
            }
          }

          if (Array.isArray(json.data.customClauses) && json.data.customClauses.length > 0) {
            const defaultArt = [
              {
                id: 'art-prop-default',
                title: 'PASAL 3: KETENTUAN TATA TERTIB PROPERTI',
                items: json.data.customClauses,
              },
            ];
            setPropertyArticles(defaultArt);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load property contract template');
    }

    // Default fallback articles if no custom property template is configured
    const defaultFallbackArticles = [
      {
        id: 'art-default-1',
        title: 'PASAL 3: TATA TERTIB & KETENTUAN PROPERTI',
        items: [
          'Penyewa wajib menjaga kebersihan, kerapihan, dan ketenangan lingkungan properti.',
          'Penyewa dilarang merusak bangunan, fasilitas, maupun melakukan perubahan fisik pada unit.',
          'Jam tenang lingkungan berlaku mulai pukul 22.00 WIB setiap hari.',
        ],
      },
      {
        id: 'art-default-2',
        title: 'PASAL 4: FASILITAS & BIAYA DEPOSIT',
        items: [
          'Fasilitas pendukung digunakan secara bijak dan bertanggung jawab.',
          'Uang jaminan (deposit) dikembalikan penuh saat masa sewa berakhir jika unit dalam keadaan baik dan bebas tunggakan.',
        ],
      },
    ];
    setPropertyArticles(defaultFallbackArticles);
  };

  // Trigger loading template when propertyId changes
  useEffect(() => {
    if (propertyId && isOpen) {
      loadPropertyTemplate(propertyId);
    }
  }, [propertyId, isOpen]);

  // Auto fetch property contract template clauses when property is selected
  const handlePropertyChange = async (selectedPropId: string) => {
    setPropertyId(selectedPropId);
    setUnitId('');
    if (!selectedPropId) {
      setPropertyArticles([]);
      return;
    }
    loadPropertyTemplate(selectedPropId);
  };

  // Auto fill price when unit is selected
  const handleUnitChange = (selectedUnitId: string) => {
    setUnitId(selectedUnitId);
    const found = unitsList.find((u) => u.id === selectedUnitId);
    if (found) {
      if (found.basePrice) setRentPrice(found.basePrice);
      if (found.deposit !== undefined) setSecurityDeposit(found.deposit);
    }
  };

  // Auto update end date when start date or period changes
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!val) return;
    const d = new Date(val);
    if (isNaN(d.getTime())) return;

    if (rentalPeriod === 'DAILY') d.setDate(d.getDate() + 1);
    else if (rentalPeriod === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // MONTHLY

    setEndDate(d.toISOString().split('T')[0]);
  };

  const handleRentalPeriodChange = (period: RentalPeriod) => {
    setRentalPeriod(period);
    if (!startDate) return;
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return;

    if (period === 'DAILY') d.setDate(d.getDate() + 1);
    else if (period === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // MONTHLY

    setEndDate(d.toISOString().split('T')[0]);
  };

  // Clause management
  const handleAddClause = () => {
    if (!newClauseInput.trim()) return;
    setCustomClauses((prev) => [...prev, newClauseInput.trim()]);
    setNewClauseInput('');
  };

  const handleRemoveClause = (idx: number) => {
    setCustomClauses((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    const effectivePropId = propertyId || initialData?.propertyId || propertiesList[0]?.id || '';
    const effectiveUnitId = unitId || initialData?.unitId || unitsList[0]?.id || '';

    if (!tenantId) {
      newErrors.tenantId = 'Pilih penyewa dari daftar penyewa terdaftar';
    }

    if (!startDate) newErrors.startDate = 'Tanggal mulai sewa wajib diisi';
    if (!endDate) newErrors.endDate = 'Tanggal berakhir sewa wajib diisi';
    if (!rentPrice || Number(rentPrice) <= 0) newErrors.rentPrice = 'Harga sewa harus lebih dari 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('FORM');
      return;
    }

    const selectedProp = propertiesList.find((p) => p.id === effectivePropId);
    const selectedUnit = unitsList.find((u) => u.id === effectiveUnitId);
    const selectedTenant = tenantsList.find((t) => t.id === tenantId);

    const finalTenantName = selectedTenant?.fullName || tenantName;
    const finalTenantPhone = selectedTenant?.phoneNumber || tenantPhone;
    const finalTenantEmail = selectedTenant?.email || tenantEmail;

    try {
      setIsSubmitting(true);
      await onSave({
        ...(initialData?.id ? { id: initialData.id } : {}),
        contractNumber: initialData?.contractNumber || `KTR/ARV/${Date.now().toString().slice(-6)}`,
        scope,
        status,
        tenantId: tenantMode === 'EXISTING' ? tenantId : undefined,
        tenantName: finalTenantName,
        tenantPhone: finalTenantPhone,
        tenantEmail: finalTenantEmail,
        tenantNik,
        propertyId: effectivePropId,
        propertyName: selectedProp?.name || initialData?.propertyName || 'Properti',
        propertyAddress: selectedProp?.address || initialData?.propertyAddress || '',
        ownerName: initialData?.ownerName || 'Budi Santoso',
        unitId: effectiveUnitId,
        unitName: selectedUnit?.unitNumber || initialData?.unitName || 'Unit Kamar',
        rentalPeriod,
        startDate,
        endDate,
        rentPrice: Number(rentPrice),
        securityDeposit: Number(securityDeposit || 0),
        customClauses,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Save contract failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUnitObj = unitsList.find((u) => u.id === unitId);
  const selectedTenantObj = tenantsList.find((t) => t.id === tenantId);

  const displayTenantName = tenantMode === 'EXISTING' ? (selectedTenantObj?.fullName || tenantName || '[Nama Penyewa]') : (tenantName || '[Nama Penyewa]');
  const displayTenantPhone = tenantMode === 'EXISTING' ? (selectedTenantObj?.phoneNumber || tenantPhone || '-') : (tenantPhone || '-');
  const displayTenantEmail = tenantMode === 'EXISTING' ? (selectedTenantObj?.email || tenantEmail || '-') : (tenantEmail || '-');

  const periodLabelMap: Record<string, string> = {
    DAILY: 'Hari',
    MONTHLY: 'Bulan',
    YEARLY: 'Tahun',
    HOURLY: 'Jam',
  };

  const formatDate = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header with Live Tabs */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {isEdit ? 'Edit Kontrak Sewa' : 'Buat Kontrak Sewa Baru'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Isi rincian kesepakatan sewa properti atau per unit untuk penyewa
              </p>
            </div>
          </div>

          {/* Header Tab Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex items-center bg-card p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'FORM'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> 1. Form Rincian
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'PREVIEW'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> 2. Live Pratinjau Dokumen
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto">
          {activeTab === 'FORM' ? (
            /* TAB 1: FORM INPUT */
            <form id="contract-form" onSubmit={handleSubmit} className="p-6 space-y-6 text-sm">
              {/* Info Switcher Banner */}
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs flex items-center justify-between gap-3 text-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Fitur <strong>Live Pratinjau Dokumen</strong> aktif. Anda dapat mengklik tab di kanan atas untuk melihat draf Surat Perjanjian secara real-time.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-lg font-bold text-[11px] shrink-0 hover:bg-primary/90 transition-colors"
                >
                  Lihat Pratinjau Dokumen
                </button>
              </div>

              {/* 1. Objek Sewa & Penempatan Unit */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Objek Sewa & Penempatan Unit Kamar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pilih Properti */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Pilih Properti <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={propertyId}
                      onChange={(e) => {
                        const newPropId = e.target.value;
                        setPropertyId(newPropId);
                        setUnitId('');
                        loadPropertyTemplate(newPropId);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                    >
                      <option value="">-- Pilih Properti --</option>
                      {propertiesList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.propertyId && <p className="text-xs text-destructive mt-1">{errors.propertyId}</p>}
                  </div>

                  {/* Pilih Unit Kamar */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Pilih Unit / Nomor Kamar <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={unitId}
                      onChange={(e) => {
                        setUnitId(e.target.value);
                        const foundU = unitsList.find((u) => u.id === e.target.value);
                        if (foundU && foundU.basePrice) {
                          setRentPrice(foundU.basePrice);
                          if (foundU.deposit) setSecurityDeposit(foundU.deposit);
                        }
                      }}
                      disabled={!propertyId}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium disabled:opacity-50"
                    >
                      <option value="">-- Pilih Unit Kamar --</option>
                      {filteredUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitNumber} {u.basePrice ? `(Rp ${u.basePrice.toLocaleString('id-ID')}/bln)` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.unitId && <p className="text-xs text-destructive mt-1">{errors.unitId}</p>}
                    {propertyId && filteredUnits.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                        ⚠️ Tidak ada unit kamar kosong (AVAILABLE) pada properti ini. Semua unit sedang terisi atau dalam perbaikan.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Identitas Penyewa */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">Informasi Penyewa</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Pilih Penyewa <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={tenantId}
                    onChange={(e) => {
                      setTenantId(e.target.value);
                      const found = tenantsList.find((t) => t.id === e.target.value);
                      if (found) {
                        setTenantName(found.fullName);
                        setTenantPhone(found.phoneNumber || '');
                        setTenantEmail(found.email || '');
                        setTenantNik(found.nik || '');
                      } else {
                        setTenantName('');
                        setTenantPhone('');
                        setTenantEmail('');
                        setTenantNik('');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                  >
                    <option value="">-- Pilih Penyewa (Belum Memiliki Kontrak Aktif) --</option>
                    {availableTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} {t.phoneNumber ? `(${t.phoneNumber})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.tenantId && <p className="text-xs text-destructive mt-1">{errors.tenantId}</p>}
                  {availableTenants.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                      ⚠️ Tidak ada penyewa terdaftar yang belum memiliki kontrak aktif. Silakan tambahkan data penyewa baru melalui menu <strong>Manajemen Penyewa</strong> terlebih dahulu.
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Periode Sewa & Financials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">Masa Sewa & Keuangan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Skema Pembayaran <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={rentalPeriod}
                      onChange={(e) => handleRentalPeriodChange(e.target.value as RentalPeriod)}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="DAILY">Harian</option>
                      <option value="MONTHLY">Bulanan</option>
                      <option value="YEARLY">Tahunan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Tanggal Mulai Sewa <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    />
                    {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Tanggal Berakhir Sewa <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    />
                    {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Harga Sewa (Rp / Periode) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={rentPrice !== '' && rentPrice !== undefined ? new Intl.NumberFormat('id-ID').format(Number(rentPrice)) : '0'}
                        className="w-full pl-[34px] pr-3 py-2 rounded-xl border border-input bg-muted/60 text-foreground cursor-not-allowed font-extrabold select-none opacity-90"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <span>🔒</span> Harga sewa terkunci otomatis sesuai tarif unit kamar dari database.
                    </p>
                    {errors.rentPrice && <p className="text-xs text-destructive mt-1">{errors.rentPrice}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Uang Deposit / Jaminan (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={securityDeposit !== '' && securityDeposit !== undefined ? new Intl.NumberFormat('id-ID').format(Number(securityDeposit)) : ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setSecurityDeposit(clean ? Number(clean) : 0);
                        }}
                        placeholder="500.000"
                        className="w-full pl-[34px] pr-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Status Kontrak & Mode Penerbitan */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-muted/40 text-xs">
                <label className="block font-bold text-foreground">Status Penerbitan Kontrak</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('DRAFT')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      status === 'DRAFT'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">📄 Draf Kontrak (Pending)</div>
                    <div className="text-[10px] leading-relaxed opacity-80 font-normal">
                      Penyewa belum disetujui/diaktifkan. Invoice tagihan belum diterbitkan.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('ACTIVE')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      status === 'ACTIVE'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">✅ Terbitkan & Aktifkan</div>
                    <div className="text-[10px] leading-relaxed opacity-80 font-normal">
                      Penyewa otomatis diset menjadi <strong>AKTIF</strong>, unit <strong>OCCUPIED</strong>, & invoice otomatis terbit.
                    </div>
                  </button>
                </div>
              </div>

              {/* 6. Hybrid Contract Clauses & Tenant Addendum */}
              <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/20">
                {/* Bagian A: Template Utama Properti (Baseline) */}
                <div className="space-y-2 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                        Template Kontrak Utama Properti: {selectedPropObj?.name || 'Properti'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      ✓ Default Properti
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Pasal-pasal di bawah ini berasal dari <strong>Template Kontrak Properti</strong> dan otomatis diterapkan sebagai ketentuan dasar sewa.
                  </p>

                  {propertyArticles.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {propertyArticles.map((art, idx) => (
                        <div key={art.id || idx} className="bg-background/80 p-2.5 rounded-md border border-border/60 text-xs">
                          <p className="font-bold text-foreground text-[11px] mb-1">{art.title}</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                            {art.items.map((item, itemIdx) => (
                              <li key={itemIdx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground italic bg-background/50 p-2 rounded border border-border">
                      Menggunakan pasal tata tertib standar properti.
                    </div>
                  )}
                </div>

                {/* Bagian B: Klausul Tambahan Khusus / Addendum per Penyewa */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                        Klausul Tambahan Khusus (Addendum per Penyewa)
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{customClauses.length} Poin Tambahan</span>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      Tambahkan klausul khusus di bawah ini jika ada kesepakatan spesifik dengan penyewa ini (misal: izin hewan peliharaan, slot parkir tambahan). Poin di bawah akan diterbitkan secara otomatis sebagai <strong>"PASAL KHUSUS / ADDENDUM"</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {customClauses.map((clause, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border text-xs">
                        <span className="font-bold text-primary shrink-0">{idx + 1}.</span>
                        <span className="flex-1 text-foreground">{clause}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveClause(idx)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newClauseInput}
                      onChange={(e) => setNewClauseInput(e.target.value)}
                      placeholder="Tambah klausul khusus/addendum baru..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddClause();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddClause}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Catatan Tambahan */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Catatan Internal (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan khusus mengenai unit atau transaksi..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </form>
          ) : (
            /* TAB 2: LIVE REAL-TIME CONTRACT PREVIEW */
            <div className="p-8 bg-white text-slate-900 font-sans leading-relaxed text-sm">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Draf Pratinjau Real-Time Kontrak Sewa Digital</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-mono">Status: {status}</span>
                </div>

                {/* Header Kop Surat */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                      A
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-wider uppercase text-slate-900">ARVENTA</h1>
                      <p className="text-xs font-semibold tracking-widest uppercase text-slate-600">
                        Property Management Systems
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Surat Perjanjian Digital</div>
                    <div className="text-xs font-mono font-bold text-slate-900">{initialData?.contractNumber || 'DRAF-KONTRAK-BARU'}</div>
                    <div className="text-[11px] text-slate-500">Tanggal: {formatDate(new Date().toISOString())}</div>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center py-2 space-y-1">
                  <h2 className="text-lg font-extrabold uppercase underline tracking-wide">
                    SURAT PERJANJIAN SEWA MENYEMA
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    {scope === 'PROPERTY' ? 'Perjanjian Sewa Properti Utuh' : 'Perjanjian Sewa Unit Kamar'}
                  </p>
                </div>

                {/* Mukadimah */}
                <p className="text-xs text-justify">
                  Pada hari ini, disepakati perjanjian sewa-menyewa antara pihak-pihak di bawah ini yang bertindak sah secara hukum:
                </p>

                {/* Identitas Pihak I & Pihak II */}
                <div className="space-y-4 text-xs">
                  {/* Pihak I */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-700" />
                      PIHAK PERTAMA (Pemilik Properti / Pengelola):
                    </div>
                    <div className="grid grid-cols-3 gap-y-1 pl-5">
                      <span className="text-slate-500">Nama Pemilik (Owner)</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {selectedPropObj?.ownerName || initialData?.ownerName || 'Budi Santoso'}</span>
                      <span className="text-slate-500">No. Telepon / WA</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {selectedPropObj?.ownerPhone || initialData?.ownerPhone || '081234567890'}</span>
                      {(selectedPropObj?.ownerEmail || initialData?.ownerEmail) && (
                        <>
                          <span className="text-slate-500">Email Pemilik</span>
                          <span className="col-span-2 font-semibold text-slate-900">: {selectedPropObj?.ownerEmail || initialData?.ownerEmail}</span>
                        </>
                      )}
                      <span className="text-slate-500">Nama Properti</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {selectedPropObj?.name || initialData?.propertyName || 'Belum Dipilih'}</span>
                      <span className="text-slate-500">Alamat Properti</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {selectedPropObj?.address || initialData?.propertyAddress || 'Belum Dipilih'}</span>
                    </div>
                  </div>

                  {/* Pihak II */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                      PIHAK KEDUA (Penyewa / Tenant):
                    </div>
                    <div className="grid grid-cols-3 gap-y-1 pl-5">
                      <span className="text-slate-500">Nama Lengkap</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {displayTenantName}</span>
                      <span className="text-slate-500">No. Telepon / WA</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {displayTenantPhone}</span>
                      <span className="text-slate-500">Email</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {displayTenantEmail}</span>
                      {tenantNik && (
                        <>
                          <span className="text-slate-500">NIK / No. KTP</span>
                          <span className="col-span-2 font-semibold text-slate-900">: {tenantNik}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rincian Objek & Ketentuan Sewa */}
                <div className="space-y-3 pt-2 text-xs">
                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                    PASAL 1: OBJEK SEWA & JANGKA WAKTU
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                    <li>
                      <strong>Objek Sewa:</strong> PIHAK PERTAMA menyewakan objek kepada PIHAK KEDUA berupa{' '}
                      <strong className="text-slate-900">
                        {scope === 'UNIT' ? `Unit / Kamar (${selectedUnitObj?.unitNumber || 'Belum Dipilih'})` : 'Gedung / Properti Utuh'}
                      </strong>{' '}
                      pada <strong className="text-slate-900">{selectedPropObj?.name || 'Properti'}</strong>.
                    </li>
                    <li>
                      <strong>Masa Sewa:</strong> Berlaku mulai dari tanggal{' '}
                      <strong>{formatDate(startDate)}</strong> sampai dengan tanggal{' '}
                      <strong>{formatDate(endDate)}</strong> (Skema Pembayaran:{' '}
                      {rentalPeriod === 'MONTHLY' ? 'Bulanan' : rentalPeriod === 'DAILY' ? 'Harian' : 'Tahunan'}) dan akan bertambah apabila <span className="font-bold">PIHAK KEDUA</span> (Penyewa) memperpanjang masa sewa.
                    </li>
                    <li>
                      <strong>Harga Sewa:</strong> Disepakati harga sewa sebesar{' '}
                      <strong className="text-slate-900">
                        Rp {rentPrice !== '' ? Number(rentPrice).toLocaleString('id-ID') : '0'} / {periodLabelMap[rentalPeriod] || 'Periode'}
                      </strong>.
                    </li>
                    {Number(securityDeposit) > 0 && (
                      <li>
                        <strong>Uang Jaminan (Deposit):</strong> PIHAK KEDUA membayarkan uang deposit jaminan sebesar{' '}
                        <strong className="text-slate-900">Rp {Number(securityDeposit).toLocaleString('id-ID')}</strong> yang akan dikembalikan setelah masa sewa berakhir jika tidak ada tunggakan atau kerusakan fasilitas.
                      </li>
                    )}
                  </ol>

                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 pt-2">
                    PASAL 2: HAK DAN KEWAJIBAN PIHAK KEDUA (PENYEWA)
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                    <li>Penyewa berhak menggunakan unit dan fasilitas yang disediakan dengan baik.</li>
                    <li>Penyewa wajib membayar harga sewa sebelum atau pada tanggal jatuh tempo.</li>
                    <li>Penyewa dilarang memindahtangankan objek sewa kepada pihak ketiga tanpa izin tertulis dari Pemilik.</li>
                    <li>Penyewa dilarang melakukan kegiatan yang melanggar hukum di lokasi properti.</li>
                  </ol>

                  {/* Dynamic Articles from Property Contract Template */}
                  {getParsedArticles().map((art) => (
                    <div key={art.id} className="pt-2 space-y-2">
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                        {art.title}
                      </h3>
                      <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                        {art.items.map((item, idx) => (
                          <li key={idx} className="font-medium text-slate-900 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>

                {/* Penutup */}
                <p className="text-xs text-justify pt-2">
                  Demikian surat perjanjian sewa ini dibuat secara sah dan digital melalui platform ARVENTA Property Management untuk dipergunakan sebagaimana mestinya.
                </p>

                {/* Area Tanda Tangan */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-12">
                    <p className="font-semibold text-slate-700">PIHAK PERTAMA (Pemilik Properti)</p>
                    <div className="py-2 inline-block px-4 border border-emerald-300 bg-emerald-50 rounded-lg text-emerald-800 text-[10px] font-bold">
                      ✓ VERIFIED DIGITAL SIGNATURE
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{selectedPropObj?.ownerName || initialData?.ownerName || 'Budi Santoso'}</p>
                      <p className="text-[10px] text-slate-500">Pemilik Properti {selectedPropObj?.name || initialData?.propertyName || 'Properti'}</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p className="font-semibold text-slate-700">PIHAK KEDUA (Penyewa)</p>
                    <div className="py-2 inline-block px-4 border border-slate-300 bg-slate-50 rounded-lg text-slate-800 text-[10px] font-bold">
                      ✓ SETUJU & MENERIMA SYARAT
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{displayTenantName}</p>
                      <p className="text-[10px] text-slate-500">Penyewa Utama</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0 text-xs">
          <div className="text-muted-foreground flex items-center gap-2">
            {activeTab === 'FORM' ? (
              <span>Gunakan tab di atas untuk meninjau hasil dokumen</span>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Pratinjau Real-Time sesuai data form saat ini
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="contract-form"
              disabled={isSubmitting}
              onClick={(e) => {
                if (activeTab === 'PREVIEW') {
                  handleSubmit(e as any);
                }
              }}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Simpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Terbitkan Kontrak'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

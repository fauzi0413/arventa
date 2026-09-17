'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Home, ShieldAlert, Phone, AlertTriangle, Sparkles } from 'lucide-react';
import { TenantRoomDetails, EmergencyContact, TenantBillingSummary, TenantComplaint, HousekeepingRequest } from './_types';
import { Unit } from '@/app/(dashboard)/units/_types';
import { Property } from '@/app/(dashboard)/properties/_types';
import { TenantCredential } from '@/app/(dashboard)/tenants/_types';

import RoomDetailCard from './_components/RoomDetailCard';
import PropertyDetailCard from './_components/PropertyDetailCard';
import TenantProfileCard from './_components/TenantProfileCard';
import TenantBillingCard from './_components/TenantBillingCard';
import TenantComplaintCard from './_components/TenantComplaintCard';
import TenantHousekeepingCard from './_components/TenantHousekeepingCard';

const TenantComplaintModal = lazy(() => import('./_components/TenantComplaintModal'));
const HousekeepingRequestModal = lazy(() => import('./_components/HousekeepingRequestModal'));

export default function PortalRoomPage() {
  const [details, setDetails] = useState<TenantRoomDetails | null>(null);
  const [complaints, setComplaints] = useState<TenantComplaint[]>([]);
  const [housekeepingRequests, setHousekeepingRequests] = useState<HousekeepingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isHousekeepingModalOpen, setIsHousekeepingModalOpen] = useState(false);

  const loadPortalData = async () => {
    try {
      const userEmail = (typeof window !== 'undefined' && localStorage.getItem('arventa_user_email')) || 'apt12b01@arventa.id';
      const res = await fetch(`/api/portal/my-room?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const json = await res.json();
        const apiData = json.data;
        if (apiData && apiData.unit && apiData.property) {
          setDetails({
            unit: apiData.unit,
            property: apiData.property,
            inventories: apiData.inventories || [],
            houseRules: apiData.houseRules || [],
            emergencyContacts: apiData.emergencyContacts || [],
            billingSummary: apiData.billingSummary || null,
            wifiSsid: apiData.wifiSsid,
            wifiPassword: apiData.wifiPassword,
            smartLockCode: apiData.smartLockCode || null,
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API portal fetch notice: falling back to client cache', err);
    }

    const storedUnits = localStorage.getItem('arventa_units');
    const storedProps = localStorage.getItem('arventa_properties');
    const storedInventory = localStorage.getItem('arventa_inventory');
    const storedCreds = localStorage.getItem('arventa_tenants');
    const storedComplaints = localStorage.getItem('arventa_tenant_complaints');
    const storedHousekeeping = localStorage.getItem('arventa_housekeeping_requests');

    let loadedUnits: Unit[] = [];
    let loadedProps: Property[] = [];
    let loadedInventory = [];
    let loadedCreds: Record<string, TenantCredential> = {};
    let loadedComplaints: TenantComplaint[] = [];
    let loadedHousekeeping: HousekeepingRequest[] = [];

    if (storedUnits) loadedUnits = JSON.parse(storedUnits);
    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedInventory) loadedInventory = JSON.parse(storedInventory);
    if (storedCreds) loadedCreds = JSON.parse(storedCreds);
    if (storedComplaints) loadedComplaints = JSON.parse(storedComplaints);
    if (storedHousekeeping) loadedHousekeeping = JSON.parse(storedHousekeeping);

    const activeUnit = loadedUnits.find((u) => u.status === 'Occupied' && u.tenantName) || loadedUnits[0];

    if (activeUnit) {
      const activeProp = loadedProps.find((p) => p.id === activeUnit.propertyId) || loadedProps[0];
      const unitInventory = loadedInventory.filter((item: any) => item.unitId === activeUnit.id);
      const cred = loadedCreds[activeUnit.id];

      const unitComplaints = loadedComplaints.filter((c) => c.unitId === activeUnit.id);
      const unitHousekeeping = loadedHousekeeping.filter((h) => h.unitId === activeUnit.id);

      const dynamicContacts: EmergencyContact[] = [];
      if (activeProp?.ownerName && activeProp?.ownerPhone) {
        dynamicContacts.push({
          name: `${activeProp.ownerName} (Owner)`,
          role: 'Pemilik Properti',
          phone: activeProp.ownerPhone,
        });
      }

      if (activeProp) {
        setDetails({
          unit: {
            ...activeUnit,
            tenantName: activeUnit.status === 'Occupied' ? activeUnit.tenantName : undefined,
            tenantPhone: activeUnit.status === 'Occupied' ? activeUnit.tenantPhone : undefined,
            checkInDate: activeUnit.status === 'Occupied' ? activeUnit.checkInDate : undefined,
          },
          property: activeProp,
          inventories: unitInventory,
          houseRules: [],
          emergencyContacts: dynamicContacts,
          billingSummary: null,
          wifiSsid: cred?.wifiSsid || null,
          wifiPassword: cred?.wifiPassword || null,
          smartLockCode: cred?.smartLockCode || null,
        });
        setComplaints(unitComplaints);
        setHousekeepingRequests(unitHousekeeping);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPortalData();

    const handleTaskUpdated = () => {
      loadPortalData();
    };

    window.addEventListener('arventa_task_updated', handleTaskUpdated);
    window.addEventListener('storage', handleTaskUpdated);
    window.addEventListener('focus', handleTaskUpdated);

    return () => {
      window.removeEventListener('arventa_task_updated', handleTaskUpdated);
      window.removeEventListener('storage', handleTaskUpdated);
      window.removeEventListener('focus', handleTaskUpdated);
    };
  }, []);

  const handleAddComplaint = (complaintData: Omit<TenantComplaint, 'id' | 'createdAt' | 'status'>) => {
    const storedComplaints = localStorage.getItem('arventa_tenant_complaints');
    const allComplaints: TenantComplaint[] = storedComplaints ? JSON.parse(storedComplaints) : [];

    const newComplaint: TenantComplaint = {
      ...complaintData,
      id: `complaint-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [newComplaint, ...allComplaints];
    localStorage.setItem('arventa_tenant_complaints', JSON.stringify(updated));
    setComplaints(updated.filter((c) => c.unitId === details?.unit.id));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arventa_task_updated'));
    }
  };

  const handleAddHousekeepingRequest = (requestData: Omit<HousekeepingRequest, 'id' | 'createdAt' | 'status'>) => {
    const storedHousekeeping = localStorage.getItem('arventa_housekeeping_requests');
    const allHousekeeping: HousekeepingRequest[] = storedHousekeeping ? JSON.parse(storedHousekeeping) : [];

    const newRequest: HousekeepingRequest = {
      ...requestData,
      id: `hk-${Date.now()}`,
      status: 'Diproses',
      createdAt: new Date().toISOString(),
    };

    const updated = [newRequest, ...allHousekeeping];
    localStorage.setItem('arventa_housekeeping_requests', JSON.stringify(updated));
    setHousekeepingRequests(updated.filter((h) => h.unitId === details?.unit.id));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arventa_task_updated'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-background min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border">
        {/* Header Skeleton */}
        <div className="space-y-2 animate-pulse">
          <div className="h-6 w-48 bg-muted rounded-lg" />
          <div className="h-3 w-80 bg-muted/60 rounded-lg" />
        </div>

        {/* Card Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-2xl border border-border animate-pulse p-6 space-y-4">
              <div className="h-5 w-24 bg-muted rounded-lg" />
              <hr className="border-border" />
              <div className="h-10 w-full bg-muted/60 rounded-xl" />
              <div className="h-4 w-40 bg-muted rounded-lg" />
              <div className="h-4 w-52 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center rounded-2xl border border-border bg-card text-card-foreground p-8 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] animate-bounce" />
        <h2 className="text-lg font-bold text-foreground">Akun Anda Belum Terhubung</h2>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Sistem mendeteksi bahwa profil Anda saat ini belum terdaftar di unit kamar manapun.
          Silakan hubungi Owner/Pengelola properti untuk melakukan check-in dan mengaktifkan akses kamar sewa Anda.
        </p>
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#8FA28A]" />
          <span>Demo Hubungi Pengelola: <strong>+62 813-8354-4440</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border">
      
      {/* Title Header with Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Home className="h-6 w-6 text-[#8FA28A]" />
            Informasi Kamar & Layanan Penghuni
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau status huni unit sewa Anda, PIN smart lock, WiFi, rincian tagihan, serta layanan komplain & panggil housekeeping.
          </p>
        </div>

        {/* Quick Action Buttons for Complaint & Housekeeping */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsComplaintModalOpen(true)}
            className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Lapor Kerusakan</span>
          </button>
          {details.property.hasCleaningService !== false && details.property.hasHousekeepingStaff !== false && (
            <button
              type="button"
              onClick={() => setIsHousekeepingModalOpen(true)}
              className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white px-4 py-2.5 text-xs font-black transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>Panggil Housekeeping</span>
            </button>
          )}
        </div>
      </div>

      {/* Modular Card Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <TenantProfileCard
          unit={details.unit}
          wifiSsid={details.wifiSsid}
          wifiPassword={details.wifiPassword}
          smartLockCode={details.smartLockCode}
        />

        {/* Billing Summary Card (SCRUM-57) */}
        <TenantBillingCard
          billing={details.billingSummary}
          monthlyRent={details.unit.pricing.monthly}
        />

        {/* Maintenance Complaints Card */}
        <TenantComplaintCard
          complaints={complaints}
          onOpenModal={() => setIsComplaintModalOpen(true)}
        />

        {/* Housekeeping Service Calls Card */}
        <TenantHousekeepingCard
          requests={housekeepingRequests}
          onOpenModal={() => setIsHousekeepingModalOpen(true)}
          hasCleaningService={details.property.hasCleaningService !== false}
          hasHousekeepingStaff={details.property.hasHousekeepingStaff !== false}
        />

        {/* Room Specifications Card */}
        <RoomDetailCard
          unit={details.unit}
          inventories={details.inventories}
        />

        {/* Property Rules & Contacts Card */}
        <PropertyDetailCard
          property={details.property}
          emergencyContacts={details.emergencyContacts}
          houseRules={details.houseRules}
        />
      </div>

      {/* Complaint Modal */}
      <Suspense fallback={null}>
        {isComplaintModalOpen && (
          <TenantComplaintModal
            isOpen={isComplaintModalOpen}
            onClose={() => setIsComplaintModalOpen(false)}
            onSubmit={handleAddComplaint}
            unitId={details.unit.id}
            unitName={details.unit.name}
            inventoryItems={details.inventories}
          />
        )}
      </Suspense>

      {/* Housekeeping Request Modal */}
      <Suspense fallback={null}>
        {isHousekeepingModalOpen && (
          <HousekeepingRequestModal
            isOpen={isHousekeepingModalOpen}
            onClose={() => setIsHousekeepingModalOpen(false)}
            onSubmit={handleAddHousekeepingRequest}
            unitId={details.unit.id}
            unitName={details.unit.name}
          />
        )}
      </Suspense>
    </div>
  );
}

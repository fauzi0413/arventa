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

const DEFAULT_RULES = [
  "Dilarang membawa tamu lawan jenis menginap tanpa izin pengelola.",
  "Menjaga ketenangan bersama dan menghormati hak privasi penghuni lain.",
  "Batas waktu berkunjung tamu luar maksimal pukul 22.00 WIB.",
  "Dilarang merokok di dalam kamar ber-AC.",
  "Sampah wajib dikemas kantong plastik dan dibuang ke tempat pembuangan luar."
];

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { name: "Pak Ahmad (Owner)", role: "Pemilik Properti", phone: "+62 813-8354-4440" },
  { name: "Mas Rudi (Housekeeping)", role: "Tim Lapangan & Bersih-Bersih", phone: "0813-8354-4440" }
];

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
            houseRules: apiData.houseRules && apiData.houseRules.length > 0 ? apiData.houseRules : DEFAULT_RULES,
            emergencyContacts: apiData.emergencyContacts && apiData.emergencyContacts.length > 0
              ? apiData.emergencyContacts
              : [
                  { name: apiData.property.ownerName || "Pemilik Properti", role: "Pemilik Properti", phone: apiData.property.ownerPhone || "+62 812-3456-7890" },
                  { name: "Tim Lapangan & Housekeeping", role: "Tim Lapangan & Bersih-Bersih", phone: apiData.property.ownerPhone || "+62 812-3456-7890" },
                ],
            billingSummary: apiData.billingSummary,
            wifiSsid: apiData.wifiSsid,
            wifiPassword: apiData.wifiPassword,
            smartLockCode: apiData.smartLockCode,
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

      const billingSummary: TenantBillingSummary = {
        invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${activeUnit.name.replace(/\D/g, '') || '001'}`,
        billingMonth: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        monthlyRent: activeUnit.pricing?.monthly || 1500000,
        utilitiesCost: activeUnit.pricing?.utilities ? 100000 : 100000,
        totalAmount: (activeUnit.pricing?.monthly || 1500000) + 100000,
        dueDate: `25 ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
        paymentStatus: 'Pending',
      };

      const propName = activeProp?.name || 'Kost Raka';
      const dynamicContacts: EmergencyContact[] = [
        { name: `Pengelola ${propName} (Owner)`, role: 'Pemilik Properti', phone: '+62 812-3456-7890' },
        { name: 'Tim Housekeeping & Operasional', role: 'Tim Lapangan & Bersih-Bersih', phone: '+62 812-3456-7890' },
      ];

      const dynamicRules = [
        `Dilarang membawa tamu lawan jenis menginap tanpa izin pengelola ${propName}.`,
        'Menjaga ketenangan bersama dan menghormati hak privasi penghuni lain.',
        'Batas waktu berkunjung tamu luar maksimal pukul 22.00 WIB.',
        'Dilarang merokok di dalam kamar ber-AC.',
        'Sampah wajib dikemas kantong plastik dan dibuang ke tempat pembuangan luar.',
      ];

      if (activeProp) {
        setDetails({
          unit: {
            ...activeUnit,
            tenantName: activeUnit.tenantName || 'Penghuni Terdaftar',
            tenantPhone: activeUnit.tenantPhone || '0812-3456-7890',
            checkInDate: activeUnit.checkInDate || new Date().toISOString().split('T')[0],
          },
          property: activeProp,
          inventories: unitInventory.length > 0 ? unitInventory : [
            { id: 'inv-1', name: 'Kasur Springbed', category: 'Fasilitas', condition: 'BAIK', location: `Unit ${activeUnit.name}` },
            { id: 'inv-2', name: 'AC LG 1PK', category: 'Fasilitas', condition: 'BAIK', location: `Unit ${activeUnit.name}` },
            { id: 'inv-3', name: 'Lemari Pakaian', category: 'Fasilitas', condition: 'BAIK', location: `Unit ${activeUnit.name}` },
          ],
          houseRules: dynamicRules,
          emergencyContacts: dynamicContacts,
          billingSummary,
          wifiSsid: cred?.wifiSsid || `WiFi-${activeUnit.name.replace(/\s+/g, '')}`,
          wifiPassword: cred?.wifiPassword || 'Arv!789210',
          smartLockCode: cred?.smartLockCode || '123456',
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
      <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
        {/* Header Skeleton */}
        <div className="space-y-2 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3 w-80 bg-gray-200 rounded-lg" />
        </div>

        {/* Card Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-white rounded-2xl border border-gray-200 animate-pulse p-6 space-y-4">
              <div className="h-5 w-24 bg-gray-200 rounded-lg" />
              <hr className="border-gray-100" />
              <div className="h-10 w-full bg-gray-200 rounded-xl" />
              <div className="h-4 w-40 bg-gray-200 rounded-lg" />
              <div className="h-4 w-52 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center rounded-2xl border border-[#C7D3C0]/40 bg-[#F7F4ED] p-8 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-[#C8A96B] animate-bounce" />
        <h2 className="text-lg font-bold text-gray-800">Akun Anda Belum Terhubung</h2>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Sistem mendeteksi bahwa profil Anda saat ini belum terdaftar di unit kamar manapun.
          Silakan hubungi Owner/Pengelola properti untuk melakukan check-in dan mengaktifkan akses kamar sewa Anda.
        </p>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-xs text-gray-600 flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#8FA28A]" />
          <span>Demo Hubungi Pengelola: <strong>+62 813-8354-4440</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-[#C7D3C0]/40">
      
      {/* Title Header with Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#C7D3C0]/30 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Home className="h-6 w-6 text-[#8FA28A]" />
            Informasi Kamar & Layanan Penghuni
          </h1>
          <p className="text-sm text-gray-500 mt-1">
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
          {details.property.hasCleaningService !== false && (
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

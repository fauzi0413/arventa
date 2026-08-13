'use client';

import React, { useState, useEffect } from 'react';
import { Home, ShieldAlert, KeyRound, Wifi, Phone } from 'lucide-react';
import { TenantRoomDetails, EmergencyContact } from './_types';
import { Unit } from '@/app/(dashboard)/units/_types';
import { Property } from '@/app/(dashboard)/properties/_types';
import { TenantCredential } from '@/app/(dashboard)/tenants/_types';
import RoomDetailCard from './_components/RoomDetailCard';
import PropertyDetailCard from './_components/PropertyDetailCard';
import TenantProfileCard from './_components/TenantProfileCard';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from localStorage to fetch the currently active tenant details
    const storedUnits = localStorage.getItem('arventa_units');
    const storedProps = localStorage.getItem('arventa_properties');
    const storedInventory = localStorage.getItem('arventa_inventory');
    const storedCreds = localStorage.getItem('arventa_tenants');

    let loadedUnits: Unit[] = [];
    let loadedProps: Property[] = [];
    let loadedInventory = [];
    let loadedCreds: Record<string, TenantCredential> = {};

    if (storedUnits) loadedUnits = JSON.parse(storedUnits);
    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedInventory) loadedInventory = JSON.parse(storedInventory);
    if (storedCreds) loadedCreds = JSON.parse(storedCreds);

    // Identify the active tenant session (in this demo, we assume the first occupied unit matches the tenant portal session)
    const activeUnit = loadedUnits.find((u) => u.status === 'Occupied' && u.tenantName);
    
    if (activeUnit) {
      const activeProp = loadedProps.find((p) => p.id === activeUnit.propertyId);
      const unitInventory = loadedInventory.filter((item: any) => item.unitId === activeUnit.id);
      const cred = loadedCreds[activeUnit.id];

      if (activeProp) {
        setDetails({
          unit: activeUnit,
          property: activeProp,
          inventories: unitInventory,
          houseRules: DEFAULT_RULES,
          emergencyContacts: DEFAULT_CONTACTS,
          wifiSsid: cred?.wifiSsid,
          wifiPassword: cred?.wifiPassword,
          smartLockCode: cred?.smartLockCode
        });
      }
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
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
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <Home className="h-6 w-6 text-[#8FA28A]" />
          Informasi Kamar & Fasilitas Saya
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau status huni unit sewa Anda, konfigurasi jaringan WiFi kamar, PIN smart lock pintu masuk, dan daftar inventaris perabot.
        </p>
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
    </div>
  );
}

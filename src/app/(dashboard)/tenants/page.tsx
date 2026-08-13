'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, KeyRound, Check, Key } from 'lucide-react';
import { Tenant, TenantCredential } from './_types';
import { Unit } from '../units/_types';
import { Property } from '../properties/_types';
import AccessModal from './_components/AccessModal';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'created' | 'not_created'>('all');

  // Modal State
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  useEffect(() => {
    // Load units, properties, and credentials to compose the Tenant list
    const storedUnits = localStorage.getItem('arventa_units');
    const storedProps = localStorage.getItem('arventa_properties');
    const storedCreds = localStorage.getItem('arventa_tenants');

    let loadedUnits: Unit[] = [];
    let loadedProps: Property[] = [];
    let loadedCreds: Record<string, TenantCredential> = {};

    if (storedUnits) loadedUnits = JSON.parse(storedUnits);
    if (storedProps) loadedProps = JSON.parse(storedProps);
    if (storedCreds) loadedCreds = JSON.parse(storedCreds);

    // Filter units that have active tenants
    const occupiedUnits = loadedUnits.filter((u) => u.status === 'Occupied' && u.tenantName);

    const composedTenants: Tenant[] = occupiedUnits.map((u) => {
      const prop = loadedProps.find((p) => p.id === u.propertyId);
      const cred = loadedCreds[u.id];

      return {
        id: u.id, // we map tenant ID to the unit ID for simplicity
        fullName: u.tenantName || 'N/A',
        email: cred ? cred.username : `${u.tenantName?.toLowerCase().replace(/\s+/g, '') || 'tenant'}@arventa.com`,
        phoneNumber: u.tenantPhone || 'N/A',
        propertyId: u.propertyId,
        propertyName: prop ? prop.name : 'Properti Lain',
        unitId: u.id,
        unitName: u.name,
        checkInDate: u.checkInDate || new Date().toISOString().split('T')[0],
        credentialCreated: !!cred,
        credential: cred || undefined
      };
    });

    const timer = setTimeout(() => {
      setTenants(composedTenants);
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSaveCredentials = (tenantId: string, credential: TenantCredential) => {
    const storedCreds = localStorage.getItem('arventa_tenants');
    let loadedCreds: Record<string, TenantCredential> = {};
    if (storedCreds) loadedCreds = JSON.parse(storedCreds);

    // Save/Update credential
    loadedCreds[tenantId] = credential;
    localStorage.setItem('arventa_tenants', JSON.stringify(loadedCreds));

    // Update local state
    const updatedTenants = tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          credentialCreated: true,
          credential
        };
      }
      return t;
    });

    setTenants(updatedTenants);
    
    // Update selected tenant in modal
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant({
        ...selectedTenant,
        credentialCreated: true,
        credential
      });
    }
  };

  const handleOpenAccessModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsAccessModalOpen(true);
  };

  // Filter Logic
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unitName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'created' && t.credentialCreated) ||
      (statusFilter === 'not_created' && !t.credentialCreated);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F7F4ED]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Memuat data penyewa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F7F4ED] min-h-[85vh] p-6 rounded-2xl border border-[#C7D3C0]/40">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-[#8FA28A]" />
            Kredensial & Akses Penghuni
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat akun login portal penghuni, atur ulang password, kelola PIN pintu Smart Lock, dan bagikan detail via WhatsApp/QR Code.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama penghuni, properti, atau nomor kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 focus:border-[#8FA28A] focus:outline-none"
          >
            <option value="all">Semua Status Akun</option>
            <option value="created">Kredensial Aktif</option>
            <option value="not_created">Belum Dibuat</option>
          </select>
        </div>
      </div>

      {/* Tenant Table / Card Grid */}
      {tenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm space-y-3">
          <ShieldAlert className="h-10 w-10 text-[#C8A96B] mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">Belum Ada Penghuni Aktif</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Sistem mendeteksi belum ada kamar yang berstatus &quot;Terisi (Occupied)&quot;. Silakan lakukan check-in penghuni terlebih dahulu di menu Manajemen Unit Kamar.
          </p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400">Pencarian tidak menemukan hasil. Coba kata kunci atau filter lain.</p>
        </div>
      ) : (
        /* TABLE CONTAINER */
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nama Penghuni</th>
                  <th className="px-6 py-4">Properti / Kamar</th>
                  <th className="px-6 py-4">Kontak & Tanggal Masuk</th>
                  <th className="px-6 py-4">Status Akun</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white uppercase ${
                          tenant.credentialCreated ? 'bg-[#8FA28A]' : 'bg-gray-400'
                        }`}>
                          {tenant.fullName.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-black text-gray-800">{tenant.fullName}</p>
                          <p className="text-[10px] text-gray-400">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{tenant.propertyName}</p>
                      <p className="text-[10px] text-gray-400">{tenant.unitName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-mono">{tenant.phoneNumber}</p>
                      <p className="text-[10px] text-gray-400">Masuk: {tenant.checkInDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        tenant.credentialCreated
                          ? 'bg-[#C7D3C0]/30 text-[#6A7866] border border-[#8FA28A]/20'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tenant.credentialCreated ? 'Kredensial Aktif' : 'Belum Dibuat'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenAccessModal(tenant)}
                        className={`rounded-xl border px-3 py-1.5 text-[11px] font-black transition-all flex items-center gap-1.5 ml-auto ${
                          tenant.credentialCreated
                            ? 'border-[#C7D3C0] bg-white text-gray-700 hover:bg-[#C7D3C0]/10'
                            : 'border-[#8FA28A] bg-[#8FA28A] text-white hover:bg-[#8FA28A]/90'
                        }`}
                      >
                        <Key className="h-3.5 w-3.5" />
                        {tenant.credentialCreated ? 'Detail Akses' : 'Generate Access'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACCESS & CREDENTIAL MODAL */}
      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        tenant={selectedTenant}
        onSaveCredentials={handleSaveCredentials}
      />
    </div>
  );
}

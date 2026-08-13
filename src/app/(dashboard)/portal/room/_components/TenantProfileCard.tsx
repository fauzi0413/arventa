'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Calendar, Wifi, Lock, Copy, Check, ShieldAlert } from 'lucide-react';
import { Unit } from '@/app/(dashboard)/units/_types';

interface TenantProfileCardProps {
  unit: Unit;
  wifiSsid?: string;
  wifiPassword?: string;
  smartLockCode?: string;
}

export default function TenantProfileCard({ unit, wifiSsid, wifiPassword, smartLockCode }: TenantProfileCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRemainingDays = (checkInDateStr?: string) => {
    if (!checkInDateStr) return 'N/A';
    // Calculate a dummy lease end date (e.g. 1 month from check-in) for visualization
    const checkIn = new Date(checkInDateStr);
    const end = new Date(checkIn);
    end.setMonth(end.getMonth() + 1);

    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Masa sewa habis';
    return `${diffDays} Hari`;
  };

  return (
    <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <User className="h-5 w-5 text-[#8FA28A]" />
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Profil & Akses Anda</h3>
      </div>

      {/* Tenant Identity */}
      <div className="flex items-center gap-3.5 bg-[#8FA28A]/5 p-4 rounded-xl border border-[#8FA28A]/20">
        <div className="h-11 w-11 rounded-full bg-[#8FA28A] text-white flex items-center justify-center font-bold text-base shadow-sm">
          {unit.tenantName?.substring(0, 2).toUpperCase() || 'TN'}
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-800">{unit.tenantName || 'Penyewa'}</h4>
          <p className="text-[10px] text-[#8FA28A] font-bold uppercase tracking-wider">Penyewa Terdaftar</p>
        </div>
      </div>

      {/* Lease Details */}
      <div className="space-y-3.5 text-xs">
        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gray-400" /> WhatsApp Anda
          </span>
          <span className="font-bold text-gray-800">{unit.tenantPhone || 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" /> Tanggal Check-In
          </span>
          <span className="font-bold text-gray-800">{unit.checkInDate || 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" /> Sisa Masa Sewa
          </span>
          <span className="rounded-full bg-[#8FA28A]/10 border border-[#8FA28A]/20 px-2.5 py-0.5 text-[10px] font-black text-[#6A7866]">
            {getRemainingDays(unit.checkInDate)}
          </span>
        </div>
      </div>

      {/* Wifi & Lock Credentials Block */}
      <div className="space-y-3.5 pt-2 border-t border-gray-50">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Akses Kunci & WiFi Kamar</span>

        <div className="space-y-2">
          {/* WiFi Section */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8FA28A] uppercase tracking-wide flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5" /> WiFi Kamar
              </span>
            </div>
            {wifiSsid ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
                <div>
                  <span className="text-[9px] text-gray-400 block font-normal">SSID</span>
                  <span className="break-all">{wifiSsid}</span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] text-gray-400 block font-normal">Sandi WiFi</span>
                    <span className="break-all">{wifiPassword}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(wifiPassword || '', 'wifi')}
                    className="text-[#8FA28A] hover:bg-gray-200/50 p-1 rounded mt-1 shrink-0"
                    title="Salin Kata Sandi"
                  >
                    {copiedField === 'wifi' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">WiFi belum dikonfigurasi oleh pengelola properti.</p>
            )}
          </div>

          {/* Smart Lock Section */}
          <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wide flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Smart Lock PIN
              </span>
              {smartLockCode ? (
                <span className="font-mono text-base font-black text-[#C8A96B] tracking-widest block">{smartLockCode}</span>
              ) : (
                <span className="text-[10px] text-gray-400 italic block">PIN belum diset.</span>
              )}
            </div>
            {smartLockCode && (
              <button
                onClick={() => handleCopy(smartLockCode || '', 'lock')}
                className="text-[#C8A96B] hover:bg-amber-100/50 p-1.5 rounded transition-all"
                title="Salin PIN"
              >
                {copiedField === 'lock' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

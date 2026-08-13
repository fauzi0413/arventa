'use client';

import React, { useState } from 'react';
import { X, Copy, Check, QrCode, MessageSquare, RotateCcw, KeyRound, Wifi, Smartphone, Lock } from 'lucide-react';
import { Tenant, TenantCredential } from '../_types';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSaveCredentials: (tenantId: string, credential: TenantCredential) => void;
}

export default function AccessModal({ isOpen, onClose, tenant, onSaveCredentials }: AccessModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Local state inputs for customization before generation
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('arventa1234');
  const [smartLockCode, setSmartLockCode] = useState('');

  if (!isOpen || !tenant) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateRandomPassword = (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleGenerateAccess = () => {
    const formattedName = tenant.fullName.toLowerCase().replace(/\s+/g, '');
    const randDigits = Math.floor(100 + Math.random() * 900);
    const username = `${formattedName}${randDigits}@arventa.com`;
    const passwordPlain = generateRandomPassword();

    const cred: TenantCredential = {
      username,
      passwordPlain,
      wifiSsid: wifiSsid || `WiFi_${tenant.propertyName.replace(/\s+/g, '')}_${tenant.unitName.replace(/\s+/g, '')}`,
      wifiPassword: wifiPassword || 'arventa1234',
      smartLockCode: smartLockCode || String(Math.floor(100000 + Math.random() * 900000)),
      generatedAt: new Date().toISOString()
    };

    onSaveCredentials(tenant.id, cred);
  };

  const handleResetPassword = () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang kata sandi tenant ini?')) {
      const updatedCred: TenantCredential = {
        ...tenant.credential!,
        passwordPlain: generateRandomPassword(),
        generatedAt: new Date().toISOString()
      };
      onSaveCredentials(tenant.id, updatedCred);
    }
  };

  const handleShareWhatsApp = () => {
    if (!tenant.credential) return;
    const cred = tenant.credential;
    
    const message = `*Halo ${tenant.fullName}*,

Berikut adalah detail akses masuk untuk kamar Anda (*${tenant.unitName}* - *${tenant.propertyName}*):

🔑 *KREDENSIAL LOGIN APLIKASI*
- Username/Email: ${cred.username}
- Password: ${cred.passwordPlain}

🛜 *AKSES WIFI*
- SSID: ${cred.wifiSsid || '-'}
- Password WiFi: ${cred.wifiPassword || '-'}

🚪 *SMART LOCK*
- PIN Kunci Digital: ${cred.smartLockCode || '-'}

Silakan gunakan tautan berikut untuk login cepat:
https://arventa.id/fast-login?user=${cred.username}

Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/6281383544440?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const qrDataUrl = tenant.credential
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        `https://arventa.id/fast-login?user=${tenant.credential.username}&pass=${tenant.credential.passwordPlain}`
      )}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#C7D3C0]/40 bg-[#F7F4ED] shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/30 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#8FA28A]" />
            <h3 className="text-sm font-black text-gray-800">Akses Kredensial Kamar</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tenant Profile Preview */}
          <div className="rounded-xl border border-gray-100 bg-white p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Penyewa Aktif</span>
            <h4 className="text-sm font-black text-gray-800">{tenant.fullName}</h4>
            <p className="text-[11px] text-gray-500">{tenant.propertyName} • {tenant.unitName}</p>
          </div>

          {!tenant.credentialCreated ? (
            /* ACCESS GENERATION FORM */
            <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 leading-relaxed">
                Penyewa ini belum memiliki kredensial login dan akses kunci digital kamar. Isi data opsional di bawah ini untuk membuatnya secara otomatis.
              </div>

              {/* Wifi SSID Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">WiFi SSID (Nama WiFi)</label>
                <input
                  type="text"
                  placeholder={`WiFi_${tenant.propertyName.replace(/\s+/g, '')}_${tenant.unitName.replace(/\s+/g, '')}`}
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Wifi Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Kata Sandi WiFi</label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Smart Lock PIN Code */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">PIN Smart Lock (6 Digit - Opsional)</label>
                <input
                  type="text"
                  placeholder="Diisi acak jika dikosongkan..."
                  value={smartLockCode}
                  maxLength={6}
                  onChange={(e) => setSmartLockCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <button
                onClick={handleGenerateAccess}
                className="w-full rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white py-3 text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <KeyRound className="h-4 w-4" />
                Buat Kredensial & Kunci Digital
              </button>
            </div>
          ) : (
            /* CREDENTIALS PRESENTATION */
            <div className="space-y-4">
              {showQR ? (
                /* QR VIEW */
                <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Scan QR Code untuk Fast-Login</span>
                  <div className="p-3 border border-[#C7D3C0] rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Code Login" className="h-40 w-40" />
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-[240px]">
                    Scan QR Code ini menggunakan kamera ponsel penyewa untuk langsung mengisi username & password di portal sewa.
                  </p>
                  <button
                    onClick={() => setShowQR(false)}
                    className="text-xs font-bold text-[#8FA28A] hover:underline"
                  >
                    Kembali ke Detail Kredensial
                  </button>
                </div>
              ) : (
                /* DETAIL ACCORDIONS */
                <div className="space-y-3">
                  {/* Account Login */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-[#8FA28A]" /> Akses Aplikasi Penyewa
                    </h5>
                    
                    {/* Username Field */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Username / Email</label>
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3 py-2 text-xs">
                        <span className="font-mono text-gray-700">{tenant.credential?.username}</span>
                        <button
                          onClick={() => handleCopy(tenant.credential?.username || '', 'username')}
                          className="text-[#8FA28A] hover:bg-gray-100 p-1 rounded transition-colors"
                        >
                          {copiedField === 'username' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Password</label>
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3 py-2 text-xs">
                        <span className="font-mono text-gray-700 font-bold">{tenant.credential?.passwordPlain}</span>
                        <button
                          onClick={() => handleCopy(tenant.credential?.passwordPlain || '', 'password')}
                          className="text-[#8FA28A] hover:bg-gray-100 p-1 rounded transition-colors"
                        >
                          {copiedField === 'password' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Reset Password Button */}
                    <button
                      onClick={handleResetPassword}
                      className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 font-bold tracking-wide transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset Kata Sandi
                    </button>
                  </div>

                  {/* WiFi Info */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Wifi className="h-3.5 w-3.5 text-[#8FA28A]" /> Kredensial WiFi Kamar
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                        <span className="block text-[9px] text-gray-400">SSID</span>
                        <span className="font-semibold text-gray-700 block mt-0.5 break-all">{tenant.credential?.wifiSsid}</span>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                        <span className="block text-[9px] text-gray-400">Kata Sandi WiFi</span>
                        <span className="font-semibold text-gray-700 block mt-0.5 break-all">{tenant.credential?.wifiPassword}</span>
                      </div>
                    </div>
                  </div>

                  {/* Smart Lock info */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-[#8FA28A]" /> Akses Pintu (Smart Lock)
                    </h5>
                    <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2 text-xs">
                      <div>
                        <span className="text-[9px] text-gray-400 block">Kunci Digital PIN</span>
                        <span className="font-mono text-base font-black text-[#C8A96B] tracking-wider">{tenant.credential?.smartLockCode}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(tenant.credential?.smartLockCode || '', 'pin')}
                        className="text-[#C8A96B] hover:bg-amber-100/50 p-1.5 rounded transition-colors"
                      >
                        {copiedField === 'pin' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Quick Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="rounded-xl border border-[#C7D3C0] bg-white py-3 text-xs font-bold text-gray-700 hover:bg-[#C7D3C0]/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <QrCode className="h-4 w-4 text-[#8FA28A]" />
                  {showQR ? 'Tampilkan Info' : 'Share QR Login'}
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Kirim WA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

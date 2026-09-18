'use client';

import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  MessageSquare,
  Sparkles,
  X,
  ExternalLink,
  Search,
  CheckCircle2,
  Mail,
  User,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { Property } from '@/app/(dashboard)/properties/_types';
import { EmergencyContact, HousekeepingMember } from '../_types';

interface PropertyDetailCardProps {
  property: Property;
  emergencyContacts: EmergencyContact[];
  houseRules: string[];
  housekeepingTeam?: HousekeepingMember[];
}

export default function PropertyDetailCard({
  property,
  emergencyContacts,
  houseRules,
  housekeepingTeam = [],
}: PropertyDetailCardProps) {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Helper to format WhatsApp URL
  const getWhatsAppUrl = (phone: string, staffName?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.startsWith('0')
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone;
    const msg = encodeURIComponent(
      `Halo ${staffName ? staffName : 'Tim Lapangan'}, saya penghuni di properti ${property.name}.`
    );
    return `https://wa.me/${formatted}?text=${msg}`;
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Extract owner contacts
  const ownerContacts = emergencyContacts.filter(
    (c) =>
      c.type === 'OWNER' ||
      c.role?.toLowerCase().includes('pemilik') ||
      c.role?.toLowerCase().includes('owner')
  );

  // Extract housekeeping staff (combine from housekeepingTeam or emergencyContacts with fallback)
  const hkFromContacts: HousekeepingMember[] = emergencyContacts
    .filter(
      (c) =>
        c.type === 'HOUSEKEEPING' ||
        c.role?.toLowerCase().includes('housekeeping') ||
        c.role?.toLowerCase().includes('lapangan') ||
        c.role?.toLowerCase().includes('bersih')
    )
    .map((c) => ({
      id: c.id || c.name,
      name: c.rawName || c.name.replace(/\s*\(Housekeeping\)/gi, '').trim(),
      role: 'Housekeeping & Operasional',
      phone: c.phone,
      email: c.email,
      avatarUrl: c.avatarUrl,
    }));

  // Unique list of housekeeping staff by ID or Name
  const combinedHousekeeping: HousekeepingMember[] = [];
  const seenIds = new Set<string>();

  for (const item of [...housekeepingTeam, ...hkFromContacts]) {
    const key = item.id || item.name;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      combinedHousekeeping.push({
        ...item,
        name: item.name.replace(/\s*\(Housekeeping\)/gi, '').trim(),
      });
    }
  }

  // Filtered staff for modal search
  const filteredStaff = combinedHousekeeping.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Building className="h-5 w-5 text-[#8FA28A]" />
        <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
          Detail Properti & Pengelola
        </h3>
      </div>

      {/* Property Basic Info */}
      <div className="space-y-3">
        <h4 className="text-base font-black text-foreground">{property.name}</h4>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground/70 shrink-0 mt-0.5" />
          <span>{property.address}</span>
        </div>
      </div>

      {/* Tata Tertib / House Rules */}
      <div className="space-y-2.5 pt-2 border-t border-border/50">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-[#8FA28A]" /> Tata Tertib Hunian
        </span>
        {houseRules.length > 0 ? (
          <ul className="space-y-1.5 pl-3.5 list-disc text-xs text-muted-foreground font-medium">
            {houseRules.map((rule, idx) => (
              <li key={idx} className="leading-relaxed">
                {rule}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Belum ada tata tertib khusus yang dikonfigurasi untuk properti ini.
          </p>
        )}
      </div>

      {/* Kontak Darurat & Pengelola */}
      <div className="space-y-4 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-[#8FA28A]" /> Kontak Darurat & Pengelola
          </span>
          {combinedHousekeeping.length > 1 && (
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="text-[11px] font-bold text-[#8FA28A] hover:underline flex items-center gap-1 transition-colors"
            >
              <Users className="h-3 w-3" />
              Detail Tim ({combinedHousekeeping.length})
            </button>
          )}
        </div>

        {/* Section: Pemilik Properti */}
        {ownerContacts.length > 0 ? (
          <div className="space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Pemilik Properti
            </span>
            <div className="grid gap-2">
              {ownerContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] font-black text-xs flex items-center justify-center shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-[#8FA28A] uppercase tracking-wide">
                          {contact.role}
                        </span>
                      </div>
                      <p className="font-bold text-foreground truncate">{contact.name}</p>
                      {contact.phone && contact.phone !== '-' && (
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {contact.phone && contact.phone !== '-' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={getWhatsAppUrl(contact.phone, contact.rawName || contact.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center"
                        title={`Chat WhatsApp ${contact.name}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`tel:${contact.phone}`}
                        className="rounded-lg p-2 bg-[#8FA28A]/10 text-[#8FA28A] dark:text-[#A3B89E] hover:bg-[#8FA28A]/20 transition-colors flex items-center justify-center"
                        title={`Telepon ${contact.name}`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Section: Tim Lapangan & Housekeeping */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Tim Lapangan & Bersih-Bersih
              {combinedHousekeeping.length > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#8FA28A]/15 text-[#8FA28A]">
                  {combinedHousekeeping.length} Staf
                </span>
              )}
            </span>
          </div>

          {combinedHousekeeping.length > 0 ? (
            <div className="space-y-2">
              {combinedHousekeeping.map((staff, idx) => (
                <div
                  key={staff.id || idx}
                  className="p-3.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          Housekeeping
                        </span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <p className="font-bold text-foreground truncate">{staff.name}</p>
                      {staff.phone && staff.phone !== '-' && (
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {staff.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {staff.phone && staff.phone !== '-' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={getWhatsAppUrl(staff.phone, staff.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center"
                        title={`Chat WhatsApp ${staff.name}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`tel:${staff.phone}`}
                        className="rounded-lg p-2 bg-[#8FA28A]/10 text-[#8FA28A] dark:text-[#A3B89E] hover:bg-[#8FA28A]/20 transition-colors flex items-center justify-center"
                        title={`Telepon ${staff.name}`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {/* Button to open team modal */}
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-[#8FA28A]/40 bg-[#8FA28A]/5 hover:bg-[#8FA28A]/10 text-[#8FA28A] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Lihat Informasi Lengkap Tim Housekeeping</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-center text-xs text-muted-foreground">
              Belum ada petugas housekeeping yang ditugaskan ke properti ini.
            </div>
          )}
        </div>
      </div>

      {/* Detail Tim Lapangan Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#8FA28A]/15 text-[#8FA28A]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Tim Lapangan & Housekeeping
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {property.name} &bull; {combinedHousekeeping.length} Petugas Siap Melayani
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Search Bar (if more than 2 staff) */}
              {combinedHousekeeping.length > 2 && (
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari nama atau nomor telepon petugas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#8FA28A]"
                  />
                </div>
              )}

              {/* Staff List */}
              <div className="space-y-3">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff, idx) => (
                    <div
                      key={staff.id || idx}
                      className="p-4 rounded-2xl border border-border bg-card hover:border-[#8FA28A]/40 transition-all shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8FA28A]/20 to-[#8FA28A]/10 text-[#8FA28A] font-black text-sm flex items-center justify-center shrink-0 border border-[#8FA28A]/20 shadow-xs">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-foreground truncate">
                                {staff.name}
                              </h4>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Aktif
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              {staff.role || 'Housekeeping & Operasional Properti'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info Items */}
                      <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                            <span className="font-semibold text-foreground truncate">
                              {staff.phone || '-'}
                            </span>
                          </div>
                          {staff.phone && staff.phone !== '-' && (
                            <button
                              onClick={(e) => handleCopyPhone(staff.phone, e)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Salin Nomor Telepon"
                            >
                              {copiedPhone === staff.phone ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {staff.email ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50 min-w-0">
                            <Mail className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                            <span className="font-medium text-muted-foreground truncate">
                              {staff.email}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50 min-w-0">
                            <Sparkles className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                            <span className="font-medium text-muted-foreground truncate">
                              Standby di Area Properti
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      {staff.phone && staff.phone !== '-' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a
                            href={getWhatsAppUrl(staff.phone, staff.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Chat WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${staff.phone}`}
                            className="py-2 px-3 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Phone className="h-3.5 w-3.5 text-[#8FA28A]" />
                            <span>Panggil Nomor</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    Tidak ada petugas yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-[#8FA28A] shrink-0" />
                <span>Petugas housekeeping siap membantu saat jam operasional hunian.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition-colors shrink-0"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

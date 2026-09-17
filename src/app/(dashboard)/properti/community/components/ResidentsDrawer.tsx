"use client";

import React, { useState, useMemo } from "react";
import {
  IconX,
  IconUsers,
  IconSearch,
  IconBrandWhatsapp,
  IconCalendar,
  IconBed,
  IconShieldCheck,
  IconUserCheck,
} from "@tabler/icons-react";
import { ChatResidentItem } from "../types/chat";

interface ResidentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  residents: ChatResidentItem[];
  propertyName?: string;
  activeTenantsCount: number;
  managementCount: number;
}

export function ResidentsDrawer({
  isOpen,
  onClose,
  residents,
  propertyName,
  activeTenantsCount,
  managementCount,
}: ResidentsDrawerProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "TENANT" | "MANAGEMENT">("ALL");

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.unitNumber && r.unitNumber.toLowerCase().includes(search.toLowerCase())) ||
        r.displayRole.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "TENANT") {
        return r.role === "TENANT";
      }
      if (activeTab === "MANAGEMENT") {
        return r.role === "OWNER" || r.role === "HOUSEKEEPING" || r.role === "STAFF";
      }
      return true;
    });
  }, [residents, search, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-md h-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border/80 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A]/20 text-[#8FA28A]">
                <IconUsers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Daftar Warga & Pengelola
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {propertyName || "Kost"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "ALL"
                  ? "bg-[#8FA28A] text-white"
                  : "bg-card text-muted-foreground border border-border/70 hover:text-foreground"
              }`}
            >
              Semua ({residents.length})
            </button>
            <button
              onClick={() => setActiveTab("TENANT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "TENANT"
                  ? "bg-[#8FA28A] text-white"
                  : "bg-card text-muted-foreground border border-border/70 hover:text-foreground"
              }`}
            >
              Penghuni ({activeTenantsCount})
            </button>
            <button
              onClick={() => setActiveTab("MANAGEMENT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "MANAGEMENT"
                  ? "bg-[#8FA28A] text-white"
                  : "bg-card text-muted-foreground border border-border/70 hover:text-foreground"
              }`}
            >
              Owner ({managementCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-3">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor kamar..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-[#8FA28A]"
            />
          </div>
        </div>

        {/* Resident List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredResidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              Tidak ada warga atau pengelola yang cocok dengan pencarian.
            </div>
          ) : (
            filteredResidents.map((resident) => {
              const isManager =
                resident.role === "OWNER" ||
                resident.role === "HOUSEKEEPING" ||
                resident.role === "STAFF";

              const cleanPhone = resident.phone?.replace(/[^0-9]/g, "");
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}`
                : null;

              return (
                <div
                  key={resident.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/70 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isManager
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : "bg-[#8FA28A]/20 text-[#8FA28A] border border-[#8FA28A]/30"
                      }`}
                    >
                      {resident.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-foreground truncate max-w-[150px]">
                          {resident.name}
                        </p>
                        {isManager ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                            <IconShieldCheck className="h-3 w-3" />
                            <span>{resident.displayRole}</span>
                          </span>
                        ) : resident.unitNumber ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-muted text-foreground/90 border border-border/70">
                            <IconBed className="h-3 w-3" />
                            <span>Kamar {resident.unitNumber}</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Lease Date if available */}
                      {resident.leaseStartDate && resident.leaseEndDate && (
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <IconCalendar className="h-3 w-3" />
                          <span>
                            {new Date(resident.leaseStartDate).toLocaleDateString("id-ID", {
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(resident.leaseEndDate).toLocaleDateString("id-ID", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Action: WA Chat */}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 transition-colors shrink-0"
                      title={`Kirim WhatsApp ke ${resident.name}`}
                    >
                      <IconBrandWhatsapp className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 text-center bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            Daftar penghuni terhubung secara otomatis dengan unit sewa aktif.
          </p>
        </div>
      </div>
    </div>
  );
}

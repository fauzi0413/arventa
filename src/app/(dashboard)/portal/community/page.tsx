"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IconHistory,
  IconBuildingCommunity,
  IconUsers,
  IconSpeakerphone,
  IconPin,
  IconPinFilled,
  IconSearch,
  IconMessages,
  IconArrowRight,
  IconDoorEnter,
  IconDoorExit,
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconInfoCircle,
  IconChevronDown,
  IconRefresh,
  IconShieldCheck,
  IconAlertCircle,
  IconClock,
  IconSparkles,
} from "@tabler/icons-react";

interface CommunityHistoryStats {
  totalMessages: number;
  activeResidents: number;
  managersCount: number;
  totalAnnouncements: number;
  pinnedCount: number;
  totalEvents: number;
}

interface ResidentLogItem {
  id: string;
  eventType: "JOIN" | "LEAVE";
  content: string;
  senderName: string;
  senderUnitNumber?: string | null;
  timestamp: string;
}

interface AnnouncementArchiveItem {
  id: string;
  source: "OFFICIAL" | "CHAT_ANNOUNCEMENT";
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  isPinned: boolean;
  category: string;
  createdAt: string;
}

interface PinnedArchiveItem {
  id: string;
  content: string;
  senderName: string;
  senderRole: string;
  senderUnitNumber?: string | null;
  pinnedAt: string;
  createdAt: string;
}

interface AvailableProperty {
  id: string;
  name: string;
  city?: string | null;
}

interface CommunityHistoryData {
  hasAccess: boolean;
  error?: string;
  property: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  } | null;
  availableProperties: AvailableProperty[];
  stats: CommunityHistoryStats;
  residentLogs: ResidentLogItem[];
  announcements: AnnouncementArchiveItem[];
  pinnedArchive: PinnedArchiveItem[];
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

// Format readable date (e.g. "16 September 2026, 14:30 WIB")
function formatFullDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateString;
  }
}

// Relative time string (e.g. "2 jam lalu", "3 hari lalu")
function getRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatFullDateTime(dateString);
  } catch {
    return "";
  }
}

export default function CommunityHistoryPage() {
  const [data, setData] = useState<CommunityHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "residents" | "announcements" | "pinned" | "analytics"
  >("residents");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch community history
  const fetchHistory = useCallback(
    async (propId?: string, query?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (propId) params.set("propertyId", propId);
        if (query) params.set("search", query);

        const res = await fetch(`/api/community/history?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.message || "Gagal memuat history komunitas.");
          if (json.data?.availableProperties) {
            setData((prev) =>
              prev
                ? { ...prev, availableProperties: json.data.availableProperties }
                : null
            );
          }
          return;
        }

        setData(json.data);
        if (json.data?.property?.id && !propId) {
          setSelectedPropertyId(json.data.property.id);
        }
      } catch (err: any) {
        console.error("fetchHistory error:", err);
        setError(err?.message || "Terjadi kesalahan jaringan.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchHistory(selectedPropertyId || undefined, debouncedSearch);
  }, [fetchHistory, selectedPropertyId, debouncedSearch]);

  const handlePropertySwitch = (id: string) => {
    setSelectedPropertyId(id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HEADER SECTION & PROPERTY SELECTOR */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-md backdrop-blur-md">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#8FA28A]/15 text-[#8FA28A] border border-[#8FA28A]/30">
              <IconHistory className="h-3.5 w-3.5" />
              History & Rekam Jejak Komunitas
            </span>

            {/* Property Selector Dropdown */}
            {data && data.availableProperties.length > 1 && (
              <div className="relative inline-block">
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-muted hover:bg-muted/80 text-foreground transition-all border border-border"
                >
                  <span>{data.property?.name || "Pilih Properti"}</span>
                  <IconChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-40 w-72 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1">
                        Pilih Properti Kost
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {data.availableProperties.map((p) => {
                          const isSelected = p.id === data.property?.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handlePropertySwitch(p.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                                isSelected
                                  ? "bg-[#8FA28A]/15 text-[#8FA28A] font-bold"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <span className="truncate">{p.name}</span>
                              {isSelected && <IconCheck className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {data?.property?.name || "Komunitas Properti Kost"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Arsip lengkap aktivitas warga kost, pengumuman resmi pengelola, pesan
            tersemat, serta analitik interaksi komunitas kos.
          </p>
        </div>

        {/* Quick Action: Buka Roomchat WhatsApp Grup */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={() => fetchHistory(selectedPropertyId, debouncedSearch)}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-border/80 bg-card hover:bg-muted text-foreground transition-all disabled:opacity-50"
            title="Muat ulang data"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin text-[#8FA28A]" : ""}`} />
          </button>

          <Link
            href="/housekeeping/community"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold transition-all shadow-md active:scale-95 group"
          >
            <IconMessages className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Buka Obrolan Grup</span>
            <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. STATS KPI CARDS */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Residents */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Warga Kost Aktif</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8FA28A]/15 text-[#8FA28A]">
              <IconUsers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {data?.stats?.activeResidents ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            + {data?.stats?.managersCount ?? 0} Tim Pengelola Kos
          </p>
        </div>

        {/* KPI 2: Resident Events Log */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Riwayat Penghuni</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
              <IconDoorEnter className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {data?.stats?.totalEvents ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Log Check-in & Check-out</p>
        </div>

        {/* KPI 3: Total Announcements */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Pengumuman Resmi</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <IconSpeakerphone className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {data?.stats?.totalAnnouncements ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Arsip Siaran Pengelola</p>
        </div>

        {/* KPI 4: Pinned Messages */}
        <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Pesan Tersemat</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <IconPinFilled className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {data?.stats?.pinnedCount ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Dari {data?.stats?.totalMessages ?? 0} total pesan grup
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. TABS NAVIGATION & SEARCH BAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("residents")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "residents"
                ? "bg-[#8FA28A] text-white shadow-xs"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconDoorEnter className="h-4 w-4" />
            <span>Riwayat Warga</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "residents" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {data?.residentLogs?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "announcements"
                ? "bg-[#8FA28A] text-white shadow-xs"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconSpeakerphone className="h-4 w-4" />
            <span>Arsip Pengumuman</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "announcements" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {data?.announcements?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pinned")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "pinned"
                ? "bg-[#8FA28A] text-white shadow-xs"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconPinFilled className="h-4 w-4" />
            <span>Pesan Tersemat</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "pinned" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {data?.pinnedArchive?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-[#8FA28A] text-white shadow-xs"
                : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconChartBar className="h-4 w-4" />
            <span>Pedoman & Info</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari warga, nomor kamar, pengumuman..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-card border border-border focus:outline-hidden focus:ring-2 focus:ring-[#8FA28A]/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. CONTENT SECTIONS (Based on Active Tab) */}
      {/* --------------------------------------------------------------------- */}
      {loading ? (
        // Loading Skeleton
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-card rounded-3xl" />
          <div className="h-20 bg-card rounded-3xl" />
          <div className="h-20 bg-card rounded-3xl" />
        </div>
      ) : error ? (
        // Error State
        <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-3">
          <IconAlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Terjadi Kesalahan</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchHistory(selectedPropertyId)}
            className="px-4 py-2 rounded-xl bg-[#8FA28A] text-white text-xs font-bold"
          >
            Muat Ulang
          </button>
        </div>
      ) : (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* TAB 1: RIWAYAT WARGA (Lifecycle: Check-in / Check-out) */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "residents" && (
            <div className="space-y-3">
              {(!data?.residentLogs || data.residentLogs.length === 0) ? (
                <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-2">
                  <IconUsers className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    Belum Ada Riwayat Aktivitas Warga
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Log peristiwa check-in atau check-out penghuni akan tercatat otomatis di sini.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                  {data.residentLogs.map((log) => {
                    const isJoin = log.eventType === "JOIN";
                    return (
                      <div
                        key={log.id}
                        className="relative flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-[#8FA28A]/50 transition-colors"
                      >
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-6 top-5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${
                            isJoin
                              ? "bg-emerald-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          {isJoin ? (
                            <IconDoorEnter className="h-3 w-3" />
                          ) : (
                            <IconDoorExit className="h-3 w-3" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                isJoin
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {isJoin ? "Check-in / Masuk Kost" : "Check-out / Selesai Sewa"}
                            </span>

                            {log.senderUnitNumber && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-foreground border border-border/60">
                                Kamar {log.senderUnitNumber}
                              </span>
                            )}

                            <span className="text-[11px] text-muted-foreground ml-auto">
                              {getRelativeTime(log.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                            {log.content}
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                            <IconCalendar className="h-3.5 w-3.5" />
                            <span>{formatFullDateTime(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 2: ARSIP PENGUMUMAN RESMI */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "announcements" && (
            <div className="space-y-4">
              {(!data?.announcements || data.announcements.length === 0) ? (
                <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-2">
                  <IconSpeakerphone className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    Belum Ada Arsip Pengumuman
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pengumuman dari pengelola kos yang pernah disiarkan akan tersimpan rapi di sini.
                  </p>
                </div>
              ) : (
                data.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <IconSpeakerphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Oleh {item.authorName} ({item.authorRole})</span>
                            <span>•</span>
                            <span>{formatFullDateTime(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                            <IconPinFilled className="h-3 w-3" />
                            Tersemat
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                          {item.source === "OFFICIAL" ? "Resmi Pengelola" : "Siaran Grup"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/50">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 3: PESAN TERSEMAT (PINNED ARCHIVE) */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "pinned" && (
            <div className="space-y-4">
              {(!data?.pinnedArchive || data.pinnedArchive.length === 0) ? (
                <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-2">
                  <IconPin className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    Belum Ada Pesan Tersemat
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pesan penting yang di-pin oleh pengelola di roomchat akan diarsipkan di sini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.pinnedArchive.map((pinned) => (
                    <div
                      key={pinned.id}
                      className="flex flex-col justify-between p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-[#8FA28A]/60 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8FA28A] text-white">
                              <IconPinFilled className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {pinned.senderName}
                            </span>
                            {pinned.senderUnitNumber && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-muted text-foreground/80 border border-border/60">
                                Kamar {pinned.senderUnitNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {getRelativeTime(pinned.pinnedAt)}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-[#E8EFE6]/40 dark:bg-[#1E291F]/40 p-3.5 rounded-2xl border border-[#8FA28A]/30">
                          {pinned.content}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Disematkan: {formatFullDateTime(pinned.pinnedAt)}
                        </span>
                        <Link
                          href="/housekeeping/community"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8FA28A] hover:underline"
                        >
                          <span>Buka di Obrolan</span>
                          <IconArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 4: PEDOMAN, INFORMASI & STATISTIK KOMUNITAS */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Rules & Guidelines */}
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <IconShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Tata Tertib & Kenyamanan Komunitas Kos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pedoman untuk menciptakan lingkungan kos yang aman, nyaman, dan harmonis.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <IconClock className="h-4 w-4 text-amber-500" />
                      <span>Jam Tenang (Quiet Hours)</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pukul 22.00 - 06.00 WIB. Mohon tidak membuat kegaduhan, memutar audio dengan volume keras, atau aktivitas yang mengganggu penghuni lain.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <IconSparkles className="h-4 w-4 text-emerald-500" />
                      <span>Kebersihan Fasilitas Bersama</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Dapur bersama, tempat jemur, dan lorong wajib dijaga kebersihannya setelah digunakan oleh masing-masing penghuni.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <IconUsers className="h-4 w-4 text-blue-500" />
                      <span>Tamu & Kunjungan</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tamu wajib lapor pengelola atau mematuhi peraturan tamu lawan jenis serta jam batas bertamu maksimal pukul 21.00 WIB.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <IconShieldCheck className="h-4 w-4 text-indigo-500" />
                      <span>Keamanan & Parkir</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pastikan pagar dan pintu gerbang selalu terkunci kembali. Gunakan kunci ganda pada kendaraan yang diparkir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement Analytics Summary */}
              <div className="p-6 rounded-3xl bg-[#F6F4EE]/60 dark:bg-[#151915]/60 border border-border/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-foreground">
                  Ringkasan Aktivitas Komunitas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border/70 text-center space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Total Pesan Obrolan
                    </span>
                    <div className="text-xl font-black text-foreground">
                      {data?.stats?.totalMessages ?? 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/70 text-center space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Peristiwa Penghuni Masuk/Keluar
                    </span>
                    <div className="text-xl font-black text-foreground">
                      {data?.stats?.totalEvents ?? 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/70 text-center space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Pesan Disematkan
                    </span>
                    <div className="text-xl font-black text-[#8FA28A]">
                      {data?.stats?.pinnedCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

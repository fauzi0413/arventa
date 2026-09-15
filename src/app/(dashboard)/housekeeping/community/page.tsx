"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconMessages,
  IconPlus,
  IconRefresh,
  IconSpeakerphone,
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconX,
  IconSparkles,
} from "@tabler/icons-react";
import { useHousekeepingCommunity } from "./hooks/useHousekeepingCommunity";
import { ForumMetricCards } from "./components/ForumMetricCards";
import { ForumFilterBar } from "./components/ForumFilterBar";
import { ForumThreadCard } from "./components/ForumThreadCard";
import { ForumDetailDrawer } from "./components/ForumDetailDrawer";
import { CreateTopicModal } from "./components/CreateTopicModal";
import { ForumThreadItem } from "./types";

export default function HousekeepingCommunityPage() {
  const {
    threads,
    assignedProperties,
    metrics,
    loading,
    refreshing,
    actionLoading,
    error,
    lastSyncedAt,
    filters,
    toast,
    setFilter,
    resetFilters,
    replyToThread,
    createThread,
    deleteThread,
    refresh,
    hideToast,
  } = useHousekeepingCommunity();

  // Modals & Drawer states
  const [selectedThread, setSelectedThread] = useState<ForumThreadItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleOpenDetail = (thread: ForumThreadItem) => {
    setSelectedThread(thread);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedThread(null);
  };

  // Keep selectedThread in sync with threads state updates
  const activeSelectedThread = selectedThread
    ? threads.find((t) => t.id === selectedThread.id) || selectedThread
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Floating Modern Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-card border border-border shadow-xl max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-2 rounded-xl text-white shrink-0 ${
              toast.type === "success"
                ? "bg-emerald-600"
                : toast.type === "error"
                ? "bg-rose-600"
                : "bg-blue-600"
            }`}
          >
            {toast.type === "success" && <IconCheck className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "error" && <IconAlertCircle className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "info" && <IconInfoCircle className="w-5 h-5 stroke-[2.5]" />}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-foreground">
              {toast.type === "success" ? "Berhasil" : toast.type === "error" ? "Gagal" : "Info"}
            </p>
            <p className="text-muted-foreground mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={hideToast}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* PAGE HERO HEADER BANNER */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#242823] via-[#383E36] to-[#1C201C] p-6 sm:p-8 text-white shadow-xl border border-[#383E36]">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-[#8FA28A]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#8FA28A]/20 px-3.5 py-1 text-xs font-bold text-[#8FA28A] border border-[#8FA28A]/30">
              <IconSparkles className="h-3.5 w-3.5" />
              <span>ARV-M5-04 • Ruang Diskusi & Komunitas Penghuni</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <IconMessages className="h-8 w-8 text-[#8FA28A]" />
              Komunitas & Forum Warga
            </h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              Ruang silaturahmi penghuni kos, tanya jawab, pengumuman kegiatan, dan sapa warga baru yang baru check-in secara hangat.
            </p>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/community/announcements"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all shadow-sm"
            >
              <IconSpeakerphone className="h-4 w-4 text-[#8FA28A]" />
              <span>Pengumuman Resmi</span>
            </Link>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white text-xs font-bold transition-all shadow-sm"
            >
              <IconPlus className="h-4 w-4" />
              <span>Mulai Topik Baru</span>
            </button>

            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50"
              title="Refresh data real-time"
            >
              <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* KPI METRIC CARDS */}
      {/* --------------------------------------------------------------------- */}
      <ForumMetricCards metrics={metrics} />

      {/* --------------------------------------------------------------------- */}
      {/* DYNAMIC FILTER & SEARCH BAR */}
      {/* --------------------------------------------------------------------- */}
      <ForumFilterBar
        filters={filters}
        assignedProperties={assignedProperties}
        onFilterChange={setFilter}
        onReset={resetFilters}
      />

      {/* --------------------------------------------------------------------- */}
      {/* THREADS LIST / EMPTY STATE / LOADING */}
      {/* --------------------------------------------------------------------- */}
      {loading ? (
        // Loading shimmer cards
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 animate-pulse min-h-[180px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-muted rounded-md" />
                <div className="h-5 w-24 bg-muted/60 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-muted/80 rounded" />
              <div className="h-12 w-full bg-muted/40 rounded-xl" />
              <div className="h-8 w-28 bg-muted/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-3">
          <IconAlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
            {error}
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            <IconRefresh className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : threads.length === 0 ? (
        // Empty state
        <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto text-muted-foreground">
            <IconMessages className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Belum Ada Topik Diskusi
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Belum ada topik diskusi atau informasi komunitas yang sesuai kriteria filter Anda saat ini.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Reset Filter
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#8FA28A] text-white text-xs font-bold hover:bg-[#8FA28A]/90"
            >
              Mulai Topik Pertama
            </button>
          </div>
        </div>
      ) : (
        // Main thread cards grid
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {threads.map((thread) => (
            <ForumThreadCard
              key={thread.id}
              thread={thread}
              onOpenDetail={handleOpenDetail}
              onDelete={deleteThread}
            />
          ))}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODALS & DRAWERS */}
      {/* --------------------------------------------------------------------- */}
      <ForumDetailDrawer
        thread={activeSelectedThread}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onReply={replyToThread}
        actionLoading={actionLoading}
      />

      <CreateTopicModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        assignedProperties={assignedProperties}
        onCreate={createThread}
        actionLoading={actionLoading}
      />
    </div>
  );
}

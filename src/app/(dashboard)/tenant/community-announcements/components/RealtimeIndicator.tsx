"use client";

import React from "react";
import { IconRefresh, IconBroadcast, IconCheck } from "@tabler/icons-react";

interface RealtimeIndicatorProps {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  onRefresh: () => void;
}

export function RealtimeIndicator({
  isSyncing,
  lastSyncedAt,
  onRefresh,
}: RealtimeIndicatorProps) {
  // Format last sync time (HH:mm:ss)
  const formattedTime = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-800 shadow-xs backdrop-blur-xs transition-all dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
      {/* Live Pulsing Dot */}
      <div className="relative flex h-2 w-2 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 ${
            isSyncing ? "animate-ping" : "animate-pulse"
          }`}
        />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
      </div>

      {/* Label */}
      <span className="font-medium">
        {isSyncing ? "Menyinkronkan feed..." : "Realtime Aktif"}
      </span>

      {/* Timestamp */}
      {formattedTime && !isSyncing && (
        <span className="hidden text-[11px] text-emerald-600/80 sm:inline dark:text-emerald-400/70">
          • {formattedTime}
        </span>
      )}

      {/* Manual Refresh Button */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isSyncing}
        aria-label="Segarkan pengumuman"
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-200/60 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        title="Segarkan data pengumuman"
      >
        <IconRefresh
          className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
}

"use client";

import React from "react";
import { IconRefresh, IconWifi } from "@tabler/icons-react";

interface RealtimeSyncBadgeProps {
  lastSyncedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RealtimeSyncBadge({
  lastSyncedAt,
  isRefreshing,
  onRefresh,
}: RealtimeSyncBadgeProps) {
  const formattedTime = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-xs backdrop-blur-xs">
      {/* Pulsing Live Dot */}
      <div className="relative flex h-2 w-2 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <div className="flex items-center gap-1">
        <IconWifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium text-foreground/90">Auto-Sync</span>
      </div>

      {formattedTime && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span className="hidden sm:inline text-muted-foreground">
            {formattedTime}
          </span>
        </>
      )}

      {/* Manual Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Perbarui data pengumuman"
        className="ml-1 -mr-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 min-h-[32px] min-w-[32px]"
      >
        <IconRefresh
          className={`h-3.5 w-3.5 transition-transform ${
            isRefreshing ? "animate-spin text-primary" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default RealtimeSyncBadge;

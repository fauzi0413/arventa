import React from "react";

export default function TenantAnnouncementLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 md:p-2">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-muted/60" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-muted/40" />
        </div>
        <div className="h-8 w-36 rounded-full bg-muted/50" />
      </div>

      {/* Tabs & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="h-11 w-full sm:w-72 rounded-2xl bg-muted/60" />
        <div className="h-11 w-full sm:w-80 rounded-2xl bg-muted/40" />
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 rounded-lg bg-muted/70" />
                <div className="h-4 w-28 rounded-md bg-muted/50" />
              </div>
              <div className="h-5 w-4/5 rounded-md bg-muted/80" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded-md bg-muted/40" />
                <div className="h-3.5 w-3/4 rounded-md bg-muted/40" />
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
              <div className="h-4 w-32 rounded-md bg-muted/50" />
              <div className="h-4 w-16 rounded-md bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

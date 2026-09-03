import React from "react";

export default function TenantCommunityLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-muted" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-muted/60" />
        </div>
        <div className="h-9 w-32 rounded-full bg-muted/80 self-start sm:self-auto" />
      </div>

      {/* Tabs & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex h-11 w-60 rounded-xl bg-muted/70" />
        <div className="h-11 w-72 rounded-xl bg-muted/70" />
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-5 min-h-[170px]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 rounded-md bg-muted" />
                <div className="h-4 w-28 rounded-md bg-muted/60" />
              </div>
              <div className="h-5 w-3/4 rounded-md bg-muted/90" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-full rounded-md bg-muted/50" />
                <div className="h-3.5 w-4/5 rounded-md bg-muted/50" />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-border/40">
              <div className="h-3.5 w-28 rounded-md bg-muted/50" />
              <div className="h-3.5 w-24 rounded-md bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

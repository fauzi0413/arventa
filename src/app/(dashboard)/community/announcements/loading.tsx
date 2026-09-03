import React from "react";

export default function AnnouncementLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-muted rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-44 bg-muted rounded-xl" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="h-9 flex-1 bg-muted/80 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-muted/60 rounded-lg" />
            <div className="h-8 w-24 bg-muted/60 rounded-lg" />
            <div className="h-8 w-24 bg-muted/60 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <div className="h-7 w-36 bg-muted/60 rounded-lg" />
          <div className="h-7 w-32 bg-muted/60 rounded-lg" />
        </div>
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-11 bg-muted/40 border-b border-border" />
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 gap-4">
              <div className="space-y-2 w-1/3">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted/60 rounded" />
              </div>
              <div className="h-4 w-28 bg-muted/60 rounded" />
              <div className="h-4 w-24 bg-muted/60 rounded" />
              <div className="h-4 w-24 bg-muted/60 rounded" />
              <div className="h-6 w-20 bg-muted rounded-full" />
              <div className="h-8 w-24 bg-muted/60 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="h-4 w-28 bg-muted/60 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-3 w-full bg-muted/50 rounded" />
            <div className="flex justify-between pt-2 border-t border-border">
              <div className="h-4 w-24 bg-muted/60 rounded" />
              <div className="h-4 w-20 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

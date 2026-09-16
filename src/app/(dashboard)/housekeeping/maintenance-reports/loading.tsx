import React from 'react';

export default function MaintenanceReportsLoading() {
  return (
    <div className="space-y-6 bg-card text-card-foreground min-h-[85vh] p-4 sm:p-6 rounded-2xl border border-border">
      {/* Header Skeleton */}
      <div className="space-y-2 animate-pulse">
        <div className="h-7 w-64 bg-muted rounded-lg" />
        <div className="h-4 w-96 bg-muted rounded-lg" />
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted/40 rounded-2xl border border-border animate-pulse p-5 space-y-3">
            <div className="h-4 w-32 bg-muted rounded-md" />
            <div className="h-7 w-24 bg-muted rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-32 bg-muted/40 rounded-2xl border border-border animate-pulse p-4 space-y-3">
        <div className="h-10 w-full bg-muted rounded-xl" />
        <div className="h-8 w-2/3 bg-muted rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="h-96 bg-muted/40 rounded-2xl border border-border animate-pulse p-6 space-y-4">
        <div className="h-6 w-full bg-muted rounded-lg" />
        <div className="h-6 w-full bg-muted rounded-lg" />
        <div className="h-6 w-full bg-muted rounded-lg" />
        <div className="h-6 w-full bg-muted rounded-lg" />
        <div className="h-6 w-full bg-muted rounded-lg" />
      </div>
    </div>
  );
}

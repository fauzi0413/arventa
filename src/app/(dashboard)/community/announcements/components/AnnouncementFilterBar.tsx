"use client";

import React from "react";
import {
  IconSearch,
  IconFilter,
  IconCalendar,
  IconBuilding,
  IconRotateClockwise,
  IconX,
} from "@tabler/icons-react";
import { AnnouncementFilterState, AnnouncementStatus, PropertyOption } from "../types";

interface AnnouncementFilterBarProps {
  filters: AnnouncementFilterState;
  onFilterChange: <K extends keyof AnnouncementFilterState>(
    key: K,
    value: AnnouncementFilterState[K]
  ) => void;
  onReset: () => void;
  properties: PropertyOption[];
  totalCount: number;
  loading?: boolean;
}

const statusOptions: Array<{ value: AnnouncementStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Semua Status" },
  { value: "PUBLISHED", label: "Dipublikasikan" },
  { value: "SCHEDULED", label: "Dijadwalkan" },
  { value: "DRAFT", label: "Draf" },
  { value: "ARCHIVED", label: "Diarsipkan" },
];

export const AnnouncementFilterBar: React.FC<AnnouncementFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  properties,
  totalCount,
  loading = false,
}) => {
  const isFiltered =
    Boolean(filters.search) ||
    filters.status !== "ALL" ||
    filters.propertyId !== "ALL" ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
      {/* Top row: Search input & Status quick pills */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari judul pengumuman..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusOptions.map((opt) => {
            const active = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange("status", opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 select-none ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Property filter, Date Range, Reset Button */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/60 text-xs">
        {/* Property dropdown */}
        <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1.5">
          <IconBuilding className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={filters.propertyId}
            onChange={(e) => onFilterChange("propertyId", e.target.value)}
            className="bg-transparent border-none text-foreground text-xs focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">Semua Properti</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1.5">
          <IconCalendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-[11px]">Dari:</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="bg-transparent border-none text-foreground text-xs focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1.5">
          <IconCalendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-[11px]">Sampai:</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="bg-transparent border-none text-foreground text-xs focus:outline-none"
          />
        </div>

        {/* Reset filter button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 font-medium transition-colors"
          >
            <IconRotateClockwise className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        )}

        {/* Counter count */}
        <div className="ml-auto text-muted-foreground text-xs">
          Menampilkan <span className="font-semibold text-foreground">{totalCount}</span> pengumuman
          {loading && <span className="ml-1 animate-pulse">...</span>}
        </div>
      </div>
    </div>
  );
};

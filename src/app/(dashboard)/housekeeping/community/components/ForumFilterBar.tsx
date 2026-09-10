"use client";

import React from "react";
import {
  IconSearch,
  IconBuilding,
  IconFilter,
  IconX,
  IconAlertTriangle,
  IconMessageCircle,
  IconCircleCheck,
} from "@tabler/icons-react";
import { ForumFilterState, AssignedPropertyOption } from "../types";

interface ForumFilterBarProps {
  filters: ForumFilterState;
  assignedProperties: AssignedPropertyOption[];
  onFilterChange: (key: keyof ForumFilterState, value: string) => void;
  onReset: () => void;
}

export function ForumFilterBar({
  filters,
  assignedProperties,
  onFilterChange,
  onReset,
}: ForumFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.propertyId !== "ALL" ||
    filters.category !== "ALL" ||
    filters.status !== "ALL";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-4 shadow-sm">
      {/* Search Input & Property Dropdown */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Cari topik keluhan, pengirim, atau isi diskusi..."
            className="w-full rounded-xl border border-border/80 bg-background/80 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Property Dropdown Filter */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none">
            <IconBuilding className="h-4 w-4" />
          </div>
          <select
            value={filters.propertyId}
            onChange={(e) => onFilterChange("propertyId", e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background/80 pl-10 pr-8 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40 appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Properti Ditugaskan</option>
            {assignedProperties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 rounded-xl transition-all shrink-0"
          >
            <IconX className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category & Status Quick Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium mr-1 text-[11px] flex items-center gap-1">
            <IconFilter className="h-3 w-3" />
            Kategori:
          </span>
          <button
            onClick={() => onFilterChange("category", "ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.category === "ALL"
                ? "bg-[#8FA28A] text-white shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => onFilterChange("category", "KELUHAN")}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.category === "KELUHAN"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
            }`}
          >
            <IconAlertTriangle className="h-3 w-3" />
            Keluhan Penghuni
          </button>
          <button
            onClick={() => onFilterChange("category", "DISKUSI")}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.category === "DISKUSI"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
            }`}
          >
            <IconMessageCircle className="h-3 w-3" />
            Diskusi Umum
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium mr-1 text-[11px]">
            Status:
          </span>
          <button
            onClick={() => onFilterChange("status", "ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.status === "ALL"
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => onFilterChange("status", "OPEN")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.status === "OPEN"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Menunggu Respon
          </button>
          <button
            onClick={() => onFilterChange("status", "RESOLVED")}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filters.status === "RESOLVED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            <IconCircleCheck className="h-3 w-3" />
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

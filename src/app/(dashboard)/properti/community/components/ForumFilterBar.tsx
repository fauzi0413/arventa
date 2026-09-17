"use client";

import React from "react";
import {
  IconSearch,
  IconBuilding,
  IconFilter,
  IconX,
  IconSparkles,
  IconMessageCircle,
  IconHelpCircle,
  IconCalendarEvent,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { ForumFilterState, AssignedPropertyOption } from "../types";

interface ForumFilterBarProps {
  filters: ForumFilterState;
  assignedProperties: AssignedPropertyOption[];
  onFilterChange: (key: keyof ForumFilterState, value: string) => void;
  onReset: () => void;
}

const CATEGORY_TABS = [
  { value: "ALL", label: "Semua Kategori", icon: null },
  { value: "SAMBUTAN", label: "🎉 Sambutan Baru", icon: IconSparkles, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" },
  { value: "OBROLAN_SANTAI", label: "💬 Obrolan Santai", icon: IconMessageCircle, color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20" },
  { value: "TANYA_JAWAB", label: "❓ Tanya Jawab", icon: IconHelpCircle, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" },
  { value: "INFO_KEGIATAN", label: "📅 Info Kegiatan", icon: IconCalendarEvent, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20" },
  { value: "PENGUMUMAN", label: "📢 Pengumuman", icon: IconSpeakerphone, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" },
];

export function ForumFilterBar({
  filters,
  assignedProperties,
  onFilterChange,
  onReset,
}: ForumFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.propertyId !== "ALL" ||
    filters.category !== "ALL";

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
            placeholder="Cari obrolan, nama penghuni, nomor kamar..."
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
            <option value="ALL">Semua Properti</option>
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
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 rounded-xl transition-all shrink-0 cursor-pointer"
          >
            <IconX className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category Pills (Pure Community Categories) */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
        <span className="text-muted-foreground font-medium text-[11px] flex items-center gap-1 mr-1">
          <IconFilter className="h-3 w-3" />
          Kategori:
        </span>
        {CATEGORY_TABS.map((tab) => {
          const isSelected = filters.category === tab.value;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => onFilterChange("category", tab.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#8FA28A] text-white shadow-xs font-bold"
                  : tab.color || "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {IconComp && <IconComp className="h-3 w-3" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

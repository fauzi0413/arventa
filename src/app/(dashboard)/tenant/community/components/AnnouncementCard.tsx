"use client";

import React from "react";
import {
  IconCrown,
  IconBrush,
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronRight,
  IconBuildingCommunity,
} from "@tabler/icons-react";
import { TenantAnnouncementItem } from "../types";

interface AnnouncementCardProps {
  announcement: TenantAnnouncementItem;
  onClick: (announcement: TenantAnnouncementItem) => void;
}

export function AnnouncementCard({
  announcement,
  onClick,
}: AnnouncementCardProps) {
  const {
    title,
    content,
    senderName,
    senderRole,
    publishDate,
    isImportant,
    targetScopeLabel,
    isRead,
  } = announcement;

  // Format date in Indonesian locale: DD MMMM YYYY, HH:mm
  const formattedDate = (() => {
    try {
      const d = new Date(publishDate);
      if (isNaN(d.getTime())) return publishDate;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return publishDate;
    }
  })();

  // Strip Markdown / HTML tags for clean 2-line preview excerpt
  const cleanExcerpt = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[#*`_~>[\]]/g, "")
    .trim();

  const isOwner = senderRole === "OWNER";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(announcement)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(announcement);
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer min-h-[44px] select-none ${
        !isRead
          ? "border-blue-300/80 bg-blue-50/20 shadow-xs hover:border-blue-400 hover:shadow-md dark:border-blue-900/60 dark:bg-blue-950/20"
          : "border-border bg-card shadow-xs hover:border-muted-foreground/30 hover:shadow-md"
      }`}
    >
      {/* Unread Glowing Blue Dot indicator */}
      {!isRead && (
        <div
          className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center"
          title="Pengumuman Belum Dibaca"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-600 ring-2 ring-background" />
        </div>
      )}

      <div>
        {/* Header Badges & Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Sender Badge: Owner (Blue / Gold accent) or Housekeeping (Emerald accent) */}
            {isOwner ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60">
                <IconCrown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Owner</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60">
                <IconBrush className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Housekeeping</span>
              </span>
            )}

            {/* Important Badge */}
            {isImportant && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 animate-pulse">
                <IconAlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>PENTING</span>
              </span>
            )}

            {/* Unread Text Badge */}
            {!isRead && (
              <span className="inline-flex items-center rounded-md bg-blue-100/80 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                Baru
              </span>
            )}
          </div>

          {/* Date Label: Indonesian format */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconCalendarEvent className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`text-base font-semibold leading-snug line-clamp-1 transition-colors group-hover:text-primary ${
            !isRead ? "text-foreground font-bold" : "text-foreground/90"
          }`}
        >
          {title}
        </h3>

        {/* Preview: 2 lines clamped */}
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {cleanExcerpt}
        </p>
      </div>

      {/* Footer Info: Target Scope and Read Details Button */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <IconBuildingCommunity className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
          <span className="truncate max-w-[200px] font-medium">
            {targetScopeLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 text-primary font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Baca Selengkapnya</span>
          <IconChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

export default AnnouncementCard;

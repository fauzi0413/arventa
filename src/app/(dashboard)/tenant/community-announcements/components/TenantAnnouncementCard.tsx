"use client";

import React from "react";
import {
  IconCrown,
  IconBrush,
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronRight,
  IconBuildingCommunity,
  IconDoor,
} from "@tabler/icons-react";
import { TenantAnnouncement } from "../types";

interface TenantAnnouncementCardProps {
  announcement: TenantAnnouncement;
  onClick: (announcement: TenantAnnouncement) => void;
}

export function TenantAnnouncementCard({
  announcement,
  onClick,
}: TenantAnnouncementCardProps) {
  const {
    title,
    content,
    senderName,
    senderRole,
    publishDate,
    isRead,
    priority,
    propertyInfo,
  } = announcement;

  // Format date: DD MMMM YYYY, HH:mm
  const formattedDate = (() => {
    try {
      const d = new Date(publishDate);
      if (isNaN(d.getTime())) return publishDate;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return publishDate;
    }
  })();

  const isImportant = priority === "IMPORTANT";
  const isOwner = senderRole === "OWNER";

  return (
    <div
      onClick={() => onClick(announcement)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(announcement);
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
        !isRead
          ? "border-blue-300/80 bg-blue-50/15 ring-1 ring-blue-400/20 dark:border-blue-800/60 dark:bg-blue-950/20"
          : "border-border hover:border-gray-300 dark:hover:border-neutral-700"
      }`}
    >
      {/* Visual Unread Accent Indicator */}
      {!isRead && (
        <div className="absolute top-0 left-0 h-full w-1 bg-blue-500" />
      )}

      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Sender Badge */}
            {isOwner ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F7F4ED] px-2.5 py-1 text-xs font-semibold text-[#8C6D2D] border border-[#E9DFCE] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                <IconCrown className="h-3.5 w-3.5" />
                <span>Owner</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50">
                <IconBrush className="h-3.5 w-3.5" />
                <span>Housekeeping</span>
              </span>
            )}

            {/* Important Priority Badge */}
            {isImportant && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60 animate-pulse">
                <IconAlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>PENTING</span>
              </span>
            )}
          </div>

          {/* Unread Status Tag or Date */}
          <div className="flex items-center gap-2">
            {!isRead && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                Baru
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground/70" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
          {content}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
        {/* Scope Label */}
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium truncate">
          {propertyInfo.scopeLabel.includes("Kamar") ? (
            <IconDoor className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <IconBuildingCommunity className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          )}
          <span className="truncate">{propertyInfo.scopeLabel}</span>
        </div>

        {/* Read more link with min touch target 44px */}
        <div className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-primary group-hover:underline">
          <span>Baca</span>
          <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}

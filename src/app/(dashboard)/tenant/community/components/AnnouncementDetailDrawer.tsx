"use client";

import React, { useEffect } from "react";
import {
  IconX,
  IconCrown,
  IconBrush,
  IconAlertTriangle,
  IconCalendarEvent,
  IconBuildingCommunity,
  IconUser,
  IconCheck,
} from "@tabler/icons-react";
import { TenantAnnouncementItem } from "../types";

interface AnnouncementDetailDrawerProps {
  announcement: TenantAnnouncementItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

export function AnnouncementDetailDrawer({
  announcement,
  isOpen,
  onClose,
  onMarkAsRead,
}: AnnouncementDetailDrawerProps) {
  // Automatically mark as read when opened
  useEffect(() => {
    if (isOpen && announcement?.id && onMarkAsRead && !announcement.isRead) {
      onMarkAsRead(announcement.id);
    }
  }, [isOpen, announcement, onMarkAsRead]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !announcement) return null;

  const {
    title,
    content,
    senderName,
    senderRole,
    publishDate,
    isImportant,
    targetScopeLabel,
  } = announcement;

  const isOwner = senderRole === "OWNER";

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

  // Split content into clean paragraphs
  const paragraphs = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 md:p-6">
      {/* Backdrop click area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Container: Bottom Sheet Drawer on Mobile (<768px), Centered Modal on Desktop (>=768px) */}
      <div className="relative z-10 flex flex-col w-full max-h-[88vh] md:max-h-[82vh] md:max-w-2xl bg-card border border-border shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden transition-all duration-300">
        {/* Mobile Drag Handle Indicator */}
        <div className="flex md:hidden justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-6 py-4 bg-muted/30">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Sender Role Badge */}
              {isOwner ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60">
                  <IconCrown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Pengelola Kost (Owner)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60">
                  <IconBrush className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Staf Housekeeping</span>
                </span>
              )}

              {/* Priority Badge */}
              {isImportant && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60">
                  <IconAlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>PENTING</span>
                </span>
              )}

              {/* Read Confirmation Badge */}
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                <IconCheck className="h-3.5 w-3.5" />
                <span>Terbaca</span>
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">
              {title}
            </h2>
          </div>

          {/* Close Button: Touch Target >= 44x44px */}
          <button
            onClick={onClose}
            aria-label="Tutup detail pengumuman"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-muted/20 border-b border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <IconUser className="h-4 w-4 text-muted-foreground/70" />
            <span>Diterbitkan oleh: </span>
            <span className="font-semibold text-foreground">{senderName}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <IconBuildingCommunity className="h-4 w-4 text-muted-foreground/70" />
              <span>{targetScopeLabel}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <IconCalendarEvent className="h-4 w-4 text-muted-foreground/70" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Message Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm md:text-base leading-relaxed text-foreground/90">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border/80 px-6 py-3.5 bg-muted/20">
          <button
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[100px] items-center justify-center rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementDetailDrawer;

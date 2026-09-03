"use client";

import React, { useEffect } from "react";
import {
  IconX,
  IconCrown,
  IconBrush,
  IconAlertTriangle,
  IconCalendarEvent,
  IconBuildingCommunity,
  IconDoor,
  IconUser,
  IconCheck,
} from "@tabler/icons-react";
import { TenantAnnouncement } from "../types";

interface TenantAnnouncementDetailProps {
  announcement: TenantAnnouncement | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

export default function TenantAnnouncementDetail({
  announcement,
  isOpen,
  onClose,
  onMarkAsRead,
}: TenantAnnouncementDetailProps) {
  // Mark as read automatically upon opening
  useEffect(() => {
    if (isOpen && announcement && onMarkAsRead) {
      onMarkAsRead(announcement.id);
    }
  }, [isOpen, announcement, onMarkAsRead]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !announcement) return null;

  const {
    title,
    content,
    senderName,
    senderRole,
    publishDate,
    priority,
    propertyInfo,
  } = announcement;

  const isOwner = senderRole === "OWNER";
  const isImportant = priority === "IMPORTANT";

  // Format publication date in Indonesian locale
  const formattedDate = (() => {
    try {
      const d = new Date(publishDate);
      if (isNaN(d.getTime())) return publishDate;
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
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
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 md:p-6">
      {/* Backdrop click area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Container: Bottom Sheet Drawer on Mobile (<768px), Centered Modal on Desktop (>=768px) */}
      <div className="relative z-10 flex flex-col w-full max-h-[85vh] md:max-h-[80vh] md:max-w-2xl bg-card border border-border shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden transition-all duration-300">
        {/* Mobile Drag Handle Indicator */}
        <div className="flex md:hidden justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-6 py-4 bg-muted/30">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Sender Badge */}
              {isOwner ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7F4ED] px-2.5 py-1 text-xs font-semibold text-[#8C6D2D] border border-[#E9DFCE] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                  <IconCrown className="h-4 w-4" />
                  <span>Pengelola Kost (Owner)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50">
                  <IconBrush className="h-4 w-4" />
                  <span>Staf Housekeeping</span>
                </span>
              )}

              {/* Important Tag */}
              {isImportant && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60">
                  <IconAlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>PENTING</span>
                </span>
              )}

              {/* Read Confirmation Badge */}
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                <IconCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Telah Dibaca</span>
              </span>
            </div>

            {/* Publication Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCalendarEvent className="h-3.5 w-3.5" />
              <span>Diterbitkan: {formattedDate}</span>
            </div>
          </div>

          {/* Close Button with >= 44x44px touch target */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pengumuman"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Main Title */}
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
            {title}
          </h2>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
            <div className="flex items-center gap-1.5">
              <IconUser className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Pengirim:</span>
              <span>{senderName}</span>
            </div>

            <span className="hidden sm:inline text-border">•</span>

            <div className="flex items-center gap-1.5">
              {propertyInfo.scopeLabel.includes("Kamar") ? (
                <IconDoor className="h-4 w-4 text-primary" />
              ) : (
                <IconBuildingCommunity className="h-4 w-4 text-primary" />
              )}
              <span className="font-semibold text-foreground">Sasaran:</span>
              <span>{propertyInfo.scopeLabel}</span>
            </div>
          </div>

          {/* Formatted Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none pt-2 text-foreground/90 leading-relaxed space-y-3">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => (
                <p key={idx} className="whitespace-pre-line text-sm md:text-base">
                  {p}
                </p>
              ))
            ) : (
              <p className="whitespace-pre-line text-sm md:text-base">{content}</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border/80 px-6 py-4 bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">
            Properti: {propertyInfo.propertyName}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[100px] items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

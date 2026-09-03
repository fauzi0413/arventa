"use client";

import React from "react";
import {
  IconX,
  IconArrowLeft,
  IconCalendar,
  IconUser,
  IconDoor,
  IconBuilding,
  IconBuildingCommunity,
  IconLock,
  IconEdit,
  IconArchive,
  IconTrash,
} from "@tabler/icons-react";
import { AnnouncementItem, AppUserRole } from "../types";
import { getStatusBadge } from "./AnnouncementTable";
import { useSafeBack } from "../hooks/useSafeBack";

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementItem | null;
  userRole: AppUserRole;
  onEdit?: (item: AnnouncementItem) => void;
  onArchive?: (item: AnnouncementItem) => void;
  onDelete?: (item: AnnouncementItem) => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  isOpen,
  onClose,
  announcement,
  userRole,
  onEdit,
  onArchive,
  onDelete,
}) => {
  // Safe back navigation hook
  const { safeBack } = useSafeBack({
    fallbackUrl: "/community/announcements",
    onFallback: onClose,
  });

  if (!isOpen || !announcement) return null;

  const isTenant = userRole === "TENANT" || userRole === "USER";
  const isEditable = announcement.status === "DRAFT" || announcement.status === "SCHEDULED";

  const formattedPublishDate = new Date(announcement.publishDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedCreatedDate = new Date(announcement.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={safeBack}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              title="Kembali"
              aria-label="Kembali"
            >
              <IconArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detail Pengumuman
                </span>
                {getStatusBadge(announcement.status)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Title */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug">
              {announcement.title}
            </h2>

            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                <IconUser className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground">{announcement.createdBy.name}</span>
                <span className="text-[10px] font-semibold">({announcement.createdBy.role})</span>
              </div>

              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                <IconCalendar className="w-3.5 h-3.5 text-primary" />
                <span>Rilis: {formattedPublishDate}</span>
              </div>
            </div>
          </div>

          {/* Target Audience Box */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Jangkauan Penerima (Audience Target)
            </span>

            {announcement.targetScope === "ALL_PROPERTIES" && (
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <IconBuildingCommunity className="w-5 h-5 text-primary" />
                <span>Disiarkan ke Seluruh Properti & Semua Kamar</span>
              </div>
            )}

            {announcement.targetScope === "SPECIFIC_PROPERTY" && (
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <IconBuilding className="w-5 h-5 text-primary" />
                <span>
                  Properti: <span className="font-bold">{announcement.targetPropertyName || "Properti"}</span> (Seluruh Kamar)
                </span>
              </div>
            )}

            {announcement.targetScope === "SPECIFIC_UNITS" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <IconBuilding className="w-5 h-5 text-primary" />
                  <span>
                    Properti: <span className="font-bold">{announcement.targetPropertyName || "Properti"}</span>
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <IconDoor className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">Kamar Tertentu: </span>
                    <span className="font-semibold text-foreground">
                      {announcement.targetUnitNumbers && announcement.targetUnitNumbers.length > 0
                        ? announcement.targetUnitNumbers.map((num) => `Kamar ${num}`).join(", ")
                        : `${announcement.targetUnitIds?.length || 0} unit terpilih`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Announcement Message Content */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Isi Pesan Pengumuman
            </span>
            <div className="p-4 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>

          {/* Lock notice for published status */}
          {!isTenant && !isEditable && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <IconLock className="w-4 h-4 shrink-0" />
              <span>
                Pengumuman ini telah dipublikasikan sehingga konten dan target kamar telah dikunci untuk
                menjaga integritas riwayat pesan yang telah diterima penyewa.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <button
            type="button"
            onClick={safeBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          {!isTenant && (
            <div className="flex items-center gap-2">
              {/* Edit button */}
              {isEditable && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(announcement);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 transition-colors"
                >
                  <IconEdit className="w-4 h-4" />
                  Edit Pengumuman
                </button>
              )}

              {/* Archive button */}
              {announcement.status !== "DRAFT" && onArchive && (
                <button
                  type="button"
                  onClick={() => {
                    onArchive(announcement);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs hover:bg-amber-100 transition-colors"
                >
                  <IconArchive className="w-4 h-4" />
                  {announcement.status === "ARCHIVED" ? "Aktifkan" : "Arsipkan"}
                </button>
              )}

              {/* Delete button */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(announcement);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive font-semibold text-xs hover:bg-destructive/20 transition-colors"
                >
                  <IconTrash className="w-4 h-4" />
                  Hapus
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AnnouncementDetailModal;

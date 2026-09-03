"use client";

import React from "react";
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconArchive,
  IconLock,
  IconCalendar,
  IconUser,
  IconFileText,
} from "@tabler/icons-react";
import { AnnouncementItem, AppUserRole } from "../types";
import { getScopeDisplay, getStatusBadge } from "./AnnouncementTable";

interface AnnouncementCardListProps {
  announcements: AnnouncementItem[];
  userRole: AppUserRole;
  onViewDetail: (item: AnnouncementItem) => void;
  onEdit: (item: AnnouncementItem) => void;
  onDelete: (item: AnnouncementItem) => void;
  onArchive: (item: AnnouncementItem) => void;
  loading?: boolean;
}

export const AnnouncementCardList: React.FC<AnnouncementCardListProps> = ({
  announcements,
  userRole,
  onViewDetail,
  onEdit,
  onDelete,
  onArchive,
  loading = false,
}) => {
  const isTenant = userRole === "TENANT" || userRole === "USER";

  if (announcements.length === 0 && !loading) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center py-12 px-4 bg-card border border-border rounded-xl text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
          <IconFileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Tidak Ada Pengumuman</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          {isTenant
            ? "Belum ada pengumuman yang diterbitkan untuk kamar Anda."
            : "Belum ada data pengumuman yang sesuai filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {announcements.map((item) => {
        const isEditable = item.status === "DRAFT" || item.status === "SCHEDULED";
        const formattedDate = new Date(item.publishDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3"
          >
            {/* Top row: Status Badge & Target Scope */}
            <div className="flex items-start justify-between gap-2">
              <div>{getStatusBadge(item.status)}</div>
              <div className="text-right">{getScopeDisplay(item)}</div>
            </div>

            {/* Title & Preview Content */}
            <div
              onClick={() => onViewDetail(item)}
              className="cursor-pointer group"
            >
              <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {item.content}
              </p>
            </div>

            {/* Metadata Footer: Creator & Publish Date */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <IconUser className="w-3 h-3" />
                </div>
                <span className="truncate max-w-[120px]">{item.createdBy.name}</span>
                <span className="text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded">
                  {item.createdBy.role}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <IconCalendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Action Bar with minimum 44x44px touch targets */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/60">
              {/* Detail button */}
              <button
                type="button"
                onClick={() => onViewDetail(item)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted font-medium text-xs transition-colors"
                title="Lihat Detail"
                aria-label="Lihat Detail"
              >
                <IconEye className="w-4 h-4" />
              </button>

              {/* Edit button (Locked for PUBLISHED) */}
              {!isTenant && (
                <>
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-xs transition-colors"
                      title="Edit Pengumuman"
                      aria-label="Edit"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                  ) : (
                    <div
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed text-xs"
                      title="Pengumuman PUBLISHED terkunci"
                    >
                      <IconLock className="w-4 h-4" />
                    </div>
                  )}

                  {/* Archive button */}
                  {item.status !== "DRAFT" ? (
                    <button
                      type="button"
                      onClick={() => onArchive(item)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border font-medium text-xs transition-colors ${
                        item.status === "ARCHIVED"
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                      }`}
                      title={item.status === "ARCHIVED" ? "Aktifkan" : "Arsipkan"}
                      aria-label="Arsipkan"
                    >
                      <IconArchive className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="min-h-[44px] min-w-[44px]" />
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 font-medium text-xs transition-colors"
                    title="Hapus Pengumuman"
                    aria-label="Hapus"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

"use client";

import React from "react";
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconArchive,
  IconLock,
  IconBuildingCommunity,
  IconBuilding,
  IconDoor,
  IconCalendar,
  IconUser,
  IconClock,
  IconFileText,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { AnnouncementItem, AnnouncementStatus, AppUserRole } from "../types";

interface AnnouncementTableProps {
  announcements: AnnouncementItem[];
  userRole: AppUserRole;
  onViewDetail: (item: AnnouncementItem) => void;
  onEdit: (item: AnnouncementItem) => void;
  onDelete: (item: AnnouncementItem) => void;
  onArchive: (item: AnnouncementItem) => void;
  loading?: boolean;
}

// Helper: Status badge renderer
export const getStatusBadge = (status: AnnouncementStatus) => {
  switch (status) {
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <IconFileText className="w-3.5 h-3.5" />
          Draf
        </span>
      );
    case "SCHEDULED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <IconClock className="w-3.5 h-3.5" />
          Dijadwalkan
        </span>
      );
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <IconCheck className="w-3.5 h-3.5" />
          Dipublikasikan
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <IconArchive className="w-3.5 h-3.5" />
          Diarsipkan
        </span>
      );
    default:
      return null;
  }
};

// Helper: Scope badge renderer
export const getScopeDisplay = (item: AnnouncementItem) => {
  if (item.targetScope === "ALL_PROPERTIES") {
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
          <IconBuildingCommunity className="w-3.5 h-3.5 text-primary shrink-0" />
          Semua Properti
        </span>
        <span className="text-[11px] text-muted-foreground">Broadcast Semua Kamar</span>
      </div>
    );
  }

  if (item.targetScope === "SPECIFIC_UNITS") {
    const unitCount = item.targetUnitIds?.length || 0;
    const unitList = item.targetUnitNumbers?.join(", ") || `${unitCount} Kamar`;
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
          <IconDoor className="w-3.5 h-3.5 text-primary shrink-0" />
          {item.targetPropertyName || "Properti"}
        </span>
        <span className="text-[11px] text-primary font-medium truncate max-w-[180px]" title={unitList}>
          Kamar: {unitList}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
        <IconBuilding className="w-3.5 h-3.5 text-primary shrink-0" />
        {item.targetPropertyName || "Properti"}
      </span>
      <span className="text-[11px] text-muted-foreground">Seluruh Unit Properti</span>
    </div>
  );
};

export const AnnouncementTable: React.FC<AnnouncementTableProps> = ({
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
      <div className="hidden md:flex flex-col items-center justify-center py-16 px-4 bg-card border border-border rounded-xl text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
          <IconFileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Tidak Ada Pengumuman</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          {isTenant
            ? "Belum ada pengumuman yang diterbitkan untuk properti atau kamar Anda saat ini."
            : "Belum ada data pengumuman yang sesuai dengan filter yang dipilih."}
        </p>
      </div>
    );
  }

  return (
    <div className="hidden md:block overflow-hidden bg-card border border-border rounded-xl shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3.5 px-4">Judul & Konten</th>
              <th className="py-3.5 px-4">Target Penerima</th>
              <th className="py-3.5 px-4">Dibuat Oleh</th>
              <th className="py-3.5 px-4">Tanggal Terbit</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {announcements.map((item) => {
              // Edit restriction: only DRAFT or SCHEDULED
              const isEditable = item.status === "DRAFT" || item.status === "SCHEDULED";
              const formattedDate = new Date(item.publishDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <tr
                  key={item.id}
                  className="hover:bg-accent/40 transition-colors group"
                >
                  {/* Judul & Konten Snippet */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="font-semibold text-foreground truncate" title={item.title}>
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {item.content}
                    </div>
                  </td>

                  {/* Target Scope */}
                  <td className="py-3.5 px-4">{getScopeDisplay(item)}</td>

                  {/* Dibuat Oleh */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <IconUser className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {item.createdBy.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {item.createdBy.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Tanggal Publish */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <IconCalendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formattedDate}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                  {/* Tombol Aksi */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Tombol Detail */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Lihat Detail Pengumuman"
                        aria-label="Lihat Detail"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>

                      {/* Tombol Edit (Kondisi Edit AC Rule: Hanya DRAFT / SCHEDULED) */}
                      {!isTenant && (
                        <>
                          {isEditable ? (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              title="Edit Pengumuman"
                              aria-label="Edit"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                          ) : (
                            <div
                              className="p-1.5 rounded-lg text-muted-foreground/40 cursor-not-allowed"
                              title="Pengumuman berstatus PUBLISHED dikunci dari pengeditan demi integritas riwayat pesan penyewa."
                            >
                              <IconLock className="w-4 h-4" />
                            </div>
                          )}

                          {/* Tombol Arsip (Untuk PUBLISHED / ARCHIVED) */}
                          {item.status !== "DRAFT" && (
                            <button
                              type="button"
                              onClick={() => onArchive(item)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.status === "ARCHIVED"
                                  ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                  : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                              }`}
                              title={item.status === "ARCHIVED" ? "Aktifkan Kembali" : "Arsipkan Pengumuman"}
                              aria-label="Arsipkan"
                            >
                              <IconArchive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="p-1.5 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Hapus Pengumuman"
                            aria-label="Hapus"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

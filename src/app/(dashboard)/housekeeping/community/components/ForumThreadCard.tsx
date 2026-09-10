"use client";

import React from "react";
import {
  IconMessageCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconBuilding,
  IconDoor,
  IconTrash,
  IconArrowBackUp,
  IconCheck,
} from "@tabler/icons-react";
import { ForumThreadItem } from "../types";

interface ForumThreadCardProps {
  thread: ForumThreadItem;
  onOpenDetail: (thread: ForumThreadItem) => void;
  onOpenResolve: (thread: ForumThreadItem) => void;
  onReopen: (threadId: string) => void;
  onDelete: (threadId: string) => void;
}

export function ForumThreadCard({
  thread,
  onOpenDetail,
  onOpenResolve,
  onReopen,
  onDelete,
}: ForumThreadCardProps) {
  const isComplaint = thread.category === "KELUHAN";
  const isResolved = thread.status === "RESOLVED";

  // Format relative/readable date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-200 hover:shadow-md ${
        isComplaint && !isResolved
          ? "border-amber-500/40 dark:border-amber-500/30"
          : isResolved
          ? "border-emerald-500/30 dark:border-emerald-500/20 bg-card/90"
          : "border-border/80"
      }`}
    >
      {/* Top Meta Bar: Property, Unit, Category & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Property Context */}
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80 bg-muted/60 px-2.5 py-1 rounded-lg">
            <IconBuilding className="h-3.5 w-3.5 text-[#8FA28A]" />
            {thread.propertyName}
          </span>

          {/* Unit Number (if resident) */}
          {thread.authorUnitNumber && (
            <span className="inline-flex items-center gap-1 font-semibold text-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-md text-[11px]">
              <IconDoor className="h-3 w-3" />
              {thread.authorUnitNumber}
            </span>
          )}

          {/* Category Badge */}
          {isComplaint ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <IconAlertTriangle className="h-3 w-3" />
              Keluhan Fasilitas
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <IconMessageCircle className="h-3 w-3" />
              Diskusi Umum
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {isResolved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <IconCircleCheck className="h-3.5 w-3.5" />
              Selesai Ditangani
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Menunggu Respon
            </span>
          )}
        </div>
      </div>

      {/* Author Details & Date */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8FA28A]/20 text-[#8FA28A] font-bold text-xs">
            {thread.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">
                {thread.authorName}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.2 rounded bg-muted">
                {thread.authorRole === "HOUSEKEEPING"
                  ? "Housekeeping"
                  : thread.authorRole === "OWNER"
                  ? "Pengelola"
                  : "Penghuni"}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground/80">
              {formatDate(thread.createdAt)}
            </span>
          </div>
        </div>

        {/* Comments Count Badge */}
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
          <IconMessageCircle className="h-3.5 w-3.5" />
          <strong className="text-foreground">{thread.commentsCount}</strong>{" "}
          Balasan
        </span>
      </div>

      {/* Main Content Area */}
      <div
        onClick={() => onOpenDetail(thread)}
        className="mt-3 cursor-pointer group-hover:text-primary transition-colors"
      >
        <h3 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">
          {thread.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
          {thread.content}
        </p>
      </div>

      {/* Resolution Notes Box (if resolved) */}
      {isResolved && (
        <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs space-y-1">
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
            <IconCircleCheck className="h-3.5 w-3.5" />
            <span>
              Diselesaikan oleh {thread.resolvedByName || "Staf Operasional"}
              {thread.resolvedAt ? ` • ${formatDate(thread.resolvedAt)}` : ""}
            </span>
          </div>
          {thread.resolutionNotes && (
            <p className="text-[11px] text-muted-foreground italic">
              &quot;{thread.resolutionNotes}&quot;
            </p>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetail(thread)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8FA28A]/15 hover:bg-[#8FA28A]/25 text-[#8FA28A] dark:text-[#C7D3C0] text-xs font-bold transition-all"
        >
          <IconMessageCircle className="h-3.5 w-3.5" />
          <span>Balas Diskusi</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Acceptance Criterion #2: Mark as Resolved */}
          {!isResolved ? (
            <button
              onClick={() => onOpenResolve(thread)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <IconCheck className="h-3.5 w-3.5" />
              <span>Tandai Selesai</span>
            </button>
          ) : (
            <button
              onClick={() => onReopen(thread.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
              title="Buka kembali diskusi"
            >
              <IconArrowBackUp className="h-3.5 w-3.5" />
              <span>Buka Kembali</span>
            </button>
          )}

          {/* Delete / Moderation */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Apakah Anda yakin ingin menghapus thread diskusi ini sebagai bagian dari moderasi?"
                )
              ) {
                onDelete(thread.id);
              }
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-all"
            title="Moderasi: Hapus thread"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

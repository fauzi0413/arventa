"use client";

import React, { useState } from "react";
import {
  IconMessageCircle,
  IconSparkles,
  IconBuilding,
  IconTrash,
  IconHeart,
  IconShare2,
} from "@tabler/icons-react";
import { ForumThreadItem } from "../types";

interface ForumThreadCardProps {
  thread: ForumThreadItem;
  onOpenDetail: (thread: ForumThreadItem) => void;
  onDelete: (threadId: string) => void;
}

export function ForumThreadCard({
  thread,
  onOpenDetail,
  onDelete,
}: ForumThreadCardProps) {
  const isWelcome = thread.category === "SAMBUTAN";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(isWelcome ? 3 : 1);

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

  const getCategoryBadge = () => {
    switch (thread.category) {
      case "SAMBUTAN":
        return {
          label: "🎉 Sambutan Warga Baru",
          className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        };
      case "OBROLAN_SANTAI":
        return {
          label: "💬 Obrolan Santai",
          className: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
        };
      case "TANYA_JAWAB":
        return {
          label: "❓ Tanya Jawab",
          className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        };
      case "INFO_KEGIATAN":
        return {
          label: "📅 Info Kegiatan",
          className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        };
      case "PENGUMUMAN":
        return {
          label: "📢 Pengumuman Warga",
          className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        };
      default:
        return {
          label: "💬 Diskusi Warga",
          className: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
        };
    }
  };

  const categoryBadge = getCategoryBadge();

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-200 hover:shadow-md ${
        isWelcome
          ? "border-emerald-500/40 dark:border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] to-card"
          : "border-border/80"
      }`}
    >
      {/* Top Meta Bar: Property Context & Category Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Property Context */}
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80 bg-muted/60 px-2.5 py-1 rounded-lg">
            <IconBuilding className="h-3.5 w-3.5 text-[#8FA28A]" />
            {thread.propertyName}
          </span>

          {/* Category Badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${categoryBadge.className}`}
          >
            {categoryBadge.label}
          </span>
        </div>

        <span className="text-[11px] text-muted-foreground/80">
          {formatDate(thread.createdAt)}
        </span>
      </div>

      {/* Author Details with ARVENTA Identity Formatting: [Nama] - Kamar [Unit] or [Nama] - Pengelola */}
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs shadow-xs ${
              isWelcome
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40"
                : "bg-[#8FA28A]/20 text-[#8FA28A]"
            }`}
          >
            {thread.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Mandatory Format: [Nama Penghuni] - Kamar [Nomor Unit] or [Nama] - Pengelola */}
              <span className="text-xs font-black text-foreground">
                {thread.authorDisplayName || thread.authorName}
              </span>

              {/* ✨ Anak Baru Badge (Check-in <= 7 days) */}
              {(thread.isNewResident || isWelcome) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 shadow-xs animate-in fade-in duration-300">
                  <IconSparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                  <span>Anak Baru</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {thread.authorDisplayRole || "Penghuni"}
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
        className="mt-3.5 cursor-pointer group-hover:text-primary transition-colors"
      >
        <h3 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">
          {thread.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
          {thread.content}
        </p>
      </div>

      {/* Actions Bar: Sapa / Like, Comment, Moderation */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Sapa / Like Button */}
          <button
            onClick={handleToggleLike}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              liked
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black shadow-xs"
                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconHeart
              className={`h-3.5 w-3.5 transition-transform ${
                liked ? "fill-rose-500 text-rose-500 scale-110" : ""
              }`}
            />
            <span>{isWelcome ? "Sapa 👋" : "Suka"}</span>
            {likeCount > 0 && <span className="text-[10px]">({likeCount})</span>}
          </button>

          {/* Reply / Comment CTA */}
          <button
            onClick={() => onOpenDetail(thread)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8FA28A]/15 hover:bg-[#8FA28A]/25 text-[#8FA28A] dark:text-[#C7D3C0] text-xs font-bold transition-all cursor-pointer"
          >
            <IconMessageCircle className="h-3.5 w-3.5" />
            <span>Balas & Sapa Warga</span>
          </button>
        </div>

        {/* Delete / Moderation */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (
              window.confirm(
                "Apakah Anda yakin ingin menghapus topik diskusi ini sebagai bagian dari moderasi?"
              )
            ) {
              onDelete(thread.id);
            }
          }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="Moderasi: Hapus thread"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

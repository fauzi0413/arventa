"use client";

import React, { useState } from "react";
import {
  IconX,
  IconBuilding,
  IconDoor,
  IconAlertTriangle,
  IconMessageCircle,
  IconCircleCheck,
  IconSend,
  IconCheck,
  IconSparkles,
  IconLoader2,
} from "@tabler/icons-react";
import { ForumThreadItem } from "../types";

interface ForumDetailDrawerProps {
  thread: ForumThreadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReply: (threadId: string, content: string) => Promise<boolean>;
  onOpenResolve: (thread: ForumThreadItem) => void;
  actionLoading: boolean;
}

export function ForumDetailDrawer({
  thread,
  isOpen,
  onClose,
  onReply,
  onOpenResolve,
  actionLoading,
}: ForumDetailDrawerProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !thread) return null;

  const isComplaint = thread.category === "KELUHAN";
  const isResolved = thread.status === "RESOLVED";

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const ok = await onReply(thread.id, replyContent);
    setIsSubmitting(false);
    if (ok) {
      setReplyContent("");
    }
  };

  const quickTemplates = [
    "Terima kasih atas laporannya. Tim housekeeping sedang memeriksa ke lokasi.",
    "Keluhan telah kami catat dan perbaikan sedang dalam proses penanganan.",
    "Perbaikan telah selesai dilakukan. Silakan periksa kembali fasilitas kamar.",
    "Mohon menjaga ketertiban bersama demi kenyamanan seluruh penghuni kos.",
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="relative flex h-full w-full max-w-xl flex-col bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-card/60">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8FA28A]/20 text-[#8FA28A]">
              {isComplaint ? (
                <IconAlertTriangle className="h-5 w-5 text-rose-500" />
              ) : (
                <IconMessageCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground line-clamp-1">
                {thread.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <IconBuilding className="h-3 w-3" />
                <span>{thread.propertyName}</span>
                {thread.authorUnitNumber && (
                  <>
                    <span>•</span>
                    <IconDoor className="h-3 w-3" />
                    <span className="font-semibold text-[#8FA28A]">
                      {thread.authorUnitNumber}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isResolved && isComplaint && (
              <button
                onClick={() => onOpenResolve(thread)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <IconCheck className="h-3.5 w-3.5" />
                <span>Tandai Selesai</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Original Post */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
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
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(thread.createdAt)}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isResolved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <IconCircleCheck className="h-3 w-3" />
                    Selesai
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Menunggu Respon
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
              {thread.content}
            </p>

            {/* Resolution Audit Card */}
            {isResolved && (
              <div className="mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <IconCircleCheck className="h-4 w-4" />
                  <span>
                    Diselesaikan oleh: {thread.resolvedByName || "Staf Housekeeping"}
                  </span>
                </div>
                {thread.resolutionNotes && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Catatan: &quot;{thread.resolutionNotes}&quot;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Comments / Replies Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IconMessageCircle className="h-3.5 w-3.5" />
              <span>Balasan & Diskusi ({thread.comments.length})</span>
            </h4>

            {thread.comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
                Belum ada balasan pada utas ini. Ketik balasan pertama di bawah.
              </div>
            ) : (
              thread.comments.map((comment) => {
                const isStaff =
                  comment.authorRole === "HOUSEKEEPING" ||
                  comment.authorRole === "OWNER";
                return (
                  <div
                    key={comment.id}
                    className={`flex flex-col gap-1.5 p-4 rounded-2xl text-xs transition-all ${
                      isStaff
                        ? "bg-[#8FA28A]/10 border border-[#8FA28A]/25 ml-4"
                        : "bg-card border border-border/80 mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {comment.authorName}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            isStaff
                              ? "bg-[#8FA28A] text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {comment.authorRole === "HOUSEKEEPING"
                            ? "Housekeeping"
                            : comment.authorRole === "OWNER"
                            ? "Pengelola"
                            : "Penghuni"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reply Input Box & Quick Templates */}
        <div className="border-t border-border/80 bg-card/80 p-4 space-y-3">
          {/* Quick Reply Templates */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <IconSparkles className="h-3 w-3 text-[#8FA28A]" />
              Template Tanggapan Cepat:
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickTemplates.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReplyContent(tmpl)}
                  className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-[#8FA28A] hover:text-foreground transition-all truncate max-w-[260px]"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="space-y-2">
            <div className="relative">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Ketik balasan resmi housekeeping / pengelola..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40 resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">
                Shift + Enter untuk baris baru
              </span>

              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmitting || actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <IconSend className="h-3.5 w-3.5" />
                    <span>Kirim Balasan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

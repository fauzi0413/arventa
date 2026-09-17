"use client";

import React, { useState } from "react";
import {
  IconCheck,
  IconX,
  IconCircleCheck,
  IconDoor,
  IconBuilding,
  IconLoader2,
  IconFileText,
} from "@tabler/icons-react";
import { ForumThreadItem } from "../types";

interface ResolveComplaintModalProps {
  thread: ForumThreadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (threadId: string, notes: string) => Promise<boolean>;
  actionLoading: boolean;
}

export function ResolveComplaintModal({
  thread,
  isOpen,
  onClose,
  onConfirm,
  actionLoading,
}: ResolveComplaintModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !thread) return null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const ok = await onConfirm(thread.id, resolutionNotes);
    setIsSubmitting(false);
    if (ok) {
      setResolutionNotes("");
      onClose();
    }
  };

  const sampleNotes = [
    "Perbaikan fasilitas telah selesai dikerjakan dan diuji coba.",
    "Komponen rusak telah diganti dengan yang baru oleh teknisi.",
    "Area telah dibersihkan dan keluhan telah ditangani.",
    "Telah dikoordinasikan dan diselesaikan langsung bersama penghuni.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border text-foreground shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <IconCircleCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Tandai Keluhan Selesai
              </h3>
              <p className="text-xs text-muted-foreground">
                Selesaikan keluhan penghuni dan catat bukti penanganan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Complaint Summary Box */}
        <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <IconBuilding className="h-3.5 w-3.5 text-[#8FA28A]" />
              {thread.propertyName}
            </span>
            {thread.authorUnitNumber && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-[#8FA28A]">
                  <IconDoor className="h-3 w-3" />
                  {thread.authorUnitNumber}
                </span>
              </>
            )}
            <span>• Oleh {thread.authorName}</span>
          </div>

          <p className="font-bold text-foreground line-clamp-1">{thread.title}</p>
          <p className="text-muted-foreground line-clamp-2 leading-relaxed">
            {thread.content}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResolve} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <IconFileText className="h-3.5 w-3.5 text-[#8FA28A]" />
              <span>Catatan Solusi / Tindakan Perbaikan (Opsional)</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Contoh: Lampu lorong lantai 2 telah diganti dengan bohlam LED baru dan berfungsi normal."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40 resize-none"
            />
          </div>

          {/* Quick Note Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Pilih Catatan Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleNotes.map((note, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setResolutionNotes(note)}
                  className="rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-[#8FA28A] hover:text-foreground transition-all text-left"
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <IconCheck className="h-3.5 w-3.5" />
                  <span>Konfirmasi Selesai</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

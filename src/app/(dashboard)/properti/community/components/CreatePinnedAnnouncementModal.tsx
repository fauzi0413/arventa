"use client";

import React, { useState } from "react";
import {
  IconSpeakerphone,
  IconPin,
  IconX,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";

interface CreatePinnedAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName?: string;
  onSuccess: () => void;
}

export function CreatePinnedAnnouncementModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  onSuccess,
}: CreatePinnedAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Isi pengumuman wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/community/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          action: "create_pinned_announcement",
          title: title.trim() || "Pengumuman Pengelola",
          content: content.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal menyiarkan pengumuman.");
        return;
      }

      setTitle("");
      setContent("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <IconSpeakerphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                Buat Pengumuman Tersemat
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                {propertyName || "Kost"} • Otomatis di-PIN di atas chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Judul Pengumuman (Opsional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembersihan Tandon Air / Pembayaran Listrik"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-[#8FA28A]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Isi Pengumuman Warga <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ketik isi pengumuman untuk seluruh warga kost di sini..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-[#8FA28A] resize-none"
            />
          </div>

          {/* Pin Notice Badge */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#8FA28A]/15 border border-[#8FA28A]/30 text-foreground text-xs">
            <IconPin className="h-4 w-4 text-[#8FA28A] shrink-0" />
            <span className="leading-snug">
              Pesan ini akan disematkan di banner atas obrolan warga kost agar tidak terlewat.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconSpeakerphone className="h-4 w-4" />
              )}
              <span>Siarkan & Sematkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

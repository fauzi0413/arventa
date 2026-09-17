"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconX,
  IconBuilding,
  IconLoader2,
} from "@tabler/icons-react";
import {
  AssignedPropertyOption,
  CreateTopicInput,
  ForumCategory,
} from "../types";

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedProperties: AssignedPropertyOption[];
  onCreate: (input: CreateTopicInput) => Promise<boolean>;
  actionLoading: boolean;
}

export function CreateTopicModal({
  isOpen,
  onClose,
  assignedProperties,
  onCreate,
  actionLoading,
}: CreateTopicModalProps) {
  const [propertyId, setPropertyId] = useState("");
  const [category, setCategory] = useState<ForumCategory>("OBROLAN_SANTAI");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive effective property ID (auto fallback to first available property if not set)
  const effectivePropertyId =
    (propertyId && assignedProperties.some((p) => p.id === propertyId)
      ? propertyId
      : assignedProperties[0]?.id) || "";

  // Auto-sync propertyId when assignedProperties load or change
  useEffect(() => {
    if (assignedProperties.length > 0) {
      if (!propertyId || !assignedProperties.some((p) => p.id === propertyId)) {
        setPropertyId(assignedProperties[0].id);
      }
    }
  }, [assignedProperties, propertyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPropId = effectivePropertyId;
    if (!title.trim() || !content.trim() || !targetPropId || isSubmitting) return;

    setIsSubmitting(true);
    const ok = await onCreate({
      title: title.trim(),
      content: content.trim(),
      propertyId: targetPropId,
      category,
    });
    setIsSubmitting(false);
    if (ok) {
      setTitle("");
      setContent("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border text-foreground shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8FA28A]/20 text-[#8FA28A]">
              <IconPlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Mulai Topik Diskusi Baru
              </h3>
              <p className="text-xs text-muted-foreground">
                Buat utas diskusi atau informasi komunitas untuk sesama penghuni
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

        {/* Maintenance Guidance Notice */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <span className="text-base leading-none">💡</span>
          <p className="leading-relaxed">
            <span className="font-bold">Punya keluhan kerusakan fasilitas atau kamar?</span>{" "}
            Harap laporkan melalui menu <span className="font-bold underline">Laporan Pemeliharaan</span> agar langsung ditangani oleh teknisi properti.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Property Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground flex items-center gap-1">
              <IconBuilding className="h-3.5 w-3.5 text-[#8FA28A]" />
              <span>Pilih Properti Kos:</span>
            </label>
            <select
              value={effectivePropertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40"
              required
            >
              {assignedProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Kategori Komunitas:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("OBROLAN_SANTAI")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  category === "OBROLAN_SANTAI"
                    ? "bg-[#8FA28A]/20 border-[#8FA28A] text-[#8FA28A]"
                    : "border-border bg-background text-muted-foreground hover:border-[#8FA28A]/40"
                }`}
              >
                <span>☕ Obrolan Santai</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("TANYA_JAWAB")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  category === "TANYA_JAWAB"
                    ? "bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-border bg-background text-muted-foreground hover:border-blue-500/40"
                }`}
              >
                <span>❓ Tanya Jawab</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("INFO_KEGIATAN")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  category === "INFO_KEGIATAN"
                    ? "bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-border bg-background text-muted-foreground hover:border-purple-500/40"
                }`}
              >
                <span>📅 Info Kegiatan</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("PENGUMUMAN")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  category === "PENGUMUMAN"
                    ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-border bg-background text-muted-foreground hover:border-amber-500/40"
                }`}
              >
                <span>📢 Pengumuman</span>
              </button>
            </div>
          </div>

          {/* Topic Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Judul Topik:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Jadwal Penyemprotan Disinfektan Kamar Mandi Umum"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40"
              required
            />
          </div>

          {/* Topic Content */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Isi Pesan / Deskripsi:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan detail topik diskusi atau pengumuman komunitas..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#8FA28A]/40 resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                !title.trim() ||
                !content.trim() ||
                !effectivePropertyId ||
                isSubmitting ||
                actionLoading
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 disabled:opacity-50 text-white font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <>
                  <IconPlus className="h-3.5 w-3.5" />
                  <span>Terbitkan Topik</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

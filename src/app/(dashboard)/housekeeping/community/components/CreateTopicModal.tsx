"use client";

import React, { useState } from "react";
import {
  IconPlus,
  IconX,
  IconBuilding,
  IconMessageCircle,
  IconLoader2,
} from "@tabler/icons-react";
import {
  AssignedPropertyOption,
  CreateThreadInput,
  ForumCategory,
} from "../types";

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedProperties: AssignedPropertyOption[];
  onCreate: (input: CreateThreadInput) => Promise<boolean>;
  actionLoading: boolean;
}

export function CreateTopicModal({
  isOpen,
  onClose,
  assignedProperties,
  onCreate,
  actionLoading,
}: CreateTopicModalProps) {
  const [propertyId, setPropertyId] = useState(
    assignedProperties[0]?.id || ""
  );
  const [category, setCategory] = useState<ForumCategory>("DISKUSI");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !propertyId || isSubmitting) return;

    setIsSubmitting(true);
    const ok = await onCreate({
      title: title.trim(),
      content: content.trim(),
      propertyId,
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
                Buat utas diskusi atau informasi komunitas untuk penghuni
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Property Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground flex items-center gap-1">
              <IconBuilding className="h-3.5 w-3.5 text-[#8FA28A]" />
              <span>Pilih Properti Kos:</span>
            </label>
            <select
              value={propertyId}
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
            <label className="font-bold text-foreground">Kategori Topik:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("DISKUSI")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  category === "DISKUSI"
                    ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <IconMessageCircle className="h-4 w-4" />
                <span>Diskusi Umum</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("KELUHAN")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  category === "KELUHAN"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <span>Keluhan / Masalah</span>
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
                !propertyId ||
                isSubmitting ||
                actionLoading
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#8FA28A]/90 disabled:opacity-50 text-white font-bold transition-all shadow-xs"
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

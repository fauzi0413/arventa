"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconX,
  IconFileText,
  IconSend,
  IconCalendar,
  IconBold,
  IconItalic,
  IconList,
  IconQuote,
  IconEye,
  IconEdit,
  IconAlertCircle,
  IconLoader2,
} from "@tabler/icons-react";
import {
  AnnouncementFormData,
  AnnouncementItem,
  PropertyOption,
  TargetScope,
  AppUserRole,
} from "../types";
import { TargetAudienceSelector } from "./TargetAudienceSelector";

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData) => Promise<boolean>;
  initialData?: AnnouncementItem | null;
  properties: PropertyOption[];
  userRole: AppUserRole;
  loading?: boolean;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  properties,
  userRole,
  loading = false,
}) => {
  const isEdit = Boolean(initialData);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetScope, setTargetScope] = useState<TargetScope>("SPECIFIC_PROPERTY");
  const [targetPropertyId, setTargetPropertyId] = useState<string>("");
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>([]);
  const [publishDate, setPublishDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset or initialize form data
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setTargetScope(initialData.targetScope);
      setTargetPropertyId(initialData.targetPropertyId || (properties[0]?.id ?? ""));
      setTargetUnitIds(initialData.targetUnitIds || []);

      // Format ISO string to datetime-local (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(initialData.publishDate);
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setPublishDate(formatted);
      } catch {
        setPublishDate(new Date().toISOString().slice(0, 16));
      }
    } else {
      setTitle("");
      setContent("");
      setTargetScope(userRole === "HOUSEKEEPING" ? "SPECIFIC_PROPERTY" : "ALL_PROPERTIES");
      setTargetPropertyId(properties[0]?.id || "");
      setTargetUnitIds([]);

      // Default publish date to current local time
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setPublishDate(localNow);
    }
    setErrors({});
    setActiveTab("write");
  }, [initialData, isOpen, properties, userRole]);

  if (!isOpen) return null;

  // Rich-Text Toolbar helper
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || "teks"}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 0);
  };

  // Form Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Judul pengumuman wajib diisi.";
    } else if (title.length > 120) {
      newErrors.title = "Judul tidak boleh melebihi 120 karakter.";
    }

    if (!content.trim()) {
      newErrors.content = "Isi pengumuman wajib diisi.";
    }

    if (targetScope !== "ALL_PROPERTIES" && !targetPropertyId) {
      newErrors.property = "Properti tujuan wajib dipilih.";
    }

    if (targetScope === "SPECIFIC_UNITS" && targetUnitIds.length === 0) {
      newErrors.units = "Pilih setidaknya satu kamar tujuan.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!validateForm()) return;

    const formattedPublishDate = publishDate
      ? new Date(publishDate).toISOString()
      : new Date().toISOString();

    const formData: AnnouncementFormData = {
      title: title.trim(),
      content: content.trim(),
      targetScope,
      targetPropertyId: targetScope === "ALL_PROPERTIES" ? undefined : targetPropertyId,
      targetUnitIds: targetScope === "SPECIFIC_UNITS" ? targetUnitIds : undefined,
      publishDate: formattedPublishDate,
      isDraft,
    };

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <IconFileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isEdit ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEdit
                  ? "Perbarui draf atau jadwal pengumuman"
                  : "Sebarkan informasi penting ke seluruh penghuni atau kamar terpilih"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Judul Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-foreground">
                Judul Pengumuman <span className="text-destructive">*</span>
              </label>
              <span
                className={`text-xs ${
                  title.length > 120 ? "text-destructive font-bold" : "text-muted-foreground"
                }`}
              >
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Jadwal Pemeliharaan Listrik & Air Mingguan"
              maxLength={130}
              className={`w-full px-3.5 py-2.5 text-sm bg-background border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.title ? "border-destructive ring-1 ring-destructive" : "border-input"
              }`}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <IconAlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Isi Pengumuman Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-foreground">
                Isi Pengumuman <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeTab === "write"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <IconEdit className="w-3.5 h-3.5" />
                    Tulis
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <IconEye className="w-3.5 h-3.5" />
                    Pratinjau
                  </span>
                </button>
              </div>
            </div>

            {activeTab === "write" ? (
              <div className="border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 border-b border-border text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    className="p-1 rounded hover:bg-card hover:text-foreground transition-colors"
                    title="Bold (**teks**)"
                  >
                    <IconBold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*")}
                    className="p-1 rounded hover:bg-card hover:text-foreground transition-colors"
                    title="Italic (*teks*)"
                  >
                    <IconItalic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("\n- ")}
                    className="p-1 rounded hover:bg-card hover:text-foreground transition-colors"
                    title="Daftar Bullet (- teks)"
                  >
                    <IconList className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("\n> ")}
                    className="p-1 rounded hover:bg-card hover:text-foreground transition-colors"
                    title="Kutipan (> teks)"
                  >
                    <IconQuote className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis pesan pengumuman lengkap di sini. Anda dapat menggunakan format teks seperti tebal, miring, atau daftar poin..."
                  rows={5}
                  className="w-full p-3.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none resize-y"
                />
              </div>
            ) : (
              <div className="border border-border rounded-xl p-4 bg-muted/20 min-h-[140px] text-sm text-foreground whitespace-pre-wrap">
                {content.trim() ? (
                  content
                ) : (
                  <span className="text-muted-foreground italic text-xs">
                    Belum ada teks pengumuman untuk dipratinjau.
                  </span>
                )}
              </div>
            )}

            {errors.content && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <IconAlertCircle className="w-3.5 h-3.5" />
                {errors.content}
              </p>
            )}
          </div>

          {/* Target Audience Selector */}
          <TargetAudienceSelector
            targetScope={targetScope}
            onChangeScope={setTargetScope}
            targetPropertyId={targetPropertyId}
            onChangePropertyId={setTargetPropertyId}
            targetUnitIds={targetUnitIds}
            onChangeUnitIds={setTargetUnitIds}
            properties={properties}
            userRole={userRole}
            disabled={loading}
          />
          {errors.property && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <IconAlertCircle className="w-3.5 h-3.5" />
              {errors.property}
            </p>
          )}
          {errors.units && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <IconAlertCircle className="w-3.5 h-3.5" />
              {errors.units}
            </p>
          )}

          {/* Tanggal & Waktu Publish */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Tanggal & Waktu Publikasi
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Tentukan kapan pengumuman ini akan dirilis kepada penyewa. Jika memilih waktu sekarang
              atau lampau, pengumuman akan langsung tayang.
            </p>
            <div className="relative max-w-xs">
              <input
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Save as Draft */}
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IconFileText className="w-4 h-4 text-muted-foreground" />
              )}
              Simpan sebagai Draf
            </button>

            {/* Publish Now / Schedule */}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IconSend className="w-4 h-4" />
              )}
              {new Date(publishDate) > new Date() ? "Jadwalkan Rilis" : "Publikasikan Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnnouncementFormModal;

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconSparkles,
  IconPlus,
  IconRefresh,
  IconPencil,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconArrowUp,
  IconArrowDown,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTag,
  IconLink,
  IconLayoutGrid,
  IconHash,
  IconUpload,
  IconPhoto,
  IconSearch,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCKUP_TYPE_LABELS } from "@/lib/feature-showcase";

interface SlideRecord {
  id: string;
  badge: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  ctaText: string;
  ctaHref: string;
  mockupType: string;
  headerTitle?: string | null;
  subBadge?: string | null;
  imageUrl?: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export function FeatureShowcaseManager() {
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<SlideRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden">("all");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Form state
  const [formBadge, setFormBadge] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formCtaText, setFormCtaText] = useState("");
  const [formCtaHref, setFormCtaHref] = useState("");
  const [formMockupType, setFormMockupType] = useState("property");
  const [formHeaderTitle, setFormHeaderTitle] = useState("");
  const [formSubBadge, setFormSubBadge] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadMsg, setImageUploadMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-showcase", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setSlides(json.data.slides);
        setStats(json.data.stats);
      } else {
        setErrorMsg(json.message || "Gagal memuat data.");
      }
    } catch (err) {
      console.error("Failed to load feature showcase:", err);
      setErrorMsg("Terjadi kesalahan sistem saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const autoClear = () => {
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 3500);
  };

  const openCreateModal = () => {
    setModalErrorMsg(null);
    setErrorMsg(null);
    setEditingId(null);
    setFormBadge("");
    setFormCategory("");
    setFormTitle("");
    setFormDescription("");
    setFormTags([]);
    setTagInput("");
    setFormCtaText("");
    setFormCtaHref("#");
    setFormMockupType("property");
    setFormHeaderTitle("");
    setFormSubBadge("");
    setFormImageUrl("");
    setImageUploadMsg(null);
    setShowModal(true);
  };

  const openEditModal = (slide: SlideRecord) => {
    setModalErrorMsg(null);
    setErrorMsg(null);
    setEditingId(slide.id);
    setFormBadge(slide.badge);
    setFormCategory(slide.category);
    setFormTitle(slide.title);
    setFormDescription(slide.description);
    setFormTags([...slide.tags]);
    setTagInput("");
    setFormCtaText(slide.ctaText);
    setFormCtaHref(slide.ctaHref);
    setFormMockupType(slide.mockupType || "property");
    setFormHeaderTitle(slide.headerTitle || "");
    setFormSubBadge(slide.subBadge || "");
    setFormImageUrl(slide.imageUrl || "");
    setImageUploadMsg(null);
    setShowModal(true);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validasi Ekstensi & MIME Type (.jpg, .jpeg, .png)
    const rawExt = (file.name.split(".").pop() || "").toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png"];
    const allowedMime = ["image/jpeg", "image/png"];

    if (!allowedExts.includes(rawExt) || !allowedMime.includes(file.type.toLowerCase())) {
      setImageUploadMsg("Format tidak didukung. Hanya file berekstensi .jpg, .jpeg, atau .png yang diperbolehkan.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Validasi Resolusi Gambar (Wajib tepat 1920 × 1080 px)
    setImageUploading(true);
    setImageUploadMsg("Memvalidasi resolusi gambar...");

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const dimResult = await new Promise<{ valid: boolean; error?: string; width: number; height: number }>((resolve) => {
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        if (w !== 1920 || h !== 1080) {
          resolve({
            valid: false,
            error: `Resolusi gambar (${w} × ${h} px) tidak sesuai. Wajib tepat 1920 × 1080 px (16:9 Full HD) agar pas sempurna di card carousel tanpa perlu disesuaikan lagi.`,
            width: w,
            height: h,
          });
          return;
        }

        resolve({ valid: true, width: w, height: h });
      };
      img.onerror = () => {
        resolve({ valid: false, error: "Gagal membaca file gambar.", width: 0, height: 0 });
      };
      img.src = objectUrl;
    });

    URL.revokeObjectURL(objectUrl);

    if (!dimResult.valid) {
      setImageUploading(false);
      setImageUploadMsg(dimResult.error || "Resolusi gambar tidak sesuai.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 3. Upload ke server Supabase Storage
    setImageUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/feature-showcase/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setFormImageUrl(json.data.url);
        setImageUploadMsg(
          json.data.isFallback
            ? "Upload berhasil (fallback DataURL)."
            : "Asset 1920 × 1080 px (16:9) berhasil di-upload."
        );
      } else {
        setImageUploadMsg(json.message || "Gagal mengunggah asset.");
      }
    } catch (err) {
      console.error(err);
      setImageUploadMsg("Terjadi kesalahan sistem saat mengunggah asset.");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBadge || !formTitle || !formDescription || !formCtaText) {
      setModalErrorMsg("Badge, Judul, Deskripsi, dan CTA Teks wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setModalErrorMsg(null);
    setErrorMsg(null);
    try {
      const isEdit = Boolean(editingId);
      const payload = {
        action: isEdit ? "UPDATE" : "CREATE",
        ...(isEdit ? { slideId: editingId } : {}),
        badge: formBadge,
        category: formCategory,
        title: formTitle,
        description: formDescription,
        tags: formTags,
        ctaText: formCtaText,
        ctaHref: formCtaHref || "#",
        mockupType: formMockupType,
        headerTitle: formHeaderTitle,
        subBadge: formSubBadge,
        imageUrl: formImageUrl || null,
      };

      const res = await fetch("/api/admin/feature-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setSuccessMsg(json.message);
        autoClear();
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal menyimpan slide.");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat menyimpan slide.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (slide: SlideRecord) => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/feature-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_PUBLISH", slideId: slide.id }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        autoClear();
        fetchData();
      } else {
        setErrorMsg(json.message || "Gagal mengubah status publish.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan sistem saat mengubah status publish.");
    }
  };

  const handleSwap = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const a = slides[index];
    const b = slides[target];
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/feature-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWAP_ORDER", item1Id: a.id, item2Id: b.id }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        autoClear();
        fetchData();
      } else {
        setErrorMsg(json.message || "Gagal mengubah urutan.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan sistem saat mengubah urutan.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/feature-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", slideId: deleteConfirm.id }),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        setSuccessMsg(json.message);
        autoClear();
        fetchData();
      } else {
        setErrorMsg(json.message || "Gagal menghapus slide.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan sistem saat menghapus slide.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered slides computation
  const filteredSlides = slides.filter((slide) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      slide.title.toLowerCase().includes(q) ||
      slide.badge.toLowerCase().includes(q) ||
      slide.category.toLowerCase().includes(q) ||
      slide.tags.some((t) => t.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (statusFilter === "published") return slide.isPublished;
    if (statusFilter === "hidden") return !slide.isPublished;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner (Dark Premium Style matching Owner Management) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#242823] border border-[#383E36] p-4 sm:p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-[10px] sm:text-xs tracking-wider uppercase font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                <IconSparkles className="mr-1 size-3 sm:size-3.5 text-[#C8A96B]" /> LANDING PAGE & FEATURE SHOWCASE
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Manajemen Feature Showcase
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
              Kelola data slide carousel &ldquo;Fitur Utama Platform&rdquo; pada landing page. Data yang dipublish akan tampil otomatis di halaman utama.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold gap-1.5 h-9 cursor-pointer text-xs flex-1 sm:flex-initial"
            >
              <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">Refresh Data</span>
              <span className="xs:hidden">Refresh</span>
            </Button>

            <Button
              onClick={openCreateModal}
              size="sm"
              className="bg-[#C8A96B] hover:bg-[#C8A96B]/90 text-white font-bold gap-1.5 h-9 shadow-md text-xs cursor-pointer flex-1 sm:flex-initial"
            >
              <IconPlus className="size-4" />
              Tambah Slide
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Global Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-75">
            <IconX className="size-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-75">
            <IconX className="size-4" />
          </button>
        </div>
      )}

      {/* 3. Metric Cards Grid (2 Kolom di Mobile, 4 di Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Slide */}
        <Card className="rounded-2xl border bg-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-xs">
          <div className="flex size-9 sm:size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <IconLayoutGrid className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Total Slide
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-foreground">{stats.total}</h3>
          </div>
        </Card>

        {/* Published */}
        <Card className="rounded-2xl border bg-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-xs">
          <div className="flex size-9 sm:size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <IconEye className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Published
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.published}</h3>
          </div>
        </Card>

        {/* Draft / Hidden */}
        <Card className="rounded-2xl border bg-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-xs">
          <div className="flex size-9 sm:size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <IconEyeOff className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Draft / Hidden
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400">{stats.draft}</h3>
          </div>
        </Card>

        {/* Standar Resolusi */}
        <Card className="rounded-2xl border bg-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 shadow-xs">
          <div className="flex size-9 sm:size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <IconPhoto className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Standar Resolusi
            </p>
            <h3 className="text-xs sm:text-base md:text-lg font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
              1920 × 1080
            </h3>
          </div>
        </Card>
      </div>

      {/* 4. Directory Search & Table Card */}
      <Card className="rounded-2xl sm:rounded-3xl border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-3.5 sm:p-6 space-y-4">
          {/* Search Input & Status Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md w-full">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari judul slide, badge, kategori, atau tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border bg-background pl-10 pr-9 py-2 text-xs focus:ring-2 focus:ring-[#8FA28A] font-semibold"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs (Flex Wrap so never truncated) */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Status ({slides.length})
              </button>
              <button
                onClick={() => setStatusFilter("published")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all cursor-pointer ${
                  statusFilter === "published"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Published ({stats.published})
              </button>
              <button
                onClick={() => setStatusFilter("hidden")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all cursor-pointer ${
                  statusFilter === "hidden"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Draft / Hidden ({stats.draft})
              </button>
            </div>
          </div>

          {/* Table / List View */}
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <IconLoader2 className="size-8 animate-spin mx-auto text-[#8FA28A] mb-2" />
              <p className="text-xs font-semibold">Memuat data slide showcase...</p>
            </div>
          ) : filteredSlides.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl p-6 bg-muted/20">
              <IconLayoutGrid className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-sm text-foreground">Tidak Ada Slide Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                {slides.length === 0
                  ? "Belum ada slide carousel. Klik 'Tambah Slide' untuk mulai membuat slide baru."
                  : "Tidak ditemukan slide yang sesuai dengan pencarian atau filter status yang dipilih."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (Tampil di md ke atas) */}
              <div className="hidden md:block overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="p-3.5 pl-4 text-center w-24">Urutan</th>
                      <th className="p-3.5">Detail Slide Carousel</th>
                      <th className="p-3.5 w-44">Tipe Mockup</th>
                      <th className="p-3.5 w-32">Status</th>
                      <th className="p-3.5 text-right pr-4 w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSlides.map((slide, index) => {
                      const actualIndex = slides.findIndex((s) => s.id === slide.id);
                      return (
                        <tr key={slide.id} className="hover:bg-muted/30 transition-colors">
                          {/* Reorder Arrows & Order Badge */}
                          <td className="p-3.5 pl-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-6 p-0 hover:bg-muted"
                                  title="Naikkan Urutan"
                                  onClick={() => handleSwap(actualIndex, -1)}
                                  disabled={actualIndex === 0}
                                >
                                  <IconArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-6 p-0 hover:bg-muted"
                                  title="Turunkan Urutan"
                                  onClick={() => handleSwap(actualIndex, 1)}
                                  disabled={actualIndex === slides.length - 1}
                                >
                                  <IconArrowDown className="size-3.5" />
                                </Button>
                              </div>
                              <span className="font-mono text-xs font-bold text-muted-foreground w-6 text-center">
                                #{slide.order}
                              </span>
                            </div>
                          </td>

                          {/* Detail Slide (Thumbnail 16:9 + Title + Badge + Category + Tags) */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              {/* 16:9 Thumbnail Photo */}
                              <div className="w-16 h-10 rounded-lg border bg-[#FAF9F5] overflow-hidden shrink-0 aspect-video flex items-center justify-center">
                                {slide.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    className="w-full h-full object-cover object-top"
                                  />
                                ) : (
                                  <IconPhoto className="size-5 text-muted-foreground opacity-50" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground truncate max-w-md">
                                  {slide.title}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                  <span className="font-bold text-[#8FA28A]">{slide.badge}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">{slide.category}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  {slide.tags.slice(0, 3).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  {slide.tags.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{slide.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Mockup Type */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {MOCKUP_TYPE_LABELS[slide.mockupType] || slide.mockupType}
                              </Badge>
                              {slide.headerTitle && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                  {slide.headerTitle}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5">
                            <Badge
                              variant={slide.isPublished ? "default" : "outline"}
                              className={
                                slide.isPublished
                                  ? "bg-emerald-600 text-white font-bold text-[10px]"
                                  : "text-muted-foreground font-semibold text-[10px]"
                              }
                            >
                              {slide.isPublished ? "PUBLISHED" : "HIDDEN"}
                            </Badge>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5 text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTogglePublish(slide)}
                                className="size-8 p-0 text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                                title={slide.isPublished ? "Sembunyikan dari Landing Page" : "Publikasikan ke Landing Page"}
                              >
                                {slide.isPublished ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditModal(slide)}
                                className="size-8 p-0 text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer"
                                title="Edit Slide"
                              >
                                <IconPencil className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm({ id: slide.id, title: slide.title })}
                                className="size-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                title="Hapus Slide"
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW (Tampil di layar HP bawah md) */}
              <div className="md:hidden space-y-3.5">
                {filteredSlides.map((slide) => {
                  const actualIndex = slides.findIndex((s) => s.id === slide.id);
                  return (
                    <div
                      key={slide.id}
                      className="rounded-2xl border p-3.5 sm:p-4 bg-card shadow-xs space-y-3"
                    >
                      {/* Top Bar: Order, Status Badge & Reorder Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                            #{slide.order}
                          </span>
                          <Badge
                            variant={slide.isPublished ? "default" : "outline"}
                            className={
                              slide.isPublished
                                ? "bg-emerald-600 text-white font-bold text-[10px]"
                                : "text-muted-foreground font-semibold text-[10px]"
                            }
                          >
                            {slide.isPublished ? "PUBLISHED" : "HIDDEN"}
                          </Badge>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/30">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 cursor-pointer"
                            onClick={() => handleSwap(actualIndex, -1)}
                            disabled={actualIndex === 0}
                            title="Naikkan"
                          >
                            <IconArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 cursor-pointer"
                            onClick={() => handleSwap(actualIndex, 1)}
                            disabled={actualIndex === slides.length - 1}
                            title="Turunkan"
                          >
                            <IconArrowDown className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* 16:9 Thumbnail (Full Width on Mobile) */}
                      <div className="w-full aspect-video rounded-xl border bg-[#FAF9F5] overflow-hidden flex items-center justify-center relative shadow-xs">
                        {slide.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <IconPhoto className="size-8 opacity-40" />
                            <span className="text-[10px] font-medium">Belum ada gambar</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-mono font-bold backdrop-blur-xs">
                          1920 × 1080 (16:9)
                        </span>
                      </div>

                      {/* Detail: Badge, Category & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                          <span className="font-bold text-[#8FA28A]">{slide.badge}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground font-medium">{slide.category}</span>
                        </div>
                        <h4 className="font-black text-sm text-foreground leading-snug">
                          {slide.title}
                        </h4>
                      </div>

                      {/* Tags row */}
                      {slide.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {slide.tags.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium"
                            >
                              {t}
                            </span>
                          ))}
                          {slide.tags.length > 3 && (
                            <span className="text-[9px] text-muted-foreground font-medium">
                              +{slide.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions Toolbar */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePublish(slide)}
                          className="flex-1 text-xs h-8 gap-1 font-semibold cursor-pointer"
                        >
                          {slide.isPublished ? (
                            <>
                              <IconEyeOff className="size-3.5 text-amber-500" /> Sembunyikan
                            </>
                          ) : (
                            <>
                              <IconEye className="size-3.5 text-emerald-500" /> Publikasikan
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(slide)}
                          className="flex-1 text-xs h-8 gap-1 font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                        >
                          <IconPencil className="size-3.5" /> Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm({ id: slide.id, title: slide.title })}
                          className="size-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                          title="Hapus"
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="text-lg font-black text-foreground">
                {editingId ? "Edit Slide Carousel" : "Tambah Slide Carousel"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sisi Kiri: Form Pengisian (col-span-7) */}
              <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
                {modalErrorMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    <IconAlertTriangle className="size-4 shrink-0" /> {modalErrorMsg}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-bold block mb-1 text-sm">Badge *</label>
                    <input
                      type="text"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value.toUpperCase())}
                      placeholder="contoh: PMS SAAS"
                      className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-sm">Mockup Type *</label>
                    <select
                      value={formMockupType}
                      onChange={(e) => setFormMockupType(e.target.value)}
                      className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                    >
                      {Object.entries(MOCKUP_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-sm">Judul *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Judul slide"
                    className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-sm">Kategori (sub-judul kecil)</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value.toUpperCase())}
                    placeholder="contoh: MULTI-ASSET & UNIT ROOM MANAGEMENT"
                    className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-sm">Deskripsi *</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Deskripsi fitur..."
                    className="w-full rounded-lg border p-2.5 bg-background text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-sm">
                    <IconTag className="size-3.5 inline mr-1" /> Tags
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Ketik tag lalu Enter"
                      className="flex-1 rounded-lg border p-2.5 bg-background text-xs font-semibold"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddTag}>
                      <IconPlus className="size-4" />
                    </Button>
                  </div>
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setFormTags((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-bold block mb-1 text-sm">CTA Teks *</label>
                    <input
                      type="text"
                      value={formCtaText}
                      onChange={(e) => setFormCtaText(e.target.value)}
                      placeholder="contoh: Eksplor Properti"
                      className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-sm">CTA Link *</label>
                    <input
                      type="text"
                      value={formCtaHref}
                      onChange={(e) => setFormCtaHref(e.target.value)}
                      placeholder="#jenis-properti"
                      className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-bold block mb-1 text-sm">Header Title (Mockup)</label>
                    <input
                      type="text"
                      value={formHeaderTitle}
                      onChange={(e) => setFormHeaderTitle(e.target.value)}
                      placeholder="Sub-header di dalam mockup"
                      className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-sm">Sub Badge (Mockup)</label>
                    <input
                      type="text"
                      value={formSubBadge}
                      onChange={(e) => setFormSubBadge(e.target.value)}
                      placeholder="Label kecil di dalam mockup"
                      className="w-full rounded-lg border p-2.5 bg-background text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Upload Asset Gambar */}
                <div>
                  <label className="font-bold block mb-1 text-sm">
                    <IconPhoto className="size-3.5 inline mr-1" /> Asset Foto Carousel (Wajib 1920 × 1080 px - 16:9)
                  </label>
                  <div className="rounded-xl border border-dashed p-4 bg-muted/10 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Format didukung: <span className="font-semibold text-foreground">.jpg, .jpeg, .png</span> • 
                      Resolusi wajib: <span className="font-bold text-[#8FA28A]">1920 × 1080 px</span> (16:9 Full HD) • 
                      Maks. 10 MB.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        className="gap-1.5"
                      >
                        {imageUploading ? (
                          <><IconLoader2 className="size-4 animate-spin" /> Memproses...</>
                        ) : (
                          <><IconUpload className="size-4" /> Pilih Foto (1920 × 1080)</>
                        )}
                      </Button>
                      {formImageUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setFormImageUrl("")}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          Hapus Foto
                        </Button>
                      )}
                    </div>

                    {imageUploadMsg && (
                      <div className="rounded-lg p-2.5 text-xs bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                        {imageUploadMsg}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting || imageUploading} className="gap-1.5">
                    {isSubmitting && <IconLoader2 className="size-4 animate-spin" />}
                    {editingId ? "Simpan Perubahan" : "Tambah Slide"}
                  </Button>
                </div>
              </form>

              {/* Sisi Kanan: Live Landing Page Card Preview (col-span-5) */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#8FA28A] flex items-center gap-1.5">
                    <IconEye className="size-4" /> Live Landing Page Preview
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-mono font-medium">
                    1920 × 1080 (16:9)
                  </span>
                </div>

                {/* Card persis seperti di Landing Page Feature Showcase (aspect-video / 16:9) */}
                <div className="w-full rounded-2xl sm:rounded-3xl border-2 border-[#8FA28A]/80 shadow-xl ring-4 ring-[#8FA28A]/10 bg-white overflow-hidden aspect-video relative flex items-center justify-center transition-all">
                  {formImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formImageUrl}
                      alt={formTitle || "Preview Card"}
                      className="w-full h-full object-cover object-top select-none pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#FAF9F5] text-muted-foreground space-y-2">
                      <div className="h-12 w-12 rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center">
                        <IconPhoto className="size-6" />
                      </div>
                      <p className="text-xs font-bold text-foreground">Belum Ada Asset Foto</p>
                      <p className="text-[11px] text-muted-foreground max-w-[220px]">
                        Upload gambar 1920 × 1080 px (.jpg, .jpeg, .png) untuk melihat tampilan card carousel.
                      </p>
                    </div>
                  )}

                  {/* Floating Pill Badge (Exact matching landing page) */}
                  <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/80 text-gray-800 text-[10px] font-black uppercase tracking-wider shadow-sm">
                    {formBadge || "BADGE"}
                  </div>
                </div>

                {/* Detail teks di bawah card (mensimulasikan bagian info slide di landing page) */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3 text-center">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[22px]">
                    {formTags.length > 0 ? (
                      formTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EAE5D9] text-[#4A5048] text-[10px] font-semibold"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Belum ada tag</span>
                    )}
                  </div>

                  {/* Judul & Kategori */}
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-[#2F332E] leading-tight">
                      {formTitle || "Judul Fitur Slide"}
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#8FA28A]">
                      {formCategory || "KATEGORI FITUR"}
                    </p>
                  </div>

                  {/* Deskripsi */}
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {formDescription || "Deskripsi fitur yang akan tampil saat card slide ini aktif di landing page."}
                  </p>

                  {/* CTA Button */}
                  <div className="pt-1 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-gray-300 text-xs font-bold text-[#2F332E] shadow-2xs">
                      <span>{formCtaText || "Eksplor Fitur"}</span>
                      <IconLink className="size-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <IconAlertTriangle className="size-5 text-destructive" />
              Hapus Slide?
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Apakah Anda yakin ingin menghapus slide{" "}
              <span className="font-bold text-foreground">&ldquo;{deleteConfirm.title}&rdquo;</span>? Tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="gap-1.5">
                {isSubmitting && <IconLoader2 className="size-4 animate-spin" />}
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

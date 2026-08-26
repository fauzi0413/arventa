"use client";

import React, { useState, useEffect } from "react";
import {
  IconHelpCircle,
  IconPlus,
  IconRefresh,
  IconPencil,
  IconTrash,
  IconSearch,
  IconCheck,
  IconX,
  IconLoader2,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconChevronUp,
  IconTag,
  IconUsers,
  IconAlertTriangle,
  IconBook,
  IconSparkles,
  IconLink,
  IconList,
  IconExternalLink,
  IconBold,
  IconItalic,
  IconFolderPlus,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  targetRole: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export function FaqManagementManager() {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    categoriesCount: 0,
  });

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State (FAQ)
  const [formCategory, setFormCategory] = useState("UMUM");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formTargetRole, setFormTargetRole] = useState("ALL");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsPublished, setFormIsPublished] = useState(true);

  // Category Manager Form State
  const [newCategoryName, setNewCategoryName] = useState("");

  // Link Insertion Dialog State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showAnswerPreview, setShowAnswerPreview] = useState(false);

  const FAQ_ROUTE_PATH = "/platform/faq";

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({
        search,
        category: selectedCategory,
        targetRole: selectedRole,
      });

      const res = await fetch(`/api/admin/faq?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (json.success && json.data) {
        setFaqs(json.data.faqs || []);
        if (json.data.categories) setCategories(json.data.categories);
        if (json.data.stats) setStats(json.data.stats);
      } else {
        setErrorMsg(json.message || "Gagal memuat data FAQ.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan koneksi saat mengambil data FAQ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedRole]);

  // Handle Copy Route Path
  const handleCopyPath = () => {
    navigator.clipboard.writeText(FAQ_ROUTE_PATH).then(() => {
      setCopiedPath(true);
      setSuccessMsg(`Path rute menu "${FAQ_ROUTE_PATH}" berhasil disalin ke clipboard!`);
      setTimeout(() => setCopiedPath(false), 2500);
    });
  };

  // Open Modal Create FAQ
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormCategory(categories[0] || "UMUM");
    setFormQuestion("");
    setFormAnswer("");
    setFormTargetRole("ALL");
    setFormOrder(faqs.length + 1);
    setFormIsPublished(true);
    setModalErrorMsg(null);
    setShowAnswerPreview(false);
    setShowModal(true);
  };

  // Open Modal Edit FAQ
  const handleOpenEditModal = (item: FaqItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormTargetRole(item.targetRole);
    setFormOrder(item.order);
    setFormIsPublished(item.isPublished);
    setModalErrorMsg(null);
    setShowAnswerPreview(false);
    setShowModal(true);
  };

  // Add New Category to Master
  const handleAddMasterCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    setModalErrorMsg(null);

    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CATEGORY",
          categoryName: newCategoryName.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setNewCategoryName("");
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal menambahkan kategori baru.");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat menambahkan kategori.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category from Master
  const handleDeleteMasterCategory = async (catName: string) => {
    setIsSubmitting(true);
    setModalErrorMsg(null);

    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_CATEGORY",
          categoryName: catName,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        fetchData();
      } else {
        setModalErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat menghapus kategori.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatting helpers for Rich Text Editor
  const insertFormatting = (prefix: string, suffix: string = "") => {
    setFormAnswer((prev) => `${prev}${prefix}Teks${suffix}`);
  };

  // Open Link Modal
  const handleOpenLinkModal = () => {
    setLinkText("");
    setLinkUrl("");
    setShowLinkModal(true);
  };

  // Confirm Link Insert
  const handleConfirmInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;

    const label = linkText.trim() || linkUrl.trim();
    const href = linkUrl.trim();

    const linkHtml = `<a href="${href}">${label}</a>`;
    setFormAnswer((prev) => (prev ? `${prev} ${linkHtml}` : linkHtml));
    setShowLinkModal(false);
  };

  // Save Modal (Create / Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion || !formAnswer) {
      setModalErrorMsg("Pertanyaan dan Jawaban wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setModalErrorMsg(null);

    try {
      const action = editingItem ? "UPDATE" : "CREATE";
      const payload = {
        action,
        id: editingItem?.id,
        category: formCategory,
        question: formQuestion,
        answer: formAnswer,
        targetRole: formTargetRole,
        order: Number(formOrder),
        isPublished: formIsPublished,
      };

      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowModal(false);
        setEditingItem(null);
        fetchData();
      } else {
        setModalErrorMsg(json.message || "Gagal menyimpan item FAQ.");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Terjadi kesalahan sistem saat menyimpan FAQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (id: string) => {
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_PUBLISH", id }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        fetchData();
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal mengubah status publikasi FAQ.");
    }
  };

  // Delete Item
  const handleDeleteFaq = async () => {
    if (!deleteConfirmId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", id: deleteConfirmId }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setDeleteConfirmId(null);
        fetchData();
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghapus FAQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "PEMBAYARAN":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "OPERASIONAL":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "AKUN & KEAMANAN":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "SEWA & KONTRAK":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
  };

  // Helper to render formatted HTML & Markdown links safely
  const renderFormattedAnswer = (content: string) => {
    if (!content) return null;

    let processed = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[#C8A96B] dark:text-[#E5C98B] font-bold underline hover:opacity-80 transition-opacity">$1 ↗</a>'
    );

    processed = processed.replace(
      /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-0.5 text-[#C8A96B] dark:text-[#E5C98B] font-extrabold underline decoration-amber-500/50 hover:opacity-80 transition-opacity">$3 <svg class="inline-block size-3 shrink-0 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6h6v6"/><path d="M18 6L10 14"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg></a>'
    );

    return (
      <div
        className="text-foreground font-medium leading-relaxed whitespace-pre-line text-xs font-sans space-y-1"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#242823] border border-[#383E36] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-[#8FA28A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40 text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                <IconHelpCircle className="mr-1 size-3.5 text-[#C8A96B]" /> FAQ & HELP CENTER MANAGER
              </Badge>
              {/* Path Helper Badge */}
              <button
                onClick={handleCopyPath}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-mono text-amber-300 border border-amber-300/30 transition-all cursor-pointer"
                title="Klik untuk menyalin Path Rute Menu"
              >
                <span>Path: {FAQ_ROUTE_PATH}</span>
                {copiedPath ? <IconCheck className="size-3 text-emerald-400" /> : <IconCopy className="size-3" />}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              FAQ Management & Pusat Bantuan
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Kelola daftar pertanyaan umum (FAQ), petunjuk operasional sistem, dan panduan penggunaan platform ARVENTA untuk seluruh peran pengguna.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setModalErrorMsg(null);
                setShowCategoryModal(true);
              }}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold gap-1.5 h-9 cursor-pointer"
            >
              <IconTag className="size-4 text-amber-400" />
              Master Kategori
            </Button>
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold gap-1.5 h-9 cursor-pointer"
            >
              <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="bg-[#C8A96B] hover:bg-[#b8985b] text-[#1e221d] font-bold gap-1.5 h-9 shadow-md cursor-pointer"
            >
              <IconPlus className="size-4" />
              Tambah FAQ Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <IconHelpCircle className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Pertanyaan</p>
            <h3 className="text-2xl font-black text-foreground">{stats.total}</h3>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <IconEye className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dipublikasikan</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.published}</h3>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <IconEyeOff className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Draf / Tersembunyi</p>
            <h3 className="text-2xl font-black text-slate-600 dark:text-slate-400">{stats.draft}</h3>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <IconTag className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Kategori</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.categoriesCount}</h3>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-3xl border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari pertanyaan, jawaban, atau kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border bg-background pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-amber-500 font-semibold"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-muted-foreground">Target Peran:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 font-sans font-semibold text-xs focus:ring-2 focus:ring-amber-500 text-foreground cursor-pointer"
              >
                <option value="all" className="font-sans font-medium bg-background text-foreground py-1">Semua Peran (All Roles)</option>
                <option value="OWNER" className="font-sans font-medium bg-background text-foreground py-1">Owner Properti</option>
                <option value="HOUSEKEEPING" className="font-sans font-medium bg-background text-foreground py-1">Staf Housekeeping</option>
                <option value="TENANT" className="font-sans font-medium bg-background text-foreground py-1">Penyewa / Tenant (TENANT)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
            <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider mr-1">Kategori:</span>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              Semua ({stats.total})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => {
                setModalErrorMsg(null);
                setShowCategoryModal(true);
              }}
              className="px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 cursor-pointer ml-auto"
              title="Kelola Master Kategori FAQ"
            >
              <IconFolderPlus className="size-3.5" />
              <span>+ Kelola Master Kategori</span>
            </button>
          </div>

          {/* FAQ Accordion List */}
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <IconLoader2 className="size-8 animate-spin mx-auto text-amber-500 mb-2" />
              <p className="text-xs font-semibold">Memuat daftar FAQ...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl p-6 bg-muted/20">
              <IconHelpCircle className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-sm text-foreground">Tidak Ada Pertanyaan (FAQ)</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Belum ada pertanyaan pada kategori ini. Silakan klik tombol "Tambah FAQ Baru" di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {faqs.map((item) => {
                const isExpanded = expandedFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      item.isPublished ? "bg-card border-border/80" : "bg-muted/20 border-dashed opacity-75"
                    }`}
                  >
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div
                        onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                        className="flex-1 flex items-start gap-3 cursor-pointer select-none"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs border border-amber-500/20 mt-0.5">
                          #{item.order}
                        </span>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] font-bold ${getCategoryBadgeColor(item.category)}`}>
                              {item.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-mono font-semibold bg-muted text-muted-foreground">
                              Role: {item.targetRole === "USER" ? "TENANT" : item.targetRole}
                            </Badge>
                            <Badge
                              variant={item.isPublished ? "default" : "secondary"}
                              className={`text-[9px] font-bold ${item.isPublished ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"}`}
                            >
                              {item.isPublished ? "PUBLISHED" : "HIDDEN/DRAFT"}
                            </Badge>
                          </div>
                          <h4 className="font-extrabold text-sm text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                            {item.question}
                          </h4>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePublish(item.id)}
                          className="size-8 p-0 h-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          title={item.isPublished ? "Sembunyikan FAQ" : "Publikasikan FAQ"}
                        >
                          {item.isPublished ? <IconEye className="size-4 text-emerald-500" /> : <IconEyeOff className="size-4 text-slate-400" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditModal(item)}
                          className="size-8 p-0 h-8 text-muted-foreground hover:text-amber-500 cursor-pointer"
                          title="Edit FAQ"
                        >
                          <IconPencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="size-8 p-0 h-8 text-muted-foreground hover:text-rose-500 cursor-pointer"
                          title="Hapus FAQ"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                        <button
                          onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                          className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer ml-1"
                        >
                          {isExpanded ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Answer Content (Rich Text HTML Renderer) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t text-xs text-muted-foreground leading-relaxed animate-in fade-in">
                        <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                          <p className="font-bold text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <IconBook className="size-3.5" /> Jawaban / Solusi Terformat:
                          </p>
                          {renderFormattedAnswer(item.answer)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Master Category Manager */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <IconTag className="size-5 text-amber-500" />
                <h3 className="font-black text-base text-foreground">Kelola Master Kategori FAQ</h3>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-5" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <IconAlertTriangle className="size-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            {/* Form Add New Category */}
            <form onSubmit={handleAddMasterCategory} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="Nama kategori baru (misal: INTEGRASI API)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 rounded-xl border p-2.5 bg-background font-semibold focus:ring-2 focus:ring-amber-500 text-xs"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1 cursor-pointer shrink-0"
              >
                {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlus className="size-4" />}
                Tambah
              </Button>
            </form>

            {/* List of Existing Master Categories */}
            <div className="space-y-2 pt-2 border-t text-xs">
              <p className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider">
                Daftar Kategori Master Saat Ini ({categories.length}):
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {categories.map((cat) => {
                  const usageCount = faqs.filter((f) => f.category.toUpperCase() === cat.toUpperCase()).length;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] font-bold ${getCategoryBadgeColor(cat)}`}>
                          {cat}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ({usageCount} FAQ)
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMasterCategory(cat)}
                        className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        title={`Hapus kategori ${cat}`}
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t text-right">
              <Button size="sm" variant="outline" onClick={() => setShowCategoryModal(false)}>
                Selesai / Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit FAQ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-card border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <IconHelpCircle className="size-5 text-amber-500" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem ? "Edit Pertanyaan FAQ" : "Tambah Pertanyaan FAQ Baru"}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-5" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <IconAlertTriangle className="size-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold block text-xs">Kategori FAQ *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryModal(true);
                      }}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      + Tambah Baru
                    </button>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background font-sans font-semibold focus:ring-2 focus:ring-amber-500 text-xs cursor-pointer text-foreground"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="font-sans font-medium bg-background text-foreground py-1">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Target Peran (Role) *</label>
                  <select
                    value={formTargetRole}
                    onChange={(e) => setFormTargetRole(e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background font-sans font-semibold focus:ring-2 focus:ring-amber-500 text-xs cursor-pointer text-foreground"
                  >
                    <option value="ALL" className="font-sans font-medium bg-background text-foreground py-1">ALL ROLES (Semua User)</option>
                    <option value="OWNER" className="font-sans font-medium bg-background text-foreground py-1">OWNER Properti</option>
                    <option value="HOUSEKEEPING" className="font-sans font-medium bg-background text-foreground py-1">HOUSEKEEPING Staf</option>
                    <option value="TENANT" className="font-sans font-medium bg-background text-foreground py-1">TENANT / Penyewa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Pertanyaan (Question) *</label>
                <textarea
                  placeholder="Tuliskan pertanyaan umum..."
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-bold text-xs h-16 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Rich Text Answer Editor & Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold block text-xs">Jawaban / Solusi (Rich Text & Link) *</label>
                  <button
                    type="button"
                    onClick={() => setShowAnswerPreview(!showAnswerPreview)}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showAnswerPreview ? "Edit Text" : "Pratinjau Hasil (Preview)"}
                  </button>
                </div>

                {/* Toolbar formatting buttons */}
                <div className="flex flex-wrap items-center justify-between gap-1 p-2 rounded-t-xl bg-muted/60 border border-b-0 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertFormatting("<b>", "</b>")}
                      className="px-2 py-1 rounded bg-background hover:bg-muted border font-extrabold text-xs cursor-pointer"
                      title="Cetak Tebal (Bold)"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("<i>", "</i>")}
                      className="px-2 py-1 rounded bg-background hover:bg-muted border italic font-serif text-xs cursor-pointer"
                      title="Cetak Miring (Italic)"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenLinkModal}
                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Sisipkan Tautan / Link Href"
                    >
                      <IconLink className="size-3.5" />
                      <span>+ Sisipkan Link (href)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("\n- ", "")}
                      className="px-2 py-1 rounded bg-background hover:bg-muted border text-xs flex items-center gap-1 cursor-pointer"
                      title="Sisipkan Doin Poin (List)"
                    >
                      <IconList className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">HTML Link Ready</span>
                </div>

                {showAnswerPreview ? (
                  <div className="p-3 rounded-b-xl border bg-card min-h-28 text-xs">
                    {renderFormattedAnswer(formAnswer || "(Belum ada isi jawaban)")}
                  </div>
                ) : (
                  <textarea
                    placeholder="Tuliskan jawaban lengkap di sini. Anda dapat menyisipkan link rute atau URL luar dengan tombol '+ Sisipkan Link (href)'..."
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    className="w-full rounded-b-xl border p-2.5 bg-background text-xs h-28 focus:ring-2 focus:ring-amber-500 leading-relaxed font-medium font-mono"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="font-bold block mb-1">Urutan Tampilan (Order)</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full rounded-lg border p-2 bg-background font-mono font-bold text-xs"
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isPublishedCheck"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="size-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="isPublishedCheck" className="font-bold text-xs cursor-pointer select-none">
                    Publikasikan Langsung
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Simpan FAQ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Sub-Modal: Insert Link (href) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <IconLink className="size-5 text-amber-500" />
                <h3 className="font-black text-base text-foreground">Sisipkan Tautan (Link)</h3>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-muted-foreground hover:text-foreground">
                <IconX className="size-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInsertLink} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Teks Tautan (Link Label) *</label>
                <input
                  type="text"
                  placeholder="Contoh: Halaman Subscriptions & Billing"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-semibold focus:ring-2 focus:ring-amber-500 text-xs"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Target URL / Path (href) *</label>
                <input
                  type="text"
                  placeholder="Contoh: /platform/subscriptions atau https://arventa.id"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs focus:ring-2 focus:ring-amber-500"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Masukkan rute internal (misal: <code className="text-amber-500">/platform/subscriptions</code>) atau URL eksternal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkModal(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!linkUrl}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1 cursor-pointer"
                >
                  <IconCheck className="size-4" />
                  Sisipkan Tautan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete FAQ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card border shadow-2xl p-6 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <IconTrash className="size-8" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">Hapus Pertanyaan FAQ?</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Item FAQ ini akan dihapus dari sistem dan tidak akan tampil di pusat bantuan pengguna.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDeleteFaq}
                disabled={isSubmitting}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : null}
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

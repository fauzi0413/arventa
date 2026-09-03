"use client";

import React, { useState, Suspense, lazy } from "react";
import {
  IconSpeakerphone,
  IconPlus,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconTrash,
  IconLoader2,
} from "@tabler/icons-react";
import { useAnnouncements } from "./hooks/useAnnouncements";
import { AnnouncementFilterBar } from "./components/AnnouncementFilterBar";
import { AnnouncementTable } from "./components/AnnouncementTable";
import { AnnouncementCardList } from "./components/AnnouncementCardList";
import { AnnouncementFormData, AnnouncementItem } from "./types";

// Dynamic import with React.lazy() as specified in ARV-M5-01
const AnnouncementFormModal = lazy(
  () => import("./components/AnnouncementFormModal")
);
const AnnouncementDetailModal = lazy(
  () => import("./components/AnnouncementDetailModal")
);

// Skeleton fallback for lazy modals
const ModalSkeletonFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
    <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded-lg" />
      <div className="h-4 w-72 bg-muted/60 rounded" />
      <div className="h-32 bg-muted/40 rounded-xl" />
      <div className="h-10 w-full bg-muted/60 rounded-xl" />
    </div>
  </div>
);

export default function AnnouncementsPage() {
  const {
    announcements,
    properties,
    userRole,
    loading,
    actionLoading,
    filters,
    pagination,
    toast,
    hideToast,
    setFilter,
    resetFilters,
    setPage,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    archiveAnnouncement,
  } = useAnnouncements();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [detailItem, setDetailItem] = useState<AnnouncementItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AnnouncementItem | null>(null);

  const isTenant = userRole === "TENANT" || userRole === "USER";

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  // Handle open edit modal (STRICT LOCK: only DRAFT or SCHEDULED)
  const handleOpenEdit = (item: AnnouncementItem) => {
    if (item.status === "PUBLISHED" || item.status === "ARCHIVED") {
      return;
    }
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = async (data: AnnouncementFormData): Promise<boolean> => {
    if (editingItem) {
      return await updateAnnouncement(editingItem.id, data);
    } else {
      return await createAnnouncement(data);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const ok = await deleteAnnouncement(deletingItem.id);
    if (ok) {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Floating Modern Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-card border border-border shadow-xl max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-2 rounded-xl text-white shrink-0 ${
              toast.type === "success"
                ? "bg-emerald-600"
                : toast.type === "error"
                ? "bg-rose-600"
                : toast.type === "warning"
                ? "bg-amber-600"
                : "bg-blue-600"
            }`}
          >
            {toast.type === "success" && <IconCheck className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "error" && <IconAlertCircle className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "warning" && <IconAlertCircle className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "info" && <IconInfoCircle className="w-5 h-5 stroke-[2.5]" />}
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-bold text-foreground">{toast.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={hideToast}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <IconSpeakerphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Komunitas & Pengumuman
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {isTenant
                  ? "Informasi dan pengumuman resmi dari pengelola properti untuk kamar Anda."
                  : "Buat, jadwalkan, dan distribusikan pengumuman ke seluruh properti atau kamar tertentu."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Create Announcement (Owner & Housekeeping only) */}
        {!isTenant && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs md:text-sm transition-all shadow-sm hover:shadow-md"
          >
            <IconPlus className="w-4 h-4" />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <AnnouncementFilterBar
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        properties={properties}
        totalCount={pagination.total}
        loading={loading}
      />

      {/* Main List Container: Desktop Table & Mobile Card List */}
      <div className="space-y-4">
        {/* Desktop View (>= 768px) */}
        <AnnouncementTable
          announcements={announcements}
          userRole={userRole}
          onViewDetail={(item) => setDetailItem(item)}
          onEdit={handleOpenEdit}
          onDelete={(item) => setDeletingItem(item)}
          onArchive={(item) => archiveAnnouncement(item.id)}
          loading={loading}
        />

        {/* Mobile View (< 768px) */}
        <AnnouncementCardList
          announcements={announcements}
          userRole={userRole}
          onViewDetail={(item) => setDetailItem(item)}
          onEdit={handleOpenEdit}
          onDelete={(item) => setDeletingItem(item)}
          onArchive={(item) => archiveAnnouncement(item.id)}
          loading={loading}
        />

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl text-xs">
            <div className="text-muted-foreground">
              Halaman <span className="font-semibold text-foreground">{pagination.page}</span> dari{" "}
              <span className="font-semibold text-foreground">{pagination.totalPages}</span> (Total{" "}
              {pagination.total} data)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman Sebelumnya"
              >
                <IconChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map(
                  (pageNum) => {
                    const isCurrent = pageNum === pagination.page;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-medium transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                type="button"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman Selanjutnya"
              >
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lazy Loaded Modal: Create & Edit Form */}
      {isFormOpen && (
        <Suspense fallback={<ModalSkeletonFallback />}>
          <AnnouncementFormModal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleFormSubmit}
            initialData={editingItem}
            properties={properties}
            userRole={userRole}
            loading={actionLoading}
          />
        </Suspense>
      )}

      {/* Lazy Loaded Modal: Detail Preview with useSafeBack */}
      {detailItem && (
        <Suspense fallback={<ModalSkeletonFallback />}>
          <AnnouncementDetailModal
            isOpen={Boolean(detailItem)}
            onClose={() => setDetailItem(null)}
            announcement={detailItem}
            userRole={userRole}
            onEdit={(item) => {
              setDetailItem(null);
              handleOpenEdit(item);
            }}
            onArchive={(item) => archiveAnnouncement(item.id)}
            onDelete={(item) => {
              setDetailItem(null);
              setDeletingItem(item);
            }}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                <IconTrash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Hapus Pengumuman?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Pengumuman berjudul <span className="font-semibold text-foreground">"{deletingItem.title}"</span>{" "}
              akan dihapus secara permanen dari sistem dan tidak akan tampil lagi di portal penyewa.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                {actionLoading && <IconLoader2 className="w-3.5 h-3.5 animate-spin" />}
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

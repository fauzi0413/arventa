"use client";

import React, { useState } from "react";
import {
  IconBuildingCommunity,
  IconAlertCircle,
  IconRefresh,
  IconCheck,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";
import { usePropertyChat } from "./hooks/usePropertyChat";
import { ChatGroupListView } from "./components/ChatGroupListView";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessageList } from "./components/ChatMessageList";
import { ChatInputBar } from "./components/ChatInputBar";
import { ResidentsDrawer } from "./components/ResidentsDrawer";
import { PinnedMessageBanner } from "./components/PinnedMessageBanner";
import { CreatePinnedAnnouncementModal } from "./components/CreatePinnedAnnouncementModal";

export default function PropertyCommunityPage() {
  const {
    propertyId,
    property,
    currentUser,
    residents,
    availableProperties,
    activeTenantsCount,
    managementCount,
    messages,
    pinnedMessages,
    loading,
    refreshing,
    sending,
    error,
    isRealtimeConnected,
    sendMessage,
    pinMessage,
    unpinMessage,
    deleteMessage,
    selectProperty,
    backToChatList,
    switchProperty,
    refresh,
  } = usePropertyChat();

  const [isResidentsDrawerOpen, setIsResidentsDrawerOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const isAdmin =
    currentUser?.role === "OWNER" ||
    currentUser?.role === "HOUSEKEEPING" ||
    currentUser?.role === "PLATFORM_ADMIN";

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const handleSendMessage = async (
    content: string,
    replyTo?: { id: string; content: string; senderName: string }
  ) => {
    const success = await sendMessage(content, replyTo);
    if (success === false) {
      showToast("error", "Gagal mengirim pesan. Silakan coba lagi.");
      return false;
    }
    setReplyingTo(null);
    return true;
  };

  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-amber-500/60", "bg-amber-500/10");
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-amber-500/60", "bg-amber-500/10");
      }, 2500);
    } else {
      showToast("info", "Pesan ini belum termuat di layar obrolan saat ini.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-6xl mx-auto space-y-3 pb-2 animate-in fade-in duration-300">
      {/* Floating Modern Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-card border border-border shadow-xl max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-2 rounded-xl text-white shrink-0 ${
              toast.type === "success"
                ? "bg-emerald-600"
                : toast.type === "error"
                ? "bg-rose-600"
                : "bg-blue-600"
            }`}
          >
            {toast.type === "success" && <IconCheck className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "error" && <IconAlertCircle className="w-5 h-5 stroke-[2.5]" />}
            {toast.type === "info" && <IconInfoCircle className="w-5 h-5 stroke-[2.5]" />}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-foreground">
              {toast.type === "success" ? "Berhasil" : toast.type === "error" ? "Gagal" : "Info"}
            </p>
            <p className="text-muted-foreground mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 1. WHATSAPP STYLE CHAT GROUP LIST (INITIAL SCREEN) */}
      {/* If no property is selected, show group list like WhatsApp mobile */}
      {/* --------------------------------------------------------------------- */}
      {!property ? (
        <ChatGroupListView
          properties={availableProperties}
          currentUser={currentUser}
          loading={loading}
          onSelectProperty={selectProperty}
        />
      ) : (
        /* --------------------------------------------------------------------- */
        /* 2. WHATSAPP ROOMCHAT VIEW (WHEN GROUP IS SELECTED) */
        /* --------------------------------------------------------------------- */
        <>
          {/* WhatsApp Header with Back Button */}
          <ChatHeader
            property={property}
            availableProperties={availableProperties}
            activeTenantsCount={activeTenantsCount}
            managementCount={managementCount}
            isRealtimeConnected={isRealtimeConnected}
            refreshing={refreshing}
            currentUserRole={currentUser?.role}
            onRefresh={refresh}
            onSwitchProperty={switchProperty}
            onOpenResidents={() => setIsResidentsDrawerOpen(true)}
            onOpenCreateAnnouncement={() => setIsAnnouncementModalOpen(true)}
            onBackToChatList={backToChatList}
          />

          {error && !property ? (
            <div className="flex-1 flex items-center justify-center p-8 rounded-3xl bg-card border border-border/80">
              <div className="max-w-md text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-600 mx-auto">
                  <IconAlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground">
                    Tidak Dapat Mengakses Obrolan Kost
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={backToChatList}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold transition-all"
                >
                  Kembali ke Daftar Percakapan
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* WhatsApp Pinned Messages Banner */}
              <PinnedMessageBanner
                pinnedMessages={pinnedMessages}
                isAdmin={isAdmin}
                onJumpToMessage={handleJumpToMessage}
                onUnpinMessage={async (id) => {
                  const ok = await unpinMessage(id);
                  if (ok) showToast("info", "Sematan pesan dilepas.");
                }}
              />

              {/* Chat Messages Stream */}
              <ChatMessageList
                messages={messages}
                currentUserId={currentUser?.id || ""}
                currentUserRole={currentUser?.role}
                loading={loading}
                onPinMessage={async (id) => {
                  const ok = await pinMessage(id);
                  if (ok) showToast("success", "Pesan berhasil disematkan!");
                }}
                onUnpinMessage={async (id) => {
                  const ok = await unpinMessage(id);
                  if (ok) showToast("info", "Sematan pesan dilepas.");
                }}
                onDeleteMessage={async (id) => {
                  const ok = await deleteMessage(id);
                  if (ok) showToast("info", "Pesan telah dihapus.");
                  else showToast("error", "Gagal menghapus pesan.");
                }}
                onReplyMessage={(msg) => {
                  setReplyingTo({
                    id: msg.id,
                    content: msg.content,
                    senderName: msg.senderName,
                  });
                }}
                onJumpToMessage={handleJumpToMessage}
              />

              {/* Bottom Chat Input Bar */}
              <ChatInputBar
                onSendMessage={handleSendMessage}
                sending={sending}
                disabled={loading || !property}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          )}

          {/* 3. RESIDENTS & MANAGEMENT DRAWER */}
          <ResidentsDrawer
            isOpen={isResidentsDrawerOpen}
            onClose={() => setIsResidentsDrawerOpen(false)}
            residents={residents}
            propertyName={property?.name}
            activeTenantsCount={activeTenantsCount}
            managementCount={managementCount}
          />

          {/* 4. PINNED ANNOUNCEMENT MODAL (Owner/Housekeeping) */}
          {isAdmin && (
            <CreatePinnedAnnouncementModal
              isOpen={isAnnouncementModalOpen}
              onClose={() => setIsAnnouncementModalOpen(false)}
              propertyId={property.id}
              propertyName={property.name}
              onAnnouncementCreated={() => {
                refresh();
                showToast("success", "Pengumuman berhasil disiarkan dan disematkan!");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

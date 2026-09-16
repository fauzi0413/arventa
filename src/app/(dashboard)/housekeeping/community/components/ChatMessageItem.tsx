"use client";

import React, { useState } from "react";
import {
  IconCheck,
  IconChecks,
  IconClock,
  IconAlertCircle,
  IconSpeakerphone,
  IconPin,
  IconPinFilled,
  IconChevronDown,
  IconArrowBackUp,
  IconCopy,
  IconTrash,
  IconBan,
} from "@tabler/icons-react";
import { PropertyChatMessageItem } from "../types/chat";

interface ChatMessageItemProps {
  message: PropertyChatMessageItem;
  currentUserId: string;
  currentUserRole?: string;
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReplyMessage?: (message: PropertyChatMessageItem) => void;
  onJumpToMessage?: (messageId: string) => void;
}

// Deterministic vibrant color for contact name (WhatsApp style)
function getSenderColor(name: string, senderId: string): string {
  const colors = [
    "text-emerald-600 dark:text-emerald-400",
    "text-teal-600 dark:text-teal-400",
    "text-sky-600 dark:text-sky-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-violet-600 dark:text-violet-400",
    "text-amber-600 dark:text-amber-400",
    "text-rose-600 dark:text-rose-400",
    "text-orange-600 dark:text-orange-400",
  ];
  let hash = 0;
  const str = (name || "") + (senderId || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Format ISO date to HH:mm
function formatMessageTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

export function ChatMessageItem({
  message,
  currentUserId,
  currentUserRole,
  onPinMessage,
  onUnpinMessage,
  onDeleteMessage,
  onReplyMessage,
  onJumpToMessage,
}: ChatMessageItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const isOutgoing = message.senderId === currentUserId;
  const timeFormatted = formatMessageTime(message.createdAt);
  const userRoleUpper = (currentUserRole || "").toUpperCase();
  const isAdmin =
    userRoleUpper === "OWNER" ||
    userRoleUpper === "HOUSEKEEPING" ||
    userRoleUpper === "PLATFORM_ADMIN" ||
    userRoleUpper === "ADMIN";

  const isDeleted = Boolean(message.isDeleted);
  const isSender = message.senderId === currentUserId || isOutgoing;
  const canDelete = !isDeleted && (isSender || isAdmin);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    navigator.clipboard.writeText(message.content);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onReplyMessage?.(message);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (message.isPinned) {
      onUnpinMessage?.(message.id);
    } else {
      onPinMessage?.(message.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm("Hapus pesan ini dari obrolan grup warga?")) {
      onDeleteMessage?.(message.id);
    }
  };

  // 1. SYSTEM JOIN EVENT (🎉 Tenant Check-in / Assign)
  if (message.messageType === "SYSTEM_JOIN") {
    return (
      <div
        id={`msg-${message.id}`}
        className="flex justify-center my-3 transition-all duration-500 rounded-xl animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center gap-2 max-w-lg px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-medium shadow-xs text-center backdrop-blur-xs">
          <span className="shrink-0 text-sm">🎉</span>
          <span className="leading-snug">{message.content}</span>
          <span className="text-[10px] opacity-75 shrink-0 ml-1">{timeFormatted}</span>
        </div>
      </div>
    );
  }

  // 2. SYSTEM LEAVE EVENT (👋 Tenant Check-out / Terminate)
  if (message.messageType === "SYSTEM_LEAVE") {
    return (
      <div
        id={`msg-${message.id}`}
        className="flex justify-center my-3 transition-all duration-500 rounded-xl animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center gap-2 max-w-lg px-4 py-2 rounded-full bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/25 text-rose-800 dark:text-rose-300 text-xs font-medium shadow-xs text-center backdrop-blur-xs">
          <span className="shrink-0 text-sm">👋</span>
          <span className="leading-snug">{message.content}</span>
          <span className="text-[10px] opacity-75 shrink-0 ml-1">{timeFormatted}</span>
        </div>
      </div>
    );
  }

  // 3. ANNOUNCEMENT MESSAGE (📢 Official Notice)
  if (message.messageType === "ANNOUNCEMENT") {
    return (
      <div
        id={`msg-${message.id}`}
        className="group relative flex justify-center my-4 transition-all duration-500 rounded-2xl animate-in fade-in zoom-in-95"
      >
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            if (!isDeleted) setIsMenuOpen(true);
          }}
          className="relative max-w-xl w-full p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500/30 shadow-md text-amber-950 dark:text-amber-100 space-y-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2 pr-8">
            <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <IconSpeakerphone className="h-4 w-4 text-amber-600 animate-bounce" />
              <span>Pengumuman Pengelola</span>
              {message.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                  <IconPinFilled className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  Tersemat
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium opacity-80">{timeFormatted}</span>
          </div>

          <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
            {message.content}
          </p>

          <div className="text-[11px] text-right font-semibold text-amber-700 dark:text-amber-400">
            — {message.senderName} ({message.senderRole})
          </div>

          {/* WhatsApp Dropdown Chevron Button (Top Right) */}
          {!isDeleted && (
            <div className="absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-all cursor-pointer shadow-2xs ${
                  isMenuOpen
                    ? "bg-amber-500/30 text-amber-900 dark:text-amber-100 scale-105"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 opacity-90 hover:opacity-100"
                }`}
                title="Opsi pengumuman (Balas, Pin, Hapus)"
              >
                <IconChevronDown className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div className="absolute z-50 top-7 right-0 w-48 rounded-2xl bg-card border border-border/80 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-foreground">
                    <button
                      type="button"
                      onClick={handleReply}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                    >
                      <IconArrowBackUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Balas</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePin}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                    >
                      {message.isPinned ? (
                        <>
                          <IconPinFilled className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Lepas Sematan</span>
                        </>
                      ) : (
                        <>
                          <IconPin className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Sematkan Pesan</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                    >
                      <IconCopy className="h-4 w-4 text-sky-500 shrink-0" />
                      <span>Salin Teks</span>
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                      >
                        <IconTrash className="h-4 w-4 shrink-0" />
                        <span>Hapus Pesan</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. REGULAR CHAT MESSAGE (Outgoing vs Incoming)
  return (
    <div
      id={`msg-${message.id}`}
      className={`flex w-full mb-3 transition-all duration-500 rounded-2xl ${
        isOutgoing ? "justify-end" : "justify-start"
      } animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          if (!isDeleted) setIsMenuOpen(true);
        }}
        className={`relative group max-w-[88%] sm:max-w-md md:max-w-lg p-3 sm:px-4 sm:py-3 shadow-xs transition-shadow ${
          isOutgoing
            ? "bg-[#D6E4D3] dark:bg-[#1C3621] text-foreground dark:text-emerald-50 rounded-2xl rounded-tr-xs border border-[#8FA28A]/40 dark:border-[#8FA28A]/25"
            : "bg-card dark:bg-[#222822] text-foreground rounded-2xl rounded-tl-xs border border-border/80 dark:border-[#333D33]"
        }`}
      >
        {/* Top-Right WhatsApp Dropdown Trigger Button */}
        {!isDeleted && (
          <div className="absolute top-1.5 right-1.5 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-all cursor-pointer shadow-2xs ${
                isMenuOpen
                  ? "bg-black/25 dark:bg-white/25 text-foreground scale-105"
                  : "bg-black/10 dark:bg-white/15 text-foreground/80 hover:bg-black/25 dark:hover:bg-white/30 hover:text-foreground opacity-80 sm:opacity-50 sm:group-hover:opacity-100"
              }`}
              title="Opsi pesan (Balas, Sematkan, Salin, Hapus)"
            >
              <IconChevronDown className="h-3.5 w-3.5" />
            </button>

            {/* Floating Dropdown Context Menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div
                  className={`absolute z-50 top-7 w-48 rounded-2xl bg-card border border-border/80 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-foreground ${
                    isOutgoing ? "right-0" : "right-0 sm:left-0 sm:right-auto"
                  }`}
                >
                  {/* 1. Balas / Reply */}
                  <button
                    type="button"
                    onClick={handleReply}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                  >
                    <IconArrowBackUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Balas</span>
                  </button>

                  {/* 2. Sematkan / Lepas Sematan (WhatsApp Pin) */}
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                  >
                    {message.isPinned ? (
                      <>
                        <IconPinFilled className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Lepas Sematan</span>
                      </>
                    ) : (
                      <>
                        <IconPin className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Sematkan Pesan</span>
                      </>
                    )}
                  </button>

                  {/* 3. Salin Teks */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                  >
                    <IconCopy className="h-4 w-4 text-sky-500 shrink-0" />
                    <span>Salin Teks</span>
                  </button>

                  {/* 4. Hapus Pesan */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                    >
                      <IconTrash className="h-4 w-4 shrink-0" />
                      <span>Hapus Pesan</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Incoming Header: Sender Name & Unit Badge */}
        {!isOutgoing && !isDeleted && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap pr-7">
            <span
              className={`text-xs font-bold tracking-tight ${getSenderColor(
                message.senderName,
                message.senderId
              )}`}
            >
              {message.senderName}
            </span>

            {/* Room / Role Badge */}
            {message.senderUnitNumber ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-foreground/80 border border-border/60">
                Kamar {message.senderUnitNumber}
              </span>
            ) : message.senderRole === "OWNER" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Pemilik Kos
              </span>
            ) : message.senderRole === "HOUSEKEEPING" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                Pengelola
              </span>
            ) : null}
          </div>
        )}

        {/* Quoted Message / Reply Preview (WhatsApp style quote block) */}
        {!isDeleted && message.replyToContent && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (message.replyToId) {
                onJumpToMessage?.(message.replyToId);
              }
            }}
            className="cursor-pointer mb-2 p-2 rounded-xl bg-black/5 dark:bg-white/10 border-l-4 border-[#8FA28A] text-left select-none hover:bg-black/10 dark:hover:bg-white/15 transition-colors pr-7"
            title="Klik untuk melompat ke pesan asli"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4D634B] dark:text-emerald-300">
              <IconArrowBackUp className="h-3 w-3 shrink-0" />
              <span>{message.replyToSenderName || "Warga Kost"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate line-clamp-1 mt-0.5">
              {message.replyToContent}
            </p>
          </div>
        )}

        {/* Message Content or Deleted Placeholder */}
        {isDeleted ? (
          <div className="flex items-center gap-1.5 italic text-muted-foreground/80 text-xs sm:text-[13px] py-0.5 pr-10">
            <IconBan className="h-3.5 w-3.5 shrink-0" />
            <span>🚫 Pesan ini telah dihapus</span>
          </div>
        ) : (
          <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words pr-7">
            {message.content}
          </div>
        )}

        {/* Copied Toast Indicator */}
        {copiedToast && (
          <span className="absolute -top-7 right-2 px-2.5 py-0.5 rounded-md bg-black/85 text-white text-[10px] font-bold shadow-md animate-in fade-in">
            Tersalin!
          </span>
        )}

        {/* Timestamp & Status Icon in Bottom Right */}
        <div className="flex items-center justify-end gap-1 select-none mt-1 pt-0.5">
          {message.isPinned && (
            <span
              className="inline-flex items-center text-amber-600 dark:text-amber-400 mr-0.5"
              title="Pesan Tersemat"
            >
              <IconPinFilled className="h-3 w-3 shrink-0" />
            </span>
          )}

          <span
            className={`text-[10px] font-medium ${
              isOutgoing
                ? "text-[#4A5D48] dark:text-emerald-300/70"
                : "text-muted-foreground"
            }`}
          >
            {timeFormatted}
          </span>

          {/* Outgoing Status Indicators (Ceklis 1, Ceklis 2 ga biru, Ceklis 2 biru) */}
          {isOutgoing && !isDeleted && (
            <span className="inline-flex items-center ml-0.5">
              {message.pending ? (
                <IconClock
                  className="h-3 w-3 text-[#4A5D48] animate-spin"
                  title="Sedang mengirim..."
                />
              ) : message.error ? (
                <IconAlertCircle
                  className="h-3.5 w-3.5 text-rose-500"
                  title="Gagal terkirim"
                />
              ) : message.readStatus === "READ_ALL" ? (
                // CEKLIS 2 BIRU (Sudah dibaca oleh SEMUA warga)
                <span
                  className="inline-flex items-center"
                  title={`Ceklis 2 Biru • Dibaca oleh semua warga (${message.totalRecipients || 0}/${message.totalRecipients || 0})`}
                >
                  <IconChecks className="h-3.5 w-3.5 text-[#53BDEB] stroke-[2.5]" />
                </span>
              ) : message.readStatus === "DELIVERED" ? (
                // CEKLIS 2 GA BIRU / ABU-ABU (Sebagian warga sudah membaca)
                <span
                  className="inline-flex items-center"
                  title={`Ceklis 2 Abu-abu • Terkirim & dibaca ${message.readCount || 0} warga`}
                >
                  <IconChecks className="h-3.5 w-3.5 text-muted-foreground/70 stroke-[2]" />
                </span>
              ) : (
                // CEKLIS 1 (Terkirim ke server, belum ada yang membaca)
                <span
                  className="inline-flex items-center"
                  title="Ceklis 1 • Terkirim ke grup"
                >
                  <IconCheck className="h-3.5 w-3.5 text-muted-foreground/70 stroke-[2]" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

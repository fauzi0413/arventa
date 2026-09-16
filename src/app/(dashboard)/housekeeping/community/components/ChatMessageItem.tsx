"use client";

import React from "react";
import {
  IconCheck,
  IconChecks,
  IconClock,
  IconAlertCircle,
  IconSpeakerphone,
  IconDoorEnter,
  IconDoorExit,
  IconSparkles,
  IconPin,
  IconPinFilled,
} from "@tabler/icons-react";
import { PropertyChatMessageItem } from "../types/chat";

interface ChatMessageItemProps {
  message: PropertyChatMessageItem;
  currentUserId: string;
  currentUserRole?: string;
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
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
}: ChatMessageItemProps) {
  const isOutgoing = message.senderId === currentUserId;
  const timeFormatted = formatMessageTime(message.createdAt);
  const isAdmin =
    currentUserRole === "OWNER" ||
    currentUserRole === "HOUSEKEEPING" ||
    currentUserRole === "PLATFORM_ADMIN";

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
        <div className="relative max-w-xl w-full p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500/30 shadow-md text-amber-950 dark:text-amber-100 space-y-2">
          <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
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
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium opacity-80">{timeFormatted}</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    message.isPinned
                      ? onUnpinMessage?.(message.id)
                      : onPinMessage?.(message.id)
                  }
                  className="p-1 rounded-md hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors ml-1"
                  title={message.isPinned ? "Lepas Sematan (Unpin)" : "Sematkan Pengumuman (Pin)"}
                >
                  {message.isPinned ? (
                    <IconPinFilled className="h-3.5 w-3.5" />
                  ) : (
                    <IconPin className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
            {message.content}
          </p>
          <div className="text-[11px] text-right font-semibold text-amber-700 dark:text-amber-400">
            — {message.senderName} ({message.senderRole})
          </div>
        </div>
      </div>
    );
  }

  // 4. REGULAR CHAT MESSAGE (Outgoing vs Incoming)
  return (
    <div
      id={`msg-${message.id}`}
      className={`flex w-full mb-3.5 transition-all duration-500 rounded-2xl ${
        isOutgoing ? "justify-end" : "justify-start"
      } animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <div
        className={`relative group max-w-[85%] sm:max-w-md md:max-w-lg p-3 sm:px-4 sm:py-3 shadow-xs transition-shadow ${
          isOutgoing
            ? "bg-[#D6E4D3] dark:bg-[#1C3621] text-foreground dark:text-emerald-50 rounded-2xl rounded-tr-xs border border-[#8FA28A]/40 dark:border-[#8FA28A]/25"
            : "bg-card dark:bg-[#222822] text-foreground rounded-2xl rounded-tl-xs border border-border/80 dark:border-[#333D33]"
        }`}
      >
        {/* Pinned Badge & Admin Action Header */}
        <div className="flex items-center justify-between gap-2 mb-1">
          {message.isPinned ? (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
              <IconPinFilled className="h-3 w-3 shrink-0" />
              <span>Disematkan</span>
            </div>
          ) : (
            <div />
          )}

          {/* Admin Pin/Unpin Action Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                message.isPinned
                  ? onUnpinMessage?.(message.id)
                  : onPinMessage?.(message.id)
              }
              className={`p-1 rounded-md transition-all ${
                message.isPinned
                  ? "text-amber-600 dark:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10"
                  : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-600 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              title={message.isPinned ? "Lepas Sematan (Unpin)" : "Sematkan Pesan (Pin)"}
            >
              {message.isPinned ? (
                <IconPinFilled className="h-3.5 w-3.5" />
              ) : (
                <IconPin className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Incoming Header: Sender Name & Unit Badge */}
        {!isOutgoing && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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

        {/* Message Content */}
        <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words pr-12">
          {message.content}
        </div>

        {/* Timestamp & Status Icon in Bottom Right */}
        <div className="absolute right-2.5 bottom-1.5 flex items-center gap-1 select-none">
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
          {isOutgoing && (
            <span className="inline-flex items-center">
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
                  title={`Ceklis 2 Abu-abu • Sebagian membaca (${message.readCount || 1}/${message.totalRecipients || 1} warga)`}
                >
                  <IconChecks className="h-3.5 w-3.5 text-[#4A5D48]/70 dark:text-emerald-300/60" />
                </span>
              ) : (
                // CEKLIS 1 (Terkirim ke server, belum ada warga yang membaca)
                <span
                  className="inline-flex items-center"
                  title="Ceklis 1 • Terkirim ke server (Belum ada warga yang membaca)"
                >
                  <IconCheck className="h-3.5 w-3.5 text-[#4A5D48]/70 dark:text-emerald-300/60" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

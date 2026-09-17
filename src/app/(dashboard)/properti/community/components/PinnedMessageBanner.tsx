"use client";

import React, { useState } from "react";
import {
  IconPin,
  IconPinFilled,
  IconX,
  IconChevronRight,
  IconChevronLeft,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { PropertyChatMessageItem } from "../types/chat";

interface PinnedMessageBannerProps {
  pinnedMessages: PropertyChatMessageItem[];
  isAdmin: boolean;
  onJumpToMessage: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
}

export function PinnedMessageBanner({
  pinnedMessages,
  isAdmin,
  onJumpToMessage,
  onUnpinMessage,
}: PinnedMessageBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  // Ensure index within range
  const activeMsg = pinnedMessages[Math.min(currentIndex, pinnedMessages.length - 1)];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnpinMessage && activeMsg) {
      onUnpinMessage(activeMsg.id);
    }
  };

  return (
    <div className="relative z-10 mx-1 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        onClick={() => onJumpToMessage(activeMsg.id)}
        className="group cursor-pointer flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#E8EFE6]/90 dark:bg-[#1E291F]/90 border border-[#8FA28A]/40 shadow-xs hover:border-[#8FA28A] transition-all backdrop-blur-xs"
      >
        {/* Left: Pin Icon & Text */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8FA28A] text-white shadow-2xs">
            <IconPinFilled className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#4D634B] dark:text-emerald-400">
                Pesan Tersemat
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-bold text-foreground truncate max-w-[160px]">
                {activeMsg.senderName || "Pengelola"}
              </span>
              {pinnedMessages.length > 1 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-card border border-border text-muted-foreground">
                  {currentIndex + 1}/{pinnedMessages.length}
                </span>
              )}
            </div>

            <p className="text-xs text-foreground/90 truncate mt-0.5 font-medium leading-tight">
              {activeMsg.content.replace(/^📢 PENGUMUMAN RESMI:\s*/i, "")}
            </p>
          </div>
        </div>

        {/* Right: Navigation (if >1) & Unpin Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {pinnedMessages.length > 1 && (
            <div className="flex items-center gap-0.5 mr-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                title="Pesan tersemat sebelumnya"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                title="Pesan tersemat berikutnya"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Jump Hint */}
          <span className="hidden sm:inline-block text-[11px] font-bold text-[#4D634B] dark:text-emerald-400 group-hover:underline">
            Lihat Pesan
          </span>

          {/* Admin Unpin Button */}
          {isAdmin && onUnpinMessage && (
            <button
              type="button"
              onClick={handleUnpin}
              className="p-1.5 rounded-xl hover:bg-rose-500/15 text-muted-foreground hover:text-rose-600 transition-colors ml-1"
              title="Lepas sematan pesan (Unpin)"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

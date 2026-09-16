"use client";

import React, { useEffect, useRef, useState } from "react";
import { IconMessages, IconArrowDown } from "@tabler/icons-react";
import { PropertyChatMessageItem } from "../types/chat";
import { ChatMessageItem } from "./ChatMessageItem";

interface ChatMessageListProps {
  messages: PropertyChatMessageItem[];
  currentUserId: string;
  currentUserRole?: string;
  loading: boolean;
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
}

// Group messages by date string (e.g. "Hari Ini", "Kemarin", or "16 September 2026")
function getDateHeader(dateString: string): string {
  try {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return "Hari Ini";
    }

    if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return "Kemarin";
    }

    return messageDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Lainnya";
  }
}

export function ChatMessageList({
  messages,
  currentUserId,
  currentUserRole,
  loading,
  onPinMessage,
  onUnpinMessage,
}: ChatMessageListProps) {
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on initial load or new message
  useEffect(() => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;

    // If already near bottom or few messages, smooth scroll
    if (isNearBottom || messages.length <= 10) {
      scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group messages by day
  const groupedMessages: { date: string; items: PropertyChatMessageItem[] }[] = [];
  let currentDate = "";
  let currentGroup: PropertyChatMessageItem[] = [];

  messages.forEach((msg) => {
    const dateLabel = getDateHeader(msg.createdAt);
    if (dateLabel !== currentDate) {
      if (currentGroup.length > 0) {
        groupedMessages.push({ date: currentDate, items: currentGroup });
      }
      currentDate = dateLabel;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groupedMessages.push({ date: currentDate, items: currentGroup });
  }

  return (
    <div className="relative flex-1 min-h-0">
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 sm:px-6 py-6 space-y-4 rounded-3xl bg-[#F6F4EE]/70 dark:bg-[#151915]/80 border border-border/70 shadow-inner"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(143, 162, 138, 0.08) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      >
        {loading ? (
          // Loading Skeleton
          <div className="space-y-4 py-8 max-w-lg mx-auto animate-pulse">
            <div className="flex justify-center">
              <div className="h-6 w-32 bg-muted rounded-full" />
            </div>
            <div className="flex justify-start">
              <div className="h-16 w-64 bg-card rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <div className="h-12 w-56 bg-[#8FA28A]/20 rounded-2xl" />
            </div>
            <div className="flex justify-start">
              <div className="h-20 w-72 bg-card rounded-2xl" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center min-h-[350px] text-center p-8 space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#8FA28A]/15 text-[#8FA28A] border border-[#8FA28A]/30">
              <IconMessages className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">
                Grup Obrolan Kost Telah Siap
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Belum ada obrolan di grup warga kost ini. Mulai percakapan pertama, sapa
                tetangga sebelah, atau tanyakan info seputar kos!
              </p>
            </div>
          </div>
        ) : (
          // Grouped Messages List
          groupedMessages.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Date Separator Badge */}
              <div className="sticky top-2 z-10 flex justify-center py-2 pointer-events-none">
                <span className="px-3.5 py-1 rounded-xl bg-card/90 dark:bg-[#1E231E]/90 border border-border/80 text-[11px] font-bold text-muted-foreground shadow-xs backdrop-blur-xs pointer-events-auto">
                  {group.date}
                </span>
              </div>

              {/* Messages in this date */}
              <div className="space-y-1">
                {group.items.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onPinMessage={onPinMessage}
                    onUnpinMessage={onUnpinMessage}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={scrollBottomRef} className="h-1" />
      </div>

      {/* Floating Scroll To Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-xl hover:bg-muted transition-all active:scale-95 animate-in fade-in zoom-in-95"
          title="Geser ke pesan terbaru"
        >
          <IconArrowDown className="h-5 w-5 text-[#8FA28A]" />
        </button>
      )}
    </div>
  );
}

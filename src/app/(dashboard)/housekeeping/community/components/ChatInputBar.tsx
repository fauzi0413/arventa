"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  IconSend,
  IconLoader2,
  IconSparkles,
  IconMoodSmile,
  IconArrowBackUp,
  IconX,
} from "@tabler/icons-react";

interface ReplyToContext {
  id: string;
  content: string;
  senderName: string;
}

interface ChatInputBarProps {
  onSendMessage: (
    content: string,
    replyTo?: ReplyToContext
  ) => Promise<boolean | void>;
  sending: boolean;
  disabled?: boolean;
  replyingTo?: ReplyToContext | null;
  onCancelReply?: () => void;
}

const QUICK_PROMPTS = [
  "👋 Halo semuanya!",
  "📦 Ada paket di depan ya",
  "🙏 Terima kasih banyak!",
  "💡 Mau tanya info jemuran",
];

const EMOJI_CATEGORIES = [
  {
    id: "popular",
    name: "Populer",
    emojis: ["👍", "🙏", "👋", "❤️", "😂", "📦", "🏠", "💡", "⚡", "🧹", "🚪", "🔑"],
  },
  {
    id: "expression",
    name: "Ekspresi",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😜", "🤪",
      "😎", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🥺", "😢",
      "😭", "😤", "😠", "😡", "🤯", "😳", "🥵", "🥶", "😱", "😨",
      "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐",
      "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴",
    ],
  },
  {
    id: "hands",
    name: "Tangan",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
      "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍",
      "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
      "🙏", "✍️", "💪", "🫶",
    ],
  },
  {
    id: "kost",
    name: "Kost",
    emojis: [
      "🏠", "🏡", "🏢", "🛏️", "🚪", "🔑", "📦", "🧹", "🪣", "🚿",
      "🛁", "🚽", "💡", "🔌", "🔋", "📺", "🧺", "🍽️", "☕", "🍜",
      "🛵", "🚗", "🚲", "🅿️", "📶", "🛒", "🗑️", "🧯",
    ],
  },
  {
    id: "symbols",
    name: "Simbol",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️",
      "💕", "💞", "💓", "💗", "💖", "✨", "⭐", "🌟", "💫", "🔥",
      "💥", "🎉", "🎊", "⚠️", "📢", "🚨", "✅", "❌", "❓", "❗",
      "💯", "🕒", "📅",
    ],
  },
];

export function ChatInputBar({
  onSendMessage,
  sending,
  disabled = false,
  replyingTo = null,
  onCancelReply,
}: ChatInputBarProps) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState("popular");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showEmojiPicker]);

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;
    const content = text;
    const currentReply = replyingTo || undefined;

    setText("");
    setShowEmojiPicker(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const ok = await onSendMessage(content, currentReply);
    if (ok === false) {
      // If failed, restore text so user doesn't lose it
      setText(content);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setText((prev) => (prev ? `${prev} ${prompt}` : prompt));
    textareaRef.current?.focus();
  };

  // Insert emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setText((prev) => prev + emoji);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextText = text.substring(0, start) + emoji + text.substring(end);
    setText(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Auto-resize textarea up to 120px
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const selectedCategory =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div className="space-y-2 pt-2">
      {/* 1. WhatsApp Quoted Reply Bar (when user replies to a message) */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border-l-4 border-[#8FA28A] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4D634B] dark:text-emerald-300">
              <IconArrowBackUp className="h-3.5 w-3.5" />
              <span>Membalas {replyingTo.senderName}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
              {replyingTo.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
            title="Batal membalas"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Quick Prompts Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1 px-1">
          <IconSparkles className="h-3 w-3 text-[#8FA28A]" />
          <span>Sapa Cepat:</span>
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-card hover:bg-[#8FA28A]/15 hover:text-[#8FA28A] border border-border/80 text-foreground text-xs font-medium transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 3. Main Input Bar & Emoji Keyboard Picker */}
      <div className="relative flex items-end gap-2 p-2 rounded-3xl bg-card border border-border/80 shadow-md focus-within:border-[#8FA28A] focus-within:ring-2 focus-within:ring-[#8FA28A]/20 transition-all">
        {/* Emoji Button & Floating Picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
              showEmojiPicker
                ? "bg-[#8FA28A] text-white shadow-sm"
                : "text-[#4D634B] dark:text-[#8FA28A] bg-[#8FA28A]/15 hover:bg-[#8FA28A]/25"
            }`}
            title="Buka Papan Emoji (Keyboard)"
          >
            <IconMoodSmile className="h-6 w-6" />
          </button>

          {/* Floating Emoji Keyboard Popover */}
          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div
                ref={pickerRef}
                className="absolute bottom-14 left-0 z-50 w-72 sm:w-80 rounded-3xl bg-card border border-border p-3 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-150 space-y-2.5"
              >
                {/* Category Header Tabs */}
                <div className="flex items-center gap-1 border-b border-border/60 pb-2 overflow-x-auto scrollbar-none">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                        activeCategory === cat.id
                          ? "bg-[#8FA28A] text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Emojis Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {selectedCategory.emojis.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="flex h-9 w-9 items-center justify-center text-lg rounded-xl hover:bg-muted active:scale-125 transition-transform select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-muted-foreground text-center border-t border-border/60 pt-1.5">
                  Klik emoji untuk memasukkan ke pesan
                </div>
              </div>
            </>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder={
            replyingTo
              ? `Tulis balasan untuk ${replyingTo.senderName}...`
              : "Ketik pesan untuk warga kost... (Enter kirim, Shift+Enter baris baru)"
          }
          rows={1}
          className="flex-1 max-h-32 min-h-[44px] py-2.5 px-2 bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm resize-none focus:outline-hidden disabled:opacity-50"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8FA28A] hover:bg-[#7D9178] text-white shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#8FA28A]"
          title="Kirim pesan"
        >
          {sending ? (
            <IconLoader2 className="h-5 w-5 animate-spin" />
          ) : (
            <IconSend className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Subtle Hint */}
      <div className="flex justify-between items-center px-3 text-[10px] text-muted-foreground">
        <span>Tekan <b>Enter</b> untuk kirim pesan • <b>Shift + Enter</b> untuk baris baru</span>
        <span>{text.length} karakter</span>
      </div>
    </div>
  );
}

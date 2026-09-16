"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { IconSend, IconLoader2, IconSparkles } from "@tabler/icons-react";

interface ChatInputBarProps {
  onSendMessage: (content: string) => Promise<boolean | void>;
  sending: boolean;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  "👋 Halo semuanya!",
  "📦 Ada paket di depan ya",
  "🙏 Terima kasih banyak!",
  "💡 Mau tanya info jemuran",
];

export function ChatInputBar({
  onSendMessage,
  sending,
  disabled = false,
}: ChatInputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;
    const content = text;
    setText("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const ok = await onSendMessage(content);
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

  // Auto-resize textarea up to 120px
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="space-y-2 pt-2">
      {/* Quick Prompts Carousel */}
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

      {/* Main Input Bar */}
      <div className="flex items-end gap-2 p-2 rounded-3xl bg-card border border-border/80 shadow-md focus-within:border-[#8FA28A] focus-within:ring-2 focus-within:ring-[#8FA28A]/20 transition-all">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Ketik pesan untuk warga kost... (Enter kirim, Shift+Enter baris baru)"
          rows={1}
          className="flex-1 max-h-32 min-h-[44px] py-2.5 px-4 bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm resize-none focus:outline-hidden disabled:opacity-50"
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

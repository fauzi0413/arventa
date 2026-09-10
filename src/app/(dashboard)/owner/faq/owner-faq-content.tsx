"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { type FaqItem } from "@/components/ui/faq-tabs";
import {
  IconHelpCircle,
  IconLoader2,
  IconThumbUp,
  IconThumbDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function OwnerFaqContent() {
  const [faqCategories, setFaqCategories] = useState<Record<string, string>>({});
  const [faqData, setFaqData] = useState<Record<string, FaqItem[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const role = user?.user_metadata?.role || "OWNER";

        const res = await fetch(`/api/faq?role=${role}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;

        const cats: Record<string, string> = {};
        const catList = json.data.categories as string[];
        for (const cat of catList) {
          cats[cat] = cat
            .split(" ")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
        }
        setFaqCategories(cats);
        setFaqData(json.data.faqs);
        if (catList.length > 0) {
          setSelectedCategory(catList[0]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  const categoryKeys = Object.keys(faqCategories);
  const currentQuestions = faqData[selectedCategory] || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A]">
          <IconHelpCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">FAQ & Bantuan</h1>
          <p className="text-sm text-muted-foreground">
            Pertanyaan yang sering ditanyakan seputar penggunaan ARVENTA.
          </p>
        </div>
      </div>

      {/* Main FAQ Container Card */}
      <div className="rounded-2xl sm:rounded-3xl border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 text-muted-foreground">
            <IconLoader2 className="h-8 w-8 animate-spin text-[#8FA28A]" />
            <p className="text-sm font-semibold">Memuat pusat bantuan FAQ...</p>
          </div>
        ) : categoryKeys.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Filter Kategori (Membungkus ke bawah jika banyak, tetap di tengah, tidak kepotong) */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {Object.entries(faqCategories).map(([key, label]) => {
                const isActive = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={cn(
                      "px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none",
                      isActive
                        ? "bg-[#8FA28A] text-white shadow-sm ring-2 ring-[#8FA28A]/20"
                        : "border border-[#C7D3C0]/80 bg-white text-[#2F332E]/80 hover:border-[#8FA28A] hover:text-[#2F332E]"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 2. Layout Konten: Kolom Kiri Judul Kategori Besar & Kolom Kanan Accordion */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-10 lg:gap-12 items-start pt-1 sm:pt-2">
              {/* Kolom Kiri: Judul Kategori Besar */}
              <div className="md:col-span-4 lg:col-span-4 md:sticky md:top-24 space-y-1 sm:space-y-2 md:pt-3 pb-3 md:pb-0 border-b border-border/40 md:border-b-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                  {faqCategories[selectedCategory] || selectedCategory}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {currentQuestions.length} pertanyaan terkait topik ini.
                </p>
              </div>

              {/* Kolom Kanan: Daftar Accordion FAQ */}
              <div className="md:col-span-8 lg:col-span-8 space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="space-y-3"
                  >
                    {currentQuestions.map((faq) => (
                      <OwnerFaqItem key={faq.id} faq={faq} />
                    ))}

                    {currentQuestions.length === 0 && (
                      <div className="rounded-2xl border border-dashed p-6 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">
                        Belum ada pertanyaan pada topik ini.
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 text-muted-foreground">
            <IconHelpCircle className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground/40" />
            <p className="text-xs sm:text-sm font-semibold">Belum ada data FAQ yang tersedia saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerFaqItem({ faq }: { faq: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden",
        isOpen
          ? "bg-[#8FA28A]/5 border-[#8FA28A]/35 shadow-xs"
          : "bg-white border-[#C7D3C0]/50 hover:border-[#8FA28A]/40 shadow-xs"
      )}
    >
      {/* Question Row Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 text-left cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "text-xs sm:text-sm md:text-base font-bold leading-snug transition-colors",
            isOpen ? "text-[#2F332E]" : "text-[#2F332E]/90"
          )}
        >
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground/80 ml-2"
        >
          <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
        </motion.span>
      </button>

      {/* Expandable Answer Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border/30">
              {faq.answer}
            </div>

            {/* Helpfulness Feedback Bar */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-muted/20 border-t border-border/30 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Apakah informasi ini membantu?</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedback("yes");
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                    feedback === "yes"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                      : "hover:bg-background text-muted-foreground border-border/60"
                  )}
                >
                  <IconThumbUp className="size-3.5" />
                  <span>Ya</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedback("no");
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                    feedback === "no"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40"
                      : "hover:bg-background text-muted-foreground border-border/60"
                  )}
                >
                  <IconThumbDown className="size-3.5" />
                  <span>Tidak</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


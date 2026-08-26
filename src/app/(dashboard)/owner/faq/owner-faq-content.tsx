"use client";

import React, { useEffect, useState } from "react";
import { FAQ, type FaqItem } from "@/components/ui/faq-tabs";
import { IconHelpCircle, IconLoader } from "@tabler/icons-react";

export function OwnerFaqContent() {
  const [faqCategories, setFaqCategories] = useState<Record<string, string>>({});
  const [faqData, setFaqData] = useState<Record<string, FaqItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await fetch("/api/faq");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;

        const cats: Record<string, string> = {};
        for (const cat of json.data.categories as string[]) {
          cats[cat] = cat
            .split(" ")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
        }
        setFaqCategories(cats);
        setFaqData(json.data.faqs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#8FA28A]/10">
          <IconHelpCircle className="h-6 w-6 text-[#8FA28A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQ & Bantuan</h1>
          <p className="text-sm text-muted-foreground">
            Pertanyaan yang sering ditanyakan seputar penggunaan ARVENTA.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconLoader className="h-8 w-8 animate-spin text-[#8FA28A]" />
            <p className="text-sm text-muted-foreground">Memuat FAQ...</p>
          </div>
        ) : Object.keys(faqCategories).length > 0 ? (
          <FAQ
            title="FAQ"
            subtitle="Pertanyaan yang Sering Ditanyakan"
            categories={faqCategories}
            faqData={faqData}
            className="py-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconHelpCircle className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada FAQ tersedia saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  targetRole: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FAQProps {
  title?: string;
  subtitle?: string;
  description?: string;
  categories: Record<string, string>;
  faqData: Record<string, FaqItem[]>;
  className?: string;
}

export const FAQ = ({
  title = "FAQ",
  subtitle = "Pertanyaan yang Sering Ditanyakan",
  description,
  categories,
  faqData,
  className,
}: FAQProps) => {
  const categoryKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0] ?? "");

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-transparent px-4 py-12 text-[#2F332E]",
        className
      )}
    >
      <FAQHeader title={title} subtitle={subtitle} description={description} />
      <FAQTabs
        categories={categories}
        selected={selectedCategory}
        setSelected={setSelectedCategory}
      />
      <FAQList faqData={faqData} selected={selectedCategory} />
    </section>
  );
};

const FAQHeader = ({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description?: string;
}) => (
  <div className="relative z-10 flex flex-col items-center justify-center mb-10 text-center space-y-3">
    <ScrollReveal y={20} blur={4}>
      <span className="inline-block px-3 py-1 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] text-[11px] font-extrabold uppercase tracking-wider">
        {subtitle}
      </span>
    </ScrollReveal>
    <ScrollReveal y={24} blur={4}>
      <h2 className="text-2xl md:text-4xl font-black text-[#2F332E] text-center">{title}</h2>
    </ScrollReveal>
    {description && (
      <ScrollReveal y={24} blur={4}>
        <p className="text-xs md:text-sm text-gray-500 max-w-2xl mx-auto text-center leading-relaxed">
          {description}
        </p>
      </ScrollReveal>
    )}
  </div>
);

const FAQTabs = ({
  categories,
  selected,
  setSelected,
}: {
  categories: Record<string, string>;
  selected: string;
  setSelected: (key: string) => void;
}) => (
  <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mb-2">
    {Object.entries(categories).map(([key, label]) => (
      <button
        key={key}
        onClick={() => setSelected(key)}
        className={cn(
          "relative overflow-hidden whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold transition-colors duration-300",
          selected === key
            ? "border-[#8FA28A] text-white"
            : "border-[#C7D3C0] bg-white text-[#8FA28A] hover:border-[#8FA28A]"
        )}
      >
        <span className="relative z-10">{label}</span>
        <AnimatePresence>
          {selected === key && (
            <motion.span
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: "backIn" }}
              className="absolute inset-0 z-0 bg-[#8FA28A]"
            />
          )}
        </AnimatePresence>
      </button>
    ))}
  </div>
);

const FAQList = ({
  faqData,
  selected,
}: {
  faqData: Record<string, FaqItem[]>;
  selected: string;
}) => (
  <div className="mx-auto mt-8 max-w-3xl">
    <AnimatePresence mode="wait">
      {Object.entries(faqData).map(([category, questions]) => {
        if (selected !== category) return null;
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-3"
          >
            {questions.map((faq) => (
              <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
            ))}
            {questions.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                Belum ada FAQ di kategori ini.
              </p>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      animate={isOpen ? "open" : "closed"}
      className={cn(
        "rounded-2xl border transition-colors",
        isOpen ? "bg-[#8FA28A]/5 border-[#8FA28A]/30" : "bg-white border-[#C7D3C0]/40"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start justify-between gap-4 p-4 sm:p-5 text-left"
      >
        <span
          className={cn(
            "text-sm sm:text-base font-semibold transition-colors leading-snug",
            isOpen ? "text-[#2F332E]" : "text-[#2F332E]/80"
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{ open: { rotate: "45deg" }, closed: { rotate: "0deg" } }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <Plus
            className={cn(
              "h-5 w-5 transition-colors",
              isOpen ? "text-[#8FA28A]" : "text-gray-400"
            )}
          />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : "0px",
          marginBottom: isOpen ? "16px" : "0px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden px-4 sm:px-5"
      >
        <p
          className="text-sm text-gray-500 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </motion.div>
    </motion.div>
  );
};

"use client";

import React from "react";
import {
  IconMessageCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconMessages,
} from "@tabler/icons-react";
import { ForumMetrics } from "../types";

interface ForumMetricCardsProps {
  metrics: ForumMetrics;
}

export function ForumMetricCards({ metrics }: ForumMetricCardsProps) {
  const cards = [
    {
      label: "Total Diskusi & Topik",
      value: metrics.totalPosts,
      icon: IconMessageCircle,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      desc: "Semua utas diskusi terdaftar",
    },
    {
      label: "Keluhan Butuh Respon",
      value: metrics.activeComplaintsCount,
      icon: IconAlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      desc: "Keluhan belum selesai",
      highlight: metrics.activeComplaintsCount > 0,
    },
    {
      label: "Keluhan Selesai Ditangani",
      value: metrics.resolvedComplaintsCount,
      icon: IconCircleCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      desc: "Keluhan berhasil diselesaikan",
    },
    {
      label: "Total Balasan & Respon",
      value: metrics.totalRepliesCount,
      icon: IconMessages,
      color: "text-[#8FA28A]",
      bg: "bg-[#8FA28A]/10",
      borderColor: "border-[#8FA28A]/20",
      desc: "Komentar aktif dari penghuni & staf",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md ${
              card.highlight
                ? "border-amber-500/40 dark:border-amber-500/30"
                : "border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {card.label}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} ${card.color}`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {card.value}
              </span>
              {card.highlight && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Perlu Ditangani
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {card.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import {
  IconMessageCircle,
  IconSparkles,
  IconMessages,
  IconUsers,
} from "@tabler/icons-react";
import { ForumMetrics } from "../types";

interface ForumMetricCardsProps {
  metrics: ForumMetrics;
}

export function ForumMetricCards({ metrics }: ForumMetricCardsProps) {
  const cards = [
    {
      label: "Total Diskusi Komunitas",
      value: metrics.totalPosts,
      icon: IconMessages,
      color: "text-[#8FA28A]",
      bg: "bg-[#8FA28A]/10",
      borderColor: "border-[#8FA28A]/20",
      desc: "Semua utas obrolan & pengumuman warga",
    },
    {
      label: "Sambutan Warga Baru",
      value: metrics.welcomePostsCount,
      icon: IconSparkles,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      desc: "Sambutan otomatis tetangga baru",
    },
    {
      label: "Topik Diskusi & QnA",
      value: metrics.discussionsCount,
      icon: IconMessageCircle,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      desc: "Obrolan santai, tanya-jawab, & info",
    },
    {
      label: "Total Balasan & Sapaan",
      value: metrics.totalRepliesCount,
      icon: IconUsers,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      desc: "Interaksi aktif warga & pengelola",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80"
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

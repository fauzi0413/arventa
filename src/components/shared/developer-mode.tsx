"use client";

import Link from "next/link";
import { IconCode, IconArrowLeft, IconSparkles, IconTerminal2 } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeveloperModeProps {
  title: string;
  path: string;
  description?: string;
  features?: string[];
}

export function DeveloperModePlaceholder({
  title,
  path,
  description = "Halaman ini sedang dalam tahap pengembangan (Developer Mode). Modul ini akan segera tersedia secara penuh pada pembaruan mendatang.",
  features = ["Modul Spesifikasi API Active", "Database Seeder Synchronized", "Role Permission Guard Active"],
}: DeveloperModeProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Developer Banner */}
      <Card className="border-border/60 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-purple-600" />
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs gap-1.5 px-3 py-1 font-bold">
              <IconCode className="size-4" /> MODE PENGEMBANG (DEVELOPER MODE)
            </Badge>
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              Path: {path}
            </span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-6">
          {/* Feature Readiness Info */}
          <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IconTerminal2 className="size-4 text-primary" /> Status Modul & Integrasi
            </span>
            <div className="grid gap-2 sm:grid-cols-3">
              {features.map((feat) => (
                <div key={feat} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-xs font-semibold text-foreground shadow-sm">
                  <IconSparkles className="size-4 text-amber-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "font-bold text-xs gap-2"
              )}
            >
              <IconArrowLeft className="size-4" /> Kembali ke Dashboard Utama
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

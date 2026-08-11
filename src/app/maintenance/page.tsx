"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconPower, IconArrowLeft, IconTools, IconShieldCheck, IconRefresh, IconLoader2, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MaintenancePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkMaintenanceStatus = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/system/maintenance-status", { cache: "no-store" });
      const json = await res.json();

      if (json.success && !json.data.isMaintenance) {
        setStatusMessage("Sistem kembali ONLINE! Mengalihkan ke aplikasi...");
        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      } else {
        setStatusMessage("Sistem masih dalam pemeliharaan. Silakan coba lagi nanti.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Gagal mengecek status. Coba lagi dalam beberapa saat.");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check maintenance status on page load
    checkMaintenanceStatus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 size-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        {/* Icon Badge */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-xl shadow-amber-500/5 animate-pulse">
          <IconTools className="size-10" />
        </div>

        <div className="space-y-2">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs px-3 py-1 font-mono uppercase tracking-wider">
            <IconPower className="mr-1 size-3" /> System Under Maintenance
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sistem Sedang Dalam Pemeliharaan
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Platform <span className="font-bold text-white">ARVENTA</span> sedang mengalami pemeliharaan sistem berkala <span className="italic text-slate-300">(scheduled maintenance)</span> untuk peningkatan kecepatan, stabilitas, dan keamanan database.
          </p>
        </div>

        {/* Status Notification Message */}
        {statusMessage && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-300 animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Informative Status Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2 text-left backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 pb-1 border-b border-slate-800/80">
            <IconShieldCheck className="size-4 shrink-0 text-emerald-400" />
            <span>Data & Akses Tersimpan Aman</span>
          </div>
          <p className="text-slate-400 leading-normal pt-1">
            Akses pengguna non-admin sementara ditangguhkan sampai proses pemeliharaan selesai. Terima kasih atas kesabaran Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold gap-1.5"
            >
              <IconArrowLeft className="size-4" /> Log In Administrator
            </Button>
          </Link>

          <Button
            onClick={checkMaintenanceStatus}
            disabled={isChecking}
            className="w-full sm:w-auto bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-xs gap-1.5"
          >
            {isChecking ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconRefresh className="size-4" />
            )}
            Cek Ulang Status
          </Button>
        </div>

        <p className="text-[11px] text-slate-500 font-mono pt-4">
          &copy; 2026 ARVENTA Property Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { IconFileX, IconHome } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="size-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <IconFileX className="size-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404</h1>
          <h2 className="text-lg font-bold text-foreground">Halaman Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Maaf, halaman yang Anda cari tidak tersedia atau rute URL tidak ditemukan di sistem ARVENTA.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "font-bold text-xs gap-2"
            )}
          >
            <IconHome className="size-4" /> Kembali ke Dashboard Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

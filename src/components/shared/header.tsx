"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconMenu2,
  IconMoon,
  IconSun,
  IconLogout,
  IconUser,
  IconShield,
} from "@tabler/icons-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/roles";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Header — Top Navigation Bar with Dynamic User Profile & Logout
// ---------------------------------------------------------------------------

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setMobileMenuOpen } = useUIStore();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
          return;
        }
      } catch (err) {
        console.warn("Failed to load user profile via API:", err);
      }

      // Client-side fallback for session cookies / localStorage
      if (typeof window !== "undefined") {
        const hasSession = document.cookie.includes("arventa_session=true");
        const savedRole =
          (localStorage.getItem("arventa_user_role") as UserRole) ||
          (document.cookie
            .split("; ")
            .find((row) => row.startsWith("arventa_demo_role="))
            ?.split("=")[1] as UserRole) ||
          UserRole.OWNER;

        if (hasSession || savedRole) {
          let fullName = "Budi Santoso (Owner)";
          let email = "budi@kostsejahtera.com";
          if (savedRole === UserRole.PLATFORM_ADMIN) {
            fullName = "Super Admin Platform";
            email = "admin@arventa.id";
          } else if (savedRole === UserRole.HOUSEKEEPING) {
            fullName = "Agus (Housekeeping)";
            email = "agus.hk@arventa.id";
          } else if (savedRole === UserRole.USER || savedRole === UserRole.TENANT) {
            fullName = "Siti Rahma (Penghuni)";
            email = "siti.rahma@gmail.com";
          }

          setUser({
            id: "demo-user-id",
            email,
            fullName,
            role: savedRole,
          });
        }
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "arventa_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "arventa_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      if (typeof window !== "undefined") {
        localStorage.removeItem("arventa_user_role");
      }
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadgeClasses = (role?: UserRole) => {
    switch (role) {
      case UserRole.PLATFORM_ADMIN:
        return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 font-bold";
      case UserRole.OWNER:
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800 font-bold";
      case UserRole.HOUSEKEEPING:
        return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 font-bold";
      case UserRole.USER:
      case UserRole.TENANT:
        return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 font-bold";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileMenuOpen(true)}
      >
        <IconMenu2 className="size-5" />
        <span className="sr-only">Buka menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <IconSun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <IconMoon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Ubah tema</span>
      </Button>

      {/* User Profile & Logout */}
      {user ? (
        <div className="relative flex items-center gap-3 border-l pl-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold leading-tight text-foreground">
              {user.fullName}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>

          <Badge variant="outline" className={`hidden sm:inline-flex text-[10px] uppercase px-2 py-0.5 ${getRoleBadgeClasses(user.role)}`}>
            {user.role}
          </Badge>

          {/* Quick Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <IconLogout className="size-3.5" />
            <span>Keluar</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-l pl-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
            Masuk
          </Button>
        </div>
      )}
    </header>
  );
}

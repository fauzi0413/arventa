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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
        }
      } catch (err) {
        console.error("Failed to load user profile in header:", err);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleVariant = (role?: UserRole) => {
    switch (role) {
      case UserRole.PLATFORM_ADMIN:
        return "destructive";
      case UserRole.OWNER:
        return "default";
      case UserRole.HOUSEKEEPING:
        return "warning";
      case UserRole.USER:
        return "info";
      default:
        return "secondary";
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

          <Badge variant={getRoleVariant(user.role)} className="hidden sm:inline-flex text-[10px]">
            {user.role}
          </Badge>

          {/* Quick Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
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

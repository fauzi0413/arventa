"use client";

import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Header — Top Navigation Bar
// ---------------------------------------------------------------------------

export function Header() {
  const { theme, setTheme } = useTheme();
  const { setMobileMenuOpen } = useUIStore();

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

      {/* TODO: UserButton / Avatar with dropdown */}
    </header>
  );
}

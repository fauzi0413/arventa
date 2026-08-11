"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9 rounded-xl border-border/60 bg-background/80 backdrop-blur-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <IconSun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <IconMoon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Ubah tema</span>
    </Button>
  );
}

export default ThemeToggle;

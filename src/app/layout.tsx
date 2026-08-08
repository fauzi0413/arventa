import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NuqsProvider } from "@/components/providers/nuqs-provider";

// ---------------------------------------------------------------------------
// Font — Inter for modern SaaS look
// ---------------------------------------------------------------------------

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "ARVENTA — Property Management",
    template: "%s | ARVENTA",
  },
  description:
    "Platform SaaS manajemen properti kos, kontrakan, apartemen, dan ruko. Kelola penyewa, keuangan, dan operasional dalam satu dashboard.",
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <NuqsProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </NuqsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

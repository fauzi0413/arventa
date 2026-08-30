"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconMenu2,
  IconMoon,
  IconSun,
  IconLogout,
  IconUser,
  IconShield,
  IconX,
  IconPencil,
  IconCheck,
  IconLock,
  IconBuildingStore,
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
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Header — Top Navigation Bar with Dynamic User Profile & Logout
// ---------------------------------------------------------------------------

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { setMobileMenuOpen } = useUIStore();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const [saasPlanName, setSaasPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === UserRole.OWNER) {
      fetch("/api/owner/saas-status")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.planName) {
            setSaasPlanName(json.data.planName);
          }
        })
        .catch((err) => console.warn("Header SaaS status fetch error:", err));
    }
  }, [user]);

  const openProfileModal = () => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditPhoneNumber(user.phoneNumber || "");
    }
    setIsEditingProfile(false);
    setProfileMsg(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName || editFullName.trim() === "") {
      setProfileMsg({ type: "error", text: "Nama lengkap wajib diisi" });
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileMsg(null);
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          phoneNumber: editPhoneNumber.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setUser((prev) =>
          prev
            ? {
              ...prev,
              fullName: json.data.fullName,
              phoneNumber: json.data.phoneNumber,
            }
            : null
        );
        setProfileMsg({ type: "success", text: "Profil Anda berhasil diperbarui!" });
        setIsEditingProfile(false);
      } else {
        setProfileMsg({ type: "error", text: json.message || "Gagal memperbarui profil" });
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setProfileMsg({ type: "error", text: "Terjadi kesalahan jaringan saat menyimpan" });
    } finally {
      setIsSavingProfile(false);
    }
  };

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

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6">
      {/* Brand logo when sidebar is hidden on /owner/subscription */}
      {(pathname === "/owner/subscription" || pathname.startsWith("/owner/subscription")) && (
        <Link href="/owner/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#8FA28A] to-[#C8A96B] p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
            <div className="h-full w-full bg-background rounded-[6px] flex items-center justify-center">
              <IconBuildingStore className="h-4 w-4 text-[#C8A96B]" />
            </div>
          </div>
          <span className="text-sm font-black tracking-wide text-foreground leading-none">
            ARVENTA
          </span>
        </Link>
      )}

      {/* Mobile menu toggle */}
      {pathname !== "/owner/subscription" && !pathname.startsWith("/owner/subscription") && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <IconMenu2 className="size-5" />
          <span className="sr-only">Buka menu</span>
        </Button>
      )}

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

          {user.role === UserRole.OWNER && (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[10px] font-black uppercase px-2.5 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 shrink-0"
            >
              {saasPlanName || "Perintis"}
            </Badge>
          )}

          {/* Interactive Profile Avatar Button */}
          <button
            type="button"
            onClick={openProfileModal}
            className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-tr from-[#8FA28A] to-[#C8A96B] p-0.5 shadow-sm hover:scale-105 transition-all cursor-pointer group"
            title="Lihat Profil Saya"
          >
            <div className="h-full w-full bg-background rounded-full flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <IconUser className="h-4 w-4 text-[#8FA28A] group-hover:text-[#C8A96B] transition-colors" />
              )}
            </div>
          </button>

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

      {/* User Profile Detail Pop-Up Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 text-center">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <IconX className="h-4 w-4" />
            </button>

            {/* Avatar & Header */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#8FA28A] to-[#C8A96B] p-1 shadow-md">
                <div className="h-full w-full bg-background rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <IconUser className="h-10 w-10 text-[#8FA28A]" />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-foreground leading-tight">{user.fullName}</h3>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase px-2.5 py-0.5 border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {user.role.replace("_", " ")}
                </Badge>

                {user.role === UserRole.OWNER && (
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30">
                      {saasPlanName || "Perintis"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Toast Banner */}
            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${profileMsg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                  }`}
              >
                {profileMsg.text}
              </div>
            )}

            {/* Detail Account Info Card / Edit Form */}
            <div className="p-4 rounded-2xl bg-muted/40 text-left text-xs space-y-3 border border-border">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Nama Lengkap</span>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-56 px-2.5 py-1 rounded-lg border border-input bg-background text-xs font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#8FA28A]"
                    placeholder="Nama Lengkap"
                  />
                ) : (
                  <span className="font-bold text-foreground">{user.fullName}</span>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">No. Telepon</span>
                {isEditingProfile ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-56 px-2.5 py-1 rounded-lg border border-input bg-background text-xs font-bold text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-[#8FA28A]"
                    placeholder="08xxxxxxxxxx"
                  />
                ) : (
                  <span className="font-bold text-foreground font-mono text-[11px]">{user.phoneNumber || "-"}</span>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Email Akun</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-foreground font-mono text-[11px]">{user.email}</span>
                  {isEditingProfile && (
                    <span className="text-[9px] text-amber-600 font-extrabold flex items-center gap-0.5 ml-1">
                      <IconLock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
              </div>

              {user.role === UserRole.OWNER && (
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground font-semibold">Paket Aktif</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-black text-amber-800 dark:text-amber-300">Paket {saasPlanName || "Perintis"}</span>
                      {isEditingProfile && (
                        <span className="text-[9px] text-amber-600 font-extrabold flex items-center gap-0.5 ml-1">
                          <IconLock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                    <Link
                      href="/owner/subscription"
                      onClick={() => setShowProfileModal(false)}
                      className="text-[11px] font-black text-slate-900 dark:text-slate-100 underline hover:text-primary transition-colors cursor-pointer"
                    >
                      Upgrade Paket →
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Status Sesi</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Sesi Aktif
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {isEditingProfile ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                    disabled={isSavingProfile}
                    className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex-1 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                  >
                    <IconCheck className="size-4" />
                    <span>{isSavingProfile ? "Menyimpan..." : "Simpan Profil"}</span>
                  </Button>
                </>
              ) : (
                <>
                  {(user.role === UserRole.OWNER || user.role === UserRole.PLATFORM_ADMIN) && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40 cursor-pointer"
                    >
                      <IconPencil className="size-3.5 text-amber-600" />
                      <span>Edit Profil</span>
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowProfileModal(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex-1 py-2 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <IconLogout className="size-3.5" />
                    <span>Keluar</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

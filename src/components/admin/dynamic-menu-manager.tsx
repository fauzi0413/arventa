"use client";

import { useState, useEffect } from "react";
import {
  IconRoute,
  IconPlus,
  IconSparkles,
  IconCheck,
  IconX,
  IconLoader2,
  IconRefresh,
  IconTrash,
  IconPencil,
  IconArrowUp,
  IconArrowDown,
  IconToggleLeft,
  IconToggleRight,
  IconHome,
  IconBuildingStore,
  IconBuilding,
  IconBed,
  IconUsers,
  IconUserCheck,
  IconCash,
  IconReceipt,
  IconFileText,
  IconClipboardCheck,
  IconArmchair,
  IconMessages,
  IconLock,
  IconSettings,
  IconShieldCheck,
  IconKey,
  IconChartBar,
  IconBell,
  IconUpload,
  IconTrendingUp,
  IconTools,
  IconQrcode,
  IconSearch,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon?: string | null;
  order: number;
  parentId?: string | null;
  roles: Array<{ id: string; name: string; code: string }>;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
}

// Available Icon Options for Visual Selector
const ICON_OPTIONS = [
  { code: "IconHome", name: "Dashboard / Home", icon: IconHome },
  { code: "IconBuildingStore", name: "Owner / Management", icon: IconBuildingStore },
  { code: "IconBuilding", name: "Properti & Unit", icon: IconBuilding },
  { code: "IconBed", name: "Kamar / Unit", icon: IconBed },
  { code: "IconUsers", name: "Penyewa & Kontrak", icon: IconUsers },
  { code: "IconUserCheck", name: "Check-In / Lapangan", icon: IconUserCheck },
  { code: "IconCash", name: "Keuangan & Billing", icon: IconCash },
  { code: "IconReceipt", name: "Tagihan & Invoice", icon: IconReceipt },
  { code: "IconFileText", name: "Dokumen & Kontrak", icon: IconFileText },
  { code: "IconClipboardCheck", name: "Status Kamar Grid", icon: IconClipboardCheck },
  { code: "IconSparkles", name: "AI & Operasional", icon: IconSparkles },
  { code: "IconArmchair", name: "Inventaris / Perabotan", icon: IconArmchair },
  { code: "IconMessages", name: "Forum / Komunitas", icon: IconMessages },
  { code: "IconLock", name: "Role & Permission", icon: IconLock },
  { code: "IconRoute", name: "Dynamic Nav / Menu", icon: IconRoute },
  { code: "IconSettings", name: "Platform Settings", icon: IconSettings },
  { code: "IconShieldCheck", name: "Security & Admin", icon: IconShieldCheck },
  { code: "IconKey", name: "Credentials / Pass", icon: IconKey },
  { code: "IconChartBar", name: "Laporan & Analytics", icon: IconChartBar },
  { code: "IconBell", name: "Pengumuman", icon: IconBell },
  { code: "IconUpload", name: "Upload / Struk", icon: IconUpload },
  { code: "IconTrendingUp", name: "Net Profit / Growth", icon: IconTrendingUp },
  { code: "IconTools", name: "Maintenance", icon: IconTools },
  { code: "IconQrcode", name: "QR Login / Share", icon: IconQrcode },
];

export function DynamicMenuManager() {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);

  const [activeTab, setActiveTab] = useState<"menus" | "flags">("menus");
  const [roleFilter, setRoleFilter] = useState<string>("PLATFORM_ADMIN");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Menu Form Modal State (Supports Create & Edit)
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editMenuItemId, setEditMenuItemId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newIcon, setNewIcon] = useState("IconRoute");
  const [newOrder, setNewOrder] = useState("1");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["PLATFORM_ADMIN"]);

  // Icon Picker Modal State
  const [showIconPickerModal, setShowIconPickerModal] = useState(false);
  const [searchIcon, setSearchIcon] = useState("");

  // New Feature Flag Modal State
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagDesc, setNewFlagDesc] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menus-flags");
      const json = await res.json();
      if (json.success) {
        setMenuItems(json.data.menuItems);
        setRoles(json.data.roles);
        setFeatureFlags(json.data.featureFlags);
      }
    } catch (err) {
      console.error("Failed to load menus and flags:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute exact next sequential order: max(item_count per selected role) + 1
  const computeNextOrderForRoles = (targetRoleCodes: string[]) => {
    if (targetRoleCodes.length === 0) return 1;
    const maxRoleItemCount = Math.max(
      ...targetRoleCodes.map((code) => {
        return menuItems.filter((m) => m.roles.some((r) => r.code === code)).length;
      })
    );
    return maxRoleItemCount + 1;
  };

  const handleOpenCreateMenuModal = () => {
    setEditMenuItemId(null);
    setNewTitle("");
    setNewPath("");
    setNewIcon("IconRoute");
    setSelectedRoles([roleFilter]);

    const nextOrder = computeNextOrderForRoles([roleFilter]);
    setNewOrder(String(nextOrder));
    setShowMenuModal(true);
  };

  const handleOpenEditMenuModal = (item: MenuItem) => {
    setEditMenuItemId(item.id);
    setNewTitle(item.title);
    setNewPath(item.path);
    setNewIcon(item.icon || "IconRoute");
    setNewOrder(String(item.order));
    setSelectedRoles(item.roles.map((r) => r.code));
    setShowMenuModal(true);
  };

  const handleToggleFlag = async (flagId: string) => {
    try {
      const res = await fetch("/api/admin/menus-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_FLAG", flagId }),
      });
      const json = await res.json();
      if (json.success) {
        setFeatureFlags((prev) =>
          prev.map((f) => (f.id === flagId ? { ...f, isEnabled: json.data.isEnabled } : f))
        );
        setSuccessMsg(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagKey || !newFlagName) return alert("Key dan Nama flag wajib diisi");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/menus-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_FLAG",
          key: newFlagKey,
          name: newFlagName,
          description: newFlagDesc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowFlagModal(false);
        setNewFlagKey("");
        setNewFlagName("");
        setNewFlagDesc("");
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPath) return alert("Judul dan Path menu wajib diisi");

    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editMenuItemId);
      const res = await fetch("/api/admin/menus-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEdit ? "UPDATE_MENU" : "CREATE_MENU",
          menuItemId: editMenuItemId,
          title: newTitle,
          path: newPath,
          icon: newIcon,
          order: newOrder,
          roleCodes: selectedRoles,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setShowMenuModal(false);
        setEditMenuItemId(null);
        setNewTitle("");
        setNewPath("");
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapOrder = async (item1Id: string, item2Id: string) => {
    try {
      const res = await fetch("/api/admin/menus-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SWAP_MENU_ORDER",
          item1Id,
          item2Id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const { newOrder1, newOrder2 } = json.data;
        setMenuItems((prev) =>
          prev
            .map((m) => {
              if (m.id === item1Id) return { ...m, order: newOrder1 };
              if (m.id === item2Id) return { ...m, order: newOrder2 };
              return m;
            })
            .sort((a, b) => a.order - b.order)
        );
      }
    } catch (err) {
      console.error("Failed to swap menu order:", err);
    }
  };

  const handleDeleteMenu = async (menuItemId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${title}"?`)) return;

    try {
      const res = await fetch("/api/admin/menus-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_MENU",
          menuItemId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Menu "${title}" berhasil dihapus`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMenuItems = menuItems
    .filter((m) => m.roles.some((r) => r.code === roleFilter))
    .sort((a, b) => a.order - b.order);

  const getRoleBadgeLabel = (code: string) => {
    switch (code) {
      case "PLATFORM_ADMIN":
        return "Platform Admin";
      case "OWNER":
        return "Owner Properti";
      case "HOUSEKEEPING":
        return "Housekeeping Staff";
      case "USER":
        return "User";
      default:
        return code;
    }
  };

  const selectedIconObj = ICON_OPTIONS.find((i) => i.code === newIcon) || ICON_OPTIONS[0];
  const SelectedIconComp = selectedIconObj.icon;

  const filteredIcons = ICON_OPTIONS.filter(
    (i) =>
      i.name.toLowerCase().includes(searchIcon.toLowerCase()) ||
      i.code.toLowerCase().includes(searchIcon.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat data Master Menu & Feature Flags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-orange-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs tracking-wide uppercase">
                <IconRoute className="mr-1 size-3.5" /> Dynamic Navigation & Feature Controller
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dynamic Menu & Feature Flags Control
            </h1>
            <p className="mt-1 text-sm text-amber-200/80">
              Kelola hirarki master menu per role, urutan tampilan (order), dan aktifkan/nonaktifkan fitur sistem secara dinamis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={fetchData}
              variant="secondary"
              className="gap-1.5 font-semibold text-xs"
            >
              <IconRefresh className="size-4" /> Refresh Data
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreateMenuModal}
              className="gap-1.5 font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              <IconPlus className="size-4" /> Tambah Menu Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: "menus", label: "Master Menu per Role", icon: IconRoute },
          { id: "flags", label: "Feature Flags Toggles", icon: IconSparkles },
        ].map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id as any)}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: MASTER MENU PER ROLE */}
      {activeTab === "menus" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconRoute className="size-5 text-amber-500" />
                Menu Role: <span className="text-primary">{getRoleBadgeLabel(roleFilter)}</span> ({filteredMenuItems.length} Menu)
              </CardTitle>
              <CardDescription>
                Daftar menu navigasi resmi yang tampil khusus untuk role {getRoleBadgeLabel(roleFilter)}.
              </CardDescription>
            </div>

            {/* Filter Role */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "PLATFORM_ADMIN", label: "Platform Admin" },
                { id: "OWNER", label: "Owner Properti" },
                { id: "HOUSEKEEPING", label: "Housekeeping" },
                { id: "USER", label: "User" },
              ].map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={roleFilter === f.id ? "default" : "outline"}
                  onClick={() => setRoleFilter(f.id)}
                  className="text-xs h-8 font-semibold"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <div className="divide-y rounded-xl border">
              {filteredMenuItems.map((item, idx) => {
                const canMoveUp = idx > 0;
                const canMoveDown = idx < filteredMenuItems.length - 1;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{item.title}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">Path: {item.path} • Icon: {item.icon || "IconRoute"}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.roles.map((r) => (
                            <Badge key={r.id} variant="secondary" className="text-[9px]">
                              {r.code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 1-to-1 Position Swapping Order Control - Displays role relative order 1, 2, 3... */}
                      <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
                        <button
                          disabled={!canMoveUp}
                          onClick={() => {
                            if (canMoveUp) {
                              const prevItem = filteredMenuItems[idx - 1];
                              handleSwapOrder(item.id, prevItem.id);
                            }
                          }}
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Tukar posisi dengan menu di atasnya (Naikkan)"
                        >
                          <IconArrowUp className="size-3.5" />
                        </button>
                        <span className="font-mono font-bold px-1 text-xs">{idx + 1}</span>
                        <button
                          disabled={!canMoveDown}
                          onClick={() => {
                            if (canMoveDown) {
                              const nextItem = filteredMenuItems[idx + 1];
                              handleSwapOrder(item.id, nextItem.id);
                            }
                          }}
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Tukar posisi dengan menu di bawahnya (Turunkan)"
                        >
                          <IconArrowDown className="size-3.5" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditMenuModal(item)}
                        className="text-amber-500 hover:bg-amber-500/10 h-8 px-2"
                        title="Edit Menu"
                      >
                        <IconPencil className="size-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMenu(item.id, item.title)}
                        className="text-destructive hover:bg-destructive/10 h-8 px-2"
                        title="Hapus Menu"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: FEATURE FLAGS TOGGLES */}
      {activeTab === "flags" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconSparkles className="size-5 text-amber-500" />
                Dynamic Feature Flags ({featureFlags.length} Flags)
              </CardTitle>
              <CardDescription>
                Aktifkan atau nonaktifkan modul seperti OCR KTP AI, Akun Kamar, dan Forum secara langsung.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowFlagModal(true)} className="gap-1.5 text-xs font-semibold">
              <IconPlus className="size-4" /> Buat Feature Flag
            </Button>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            {featureFlags.map((flag) => (
              <div key={flag.id} className="rounded-xl border p-4 flex flex-col justify-between space-y-3 bg-card shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{flag.name}</h3>
                    <Badge variant={flag.isEnabled ? "default" : "outline"} className={flag.isEnabled ? "bg-emerald-600 text-white" : ""}>
                      {flag.isEnabled ? "ON (AKTIF)" : "OFF (NON-AKTIF)"}
                    </Badge>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">Key: {flag.key}</p>
                  <p className="text-xs text-muted-foreground mt-2">{flag.description || "Tidak ada deskripsi."}</p>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Button
                    size="sm"
                    variant={flag.isEnabled ? "default" : "outline"}
                    onClick={() => handleToggleFlag(flag.id)}
                    className="text-xs font-semibold h-8 gap-1.5"
                  >
                    {flag.isEnabled ? <IconToggleRight className="size-4 text-emerald-400" /> : <IconToggleLeft className="size-4" />}
                    {flag.isEnabled ? "Nonaktifkan Fitur" : "Aktifkan Fitur"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CREATE / EDIT MENU MODAL */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              {editMenuItemId ? <IconPencil className="size-5 text-amber-500" /> : <IconPlus className="size-5 text-amber-500" />}
              {editMenuItemId ? "Edit Master Menu" : `Buat Menu Baru (${getRoleBadgeLabel(roleFilter)})`}
            </h3>

            <form onSubmit={handleSaveMenu} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Judul Menu</label>
                <input
                  type="text"
                  placeholder="Contoh: Laporan Keuangan OpEx"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-amber-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Path Rute (Unik)</label>
                <input
                  type="text"
                  placeholder="Contoh: /finance/opex-reports"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono focus:ring-2 focus:ring-amber-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Visual Icon Picker Trigger */}
                <div>
                  <label className="font-bold block mb-1">Pilih Icon Navigasi</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPickerModal(true)}
                    className="w-full rounded-lg border p-2 bg-background flex items-center justify-between hover:bg-muted/40 transition-colors text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <SelectedIconComp className="size-4" />
                      </div>
                      <span className="truncate font-mono">{newIcon}</span>
                    </div>
                    <span className="text-[10px] text-amber-500 font-bold underline">Ubah</span>
                  </button>
                </div>

                <div>
                  <label className="font-bold block mb-1">Urutan (Order)</label>
                  <input
                    type="number"
                    value={newOrder}
                    onChange={(e) => setNewOrder(e.target.value)}
                    className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Tautkan ke Role:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["PLATFORM_ADMIN", "OWNER", "HOUSEKEEPING", "USER"].map((code) => {
                    const isChecked = selectedRoles.includes(code);
                    return (
                      <button
                        type="button"
                        key={code}
                        onClick={() => {
                          const nextRoles = isChecked
                            ? selectedRoles.filter((c) => c !== code)
                            : [...selectedRoles, code];
                          setSelectedRoles(nextRoles);

                          if (!editMenuItemId) {
                            const nextOrder = computeNextOrderForRoles(nextRoles);
                            setNewOrder(String(nextOrder));
                          }
                        }}
                        className={`px-2.5 py-1 rounded border text-[11px] font-bold ${
                          isChecked ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowMenuModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  {editMenuItemId ? "Simpan Perubahan" : "Simpan Menu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISUAL ICON PICKER MODAL */}
      {showIconPickerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <IconRoute className="size-5 text-amber-500" /> Pilih Icon Navigasi (Galeri Visual)
              </h3>
              <button
                onClick={() => setShowIconPickerModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                <IconX className="size-5" />
              </button>
            </div>

            {/* Icon Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama / kata kunci icon (Home, User, Cash...)..."
                value={searchIcon}
                onChange={(e) => setSearchIcon(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Icon Grid Selector */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
              {filteredIcons.map((item) => {
                const IconComp = item.icon;
                const isSelected = newIcon === item.code;

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setNewIcon(item.code);
                      setShowIconPickerModal(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold shadow-md ring-2 ring-amber-500/40"
                        : "bg-muted/30 border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <IconComp className="size-6 mb-1.5 shrink-0" />
                    <span className="text-[10px] font-semibold truncate w-full">{item.name}</span>
                    <span className="text-[9px] font-mono text-muted-foreground truncate w-full">{item.code}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => setShowIconPickerModal(false)}>
                Tutup Galeri
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW FEATURE FLAG MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <IconPlus className="size-5 text-amber-500" /> Buat Feature Flag Baru
            </h3>

            <form onSubmit={handleCreateFlag} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Key Flag (Unik)</label>
                <input
                  type="text"
                  placeholder="Contoh: auto_whatsapp_invoice_enabled"
                  value={newFlagKey}
                  onChange={(e) => setNewFlagKey(e.target.value.toLowerCase())}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nama Fitur</label>
                <input
                  type="text"
                  placeholder="Contoh: Auto Send Invoice WhatsApp"
                  value={newFlagName}
                  onChange={(e) => setNewFlagName(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Deskripsi Fitur</label>
                <textarea
                  placeholder="Penjelasan fungsi fitur..."
                  value={newFlagDesc}
                  onChange={(e) => setNewFlagDesc(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background text-xs h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFlagModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Simpan Feature Flag
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

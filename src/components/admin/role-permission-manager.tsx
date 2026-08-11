"use client";

import { useState, useEffect } from "react";
import {
  IconLock,
  IconPlus,
  IconShieldCheck,
  IconUserCheck,
  IconCheck,
  IconX,
  IconLoader2,
  IconRefresh,
  IconUsers,
  IconBuilding,
  IconCash,
  IconSparkles,
  IconFileText,
  IconSettings,
  IconSearch,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissionIds: string[];
}

interface PermissionItem {
  id: string;
  module: string;
  action: string;
  description?: string | null;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  customRoleId?: string | null;
  customRoleName?: string | null;
}

export function RolePermissionManager() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [activeTab, setActiveTab] = useState<"roles" | "matrix" | "users">("matrix");
  const [searchUser, setSearchUser] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Role Form State
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Loading State
  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles-permissions");
      const json = await res.json();
      if (json.success) {
        setRoles(json.data.roles);
        setPermissions(json.data.permissions);
        setUsers(json.data.users);
      }
    } catch (err) {
      console.error("Failed to load roles and permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !newRoleCode) return alert("Nama dan Kode Role wajib diisi");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/roles-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ROLE",
          name: newRoleName,
          code: newRoleCode,
          description: newRoleDesc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Role baru "${newRoleName}" berhasil dibuat!`);
        setShowNewRoleModal(false);
        setNewRoleName("");
        setNewRoleCode("");
        setNewRoleDesc("");
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuat role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    const key = `${roleId}-${permissionId}`;
    setTogglingMap((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch("/api/admin/roles-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_PERMISSION",
          roleId,
          permissionId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRoles((prevRoles) =>
          prevRoles.map((r) => {
            if (r.id === roleId) {
              const hasPerm = r.permissionIds.includes(permissionId);
              return {
                ...r,
                permissionIds: hasPerm
                  ? r.permissionIds.filter((id) => id !== permissionId)
                  : [...r.permissionIds, permissionId],
              };
            }
            return r;
          })
        );
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAssignUserRole = async (userId: string, roleCode: string, customRoleId?: string) => {
    try {
      const res = await fetch("/api/admin/roles-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_USER_ROLE",
          userId,
          roleCode,
          customRoleId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Role pengguna berhasil diperbarui`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group permissions by module
  const modulesList = Array.from(new Set(permissions.map((p) => p.module)));
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getModuleLabel = (mod: string) => {
    switch (mod) {
      case "properties":
        return { label: "Properti & Kamar", icon: IconBuilding };
      case "finance":
        return { label: "Keuangan & OpEx", icon: IconCash };
      case "operations":
        return { label: "Operasional & Housekeeping", icon: IconSparkles };
      case "tenants":
        return { label: "Penyewa & Kontrak", icon: IconUsers };
      case "reports":
        return { label: "Laporan & Analytics", icon: IconFileText };
      case "settings":
        return { label: "Platform Settings", icon: IconSettings };
      default:
        return { label: mod, icon: IconLock };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <IconLoader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat data Role & Permission Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs tracking-wide uppercase">
                <IconShieldCheck className="mr-1 size-3.5" /> Access Control Engine
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Role & Permission Management
            </h1>
            <p className="mt-1 text-sm text-purple-200/80">
              Kelola master roles, atur granular permission matrix (Read, Create, Update, Delete per Modul), dan user assignment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={fetchData}
              variant="secondary"
              className="gap-1.5 font-semibold text-xs"
            >
              <IconRefresh className="size-4" /> Sync Matrix
            </Button>
            <Button
              size="sm"
              onClick={() => setShowNewRoleModal(true)}
              className="gap-1.5 font-semibold text-xs bg-primary text-primary-foreground"
            >
              <IconPlus className="size-4" /> Buat Custom Role
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
          { id: "matrix", label: "Permission Matrix Grid", icon: IconLock },
          { id: "roles", label: "Master Roles Builder", icon: IconShieldCheck },
          { id: "users", label: "User Role Assignment", icon: IconUserCheck },
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

      {/* TAB 1: PERMISSION MATRIX GRID */}
      {activeTab === "matrix" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IconLock className="size-5 text-purple-600" />
              Granular Permission Matrix Grid
            </CardTitle>
            <CardDescription>
              Klik kotak akses untuk mengaktifkan atau menonaktifkan izin hak akses per role secara real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground font-bold border-b">
                  <th className="p-3.5 min-w-[220px]">Modul & Aksi Hak Akses</th>
                  {roles.map((r) => (
                    <th key={r.id} className="p-3.5 text-center min-w-[140px]">
                      <div className="flex flex-col items-center">
                        <span className="text-foreground font-extrabold text-sm">{r.name}</span>
                        <Badge variant={r.isSystem ? "default" : "secondary"} className="text-[9px] mt-0.5">
                          {r.code}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {modulesList.map((mod) => {
                  const modInfo = getModuleLabel(mod);
                  const ModIcon = modInfo.icon;
                  const modPermissions = permissions.filter((p) => p.module === mod);

                  return (
                    <tr key={mod} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 align-top">
                        <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                          <ModIcon className="size-4 text-primary" />
                          <span>{modInfo.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5 uppercase tracking-wider font-semibold">
                          {mod} module
                        </span>
                      </td>

                      {roles.map((r) => (
                        <td key={r.id} className="p-3 align-top">
                          <div className="grid grid-cols-2 gap-1.5">
                            {modPermissions.map((p) => {
                              const isChecked = r.permissionIds.includes(p.id);
                              const toggleKey = `${r.id}-${p.id}`;
                              const isToggling = togglingMap[toggleKey];

                              return (
                                <button
                                  key={p.id}
                                  disabled={isToggling}
                                  onClick={() => handleTogglePermission(r.id, p.id)}
                                  className={`flex items-center justify-between p-1.5 rounded border text-[10px] font-bold transition-all ${
                                    isChecked
                                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                                  }`}
                                  title={`${p.action.toUpperCase()} - ${p.description || ""}`}
                                >
                                  <span className="uppercase">{p.action}</span>
                                  {isToggling ? (
                                    <IconLoader2 className="size-3 animate-spin" />
                                  ) : isChecked ? (
                                    <IconCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <IconX className="size-3 text-muted-foreground/50" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: MASTER ROLES BUILDER */}
      {activeTab === "roles" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconShieldCheck className="size-5 text-indigo-600" />
                Master Roles & Custom Staff Builder
              </CardTitle>
              <CardDescription>
                Role bawaan sistem dan role kustom (Staff Keuangan, Resepsionis, dll.).
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewRoleModal(true)} className="gap-1.5 text-xs font-semibold">
              <IconPlus className="size-4" /> Buat Custom Role
            </Button>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <div key={r.id} className="rounded-xl border p-4 space-y-3 bg-card shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">{r.name}</h3>
                    <Badge variant={r.isSystem ? "default" : "secondary"} className="text-[10px] mt-1">
                      {r.isSystem ? "SYSTEM DEFAULT" : "CUSTOM ROLE"}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {r.code}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground min-h-[32px]">
                  {r.description || "TIDAK ADA DESKRIPSI"}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t font-semibold">
                  <span className="text-muted-foreground">Pengguna: <strong className="text-foreground">{r.userCount}</strong></span>
                  <span className="text-primary">Akses: <strong>{r.permissionIds.length}</strong> Izin</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: USER ROLE ASSIGNMENT */}
      {activeTab === "users" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconUserCheck className="size-5 text-blue-600" />
                User Role Assignment Mapping
              </CardTitle>
              <CardDescription>
                Atur role global pengguna (Platform Admin, Owner, Housekeeping, Tenant, Custom Staff).
              </CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama / email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>

          <CardContent>
            <div className="divide-y rounded-xl border">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-xs">
                  <div>
                    <p className="font-bold text-sm text-foreground">{u.fullName}</p>
                    <p className="text-muted-foreground">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.customRoleId ? `CUSTOM:${u.customRoleId}` : u.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("CUSTOM:")) {
                          const customId = val.split("CUSTOM:")[1];
                          handleAssignUserRole(u.id, "CUSTOM", customId);
                        } else {
                          handleAssignUserRole(u.id, val);
                        }
                      }}
                      className="rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
                    >
                      <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                      <option value="OWNER">OWNER</option>
                      <option value="HOUSEKEEPING">HOUSEKEEPING</option>
                      <option value="USER">USER (Tenant)</option>
                      {roles.filter((r) => !r.isSystem).map((customRole) => (
                        <option key={customRole.id} value={`CUSTOM:${customRole.id}`}>
                          CUSTOM: {customRole.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE NEW ROLE MODAL */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <IconPlus className="size-5 text-primary" /> Buat Custom Role Baru
            </h3>

            <form onSubmit={handleCreateRole} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Role</label>
                <input
                  type="text"
                  placeholder="Contoh: Resepsionis Gedung"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-primary text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Kode Role (Unik)</label>
                <input
                  type="text"
                  placeholder="Contoh: RECEPTIONIST"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border p-2.5 bg-background font-mono focus:ring-2 focus:ring-primary text-xs uppercase"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Deskripsi Role</label>
                <textarea
                  placeholder="Penjelasan fungsi dan hak akses staf..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full rounded-lg border p-2.5 bg-background focus:ring-2 focus:ring-primary text-xs h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewRoleModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 font-bold">
                  {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  Simpan Role Baru
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

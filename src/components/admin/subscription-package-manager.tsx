"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconPencil,
  IconCheck,
  IconSearch,
  IconLoader2,
  IconBuildingStore,
  IconTrash,
  IconBed,
  IconX,
  IconSparkles,
  IconPower,
  IconUserCheck,
  IconPuzzle,
  IconListCheck,
  IconTag,
  IconPackages,
  IconStar,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SaaSPlanItem {
  id: string;
  name: string;
  maxProperties: number;
  maxUnits: number;
  maxHousekeeping: number;
  priceMonthly: number;
  priceYearly: number;
  featureIds?: string[];
  features: string[];
  subscriberCount: number;
  status?: "ACTIVE" | "INACTIVE";
  isDefault?: boolean;
}

interface MasterFeatureItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  assignedPlansCount?: number;
}

interface SaaSAddOnItem {
  id: string;
  name: string;
  category: "PROPERTY" | "UNIT" | "HOUSEKEEPING" | "FEATURE";
  unitQuota: number;
  priceMonthly: number;
  priceYearly: number;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  activePurchasesCount?: number;
}

interface OwnerSubscriptionItem {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  latestInvoiceNumber: string;
  latestInvoiceStatus: string;
  createdAt: string;
}

export function SubscriptionPackageManager() {
  const [activeTab, setActiveTab] = useState<"packages" | "master_features" | "add_ons">("packages");
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SaaSPlanItem[]>([]);
  const [masterFeatures, setMasterFeatures] = useState<MasterFeatureItem[]>([]);
  const [addOns, setAddOns] = useState<SaaSAddOnItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<OwnerSubscriptionItem[]>([]);
  const [totalSubscribersCount, setTotalSubscribersCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Modals States
  // ---------------------------------------------------------------------------

  // 1. Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlanItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formPriceMonthly, setFormPriceMonthly] = useState("Rp 99.000");
  const [formPriceYearly, setFormPriceYearly] = useState("Rp 990.000");
  const [formMaxUnits, setFormMaxUnits] = useState("15");
  const [formMaxProperties, setFormMaxProperties] = useState("1");
  const [formMaxHousekeeping, setFormMaxHousekeeping] = useState("3");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [formCustomFeatures, setFormCustomFeatures] = useState<string[]>([]);

  // 2. Master Feature Modal State
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<MasterFeatureItem | null>(null);
  const [featureCode, setFeatureCode] = useState("");
  const [featureName, setFeatureName] = useState("");
  const [featureCategory, setFeatureCategory] = useState("OPERATIONAL");
  const [featureDescription, setFeatureDescription] = useState("");

  // 3. Add-On Modal State
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<SaaSAddOnItem | null>(null);
  const [addOnName, setAddOnName] = useState("");
  const [addOnCategory, setAddOnCategory] = useState<"PROPERTY" | "UNIT" | "HOUSEKEEPING" | "FEATURE">("UNIT");
  const [addOnUnitQuota, setAddOnUnitQuota] = useState("10");
  const [addOnPriceMonthly, setAddOnPriceMonthly] = useState("Rp 49.000");
  const [addOnPriceYearly, setAddOnPriceYearly] = useState("Rp 490.000");
  const [addOnDescription, setAddOnDescription] = useState("");
  const [addOnStatus, setAddOnStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatRupiahInput = (val: string | number) => {
    const digits = String(val).replace(/[^0-9]/g, "");
    if (!digits) return "";
    const formatted = new Intl.NumberFormat("id-ID").format(Number(digits));
    return `Rp ${formatted}`;
  };

  const parseRupiahInput = (val: string) => {
    const digits = String(val).replace(/[^0-9]/g, "");
    return digits ? parseFloat(digits) : 0;
  };

  // ---------------------------------------------------------------------------
  // Fetch All SaaS Data (Plans, Features, Add-Ons, Subscriptions)
  // ---------------------------------------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [resSub, resFeat, resAddOns] = await Promise.all([
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/features"),
        fetch("/api/admin/add-ons"),
      ]);

      const jsonSub = await resSub.json();
      if (jsonSub.success && jsonSub.data) {
        if (jsonSub.data.plans) {
          setPlans(
            jsonSub.data.plans.map((p: any) => ({
              ...p,
              maxHousekeeping: p.maxHousekeeping || 2,
              status: p.status || "ACTIVE",
            }))
          );
        }
        if (jsonSub.data.subscriptions) {
          setSubscriptions(jsonSub.data.subscriptions);
          setTotalSubscribersCount(
            jsonSub.data.subscriptions.filter((s: any) => s.status === "ACTIVE").length
          );
        }
      }

      const jsonFeat = await resFeat.json();
      if (jsonFeat.success && jsonFeat.data) {
        setMasterFeatures(jsonFeat.data);
      }

      const jsonAddOns = await resAddOns.json();
      if (jsonAddOns.success && jsonAddOns.data) {
        setAddOns(jsonAddOns.data);
      }
    } catch (err) {
      console.error("Failed to fetch SaaS management data:", err);
      setErrorMsg("Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetDefaultPlan = async (planId: string, planName: string) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_DEFAULT_PLAN",
          planId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Paket "${planName}" berhasil ditetapkan sebagai Paket Default Pendaftaran Owner`);
        await fetchData();
      } else {
        setErrorMsg(json.message || "Gagal mengatur paket default");
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan jaringan saat mengatur paket default");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Plan Modal Handlers
  // ---------------------------------------------------------------------------
  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setFormName("");
    setFormPriceMonthly(formatRupiahInput("199000"));
    setFormPriceYearly(formatRupiahInput("1990000"));
    setFormMaxUnits("25");
    setFormMaxProperties("2");
    setFormMaxHousekeeping("5");
    setFormStatus("ACTIVE");
    setSelectedFeatureIds(masterFeatures.filter((f) => f.isEnabled).map((f) => f.id));
    setFormCustomFeatures([]);
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan: SaaSPlanItem) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormPriceMonthly(formatRupiahInput(plan.priceMonthly));
    setFormPriceYearly(formatRupiahInput(plan.priceYearly || plan.priceMonthly * 10));
    setFormMaxUnits(String(plan.maxUnits));
    setFormMaxProperties(String(plan.maxProperties));
    setFormMaxHousekeeping(String(plan.maxHousekeeping || 2));
    setFormStatus(plan.status || "ACTIVE");
    setSelectedFeatureIds(plan.featureIds || []);
    setFormCustomFeatures(plan.features || []);
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("Nama paket tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        action: editingPlan ? "UPDATE_PLAN" : "CREATE_PLAN",
        planId: editingPlan?.id,
        name: formName.trim(),
        priceMonthly: parseRupiahInput(formPriceMonthly),
        priceYearly: parseRupiahInput(formPriceYearly),
        maxUnits: parseInt(formMaxUnits, 10) || 10,
        maxProperties: parseInt(formMaxProperties, 10) || 1,
        maxHousekeeping: parseInt(formMaxHousekeeping, 10) || 2,
        status: formStatus,
        featureIds: selectedFeatureIds,
        features: formCustomFeatures,
      };

      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan paket");
      }

      setSuccessMsg(
        editingPlan
          ? `Paket "${formName}" berhasil diperbarui!`
          : `Paket "${formName}" berhasil dibuat!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowPlanModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan paket");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Master Feature Modal Handlers
  // ---------------------------------------------------------------------------
  const openCreateFeatureModal = () => {
    setEditingFeature(null);
    setFeatureCode("");
    setFeatureName("");
    setFeatureCategory("OPERATIONAL");
    setFeatureDescription("");
    setShowFeatureModal(true);
  };

  const openEditFeatureModal = (feat: MasterFeatureItem) => {
    setEditingFeature(feat);
    setFeatureCode(feat.code);
    setFeatureName(feat.name);
    setFeatureCategory(feat.category || "OPERATIONAL");
    setFeatureDescription(feat.description || "");
    setShowFeatureModal(true);
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureCode.trim() || !featureName.trim()) {
      setErrorMsg("Kode dan nama fitur wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        action: editingFeature ? "UPDATE_FEATURE" : "CREATE_FEATURE",
        id: editingFeature?.id,
        code: featureCode,
        name: featureName,
        category: featureCategory,
        description: featureDescription,
      };

      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan fitur master");
      }

      setSuccessMsg(`Fitur "${featureName}" berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowFeatureModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan fitur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFeature = async (feat: MasterFeatureItem) => {
    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_FEATURE",
          id: feat.id,
          isEnabled: !feat.isEnabled,
        }),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Add-On Modal Handlers
  // ---------------------------------------------------------------------------
  const openCreateAddOnModal = () => {
    setEditingAddOn(null);
    setAddOnName("");
    setAddOnCategory("UNIT");
    setAddOnUnitQuota("10");
    setAddOnPriceMonthly(formatRupiahInput("49000"));
    setAddOnPriceYearly(formatRupiahInput("490000"));
    setAddOnDescription("");
    setAddOnStatus("ACTIVE");
    setShowAddOnModal(true);
  };

  const openEditAddOnModal = (addon: SaaSAddOnItem) => {
    setEditingAddOn(addon);
    setAddOnName(addon.name);
    setAddOnCategory(addon.category);
    setAddOnUnitQuota(String(addon.unitQuota));
    setAddOnPriceMonthly(formatRupiahInput(addon.priceMonthly));
    setAddOnPriceYearly(formatRupiahInput(addon.priceYearly));
    setAddOnDescription(addon.description || "");
    setAddOnStatus(addon.status);
    setShowAddOnModal(true);
  };

  const handleSaveAddOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOnName.trim()) {
      setErrorMsg("Nama Add-On wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        action: editingAddOn ? "UPDATE_ADDON" : "CREATE_ADDON",
        id: editingAddOn?.id,
        name: addOnName.trim(),
        category: addOnCategory,
        unitQuota: parseInt(addOnUnitQuota, 10) || 1,
        priceMonthly: parseRupiahInput(addOnPriceMonthly),
        priceYearly: parseRupiahInput(addOnPriceYearly),
        description: addOnDescription.trim(),
        status: addOnStatus,
      };

      const res = await fetch("/api/admin/add-ons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan Add-On");
      }

      setSuccessMsg(`Add-On "${addOnName}" berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowAddOnModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan Add-On");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAddOnStatus = async (addon: SaaSAddOnItem) => {
    try {
      const nextStatus = addon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch("/api/admin/add-ons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_ADDON",
          id: addon.id,
          status: nextStatus,
        }),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Subscriptions for search query
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    return (
      sub.ownerName.toLowerCase().includes(q) ||
      sub.ownerEmail.toLowerCase().includes(q) ||
      sub.planName.toLowerCase().includes(q)
    );
  });

  const popularPlanName = React.useMemo(() => {
    if (!plans || plans.length === 0) return "-";
    const sorted = [...plans].sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
    if (sorted[0] && (sorted[0].subscriberCount || 0) > 0) {
      return sorted[0].name;
    }
    const firstActive = plans.find((p) => p.status === "ACTIVE");
    return firstActive ? firstActive.name : sorted[0]?.name || "-";
  }, [plans]);

  return (
    <div className="space-y-6 pb-12">
      {/* --------------------------------------------------------------------- */}
      {/* PAGE HEADER */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8FA28A] uppercase tracking-wider mb-1">
            <IconSparkles className="h-4 w-4" />
            <span>Platform Admin • Subscriptions & Billing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Subscription Packages & Add-Ons
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola paket langganan SaaS, batas kuota, katalog master fitur, dan sistem Add-On ekosistem ARVENTA.
          </p>
        </div>

        {/* Tab Actions */}
        <div className="flex items-center gap-2">
          {activeTab === "packages" && (
            <Button onClick={openCreatePlanModal} className="bg-[#8FA28A] hover:bg-[#7D9178] text-white font-bold text-xs gap-1.5 shadow-md">
              <IconPlus className="h-4 w-4" />
              <span>Tambah Paket Baru</span>
            </Button>
          )}
          {activeTab === "master_features" && (
            <Button onClick={openCreateFeatureModal} className="bg-[#C8A96B] hover:bg-[#B39355] text-white font-bold text-xs gap-1.5 shadow-md">
              <IconPlus className="h-4 w-4" />
              <span>Tambah Fitur Master</span>
            </Button>
          )}
          {activeTab === "add_ons" && (
            <Button onClick={openCreateAddOnModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md">
              <IconPlus className="h-4 w-4" />
              <span>Tambah Add-On Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <IconCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
          <IconX className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* NAVIGATION TABS BAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex border-b border-border gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("packages")}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "packages"
              ? "border-[#8FA28A] text-[#8FA28A]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconPackages className="h-4 w-4" />
          <span>Paket Langganan Utama ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("master_features")}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "master_features"
              ? "border-[#C8A96B] text-[#C8A96B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconListCheck className="h-4 w-4" />
          <span>Master Fitur Sistem ({masterFeatures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("add_ons")}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "add_ons"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconPuzzle className="h-4 w-4" />
          <span>Katalog Add-On Ekstra ({addOns.length})</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <IconLoader2 className="h-8 w-8 animate-spin text-[#8FA28A]" />
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* TAB 1: PAKET LANGGANAN UTAMA */}
          {/* ================================================================= */}
          {activeTab === "packages" && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-border">
                  <CardHeader className="py-3 px-4">
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Total Paket</CardDescription>
                    <CardTitle className="text-2xl font-black">{plans.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-border">
                  <CardHeader className="py-3 px-4">
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Paket Aktif</CardDescription>
                    <CardTitle className="text-2xl font-black text-emerald-600">
                      {plans.filter((p) => p.status === "ACTIVE").length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-border">
                  <CardHeader className="py-3 px-4">
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Paket Populer</CardDescription>
                    <CardTitle className="text-xl font-black text-[#C8A96B] truncate" title={popularPlanName}>
                      {popularPlanName}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-border">
                  <CardHeader className="py-3 px-4">
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Total Subscriber</CardDescription>
                    <CardTitle className="text-2xl font-black text-[#8FA28A]">{totalSubscribersCount}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Plans Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isActive = plan.status === "ACTIVE";

                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-sm transition-all hover:shadow-xl ${
                        isActive ? "border-border" : "border-red-200 bg-red-50/20"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Plan Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                              {plan.isDefault && (
                                <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] gap-1 px-2 py-0.5">
                                  <IconStar className="h-3 w-3 fill-amber-500 text-amber-600" /> Default
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold">
                              {plan.subscriberCount || 0} Owner Aktif
                            </span>
                          </div>
                          <Badge variant={isActive ? "default" : "destructive"}>
                            {isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>

                        {/* Price */}
                        <div>
                          <div className="text-2xl font-black text-foreground">
                            {formatIDR(plan.priceMonthly)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">/bulan</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {formatIDR(plan.priceYearly || plan.priceMonthly * 10)} /tahun
                          </p>
                        </div>

                        {/* Package Limits Box */}
                        <div className="rounded-2xl bg-muted/50 p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                              <IconBuildingStore className="h-4 w-4 text-[#8FA28A]" />
                              Maksimal Properti:
                            </span>
                            <span className="font-bold font-mono text-foreground">{plan.maxProperties} Properti</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                              <IconBed className="h-4 w-4 text-[#C8A96B]" />
                              Maksimal Unit/Kamar:
                            </span>
                            <span className="font-bold font-mono text-foreground">{plan.maxUnits} Kamar</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                              <IconUserCheck className="h-4 w-4 text-emerald-600" />
                              Akun Housekeeping:
                            </span>
                            <span className="font-bold font-mono text-foreground">{plan.maxHousekeeping} Akun</span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            FITUR YANG TERMASUK ({plan.features.length})
                          </p>
                          <ul className="space-y-1.5 text-xs text-foreground">
                            {plan.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <IconCheck className="h-4 w-4 text-[#8FA28A] shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-6 pt-4 border-t border-border flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPlanModal(plan)}
                          className="flex-1 rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                          <span>Edit Paket</span>
                        </Button>

                        {plan.isDefault ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px] gap-1 px-3 py-1.5 shrink-0">
                            <IconStar className="h-3.5 w-3.5 fill-amber-500 text-amber-600" /> Default Pendaftaran
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPlan(plan.id, plan.name)}
                            disabled={isSubmitting}
                            className="rounded-xl font-bold text-xs gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40 cursor-pointer"
                            title="Tetapkan sebagai paket default pendaftaran owner baru"
                          >
                            <IconStar className="h-3.5 w-3.5 text-amber-500" />
                            <span>Set Default</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* TABLE 1: RINGKASAN KAPASITAS & ADOPSI PAKET SAAS (RESTORED) */}
              {/* --------------------------------------------------------------------- */}
              <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-2xs">
                <CardHeader className="p-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      <IconBuildingStore className="h-5 w-5 text-[#8FA28A]" />
                      <span>Panduan Adopsi & Kapasitas Paket SaaS</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Panduan ringkasan batas kuota per paket serta total owner yang telah mengambil masing-masing paket.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs px-3 py-1">
                      Total {plans.length} Tipe Paket
                    </Badge>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3.5 px-4">Nama Paket</th>
                        <th className="py-3.5 px-4">Harga Bulanan</th>
                        <th className="py-3.5 px-4">Batas Properti</th>
                        <th className="py-3.5 px-4">Batas Unit/Kamar</th>
                        <th className="py-3.5 px-4">Akun Housekeeping</th>
                        <th className="py-3.5 px-4">Status Paket</th>
                        <th className="py-3.5 px-4 text-center">Owner Berlangganan</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {plans.map((p) => {
                        const count = p.subscriberCount || 0;
                        return (
                          <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {p.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                              {formatIDR(p.priceMonthly)}
                            </td>
                            <td className="py-3.5 px-4 font-mono">{p.maxProperties} Properti</td>
                            <td className="py-3.5 px-4 font-mono">{p.maxUnits} Kamar</td>
                            <td className="py-3.5 px-4 font-mono">{p.maxHousekeeping || 2} Akun</td>
                            <td className="py-3.5 px-4">
                              <Badge variant={p.status === "ACTIVE" ? "default" : "destructive"}>
                                {p.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-[#8FA28A]/15 text-[#6B7F66] font-bold font-mono text-xs">
                                {count} Owner Aktif
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditPlanModal(p)}
                                className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                              >
                                <IconPencil className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* --------------------------------------------------------------------- */}
              {/* TABLE 2: DAFTAR OWNER BERLANGGANAN (REALTIME SYNCED) */}
              {/* --------------------------------------------------------------------- */}
              <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-2xs">
                <CardHeader className="p-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      <IconUserCheck className="h-5 w-5 text-[#C8A96B]" />
                      <span>Daftar Owner Berlangganan Aktif</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Daftar seluruh owner properti yang terdaftar dan sedang menggunakan paket SaaS ARVENTA.
                    </CardDescription>
                  </div>

                  {/* Search Filter */}
                  <div className="relative w-full sm:w-64">
                    <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari nama owner / email / paket..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs font-medium focus:border-[#8FA28A] focus:outline-none"
                    />
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3.5 px-4">Nama Owner</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Paket SaaS</th>
                        <th className="py-3.5 px-4">Status Langganan</th>
                        <th className="py-3.5 px-4">Periode Masa Aktif</th>
                        <th className="py-3.5 px-4">Invoice Terakhir</th>
                        <th className="py-3.5 px-4 text-center">Auto-Renew</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                            Tidak ada data owner berlangganan yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredSubscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {sub.ownerName}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground font-mono">
                              {sub.ownerEmail}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#8FA28A]">{sub.planName}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant={sub.status === "ACTIVE" ? "default" : "destructive"}>
                                {sub.status === "ACTIVE" ? "Aktif" : sub.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                              {new Date(sub.startDate).toLocaleDateString("id-ID")} - {new Date(sub.endDate).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              <div>{sub.latestInvoiceNumber}</div>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">{sub.latestInvoiceStatus}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold">
                              {sub.autoRenew ? (
                                <span className="text-emerald-600 font-mono">Ya</span>
                              ) : (
                                <span className="text-red-500 font-mono">Tidak</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: MASTER FITUR SISTEM */}
          {/* ================================================================= */}
          {activeTab === "master_features" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Master Katalog Fitur Platform</h3>
                  <p className="text-xs text-amber-700">
                    Setiap fitur yang terdaftar di sini dapat dicentang dan dimasukkan ke dalam paket langganan SaaS.
                  </p>
                </div>
                <Button onClick={openCreateFeatureModal} size="sm" className="bg-[#C8A96B] hover:bg-[#B39355] text-white font-bold text-xs gap-1 cursor-pointer">
                  <IconPlus className="h-4 w-4" />
                  <span>Tambah Fitur</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {masterFeatures.map((feat) => (
                  <div
                    key={feat.id}
                    className={`rounded-2xl border p-4 bg-card shadow-2xs space-y-3 ${
                      feat.isEnabled ? "border-border" : "border-red-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {feat.code}
                        </span>
                        <h4 className="text-sm font-bold text-foreground mt-1">{feat.name}</h4>
                      </div>
                      <Badge variant={feat.isEnabled ? "default" : "destructive"}>
                        {feat.isEnabled ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {feat.description || "Tidak ada deskripsi."}
                    </p>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        Dipakai di {feat.assignedPlansCount || 0} paket
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFeature(feat)}
                          className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-all"
                          title="Toggle Status"
                        >
                          <IconPower className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditFeatureModal(feat)}
                          className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-all"
                          title="Edit Fitur"
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: KATALOG ADD-ON SAAS */}
          {/* ================================================================= */}
          {activeTab === "add_ons" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Katalog Add-On Kuota & Fitur Extras</h3>
                  <p className="text-xs text-emerald-700">
                    Add-On bersifat akumulatif (menambahkan kuota paket utama tanpa menimpa batas paket asli).
                  </p>
                </div>
                <Button onClick={openCreateAddOnModal} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 cursor-pointer">
                  <IconPlus className="h-4 w-4" />
                  <span>Tambah Add-On</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addOns.map((addon) => {
                  const isActive = addon.status === "ACTIVE";

                  return (
                    <div
                      key={addon.id}
                      className={`rounded-2xl border p-5 bg-card shadow-2xs space-y-4 flex flex-col justify-between ${
                        isActive ? "border-border" : "border-red-200 bg-red-50/20"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-black text-foreground">{addon.name}</h4>
                          <Badge variant={isActive ? "default" : "destructive"}>
                            {isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#8FA28A]/15 text-[#6B7F66] text-xs font-bold font-mono">
                          <IconTag className="h-3.5 w-3.5" />
                          <span>
                            Kategori: {addon.category} ({addon.unitQuota > 0 ? `+${addon.unitQuota} Kuota` : "Fitur Extra"})
                          </span>
                        </div>

                        <div>
                          <p className="text-lg font-black text-emerald-600">
                            {formatIDR(addon.priceMonthly)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">/bulan</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {formatIDR(addon.priceYearly)} /tahun
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {addon.description || "Tidak ada deskripsi khusus."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAddOnStatus(addon)}
                          className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                        >
                          <IconPower className="h-3.5 w-3.5" />
                          <span>{isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditAddOnModal(addon)}
                          className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: CREATE / EDIT SAAS PLAN */}
      {/* --------------------------------------------------------------------- */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingPlan ? `Edit Paket SaaS (${editingPlan.name})` : "Tambah Paket SaaS Baru"}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Paket <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Business Tier..."
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none"
                  required
                />
              </div>

              {/* Limits Configuration */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Max Properti
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMaxProperties}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value || "0", 10);
                      setFormMaxProperties(String(isNaN(parsed) || parsed < 0 ? 0 : parsed));
                    }}
                    className="w-full rounded-xl border border-input px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Max Unit Kamar
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMaxUnits}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value || "0", 10);
                      setFormMaxUnits(String(isNaN(parsed) || parsed < 0 ? 0 : parsed));
                    }}
                    className="w-full rounded-xl border border-input px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Max Housekeeping
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMaxHousekeeping}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value || "0", 10);
                      setFormMaxHousekeeping(String(isNaN(parsed) || parsed < 0 ? 0 : parsed));
                    }}
                    className="w-full rounded-xl border border-input px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Bulanan
                  </label>
                  <input
                    type="text"
                    value={formPriceMonthly}
                    onChange={(e) => setFormPriceMonthly(formatRupiahInput(e.target.value))}
                    className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Tahunan
                  </label>
                  <input
                    type="text"
                    value={formPriceYearly}
                    onChange={(e) => setFormPriceYearly(formatRupiahInput(e.target.value))}
                    className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Feature Checklist from Master Features */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Fitur Master Termasuk ({selectedFeatureIds.length})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-2xl border border-border bg-card">
                  {masterFeatures.map((feat) => {
                    const isChecked = selectedFeatureIds.includes(feat.id);
                    return (
                      <label key={feat.id} className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer hover:bg-muted p-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeatureIds([...selectedFeatureIds, feat.id]);
                              if (!formCustomFeatures.includes(feat.name)) {
                                setFormCustomFeatures([...formCustomFeatures, feat.name]);
                              }
                            } else {
                              setSelectedFeatureIds(selectedFeatureIds.filter((id) => id !== feat.id));
                              setFormCustomFeatures(formCustomFeatures.filter((name) => name !== feat.name));
                            }
                          }}
                          className="rounded text-[#8FA28A]"
                        />
                        <span>{feat.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-auto">({feat.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Status Paket
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-bold"
                >
                  <option value="ACTIVE">Aktif (Dapat dipilih owner)</option>
                  <option value="INACTIVE">Nonaktif (Disembunyikan)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowPlanModal(false)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#8FA28A] hover:bg-[#7D9178] text-white font-bold">
                  {isSubmitting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Simpan Paket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: CREATE / EDIT MASTER FEATURE */}
      {/* --------------------------------------------------------------------- */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingFeature ? "Edit Fitur Master" : "Tambah Fitur Master Baru"}
              </h3>
              <button onClick={() => setShowFeatureModal(false)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeature} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kode Fitur (Unique Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={featureCode}
                  onChange={(e) => setFeatureCode(e.target.value)}
                  placeholder="Contoh: OCR_KTP..."
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Fitur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="Contoh: Auto Scan KTP OCR..."
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kategori Fitur
                </label>
                <select
                  value={featureCategory}
                  onChange={(e) => setFeatureCategory(e.target.value)}
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-bold"
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  placeholder="Penjelasan fungsi fitur..."
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-medium h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowFeatureModal(false)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#C8A96B] hover:bg-[#B39355] text-white font-bold">
                  {isSubmitting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Simpan Fitur"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: CREATE / EDIT SAAS ADD-ON */}
      {/* --------------------------------------------------------------------- */}
      {showAddOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingAddOn ? "Edit Add-On SaaS" : "Tambah Add-On Baru"}
              </h3>
              <button onClick={() => setShowAddOnModal(false)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddOn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Add-On <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addOnName}
                  onChange={(e) => setAddOnName(e.target.value)}
                  placeholder="Contoh: +10 Extra Unit Kamar..."
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Kategori
                  </label>
                  <select
                    value={addOnCategory}
                    onChange={(e) => setAddOnCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-input px-3 py-2 text-xs font-bold"
                  >
                    <option value="UNIT">Unit / Kamar</option>
                    <option value="PROPERTY">Properti</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="FEATURE">Fitur Extra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Tambahan Kuota
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addOnUnitQuota}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value || "0", 10);
                      setAddOnUnitQuota(String(isNaN(parsed) || parsed < 0 ? 0 : parsed));
                    }}
                    className="w-full rounded-xl border border-input px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Bulanan
                  </label>
                  <input
                    type="text"
                    value={addOnPriceMonthly}
                    onChange={(e) => setAddOnPriceMonthly(formatRupiahInput(e.target.value))}
                    className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga Tahunan
                  </label>
                  <input
                    type="text"
                    value={addOnPriceYearly}
                    onChange={(e) => setAddOnPriceYearly(formatRupiahInput(e.target.value))}
                    className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Deskripsi Add-On
                </label>
                <textarea
                  value={addOnDescription}
                  onChange={(e) => setAddOnDescription(e.target.value)}
                  placeholder="Penjelasan benefit Add-On..."
                  className="w-full rounded-xl border border-input px-3.5 py-2 text-xs font-medium h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAddOnModal(false)} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isSubmitting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Simpan Add-On"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

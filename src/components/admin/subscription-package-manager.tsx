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
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SaaSPlanItem {
  id: string;
  name: string;
  maxProperties: number;
  maxUnits: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  subscriberCount: number;
  status?: "ACTIVE" | "INACTIVE";
}

export function SubscriptionPackageManager() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SaaSPlanItem[]>([]);
  const [totalSubscribersCount, setTotalSubscribersCount] = useState(128);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlanItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formPriceMonthly, setFormPriceMonthly] = useState("Rp 99.000");
  const [formMaxUnits, setFormMaxUnits] = useState("15");
  const [formMaxProperties, setFormMaxProperties] = useState("1");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState("");

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/subscriptions");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.plans && json.data.plans.length > 0) {
          setPlans(
            json.data.plans.map((p: any) => ({
              ...p,
              status: p.status || "ACTIVE",
            }))
          );
        } else {
          // Default seed fallback if DB is empty
          setPlans(DEFAULT_FALLBACK_PLANS);
        }

        if (json.data.subscriptions && json.data.subscriptions.length > 0) {
          setTotalSubscribersCount(
            json.data.subscriptions.filter((s: any) => s.status === "ACTIVE").length
          );
        } else if (json.data.plans) {
          setTotalSubscribersCount(
            json.data.plans.reduce((acc: number, p: any) => acc + (p.subscriberCount || 0), 0)
          );
        }
      } else {
        setPlans(DEFAULT_FALLBACK_PLANS);
      }
    } catch (err) {
      console.error("Failed to fetch subscriptions data:", err);
      setPlans(DEFAULT_FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName("");
    setFormPriceMonthly(formatRupiahInput("199000"));
    setFormMaxUnits("25");
    setFormMaxProperties("2");
    setFormStatus("ACTIVE");
    setFormFeatures([
      "Property Management",
      "Tenant Management",
      "Invoice & Payment",
      "WhatsApp Payment Reminder",
    ]);
    setNewFeatureInput("");
    setShowModal(true);
  };

  const openEditModal = (plan: SaaSPlanItem) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormPriceMonthly(formatRupiahInput(plan.priceMonthly));
    setFormMaxUnits(plan.maxUnits.toString());
    setFormMaxProperties(plan.maxProperties.toString());
    setFormStatus(plan.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    setFormFeatures([...(plan.features || [])]);
    setNewFeatureInput("");
    setShowModal(true);
  };

  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim();
    if (!trimmed) return;
    setFormFeatures((prev) => [...prev, trimmed]);
    setNewFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFormFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormFeatures((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Math.max(0, parseRupiahInput(formPriceMonthly));
    const numericMaxUnits = Math.max(0, parseInt(formMaxUnits, 10) || 0);
    const numericMaxProperties = Math.max(0, parseInt(formMaxProperties, 10) || 0);

    if (!formName || numericPrice < 0) return alert("Nama paket dan harga (minimal 0) wajib diisi");

    if (editingPlan && (editingPlan.subscriberCount || 0) > 0 && formStatus === "INACTIVE") {
      return alert("Paket ini sudah memiliki subscriber aktif dan tidak dapat dinonaktifkan.");
    }

    setIsSubmitting(true);
    try {
      const featuresArray = formFeatures.map((f) => f.trim()).filter(Boolean);

      const action = editingPlan ? "UPDATE_PLAN" : "CREATE_PLAN";
      const bodyPayload = {
        action,
        planId: editingPlan?.id,
        name: formName,
        priceMonthly: numericPrice,
        priceYearly: numericPrice * 10,
        maxUnits: numericMaxUnits,
        maxProperties: numericMaxProperties,
        status: formStatus,
        features: featuresArray,
      };

      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (json.success) {
        // Also update local state for fast UI reflection
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan?.id
              ? {
                  ...p,
                  name: formName,
                  priceMonthly: numericPrice,
                  maxUnits: numericMaxUnits,
                  maxProperties: numericMaxProperties,
                  status: formStatus,
                  features: featuresArray,
                }
              : p
          )
        );
        setSuccessMsg(
          editingPlan
            ? `Paket "${formName}" berhasil diperbarui (Status: ${formStatus === "ACTIVE" ? "Aktif" : "Non-Aktif"})!`
            : `Paket baru "${formName}" berhasil ditambahkan!`
        );
        setShowModal(false);
        fetchData();
      } else {
        alert("Gagal menyimpan paket: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamically calculate the most popular plan based on subscriberCount / plan tier
  const mostPopularPlan = plans.length > 0
    ? [...plans].sort((a, b) => {
        if ((b.subscriberCount || 0) !== (a.subscriberCount || 0)) {
          return (b.subscriberCount || 0) - (a.subscriberCount || 0);
        }
        if (b.name.toLowerCase().includes("business")) return 1;
        if (a.name.toLowerCase().includes("business")) return -1;
        if (b.name.toLowerCase().includes("pro")) return 1;
        return 0;
      })[0]
    : null;

  const filteredPlans = plans.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTargetText = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("basic")) return "Target: Pemilik kos kecil atau satu bangunan.";
    if (n.includes("business")) return "Target: Pemilik properti menengah.";
    if (n.includes("pro")) return "Target: Pengelola properti skala besar.";
    return "Target: Pengelola properti SaaS ARVENTRA.";
  };

  const getRoomLimitText = (maxUnits: number) => {
    if (maxUnits >= 999) return "Limit: Unlimited";
    return `Limit: ${maxUnits} Rooms`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <IconLoader2 className="size-8 animate-spin text-[#8FA28A]" />
        <p className="text-sm font-bold text-gray-500">Memuat data paket langganan SaaS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title Bar */}
      <div className="space-y-1">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <span>PLATFORM ADMIN</span>
          <span>/</span>
          <span>SUBSCRIPTIONS & BILLING</span>
          <span>/</span>
          <span className="text-[#8FA28A]">SUBSCRIPTION PACKAGE</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2F332E] dark:text-white tracking-tight">
              Subscription Packages
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Kelola paket langganan SaaS dan batas fitur untuk owner ARVENTRA.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold text-xs gap-1.5 rounded-xl shadow-sm h-10 px-4 shrink-0"
          >
            <IconPlus className="size-4" /> Tambah Paket
          </Button>
        </div>
      </div>

      {/* Alert Banner Success */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <IconCheck className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Top 4 Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: TOTAL PACKAGES */}
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-[#242823] text-white shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              TOTAL PACKAGES
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-black text-white">{plans.length}</p>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">Terdaftar di sistem</p>
          </CardContent>
        </Card>

        {/* Card 2: ACTIVE PACKAGES */}
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-[#242823] text-white shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              ACTIVE PACKAGES
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-black text-white">
                {plans.filter((p) => (p.status || "ACTIVE") === "ACTIVE").length}
              </p>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">Tersedia untuk owner baru</p>
          </CardContent>
        </Card>

        {/* Card 3: MOST POPULAR */}
        <Card className="rounded-2xl border border-[#C8A96B]/50 bg-[#242823] text-white shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wider">
              MOST POPULAR
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-black text-[#C8A96B]">
                {mostPopularPlan ? mostPopularPlan.name : "-"}
              </p>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">High Conversion Plan</p>
          </CardContent>
        </Card>

        {/* Card 4: TOTAL SUBSCRIBERS */}
        <Card className="rounded-2xl border border-[#C7D3C0]/40 bg-[#242823] text-white shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              TOTAL SUBSCRIBERS
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-black text-white">{totalSubscribersCount}</p>
            </div>
            <p className="text-[11px] text-[#8FA28A] font-bold mt-1">Owner aktif berlangganan</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Overview Card Paket Langganan Utama */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#2F332E] dark:text-white">
            Overview Card Paket Langganan Utama
          </h2>
          <span className="text-xs font-bold text-gray-400">{plans.length} Paket Aktif</span>
        </div>

        {/* Pricing Tier Cards Grid */}
        <div className={`grid gap-6 ${plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {plans.map((plan) => {
            const isPopular = plan.id === mostPopularPlan?.id;
            const isActiveStatus = (plan.status || "ACTIVE") === "ACTIVE";

            return (
              <Card
                key={plan.id}
                className={`rounded-3xl border shadow-md relative flex flex-col justify-between transition-all ${
                  isPopular
                    ? "border-[#8FA28A] bg-white dark:bg-[#1E221E] ring-2 ring-[#8FA28A]/50"
                    : "border-[#C7D3C0]/50 dark:border-[#383E36] bg-white dark:bg-[#242823]"
                }`}
              >
                {/* Popular Top Floating Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8FA28A] text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider shadow-sm">
                    POPULAR
                  </div>
                )}

                <CardContent className="p-6 space-y-5">
                  {/* Card Header Title & Active Badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#2F332E] dark:text-white">{plan.name}</h3>
                    <Badge
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isActiveStatus
                          ? "bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40"
                          : "bg-amber-500/20 text-amber-500 border-amber-500/40"
                      }`}
                    >
                      {isActiveStatus ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#8FA28A]">{formatIDR(plan.priceMonthly)}</span>
                      <span className="text-xs font-semibold text-gray-400">/ monthly</span>
                    </div>
                    {/* Limit Rooms Badge */}
                    <div className="inline-flex items-center gap-1.5 mt-2 rounded-full border border-[#C7D3C0]/50 bg-[#F7F4ED] dark:bg-[#1E221E] px-3 py-1 text-xs font-bold text-gray-700 dark:text-gray-300">
                      <IconBed className="size-3.5 text-[#C8A96B]" />
                      <span>{getRoomLimitText(plan.maxUnits)}</span>
                    </div>
                  </div>

                  {/* Target Text */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {getTargetText(plan.name)}
                  </p>

                  <div className="border-t border-[#C7D3C0]/30 dark:border-[#383E36] pt-4 space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      FITUR YANG TERMASUK:
                    </span>
                    <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2">
                          <IconCheck className="size-4 text-[#8FA28A] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                {/* Card Bottom Footer */}
                <div className="p-6 pt-0 border-t border-[#C7D3C0]/30 dark:border-[#383E36] mt-4 flex items-center justify-between pt-4">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {plan.subscriberCount ?? 0} Subscribers
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(plan)}
                    className="text-xs font-bold gap-1.5 rounded-xl border-[#383E36] hover:bg-[#8FA28A] hover:text-white transition-all h-8"
                  >
                    <IconPencil className="size-3.5" /> Edit Package
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: Package Configuration Table */}
      <Card className="rounded-3xl border border-[#C7D3C0]/40 bg-white dark:bg-[#242823] dark:border-[#383E36] shadow-sm">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-[#2F332E] dark:text-white">
              Package Configuration
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Tabel pengaturan lengkap paket langganan, billing, dan manajemen aksi admin.
            </CardDescription>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-2.5 size-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari paket..."
              className="w-full rounded-xl border border-[#C7D3C0]/60 dark:border-[#383E36] bg-white dark:bg-[#1E221E] pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#8FA28A]"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-[#C7D3C0]/40 dark:border-[#383E36] overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F4ED] dark:bg-[#1E221E] text-gray-600 dark:text-gray-300 font-bold border-b border-[#C7D3C0]/40 dark:border-[#383E36]">
                <tr>
                  <th className="p-3.5">PACKAGE</th>
                  <th className="p-3.5">PRICE</th>
                  <th className="p-3.5">BILLING</th>
                  <th className="p-3.5">ROOM LIMIT</th>
                  <th className="p-3.5">ACTIVE SUBSCRIBERS</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C7D3C0]/30 dark:divide-[#383E36]">
                {filteredPlans.map((plan) => {
                  const isPopular = plan.id === mostPopularPlan?.id;
                  const isActiveStatus = (plan.status || "ACTIVE") === "ACTIVE";

                  return (
                    <tr key={plan.id} className="hover:bg-[#F7F4ED]/50 dark:hover:bg-[#1E221E]/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#2F332E] dark:text-white">{plan.name}</span>
                          {isPopular && (
                            <Badge className="bg-[#8FA28A] text-white text-[9px] font-bold uppercase px-2 py-0.2">
                              POPULAR
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {getTargetText(plan.name).replace("Target: ", "")}
                        </p>
                      </td>
                      <td className="p-3.5 font-bold text-[#2F332E] dark:text-white">
                        {formatIDR(plan.priceMonthly)}
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-300">Monthly</td>
                      <td className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        {getRoomLimitText(plan.maxUnits).replace("Limit: ", "")}
                      </td>
                      <td className="p-3.5 font-bold text-[#8FA28A]">
                        {plan.subscriberCount ?? 0} Owners
                      </td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            isActiveStatus
                              ? "bg-[#8FA28A]/20 text-[#8FA28A] border-[#8FA28A]/40"
                              : "bg-amber-500/20 text-amber-500 border-amber-500/40"
                          }`}
                        >
                          {isActiveStatus ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(plan)}
                            className="h-7 text-xs font-bold gap-1 rounded-xl border-[#383E36]"
                          >
                            <IconPencil className="size-3.5" /> Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form Create / Edit SaaS Plan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-[#242823] border border-[#383E36] text-white shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#383E36] pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#8FA28A]/15 border border-[#8FA28A]/30 text-[#8FA28A]">
                  <IconBuildingStore className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingPlan ? `Edit Paket SaaS: ${editingPlan.name}` : "Tambah Paket Langganan Baru"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Pengaturan batas properti, unit kamar, harga bulanan (Rupiah), status publikasi, dan daftar fitur akses SaaS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#383E36] transition-colors"
              >
                <IconX className="size-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <form onSubmit={handleSavePlan} className="space-y-5 text-xs overflow-y-auto pr-1 flex-1">
              {/* Status Paket Toggle Section */}
              {(() => {
                const hasSubscribers = editingPlan ? (editingPlan.subscriberCount || 0) > 0 : false;

                return (
                  <div className="rounded-2xl border border-[#383E36] bg-[#1E221E] p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="font-bold text-white text-xs block">Status Publikasi Paket SaaS</span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {formStatus === "ACTIVE"
                            ? "Paket ini aktif dan dapat dipilih oleh calon owner baru"
                            : "Paket ini non-aktif dan disembunyikan dari pilihan owner baru"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        disabled={hasSubscribers && formStatus === "ACTIVE"}
                        onClick={() => {
                          if (hasSubscribers && formStatus === "ACTIVE") return;
                          setFormStatus(formStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                        }}
                        className={`font-bold text-xs rounded-2xl px-4 py-2 gap-1.5 transition-all shrink-0 ${
                          hasSubscribers && formStatus === "ACTIVE"
                            ? "bg-gray-700/50 text-gray-400 border border-gray-600 cursor-not-allowed opacity-70"
                            : formStatus === "ACTIVE"
                            ? "bg-[#8FA28A]/20 text-[#8FA28A] border border-[#8FA28A]/40 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-[#8FA28A]/20 hover:text-[#8FA28A] hover:border-[#8FA28A]/40"
                        }`}
                      >
                        {formStatus === "ACTIVE" ? (
                          <>
                            <IconCheck className="size-4" /> Status: Aktif {hasSubscribers ? "(Terkunci)" : "(Klik untuk Nonaktifkan)"}
                          </>
                        ) : (
                          <>
                            <IconPower className="size-4" /> Status: Non-Aktif (Klik untuk Aktifkan)
                          </>
                        )}
                      </Button>
                    </div>

                    {hasSubscribers && (
                      <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1 pt-1 border-t border-[#383E36]">
                        ⚠️ Paket ini sudah memiliki {editingPlan?.subscriberCount} subscriber aktif, sehingga status paket tidak dapat dinonaktifkan.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Nama Paket SaaS */}
              <div className="space-y-1.5">
                <label className="block font-bold text-gray-300">
                  Nama Paket SaaS <span className="text-[#8FA28A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Enterprise / Business Plus"
                  className="w-full rounded-2xl border border-[#383E36] bg-[#1E221E] px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8FA28A] focus:outline-none transition-colors"
                />
              </div>

              {/* Grid 3 Kolom: Harga, Batas Kamar, Batas Properti */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-300">
                    Harga (IDR / bln) <span className="text-[#8FA28A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formPriceMonthly}
                    onChange={(e) => {
                      setFormPriceMonthly(formatRupiahInput(e.target.value));
                    }}
                    placeholder="Rp 199.000"
                    className="w-full rounded-2xl border border-[#383E36] bg-[#1E221E] px-4 py-3 text-xs text-[#8FA28A] font-extrabold focus:border-[#8FA28A] focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-300">Batas Kamar (Units) <span className="text-[#8FA28A]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formMaxUnits}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val, 10);
                      if (isNaN(parsed) || parsed < 0) {
                        setFormMaxUnits("0");
                      } else {
                        setFormMaxUnits(parsed.toString());
                      }
                    }}
                    placeholder="15 (Isi 99999 untuk Unlimited)"
                    className="w-full rounded-2xl border border-[#383E36] bg-[#1E221E] px-4 py-3 text-xs text-white focus:border-[#8FA28A] focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-300">Batas Properti <span className="text-[#8FA28A]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formMaxProperties}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val, 10);
                      if (isNaN(parsed) || parsed < 0) {
                        setFormMaxProperties("0");
                      } else {
                        setFormMaxProperties(parsed.toString());
                      }
                    }}
                    placeholder="1"
                    className="w-full rounded-2xl border border-[#383E36] bg-[#1E221E] px-4 py-3 text-xs text-white focus:border-[#8FA28A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Dynamic Feature Item List Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-300 flex items-center gap-1.5">
                    <IconSparkles className="size-4 text-[#C8A96B]" />
                    Daftar Fitur Akses Paket ({formFeatures.length} Fitur)
                  </label>
                  <span className="text-[11px] text-gray-400">Tiap fitur tampil sebagai 1 baris terpisah</span>
                </div>

                {/* Input Add New Feature Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Tulis nama fitur baru lalu klik 'Tambah Fitur'..."
                    className="flex-1 rounded-2xl border border-[#383E36] bg-[#1E221E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-[#8FA28A] focus:outline-none transition-colors"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold text-xs rounded-2xl px-4 shrink-0 gap-1"
                  >
                    <IconPlus className="size-4" /> Tambah Fitur
                  </Button>
                </div>
                <p className="text-[11px] text-[#8FA28A] font-bold flex items-center gap-1">
                  💡 Tap / klik pada teks fitur di bawah untuk mengedit fitur langsung
                </p>

                {/* Dynamic Features List Container */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formFeatures.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#383E36] p-4 text-center text-xs text-gray-500">
                      Belum ada fitur ditambahkan. Tuliskan nama fitur di atas lalu klik &apos;Tambah Fitur&apos;.
                    </div>
                  ) : (
                    formFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-2xl border border-[#383E36] bg-[#1E221E] px-3.5 py-2 transition-all hover:border-[#8FA28A]/50"
                      >
                        <div className="size-5 rounded-full bg-[#8FA28A]/20 text-[#8FA28A] flex items-center justify-center shrink-0">
                          <IconCheck className="size-3.5" />
                        </div>
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => handleFeatureChange(idx, e.target.value)}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Hapus fitur ini"
                        >
                          <IconTrash className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#383E36] shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border-[#383E36] text-gray-300 hover:bg-[#383E36] hover:text-white px-5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#8FA28A] hover:bg-[#8FA28A]/90 text-white font-bold rounded-2xl px-6 gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <IconCheck className="size-4" /> Simpan Paket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback seed plans if database initially has no SaaSPlan records
const DEFAULT_FALLBACK_PLANS: SaaSPlanItem[] = [
  {
    id: "plan-basic-id",
    name: "Basic",
    maxProperties: 1,
    maxUnits: 15,
    priceMonthly: 99000,
    priceYearly: 990000,
    subscriberCount: 42,
    status: "ACTIVE",
    features: [
      "Property Management",
      "Tenant Management",
      "Invoice & Payment",
      "WhatsApp Payment Reminder",
    ],
  },
  {
    id: "plan-business-id",
    name: "Business",
    maxProperties: 5,
    maxUnits: 50,
    priceMonthly: 249000,
    priceYearly: 2490000,
    subscriberCount: 67,
    status: "ACTIVE",
    features: [
      "Property Management",
      "Tenant Management",
      "Housekeeping",
      "OpEx Management",
      "AI Financial Insight",
      "Multi-Staff Role Access",
    ],
  },
  {
    id: "plan-pro-id",
    name: "Pro",
    maxProperties: 99,
    maxUnits: 99999,
    priceMonthly: 499000,
    priceYearly: 4990000,
    subscriberCount: 19,
    status: "ACTIVE",
    features: [
      "Semua fitur Business",
      "Unlimited Kamar & Properti",
      "Custom Workflow",
      "Advanced Audit Log",
      "Priority Support",
    ],
  },
];

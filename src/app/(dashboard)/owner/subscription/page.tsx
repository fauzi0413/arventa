"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconX,
  IconSparkles,
  IconBuilding,
  IconBed,
  IconBrush,
  IconArrowLeft,
  IconShoppingCart,
  IconPlus,
  IconTrash,
  IconUpload,
  IconFileCheck,
  IconReceipt,
  IconCalendarTime,
  IconDiscount2,
  IconBuildingBank,
  IconCopy,
  IconInfoCircle,
  IconFileText,
  IconClock,
  IconBrandWhatsapp,
  IconHistory,
  IconMail,
  IconLoader2,
  IconShieldCheck,
  IconEye,
  IconZoomIn,
  IconPrinter,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PlanItem {
  id: string;
  name: string;
  maxProperties: number;
  maxUnits: number;
  maxHousekeeping: number;
  priceMonthly: number;
  priceYearly: number;
  isDefault: boolean;
  subscriberCount?: number;
  featureCodes: string[];
  features: string[];
}

interface MasterFeatureItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
}

interface AddOnItem {
  id: string;
  name: string;
  category: string;
  unitQuota: number;
  priceMonthly: number;
  priceYearly: number;
  description?: string;
}

export default function OwnerSubscriptionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [masterFeatures, setMasterFeatures] = useState<MasterFeatureItem[]>([]);
  const [addOns, setAddOns] = useState<AddOnItem[]>([]);
  const [ownerStatus, setOwnerStatus] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [supportEmail, setSupportEmail] = useState<string>("support@arventa.id");

  // Copy state
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  const handleCopyAccount = (accNum: string, id: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccountId(id);
    setTimeout(() => setCopiedAccountId(null), 2000);
  };

  // Cart & Duration State (1, 3, 6, 12 months)
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanItem | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnItem[]>([]);
  const [durationMonths, setDurationMonths] = useState<number>(1);

  // Modal Step 1: Cart Details Modal
  const [showCartDetailsModal, setShowCartDetailsModal] = useState(false);

  // Modal Step 2: Unique Billing Invoice & Payment Proof Upload Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Invoice & Payment Proof Upload State
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isReuploadingProof, setIsReuploadingProof] = useState(false);
  const [paymentVerifiedToast, setPaymentVerifiedToast] = useState<string | null>(null);
  const [isSendingConfirmEmail, setIsSendingConfirmEmail] = useState(false);
  const [emailConfirmedToast, setEmailConfirmedToast] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"bca" | "qris" | "wa">("bca");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Transaction History Modal Pagination & Detail State
  const [ownerInvoices, setOwnerInvoices] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCurrentPage, setHistoryCurrentPage] = useState<number>(1);
  const [selectedHistoryDetailItem, setSelectedHistoryDetailItem] = useState<any | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [plansRes, cartRes] = await Promise.all([
          fetch("/api/owner/plans"),
          fetch("/api/owner/cart"),
        ]);
        const plansJson = await plansRes.json();
        const cartJson = await cartRes.json();

        if (plansJson.success && plansJson.data) {
          const loadedPlans: PlanItem[] = plansJson.data.plans || [];
          const loadedAddOns: AddOnItem[] = plansJson.data.addOns || [];
          setPlans(loadedPlans);
          setMasterFeatures(plansJson.data.masterFeatures || []);
          setAddOns(loadedAddOns);
          setOwnerStatus(plansJson.data.ownerStatus || null);
          setPaymentMethods(plansJson.data.paymentMethods || []);
          if (plansJson.data.invoices) {
            setOwnerInvoices(plansJson.data.invoices);
          }
          if (plansJson.data.supportEmail) {
            setSupportEmail(plansJson.data.supportEmail);
          }

          const currentPlanNameStr = (plansJson.data.ownerStatus?.planName || "Perintis").toLowerCase();
          const currentPlanIdStr = plansJson.data.ownerStatus?.planId || "";

          if (plansJson.data.pendingInvoice) {
            setCreatedInvoice(plansJson.data.pendingInvoice);
          }

          // Restore DB Cart from PostgreSQL only if cart has items and plan is not already active
          if (cartJson.success && cartJson.data) {
            const dbCart = cartJson.data;
            if (dbCart.selectedPlanId) {
              const p = loadedPlans.find((item) => item.id === dbCart.selectedPlanId);
              // If the plan in DB cart is already the owner's current active plan, auto-clear DB cart!
              if (p && (p.id === currentPlanIdStr || p.name.toLowerCase() === currentPlanNameStr)) {
                syncCartToDB(null, []);
                setSelectedPlanForUpgrade(null);
              } else if (p) {
                setSelectedPlanForUpgrade(p);
              }
            }
            if (Array.isArray(dbCart.items) && dbCart.items.length > 0) {
              const restoredAddOns = dbCart.items
                .map((item: any) => item.addOn)
                .filter(Boolean);
              setSelectedAddOns(restoredAddOns);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load owner plans data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatRupiah = (val: number) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const currentPlanName = ownerStatus?.planName || "Perintis";

  // DB Cart Sync Helper
  const syncCartToDB = async (
    plan: PlanItem | null,
    addons: AddOnItem[]
  ) => {
    try {
      await fetch("/api/owner/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPlanId: plan ? plan.id : null,
          addOnIds: addons.map((a) => a.id),
        }),
      });
    } catch (err) {
      console.error("Failed to sync cart to DB:", err);
    }
  };

  const handleSelectPlan = (plan: PlanItem | null) => {
    setSelectedPlanForUpgrade(plan);
    syncCartToDB(plan, selectedAddOns);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async (inv: any) => {
    if (!inv) return;
    setIsGeneratingPDF(true);

    try {
      let jspdfLib = (window as any).jspdf;
      if (!jspdfLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        jspdfLib = (window as any).jspdf;
      }

      const { jsPDF } = jspdfLib;
      const isPaid = inv.status === "PAID";
      const statusText = isPaid
        ? "LUNAS (PAID)"
        : inv.status === "PENDING_VERIFICATION"
        ? "MENUNGGU VERIFIKASI"
        : inv.status === "PENDING"
        ? "BELUM DIBAYAR"
        : "DIBATALKAN";

      const doc = new jsPDF("p", "mm", "a4");

      // Outer Card Box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 12, 186, 265, 4, 4, "FD");

      // Accent Line Top
      doc.setFillColor(143, 162, 138);
      doc.rect(20, 20, 170, 2, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(36, 40, 35);
      doc.text("ARVENTA", 20, 32);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("SAAS PROPERTY MANAGEMENT PLATFORM", 20, 37);

      // Invoice Badge & Info (Right Side)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(143, 162, 138);
      doc.text("INVOICE & KWITANSI RESMI", 190, 28, { align: "right" });

      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.setTextColor(180, 83, 9);
      doc.text(inv.invoiceNumber, 190, 34, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const dateStr = `Tgl Penerbitan: ${new Date(inv.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
      doc.text(dateStr, 190, 39, { align: "right" });

      // Line Separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 44, 190, 44);

      // Customer Box (Left)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 50, 81, 26, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, 50, 81, 26, 3, 3, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("DITERBITKAN UNTUK (PELANGGAN):", 24, 56);

      const ownerNameText = inv.ownerName || ownerStatus?.ownerName || ownerStatus?.fullName || ownerStatus?.name || "Owner Properti";
      const ownerEmailText = inv.ownerEmail || ownerStatus?.ownerEmail || ownerStatus?.email || "-";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(ownerNameText, 24, 63);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(ownerEmailText, 24, 69);

      // Status Box (Right)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(109, 50, 81, 26, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(109, 50, 81, 26, 3, 3, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("STATUS TAGIHAN & JATUH TEMPO:", 113, 56);

      if (isPaid) {
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(134, 239, 172);
        doc.roundedRect(113, 58, 48, 6.5, 3, 3, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(21, 128, 61);
        doc.text(statusText, 137, 62.5, { align: "center" });
      } else {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(113, 58, 48, 6.5, 3, 3, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text(statusText, 137, 62.5, { align: "center" });
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const dueDateStr = `Jatuh Tempo: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}`;
      doc.text(dueDateStr, 113, 71);

      // Items Table Header
      const startY = 84;
      doc.setFillColor(36, 40, 35);
      doc.rect(20, startY, 170, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("DESKRIPSI LAYANAN SAAS", 24, startY + 5.5);
      doc.text("DURASI", 125, startY + 5.5, { align: "center" });
      doc.text("TOTAL NOMINAL", 186, startY + 5.5, { align: "right" });

      // Table Rows
      let currentY = startY + 8;
      const items = Array.isArray(inv.items) && inv.items.length > 0
        ? inv.items
        : [{ itemTitle: `Langganan SaaS Platform - ${inv.planName || "Paket SaaS"}`, amount: inv.amount }];

      items.forEach((item: any, idx: number) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.rect(20, currentY, 170, 9, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(item.itemTitle || "Layanan SaaS", 24, currentY + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("1 Bulan", 125, currentY + 6, { align: "center" });

        doc.setFont("courier", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(180, 83, 9);
        doc.text(formatRupiah(item.amount || 0), 186, currentY + 6, { align: "right" });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(20, currentY + 9, 190, currentY + 9);

        currentY += 9;
      });

      // Summary
      currentY += 8;
      const sumBoxX = 120;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Subtotal:", sumBoxX, currentY);
      doc.setFont("courier", "normal");
      doc.text(formatRupiah(inv.amount || 0), 190, currentY, { align: "right" });

      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Pajak (0% Included):", sumBoxX, currentY);
      doc.setFont("courier", "normal");
      doc.text("Rp 0", 190, currentY, { align: "right" });

      currentY += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(sumBoxX, currentY, 190, currentY);

      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(180, 83, 9);
      doc.text("TOTAL BAYAR:", sumBoxX, currentY);
      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      doc.text(formatRupiah(inv.amount || 0), 190, currentY, { align: "right" });

      currentY += 2;
      doc.line(sumBoxX, currentY, 190, currentY);

      // Footer
      const footerY = Math.max(currentY + 25, 235);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(20, footerY, 190, footerY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Catatan Resmi / Disclaimer:", 20, footerY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(
        "Dokumen ini diterbitkan secara resmi oleh ARVENTA SaaS Billing Controller. Berkelayakan hukum sebagai bukti kwitansi transaksi langganan yang sah.",
        20,
        footerY + 10,
        { maxWidth: 120 }
      );

      // Stamp Mark
      if (isPaid) {
        doc.setDrawColor(21, 128, 61);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(145, footerY + 4, 45, 12, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(21, 128, 61);
        doc.text("VERIFIED PAID", 167.5, footerY + 11.5, { align: "center" });
      } else {
        doc.setDrawColor(180, 83, 9);
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(145, footerY + 4, 45, 12, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(180, 83, 9);
        doc.text("PENDING AUDIT", 167.5, footerY + 11.5, { align: "center" });
      }

      doc.save(`Invoice-${inv.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Direct PDF export error:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const toggleAddOnCart = (addon: AddOnItem) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((item) => item.id === addon.id);
      const nextAddOns = exists
        ? prev.filter((item) => item.id !== addon.id)
        : [...prev, addon];
      syncCartToDB(selectedPlanForUpgrade, nextAddOns);
      return nextAddOns;
    });
  };

  const isAddOnInCart = (addonId: string) => {
    return selectedAddOns.some((item) => item.id === addonId);
  };

  // Base Monthly Prices Calculation
  const baseMonthlyPlanPrice = selectedPlanForUpgrade
    ? Number(selectedPlanForUpgrade.priceMonthly) || 0
    : 0;

  const baseMonthlyAddOnsPrice = selectedAddOns.reduce((sum, item) => {
    const p = Number(item.priceMonthly);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  const baseMonthlyTotal = baseMonthlyPlanPrice + baseMonthlyAddOnsPrice;

  // Standard Original Price Calculation (priceMonthly * durationMonths)
  const calculateStandardDurationPrice = (m: number) => {
    let stdPlanCost = 0;
    if (selectedPlanForUpgrade) {
      const monthly = Number(selectedPlanForUpgrade.priceMonthly) || 0;
      stdPlanCost = Math.round(monthly * m);
    }

    let stdAddOnsCost = 0;
    selectedAddOns.forEach((addon) => {
      const monthly = Number(addon.priceMonthly) || 0;
      stdAddOnsCost += Math.round(monthly * m);
    });

    return {
      stdPlanCost,
      stdAddOnsCost,
      stdTotalCost: stdPlanCost + stdAddOnsCost,
    };
  };

  // Final Net Duration-Based Calculation
  const calculateDurationPrice = (m: number) => {
    let planCost = 0;
    if (selectedPlanForUpgrade) {
      const monthly = Number(selectedPlanForUpgrade.priceMonthly);
      const yearly = Number(selectedPlanForUpgrade.priceYearly);
      if (m === 12) planCost = yearly > 0 ? yearly : monthly * 12;
      else planCost = Math.round(monthly * m);
    }

    let addOnsCost = 0;
    selectedAddOns.forEach((addon) => {
      const monthly = Number(addon.priceMonthly);
      const yearly = Number(addon.priceYearly);
      if (m === 12) addOnsCost += yearly > 0 ? yearly : monthly * 12;
      else addOnsCost += Math.round(monthly * m);
    });

    return {
      planCost,
      addOnsCost,
      totalCost: planCost + addOnsCost,
    };
  };

  // Dynamic Annual Discount Calculator
  const calculateAnnualDiscount = () => {
    let fullStandard12MonthsTotal = 0;
    let actualYearlyConfiguredTotal = 0;

    if (selectedPlanForUpgrade) {
      const monthly = Number(selectedPlanForUpgrade.priceMonthly) || 0;
      const yearly = Number(selectedPlanForUpgrade.priceYearly) || 0;
      fullStandard12MonthsTotal += monthly * 12;
      actualYearlyConfiguredTotal += yearly > 0 ? yearly : monthly * 12;
    }

    selectedAddOns.forEach((addon) => {
      const monthly = Number(addon.priceMonthly) || 0;
      const yearly = Number(addon.priceYearly) || 0;
      fullStandard12MonthsTotal += monthly * 12;
      actualYearlyConfiguredTotal += yearly > 0 ? yearly : monthly * 12;
    });

    const savingsAmount = fullStandard12MonthsTotal - actualYearlyConfiguredTotal;
    const discountPercent =
      fullStandard12MonthsTotal > 0 && savingsAmount > 0
        ? Math.round((savingsAmount / fullStandard12MonthsTotal) * 100)
        : 0;

    return {
      savingsAmount,
      discountPercent,
      fullStandard12MonthsTotal,
      actualYearlyConfiguredTotal,
    };
  };

  const stdPriceSummary = calculateStandardDurationPrice(durationMonths);
  const durationPriceSummary = calculateDurationPrice(durationMonths);
  const annualDiscountInfo = calculateAnnualDiscount();
  const totalCartItemCount = (selectedPlanForUpgrade ? 1 : 0) + selectedAddOns.length;

  // Step 2: Create Unique Billing Invoice in DB & Show Payment Proof Modal
  const handleProcessCheckout = async () => {
    try {
      setIsSubmittingOrder(true);
      const res = await fetch("/api/owner/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanForUpgrade ? selectedPlanForUpgrade.id : null,
          addOnIds: selectedAddOns.map((a) => a.id),
          durationMonths,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.invoice) {
        setCreatedInvoice(json.data.invoice);

        // CLEAR CART IMMEDIATELY UPON ORDER CREATION
        setSelectedPlanForUpgrade(null);
        setSelectedAddOns([]);
        setShowCartDetailsModal(false);
        setShowCheckoutModal(true);

        setProofFile(null);
        setProofPreview(null);
        setPaymentVerifiedToast(null);
      } else {
        alert(json.message || "Gagal membuat invoice tagihan");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Drag & drop state for payment proof upload
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const processSelectedFile = (file: File) => {
    setProofFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // File Upload Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Upload Payment Proof Receipt to DB
  const handleUploadPaymentProof = async () => {
    if (!createdInvoice || !proofFile) return;
    try {
      setIsUploadingProof(true);
      const formData = new FormData();
      formData.append("file", proofFile);

      const res = await fetch(`/api/owner/invoices/${createdInvoice.id}/upload-proof`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCreatedInvoice(json.data);
        setIsReuploadingProof(false);
        setPaymentVerifiedToast(
          `Bukti transfer untuk Nomor Billing ${json.data.invoiceNumber} berhasil dikirim ke database! Status tagihan kini Menunggu Verifikasi Admin.`
        );

        if (paymentMethod === "wa") {
          const text = encodeURIComponent(
            `Halo Admin ARVENTA, saya telah mengunggah bukti transfer untuk *Nomor Billing ${json.data.invoiceNumber}* sebesar *${formatRupiah(
              Number(json.data.amount)
            )}*. Mohon diverifikasi.`
          );
          window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
        }
      } else {
        alert(json.message || "Gagal mengunggah bukti transfer");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Send Confirmation Email Trigger
  const handleSendConfirmEmail = async () => {
    if (!createdInvoice) return;
    try {
      setIsSendingConfirmEmail(true);
      const res = await fetch(`/api/owner/invoices/${createdInvoice.id}/send-confirm-email`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setEmailConfirmedToast(json.message);
      } else {
        alert(json.message || "Gagal mengirimkan email konfirmasi");
      }
    } catch (err) {
      console.error("Send confirm email error:", err);
    } finally {
      setIsSendingConfirmEmail(false);
    }
  };

  const getSubscriptionTimeRemaining = () => {
    if (!ownerStatus?.endDate) return null;
    const end = new Date(ownerStatus.endDate).getTime();
    const now = new Date().getTime();
    const diffTime = end - now;

    if (diffTime <= 0) {
      return { days: 0, months: 0, expired: true };
    }

    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    return { days, months, expired: false };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8FA28A] border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">
          Memuat data paket langganan SaaS ARVENTA dari database...
        </p>
      </div>
    );
  }

  const hasPendingInvoice =
    createdInvoice && ["PENDING", "PENDING_VERIFICATION"].includes(createdInvoice.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-8 px-4 sm:px-8 space-y-10 max-w-7xl mx-auto pb-32">
      {/* --------------------------------------------------------------------- */}
      {/* BACK BUTTON & HERO HEADER */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <IconArrowLeft className="h-4 w-4" />
            <span>Kembali ke Dashboard</span>
          </Button>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider shadow-xs">
          <IconSparkles className="h-4 w-4 text-amber-600" />
          <span>Paket & Lisensi SaaS Arventa</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
          Pilih Paket Langganan Properti Anda
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Tingkatkan kapasitas unit kamar, kelola tim operasional housekeeping, dan tambahkan modul Add-On sesuai kebutuhan bisnis Anda.
        </p>

        {/* Clean Info Banner about Monthly Base Catalog */}
        <div className="pt-2 flex items-center justify-center">
          <div className="px-4 py-2 rounded-2xl bg-muted/60 border border-border text-xs font-medium text-muted-foreground flex items-center gap-2">
            <IconDiscount2 className="h-4 w-4 text-[#8FA28A] shrink-0" />
            <span>
              Tarif di bawah tercantum per bulan. Anda dapat memilih jangka waktu (1, 3, 6, atau 12 bulan) saat memeriksa Rincian Keranjang.
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* ACTIVE SUBSCRIPTION EXPIRATION STATUS CARD */}
      {/* --------------------------------------------------------------------- */}
      {ownerStatus && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5 border-2 border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-black shrink-0 shadow-md">
              <IconShieldCheck className="size-6" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-0.5">
                  PAKET AKTIF SAAT INI: {ownerStatus.planName || "Perintis"}
                </Badge>

                {(() => {
                  const rem = getSubscriptionTimeRemaining();
                  if (!rem) {
                    return (
                      <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-2.5 py-0.5">
                        Masa Aktif: Selamanya (Default)
                      </Badge>
                    );
                  }
                  if (rem.expired) {
                    return (
                      <Badge variant="destructive" className="font-bold text-xs px-2.5 py-0.5">
                        Expired / Lisensi Habis
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-2.5 py-0.5 gap-1">
                      <IconCalendarTime className="size-3.5 text-emerald-600" />
                      <span>
                        Sisa Masa Aktif: {rem.days} Hari {rem.months > 0 ? `(~${rem.months} Bulan)` : ""}
                      </span>
                    </Badge>
                  );
                })()}
              </div>

              <p className="text-xs text-muted-foreground pt-0.5">
                {ownerStatus.endDate ? (
                  <>
                    Masa Lisensi Berlaku s/d:{" "}
                    <span className="font-extrabold text-foreground">
                      {new Date(ownerStatus.endDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </>
                ) : (
                  "Paket dasar gratis tanpa batasan waktu."
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5 font-medium">
                <span>Kapasitas: <strong className="text-foreground">{ownerStatus.maxProperties} Properti</strong></span>
                <span>•</span>
                <span><strong className="text-foreground">{ownerStatus.maxUnits} Kamar/Unit</strong></span>
                <span>•</span>
                <span><strong className="text-foreground">{ownerStatus.maxHousekeeping} Housekeeping</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setShowHistoryModal(true)}
              variant="outline"
              size="sm"
              className="font-bold text-xs rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 cursor-pointer shadow-xs"
            >
              <IconHistory className="size-4" />
              <span>Lihat Riwayat Pembayaran</span>
            </Button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* PLANS CARDS GRID (Base Monthly Pricing) */}
      {/* --------------------------------------------------------------------- */}
      {(() => {
        const popularPlanId = (() => {
          if (!plans.length) return null;
          const nonDefaultPlans = plans.filter((p) => !p.isDefault);
          const sortedBySubscribers = [...nonDefaultPlans].sort(
            (a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0)
          );
          if (sortedBySubscribers.length > 0 && (sortedBySubscribers[0].subscriberCount || 0) > 0) {
            return sortedBySubscribers[0].id;
          }
          const juragan = plans.find((p) => p.name.toLowerCase() === "juragan");
          if (juragan) return juragan.id;
          return nonDefaultPlans[0]?.id || plans[0]?.id;
        })();

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 xl:gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrentPlan = plan.name.toLowerCase() === currentPlanName.toLowerCase();
              const isPopular = plan.id === popularPlanId && !isCurrentPlan;
              const isSelectedForUpgrade = selectedPlanForUpgrade?.id === plan.id;
              const displayPrice = plan.priceMonthly;

              // Calculate exact annual discount % if priceYearly exists
              const stdYearlyCost = plan.priceMonthly * 12;
              const yearlySavings = stdYearlyCost - plan.priceYearly;
              const yearlyDiscountPct =
                stdYearlyCost > 0 && yearlySavings > 0
                  ? Math.round((yearlySavings / stdYearlyCost) * 100)
                  : 0;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl transition-all duration-300 overflow-hidden ${isSelectedForUpgrade
                    ? "border-2 border-[#8FA28A] bg-card shadow-xl ring-2 ring-[#8FA28A]/30"
                    : isCurrentPlan
                      ? "border-2 border-emerald-500 bg-card shadow-lg ring-2 ring-emerald-500/20"
                      : isPopular
                        ? "border-2 border-amber-500/80 bg-card shadow-xl dark:bg-amber-950/10"
                        : "border border-border bg-card/60 hover:border-sidebar-border hover:shadow-md"
                    }`}
                >
                  {/* Top Banner Badge */}
                  {isCurrentPlan ? (
                    <div className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
                      <IconCheck className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Paket Anda Saat Ini</span>
                    </div>
                  ) : isPopular ? (
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
                      <IconSparkles className="h-3.5 w-3.5" />
                      <span>Paling Populer</span>
                    </div>
                  ) : (
                    <div className="h-6 bg-muted/20 border-b border-border/30" />
                  )}

                  <CardContent className="p-4 sm:p-5 lg:p-4 xl:p-6 space-y-6 flex-1 flex flex-col justify-between">
                    {/* Plan Title & Price */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                        {plan.isDefault && (
                          <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-700 border-amber-300">
                            Default
                          </Badge>
                        )}
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1 whitespace-nowrap flex-nowrap">
                          <span className="text-[21px] sm:text-2xl lg:text-[20px] xl:text-3xl font-black text-foreground tracking-tight">
                            {formatRupiah(displayPrice)}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            /bulan
                          </span>
                        </div>
                        {plan.priceYearly > 0 && (
                          <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 whitespace-nowrap">
                            ~{formatRupiah(Math.round(plan.priceYearly / 12))} /bulan
                            {yearlyDiscountPct > 0 ? ` (opsi tahunan hemat ${yearlyDiscountPct}%)` : " (opsi tahunan)"}
                          </p>
                        )}
                      </div>

                      {/* Quota Highlights */}
                      <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <IconBuilding className="h-4 w-4 text-[#8FA28A]" /> Properti
                          </span>
                          <span className="font-bold text-foreground">{plan.maxProperties} Properti</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <IconBed className="h-4 w-4 text-[#8FA28A]" /> Kamar / Unit
                          </span>
                          <span className="font-bold text-foreground">{plan.maxUnits} Kamar</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <IconBrush className="h-4 w-4 text-[#8FA28A]" /> Housekeeping
                          </span>
                          <span className="font-bold text-foreground">{plan.maxHousekeeping} Akun</span>
                        </div>
                      </div>
                    </div>

                    {/* Features Checklist */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                        Fitur Sistem Yang Termasuk:
                      </span>
                      <ul className="space-y-2 text-xs">
                        {masterFeatures.map((feat) => {
                          const isIncluded = plan.featureCodes?.includes(feat.code);
                          return (
                            <li key={feat.id} className="flex items-start gap-2.5">
                              {isIncluded ? (
                                <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <IconCheck className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-muted text-muted-foreground/40 flex items-center justify-center shrink-0 mt-0.5">
                                  <IconX className="h-3 w-3 stroke-[2]" />
                                </div>
                              )}
                              <span
                                className={
                                  isIncluded
                                    ? "font-bold text-foreground leading-tight"
                                    : "text-muted-foreground/60 line-through text-[11px]"
                                }
                              >
                                {feat.name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* CTA Action Button */}
                    <div className="pt-4 border-t border-border/60">
                      {isCurrentPlan ? (
                        isSelectedForUpgrade ? (
                          <Button
                            onClick={() => handleSelectPlan(null)}
                            className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <IconCheck className="h-4 w-4 stroke-[3]" />
                            <span>Dipilih Perpanjang (Batal)</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSelectPlan(plan)}
                            className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <IconPlus className="h-4 w-4" />
                            <span>Perpanjang Masa Aktif {plan.name}</span>
                          </Button>
                        )
                      ) : isSelectedForUpgrade ? (
                        <Button
                          onClick={() => handleSelectPlan(null)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <IconCheck className="h-4 w-4 stroke-[3]" />
                          <span>Dipilih (Klik untuk Batal)</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${isPopular
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-[#8FA28A] hover:bg-[#7D9178] text-white"
                            }`}
                        >
                          <span>Pilih Paket {plan.name}</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}

      {/* --------------------------------------------------------------------- */}
      {/* SAAS ADD-ONS CATALOG SECTION */}
      {/* --------------------------------------------------------------------- */}
      {addOns.length > 0 && (
        <div className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-foreground">Katalog SaaS Add-Ons Extra Quota</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Butuh kapasitas ekstra tanpa mengubah paket utama? Tambahkan Add-On ke keranjang belanja SaaS Anda.
              </p>
            </div>
            {selectedAddOns.length > 0 && (
              <Badge variant="outline" className="bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/30 text-xs font-bold px-3 py-1 self-start sm:self-auto">
                {selectedAddOns.length} Add-On Dipilih
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {addOns.map((addon) => {
              const inCart = isAddOnInCart(addon.id);
              const price = addon.priceMonthly;

              return (
                <div
                  key={addon.id}
                  className={`p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-4 ${inCart
                    ? "bg-emerald-500/10 border-2 border-emerald-500 shadow-sm"
                    : "bg-muted/40 border border-border hover:border-border/80"
                    }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground">{addon.name}</h4>
                      {inCart && (
                        <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <IconCheck className="h-3 w-3 stroke-[3]" /> In Cart
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{addon.description}</p>
                    <div className="text-sm font-black text-[#8FA28A] pt-1">
                      {formatRupiah(price)}{" "}
                      <span className="text-[10px] font-medium text-muted-foreground">
                        /bulan
                      </span>
                    </div>
                  </div>

                  {inCart ? (
                    <Button
                      size="sm"
                      onClick={() => toggleAddOnCart(addon)}
                      variant="outline"
                      className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold gap-1 cursor-pointer"
                    >
                      <IconTrash className="h-3.5 w-3.5" /> Hapus dari Pesanan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => toggleAddOnCart(addon)}
                      className="w-full bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold gap-1 cursor-pointer shadow-xs"
                    >
                      <IconPlus className="h-3.5 w-3.5" /> Tambah ke Pesanan
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* STICKY FLOATING BAR: PENDING INVOICE vs ACTIVE CART */}
      {/* --------------------------------------------------------------------- */}
      {!showCartDetailsModal && !showCheckoutModal && (
        <>
          {/* Priority 1: Pending Invoice Floating Bar */}
          {hasPendingInvoice ? (
            <div className="fixed bottom-6 inset-x-4 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-5 duration-200">
              <div className="p-4 rounded-3xl bg-slate-900 text-slate-100 border border-amber-500/50 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold relative shrink-0">
                    <IconReceipt className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <span>Tagihan Pending:</span>
                      <span className="text-amber-400 font-mono font-extrabold">
                        {createdInvoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="text-base font-black text-white">
                      Total: {formatRupiah(Number(createdInvoice.amount))}
                      <span className="text-[10px] font-bold text-amber-400 ml-2">
                        ({createdInvoice.status === "PENDING_VERIFICATION" ? "Menunggu Verifikasi Admin" : "Belum Dibayar"})
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowCheckoutModal(true)}
                  className="py-2.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg cursor-pointer shrink-0"
                >
                  <span>
                    {createdInvoice.status === "PENDING_VERIFICATION"
                      ? "Lihat Status Pembayaran →"
                      : "Selesaikan Pembayaran →"}
                  </span>
                </Button>
              </div>
            </div>
          ) : totalCartItemCount > 0 ? (
            /* Priority 2: Standard Cart Summary Bar */
            <div className="fixed bottom-6 inset-x-4 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-5 duration-200">
              <div className="p-4 rounded-3xl bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#8FA28A] text-white flex items-center justify-center font-bold relative shrink-0">
                    <IconShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                      {totalCartItemCount}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-300">
                      {selectedPlanForUpgrade ? `Paket ${selectedPlanForUpgrade.name}` : "Hanya Add-On"}
                      {selectedAddOns.length > 0 && ` + ${selectedAddOns.length} Add-On`}
                    </div>
                    <div className="text-base font-black text-amber-400">
                      Total: {formatRupiah(baseMonthlyTotal)}
                      <span className="text-[10px] font-semibold text-slate-400"> /bulan</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowCartDetailsModal(true)}
                  className="py-2.5 px-5 rounded-2xl bg-[#8FA28A] hover:bg-[#7D9178] text-white font-bold text-xs shadow-lg cursor-pointer shrink-0"
                >
                  <span>Lihat Keranjang ({totalCartItemCount}) →</span>
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* STEP 1: CART DETAILS & DURATION SELECTOR MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showCartDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-5">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowCartDetailsModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <IconX className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] border border-[#8FA28A]/30">
                <IconShoppingCart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-foreground">
                Keranjang Belanja SaaS Anda
              </h3>
              <p className="text-xs text-muted-foreground">
                Periksa rincian item langganan dan pilih jangka waktu pembayaran yang diinginkan.
              </p>
            </div>

            {/* Duration Selector Dropdown */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <IconCalendarTime className="h-4 w-4 text-amber-600" />
                <span>Pilih Jangka Waktu Langganan:</span>
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-[#8FA28A] cursor-pointer"
              >
                <option value={1} className="font-normal text-xs bg-background text-foreground py-1">
                  1 Bulan
                </option>
                <option value={3} className="font-normal text-xs bg-background text-foreground py-1">
                  3 Bulan
                </option>
                <option value={6} className="font-normal text-xs bg-background text-foreground py-1">
                  6 Bulan
                </option>
                <option value={12} className="font-normal text-xs bg-background text-foreground py-1">
                  12 Bulan (1 Tahun)
                  {annualDiscountInfo.discountPercent > 0 ? ` — Hemat ${annualDiscountInfo.discountPercent}%` : ""}
                </option>
              </select>
            </div>

            {/* Itemized List */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="text-[11px] font-black uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-1.5">
                Rincian Pesanan ({durationMonths} Bulan):
              </div>

              {/* Selected Plan */}
              {selectedPlanForUpgrade ? (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">
                      Paket {selectedPlanForUpgrade.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Lisensi Utama ({durationMonths} Bulan)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">
                      {formatRupiah(
                        durationMonths === 12
                          ? stdPriceSummary.stdPlanCost
                          : durationPriceSummary.planCost
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(null)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Batal pilih paket"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Paket Lisensi Utama</span>
                  <span className="font-semibold text-foreground">Tetap Paket {currentPlanName} (Rp 0)</span>
                </div>
              )}

              {/* Selected Add-Ons */}
              {selectedAddOns.map((addon) => {
                const monthly = Number(addon.priceMonthly);
                const stdCost = monthly * durationMonths;

                return (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center border-t border-border/40 pt-2"
                  >
                    <div>
                      <span className="font-bold text-foreground">{addon.name}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Add-On Ekstra ({durationMonths} Bulan)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {formatRupiah(stdCost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAddOnCart(addon)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Hapus Add-On"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Savings Deduction Row for 12 Months */}
              {durationMonths === 12 && annualDiscountInfo.savingsAmount > 0 && (
                <div className="flex justify-between items-center border-t border-emerald-500/30 pt-2 text-emerald-700 dark:text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <IconSparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Potongan Diskon Opsi Tahunan ({annualDiscountInfo.discountPercent}%):</span>
                  </span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    -{formatRupiah(annualDiscountInfo.savingsAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-border/60 pt-2 text-muted-foreground font-semibold">
                <span>Durasi Pembayaran</span>
                <span className="font-bold text-foreground">
                  {durationMonths === 12
                    ? `12 Bulan (1 Tahun)${annualDiscountInfo.discountPercent > 0
                      ? ` - Hemat ${annualDiscountInfo.discountPercent}%`
                      : ""
                    }`
                    : `${durationMonths} Bulan`}
                </span>
              </div>

              <div className="flex justify-between border-t-2 border-border pt-2.5 text-sm">
                <span className="font-black text-foreground">TOTAL HARGA</span>
                <span className="font-black text-amber-800 dark:text-amber-300">
                  {formatRupiah(durationPriceSummary.totalCost)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCartDetailsModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup & Tambah Item
              </Button>
              <Button
                onClick={handleProcessCheckout}
                disabled={isSubmittingOrder}
                className="flex-1 py-2 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white text-xs font-bold gap-1 shadow-md cursor-pointer"
              >
                <span>{isSubmittingOrder ? "Memproses..." : "Proses Pesanan →"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* STEP 2: UNIQUE BILLING INVOICE & PROOF UPLOAD MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showCheckoutModal && createdInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-5">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <IconX className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
                <IconReceipt className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-foreground">
                Invoice Tagihan & Bukti Transfer
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground">
                <span className="text-muted-foreground">No. Billing:</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{createdInvoice.invoiceNumber}</span>
              </div>
            </div>

            {/* Success Toast */}
            {paymentVerifiedToast ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center space-y-3">
                <div className="flex justify-center">
                  <IconFileCheck className="h-10 w-10 text-emerald-600 animate-bounce" />
                </div>
                <p className="leading-relaxed">{paymentVerifiedToast}</p>
                <Button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setSelectedPlanForUpgrade(null);
                    setSelectedAddOns([]);
                    router.push("/owner/dashboard");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                >
                  Kembali ke Dashboard
                </Button>
              </div>
            ) : createdInvoice.status === "PENDING_VERIFICATION" && !isReuploadingProof ? (
              /* VIEW BRANCH 1: PENDING VERIFICATION STATUS, UPLOADED PROOF & ACTIVITY LOG TIMELINE */
              <div className="space-y-4">
                {/* Rincian Item Tagihan */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                      Rincian Item Transaksi
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-700 border-amber-300">
                      Menunggu Verifikasi Admin
                    </Badge>
                  </div>

                  {Array.isArray(createdInvoice.items) && createdInvoice.items.length > 0 ? (
                    createdInvoice.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-foreground">{item.itemTitle}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {item.itemType === "PLAN" ? "Lisensi Utama" : "Add-On Ekstra"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {formatRupiah(Number(item.unitPrice))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Tagihan Lisensi SaaS</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatRupiah(Number(createdInvoice.amount))}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t-2 border-border pt-2.5 text-sm">
                    <span className="font-black text-foreground">TOTAL HARGA</span>
                    <span className="font-black text-amber-800 dark:text-amber-300">
                      {formatRupiah(Number(createdInvoice.amount))}
                    </span>
                  </div>
                </div>

                {/* Bukti Konfirmasi Yang Diunggah */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <IconFileCheck className="h-4 w-4 text-emerald-600" />
                      <span>Bukti Konfirmasi Diunggah</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReuploadingProof(true)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Ganti / Re-upload Struk
                    </button>
                  </div>

                  {createdInvoice.paymentProof ? (
                    createdInvoice.paymentProof.startsWith("data:image") ||
                      createdInvoice.paymentProof.startsWith("http") ? (
                      <div className="space-y-1.5 text-center">
                        <img
                          src={createdInvoice.paymentProof}
                          alt="Bukti Transfer Diunggah"
                          className="max-h-44 mx-auto rounded-xl object-contain border border-emerald-500/30 shadow-xs"
                        />
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          File bukti transfer berhasil tersimpan di database
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-background border border-border text-center text-emerald-700 dark:text-emerald-300 font-semibold">
                        Bukti transfer berformat dokumen tersimpan
                      </div>
                    )
                  ) : (
                    <div className="text-muted-foreground text-center py-2">
                      Bukti transfer telah tersimpan di database
                    </div>
                  )}
                </div>

                {/* Log Riwayat Aktivitas Transaksi (Timeline Log) */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3 text-xs">
                  <span className="font-extrabold uppercase text-[11px] text-muted-foreground tracking-wider block border-b border-border/40 pb-1.5 flex items-center gap-1.5">
                    <IconHistory className="h-4 w-4 text-[#8FA28A]" />
                    <span>Log Riwayat Aktivitas Transaksi:</span>
                  </span>

                  <div className="space-y-3 pt-0.5">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <IconCheck className="h-3 w-3 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Faktur Tagihan Dibuat</p>
                        <p className="text-[10px] text-muted-foreground">
                          Nomor Billing {createdInvoice.invoiceNumber} diterbitkan sistem
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <IconCheck className="h-3 w-3 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Bukti Transfer Berhasil Diunggah</p>
                        <p className="text-[10px] text-muted-foreground">
                          Struk pembayaran tersimpan di database & menunggu verifikasi mutasi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                        <IconClock className="h-3 w-3 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-700 dark:text-amber-400">Verifikasi Tim Finance ARVENTA</p>
                        <p className="text-[10px] text-muted-foreground">
                          Status: Menunggu verifikasi admin. Lisensi akan aktif otomatis setelah di-approve.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Toast Alert for Email Confirmation */}
                {emailConfirmedToast && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-1 flex items-start gap-2.5 animate-in fade-in duration-200">
                    <IconFileCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-emerald-900 dark:text-emerald-200 text-xs">✓ Konfirmasi Pembayaran Terkirim!</p>
                      <p className="text-[11px] font-medium leading-relaxed text-emerald-800 dark:text-emerald-300 mt-0.5">
                        {emailConfirmedToast}
                      </p>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={handleSendConfirmEmail}
                    disabled={isSendingConfirmEmail || !!emailConfirmedToast}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-md cursor-pointer disabled:opacity-80 transition-all"
                  >
                    {isSendingConfirmEmail ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        <span>Mengirim Email...</span>
                      </>
                    ) : emailConfirmedToast ? (
                      <>
                        <IconCheck className="h-4 w-4 stroke-[3] text-white" />
                        <span>Email Terkirim</span>
                      </>
                    ) : (
                      <>
                        <IconMail className="h-4 w-4" />
                        <span>Konfirmasi via Email Support</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW BRANCH 2: UNPAID/PENDING STATUS OR RE-UPLOADING FORM */
              <>
                {/* Itemized Cart Summary Box */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                      Rincian Item Tagihan
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-700 border-amber-300">
                      Status: {createdInvoice.status === "PENDING_VERIFICATION" ? "Menunggu Verifikasi Admin" : "Menunggu Pembayaran"}
                    </Badge>
                  </div>

                  {/* Render items from DB invoice */}
                  {Array.isArray(createdInvoice.items) && createdInvoice.items.length > 0 ? (
                    createdInvoice.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-foreground">{item.itemTitle}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {item.itemType === "PLAN" ? "Lisensi Utama" : "Add-On Ekstra"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {formatRupiah(Number(item.unitPrice))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Tagihan Lisensi SaaS</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatRupiah(Number(createdInvoice.amount))}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t-2 border-border pt-2.5 text-sm">
                    <span className="font-black text-foreground">TOTAL HARGA</span>
                    <span className="font-black text-amber-800 dark:text-amber-300">
                      {formatRupiah(Number(createdInvoice.amount))}
                    </span>
                  </div>
                </div>

                {/* Dynamic Bank Account Payment Info */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <IconBuildingBank className="h-4 w-4 text-amber-600" />
                    <span>
                      Rekening Transfer Resmi ARVENTA ({paymentMethods.length > 0 ? paymentMethods.length : 1} Metode):
                    </span>
                  </div>

                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((pm) => (
                      <div key={pm.id} className="p-3.5 rounded-xl bg-background border border-border font-mono text-xs space-y-1.5 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">Bank / Metode:</span>
                          <span className="font-bold text-foreground font-sans">{pm.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">Nomor Rekening / ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-600 dark:text-amber-400 select-all font-mono text-sm">
                              {pm.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAccount(pm.accountNumber, pm.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all cursor-pointer"
                              title="Salin Nomor Rekening"
                            >
                              {copiedAccountId === pm.id ? (
                                <>
                                  <IconCheck className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                                  <span className="text-emerald-600 font-extrabold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <IconCopy className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">Atas Nama (A.N):</span>
                          <span className="font-bold text-foreground font-sans">{pm.accountHolder}</span>
                        </div>
                        {pm.notes && (
                          <div className="text-[11px] text-muted-foreground font-sans pt-1 border-t border-border/40 mt-1 flex items-start gap-1.5 leading-tight">
                            <IconInfoCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{pm.notes.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "").trim()}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 rounded-xl bg-background border border-border font-mono text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-bold text-foreground">Bank Central Asia (BCA)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">No. Rekening:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600 select-all font-mono">8421-1309-65</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount("8421-1309-65", "fallback")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-[11px] font-bold border border-amber-500/30 cursor-pointer"
                          >
                            {copiedAccountId === "fallback" ? (
                              <>
                                <IconCheck className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                                <span className="text-emerald-600 font-extrabold">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <IconCopy className="h-3.5 w-3.5 text-amber-600" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Atas Nama:</span>
                        <span className="font-bold text-foreground">Fauzi Aditya Pratama</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Payment Proof Form */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground block">
                      Upload Bukti Transfer Pembayaran:
                    </span>
                    {isReuploadingProof && (
                      <button
                        type="button"
                        onClick={() => setIsReuploadingProof(false)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground underline cursor-pointer"
                      >
                        Batal Re-upload
                      </button>
                    )}
                  </div>
                  <label
                    htmlFor="payment-proof-input"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`block p-5 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 cursor-pointer ${isDraggingFile
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                      : proofFile
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-border hover:border-[#8FA28A] bg-muted/20 hover:bg-muted/30"
                      }`}
                  >
                    {proofPreview ? (
                      <div className="space-y-2.5">
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setZoomImage(proofPreview);
                          }}
                          className="relative max-h-44 mx-auto rounded-xl overflow-hidden border border-border shadow-xs group cursor-pointer"
                        >
                          <img
                            src={proofPreview}
                            alt="Preview Bukti Transfer"
                            className="max-h-44 mx-auto rounded-xl object-contain transition-all group-hover:scale-[1.01]"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                            <IconZoomIn className="size-4" /> Perbesar Foto
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          <IconFileCheck className="h-4 w-4 stroke-[2.5]" />
                          <span>File siap diunggah: {proofFile?.name} ({(proofFile!.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      </div>
                    ) : proofFile ? (
                      <div className="space-y-2 py-2">
                        <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <IconFileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{proofFile.name}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            {(proofFile.size / 1024).toFixed(0)} KB — Siap dikirim
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <div className="h-12 w-12 mx-auto rounded-2xl bg-[#8FA28A]/10 text-[#8FA28A] flex items-center justify-center">
                          <IconUpload className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          Klik atau Tarik (Drag & Drop) File Bukti Transfer Ke Sini
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Format yang didukung: JPG, PNG, WEBP, atau PDF (Maksimal 5MB)
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="payment-proof-input"
                    />

                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background hover:bg-muted text-foreground text-xs font-bold border border-border shadow-xs transition-colors">
                        <IconUpload className="h-3.5 w-3.5 text-[#8FA28A]" />
                        <span>{proofFile ? "Ganti File Struk" : "Pilih File Struk..."}</span>
                      </span>
                    </div>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Nanti Saja
                  </Button>
                  <Button
                    onClick={handleUploadPaymentProof}
                    disabled={!proofFile || isUploadingProof}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingProof ? "Mengunggah..." : "Konfirmasi Pembayaran"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* RIWAYAT TRANSAKSI OWNER MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-card border shadow-2xl p-6 sm:p-8 space-y-6 my-auto shrink-0 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <IconHistory className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">
                    Riwayat Transaksi & Invoice
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Daftar seluruh transaksi langganan dan status lisensi SaaS Arventa Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <IconX className="size-5" />
              </button>
            </div>

            {ownerInvoices.length === 0 ? (
              <div className="p-12 text-center space-y-3 border border-dashed rounded-2xl bg-muted/20">
                <IconReceipt className="size-10 text-muted-foreground mx-auto opacity-50" />
                <h4 className="font-bold text-sm">Belum Ada Transaksi</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Anda belum pernah melakukan transaksi tagihan langganan SaaS.
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  const historyTotalPages = Math.ceil(ownerInvoices.length / 10) || 1;
                  const paginatedInvoices = ownerInvoices.slice(
                    (historyCurrentPage - 1) * 10,
                    historyCurrentPage * 10
                  );

                  return (
                    <div className="space-y-3.5">
                      {paginatedInvoices.map((inv) => {
                        const isPaid = inv.status === "PAID";
                        const isPendingVerif =
                          inv.status === "PENDING_VERIFICATION" ||
                          (inv.status === "PENDING" && Boolean(inv.paymentProof));
                        const isUnpaid = inv.status === "PENDING" && !inv.paymentProof;
                        const isCancelled = inv.status === "CANCELLED" || inv.status === "EXPIRED";

                        return (
                          <div
                            key={inv.id}
                            className="p-4 rounded-2xl border bg-card/60 hover:border-amber-500/40 transition-all space-y-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-sm text-foreground">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground font-mono text-[11px]">
                                  {new Date(inv.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isPaid && (
                                  <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 gap-1">
                                    <IconCheck className="size-3" /> LUNAS (PAID)
                                  </Badge>
                                )}
                                {isPendingVerif && (
                                  <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 gap-1">
                                    <IconClock className="size-3 animate-pulse" /> MENUNGGU VERIFIKASI
                                  </Badge>
                                )}
                                {isUnpaid && (
                                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px] px-2.5 py-0.5 gap-1">
                                    <IconInfoCircle className="size-3" /> BELUM DIBAYAR
                                  </Badge>
                                )}
                                {isCancelled && (
                                  <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold px-2 py-0.5">
                                    DIBATALKAN / EXPIRED
                                  </Badge>
                                )}

                                {/* Eye Icon Detail Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedHistoryDetailItem(inv)}
                                  className="h-7 px-2 text-[11px] font-bold gap-1 rounded-xl border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer shadow-2xs"
                                  title="Lihat Detail Rincian Invoice"
                                >
                                  <IconEye className="size-3.5 text-amber-600 dark:text-amber-400" /> Detail
                                </Button>
                              </div>
                            </div>

                            {/* Items & Total */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                {inv.items && inv.items.length > 0 ? (
                                  inv.items.map((it: any) => (
                                    <p key={it.id} className="font-semibold text-foreground">
                                      • {it.itemTitle} ({formatRupiah(it.amount)})
                                    </p>
                                  ))
                                ) : (
                                  <p className="font-semibold text-foreground">
                                    Tagihan Langganan Properti
                                  </p>
                                )}
                              </div>

                              <div className="sm:text-right">
                                <p className="text-[10px] text-muted-foreground">Total Nominal</p>
                                <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                                  {formatRupiah(inv.amount)}
                                </p>
                              </div>
                            </div>

                            {/* Action Button */}
                            {(isPendingVerif || isUnpaid) && (
                              <div className="pt-2 border-t flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCreatedInvoice(inv);
                                    setShowHistoryModal(false);
                                    setShowCheckoutModal(true);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-3 gap-1 shadow-xs cursor-pointer"
                                >
                                  <IconReceipt className="size-3.5" /> Lihat Status / Upload Bukti
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Pagination Controls (10 items per page) */}
                      {ownerInvoices.length > 10 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t text-xs">
                          <p className="text-muted-foreground font-medium text-[11px]">
                            Menampilkan <span className="font-bold text-foreground">{(historyCurrentPage - 1) * 10 + 1}</span> - <span className="font-bold text-foreground">{Math.min(historyCurrentPage * 10, ownerInvoices.length)}</span> dari <span className="font-bold text-foreground">{ownerInvoices.length}</span> transaksi
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={historyCurrentPage === 1}
                              onClick={() => setHistoryCurrentPage((prev) => Math.max(1, prev - 1))}
                              className="h-7 px-3 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
                            >
                              ← Prev
                            </Button>
                            <span className="font-bold font-mono text-xs px-2 text-foreground">
                              {historyCurrentPage} / {historyTotalPages}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={historyCurrentPage === historyTotalPages}
                              onClick={() => setHistoryCurrentPage((prev) => Math.min(historyTotalPages, prev + 1))}
                              className="h-7 px-3 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
                            >
                              Next →
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            <div className="flex justify-end border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryModal(false)}
                className="font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Riwayat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TRANSACTION DETAIL MODAL (Opened via Eye Icon) */}
      {/* --------------------------------------------------------------------- */}
      {selectedHistoryDetailItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-card border shadow-2xl p-6 sm:p-7 space-y-5 my-auto shrink-0 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <IconEye className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Detail Transaksi Invoice</h3>
                  <p className="text-[11px] font-mono text-muted-foreground">{selectedHistoryDetailItem.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryDetailItem(null)}
                className="p-1 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <IconX className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status Header Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/30 border font-mono">
                <div>
                  <p className="text-[10px] text-muted-foreground">Status Pembayaran:</p>
                  <div className="mt-1">
                    {selectedHistoryDetailItem.status === "PAID" && (
                      <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">LUNAS (PAID)</Badge>
                    )}
                    {["PENDING", "PENDING_VERIFICATION"].includes(selectedHistoryDetailItem.status) && (
                      <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5">MENUNGGU VERIFIKASI</Badge>
                    )}
                    {["CANCELLED", "EXPIRED"].includes(selectedHistoryDetailItem.status) && (
                      <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold px-2 py-0.5">DIBATALKAN</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Pembayaran:</p>
                  <p className="font-black text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatRupiah(selectedHistoryDetailItem.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Tanggal Dibuat:</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(selectedHistoryDetailItem.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Tanggal Dibayar:</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedHistoryDetailItem.paidAt
                      ? new Date(selectedHistoryDetailItem.paidAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="font-bold text-xs mb-2">Rincian Paket & Add-On:</p>
                <div className="divide-y rounded-2xl border bg-muted/20 overflow-hidden">
                  {selectedHistoryDetailItem.items && selectedHistoryDetailItem.items.length > 0 ? (
                    selectedHistoryDetailItem.items.map((it: any) => (
                      <div key={it.id} className="p-3 flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{it.itemTitle}</span>
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{formatRupiah(it.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 font-semibold text-foreground">Tagihan Langganan SaaS Properti</div>
                  )}
                </div>
              </div>

              {/* Payment Proof Photo if uploaded */}
              {selectedHistoryDetailItem.paymentProof && (
                <div>
                  <p className="font-bold text-xs mb-1.5">Bukti Resi Transfer Yang Diunggah:</p>
                  <div
                    onClick={() => setZoomImage(selectedHistoryDetailItem.paymentProof)}
                    className="relative rounded-2xl border overflow-hidden bg-black/5 p-1 cursor-pointer group"
                  >
                    <img
                      src={selectedHistoryDetailItem.paymentProof}
                      alt="Bukti Transfer Resi"
                      className="max-h-56 w-full object-contain rounded-xl transition-all group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                      <IconZoomIn className="size-5" /> Perbesar Foto
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-3.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isGeneratingPDF}
                onClick={() => handleDownloadPDF(selectedHistoryDetailItem)}
                className="font-bold text-xs rounded-xl cursor-pointer gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shadow-xs"
              >
                {isGeneratingPDF ? (
                  <>
                    <IconLoader2 className="size-4 animate-spin" /> Unduh PDF...
                  </>
                ) : (
                  <>
                    <IconPrinter className="size-4" /> Download PDF Invoice
                  </>
                )}
              </Button>
              {["PENDING", "PENDING_VERIFICATION"].includes(selectedHistoryDetailItem.status) && (
                <Button
                  size="sm"
                  onClick={() => {
                    setCreatedInvoice(selectedHistoryDetailItem);
                    setSelectedHistoryDetailItem(null);
                    setShowHistoryModal(false);
                    setShowCheckoutModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-3 gap-1 shadow-xs cursor-pointer"
                >
                  <IconReceipt className="size-3.5" /> Upload Bukti / Status
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHistoryDetailItem(null)}
                className="font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Detail
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------------------------------------------- */}
      {/* FULLSCREEN LIGHTBOX IMAGE MODAL (Zoom Foto Resi) */}
      {/* --------------------------------------------------------------------- */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <img src={zoomImage} alt="Zoomed Resi Transfer" className="max-h-[85vh] w-auto object-contain mx-auto" />
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 rounded-full bg-black/70 p-2 text-white hover:bg-black transition-all cursor-pointer"
            >
              <IconX className="size-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import type { FeatureSlide } from "@/types/feature-showcase";

// ============================================================================
// DEFAULT SLIDES — Fallback & seed value untuk Carousel Landing Page
// Data asli tetap seperti hardcode awal. Produksi mengambil data dari database
// (dikelola PLATFORM_ADMIN), tapi array ini dipakai jika DB kosong/gagal agar
// landing page tetap tampil.
// ============================================================================

export const DEFAULT_SLIDES: FeatureSlide[] = [
  {
    id: "property-management",
    badge: "PMS SAAS",
    category: "MULTI-ASSET & UNIT ROOM MANAGEMENT",
    title: "ARVENTA — Property & Room Management",
    description:
      "Kelola berbagai tipe properti mulai dari kos-kosan, apartemen, kontrakan, hingga ruko komersial. Atur unit, lantai, fasilitas kamar, tipe kamar, serta status okupansi kamar secara terpusat dalam satu dashboard.",
    tags: [
      "Multi-Property",
      "Room Matrix",
      "Unit Inventory",
      "Floor Layout",
      "Asset Tracking",
    ],
    ctaText: "Eksplor Properti",
    ctaHref: "#jenis-properti",
    imageUrl: null,
    mockup: {
      type: "property",
      headerTitle: "Multi-Floor Room Availability Grid",
      subBadge: "Kos, Apartemen, Kontrakan & Ruko",
    },
  },
  {
    id: "tenant-management",
    badge: "TENANT CRM",
    category: "TENANT DIRECTORY & DIGITAL CONTRACTS",
    title: "Tenant Directory & Contract Lifecycle",
    description:
      "Pencatatan data penyewa komprehensif lengkap dengan verifikasi identitas KTP, kontak WhatsApp darurat, periode sewa, riwayat pembayaran sewa, catatan deposit, serta arsip kontrak digital.",
    tags: [
      "Tenant Directory",
      "KTP Verification",
      "Digital Contract",
      "Emergency Contact",
      "Deposit Tracker",
    ],
    ctaText: "Kelola Penyewa",
    ctaHref: "#paket-harga",
    imageUrl: null,
    mockup: {
      type: "tenant",
      headerTitle: "Active Tenant Registry & Profiles",
      subBadge: "Verified Tenant Database",
    },
  },
  {
    id: "billing-payment",
    badge: "BILLING SAAS",
    category: "AUTOMATED INVOICING & PAYMENT GATEWAY",
    title: "Smart Invoicing & Automated Rent Collection",
    description:
      "Penerbitan invoice digital otomatis menjelang jatuh tempo sewa dengan link pembayaran instan. Penyewa dapat mengunggah bukti transfer, melihat riwayat transaksi, serta menerima notifikasi WhatsApp resmi.",
    tags: [
      "Auto Invoice",
      "WhatsApp Reminder",
      "Payment Gateway",
      "Bukti Transfer",
      "Status Lunas",
    ],
    ctaText: "Coba Invoicing",
    ctaHref: "#paket-harga",
    imageUrl: null,
    mockup: {
      type: "billing",
      headerTitle: "Smart Invoicing & WhatsApp Reminders",
      subBadge: "Automated Payment Dispatch",
    },
  },
  {
    id: "housekeeping-management",
    badge: "OPERATIONS",
    category: "OPERATIONAL TASKFORCE & ROOM CLEANING",
    title: "Housekeeping Dispatch & Task Checklist",
    description:
      "Tugaskan staf kebersihan secara digital saat penyewa checkout atau meminta pembersihan berkala. Staf dapat mengakses portal mobile, memperbarui status kamar secara real-time, dan mengisi checklist kebersihan.",
    tags: [
      "Housekeeping Grid",
      "Staff Dispatch",
      "Cleaning Checklist",
      "Mobile Portal",
      "Room Readiness",
    ],
    ctaText: "Fitur Housekeeping",
    ctaHref: "#jenis-properti",
    imageUrl: null,
    mockup: {
      type: "housekeeping",
      headerTitle: "Cleaning Shift & Task Dispatch Board",
      subBadge: "Mobile Staff Portal",
    },
  },
  {
    id: "dashboard-analytics",
    badge: "ANALYTICS AI",
    category: "FINANCIAL OPEX & OCCUPANCY METRICS",
    title: "Executive Dashboard & Financial Analytics",
    description:
      "Visualisasikan performa bisnis properti Anda dengan metrik real-time: total pendapatan sewa (Income), beban operasional (OpEx), laba bersih (Net Profit), tren okupansi bulanan, serta data ekspor laporan keuangan.",
    tags: [
      "Income / OpEx",
      "Cash Flow",
      "Net Profit Margin",
      "Occupancy Trend",
      "Export PDF/Excel",
    ],
    ctaText: "Pelajari Analitik",
    ctaHref: "#paket-harga",
    imageUrl: null,
    mockup: {
      type: "analytics",
      headerTitle: "Cash Flow & OpEx Financial Dashboard",
      subBadge: "Realtime Profit & Loss",
    },
  },
  {
    id: "community-announcement",
    badge: "COMMUNITY",
    category: "TENANT PORTAL & BROADCAST NOTICES",
    title: "Community Bulletin & Tenant Broadcast",
    description:
      "Saluran komunikasi digital terpadu untuk pengelola dan penyewa. Kirim pengumuman penting (jadwal perbaikan, tagihan air, tata tertib kos) secara serentak ke seluruh penghuni, dan kelola laporan komplain fasilitas.",
    tags: [
      "Broadcast Notice",
      "Community Feed",
      "Complaint Ticket",
      "Maintenance Request",
      "WhatsApp Alert",
    ],
    ctaText: "Fitur Komunitas",
    ctaHref: "#paket-harga",
    imageUrl: null,
    mockup: {
      type: "community",
      headerTitle: "Community Broadcast & Maintenance Center",
      subBadge: "Tenant Broadcast Feed",
    },
  },
  {
    id: "ai-features",
    badge: "HEALTH AI",
    category: "INTELLIGENT REVENUE OPTIMIZATION ENGINE",
    title: "AI-Powered Occupancy & Dynamic Pricing",
    description:
      "Kecerdasan buatan berbasis Google Gemini yang menganalisis tren okupansi sewa, mendeteksi anomali lonjakan tagihan utilitas (listrik & air), serta memberikan rekomendasi harga kamar optimal saat peak season.",
    tags: [
      "Google Gemini AI",
      "Dynamic Pricing",
      "Occupancy Forecast",
      "Anomaly Detection",
      "Smart Recommendations",
    ],
    ctaText: "Eksplor AI Features",
    ctaHref: "#paket-harga",
    imageUrl: null,
    mockup: {
      type: "ai",
      headerTitle: "AI Property Advisor & Revenue Optimizer",
      subBadge: "Powered by Gemini AI",
    },
  },
];

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  targetRole: string; // ALL | OWNER | HOUSEKEEPING | USER
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const FAQ_SETTING_KEY = "arventa_faq_items";
const FAQ_CATEGORIES_KEY = "arventa_faq_categories";

const DEFAULT_MASTER_CATEGORIES = [
  "UMUM",
  "PEMBAYARAN",
  "OPERASIONAL",
  "AKUN & KEAMANAN",
  "SEWA & KONTRAK",
];

// Default System FAQs for ARVENTA Property Management
const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "PEMBAYARAN",
    question: "Bagaimana cara melakukan pembayaran tagihan langganan SaaS ARVENTA?",
    answer: 'Owner dapat melakukan transfer bank ke nomor rekening resmi BCA/Mandiri yang tercantum pada menu <a href="/platform/payment-methods">Payment Methods</a>. Setelah transfer, unggah bukti bayar di rute <a href="/platform/subscriptions">Subscriptions & Billing</a> untuk diverifikasi oleh Platform Admin.',
    targetRole: "OWNER",
    order: 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "faq-2",
    category: "OPERASIONAL",
    question: "Bagaimana cara staf housekeeping melaporkan kondisi kamar / perabotan rusak?",
    answer: 'Staf Housekeeping dapat masuk ke rute <a href="/housekeeping/inventories">Kondisi Perabotan & Unit</a>, pilih unit kamar terkait, lalu klik tombol <b>"Laporkan Kerusakan"</b> untuk mengunggah foto dan deskripsi barang.',
    targetRole: "HOUSEKEEPING",
    order: 2,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "faq-3",
    category: "AKUN & KEAMANAN",
    question: "Mengapa akun Owner ditangguhkan (Suspended)?",
    answer: 'Penangguhan akun terjadi jika pembayaran tagihan SaaS terlambat melewati batas jatuh tempo (Past Due) atau dilakukan secara manual oleh Platform Admin pada menu <a href="/platform/owners">Owner Management</a> melalui fitur <i>Account Suspend Guard</i> demi alasan keamanan.',
    targetRole: "ALL",
    order: 3,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "faq-4",
    category: "SEWA & KONTRAK",
    question: "Bagaimana penyewa dapat melihat invoice dan bukti pembayaran sewa kamar?",
    answer: 'Penyewa/Tenant dapat membuka menu <a href="/portal/invoices">Tagihan & Pembayaran Portal</a> untuk mengunduh struk pembayaran digital serta melihat status aktif kontrak sewa.',
    targetRole: "TENANT",
    order: 4,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "faq-5",
    category: "UMUM",
    question: "Apakah sistem ARVENTA mendukung pengelolaan banyak lokasi properti (Multi-Property)?",
    answer: 'Ya, paket Business dan Enterprise ARVENTA mendukung pengelolaan multi-properti (Kos-kosan, Apartemen, dan Kontrakan) dalam satu <a href="/platform/dashboard">Executive Dashboard</a> terpadu.',
    targetRole: "OWNER",
    order: 5,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function getStoredFaqs(): Promise<FaqItem[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: FAQ_SETTING_KEY },
    });

    if (!setting) {
      await prisma.systemSetting.create({
        data: {
          key: FAQ_SETTING_KEY,
          value: JSON.stringify(DEFAULT_FAQS),
          description: "Database Master FAQ Items for ARVENTA Platform",
        },
      });
      return DEFAULT_FAQS;
    }

    return JSON.parse(setting.value) as FaqItem[];
  } catch (error) {
    console.error("Error reading FAQs from systemSetting:", error);
    return DEFAULT_FAQS;
  }
}

async function saveStoredFaqs(items: FaqItem[]) {
  await prisma.systemSetting.upsert({
    where: { key: FAQ_SETTING_KEY },
    update: { value: JSON.stringify(items) },
    create: {
      key: FAQ_SETTING_KEY,
      value: JSON.stringify(items),
      description: "Database Master FAQ Items for ARVENTA Platform",
    },
  });
}

async function getMasterCategories(): Promise<string[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: FAQ_CATEGORIES_KEY },
    });

    if (!setting) {
      await prisma.systemSetting.create({
        data: {
          key: FAQ_CATEGORIES_KEY,
          value: JSON.stringify(DEFAULT_MASTER_CATEGORIES),
          description: "Database Master Categories for ARVENTA FAQ",
        },
      });
      return DEFAULT_MASTER_CATEGORIES;
    }

    return JSON.parse(setting.value) as string[];
  } catch (error) {
    console.error("Error reading FAQ categories:", error);
    return DEFAULT_MASTER_CATEGORIES;
  }
}

async function saveMasterCategories(categories: string[]) {
  await prisma.systemSetting.upsert({
    where: { key: FAQ_CATEGORIES_KEY },
    update: { value: JSON.stringify(categories) },
    create: {
      key: FAQ_CATEGORIES_KEY,
      value: JSON.stringify(categories),
      description: "Database Master Categories for ARVENTA FAQ",
    },
  });
}

/**
 * GET /api/admin/faq
 * Fetch all FAQs and Master Categories with search & filter parameters.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category") || "all";
    const targetRole = searchParams.get("targetRole") || "all";

    let items = await getStoredFaqs();
    const masterCategories = await getMasterCategories();

    // Filter by Category
    if (category !== "all") {
      items = items.filter((item) => item.category.toUpperCase() === category.toUpperCase());
    }

    // Filter by Target Role
    if (targetRole !== "all") {
      items = items.filter(
        (item) =>
          item.targetRole === "ALL" ||
          item.targetRole === targetRole ||
          (targetRole === "TENANT" && item.targetRole === "USER") ||
          (targetRole === "USER" && item.targetRole === "TENANT")
      );
    }

    // Filter by Search Query
    if (search) {
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(search) ||
          item.answer.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search)
      );
    }

    // Sort by order ascending
    items.sort((a, b) => a.order - b.order);

    const allItems = await getStoredFaqs();

    // Merge categories from master & items
    const mergedCategories = Array.from(
      new Set([...masterCategories, ...allItems.map((i) => i.category.toUpperCase())])
    );

    const stats = {
      total: allItems.length,
      published: allItems.filter((i) => i.isPublished).length,
      draft: allItems.filter((i) => !i.isPublished).length,
      categoriesCount: mergedCategories.length,
    };

    return ApiResponse.success({
      message: "Berhasil mengambil data FAQ & Master Kategori",
      data: {
        faqs: items,
        categories: mergedCategories,
        stats,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/faq error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data FAQ",
      error,
      status: 500,
    });
  }
}

/**
 * POST /api/admin/faq
 * Create, Update, Toggle Status, Delete FAQ items & Master Category operations.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const items = await getStoredFaqs();

    // -----------------------------------------------------------------------
    // MASTER CATEGORIES ACTIONS
    // -----------------------------------------------------------------------
    if (action === "ADD_CATEGORY") {
      const { categoryName } = body;
      if (!categoryName || !categoryName.trim()) {
        return ApiResponse.error({
          message: "Nama kategori baru wajib diisi.",
          status: 400,
        });
      }

      const cleanCat = categoryName.trim().toUpperCase();
      const categories = await getMasterCategories();

      if (categories.includes(cleanCat)) {
        return ApiResponse.error({
          message: `Kategori "${cleanCat}" sudah ada di master.`,
          status: 400,
        });
      }

      categories.push(cleanCat);
      await saveMasterCategories(categories);

      return ApiResponse.success({
        message: `Kategori "${cleanCat}" berhasil ditambahkan ke master!`,
        data: { categories },
      });
    }

    if (action === "DELETE_CATEGORY") {
      const { categoryName } = body;
      if (!categoryName) {
        return ApiResponse.error({
          message: "Nama kategori wajib diisi.",
          status: 400,
        });
      }

      const cleanCat = categoryName.trim().toUpperCase();
      let categories = await getMasterCategories();

      // Check if any FAQ is using this category
      const isUsed = items.some((i) => i.category.toUpperCase() === cleanCat);
      if (isUsed) {
        return ApiResponse.error({
          message: `Kategori "${cleanCat}" sedang digunakan oleh beberapa FAQ. Hapus atau ubah FAQ terlebih dahulu.`,
          status: 400,
        });
      }

      categories = categories.filter((c) => c !== cleanCat);
      await saveMasterCategories(categories);

      return ApiResponse.success({
        message: `Kategori "${cleanCat}" berhasil dihapus dari master!`,
        data: { categories },
      });
    }

    // -----------------------------------------------------------------------
    // FAQ ITEMS ACTIONS
    // -----------------------------------------------------------------------
    if (action === "CREATE") {
      const { category, question, answer, targetRole, order, isPublished } = body;

      if (!question || !answer) {
        return ApiResponse.error({
          message: "Pertanyaan (Question) dan Jawaban (Answer) wajib diisi.",
          status: 400,
        });
      }

      const cleanCat = (category || "UMUM").toUpperCase();

      // Ensure category exists in master
      const categories = await getMasterCategories();
      if (!categories.includes(cleanCat)) {
        categories.push(cleanCat);
        await saveMasterCategories(categories);
      }

      const newItem: FaqItem = {
        id: `faq-${Date.now()}`,
        category: cleanCat,
        question: question.trim(),
        answer: answer.trim(),
        targetRole: targetRole || "ALL",
        order: Number(order) || items.length + 1,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      items.push(newItem);
      await saveStoredFaqs(items);

      return ApiResponse.success({
        message: "FAQ baru berhasil ditambahkan!",
        data: newItem,
      });
    }

    if (action === "UPDATE") {
      const { id, category, question, answer, targetRole, order, isPublished } = body;

      if (!id || !question || !answer) {
        return ApiResponse.error({
          message: "ID, Pertanyaan, dan Jawaban wajib diisi.",
          status: 400,
        });
      }

      const index = items.findIndex((i) => i.id === id);
      if (index === -1) {
        return ApiResponse.error({
          message: "Item FAQ tidak ditemukan.",
          status: 404,
        });
      }

      const cleanCat = (category || items[index].category).toUpperCase();

      // Ensure category exists in master
      const categories = await getMasterCategories();
      if (!categories.includes(cleanCat)) {
        categories.push(cleanCat);
        await saveMasterCategories(categories);
      }

      items[index] = {
        ...items[index],
        category: cleanCat,
        question: question.trim(),
        answer: answer.trim(),
        targetRole: targetRole || items[index].targetRole,
        order: order !== undefined ? Number(order) : items[index].order,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : items[index].isPublished,
        updatedAt: new Date().toISOString(),
      };

      await saveStoredFaqs(items);

      return ApiResponse.success({
        message: "Item FAQ berhasil diperbarui!",
        data: items[index],
      });
    }

    if (action === "TOGGLE_PUBLISH") {
      const { id } = body;
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) {
        return ApiResponse.error({
          message: "Item FAQ tidak ditemukan.",
          status: 404,
        });
      }

      items[index].isPublished = !items[index].isPublished;
      items[index].updatedAt = new Date().toISOString();

      await saveStoredFaqs(items);

      return ApiResponse.success({
        message: `Status publikasi FAQ diubah menjadi ${items[index].isPublished ? "PUBLISHED" : "DRAFT/HIDDEN"}`,
        data: items[index],
      });
    }

    if (action === "DELETE") {
      const { id } = body;
      const filtered = items.filter((i) => i.id !== id);

      if (filtered.length === items.length) {
        return ApiResponse.error({
          message: "Item FAQ tidak ditemukan.",
          status: 404,
        });
      }

      await saveStoredFaqs(filtered);

      return ApiResponse.success({
        message: "Item FAQ berhasil dihapus.",
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak valid.",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/admin/faq error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan server saat mengelola FAQ.",
      error,
      status: 500,
    });
  }
}

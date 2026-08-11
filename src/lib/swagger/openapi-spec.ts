export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ARVENTA SaaS Platform REST API Documentation",
    version: "1.0.0",
    description:
      "Dokumentasi resmi OpenAPI 3.0 untuk seluruh REST API backend ARVENTA Property Management System (PMS). Digunakan untuk pengelolaan Platform, Owner Management, Subscription Billing, Dynamic Roles, Menus, Feature Flags, dan Platform Settings.",
    contact: {
      name: "ARVENTA Backend Engineering Team",
      email: "dev@arventa.id",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development Local Server",
    },
  ],
  tags: [
    { name: "Owner Management", description: "API Manajemen Owner Properti & Suspend/Unsuspend Akun" },
    { name: "Subscriptions & Billing", description: "API Paket Langganan SaaS, Invoices, & Tagihan MRR/ARR" },
    { name: "Platform Settings & Gateway", description: "API Maintenance Mode, Dynamic API Keys, & Connection Gateway" },
    { name: "Roles & Permissions", description: "API Matriks Hak Akses Granular & Custom Master Roles" },
    { name: "Menus & Feature Flags", description: "API Hirarki Master Menu Navigasi & Dynamic Feature Flags" },
    { name: "Dashboard Telemetry", description: "API Metric Telemetry, Stat Pendapatan, & AI Insight" },
  ],
  paths: {
    "/api/admin/owners": {
      get: {
        tags: ["Owner Management"],
        summary: "Mengambil daftar Owner Properti terdaftar",
        description: "Mengambil daftar owner properti dengan filter pencarian, status akun (active/suspended), dan pagination.",
        parameters: [
          { name: "search", in: "query", description: "Kata kunci nama/email/nomor HP owner", schema: { type: "string" } },
          { name: "status", in: "query", description: "Filter status akun (all, active, suspended)", schema: { type: "string", default: "all" } },
          { name: "page", in: "query", description: "Nomor halaman pagination", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", description: "Batas jumlah data per halaman", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Daftar owner properti berhasil diambil",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Berhasil mengambil data owner properti",
                  data: {
                    owners: [
                      {
                        id: "user-uuid-123",
                        fullName: "Bpk. Hendra Pratama",
                        email: "owner@arventa.id",
                        phoneNumber: "08123456789",
                        isActive: true,
                        propertyCount: 2,
                        currentPlan: "Business Pro Tier",
                        subscriptionStatus: "ACTIVE",
                        createdAt: "2026-08-01T10:00:00.000Z",
                      },
                    ],
                    pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
                    stats: { totalOwners: 1, activeOwners: 1, suspendedOwners: 0 },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Owner Management"],
        summary: "Eksekusi Aksi Owner (Create, Toggle Suspend, Update)",
        description: "Membuat owner baru (action: CREATE_OWNER), membekukan akun (action: TOGGLE_SUSPEND), atau memperbarui profil (action: UPDATE_OWNER).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", example: "CREATE_OWNER" },
                  fullName: { type: "string", example: "Ibu Maya Owner" },
                  email: { type: "string", example: "maya@ownerproperti.com" },
                  phoneNumber: { type: "string", example: "081987654321" },
                  planId: { type: "string", example: "plan-uuid-business" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Aksi owner berhasil diproses" },
          400: { description: "Parameter request tidak valid" },
        },
      },
    },

    "/api/admin/subscriptions": {
      get: {
        tags: ["Subscriptions & Billing"],
        summary: "Mengambil data Paket SaaS, Subscription Active, & Billing Invoices",
        description: "Mengambil seluruh data Tier Paket SaaS, daftar langganan owner aktif, transaksi invoice tagihan, dan statistik MRR/ARR.",
        responses: {
          200: {
            description: "Data paket langganan & tagihan billing berhasil diambil",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    plans: [
                      { id: "p1", name: "Basic Starter", priceMonthly: 150000, maxProperties: 1, maxUnits: 10, subscriberCount: 5 },
                    ],
                    stats: { totalMRR: 1550000, totalARR: 18600000, activeSubscriptionsCount: 5, pendingInvoicesCount: 1 },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Subscriptions & Billing"],
        summary: "Eksekusi Aksi Billing (Create Plan, Verify Invoice, Assign Sub)",
        description: "Membuat paket tier SaaS baru (action: CREATE_PLAN), mengedit harga/paket (action: UPDATE_PLAN), atau memverifikasi bukti bayar invoice (action: VERIFY_INVOICE).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", example: "VERIFY_INVOICE" },
                  invoiceId: { type: "string", example: "inv-12345" },
                  status: { type: "string", example: "PAID" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Aksi billing berhasil diproses" },
        },
      },
    },

    "/api/admin/settings": {
      get: {
        tags: ["Platform Settings & Gateway"],
        summary: "Mengambil Konfigurasi Platform & Security Audit Log",
        description: "Mengambil daftar setting sistem global, status Maintenance Mode, API Keys, dan 50 catatan Audit Log terbaru.",
        responses: {
          200: { description: "Konfigurasi platform berhasil diambil" },
        },
      },
      post: {
        tags: ["Platform Settings & Gateway"],
        summary: "Update Konfigurasi / Toggle Maintenance Mode / Test API Gateway",
        description: "Mengubah parameter platform (action: UPDATE_SETTINGS), beralih maintenance mode (action: TOGGLE_MAINTENANCE), atau menguji koneksi API (action: TEST_GATEWAY).",
        responses: {
          200: { description: "Konfigurasi berhasil disimpan" },
        },
      },
    },

    "/api/system/maintenance-status": {
      get: {
        tags: ["Platform Settings & Gateway"],
        summary: "Pengecekan Public Maintenance Mode Status",
        description: "Endpoint publik ringan untuk mengecek apakah sistem sedang dalam Maintenance Mode.",
        responses: {
          200: {
            description: "Status maintenance",
            content: {
              "application/json": {
                example: { success: true, data: { isMaintenance: false } },
              },
            },
          },
        },
      },
    },

    "/api/admin/roles-permissions": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "Mengambil Master Roles & Granular Permission Matrix",
        description: "Mengambil daftar Master Role sistem/kustom beserta daftar 24 hak akses per modul.",
        responses: {
          200: { description: "Matriks permission berhasil diambil" },
        },
      },
      post: {
        tags: ["Roles & Permissions"],
        summary: "Toggle Hak Akses / Edit & Hapus Custom Role",
        description: "Mengaktifkan/menonaktifkan permission role (action: TOGGLE_PERMISSION), atau mengedit role kustom (action: UPDATE_ROLE).",
        responses: {
          200: { description: "Hak akses berhasil diperbarui" },
        },
      },
    },

    "/api/admin/menus-flags": {
      get: {
        tags: ["Menus & Feature Flags"],
        summary: "Mengambil Master Navigation Menus & Feature Flags",
        description: "Mengambil daftar hirarki menu navigasi per role dan saklar Feature Flags aktif.",
        responses: {
          200: { description: "Daftar menu & feature flags berhasil diambil" },
        },
      },
      post: {
        tags: ["Menus & Feature Flags"],
        summary: "Toggle Feature Flag / Tambah Menu Baru",
        description: "Beralih status fitur dinamis (action: TOGGLE_FLAG) atau menambah menu baru (action: CREATE_MENU).",
        responses: {
          200: { description: "Feature flag berhasil di-toggle" },
        },
      },
    },

    "/api/dashboard/stats": {
      get: {
        tags: ["Dashboard Telemetry"],
        summary: "Mengambil Metrik Telemetry & Pendapatan Dashboard",
        description: "Mengambil total statistik platform SaaS, grafik keuangan, status kesehatan server, dan ringkasan AI Insight.",
        responses: {
          200: { description: "Metrik dashboard berhasil diambil" },
        },
      },
    },
  },
};

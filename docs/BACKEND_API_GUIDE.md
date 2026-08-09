# 🚀 Panduan Arsitektur Backend & Dokumentasi API — ARVENTA (Property Management System)

Dokumen ini ditujukan untuk **Frontend Developer** dan **Backend Developer** di tim **ARVENTA** agar memahami cara kerja arsitektur backend, konvensi pembuatan API, serta tata cara pengonsumsian API (*API Consumption Guide*).

---

## 📌 1. Pendahuluan & Filosofi Arsitektur

Project ARVENTA menggunakan **Next.js App Router** dengan pemisahan tugas (*Separation of Concerns*) yang jelas antara Backend dan Frontend:

```
[ Frontend Client Component ] 
         │
         ▼  (HTTP Request via fetch / TanStack Query)
[ Next.js API Route Handler ]  ---> (src/app/api/...)
         │
         ▼  (Zod Payload Validation)
[ Service Layer ]              ---> (src/services/...)
         │
         ▼  (Database Query via Prisma ORM 7)
[ Supabase PostgreSQL ]
```

Dengan struktur ini:
- **Backend Developer**: Fokus menulis query database, validasi Zod, Service Layer, dan mempublikasikan API di `src/app/api/`.
- **Frontend Developer**: Fokus membangun komponen UI/UX, state management (Zustand/React Query), dan memanggil endpoint API di `src/app/api/`.

---

## 📁 2. Struktur Folder Backend

```text
src/
├── app/
│   └── api/                        # 🌐 Layer Endpoint HTTP (Next.js Route Handlers)
│       └── properties/
│           ├── route.ts            # GET (List/Search) & POST (Create Property)
│           └── [id]/
│               └── route.ts        # GET (Detail), PATCH (Update), DELETE (Delete)
├── services/                       # ⚙️ Service Layer (Business Logic & Query Prisma)
│   └── property.service.ts         # Menangani query Prisma & logika bisnis properti
├── lib/
│   ├── api-response.ts             # 🛠️ Helper Respon JSON Terstandarisasi
│   └── validations/                # 🛡️ Layer Validasi Input (Zod Schemas)
│       └── property.schema.ts
```

---

## 📦 3. Format Respon JSON Standar

Semua API di ARVENTA mengembalikan format JSON yang **seragam** menggunakan helper `ApiResponse` (`src/lib/api-response.ts`).

### **A. Respon Sukses (`success: true`)**

#### 1. Mengambil List Data (dengan Metadata Paginasi) — `200 OK`
```json
{
  "success": true,
  "message": "Properties retrieved successfully",
  "data": [
    {
      "id": "5aa3ac2c-6081-4aa9-aa03-a48571234567",
      "name": "Kos Graha Asri",
      "type": "KOS",
      "city": "Bandung",
      "address": "Jl. Coblong No. 45, Dago",
      "owner": {
        "id": "...",
        "fullName": "Bpk. Hendra Pratama",
        "email": "owner@arventa.id"
      },
      "_count": {
        "units": 2,
        "expenses": 2
      }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### 2. Membuat Data Baru — `201 Created`
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "id": "new-uuid-1234",
    "name": "Kos Dago Asri 2",
    "type": "KOS"
  }
}
```

---

### **B. Respon Gagal (`success: false`)**

#### 1. Validasi Input Gagal — `400 Bad Request`
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "name": ["Property name must be at least 3 characters"],
    "type": ["Invalid enum value. Expected 'KOS' | 'KONTRAKAN' | 'APARTEMEN' | 'RUKO'"]
  }
}
```

#### 2. Data Tidak Ditemukan — `404 Not Found`
```json
{
  "success": false,
  "message": "Property with ID 'invalid-id' not found"
}
```

#### 3. Error Server — `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Failed to retrieve properties",
  "error": "Database connection error message"
}
```

---

## 📑 4. Referensi Endpoint API yang Tersedia

### **Modul Properti (`/api/properties`)**

| HTTP Method | Endpoint Path | Deskripsi | Query Params / Body | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | Mengambil list properti dengan filter | `?search=...&type=KOS&city=Bandung&page=1&limit=10` | `200 OK` |
| `POST` | `/api/properties` | Membuat properti baru | JSON Body (Zod validated) | `201 Created` / `400 Bad Request` |
| `GET` | `/api/properties/:id` | Mengambil detail properti & daftar unit | Params: `id` | `200 OK` / `404 Not Found` |
| `PATCH` | `/api/properties/:id` | Mengupdate properti | Params: `id`, JSON Body | `200 OK` / `400 Bad Request` |
| `DELETE` | `/api/properties/:id` | Menghapus properti | Params: `id` | `200 OK` / `404 Not Found` |

---

## 💡 5. Panduan Penggunaan API untuk Frontend Developer

### **Contoh 1: Fetching List Properti (GET)**
```tsx
import { useState, useEffect } from "react";

export function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/properties?type=KOS&search=Dago");
        const result = await res.json();
        
        if (result.success) {
          setProperties(result.data);
        } else {
          console.error("API Error:", result.message);
        }
      } catch (err) {
        console.error("Network Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div>Loading properti...</div>;

  return (
    <div>
      {properties.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.city} - {item.type}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### **Contoh 2: Menambah Properti Baru (POST)**
```tsx
async function onSubmitProperty(formData) {
  const response = await fetch("/api/properties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ownerId: "owner-uuid-here",
      name: "Apartemen Gateway Pasteur Unit 14C",
      type: "APARTEMEN",
      address: "Jl. Gunung Batu No. 203",
      city: "Bandung",
      description: "Unit lantai 14 view gunung",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    // Menampilkan error validasi dari Zod jika ada
    console.error("Validation Errors:", result.error);
    alert(`Gagal menambah properti: ${result.message}`);
    return;
  }

  alert("Properti berhasil ditambahkan!");
  console.log("Data baru:", result.data);
}
```

---

## 🛠️ 6. Panduan Menambah Modul API Baru (Untuk Backend Developer)

Jika ingin membuat modul API baru (misalnya `/api/units` atau `/api/leases`), ikuti 3 langkah berikut:

### **Langkah 1: Buat Zod Validation Schema**
Buat file di `src/lib/validations/[module].schema.ts`:
```ts
import { z } from "zod";

export const createUnitSchema = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().min(1),
  basePrice: z.number().positive(),
});
```

### **Langkah 2: Buat Service Layer**
Buat file di `src/services/[module].service.ts`:
```ts
import { prisma } from "@/lib/prisma";

export class UnitService {
  static async getUnitsByProperty(propertyId: string) {
    return prisma.unit.findMany({ where: { propertyId } });
  }
}
```

### **Langkah 3: Buat Route Handler**
Buat file di `src/app/api/[module]/route.ts`:
```ts
import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { UnitService } from "@/services/unit.service";

export async function GET(request: NextRequest) {
  try {
    const units = await UnitService.getUnitsByProperty("...");
    return ApiResponse.success({ message: "Units loaded", data: units });
  } catch (error) {
    return ApiResponse.error({ message: "Failed to load units", error });
  }
}
```

---

## 🔐 7. Akun Dummy untuk Testing (Hasil Seeder)

Untuk keperluan testing autentikasi dan API, berikut akun seeder yang tersedia:

| Role | Email | Password Default |
| :--- | :--- | :--- |
| **Platform Admin** | `admin@arventa.id` | `Password123!` |
| **Owner** | `owner@arventa.id` | `Password123!` |
| **Housekeeping** | `hk.budi@arventa.id` | `Password123!` |
| **Tenant** | `tenant.siti@gmail.com` | `Password123!` |
| **Tenant** | `tenant.rizky@gmail.com` | `Password123!` |

---

*Dokumen ini dibuat otomatis sebagai standar acuan tim pengembang ARVENTA.*

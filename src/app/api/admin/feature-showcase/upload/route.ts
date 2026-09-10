import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "feature-showcase";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return await createClient();
}

/**
 * POST /api/admin/feature-showcase/upload
 * Upload asset gambar carousel ke Supabase Storage folder "feature-showcase".
 * Hanya untuk PLATFORM_ADMIN. Mengembalikan public URL.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Anda harus login terlebih dahulu.");
    }
    if (authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Akses ditolak. Khusus Platform Admin.");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return ApiResponse.badRequest("File tidak ditemukan dalam FormData.");
    }

    const contentType = file.type?.toLowerCase() || "";
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (!allowedMimeTypes.includes(contentType)) {
      return ApiResponse.badRequest("Format file tidak valid. Hanya file .jpg, .jpeg, dan .png yang diperbolehkan.");
    }

    const rawExt = (file.name.split(".").pop() || "").toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png"];
    if (!allowedExtensions.includes(rawExt)) {
      return ApiResponse.badRequest("Ekstensi file tidak valid. Hanya ekstensi .jpg, .jpeg, dan .png yang diperbolehkan.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return ApiResponse.badRequest("Ukuran file terlalu besar. Maksimal ukuran file adalah 10 MB.");
    }

    const ext = rawExt === "jpeg" ? "jpg" : rawExt;
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `slide_${uniqueSuffix}.${ext}`;

    let publicUrl: string | null = null;

    try {
      const supabase = await getStorageClient();
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      publicUrl = publicUrlData.publicUrl;
    } catch (uploadErr) {
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      console.warn(`Supabase Storage Notice (${BUCKET}):`, msg);
      return ApiResponse.success({
        message: "Upload diproses dengan fallback DataURL",
        data: {
          url: `data:${contentType};base64,${fileBuffer.toString("base64")}`,
          fileName,
          isFallback: true,
          notice: `Pastikan Public Bucket '${BUCKET}' ditambahkan di Supabase Dashboard.`,
        },
      });
    }

    if (publicUrl) {
      return ApiResponse.success({
        message: "Asset berhasil di-upload ke Supabase Storage",
        data: { url: publicUrl, fileName, bucket: BUCKET },
      });
    }

    return ApiResponse.success({
      message: "Upload diproses lokal (Supabase storage notice)",
      data: {
        url: `data:${contentType};base64,${fileBuffer.toString("base64")}`,
        fileName,
        isFallback: true,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/feature-showcase/upload error:", error);
    return ApiResponse.error({ message: "Gagal mengunggah file ke server" });
  }
}

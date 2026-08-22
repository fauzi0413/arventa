import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

export async function POST(request: NextRequest) {
  try {
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let contentType = "image/jpeg";
    let bucketName = "ktp-documents";
    let oldKtpUrl = "";
    let tenantId = "";

    const contentTypeHeader = request.headers.get("content-type") || "";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const customBucket = formData.get("bucket") as string | null;
      oldKtpUrl = (formData.get("oldKtpUrl") as string | null) || "";
      tenantId = (formData.get("tenantId") as string | null) || "";

      if (customBucket) bucketName = customBucket;

      if (!file) {
        return ApiResponse.badRequest("File tidak ditemukan dalam FormData.");
      }

      contentType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      const ext = file.name.split(".").pop() || "jpg";
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const prefix = tenantId ? `ktp_${tenantId.replace(/[^a-zA-Z0-9_-]/g, "")}` : "ktp";
      fileName = `${prefix}_${uniqueSuffix}.${ext}`;
    } else {
      // JSON Base64 payload fallback
      const body = await request.json();
      const { image, bucket, oldKtpUrl: rawOldUrl, tenantId: rawTenantId } = body;

      if (bucket) bucketName = bucket;
      if (rawOldUrl) oldKtpUrl = rawOldUrl;
      if (rawTenantId) tenantId = rawTenantId;

      if (!image) {
        return ApiResponse.badRequest("Payload gambar (base64 atau file) wajib dikirimkan.");
      }

      let base64Data = image;
      if (image.startsWith("data:")) {
        const parts = image.split(",");
        const match = parts[0].match(/data:(.*);base64/);
        if (match) contentType = match[1];
        base64Data = parts[1];
      }

      fileBuffer = Buffer.from(base64Data, "base64");
      const ext = contentType.split("/")[1] || "jpeg";
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const prefix = tenantId ? `ktp_${tenantId.replace(/[^a-zA-Z0-9_-]/g, "")}` : "ktp";
      fileName = `${prefix}_${uniqueSuffix}.${ext}`;
    }

    // Strict BE MIME Type & File Size Validation
    if (!contentType.startsWith("image/")) {
      return ApiResponse.badRequest("Format file tidak valid. Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan.");
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return ApiResponse.badRequest("Ukuran file terlalu besar. Maksimal ukuran file adalah 10 MB.");
    }

    // Upload to Supabase Storage via Server Client
    try {
      const supabase = await getStorageClient();

      // Clean up / Delete old KTP image if exists and replaced
      if (oldKtpUrl && !oldKtpUrl.startsWith("data:")) {
        try {
          const urlParts = oldKtpUrl.split(`${bucketName}/`);
          if (urlParts.length > 1) {
            const oldFileName = decodeURIComponent(urlParts[1].split("?")[0]);
            if (oldFileName && oldFileName !== fileName) {
              await supabase.storage.from(bucketName).remove([oldFileName]);
              console.log(`[Supabase Storage Cleanup] Deleted old KTP file: ${oldFileName}`);
            }
          }
        } catch (cleanupErr) {
          console.warn("[Supabase Storage Cleanup Notice] Failed to remove old KTP:", cleanupErr);
        }
      }

      // Upload new file with unique filename
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.warn(`Supabase Storage Notice (${bucketName}):`, error.message);
        return ApiResponse.success({
          message: "Upload diproses dengan fallback DataURL",
          data: {
            url: `data:${contentType};base64,${fileBuffer.toString("base64")}`,
            fileName,
            bucket: bucketName,
            isFallback: true,
            notice: `Pastikan Public Bucket '${bucketName}' sudah diberi RLS Insert policy di Supabase Dashboard.`,
          },
        });
      }

      // Retrieve Public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return ApiResponse.success({
        message: "File KTP berhasil di-upload secara unik ke Supabase Storage (KTP lama ditimpa/dihapus)",
        data: {
          url: publicUrlData.publicUrl,
          fileName,
          bucket: bucketName,
        },
      });
    } catch (err: any) {
      console.warn("Supabase Storage Upload Warning:", err);
      return ApiResponse.success({
        message: "Upload diproses lokal (Supabase storage notice)",
        data: {
          url: `data:${contentType};base64,${fileBuffer.toString("base64")}`,
          fileName,
          isFallback: true,
        },
      });
    }
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return ApiResponse.error({
      message: "Gagal mengunggah file ke server",
      error,
    });
  }
}

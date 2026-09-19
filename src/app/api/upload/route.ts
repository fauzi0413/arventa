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
    let oldFileUrl = "";
    let tenantId = "";

    const contentTypeHeader = request.headers.get("content-type") || "";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const customBucket = formData.get("bucket") as string | null;
      oldFileUrl = (formData.get("oldFileUrl") as string | null) || 
                   (formData.get("oldKtpUrl") as string | null) || 
                   (formData.get("oldImageUrl") as string | null) || "";
      tenantId = (formData.get("tenantId") as string | null) || "";

      if (customBucket) bucketName = customBucket;

      if (!file) {
        return ApiResponse.badRequest("File tidak ditemukan dalam FormData.");
      }

      contentType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      const isPdfFile = contentType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const ext = file.name.split(".").pop()?.toLowerCase() || (isPdfFile ? "pdf" : "jpg");
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const prefix = bucketName === "expense-receipts"
        ? "expense"
        : bucketName === "tenant-receipts"
          ? "tenant_pay"
          : bucketName === "saas-receipts"
            ? "saas_pay"
            : bucketName === "receipts"
              ? "receipt"
              : bucketName === "property-images"
                ? "prop"
                : tenantId
                  ? `ktp_${tenantId.replace(/[^a-zA-Z0-9_-]/g, "")}`
                  : "doc";
      fileName = `${prefix}_${uniqueSuffix}.${ext}`;
    } else {
      // JSON Base64 payload fallback
      const body = await request.json();
      const { image, bucket, oldFileUrl: rawOldFile, oldKtpUrl: rawOldUrl, oldImageUrl: rawOldImg, tenantId: rawTenantId } = body;

      if (bucket) bucketName = bucket;
      if (rawOldFile || rawOldUrl || rawOldImg) {
        oldFileUrl = rawOldFile || rawOldUrl || rawOldImg || "";
      }
      if (rawTenantId) tenantId = rawTenantId;

      if (!image) {
        return ApiResponse.badRequest("Payload file (base64 atau file) wajib dikirimkan.");
      }

      let base64Data = image;
      if (image.startsWith("data:")) {
        const parts = image.split(",");
        const match = parts[0].match(/data:(.*);base64/);
        if (match) contentType = match[1];
        base64Data = parts[1];
      }

      fileBuffer = Buffer.from(base64Data, "base64");
      const isPdfFile = contentType === "application/pdf" || contentType.includes("pdf");
      const ext = isPdfFile ? "pdf" : contentType.split("/")[1] || "jpeg";
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const prefix = bucketName === "expense-receipts"
        ? "expense"
        : bucketName === "tenant-receipts"
          ? "tenant_pay"
          : bucketName === "saas-receipts"
            ? "saas_pay"
            : bucketName === "receipts"
              ? "receipt"
              : bucketName === "property-images"
                ? "prop"
                : tenantId
                  ? `ktp_${tenantId.replace(/[^a-zA-Z0-9_-]/g, "")}`
                  : "doc";
      fileName = `${prefix}_${uniqueSuffix}.${ext}`;
    }

    // Strict BE MIME Type & File Size Validation
    const isImage = contentType.startsWith("image/");
    const isPdf = contentType === "application/pdf" || contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      return ApiResponse.badRequest("Format file tidak valid. Hanya file gambar (JPG, PNG, WEBP) atau file PDF yang diperbolehkan.");
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return ApiResponse.badRequest("Ukuran file terlalu besar. Maksimal ukuran file adalah 10 MB.");
    }

    // Upload to Supabase Storage via Server Client
    try {
      const supabase = await getStorageClient();

      // Clean up / Delete old file if exists and replaced
      if (oldFileUrl && !oldFileUrl.startsWith("data:")) {
        try {
          const urlParts = oldFileUrl.split(`${bucketName}/`);
          if (urlParts.length > 1) {
            const oldFileName = decodeURIComponent(urlParts[1].split("?")[0]);
            if (oldFileName && oldFileName !== fileName) {
              const { error: removeErr } = await supabase.storage.from(bucketName).remove([oldFileName]);
              if (removeErr) {
                console.warn(`[Supabase Storage Cleanup Notice] Failed to remove old file (${oldFileName}):`, removeErr.message);
              } else {
                console.log(`[Supabase Storage Cleanup] Successfully deleted replaced old file: ${oldFileName} from ${bucketName}`);
              }
            }
          }
        } catch (cleanupErr) {
          console.warn("[Supabase Storage Cleanup Notice] Failed to remove old file:", cleanupErr);
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
            notice: `Pastikan Public Bucket '${bucketName}' sudah dibuat dan diberi RLS Insert policy di Supabase Dashboard.`,
          },
        });
      }

      // Retrieve Public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return ApiResponse.success({
        message: "File berhasil di-upload secara unik ke Supabase Storage (file lama yang ditumpuk telah dihapus)",
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

/**
 * DELETE /api/upload?bucket=property-images&url=...
 * Deletes a file from Supabase storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const bucket = searchParams.get("bucket") || "property-images";

    if (!url || url.startsWith("data:")) {
      return ApiResponse.badRequest("URL file tidak valid.");
    }

    const supabase = await getStorageClient();
    const urlParts = url.split(`${bucket}/`);
    if (urlParts.length > 1) {
      const fileName = decodeURIComponent(urlParts[1].split("?")[0]);
      if (fileName) {
        const { error } = await supabase.storage.from(bucket).remove([fileName]);
        if (error) {
          console.warn(`[Supabase Storage Delete Notice]`, error.message);
        } else {
          console.log(`[Supabase Storage Delete] Successfully deleted file: ${fileName} from ${bucket}`);
        }
      }
    }

    return ApiResponse.success({ message: "File lama berhasil dihapus dari storage." });
  } catch (error: any) {
    return ApiResponse.error({ message: "Gagal menghapus file dari storage", error });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * GET /api/properties/[id]/contract-template
 * Fetch contract template for a specific property.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;

    const template = await prisma.propertyContractTemplate.findUnique({
      where: { propertyId },
    });

    if (!template) {
      // Return clean empty template fallback structure for owner to create custom articles
      return ApiResponse.success({
        message: "Template kontrak bawaan properti",
        data: {
          id: null,
          propertyId,
          templateName: "Template Standar Properti",
          customClauses: [],
          rules: "[]",
          isDefault: true,
        },
      });
    }

    return ApiResponse.success({
      message: "Template kontrak properti berhasil diambil",
      data: {
        ...template,
        isDefault: false,
      },
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengambil template kontrak properti",
      error,
    });
  }
}

/**
 * PUT /api/properties/[id]/contract-template
 * Create or update contract template for a property.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const body = await request.json();

    const { templateName, customClauses, rules } = body;

    const updated = await prisma.propertyContractTemplate.upsert({
      where: { propertyId },
      create: {
        propertyId,
        templateName: templateName || "Template Standar Properti",
        customClauses: Array.isArray(customClauses) ? customClauses : [],
        rules: rules || null,
      },
      update: {
        templateName: templateName || "Template Standar Properti",
        customClauses: Array.isArray(customClauses) ? customClauses : [],
        rules: rules || null,
      },
    });

    return ApiResponse.success({
      message: "Template kontrak properti berhasil disimpan ke database",
      data: updated,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal menyimpan template kontrak properti",
      error,
    });
  }
}

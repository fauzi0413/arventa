import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * PATCH /api/admin/faqs/[id]
 * Update an existing FAQ entry.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: faqId } = await params;
    const body = await request.json();
    const { category, question, answer, targetRole, order, isPublished } = body;

    const existingFaq = await prisma.saaSFAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFaq) {
      return ApiResponse.notFound("Item FAQ tidak ditemukan");
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (question !== undefined) updateData.question = question;
    if (answer !== undefined) updateData.answer = answer;
    if (targetRole !== undefined) updateData.targetRole = targetRole;
    if (order !== undefined) updateData.order = Number(order);
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    const updatedFaq = await prisma.saaSFAQ.update({
      where: { id: faqId },
      data: updateData,
    });

    return ApiResponse.success({
      message: "FAQ berhasil diperbarui",
      data: updatedFaq,
    });
  } catch (error) {
    console.error("PATCH /api/admin/faqs/[id] error:", error);
    return ApiResponse.error({ message: "Gagal memperbarui FAQ" });
  }
}

/**
 * DELETE /api/admin/faqs/[id]
 * Delete a FAQ entry.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: faqId } = await params;
    const faq = await prisma.saaSFAQ.findUnique({
      where: { id: faqId },
    });

    if (!faq) {
      return ApiResponse.notFound("Item FAQ tidak ditemukan");
    }

    await prisma.saaSFAQ.delete({
      where: { id: faqId },
    });

    return ApiResponse.success({
      message: "Item FAQ berhasil dihapus",
      data: { id: faqId },
    });
  } catch (error) {
    console.error("DELETE /api/admin/faqs/[id] error:", error);
    return ApiResponse.error({ message: "Gagal menghapus FAQ" });
  }
}

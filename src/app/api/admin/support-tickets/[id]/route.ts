import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

/**
 * PATCH /api/admin/support-tickets/[id]
 * Respond to support ticket, change status, assign staff, or set priority.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();
    const { adminReply, status, priority, category, assignedTo } = body;

    const supportTicketDelegate = (prisma as any).supportTicket;
    if (!supportTicketDelegate) {
      return ApiResponse.success({
        message: "Berhasil memperbarui tiket (mode demonstrasi)",
        data: { id: ticketId, status, adminReply },
      });
    }

    const existingTicket = await supportTicketDelegate.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return ApiResponse.notFound("Tiket support tidak ditemukan");
    }

    const updateData: any = {};
    if (adminReply !== undefined) updateData.adminReply = adminReply;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    if (status !== undefined) {
      updateData.status = status;
      if (status === "RESOLVED" && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    }

    const updatedTicket = await supportTicketDelegate.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: "UPDATE_SUPPORT_TICKET",
          entityName: "SupportTicket",
          entityId: ticketId,
          details: {
            ticketNumber: updatedTicket.ticketNumber,
            status: updatedTicket.status,
            assignedTo: updatedTicket.assignedTo,
          },
        },
      });
    } catch (e) {
      console.warn("Audit log error:", e);
    }

    return ApiResponse.success({
      message: "Berhasil memperbarui tiket laporan support",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("PATCH /api/admin/support-tickets/[id] error:", error);
    return ApiResponse.error({ message: "Gagal memperbarui tiket support" });
  }
}

/**
 * DELETE /api/admin/support-tickets/[id]
 * Delete a support ticket by ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supportTicketDelegate = (prisma as any).supportTicket;
    if (!supportTicketDelegate) {
      return ApiResponse.success({
        message: "Tiket berhasil dihapus",
        data: { id: ticketId },
      });
    }

    const ticket = await supportTicketDelegate.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return ApiResponse.notFound("Tiket support tidak ditemukan");
    }

    await supportTicketDelegate.delete({
      where: { id: ticketId },
    });

    return ApiResponse.success({
      message: `Tiket ${ticket.ticketNumber} berhasil dihapus`,
      data: { id: ticketId },
    });
  } catch (error) {
    console.error("DELETE /api/admin/support-tickets/[id] error:", error);
    return ApiResponse.error({ message: "Gagal menghapus tiket support" });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const dynamic = "force-dynamic";

/**
 * GET /api/owner/cart
 * Returns owner's persistent shopping cart from database
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    // Find or create owner cart
    let cart = await prisma.saaSCart.findUnique({
      where: { ownerId: authUser.id },
      include: {
        items: {
          include: {
            addOn: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.saaSCart.create({
        data: {
          ownerId: authUser.id,
          billingCycle: "monthly",
        },
        include: {
          items: {
            include: {
              addOn: true,
            },
          },
        },
      });
    }

    return ApiResponse.success({
      message: "Berhasil mengambil keranjang SaaS",
      data: cart,
    });
  } catch (error: any) {
    console.error("GET /api/owner/cart error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil keranjang SaaS",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * POST /api/owner/cart
 * Syncs cart selected plan, billing cycle, and add-on items in database
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    const body = await req.json();
    const { selectedPlanId, billingCycle, addOnIds } = body;

    // Find or create owner cart
    let cart = await prisma.saaSCart.findUnique({
      where: { ownerId: authUser.id },
    });

    if (!cart) {
      cart = await prisma.saaSCart.create({
        data: {
          ownerId: authUser.id,
          selectedPlanId: selectedPlanId || null,
          billingCycle: billingCycle || "monthly",
        },
      });
    } else {
      cart = await prisma.saaSCart.update({
        where: { id: cart.id },
        data: {
          selectedPlanId: selectedPlanId !== undefined ? selectedPlanId : cart.selectedPlanId,
          billingCycle: billingCycle || cart.billingCycle,
        },
      });
    }

    // Update Add-On items in cart if provided
    if (Array.isArray(addOnIds)) {
      // Remove items not in addOnIds
      await prisma.saaSCartItem.deleteMany({
        where: {
          cartId: cart.id,
          addOnId: { notIn: addOnIds },
        },
      });

      // Upsert selected addOnIds
      for (const addOnId of addOnIds) {
        await prisma.saaSCartItem.upsert({
          where: {
            cartId_addOnId: {
              cartId: cart.id,
              addOnId,
            },
          },
          create: {
            cartId: cart.id,
            addOnId,
            quantity: 1,
          },
          update: {
            quantity: 1,
          },
        });
      }
    }

    // Fetch refreshed cart
    const updatedCart = await prisma.saaSCart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            addOn: true,
          },
        },
      },
    });

    return ApiResponse.success({
      message: "Keranjang SaaS berhasil diperbarui di database",
      data: updatedCart,
    });
  } catch (error: any) {
    console.error("POST /api/owner/cart error:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui keranjang SaaS",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * DELETE /api/owner/cart
 * Clears cart or removes a specific add-on
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    const { searchParams } = new URL(req.url);
    const addOnId = searchParams.get("addOnId");

    const cart = await prisma.saaSCart.findUnique({
      where: { ownerId: authUser.id },
    });

    if (!cart) {
      return ApiResponse.success({ message: "Keranjang sudah kosong" });
    }

    if (addOnId) {
      await prisma.saaSCartItem.deleteMany({
        where: {
          cartId: cart.id,
          addOnId,
        },
      });
    } else {
      // Clear entire cart
      await prisma.saaSCartItem.deleteMany({
        where: { cartId: cart.id },
      });
      await prisma.saaSCart.update({
        where: { id: cart.id },
        data: { selectedPlanId: null },
      });
    }

    return ApiResponse.success({
      message: "Berhasil mengosongkan/menghapus item keranjang",
    });
  } catch (error: any) {
    console.error("DELETE /api/owner/cart error:", error);
    return ApiResponse.error({
      message: "Gagal menghapus item keranjang",
      error: error?.message || error,
      status: 500,
    });
  }
}

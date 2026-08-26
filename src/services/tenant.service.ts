import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";
import { CreateTenantInput, UpdateTenantInput } from "@/lib/validations/tenant.schema";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function deleteStorageFiles(urls: (string | null | undefined)[]) {
  const validUrls = urls.filter((u): u is string => Boolean(u && typeof u === "string" && !u.startsWith("data:")));
  if (validUrls.length === 0) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const knownBuckets = ["ktp-documents", "avatars", "contracts", "invoices", "properties", "units"];

    for (const url of validUrls) {
      let deleted = false;

      // Match known bucket in URL path
      for (const bucket of knownBuckets) {
        if (url.includes(`/${bucket}/`)) {
          const parts = url.split(`/${bucket}/`);
          if (parts.length > 1) {
            const filePath = decodeURIComponent(parts[1].split("?")[0]);
            if (filePath) {
              await supabase.storage.from(bucket).remove([filePath]);
              console.log(`[Storage Cleanup] Deleted file from '${bucket}': ${filePath}`);
              deleted = true;
              break;
            }
          }
        }
      }

      // Regex fallback if URL uses standard Supabase storage format
      if (!deleted) {
        const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
        if (match) {
          const [, bucket, rawPath] = match;
          const filePath = decodeURIComponent(rawPath.split("?")[0]);
          await supabase.storage.from(bucket).remove([filePath]);
          console.log(`[Storage Cleanup] Deleted file from '${bucket}': ${filePath}`);
        }
      }
    }
  } catch (err) {
    console.warn("[Storage Cleanup Notice] Failed to remove storage files:", err);
  }
}

export interface TenantFilterParams {
  search?: string;
  propertyIds?: string[];
  userId?: string;
  page?: number;
  limit?: number;
}

/**
 * Tenant Service Layer
 * Encapsulates Prisma queries and business logic for Tenant Profiles and Tenant Users.
 */
export class TenantService {
  /**
   * Get paginated & filtered list of tenants
   */
  static async getAllTenants(params: TenantFilterParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { phoneNumber: { contains: params.search, mode: "insensitive" } },
        { user: { fullName: { contains: params.search, mode: "insensitive" } } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: params.search, mode: "insensitive" } } },
        { nik: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.propertyIds !== undefined) {
      where.leases = {
        some: {
          unit: {
            propertyId: { in: params.propertyIds },
          },
        },
      };
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    const [items, total] = await Promise.all([
      prisma.tenantProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              isActive: true,
              createdAt: true,
            },
          },
          leases: {
            orderBy: { createdAt: "desc" },
            include: {
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                  property: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          leaseLogs: {
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              leases: true,
              leaseLogs: true,
            },
          },
        },
      }),
      prisma.tenantProfile.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tenant profile detail by ID (TenantProfile ID or User ID)
   */
  static async getTenantById(id: string) {
    return prisma.tenantProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
        leases: {
          orderBy: { createdAt: "desc" },
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
            invoices: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        leaseLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Create new tenant profile (Only creates TenantProfile, User account is ONLY created when assigned to a room)
   */
  static async createTenant(data: CreateTenantInput) {
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      const existingProfile = await prisma.tenantProfile.findFirst({
        where: { email: data.email },
      });

      if (existingUser || existingProfile) {
        throw new Error(`Email ${data.email} sudah terdaftar.`);
      }
    }

    return prisma.$transaction(async (tx) => {
      let user: any = null;
      let unit: any = null;
      let lease: any = null;

      // 1. If unit is provided AND status === 'AKTIF', find unit and mark occupied
      if (data.unitName && data.status === "AKTIF") {
        unit = await tx.unit.findFirst({
          where: {
            unitNumber: data.unitName,
            ...(data.propertyName
              ? { property: { name: { contains: data.propertyName, mode: "insensitive" } } }
              : {}),
          },
          include: { property: true },
        });

        if (unit) {
          // Mark unit as occupied
          await tx.unit.update({
            where: { id: unit.id },
            data: { status: "OCCUPIED" },
          });
        }
      }

      // 2. Create TenantProfile standalone (User account is not created when adding a tenant)
      const tenantProfile = await tx.tenantProfile.create({
        data: {
          fullName: data.fullName,
          email: data.email || null,
          phoneNumber: data.phoneNumber || null,
          userId: null,
          nik: data.nik || null,
          ktpImageUrl: data.ktpImageUrl || null,
          birthPlaceDate: data.birthPlaceDate || null,
          gender: data.gender || null,
          bloodType: data.bloodType || null,
          addressKtp: data.addressKtp || null,
          rtRw: data.rtRw || null,
          kelDesa: data.kelDesa || null,
          kecamatan: data.kecamatan || null,
          religion: data.religion || null,
          maritalStatus: data.maritalStatus || null,
          occupation: data.occupation || null,
          nationality: data.nationality || "WNI",
          validUntil: data.validUntil || "SEUMUR HIDUP",
          emergencyName: data.emergencyName || null,
          emergencyPhone: data.emergencyPhone || null,
          emergencyRelation: data.emergencyRelation || null,
        },
      });

      // 3. Create Lease & initial Invoice if unit assigned & status === 'AKTIF'
      if (unit && data.status === "AKTIF") {
        const startDate = data.leaseStartDate ? new Date(data.leaseStartDate) : new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        lease = await tx.lease.create({
          data: {
            tenantId: tenantProfile.id,
            unitId: unit.id,
            startDate,
            endDate,
            rentPrice: unit.price,
            rentalPeriod: "MONTHLY",
            status: "ACTIVE",
          },
        });

        // Auto-generate initial Invoice (Rent + Deposit) for ACTIVE contract
        const invNumber = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${Math.floor(1000 + Math.random() * 9000)}`;
        const rentAmt = Number(unit.price || 0);
        const depAmt = Number(unit.deposit || 0);

        await tx.invoice.create({
          data: {
            invoiceNumber: invNumber,
            leaseId: lease.id,
            amount: rentAmt,
            utilityAmount: 0,
            penaltyAmount: 0,
            totalAmount: rentAmt + depAmt,
            dueDate: startDate,
            status: "PENDING",
          },
        });
      }

      // 4. Create initial LeaseLog entry in log_leases
      const isAktifWithUnit = data.status === "AKTIF" && data.unitName;
      const actionType = isAktifWithUnit ? "INITIAL_PLACEMENT" : "REGISTERED";
      const title = isAktifWithUnit
        ? `Penempatan Unit: ${unit?.property?.name || data.propertyName || ''} — ${data.unitName}`
        : "Pendaftaran Calon Penyewa Baru";
      const description = isAktifWithUnit
        ? `Penyewa baru terdaftar dan ditempatkan pada unit ${unit?.property?.name || data.propertyName || ''} — ${data.unitName}.`
        : "Calon penyewa baru berhasil terdaftar di sistem (Belum ada penempatan unit).";

      await tx.leaseLog.create({
        data: {
          tenantId: tenantProfile.id,
          unitId: unit?.id || null,
          leaseId: lease?.id || null,
          actionType,
          title,
          description,
          propertyName: unit?.property?.name || data.propertyName || null,
          unitName: unit?.unitNumber || data.unitName || null,
          toStatus: data.status === "AKTIF" ? "AKTIF" : "CALON",
        },
      });

      return tenantProfile;
    });
  }

  /**
   * Update existing tenant profile & user details
   */
  static async updateTenant(id: string, data: UpdateTenantInput) {
    const tenant = await this.getTenantById(id);
    if (!tenant) {
      throw new Error("Tenant Profile tidak ditemukan");
    }

    // Update User & TenantProfile in transaction
    return prisma.$transaction(async (tx) => {
      const isNonAktif = data.status === "NONAKTIF";
      const isCalon = data.status === "CALON";
      const isAktif = data.status === "AKTIF";

      if (data.fullName || data.email || data.phoneNumber !== undefined || data.status !== undefined) {
        await tx.tenantProfile.update({
          where: { id: tenant.id },
          data: {
            ...(data.fullName && { fullName: data.fullName }),
            ...(data.email && { email: data.email }),
            ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
          },
        });

        if (tenant.userId) {
          await tx.user.update({
            where: { id: tenant.userId },
            data: {
              ...(data.fullName && { fullName: data.fullName }),
              ...(data.email && { email: data.email }),
              ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
              ...(isNonAktif && { isActive: false }),
              ...((isAktif || isCalon) && { isActive: true }),
            },
          });
        }
      }

      if (isNonAktif || isCalon) {
        // Find active leases for this tenant and terminate them
        const activeLeases = await tx.lease.findMany({
          where: { tenantId: tenant.id, status: "ACTIVE" },
          include: { unit: { include: { property: true } } },
        });

        for (const l of activeLeases) {
          // Free unit
          await tx.unit.update({
            where: { id: l.unitId },
            data: { status: "AVAILABLE" },
          });

          // Mark lease terminated
          await tx.lease.update({
            where: { id: l.id },
            data: { status: "TERMINATED" },
          });

          // Log lease deactivation/release
          await tx.leaseLog.create({
            data: {
              tenantId: tenant.id,
              unitId: l.unitId,
              leaseId: l.id,
              actionType: isNonAktif ? 'DEACTIVATED' : 'STATUS_CHANGE',
              title: isNonAktif ? 'Status Berubah: Nonaktif / Alumni' : 'Status Berubah: Calon Penyewa',
              description: isNonAktif
                ? `Penyewa telah dinonaktifkan (checkout/alumni). Unit ${l.unit.property?.name || ''} — ${l.unit.unitNumber} telah dikosongkan kembali.`
                : 'Status penyewa diubah menjadi Calon Penyewa.',
              propertyName: l.unit.property?.name,
              unitName: l.unit.unitNumber,
              fromStatus: 'AKTIF',
              toStatus: isNonAktif ? 'NONAKTIF' : 'CALON',
            },
          });
        }
      } else if (isAktif) {
        if (data.unitName || data.propertyName) {
          const cleanUnitName = (data.unitName || '').replace(/^(kamar|apt|unit)\s+/i, '').trim();
          const targetUnit = await tx.unit.findFirst({
            where: {
              OR: [
                { unitNumber: data.unitName },
                { unitNumber: cleanUnitName },
                { unitNumber: `Kamar ${cleanUnitName}` },
                { unitNumber: `Apt ${cleanUnitName}` },
              ],
            },
            include: { property: true },
          });

          if (targetUnit) {
            // Find previous active leases on OTHER units
            const previousActiveLeases = await tx.lease.findMany({
              where: {
                tenantId: tenant.id,
                status: "ACTIVE",
                unitId: { not: targetUnit.id },
              },
              include: { unit: { include: { property: true } } },
            });

            if (previousActiveLeases.length > 0) {
              const oldLeaseIds = previousActiveLeases.map((l) => l.id);
              const oldUnitIds = previousActiveLeases.map((l) => l.unitId);

              // UPDATE leases table: set old lease status to TERMINATED
              await tx.lease.updateMany({
                where: { id: { in: oldLeaseIds } },
                data: { status: "TERMINATED" },
              });

              await tx.unit.updateMany({
                where: { id: { in: oldUnitIds } },
                data: { status: "AVAILABLE" },
              });

              // INSERT into log_leases table: previous unit released
              for (const oldL of previousActiveLeases) {
                await tx.leaseLog.create({
                  data: {
                    tenantId: tenant.id,
                    unitId: oldL.unitId,
                    leaseId: oldL.id,
                    actionType: 'PREVIOUS_UNIT_RELEASED',
                    title: `Riwayat Unit Lama: ${oldL.unit.property?.name || ''} — ${oldL.unit.unitNumber}`,
                    description: `Unit ini telah ditinggalkan karena penyewa dipindahkan ke unit baru (${targetUnit.unitNumber}).`,
                    propertyName: oldL.unit.property?.name,
                    unitName: oldL.unit.unitNumber,
                    fromStatus: 'ACTIVE',
                    toStatus: 'TERMINATED',
                  },
                });
              }
            }

            // Check if active lease for this target unit already exists
            const existingActiveTargetLease = await tx.lease.findFirst({
              where: { tenantId: tenant.id, unitId: targetUnit.id, status: "ACTIVE" },
            });

            let activeLeaseRecord;
            if (!existingActiveTargetLease) {
              activeLeaseRecord = await tx.lease.create({
                data: {
                  tenantId: tenant.id,
                  unitId: targetUnit.id,
                  rentalPeriod: "MONTHLY",
                  startDate: data.leaseStartDate ? new Date(data.leaseStartDate) : new Date(),
                  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  rentPrice: targetUnit.basePrice || 1000000,
                  status: "ACTIVE",
                },
              });
            } else {
              activeLeaseRecord = existingActiveTargetLease;
            }

            // INSERT into log_leases table: unit placement / transfer log
            const isInitialPlacement = previousActiveLeases.length === 0;
            await tx.leaseLog.create({
              data: {
                tenantId: tenant.id,
                unitId: targetUnit.id,
                leaseId: activeLeaseRecord.id,
                actionType: isInitialPlacement ? 'INITIAL_PLACEMENT' : 'TRANSFER_UNIT',
                title: isInitialPlacement
                  ? `Penempatan Unit: ${targetUnit.property?.name || ''} — ${targetUnit.unitNumber}`
                  : `Pindah Unit: Ditempatkan di ${targetUnit.unitNumber}`,
                description: isInitialPlacement
                  ? `Penyewa pertama kali ditempatkan di unit ini.`
                  : `Penyewa berhasil dipindahkan ke ${targetUnit.property?.name || ''} — ${targetUnit.unitNumber}.`,
                propertyName: targetUnit.property?.name,
                unitName: targetUnit.unitNumber,
                toStatus: 'AKTIF',
              },
            });

            // Update target unit status to OCCUPIED
            await tx.unit.update({
              where: { id: targetUnit.id },
              data: { status: "OCCUPIED" },
            });
          }
        }
      }

      return tx.tenantProfile.update({
        where: { id: tenant.id },
        data: {
          ...(data.nik !== undefined && { nik: data.nik || null }),
          ...(data.ktpImageUrl !== undefined && { ktpImageUrl: data.ktpImageUrl || null }),
          ...(data.birthPlaceDate !== undefined && { birthPlaceDate: data.birthPlaceDate || null }),
          ...(data.gender !== undefined && { gender: data.gender || null }),
          ...(data.bloodType !== undefined && { bloodType: data.bloodType || null }),
          ...(data.addressKtp !== undefined && { addressKtp: data.addressKtp || null }),
          ...(data.rtRw !== undefined && { rtRw: data.rtRw || null }),
          ...(data.kelDesa !== undefined && { kelDesa: data.kelDesa || null }),
          ...(data.kecamatan !== undefined && { kecamatan: data.kecamatan || null }),
          ...(data.religion !== undefined && { religion: data.religion || null }),
          ...(data.maritalStatus !== undefined && { maritalStatus: data.maritalStatus || null }),
          ...(data.occupation !== undefined && { occupation: data.occupation || null }),
          ...(data.nationality !== undefined && { nationality: data.nationality || null }),
          ...(data.validUntil !== undefined && { validUntil: data.validUntil || null }),
          ...(data.emergencyName !== undefined && { emergencyName: data.emergencyName || null }),
          ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone || null }),
          ...(data.emergencyRelation !== undefined && { emergencyRelation: data.emergencyRelation || null }),
        },
        include: {
          user: true,
          leases: {
            orderBy: { createdAt: "desc" },
            include: {
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                  property: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          leaseLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });
  }

  /**
   * Delete tenant profile & user account, along with all associated storage files
   */
  static async deleteTenant(id: string) {
    const tenant = await this.getTenantById(id);
    if (!tenant) {
      throw new Error("Tenant Profile tidak ditemukan");
    }

    // Collect all associated file URLs to remove from Supabase Storage
    const fileUrlsToDelete: (string | null | undefined)[] = [
      tenant.ktpImageUrl,
      tenant.user?.avatarUrl,
    ];

    const leases = await prisma.lease.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, contractUrl: true },
    });

    for (const l of leases) {
      if (l.contractUrl) fileUrlsToDelete.push(l.contractUrl);
    }

    const leaseIds = leases.map((l) => l.id);
    if (leaseIds.length > 0) {
      const invoices = await prisma.invoice.findMany({
        where: { leaseId: { in: leaseIds } },
        select: { paymentReceipt: true },
      });
      for (const inv of invoices) {
        if (inv.paymentReceipt) fileUrlsToDelete.push(inv.paymentReceipt);
      }
    }

    const deleteResult = await prisma.$transaction(async (tx) => {
      // 1. Find all leases associated with this tenant profile
      const tenantLeases = await tx.lease.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, unitId: true, status: true },
      });

      // 2. Free up any units associated with active leases
      const activeUnitIds = tenantLeases
        .filter((l) => l.status === "ACTIVE")
        .map((l) => l.unitId);

      if (activeUnitIds.length > 0) {
        await tx.unit.updateMany({
          where: { id: { in: activeUnitIds } },
          data: { status: "AVAILABLE" },
        });
      }

      // 3. Delete invoices linked to these leases
      if (leaseIds.length > 0) {
        await tx.invoice.deleteMany({
          where: { leaseId: { in: leaseIds } },
        });
      }

      // 4. Delete lease logs associated with this tenant or these leases
      await tx.leaseLog.deleteMany({
        where: {
          OR: [
            { tenantId: tenant.id },
            ...(leaseIds.length > 0 ? [{ leaseId: { in: leaseIds } }] : []),
          ],
        },
      });

      // 5. Delete leases associated with this tenant
      if (leaseIds.length > 0) {
        await tx.lease.deleteMany({
          where: { id: { in: leaseIds } },
        });
      }

      // 6. Delete TenantProfile & User account (if linked)
      const deletedProfile = await tx.tenantProfile.delete({
        where: { id: tenant.id },
      });

      if (tenant.userId) {
        await tx.user.delete({
          where: { id: tenant.userId },
        });
      }

      return deletedProfile;
    });

    // Asynchronously cleanup storage files after successful DB transaction
    await deleteStorageFiles(fileUrlsToDelete);

    return deleteResult;
  }
}

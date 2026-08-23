import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../src/lib/prisma";
import { UserRole } from "../../generated/prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Creates or fetches a user from Supabase Auth (auth.users)
 * and returns the Supabase Auth UID. Default password: Password123!
 */
async function getOrCreateSupabaseAuthUser(email: string, fullName: string) {
  try {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === email);
    if (existing) {
      return existing.id;
    }

    const { data: createData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "Password123!",
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error || !createData.user) {
      console.error(`⚠️ Failed to create Supabase Auth user for ${email}:`, error?.message);
      return null;
    }

    console.log(`🔐 Registered in Supabase Auth: ${email} (UID: ${createData.user.id})`);
    return createData.user.id;
  } catch (err) {
    console.error(`⚠️ Unexpected error syncing Supabase Auth for ${email}:`, err);
    return null;
  }
}

/**
 * Seed users and tenant profiles for 4 main system roles.
 * Syncs with Supabase Auth (auth.users) and public.users.
 */
export async function seedUsers() {
  console.log("\n👤 Seeding Users & Tenant Profiles (Syncing Supabase Auth)...");

  // 1. Platform Admin
  const adminAuthId = await getOrCreateSupabaseAuthUser(
    "admin@arventa.id",
    "Platform Admin Arventa"
  );
  let admin = await prisma.user.findUnique({
    where: { email: "admin@arventa.id" },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@arventa.id",
        fullName: "Platform Admin Arventa",
        phoneNumber: "081111111111",
        role: UserRole.PLATFORM_ADMIN,
        supabaseAuthId: adminAuthId,
      },
    });
    console.log(`✅ Created Public User [Admin]: ${admin.email}`);
  } else {
    if (!admin.supabaseAuthId && adminAuthId) {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { supabaseAuthId: adminAuthId },
      });
      console.log(`🔄 Linked existing Admin to Supabase Auth UID: ${adminAuthId}`);
    } else {
      console.log(`ℹ️ Existing Admin found: ${admin.email}`);
    }
  }

  // 2. Owner Hendra
  const ownerAuthId = await getOrCreateSupabaseAuthUser(
    "owner@arventa.id",
    "Bpk. Hendra Pratama"
  );
  let ownerHendra = await prisma.user.findUnique({
    where: { email: "owner@arventa.id" },
  });
  if (!ownerHendra) {
    ownerHendra = await prisma.user.create({
      data: {
        email: "owner@arventa.id",
        fullName: "Bpk. Hendra Pratama",
        phoneNumber: "081222222222",
        role: UserRole.OWNER,
        supabaseAuthId: ownerAuthId,
      },
    });
    console.log(`✅ Created Public User [Owner]: ${ownerHendra.fullName}`);
  } else {
    if (!ownerHendra.supabaseAuthId && ownerAuthId) {
      ownerHendra = await prisma.user.update({
        where: { id: ownerHendra.id },
        data: { supabaseAuthId: ownerAuthId },
      });
      console.log(`🔄 Linked existing Owner to Supabase Auth UID: ${ownerAuthId}`);
    } else {
      console.log(`ℹ️ Existing Owner found: ${ownerHendra.fullName}`);
    }
  }

  // 3. Housekeeping Budi
  const hkAuthId = await getOrCreateSupabaseAuthUser(
    "hk.budi@arventa.id",
    "Budi Santoso"
  );
  let housekeepingBudi = await prisma.user.findUnique({
    where: { email: "hk.budi@arventa.id" },
  });
  if (!housekeepingBudi) {
    housekeepingBudi = await prisma.user.create({
      data: {
        email: "hk.budi@arventa.id",
        fullName: "Budi Santoso",
        phoneNumber: "081333333333",
        role: UserRole.HOUSEKEEPING,
        supabaseAuthId: hkAuthId,
      },
    });
    console.log(`✅ Created Public User [Housekeeping]: ${housekeepingBudi.fullName}`);
  } else {
    if (!housekeepingBudi.supabaseAuthId && hkAuthId) {
      housekeepingBudi = await prisma.user.update({
        where: { id: housekeepingBudi.id },
        data: { supabaseAuthId: hkAuthId },
      });
      console.log(`🔄 Linked existing Housekeeping to Supabase Auth UID: ${hkAuthId}`);
    } else {
      console.log(`ℹ️ Existing Housekeeping found: ${housekeepingBudi.fullName}`);
    }
  }


  // 4. Tenant Profile Siti Rahmawati
  let tenantSitiProfile = await prisma.tenantProfile.findFirst({
    where: { email: "tenant.siti@gmail.com" },
  });
  if (!tenantSitiProfile) {
    tenantSitiProfile = await prisma.tenantProfile.create({
      data: {
        fullName: "Siti Rahmawati",
        email: "tenant.siti@gmail.com",
        phoneNumber: "081444444444",
        nik: "3273012345670001",
        ktpImageUrl:
          "https://xyzstorage.supabase.co/storage/v1/object/public/ktp/siti_ktp.jpg",
        occupation: "Software Engineer",
        emergencyName: "Ibu Ratna (Ibu Kandung)",
        emergencyPhone: "081234567890",
      },
    });
    console.log(`✅ Created TenantProfile: ${tenantSitiProfile.fullName}`);
  }

  // 5. Tenant Profile Rizky Pratama
  let tenantRizkyProfile = await prisma.tenantProfile.findFirst({
    where: { email: "tenant.rizky@gmail.com" },
  });
  if (!tenantRizkyProfile) {
    tenantRizkyProfile = await prisma.tenantProfile.create({
      data: {
        fullName: "Rizky Pratama",
        email: "tenant.rizky@gmail.com",
        phoneNumber: "081555555555",
        nik: "3273012345670002",
        ktpImageUrl:
          "https://xyzstorage.supabase.co/storage/v1/object/public/ktp/rizky_ktp.jpg",
        occupation: "Account Executive",
        emergencyName: "Bpk. Bambang (Ayah Kandung)",
        emergencyPhone: "081987654321",
      },
    });
    console.log(`✅ Created TenantProfile: ${tenantRizkyProfile.fullName}`);
  }

  return {
    admin,
    ownerHendra,
    housekeepingBudi,
    tenantSitiProfile,
    tenantRizkyProfile,
  };
}

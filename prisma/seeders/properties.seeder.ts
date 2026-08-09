import { prisma } from "../../src/lib/prisma";
import { PropertyType, User } from "../../generated/prisma/client";

/**
 * Seed Indonesian context properties (KOS & APARTEMEN in Bandung).
 * Idempotent: Checks by ownerId and property name before creation.
 */
export async function seedProperties(owner: User) {
  console.log("\n🏢 Seeding Properties (Idempotent)...");

  let kosGrahaAsri = await prisma.property.findFirst({
    where: {
      ownerId: owner.id,
      name: "Kos Graha Asri",
    },
  });

  if (!kosGrahaAsri) {
    kosGrahaAsri = await prisma.property.create({
      data: {
        ownerId: owner.id,
        name: "Kos Graha Asri",
        type: PropertyType.KOS,
        address: "Jl. Coblong No. 45, Dago",
        city: "Bandung",
        description:
          "Kos-kosan eksklusif mahasiswa/pekerja dekat kampus ITB Dago dengan suasana asri dan tenang.",
        coverImage: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5",
      },
    });
    console.log(`✅ Created Property [KOS]: ${kosGrahaAsri.name} in ${kosGrahaAsri.city}`);
  } else {
    console.log(`ℹ️ Existing Property [KOS] found: ${kosGrahaAsri.name}`);
  }

  let aptGatewayPasteur = await prisma.property.findFirst({
    where: {
      ownerId: owner.id,
      name: "Apartemen Gateway Pasteur Unit 12B",
    },
  });

  if (!aptGatewayPasteur) {
    aptGatewayPasteur = await prisma.property.create({
      data: {
        ownerId: owner.id,
        name: "Apartemen Gateway Pasteur Unit 12B",
        type: PropertyType.APARTEMEN,
        address: "Jl. Gunung Batu No. 203, Pasteur",
        city: "Bandung",
        description:
          "Apartemen modern di gerbang tol Pasteur, akses mudah ke kota dan bandara dengan fasilitas privat.",
        coverImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
      },
    });
    console.log(`✅ Created Property [APARTEMEN]: ${aptGatewayPasteur.name} in ${aptGatewayPasteur.city}`);
  } else {
    console.log(`ℹ️ Existing Property [APARTEMEN] found: ${aptGatewayPasteur.name}`);
  }

  return {
    kosGrahaAsri,
    aptGatewayPasteur,
  };
}

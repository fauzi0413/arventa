import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const OWNER_CODE = "OWNER";
  const FAQ_PATH = "/owner/faq";

  const ownerRole = await prisma.role.findUnique({ where: { code: OWNER_CODE } });
  if (!ownerRole) {
    console.error("❌ Role OWNER tidak ditemukan di database.");
    return;
  }
  console.log(`✅ Ditemukan Role OWNER: ${ownerRole.id}`);

  const existingMenu = await prisma.menuItem.findFirst({ where: { path: FAQ_PATH } });
  if (existingMenu) {
    const existingLink = await prisma.roleMenu.findUnique({
      where: { roleId_menuItemId: { roleId: ownerRole.id, menuItemId: existingMenu.id } },
    });
    if (existingLink) {
      console.log("ℹ️  Menu FAQ & Bantuan sudah ada untuk OWNER. Tidak perlu insert lagi.");
      return;
    }
    await prisma.roleMenu.create({
      data: { roleId: ownerRole.id, menuItemId: existingMenu.id },
    });
    console.log("✅ Menu FAQ sudah ada, baru di-link ke OWNER.");
    return;
  }

  const faqMenu = await prisma.menuItem.create({
    data: {
      title: "FAQ & Bantuan",
      path: FAQ_PATH,
      icon: "IconHelpCircle",
      group: "BANTUAN",
      order: 12,
      parentId: null,
    },
  });
  console.log(`✅ MenuItem "FAQ & Bantuan" dibuat: ${faqMenu.id}`);

  await prisma.roleMenu.create({
    data: { roleId: ownerRole.id, menuItemId: faqMenu.id },
  });
  console.log("✅ Berhasil di-link ke role OWNER.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

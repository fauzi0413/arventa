import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const allItems = await prisma.menuItem.findMany({
    include: {
      parent: true,
      children: true,
      roleMenus: { include: { role: true } },
    },
    orderBy: { order: "asc" },
  });

  console.log("=== ALL MENU ITEMS IN DB ===");
  for (const item of allItems) {
    const roles = item.roleMenus.map(rm => rm.role.code).join(", ");
    console.log(`ID: ${item.id} | Title: "${item.title}" | Path: "${item.path}" | ParentId: ${item.parentId} (ParentTitle: "${item.parent?.title || 'NONE'}") | Roles: [${roles}]`);
  }
}

main().catch(console.error);

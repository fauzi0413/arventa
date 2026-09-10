import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const menuItems = await prisma.menuItem.findMany({
    include: {
      roleMenus: {
        include: {
          role: true,
        },
      },
      parent: true,
    },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  const formattedMenus = menuItems.map((item) => {
    const roleCodes = item.roleMenus.map((rm) => rm.role.code);
    return {
      title: item.title,
      path: item.path,
      icon: item.icon || "IconCircle",
      group: item.group || "UTAMA",
      order: item.order,
      roles: roleCodes,
      parentTitle: item.parent ? item.parent.title : undefined,
    };
  });

  console.log("TOTAL_ITEMS:", formattedMenus.length);
  console.log(JSON.stringify(formattedMenus, null, 2));
}

main().catch(console.error);

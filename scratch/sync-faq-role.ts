import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const setting = await prisma.systemSetting.findUnique({
    where: { key: "arventa_faq_items" },
  });

  if (setting && setting.value) {
    try {
      const items = JSON.parse(setting.value);
      if (Array.isArray(items)) {
        let updatedCount = 0;
        const updatedItems = items.map((item: any) => {
          if (item.targetRole === "USER") {
            updatedCount++;
            return { ...item, targetRole: "TENANT" };
          }
          return item;
        });

        await prisma.systemSetting.update({
          where: { key: "arventa_faq_items" },
          data: { value: JSON.stringify(updatedItems) },
        });

        console.log(`✅ Successfully updated ${updatedCount} FAQ item(s) from USER to TENANT in system_settings database table.`);
      }
    } catch (err) {
      console.error("Failed to parse/update systemSetting for arventa_faq_items:", err);
    }
  } else {
    console.log("No stored arventa_faq_items found in system_settings DB table.");
  }
}

main().finally(() => process.exit(0));

import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const u = await prisma.user.findFirst({ where: { email: { contains: "asep" } } });
  console.log("DB USER FOR ASEP:", u);
}

main();

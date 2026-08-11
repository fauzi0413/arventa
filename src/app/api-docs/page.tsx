import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SwaggerUiViewer } from "@/components/shared/swagger-ui-viewer";

export const metadata = {
  title: "API Documentation | ARVENTA SaaS Platform",
  description: "Dokumentasi REST API resmi OpenAPI/Swagger ARVENTA Property Management System.",
};

export default async function ApiDocsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Must be logged in
  if (!user) {
    redirect("/login");
  }

  // 2. Must have PLATFORM_ADMIN role
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { role: true },
  });

  const userRole = dbUser?.role || user.user_metadata?.role;

  if (userRole !== "PLATFORM_ADMIN") {
    redirect("/login");
  }

  return <SwaggerUiViewer />;
}

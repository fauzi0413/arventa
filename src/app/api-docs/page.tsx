import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SwaggerUiViewer } from "@/components/shared/swagger-ui-viewer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "API Documentation | ARVENTA SaaS Platform",
  description: "Dokumentasi REST API resmi OpenAPI/Swagger ARVENTA Property Management System.",
};

export default async function ApiDocsPage() {
  let userEmail: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      userEmail = user.email;
    }
  } catch (err) {
    console.warn("Supabase auth check in api-docs warning:", err);
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("arventa_session")?.value;
  const demoRoleCookie = cookieStore.get("arventa_demo_role")?.value;

  const isAuthorizedSession =
    sessionCookie === "true" || Boolean(demoRoleCookie) || Boolean(userEmail);

  if (!isAuthorizedSession) {
    redirect("/login");
  }

  return <SwaggerUiViewer />;
}

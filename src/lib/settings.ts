import { prisma } from "@/lib/prisma";

export interface SystemSettingsConfig {
  maintenance_mode: boolean;
  platform_name: string;
  default_currency: string;
  max_login_attempts: number;
  session_timeout_mins: number;
  gemini_api_key: string;
  gemini_model: string;
  resend_api_key: string;
  sender_email: string;
  supabase_url: string;
  supabase_service_role: string;
  midtrans_server_key: string;
  midtrans_client_key: string;
  midtrans_mode: "SANDBOX" | "PRODUCTION";
}

/**
 * Fetch all SystemSettings from DB with fallback defaults & process.env overrides
 */
export async function getSystemSettings(): Promise<SystemSettingsConfig> {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settingsList) {
      map[s.key] = s.value;
    }

    return {
      maintenance_mode: map.maintenance_mode === "true",
      platform_name: map.platform_name || "ARVENTA - Room & Property PMS",
      default_currency: map.default_currency || "IDR",
      max_login_attempts: parseInt(map.max_login_attempts || "5", 10),
      session_timeout_mins: parseInt(map.session_timeout_mins || "120", 10),

      // API Key Gateways (Fallback to process.env if not set in DB)
      gemini_api_key: map.gemini_api_key || process.env.GEMINI_API_KEY || "",
      gemini_model: map.gemini_model || process.env.GEMINI_MODEL || "gemini-1.5-flash",

      resend_api_key: map.resend_api_key || process.env.RESEND_API_KEY || "",
      sender_email: map.sender_email || process.env.SENDER_EMAIL || "no-reply@arventa.id",

      supabase_url: map.supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabase_service_role: map.supabase_service_role || process.env.SUPABASE_SERVICE_ROLE_KEY || "",

      midtrans_server_key: map.midtrans_server_key || process.env.MIDTRANS_SERVER_KEY || "",
      midtrans_client_key: map.midtrans_client_key || process.env.MIDTRANS_CLIENT_KEY || "",
      midtrans_mode: (map.midtrans_mode as any) || "SANDBOX",
    };
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    // Fallback defaults if DB error
    return {
      maintenance_mode: false,
      platform_name: "ARVENTA - Room & Property PMS",
      default_currency: "IDR",
      max_login_attempts: 5,
      session_timeout_mins: 120,
      gemini_api_key: process.env.GEMINI_API_KEY || "",
      gemini_model: "gemini-1.5-flash",
      resend_api_key: process.env.RESEND_API_KEY || "",
      sender_email: "no-reply@arventa.id",
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabase_service_role: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      midtrans_server_key: "",
      midtrans_client_key: "",
      midtrans_mode: "SANDBOX",
    };
  }
}

/**
 * Get a single setting by key
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting ? setting.value : null;
  } catch (err) {
    console.error(`Failed to get setting ${key}:`, err);
    return null;
  }
}

/**
 * Check if Global Maintenance Mode is active
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  const val = await getSystemSetting("maintenance_mode");
  return val === "true";
}

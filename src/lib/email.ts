import { getSystemSettings } from "@/lib/settings";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send Email via Resend API using configured API Key & Sender Email from System Settings
 */
export async function sendNotificationEmail(payload: SendEmailPayload) {
  const settings = await getSystemSettings();
  const apiKey = settings.resend_api_key;
  const from = settings.sender_email;

  if (!apiKey) {
    return {
      success: false,
      error: "Resend API Key belum dikonfigurasi di Platform Settings",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json();
      return {
        success: false,
        error: errJson.message || `Resend Error (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      emailId: data.id,
    };
  } catch (error: any) {
    console.error("Resend Email Service Error:", error);
    return {
      success: false,
      error: error.message || "Gagal menghubungi layanan Resend Email",
    };
  }
}

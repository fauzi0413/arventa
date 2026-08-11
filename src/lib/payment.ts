import { getSystemSettings } from "@/lib/settings";

export interface TransactionChargePayload {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
}

/**
 * Midtrans Payment Gateway Service using configured Server Key & Mode from System Settings
 */
export async function createMidtransTransaction(payload: TransactionChargePayload) {
  const settings = await getSystemSettings();
  const serverKey = settings.midtrans_server_key;
  const isSandbox = settings.midtrans_mode === "SANDBOX";

  if (!serverKey) {
    return {
      success: false,
      error: "Midtrans Server Key belum dikonfigurasi di Platform Settings",
      redirectUrl: null,
      snapToken: null,
    };
  }

  const baseUrl = isSandbox
    ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
    : "https://app.midtrans.com/snap/v1/transactions";

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: payload.orderId,
          gross_amount: payload.grossAmount,
        },
        customer_details: {
          first_name: payload.customerName,
          email: payload.customerEmail,
        },
        item_details: payload.itemDetails,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json();
      return {
        success: false,
        error: errJson.error_messages?.join(", ") || `Midtrans Error (${res.status})`,
        redirectUrl: null,
        snapToken: null,
      };
    }

    const data = await res.json();
    return {
      success: true,
      token: data.token,
      redirectUrl: data.redirect_url,
    };
  } catch (error: any) {
    console.error("Midtrans Payment Error:", error);
    return {
      success: false,
      error: error.message || "Gagal menghubungi Midtrans Payment Gateway",
      redirectUrl: null,
      snapToken: null,
    };
  }
}

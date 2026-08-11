import { getSystemSettings } from "@/lib/settings";

export interface AIInsightRequest {
  prompt: string;
  contextData?: any;
}

/**
 * Perform Gemini AI Generation using configured API Key & Model from System Settings
 */
export async function generateAIInsight(req: AIInsightRequest) {
  const settings = await getSystemSettings();
  const apiKey = settings.gemini_api_key;
  const model = settings.gemini_model;

  if (!apiKey) {
    return {
      success: false,
      error: "Gemini API Key belum dikonfigurasi di Platform Settings",
      model,
      insight: null,
    };
  }

  try {
    // If Gemini REST API call is executed:
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${req.prompt}\n\nContext Data:\n${JSON.stringify(req.contextData || {})}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Gemini API Error (${response.status}): ${errText}`,
        model,
        insight: null,
      };
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      success: true,
      model,
      insight: candidateText || "AI Insight berhasil dihasilkan",
    };
  } catch (error: any) {
    console.error("Gemini AI Service Error:", error);
    return {
      success: false,
      error: error.message || "Gagal menghubungi layanan Gemini AI",
      model,
      insight: null,
    };
  }
}

/**
 * Validate Gemini API Key connection
 */
export async function validateGeminiGateway() {
  const settings = await getSystemSettings();
  if (!settings.gemini_api_key) {
    return {
      connected: false,
      message: "API Key Gemini kosong. Tambahkan key di Platform Settings.",
    };
  }

  const result = await generateAIInsight({
    prompt: "Respond with 'OK' if you are online.",
  });

  return {
    connected: result.success,
    message: result.success ? "Gemini AI Connected Successfully" : result.error,
  };
}

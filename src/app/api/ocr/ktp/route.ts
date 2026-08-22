import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getSystemSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body; // Base64 image data string

    if (!image) {
      return ApiResponse.badRequest("Foto KTP (base64) wajib dikirimkan.");
    }

    // Securely retrieve API Key from SystemSettings DB or process.env (GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY)
    const settings = await getSystemSettings();
    const apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const primaryModel = settings.gemini_model || process.env.GEMINI_MODEL || "gemini-3.6-flash";

    // Format base64 image data
    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const parts = image.split(",");
      const match = parts[0].match(/data:(.*);base64/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    // Check if API Key is configured
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured.");
      return ApiResponse.badRequest("Fitur scan KTP belum dapat digunakan karena GEMINI_API_KEY belum terpasang. Silakan isi data formulir secara manual.");
    }

    // Construct Gemini Vision REST API prompt to extract ALL Indonesian KTP fields
    const promptText = `
Kamu adalah pakar OCR KTP Indonesia. 
Analisis foto KTP Indonesia berikut dan ekstrak SEMUA bidang datanya secara lengkap dan akurat.
Kembalikan HANYA format JSON murni dengan struktur persis seperti berikut:
{
  "nik": "16 digit angka NIK tanpa spasi",
  "fullName": "Nama lengkap sesuai KTP",
  "birthPlaceDate": "Tempat, Tanggal Lahir (contoh: Bandung, 15 Mei 1995)",
  "gender": "LAKI-LAKI atau PEREMPUAN",
  "bloodType": "Golongan Darah (A, B, AB, O, atau -)",
  "addressKtp": "Alamat lengkap KTP (Jalan/Dusun)",
  "rtRw": "RT/RW (contoh: 002/005)",
  "kelDesa": "Kelurahan atau Desa",
  "kecamatan": "Kecamatan",
  "religion": "Agama (ISLAM, KRISTEN, KATHOLIK, HINDU, BUDDHA, KHONGHUCU)",
  "maritalStatus": "Status Perkawinan (BELUM KAWIN, KAWIN, CERAI HIDUP, CERAI MATI)",
  "occupation": "Pekerjaan sesuai KTP",
  "nationality": "Kewarganegaraan (WNI atau WNA)",
  "validUntil": "Berlaku Hingga (contoh: SEUMUR HIDUP)"
}
Jika ada bidang yang tidak terbaca, kosongkan nilainya dengan "". Jangan tambahkan teks lain selain JSON.
`;

    // Force gemini-3.6-flash model for fast & accurate Indonesian KTP Vision OCR
    const targetModel = "gemini-3.5-flash";
    const modelsToTry = [targetModel];

    let response: Response | null = null;
    let lastErrorText = "";

    // Fast retry loop for primary model
    for (const modelName of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1500,
                responseMimeType: "application/json",
              },
            }),
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            response = res;
            break;
          } else {
            lastErrorText = await res.text();
            console.warn(`Gemini OCR model '${modelName}' (attempt ${attempt}) returned ${res.status}:`, lastErrorText);
            if (res.status === 404) break;
          }
        } catch (err: any) {
          lastErrorText = err.message || String(err);
          console.warn(`Gemini OCR model '${modelName}' network error (attempt ${attempt}):`, lastErrorText);
        }
      }

      if (response && response.ok) break;
    }

    if (!response || !response.ok) {
      console.warn("Gemini OCR live call failed:", lastErrorText);
      return ApiResponse.error({
        message: "Layanan Gemini AI OCR sedang tidak merespons. Silakan isi data formulir secara manual.",
        status: 502,
      });
    }

    const resJson = await response.json();
    const rawContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean JSON response (strip markdown codeblock wrappers if any)
    let cleanedJson = rawContent
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    // Extract JSON substring if extra preamble or epilogue text exists
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedJson = jsonMatch[0];
    }

    let rawParsed: Record<string, any> = {};
    try {
      rawParsed = JSON.parse(cleanedJson);
    } catch (e) {
      console.warn("Standard JSON.parse failed on Gemini output. Using flexible regex extraction on:", rawContent);
      const extractValue = (keys: string[]) => {
        for (const k of keys) {
          const m = rawContent.match(new RegExp(`"${k}"\\s*:\\s*"([^"\\n\\r}]*)`, "i"));
          if (m && m[1]) {
            const val = m[1].replace(/[,"]+$/, "").trim();
            if (val) return val;
          }
        }
        return "";
      };
      rawParsed = {
        nik: extractValue(["nik", "nik_number", "no_ktp"]),
        fullName: extractValue(["fullName", "nama", "name", "full_name"]),
        birthPlaceDate: extractValue(["birthPlaceDate", "birth_place_date", "tempat_tanggal_lahir", "ttl"]),
        gender: extractValue(["gender", "jenis_kelamin"]),
        bloodType: extractValue(["bloodType", "golongan_darah", "gol_darah"]),
        addressKtp: extractValue(["addressKtp", "address", "alamat"]),
        rtRw: extractValue(["rtRw", "rt_rw"]),
        kelDesa: extractValue(["kelDesa", "kel_desa", "kelurahan"]),
        kecamatan: extractValue(["kecamatan"]),
        religion: extractValue(["religion", "agama"]),
        maritalStatus: extractValue(["maritalStatus", "marital_status", "status_perkawinan"]),
        occupation: extractValue(["occupation", "pekerjaan"]),
        nationality: extractValue(["nationality", "kewarganegaraan"]),
        validUntil: extractValue(["validUntil", "valid_until", "berlaku_hingga"]),
      };
    }

    // Normalization for Live Extracted Data (Does NOT fallback to dummy person "Ahmad Rizky Pratama")
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        if (rawParsed[k] && typeof rawParsed[k] === "string" && rawParsed[k].trim() !== "") {
          return rawParsed[k].trim();
        }
      }
      return "";
    };

    const extractedNik = getVal("nik", "nik_number", "no_ktp").replace(/\D/g, "").substring(0, 16);
    const extractedFullName = getVal("fullName", "nama", "name", "full_name");

    const rawGender = getVal("gender", "jenis_kelamin").toUpperCase();
    const genderVal = rawGender.includes("PEREMPUAN") || rawGender.includes("WANITA") ? "PEREMPUAN" : rawGender.includes("LAKI") ? "LAKI-LAKI" : "LAKI-LAKI";

    const rawBlood = getVal("bloodType", "golongan_darah", "gol_darah").toUpperCase();
    const bloodVal = ["A", "B", "AB", "O"].includes(rawBlood) ? rawBlood : "-";

    const rawReligion = getVal("religion", "agama").toUpperCase();
    const religionVal = rawReligion.includes("ISLAM") ? "ISLAM" : rawReligion.includes("KRISTEN") ? "KRISTEN" : rawReligion.includes("KATHOLIK") || rawReligion.includes("KATOLIK") ? "KATHOLIK" : rawReligion.includes("HINDU") ? "HINDU" : rawReligion.includes("BUDDHA") || rawReligion.includes("BUDHA") ? "BUDDHA" : rawReligion.includes("KHONGHUCU") ? "KHONGHUCU" : "ISLAM";

    const rawMarital = getVal("maritalStatus", "marital_status", "status_perkawinan").toUpperCase();
    const maritalVal = rawMarital.includes("BELUM") ? "BELUM KAWIN" : rawMarital.includes("CERAI MATI") ? "CERAI MATI" : rawMarital.includes("CERAI") ? "CERAI HIDUP" : rawMarital.includes("KAWIN") || rawMarital.includes("MENIKAH") ? "KAWIN" : "BELUM KAWIN";

    const normalizedData = {
      nik: extractedNik,
      fullName: extractedFullName,
      birthPlaceDate: getVal("birthPlaceDate", "birth_place_date", "tempat_tanggal_lahir", "ttl"),
      gender: genderVal,
      bloodType: bloodVal,
      addressKtp: getVal("addressKtp", "address", "alamat"),
      rtRw: getVal("rtRw", "rt_rw"),
      kelDesa: getVal("kelDesa", "kel_desa", "kelurahan"),
      kecamatan: getVal("kecamatan"),
      religion: religionVal,
      maritalStatus: maritalVal,
      occupation: getVal("occupation", "pekerjaan"),
      nationality: getVal("nationality", "kewarganegaraan").toUpperCase() || "WNI",
      validUntil: getVal("validUntil", "valid_until", "berlaku_hingga") || "SEUMUR HIDUP",
    };

    return ApiResponse.success({
      message: "KTP berhasil di-scan secara lengkap via Gemini AI Vision",
      data: normalizedData,
    });
  } catch (error: any) {
    console.error("Gemini OCR Processing Error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan internal saat memproses OCR KTP",
      error,
    });
  }
}

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "arventa_super_secret_jwt_key_2026_vercel_secure_987654321";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh" | "verify" | "reset";
  exp?: number;
  iat?: number;
}

function base64UrlEncode(str: string | Buffer): string {
  return (typeof str === "string" ? Buffer.from(str) : str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Sign JWT token using native Node.js crypto (HMAC-SHA256)
 * Zero external dependencies — 100% compatible with Vercel Deployment!
 */
export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">, expiresInSeconds: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify JWT token signature and expiration
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSignature = base64UrlEncode(
      crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest()
    );

    if (encodedSignature !== expectedSignature) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

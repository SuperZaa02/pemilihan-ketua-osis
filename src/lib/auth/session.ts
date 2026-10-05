import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";

/**
 * Session admin stateless memakai cookie yang ditandatangani HMAC-SHA256.
 * Tidak ada data sensitif di dalam cookie: hanya id, nama, dan role.
 * Secret tidak pernah dikirim ke client.
 */

export const SESSION_COOKIE = "admin_session";

const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 jam

export type SessionPayload = {
  sub: string; // admin id
  name: string;
  role: "super_admin" | "admin";
  exp: number; // unix epoch seconds
};

function sign(data: string): string {
  return createHmac("sha256", serverEnv.SESSION_SECRET)
    .update(data)
    .digest("base64url");
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as SessionPayload;
    if (
      typeof payload.sub !== "string"
      || typeof payload.exp !== "number"
      || payload.exp * 1000 < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(
  payload: Omit<SessionPayload, "exp">,
): Promise<void> {
  const token = encode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Baca session admin yang valid, atau null jika tidak ada/kedaluwarsa. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

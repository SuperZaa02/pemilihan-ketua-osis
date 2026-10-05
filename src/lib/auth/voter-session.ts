import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";

/**
 * Voting session: menandai pemilih yang sudah login melalui daftar kelas
 * di /vote. Payload minimal + signed HMAC (sama seperti session admin),
 * httpOnly — client tidak bisa memanipulasi voterId.
 */

export const VOTER_COOKIE = "voter_session";

// Session pemilih berumur pendek: cukup untuk satu alur voting.
const MAX_AGE_SECONDS = 60 * 30; // 30 menit

export type VoterSessionPayload = {
  vid: string; // voter id
  exp: number;
};

function sign(data: string): string {
  return createHmac("sha256", serverEnv.SESSION_SECRET)
    .update(data)
    .digest("base64url");
}

function encode(payload: VoterSessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): VoterSessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as VoterSessionPayload;
    if (typeof payload.vid !== "string" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createVoterSession(voterId: string): Promise<void> {
  const token = encode({
    vid: voterId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  });

  (await cookies()).set(VOTER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroyVoterSession(): Promise<void> {
  (await cookies()).delete(VOTER_COOKIE);
}

export async function getVoterSession(): Promise<VoterSessionPayload | null> {
  const token = (await cookies()).get(VOTER_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

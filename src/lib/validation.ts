import { z } from "zod";

/**
 * Skema validasi input yang dipakai bersama oleh Server Actions.
 * Semua validasi penting terjadi di server; validasi di client
 * (required, minlength) hanya untuk UX.
 */

export const loginSchema = z.object({
  // Boleh username atau email.
  identifier: z
    .string()
    .trim()
    .min(3, "Username/email minimal 3 karakter")
    .max(255, "Username/email maksimal 255 karakter"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Skala huruf pertama penempatan/kelas agar konsisten di database,
 * contoh: "xi rpl 1" -> "XI RPL 1".
 */
export function normalizePlacement(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

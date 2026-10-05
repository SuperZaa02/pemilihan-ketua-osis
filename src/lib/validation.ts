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

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Password saat ini wajib diisi")
      .max(128),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .max(128, "Password baru maksimal 128 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama dengan password baru.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Nama placement/kelas dinormalisasi agar konsisten di database,
 * contoh: "xi rpl 1" -> "XI RPL 1".
 */
export function normalizePlacement(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

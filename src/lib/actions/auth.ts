"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  getSession,
} from "@/lib/auth/session";
import { changePasswordSchema, loginSchema } from "@/lib/validation";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // 1. Validasi input di server (jangan percaya data dari client).
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const identifier = parsed.data.identifier.toLowerCase();

  // 2. Cari admin berdasarkan username ATAU email (parameterized query).
  const [admin] = await db
    .select({
      id: admins.id,
      name: admins.name,
      role: admins.role,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(
      or(
        eq(admins.username, identifier),
        eq(admins.email, identifier),
      ),
    )
    .limit(1);

  // 3. Verifikasi password (constant-time).
  const valid = admin
    ? verifyPassword(parsed.data.password, admin.passwordHash)
    : false;

  if (!admin || !valid) {
    // Pesan error sengaja generik agar tidak membocorkan akun yang ada.
    return { error: "Username/email atau password salah." };
  }

  // 4. Buat session (cookie httpOnly, signed HMAC).
  await createSession({
    sub: admin.id,
    name: admin.name,
    role: admin.role,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export type ChangePasswordState = {
  error: string | null;
  success: string | null;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) {
    return { error: "Sesi berakhir. Silakan login kembali.", success: null };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
      success: null,
    };
  }

  const [admin] = await db
    .select({ passwordHash: admins.passwordHash })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);

  if (!admin || !verifyPassword(parsed.data.currentPassword, admin.passwordHash)) {
    return { error: "Password saat ini salah.", success: null };
  }

  if (verifyPassword(parsed.data.newPassword, admin.passwordHash)) {
    return {
      error: "Password baru tidak boleh sama dengan password lama.",
      success: null,
    };
  }

  await db
    .update(admins)
    .set({ passwordHash: hashPassword(parsed.data.newPassword) })
    .where(eq(admins.id, session.sub));

  // Refresh session (payload tidak berubah, tapi memastikan state segar).
  await createSession({
    sub: session.sub,
    name: session.name,
    role: session.role,
  });

  revalidatePath("/admin/settings");

  return {
    error: null,
    success: "Password berhasil diubah.",
  };
}

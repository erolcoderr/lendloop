import { cookies } from "next/headers";
import { db } from "./db";

/**
 * Lightweight cookie-based session auth.
 * The session is just the user ID stored in an httpOnly cookie — enough for
 * a capstone prototype. (For production you'd use NextAuth or signed JWTs.)
 *
 * Cookie name: "ll_session"
 */

export const SESSION_COOKIE = "ll_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Set the session cookie (called on successful login/register). */
export async function setSession(userId: string, remember = true) {
  const store = await cookies();
  const cookieOptions: any = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  // If "Remember me" is checked, the cookie lasts 30 days.
  // If unchecked, it's a session cookie (expires when the browser closes).
  if (remember) {
    cookieOptions.maxAge = SESSION_MAX_AGE;
  }
  store.set(SESSION_COOKIE, userId, cookieOptions);
}

/** Clear the session cookie (called on logout). */
export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Get the currently authenticated user (server-side).
 * Returns null if not logged in or the user no longer exists.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session } });
  if (!user) return null;
  // Never expose the password hash to the client.
  const { password: _pw, ...safe } = user;
  return safe;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

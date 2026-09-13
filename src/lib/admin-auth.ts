import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "navii_admin_session";

export function adminSessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256")
    .update(`navii-live:${password}`)
    .digest("hex");
}

export function isValidAdminSession(value?: string) {
  const expected = adminSessionToken();
  if (!expected || !value || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

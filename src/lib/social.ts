import type { Performer } from "@/lib/types";

function stripPrefix(value: string, prefixes: string[]) {
  let next = value.trim();
  for (const prefix of prefixes) {
    if (next.toLowerCase().startsWith(prefix.toLowerCase())) {
      next = next.slice(prefix.length);
    }
  }
  return next.replace(/^\/+|\/+$/g, "").trim();
}

/** Store as bare handle without @. */
export function normalizeInstagramHandle(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const handle = url.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
      return handle || null;
    } catch {
      return null;
    }
  }

  const handle = stripPrefix(raw, [
    "@",
    "instagram.com/",
    "www.instagram.com/",
  ]).replace(/^@/, "");
  return handle || null;
}

export function instagramProfileUrl(handle: string) {
  const clean = handle.replace(/^@/, "");
  return `https://instagram.com/${encodeURIComponent(clean)}`;
}

export function normalizeFacebookUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (!/facebook\.com$/i.test(url.hostname) && !/\.facebook\.com$/i.test(url.hostname)) {
        return raw;
      }
      return url.toString().replace(/\/$/, "");
    } catch {
      return raw;
    }
  }

  const path = stripPrefix(raw, ["facebook.com/", "www.facebook.com/", "@"]);
  if (!path) return null;
  return `https://www.facebook.com/${path}`;
}

export function getSocialLinks(performer: Performer) {
  const ig = normalizeInstagramHandle(performer.instagram_handle);
  const fb = normalizeFacebookUrl(performer.facebook_url);
  return {
    instagramHandle: ig,
    instagramUrl: ig ? instagramProfileUrl(ig) : null,
    facebookUrl: fb,
  };
}

export function hasSocialLinks(performer: Performer) {
  const social = getSocialLinks(performer);
  return Boolean(social.instagramUrl || social.facebookUrl);
}

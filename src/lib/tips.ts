import type { Performer } from "@/lib/types";

export type TipMethods = {
  paypalMeUrl: string | null;
  venmoHandle: string | null;
  cashAppHandle: string | null;
};

function stripPrefix(value: string, prefixes: string[]) {
  let next = value.trim();
  for (const prefix of prefixes) {
    if (next.toLowerCase().startsWith(prefix.toLowerCase())) {
      next = next.slice(prefix.length);
    }
  }
  return next.replace(/^\/+|\/+$/g, "").trim();
}

/** Normalize artist-entered PayPal.Me value to a clean https URL. */
export function normalizePaypalMeLink(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      // Force www.paypal.com/paypalme/… form when possible
      const match = url.pathname.match(/\/paypalme\/([^/?#]+)/i);
      if (match?.[1]) {
        return `https://www.paypal.com/paypalme/${match[1]}`;
      }
      if (/paypal\.me$/i.test(url.hostname) || /paypal\.me\./i.test(url.hostname)) {
        const handle = url.pathname.replace(/^\/+|\/+$/g, "");
        if (handle) return `https://www.paypal.com/paypalme/${handle}`;
      }
      return url.toString().replace(/\/$/, "");
    } catch {
      return raw;
    }
  }

  const handle = stripPrefix(raw, [
    "https://www.paypal.com/paypalme/",
    "http://www.paypal.com/paypalme/",
    "https://paypal.com/paypalme/",
    "https://paypal.me/",
    "http://paypal.me/",
    "paypal.me/",
    "www.paypal.com/paypalme/",
  ]);
  if (!handle) return null;
  return `https://www.paypal.com/paypalme/${handle}`;
}

export function normalizeVenmoHandle(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  const handle = stripPrefix(raw, ["@", "https://venmo.com/", "http://venmo.com/", "venmo.com/"]);
  return handle ? handle.replace(/^@/, "") : null;
}

export function normalizeCashAppHandle(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  let handle = stripPrefix(raw, [
    "https://cash.app/",
    "http://cash.app/",
    "cash.app/",
  ]);
  handle = handle.replace(/^\$/, "");
  return handle ? `$${handle}` : null;
}

export function getTipMethods(performer: Performer): TipMethods {
  return {
    paypalMeUrl: normalizePaypalMeLink(
      performer.paypal_me_link || performer.paypal_link,
    ),
    venmoHandle: normalizeVenmoHandle(performer.venmo_handle),
    cashAppHandle: normalizeCashAppHandle(performer.cash_app_handle),
  };
}

export function hasTipMethods(performer: Performer) {
  const tips = getTipMethods(performer);
  return Boolean(tips.paypalMeUrl || tips.venmoHandle || tips.cashAppHandle);
}

export function paypalMeUrlWithAmount(url: string, amount?: number | string | null) {
  const n = String(amount ?? "").trim();
  const base = url.replace(/\/$/, "");
  if (!n) return base;
  // PayPal.Me supports /amount on the path for mobile + Apple Pay flows
  return `${base}/${n}`;
}

export function venmoUrlWithAmount(handle: string, amount?: number | string | null) {
  const clean = handle.replace(/^@/, "");
  const n = String(amount ?? "").trim();
  const params = new URLSearchParams({ txn: "pay" });
  if (n) params.set("amount", n);
  return `https://venmo.com/${encodeURIComponent(clean)}?${params.toString()}`;
}

export function cashAppUrlWithAmount(
  handle: string,
  amount?: number | string | null,
) {
  const tag = handle.startsWith("$") ? handle : `$${handle}`;
  const n = String(amount ?? "").trim();
  // Keep $cashtag readable for Cash App deep links
  const base = `https://cash.app/${tag}`;
  return n ? `${base}/${n}` : base;
}

export function tipMethodLinks(
  performer: Performer,
  amount?: number | string | null,
) {
  const tips = getTipMethods(performer);
  const links: { id: "paypal" | "venmo" | "cashapp"; label: string; href: string }[] =
    [];

  if (tips.paypalMeUrl) {
    links.push({
      id: "paypal",
      label: "PayPal",
      href: paypalMeUrlWithAmount(tips.paypalMeUrl, amount),
    });
  }
  if (tips.venmoHandle) {
    links.push({
      id: "venmo",
      label: "Venmo",
      href: venmoUrlWithAmount(tips.venmoHandle, amount),
    });
  }
  if (tips.cashAppHandle) {
    links.push({
      id: "cashapp",
      label: "Cash App",
      href: cashAppUrlWithAmount(tips.cashAppHandle, amount),
    });
  }

  return links;
}

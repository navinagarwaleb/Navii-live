export type AdminTabId = "queue" | "live" | "songs" | "sets" | "tips";

const ADMIN_TABS = new Set<AdminTabId>([
  "queue",
  "live",
  "songs",
  "sets",
  "tips",
]);

export function parseAdminTab(value: string | null | undefined): AdminTabId {
  if (value && ADMIN_TABS.has(value as AdminTabId)) {
    return value as AdminTabId;
  }
  return "queue";
}

/** Dashboard URL for a tab (queue is the default, no query). */
export function adminDashboardHref(tab?: string | null): string {
  const next = parseAdminTab(tab);
  return next === "queue" ? "/admin" : `/admin?tab=${next}`;
}

/** Settings URL, optionally remembering which dashboard tab to return to. */
export function adminSettingsHref(options?: {
  from?: string | null;
  hash?: string;
}): string {
  const from = options?.from ? parseAdminTab(options.from) : null;
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  const query = params.toString();
  const hash = options?.hash ? `#${options.hash}` : "";
  return `/admin/settings${query ? `?${query}` : ""}${hash}`;
}

/** Soft, site-fitting palettes for setlist icon badges (dark admin + paper brand). */
export const SETLIST_COLOR_OPTIONS = [
  {
    id: "sand",
    label: "Sand",
    bg: "#F3E9DF",
    fg: "#1E2F4D",
    ring: "#E4C29B",
  },
  {
    id: "gold",
    label: "Gold",
    bg: "#F2B76E",
    fg: "#1C1917",
    ring: "#D9A45A",
  },
  {
    id: "peach",
    label: "Peach",
    bg: "#FFC89B",
    fg: "#1C1917",
    ring: "#E8A87C",
  },
  {
    id: "ivory",
    label: "Ivory",
    bg: "#FFF6EC",
    fg: "#0D1B2E",
    ring: "#E4C29B",
  },
  {
    id: "navy",
    label: "Navy",
    bg: "#1E2F4D",
    fg: "#FFF6EC",
    ring: "#6D87A6",
  },
  {
    id: "mist",
    label: "Mist",
    bg: "#6D87A6",
    fg: "#F7F4F0",
    ring: "#A8BDD4",
  },
  {
    id: "sage",
    label: "Sage",
    bg: "#8FA38A",
    fg: "#1C1917",
    ring: "#B5C5B1",
  },
  {
    id: "rose",
    label: "Rose",
    bg: "#C99B9B",
    fg: "#1C1917",
    ring: "#E0BDBD",
  },
  {
    id: "plum",
    label: "Plum",
    bg: "#6B4F6E",
    fg: "#FFF6EC",
    ring: "#A88BA8",
  },
  {
    id: "clay",
    label: "Clay",
    bg: "#C4A484",
    fg: "#1C1917",
    ring: "#D9BFA0",
  },
] as const;

export type SetlistColorId = (typeof SETLIST_COLOR_OPTIONS)[number]["id"];

export type SetlistColorTheme = (typeof SETLIST_COLOR_OPTIONS)[number];

export const DEFAULT_SETLIST_COLOR: SetlistColorId = "sand";

const COLOR_MAP = Object.fromEntries(
  SETLIST_COLOR_OPTIONS.map((item) => [item.id, item]),
) as Record<SetlistColorId, SetlistColorTheme>;

export function isSetlistColorId(
  value: string | null | undefined,
): value is SetlistColorId {
  return Boolean(value && value in COLOR_MAP);
}

export function normalizeSetlistColor(
  value: string | null | undefined,
): SetlistColorId {
  return isSetlistColorId(value) ? value : DEFAULT_SETLIST_COLOR;
}

export function getSetlistColor(
  value: string | null | undefined,
): SetlistColorTheme {
  return COLOR_MAP[normalizeSetlistColor(value)];
}

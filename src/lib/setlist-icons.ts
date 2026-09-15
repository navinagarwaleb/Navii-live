import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  Church,
  Disc3,
  Flame,
  Guitar,
  Heart,
  Headphones,
  ListMusic,
  MapPin,
  Mic2,
  Moon,
  Music2,
  PartyPopper,
  Piano,
  Radio,
  Sparkles,
  Star,
  Sun,
  Ticket,
  Users,
  Wine,
  Zap,
} from "lucide-react";

/** Curated icon set for live-music setlists (industry-familiar cues). */
export const SETLIST_ICON_OPTIONS = [
  { id: "list-music", label: "Setlist", Icon: ListMusic },
  { id: "music", label: "Music", Icon: Music2 },
  { id: "mic", label: "Vocals", Icon: Mic2 },
  { id: "guitar", label: "Guitar", Icon: Guitar },
  { id: "piano", label: "Piano", Icon: Piano },
  { id: "headphones", label: "Studio", Icon: Headphones },
  { id: "radio", label: "Broadcast", Icon: Radio },
  { id: "disc", label: "Album", Icon: Disc3 },
  { id: "calendar", label: "Event", Icon: CalendarDays },
  { id: "map-pin", label: "Venue", Icon: MapPin },
  { id: "ticket", label: "Show", Icon: Ticket },
  { id: "users", label: "Crowd", Icon: Users },
  { id: "heart", label: "Wedding", Icon: Heart },
  { id: "church", label: "Ceremony", Icon: Church },
  { id: "building", label: "Corporate", Icon: Building2 },
  { id: "wine", label: "Lounge", Icon: Wine },
  { id: "party", label: "Party", Icon: PartyPopper },
  { id: "sparkles", label: "Special", Icon: Sparkles },
  { id: "star", label: "Featured", Icon: Star },
  { id: "flame", label: "High energy", Icon: Flame },
  { id: "zap", label: "Opener", Icon: Zap },
  { id: "moon", label: "Late night", Icon: Moon },
  { id: "sun", label: "Daytime", Icon: Sun },
] as const;

export type SetlistIconId = (typeof SETLIST_ICON_OPTIONS)[number]["id"];

export const DEFAULT_SETLIST_ICON: SetlistIconId = "list-music";

const ICON_MAP = Object.fromEntries(
  SETLIST_ICON_OPTIONS.map((item) => [item.id, item.Icon]),
) as Record<SetlistIconId, LucideIcon>;

export function isSetlistIconId(value: string | null | undefined): value is SetlistIconId {
  return Boolean(value && value in ICON_MAP);
}

export function normalizeSetlistIcon(
  value: string | null | undefined,
): SetlistIconId {
  return isSetlistIconId(value) ? value : DEFAULT_SETLIST_ICON;
}

export function getSetlistIcon(value: string | null | undefined): LucideIcon {
  return ICON_MAP[normalizeSetlistIcon(value)];
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ChevronRight,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SETLIST_COLOR,
  SETLIST_COLOR_OPTIONS,
  getSetlistColor,
  normalizeSetlistColor,
  type SetlistColorId,
} from "@/lib/setlist-colors";
import {
  DEFAULT_SETLIST_ICON,
  SETLIST_ICON_OPTIONS,
  getSetlistIcon,
  normalizeSetlistIcon,
  type SetlistIconId,
} from "@/lib/setlist-icons";
import { useEphemeralMessage } from "@/hooks/use-ephemeral-message";
import { adminPrimaryChipClass } from "@/lib/admin-ui";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Performer, Setlist, SetlistSong, Song } from "@/lib/types";
import { cn } from "@/lib/utils";

const SONG_SELECT = "id,title,artist,active,tags,artwork_url,performer_id,created_at";
const SETLIST_SELECT = "id,performer_id,name,icon,icon_color,position,created_at,updated_at";

const SETLIST_APPEARANCE_COLUMN_HINT =
  /icon|icon_color|column .* does not exist|Could not find/i;

function appearanceColumnError(message: string | undefined) {
  if (!SETLIST_APPEARANCE_COLUMN_HINT.test(message ?? "")) return message ?? "";
  return "Setlist icon/color columns are missing. Run migrations 20260914_setlists_icon.sql and 20260914_setlists_icon_color.sql, then try again.";
}

function SetlistIconBadge({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const theme = getSetlistColor(color);
  const Icon = getSetlistIcon(icon);
  const box =
    size === "lg" ? "size-12 rounded-2xl" : size === "sm" ? "size-10 rounded-xl" : "size-11 rounded-md";
  const iconSize = size === "lg" ? 22 : size === "sm" ? 18 : 16;

  return (
    <span
      className={cn("grid shrink-0 place-items-center", box, className)}
      style={{ backgroundColor: theme.bg, color: theme.fg }}
    >
      <Icon size={iconSize} />
    </span>
  );
}

type SetlistRow = Setlist & { song_count: number };

type SetlistSongJoinRow = {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  created_at?: string;
  song?: Song | Song[] | null;
};

function normalizeSetlistSong(row: SetlistSongJoinRow): SetlistSong {
  const song = Array.isArray(row.song) ? (row.song[0] ?? null) : (row.song ?? null);
  return {
    id: row.id,
    setlist_id: row.setlist_id,
    song_id: row.song_id,
    position: row.position,
    created_at: row.created_at,
    song,
  };
}

function SetlistIconPicker({
  value,
  color,
  onChange,
  className,
}: {
  value: SetlistIconId;
  color: SetlistColorId;
  onChange: (next: SetlistIconId) => void;
  className?: string;
}) {
  const theme = getSetlistColor(color);
  return (
    <div className={cn("grid grid-cols-6 gap-1.5 sm:grid-cols-8", className)}>
      {SETLIST_ICON_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "grid aspect-square place-items-center rounded-xl border transition",
              selected ? "shadow-sm" : "opacity-80 hover:opacity-100",
            )}
            style={{
              backgroundColor: theme.bg,
              color: theme.fg,
              borderColor: selected ? theme.ring : "transparent",
              boxShadow: selected ? `0 0 0 1px ${theme.ring}` : undefined,
            }}
          >
            <option.Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}

function SetlistColorPicker({
  value,
  onChange,
  className,
}: {
  value: SetlistColorId;
  onChange: (next: SetlistColorId) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-5 gap-1.5 sm:grid-cols-10", className)}>
      {SETLIST_COLOR_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "aspect-square rounded-full border transition",
              selected ? "scale-105 shadow-sm" : "hover:scale-105",
            )}
            style={{
              backgroundColor: option.bg,
              borderColor: selected ? option.ring : "rgba(255,255,255,0.12)",
              boxShadow: selected
                ? `0 0 0 2px ${option.ring}, inset 0 0 0 1px rgba(0,0,0,0.08)`
                : "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          />
        );
      })}
    </div>
  );
}

function SortableSetlistRow({
  setlist,
  index,
  onOpen,
}: {
  setlist: SetlistRow;
  index: number;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setlist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 bg-[#292524] px-2.5 py-1.5",
        index > 0 && "border-t border-white/5",
        isDragging && "z-20 rounded-xl border border-white/20 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${setlist.name}`}
        className="grid size-9 shrink-0 touch-none place-items-center rounded-full text-[#78716C] transition hover:bg-white/10 hover:text-[#FAFAF9]"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-90"
      >
        <SetlistIconBadge icon={setlist.icon} color={setlist.icon_color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
            {setlist.name}
          </span>
          <span className="block truncate text-xs leading-snug text-[#A8A29E]">
            {setlist.song_count} song
            {setlist.song_count === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronRight size={15} className="shrink-0 text-[#78716C]" />
      </button>
    </div>
  );
}

function SortableSetlistSongRow({
  entry,
  index,
  removing,
  onRemove,
}: {
  entry: SetlistSong;
  index: number;
  removing: boolean;
  onRemove: () => void;
}) {
  const song = entry.song;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 bg-[#292524] px-2.5 py-1.5",
        index > 0 && "border-t border-white/5",
        isDragging && "z-20 rounded-xl border border-white/20 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${song?.title ?? "song"}`}
        className="grid size-9 shrink-0 touch-none place-items-center rounded-full text-[#78716C] transition hover:bg-white/10 hover:text-[#FAFAF9]"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      {song?.artwork_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.artwork_url}
          alt=""
          width={44}
          height={44}
          className={cn(
            "size-11 shrink-0 rounded-md object-cover",
            !(song.active ?? true) && "opacity-45 grayscale",
          )}
        />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[#A8A29E]">
          <Search size={14} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
          {song?.title ?? "Unknown song"}
        </p>
        <p className="truncate text-xs leading-snug text-[#A8A29E]">
          {song?.artist ?? "—"}
          {song && !(song.active ?? true) ? " · hidden from requests" : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Remove ${song?.title ?? "song"} from setlist`}
        disabled={removing}
        onClick={onRemove}
        className="grid size-9 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-red-200"
      >
        {removing ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
      </button>
    </div>
  );
}

export function AdminSetlists({ performer }: { performer: Performer }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [setlists, setSetlists] = useState<SetlistRow[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useEphemeralMessage();
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [entries, setEntries] = useState<SetlistSong[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<SetlistIconId>(DEFAULT_SETLIST_ICON);
  const [newColor, setNewColor] = useState<SetlistColorId>(DEFAULT_SETLIST_COLOR);
  const [savingCreate, setSavingCreate] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [pickingIcon, setPickingIcon] = useState(false);
  const [draftIcon, setDraftIcon] = useState<SetlistIconId>(DEFAULT_SETLIST_ICON);
  const [draftColor, setDraftColor] = useState<SetlistColorId>(DEFAULT_SETLIST_COLOR);
  const [savingIcon, setSavingIcon] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [addingSongId, setAddingSongId] = useState<string | null>(null);
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null);
  const [deletingSetlist, setDeletingSetlist] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingSetlistOrder, setSavingSetlistOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeSetlist = useMemo(
    () => setlists.find((item) => item.id === activeSetlistId) ?? null,
    [activeSetlistId, setlists],
  );

  const memberSongIds = useMemo(
    () => new Set(entries.map((entry) => entry.song_id)),
    [entries],
  );

  const availableSongs = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    return songs
      .filter((song) => !memberSongIds.has(song.id))
      .filter((song) => {
        if (!query) return true;
        return (
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  }, [memberSongIds, pickerQuery, songs]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    void (async () => {
      const [setlistsResult, songsResult] = await Promise.all([
        supabase
          .from("setlists")
          .select(SETLIST_SELECT)
          .eq("performer_id", performer.id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("songs")
          .select(SONG_SELECT)
          .eq("performer_id", performer.id)
          .order("title", { ascending: true }),
      ]);

      if (setlistsResult.error) {
        setError(
          /position|column .* does not exist|Could not find/i.test(
            setlistsResult.error.message ?? "",
          )
            ? "Setlist position column is missing. Run migration 20260914_setlists_position.sql, then reload."
            : /relation .*setlists.* does not exist|Could not find/i.test(
                  setlistsResult.error.message ?? "",
                )
              ? "Setlists table is missing. Run migration 20260914_setlists.sql, then reload."
              : setlistsResult.error.message,
        );
        setLoading(false);
        return;
      }

      if (songsResult.error) {
        setError(songsResult.error.message);
        setLoading(false);
        return;
      }

      const base = (setlistsResult.data as Setlist[]) ?? [];
      const counts = await loadSongCounts(
        supabase,
        base.map((item) => item.id),
      );

      setSetlists(
        base.map((item) => ({
          ...item,
          song_count: counts.get(item.id) ?? 0,
        })),
      );
      setSongs((songsResult.data as Song[]) ?? []);
      setLoading(false);
    })();
  }, [performer.id, supabase]);

  async function openSetlist(setlist: SetlistRow) {
    if (!supabase) return;
    setActiveSetlistId(setlist.id);
    setRenameValue(setlist.name);
    setRenaming(false);
    setPickingIcon(false);
    setPickerOpen(false);
    setPickerQuery("");
    setConfirmDelete(false);
    setLoadingEntries(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("setlist_songs")
      .select(
        `id,setlist_id,song_id,position,created_at,song:songs(${SONG_SELECT})`,
      )
      .eq("setlist_id", setlist.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setEntries([]);
    } else {
      setEntries(((data as SetlistSongJoinRow[]) ?? []).map(normalizeSetlistSong));
    }
    setLoadingEntries(false);
  }

  async function createSetlist(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const name = newName.trim();
    if (!name) return;

    setSavingCreate(true);
    setError("");
    setMessage("");

    const nextPosition = 0;

    const { data, error: insertError } = await supabase
      .from("setlists")
      .insert({
        performer_id: performer.id,
        name,
        icon: newIcon,
        icon_color: newColor,
        position: nextPosition,
      })
      .select(SETLIST_SELECT)
      .single();

    if (insertError) {
      setError(appearanceColumnError(insertError.message) || insertError.message);
      setSavingCreate(false);
      return;
    }

    const created = {
      ...(data as Setlist),
      position: nextPosition,
      song_count: 0,
    };
    const reordered = [
      created,
      ...setlists.map((item, index) => ({
        ...item,
        position: index + 1,
      })),
    ];
    setSetlists(reordered);
    setNewName("");
    setNewIcon(DEFAULT_SETLIST_ICON);
    setNewColor(DEFAULT_SETLIST_COLOR);
    setCreating(false);
    setSavingCreate(false);
    setMessage(`Created “${created.name}”.`);
    await persistSetlistOrder(reordered);
    await openSetlist(created);
  }

  async function saveRename(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !activeSetlist) return;
    const name = renameValue.trim();
    if (!name) return;

    const { data, error: updateError } = await supabase
      .from("setlists")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", activeSetlist.id)
      .eq("performer_id", performer.id)
      .select(SETLIST_SELECT)
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const updated = data as Setlist;
    setSetlists((current) =>
      current.map((item) =>
        item.id === updated.id
          ? { ...item, ...updated, song_count: item.song_count }
          : item,
      ),
    );
    setRenaming(false);
    setMessage("Setlist renamed.");
  }

  function beginAppearanceEdit() {
    if (!activeSetlist) return;
    setDraftIcon(normalizeSetlistIcon(activeSetlist.icon));
    setDraftColor(normalizeSetlistColor(activeSetlist.icon_color));
    setPickingIcon(true);
  }

  function cancelAppearanceEdit() {
    setPickingIcon(false);
    if (!activeSetlist) return;
    setDraftIcon(normalizeSetlistIcon(activeSetlist.icon));
    setDraftColor(normalizeSetlistColor(activeSetlist.icon_color));
  }

  async function applyAppearance() {
    if (!supabase || !activeSetlist) return;

    const nextIcon = draftIcon;
    const nextColor = draftColor;
    const iconChanged = normalizeSetlistIcon(activeSetlist.icon) !== nextIcon;
    const colorChanged =
      normalizeSetlistColor(activeSetlist.icon_color) !== nextColor;

    if (!iconChanged && !colorChanged) {
      setPickingIcon(false);
      return;
    }

    setSavingIcon(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("setlists")
      .update({
        icon: nextIcon,
        icon_color: nextColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeSetlist.id)
      .eq("performer_id", performer.id)
      .select(SETLIST_SELECT)
      .single();

    if (updateError) {
      setError(appearanceColumnError(updateError.message) || updateError.message);
      setSavingIcon(false);
      return;
    }

    const updated = data as Setlist;
    setSetlists((current) =>
      current.map((item) =>
        item.id === updated.id
          ? { ...item, ...updated, song_count: item.song_count }
          : item,
      ),
    );
    setPickingIcon(false);
    setSavingIcon(false);
  }

  async function addSongToSetlist(song: Song) {
    if (!supabase || !activeSetlist) return;
    if (memberSongIds.has(song.id)) return;

    setAddingSongId(song.id);
    setError("");

    const nextPosition =
      entries.reduce((max, entry) => Math.max(max, entry.position), -1) + 1;

    const { data, error: insertError } = await supabase
      .from("setlist_songs")
      .insert({
        setlist_id: activeSetlist.id,
        song_id: song.id,
        position: nextPosition,
      })
      .select(
        `id,setlist_id,song_id,position,created_at,song:songs(${SONG_SELECT})`,
      )
      .single();

    if (insertError) {
      if (/duplicate|unique/i.test(insertError.message)) {
        setError("That song is already in this setlist.");
      } else {
        setError(insertError.message);
      }
      setAddingSongId(null);
      return;
    }

    const entry = normalizeSetlistSong(data as SetlistSongJoinRow);
    setEntries((current) => [...current, entry]);
    setSetlists((current) =>
      current.map((item) =>
        item.id === activeSetlist.id
          ? {
              ...item,
              song_count: item.song_count + 1,
              updated_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    await touchSetlist(activeSetlist.id);
    setAddingSongId(null);
    setMessage(`Added “${song.title}”.`);
  }

  async function removeSongFromSetlist(entry: SetlistSong) {
    if (!supabase || !activeSetlist) return;
    setRemovingEntryId(entry.id);
    setError("");

    const { error: deleteError } = await supabase
      .from("setlist_songs")
      .delete()
      .eq("id", entry.id)
      .eq("setlist_id", activeSetlist.id);

    if (deleteError) {
      setError(deleteError.message);
      setRemovingEntryId(null);
      return;
    }

    setEntries((current) => current.filter((item) => item.id !== entry.id));
    setSetlists((current) =>
      current.map((item) =>
        item.id === activeSetlist.id
          ? {
              ...item,
              song_count: Math.max(0, item.song_count - 1),
              updated_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    await touchSetlist(activeSetlist.id);
    setRemovingEntryId(null);
    setMessage(
      `Removed “${entry.song?.title ?? "song"}” from this setlist.`,
    );
  }

  async function persistEntryOrder(nextEntries: SetlistSong[]) {
    if (!supabase || !activeSetlist) return;
    setSavingOrder(true);
    setError("");

    const updates = nextEntries.map((entry, index) =>
      supabase
        .from("setlist_songs")
        .update({ position: index })
        .eq("id", entry.id)
        .eq("setlist_id", activeSetlist.id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      setSavingOrder(false);
      return;
    }

    await touchSetlist(activeSetlist.id);
    setSavingOrder(false);
  }

  async function persistSetlistOrder(nextSetlists: SetlistRow[]) {
    if (!supabase) return;
    setSavingSetlistOrder(true);
    setError("");

    const updates = nextSetlists.map((setlist, index) =>
      supabase
        .from("setlists")
        .update({ position: index, updated_at: new Date().toISOString() })
        .eq("id", setlist.id)
        .eq("performer_id", performer.id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(
        /position|column .* does not exist|Could not find/i.test(
          failed.error.message ?? "",
        )
          ? "Setlist position column is missing. Run migration 20260914_setlists_position.sql, then try again."
          : failed.error.message,
      );
      setSavingSetlistOrder(false);
      return;
    }

    setSavingSetlistOrder(false);
  }

  async function onEntryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((entry) => entry.id === active.id);
    const newIndex = entries.findIndex((entry) => entry.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(entries, oldIndex, newIndex).map(
      (entry, index) => ({ ...entry, position: index }),
    );
    setEntries(reordered);
    await persistEntryOrder(reordered);
  }

  async function onSetlistDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = setlists.findIndex((item) => item.id === active.id);
    const newIndex = setlists.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(setlists, oldIndex, newIndex).map(
      (item, index) => ({ ...item, position: index }),
    );
    setSetlists(reordered);
    await persistSetlistOrder(reordered);
  }

  async function deleteSetlist() {
    if (!supabase || !activeSetlist) return;
    setDeletingSetlist(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("setlists")
      .delete()
      .eq("id", activeSetlist.id)
      .eq("performer_id", performer.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingSetlist(false);
      return;
    }

    const name = activeSetlist.name;
    setSetlists((current) =>
      current.filter((item) => item.id !== activeSetlist.id),
    );
    setActiveSetlistId(null);
    setEntries([]);
    setConfirmDelete(false);
    setDeletingSetlist(false);
    setMessage(`Deleted “${name}”.`);
  }

  async function touchSetlist(setlistId: string) {
    if (!supabase) return;
    await supabase
      .from("setlists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", setlistId)
      .eq("performer_id", performer.id);
  }

  const createModal =
    portalReady && creating
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-setlist-title"
            onClick={() => {
              if (!savingCreate) setCreating(false);
            }}
          >
            <form
              onSubmit={(event) => void createSetlist(event)}
              className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1C1917] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    id="create-setlist-title"
                    className="font-serif text-lg font-semibold text-[#FAFAF9]"
                  >
                    New setlist
                  </p>
                  <p className="mt-1 text-sm text-[#A8A29E]">
                    Name tonight’s set, a private party, or a venue night.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={savingCreate}
                  onClick={() => setCreating(false)}
                  className="grid size-9 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
                >
                  <X size={16} />
                </button>
              </div>
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Friday at The Oak"
                className="mt-4 border-white/15 bg-[#292524] text-[#FAFAF9]"
                autoFocus
                maxLength={60}
                required
              />
              <p className="mt-3 mb-1.5 text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                Color
              </p>
              <SetlistColorPicker value={newColor} onChange={setNewColor} />
              <p className="mt-3 mb-1.5 text-xs font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                Icon
              </p>
              <SetlistIconPicker
                value={newIcon}
                color={newColor}
                onChange={setNewIcon}
              />
              <button
                type="submit"
                disabled={savingCreate || !newName.trim()}
                className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#FAFAF9] text-sm font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
              >
                {savingCreate ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Create setlist
              </button>
            </form>
          </div>,
          document.body,
        )
      : null;

  const pickerModal =
    portalReady && pickerOpen && activeSetlist
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-songs-title"
            onClick={() => setPickerOpen(false)}
          >
            <div
              className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#1C1917] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pt-5 pb-4">
                <div className="min-w-0">
                  <p
                    id="add-songs-title"
                    className="font-serif text-lg font-semibold text-[#FAFAF9]"
                  >
                    Add from your list
                  </p>
                  <p className="mt-1 text-sm text-[#A8A29E]">
                    Every song in your list is available here, including hidden
                    ones. Songs already in this setlist are omitted.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setPickerOpen(false)}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative border-b border-white/10 px-4 py-3">
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 text-[#A8A29E]"
                />
                <Input
                  value={pickerQuery}
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder="Search your songs…"
                  className="border-white/15 bg-[#292524] pl-10 text-[#FAFAF9]"
                  autoFocus
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {songs.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-[#A8A29E]">
                    Add songs on the Songs tab first, then build setlists here.
                  </p>
                ) : availableSongs.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-[#A8A29E]">
                    {pickerQuery.trim()
                      ? "No matching songs left to add."
                      : "Every song from your list is already in this setlist."}
                  </p>
                ) : (
                  availableSongs.map((song) => (
                    <button
                      key={song.id}
                      type="button"
                      disabled={addingSongId === song.id}
                      onClick={() => void addSongToSetlist(song)}
                      className="flex w-full items-center gap-3 px-2.5 py-1.5 text-left transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {song.artwork_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={song.artwork_url}
                          alt=""
                          width={44}
                          height={44}
                          className={cn(
                            "size-11 shrink-0 rounded-md object-cover",
                            !(song.active ?? true) && "opacity-50 grayscale",
                          )}
                        />
                      ) : (
                        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[#A8A29E]">
                          <Search size={14} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold leading-snug text-[#FAFAF9]">
                          {song.title}
                        </span>
                        <span className="block truncate text-xs leading-snug text-[#A8A29E]">
                          {song.artist}
                          {!(song.active ?? true) ? " · hidden" : ""}
                        </span>
                      </span>
                      {addingSongId === song.id ? (
                        <Loader2
                          size={14}
                          className="shrink-0 animate-spin text-[#A8A29E]"
                        />
                      ) : (
                        <Plus size={14} className="shrink-0 text-[#FAFAF9]" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-[#A8A29E]">
        <Loader2 size={16} className="animate-spin" />
        Loading setlists…
      </div>
    );
  }

  if (activeSetlist) {
    return (
      <div className="grid gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSetlistId(null);
              setEntries([]);
              setConfirmDelete(false);
              setRenaming(false);
              setPickingIcon(false);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
          >
            <ArrowLeft size={14} />
            All setlists
          </button>
        </div>

        {renaming ? (
          <form
            onSubmit={(event) => void saveRename(event)}
            className="flex items-center gap-2"
          >
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              className="h-9 border-white/15 bg-[#292524] text-sm text-[#FAFAF9]"
              maxLength={60}
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setRenaming(false);
                setRenameValue(activeSetlist.name);
              }}
              className="h-9 shrink-0 rounded-full border border-white/15 px-3 text-xs font-semibold text-[#FAFAF9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 shrink-0 rounded-full bg-[#FAFAF9] px-3 text-xs font-bold text-[#1C1917]"
            >
              Save
            </button>
          </form>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Change setlist icon and color"
                aria-expanded={pickingIcon}
                disabled={savingIcon}
                onClick={() => {
                  if (pickingIcon) {
                    cancelAppearanceEdit();
                  } else {
                    beginAppearanceEdit();
                  }
                }}
                className="shrink-0 rounded-xl transition hover:opacity-90 disabled:opacity-50"
              >
                <SetlistIconBadge
                  icon={pickingIcon ? draftIcon : activeSetlist.icon}
                  color={pickingIcon ? draftColor : activeSetlist.icon_color}
                  size="sm"
                />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-serif text-lg font-semibold leading-tight text-[#FAFAF9]">
                  {activeSetlist.name}
                </h2>
                <p className="truncate text-[11px] text-[#A8A29E]">
                  {entries.length} song{entries.length === 1 ? "" : "s"}
                  {savingOrder ? " · saving…" : " · drag to reorder"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Rename setlist"
                onClick={() => setRenaming(true)}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-[#A8A29E] transition hover:bg-white/10 hover:text-[#FAFAF9]"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label="Delete setlist"
                onClick={() => setConfirmDelete(true)}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-red-400/30 text-red-200 transition hover:bg-red-500/15"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPickerQuery("");
                setPickerOpen(true);
              }}
              className="flex h-10 w-full items-center gap-2.5 rounded-full border border-white/15 bg-[#292524] px-3.5 text-left transition hover:border-white/25 hover:bg-[#2f2a27]"
            >
              <Search size={15} className="shrink-0 text-[#A8A29E]" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold leading-none text-[#A8A29E]">
                Add songs from your list…
              </span>
              <Plus size={14} className="shrink-0 text-[#78716C]" />
            </button>
            {pickingIcon ? (
              <div className="rounded-xl border border-white/10 bg-[#292524] p-2.5">
                <p className="mb-2 text-[11px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  Color
                </p>
                <SetlistColorPicker value={draftColor} onChange={setDraftColor} />
                <p className="mt-3 mb-2 text-[11px] font-bold tracking-[0.12em] text-[#A8A29E] uppercase">
                  Icon
                </p>
                <SetlistIconPicker
                  value={draftIcon}
                  color={draftColor}
                  onChange={setDraftIcon}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={savingIcon}
                    onClick={cancelAppearanceEdit}
                    className="h-9 flex-1 rounded-full border border-white/15 text-xs font-semibold text-[#FAFAF9] transition hover:bg-white/5 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingIcon}
                    onClick={() => void applyAppearance()}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FAFAF9] text-xs font-bold text-[#1C1917] transition hover:bg-white disabled:opacity-40"
                  >
                    {savingIcon ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {confirmDelete ? (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5">
            <p className="text-xs text-red-100">
              Delete “{activeSetlist.name}”? Songs stay in your list.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={deletingSetlist}
                onClick={() => setConfirmDelete(false)}
                className="h-8 flex-1 rounded-full border border-white/15 text-xs font-semibold text-[#FAFAF9]"
              >
                Keep
              </button>
              <button
                type="button"
                disabled={deletingSetlist}
                onClick={() => void deleteSetlist()}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500/90 text-xs font-bold text-[#FAFAF9]"
              >
                {deletingSetlist ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
            {message}
          </p>
        ) : null}

        {loadingEntries ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[#A8A29E]">
            <Loader2 size={16} className="animate-spin" />
            Loading songs…
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-[#A8A29E]">
            Empty setlist. Add songs from your list to get ready for the gig.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => void onEntryDragEnd(event)}
          >
            <SortableContext
              items={entries.map((entry) => entry.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#292524]">
                {entries.map((entry, index) => (
                  <SortableSetlistSongRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    removing={removingEntryId === entry.id}
                    onRemove={() => void removeSongFromSetlist(entry)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {createModal}
        {pickerModal}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#FAFAF9]">
            Setlists
          </h2>
          <p className="mt-0.5 text-sm text-[#A8A29E]">
            Create setlists for each gig from your song list. Drag to reorder
            {savingSetlistOrder ? " · saving…" : ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewName("");
            setNewIcon(DEFAULT_SETLIST_ICON);
            setNewColor(DEFAULT_SETLIST_COLOR);
            setCreating(true);
          }}
          className={adminPrimaryChipClass()}
        >
          <Plus size={14} />
          New setlist
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
          {message}
        </p>
      ) : null}

      {setlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center">
          <SetlistIconBadge
            icon={DEFAULT_SETLIST_ICON}
            color={DEFAULT_SETLIST_COLOR}
            size="lg"
            className="mx-auto"
          />
          <p className="mt-4 font-serif text-lg font-semibold text-[#FAFAF9]">
            No setlists yet
          </p>
          <p className="mt-2 text-sm text-[#A8A29E]">
            Create one for a venue, wedding, or private gig — then pull songs
            from your list.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#292524]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => void onSetlistDragEnd(event)}
          >
            <SortableContext
              items={setlists.map((setlist) => setlist.id)}
              strategy={verticalListSortingStrategy}
            >
              {setlists.map((setlist, index) => (
                <SortableSetlistRow
                  key={setlist.id}
                  setlist={setlist}
                  index={index}
                  onOpen={() => void openSetlist(setlist)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {createModal}
      {pickerModal}
    </div>
  );
}

async function loadSongCounts(
  supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>,
  setlistIds: string[],
) {
  const counts = new Map<string, number>();
  if (setlistIds.length === 0) return counts;

  const { data, error } = await supabase
    .from("setlist_songs")
    .select("setlist_id")
    .in("setlist_id", setlistIds);

  if (error || !data) return counts;

  for (const row of data as { setlist_id: string }[]) {
    counts.set(row.setlist_id, (counts.get(row.setlist_id) ?? 0) + 1);
  }
  return counts;
}

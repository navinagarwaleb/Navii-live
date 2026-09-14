"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  MAX_CUSTOM_TAGS,
  MAX_TAG_CHARS,
  normalizeTags,
} from "@/lib/tags";
import { cn } from "@/lib/utils";

type SongTagEditorProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxChars?: number;
  className?: string;
  inputClassName?: string;
};

export function SongTagEditor({
  tags,
  onChange,
  maxTags = MAX_CUSTOM_TAGS,
  maxChars = MAX_TAG_CHARS,
  className,
  inputClassName,
}: SongTagEditorProps) {
  const [draft, setDraft] = useState("");

  const atLimit = tags.length >= maxTags;

  function commitTag(raw: string) {
    const next = normalizeTags([...tags, raw], maxTags, maxChars);
    onChange(next);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (!atLimit && draft.trim()) commitTag(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  }

  const draftLen = draft.length;

  return (
    <div className={cn("grid gap-2", className)}>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-[#FAFAF9] transition hover:border-red-300/40 hover:bg-red-500/15 hover:text-red-100"
              aria-label={`Remove tag ${tag}`}
            >
              <span className="truncate">{tag}</span>
              <X size={12} className="shrink-0 opacity-70" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#A8A29E]">
          No tags yet. Add up to {maxTags}.
        </p>
      )}

      <div className="relative">
        <Input
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value.slice(0, maxChars))
          }
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim() && !atLimit) commitTag(draft);
          }}
          disabled={atLimit}
          maxLength={maxChars}
          placeholder={
            atLimit ? `Max ${maxTags} tags` : "Type a tag, then Enter"
          }
          className={cn(
            "border-white/15 bg-[#1C1917] pr-14 text-[#FAFAF9]",
            inputClassName,
          )}
          autoComplete="off"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] tabular-nums text-[#78716C]">
          {draftLen}/{maxChars}
        </span>
      </div>

      <p className="text-[11px] text-[#78716C]">
        {tags.length}/{maxTags} tags · up to {maxChars} characters each
      </p>
    </div>
  );
}

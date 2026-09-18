"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyleKit } from "@tiptap/extension-text-style";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  Bold,
  Highlighter,
  Italic,
  RemoveFormatting,
  Smile,
  Underline as UnderlineIcon,
} from "lucide-react";
import { lyricsToEditorHtml } from "@/lib/lyrics";
import { cn } from "@/lib/utils";

const FONT_SIZES = [
  { label: "S", value: "14px" },
  { label: "M", value: "16px" },
  { label: "L", value: "20px" },
  { label: "XL", value: "28px" },
] as const;

const TEXT_COLORS = [
  { label: "White", value: "#FAFAF9" },
  { label: "Gold", value: "#E4C29B" },
  { label: "Red", value: "#F87171" },
  { label: "Green", value: "#4ADE80" },
  { label: "Blue", value: "#60A5FA" },
  { label: "Yellow", value: "#FACC15" },
] as const;

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Gold", value: "#F2B76E" },
  { label: "Yellow", value: "#FDE047" },
  { label: "Pink", value: "#F9A8D4" },
  { label: "Green", value: "#86EFAC" },
  { label: "Blue", value: "#93C5FD" },
] as const;

type LyricsEditorProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-lg text-[#A8A29E] transition",
        active
          ? "bg-[#F3E9DF] text-[#1C1917]"
          : "hover:bg-white/10 hover:text-[#FAFAF9]",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

export function LyricsEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Paste or type lyrics & chords here…",
  className,
}: LyricsEditorProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiWrapRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
      }),
      TextStyleKit.configure({
        fontFamily: false,
        lineHeight: false,
      }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: lyricsToEditorHtml(value),
    editorProps: {
      attributes: {
        class:
          "lyrics-editor-content min-h-[180px] px-3 py-2.5 text-sm leading-relaxed text-[#FAFAF9] outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!emojiOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (
        emojiWrapRef.current &&
        target &&
        !emojiWrapRef.current.contains(target)
      ) {
        setEmojiOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [emojiOpen]);

  function insertText(text: string) {
    if (!editor || disabled) return;
    editor.chain().focus().insertContent(text).run();
  }

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[220px] rounded-xl border border-white/15 bg-white/5",
          className,
        )}
      />
    );
  }

  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";
  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) ?? "";
  const currentHighlight =
    (editor.getAttributes("highlight").color as string | undefined) ?? "";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-[#E4C29B] focus-within:ring-1 focus-within:ring-[#E4C29B]/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 px-1.5 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />

        <div className="flex items-center gap-0.5">
          {FONT_SIZES.map((size) => (
            <ToolbarButton
              key={size.value}
              label={`Font size ${size.label}`}
              active={currentSize === size.value}
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().setFontSize(size.value).run()
              }
            >
              <span className="text-[11px] font-bold leading-none">
                {size.label}
              </span>
            </ToolbarButton>
          ))}
        </div>

        <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />

        <div className="flex items-center gap-1 px-1">
          {TEXT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={`Text ${color.label}`}
              aria-label={`Text color ${color.label}`}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().setColor(color.value).run()}
              className={cn(
                "size-5 rounded-full border transition disabled:opacity-40",
                currentColor === color.value
                  ? "border-[#FAFAF9] ring-1 ring-[#FAFAF9]/50"
                  : "border-white/20 hover:scale-110",
              )}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>

        <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />

        <div className="flex items-center gap-1 px-1">
          <Highlighter size={13} className="mr-0.5 text-[#A8A29E]" />
          {HIGHLIGHT_COLORS.map((color) =>
            color.value ? (
              <button
                key={color.value}
                type="button"
                title={`Highlight ${color.label}`}
                aria-label={`Highlight ${color.label}`}
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .toggleHighlight({ color: color.value })
                    .run()
                }
                className={cn(
                  "size-5 rounded-full border transition disabled:opacity-40",
                  currentHighlight === color.value
                    ? "border-[#FAFAF9] ring-1 ring-[#FAFAF9]/50"
                    : "border-white/20 hover:scale-110",
                )}
                style={{ backgroundColor: color.value }}
              />
            ) : (
              <ToolbarButton
                key="clear-highlight"
                label="Clear highlight"
                disabled={disabled}
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                <span className="text-[10px] font-bold">✕</span>
              </ToolbarButton>
            ),
          )}
        </div>

        <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />

        <div className="relative" ref={emojiWrapRef}>
          <ToolbarButton
            label="Emoji"
            active={emojiOpen}
            disabled={disabled}
            onClick={() => setEmojiOpen((open) => !open)}
          >
            <Smile size={15} />
          </ToolbarButton>
          {emojiOpen ? (
            <div className="absolute top-full left-0 z-30 mt-2 max-w-[min(100vw-2rem,352px)] overflow-hidden rounded-xl border border-white/15 shadow-xl">
              <EmojiPicker
                theme={Theme.DARK}
                width="100%"
                height={360}
                previewConfig={{ showPreview: false }}
                onEmojiClick={(emojiData) => {
                  insertText(emojiData.emoji);
                  setEmojiOpen(false);
                }}
              />
            </div>
          ) : null}
        </div>

        <ToolbarButton
          label="Clear formatting"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <RemoveFormatting size={15} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

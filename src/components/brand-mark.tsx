import Link from "next/link";
import { cn } from "@/lib/utils";

const TAGLINE = "The shortest distance between a fan and a song.";

export function BrandMark({
  href,
  className,
  /** Hide tagline under `sm` so auth pages stay compact on phones. */
  compactMobile = false,
}: {
  href?: string;
  className?: string;
  compactMobile?: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          "block font-serif font-semibold tracking-[-0.01em] text-deep-blue",
          compactMobile
            ? "text-[1.35rem] leading-tight sm:text-[clamp(1.75rem,5vw,2.25rem)] sm:leading-none"
            : "text-[clamp(1.75rem,5vw,2.25rem)]",
        )}
      >
        Song Table
      </span>
      <span
        className={cn(
          "mt-1.5 block text-[0.95rem] leading-[1.4] text-mist",
          compactMobile && "hidden sm:block",
        )}
      >
        {TAGLINE}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("block transition-opacity hover:opacity-70", className)}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export { TAGLINE as BRAND_TAGLINE };

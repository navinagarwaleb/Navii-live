import Link from "next/link";
import { cn } from "@/lib/utils";

const TAGLINE = "The shortest distance between a fan and a song.";

export function BrandMark({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className="block font-serif text-xl font-semibold tracking-[-0.01em] text-deep-blue">
        Song Table
      </span>
      <span className="mt-1 block text-[11px] leading-[1.35] text-mist">
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

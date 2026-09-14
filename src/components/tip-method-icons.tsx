import type { ReactNode, SVGProps } from "react";
import { Beer, Coffee, Guitar } from "lucide-react";
import { cn } from "@/lib/utils";

const amountIcons = {
  5: Coffee,
  10: Beer,
  20: Guitar,
} as const;

export function TipAmountGlyph({
  amount,
  className,
}: {
  amount: 5 | 10 | 20;
  className?: string;
}) {
  const Icon = amountIcons[amount];
  return <Icon size={16} strokeWidth={2} className={className} aria-hidden />;
}

function BrandMark({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

/** CurrentColor brand marks so they inherit navy / mist ink. */
export function PaypalMark(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandMark {...props}>
      <path
        fill="currentColor"
        d="M7.4 20.2 8.3 14.5H6.1c-.4 0-.7-.2-.8-.6L3.6 4.2c-.1-.4.2-.8.6-.8h5.9c2.4 0 4.1.5 5.1 1.6.9 1 1.2 2.4.9 4.1-.5 2.8-2.3 4.3-5.4 4.3H8.7l-.8 5.2c0 .3-.3.6-.6.6H7.4Zm5.2-11.7c-.2 1.3-1.1 1.9-2.7 1.9H8.7l.6-3.8h1.1c1.5 0 2.4.5 2.2 1.9Z"
      />
      <path
        fill="currentColor"
        opacity="0.55"
        d="M18.4 5.4c.9 1 1.2 2.4.9 4.1-.4 2.4-1.8 3.8-4.2 4.2.5-.2.9-.5 1.2-.9 1.1-1.4 1.5-3.3 1.1-5.5-.2-1.1-.7-2-1.4-2.6 1 .2 1.8.7 2.4 1.7Z"
      />
    </BrandMark>
  );
}

export function VenmoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandMark {...props}>
      <path
        fill="currentColor"
        d="M18.2 4.2c.5.8.8 1.7.8 2.7 0 3.4-2.9 7.8-5.3 10.9H8.4L6.2 4.8h5.1l1.2 9.3c1.4-2.3 3.1-5.9 3.1-8.3 0-.7-.1-1.3-.4-1.6h3Z"
      />
    </BrandMark>
  );
}

export function CashAppMark(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandMark {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12.8 3.4c.4-.3.9-.1 1 .4l.3 1.5c1.6.3 2.8 1.2 3.2 2.5.2.5-.2 1-.7 1-.5 0-.8-.3-.9-.6-.3-.7-1.1-1.2-2.3-1.3v2.8c2.2.5 3.6 1.5 3.6 3.4 0 2.1-1.7 3.3-4 3.6l-.3 1.6c-.1.5-.6.7-1 .4-.4-.3-.5-.8-.4-1.2l.3-1.5c-1.7-.3-2.9-1.3-3.3-2.7-.1-.5.2-1 .7-1.1.5 0 .9.3 1 .7.3.8 1.1 1.3 2.4 1.5v-3.1c-2.1-.5-3.4-1.5-3.4-3.3 0-2 1.6-3.2 3.8-3.5l.3-1.5c.1-.5.6-.7 1-.4Zm-.2 5.3v-2.5c-1.1.2-1.7.7-1.7 1.4 0 .7.6 1.1 1.7 1.1Zm2.1 5.5c0-.8-.7-1.2-2.1-1.5v2.8c1.3-.2 2.1-.7 2.1-1.3Z"
        clipRule="evenodd"
      />
    </BrandMark>
  );
}

export function TipMethodIcon({
  id,
  className,
}: {
  id: "paypal" | "venmo" | "cashapp";
  className?: string;
}) {
  const mark =
    id === "paypal" ? (
      <PaypalMark />
    ) : id === "venmo" ? (
      <VenmoMark />
    ) : (
      <CashAppMark />
    );

  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-[#F3E9DF] text-[#1E2F4D]",
        className,
      )}
    >
      {mark}
    </span>
  );
}

export function InstagramMark(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandMark {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </BrandMark>
  );
}

export function FacebookMark(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandMark {...props}>
      <path
        fill="currentColor"
        d="M14.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.6 1.6-1.6H18V4.2C17.5 4.1 16.4 4 15.2 4 12.6 4 10.8 5.6 10.8 8.3v2.3H8v3.2h2.8V22h3.7Z"
      />
    </BrandMark>
  );
}

export function SocialIconButton({
  href,
  label,
  children,
  tone = "light",
}: {
  href: string;
  label: string;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-2xl border transition active:scale-[0.97]",
        tone === "dark"
          ? "border-white/15 bg-[#1C1917] text-[#FAFAF9] hover:border-white/30 hover:bg-[#292524]"
          : "border-border bg-surface text-ink hover:border-line-strong hover:bg-selected",
      )}
    >
      {children}
    </a>
  );
}


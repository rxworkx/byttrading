import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { height: 20, byt: "text-lg", word: "text-lg" },
  md: { height: 26, byt: "text-2xl", word: "text-2xl" },
  lg: { height: 32, byt: "text-3xl", word: "text-3xl" },
};

const MARK_ASPECT = 204 / 83;

export function Logo({
  href = "/",
  size = "md",
  className,
  wordmarkClassName = "text-white",
  wordmark = true,
}: {
  href?: string | null;
  size?: keyof typeof sizes;
  className?: string;
  // Defaults to white for every existing usage, which is always on a dark
  // background. The admin panel has a white main content area, so it passes
  // "text-foreground" instead, which resolves black there and white in its
  // own black sidebar scope.
  wordmarkClassName?: string;
  // The navbar (matching the icon-only nav mark in the reference design)
  // passes false to render just the mark image, no "BYT Trading" text.
  wordmark?: boolean;
}) {
  const height = sizes[size].height;

  const mark = (
    <span className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <Image
        src="/images/brand/byt-logo-mark.png"
        alt="BYT"
        width={Math.round(height * MARK_ASPECT)}
        height={height}
        className="shrink-0"
        priority
      />
      {wordmark ? (
        <span className={cn("inline-flex items-baseline gap-1.5", wordmarkClassName)}>
          <span className={cn(sizes[size].byt)}>BYT</span>
          <span className={cn(sizes[size].word)}>Trading</span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-flex items-center">
      {mark}
    </Link>
  );
}

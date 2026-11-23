import { cn } from "@/lib/utils"

/** Square icon: a chat bubble with a lightning bolt. Only for small spaces, like the browser tab. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--tk-brand)" />
      <path
        d="M9 9.5h14a2.5 2.5 0 0 1 2.5 2.5v7.5A2.5 2.5 0 0 1 23 22h-7.2l-4.6 3.6c-.5.4-1.2 0-1.2-.6V22H9a2.5 2.5 0 0 1-2.5-2.5V12A2.5 2.5 0 0 1 9 9.5Z"
        fill="#fff"
      />
      <path d="M17.2 11.8 12.6 17h3.3l-1.1 3.4 4.6-5.3h-3.3l1.1-3.3Z" fill="var(--tk-brand)" />
    </svg>
  )
}

/** FChat logo: the word FChat with "by paidbyfacu" below. */
export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn("inline-grid select-none justify-items-start leading-none", className)} aria-label="FChat by paidbyfacu">
      <span
        aria-hidden
        className={cn(
          "font-extrabold tracking-[-0.045em]",
          size === "sm" && "text-lg",
          size === "md" && "text-[1.375rem]",
          size === "lg" && "text-[2.25rem]",
        )}
      >
        F<span className="text-brand">Chat</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "font-medium tracking-wide text-muted-foreground",
          size === "lg" ? "mt-1 text-xs" : "mt-0.5 text-[0.625rem]",
        )}
      >
        by paidbyfacu
      </span>
    </span>
  )
}

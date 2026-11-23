// Simple channel icons: lucide does not ship brand logos.

export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
    </svg>
  )
}

/** Small square with the channel icon and its color, for the channel cards. */
export function ChannelBadge({ channel, className }: { channel: "instagram" | "tiktok"; className?: string }) {
  const Icon = channel === "instagram" ? InstagramGlyph : TikTokGlyph
  return (
    <span
      className={
        "grid size-8 shrink-0 place-items-center rounded-sm text-white " +
        (channel === "instagram" ? "bg-[linear-gradient(135deg,#f9a03f,#e1306c_55%,#8a3ab9)]" : "bg-[#111]") +
        (className ? ` ${className}` : "")
      }
    >
      <Icon className="size-4" />
    </span>
  )
}

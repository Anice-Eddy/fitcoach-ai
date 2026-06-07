type UnreadBadgeProps = {
  count: number
}

/** Shared unread-count badge for conversation lists. */
export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null

  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#C8F135] text-[10px] font-bold text-zinc-950">
      {count > 9 ? '9+' : count}
    </span>
  )
}

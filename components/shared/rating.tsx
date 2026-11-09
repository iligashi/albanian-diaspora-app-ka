import { Star } from "lucide-react"

export function Rating({ average, count }: { average: number; count: number }) {
  if (count === 0) return <span className="text-xs text-muted-foreground">New</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium text-foreground">{average.toFixed(1)}</span>({count})
    </span>
  )
}

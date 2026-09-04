import { cn } from "@/lib/utils"

export interface GetSourceHandleClassNameOptions {
  isLive: boolean
  hasEdge: boolean
  isFailed: boolean
  isStepCanceling: boolean
  isRunning: boolean
  isWinning?: boolean
}

export function getSourceHandleClassName({
  isLive,
  hasEdge,
  isFailed,
  isStepCanceling,
  isRunning,
  isWinning = false,
}: GetSourceHandleClassNameOptions): string {
  const isHidden = isLive && !hasEdge
  return cn(
    "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-all duration-300",
    isHidden
      ? "pointer-events-none opacity-0"
      : isFailed
        ? "bg-destructive!"
        : isStepCanceling
          ? "bg-amber-500!"
          : isRunning
            ? "bg-blue-500!"
            : isWinning
              ? "bg-emerald-500!"
              : "bg-border!"
  )
}

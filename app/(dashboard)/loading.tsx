import { Spinner } from "@/components/ui/spinner"

export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-[calc(100svh-2rem)] w-full flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-6 text-primary" />
        <span className="text-xs font-medium text-muted-foreground animate-pulse">
          Loading workspace...
        </span>
      </div>
    </div>
  )
}

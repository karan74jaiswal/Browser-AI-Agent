// A titled, scrollable panel. Each tab renders its content inside one.
export default function Section({
  title,
  icon,
  children,
  footer,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-xs">
          {footer}
        </div>
      )}
    </div>
  )
}

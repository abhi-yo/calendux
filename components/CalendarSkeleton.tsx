export function CalendarSkeleton() {
  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse ml-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        </div>
      </header>
      
      <div className="flex flex-1 h-[calc(100vh-57px)]">
        <div className="flex-1 flex flex-col">
          <div className="flex border-b border-border">
            <div className="w-16 flex-shrink-0 border-r border-border" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 py-3 text-center border-r last:border-r-0 border-border/30">
                <div className="h-3 w-8 bg-muted rounded mx-auto animate-pulse" />
                <div className="h-6 w-6 bg-muted rounded mx-auto mt-1 animate-pulse" />
              </div>
            ))}
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <div className="w-16 flex-shrink-0 border-r border-border">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-14 flex items-start justify-end pr-2 pt-1">
                  <div className="h-3 w-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="border-r last:border-r-0 border-border">
                  {Array.from({ length: 12 }).map((_, j) => (
                    <div key={j} className="h-14 border-b border-border/30" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

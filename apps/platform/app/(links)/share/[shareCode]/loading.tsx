/* Skeleton shown while the shared property is fetched. Mirrors the real
   layout (gallery + content + sticky card) so there's no layout shift, and
   uses calm pulsing surfaces — no flashes of unstyled content. */
export default function Loading() {
  return (
    <div className="share-paper min-h-screen bg-nc-background">
      {/* header placeholder */}
      <div className="sticky top-0 z-50 bg-[rgba(255,255,255,0.8)] backdrop-blur-[18px] border-b border-[rgba(15,23,42,0.07)]">
        <div className="max-w-[1440px] mx-auto px-[var(--gutter)] py-[15px] flex items-center justify-between">
          <div className="h-7 w-[150px] rounded-full bg-surface-sunken animate-pulse" />
          <div className="h-10 w-[140px] rounded-full bg-surface-sunken animate-pulse" />
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-[var(--gutter)] pt-[clamp(20px,3vw,34px)]">
        <div className="h-4 w-[260px] rounded bg-surface-sunken animate-pulse mb-[18px]" />

        {/* gallery skeleton */}
        <div className="grid grid-cols-[1.42fr_1fr] gap-3 h-[clamp(360px,46vw,540px)] mb-[34px] max-[760px]:grid-cols-1 max-[760px]:h-auto">
          <div className="rounded-[20px] bg-surface-sunken animate-pulse max-[760px]:h-[300px]" />
          <div className="grid grid-cols-2 grid-rows-2 gap-3 max-[760px]:hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-[20px] bg-surface-sunken animate-pulse" />
            ))}
          </div>
        </div>

        {/* body skeleton */}
        <div className="grid grid-cols-[1fr_380px] gap-14 pb-[90px] items-start max-[980px]:grid-cols-1">
          <div className="space-y-4">
            <div className="h-10 w-[70%] rounded-lg bg-surface-sunken animate-pulse" />
            <div className="h-5 w-[55%] rounded bg-surface-sunken animate-pulse" />
            <div className="flex gap-3.5 pt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[74px] flex-1 rounded-[16px] bg-surface-sunken animate-pulse" />
              ))}
            </div>
            <div className="h-40 w-full rounded-lg bg-surface-sunken animate-pulse mt-6" />
          </div>
          <div className="h-[320px] rounded-[24px] bg-surface-sunken animate-pulse" />
        </div>
      </main>
    </div>
  );
}

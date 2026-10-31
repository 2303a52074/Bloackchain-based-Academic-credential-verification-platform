import React from 'react';

interface PortalSkeletonLoaderProps {
  variant?: 'student' | 'admin' | 'cards' | 'table';
  count?: number;
}

export const PortalSkeletonLoader: React.FC<PortalSkeletonLoaderProps> = ({
  variant = 'cards',
  count = 2,
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading ledger data"
      className="w-full space-y-6 animate-pulse select-none"
    >
      {/* Student View Skeleton */}
      {variant === 'student' && (
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
            <div className="space-y-2">
              <div className="h-3 w-40 bg-slate-800/70 rounded" />
              <div className="h-8 w-64 bg-slate-800/80 rounded-lg" />
              <div className="h-4 w-72 bg-slate-800/50 rounded" />
            </div>
            <div className="h-8 w-36 bg-slate-800/60 rounded-xl" />
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-5">
            {Array.from({ length: count }).map((_, idx) => (
              <div
                key={idx}
                className="p-6 md:p-8 rounded-2xl bg-[#0b1329]/60 border border-slate-800/70"
              >
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800/60">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 shrink-0" />
                    <div className="space-y-2.5">
                      <div className="h-3 w-32 bg-slate-800/60 rounded" />
                      <div className="h-6 w-56 md:w-80 bg-slate-800/80 rounded" />
                      <div className="h-4 w-44 bg-slate-800/50 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-32 bg-slate-800/60 rounded-lg hidden sm:block" />
                </div>

                {/* Hash Bar Placeholder */}
                <div className="my-4 h-10 w-full bg-slate-950/70 rounded-xl border border-slate-900" />

                {/* Bottom Action Buttons Placeholder */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-28 bg-slate-800/60 rounded-xl" />
                    <div className="h-8 w-28 bg-slate-800/60 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-24 bg-slate-800/60 rounded-xl" />
                    <div className="h-8 w-32 bg-cyan-950/40 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin View Skeleton */}
      {variant === 'admin' && (
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
            <div className="space-y-2">
              <div className="h-3 w-48 bg-slate-800/70 rounded" />
              <div className="h-8 w-72 bg-slate-800/80 rounded-lg" />
              <div className="h-4 w-96 max-w-full bg-slate-800/50 rounded" />
            </div>
            <div className="h-8 w-32 bg-slate-800/60 rounded-xl" />
          </div>

          {/* Grid Layout: Left form skeleton + Right ledger table skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Left Form Skeleton */}
            <div className="lg:col-span-5 p-6 md:p-7 rounded-2xl bg-[#0b1329]/60 border border-slate-800/70 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 w-40 bg-slate-800/80 rounded" />
                <div className="h-4 w-20 bg-slate-800/50 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-slate-800/60 rounded" />
                <div className="h-10 w-full bg-slate-950/70 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-36 bg-slate-800/60 rounded" />
                <div className="h-10 w-full bg-slate-950/70 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-slate-950/70 rounded-xl" />
                <div className="h-10 bg-slate-950/70 rounded-xl" />
              </div>
              <div className="h-10 bg-slate-950/70 rounded-xl" />
              <div className="h-12 w-full bg-cyan-950/50 border border-cyan-500/20 rounded-xl mt-4" />
            </div>

            {/* Right Table / Ledger Skeleton */}
            <div className="lg:col-span-7 p-6 md:p-7 rounded-2xl bg-[#0b1329]/60 border border-slate-800/70 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1.5">
                  <div className="h-5 w-48 bg-slate-800/80 rounded" />
                  <div className="h-3 w-32 bg-slate-800/50 rounded" />
                </div>
                <div className="h-8 w-44 bg-slate-950 rounded-xl" />
              </div>

              {/* Row cards */}
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 bg-slate-800/80 rounded" />
                    <div className="h-4 w-20 bg-slate-800/50 rounded" />
                  </div>
                  <div className="h-3 w-64 bg-slate-800/60 rounded" />
                  <div className="h-3 w-full bg-slate-900 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simple Card Skeletons variant */}
      {variant === 'cards' && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0b1329]/60 border border-slate-800/70 space-y-3"
            >
              <div className="h-4 w-48 bg-slate-800/80 rounded" />
              <div className="h-3 w-full bg-slate-800/50 rounded" />
              <div className="h-3 w-2/3 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 space-y-4 h-[280px]",
        className
      )}
    >
      {/* Rank badge skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-10 rounded-full" />
        <div className="skeleton h-4 w-16" />
      </div>

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-5 w-full" />
        <div className="skeleton h-5 w-3/4" />
      </div>

      {/* Author skeleton */}
      <div className="skeleton h-4 w-24" />

      {/* Story skeleton */}
      <div className="space-y-1.5 flex-1">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2 pt-2">
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

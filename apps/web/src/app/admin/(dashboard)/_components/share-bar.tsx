import { Progress } from "@workspace/ui/components/progress";
import { Skeleton } from "@workspace/ui/components/skeleton";

type ShareBarProps = {
  label: string;
  count: number;
  base: number;
};

export function ShareBar({ label, count, base }: ShareBarProps) {
  const share = base > 0 ? Math.round((count / base) * 100) : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>
          <span className="font-semibold tabular-nums">{count}</span>{" "}
          <span className="text-xs text-muted-foreground">
            {share == null ? "N/A" : `${share}%`}
          </span>
        </span>
      </div>
      <Progress value={share ?? 0} className="h-1.5" />
    </div>
  );
}

type ShareBarSkeletonProps = {
  label: string;
};

export function ShareBarSkeleton({ label }: ShareBarSkeletonProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full" />
    </div>
  );
}

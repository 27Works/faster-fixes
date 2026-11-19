import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

type FigureRowProps = {
  label: string;
  value: string;
  hint?: React.ReactNode;
  tone?: "default" | "destructive";
};

export function FigureRow({
  label,
  value,
  hint,
  tone = "default",
}: FigureRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        <span
          className={cn(
            "font-semibold tabular-nums",
            tone === "destructive" && "text-destructive",
          )}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

type FigureRowSkeletonProps = {
  label: string;
};

export function FigureRowSkeleton({ label }: FigureRowSkeletonProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Skeleton className="h-5 w-12" />
    </div>
  );
}

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";

type FigureUnavailableProps = {
  description: string;
};

export function FigureUnavailable({ description }: FigureUnavailableProps) {
  return (
    <Empty className="items-start p-0 text-left md:p-0">
      <EmptyHeader className="items-start gap-1 text-left">
        <EmptyTitle className="text-sm text-destructive">
          Failed to load statistics
        </EmptyTitle>
        <EmptyDescription className="text-xs">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

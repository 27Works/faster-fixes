import { Card, CardContent } from "@workspace/ui/components/card";

type DashboardPanelProps = {
  title: string;
  children: React.ReactNode;
};

export function DashboardPanel({ title, children }: DashboardPanelProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

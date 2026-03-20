import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/layout/app-sidebar";

type DashboardPageProps = {
  title: string;
  description: string;
  badge: string;
};

const placeholderMetrics = [
  { label: "Queued tasks", value: "12" },
  { label: "Active alerts", value: "03" },
  { label: "Weekly reach", value: "48.2K" },
];

export function DashboardPage({
  title,
  description,
  badge,
}: DashboardPageProps) {
  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <Badge>{badge}</Badge>
                <div className="space-y-3">
                  <h2 className="text-4xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                  <p className="text-base text-muted-foreground">{description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg">Create workflow</Button>
                <Button size="lg" variant="outline">
                  Review data
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {placeholderMetrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-3xl">{metric.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Placeholder Module</span>
                </div>
                <CardTitle>Structure is ready for feature implementation</CardTitle>
                <CardDescription>
                  This page is intentionally scaffolded with shared layout and
                  reusable UI primitives so we can plug in real data flows next.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  Sidebar navigation is shared across all dashboard sections.
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  Section header, metric cards, and action buttons are reusable.
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  Styling is dark-first and controlled by global CSS variables.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested next build</CardTitle>
                <CardDescription>
                  Choose one module to deepen with real workflows and API wiring.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  Instagram queue management
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  Calendar drag-and-drop planning
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  Competitive monitoring feeds
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

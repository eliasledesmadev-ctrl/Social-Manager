"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Filter, Newspaper, RefreshCcw, Rss } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAppLanguage } from "@/components/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { NewsItem, NewsTopic } from "@/lib/rss";
import { cn } from "@/lib/utils";

type TopicFilter = "all" | NewsTopic;

const topicStyles: Record<NewsTopic, string> = {
  tools: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  research: "border-violet-400/20 bg-violet-400/10 text-violet-200",
  business: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
};

const copy = {
  en: {
    badge: "RSS News Feed",
    title: "Consolidate niche news into one readable feed",
    intro: "Aggregate recent RSS items, scan the signal quickly, and filter by tools, research, or business without leaving the dashboard.",
    filterLabel: "Topic filter",
    filterTitle: "Refine the feed",
    filterDescription: "Narrow the consolidated RSS feed to the topic lane you want to monitor.",
    topic: "Topic",
    allTopics: "All topics",
    tools: "Tools",
    research: "Research",
    business: "Business",
    refresh: "Refresh feed",
    totalStories: "Total stories",
    latestFeed: "Latest feed",
    latestTitle: "Recent niche news",
    latestDescription: "Headline, source, publish date, and short summary in a clean dark feed layout.",
    open: "Open",
    noItems: "No feed items match the selected topic.",
    feedBehavior: "Feed behavior",
    howItWorks: "How this consolidator works",
    behaviorDescription: "The UI is built to aggregate live RSS feeds without seeded placeholder stories.",
    note1: "Server-side feed fetching keeps the page ready for real RSS aggregation without browser CORS issues.",
    note2: "Feeds are grouped into topic lanes: tools, research, and business.",
    note3: "If feeds fail, the page now shows an honest empty state instead of seeded stories.",
    testing: "Testing note",
    testingDesc: "Live RSS fetching needs network access when you run the Next.js app locally.",
    testing1: "With internet access, the page should pull current feed items and sort them by publish date.",
    testing2: "Without internet access or if feeds fail, the page should render an empty feed state.",
  },
  es: {
    badge: "Feed RSS",
    title: "Consolida noticias de nicho en un solo feed legible",
    intro: "Agrega items recientes por RSS, revisa la señal rapido y filtra por herramientas, investigacion o negocio sin salir del dashboard.",
    filterLabel: "Filtro por tema",
    filterTitle: "Refinar feed",
    filterDescription: "Acota el feed consolidado al carril tematico que quieras monitorear.",
    topic: "Tema",
    allTopics: "Todos los temas",
    tools: "Herramientas",
    research: "Investigacion",
    business: "Negocio",
    refresh: "Actualizar feed",
    totalStories: "Historias totales",
    latestFeed: "Ultimo feed",
    latestTitle: "Noticias recientes de nicho",
    latestDescription: "Titular, fuente, fecha de publicacion y resumen corto en una vista oscura y limpia.",
    open: "Abrir",
    noItems: "No hay noticias que coincidan con el tema seleccionado.",
    feedBehavior: "Comportamiento del feed",
    howItWorks: "Como funciona este consolidador",
    behaviorDescription: "La interfaz esta preparada para agregar feeds RSS en vivo sin historias sembradas.",
    note1: "La carga server-side deja la pagina lista para RSS real sin problemas de CORS en el navegador.",
    note2: "Los feeds se agrupan en carriles tematicos: herramientas, investigacion y negocio.",
    note3: "Si los feeds fallan, la pagina muestra un estado vacio honesto en lugar de historias de relleno.",
    testing: "Nota de prueba",
    testingDesc: "La carga de RSS en vivo necesita acceso a internet cuando ejecutes la app localmente.",
    testing1: "Con internet, la pagina deberia traer items actuales y ordenarlos por fecha.",
    testing2: "Sin internet o si fallan los feeds, la pagina deberia mostrar un estado vacio.",
  },
} as const;

function formatDate(value: string, language: "en" | "es") {
  return new Intl.DateTimeFormat(language === "es" ? "es-PE" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeTopic(topic: NewsTopic, language: "en" | "es") {
  const labels = {
    en: { tools: "Tools", research: "Research", business: "Business" },
    es: { tools: "Herramientas", research: "Investigacion", business: "Negocio" },
  } as const;
  return labels[language][topic];
}

export function NewsConsolidatorDashboard({ items }: { items: NewsItem[] }) {
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const router = useRouter();
  const { language } = useAppLanguage();
  const text = copy[language];

  const filteredItems = useMemo(() => {
    if (topicFilter === "all") return items;
    return items.filter((item) => item.topic === topicFilter);
  }, [items, topicFilter]);

  const counts = {
    all: items.length,
    tools: items.filter((item) => item.topic === "tools").length,
    research: items.filter((item) => item.topic === "research").length,
    business: items.filter((item) => item.topic === "business").length,
  };

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge>{text.badge}</Badge>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">{text.title}</h1>
                  <p className="text-base text-muted-foreground">{text.intro}</p>
                </div>
              </div>

              <Card className="w-full max-w-xl bg-background/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary"><Filter className="h-4 w-4" /><span className="text-sm font-medium">{text.filterLabel}</span></div>
                  <CardTitle className="text-lg">{text.filterTitle}</CardTitle>
                  <CardDescription>{text.filterDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="topicFilter">{text.topic}</label>
                    <Select id="topicFilter" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value as TopicFilter)}>
                      <option value="all">{text.allTopics}</option>
                      <option value="tools">{text.tools}</option>
                      <option value="research">{text.research}</option>
                      <option value="business">{text.business}</option>
                    </Select>
                  </div>
                  <Button variant="outline" className="md:w-auto" onClick={() => router.refresh()}><RefreshCcw className="h-4 w-4" />{text.refresh}</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardHeader><CardDescription>{text.totalStories}</CardDescription><CardTitle className="text-3xl">{counts.all}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{text.tools}</CardDescription><CardTitle className="text-3xl">{counts.tools}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{text.research}</CardDescription><CardTitle className="text-3xl">{counts.research}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>{text.business}</CardDescription><CardTitle className="text-3xl">{counts.business}</CardTitle></CardHeader></Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary"><Newspaper className="h-4 w-4" /><span className="text-sm font-medium">{text.latestFeed}</span></div>
                <CardTitle>{text.latestTitle}</CardTitle>
                <CardDescription>{text.latestDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", topicStyles[item.topic])}>{formatRelativeTopic(item.topic, language)}</span>
                          <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-xs text-muted-foreground">{item.source}</span>
                          <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-xs text-muted-foreground">{formatDate(item.publishDate, language)}</span>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground">{item.headline}</h3>
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{item.summary}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm"><a href={item.link} target="_blank" rel="noreferrer">{text.open}<ExternalLink className="h-4 w-4" /></a></Button>
                    </div>
                  </article>
                )) : <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{text.noItems}</div>}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader><div className="flex items-center gap-2 text-primary"><Rss className="h-4 w-4" /><span className="text-sm font-medium">{text.feedBehavior}</span></div><CardTitle>{text.howItWorks}</CardTitle><CardDescription>{text.behaviorDescription}</CardDescription></CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.note1}</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.note2}</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.note3}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{text.testing}</CardTitle><CardDescription>{text.testingDesc}</CardDescription></CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.testing1}</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.testing2}</div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
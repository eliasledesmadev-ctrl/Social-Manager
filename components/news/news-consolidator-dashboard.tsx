"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Newspaper,
  Plus,
  RefreshCcw,
  Sliders,
  Tag,
  Trash2,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  builtinFeedSources,
  defaultTopics,
  validateHttpsUrl,
  type NewsItem,
  type NewsTopic,
  type TopicDefinition,
} from "@/lib/rss";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomSource = {
  id: string;
  name: string;
  url: string;
  topic: NewsTopic;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CUSTOM_SOURCES_KEY = "tucuervo.news.customSources";
const HIDDEN_BUILTINS_KEY = "tucuervo.news.hiddenBuiltins";
const TOPICS_KEY = "tucuervo.news.topics";

// ─── Topic color palette ──────────────────────────────────────────────────────

const topicColorPalette: string[] = [
  "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  "border-violet-400/20 bg-violet-400/10 text-violet-200",
  "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  "border-amber-400/20 bg-amber-400/10 text-amber-200",
  "border-rose-400/20 bg-rose-400/10 text-rose-200",
  "border-orange-400/20 bg-orange-400/10 text-orange-200",
  "border-blue-400/20 bg-blue-400/10 text-blue-200",
  "border-pink-400/20 bg-pink-400/10 text-pink-200",
];

function topicStyle(topicId: string, topics: TopicDefinition[]): string {
  const def = topics.find((t) => t.id === topicId);
  return def
    ? (topicColorPalette[def.color % topicColorPalette.length] ?? topicColorPalette[0])
    : "border-slate-400/20 bg-slate-400/10 text-slate-200";
}

function topicLabel(topicId: string, topics: TopicDefinition[]): string {
  return topics.find((t) => t.id === topicId)?.label ?? topicId;
}

/** Converts a display name to a safe lowercase id. */
function nameToId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const copy = {
  en: {
    badge: "RSS News Feed",
    title: "Consolidate niche news into one readable feed",
    intro: "Aggregate recent RSS items, scan the signal quickly, and filter by your custom topic lanes without leaving the dashboard.",
    filterLabel: "Topic filter",
    filterTitle: "Refine the feed",
    filterDescription: "Narrow the consolidated RSS feed to the topic lane you want to monitor.",
    topicSelect: "Topic",
    allTopics: "All topics",
    refresh: "Refresh",
    totalStories: "Total stories",
    latestFeed: "Latest feed",
    latestTitle: "Recent niche news",
    latestDescription: "Headline, source, publish date, and short summary.",
    open: "Open",
    noItems: "No feed items match the selected topic.",
    manageSources: "Manage sources",
    sourcesLabel: "Feed sources",
    sourcesDescription: "Toggle built-in sources and add your own RSS feeds.",
    builtinSources: "Built-in sources",
    customSources: "Custom sources",
    addSource: "Add source",
    sourceName: "Source name",
    feedUrl: "Feed URL (https://)",
    topicFor: "Topic",
    add: "Add",
    cancel: "Cancel",
    noCustomSources: "No custom sources yet.",
    urlInvalid: "URL must start with https://",
    nameRequired: "Name is required",
    fetchError: "Could not load",
    manageTopics: "Manage topics",
    topicsLabel: "Topic categories",
    topicsDescription: "Define the lanes that organize your feed. Topics apply to sources and filters.",
    myTopics: "Your topics",
    addTopic: "Add topic",
    topicName: "Topic name",
    topicExists: "A topic with this name already exists",
    noTopics: "No topics defined.",
    deleteTopicTitle: "Delete topic",
  },
  es: {
    badge: "Feed RSS",
    title: "Consolida noticias de nicho en un solo feed legible",
    intro: "Agrega items recientes por RSS, revisa la señal rapido y filtra por tus carriles tematicos personalizados sin salir del dashboard.",
    filterLabel: "Filtro por tema",
    filterTitle: "Refinar feed",
    filterDescription: "Acota el feed consolidado al carril tematico que quieras monitorear.",
    topicSelect: "Tema",
    allTopics: "Todos los temas",
    refresh: "Actualizar",
    totalStories: "Historias totales",
    latestFeed: "Ultimo feed",
    latestTitle: "Noticias recientes de nicho",
    latestDescription: "Titular, fuente, fecha de publicacion y resumen corto.",
    open: "Abrir",
    noItems: "No hay noticias que coincidan con el tema seleccionado.",
    manageSources: "Gestionar fuentes",
    sourcesLabel: "Fuentes del feed",
    sourcesDescription: "Activa o desactiva fuentes integradas y agrega tus propios feeds RSS.",
    builtinSources: "Fuentes integradas",
    customSources: "Fuentes personalizadas",
    addSource: "Agregar fuente",
    sourceName: "Nombre de la fuente",
    feedUrl: "URL del feed (https://)",
    topicFor: "Tema",
    add: "Agregar",
    cancel: "Cancelar",
    noCustomSources: "Sin fuentes personalizadas.",
    urlInvalid: "La URL debe comenzar con https://",
    nameRequired: "El nombre es requerido",
    fetchError: "No se pudo cargar",
    manageTopics: "Gestionar temas",
    topicsLabel: "Categorias de temas",
    topicsDescription: "Define los carriles que organizan tu feed. Los temas se aplican a fuentes y filtros.",
    myTopics: "Tus temas",
    addTopic: "Agregar tema",
    topicName: "Nombre del tema",
    topicExists: "Ya existe un tema con ese nombre",
    noTopics: "Sin temas definidos.",
    deleteTopicTitle: "Eliminar tema",
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string, language: "en" | "es") {
  return new Intl.DateTimeFormat(language === "es" ? "es-PE" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

async function fetchCustomSource(source: CustomSource): Promise<NewsItem[]> {
  const params = new URLSearchParams({
    url: source.url,
    name: source.name,
    topic: source.topic,
  });
  const res = await fetch(`/api/rss?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: NewsItem[] };
  return data.items ?? [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewsConsolidatorDashboard({ items }: { items: NewsItem[] }) {
  const router = useRouter();
  const { language } = useAppLanguage();
  const text = copy[language];

  // ── Filter
  const [topicFilter, setTopicFilter] = useState("all");

  // ── Topics
  const [topics, setTopics] = useState<TopicDefinition[]>(defaultTopics);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [addTopicName, setAddTopicName] = useState("");
  const [addTopicError, setAddTopicError] = useState("");

  // ── Sources
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [hiddenBuiltins, setHiddenBuiltins] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<NewsItem[]>([]);
  const [loadingIds, setLoadingIds] = useState(new Set<string>());
  const [errorIds, setErrorIds] = useState(new Set<string>());
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", url: "", topic: "" });
  const [addFormError, setAddFormError] = useState("");

  // ── Init: load all from localStorage + fetch custom sources
  useEffect(() => {
    let cancelled = false;

    async function init() {
      let initialSources: CustomSource[] = [];
      let initialHidden: string[] = [];
      let initialTopics: TopicDefinition[] = [];

      try {
        const s = localStorage.getItem(CUSTOM_SOURCES_KEY);
        if (s) initialSources = JSON.parse(s) as CustomSource[];
      } catch { /* ignore */ }

      try {
        const h = localStorage.getItem(HIDDEN_BUILTINS_KEY);
        if (h) initialHidden = JSON.parse(h) as string[];
      } catch { /* ignore */ }

      try {
        const t = localStorage.getItem(TOPICS_KEY);
        if (t) {
          const parsed = JSON.parse(t) as TopicDefinition[];
          if (Array.isArray(parsed) && parsed.length > 0) initialTopics = parsed;
        }
      } catch { /* ignore */ }

      setTopics(initialTopics.length > 0 ? initialTopics : defaultTopics);
      setCustomSources(initialSources);
      setHiddenBuiltins(initialHidden);
      setStorageLoaded(true);

      if (initialSources.length === 0) return;

      setLoadingIds(new Set(initialSources.map((s) => s.id)));

      const results = await Promise.all(
        initialSources.map(async (source) => {
          try {
            const fetched = await fetchCustomSource(source);
            setErrorIds((prev) => { const n = new Set(prev); n.delete(source.id); return n; });
            return fetched;
          } catch {
            setErrorIds((prev) => new Set([...prev, source.id]));
            return [] as NewsItem[];
          } finally {
            setLoadingIds((prev) => { const n = new Set(prev); n.delete(source.id); return n; });
          }
        })
      );

      if (!cancelled) setCustomItems(results.flat());
    }

    void init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist to localStorage
  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  }, [topics, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem(CUSTOM_SOURCES_KEY, JSON.stringify(customSources));
  }, [customSources, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem(HIDDEN_BUILTINS_KEY, JSON.stringify(hiddenBuiltins));
  }, [hiddenBuiltins, storageLoaded]);

  // ── Computed feed
  const visibleBuiltinItems = useMemo(
    () => items.filter((item) => !hiddenBuiltins.includes(item.source)),
    [items, hiddenBuiltins]
  );

  const allItems = useMemo(
    () =>
      [...visibleBuiltinItems, ...customItems].sort(
        (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      ),
    [visibleBuiltinItems, customItems]
  );

  const filteredItems = useMemo(
    () => topicFilter === "all" ? allItems : allItems.filter((i) => i.topic === topicFilter),
    [allItems, topicFilter]
  );

  const topicCounts = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.id, allItems.filter((i) => i.topic === t.id).length])),
    [topics, allItems]
  );

  // ── Topic handlers
  function handleAddTopic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddTopicError("");
    const name = addTopicName.trim();
    if (!name) { setAddTopicError(text.nameRequired); return; }
    const id = nameToId(name);
    if (!id || topics.some((t) => t.id === id)) { setAddTopicError(text.topicExists); return; }
    setTopics((prev) => [...prev, { id, label: name, color: prev.length % topicColorPalette.length }]);
    setAddTopicName("");
    setIsAddTopicOpen(false);
  }

  function deleteTopic(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    if (topicFilter === id) setTopicFilter("all");
  }

  // ── Source handlers
  function toggleBuiltin(sourceName: string) {
    setHiddenBuiltins((prev) =>
      prev.includes(sourceName) ? prev.filter((n) => n !== sourceName) : [...prev, sourceName]
    );
  }

  function removeCustomSource(id: string) {
    const source = customSources.find((s) => s.id === id);
    setCustomSources((prev) => prev.filter((s) => s.id !== id));
    if (source) setCustomItems((prev) => prev.filter((item) => item.source !== source.name));
    setErrorIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleAddSource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddFormError("");
    if (!addForm.name.trim()) { setAddFormError(text.nameRequired); return; }
    if (!validateHttpsUrl(addForm.url.trim())) { setAddFormError(text.urlInvalid); return; }
    const topic = addForm.topic || (topics[0]?.id ?? "noticias");

    const newSource: CustomSource = {
      id: `custom-${Date.now()}`,
      name: addForm.name.trim(),
      url: addForm.url.trim(),
      topic,
    };

    setCustomSources((prev) => [...prev, newSource]);
    setAddForm({ name: "", url: "", topic: "" });
    setIsAddSourceOpen(false);

    setLoadingIds((prev) => new Set([...prev, newSource.id]));
    try {
      const fetched = await fetchCustomSource(newSource);
      setCustomItems((prev) => [...prev, ...fetched]);
      setErrorIds((prev) => { const n = new Set(prev); n.delete(newSource.id); return n; });
    } catch {
      setErrorIds((prev) => new Set([...prev, newSource.id]));
    } finally {
      setLoadingIds((prev) => { const n = new Set(prev); n.delete(newSource.id); return n; });
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 p-4 pb-8 sm:p-6 lg:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">

          {/* ── Header ── */}
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge>{text.badge}</Badge>
                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{text.title}</h1>
                  <p className="text-sm text-muted-foreground">{text.intro}</p>
                </div>
              </div>

              <Card className="w-full max-w-xl bg-background/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Filter className="h-4 w-4" />
                    <span className="text-xs font-medium tracking-wide">{text.filterLabel}</span>
                  </div>
                  <CardTitle className="text-lg">{text.filterTitle}</CardTitle>
                  <CardDescription>{text.filterDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="topicFilter">{text.topicSelect}</label>
                    <Select id="topicFilter" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
                      <option value="all">{text.allTopics}</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </Select>
                  </div>
                  <Button variant="outline" className="md:w-auto" onClick={() => router.refresh()}>
                    <RefreshCcw className="h-4 w-4" />{text.refresh}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Metric cards ── */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>{text.totalStories}</CardDescription>
                <CardTitle className="text-2xl">{allItems.length}</CardTitle>
              </CardHeader>
            </Card>
            {topics.slice(0, 3).map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full border", topicStyle(t.id, topics).split(" ").find((c) => c.startsWith("bg-")))} />
                    <CardDescription>{t.label}</CardDescription>
                  </div>
                  <CardTitle className="text-2xl">{topicCounts[t.id] ?? 0}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          {/* ── Feed + Management ── */}
          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">

            {/* Feed */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Newspaper className="h-4 w-4" />
                  <span className="text-xs font-medium tracking-wide">{text.latestFeed}</span>
                </div>
                <CardTitle>{text.latestTitle}</CardTitle>
                <CardDescription>{text.latestDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", topicStyle(item.topic, topics))}>
                            {topicLabel(item.topic, topics)}
                          </span>
                          <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-xs text-muted-foreground">{item.source}</span>
                          <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-xs text-muted-foreground">{formatDate(item.publishDate, language)}</span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-base font-semibold tracking-tight text-foreground">{item.headline}</h3>
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{item.summary}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {text.open}<ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{text.noItems}</div>
                )}
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="grid gap-4 content-start">

              {/* Sources card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Sliders className="h-4 w-4" />
                    <span className="text-xs font-medium tracking-wide">{text.sourcesLabel}</span>
                  </div>
                  <CardTitle>{text.manageSources}</CardTitle>
                  <CardDescription>{text.sourcesDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Built-in sources */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{text.builtinSources}</p>
                    <div className="space-y-1.5">
                      {builtinFeedSources.map((source) => {
                        const isHidden = hiddenBuiltins.includes(source.name);
                        return (
                          <div key={source.name} className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/40 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", topicStyle(source.topic, topics))}>
                                {topicLabel(source.topic, topics)}
                              </span>
                              <span className={cn("truncate text-sm", isHidden ? "text-muted-foreground/40 line-through" : "text-foreground")}>
                                {source.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleBuiltin(source.name)}
                              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                              aria-label={isHidden ? "Show source" : "Hide source"}
                            >
                              {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom sources */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{text.customSources}</p>
                    {customSources.length > 0 ? (
                      <div className="space-y-1.5">
                        {customSources.map((source) => (
                          <div key={source.id} className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/40 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", topicStyle(source.topic, topics))}>
                                {topicLabel(source.topic, topics)}
                              </span>
                              <span className="truncate text-sm text-foreground">{source.name}</span>
                              {loadingIds.has(source.id) && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
                              {errorIds.has(source.id) && !loadingIds.has(source.id) && (
                                <span className="shrink-0 text-[10px] text-destructive">{text.fetchError}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCustomSource(source.id)}
                              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                              aria-label="Remove source"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">{text.noCustomSources}</p>
                    )}
                  </div>

                  {/* Add source form */}
                  {isAddSourceOpen ? (
                    <form onSubmit={handleAddSource} className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{text.addSource}</p>
                      <Input placeholder={text.sourceName} value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} />
                      <Input placeholder={text.feedUrl} value={addForm.url} onChange={(e) => setAddForm((p) => ({ ...p, url: e.target.value }))} />
                      <Select
                        value={addForm.topic || (topics[0]?.id ?? "")}
                        onChange={(e) => setAddForm((p) => ({ ...p, topic: e.target.value }))}
                      >
                        {topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </Select>
                      {addFormError && <p className="text-xs text-destructive">{addFormError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">{text.add}</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setIsAddSourceOpen(false); setAddFormError(""); setAddForm({ name: "", url: "", topic: "" }); }}>{text.cancel}</Button>
                      </div>
                    </form>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsAddSourceOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />{text.addSource}
                    </Button>
                  )}

                </CardContent>
              </Card>

              {/* Topics card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Tag className="h-4 w-4" />
                    <span className="text-xs font-medium tracking-wide">{text.topicsLabel}</span>
                  </div>
                  <CardTitle>{text.manageTopics}</CardTitle>
                  <CardDescription>{text.topicsDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Topic list */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{text.myTopics}</p>
                    {topics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {topics.map((t) => (
                          <div
                            key={t.id}
                            className={cn("flex items-center gap-1.5 rounded-full border pl-3 pr-2 py-1", topicStyle(t.id, topics))}
                          >
                            <span className="text-xs font-medium">{t.label}</span>
                            <button
                              type="button"
                              onClick={() => deleteTopic(t.id)}
                              className="rounded-full opacity-60 transition-opacity hover:opacity-100"
                              aria-label={`${text.deleteTopicTitle}: ${t.label}`}
                              title={text.deleteTopicTitle}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">{text.noTopics}</p>
                    )}
                  </div>

                  {/* Add topic form */}
                  {isAddTopicOpen ? (
                    <form onSubmit={handleAddTopic} className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{text.addTopic}</p>
                      <Input
                        placeholder={text.topicName}
                        value={addTopicName}
                        onChange={(e) => setAddTopicName(e.target.value)}
                        autoFocus
                      />
                      {addTopicError && <p className="text-xs text-destructive">{addTopicError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">{text.add}</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setIsAddTopicOpen(false); setAddTopicError(""); setAddTopicName(""); }}>{text.cancel}</Button>
                      </div>
                    </form>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsAddTopicOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />{text.addTopic}
                    </Button>
                  )}

                </CardContent>
              </Card>

            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Feather,
  FileText,
  Heart,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import { AccountScopeSelector } from "@/components/instagram/account-scope-selector";
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
import { Textarea } from "@/components/ui/textarea";
import {
  contentPlannerStorageKey,
  plannerStatuses,
  plannerTypes,
  type PlannerItem,
  type PlannerStatus,
  type PlannerType,
} from "@/lib/content-planner";
import type {
  InstagramAccountScope,
  InstagramDashboardData,
  InstagramMediaItem,
} from "@/lib/instagram";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    badge: "TuCuervo Instagram Command Center",
    title: "Plan, present, and monitor your Instagram sources",
    intro:
      "Work with both Instagram accounts from one place. Keep all content merged by default, then switch to each source independently whenever you need to show account-specific performance.",
    connected: "Instagram connected",
    missing: "Connection incomplete",
    sync: "Last sync",
    followers: "Followers",
    published: "Posts loaded",
    avgEngagement: "Avg. engagement",
    scheduled: "Scheduled",
    accountConnected: "Connected source",
    accountMissing: "Not connected",
    recentLoaded: "Posts loaded for the selected account scope",
    averageHelper: "Recent average over current followers",
    plannerHelper: "Shared planner items with the calendar",
    pipeline: "Editorial pipeline",
    addIdea: "Add new idea",
    formDescription: "This form writes into the same planner shared with the calendar, without seeded fake data.",
    idea: "Idea",
    caption: "Caption",
    format: "Format",
    status: "Status",
    date: "Date",
    time: "Time",
    saveIdea: "Save idea",
    latestSection: "Latest posts",
    latestDescription: "Real posts read from your connected Instagram sources.",
    noPosts: "We could not load real posts. Check your Instagram tokens or environment variables.",
    viewInstagram: "View on Instagram",
    topTitle: "Top recent post",
    topDescription: "Simple snapshot for meetings and demos.",
    openTop: "Open top post",
    productionTitle: "Production status",
    productionDescription: "This version is already oriented to personal use and client demos.",
    prod1: "TuCuervo branding applied across the main experience.",
    prod2: "Real Instagram connection through environment variables, without exposing secrets to the browser.",
    prod3: "Shared planner persisted locally and visible in the monthly calendar.",
    likes: "likes",
    comments: "comments",
    sourceScope: "Account scope",
    sourceScopeDescription: "Default view merges both accounts into one brand timeline.",
    allAccountsSummary: "Combined brand view",
    oneAccountSummary: "Single account view",
    sourceTag: "Source",
    connectedAccounts: "Connected accounts",
  },
  es: {
    badge: "TuCuervo Instagram Command Center",
    title: "Planifica, muestra y monitorea tus fuentes de Instagram",
    intro:
      "Trabaja con ambas cuentas de Instagram desde un solo lugar. Por defecto veras todo unido como una sola marca y luego podras cambiar a cada cuenta por separado cuando necesites revisar rendimiento especifico.",
    connected: "Instagram conectado",
    missing: "Falta terminar conexion",
    sync: "Ultima sincronizacion",
    followers: "Seguidores",
    published: "Posts cargados",
    avgEngagement: "Engagement prom.",
    scheduled: "Programadas",
    accountConnected: "Fuente conectada",
    accountMissing: "Sin conectar",
    recentLoaded: "Posts cargados para el alcance de cuenta seleccionado",
    averageHelper: "Promedio reciente sobre seguidores actuales",
    plannerHelper: "Items del planner compartido con el calendario",
    pipeline: "Pipeline editorial",
    addIdea: "Agregar idea nueva",
    formDescription: "Este formulario escribe en el mismo planner compartido con el calendario, sin sembrar datos falsos.",
    idea: "Idea",
    caption: "Caption",
    format: "Formato",
    status: "Estado",
    date: "Fecha",
    time: "Hora",
    saveIdea: "Guardar idea",
    latestSection: "Ultimas publicaciones",
    latestDescription: "Publicaciones reales leidas desde tus fuentes conectadas de Instagram.",
    noPosts: "No pudimos leer publicaciones reales. Revisa las variables de entorno o el token de Instagram.",
    viewInstagram: "Ver en Instagram",
    topTitle: "Mejor publicacion reciente",
    topDescription: "Snapshot simple para reuniones y demos.",
    openTop: "Abrir publicacion top",
    productionTitle: "Estado de produccion",
    productionDescription: "Esta version ya esta pensada para uso personal y demo comercial.",
    prod1: "Branding TuCuervo aplicado en la experiencia principal.",
    prod2: "Conexion real de Instagram via variables de entorno, sin exponer secretos al navegador.",
    prod3: "Planner compartido y persistido localmente, visible en el calendario mensual.",
    likes: "likes",
    comments: "comentarios",
    sourceScope: "Alcance de cuenta",
    sourceScopeDescription: "La vista por defecto une ambas cuentas en una sola linea de marca.",
    allAccountsSummary: "Vista combinada de marca",
    oneAccountSummary: "Vista de una sola cuenta",
    sourceTag: "Fuente",
    connectedAccounts: "Cuentas conectadas",
  },
} as const;

const defaultForm = {
  title: "",
  caption: "",
  type: "Reel" as PlannerType,
  status: "Backlog" as PlannerStatus,
  scheduledDate: "",
  time: "10:00",
};

const statusMeta: Record<PlannerStatus, { icon: typeof Clock3; accent: string; description: { en: string; es: string } }> = {
  Scheduled: {
    icon: Clock3,
    accent: "text-sky-300",
    description: {
      en: "Approved content ready to be published.",
      es: "Contenido aprobado y listo para salir.",
    },
  },
  Draft: {
    icon: FileText,
    accent: "text-amber-300",
    description: {
      en: "Ideas still being refined in copy, visual, or CTA.",
      es: "Ideas en ajuste de copy, visual o CTA.",
    },
  },
  Backlog: {
    icon: Sparkles,
    accent: "text-fuchsia-300",
    description: {
      en: "Reserved ideas for future campaigns.",
      es: "Reserva de ideas para futuras campanas.",
    },
  },
};

const typePillStyles: Record<PlannerType, string> = {
  Reel: "bg-primary/15 text-primary",
  Carousel: "bg-violet-400/10 text-violet-200",
  "Static Post": "bg-slate-200/10 text-slate-200",
  Story: "bg-rose-400/10 text-rose-200",
  Video: "bg-cyan-400/10 text-cyan-200",
  Short: "bg-emerald-400/10 text-emerald-200",
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string, language: "en" | "es") {
  const date = new Date(value);
  const month = new Intl.DateTimeFormat(language === "es" ? "es-PE" : "en-US", {
    month: "short",
    timeZone: "America/Lima",
  }).format(date);
  const day = new Intl.DateTimeFormat(language === "es" ? "es-PE" : "en-US", {
    day: "numeric",
    timeZone: "America/Lima",
  }).format(date);
  return `${day} ${month}`;
}

function formatSyncDate(value: string, language: "en" | "es") {
  return new Intl.DateTimeFormat(language === "es" ? "es-PE" : "en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function readPlannerItems() {
  try {
    const raw = window.localStorage.getItem(contentPlannerStorageKey);
    if (!raw) return [] as PlannerItem[];
    const parsed = JSON.parse(raw) as PlannerItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as PlannerItem[];
  }
}

function PublishedPostCard({ post, language, sourceLabel }: { post: InstagramMediaItem; language: "en" | "es"; sourceLabel: string }) {
  const text = copy[language];

  return (
    <article className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
              {text.published}
            </span>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {post.mediaType}
            </span>
            <span className="rounded-full border border-border/70 bg-slate-950/70 px-2.5 py-1 text-xs text-muted-foreground">
              {text.sourceTag}: {sourceLabel}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {truncate(post.caption || "Instagram post", 92)}
          </h3>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-slate-950/70 px-3 py-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(post.timestamp, language)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1">
          <Heart className="h-3.5 w-3.5" />
          {formatCompactNumber(post.likeCount)} {text.likes}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatCompactNumber(post.commentsCount)} {text.comments}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1">
          <Sparkles className="h-3.5 w-3.5" />
          {post.engagementRate}% ER
        </span>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <a href={post.permalink} rel="noreferrer" target="_blank">
            {text.viewInstagram}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </article>
  );
}

export function InstagramDashboard({ instagram }: { instagram: InstagramDashboardData }) {
  const { language } = useAppLanguage();
  const text = copy[language];
  const [ideas, setIdeas] = useState<PlannerItem[]>([]);
  const [formData, setFormData] = useState(defaultForm);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [accountScope, setAccountScope] = useState<InstagramAccountScope>("all");

  useEffect(() => {
    const parsed = readPlannerItems().filter((item) => item.platform === "Instagram");
    setIdeas(parsed);
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    const otherItems = readPlannerItems().filter((item) => item.platform !== "Instagram");
    window.localStorage.setItem(contentPlannerStorageKey, JSON.stringify([...otherItems, ...ideas]));
  }, [hasLoadedStorage, ideas]);

  const groupedIdeas = useMemo(() => {
    return plannerStatuses.reduce(
      (acc, status) => {
        acc[status] = ideas
          .filter((idea) => idea.status === status)
          .sort((a, b) => `${a.scheduledDate}${a.time}`.localeCompare(`${b.scheduledDate}${b.time}`));
        return acc;
      },
      {} as Record<PlannerStatus, PlannerItem[]>
    );
  }, [ideas]);

  const selectedAccount = useMemo(
    () => instagram.accounts.find((account) => account.key === accountScope),
    [accountScope, instagram.accounts]
  );

  const selectedView = useMemo(() => {
    if (accountScope === "all") {
      return {
        connected: instagram.connected,
        profile: instagram.profile,
        recentMedia: instagram.recentMedia,
        allMedia: instagram.allMedia,
        topPerformer: instagram.topPerformer,
        averageEngagementRate: instagram.averageEngagementRate,
        lastSync: instagram.lastSync,
        error: instagram.error,
        label: text.allAccountsSummary,
      };
    }

    return {
      connected: selectedAccount?.connected ?? false,
      profile: selectedAccount?.profile ?? null,
      recentMedia: selectedAccount?.recentMedia ?? [],
      allMedia: selectedAccount?.allMedia ?? [],
      topPerformer: selectedAccount?.topPerformer ?? null,
      averageEngagementRate: selectedAccount?.averageEngagementRate ?? 0,
      lastSync: selectedAccount?.lastSync ?? instagram.lastSync,
      error: selectedAccount?.error,
      label: selectedAccount?.label ?? text.oneAccountSummary,
    };
  }, [accountScope, instagram, selectedAccount, text.allAccountsSummary, text.oneAccountSummary]);

  const plannerMetrics = [
    {
      label: text.followers,
      value: selectedView.profile ? formatCompactNumber(selectedView.profile.followersCount) : "--",
      helper: selectedView.connected ? text.accountConnected : text.accountMissing,
      icon: Users,
    },
    {
      label: text.published,
      value: `${selectedView.allMedia.length}`,
      helper: text.recentLoaded,
      icon: CheckCircle2,
    },
    {
      label: text.avgEngagement,
      value: `${selectedView.averageEngagementRate}%`,
      helper: text.averageHelper,
      icon: Sparkles,
    },
    {
      label: text.scheduled,
      value: `${groupedIdeas.Scheduled.length}`,
      helper: text.plannerHelper,
      icon: Clock3,
    },
  ];

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.title || !formData.caption || !formData.scheduledDate) return;

    setIdeas((current) => [
      {
        id: `planner-${Date.now()}`,
        title: formData.title,
        caption: formData.caption,
        type: formData.type,
        status: formData.status,
        scheduledDate: formData.scheduledDate,
        time: formData.time,
        platform: "Instagram",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setFormData(defaultForm);
  }

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 p-4 pb-8 sm:p-6 lg:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge>{text.badge}</Badge>
                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{text.title}</h1>
                  <p className="text-sm text-muted-foreground">{text.intro}</p>
                </div>
              </div>

              <div className="w-full space-y-4 rounded-3xl border border-border/80 bg-background/50 p-5 text-sm text-muted-foreground xl:max-w-xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="instagram-scope">
                    {text.sourceScope}
                  </label>
                  <AccountScopeSelector
                    accounts={instagram.accounts}
                    value={accountScope}
                    onChange={setAccountScope}
                    id="instagram-scope"
                  />
                  <p>{text.sourceScopeDescription}</p>
                </div>

                {selectedView.connected && selectedView.profile ? (
                  <div className="space-y-3 border-t border-border/70 pt-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Feather className="h-4 w-4" />
                      <span className="font-medium">{text.connected}</span>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{selectedView.profile.name}</p>
                      <p>{accountScope === "all" ? text.allAccountsSummary : `@${selectedView.profile.username}`}</p>
                    </div>
                    <p suppressHydrationWarning>{text.sync}: {formatSyncDate(selectedView.lastSync, language)}</p>
                    <p>
                      {text.connectedAccounts}: {instagram.accounts.filter((account) => account.connected).map((account) => account.label).join(", ") || "--"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 border-t border-border/70 pt-4">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">{text.missing}</span>
                    </div>
                    <p>{selectedView.error ?? text.noPosts}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plannerMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardDescription>{metric.label}</CardDescription>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                    </div>
                    <CardTitle className="text-2xl">{metric.value}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-xs text-muted-foreground">{metric.helper}</p></CardContent>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary"><Plus className="h-4 w-4" /><span className="text-xs font-medium tracking-wide">{text.pipeline}</span></div>
                <CardTitle>{text.addIdea}</CardTitle>
                <CardDescription>{text.formDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="title">{text.idea}</label>
                    <Input id="title" name="title" placeholder="Promo, testimonial, behind the scenes..." value={formData.title} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="caption">{text.caption}</label>
                    <Textarea id="caption" name="caption" placeholder="Working copy, hook, and CTA." value={formData.caption} onChange={handleChange} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="type">{text.format}</label>
                      <Select id="type" name="type" value={formData.type} onChange={handleChange}>{plannerTypes.map((type) => <option key={type} value={type}>{type}</option>)}</Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="status">{text.status}</label>
                      <Select id="status" name="status" value={formData.status} onChange={handleChange}>{plannerStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="scheduledDate">{text.date}</label>
                      <Input id="scheduledDate" name="scheduledDate" type="date" value={formData.scheduledDate} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="time">{text.time}</label>
                      <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} />
                    </div>
                  </div>
                  <Button className="w-full" size="lg" type="submit">{text.saveIdea}</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              {plannerStatuses.map((status) => {
                const Icon = statusMeta[status].icon;
                const items = groupedIdeas[status];
                return (
                  <Card key={status}>
                    <CardHeader>
                      <div className={cn("flex items-center gap-2", statusMeta[status].accent)}><Icon className="h-4 w-4" /><span className="text-xs font-medium tracking-wide">{status}</span></div>
                      <CardTitle>{status}</CardTitle>
                      <CardDescription>{statusMeta[status].description[language]}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {items.length > 0 ? items.map((item) => (
                        <article key={item.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", typePillStyles[item.type])}>{item.type}</span>
                              <span className="rounded-full border border-border/70 bg-slate-950/70 px-2.5 py-1 text-xs text-muted-foreground">{item.scheduledDate} {item.time}</span>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{item.caption}</p>
                          </div>
                        </article>
                      )) : <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{language === "es" ? "Sin items por ahora." : "No items yet."}</div>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary"><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-medium tracking-wide">{selectedView.label}</span></div>
                <CardTitle>{text.latestSection}</CardTitle>
                <CardDescription>{text.latestDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedView.connected && selectedView.recentMedia.length > 0 ? selectedView.recentMedia.map((post) => <PublishedPostCard key={post.id} post={post} language={language} sourceLabel={post.accountLabel} />) : <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{text.noPosts}</div>}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader><CardTitle>{text.topTitle}</CardTitle><CardDescription>{text.topDescription}</CardDescription></CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  {selectedView.topPerformer ? (
                    <>
                      <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                        <div className="flex flex-wrap gap-2">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Caption</p>
                          <span className="rounded-full border border-border/70 bg-slate-950/70 px-2.5 py-1 text-[11px] text-muted-foreground">{text.sourceTag}: {selectedView.topPerformer.accountLabel}</span>
                        </div>
                        <p className="mt-2 text-foreground">{truncate(selectedView.topPerformer.caption, 180)}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-xs text-muted-foreground">Likes</p><p className="mt-2 text-2xl font-semibold text-foreground">{formatCompactNumber(selectedView.topPerformer.likeCount)}</p></div>
                        <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-xs text-muted-foreground">Comments</p><p className="mt-2 text-2xl font-semibold text-foreground">{formatCompactNumber(selectedView.topPerformer.commentsCount)}</p></div>
                        <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-xs text-muted-foreground">Engagement</p><p className="mt-2 text-2xl font-semibold text-foreground">{selectedView.topPerformer.engagementRate}%</p></div>
                      </div>
                      <Button asChild variant="outline" className="w-full"><a href={selectedView.topPerformer.permalink} rel="noreferrer" target="_blank">{text.openTop}<ArrowUpRight className="h-4 w-4" /></a></Button>
                    </>
                  ) : <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6">{language === "es" ? "Aun no hay suficiente data para calcular un top performer." : "There is not enough data yet to calculate a top performer."}</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{text.productionTitle}</CardTitle><CardDescription>{text.productionDescription}</CardDescription></CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.prod1}</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.prod2}</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">{text.prod3}</div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

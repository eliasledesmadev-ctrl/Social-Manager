"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Eye,
  FileDown,
  LineChart,
  TrendingUp,
  Users,
  ZoomIn,
  ZoomOut,
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
import type {
  InstagramAccountScope,
  InstagramDashboardData,
  InstagramMediaItem,
} from "@/lib/instagram";

const copy = {
  en: {
    badge: "TuCuervo Analytics",
    title: "Social performance dashboard",
    intro:
      "This view can now merge both Instagram accounts into one brand report or let you inspect each account independently.",
    filterLabel: "Dynamic filter",
    filterTitle: "Filter range",
    activeRange: "Active range",
    apiHistory: "API history loaded",
    startDate: "Start date",
    endDate: "End date",
    totalInteractions: "Total interactions",
    engagementRate: "Engagement rate",
    followers: "Current followers",
    postsInRange: "Posts in range",
    totalInteractionsHelper: "Likes + comments inside the selected range",
    engagementHelper: "Real average calculated from filtered posts",
    followersHelper: "Current snapshot from the selected source",
    postsHelper: "Real amount of posts inside the selected range",
    barLabel: "Bar chart",
    barTitle: "Interactions by post date",
    barDescription: "Real interactions grouped by publishing date.",
    lineLabel: "Line graph",
    lineTitle: "Engagement trend",
    lineDescription: "Average engagement trend by publishing date.",
    noPostsRange: "There are no posts inside the current range.",
    noEnoughPosts: "There are not enough posts inside the current range.",
    connectedSource: "Connected source",
    sourceDescription: "Real Instagram snapshot connected to TuCuervo.",
    account: "Account",
    dateRange: "Date range",
    topPosts: "Top performing posts",
    topPostsDescription: "Real top posts inside the selected range.",
    updatedSnapshot: "Refresh snapshot",
    likes: "Likes",
    comments: "Comments",
    engagement: "Engagement",
    postDay: "post(s) on that day",
    openRangeLabel: "posts loaded from the API to power this analytics view.",
    postedOn: "Published",
    sourceScope: "Account scope",
    sourceScopeDescription: "All accounts is selected by default and merges both Instagram sources.",
    sourceTag: "Source",
    allAccounts: "All accounts (combined)",
    exportPdf: "Export branded PDF",
    pdfTitle: "TuCuervo Analytics Report",
    pdfSubtitle: "Branded report generated from live Instagram data",
    pdfSummary: "Executive summary",
    pdfDailyBreakdown: "Daily breakdown",
    pdfTopPosts: "Top posts",
    generatedOn: "Generated on",
    range: "Range",
  },
  es: {
    badge: "TuCuervo Analytics",
    title: "Dashboard de rendimiento social",
    intro:
      "Esta vista ahora puede unir ambas cuentas de Instagram como un solo reporte de marca o dejarte revisar cada cuenta por separado.",
    filterLabel: "Filtro dinamico",
    filterTitle: "Filtrar periodo",
    activeRange: "Rango activo",
    apiHistory: "Historial cargado por API",
    startDate: "Fecha inicial",
    endDate: "Fecha final",
    totalInteractions: "Interacciones totales",
    engagementRate: "Tasa de engagement",
    followers: "Seguidores actuales",
    postsInRange: "Posts en rango",
    totalInteractionsHelper: "Likes + comentarios dentro del periodo elegido",
    engagementHelper: "Promedio real calculado sobre posts filtrados",
    followersHelper: "Snapshot actual de la fuente seleccionada",
    postsHelper: "Cantidad real de publicaciones dentro del rango",
    barLabel: "Grafico de barras",
    barTitle: "Interacciones por fecha de publicacion",
    barDescription: "Interacciones reales agrupadas por fecha de publicacion.",
    lineLabel: "Grafico de linea",
    lineTitle: "Tendencia de engagement",
    lineDescription: "Tendencia del engagement promedio por fecha de publicacion.",
    noPostsRange: "No hay publicaciones dentro del rango actual.",
    noEnoughPosts: "No hay suficientes posts dentro del rango actual.",
    connectedSource: "Fuente conectada",
    sourceDescription: "Snapshot real de Instagram conectado a TuCuervo.",
    account: "Cuenta",
    dateRange: "Rango de fechas",
    topPosts: "Publicaciones destacadas",
    topPostsDescription: "Top posts reales dentro del rango seleccionado.",
    updatedSnapshot: "Actualizar snapshot",
    likes: "Likes",
    comments: "Comentarios",
    engagement: "Engagement",
    postDay: "post(s) ese dia",
    openRangeLabel: "publicaciones cargadas desde la API para alimentar esta vista.",
    postedOn: "Publicado",
    sourceScope: "Alcance de cuenta",
    sourceScopeDescription: "Por defecto se muestran ambas cuentas unidas como una sola vista.",
    sourceTag: "Fuente",
    allAccounts: "Todas las cuentas (combinadas)",
    exportPdf: "Exportar PDF con branding",
    pdfTitle: "Reporte de Analytics TuCuervo",
    pdfSubtitle: "Reporte de marca generado desde datos reales de Instagram",
    pdfSummary: "Resumen ejecutivo",
    pdfDailyBreakdown: "Desglose diario",
    pdfTopPosts: "Top publicaciones",
    generatedOn: "Generado el",
    range: "Rango",
  },
} as const;

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatFullNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDateTime(value: string, language: "en" | "es") {
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
function formatMonthDay(value: string, language: "en" | "es") {
  return new Intl.DateTimeFormat(language === "es" ? "es-PE" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

type ChartTooltip = {
  x: number;
  y: number;
  date: string;
  time?: string;
  interactions: number;
  likes?: number;
  comments?: number;
  posts?: number;
} | null;

function buildLinePath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function normalizeRange(startDate: string, endDate: string) {
  return startDate <= endDate
    ? { start: startDate, end: endDate }
    : { start: endDate, end: startDate };
}

function truncate(text: string, max = 90) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}
function groupMediaByDate(posts: InstagramMediaItem[]) {
  const grouped = new Map<string, { date: string; interactions: number; engagementRate: number; posts: number }>();

  for (const post of posts) {
    const date = post.timestamp.slice(0, 10);
    const current = grouped.get(date);

    if (current) {
      current.interactions += post.engagementCount;
      current.engagementRate += post.engagementRate;
      current.posts += 1;
    } else {
      grouped.set(date, {
        date,
        interactions: post.engagementCount,
        engagementRate: post.engagementRate,
        posts: 1,
      });
    }
  }

  return [...grouped.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      engagementRate: Number((item.engagementRate / item.posts).toFixed(2)),
    }));
}

export function AnalyticsDashboard({ instagram }: { instagram: InstagramDashboardData }) {
  const { language } = useAppLanguage();
  const text = copy[language];
  const [startDate, setStartDate] = useState("2021-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountScope, setAccountScope] = useState<InstagramAccountScope>("all");
  const [barChartScale, setBarChartScale] = useState(1);
  const [lineChartScale, setLineChartScale] = useState(1);
  const [tooltip, setTooltip] = useState<ChartTooltip>(null);

  const range = useMemo(() => normalizeRange(startDate, endDate), [startDate, endDate]);
  const selectedAccount = useMemo(
    () => instagram.accounts.find((account) => account.key === accountScope),
    [accountScope, instagram.accounts]
  );

  const selectedView = useMemo(() => {
    if (accountScope === "all") {
      return {
        label: text.allAccounts,
        profile: instagram.profile,
        allMedia: instagram.allMedia,
        error: instagram.error,
      };
    }

    return {
      label: selectedAccount?.label ?? text.allAccounts,
      profile: selectedAccount?.profile ?? null,
      allMedia: selectedAccount?.allMedia ?? [],
      error: selectedAccount?.error,
    };
  }, [accountScope, instagram, selectedAccount, text.allAccounts]);

  const filteredPosts = useMemo(() => {
    return selectedView.allMedia.filter((post) => {
      const postDate = post.timestamp.slice(0, 10);
      return postDate >= range.start && postDate <= range.end;
    });
  }, [selectedView.allMedia, range.end, range.start]);

  const groupedMetrics = useMemo(() => groupMediaByDate(filteredPosts), [filteredPosts]);
  const interactions = groupedMetrics.map((item) => item.interactions);
  const engagementValues = groupedMetrics.map((item) => item.engagementRate);
  const maxInteractions = Math.max(...interactions, 1);
  const linePath = buildLinePath(engagementValues, 100, 100);

  const totals = useMemo(() => {
    const totalInteractions = filteredPosts.reduce((sum, post) => sum + post.engagementCount, 0);
    const averageEngagement = filteredPosts.length
      ? Number(
          (
            filteredPosts.reduce((sum, post) => sum + post.engagementRate, 0) /
            filteredPosts.length
          ).toFixed(2)
        )
      : 0;

    return {
      totalInteractions,
      averageEngagement,
      publishedPosts: filteredPosts.length,
      followers: selectedView.profile?.followersCount ?? 0,
    };
  }, [filteredPosts, selectedView.profile?.followersCount]);

  const topPosts = [...filteredPosts]
    .sort((a, b) => b.engagementCount - a.engagementCount)
    .slice(0, 6);

  const activeRangeLabel = `${formatMonthDay(range.start, language)} - ${formatMonthDay(range.end, language)}`;

  function handleExportPdf() {
    const popup = window.open("", "_blank", "width=1200,height=900");
    if (!popup) return;

    const summaryCards = metricCards
      .map(
        (card) => `
          <div class="metric-card">
            <div class="metric-label">${card.label}</div>
            <div class="metric-value">${card.value}</div>
            <div class="metric-helper">${card.helper}</div>
          </div>
        `
      )
      .join("");

    const dailyRows = groupedMetrics.length
      ? groupedMetrics
          .map(
            (item) => `
              <tr>
                <td>${formatMonthDay(item.date, language)}</td>
                <td>${formatFullNumber(item.interactions)}</td>
                <td>${item.engagementRate}%</td>
                <td>${item.posts}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="4">${text.noPostsRange}</td></tr>`;

    const topRows = topPosts.length
      ? topPosts
          .map(
            (post, index) => `
              <tr>
                <td>#${index + 1}</td>
                <td>${post.accountLabel}</td>
                <td>${truncate(post.caption)}</td>
                <td>${formatMonthDay(post.timestamp, language)}</td>
                <td>${formatCompactNumber(post.likeCount)}</td>
                <td>${formatCompactNumber(post.commentsCount)}</td>
                <td>${post.engagementRate}%</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="7">${text.noPostsRange}</td></tr>`;

    popup.document.write(`
      <html>
        <head>
          <title>${text.pdfTitle}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Inter, Arial, sans-serif; color: #dbe7f3; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); padding: 40px; }
            .report { max-width: 1100px; margin: 0 auto; }
            .hero, .table-card, .metric-card, .meta-card { border: 1px solid rgba(56, 189, 248, 0.15); background: rgba(2, 6, 23, 0.55); border-radius: 24px; }
            .hero { padding: 32px; margin-bottom: 24px; }
            .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
            .brand-mark { width: 52px; height: 52px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: rgba(34, 211, 238, 0.15); color: #22d3ee; font-size: 28px; font-weight: 700; }
            .brand-name { font-size: 28px; font-weight: 700; margin: 0; }
            .brand-subtitle { color: #94a3b8; margin: 6px 0 0; }
            .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
            .meta-card { padding: 18px; }
            .meta-label, .metric-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #94a3b8; }
            .meta-value, .metric-value { margin-top: 10px; font-size: 28px; font-weight: 700; color: #f8fafc; }
            .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
            .metric-card { padding: 18px; }
            .metric-helper { margin-top: 10px; color: #94a3b8; font-size: 13px; line-height: 1.5; }
            .section-title { font-size: 22px; font-weight: 700; margin: 0 0 14px; color: #f8fafc; }
            .table-card { padding: 20px; margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); font-size: 14px; }
            th { color: #94a3b8; font-weight: 600; }
            .footer-note { margin-top: 18px; color: #94a3b8; font-size: 12px; }
            @media print {
              body { padding: 0; background: white; color: #0f172a; }
              .hero, .table-card, .metric-card, .meta-card { background: white; border-color: #dbe3ec; }
              .brand-subtitle, .meta-label, .metric-label, .metric-helper, th, .footer-note { color: #475569; }
              .brand-name, .meta-value, .metric-value, .section-title { color: #0f172a; }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <section class="hero">
              <div class="brand">
                <div class="brand-mark">F</div>
                <div>
                  <p class="brand-name">${text.pdfTitle}</p>
                  <p class="brand-subtitle">${text.pdfSubtitle}</p>
                </div>
              </div>
              <div class="meta">
                <div class="meta-card"><div class="meta-label">${text.account}</div><div class="meta-value">${selectedView.profile?.name ?? selectedView.label}</div></div>
                <div class="meta-card"><div class="meta-label">${text.range}</div><div class="meta-value">${activeRangeLabel}</div></div>
                <div class="meta-card"><div class="meta-label">${text.generatedOn}</div><div class="meta-value">${formatDateTime(new Date().toISOString(), language)}</div></div>
              </div>
            </section>
            <section>
              <h2 class="section-title">${text.pdfSummary}</h2>
              <div class="metrics-grid">${summaryCards}</div>
            </section>
            <section class="table-card">
              <h2 class="section-title">${text.pdfDailyBreakdown}</h2>
              <table>
                <thead><tr><th>${text.postedOn}</th><th>${text.totalInteractions}</th><th>${text.engagementRate}</th><th>${text.postsInRange}</th></tr></thead>
                <tbody>${dailyRows}</tbody>
              </table>
            </section>
            <section class="table-card">
              <h2 class="section-title">${text.pdfTopPosts}</h2>
              <table>
                <thead><tr><th>#</th><th>${text.sourceTag}</th><th>Caption</th><th>${text.postedOn}</th><th>${text.likes}</th><th>${text.comments}</th><th>${text.engagement}</th></tr></thead>
                <tbody>${topRows}</tbody>
              </table>
              <p class="footer-note">TuCuervo Social Suite &middot; ${selectedView.allMedia.length} ${text.openRangeLabel}</p>
            </section>
          </div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 300);
  }
  const metricCards = [
    {
      label: text.totalInteractions,
      value: formatFullNumber(totals.totalInteractions),
      helper: text.totalInteractionsHelper,
      icon: Eye,
    },
    {
      label: text.engagementRate,
      value: `${totals.averageEngagement}%`,
      helper: text.engagementHelper,
      icon: TrendingUp,
    },
    {
      label: text.followers,
      value: formatFullNumber(totals.followers),
      helper: text.followersHelper,
      icon: Users,
    },
    {
      label: text.postsInRange,
      value: formatFullNumber(totals.publishedPosts),
      helper: text.postsHelper,
      icon: BarChart3,
    },
  ];

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
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{text.title}</h1>
                  <p className="text-sm text-muted-foreground">{text.intro}</p>
                </div>
              </div>

              <Card className="w-full max-w-xl bg-background/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <CalendarRange className="h-4 w-4" />
                    <span className="text-sm font-medium">{text.filterLabel}</span>
                  </div>
                  <CardTitle className="text-lg">{text.filterTitle}</CardTitle>
                  <CardDescription>{text.activeRange}: {activeRangeLabel}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="analytics-scope">{text.sourceScope}</label>
                    <AccountScopeSelector accounts={instagram.accounts} value={accountScope} onChange={setAccountScope} id="analytics-scope" />
                    <p className="text-sm text-muted-foreground">{text.sourceScopeDescription}</p>
                  </div>
                  <div className="md:col-span-2 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                    {text.apiHistory}: {selectedView.allMedia.length} {text.openRangeLabel}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="startDate">{text.startDate}</label>
                    <Input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="endDate">{text.endDate}</label>
                    <Input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="flex justify-stretch sm:justify-end">
            <Button type="button" variant="outline" onClick={handleExportPdf} className="w-full sm:w-auto">
              {text.exportPdf}
              <FileDown className="h-4 w-4" />
            </Button>
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardDescription>{card.label}</CardDescription>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                    </div>
                    <CardTitle className="text-2xl">{card.value}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-xs text-muted-foreground">{card.helper}</p></CardContent>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary"><BarChart3 className="h-4 w-4" /><span className="text-xs font-medium tracking-wide">{text.barLabel}</span></div>
                  <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-background/40 p-1">
                    <button type="button" onClick={() => setBarChartScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))} className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Zoom out bar chart"><ZoomOut className="h-3.5 w-3.5" /></button>
                    <span className="min-w-[2.5rem] text-center text-[11px] font-medium tabular-nums text-muted-foreground">{Math.round(barChartScale * 100)}%</span>
                    <button type="button" onClick={() => setBarChartScale((s) => Math.min(2.5, +(s + 0.25).toFixed(2)))} className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Zoom in bar chart"><ZoomIn className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <CardTitle>{text.barTitle}</CardTitle>
                <CardDescription>{text.barDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {groupedMetrics.length > 0 ? (
                  <div className="grid grid-cols-[auto_1fr] gap-4" style={{ minHeight: Math.round(320 * barChartScale) }}>
                    <div className="flex flex-col justify-between py-2 text-xs text-muted-foreground">
                      <span>{formatCompactNumber(maxInteractions)}</span>
                      <span>{formatCompactNumber(maxInteractions / 2)}</span>
                      <span>0</span>
                    </div>
                    <div className="flex h-full items-end gap-3 overflow-x-auto rounded-3xl border border-border/70 bg-background/50 p-5">
                      {groupedMetrics.map((item) => (
                        <div
                          key={item.date}
                          className="flex min-w-14 flex-1 flex-col items-center gap-3 cursor-default"
                          onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, date: item.date, interactions: item.interactions, posts: item.posts })}
                          onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : t)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div className="flex w-full items-end" style={{ height: Math.round(256 * barChartScale) }}>
                            <div className="w-full rounded-t-2xl bg-gradient-to-t from-primary to-cyan-300 shadow-[0_10px_35px_rgba(34,211,238,0.25)] transition-all hover:brightness-125" style={{ height: `${Math.max((item.interactions / maxInteractions) * 100, 8)}%` }} />
                          </div>
                          <div className="space-y-1 text-center">
                            <p className="text-xs font-medium text-foreground">{formatCompactNumber(item.interactions)}</p>
                            <p className="text-[11px] text-muted-foreground">{formatMonthDay(item.date, language)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{text.noPostsRange}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary"><LineChart className="h-4 w-4" /><span className="text-xs font-medium tracking-wide">{text.lineLabel}</span></div>
                  <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-background/40 p-1">
                    <button type="button" onClick={() => setLineChartScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))} className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Zoom out line chart"><ZoomOut className="h-3.5 w-3.5" /></button>
                    <span className="min-w-[2.5rem] text-center text-[11px] font-medium tabular-nums text-muted-foreground">{Math.round(lineChartScale * 100)}%</span>
                    <button type="button" onClick={() => setLineChartScale((s) => Math.min(2.5, +(s + 0.25).toFixed(2)))} className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Zoom in line chart"><ZoomIn className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <CardTitle>{text.lineTitle}</CardTitle>
                <CardDescription>{text.lineDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedMetrics.length > 0 ? (
                  <>
                    <div className="rounded-3xl border border-border/70 bg-background/50 p-4">
                      <svg viewBox="0 0 100 100" className="w-full overflow-visible" style={{ height: Math.round(288 * lineChartScale) }}>
                        <defs><linearGradient id="engagementLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgb(34 211 238)" /><stop offset="100%" stopColor="rgb(59 130 246)" /></linearGradient></defs>
                        <path d="M0,100 L100,100" stroke="rgba(148,163,184,0.2)" strokeWidth="0.8" />
                        <path d="M0,66 L100,66" stroke="rgba(148,163,184,0.15)" strokeWidth="0.8" />
                        <path d="M0,33 L100,33" stroke="rgba(148,163,184,0.15)" strokeWidth="0.8" />
                        <path d={linePath} fill="none" stroke="url(#engagementLine)" strokeWidth="2.5" strokeLinecap="round" />
                        {engagementValues.map((value, index) => {
                          const max = Math.max(...engagementValues, 1);
                          const min = Math.min(...engagementValues, 0);
                          const rangeValue = max - min || 1;
                          const x = (index / Math.max(engagementValues.length - 1, 1)) * 100;
                          const y = 100 - ((value - min) / rangeValue) * 100;
                          const item = groupedMetrics[index];
                          return (
                            <circle
                              key={`${value}-${index}`}
                              cx={x} cy={y} r="3.5"
                              fill="rgb(34 211 238)" stroke="rgb(15 23 42)" strokeWidth="1"
                              className="cursor-default"
                              onMouseEnter={(e) => {
                                const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                                setTooltip({ x: e.clientX, y: e.clientY, date: item.date, interactions: item.interactions, posts: item.posts });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                          );
                        })}
                      </svg>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {groupedMetrics.slice(-3).map((item) => (
                        <div key={item.date} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{formatMonthDay(item.date, language)}</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{item.engagementRate}%</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.posts} {text.postDay}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{text.noEnoughPosts}</div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader><CardTitle>{text.connectedSource}</CardTitle><CardDescription>{text.sourceDescription}</CardDescription></CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{text.account}</p><p className="mt-2 text-base font-semibold text-foreground">{selectedView.profile?.name ?? selectedView.label}</p><p>{selectedView.profile ? `@${selectedView.profile.username}` : selectedView.error}</p></div>
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{text.dateRange}</p><p className="mt-2 text-foreground">{activeRangeLabel}</p></div>
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{text.apiHistory}</p><p className="mt-2">{selectedView.allMedia.length} {text.openRangeLabel}</p></div>
                <Button variant="outline" className="w-full">{text.updatedSnapshot}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{text.topPosts}</CardTitle><CardDescription>{text.topPostsDescription}</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {topPosts.length > 0 ? (
                  topPosts.map((post, index) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-border/70 bg-background/50 p-4 cursor-default"
                      onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, date: post.timestamp, time: post.timestamp, interactions: post.engagementCount, likes: post.likeCount, comments: post.commentsCount })}
                      onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : t)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">#{index + 1}</span>
                            <span className="rounded-full bg-slate-200/10 px-2.5 py-1 text-xs font-medium text-slate-200">{post.mediaType}</span>
                            <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-xs text-muted-foreground">{text.sourceTag}: {post.accountLabel}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">{post.caption.slice(0, 90) || "Instagram post"}</h3>
                          <p className="text-sm text-muted-foreground">{text.postedOn} {formatMonthDay(post.timestamp, language)}</p>
                        </div>
                        <div className="grid min-w-56 grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-3"><p className="text-xs text-muted-foreground">{text.likes}</p><p className="mt-1 text-base font-semibold text-foreground">{formatCompactNumber(post.likeCount)}</p></div>
                          <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-3"><p className="text-xs text-muted-foreground">{text.comments}</p><p className="mt-1 text-base font-semibold text-foreground">{formatCompactNumber(post.commentsCount)}</p></div>
                          <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-3"><p className="text-xs text-muted-foreground">{text.engagement}</p><p className="mt-1 text-base font-semibold text-foreground">{post.engagementRate}%</p></div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">{text.noPostsRange}</div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 12 }}
        >
          <div className="rounded-2xl border border-border/80 bg-slate-900/95 px-4 py-3 shadow-[0_16px_48px_rgba(2,6,23,0.65)] backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatMonthDay(tooltip.date, language)}
              {tooltip.time && <> · {formatTime(tooltip.time)}</>}
            </p>
            {tooltip.likes !== undefined ? (
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground">{text.likes}</p>
                  <p className="text-sm font-semibold text-foreground">{formatFullNumber(tooltip.likes)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{text.comments}</p>
                  <p className="text-sm font-semibold text-foreground">{formatFullNumber(tooltip.comments ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{text.totalInteractions}</p>
                  <p className="text-sm font-semibold text-primary">{formatFullNumber(tooltip.interactions)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground">{text.totalInteractions}</p>
                  <p className="text-sm font-semibold text-primary">{formatFullNumber(tooltip.interactions)}</p>
                </div>
                {tooltip.posts !== undefined && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">{text.postsInRange}</p>
                    <p className="text-sm font-semibold text-foreground">{tooltip.posts}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

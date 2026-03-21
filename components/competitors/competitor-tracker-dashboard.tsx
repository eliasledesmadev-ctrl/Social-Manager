"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  BarChart3,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Platform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn";
type DataSource = "Manual public entry" | "YouTube API" | "OG scrape (name/handle only)";
type SortField =
  | "competitor"
  | "platform"
  | "followers"
  | "recentPosts"
  | "engagementRate"
  | "postingFrequency"
  | "growthTrend";
type SortDirection = "asc" | "desc";
type FetchStatus = "idle" | "loading" | "success" | "error";

type CompetitorAccount = {
  id: string;
  competitor: string;
  platform: Platform;
  handle: string;
  profileUrl: string;
  followers: number;
  recentPosts: number;
  engagementRate: number;
  postingFrequency: number;
  growthTrend: number;
  recentPostTitles: string[];
  notes: string;
  dataSource: DataSource;
  updatedAt: string;
};

const storageKey = "tucuervo.competitors.accounts";
const platformOptions: Platform[] = ["Instagram", "TikTok", "YouTube", "LinkedIn"];

const platformStyles: Record<Platform, string> = {
  Instagram: "border-pink-400/20 bg-pink-400/10 text-pink-200",
  TikTok: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  YouTube: "border-red-400/20 bg-red-400/10 text-red-200",
  LinkedIn: "border-blue-400/20 bg-blue-400/10 text-blue-200",
};

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function readAccounts() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [] as CompetitorAccount[];
    const parsed = JSON.parse(raw) as CompetitorAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as CompetitorAccount[];
  }
}

function compareValues(
  a: CompetitorAccount,
  b: CompetitorAccount,
  field: SortField,
  direction: SortDirection,
) {
  const modifier = direction === "asc" ? 1 : -1;
  if (field === "competitor" || field === "platform") {
    return a[field].localeCompare(b[field]) * modifier;
  }
  return ((a[field] as number) - (b[field] as number)) * modifier;
}

function detectPlatformFromUrl(url: string): Platform | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("instagram.com")) return "Instagram";
    if (hostname.includes("tiktok.com")) return "TikTok";
    if (hostname.includes("linkedin.com")) return "LinkedIn";
    return null;
  } catch {
    return null;
  }
}

const emptyForm = {
  competitor: "",
  platform: "Instagram" as Platform,
  handle: "",
  profileUrl: "",
  followers: "",
  recentPosts: "",
  engagementRate: "",
  postingFrequency: "",
  growthTrend: "",
  recentPostTitles: "",
  notes: "",
};

/** Decodifica entidades HTML y recorta el sufijo típico de Instagram en og:title. */
function cleanText(value: string): string {
  return value
    .replace(/&#0*64;/gi, "@")
    .replace(/&#x0*40;/gi, "@")
    .replace(/&#x2022;/gi, "•")
    .replace(/&#8226;/gi, "•")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s*\(@[^)]*\).*$/, "")
    .trim();
}

const copy = {
  en: {
    viewPosts: "View posts...",
    open: "Open",
    noMetrics: "No metrics recorded yet. Enter them manually or use Fetch for YouTube channels.",
    followers: "Followers",
    engagement: "Engagement",
    postsWeek: "Posts / week",
    growth: "Growth",
  },
  es: {
    viewPosts: "Ver posts...",
    open: "Abrir",
    noMetrics: "Sin métricas registradas. Ingresalas manualmente o usá Fetch para canales de YouTube.",
    followers: "Seguidores",
    engagement: "Engagement",
    postsWeek: "Posts / semana",
    growth: "Crecimiento",
  },
};

export function CompetitorTrackerDashboard() {
  const { language } = useAppLanguage();
  const t = copy[language];
  const [accounts, setAccounts] = useState<CompetitorAccount[]>([]);
  const [sortField, setSortField] = useState<SortField>("engagementRate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [ready, setReady] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [fetchNote, setFetchNote] = useState("");
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [pendingDataSource, setPendingDataSource] = useState<DataSource>("Manual public entry");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = readAccounts();
    setAccounts(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(accounts));
  }, [accounts, ready]);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => compareValues(a, b, sortField, sortDirection));
  }, [accounts, sortDirection, sortField]);

  const selectedAccount = useMemo(
    () => sortedAccounts.find((a) => a.id === selectedId) ?? sortedAccounts[0] ?? null,
    [sortedAccounts, selectedId],
  );

  const trackedCompetitors = new Set(accounts.map((a) => a.competitor)).size;
  const avgEngagement = accounts.length
    ? (accounts.reduce((s, a) => s + a.engagementRate, 0) / accounts.length).toFixed(1)
    : "0.0";
  const avgGrowth = accounts.length
    ? (accounts.reduce((s, a) => s + a.growthTrend, 0) / accounts.length).toFixed(1)
    : "0.0";

  function deleteAccount(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    setPendingDeleteId(null);
  }

  function updateSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    if (autoFilledFields.has(name)) {
      setAutoFilledFields((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }

    if (name === "profileUrl") {
      const detected = detectPlatformFromUrl(value);
      setFetchStatus("idle");
      setFetchNote("");
      setAutoFilledFields(new Set());
      setFormData((prev) => ({
        ...prev,
        profileUrl: value,
        ...(detected ? { platform: detected } : {}),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function fetchMetrics() {
    if (!formData.profileUrl || fetchStatus === "loading") return;
    setFetchStatus("loading");
    setFetchNote("");

    try {
      if (formData.platform === "YouTube") {
        const res = await fetch(
          `/api/competitor/youtube?url=${encodeURIComponent(formData.profileUrl)}`,
        );
        const data = (await res.json()) as {
          error?: string;
          name?: string;
          handle?: string;
          subscribers?: number | null;
          recentPostCount?: number;
          postingFrequency?: number;
          engagementRate?: number;
          recentTitles?: string[];
        };

        if (data.error) {
          setFetchStatus("error");
          setFetchNote(data.error);
          return;
        }

        const filled = new Set<string>();
        const patch: Partial<typeof emptyForm> = {};

        if (data.name) { patch.competitor = data.name; filled.add("competitor"); }
        if (data.handle) { patch.handle = data.handle; filled.add("handle"); }
        if (data.subscribers != null) { patch.followers = String(data.subscribers); filled.add("followers"); }
        if (data.recentPostCount != null) { patch.recentPosts = String(data.recentPostCount); filled.add("recentPosts"); }
        if (data.engagementRate != null) { patch.engagementRate = String(data.engagementRate); filled.add("engagementRate"); }
        if (data.postingFrequency != null) { patch.postingFrequency = String(data.postingFrequency); filled.add("postingFrequency"); }
        if (data.recentTitles?.length) { patch.recentPostTitles = data.recentTitles.join("\n"); filled.add("recentPostTitles"); }

        setFormData((prev) => ({ ...prev, ...patch }));
        setAutoFilledFields(filled);
        setPendingDataSource("YouTube API");
        setFetchStatus("success");
        if (data.subscribers == null) {
          setFetchNote("El canal oculta su conteo de suscriptores. Ingresa seguidores manualmente.");
        }
      } else {
        const res = await fetch(
          `/api/competitor/og?url=${encodeURIComponent(formData.profileUrl)}`,
        );
        const data = (await res.json()) as {
          error?: string;
          name?: string;
          handle?: string;
        };

        if (data.error) {
          setFetchStatus("error");
          setFetchNote(data.error);
          return;
        }

        const filled = new Set<string>();
        const patch: Partial<typeof emptyForm> = {};

        if (data.name) { patch.competitor = data.name; filled.add("competitor"); }
        if (data.handle) { patch.handle = data.handle; filled.add("handle"); }

        setFormData((prev) => ({ ...prev, ...patch }));
        setAutoFilledFields(filled);
        setPendingDataSource("OG scrape (name/handle only)");
        setFetchStatus("success");
        setFetchNote(
          "Solo se obtuvo nombre y handle. Instagram, TikTok y LinkedIn no exponen seguidores en metadatos públicos. Ingresa las métricas manualmente.",
        );
      }
    } catch {
      setFetchStatus("error");
      setFetchNote("Error de red al intentar obtener métricas.");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.competitor || !formData.handle || !formData.profileUrl) return;

    const newAccount: CompetitorAccount = {
      id: `competitor-${Date.now()}`,
      competitor: formData.competitor,
      platform: formData.platform,
      handle: formData.handle,
      profileUrl: formData.profileUrl,
      followers: Number(formData.followers || 0),
      recentPosts: Number(formData.recentPosts || 0),
      engagementRate: Number(formData.engagementRate || 0),
      postingFrequency: Number(formData.postingFrequency || 0),
      growthTrend: Number(formData.growthTrend || 0),
      recentPostTitles: formData.recentPostTitles
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      notes: formData.notes,
      dataSource: pendingDataSource,
      updatedAt: new Date().toISOString(),
    };

    setAccounts((prev) => [newAccount, ...prev]);
    setSelectedId(newAccount.id);
    setFormData(emptyForm);
    setFetchStatus("idle");
    setFetchNote("");
    setAutoFilledFields(new Set());
    setPendingDataSource("Manual public entry");
  }

  function autoInput(name: string, extraClass?: string) {
    return cn(
      extraClass,
      autoFilledFields.has(name) && "ring-1 ring-emerald-400/50 border-emerald-400/30",
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5">

          {/* Hero — solo título, sin form */}
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-6 md:p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <div className="max-w-2xl space-y-4">
              <Badge>Competitor Intelligence</Badge>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Track competitor channels with real metrics
                </h1>
                <p className="text-sm text-muted-foreground">
                  Pega la URL de un canal de YouTube para obtener suscriptores, engagement y frecuencia automáticamente. Para Instagram, TikTok y LinkedIn se extraen nombre y handle; el resto se ingresa manualmente.
                </p>
              </div>
            </div>
          </section>

          {/* Métricas */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardDescription>Tracked competitors</CardDescription>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl">{trackedCompetitors}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardDescription>Tracked accounts</CardDescription>
                  <Globe2 className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl">{accounts.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardDescription>Average engagement</CardDescription>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl">{avgEngagement}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardDescription>Average growth trend</CardDescription>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl">+{avgGrowth}%</CardTitle>
              </CardHeader>
            </Card>
          </section>

          {/* Contenido principal: tabla + form a la izquierda, spotlight a la derecha */}
          <section className="grid gap-4 2xl:grid-cols-[1fr_280px]">

            {/* Columna izquierda: form + tabla */}
            <div className="flex min-w-0 flex-col gap-4">

              {/* Form */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-medium tracking-wide">Add competitor</span>
                  </div>
                  <CardTitle className="text-lg">New competitor record</CardTitle>
                  <CardDescription>
                    Pega la URL y presiona Fetch para autocompletar. Campos con borde verde fueron llenados automáticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>

                    {/* URL + Fetch */}
                    <div className="sm:col-span-2 flex gap-2">
                      <Input
                        name="profileUrl"
                        value={formData.profileUrl}
                        onChange={handleChange}
                        placeholder="https://youtube.com/@canal  /  https://instagram.com/..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!formData.profileUrl || fetchStatus === "loading"}
                        onClick={fetchMetrics}
                        className="shrink-0 gap-2"
                      >
                        {fetchStatus === "loading" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Fetch
                      </Button>
                    </div>

                    {/* Feedback */}
                    {(fetchStatus === "success" || fetchStatus === "error") && fetchNote && (
                      <div
                        className={cn(
                          "sm:col-span-2 rounded-2xl border px-4 py-2.5 text-xs",
                          fetchStatus === "success"
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                            : "border-red-400/20 bg-red-400/10 text-red-200",
                        )}
                      >
                        {fetchNote}
                      </div>
                    )}
                    {fetchStatus === "success" && !fetchNote && (
                      <div className="sm:col-span-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs text-emerald-200">
                        Métricas obtenidas. Revisa los campos verdes y completa los que falten.
                      </div>
                    )}

                    <Input
                      name="competitor"
                      value={formData.competitor}
                      onChange={handleChange}
                      placeholder="Competitor name"
                      className={autoInput("competitor")}
                    />
                    <Select name="platform" value={formData.platform} onChange={handleChange}>
                      {platformOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Select>
                    <Input
                      name="handle"
                      value={formData.handle}
                      onChange={handleChange}
                      placeholder="@handle or channel"
                      className={autoInput("handle")}
                    />
                    <Input
                      name="followers"
                      type="number"
                      value={formData.followers}
                      onChange={handleChange}
                      placeholder="Followers / subscribers"
                      className={autoInput("followers")}
                    />
                    <Input
                      name="recentPosts"
                      type="number"
                      value={formData.recentPosts}
                      onChange={handleChange}
                      placeholder="Posts (last 30 days)"
                      className={autoInput("recentPosts")}
                    />
                    <Input
                      name="engagementRate"
                      type="number"
                      step="0.1"
                      value={formData.engagementRate}
                      onChange={handleChange}
                      placeholder="Engagement rate %"
                      className={autoInput("engagementRate")}
                    />
                    <Input
                      name="postingFrequency"
                      type="number"
                      step="0.1"
                      value={formData.postingFrequency}
                      onChange={handleChange}
                      placeholder="Posts per week"
                      className={autoInput("postingFrequency")}
                    />
                    <Input
                      name="growthTrend"
                      type="number"
                      step="0.1"
                      value={formData.growthTrend}
                      onChange={handleChange}
                      placeholder="Growth trend %"
                    />
                    <Textarea
                      className={cn("sm:col-span-2", autoInput("recentPostTitles"))}
                      name="recentPostTitles"
                      value={formData.recentPostTitles}
                      onChange={handleChange}
                      placeholder="Un título de post reciente por línea"
                    />
                    <Textarea
                      className="sm:col-span-2"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Notas: qué observaste, por qué es relevante"
                    />
                    <Button className="sm:col-span-2" size="lg" type="submit">
                      Save entry
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Tabla */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <ArrowDownUp className="h-4 w-4" />
                    <span className="text-xs font-medium tracking-wide">Sortable tracker</span>
                  </div>
                  <CardTitle>Account overview</CardTitle>
                  <CardDescription>
                    Haz click en una fila para ver los posts de ese competidor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedAccounts.length > 0 ? (
                    <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/40">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-border/70 bg-slate-950/70">
                          <tr>
                            {(
                              [
                                ["competitor", "Competitor"],
                                ["platform", "Platform"],
                                ["followers", "Followers"],
                                ["recentPosts", "Posts / 30d"],
                                ["engagementRate", "Engagement"],
                                ["postingFrequency", "/ week"],
                                ["growthTrend", "Growth"],
                              ] as [SortField, string][]
                            ).map(([field, label]) => (
                              <th key={field} className="px-4 py-3 font-medium">
                                <button
                                  className="flex items-center gap-1.5 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground"
                                  onClick={() => updateSort(field)}
                                  type="button"
                                >
                                  {label}
                                  <ArrowDownUp className="h-3 w-3" />
                                </button>
                              </th>
                            ))}
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAccounts.map((account) => (
                            <tr
                              key={account.id}
                              onClick={() => { setSelectedId(account.id); setPendingDeleteId(null); }}
                              className={cn(
                                "cursor-pointer border-b border-border/60 transition last:border-b-0 hover:bg-slate-900/40",
                                selectedId === account.id && "bg-slate-900/60",
                              )}
                            >
                              <td className="px-4 py-3 align-middle">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-foreground">{cleanText(account.competitor)}</p>
                                  <p className="text-xs text-muted-foreground">{cleanText(account.handle)}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", platformStyles[account.platform])}>
                                  {account.platform}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-middle text-foreground">{formatCompact(account.followers)}</td>
                              <td className="px-4 py-3 align-middle text-foreground">{account.recentPosts}</td>
                              <td className="px-4 py-3 align-middle text-foreground">{account.engagementRate}%</td>
                              <td className="px-4 py-3 align-middle text-foreground">{account.postingFrequency}</td>
                              <td className="px-4 py-3 align-middle text-foreground">+{account.growthTrend}%</td>
                              <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                                {pendingDeleteId === account.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => deleteAccount(account.id)}
                                      className="rounded-lg border border-red-400/40 bg-red-400/10 px-2 py-1 text-[11px] font-medium text-red-300 transition hover:bg-red-400/20"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteId(null)}
                                      className="rounded-lg border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteId(account.id)}
                                    className="rounded-lg p-1.5 text-muted-foreground/40 transition hover:bg-red-400/10 hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">
                      Todavía no hay cuentas guardadas. Agrega la primera pegando una URL arriba.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha: spotlight del competidor seleccionado */}
            <div className="flex flex-col gap-4">

              {/* Últimos 3 posts del competidor */}
              <Card>
                <CardHeader>
                  <CardTitle>Últimos 3 posts</CardTitle>
                  <CardDescription>
                    {selectedAccount
                      ? `${cleanText(selectedAccount.competitor)} · ${cleanText(selectedAccount.handle)}`
                      : "Selecciona un competidor en la tabla"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!selectedAccount && (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                      Haz click en una fila de la tabla para ver los posts de ese competidor.
                    </div>
                  )}
                  {selectedAccount && selectedAccount.recentPostTitles.length === 0 && (
                    <a
                      href={selectedAccount.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-4 py-3 transition hover:border-border hover:bg-background/70"
                    >
                      <span className="text-sm font-medium text-foreground/80 transition group-hover:text-foreground">
                        {t.viewPosts}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:text-foreground" />
                    </a>
                  )}
                  {selectedAccount?.recentPostTitles.slice(0, 3).map((title, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-xs text-muted-foreground leading-relaxed"
                    >
                      {title}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Detalle del competidor seleccionado */}
              {selectedAccount && (() => {
                const metrics = [
                  { key: "followers",    label: t.followers,  value: selectedAccount.followers,       display: formatCompact(selectedAccount.followers) },
                  { key: "engagement",   label: t.engagement, value: selectedAccount.engagementRate,  display: `${selectedAccount.engagementRate}%` },
                  { key: "postsWeek",    label: t.postsWeek,  value: selectedAccount.postingFrequency, display: String(selectedAccount.postingFrequency) },
                  { key: "growth",       label: t.growth,     value: selectedAccount.growthTrend,     display: `+${selectedAccount.growthTrend}%` },
                ].filter((m) => m.value > 0);

                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <CardTitle className="text-base leading-snug">
                            {cleanText(selectedAccount.competitor)}
                          </CardTitle>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", platformStyles[selectedAccount.platform])}>
                              {selectedAccount.platform}
                            </span>
                            {selectedAccount.dataSource === "YouTube API" && (
                              <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] text-red-300">
                                YouTube API
                              </span>
                            )}
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <a href={selectedAccount.profileUrl} target="_blank" rel="noreferrer">
                            {t.open}
                            <Link2 className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {metrics.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {metrics.map((m) => (
                            <div key={m.key} className="rounded-2xl border border-border/60 bg-background/40 p-3">
                              <p className="text-muted-foreground">{m.label}</p>
                              <p className="mt-1 font-semibold text-foreground">{m.display}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.noMetrics}</p>
                      )}
                      {selectedAccount.notes && (
                        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                          {selectedAccount.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* API coverage */}
              <Card>
                <CardHeader>
                  <CardTitle>API coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-3">
                    <span className="font-medium text-red-300">YouTube</span> — suscriptores, engagement, frecuencia, títulos recientes (automático).
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-3">
                    <span className="font-medium text-foreground">Instagram / TikTok / LinkedIn</span> — nombre y handle únicamente. Métricas: ingreso manual.
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-3">
                    Requiere <code className="rounded bg-slate-900 px-1">YOUTUBE_API_KEY</code> en <code className="rounded bg-slate-900 px-1">.env.local</code>.
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

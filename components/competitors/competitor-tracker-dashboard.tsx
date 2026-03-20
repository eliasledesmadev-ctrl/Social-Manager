"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  BarChart3,
  Globe2,
  Link2,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
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
type SortField =
  | "competitor"
  | "platform"
  | "followers"
  | "recentPosts"
  | "engagementRate"
  | "postingFrequency"
  | "growthTrend";

type SortDirection = "asc" | "desc";

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
  dataSource: "Manual public entry";
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

function compareValues(a: CompetitorAccount, b: CompetitorAccount, field: SortField, direction: SortDirection) {
  const modifier = direction === "asc" ? 1 : -1;
  if (field === "competitor" || field === "platform") {
    return a[field].localeCompare(b[field]) * modifier;
  }
  return ((a[field] as number) - (b[field] as number)) * modifier;
}

export function CompetitorTrackerDashboard() {
  const [accounts, setAccounts] = useState<CompetitorAccount[]>([]);
  const [sortField, setSortField] = useState<SortField>("engagementRate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [ready, setReady] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    setAccounts(readAccounts());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(accounts));
  }, [accounts, ready]);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => compareValues(a, b, sortField, sortDirection));
  }, [accounts, sortDirection, sortField]);

  const trackedCompetitors = new Set(accounts.map((account) => account.competitor)).size;
  const avgEngagement = accounts.length
    ? (accounts.reduce((sum, account) => sum + account.engagementRate, 0) / accounts.length).toFixed(1)
    : "0.0";
  const avgGrowth = accounts.length
    ? (accounts.reduce((sum, account) => sum + account.growthTrend, 0) / accounts.length).toFixed(1)
    : "0.0";

  function updateSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.competitor || !formData.handle || !formData.profileUrl) return;

    setAccounts((current) => [
      {
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
          .map((line) => line.trim())
          .filter(Boolean),
        notes: formData.notes,
        dataSource: "Manual public entry",
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setFormData({
      competitor: "",
      platform: "Instagram",
      handle: "",
      profileUrl: "",
      followers: "",
      recentPosts: "",
      engagementRate: "",
      postingFrequency: "",
      growthTrend: "",
      recentPostTitles: "",
      notes: "",
    });
  }

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge>Competitor Intelligence</Badge>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                    Track competitor channels without fake metrics
                  </h1>
                  <p className="text-base text-muted-foreground">
                    Esta version ya no siembra snapshots inventados. Agrega solo cuentas y metricas publicas que realmente verifiques en sus perfiles, videos o capturas.
                  </p>
                </div>
              </div>

              <Card className="w-full max-w-2xl bg-background/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add verified account</span>
                  </div>
                  <CardTitle className="text-lg">New competitor record</CardTitle>
                  <CardDescription>
                    Guarda URL publica, metricas observadas y notas para reuniones o demos sin inventar data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                    <Input name="competitor" value={formData.competitor} onChange={handleChange} placeholder="Competitor name" />
                    <Select name="platform" value={formData.platform} onChange={handleChange}>
                      {platformOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </Select>
                    <Input name="handle" value={formData.handle} onChange={handleChange} placeholder="@handle or channel" />
                    <Input name="profileUrl" value={formData.profileUrl} onChange={handleChange} placeholder="https://..." />
                    <Input name="followers" type="number" value={formData.followers} onChange={handleChange} placeholder="Followers" />
                    <Input name="recentPosts" type="number" value={formData.recentPosts} onChange={handleChange} placeholder="Recent posts" />
                    <Input name="engagementRate" type="number" step="0.1" value={formData.engagementRate} onChange={handleChange} placeholder="Engagement rate %" />
                    <Input name="postingFrequency" type="number" step="0.1" value={formData.postingFrequency} onChange={handleChange} placeholder="Posts per week" />
                    <Input name="growthTrend" type="number" step="0.1" value={formData.growthTrend} onChange={handleChange} placeholder="Growth trend %" />
                    <Textarea className="md:col-span-2" name="recentPostTitles" value={formData.recentPostTitles} onChange={handleChange} placeholder="One recent post title per line" />
                    <Textarea className="md:col-span-2" name="notes" value={formData.notes} onChange={handleChange} placeholder="What you observed publicly, what matters, why it is relevant" />
                    <Button className="md:col-span-2" size="lg" type="submit">Save verified entry</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>Tracked competitors</CardDescription><Users className="h-4 w-4 text-primary" /></div><CardTitle className="text-3xl">{trackedCompetitors}</CardTitle></CardHeader></Card>
            <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>Tracked accounts</CardDescription><Globe2 className="h-4 w-4 text-primary" /></div><CardTitle className="text-3xl">{accounts.length}</CardTitle></CardHeader></Card>
            <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>Average engagement</CardDescription><BarChart3 className="h-4 w-4 text-primary" /></div><CardTitle className="text-3xl">{avgEngagement}%</CardTitle></CardHeader></Card>
            <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>Average growth trend</CardDescription><TrendingUp className="h-4 w-4 text-primary" /></div><CardTitle className="text-3xl">+{avgGrowth}%</CardTitle></CardHeader></Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary"><ArrowDownUp className="h-4 w-4" /><span className="text-sm font-medium">Sortable tracker table</span></div>
                <CardTitle>Verified public account overview</CardTitle>
                <CardDescription>Solo muestra registros que tu mismo agregas con URLs y metricas reales observadas.</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedAccounts.length > 0 ? (
                  <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/40">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-border/70 bg-slate-950/70 text-muted-foreground">
                        <tr>
                          {[["competitor","Competitor"],["platform","Platform"],["followers","Followers"],["recentPosts","Recent posts"],["engagementRate","Engagement"],["postingFrequency","Posts / week"],["growthTrend","Growth trend"]].map(([field,label]) => (
                            <th key={field} className="px-4 py-3 font-medium">
                              <button className="flex items-center gap-2 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground" onClick={() => updateSort(field as SortField)} type="button">
                                {label}<ArrowDownUp className="h-3.5 w-3.5" />
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAccounts.map((account) => (
                          <tr key={account.id} className="border-b border-border/60 last:border-b-0">
                            <td className="px-4 py-4 align-top"><div className="space-y-1"><p className="font-semibold text-foreground">{account.competitor}</p><p className="text-xs text-muted-foreground">{account.handle}</p></div></td>
                            <td className="px-4 py-4 align-top"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", platformStyles[account.platform])}>{account.platform}</span></td>
                            <td className="px-4 py-4 align-top text-foreground">{formatCompact(account.followers)}</td>
                            <td className="px-4 py-4 align-top text-foreground">{account.recentPosts}</td>
                            <td className="px-4 py-4 align-top text-foreground">{account.engagementRate}%</td>
                            <td className="px-4 py-4 align-top text-foreground">{account.postingFrequency}</td>
                            <td className="px-4 py-4 align-top text-foreground">+{account.growthTrend}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">Todavia no hay cuentas verificadas cargadas. Agrega una con URL publica y metricas reales.</div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader><CardTitle>Open profile references</CardTitle><CardDescription>Links y notas para revisar rapido en una reunion.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {sortedAccounts.slice(0, 4).map((account) => (
                    <article key={account.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">{account.competitor}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", platformStyles[account.platform])}>{account.platform}</span>
                            <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-[11px] text-muted-foreground">{account.dataSource}</span>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm"><a href={account.profileUrl} target="_blank" rel="noreferrer">Abrir<Link2 className="h-4 w-4" /></a></Button>
                      </div>
                      {account.recentPostTitles.length > 0 && (
                        <div className="mt-3 space-y-2">{account.recentPostTitles.slice(0, 3).map((title) => <div key={title} className="rounded-2xl border border-border/60 bg-slate-950/50 px-3 py-2 text-xs text-muted-foreground">{title}</div>)}</div>
                      )}
                      {account.notes && <p className="mt-3 text-sm text-muted-foreground">{account.notes}</p>}
                    </article>
                  ))}
                  {sortedAccounts.length === 0 && <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">Cuando agregues cuentas, aqui veras accesos rapidos y ultimas observaciones.</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Important note</CardTitle><CardDescription>Estado honesto de esta seccion.</CardDescription></CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">La parte de competidores ya no usa mocks ni snapshots sembrados.</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">Las APIs oficiales no exponen de forma uniforme analytics de competidores en Instagram, TikTok y LinkedIn, por eso esta capa queda como tracker de observacion publica verificada.</div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">Cuando definamos un proveedor o flujo legal para cada plataforma, esta tabla puede pasar de entrada manual a ingestiones reales.</div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
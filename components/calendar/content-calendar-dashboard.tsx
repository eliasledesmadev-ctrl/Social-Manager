"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  Layers3,
  MessageSquare,
  Plus,
  X,
} from "lucide-react";

import { AccountScopeSelector } from "@/components/instagram/account-scope-selector";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  contentPlannerCommentsStorageKey,
  contentPlannerStorageKey,
  plannerPlatforms,
  plannerStatuses,
  plannerTypes,
  type PlannerItem,
  type PlannerPlatform,
  type PlannerStatus,
  type PlannerType,
} from "@/lib/content-planner";
import type { InstagramAccountScope, InstagramDashboardData } from "@/lib/instagram";
import { cn } from "@/lib/utils";

type PlatformFilter = "All Platforms" | PlannerPlatform;
type CalendarStatus = PlannerStatus | "Published";

type CalendarComment = {
  id: string;
  text: string;
  createdAt: string;
};

type CalendarActivity = {
  id: string;
  source: "planner" | "instagram";
  title: string;
  caption: string;
  platform: PlannerPlatform;
  status: CalendarStatus;
  date: string;
  time: string;
  type: string;
  permalink?: string;
  likeCount?: number;
  commentsCount?: number;
  engagementRate?: number;
  accountKey?: "primary" | "secondary";
  accountLabel?: string;
};

const platformStyles: Record<PlannerPlatform, string> = {
  Instagram: "bg-pink-400/10 text-pink-200 border-pink-400/20",
  TikTok: "bg-cyan-400/10 text-cyan-200 border-cyan-400/20",
  YouTube: "bg-red-400/10 text-red-200 border-red-400/20",
  LinkedIn: "bg-blue-400/10 text-blue-200 border-blue-400/20",
};

const statusStyles: Record<CalendarStatus, string> = {
  Scheduled: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  Draft: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Backlog: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200",
  Published: "border-slate-200/10 bg-slate-200/10 text-slate-200",
};

const platforms: PlatformFilter[] = ["All Platforms", ...plannerPlatforms];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyForm = {
  title: "",
  caption: "",
  platform: "Instagram" as PlannerPlatform,
  status: "Scheduled" as PlannerStatus,
  type: "Reel" as PlannerType,
  time: "10:00",
};

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatMonthDay(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    month: "short",
    day: "numeric",
    timeZone: "America/Lima",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string) {
  if (!value) return "Sin hora";
  return value.slice(0, 5);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthGrid(currentMonth: Date) {
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startOffset = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index - startOffset + 1);
    return {
      date,
      inCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      key: toDateKey(date),
    };
  });
}

function truncate(text: string, max = 64) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function toTimeFromTimestamp(timestamp: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(timestamp));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
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

function readCommentsMap() {
  try {
    const raw = window.localStorage.getItem(contentPlannerCommentsStorageKey);
    if (!raw) return {} as Record<string, CalendarComment[]>;
    const parsed = JSON.parse(raw) as Record<string, CalendarComment[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {} as Record<string, CalendarComment[]>;
  }
}

export function ContentCalendarDashboard({ instagram }: { instagram: InstagramDashboardData }) {
  const initialMonth = useMemo(() => {
    const firstTimestamp = instagram.allMedia[0]?.timestamp;
    const base = firstTimestamp ? new Date(firstTimestamp) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [instagram.allMedia]);

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>("All Platforms");
  const [accountScope, setAccountScope] = useState<InstagramAccountScope>("all");
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  const [commentsByActivity, setCommentsByActivity] = useState<Record<string, CalendarComment[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [dayForm, setDayForm] = useState(emptyForm);
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    setCurrentMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    setPlannerItems(readPlannerItems());
    setCommentsByActivity(readCommentsMap());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(contentPlannerStorageKey, JSON.stringify(plannerItems));
  }, [plannerItems, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(contentPlannerCommentsStorageKey, JSON.stringify(commentsByActivity));
  }, [commentsByActivity, storageReady]);

  const plannerActivities = useMemo<CalendarActivity[]>(() => {
    return plannerItems.map((item) => ({
      id: item.id,
      source: "planner",
      title: item.title,
      caption: item.caption,
      platform: item.platform,
      status: item.status,
      date: item.scheduledDate,
      time: item.time,
      type: item.type,
    }));
  }, [plannerItems]);

  const publishedActivities = useMemo<CalendarActivity[]>(() => {
    return instagram.allMedia.map((post) => ({
      id: post.id,
      source: "instagram",
      title: truncate(post.caption || "Publicacion de Instagram", 56),
      caption: post.caption,
      platform: "Instagram",
      status: "Published",
      date: post.timestamp.slice(0, 10),
      time: toTimeFromTimestamp(post.timestamp),
      type: post.mediaType,
      permalink: post.permalink,
      likeCount: post.likeCount,
      commentsCount: post.commentsCount,
      engagementRate: post.engagementRate,
      accountKey: post.accountKey,
      accountLabel: post.accountLabel,
    }));
  }, [instagram.allMedia]);

  const filteredActivities = useMemo(() => {
    const merged = [...plannerActivities, ...publishedActivities];
    return merged
      .filter((item) =>
        selectedPlatform === "All Platforms" ? true : item.platform === selectedPlatform
      )
      .filter((item) =>
        accountScope === "all" ? true : item.source === "planner" ? true : item.accountKey === accountScope
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [plannerActivities, publishedActivities, selectedPlatform, accountScope]);

  const monthGrid = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);

  const itemsByDay = useMemo(() => {
    return filteredActivities.reduce<Record<string, CalendarActivity[]>>((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [filteredActivities]);

  const monthKey = `${currentMonth.getFullYear()}-${`${currentMonth.getMonth() + 1}`.padStart(2, "0")}`;
  const visibleMonthItems = filteredActivities.filter((item) => item.date.startsWith(monthKey));
  const scheduledCount = visibleMonthItems.filter((item) => item.status === "Scheduled").length;
  const publishedCount = visibleMonthItems.filter((item) => item.status === "Published").length;
  const daysWithContent = new Set(visibleMonthItems.map((item) => item.date)).size;

  const upcomingItems = visibleMonthItems
    .filter((item) => item.status !== "Published")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6);

  const selectedDayItems = selectedDate ? itemsByDay[selectedDate] || [] : [];
  const selectedDateComments = selectedDate
    ? selectedDayItems.reduce((sum, item) => sum + (commentsByActivity[item.id]?.length ?? 0), 0)
    : 0;

  function goToPreviousMonth() {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  function openDay(dateKey: string) {
    setSelectedDate(dateKey);
    setDayForm((current) => ({
      ...current,
      platform: selectedPlatform === "All Platforms" ? current.platform : selectedPlatform,
    }));
  }

  function closeModal() {
    setSelectedDate(null);
  }

  function handleDayFormChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setDayForm((current) => ({ ...current, [name]: value }));
  }

  function handleAddDayItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDate || !dayForm.title || !dayForm.caption) {
      return;
    }

    const newItem: PlannerItem = {
      id: `planner-${Date.now()}`,
      title: dayForm.title,
      caption: dayForm.caption,
      platform: dayForm.platform,
      status: dayForm.status,
      type: dayForm.type,
      scheduledDate: selectedDate,
      time: dayForm.time,
      createdAt: new Date().toISOString(),
    };

    setPlannerItems((current) => [newItem, ...current]);
    setDayForm((current) => ({ ...emptyForm, platform: current.platform }));
  }

  function addComment(activityId: string) {
    const text = (commentDrafts[activityId] || "").trim();
    if (!text) return;

    setCommentsByActivity((current) => ({
      ...current,
      [activityId]: [
        ...(current[activityId] || []),
        {
          id: `comment-${Date.now()}`,
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    setCommentDrafts((current) => ({ ...current, [activityId]: "" }));
  }

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <main className="flex-1 p-4 pb-8 sm:p-6 lg:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-[2rem] border border-border/80 bg-slate-950/40 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge>Monthly Planning</Badge>
                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Calendario vivo con Instagram real y planificacion editable
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Cada dia puede mezclar publicaciones reales ya publicadas en Instagram con ideas y piezas planeadas que agregas desde el calendario.
                  </p>
                </div>
              </div>

              <Card className="w-full max-w-xl bg-background/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Platform filter</span>
                  </div>
                  <CardTitle className="text-lg">Narrow the calendar</CardTitle>
                  <CardDescription>
                    Publicado real via Instagram, planificado persistido localmente y visible por mes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="calendar-account-scope">
                      Account scope
                    </label>
                    <AccountScopeSelector
                      accounts={instagram.accounts}
                      value={accountScope}
                      onChange={setAccountScope}
                      id="calendar-account-scope"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="platform">
                      Platform
                    </label>
                    <Select
                      id="platform"
                      value={selectedPlatform}
                      onChange={(event) => setSelectedPlatform(event.target.value as PlatformFilter)}
                    >
                      {platforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Visible items</CardDescription>
                <CardTitle className="text-2xl">{visibleMonthItems.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Scheduled items</CardDescription>
                <CardTitle className="text-2xl">{scheduledCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Published posts</CardDescription>
                <CardTitle className="text-2xl">{publishedCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Days with activity</CardDescription>
                <CardTitle className="text-2xl">{daysWithContent}</CardTitle>
              </CardHeader>
            </Card>
          </section>
          <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>{formatMonthLabel(currentMonth)}</CardTitle>
                    <CardDescription>
                      Cada dia tiene boton + para abrir detalle, revisar actividades en acordeon y dejar comentarios.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-4 py-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Monthly view
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {weekdays.map((day) => (
                        <div key={day} className="py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-2">
                      {monthGrid.map((day) => {
                        const dayItems = itemsByDay[day.key] || [];
                        return (
                          <div
                            key={day.key}
                            className={cn(
                              "min-h-36 rounded-2xl border p-3 transition-colors sm:min-h-40",
                              day.inCurrentMonth
                                ? "border-border/70 bg-background/50"
                                : "border-border/40 bg-slate-950/30 text-muted-foreground/60"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                                  day.inCurrentMonth
                                    ? "bg-slate-900/80 text-foreground"
                                    : "bg-slate-900/40 text-muted-foreground"
                                )}
                              >
                                {day.date.getDate()}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => openDay(day.key)}
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-3 space-y-2">
                              {dayItems.slice(0, 3).map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => openDay(day.key)}
                                  className={cn(
                                    "w-full rounded-full border px-2.5 py-1.5 text-left text-[11px] font-medium leading-tight",
                                    platformStyles[item.platform]
                                  )}
                                  title={`${item.title} - ${item.platform} - ${item.status}`}
                                >
                                  <div className="truncate">{item.title}</div>
                                </button>
                              ))}
                              {dayItems.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => openDay(day.key)}
                                  className="w-full rounded-full border border-border/60 bg-slate-900/60 px-2.5 py-1.5 text-[11px] text-muted-foreground"
                                >
                                  +{dayItems.length - 3} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Upcoming schedule</span>
                  </div>
                  <CardTitle>Next planned items</CardTitle>
                  <CardDescription>
                    Lista rapida de piezas planificadas dentro del mes visible.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingItems.length > 0 ? (
                    upcomingItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-border/70 bg-background/50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                  platformStyles[item.platform]
                                )}
                              >
                                {item.platform}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                  statusStyles[item.status]
                                )}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{formatMonthDay(item.date)}</div>
                            <div>{formatTime(item.time)}</div>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">
                      No planned items match the current filter.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Layers3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Live source note</span>
                  </div>
                  <CardTitle>What is real here</CardTitle>
                  <CardDescription>
                    Nada sembrado: posts publicados salen de Instagram y el resto lo escribes tu desde el planner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    Publicado en Instagram: {publishedActivities.filter((item) => accountScope === "all" ? true : item.accountKey === accountScope).length} posts cargados desde la API.
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    Planeacion manual: {plannerItems.length} items persistidos en tu navegador y visibles en este calendario.
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    Comentarios del equipo: {Object.values(commentsByActivity).flat().length} comentarios locales guardados para seguimiento.
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-border/80 bg-slate-950 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.65)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge>Day detail</Badge>
                <h2 className="text-2xl font-semibold text-foreground">{formatMonthDay(selectedDate)}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedDayItems.length} activities and {selectedDateComments} local comments on this day.
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={closeModal} type="button">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
              <Card className="h-fit bg-background/40">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add for this day</span>
                  </div>
                  <CardTitle>Create activity</CardTitle>
                  <CardDescription>
                    Agrega idea, pieza o pendiente directamente sobre esta fecha.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleAddDayItem}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="day-title">
                        Title
                      </label>
                      <Input
                        id="day-title"
                        name="title"
                        value={dayForm.title}
                        onChange={handleDayFormChange}
                        placeholder="Nueva idea o actividad"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="day-caption">
                        Detail
                      </label>
                      <Textarea
                        id="day-caption"
                        name="caption"
                        value={dayForm.caption}
                        onChange={handleDayFormChange}
                        placeholder="Copy, pendiente, aprobacion o contexto"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="day-platform">
                          Platform
                        </label>
                        <Select
                          id="day-platform"
                          name="platform"
                          value={dayForm.platform}
                          onChange={handleDayFormChange}
                        >
                          {plannerPlatforms.map((platform) => (
                            <option key={platform} value={platform}>
                              {platform}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="day-status">
                          Status
                        </label>
                        <Select
                          id="day-status"
                          name="status"
                          value={dayForm.status}
                          onChange={handleDayFormChange}
                        >
                          {plannerStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="day-type">
                          Format
                        </label>
                        <Select id="day-type" name="type" value={dayForm.type} onChange={handleDayFormChange}>
                          {plannerTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="day-time">
                          Time
                        </label>
                        <Input
                          id="day-time"
                          name="time"
                          type="time"
                          value={dayForm.time}
                          onChange={handleDayFormChange}
                        />
                      </div>
                    </div>
                    <Button className="w-full" size="lg" type="submit">
                      Save on {formatMonthDay(selectedDate)}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-background/40">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Accordion detail</span>
                  </div>
                  <CardTitle>Activities for this day</CardTitle>
                  <CardDescription>
                    Revisa detalle, metrica, enlaces y comentarios por actividad.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDayItems.length > 0 ? (
                    selectedDayItems.map((item) => (
                      <details
                        key={item.id}
                        className="group rounded-2xl border border-border/70 bg-background/50 p-4"
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                  platformStyles[item.platform]
                                )}
                              >
                                {item.platform}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                  statusStyles[item.status]
                                )}
                              >
                                {item.status}
                              </span>
                              <span className="rounded-full border border-border/70 bg-slate-950/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                                {item.type}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                            <p className="text-xs text-muted-foreground">{formatTime(item.time)}</p>
                          </div>
                          <span className="text-xs text-muted-foreground group-open:text-foreground">Abrir</span>
                        </summary>

                        <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                          <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-4 text-sm text-muted-foreground">
                            {item.caption || "Sin detalle adicional."}
                          </div>

                          {item.source === "instagram" && (
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-4 text-sm">
                                <p className="text-xs text-muted-foreground">Likes</p>
                                <p className="mt-2 text-base font-semibold text-foreground">{item.likeCount ?? 0}</p>
                              </div>
                              <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-4 text-sm">
                                <p className="text-xs text-muted-foreground">Comments</p>
                                <p className="mt-2 text-base font-semibold text-foreground">{item.commentsCount ?? 0}</p>
                              </div>
                              <div className="rounded-2xl border border-border/60 bg-slate-950/50 p-4 text-sm">
                                <p className="text-xs text-muted-foreground">Engagement</p>
                                <p className="mt-2 text-base font-semibold text-foreground">{item.engagementRate ?? 0}%</p>
                              </div>
                            </div>
                          )}

                          {item.permalink && (
                            <Button asChild variant="outline" size="sm">
                              <a href={item.permalink} rel="noreferrer" target="_blank">
                                Open post
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          <div className="space-y-3 rounded-2xl border border-border/60 bg-slate-950/50 p-4">
                            <p className="text-sm font-medium text-foreground">Comments</p>
                            {(commentsByActivity[item.id] || []).length > 0 ? (
                              <div className="space-y-2">
                                {(commentsByActivity[item.id] || []).map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="rounded-2xl border border-border/50 bg-background/50 p-3 text-sm text-muted-foreground"
                                  >
                                    <p>{comment.text}</p>
                                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                                      {new Date(comment.createdAt).toLocaleString("es-PE")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Todavia no hay comentarios en esta actividad.</p>
                            )}

                            <div className="space-y-2">
                              <Textarea
                                value={commentDrafts[item.id] || ""}
                                onChange={(event) =>
                                  setCommentDrafts((current) => ({
                                    ...current,
                                    [item.id]: event.target.value,
                                  }))
                                }
                                placeholder="Deja un comentario, revision o contexto de seguimiento"
                              />
                              <Button type="button" onClick={() => addComment(item.id)}>
                                Guardar comentario
                              </Button>
                            </div>
                          </div>
                        </div>
                      </details>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">
                      Este dia aun no tiene actividad. Usa el formulario para agregar la primera.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/navigation";

const copy = {
  en: {
    nav: {
      instagramManager: "Instagram Manager",
      analytics: "Analytics",
      contentCalendar: "Content Calendar",
      competitorsTracker: "Competitors Tracker",
      newsConsolidator: "News Consolidator",
    },
    footerTag: "TuCuervo Lab",
    footerText:
      "Production-ready base for demos, meetings, and future multi-platform connections.",
    languageLabel: "Language",
    english: "English",
    spanish: "Spanish",
    menu: "Menu",
    close: "Close",
  },
  es: {
    nav: {
      instagramManager: "Gestor de Instagram",
      analytics: "Analitica",
      contentCalendar: "Calendario de Contenido",
      competitorsTracker: "Tracker de Competidores",
      newsConsolidator: "Consolidador de Noticias",
    },
    footerTag: "TuCuervo Lab",
    footerText: "Base lista para demos, reuniones y futuras conexiones multiplataforma.",
    languageLabel: "Idioma",
    english: "Ingles",
    spanish: "Espanol",
    menu: "Menu",
    close: "Cerrar",
  },
} as const;

function SidebarContent({
  pathname,
  language,
  setLanguage,
  onNavigate,
}: {
  pathname: string;
  language: "en" | "es";
  setLanguage: (language: "en" | "es") => void;
  onNavigate?: () => void;
}) {
  const text = copy[language];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
          <Feather className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">TuCuervo</p>
          <h1 className="text-lg font-semibold tracking-tight">Social Suite</h1>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 min-h-0 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                "h-12 justify-start rounded-2xl px-4 text-sm text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                isActive &&
                  "bg-secondary text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              )}
            >
              <Link href={item.href} onClick={onNavigate}>
                <Icon className="h-4 w-4" />
                {text.nav[item.key]}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="space-y-3 pt-4">
        <div className="rounded-3xl border border-border/80 bg-secondary/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            {text.footerTag}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground/70">{text.footerText}</p>
        </div>

        {/* Toggle de idioma — pill compacto siempre visible */}
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {text.languageLabel}
          </span>
          <div className="flex rounded-xl border border-border/50 bg-background/30 p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={cn(
                "rounded-[10px] px-3 py-1 text-xs font-medium transition-colors",
                language === "en"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={cn(
                "rounded-[10px] px-3 py-1 text-xs font-medium transition-colors",
                language === "es"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { language, setLanguage } = useAppLanguage();
  const text = copy[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const original = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-slate-950/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Feather className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">TuCuervo</p>
              <p className="truncate text-base font-semibold tracking-tight text-foreground">Social Suite</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-2xl"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={text.menu}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            aria-label={text.close}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[22rem] flex-col border-l border-border/80 bg-slate-950 px-4 py-5 shadow-[0_30px_120px_rgba(2,6,23,0.65)]">
            <div className="mb-5 flex items-center justify-between gap-3 px-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                  <Feather className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">TuCuervo</p>
                  <p className="truncate text-base font-semibold tracking-tight text-foreground">Social Suite</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={text.close}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <SidebarContent
              pathname={pathname}
              language={language}
              setLanguage={setLanguage}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <aside className="hidden h-screen sticky top-0 w-full max-w-72 flex-col border-r border-border/80 bg-slate-950/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <SidebarContent pathname={pathname} language={language} setLanguage={setLanguage} />
      </aside>
    </>
  );
}

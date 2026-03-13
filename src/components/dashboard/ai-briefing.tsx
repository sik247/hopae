"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import type { BriefingSections } from "@/app/api/ai/briefing/route"

interface BriefingResponse {
  briefing: string
  sections?: BriefingSections
  generatedAt: string
  isTemplate?: boolean
}

function SourceBadge({ source, sourceUrl }: { source: 'notion' | 'drive' | 'unknown'; sourceUrl?: string | null }) {
  const label = source === 'notion' ? '📝 Notion' : source === 'drive' ? '📁 Drive' : null
  if (!label) return null

  const badge = (
    <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
      {label}
    </span>
  )

  if (sourceUrl) {
    return (
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {badge}
      </a>
    )
  }
  return badge
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

export function AiBriefing() {
  const [data, setData] = useState<BriefingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/ai/briefing")
      .then((res) => res.json())
      .then((json: BriefingResponse) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <CardTitle className="text-base">AI Compliance Briefing</CardTitle>
          </div>
          {data && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {data.isTemplate ? "Auto-generated" : "Gemini"}
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          Live data scraped from Notion API &amp; Google Drive API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[92%]" />
            <Skeleton className="h-3.5 w-[85%]" />
            <Skeleton className="h-3.5 w-[78%]" />
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-foreground">
            Unable to load compliance briefing.
          </p>
        )}

        {data && !loading && (
          <div className="space-y-5">
            {/* AI report */}
            <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
              {data.briefing.split('\n').map((line, i) =>
                line.trim() === '' ? (
                  <div key={i} className="h-1" />
                ) : (
                  <p key={i}>{line}</p>
                )
              )}
            </div>

            {/* Structured sections */}
            {data.sections && (
              <div className="space-y-3 border-t pt-4">

                {/* Urgent */}
                {data.sections.urgent.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="size-3.5 text-red-500" />
                      <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Urgent — {data.sections.urgent.length} {data.sections.urgent.length === 1 ? "country" : "countries"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {data.sections.urgent.map((s) => (
                        <div key={s.countryCode} className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 px-3 py-2.5">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1.5">
                            {countryFlag(s.countryCode)} {s.countryName}
                            <span className="ml-1.5 font-normal text-red-500/70">{s.entityCount} {s.entityCount === 1 ? "entity" : "entities"}</span>
                          </p>
                          <ul className="space-y-1">
                            {s.entities.map((e) => (
                              <li key={e.id} className="flex items-start gap-2 text-xs">
                                {e.sourceUrl ? (
                                  <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="font-medium text-red-600 dark:text-red-400 hover:underline underline-offset-2 leading-snug min-w-0 truncate">
                                    {e.name}
                                  </a>
                                ) : (
                                  <Link href={`/entities/${e.id}`}
                                    className="font-medium text-red-600 dark:text-red-400 hover:underline underline-offset-2 leading-snug min-w-0 truncate">
                                    {e.name}
                                  </Link>
                                )}
                                <SourceBadge source={e.source} sourceUrl={e.sourceUrl} />
                                <span className="text-muted-foreground leading-snug shrink-0">{e.needed}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intermediate */}
                {data.sections.intermediate.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="size-3.5 text-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Intermediate — {data.sections.intermediate.length} {data.sections.intermediate.length === 1 ? "country" : "countries"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {data.sections.intermediate.map((s) => (
                        <div key={s.countryCode} className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2.5">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5">
                            {countryFlag(s.countryCode)} {s.countryName}
                            <span className="ml-1.5 font-normal text-amber-500/70">{s.entityCount} {s.entityCount === 1 ? "entity" : "entities"}</span>
                          </p>
                          <ul className="space-y-1">
                            {s.entities.map((e) => (
                              <li key={e.id} className="flex items-start gap-2 text-xs">
                                {e.sourceUrl ? (
                                  <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="font-medium text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 leading-snug min-w-0 truncate">
                                    {e.name}
                                  </a>
                                ) : (
                                  <Link href={`/entities/${e.id}`}
                                    className="font-medium text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 leading-snug min-w-0 truncate">
                                    {e.name}
                                  </Link>
                                )}
                                <SourceBadge source={e.source} sourceUrl={e.sourceUrl} />
                                <span className="text-muted-foreground leading-snug shrink-0">{e.needed}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Good standing */}
                {data.sections.good.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="size-3.5 text-green-500" />
                      <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                        Good Standing — {data.sections.good.length} {data.sections.good.length === 1 ? "country" : "countries"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.sections.good.map((s) => (
                        <span key={s.countryCode}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {countryFlag(s.countryCode)} {s.countryName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/60">
              {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

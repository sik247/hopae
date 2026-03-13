"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Bot,
  Send,
  Clock,
  AlertTriangle,
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
  Mail,
  Loader2,
  Zap,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
}

const QUICK_ACTIONS = [
  {
    id: "due-7d",
    label: "Due in 7 days",
    icon: Clock,
    prompt: "Show me all filings and requirements that need clearing in the next 7 days, with direct links to their source documents.",
    color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
  },
  {
    id: "overdue",
    label: "Overdue filings",
    icon: AlertTriangle,
    prompt: "List all overdue filings sorted by days overdue, include the entity name, country, requirement type, and direct link to the source document.",
    color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40",
  },
  {
    id: "anomalies",
    label: "Check anomalies",
    icon: Search,
    prompt: "Check for compliance anomalies across all entities. Look for: entities with multiple overdue filings, jurisdictions with clustered deadlines in the same week, entities that are dissolving but still have pending requirements, and any unusual patterns.",
    color: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/40",
  },
  {
    id: "due-30d",
    label: "Next 30 days",
    icon: Clock,
    prompt: "Give me a complete schedule of all compliance deadlines in the next 30 days, grouped by week, with entity links.",
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40",
  },
  {
    id: "notify",
    label: "Send alerts",
    icon: Bell,
    prompt: "I want to send email notifications for all urgent compliance items. What would be included in the alert?",
    color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40",
  },
  {
    id: "status",
    label: "Portfolio status",
    icon: Zap,
    prompt: "Give me a quick portfolio status summary with key risk indicators.",
    color: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/40",
  },
]

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown-to-HTML for tables, bold, links, lists
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []

  function flushTable() {
    if (tableHeaders.length === 0 && tableRows.length === 0) return
    elements.push(
      <div key={`table-${elements.length}`} className="overflow-x-auto my-2">
        <table className="w-full text-xs border-collapse">
          {tableHeaders.length > 0 && (
            <thead>
              <tr className="bg-muted/50">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="px-2 py-1.5 text-left font-semibold border-b">
                    {renderInline(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-muted/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1.5">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableHeaders = []
    tableRows = []
    inTable = false
  }

  function renderInline(text: string): React.ReactNode {
    // Bold
    const parts: React.ReactNode[] = []
    const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      if (match[1]) {
        // Bold
        parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
      } else if (match[3]) {
        // Link
        parts.push(
          <a
            key={match.index}
            href={match[5]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-2 inline-flex items-center gap-0.5"
          >
            {match[4]}
            <ExternalLink className="size-2.5 inline" />
          </a>
        )
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    return parts.length > 0 ? parts : text
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.split("|").filter((_, ci) => ci > 0 && ci < line.split("|").length - 1)

      // Check if separator row
      if (cells.every((c) => /^[\s-:]+$/.test(c))) {
        continue // skip separator
      }

      if (!inTable) {
        inTable = true
        tableHeaders = cells
      } else {
        tableRows.push(cells)
      }
      continue
    }

    if (inTable) flushTable()

    // Headers
    if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="font-semibold text-sm mt-2 mb-1">
          {renderInline(line)}
        </p>
      )
      continue
    }

    // List items
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex items-start gap-1.5 text-xs leading-relaxed ml-1">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
      continue
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />)
      continue
    }

    // Regular text
    elements.push(
      <p key={i} className="text-xs leading-relaxed">
        {renderInline(line)}
      </p>
    )
  }

  if (inTable) flushTable()

  return <div className="space-y-0.5">{elements}</div>
}

function EmailSettings({
  email,
  setEmail,
  onSendNotification,
  isSending,
  lastResult,
}: {
  email: string
  setEmail: (e: string) => void
  onSendNotification: (filter: string) => void
  isSending: boolean
  lastResult: { success: boolean; message: string } | null
}) {
  return (
    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold">Send Compliance Report</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Add one or more emails separated by commas. The report will be sent to everyone listed.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alice@company.com, bob@company.com, cfo@company.com"
          className="flex-1 text-xs border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {email && email.includes("@") && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSendNotification("overdue")}
            disabled={isSending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/40 transition-colors disabled:opacity-50"
          >
            {isSending ? <Loader2 className="size-3 animate-spin" /> : <AlertTriangle className="size-3" />}
            Send overdue alerts
          </button>
          <button
            onClick={() => onSendNotification("due_soon")}
            disabled={isSending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 transition-colors disabled:opacity-50"
          >
            {isSending ? <Loader2 className="size-3 animate-spin" /> : <Clock className="size-3" />}
            Send due soon alerts
          </button>
          <button
            onClick={() => onSendNotification("all")}
            disabled={isSending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950/30 dark:text-slate-400 border border-slate-200 dark:border-slate-900/40 transition-colors disabled:opacity-50"
          >
            {isSending ? <Loader2 className="size-3 animate-spin" /> : <Bell className="size-3" />}
            Send all alerts
          </button>
        </div>
      )}
      {lastResult && (
        <div className={cn(
          "text-[11px] rounded-md px-2 py-1.5",
          lastResult.success
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        )}>
          {lastResult.success ? <CheckCircle2 className="size-3 inline mr-1" /> : <X className="size-3 inline mr-1" />}
          {lastResult.message}
        </div>
      )}
    </div>
  )
}

export function AgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hopae_notification_email") ?? ""
    }
    return ""
  })
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persist email
  useEffect(() => {
    if (email) localStorage.setItem("hopae_notification_email", email)
  }, [email])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: AgentMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    const loadingMessage: AgentMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setInput("")
    setIsLoading(true)
    setIsExpanded(true)

    try {
      const history = messages
        .filter((m) => !m.isLoading)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim(), history }),
      })

      const data = await res.json()

      setMessages((prev) => {
        const updated = [...prev]
        const loadingIdx = updated.findLastIndex((m) => m.isLoading)
        if (loadingIdx >= 0) {
          updated[loadingIdx] = {
            role: "assistant",
            content: data.reply || "I couldn't process that request. Please try again.",
            timestamp: new Date(),
          }
        }
        return updated
      })
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        const loadingIdx = updated.findLastIndex((m) => m.isLoading)
        if (loadingIdx >= 0) {
          updated[loadingIdx] = {
            role: "assistant",
            content: "Connection error. Please check your network and try again.",
            timestamp: new Date(),
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages])

  const handleSendNotification = async (filter: string) => {
    if (!email || !email.includes("@")) return
    setIsSendingEmail(true)
    setEmailResult(null)

    try {
      const res = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, filter }),
      })
      const data = await res.json()

      if (data.sent) {
        setEmailResult({ success: true, message: data.message })
      } else if (data.error) {
        setEmailResult({ success: false, message: data.error })
      } else {
        setEmailResult({ success: true, message: data.message || "No alerts to send." })
      }
    } catch {
      setEmailResult({ success: false, message: "Failed to send email. Check your connection." })
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="size-3.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Compliance Agent</CardTitle>
              <p className="text-[11px] text-muted-foreground">Ask anything about your portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                showSettings ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
              )}
              title="Email notification settings"
            >
              <Settings className="size-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Email settings panel */}
        {showSettings && (
          <EmailSettings
            email={email}
            setEmail={setEmail}
            onSendNotification={handleSendNotification}
            isSending={isSendingEmail}
            lastResult={emailResult}
          />
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all hover:shadow-sm disabled:opacity-50",
                  action.color
                )}
              >
                <Icon className="size-3" />
                {action.label}
              </button>
            )
          })}
        </div>

        {/* Chat messages */}
        {(isExpanded || messages.length === 0) && (
          <div
            className={cn(
              "space-y-3 overflow-y-auto pr-1 transition-all",
              messages.length > 0 ? "max-h-[400px] min-h-[100px]" : "max-h-0"
            )}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground text-xs"
                      : "bg-muted/50 border"
                  )}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Analyzing compliance data...
                    </div>
                  ) : msg.role === "assistant" ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <p className="text-xs">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask about compliance, deadlines, entities..."
            className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="rounded-lg px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

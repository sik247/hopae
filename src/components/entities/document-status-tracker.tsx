"use client"

import { Check, Send, FileEdit } from "lucide-react"

export type DocStatus = "draft" | "sent_for_signature" | "signed"

interface DocumentStatusTrackerProps {
  status: DocStatus
  onStatusChange: (status: DocStatus) => void
}

const steps: { key: DocStatus; label: string; icon: typeof FileEdit }[] = [
  { key: "draft", label: "Draft", icon: FileEdit },
  { key: "sent_for_signature", label: "Sent for Signature", icon: Send },
  { key: "signed", label: "Signed", icon: Check },
]

export function DocumentStatusTracker({
  status,
  onStatusChange,
}: DocumentStatusTrackerProps) {
  const currentIndex = steps.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIndex
        const isCurrent = idx === currentIndex
        const isClickable = idx === currentIndex + 1

        const Icon = step.icon

        return (
          <div key={step.key} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => isClickable && onStatusChange(step.key)}
              disabled={!isClickable}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full ${
                isComplete
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : isCurrent
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ring-2 ring-blue-500/30"
                    : isClickable
                      ? "bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                      : "bg-muted/50 text-muted-foreground/50"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{step.label}</span>
              {isComplete && (
                <Check className="size-3 shrink-0 ml-auto text-green-600" />
              )}
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 shrink-0 ${
                  idx < currentIndex ? "bg-green-500" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

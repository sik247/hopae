import type { IntercompanyAgreement } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface EntityAgreementsProps {
  agreements: IntercompanyAgreement[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatAgreementType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default"
    case "expired":
      return "secondary"
    case "draft":
      return "outline"
    case "terminated":
      return "destructive"
    default:
      return "outline"
  }
}

const statusOrder: Record<string, number> = {
  active: 0,
  draft: 1,
  expired: 2,
  terminated: 3,
}

export function EntityAgreements({ agreements }: EntityAgreementsProps) {
  if (agreements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intercompany Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No intercompany agreements</p>
        </CardContent>
      </Card>
    )
  }

  const sorted = [...agreements].sort((a, b) => {
    const statusDiff =
      (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    const aDate = a.effective_date
      ? new Date(a.effective_date).getTime()
      : 0
    const bDate = b.effective_date
      ? new Date(b.effective_date).getTime()
      : 0
    return bDate - aDate
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Intercompany Agreements</CardTitle>
          <Badge variant="secondary">{agreements.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parties</TableHead>
              <TableHead>Governing Law</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium">
                  {agreement.title}
                </TableCell>
                <TableCell>
                  {formatAgreementType(agreement.agreement_type)}
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <div className="text-xs space-y-0.5">
                    {agreement.parties.map((party, i) => (
                      <div key={i}>
                        {party.name}{" "}
                        <span className="text-muted-foreground">
                          ({party.role})
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{agreement.governing_law ?? "\u2014"}</TableCell>
                <TableCell>{formatDate(agreement.effective_date)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(agreement.status)}>
                    {agreement.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

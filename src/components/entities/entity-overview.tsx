import type { Entity, Jurisdiction, Director } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface EntityOverviewProps {
  entity: Entity & { jurisdiction: Jurisdiction }
  directors: Director[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function isRenewalSoon(renewalDate: string | undefined): boolean {
  if (!renewalDate) return false
  const now = new Date()
  const renewal = new Date(renewalDate)
  const diffMs = renewal.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 30
}

export function EntityOverview({ entity, directors }: EntityOverviewProps) {
  const sortedDirectors = [...directors].sort((a, b) => {
    if (a.is_current !== b.is_current) return a.is_current ? -1 : 1
    const aDate = a.start_date ? new Date(a.start_date).getTime() : 0
    const bDate = b.start_date ? new Date(b.start_date).getTime() : 0
    return bDate - aDate
  })

  const banking = entity.banking_info
  const hasBanking = banking?.bank_name || banking?.account_number || banking?.iban
  const agent = entity.registered_agent
  const hasAgent = agent?.name || agent?.address || agent?.email

  return (
    <div className="space-y-6">
      {/* Directors & Officers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Directors &amp; Officers</CardTitle>
            <Badge variant="secondary">{directors.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sortedDirectors.length === 0 ? (
            <p className="text-muted-foreground">No directors on file</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDirectors.map((director) => (
                  <TableRow key={director.id}>
                    <TableCell className="font-medium">
                      {director.full_name}
                    </TableCell>
                    <TableCell>{director.role}</TableCell>
                    <TableCell>{director.nationality ?? "\u2014"}</TableCell>
                    <TableCell>{formatDate(director.start_date)}</TableCell>
                    <TableCell>
                      {director.is_current ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Former {director.end_date ? `(${formatDate(director.end_date)})` : ""}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
        </CardHeader>
        <CardContent>
          {hasBanking ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              {banking.bank_name && (
                <>
                  <dt className="text-muted-foreground">Bank Name</dt>
                  <dd>{banking.bank_name}</dd>
                </>
              )}
              {banking.iban ? (
                <>
                  <dt className="text-muted-foreground">IBAN</dt>
                  <dd className="font-mono text-sm">{banking.iban}</dd>
                </>
              ) : banking.account_number ? (
                <>
                  <dt className="text-muted-foreground">Account Number</dt>
                  <dd className="font-mono text-sm">{banking.account_number}</dd>
                </>
              ) : null}
              {banking.currency && (
                <>
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd>{banking.currency}</dd>
                </>
              )}
            </dl>
          ) : (
            <p className="text-muted-foreground">No banking details on file</p>
          )}
        </CardContent>
      </Card>

      {/* Registered Agent */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Registered Agent</CardTitle>
            {agent?.renewal_date && isRenewalSoon(agent.renewal_date) && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0">
                Renewal Soon
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasAgent ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              {agent.name && (
                <>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{agent.name}</dd>
                </>
              )}
              {agent.address && (
                <>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd>{agent.address}</dd>
                </>
              )}
              {agent.email && (
                <>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{agent.email}</dd>
                </>
              )}
              {agent.renewal_date && (
                <>
                  <dt className="text-muted-foreground">Renewal Date</dt>
                  <dd>{formatDate(agent.renewal_date)}</dd>
                </>
              )}
            </dl>
          ) : (
            <p className="text-muted-foreground">No registered agent on file</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

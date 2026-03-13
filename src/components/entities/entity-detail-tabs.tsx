"use client"

import type {
  Entity,
  Jurisdiction,
  Director,
  ComplianceRequirement,
  IntercompanyAgreement,
} from "@/lib/db/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EntityOverview } from "@/components/entities/entity-overview"
import { EntityHierarchy } from "@/components/entities/entity-hierarchy"
import { EntityAgreements } from "@/components/entities/entity-agreements"
import { DraftDocumentModal } from "@/components/entities/draft-document-modal"
import { EntityDocuments } from "@/components/entities/entity-documents"
import { NotionPanel } from "@/components/entities/notion-panel"
import { DrivePanel } from "@/components/entities/drive-panel"
import { IntegrationLinksCard } from "@/components/entities/integration-links-card"
import { PIIScanner } from "@/components/entities/pii-scanner"
import type { EntityIntegrationLinks } from "@/lib/db/types"

interface EntityDetailTabsProps {
  entity: Entity & { jurisdiction: Jurisdiction }
  directors: Director[]
  complianceRequirements: ComplianceRequirement[]
  agreements: IntercompanyAgreement[]
  allEntities: Array<{
    id: string
    name: string
    legal_name: string
    entity_type: string
    entity_purpose: string
    status: string
    parent_entity_id: string | null
  }>
}

export function EntityDetailTabs({
  entity,
  directors,
  complianceRequirements,
  agreements,
  allEntities,
}: EntityDetailTabsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DraftDocumentModal entityId={entity.id} entityName={entity.legal_name} />
      </div>
    <Tabs defaultValue="overview">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="agreements">Agreements</TabsTrigger>
        <TabsTrigger value="pii">PII Agent</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="space-y-6">
          <EntityOverview entity={entity} directors={directors} />
          <EntityHierarchy
            entities={allEntities}
            currentEntityId={entity.id}
          />
        </div>
      </TabsContent>

      <TabsContent value="compliance">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Compliance Requirements</CardTitle>
              <Badge variant="secondary">{complianceRequirements.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {complianceRequirements.length === 0 ? (
              <p className="text-muted-foreground">No compliance requirements tracked for this entity.</p>
            ) : (
              <div className="space-y-3">
                {complianceRequirements.map((req) => {
                  const isOverdue = req.status === "overdue"
                  const isInProgress = req.status === "in_progress"
                  const statusColor = isOverdue
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : isInProgress
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    : req.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  const formattedType = req.requirement_type
                    .split("_")
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
                  const dueDate = req.due_date
                    ? new Date(req.due_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "No date"
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{formattedType}</p>
                        <p className="text-xs text-muted-foreground">Due: {dueDate}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                      >
                        {(req.status || "pending").replace("_", " ")}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <EntityDocuments entityId={entity.id} />
      </TabsContent>

      <TabsContent value="agreements">
        <EntityAgreements agreements={agreements} />
      </TabsContent>

      <TabsContent value="pii">
        <PIIScanner entityId={entity.id} entityName={entity.legal_name} />
      </TabsContent>

      <TabsContent value="integrations">
        <div className="space-y-6">
          <IntegrationLinksCard
            entityId={entity.id}
            initialMetadata={(entity.metadata ?? {}) as EntityIntegrationLinks}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NotionPanel entityId={entity.id} entityName={entity.legal_name} />
            <DrivePanel entityId={entity.id} entityName={entity.legal_name} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
    </div>
  )
}

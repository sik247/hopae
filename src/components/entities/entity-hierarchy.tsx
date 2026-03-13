"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HierarchyEntity {
  id: string
  name: string
  legal_name: string
  entity_type: string
  entity_purpose: string
  status: string
  parent_entity_id: string | null
}

interface EntityHierarchyProps {
  entities: HierarchyEntity[]
  currentEntityId: string
}

function TreeNode({
  entity,
  childrenMap,
  currentEntityId,
}: {
  entity: HierarchyEntity
  childrenMap: Map<string | null, HierarchyEntity[]>
  currentEntityId: string
}) {
  const children = childrenMap.get(entity.id) ?? []
  const isCurrent = entity.id === currentEntityId

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "dissolving":
        return "destructive"
      case "dormant":
      case "dissolved":
        return "secondary"
      default:
        return "outline"
    }
  }

  const content = (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        isCurrent
          ? "bg-primary/10 border border-primary font-medium"
          : "hover:bg-muted"
      }`}
    >
      <Building2 className="size-4 shrink-0 text-muted-foreground" />
      <span className={isCurrent ? "text-primary" : ""}>
        {entity.name}
      </span>
      <span className="text-muted-foreground">({entity.entity_type})</span>
      <Badge variant={statusVariant(entity.status)} className="ml-auto text-[10px]">
        {entity.status}
      </Badge>
    </div>
  )

  return (
    <div>
      {isCurrent ? (
        content
      ) : (
        <Link href={`/entities/${entity.id}`}>{content}</Link>
      )}
      {children.length > 0 && (
        <div className="ml-6 border-l-2 border-muted pl-4 space-y-1 mt-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              entity={child}
              childrenMap={childrenMap}
              currentEntityId={currentEntityId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EntityHierarchy({
  entities,
  currentEntityId,
}: EntityHierarchyProps) {
  // Build parent-child map
  const childrenMap = new Map<string | null, HierarchyEntity[]>()
  for (const entity of entities) {
    const parentId = entity.parent_entity_id
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, [])
    }
    childrenMap.get(parentId)!.push(entity)
  }

  // Find root(s) — entities with no parent
  const roots = childrenMap.get(null) ?? []

  if (roots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Corporate Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Hierarchy unavailable</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Corporate Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {roots.map((root) => (
          <TreeNode
            key={root.id}
            entity={root}
            childrenMap={childrenMap}
            currentEntityId={currentEntityId}
          />
        ))}
      </CardContent>
    </Card>
  )
}

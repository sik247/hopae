/**
 * LangGraph-based PII Agent workflow with LangChain structured output.
 *
 * The agent follows a multi-step pipeline:
 *   1. SCAN — detect PII in entity data, directors, and documents (tools)
 *   2. CLASSIFY — LLM classifies ambiguous fields via structured output (Zod schema)
 *   3. ASSESS — evaluate against jurisdiction-specific regulations
 *   4. RECOMMEND — generate actionable remediation steps
 *
 * Uses @langchain/langgraph StateGraph for orchestration,
 * @langchain/google-genai for AI-powered classification,
 * and Zod schemas for typed structured output.
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage, AIMessage, type BaseMessage } from '@langchain/core/messages'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import {
  ALL_PII_TOOLS,
  scanTextForPII,
  scanEntityData,
  scanDirectors,
  assessJurisdictionCompliance,
} from './tools'
import { PIIBatchClassificationSchema } from './schemas'
import type { PIIFinding, PIIScanResult } from './types'

// --- State definition ---
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  entityId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  entityName: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  jurisdiction: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  findings: Annotation<PIIFinding[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  complianceNotes: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  scanResult: Annotation<PIIScanResult | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
})

type AgentStateType = typeof AgentState.State

// --- Build the graph ---
function createPIIGraph() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return createDeterministicGraph()
  }

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey,
    temperature: 0,
  }).bindTools(ALL_PII_TOOLS)

  const toolNode = new ToolNode(ALL_PII_TOOLS)

  // Structured output model for classification step
  const classificationModel = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey,
    temperature: 0,
  }).withStructuredOutput(PIIBatchClassificationSchema)

  const workflow = new StateGraph(AgentState)
    .addNode('agent', async (state: AgentStateType) => {
      const response = await model.invoke(state.messages)
      return { messages: [response] }
    })
    .addNode('tools', toolNode)
    .addNode('classify', async (state: AgentStateType) => {
      // After tool scanning, use structured output to classify ambiguous findings
      const allFindings = collectFindings(state)
      if (allFindings.length === 0) return {}

      const fieldsToClassify = allFindings.map((f) => ({
        fieldPath: f.location,
        value: f.value,
        currentCategory: f.category,
        currentRisk: f.riskLevel,
      }))

      try {
        const result = await classificationModel.invoke([
          new SystemMessage(`You are a PII classification expert. Review these detected PII findings and provide accurate classifications. Jurisdiction: ${state.jurisdiction}`),
          new HumanMessage(`Classify these findings:\n${JSON.stringify(fieldsToClassify, null, 2)}`),
        ])

        // Merge LLM classifications back into findings
        const enrichedFindings: PIIFinding[] = allFindings.map((f) => {
          const match = result.classifications.find((c) => c.fieldPath === f.location)
          if (match && match.classification.isPII) {
            return {
              ...f,
              category: match.classification.category === 'none' ? f.category : match.classification.category as PIIFinding['category'],
              riskLevel: match.classification.riskLevel === 'none' ? f.riskLevel : match.classification.riskLevel as PIIFinding['riskLevel'],
              suggestedAction: match.classification.suggestedAction,
              regulation: match.classification.applicableRegulations[0] ?? f.regulation,
            }
          }
          return f
        })

        return {
          findings: enrichedFindings,
          complianceNotes: result.complianceNotes,
        }
      } catch {
        // If structured output fails, keep original findings
        return {}
      }
    })
    .addNode('compile_results', compileResults)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', (state: AgentStateType) => {
      const lastMessage = state.messages[state.messages.length - 1]
      if (lastMessage && 'tool_calls' in lastMessage && (lastMessage as AIMessage).tool_calls?.length) {
        return 'tools'
      }
      return 'classify'
    })
    .addEdge('tools', 'agent')
    .addEdge('classify', 'compile_results')
    .addEdge('compile_results', END)

  return workflow.compile()
}

// --- Deterministic fallback graph (no LLM needed) ---
function createDeterministicGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode('deterministic_scan', deterministicScan)
    .addNode('compile_results', compileResults)
    .addEdge(START, 'deterministic_scan')
    .addEdge('deterministic_scan', 'compile_results')
    .addEdge('compile_results', END)

  return workflow.compile()
}

// --- Helper: collect findings from tool results in messages ---
function collectFindings(state: AgentStateType): PIIFinding[] {
  const findings: PIIFinding[] = [...state.findings]
  for (const msg of state.messages) {
    if (msg._getType() === 'tool') {
      try {
        const content = typeof msg.content === 'string' ? msg.content : ''
        const parsed = JSON.parse(content)
        if (parsed.findings) findings.push(...parsed.findings)
        if (parsed.enrichedFindings) findings.push(...parsed.enrichedFindings)
      } catch {
        // Not JSON
      }
    }
  }
  // Deduplicate
  const seen = new Set<string>()
  return findings.filter((f) => {
    const key = `${f.value}::${f.location}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// --- Deterministic scan node (runs tools directly without LLM) ---
async function deterministicScan(state: AgentStateType) {
  const findings: PIIFinding[] = []
  const notes: string[] = []

  const inputMsg = state.messages[state.messages.length - 1]
  if (!inputMsg) return { findings: [], complianceNotes: ['No input data provided'] }

  let inputData: { entity?: Record<string, unknown>; directors?: Array<Record<string, unknown>>; documentText?: string }
  try {
    inputData = JSON.parse(typeof inputMsg.content === 'string' ? inputMsg.content : '')
  } catch {
    return { findings: [], complianceNotes: ['Could not parse input data'] }
  }

  if (inputData.entity) {
    const result = await scanEntityData.invoke({ entityJson: JSON.stringify(inputData.entity) })
    const parsed = JSON.parse(result)
    findings.push(...parsed.findings)
  }

  if (inputData.directors?.length) {
    const result = await scanDirectors.invoke({ directorsJson: JSON.stringify(inputData.directors) })
    const parsed = JSON.parse(result)
    findings.push(...parsed.findings)
  }

  if (inputData.documentText) {
    const result = await scanTextForPII.invoke({ text: inputData.documentText, fieldName: 'document_text' })
    const parsed = JSON.parse(result)
    findings.push(...parsed.findings)
  }

  if (state.jurisdiction && findings.length > 0) {
    const result = await assessJurisdictionCompliance.invoke({
      jurisdiction: state.jurisdiction,
      findingsJson: JSON.stringify(findings),
    })
    const parsed = JSON.parse(result)
    notes.push(...parsed.complianceNotes)
    findings.splice(0, findings.length, ...parsed.enrichedFindings)
  }

  return { findings, complianceNotes: notes }
}

// --- Compile results node ---
async function compileResults(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const allFindings = collectFindings(state)
  const allNotes = [...state.complianceNotes]

  // Also collect notes from tool messages
  for (const msg of state.messages) {
    if (msg._getType() === 'tool') {
      try {
        const content = typeof msg.content === 'string' ? msg.content : ''
        const parsed = JSON.parse(content)
        if (parsed.complianceNotes) allNotes.push(...parsed.complianceNotes)
      } catch {
        // skip
      }
    }
  }

  const scanResult: PIIScanResult = {
    entityId: state.entityId,
    entityName: state.entityName,
    findings: allFindings,
    totalFindings: allFindings.length,
    criticalCount: allFindings.filter((f) => f.riskLevel === 'critical').length,
    highCount: allFindings.filter((f) => f.riskLevel === 'high').length,
    mediumCount: allFindings.filter((f) => f.riskLevel === 'medium').length,
    lowCount: allFindings.filter((f) => f.riskLevel === 'low').length,
    scannedAt: new Date().toISOString(),
    scannedFields: [...new Set(allFindings.map((f) => f.location))],
    complianceNotes: [...new Set(allNotes)],
  }

  return { scanResult }
}

// --- Public API ---
export async function runPIIAgent(input: {
  entityId: string
  entityName: string
  jurisdiction: string
  entity: Record<string, unknown>
  directors: Array<Record<string, unknown>>
  documentText?: string
}): Promise<PIIScanResult> {
  const graph = createPIIGraph()

  const systemPrompt = `You are a PII (Personally Identifiable Information) detection agent for a legal entity management platform. Your job is to:

1. Use the scan_entity_data tool to scan the entity's structured data for PII
2. Use the scan_directors tool to scan director records for personal data
3. If document text is provided, use scan_text_for_pii to scan it
4. Use assess_jurisdiction_compliance to evaluate findings against ${input.jurisdiction} regulations
5. Use generate_recommendations to create actionable remediation steps

Be thorough — scan ALL available data. Always assess jurisdiction compliance after scanning.

Entity context: ${input.entityName} (${input.jurisdiction})`

  const userInput = JSON.stringify({
    entity: input.entity,
    directors: input.directors,
    documentText: input.documentText,
  })

  const result = await graph.invoke({
    messages: [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Scan this entity data for PII and assess compliance:\n${userInput}`),
    ],
    entityId: input.entityId,
    entityName: input.entityName,
    jurisdiction: input.jurisdiction,
  })

  return (
    result.scanResult ?? {
      entityId: input.entityId,
      entityName: input.entityName,
      findings: result.findings ?? [],
      totalFindings: result.findings?.length ?? 0,
      criticalCount: result.findings?.filter((f: PIIFinding) => f.riskLevel === 'critical').length ?? 0,
      highCount: result.findings?.filter((f: PIIFinding) => f.riskLevel === 'high').length ?? 0,
      mediumCount: result.findings?.filter((f: PIIFinding) => f.riskLevel === 'medium').length ?? 0,
      lowCount: result.findings?.filter((f: PIIFinding) => f.riskLevel === 'low').length ?? 0,
      scannedAt: new Date().toISOString(),
      scannedFields: [],
      complianceNotes: result.complianceNotes ?? [],
    }
  )
}

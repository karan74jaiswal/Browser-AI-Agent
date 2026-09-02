import { Button } from "@/components/ui/button"
import { useReactFlow, useNodes, useEdges } from "@xyflow/react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import Section from "./section"
import { useState, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useUpstreamConnections } from "../../hooks"
import { extractAllTokenReferences, ConditionCriterion } from "../../lib"
import {
  StepNodeType,
  NodeType,
  NodeDefinition,
  nodeRegistry,
} from "../../nodes/node-registry"
import { NodeIcon } from "../node-icon"
import { TokenInputHandle } from "../token-input"
import { EditableNodeTitle } from "../editable-node-title"
import { useCredentials } from "@/features/credentials/components/credentials-provider"
import DiscordInspector from "./discord-inspector"
import FieldInput from "./field-input"
import GoogleFormTriggerInspector from "./google-form-trigger-inspector"
import IfInspector from "./if-inspector"
import SlackInspector from "./slack-inspector"
import StripeTriggerInspector from "./stripe-trigger-inspector"
import SwitchInspector from "./switch-inspector"
import MergeInspector from "./merge-inspector"
import LoopInspector from "./loop-inspector"

export default function Inspector({
  node,
  workflowId,
}: {
  node: StepNodeType | undefined
  workflowId: string
}) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections(node)
  const allNodes = useNodes<StepNodeType>()
  const allEdges = useEdges()
  const { credentials, openVault } = useCredentials()
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)
  const inputRefs = useRef<Map<string, TokenInputHandle>>(new Map())

  // Structural fingerprint: only changes when node IDs, types, values, or connections change (ignores x, y coordinate dragging)
  const structuralFingerprint = useMemo(() => {
    if (!node?.id) return ""
    const nodesDigest = allNodes
      .map((n) => `${n.id}:${n.data?.type ?? ""}:${n.data?.title ?? ""}`)
      .join("|")
    const edgesDigest = allEdges
      .map((e) => `${e.source}->${e.target}`)
      .join("|")
    const valuesDigest = JSON.stringify(node.data?.values || {})
    return `${node.id}#${valuesDigest}#${nodesDigest}#${edgesDigest}`
  }, [node?.id, node?.data?.values, allNodes, allEdges])

  // Find broken token references in node.data.values
  const { brokenTokens, relinkCandidates } = useMemo(() => {
    if (!node) return { brokenTokens: [], relinkCandidates: [] }

    const targetToSources = new Map<string, string[]>()
    for (const edge of allEdges) {
      if (!edge.source || !edge.target) continue
      const sources = targetToSources.get(edge.target)
      if (sources) {
        sources.push(edge.source)
      } else {
        targetToSources.set(edge.target, [edge.source])
      }
    }

    const ancestors = new Set<string>()
    const queue = [...(targetToSources.get(node.id) || [])]
    while (queue.length > 0) {
      const curr = queue.shift()!
      if (!ancestors.has(curr)) {
        ancestors.add(curr)
        const parents = targetToSources.get(curr) || []
        for (const p of parents) {
          if (!ancestors.has(p)) queue.push(p)
        }
      }
    }

    const nodeById = new Map(allNodes.map((n) => [n.id, n]))
    const broken: {
      raw: string
      nodeId: string
      path: string
      fieldKey: string
    }[] = []

    for (const [fieldKey, rawVal] of Object.entries(node.data.values || {})) {
      if (typeof rawVal !== "string") continue
      const refs = extractAllTokenReferences(rawVal)
      for (const ref of refs) {
        if (
          ref.nodeId !== "secrets" &&
          (!nodeById.has(ref.nodeId) || !ancestors.has(ref.nodeId))
        ) {
          broken.push({
            raw: `{{ ${ref.nodeId}.${ref.path} }}`,
            nodeId: ref.nodeId,
            path: ref.path,
            fieldKey,
          })
        }
      }
    }

    // Upstream nodes that could satisfy these broken tokens
    const candidates: { id: string; title: string; type: NodeType }[] = []
    for (const ancestorId of ancestors) {
      const ancestorNode = nodeById.get(ancestorId)
      if (!ancestorNode) continue
      candidates.push({
        id: ancestorNode.id,
        title: ancestorNode.data?.title || "Step",
        type: ancestorNode.data?.type as NodeType,
      })
    }

    return { brokenTokens: broken, relinkCandidates: candidates }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, structuralFingerprint])

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]
  const insertableFields = def.fields.filter(
    (f) => !f.options || f.options.length === 0
  )

  const handleRelink = (targetNodeId: string, targetTitle: string) => {
    if (!node) return
    const newValues = { ...(node.data.values || {}) }
    let relinkedCount = 0

    for (const b of brokenTokens) {
      const currentVal = newValues[b.fieldKey]
      if (typeof currentVal === "string") {
        const escapedPath = b.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(
          `\\{\\{\\s*${b.nodeId}\\.${escapedPath}\\s*\\}\\}`,
          "g"
        )
        const updated = currentVal.replace(
          regex,
          `{{ ${targetNodeId}.${b.path} }}`
        )
        if (updated !== currentVal) {
          newValues[b.fieldKey] = updated
          relinkedCount++
        }
      }
    }

    updateNodeData(node.id, { values: newValues })
    toast.success(
      `Relinked ${relinkedCount} token${relinkedCount === 1 ? "" : "s"} to ${targetTitle}`
    )
  }

  const handleInsertToken = (token: string) => {
    // 1. If an active input field is focused (standard field or If condition), insert directly into it
    if (activeFieldKey) {
      const handle = inputRefs.current.get(activeFieldKey)
      if (handle) {
        handle.insertToken(token)
        return
      }
    }

    // 2. Fallback for standard nodes: first insertable field
    const targetField =
      insertableFields.find((f) => f.key === activeFieldKey) ??
      insertableFields[0]

    if (targetField) {
      setActiveFieldKey(targetField.key)
      const handle = inputRefs.current.get(targetField.key)
      if (handle) {
        handle.insertToken(token)
      } else {
        const currentVal = values[targetField.key] ?? ""
        const newVal = currentVal ? `${currentVal} ${token}` : token
        updateNodeData(node.id, {
          values: { ...values, [targetField.key]: newVal },
        })
      }
      return
    }

    // 3. Fallback for If node: insert into first condition's left field if none focused
    if (type === "if") {
      try {
        const conditions: ConditionCriterion[] = JSON.parse(
          values.conditions || "[]"
        )
        if (conditions.length > 0) {
          const first = conditions[0]
          const fieldKey = `condition-${first.id}-left`
          setActiveFieldKey(fieldKey)
          const handle = inputRefs.current.get(fieldKey)
          if (handle) {
            handle.insertToken(token)
          } else {
            const next = [
              { ...first, left: first.left ? `${first.left} ${token}` : token },
              ...conditions.slice(1),
            ]
            updateNodeData(node.id, {
              values: { ...values, conditions: JSON.stringify(next) },
            })
          }
        }
      } catch {}
      return
    }

    // 4. Fallback for Loop node: insert into items or condition
    if (type === "loop") {
      const mode = values.mode || "for_each"
      if (mode === "while") {
        try {
          const conditions: ConditionCriterion[] = JSON.parse(
            values.conditions || "[]"
          )
          if (conditions.length > 0) {
            const first = conditions[0]
            setActiveFieldKey("conditions")
            const handle = inputRefs.current.get("conditions")
            if (handle) {
              handle.insertToken(token)
            } else {
              const next = [
                {
                  ...first,
                  left: first.left ? `${first.left} ${token}` : token,
                },
                ...conditions.slice(1),
              ]
              updateNodeData(node.id, {
                values: { ...values, conditions: JSON.stringify(next) },
              })
            }
          }
        } catch {}
      } else {
        setActiveFieldKey("items")
        const handle = inputRefs.current.get("items")
        if (handle) {
          handle.insertToken(token)
        } else {
          const currentVal = values.items ?? ""
          const newVal = currentVal ? `${currentVal} ${token}` : token
          updateNodeData(node.id, {
            values: { ...values, items: newVal },
          })
        }
      }
      return
    }
  }

  const handleInsertSecret = (secretName: string) => {
    if (type === "js-code") {
      handleInsertToken(`process.env.${secretName}`)
    } else if (type === "python-code") {
      handleInsertToken(`os.environ["${secretName}"]`)
    } else {
      handleInsertToken(`{{ secrets.${secretName} }}`)
    }
  }

  const hasConnections =
    connections.length > 0 &&
    (insertableFields.length > 0 ||
      type === "if" ||
      type === "switch" ||
      type === "loop")

  const connectionsFooter =
    hasConnections || credentials.length > 0 ? (
      <div className="flex flex-col gap-2.5 p-2.5">
        {hasConnections && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <Workflow className="size-3.5 text-muted-foreground" />
                <span>Connections</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {connections.length}{" "}
                {connections.length === 1 ? "variable" : "variables"}
              </span>
            </div>
            <div className="flex max-h-24 scrollbar-thin flex-wrap gap-1.5 overflow-y-auto p-0.5">
              {connections.map((conn) => (
                <button
                  key={`${conn.nodeId}-${conn.path}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertToken(conn.token)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground shadow-2xs transition-all hover:border-border/80 hover:bg-accent active:scale-95"
                  title={`Insert {{ ${conn.label} }}`}
                >
                  <NodeIcon
                    type={conn.type}
                    className="size-3.5 shrink-0 rounded-xs [&_svg]:size-2.5"
                  />
                  <span className="max-w-40 truncate text-[11px] font-medium">
                    {conn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {credentials.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border/50 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <Lock className="size-3.5 text-amber-500" />
                <span>Vault Secrets</span>
              </div>
              <button
                type="button"
                onClick={() => openVault()}
                className="cursor-pointer text-[10px] text-muted-foreground underline hover:text-foreground"
              >
                Manage ({credentials.length})
              </button>
            </div>
            <div className="flex max-h-20 scrollbar-thin flex-wrap gap-1.5 overflow-y-auto p-0.5">
              {credentials.map((cred) => (
                <button
                  key={cred.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertSecret(cred.name)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-xs text-foreground shadow-2xs transition-all hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95"
                  title={
                    type === "js-code"
                      ? `Insert process.env.${cred.name}`
                      : type === "python-code"
                        ? `Insert os.environ["${cred.name}"]`
                        : `Insert {{ secrets.${cred.name} }}`
                  }
                >
                  <Lock className="size-3 shrink-0 text-amber-500" />
                  <span className="max-w-36 truncate font-mono text-[11px] font-medium">
                    {cred.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : undefined

  return (
    <Section
      title={
        <EditableNodeTitle
          nodeId={node.id}
          title={title}
          type={type}
          textClassName="text-xs md:text-sm hover:cursor-text"
        />
      }
      icon={<NodeIcon type={type} />}
      footer={connectionsFooter}
    >
      <div className="flex flex-col gap-3 p-3">
        {def.requiredSecrets && def.requiredSecrets.length > 0 && (
          <div className="flex flex-col gap-2">
            {def.requiredSecrets.map((req) => {
              const matchingCred = credentials.find(
                (c) => c.name.toUpperCase() === req.key.toUpperCase()
              )

              if (matchingCred) {
                return (
                  <div
                    key={req.key}
                    className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {req.label}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Connected (••••{matchingCred.lastFour})
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => openVault({ prefillName: req.key })}
                    >
                      Manage
                    </Button>
                  </div>
                )
              }

              return (
                <div
                  key={req.key}
                  className="flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs"
                >
                  <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Missing Credential: {req.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {req.description ||
                      `This node requires "${req.key}" in your organization's Credential Vault to execute.`}
                  </p>
                  <Button
                    size="sm"
                    className="h-7 w-fit gap-1.5 bg-amber-600 text-xs text-white shadow-2xs hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950"
                    onClick={() => openVault({ prefillName: req.key })}
                  >
                    <Plus className="size-3" />
                    Add {req.key} to Vault
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {brokenTokens.length > 0 && relinkCandidates.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>
                {brokenTokens.length} broken{" "}
                {brokenTokens.length === 1 ? "token" : "tokens"} detected
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Found variables referencing a deleted or replaced step. Relink
              them to your connected steps:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {relinkCandidates.map((candidate) => (
                <Button
                  key={candidate.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleRelink(candidate.id, candidate.title)}
                  className="h-6 cursor-pointer gap-1 bg-background/80 px-2 text-[11px] hover:bg-background hover:text-foreground"
                >
                  <Sparkles className="size-3 text-amber-500" />
                  <span>Relink to {candidate.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => {
            const isInsertable = !field.options || field.options.length === 0
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                  {field.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <FieldInput
                  field={field}
                  value={values[field.key] ?? ""}
                  nodeId={node.id}
                  inputRef={
                    isInsertable
                      ? (handle) => {
                          if (handle) {
                            inputRefs.current.set(field.key, handle)
                          } else {
                            inputRefs.current.delete(field.key)
                          }
                        }
                      : undefined
                  }
                  onFocus={
                    isInsertable
                      ? () => setActiveFieldKey(field.key)
                      : undefined
                  }
                  onChange={(value) => {
                    if (isInsertable) {
                      setActiveFieldKey(field.key)
                    }
                    updateNodeData(node.id, {
                      values: { ...values, [field.key]: value },
                    })
                  }}
                />
              </div>
            )
          })
        )}

        {type === "google-form-trigger" && (
          <GoogleFormTriggerInspector node={node} workflowId={workflowId} />
        )}

        {type === "stripe-trigger" && (
          <StripeTriggerInspector node={node} workflowId={workflowId} />
        )}

        {type === "discord" && <DiscordInspector />}

        {type === "slack" && <SlackInspector />}

        {type === "if" && (
          <IfInspector
            node={node}
            onFocusField={setActiveFieldKey}
            registerInputRef={(key, handle) => {
              if (handle) {
                inputRefs.current.set(key, handle)
              } else {
                inputRefs.current.delete(key)
              }
            }}
          />
        )}

        {type === "switch" && (
          <SwitchInspector
            node={node}
            onFocusField={setActiveFieldKey}
            registerInputRef={(key, handle) => {
              if (handle) {
                inputRefs.current.set(key, handle)
              } else {
                inputRefs.current.delete(key)
              }
            }}
          />
        )}

        {type === "merge" && <MergeInspector />}
        {type === "loop" && (
          <LoopInspector
            node={node}
            onFocusField={setActiveFieldKey}
            registerInputRef={(key, handle) => {
              if (handle) {
                inputRefs.current.set(key, handle)
              } else {
                inputRefs.current.delete(key)
              }
            }}
          />
        )}
      </div>
    </Section>
  )
}

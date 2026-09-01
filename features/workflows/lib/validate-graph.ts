import toposort from "toposort"
import { WorkflowGraph } from "@/lib/db"
import { extractAllTokenReferences } from "./parse-token-reference"
import { getNodeDefinition } from "../nodes/node-registry"

export function validateGraph(
  { edges, nodes }: WorkflowGraph,
  availableSecretKeys?: string[]
): string[] {
  const problems: string[] = []
  const triggerNodes = nodes.filter(
    (node) => node.data.kind == "trigger"
  ).length

  if (nodes.length == 0)
    problems.push("A workflow needs one or more nodes to run")
  if (triggerNodes !== 1)
    problems.push(
      `A workflow needs exactly one trigger, found (${triggerNodes}).`
    )
  if (edges.length == 0) problems.push("Connect your nodes before running")
  else {
    try {
      toposort(edges.map((e) => [e.source, e.target]))
    } catch {
      problems.push("Workflow has a cycle, remove the loop before running")
    }
  }

  // Check for disconnected or deleted token references
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const targetToSources = new Map<string, string[]>()
  for (const edge of edges) {
    if (!edge.source || !edge.target) continue
    const sources = targetToSources.get(edge.target)
    if (sources) {
      sources.push(edge.source)
    } else {
      targetToSources.set(edge.target, [edge.source])
    }
  }

  const getAncestorNodeIds = (startNodeId: string): Set<string> => {
    const ancestors = new Set<string>()
    const queue = [...(targetToSources.get(startNodeId) || [])]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (!ancestors.has(current)) {
        ancestors.add(current)
        const parents = targetToSources.get(current) || []
        for (const p of parents) {
          if (!ancestors.has(p)) queue.push(p)
        }
      }
    }
    return ancestors
  }

  const upperSecretKeys = availableSecretKeys
    ? new Set(availableSecretKeys.map((k) => k.toUpperCase()))
    : null

  for (const node of nodes) {
    const values = node.data?.values ?? {}
    const def = getNodeDefinition(node.data?.type)
    const ancestors = getAncestorNodeIds(node.id)

    // Check required integration secrets on the node manifest
    if (def?.requiredSecrets && upperSecretKeys) {
      for (const req of def.requiredSecrets) {
        if (!req.optional && !upperSecretKeys.has(req.key.toUpperCase())) {
          problems.push(`${req.key} is not present in credentials vault.`)
        }
      }
    }

    const checkTokenRef = (
      ref: { nodeId: string; path: string },
      contextLabel: string
    ) => {
      const lowerNodeId = (ref.nodeId || "").toLowerCase().trim()
      if (
        lowerNodeId === "secrets" ||
        lowerNodeId === "vault" ||
        lowerNodeId === "secret"
      ) {
        if (upperSecretKeys && !upperSecretKeys.has(ref.path.toUpperCase())) {
          problems.push(`${ref.path} is not present in credentials vault.`)
        }
        return
      }

      const sourceNode = nodeById.get(ref.nodeId)
      if (!sourceNode) {
        problems.push(`${contextLabel} references a deleted step.`)
      } else if (!ancestors.has(ref.nodeId)) {
        problems.push(
          `${contextLabel} references "${sourceNode.data?.title || "Step"}", but they are not connected.`
        )
      }
    }

    for (const [key, rawVal] of Object.entries(values)) {
      if (node.data?.type === "if" && key === "conditions") continue
      if (
        node.data?.type === "switch" &&
        (key === "rules" || key === "cases")
      )
        continue
      if (typeof rawVal !== "string") continue
      const refs = extractAllTokenReferences(rawVal)
      for (const ref of refs) {
        checkTokenRef(ref, `"${node.data?.title || "Step"}"`)
      }
    }

    if (node.data?.type === "if") {
      try {
        if (values.conditions) {
          const criteria = JSON.parse(values.conditions)
          if (Array.isArray(criteria)) {
            for (let i = 0; i < criteria.length; i++) {
              const criterion = criteria[i]
              if (!criterion.left?.trim()) {
                problems.push(
                  `Condition ${i + 1} on "${node.data?.title || "If"}" is missing a left value/token.`
                )
              }

              const fieldValues = [criterion.left, criterion.right].filter(
                (v): v is string => typeof v === "string" && v.length > 0
              )
              for (const fieldVal of fieldValues) {
                const refs = extractAllTokenReferences(fieldVal)
                for (const ref of refs) {
                  checkTokenRef(
                    ref,
                    `Condition ${i + 1} on "${node.data?.title || "If"}"`
                  )
                }
              }
            }
          }
        }
      } catch {}
    }

    if (node.data?.type === "switch") {
      const mode = values.mode || "rules"
      if (mode === "value") {
        try {
          if (values.cases) {
            const cases = JSON.parse(values.cases)
            if (Array.isArray(cases)) {
              for (let i = 0; i < cases.length; i++) {
                const c = cases[i]
                if (c.value) {
                  const refs = extractAllTokenReferences(c.value)
                  for (const ref of refs) {
                    checkTokenRef(
                      ref,
                      `Case ${i + 1} on "${node.data?.title || "Switch"}"`
                    )
                  }
                }
              }
            }
          }
        } catch {}
      } else {
        try {
          if (values.rules) {
            const routes = JSON.parse(values.rules)
            if (Array.isArray(routes)) {
              for (let i = 0; i < routes.length; i++) {
                const route = routes[i]
                const criteria = route.conditions || []
                for (let j = 0; j < criteria.length; j++) {
                  const criterion = criteria[j]
                  if (!criterion.left?.trim()) {
                    problems.push(
                      `Route ${i + 1} Rule ${j + 1} on "${node.data?.title || "Switch"}" is missing a left value/token.`
                    )
                  }
                  const fieldValues = [criterion.left, criterion.right].filter(
                    (v): v is string => typeof v === "string" && v.length > 0
                  )
                  for (const fieldVal of fieldValues) {
                    const refs = extractAllTokenReferences(fieldVal)
                    for (const ref of refs) {
                      checkTokenRef(
                        ref,
                        `Route ${i + 1} on "${node.data?.title || "Switch"}"`
                      )
                    }
                  }
                }
              }
            }
          }
        } catch {}
      }
    }
  }

  return problems
}

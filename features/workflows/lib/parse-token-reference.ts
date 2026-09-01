export type TokenReference = {
  nodeId: string
  path: string
}

/**
 * Checks if a string is a single connection placeholder reference, e.g. `{{ nodeId.path }}`
 * or `{{ nodeId.items[0].name }}`, and parses out the target `nodeId` and `path`.
 *
 * Returns `null` if the string is empty, not a token, or contains mixed text.
 */
export function parseTokenReference(value: string): TokenReference | null {
  if (!value || typeof value !== "string") return null
  const match = value.trim().match(/^\{\{\s*([^}]+?)\s*\}\}$/)
  if (!match) return null

  const inner = match[1].trim()
  const dotIndex = inner.indexOf(".")
  if (dotIndex === -1) {
    return { nodeId: inner, path: "" }
  }

  return {
    nodeId: inner.slice(0, dotIndex).trim(),
    path: inner.slice(dotIndex + 1).trim(),
  }
}

/**
 * Extracts all token references from a string containing one or more placeholders.
 */
export function extractAllTokenReferences(template: string): TokenReference[] {
  if (!template || typeof template !== "string") return []
  const regex = /\{\{\s*([\s\S]*?)\s*\}\}/g
  const results: TokenReference[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    const inner = match[1].trim()
    const dotIndex = inner.indexOf(".")
    const nodeId = dotIndex === -1 ? inner : inner.slice(0, dotIndex).trim()
    const path = dotIndex === -1 ? "" : inner.slice(dotIndex + 1).trim()
    if (nodeId) {
      results.push({ nodeId, path })
    }
  }

  return results
}

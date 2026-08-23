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

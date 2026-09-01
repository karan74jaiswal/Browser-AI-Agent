/**
 * Retrieves a nested value from an object given a dot or bracket path.
 *
 * Supports:
 * - Dot notation: `nodeId.title`, `a.b.c`
 * - Array/bracket index notation: `nodeId.items[0].name`, `nodeId.matrix[0][1]`
 * - Bracket quoted keys: `nodeId['key-name'].title`, `nodeId["key-name"]`
 *
 * Returns `undefined` if the path cannot be resolved or if any intermediate
 * property is nullish / non-existent.
 */
export function getByPath(target: unknown, path: string): unknown {
  if (target == null || typeof target !== "object") {
    return undefined
  }

  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return undefined
  }

  // Tokenize path:
  // 1) [ 'key' ] or [ "key" ] -> quoted bracket key
  // 2) [ key ] / [ 0 ]        -> unquoted bracket key or numeric index
  // 3) key                    -> dot-separated or bare identifier
  const segments: string[] = []
  const tokenRegex = /\[(?:'([^']*)'|"([^"]*)"|([^\]]+))\]|([^.[\]]+)/g
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(trimmedPath)) !== null) {
    const key = match[1] ?? match[2] ?? match[3] ?? match[4]
    if (key !== undefined) {
      segments.push(key.trim())
    }
  }

  if (segments.length === 0) {
    return undefined
  }

  let current: unknown = target
  for (const segment of segments) {
    if (current == null || typeof current !== "object") {
      return undefined
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

/**
 * Formats a resolved value for interpolation:
 * - `undefined` and `null` resolve to `""`
 * - Objects (including arrays and plain objects) resolve to JSON strings
 * - Strings resolve to their raw string value
 * - Numbers, booleans, and other primitives resolve to string representations
 */
function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return ""
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return ""
    }
  }
  if (typeof value === "string") {
    return value
  }
  return String(value)
}

/**
 * Pure helper that takes a template string containing placeholders (e.g. `{{ someNodeId.title }}`
 * or `{{ someNodeId.items[0].name }}`) and a collection of node outputs keyed by node ID,
 * returning the string with each placeholder replaced by the resolved value.
 *
 * - If a placeholder resolves to nothing (`undefined` or `null`), it is replaced with an empty string `""`.
 * - If a placeholder resolves to an object or array, it is replaced with its JSON string representation.
 * - Primitive values are converted to their string representations.
 *
 * @param template - The field's text / template string containing placeholders.
 * @param context - Collection of node outputs keyed by node ID.
 * @returns The interpolated text.
 */
export function interpolate(
  template: string,
  context: Record<string, unknown>
): string {
  if (!template || typeof template !== "string") {
    return template ?? ""
  }

  const sanitizedTemplate = template.replace(/[\u200B\uFEFF]/g, "")

  return sanitizedTemplate.replace(
    /\{\{\s*([\s\S]*?)\s*\}\}/g,
    (_, path: string) => {
      const value = getByPath(context, path)
      return formatValue(value)
    }
  )
}

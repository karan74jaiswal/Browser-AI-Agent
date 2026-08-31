export interface LoopWarning {
  message: string
  line?: number
  snippet?: string
  severity: "warning" | "error"
}

/**
 * Strips comments and string literals so regex/AST checks aren't tricked by text inside strings or comments.
 */
function stripCommentsAndStrings(code: string, language: "javascript" | "python"): string {
  if (language === "javascript") {
    // Strip multi-line comments /* ... */
    let clean = code.replace(/\/\*[\s\S]*?\*\//g, (match) => " ".repeat(match.length))
    // Strip single-line comments // ...
    clean = clean.replace(/\/\/.*$/gm, (match) => " ".repeat(match.length))
    // Strip template literals `...`
    clean = clean.replace(/`[\s\S]*?`/g, (match) => `"${" ".repeat(Math.max(0, match.length - 2))}"`)
    // Strip double and single quoted strings
    clean = clean.replace(/"(?:[^"\\]|\\.)*"/g, (match) => `"${" ".repeat(Math.max(0, match.length - 2))}"`)
    clean = clean.replace(/'(?:[^'\\]|\\.)*'/g, (match) => `'${" ".repeat(Math.max(0, match.length - 2))}'`)
    return clean
  } else {
    // Python comments # ...
    let clean = code.replace(/#.*$/gm, (match) => " ".repeat(match.length))
    // Python triple-quoted strings
    clean = clean.replace(/"""[\s\S]*?"""/g, (match) => `"""${" ".repeat(Math.max(0, match.length - 6))}"""`)
    clean = clean.replace(/'''[\s\S]*?'''/g, (match) => `'''${" ".repeat(Math.max(0, match.length - 6))}'''`)
    // Single / double quoted strings
    clean = clean.replace(/"(?:[^"\\]|\\.)*"/g, (match) => `"${" ".repeat(Math.max(0, match.length - 2))}"`)
    clean = clean.replace(/'(?:[^'\\]|\\.)*'/g, (match) => `'${" ".repeat(Math.max(0, match.length - 2))}'`)
    return clean
  }
}

/**
 * Extracts a block delimited by matching braces { ... } starting from an opening brace index.
 */
function extractBraceBlock(code: string, openBraceIndex: number): string {
  let depth = 0
  for (let i = openBraceIndex; i < code.length; i++) {
    if (code[i] === "{") depth++
    else if (code[i] === "}") {
      depth--
      if (depth === 0) {
        return code.slice(openBraceIndex + 1, i)
      }
    }
  }
  return code.slice(openBraceIndex + 1)
}

/**
 * Extracts a Python block indented under a `while ...:` statement.
 */
function extractPythonIndentedBlock(lines: string[], startLineIndex: number): string {
  if (startLineIndex >= lines.length) return ""
  const headerLine = lines[startLineIndex]
  const baseIndent = headerLine.search(/\S/)
  const blockLines: string[] = []

  for (let i = startLineIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") continue
    const indent = line.search(/\S/)
    if (indent > baseIndent) {
      blockLines.push(line)
    } else {
      break
    }
  }

  return blockLines.join("\n")
}

/**
 * Checks if a code block contains an exit statement (break, return, throw/raise).
 */
function hasExitStatement(body: string, language: "javascript" | "python"): boolean {
  if (language === "javascript") {
    return /\b(break|return|throw|process\.exit)\b/.test(body)
  } else {
    return /\b(break|return|raise|sys\.exit|exit)\b/.test(body)
  }
}

/**
 * Checks if a variable name is mutated or reassigned inside a block.
 */
function isVariableMutated(varName: string, body: string, language: "javascript" | "python"): boolean {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (language === "javascript") {
    // e.g. i++, ++i, i--, --i, i +=, i -=, i *=, i /=, i =
    const mutationRegex = new RegExp(
      `(\\b${escaped}\\s*(\\+\\+|--|\\+=|-=|\\*=|\\/=|%=|&&=|\\|\\|=|\\?\\?=|=(?!=)))|((?:\\+\\+|--)\\s*${escaped}\\b)`,
      "g"
    )
    return mutationRegex.test(body)
  } else {
    // e.g. i +=, i -=, i =, i *=, i //=
    const mutationRegex = new RegExp(
      `\\b${escaped}\\s*(\\+=|-=|\\*=|\\/=|%=|\\/\\/=|=(?!=))`,
      "g"
    )
    return mutationRegex.test(body)
  }
}

/**
 * Statically detects potential infinite loops in JavaScript or Python code.
 */
export function detectPotentialInfiniteLoops(
  code: string,
  language: "javascript" | "python"
): LoopWarning[] {
  if (!code || !code.trim()) return []

  const warnings: LoopWarning[] = []
  const cleanCode = stripCommentsAndStrings(code, language)
  const lines = cleanCode.split("\n")

  if (language === "javascript") {
    // 1. Unbounded `while (true)` / `while (1)` / `while (!0)`
    const whileTrueRegex = /\bwhile\s*\(\s*(true|1|!0|true\s*===?\s*true)\s*\)\s*\{/g
    let match: RegExpExecArray | null

    while ((match = whileTrueRegex.exec(cleanCode)) !== null) {
      const openBraceIdx = match.index + match[0].length - 1
      const body = extractBraceBlock(cleanCode, openBraceIdx)
      if (!hasExitStatement(body, "javascript")) {
        const lineNum = cleanCode.slice(0, match.index).split("\n").length
        warnings.push({
          message: `Unbounded \`while (${match[1]})\` loop detected without a \`break\`, \`return\`, or exit condition.`,
          line: lineNum,
          snippet: `while (${match[1]}) { ... }`,
          severity: "warning",
        })
      }
    }

    // 2. Unbounded `for (;;)` or `for (; true;)`
    const forTrueRegex = /\bfor\s*\(\s*[^;]*;\s*(true|1|!0|)\s*;[^)]*\)\s*\{/g
    while ((match = forTrueRegex.exec(cleanCode)) !== null) {
      const openBraceIdx = match.index + match[0].length - 1
      const body = extractBraceBlock(cleanCode, openBraceIdx)
      if (!hasExitStatement(body, "javascript")) {
        const lineNum = cleanCode.slice(0, match.index).split("\n").length
        warnings.push({
          message: `Unbounded \`for (;;)\` loop detected without a \`break\` or exit condition.`,
          line: lineNum,
          snippet: `for (;;) { ... }`,
          severity: "warning",
        })
      }
    }

    // 3. Simple invariant counter while loop: `while (i < N)` or `while (count > 0)` where var is never modified
    const simpleWhileRegex = /\bwhile\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(<|<=|>|>=|!==|!=)\s*([0-9a-zA-Z_$]+)\s*\)\s*\{/g
    while ((match = simpleWhileRegex.exec(cleanCode)) !== null) {
      const varName = match[1]
      const openBraceIdx = match.index + match[0].length - 1
      const body = extractBraceBlock(cleanCode, openBraceIdx)

      if (!hasExitStatement(body, "javascript") && !isVariableMutated(varName, body, "javascript")) {
        const lineNum = cleanCode.slice(0, match.index).split("\n").length
        warnings.push({
          message: `Loop condition variable \`${varName}\` is never updated or reassigned inside the \`while\` loop body.`,
          line: lineNum,
          snippet: `while (${varName} ${match[2]} ${match[3]})`,
          severity: "warning",
        })
      }
    }

    // 4. Empty while/for statement: `while (true);`
    const emptyWhileRegex = /\bwhile\s*\(\s*(true|1|!0)\s*\)\s*;/g
    while ((match = emptyWhileRegex.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.slice(0, match.index).split("\n").length
      warnings.push({
        message: `Empty infinite loop \`while (${match[1]});\` will freeze execution.`,
        line: lineNum,
        snippet: `while (${match[1]});`,
        severity: "error",
      })
    }
  } else {
    // PYTHON CHECKS
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // 1. Unbounded `while True:` or `while 1:`
      const pythonWhileTrueMatch = trimmed.match(/^while\s+(True|1|\(True\)|\(1\))\s*:/)
      if (pythonWhileTrueMatch) {
        const body = extractPythonIndentedBlock(lines, i)
        if (!hasExitStatement(body, "python")) {
          warnings.push({
            message: `Unbounded \`while ${pythonWhileTrueMatch[1]}:\` loop detected without a \`break\` or \`return\`.`,
            line: i + 1,
            snippet: `while ${pythonWhileTrueMatch[1]}:`,
            severity: "warning",
          })
        }
      }

      // 2. Simple invariant counter while loop in Python: `while i < N:`
      const pythonWhileVarMatch = trimmed.match(/^while\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(<|<=|>|>=|!=|==)\s*([0-9a-zA-Z_]+)\s*:/)
      if (pythonWhileVarMatch) {
        const varName = pythonWhileVarMatch[1]
        const body = extractPythonIndentedBlock(lines, i)

        if (!hasExitStatement(body, "python") && !isVariableMutated(varName, body, "python")) {
          warnings.push({
            message: `Loop condition variable \`${varName}\` is never updated or reassigned inside the \`while\` loop.`,
            line: i + 1,
            snippet: `while ${varName} ${pythonWhileVarMatch[2]} ${pythonWhileVarMatch[3]}:`,
            severity: "warning",
          })
        }
      }

      // 3. Single-line infinite loop: `while True: pass`
      const singleLineWhile = trimmed.match(/^while\s+(True|1)\s*:\s*(pass|\.\.\.)\s*$/)
      if (singleLineWhile) {
        warnings.push({
          message: `Empty infinite loop \`while ${singleLineWhile[1]}: pass\` will freeze execution.`,
          line: i + 1,
          snippet: trimmed,
          severity: "error",
        })
      }
    }
  }

  return warnings
}

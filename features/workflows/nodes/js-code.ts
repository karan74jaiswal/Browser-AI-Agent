import { Sandbox } from "@e2b/code-interpreter"

export interface ExecuteJsCodeParams {
  code: string
  apiKey?: string
  timeoutMs?: number
  envs?: Record<string, string>
}

export interface CodeExecutionOutput {
  result: unknown
  stdout: string
  stderr: string
}

/**
 * Prepares JavaScript/TypeScript code for execution in E2B.
 * If the user wrote a top-level `return` statement, wraps the body in an async IIFE
 * while keeping top-level ES imports at the root of the module.
 */
export function prepareJsCode(code: string): string {
  const clean = code.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  if (!clean) return ""

  const hasReturn = /\breturn\b/.test(clean)
  if (!hasReturn) {
    return clean
  }

  const lines = clean.split("\n")
  const importLines: string[] = []
  const bodyLines: string[] = []

  let inMultiLineImport = false
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (inMultiLineImport) {
      importLines.push(line)
      if (trimmedLine.includes(";")) {
        inMultiLineImport = false
      }
    } else if (
      trimmedLine.startsWith("import ") ||
      trimmedLine.startsWith("import{") ||
      trimmedLine.startsWith("import type ") ||
      trimmedLine.startsWith("import*")
    ) {
      importLines.push(line)
      if (!trimmedLine.includes(";")) {
        inMultiLineImport = true
      }
    } else {
      bodyLines.push(line)
    }
  }

  const importsStr = importLines.length > 0 ? importLines.join("\n") + "\n\n" : ""
  const bodyStr = bodyLines.join("\n")

  return `${importsStr}await (async () => {\n${bodyStr}\n})()`
}

/**
 * Formats execution errors into clear, user-friendly messages without internal SDK option hints.
 */
export function formatJsExecutionError(
  err: { name?: string; value?: string; traceback?: string } | Error | unknown
): Error {
  let name = ""
  let value = ""
  let traceback = ""

  if (err && typeof err === "object" && "name" in err && "value" in err) {
    const errorObj = err as { name?: string; value?: string; traceback?: string }
    name = errorObj.name || "Error"
    value = errorObj.value || ""
    traceback = errorObj.traceback || ""
  } else if (err instanceof Error) {
    name = err.name
    value = err.message
    traceback = err.stack || ""
  } else {
    value = String(err)
  }

  // Handle timeout errors cleanly
  if (
    value.includes("Execution timed out") ||
    value.includes("timeoutMs") ||
    value.toLowerCase().includes("timed out") ||
    name.toLowerCase().includes("timeout")
  ) {
    return new Error(
      "JavaScript Execution Timed Out: The script took too long to complete. Please check your code for infinite loops or unresolved asynchronous operations."
    )
  }

  let extraHint = ""
  if (name === "ReferenceError" || value.includes("is not defined")) {
    extraHint =
      "\n\n💡 Tip: To access Organization Vault secrets in JavaScript, use process.env.YOUR_SECRET_NAME or wrap tokens in quotes."
  }

  const details = `${name}: ${value}${traceback ? `\n${traceback}` : ""}${extraHint}`
  return new Error(`JavaScript Execution Error: ${details}`)
}

export async function executeJsCode({
  code,
  apiKey,
  timeoutMs = 60_000,
  envs,
}: ExecuteJsCodeParams): Promise<CodeExecutionOutput> {
  if (!code || !code.trim()) {
    throw new Error("JavaScript Code node: Code is required")
  }

  const cleanCode = prepareJsCode(code)
  const effectiveApiKey = apiKey || process.env.E2B_API_KEY

  if (!effectiveApiKey) {
    throw new Error(
      "JavaScript Code node: E2B_API_KEY is not configured. Please set E2B_API_KEY in your environment variables."
    )
  }

  let sandbox: Sandbox | undefined
  try {
    sandbox = await Sandbox.create({
      apiKey: effectiveApiKey,
      timeoutMs,
      envs,
    })

    let execution: Awaited<ReturnType<typeof sandbox.runCode>>
    try {
      execution = await sandbox.runCode(cleanCode, {
        language: "js",
        envs,
      })
    } catch (runErr) {
      throw formatJsExecutionError(runErr)
    }

    const stdout = execution.logs.stdout.join("\n")
    const stderr = execution.logs.stderr.join("\n")

    if (execution.error) {
      throw formatJsExecutionError(execution.error)
    }

    let result: unknown = null
    if (execution.results && execution.results.length > 0) {
      const first = execution.results[0]
      if (first.text) {
        try {
          result = JSON.parse(first.text)
        } catch {
          result = first.text
        }
      } else {
        result = first.data ?? first.text ?? null
      }
    } else if (stdout) {
      try {
        result = JSON.parse(stdout)
      } catch {
        result = stdout
      }
    }

    return {
      result,
      stdout,
      stderr,
    }
  } finally {
    if (sandbox) {
      await sandbox.kill().catch(() => {})
    }
  }
}

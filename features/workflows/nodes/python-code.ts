import { Sandbox } from "@e2b/code-interpreter"

export interface ExecutePythonCodeParams {
  code: string
  apiKey?: string
  timeoutMs?: number
}

export interface CodeExecutionOutput {
  result: unknown
  stdout: string
  stderr: string
}

/**
 * Prepares Python code for execution in E2B.
 * If the user wrote top-level `return` statements, wraps the body in a callable function.
 */
export function preparePythonCode(code: string): string {
  const clean = code.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  if (!clean) return ""

  const hasReturn = /\breturn\b/.test(clean)
  if (!hasReturn) {
    return clean
  }

  const indentedBody = clean
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")

  return `def __workflow_main__():\n${indentedBody}\n__workflow_main__()`
}

/**
 * Formats execution errors into clear, user-friendly messages without internal SDK option hints.
 */
export function formatPythonExecutionError(
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
      "Python Execution Timed Out: The script took too long to complete. Please check your code for infinite loops or unresolved operations."
    )
  }

  const details = `${name}: ${value}${traceback ? `\n${traceback}` : ""}`
  return new Error(`Python Execution Error: ${details}`)
}

export async function executePythonCode({
  code,
  apiKey,
  timeoutMs = 60_000,
}: ExecutePythonCodeParams): Promise<CodeExecutionOutput> {
  if (!code || !code.trim()) {
    throw new Error("Python Code node: Code is required")
  }

  const cleanCode = preparePythonCode(code)
  const effectiveApiKey = apiKey || process.env.E2B_API_KEY

  if (!effectiveApiKey) {
    throw new Error(
      "Python Code node: E2B_API_KEY is not configured. Please set E2B_API_KEY in your environment variables."
    )
  }

  let sandbox: Sandbox | undefined
  try {
    sandbox = await Sandbox.create({
      apiKey: effectiveApiKey,
      timeoutMs,
    })

    let execution: Awaited<ReturnType<typeof sandbox.runCode>>
    try {
      execution = await sandbox.runCode(cleanCode, {
        language: "python",
      })
    } catch (runErr) {
      throw formatPythonExecutionError(runErr)
    }

    const stdout = execution.logs.stdout.join("\n")
    const stderr = execution.logs.stderr.join("\n")

    if (execution.error) {
      throw formatPythonExecutionError(execution.error)
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

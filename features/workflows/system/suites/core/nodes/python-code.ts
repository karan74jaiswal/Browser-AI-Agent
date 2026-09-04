import { PythonCodeIcon } from "../icons"
import type { ActionNodeModule } from "../../../types/module"

const defaultPythonCode = `# Access Organization Vault secrets via os.environ["MY_SECRET"]
import os

greeting = "Hello world!"
print(greeting)
greeting`

export const pythonCodeNodeModule: ActionNodeModule<"python-code"> = {
  manifest: {
    id: "python-code",
    suiteId: "core",
    kind: "action",
    label: "Python",
    description: "Executes custom Python code in a secure cloud E2B sandbox",
    accent: "bg-sky-600 text-white",
    fields: [
      {
        key: "code",
        label: "Python Code",
        language: "python",
        placeholder: defaultPythonCode,
        defaultValue: defaultPythonCode,
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "result", label: "Result" },
      { path: "stdout", label: "Standard Output (stdout)" },
      { path: "stderr", label: "Standard Error (stderr)" },
    ],
  },
  icon: PythonCodeIcon,
  iconSvgPath: `<rect width="20" height="18" x="2" y="3" rx="2.5" stroke-width="1.8"/><line x1="2" y1="8.5" x2="22" y2="8.5" stroke-width="1.2"/><circle cx="5.5" cy="5.75" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="5.75" r="0.8" fill="currentColor" stroke="none"/><path d="M12 11.2h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1H11a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1Z" stroke-width="1.5"/><circle cx="9.5" cy="12.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="14.5" cy="14.5" r="0.6" fill="currentColor" stroke="none"/>`,
  handleTopology: { type: "standard" },
  formatSecretToken: (secretName: string) => `os.environ["${secretName}"]`,
  getInitialValues: () => ({
    code: defaultPythonCode,
  }),
}


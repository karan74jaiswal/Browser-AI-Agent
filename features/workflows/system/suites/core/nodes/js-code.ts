import { JsCodeIcon } from "../icons"
import type { ActionNodeModule } from "../../../types/module"

const defaultJsCode = `// Access Organization Vault secrets via process.env.MY_SECRET
const greeting = "Hello world!";
console.log(greeting);
return greeting;`

export const jsCodeNodeModule: ActionNodeModule<"js-code"> = {
  manifest: {
    id: "js-code",
    suiteId: "core",
    kind: "action",
    label: "JavaScript",
    description: "Executes custom JavaScript/TypeScript in a secure cloud E2B sandbox",
    accent: "bg-amber-600 text-white",
    fields: [
      {
        key: "code",
        label: "JavaScript / TypeScript Code",
        language: "javascript",
        placeholder: defaultJsCode,
        defaultValue: defaultJsCode,
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
  icon: JsCodeIcon,
  iconSvgPath: `<rect width="20" height="18" x="2" y="3" rx="2.5" stroke-width="1.8"/><line x1="2" y1="8.5" x2="22" y2="8.5" stroke-width="1.2"/><circle cx="5.5" cy="5.75" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="5.75" r="0.8" fill="currentColor" stroke="none"/><path d="M7.5 16.2c.3.5.7.8 1.4.8.8 0 1.3-.4 1.3-1.1v-3.7h-1.2" stroke-width="1.8"/><path d="M13.2 16c.4.6 1 .9 1.7.9.9 0 1.5-.5 1.5-1.1 0-.6-.5-.9-1.4-1.2l-.5-.2c-1.1-.3-1.7-.7-1.7-1.6 0-1 .8-1.7 1.9-1.7.9 0 1.5.3 1.9.9" stroke-width="1.8"/>`,
  handleTopology: { type: "standard" },
  formatSecretToken: (secretName: string) => `process.env.${secretName}`,
  getInitialValues: () => ({
    code: defaultJsCode,
  }),
}


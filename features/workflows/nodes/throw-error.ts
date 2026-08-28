export async function throwErrorNode({ message }: { message?: string }) {
  const cleanMessage =
    message?.trim().replace(/[\u200B\uFEFF\u00A0]/g, "") ||
    "Intentional test error triggered by Throw Error node"

  throw new Error(cleanMessage)
}

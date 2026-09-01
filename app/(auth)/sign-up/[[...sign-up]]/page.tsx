import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a Nodus account to build and run autonomous AI workflows.",
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}

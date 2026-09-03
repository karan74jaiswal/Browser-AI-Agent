import type { Metadata } from "next"
import { CustomSignUp } from "@/features/auth/components/custom-sign-up"

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a Nodus account to build and run autonomous AI workflows.",
}

export default function SignUpPage() {
  return <CustomSignUp />
}

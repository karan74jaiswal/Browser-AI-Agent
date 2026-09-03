import type { Metadata } from "next"
import { CustomSignIn } from "@/features/auth/components/custom-sign-in"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Nodus account to access your workflows.",
}

export default function SignInPage() {
  return <CustomSignIn />
}

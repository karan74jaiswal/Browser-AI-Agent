import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"

export default function SSOCallbackPage() {
  return (
    <Card className="w-full max-w-[400px] border-border bg-card/95 shadow-2xl backdrop-blur-xl">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Spinner className="size-8 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Completing authentication...</p>
          <p className="text-xs text-muted-foreground">Setting up your secure session</p>
        </div>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/workflows"
          signUpFallbackRedirectUrl="/workflows"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          continueSignUpUrl="/sign-up"
        />
      </CardContent>
    </Card>
  )
}

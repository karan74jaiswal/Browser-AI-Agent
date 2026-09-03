"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CustomOAuthButtons } from "./custom-oauth-buttons"
import { CustomOtpInput } from "./custom-otp-input"
import { ensureDefaultOrganizationAction } from "../actions"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, User, X } from "lucide-react"

import {
  sanitizeRedirectUrl,
  resolvePostAuthDestination,
  evaluatePasswordStrength,
} from "@/features/auth/utils"

interface CustomSignUpProps {
  redirectUrl?: string
}

export function CustomSignUp({ redirectUrl: propRedirectUrl }: CustomSignUpProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = sanitizeRedirectUrl(propRedirectUrl || searchParams?.get("redirect_url"))

  const { signUp, errors, fetchStatus } = useSignUp()

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [otpCode, setOtpCode] = React.useState("")
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isFetching = fetchStatus === "fetching" || isSubmitting

  const rawErrorMessage =
    errors?.raw &&
    errors.raw.length > 0 &&
    typeof errors.raw[0] === "object" &&
    errors.raw[0] !== null &&
    "message" in errors.raw[0]
      ? String((errors.raw[0] as { message: unknown }).message)
      : undefined

  // Combined error message from Clerk or local validation
  const activeError =
    localError ||
    errors?.fields?.emailAddress?.message ||
    errors?.fields?.password?.message ||
    errors?.fields?.firstName?.message ||
    errors?.fields?.code?.message ||
    errors?.global?.[0]?.message ||
    rawErrorMessage

  // Real-time password strength validation using shared evaluation engine
  const { checks: passwordChecks, score: strengthScore, label: strengthLabel, color: strengthColor } =
    React.useMemo(() => evaluatePasswordStrength(password), [password])

  // Check if sign-up is in verification state
  const isVerifying =
    signUp?.status === "missing_requirements" &&
    signUp?.unverifiedFields?.includes("email_address")

  // 1. Submit Registration Form
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp || !email.trim() || !password || !firstName.trim()) return

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.")
      return
    }

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      })

      if (error) {
        setLocalError(error.message || "Failed to create account.")
        setIsSubmitting(false)
        return
      }

      // Send verification code
      const sendRes = await signUp.verifications.sendEmailCode()
      if (sendRes?.error) {
        setLocalError(sendRes.error.message || "Failed to send verification code.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign up."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Verify Email Code & Auto-provision default organization
  const handleVerifyEmail = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode
    if (!signUp || code.length < 6) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const verifyRes = await signUp.verifications.verifyEmailCode({ code })
      if (verifyRes?.error) {
        setLocalError(verifyRes.error.message || "Invalid verification code.")
        setIsSubmitting(false)
        return
      }

      if (signUp.status === "complete") {
        const { error } = await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            // Automatically provision a default workspace so user lands directly on active canvas
            try {
              await ensureDefaultOrganizationAction()
            } catch (orgErr) {
              console.warn("Could not auto-provision workspace:", orgErr)
            }

            const destination = resolvePostAuthDestination({
              currentTaskKey: session?.currentTask?.key,
              redirectUrl,
              mode: "sign-up",
            })

            const url = decorateUrl(destination)
            if (url.startsWith("http")) {
              window.location.href = url
            } else {
              router.push(url)
            }
          },
        })

        if (error) {
          setLocalError(error.message || "Failed to finalize account setup.")
          setIsSubmitting(false)
          return
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed."
      setLocalError(msg)
      setIsSubmitting(false)
    }
  }

  // Resend code handler
  const handleResendCode = async () => {
    if (!signUp) return
    setIsSubmitting(true)
    setLocalError(null)
    try {
      const res = await signUp.verifications.sendEmailCode()
      if (res?.error) {
        setLocalError(res.error.message || "Failed to resend code.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 text-card-foreground shadow-2xl backdrop-blur-md">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          {isVerifying ? "Verify your email" : "Create your account"}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {isVerifying
            ? `We sent a 6-digit verification code to ${email}`
            : "Start building autonomous AI browser agents and workflows."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Inline Alert Badge for structured Clerk Errors */}
        {activeError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-50 duration-200">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{activeError}</span>
          </div>
        )}

        {/* Verification Screen */}
        {isVerifying ? (
          <div className="space-y-5">
            <div className="flex justify-center text-primary pb-1">
              <Mail className="size-8 animate-pulse" />
            </div>

            <CustomOtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val)
                if (localError) setLocalError(null)
              }}
              onComplete={(val) => handleVerifyEmail(val)}
              disabled={isFetching}
              autoFocus
            />

            <Button
              type="button"
              onClick={() => handleVerifyEmail()}
              disabled={isFetching || otpCode.length < 6}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Verify & Launch Workspace"}
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  signUp.reset()
                  setLocalError(null)
                  setOtpCode("")
                }}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-normal"
              >
                Change email
              </Button>
              <Button
                variant="link"
                type="button"
                onClick={handleResendCode}
                disabled={isFetching}
                className="h-auto p-0 text-xs text-primary font-medium"
              >
                Resend code
              </Button>
            </div>
          </div>
        ) : (
          /* Main Registration Form */
          <>
            <CustomOAuthButtons
              mode="sign-up"
              redirectUrl={redirectUrl}
              onError={(msg) => setLocalError(msg)}
            />

            <div className="relative my-4 flex items-center justify-center">
              <Separator />
              <span className="absolute bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Or sign up with email
              </span>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium text-foreground">
                    First name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Jane"
                      className="h-10 pl-9 pr-3"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium text-foreground">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="h-10 px-3"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Work email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (localError) setLocalError(null)
                    }}
                    required
                    placeholder="jane@company.com"
                    className="h-10 pl-9 pr-3"
                  />
                </div>
              </div>

              {/* Password & Strength Meter */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (localError) setLocalError(null)
                    }}
                    required
                    placeholder="At least 8 characters"
                    className="h-10 pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Real-time Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-2 pt-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Password strength</span>
                      <span
                        className={
                          strengthScore <= 1
                            ? "text-destructive"
                            : strengthScore === 2
                              ? "text-amber-500 dark:text-amber-400"
                              : strengthScore === 3
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-emerald-600 dark:text-emerald-400 font-medium"
                        }
                      >
                        {strengthLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            strengthScore >= level ? strengthColor : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Checklist rules */}
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                      <div
                        className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      >
                        {passwordChecks.length ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        <span>8+ characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      >
                        {passwordChecks.uppercase ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        <span>Uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${passwordChecks.number ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      >
                        {passwordChecks.number ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        <span>One number</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${passwordChecks.special ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      >
                        {passwordChecks.special ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bot protection captcha container required by Clerk */}
              <div id="clerk-captcha" />

              <Button
                type="submit"
                disabled={isFetching || !email.trim() || !password || !firstName.trim()}
                className="w-full h-10 gap-2 font-medium"
              >
                {isFetching ? <Spinner className="size-4" /> : "Create Account & Workspace"}
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/50 py-4">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/sign-in${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSignIn } from "@clerk/nextjs"
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
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, X } from "lucide-react"

import {
  sanitizeRedirectUrl,
  resolvePostAuthDestination,
  evaluatePasswordStrength,
} from "@/features/auth/utils"

interface CustomSignInProps {
  redirectUrl?: string
}

type SignInMode =
  | "password"
  | "email-code-request"
  | "email-otp"
  | "mfa"
  | "reset-email"
  | "reset-code"
  | "reset-password"

type MfaStrategy = "totp" | "phone_code" | "email_code" | "backup_code"

export function CustomSignIn({ redirectUrl: propRedirectUrl }: CustomSignInProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = sanitizeRedirectUrl(propRedirectUrl || searchParams?.get("redirect_url"))

  const { signIn, errors, fetchStatus } = useSignIn()

  const [mode, setMode] = React.useState<SignInMode>(
    searchParams?.get("step") === "reset-password" ? "reset-email" : "password"
  )
  const [mfaStrategy, setMfaStrategy] = React.useState<MfaStrategy>("totp")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [otpCode, setOtpCode] = React.useState("")
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isFetching = fetchStatus === "fetching" || isSubmitting

  // Real-time password strength validation for reset step
  const {
    checks: passwordChecks,
    score: strengthScore,
    label: strengthLabel,
    color: strengthColor,
  } = React.useMemo(() => evaluatePasswordStrength(newPassword), [newPassword])

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
    errors?.fields?.identifier?.message ||
    errors?.fields?.password?.message ||
    errors?.fields?.code?.message ||
    errors?.global?.[0]?.message ||
    rawErrorMessage

  // Finalize navigation helper
  const finalizeSignIn = async () => {
    if (!signIn) return
    try {
      setIsSubmitting(true)
      const { error } = await signIn.finalize({
        navigate: async ({ session, decorateUrl }) => {
          const destination = resolvePostAuthDestination({
            currentTaskKey: session?.currentTask?.key,
            redirectUrl,
            mode: "sign-in",
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
        setLocalError(error.message || "Failed to finalize session.")
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("Finalize sign-in error:", err)
      const msg = err instanceof Error ? err.message : "Failed to finalize session."
      setLocalError(msg)
      setIsSubmitting(false)
    }
  }

  // 1. Password sign-in handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || !email.trim() || !password) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const { error } = await signIn.password({
        identifier: email.trim(),
        password,
      })

      if (error) {
        setLocalError(error.message || "Invalid credentials.")
        setIsSubmitting(false)
        return
      }

      if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        const factors = signIn.supportedSecondFactors || []
        const hasTotp = factors.some((f) => f.strategy === "totp")
        const hasPhoneCode = factors.some((f) => f.strategy === "phone_code")
        const hasEmailCode = factors.some((f) => f.strategy === "email_code")
        const hasBackupCode = factors.some((f) => f.strategy === "backup_code")

        let chosen: MfaStrategy = "totp"
        if (hasTotp) {
          chosen = "totp"
        } else if (hasPhoneCode) {
          chosen = "phone_code"
          const sendRes = await signIn.mfa?.sendPhoneCode?.()
          if (sendRes?.error) {
            setLocalError(sendRes.error.message || "Failed to send phone code.")
          }
        } else if (hasEmailCode) {
          chosen = "email_code"
          const sendRes = await signIn.mfa?.sendEmailCode?.()
          if (sendRes?.error) {
            setLocalError(sendRes.error.message || "Failed to send email code.")
          }
        } else if (hasBackupCode) {
          chosen = "backup_code"
        }

        setMfaStrategy(chosen)
        setOtpCode("")
        setMode("mfa")
        setIsSubmitting(false)
        return
      }

      if (signIn.status === "complete") {
        await finalizeSignIn()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in."
      setLocalError(msg)
      setIsSubmitting(false)
    }
  }

  // 2. Send Email OTP Code
  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!signIn || !email.trim()) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const { error } = await signIn.emailCode.sendCode({ emailAddress: email.trim() })
      if (error) {
        setLocalError(error.message || "Failed to send verification code.")
        setIsSubmitting(false)
        return
      }

      setOtpCode("")
      setMode("email-otp")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Verify Email OTP Code
  const handleVerifyEmailOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode
    if (!signIn || code.length < 6) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const verifyRes = await signIn.emailCode.verifyCode({ code })
      if (verifyRes?.error) {
        setLocalError(verifyRes.error.message || "Invalid code.")
        setIsSubmitting(false)
        return
      }

      if (signIn.status === "complete") {
        await finalizeSignIn()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed."
      setLocalError(msg)
      setIsSubmitting(false)
    }
  }

  // 4. Resend MFA Code
  const handleResendMfaCode = async () => {
    if (!signIn) return
    setIsSubmitting(true)
    setLocalError(null)
    try {
      if (mfaStrategy === "email_code") {
        const res = await signIn.mfa.sendEmailCode()
        if (res?.error) setLocalError(res.error.message || "Failed to resend code.")
      } else if (mfaStrategy === "phone_code") {
        const res = await signIn.mfa.sendPhoneCode()
        if (res?.error) setLocalError(res.error.message || "Failed to resend code.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Verify MFA Second Factor Code
  const handleVerifyMfa = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim()
    if (!signIn || code.length < 6) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      let res: { error: { message?: string } | null } = { error: null }
      if (mfaStrategy === "totp") {
        res = await signIn.mfa.verifyTOTP({ code })
      } else if (mfaStrategy === "phone_code") {
        res = await signIn.mfa.verifyPhoneCode({ code })
      } else if (mfaStrategy === "email_code") {
        res = await signIn.mfa.verifyEmailCode({ code })
      } else if (mfaStrategy === "backup_code") {
        res = await signIn.mfa.verifyBackupCode({ code })
      }

      if (res?.error) {
        setLocalError(res.error.message || "Invalid authentication code.")
        setIsSubmitting(false)
        return
      }

      if (signIn.status === "complete") {
        await finalizeSignIn()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "MFA verification failed."
      setLocalError(msg)
      setIsSubmitting(false)
    }
  }

  // 6. Reset Password Step 1: Send Reset Code
  const handleResetSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || !email.trim()) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      if (signIn.status !== "needs_first_factor") {
        const createRes = await signIn.create({ identifier: email.trim() })
        if (createRes.error) {
          setLocalError(createRes.error.message || "Failed to start password reset.")
          setIsSubmitting(false)
          return
        }
      }

      const sendRes = await signIn.resetPasswordEmailCode.sendCode()
      if (sendRes?.error) {
        setLocalError(sendRes.error.message || "Failed to send reset code.")
        setIsSubmitting(false)
        return
      }

      setOtpCode("")
      setMode("reset-code")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset code."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 7. Reset Password Resend Code
  const handleResendResetCode = async () => {
    if (!signIn) return
    setIsSubmitting(true)
    setLocalError(null)
    try {
      const sendRes = await signIn.resetPasswordEmailCode.sendCode()
      if (sendRes?.error) {
        setLocalError(sendRes.error.message || "Failed to resend code.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 8. Reset Password Step 2: Verify Code (Wrong code stays here!)
  const handleResetVerifyCode = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim()
    if (!signIn || code.length < 6) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const verifyRes = await signIn.resetPasswordEmailCode.verifyCode({ code })
      if (verifyRes?.error) {
        setLocalError(verifyRes.error.message || "Invalid or expired verification code.")
        setIsSubmitting(false)
        return
      }

      // Code successfully verified: advance to step 3
      setNewPassword("")
      setMode("reset-password")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed."
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 9. Reset Password Step 3: Submit New Password & Finalize
  const handleResetSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || !newPassword) return

    if (newPassword.length < 8) {
      setLocalError("Password must be at least 8 characters long.")
      return
    }

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const submitRes = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword })
      if (submitRes?.error) {
        setLocalError(submitRes.error.message || "Failed to update password.")
        setIsSubmitting(false)
        return
      }

      if (signIn.status === "complete") {
        await finalizeSignIn()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password."
      setLocalError(msg)
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 text-card-foreground shadow-2xl backdrop-blur-md">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          {mode === "mfa"
            ? "Two-Factor Verification"
            : mode === "reset-email"
              ? "Reset your password"
              : mode === "reset-code"
                ? "Verify reset code"
                : mode === "reset-password"
                  ? "Set new password"
                  : mode === "email-code-request"
                    ? "Sign in with email code"
                    : mode === "email-otp"
                      ? "Check your email"
                      : "Welcome back"}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {mode === "mfa"
            ? mfaStrategy === "totp"
              ? "Enter the 6-digit code from your authenticator app."
              : mfaStrategy === "phone_code"
                ? "Enter the 6-digit verification code sent to your phone."
                : mfaStrategy === "backup_code"
                  ? "Enter one of your emergency backup recovery codes."
                  : `We sent a 6-digit verification code to ${email}`
            : mode === "email-code-request"
              ? "Enter your email address to receive a 6-digit verification code."
              : mode === "email-otp"
                ? `We sent a 6-digit code to ${email}`
                : mode === "reset-email"
                  ? "Enter the email associated with your account and we'll send a verification code."
                  : mode === "reset-code"
                    ? `We sent a 6-digit verification code to ${email}`
                    : mode === "reset-password"
                      ? "Create a strong new password for your account."
                      : "Sign in to your Nodus account to orchestrate workflows."}
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

        {/* OAuth Buttons (only displayed in standard password sign-in mode) */}
        {mode === "password" && (
          <>
            <CustomOAuthButtons
              mode="sign-in"
              redirectUrl={redirectUrl}
              onError={(msg) => setLocalError(msg)}
            />

            <div className="relative my-4 flex items-center justify-center">
              <Separator />
              <span className="absolute bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </>
        )}

        {/* Mode 1: Standard Password Sign-in */}
        {mode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                Email address
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
                  placeholder="name@company.com"
                  className="h-10 pl-9 pr-3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  Password
                </Label>
                <Button
                  variant="link"
                  type="button"
                  onClick={() => {
                    setLocalError(null)
                    setMode("reset-email")
                  }}
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-normal"
                >
                  Forgot password?
                </Button>
              </div>
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
                  placeholder="••••••••"
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
            </div>

            <Button
              type="submit"
              disabled={isFetching || !email.trim() || !password}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Sign in"}
            </Button>

            <div className="pt-1 text-center">
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  setLocalError(null)
                  if (email.trim()) {
                    handleSendEmailOtp()
                  } else {
                    setMode("email-code-request")
                  }
                }}
                disabled={isFetching}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-normal"
              >
                Sign in with email verification code instead
              </Button>
            </div>
          </form>
        )}

        {/* Mode 2: Email Code Request (Prompt for email when not yet entered) */}
        {mode === "email-code-request" && (
          <form onSubmit={handleSendEmailOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp-email" className="text-xs font-medium text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (localError) setLocalError(null)
                  }}
                  required
                  placeholder="name@company.com"
                  className="h-10 pl-9 pr-3"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isFetching || !email.trim()}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Send verification code"}
            </Button>
          </form>
        )}

        {/* Mode 3: Email Code (OTP) Form */}
        {mode === "email-otp" && (
          <div className="space-y-5">
            <CustomOtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val)
                if (localError) setLocalError(null)
              }}
              onComplete={(val) => handleVerifyEmailOtp(val)}
              disabled={isFetching}
              autoFocus
            />

            <Button
              type="button"
              onClick={() => handleVerifyEmailOtp()}
              disabled={isFetching || otpCode.length < 6}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Verify & Sign In"}
            </Button>

            <div className="text-center text-xs">
              <span className="text-muted-foreground">Didn&apos;t receive a code? </span>
              <Button
                variant="link"
                type="button"
                onClick={() => handleSendEmailOtp()}
                disabled={isFetching}
                className="h-auto p-0 text-xs text-primary font-medium"
              >
                Resend code
              </Button>
            </div>
          </div>
        )}

        {/* Mode 4: MFA Code Verification */}
        {mode === "mfa" && (
          <div className="space-y-5">
            <div className="flex justify-center text-primary pb-1">
              <ShieldCheck className="size-8" />
            </div>

            <CustomOtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val)
                if (localError) setLocalError(null)
              }}
              onComplete={(val) => handleVerifyMfa(val)}
              disabled={isFetching}
              autoFocus
            />

            <Button
              type="button"
              onClick={() => handleVerifyMfa()}
              disabled={isFetching || otpCode.length < 6}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Verify Identity"}
            </Button>

            {(mfaStrategy === "email_code" || mfaStrategy === "phone_code") && (
              <div className="text-center text-xs">
                <span className="text-muted-foreground">Didn&apos;t receive a code? </span>
                <Button
                  variant="link"
                  type="button"
                  onClick={handleResendMfaCode}
                  disabled={isFetching}
                  className="h-auto p-0 text-xs text-primary font-medium"
                >
                  Resend code
                </Button>
              </div>
            )}

            {signIn?.supportedSecondFactors?.some((f) => f.strategy === "backup_code") &&
              mfaStrategy !== "backup_code" && (
                <div className="text-center pt-1">
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => {
                      setMfaStrategy("backup_code")
                      setOtpCode("")
                      setLocalError(null)
                    }}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-normal"
                  >
                    Use backup code instead
                  </Button>
                </div>
              )}

            {mfaStrategy === "backup_code" &&
              signIn?.supportedSecondFactors?.some((f) => f.strategy === "totp") && (
                <div className="text-center pt-1">
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => {
                      setMfaStrategy("totp")
                      setOtpCode("")
                      setLocalError(null)
                    }}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-normal"
                  >
                    Use authenticator app instead
                  </Button>
                </div>
              )}
          </div>
        )}

        {/* Mode 5: Reset Password Step 1 (Request Code via Email) */}
        {mode === "reset-email" && (
          <form onSubmit={handleResetSendEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs font-medium text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (localError) setLocalError(null)
                  }}
                  required
                  placeholder="name@company.com"
                  className="h-10 pl-9 pr-3"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isFetching || !email.trim()}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Send reset code"}
            </Button>
          </form>
        )}

        {/* Mode 6: Reset Password Step 2 (Verify OTP Code) */}
        {mode === "reset-code" && (
          <div className="space-y-5">
            <CustomOtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val)
                if (localError) setLocalError(null)
              }}
              onComplete={(val) => handleResetVerifyCode(val)}
              disabled={isFetching}
              autoFocus
            />

            <Button
              type="button"
              onClick={() => handleResetVerifyCode()}
              disabled={isFetching || otpCode.length < 6}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Verify code"}
            </Button>

            <div className="text-center text-xs">
              <span className="text-muted-foreground">Didn&apos;t receive a code? </span>
              <Button
                variant="link"
                type="button"
                onClick={handleResendResetCode}
                disabled={isFetching}
                className="h-auto p-0 text-xs text-primary font-medium"
              >
                Resend code
              </Button>
            </div>
          </div>
        )}

        {/* Mode 7: Reset Password Step 3 (Set New Password & Sign In) */}
        {mode === "reset-password" && (
          <form onSubmit={handleResetSubmitPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-medium text-foreground">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (localError) setLocalError(null)
                  }}
                  required
                  placeholder="••••••••"
                  className="h-10 pl-9 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {newPassword && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className="font-medium text-foreground">{strengthLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`rounded-full transition-colors ${
                          index < strengthScore ? strengthColor : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.length ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.uppercase ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.number ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>Number</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.special ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isFetching || newPassword.length < 8}
              className="w-full h-10 gap-2 font-medium"
            >
              {isFetching ? <Spinner className="size-4" /> : "Reset password & sign in"}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/50 py-4">
        {mode !== "password" ? (
          <Button
            variant="link"
            type="button"
            onClick={() => {
              setLocalError(null)
              setOtpCode("")
              setMode("password")
            }}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-normal"
          >
            ← Back to sign in
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/sign-up${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

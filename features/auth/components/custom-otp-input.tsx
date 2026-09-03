"use client"

import * as React from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { cn } from "@/lib/utils"

interface CustomOtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function CustomOtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  className,
}: CustomOtpInputProps) {
  return (
    <div className={cn("flex w-full flex-col items-center justify-center gap-2", className)}>
      <InputOTP
        maxLength={6}
        value={value}
        onChange={(val) => {
          onChange(val)
          if (val.length === 6) {
            onComplete?.(val)
          }
        }}
        disabled={disabled}
        autoFocus={autoFocus}
        pattern={REGEXP_ONLY_DIGITS}
        containerClassName="gap-2"
      >
        <InputOTPGroup className="gap-1.5">
          <InputOTPSlot
            index={0}
            className="size-11 rounded-lg border border-input bg-background text-base font-semibold text-foreground transition-all data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/20 shadow-2xs"
          />
          <InputOTPSlot
            index={1}
            className="size-11 rounded-lg border border-input bg-background text-base font-semibold text-foreground transition-all data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/20 shadow-2xs"
          />
          <InputOTPSlot
            index={2}
            className="size-11 rounded-lg border border-input bg-background text-base font-semibold text-foreground transition-all data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/20 shadow-2xs"
          />
        </InputOTPGroup>

        <InputOTPSeparator className="text-muted-foreground" />

        <InputOTPGroup className="gap-1.5">
          <InputOTPSlot
            index={3}
            className="size-11 rounded-lg border border-input bg-background text-base font-semibold text-foreground transition-all data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/20 shadow-2xs"
          />
          <InputOTPSlot
            index={4}
            className="size-11 rounded-lg border border-input bg-background text-base font-semibold text-foreground transition-all data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/20 shadow-2xs"
          />
          <InputOTPSlot
            index={5}
            className="size-11 rounded-lg border border-input bg-background text-base font-semibold text-foreground transition-all data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/20 shadow-2xs"
          />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { listCredentialsAction } from "../actions"
import type { SafeCredential } from "../data"
import { CredentialVaultDialog } from "./credential-vault-dialog"

export interface OpenVaultOptions {
  prefillName?: string
}

interface CredentialsContextValue {
  credentials: SafeCredential[]
  availableSecretKeys: string[]
  isLoading: boolean
  refreshCredentials: () => Promise<void>
  addCredentialToState: (cred: SafeCredential) => void
  removeCredentialFromState: (id: string) => void
  openVault: (options?: OpenVaultOptions) => void
  closeVault: () => void
}

const CredentialsContext = React.createContext<CredentialsContextValue | null>(
  null
)

export function CredentialsProvider({
  children,
  initialCredentials = [],
}: {
  children: React.ReactNode
  initialCredentials?: SafeCredential[]
}) {
  const { orgId } = useAuth()
  const [credentials, setCredentials] =
    React.useState<SafeCredential[]>(initialCredentials)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isVaultOpen, setIsVaultOpen] = React.useState(false)
  const [vaultOptions, setVaultOptions] = React.useState<
    OpenVaultOptions | undefined
  >(undefined)

  const refreshCredentials = React.useCallback(async () => {
    if (!orgId) {
      setCredentials([])
      return
    }
    setIsLoading(true)
    try {
      const data = await listCredentialsAction()
      setCredentials(data)
    } catch {
      // Ignore background refresh errors
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  // Load / reload whenever orgId changes or on initial mount
  React.useEffect(() => {
    refreshCredentials()
  }, [orgId, refreshCredentials])

  const addCredentialToState = React.useCallback((cred: SafeCredential) => {
    setCredentials((prev) => [cred, ...prev.filter((c) => c.id !== cred.id)])
  }, [])

  const removeCredentialFromState = React.useCallback((id: string) => {
    setCredentials((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const openVault = React.useCallback((options?: OpenVaultOptions) => {
    setVaultOptions(options)
    setIsVaultOpen(true)
  }, [])

  const closeVault = React.useCallback(() => {
    setIsVaultOpen(false)
    setVaultOptions(undefined)
  }, [])

  const availableSecretKeys = React.useMemo(
    () => credentials.map((c) => c.name),
    [credentials]
  )

  const value = React.useMemo(
    () => ({
      credentials,
      availableSecretKeys,
      isLoading,
      refreshCredentials,
      addCredentialToState,
      removeCredentialFromState,
      openVault,
      closeVault,
    }),
    [
      credentials,
      availableSecretKeys,
      isLoading,
      refreshCredentials,
      addCredentialToState,
      removeCredentialFromState,
      openVault,
      closeVault,
    ]
  )

  return (
    <CredentialsContext.Provider value={value}>
      {children}
      <CredentialVaultDialog
        open={isVaultOpen}
        onOpenChange={(open) => {
          setIsVaultOpen(open)
          if (!open) setVaultOptions(undefined)
        }}
        prefillName={vaultOptions?.prefillName}
      />
    </CredentialsContext.Provider>
  )
}

export function useCredentials() {
  const context = React.useContext(CredentialsContext)
  if (!context) {
    throw new Error("useCredentials must be used within a CredentialsProvider")
  }
  return context
}

export function useOptionalCredentials() {
  return React.useContext(CredentialsContext)
}

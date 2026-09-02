# Specification: Custom Dark-Themed Clerk Authentication & Organization UI

## 1. Feature Overview & Objectives
Replace the default, off-the-shelf Clerk modal components with bespoke, custom-styled React UI components that match the application's sleek dark theme (`bg-zinc-950`, `border-zinc-800`, subtle gradients, glassmorphic cards).

This creates a cohesive, branded SaaS experience where authentication, organization switching, and profile management look natively built into the platform rather than third-party widgets.

---

## 2. Core Components to Implement

### 1. Custom Sign-In Component (`features/auth/components/custom-sign-in.tsx`)
- Built using `@clerk/nextjs` hook `useSignIn()`.
- **OAuth Providers**: One-click Google and GitHub authentication with branded icon buttons.
- **Email / Password Flow**:
  - Email input + Password input with show/hide password toggle.
  - "Forgot password?" reset flow modal.
- **Email Code (OTP) Flow**:
  - 6-digit numeric input with auto-advance for passwordless or 2FA verification.
- **Error States**: Inline alert badge displaying Clerk's structured error message (e.g. invalid credentials, rate limit).

### 2. Custom Sign-Up Component (`features/auth/components/custom-sign-up.tsx`)
- Built using `@clerk/nextjs` hook `useSignUp()`.
- **OAuth Registration**: One-click Google and GitHub onboarding.
- **Email Registration**:
  - Name, Email, and Password with real-time password strength meter.
  - Verification screen: 6-digit OTP code verification.
- **Automated Default Organization**:
  - On first sign-up, if the user doesn't join an existing invite, automatically provision a default workspace (e.g., `"[User's Name]'s Workspace"`) so they land directly on an active canvas.

### 3. Custom Organization Switcher & Creator (`components/custom-org-switcher.tsx`)
- Replaces the default `<OrganizationSwitcher />` in the dashboard sidebar.
- Built using `useOrganizationList()` and `useOrganization()`.
- **Trigger Button in Sidebar**:
  - Displays current active organization avatar, name, and plan badge (`FREE` / `PRO`).
  - Chevron dropdown icon.
- **Dropdown Popover**:
  - List of all user's organizations with checkmark on the currently active org.
  - Clicking an org calls `setActive({ organization: org.id })` with smooth transition.
  - Divider + **"+ Create Organization"** action button.
- **Create Organization Dialog**:
  - Native shadcn `<Dialog>` with Organization Name input, slug preview, and logo upload.
  - Calls `createOrganization({ name })` and immediately switches active context.

### 4. Custom User Profile Dropdown (`components/custom-user-button.tsx`)
- Replaces default `<UserButton />`.
- Built using `useUser()` and `useClerk()`.
- Avatar with online status indicator.
- Dropdown menu:
  - User name, email, role in current organization.
  - "Manage Account" modal (name, avatar, change password).
  - "Organization Settings" (member list, invite team members).
  - "Billing & Subscriptions" (opens Clerk pricing/checkout drawer).
  - "Sign Out" with immediate redirection to `/`.

---

## 3. Architecture & File Structure

```
features/auth/
├── components/
│   ├── custom-sign-in.tsx       # Custom Sign In form
│   ├── custom-sign-up.tsx       # Custom Sign Up form
│   ├── custom-oauth-buttons.tsx # Google & GitHub OAuth buttons
│   ├── custom-otp-input.tsx     # 6-digit verification code input
│   └── reset-password-modal.tsx # Password recovery flow
app/
├── (auth)/
│   ├── layout.tsx               # Centered card layout with ambient gradient glow
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
components/
├── custom-org-switcher.tsx      # Sidebar Organization selector & creation modal
└── custom-user-button.tsx       # Sidebar User avatar & profile dropdown
```

---

## 4. Implementation Rules & Best Practices

1. **Keep Next.js Middleware Clean**: Maintain standard Clerk middleware in `middleware.ts` to protect `/workflows` and `/api` routes.
2. **Handle Loading States**: Always disable buttons and show `<Spinner className="size-4" />` while `signIn.create()` or `signUp.create()` is pending.
3. **Handle Redirect URLs**: Support `?redirect_url=` query parameter so users who clicked "Use Template" on the landing page land on the cloned workflow immediately after sign-in.
4. **Dark Mode Consistency**: All inputs must use `bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500`.

---

## 5. What NOT to Do (Anti-Patterns & Pitfalls)
- ❌ **DO NOT hardcode API credentials**: Always let `@clerk/nextjs` client handle tokens in-memory.
- ❌ **DO NOT lose redirect context on OAuth**: Pass `redirectUrl` and `redirectUrlComplete` options to `signIn.authenticateWithRedirect()`.
- ❌ **DO NOT allow orphan users**: Always ensure every signed-in user is attached to an active organization so database queries with `orgId` never fail.

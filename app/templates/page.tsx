import type { Metadata } from "next"
import { PublicNavbar } from "@/components/public-navbar"
import { TemplateGallery } from "@/features/workflows/templates/components/template-gallery"
import type { TemplateCategory } from "@/features/workflows/templates/types"

export const metadata: Metadata = {
  title: "Workflow Templates Registry",
  description:
    "Explore, preview, and 1-click clone production-ready automation workflows into your workspace.",
}

interface TemplatesPageProps {
  searchParams: Promise<{
    templateId?: string
    clone?: string
    category?: string
  }>
}

export default async function TemplatesPage({
  searchParams,
}: TemplatesPageProps) {
  const params = await searchParams
  const initialTemplateId = params.templateId || params.clone
  const initialCategory = (params.category as TemplateCategory) || "all"

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <PublicNavbar />
      <main className="flex-1 overflow-y-auto">
        <TemplateGallery
          initialTemplateId={initialTemplateId}
          initialCategory={initialCategory}
        />
      </main>
    </div>
  )
}

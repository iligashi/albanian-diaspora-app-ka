import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/primitives"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <h1 className="mt-6 text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}

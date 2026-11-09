import { CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/shared/primitives"

const POINTS = [
  "Pay KESCO, water, internet and rent for your family",
  "Send flowers, cakes and gift baskets from local shops",
  "Book vetted cleaners, electricians and carers",
  "Follow every order until it's done, with receipts",
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink text-ink-foreground lg:flex lg:flex-col lg:justify-end lg:p-12">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-[480px] rounded-full bg-primary/30 blur-3xl"
        />
        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-wider text-ink-foreground/60">For the diaspora</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">Take care of home, even when you&apos;re far from it.</h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-ink-foreground/80">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

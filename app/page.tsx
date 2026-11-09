import Link from "next/link"
import { ArrowRight, BadgeCheck, Gift, Receipt, ShieldCheck, Wrench } from "lucide-react"
import { Logo } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth/session"
import { homeFor } from "@/lib/auth/token"

const SERVICES = [
  {
    icon: Receipt,
    title: "Pay household bills",
    body: "KESCO, regional water companies, IPKO, Telekomi, Kujtesa and rent. Our team pays the provider and uploads the receipt number.",
  },
  {
    icon: Gift,
    title: "Send gifts that arrive",
    body: "Flowers, cakes and gift baskets from local shops that deliver to your family's town, with your message attached.",
  },
  {
    icon: Wrench,
    title: "Book help at home",
    body: "Cleaners, electricians, plumbers and carers who confirm the slot and update you as the job progresses.",
  },
]

const STEPS = [
  ["Add your family", "Save the people you look after, with their town and address."],
  ["Choose what they need", "Pay a bill, order a gift or book a service in a couple of minutes."],
  ["Follow it to the end", "Every order has a live status, a timeline and a receipt."],
]

export default async function LandingPage() {
  const session = await getSession()
  const appHref = session ? homeFor(session.role) : null

  return (
    <div className="min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          {appHref ? (
            <Button asChild>
              <Link href={appHref}>Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <section className="container grid gap-12 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <BadgeCheck className="size-3.5" /> Local vendors, vetted by our team
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] sm:text-5xl">
            Look after family in Kosovo, <span className="text-primary">from wherever you live.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            DiasporaConnect pays the bills, delivers the gifts and books the help at home, so the people you love are taken care of without a phone
            call chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Create a free account <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register?as=vendor">Sell on DiasporaConnect</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent to-transparent" />
          <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-black/5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">This month for Shqipe · Prishtinë</p>
            <ul className="mt-4 divide-y text-sm">
              {[
                ["KESCO electricity", "€48.70", "Settled"],
                ["Seasonal bouquet", "€35.00", "Out for delivery"],
                ["Home clean, 3 hours", "€45.00", "Confirmed"],
              ].map(([what, amount, status]) => (
                <li key={what} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{what}</p>
                    <p className="text-xs text-muted-foreground">{status}</p>
                  </div>
                  <span className="tabular font-semibold">{amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y bg-card py-20">
        <div className="container">
          <h2 className="text-2xl font-semibold sm:text-3xl">Everything home needs, in one place</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="rounded-xl border bg-background p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <span className="tabular text-sm font-semibold text-primary">0{i + 1}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-ink p-8 text-ink-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Pay only when it&apos;s done right</p>
              <p className="text-sm text-ink-foreground/70">If a shop or provider can&apos;t fulfil your order, you&apos;re refunded in full automatically.</p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} DiasporaConnect</span>
          <span>Made for the Albanian diaspora</span>
        </div>
      </footer>
    </div>
  )
}

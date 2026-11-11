import type { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Create account" }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string; ref?: string }> }) {
  const { as, ref } = await searchParams
  return (
    <>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Free to join. You only pay when you send something.</p>
      {ref && as !== "vendor" ? (
        <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          You were invited by a friend. You both get €5 wallet credit after your first payment.
        </p>
      ) : null}
      <RegisterForm initialType={as === "vendor" ? "vendor" : "customer"} referral={ref?.slice(0, 20)} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}

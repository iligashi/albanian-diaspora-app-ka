import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const showDemo = process.env.MONGODB_URI === "memory"
  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your family&apos;s bills, gifts and bookings.</p>
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
      {showDemo && (
        <div className="mt-8 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo accounts (local in-memory database)</p>
          <p className="mt-1">
            arben@demo.test · flora@demo.test · pastrim@demo.test · admin@demo.test
            <br />
            Password: <code>demo-pass-2026</code>
          </p>
        </div>
      )}
    </>
  )
}

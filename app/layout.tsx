import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const sans = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" })

export const metadata: Metadata = {
  title: { default: "DiasporaConnect", template: "%s · DiasporaConnect" },
  description: "Pay bills, send gifts and book trusted home services for your family in Kosovo, from anywhere.",
}

export const viewport: Viewport = {
  themeColor: "#c4161c",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}

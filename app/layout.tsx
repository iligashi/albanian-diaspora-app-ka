import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "react-hot-toast"
import PWAInstallPrompt from "./components/PWAInstallPrompt"
import ChatSystem from "./components/ChatSystem"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DiasporaConnect - Albanian Diaspora Platform",
  description: "Connect with your family in Kosovo - send payments, gifts, and book services",
  manifest: "/manifest.json",
  themeColor: "#dc2626",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DiasporaConnect",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" }],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DiasporaConnect" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--background)",
                color: "var(--foreground)",
              },
            }}
          />
          <PWAInstallPrompt />
          <ChatSystem />
        </AuthProvider>
      </body>
    </html>
  )
}

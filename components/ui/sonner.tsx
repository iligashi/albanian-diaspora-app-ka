"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      toastOptions={{
        classNames: {
          toast: "font-sans border-border shadow-lg",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "sq", name: "Shqip", flag: "🇦🇱" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
]

export default function LanguageToggle() {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode)
    // Here you would typically integrate with your i18n solution
    // For now, we'll just store it in localStorage
    localStorage.setItem("preferred-language", languageCode)
  }

  const getCurrentLanguage = () => {
    return languages.find((lang) => lang.code === currentLanguage) || languages[0]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" aria-label="Toggle language">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center space-x-2 ${
              currentLanguage === language.code ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="text-sm">{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState } from "react"
import { Heart, CreditCard, Gift, Wrench, Shield, Globe, Users } from "lucide-react"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(true)

  const features = [
    {
      icon: CreditCard,
      title: "Remote Payments",
      description: "Pay bills for electricity, water, rent and more for your family in Kosovo",
    },
    {
      icon: Gift,
      title: "Send Gifts",
      description: "Send flowers, cakes and local goods to your loved ones with custom messages",
    },
    {
      icon: Wrench,
      title: "Book Services",
      description: "Schedule cleaning, repairs, and other home services remotely",
    },
    {
      icon: Shield,
      title: "Secure & Trusted",
      description: "Bank-level security with encrypted transactions and data protection",
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Manage everything from anywhere in the world, 24/7",
    },
    {
      icon: Users,
      title: "Family Management",
      description: "Add multiple family members and manage all their needs in one place",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Diaspora<span className="text-red-600">Connect</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showLogin ? "bg-red-600 text-white" : "text-gray-700 hover:text-red-600"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !showLogin ? "bg-red-600 text-white" : "text-gray-700 hover:text-red-600"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              Stay Connected to <span className="text-red-600">Kosovo</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Manage your family's everyday needs in Kosovo from anywhere in the world. Pay bills, send gifts, and book
              services with just a few clicks.
            </p>

            {/* Features grid */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-600 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{feature.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right side - Auth forms */}
          <div className="bg-white rounded-lg shadow-xl p-8">{showLogin ? <LoginForm /> : <RegisterForm />}</div>
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-red-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">10,000+</div>
              <div className="text-red-100">Families Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">€2M+</div>
              <div className="text-red-100">Bills Paid</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-red-100">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

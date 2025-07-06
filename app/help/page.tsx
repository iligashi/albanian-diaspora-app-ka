"use client"

import { useState } from "react"
import Navbar from "../components/Navbar"
import { MessageCircle, CreditCard, Users, Send, Plus, QrCode, Search, ChevronDown, ChevronRight } from "lucide-react"

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>("chat")

  const sections = [
    {
      id: "chat",
      title: "How to Chat with Someone",
      icon: MessageCircle,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💬 Chat System Overview</h4>
            <p className="text-blue-800 text-sm">
              The chat system allows you to communicate with other users in real-time, share files, and stay connected
              with your community.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Step-by-Step Instructions:</h4>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </span>
                  <h5 className="font-medium">Open the Chat System</h5>
                </div>
                <p className="text-gray-600 ml-9">
                  Look for the red chat button <MessageCircle className="inline h-4 w-4 mx-1" /> in the bottom-right
                  corner of any page. Click it to open the chat window.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </span>
                  <h5 className="font-medium">View Your Conversations</h5>
                </div>
                <p className="text-gray-600 ml-9">The left side shows all your existing conversations. You'll see:</p>
                <ul className="text-gray-600 ml-9 mt-2 space-y-1">
                  <li>• Contact names</li>
                  <li>• Last message preview</li>
                  <li>• Unread message count (red badge)</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </span>
                  <h5 className="font-medium">Start or Continue a Conversation</h5>
                </div>
                <p className="text-gray-600 ml-9">
                  Click on any conversation to open it. The right side will show the message history and input field.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    4
                  </span>
                  <h5 className="font-medium">Send Messages</h5>
                </div>
                <div className="text-gray-600 ml-9 space-y-2">
                  <p>Type your message in the input field at the bottom and:</p>
                  <ul className="space-y-1">
                    <li>
                      • Press <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">Enter</kbd> to send
                    </li>
                    <li>
                      • Click the <Send className="inline h-4 w-4 mx-1" /> send button
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    5
                  </span>
                  <h5 className="font-medium">Share Files (Optional)</h5>
                </div>
                <div className="text-gray-600 ml-9 space-y-2">
                  <p>To share files:</p>
                  <ul className="space-y-1">
                    <li>
                      • Click the paperclip icon <span className="inline-block w-4 h-4 bg-gray-300 rounded"></span> next
                      to the message input
                    </li>
                    <li>• Select your file (images, documents, audio files)</li>
                    <li>• The file will be uploaded and shared in the conversation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">💡 Chat Tips:</h5>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Messages are delivered in real-time</li>
                <li>• You can see when messages were sent (timestamp)</li>
                <li>• Your messages appear on the right (red background)</li>
                <li>• Other users' messages appear on the left (gray background)</li>
                <li>• File attachments can be clicked to download</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "payment",
      title: "How to Make a Payment",
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">💳 Payment System Overview</h4>
            <p className="text-green-800 text-sm">
              Send money to pay bills for your family and friends in Kosovo. Support electricity, water, rent, internet,
              and other essential services.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Step-by-Step Instructions:</h4>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </span>
                  <h5 className="font-medium">Navigate to Payment Center</h5>
                </div>
                <p className="text-gray-600 ml-9">
                  Click on "Payments" in the main navigation menu or go to the Payment Center from your dashboard.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </span>
                  <h5 className="font-medium">Start a New Payment</h5>
                </div>
                <p className="text-gray-600 ml-9">
                  Click the{" "}
                  <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    New Payment
                  </span>{" "}
                  button in the top-right corner.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </span>
                  <h5 className="font-medium">Fill in Recipient Information</h5>
                </div>
                <div className="text-gray-600 ml-9 space-y-2">
                  <p>Enter the recipient details:</p>
                  <ul className="space-y-1">
                    <li>
                      • <strong>Recipient Name:</strong> Full name of the person receiving the payment
                    </li>
                    <li>
                      • <strong>Phone Number:</strong> Contact number (optional)
                    </li>
                    <li>
                      • <strong>Address:</strong> Complete address in Kosovo
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    4
                  </span>
                  <h5 className="font-medium">Select Bill Type and Amount</h5>
                </div>
                <div className="text-gray-600 ml-9 space-y-2">
                  <p>Choose what you're paying for:</p>
                  <ul className="space-y-1">
                    <li>
                      • <strong>Bill Type:</strong> Electricity, Water, Rent, Internet, Phone, Gas, or Other
                    </li>
                    <li>
                      • <strong>Amount:</strong> Enter the amount in EUR (minimum €0.01)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    5
                  </span>
                  <h5 className="font-medium">Choose Payment Method</h5>
                </div>
                <div className="text-gray-600 ml-9 space-y-2">
                  <p>Select how you want to pay:</p>
                  <ul className="space-y-1">
                    <li>
                      • <strong>Credit/Debit Card:</strong> Instant payment with your card
                    </li>
                    <li>
                      • <strong>Bank Transfer:</strong> Direct bank-to-bank transfer
                    </li>
                    <li>
                      • <strong>PayPal:</strong> Use your PayPal account
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    6
                  </span>
                  <h5 className="font-medium">Add Description (Optional)</h5>
                </div>
                <p className="text-gray-600 ml-9">
                  Add any additional notes or description for the payment (e.g., "Monthly electricity bill for March").
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    7
                  </span>
                  <h5 className="font-medium">Submit Payment</h5>
                </div>
                <p className="text-gray-600 ml-9">
                  Click{" "}
                  <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded text-xs">
                    Create Payment
                  </span>{" "}
                  to process your payment.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    8
                  </span>
                  <h5 className="font-medium">Track Payment Status</h5>
                </div>
                <div className="text-gray-600 ml-9 space-y-2">
                  <p>Monitor your payment progress:</p>
                  <ul className="space-y-1">
                    <li>
                      •{" "}
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Processing
                      </span>{" "}
                      - Payment is being processed
                    </li>
                    <li>
                      •{" "}
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Completed
                      </span>{" "}
                      - Payment successful
                    </li>
                    <li>
                      •{" "}
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Failed
                      </span>{" "}
                      - Payment failed (try again)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">🎯 Additional Payment Features:</h5>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>
                  • <strong>QR Codes:</strong> Generate QR codes for payments by clicking "QR Code" next to any payment
                </li>
                <li>
                  • <strong>Search & Filter:</strong> Use the search bar to find specific payments
                </li>
                <li>
                  • <strong>Transaction History:</strong> View all your past payments with transaction IDs
                </li>
                <li>
                  • <strong>Export Data:</strong> Download your payment history as CSV or JSON
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes:</h5>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• All payments are processed securely</li>
                <li>• You'll receive a unique transaction ID for each payment</li>
                <li>• Processing typically takes 1-3 business days</li>
                <li>• Keep your transaction ID for reference</li>
                <li>• Contact support if you have any issues</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "features",
      title: "Other Features",
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <QrCode className="h-5 w-5 mr-2 text-red-600" />
                QR Code Generation
              </h4>
              <p className="text-gray-600 text-sm mb-3">
                Generate QR codes for payments, gifts, and services to easily share with others.
              </p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Click "QR Code" next to any item</li>
                <li>• Download or share the generated code</li>
                <li>• Others can scan to view details</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Search className="h-5 w-5 mr-2 text-red-600" />
                Advanced Search
              </h4>
              <p className="text-gray-600 text-sm mb-3">
                Find specific items quickly with powerful search and filtering options.
              </p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Search by name, type, or amount</li>
                <li>• Filter by date range</li>
                <li>• Filter by status or category</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">📊 Analytics Dashboard</h4>
              <p className="text-gray-600 text-sm mb-3">View detailed analytics and insights about your activities.</p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Monthly spending trends</li>
                <li>• Payment category breakdown</li>
                <li>• Interactive charts and graphs</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">🌙 Dark Mode</h4>
              <p className="text-gray-600 text-sm mb-3">
                Switch between light and dark themes for comfortable viewing.
              </p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Toggle in the top navigation</li>
                <li>• Automatic system preference detection</li>
                <li>• Saves your preference</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">📱 Mobile App</h4>
              <p className="text-gray-600 text-sm mb-3">Install the app on your device for quick access.</p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Works offline</li>
                <li>• Push notifications</li>
                <li>• Install from browser menu</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">📤 Data Export</h4>
              <p className="text-gray-600 text-sm mb-3">Export your data for record keeping or analysis.</p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• CSV format for spreadsheets</li>
                <li>• JSON format for developers</li>
                <li>• Bulk export options</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Help & Instructions</h1>
          <p className="text-gray-600 mt-2">Learn how to use all the features of the Albanian Diaspora App</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-8">
              <h3 className="font-medium text-gray-900 mb-4">Quick Navigation</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        activeSection === section.id
                          ? "bg-red-50 text-red-700 border-l-4 border-red-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {section.title}
                      {activeSection === section.id ? (
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {sections.map((section) => (
                <div key={section.id} className={`p-6 ${activeSection === section.id ? "block" : "hidden"}`}>
                  <div className="flex items-center mb-6">
                    <section.icon className="h-8 w-8 text-red-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  {section.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

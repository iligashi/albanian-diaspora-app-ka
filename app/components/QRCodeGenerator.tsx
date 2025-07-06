"use client"

import { useState } from "react"
import { QrCode, Download, X } from "lucide-react"
import toast from "react-hot-toast"

interface QRCodeGeneratorProps {
  type: "payment" | "gift" | "service"
  data: any
  onClose?: () => void
}

export default function QRCodeGenerator({ type, data, onClose }: QRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<string>("")
  const [reference, setReference] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const generateQR = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, data }),
      })

      if (response.ok) {
        const result = await response.json()
        setQrCode(result.qrCode)
        setReference(result.reference)
        toast.success("QR code generated successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to generate QR code")
      }
    } catch (error) {
      console.error("QR generation error:", error)
      toast.error("Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrCode) return

    const link = document.createElement("a")
    link.download = `${type}-qr-${reference}.png`
    link.href = qrCode
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("QR code downloaded!")
  }

  const shareQR = async () => {
    if (!qrCode) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrCode)
      const blob = await response.blob()
      const file = new File([blob], `${type}-qr-${reference}.png`, { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} QR Code`,
          text: `QR code for ${type} - Reference: ${reference}`,
          files: [file],
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`QR Code Reference: ${reference}`)
        toast.success("Reference copied to clipboard!")
      }
    } catch (error) {
      console.error("Share error:", error)
      toast.error("Failed to share QR code")
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generate QR Code</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Data Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {type.charAt(0).toUpperCase() + type.slice(1)} Details
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {type === "payment" && (
                <>
                  <p>
                    <span className="font-medium">Recipient:</span> {data.recipient?.name}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> €{data.amount}
                  </p>
                  <p>
                    <span className="font-medium">Bill Type:</span> {data.billType}
                  </p>
                </>
              )}
              {type === "gift" && (
                <>
                  <p>
                    <span className="font-medium">Recipient:</span> {data.recipient?.name}
                  </p>
                  <p>
                    <span className="font-medium">Item:</span> {data.item?.name}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> €{data.totalAmount}
                  </p>
                </>
              )}
              {type === "service" && (
                <>
                  <p>
                    <span className="font-medium">Service:</span> {data.title}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {new Date(data.scheduledDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> €{data.price}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Generate Button */}
          {!qrCode && (
            <button
              onClick={generateQR}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              {loading ? "Generating..." : "Generate QR Code"}
            </button>
          )}

          {/* QR Code Display */}
          {qrCode && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium">Reference: {reference}</p>
                <p className="text-xs mt-1">Scan this QR code to view details</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadQR}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={shareQR}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

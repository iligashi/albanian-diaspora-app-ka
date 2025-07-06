import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { type, data } = await request.json()

    let qrData = ""

    switch (type) {
      case "payment":
        qrData = JSON.stringify({
          type: "payment",
          recipient: data.recipient,
          amount: data.amount,
          billType: data.billType,
          reference: data.reference || `PAY-${Date.now()}`,
          timestamp: new Date().toISOString(),
        })
        break
      case "gift":
        qrData = JSON.stringify({
          type: "gift",
          recipient: data.recipient,
          item: data.item,
          message: data.message,
          reference: data.reference || `GIFT-${Date.now()}`,
          timestamp: new Date().toISOString(),
        })
        break
      case "service":
        qrData = JSON.stringify({
          type: "service",
          title: data.title,
          address: data.address,
          date: data.date,
          reference: data.reference || `SRV-${Date.now()}`,
          timestamp: new Date().toISOString(),
        })
        break
      default:
        return NextResponse.json({ message: "Invalid QR type" }, { status: 400 })
    }

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      data: qrData,
      reference: JSON.parse(qrData).reference,
    })
  } catch (error) {
    console.error("QR generation error:", error)
    return NextResponse.json({ message: "QR generation failed" }, { status: 500 })
  }
}
